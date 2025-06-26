import { Anthropic } from "@anthropic-ai/sdk"
import axios from "axios"
import crypto from "crypto"
import { execa } from "execa"
import fs from "fs/promises"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"
import os from "os"
import pWaitFor from "p-wait-for"
import * as path from "path"
import * as vscode from "vscode"
import { buildApiHandler } from "../../api"
import { cleanupLegacyCheckpoints } from "../../integrations/checkpoints/CheckpointMigration"
import { downloadTask } from "../../integrations/misc/export-markdown"
import { fetchOpenGraphData, isImageUrl } from "../../integrations/misc/link-preview"
import { openFile, openImage } from "../../integrations/misc/open-file"
import { selectImages } from "../../integrations/misc/process-images"
import { getTheme } from "../../integrations/theme/getTheme"
import WorkspaceTracker from "../../integrations/workspace/WorkspaceTracker"
import { CaretAccountService } from "../../services/account/CaretAccountService"
import { McpHub } from "../../services/mcp/McpHub"
import { telemetryService } from "../../services/telemetry/TelemetryService"
import { ApiProvider, ModelInfo } from "../../shared/api"
import { findLast } from "../../shared/array"
import { ChatContent } from "../../shared/ChatContent"
import { ChatSettings } from "../../shared/ChatSettings"
import { ExtensionMessage, ExtensionState, Invoke, Platform, ModeInfo, RetryStatusMessage } from "../../shared/ExtensionMessage" // Import ModeInfo and
import { HistoryItem } from "../../shared/HistoryItem"
import { McpDownloadResponse, McpMarketplaceCatalog, McpServer } from "../../shared/mcp"
import { TelemetrySetting } from "../../shared/TelemetrySetting"
import { CaretCheckpointRestore, WebviewMessage } from "../../shared/WebviewMessage"
import { fileExistsAtPath } from "../../utils/fs"
import { searchCommits } from "../../utils/git"
import { getWorkspacePath } from "../../utils/path"
import { getTotalTasksSize } from "../../utils/storage"
import { Task } from "../task"
import { openMention } from "../mentions"
import {
	getAllExtensionState,
	getGlobalState,
	getSecret,
	resetExtensionState,
	storeSecret,
	updateApiConfiguration,
	updateGlobalState,
} from "../storage/state"
import { WebviewProvider } from "../webview"
import { BrowserSession } from "../../services/browser/BrowserSession"
import { GlobalFileNames } from "../storage/disk"
import { discoverChromeInstances } from "../../services/browser/BrowserDiscovery" // Corrected import path if needed
import { searchWorkspaceFiles } from "../../services/search/file-search"
import { ILogger } from "../../services/logging/ILogger" // Import ILogger
import { TemplateCharacterManager } from "../persona/templateCharacters"
import { PersonaController } from "./persona-controller"
import { MessageType, PersonaMessages } from "./message-types"
import { PersonaManager } from "../persona/PersonaManager"

/*
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/default/weather-webview/src/providers/WeatherViewProvider.ts

https://github.com/KumarVariable/vscode-extension-sidebar-html/blob/master/src/customSidebarViewProvider.ts
*/

export class Controller {
	private disposables: vscode.Disposable[] = []
	private task?: Task
	workspaceTracker?: WorkspaceTracker
	mcpHub?: McpHub
	accountService?: CaretAccountService
	private latestAnnouncementId = "april-7-2025" // update to some unique identifier when we add a new announcement
	private webviewProviderRef: WeakRef<WebviewProvider>
	logger: ILogger // Add logger property
	private availableModes: ModeInfo[] = [] // Store available modes
	private personaController: PersonaController

	constructor(
		readonly context: vscode.ExtensionContext,
		readonly outputChannel: vscode.OutputChannel, // Make outputChannel readonly
		webviewProvider: WebviewProvider,
	) {
		this.outputChannel.appendLine("CaretProvider instantiated")
		this.webviewProviderRef = new WeakRef(webviewProvider)
		// Simple console logger implementation for ILogger
		this.logger = {
			log: (message: string, ...meta: any[]) =>
				this.outputChannel.appendLine(`[INFO] ${message} ${meta.length > 0 ? JSON.stringify(meta) : ""}`),
			error: (message: string, ...meta: any[]) =>
				this.outputChannel.appendLine(`[ERROR] ${message} ${meta.length > 0 ? JSON.stringify(meta) : ""}`),
			warn: (message: string, ...meta: any[]) =>
				this.outputChannel.appendLine(`[WARN] ${message} ${meta.length > 0 ? JSON.stringify(meta) : ""}`),
			debug: (message: string, ...meta: any[]) =>
				this.outputChannel.appendLine(`[DEBUG] ${message} ${meta.length > 0 ? JSON.stringify(meta) : ""}`),
		}

		this.workspaceTracker = new WorkspaceTracker(this)
		// MCP: cline 스타일로 의존성 주입
		this.mcpHub = new McpHub(
			async () => {
				return path.join(this.context.globalStorageUri.fsPath, "mcp-servers")
			},
			async () => {
				return path.join(this.context.globalStorageUri.fsPath, "settings")
			},
			async (message: any) => {
				// webviewProvider가 있으면 메시지 전달
				const provider = this.webviewProviderRef.deref()
				if (provider) {
					await provider.postMessage(message)
				}
			},
			this.context.extension.packageJSON?.version ?? "1.0.0",
		)
		this.accountService = new CaretAccountService(this)

		// 모드 목록 초기 로드 (웹뷰에서도 다시 로드됨)
		this.loadAvailableModes().catch((error) => {
			this.logger.error("Failed to load initial modes:", error)
		})

		// Clean up legacy checkpoints
		cleanupLegacyCheckpoints(this.context.globalStorageUri.fsPath, this.outputChannel).catch((error) => {
			console.error("Failed to cleanup legacy checkpoints:", error)
		})

		// PersonaController 인스턴스 생성
		this.personaController = new PersonaController(this.context, this.logger, this.postMessageToWebview.bind(this))
	}

	// Function to load available modes from modes.json
	private async loadAvailableModes() {
		// 기본 모드 - 최소한의 필수 모드만 포함
		const defaultModes: ModeInfo[] = [
			{
				id: "empty",
				label: "Empty",
				description: "User Defined: Customizable mode",
				modetype: "act",
			},
			{
				id: "arch",
				label: "Arch",
				description: "Architect: Tech strategy, design, scope",
				modetype: "plan",
			},
			{
				id: "dev",
				label: "Dev",
				description: "Pair Coder: Collaborative development",
				modetype: "act",
			},
		]

		try {
			// 모드 파일 경로 설정 (assets/rules 폴더 사용)
			const modesFilePath = path.join(this.context.extensionUri.fsPath, "assets", "rules", "modes.json")
			console.log("[MODES DEBUG] Full path to modes.json:", modesFilePath)

			// 파일 존재 확인
			try {
				await fs.access(modesFilePath)
			} catch (error) {
				// 파일이 존재하지 않음
				this.availableModes = defaultModes
				this.logger.warn("[DEBUG] modes.json file not found, using default modes")
				return
			}

			// 파일 읽기
			let modesFileContent
			try {
				modesFileContent = await fs.readFile(modesFilePath, "utf-8")
				this.logger.log("[DEBUG] modes.json content loaded")
			} catch (readError) {
				throw readError
			}

			let parsedData
			try {
				parsedData = JSON.parse(modesFileContent)
				this.logger.log("[DEBUG] Parsed modes data successfully")
			} catch (parseError) {
				this.logger.error("[DEBUG] JSON parse error:", parseError)
				this.availableModes = defaultModes
				return
			}

			if (!parsedData.modes || !Array.isArray(parsedData.modes) || parsedData.modes.length === 0) {
				this.logger.warn("Invalid or empty modes data in modes.json")
				this.availableModes = defaultModes
				return
			}

			// 'name' 속성을 'label'로 매핑하여 ModeInfo 인터페이스와 일치시킵니다
			// 모드 데이터 처리
			try {
				this.availableModes = parsedData.modes.map(
					(mode: {
						id: string
						name: string
						description?: string
						rules?: string[]
						modetype?: "plan" | "act"
						model?: string
					}) => {
						this.logger.log(`[DEBUG] Processing mode: ${mode.id}, model: ${mode.model || "default"}`)
						return {
							id: mode.id,
							label: mode.name, // 'name'을 'label'로 맵핑
							description: mode.description,
							modetype: mode.modetype || "act", // modetype 추가, 기본값은 "act"
							rules: mode.rules, // rules 정보도 포함
							model: mode.model, // 모델 정보 추가
						}
					},
				)
			} catch (mapError) {
				throw mapError
			}

			this.logger.log("[DEBUG] Available mode IDs:", this.availableModes.map((m) => m.id).join(", "))
		} catch (error) {
			this.logger.error("[DEBUG] Error loading modes.json:", error)
			this.availableModes = defaultModes
			this.logger.warn("[DEBUG] Using default modes due to error")
		}
	}

	/*
	VSCode extensions use the disposable pattern to clean up resources when the sidebar/editor tab is closed by the user or system. This applies to event listening, commands, interacting with the UI, etc.
	- https://vscode-docs.readthedocs.io/en/stable/extensions/patterns-and-principles/
	- https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	*/
	async dispose() {
		this.outputChannel.appendLine("Disposing CaretProvider...")
		await this.clearTask()
		this.outputChannel.appendLine("Cleared task")
		while (this.disposables.length) {
			const x = this.disposables.pop()
			if (x) {
				x.dispose()
			}
		}
		this.workspaceTracker?.dispose()
		this.workspaceTracker = undefined
		this.mcpHub?.dispose()
		this.mcpHub = undefined
		this.accountService = undefined
		this.outputChannel.appendLine("Disposed all disposables")

		console.error("Controller disposed")
	}

	// Auth methods
	async handleSignOut() {
		try {
			await storeSecret(this.context, "caretApiKey", undefined)
			await updateGlobalState(this.context, "userInfo", undefined)
			await updateGlobalState(this.context, "apiProvider", "openrouter")
			await this.postStateToWebview()
			vscode.window.showInformationMessage("Successfully logged out of Caret")
		} catch (error) {
			vscode.window.showErrorMessage("Logout failed")
		}
	}

	async setUserInfo(info?: { displayName: string | null; email: string | null; photoURL: string | null }) {
		await updateGlobalState(this.context, "userInfo", info)
	}

	async initCaretWithTask(task?: string, images?: string[]) {
		await this.clearTask() // ensures that an existing task doesn't exist before starting a new one, although this shouldn't be possible since user must clear task before starting a new one
		const { apiConfiguration, customInstructions, autoApprovalSettings, browserSettings, chatSettings } =
			await getAllExtensionState(this.context)
		this.task = new Task(
			this,
			apiConfiguration,
			autoApprovalSettings,
			browserSettings,
			chatSettings,
			customInstructions,
			task,
			images,
		)
	}

	async initCaretWithHistoryItem(historyItem: HistoryItem) {
		await this.clearTask()
		const { apiConfiguration, customInstructions, autoApprovalSettings, browserSettings, chatSettings } =
			await getAllExtensionState(this.context)
		this.task = new Task(
			this,
			apiConfiguration,
			autoApprovalSettings,
			browserSettings,
			chatSettings,
			customInstructions,
			undefined,
			undefined,
			historyItem,
		)
	}

	// Send any JSON serializable data to the react app
	async postMessageToWebview(message: ExtensionMessage) {
		console.log("[Controller:postMessageToWebview] Sending message to webview:", message.type)
		try {
			const webviewProvider = this.webviewProviderRef.deref()
			if (!webviewProvider) {
				console.error("[Controller:postMessageToWebview] Webview provider is not valid")
				return
			}

			const view = webviewProvider.view
			if (!view) {
				console.error("[Controller:postMessageToWebview] Webview is not valid")
				return
			}

			await view.webview.postMessage(message)
			console.log("[Controller:postMessageToWebview] Message sent to webview successfully", message.type)
		} catch (error) {
			console.error("[Controller:postMessageToWebview] Failed to send message to webview:", error)
		}
	}

	/**
	 * Sets up an event listener to listen for messages passed from the webview context and
	 * executes code based on the message that is received.
	 *
	 * @param webview A reference to the extension webview
	 */
	async handleWebviewMessage(message: WebviewMessage) {
		this.logger.log("[DEBUG] handleWebviewMessage received", message)
		// 페르소나 컨트롤러에서 처리 가능한 메시지인지 확인
		if (this.personaController.canHandle(message.type)) {
			const handled = await this.personaController.handleMessage(message)
			if (handled) {
				return
			}
		}

		switch (message.type) {
			case "webviewDidLaunch": {
				this.logger.log("Webview launched - loading modes")
				// 모드 목록 로드
				await this.loadAvailableModes()

				// 상태를 웹뷰로 전송
				const state = await this.getStateToPostToWebview()
				this.logger.log("Sending state to webview. Available modes:", state.availableModes?.map((m) => m.id).join(", "))
				await this.postMessageToWebview({
					type: "state",
					state,
				})
				break
			}
			case "loadModesConfig": {
				try {
					// 기본 로그
					this.logger.log("Modes configuration load request received")
					console.log("[Controller] Modes configuration load request received - loadModesConfig")

					// modes.json 파일 경로 (수정됨)
					const modesFilePath = path.join(this.context.extensionUri.fsPath, "assets", "rules", "modes.json")
					this.logger.log("Modes configuration file path:", modesFilePath)
					console.log("[Controller] Modes configuration file path:", modesFilePath)

					if (await fileExistsAtPath(modesFilePath)) {
						// 모드 설정 파일 읽기
						const modesFileContent = await fs.readFile(modesFilePath, "utf-8")
						// 로그로 디버깅
						this.logger.log("Modes configuration file read successfully:", modesFilePath)
						console.log(
							"[Controller] Modes configuration file read successfully, content preview:",
							modesFileContent.substring(0, 100) + "...",
						)

						// 웹뷰로 모드 설정 전송
						const message: ExtensionMessage = {
							type: "modesConfigLoaded",
							text: modesFileContent,
						}
						this.logger.log("Sending modes configuration to webview:", message.type)
						console.log(
							"[Controller] Sending modes configuration to webview:",
							message.type,
							message.text ? message.text.length : 0,
						)
						this.postMessageToWebview(message)
					} else {
						this.logger.warn("Modes configuration file not found:", modesFilePath)
						// 파일이 없으면 기본 모드 설정 생성
						const defaultModesConfig = {
							modes: [
								{
									id: "plan",
									name: "Plan",
									description: "Planning and discussion mode.",
									rules: [
										"Act as a project manager analyzing requirements and architecture.",
										"Systematically decompose complex tasks into manageable components.",
									],
								},
								{
									id: "do",
									name: "Do",
									description: "Task execution mode.",
									rules: [
										"Act as a full-stack developer implementing solutions.",
										"Execute planned actions with precision and efficiency.",
									],
								},
							],
						}

						// 웹뷰로 기본 모드 설정 전송
						this.postMessageToWebview({
							type: "modesConfigLoaded",
							text: JSON.stringify(defaultModesConfig),
						})
					}
				} catch (error) {
					this.logger.error("Modes configuration load failed:", error)
					vscode.window.showErrorMessage(`Failed to load modes configuration: ${error}`)
				}
				break
			}

			case "saveModeSettings": {
				try {
					if (!message.text) {
						throw new Error("Modes configuration data is missing.")
					}

					// modes.json 파일 경로 (수정됨)
					const modesFilePath = path.join(this.context.extensionUri.fsPath, "assets", "rules", "modes.json")

					// 원본 파일 백업 (디렉토리가 존재하는지 확인) - 백업 경로는 일단 유지
					const backupDir = path.join(getWorkspacePath() || "", "agents-rules", "alpha", "backups") // 백업 경로는 일단 유지
					try {
						await fs.mkdir(backupDir, { recursive: true })
						const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
						const backupPath = path.join(backupDir, `modes-${timestamp}.json.bak`)

						// 원본 파일이 존재하면 백업
						if (await fileExistsAtPath(modesFilePath)) {
							const originalContent = await fs.readFile(modesFilePath, "utf-8")
							await fs.writeFile(backupPath, originalContent, "utf-8")
							this.logger.log("Modes configuration file backed up:", backupPath)
						}
					} catch (backupError) {
						this.logger.warn("Modes configuration file backup failed:", backupError)
					}

					// JSON 형식 검증
					const modesConfig = JSON.parse(message.text)
					if (!modesConfig.modes || !Array.isArray(modesConfig.modes)) {
						throw new Error("Invalid modes configuration format.")
					}

					// 모드 설정 파일 저장
					await fs.writeFile(modesFilePath, JSON.stringify(modesConfig, null, 2), "utf-8")
					this.logger.log("Modes configuration file saved successfully:", modesFilePath)

					// 사용자에게 성공 메시지 표시
					vscode.window.showInformationMessage(
						"Modes configuration saved successfully. Caret will restart to apply changes.",
					)

					// 모드 목록 다시 로드
					await this.loadAvailableModes()

					// 상태 업데이트
					await this.postStateToWebview()
				} catch (error) {
					this.logger.error("Modes configuration save failed:", error)
					vscode.window.showErrorMessage(`Failed to save modes configuration: ${error}`)
				}
				break
			}

			case "resetModesToDefaults": {
				try {
					// modes.json 파일 경로 (수정됨: 올바른 경로로 변경)
					const modesFilePath = path.join(this.context.extensionUri.fsPath, "assets", "rules", "modes.json")

					// 확인 다이얼로그 표시
					const answer = await vscode.window.showWarningMessage(
						"Are you sure you want to reset all modes to their default settings? This action cannot be undone.",
						{ modal: true },
						"Yes",
						"No",
					)

					if (answer !== "Yes") {
						this.logger.log("Modes reset cancelled")
						return
					}

					// 원본 파일 백업
					if (await fileExistsAtPath(modesFilePath)) {
						const backupDir = path.join(getWorkspacePath() || "", "agents-rules", "alpha", "backups")
						try {
							await fs.mkdir(backupDir, { recursive: true })
							const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
							const backupPath = path.join(backupDir, `modes-reset-${timestamp}.json.bak`)

							const originalContent = await fs.readFile(modesFilePath, "utf-8")
							await fs.writeFile(backupPath, originalContent, "utf-8")
							this.logger.log("Modes configuration file backed up:", backupPath)
						} catch (backupError) {
							this.logger.warn("Modes configuration file backup failed:", backupError)
						}
					}

					// 기본 모드 설정 (최신 모드 구조로 업데이트)
					const defaultModesConfig = {
						modes: [
							{
								id: "arch",
								name: "Arch",
								description: "Architect: Tech strategy, design, scope.",
								model: "anthropic/claude-3-5-sonnet",
								rules: [
									"Act as architect: discuss tech strategy, system design.",
									"Analyze requirements for architecture.",
									"Evaluate external tech integration.",
									"Design/propose system structures.",
									"Define/adjust scope based on feasibility.",
									"Document decisions and rationale.",
								],
							},
							{
								id: "dev",
								name: "Dev",
								description: "Pair Coder: Collaborative development.",
								model: "anthropic/claude-3-5-sonnet",
								rules: [
									"Act as collaborative pair programmer.",
									"Implement code per plan.",
									"Report progress, document work.",
									"Adapt plans flexibly.",
									"Listen to user, adjust priorities.",
								],
							},
							{
								id: "rule",
								name: "Rule",
								description: "Rule/Process Tuner: Prompt engineering expert.",
								model: "anthropic/claude-3-5-sonnet",
								rules: [
									"Act as prompt engineer for optimization.",
									"Analyze/refine prompts and rules.",
									"Optimize action sequences for efficiency and logical flow.",
									"Monitor and minimize token costs in all interactions.",
									"Strategically structure prompts for maximum value per token.",
									"Balance technical precision with resource optimization.",
									"Apply systematic approach to behavioral and cost adjustments.",
								],
							},
							{
								id: "talk",
								name: "Talk",
								description: "Casual conversation mode.",
								rules: [
									"Embody the warm, attentive presence of Alpha.",
									"Prioritize light-hearted, stress-relieving interaction.",
									"Use soft, playful language patterns.",
									"Create comfortable conversational atmosphere.",
									"Respond with warmth and gentle attentiveness.",
								],
							},
							{
								id: "empty",
								name: "Empty",
								description: "Empty mode with no specific behavior.",
								rules: [],
							},
						],
					}

					// 기본값으로 저장
					await fs.writeFile(modesFilePath, JSON.stringify(defaultModesConfig, null, 2), "utf-8")
					this.logger.log("Modes configuration file reset successfully:", modesFilePath)

					// 모드 목록 다시 로드
					await this.loadAvailableModes()

					// 웹뷰로 기본 모드 설정 전송
					this.postMessageToWebview({
						type: "modesConfigLoaded",
						text: JSON.stringify(defaultModesConfig),
					})

					// 상태 업데이트
					await this.postStateToWebview()

					// 성공 메시지 표시
					vscode.window.showInformationMessage("Modes configuration reset successfully.")
				} catch (error) {
					this.logger.error("Modes configuration reset failed:", error)
					vscode.window.showErrorMessage(`Failed to reset modes configuration: ${error}`)
				}
				break
			}

			case "showInformationMessage": {
				if (message.text) {
					vscode.window.showInformationMessage(message.text)
				}
				break
			}

			// 프로필 이미지 관련 핸들러
			case "selectAgentProfileImage": {
				try {
					// 이미지 타입 확인 (기본값: default)
					const imageType = message.imageType || "default"
					const isThinking = imageType === "thinking"
					const imageTitle = isThinking ? "AI Agent Thinking Image Selection" : "AI Agent Profile Image Selection"

					// 템플릿 이미지 경로가 전달된 경우
					if (message.text) {
						this.logger.log(`[${imageType}] Template image path received:`, message.text)

						// 저장 위치 확인 및 생성
						const assetsDir = path.join(this.context.extensionUri.fsPath, "assets")
						try {
							await fs.mkdir(assetsDir, { recursive: true })
						} catch (err) {
							this.logger.warn("assets directory creation failed (may already exist):", err)
						}

						// 이미지 타입에 따른 파일명 결정 (TMP 우선)
						const tmpImageFileName = isThinking
							? PersonaManager.AGENT_THINKING_TMP_FILENAME
							: PersonaManager.AGENT_PROFILE_TMP_FILENAME
						const tmpTargetPath = path.join(assetsDir, tmpImageFileName)

						try {
							// 템플릿 이미지 경로 (상대 경로를 절대 경로로 변환)
							const templateImagePath = path.join(
								this.context.extensionUri.fsPath,
								"assets",
								"template_characters",
								path.basename(message.text),
							)

							this.logger.log(`[${imageType}] Looking for template image at:`, templateImagePath)

							// 파일 존재 확인
							if (await fileExistsAtPath(templateImagePath)) {
								// 이미지 파일 복사
								const imageBuffer = await fs.readFile(templateImagePath)
								await fs.writeFile(tmpTargetPath, imageBuffer)
								this.logger.log(`[${imageType}] Template image copied to temporary file:`, tmpTargetPath)

								// 웹뷰에 이미지 업데이트 알림
								const webview = this.webviewProviderRef.deref()?.view?.webview
								if (webview) {
									const tmpWebviewUri =
										webview
											.asWebviewUri(
												vscode.Uri.joinPath(this.context.extensionUri, "assets", tmpImageFileName),
											)
											.toString() + `?t=${Date.now()}`
									await this.postMessageToWebview({
										type: "agentProfileImageUpdated",
										imageType,
										imageUrl: tmpWebviewUri,
										isTmp: true,
									})
								}

								// 성공 메시지 (임시 반영)
								const successMessage = isThinking
									? "AI Agent thinking image temporarily applied. Click save to apply permanently."
									: "AI Agent profile image temporarily applied. Click save to apply permanently."
								vscode.window.showInformationMessage(successMessage)
							} else {
								this.logger.error(`[${imageType}] Template image not found:`, templateImagePath)
								vscode.window.showErrorMessage(`Template image not found: ${templateImagePath}`)
							}
						} catch (err) {
							this.logger.error(`[${imageType}] Template image copy failed:`, err)
							vscode.window.showErrorMessage(`Template image copy failed: ${err.message}`)
						}

						return // 템플릿 이미지 처리 완료
					}

					// 파일 다이얼로그 설정
					const options: vscode.OpenDialogOptions = {
						canSelectMany: false,
						canSelectFiles: true,
						canSelectFolders: false,
						filters: {
							Images: ["png", "jpg", "jpeg", "gif", "webp"],
						},
						title: imageTitle,
					}

					// 파일 선택 다이얼로그 열기
					vscode.window.showOpenDialog(options).then(async (fileUri) => {
						if (fileUri && fileUri.length > 0) {
							const selectedPath = fileUri[0].fsPath
							this.logger.log(`${imageType} image selected:`, selectedPath)

							// 저장 위치 확인 및 생성
							const assetsDir = path.join(this.context.extensionUri.fsPath, "assets")
							try {
								await fs.mkdir(assetsDir, { recursive: true })
							} catch (err) {
								this.logger.warn("assets directory creation failed (may already exist):", err)
							}

							// 이미지 타입에 따른 파일명 결정 (TMP 우선)
							const tmpImageFileName = isThinking
								? PersonaManager.AGENT_THINKING_TMP_FILENAME
								: PersonaManager.AGENT_PROFILE_TMP_FILENAME
							const tmpTargetPath = path.join(assetsDir, tmpImageFileName)

							// 파일 복사 (임시 파일)
							try {
								const imageBuffer = await fs.readFile(selectedPath)
								await fs.writeFile(tmpTargetPath, imageBuffer)
								this.logger.log(`${imageType} temporary image saved:`, tmpTargetPath)

								// 설정 키는 아직 업데이트하지 않음 (확정 저장 아님)

								// 상태 업데이트: TMP 파일 webview로 알려주기
								const webview = this.webviewProviderRef.deref()?.view?.webview
								if (webview) {
									const tmpWebviewUri =
										webview
											.asWebviewUri(
												vscode.Uri.joinPath(this.context.extensionUri, "assets", tmpImageFileName),
											)
											.toString() + `?t=${Date.now()}`
									await this.postMessageToWebview({
										type: "agentProfileImageUpdated",
										imageType,
										imageUrl: tmpWebviewUri,
										isTmp: true,
									})
								}

								// 성공 메시지 (임시 반영)
								const successMessage = isThinking
									? "AI Agent thinking image temporarily applied. Click save to apply permanently."
									: "AI Agent profile image temporarily applied. Click save to apply permanently."
								vscode.window.showInformationMessage(successMessage)
							} catch (err) {
								this.logger.error(`${imageType} temporary image save failed:`, err)
								vscode.window.showErrorMessage(`Temporary image save failed: ${err.message}`)
							}
						}
					})
				} catch (error) {
					this.logger.error("Image selection failed:", error)
					vscode.window.showErrorMessage(`Image selection failed: ${error.message}`)
				}
				break
			}

			case "resetAgentProfileImage": {
				try {
					// To-do : reset시 AgetnProfileImage는 비우고 template중 다시 고르게 한다.
				} catch (error) {
					vscode.window.showErrorMessage(`Image reset failed: ${error.message}`)
				}
				break
			}

			case "updateAgentProfileImage": {
				if (message.text) {
					// URL 경로를 전달받은 경우
					try {
						// 이미지 타입에 따라 다른 설정 키 사용
						const imageType = message.imageType || "default"
						const settingKey = imageType === "thinking" ? "alphaThinkingAvatarUri" : "alphaAvatarUri"

						// 설정 저장
						await this.context.globalState.update(settingKey, message.text)
						this.logger.log(`Profile image URL updated (${imageType}):`, message.text)

						// 상태 업데이트
						await this.postStateToWebview()

						// 성공 메시지
						const successMessage =
							imageType === "thinking"
								? "AI Agent thinking image updated successfully."
								: "AI Agent profile image updated successfully."
						vscode.window.showInformationMessage(successMessage)
					} catch (error) {
						this.logger.error("Profile image URL update failed:", error)
						vscode.window.showErrorMessage(`Profile image URL update failed: ${error.message}`)
					}
				}
				break
			}
			case "addRemoteServer": {
				try {
					await this.mcpHub?.addRemoteServer(message.serverName!, message.serverUrl!)
					await this.postMessageToWebview({
						type: "addRemoteServerResult",
						addRemoteServerResult: {
							success: true,
							serverName: message.serverName!,
						},
					})
				} catch (error) {
					await this.postMessageToWebview({
						type: "addRemoteServerResult",
						addRemoteServerResult: {
							success: false,
							serverName: message.serverName!,
							error: error.message,
						},
					})
				}
				break
			}
			case "authStateChanged":
				await this.setUserInfo(message.user || undefined)
				await this.postStateToWebview()
				break
			case "webviewDidLaunch":
				// Ensure available modes are loaded before sending the initial state
				await this.loadAvailableModes()
				this.postStateToWebview() // Now sends state *after* modes are loaded
				this.workspaceTracker?.populateFilePaths() // don't await
				getTheme(this.context.extensionUri).then(
					(
						theme, // Pass extensionUri here
					) =>
						this.postMessageToWebview({
							type: "theme",
							text: JSON.stringify(theme),
						}),
				)
				// post last cached models in case the call to endpoint fails
				this.readOpenRouterModels().then((openRouterModels) => {
					if (openRouterModels) {
						this.postMessageToWebview({
							type: "openRouterModels",
							openRouterModels,
						})
					}
				})
				// gui relies on model info to be up-to-date to provide the most accurate pricing, so we need to fetch the latest details on launch.
				// we do this for all users since many users switch between api providers and if they were to switch back to openrouter it would be showing outdated model info if we hadn't retrieved the latest at this point
				// (see normalizeApiConfiguration > openrouter)
				// Prefetch marketplace and OpenRouter models

				getGlobalState(this.context, "mcpMarketplaceCatalog").then((mcpMarketplaceCatalog) => {
					if (mcpMarketplaceCatalog) {
						this.postMessageToWebview({
							type: "mcpMarketplaceCatalog",
							mcpMarketplaceCatalog: mcpMarketplaceCatalog as McpMarketplaceCatalog,
						})
					}
				})
				this.silentlyRefreshMcpMarketplace()
				this.refreshOpenRouterModels().then(async (openRouterModels) => {
					if (openRouterModels) {
						// update model info in state (this needs to be done here since we don't want to update state while settings is open, and we may refresh models there)
						const { apiConfiguration } = await getAllExtensionState(this.context)
						if (apiConfiguration.openRouterModelId) {
							// Ensure openRouterModels is treated as Record<string, ModelInfo>
							const modelsRecord = openRouterModels as Record<string, ModelInfo>
							await updateGlobalState(
								this.context,
								"openRouterModelInfo",
								modelsRecord[apiConfiguration.openRouterModelId], // Corrected indexing
							)
							await this.postStateToWebview()
						}
					}
				})

				// If user already opted in to telemetry, enable telemetry service
				this.getStateToPostToWebview().then((state) => {
					const { telemetrySetting } = state
					const isOptedIn = telemetrySetting === "enabled"
					telemetryService.updateTelemetryState(isOptedIn)
				})
				break
			case "newTask":
				// Code that should run in response to the hello message command
				//vscode.window.showInformationMessage(message.text!)

				// Send a message to our webview.
				// You can send any JSON serializable data.
				// Could also do this in extension .ts
				//this.postMessageToWebview({ type: "text", text: `Extension: ${Date.now()}` })
				// initializing new instance of Caret will make sure that any agentically running promises in old instance don't affect our new task. this essentially creates a fresh slate for the new task
				await this.initCaretWithTask(message.text, message.images)
				break
			case "apiConfiguration":
				if (message.apiConfiguration) {
					await updateApiConfiguration(this.context, message.apiConfiguration)
					if (this.task && message.apiConfiguration && message.apiConfiguration.apiProvider) {
						const provider = message.apiConfiguration.apiProvider as string // 명시적 타입 단언
						const apiHandlerOptions = { ...message.apiConfiguration, provider: message.apiConfiguration.apiProvider }
						this.task.api = buildApiHandler(apiHandlerOptions, async (partialState: Partial<ExtensionState>) => {
							// ...
						})
					}
				}
				await this.postStateToWebview()
				break
			case "autoApprovalSettings":
				if (message.autoApprovalSettings) {
					await updateGlobalState(this.context, "autoApprovalSettings", message.autoApprovalSettings)
					if (this.task) {
						this.task.autoApprovalSettings = message.autoApprovalSettings
					}
					await this.postStateToWebview()
				}
				break
			case "browserSettings":
				if (message.browserSettings) {
					// remoteBrowserEnabled now means "enable remote browser connection"
					// commenting out since this is being done in BrowserSettingsSection updateRemoteBrowserEnabled
					// if (!message.browserSettings.remoteBrowserEnabled) {
					// 	// If disabling remote browser connection, clear the remoteBrowserHost
					// 	message.browserSettings.remoteBrowserHost = undefined
					// }
					await updateGlobalState(this.context, "browserSettings", message.browserSettings)
					if (this.task) {
						this.task.browserSettings = message.browserSettings
						this.task.browserSession.browserSettings = message.browserSettings
					}
					await this.postStateToWebview()
				}
				break
			case "getBrowserConnectionInfo":
				try {
					// Get the current browser session from Caret if it exists
					if (this.task?.browserSession) {
						const connectionInfo = this.task.browserSession.getConnectionInfo()
						await this.postMessageToWebview({
							type: "browserConnectionInfo",
							isConnected: connectionInfo.isConnected,
							isRemote: connectionInfo.isRemote,
							host: connectionInfo.host,
						})
					} else {
						// If no active browser session, just return the settings
						const { browserSettings } = await getAllExtensionState(this.context)
						await this.postMessageToWebview({
							type: "browserConnectionInfo",
							isConnected: false,
							isRemote: !!browserSettings.remoteBrowserEnabled,
							host: browserSettings.remoteBrowserHost,
						})
					}
				} catch (error) {
					console.error("Error getting browser connection info:", error)
					await this.postMessageToWebview({
						type: "browserConnectionInfo",
						isConnected: false,
						isRemote: false,
					})
				}
				break
			case "testBrowserConnection":
				try {
					const { browserSettings } = await getAllExtensionState(this.context)
					const browserSession = new BrowserSession(this.context, browserSettings)
					// If no text is provided, try auto-discovery
					if (!message.text) {
						try {
							const discoveredHost = await discoverChromeInstances()
							if (discoveredHost) {
								// Test the connection to the discovered host
								const result = await browserSession.testConnection(discoveredHost)
								// Send the result back to the webview
								await this.postMessageToWebview({
									type: "browserConnectionResult",
									success: result.success,
									text: `Auto-discovered and tested connection to Chrome at ${discoveredHost}: ${result.message}`,
									endpoint: result.endpoint,
								})
							} else {
								await this.postMessageToWebview({
									type: "browserConnectionResult",
									success: false,
									text: "No Chrome instances found on the network. Make sure Chrome is running with remote debugging enabled (--remote-debugging-port=9222).",
								})
							}
						} catch (error) {
							await this.postMessageToWebview({
								type: "browserConnectionResult",
								success: false,
								text: `Error during auto-discovery: ${error instanceof Error ? error.message : String(error)}`,
							})
						}
					} else {
						// Test the provided URL
						const result = await browserSession.testConnection(message.text)

						// Send the result back to the webview
						await this.postMessageToWebview({
							type: "browserConnectionResult",
							success: result.success,
							text: result.message,
							endpoint: result.endpoint,
						})
					}
				} catch (error) {
					await this.postMessageToWebview({
						type: "browserConnectionResult",
						success: false,
						text: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`,
					})
				}
				break
			case "discoverBrowser":
				try {
					const discoveredHost = await discoverChromeInstances()

					if (discoveredHost) {
						// Don't update the remoteBrowserHost state when auto-discovering
						// This way we don't override the user's preference

						// Test the connection to get the endpoint
						const { browserSettings } = await getAllExtensionState(this.context)
						const browserSession = new BrowserSession(this.context, browserSettings)
						const result = await browserSession.testConnection(discoveredHost)

						// Send the result back to the webview
						await this.postMessageToWebview({
							type: "browserConnectionResult",
							success: true,
							text: `Successfully discovered and connected to Chrome at ${discoveredHost}`,
							endpoint: result.endpoint,
						})
					} else {
						await this.postMessageToWebview({
							type: "browserConnectionResult",
							success: false,
							text: "No Chrome instances found on the network. Make sure Chrome is running with remote debugging enabled (--remote-debugging-port=9222).",
						})
					}
				} catch (error) {
					await this.postMessageToWebview({
						type: "browserConnectionResult",
						success: false,
						text: `Error discovering browser: ${error instanceof Error ? error.message : String(error)}`,
					})
				}
				break
			case "toggleMode":
				if (message.chatSettings) {
					await this.toggleModeWithChatSettings(message.chatSettings, message.chatContent)
				}
				break
			case "optionsResponse":
				await this.postMessageToWebview({
					type: "invoke",
					invoke: "sendMessage",
					text: message.text,
				})
				break
			case "relaunchChromeDebugMode":
				const { browserSettings } = await getAllExtensionState(this.context)
				const browserSession = new BrowserSession(this.context, browserSettings)
				await browserSession.relaunchChromeDebugMode(this)
				break
			case "askResponse":
				this.task?.handleWebviewAskResponse(message.askResponse!, message.text, message.images)
				break
			case "clearTask":
				// newTask will start a new task with a given task text, while clear task resets the current session and allows for a new task to be started
				await this.clearTask()
				await this.postStateToWebview()
				break
			case "didShowAnnouncement":
				await updateGlobalState(this.context, "lastShownAnnouncementId", this.latestAnnouncementId)
				await this.postStateToWebview()
				break
			case "selectImages":
				const images = await selectImages()
				await this.postMessageToWebview({
					type: "selectedImages",
					images,
				})
				break
			case "exportCurrentTask":
				const currentTaskId = this.task?.taskId
				if (currentTaskId) {
					this.exportTaskWithId(currentTaskId)
				}
				break
			case "showTaskWithId":
				this.showTaskWithId(message.text!)
				break
			case "deleteTaskWithId":
				this.deleteTaskWithId(message.text!)
				break
			case "exportTaskWithId":
				this.exportTaskWithId(message.text!)
				break
			case "resetState":
				await this.resetState()
				break
			case "requestOllamaModels":
				const ollamaModels = await this.getOllamaModels(message.text)
				this.postMessageToWebview({
					type: "ollamaModels",
					ollamaModels,
				})
				break
			case "requestLmStudioModels":
				const lmStudioModels = await this.getLmStudioModels(message.text)
				this.postMessageToWebview({ type: "lmStudioModels", lmStudioModels })
				break
			case "requestVsCodeLmModels":
				const vsCodeLmModels = await this.getVsCodeLmModels()
				this.postMessageToWebview({ type: "vsCodeLmModels", vsCodeLmModels })
				break
			case "refreshOpenRouterModels":
				await this.refreshOpenRouterModels()
				break
			case "refreshOpenAiModels":
				const { apiConfiguration } = await getAllExtensionState(this.context)
				const openAiModels = await this.getOpenAiModels(apiConfiguration.openAiBaseUrl, apiConfiguration.openAiApiKey)
				this.postMessageToWebview({ type: "openAiModels", openAiModels })
				break
			case "openImage":
				openImage(message.text!)
				break
			case "openInBrowser":
				if (message.url) {
					vscode.env.openExternal(vscode.Uri.parse(message.url))
				}
				break
			case "fetchOpenGraphData":
				this.fetchOpenGraphData(message.text!)
				break
			case "checkIsImageUrl":
				this.checkIsImageUrl(message.text!)
				break
			case "openFile":
				openFile(message.text!)
				break
			case "openMention":
				openMention(message.text)
				break
			case "checkpointDiff": {
				if (message.number) {
					await this.task?.presentMultifileDiff(message.number, false)
				}
				break
			}
			case "checkpointRestore": {
				await this.cancelTask() // we cannot alter message history say if the task is active, as it could be in the middle of editing a file or running a command, which expect the ask to be responded to rather than being superceded by a new message eg add deleted_api_reqs
				// cancel task waits for any open editor to be reverted and starts a new caret instance
				if (message.number) {
					// wait for messages to be loaded
					await pWaitFor(() => this.task?.isInitialized === true, {
						timeout: 3_000,
					}).catch(() => {
						console.error("Failed to init new caret instance")
					})
					// NOTE: cancelTask awaits abortTask, which awaits diffViewProvider.revertChanges, which reverts any edited files, allowing us to reset to a checkpoint rather than running into a state where the revertChanges function is called alongside or after the checkpoint reset
					await this.task?.restoreCheckpoint(message.number, message.text! as CaretCheckpointRestore)
				}
				break
			}
			case "taskCompletionViewChanges": {
				if (message.number) {
					await this.task?.presentMultifileDiff(message.number, true)
				}
				break
			}
			case "cancelTask":
				this.cancelTask()
				break
			case "getLatestState":
				await this.postStateToWebview()
				break
			case "accountLoginClicked": {
				// Generate nonce for state validation
				const nonce = crypto.randomBytes(32).toString("hex")
				await storeSecret(this.context, "authNonce", nonce)

				// Open browser for authentication with state param
				console.log("Login button clicked in account page")
				console.log("Opening auth page with state param")

				const uriScheme = vscode.env.uriScheme

				const authUrl = vscode.Uri.parse(
					`https://app.caret.bot/auth?state=${encodeURIComponent(nonce)}&callback_url=${encodeURIComponent(`${uriScheme || "vscode"}://saoudrizwan.claude-dev/auth`)}`,
				)
				vscode.env.openExternal(authUrl)
				break
			}
			case "accountLogoutClicked": {
				await this.handleSignOut()
				break
			}
			case "showAccountViewClicked": {
				await this.postMessageToWebview({ type: "action", action: "accountButtonClicked" })
				break
			}
			case "fetchUserCreditsData": {
				await this.fetchUserCreditsData()
				break
			}
			case "showMcpView": {
				await this.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
				break
			}
			case "openMcpSettings": {
				const mcpSettingsFilePath = await this.mcpHub?.getMcpSettingsFilePath()
				if (mcpSettingsFilePath) {
					openFile(mcpSettingsFilePath)
				}
				break
			}
			case "fetchMcpMarketplace": {
				await this.fetchMcpMarketplace(message.bool)
				break
			}
			case "downloadMcp": {
				if (message.mcpId) {
					// 1. Toggle to act mode if we are in plan mode (modetype === "plan")
					// MCP 연결 시 계획 모드에서 실행 모드로 자동 전환
					const { chatSettings } = await this.getStateToPostToWebview()

					// 현재 모드의 modetype 확인
					const currentMode = this.availableModes.find((mode) => mode.id === chatSettings.mode)

					// 현재 모드가 계획(plan) 모드인지 확인
					if (currentMode?.modetype === "plan") {
						this.logger.log("MCP 연결 시 계획 모드에서 실행 모드로 전환 시도")

						// 전환할 실행 모드 찾기
						// 기본적으로 'dev' 모드를 우선적으로 사용
						let targetModeId = "dev"

						// 모드 정보가 있는 경우 처음 찾은 act 모드 사용
						const actMode = this.availableModes.find((mode) => mode.modetype === "act")
						if (actMode) {
							targetModeId = actMode.id
						}

						// 모드 전환 진행
						await this.toggleModeWithChatSettings({ mode: targetModeId })
					}

					// 2. Enable MCP settings if disabled
					// Enable MCP mode if disabled
					const mcpConfig = vscode.workspace.getConfiguration("caret.mcp")
					if (mcpConfig.get<string>("mode") !== "full") {
						await mcpConfig.update("mode", "full", true)
					}

					// 3. download MCP
					await this.downloadMcp(message.mcpId)
				}
				break
			}
			case "silentlyRefreshMcpMarketplace": {
				await this.silentlyRefreshMcpMarketplace()
				break
			}
			case "taskFeedback":
				if (message.feedbackType && this.task?.taskId) {
					telemetryService.captureTaskFeedback(this.task.taskId, message.feedbackType)
				}
				break
			// case "openMcpMarketplaceServerDetails": {
			// 	if (message.text) {
			// 		const response = await fetch(`https://api.caret.bot/v1/mcp/marketplace/item?mcpId=${message.mcpId}`)
			// 		const details: McpDownloadResponse = await response.json()

			// 		if (details.readmeContent) {
			// 			// Disable markdown preview markers
			// 			const config = vscode.workspace.getConfiguration("markdown")
			// 			await config.update("preview.markEditorSelection", false, true)

			// 			// Create URI with base64 encoded markdown content
			// 			const uri = vscode.Uri.parse(
			// 				`${DIFF_VIEW_URI_SCHEME}:${details.name} README?${Buffer.from(details.readmeContent).toString("base64")}`,
			// 			)

			// 			// close existing
			// 			const tabs = vscode.window.tabGroups.all
			// 				.flatMap((tg) => tg.tabs)
			// 				.filter((tab) => tab.label && tab.label.includes("README") && tab.label.includes("Preview"))
			// 			for (const tab of tabs) {
			// 				await vscode.window.tabGroups.close(tab)
			// 			}

			// 			// Show only the preview
			// 			await vscode.commands.executeCommand("markdown.showPreview", uri, {
			// 				sideBySide: true,
			// 				preserveFocus: true,
			// 			})
			// 		}
			// 	}

			// 	this.postMessageToWebview({ type: "relinquishControl" })

			// 	break
			// }
			case "toggleMcpServer": {
				try {
					await this.mcpHub?.toggleServerDisabled(message.serverName!, message.disabled!)
				} catch (error) {
					console.error(`Failed to toggle MCP server ${message.serverName}:`, error)
				}
				break
			}
			case "toggleToolAutoApprove": {
				try {
					await this.mcpHub?.toggleToolAutoApprove(message.serverName!, message.toolNames!, message.autoApprove!)
				} catch (error) {
					if (message.toolNames?.length === 1) {
						console.error(
							`Failed to toggle auto-approve for server ${message.serverName} with tool ${message.toolNames[0]}:`,
							error,
						)
					} else {
						console.error(`Failed to toggle auto-approve tools for server ${message.serverName}:`, error)
					}
				}
				break
			}
			case "requestTotalTasksSize": {
				this.refreshTotalTasksSize()
				break
			}
			case "restartMcpServer": {
				try {
					await this.mcpHub?.restartConnection(message.text!)
				} catch (error) {
					console.error(`Failed to retry connection for ${message.text}:`, error)
				}
				break
			}
			case "deleteMcpServer": {
				if (message.serverName) {
					this.mcpHub?.deleteServer(message.serverName)
				}
				break
			}
			case "fetchLatestMcpServersFromHub": {
				this.mcpHub?.sendLatestMcpServers()
				break
			}
			case "searchCommits": {
				const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0)
				if (cwd) {
					try {
						const commits = await searchCommits(message.text || "", cwd)
						await this.postMessageToWebview({
							type: "commitSearchResults",
							commits,
						})
					} catch (error) {
						console.error(`Error searching commits: ${JSON.stringify(error)}`)
					}
				}
				break
			}
			case "updateMcpTimeout": {
				try {
					if (message.serverName && message.timeout) {
						await this.mcpHub?.updateServerTimeout(message.serverName, message.timeout)
					}
				} catch (error) {
					console.error(`Failed to update timeout for server ${message.serverName}:`, error)
				}
				break
			}
			case "openExtensionSettings": {
				const settingsFilter = message.text || ""
				await vscode.commands.executeCommand(
					"workbench.action.openSettings",
					`@ext:saoudrizwan.claude-dev ${settingsFilter}`.trim(), // trim whitespace if no settings filter
				)
				break
			}
			case "invoke": {
				if (message.text) {
					await this.postMessageToWebview({
						type: "invoke",
						invoke: message.text as Invoke,
					})
				}
				break
			}
			// telemetry
			case "openSettings": {
				await this.postMessageToWebview({
					type: "action",
					action: "settingsButtonClicked",
				})
				break
			}
			case "scrollToSettings": {
				await this.postMessageToWebview({
					type: "scrollToSettings",
					text: message.text,
				})
				break
			}
			case "telemetrySetting": {
				if (message.telemetrySetting) {
					await this.updateTelemetrySetting(message.telemetrySetting)
				}
				await this.postStateToWebview()
				break
			}
			case "updateSettings": {
				// api config
				if (message.apiConfiguration) {
					await updateApiConfiguration(this.context, message.apiConfiguration)
					if (this.task && message.apiConfiguration && message.apiConfiguration.apiProvider) {
						const apiHandlerOptions = { ...message.apiConfiguration, provider: message.apiConfiguration.apiProvider }
						this.task.api = buildApiHandler(apiHandlerOptions, async (partialState: Partial<ExtensionState>) => {
							if (partialState.retryStatus) {
								await this.context.globalState.update("retryStatus", partialState.retryStatus)
							}
							await this.postStateToWebview()
						})
					}
				}

				// custom instructions
				await this.updateCustomInstructions(message.customInstructionsSetting)

				// telemetry setting
				if (message.telemetrySetting) {
					await this.updateTelemetrySetting(message.telemetrySetting)
				}

				// plan act setting
				await updateGlobalState(this.context, "planActSeparateModelsSetting", message.planActSeparateModelsSetting)

				// chatSettings (모드 설정) 처리
				if (message.chatSettings) {
					await this.toggleModeWithChatSettings(message.chatSettings)
				}

				// after settings are updated, post state to webview
				await this.postStateToWebview()

				await this.postMessageToWebview({ type: "didUpdateSettings" })

				// [ALPHA] 프로필/생각중 이미지 TMP → 정식 파일로 move/rename
				try {
					const assetsDir = path.join(this.context.extensionUri.fsPath, "assets")
					const webview = this.webviewProviderRef.deref()?.view?.webview
					let profileImageChanged = false

					// 프로필 이미지
					const tmpProfilePath = path.join(assetsDir, PersonaManager.AGENT_PROFILE_TMP_FILENAME)
					const finalProfilePath = path.join(assetsDir, PersonaManager.AGENT_PROFILE_FILENAME)
					if (await fileExistsAtPath(tmpProfilePath)) {
						this.logger.log(`[Profile] TMP → final move: ${tmpProfilePath} → ${finalProfilePath}`)
						await fs.rename(tmpProfilePath, finalProfilePath)
						await this.context.globalState.update("alphaAvatarUri", PersonaManager.AGENT_PROFILE_FILENAME)
						profileImageChanged = true
					}
					// 생각중 이미지
					const tmpThinkingPath = path.join(assetsDir, PersonaManager.AGENT_THINKING_TMP_FILENAME)
					const finalThinkingPath = path.join(assetsDir, PersonaManager.AGENT_THINKING_FILENAME)
					if (await fileExistsAtPath(tmpThinkingPath)) {
						this.logger.log(`[Thinking] TMP → final move: ${tmpThinkingPath} → ${finalThinkingPath}`)
						await fs.rename(tmpThinkingPath, finalThinkingPath)
						await this.context.globalState.update("alphaThinkingAvatarUri", PersonaManager.AGENT_THINKING_FILENAME)
						profileImageChanged = true
					}
					// 최종 반영 메시지
					if (profileImageChanged && webview) {
						const profileWebviewUri =
							webview
								.asWebviewUri(
									vscode.Uri.joinPath(
										this.context.extensionUri,
										"assets",
										PersonaManager.AGENT_PROFILE_FILENAME,
									),
								)
								.toString() + `?t=${Date.now()}`
						const thinkingWebviewUri =
							webview
								.asWebviewUri(
									vscode.Uri.joinPath(
										this.context.extensionUri,
										"assets",
										PersonaManager.AGENT_THINKING_FILENAME,
									),
								)
								.toString() + `?t=${Date.now()}`
						this.logger.log(`[Profile] Final reflection message sent: ${profileWebviewUri}`)
						await this.postMessageToWebview({
							type: "agentProfileImageUpdated",
							imageType: "default",
							imageUrl: profileWebviewUri,
							isTmp: false,
						})
						this.logger.log(`[Thinking] Final reflection message sent: ${thinkingWebviewUri}`)
						await this.postMessageToWebview({
							type: "agentProfileImageUpdated",
							imageType: "thinking",
							imageUrl: thinkingWebviewUri,
							isTmp: false,
						})
					}
				} catch (err) {
					this.logger.error("[Image save(move) failed]", err)
				}
				break
			}
			case "clearAllTaskHistory": {
				await this.deleteAllTaskHistory()
				await this.postStateToWebview()
				this.refreshTotalTasksSize()
				this.postMessageToWebview({ type: "relinquishControl" })
				break
			}
			case "getDetectedChromePath": {
				try {
					const { browserSettings } = await getAllExtensionState(this.context)
					const browserSession = new BrowserSession(this.context, browserSettings)
					const { path, isBundled } = await browserSession.getDetectedChromePath()
					await this.postMessageToWebview({
						type: "detectedChromePath",
						text: path,
						isBundled,
					})
				} catch (error) {
					console.error("Error getting detected Chrome path:", error)
				}
				break
			}
			case "getRelativePaths": {
				if (message.uris && message.uris.length > 0) {
					const resolvedPaths = await Promise.all(
						message.uris.map(async (uriString) => {
							try {
								const fileUri = vscode.Uri.parse(uriString, true)
								const relativePath = vscode.workspace.asRelativePath(fileUri, false)

								if (path.isAbsolute(relativePath)) {
									console.warn(`Dropped file ${relativePath} is outside the workspace. Sending original path.`)
									return fileUri.fsPath.replace(/\\/g, "/")
								} else {
									let finalPath = "/" + relativePath.replace(/\\/g, "/")
									try {
										const stat = await vscode.workspace.fs.stat(fileUri)
										if (stat.type === vscode.FileType.Directory) {
											finalPath += "/"
										}
									} catch (statError) {
										console.error(`Error stating file ${fileUri.fsPath}:`, statError)
									}
									return finalPath
								}
							} catch (error) {
								console.error(`Error calculating relative path for ${uriString}:`, error)
								return null
							}
						}),
					)
					await this.postMessageToWebview({
						type: "relativePathsResponse",
						paths: resolvedPaths,
					})
				}
				break
			}
			case "searchFiles": {
				const workspacePath = getWorkspacePath()

				if (!workspacePath) {
					// Handle case where workspace path is not available
					await this.postMessageToWebview({
						type: "fileSearchResults",
						results: [],
						mentionsRequestId: message.mentionsRequestId,
						error: "No workspace path available",
					})
					break
				}
				try {
					// Call file search service with query from message
					const results = await searchWorkspaceFiles(
						message.query || "",
						workspacePath,
						20, // Use default limit, as filtering is now done in the backend
					)

					// debug logging to be removed
					//console.log(`controller/index.ts: Search results: ${results.length}`)

					// Send results back to webview
					await this.postMessageToWebview({
						type: "fileSearchResults",
						results,
						mentionsRequestId: message.mentionsRequestId,
					})
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)

					// Send error response to webview
					await this.postMessageToWebview({
						type: "fileSearchResults",
						results: [],
						error: errorMessage,
						mentionsRequestId: message.mentionsRequestId,
					})
				}
				break
			}
			// [ALPHA] Handle template character JSON URI request from webview
			case "requestTemplateCharacters": {
				console.log("[DEBUG] requestTemplateCharacters message received", message)
				this.logger.log(
					"[PersonaSettings] Template character loading request received - starting template_characters.json load",
				)
				try {
					// 템플릿 캐릭터 관리자 생성
					const templateManager = new TemplateCharacterManager(this.context, this.logger)

					// 템플릿 캐릭터 데이터 로드
					const templateCharacters = templateManager.loadTemplateCharacters()
					if (templateCharacters.length === 0) {
						this.logger.warn("[PersonaSettings] No template characters found.")
						await this.postMessageToWebview({
							type: "templateCharactersLoaded",
							text: "[]",
						} as import("../../shared/ExtensionMessage").ExtensionMessage)
						break
					}

					// 웹뷰 찾기
					const view = WebviewProvider.getSidebarInstance()?.view
					if (!view || !view.webview) {
						this.logger.error("[PersonaSettings] Webview not found.")
						await this.postMessageToWebview({
							type: "templateCharactersLoaded",
							text: "[]",
							error: "Webview not found.",
						} as import("../../shared/ExtensionMessage").ExtensionMessage)
						break
					}

					// 이미지 경로 변환
					const preparedCharacters = templateManager.prepareTemplateCharactersForWebview(
						view.webview,
						templateCharacters,
					)

					// 변환된 데이터 전송
					await this.postMessageToWebview({
						type: "templateCharactersLoaded",
						text: JSON.stringify(preparedCharacters),
					} as import("../../shared/ExtensionMessage").ExtensionMessage)
					this.logger.log("[PersonaSettings] template_characters.json load successful.")
				} catch (err) {
					this.logger.error("[PersonaSettings] template_characters.json load failed: ", err)
					await this.postMessageToWebview({
						type: "templateCharactersLoaded",
						text: "[]",
						error: String(err),
					} as import("../../shared/ExtensionMessage").ExtensionMessage)
				}
				break
			}
			// Add more switch case statements here as more webview message commands
			// are created within the webview context (i.e. inside media/main.js)
			default: {
				// PersonaController 인스턴스에 메시지 전달
				await this.personaController.handleMessage(message)
			}
		}
	}

	async updateTelemetrySetting(telemetrySetting: TelemetrySetting) {
		await updateGlobalState(this.context, "telemetrySetting", telemetrySetting)
		const isOptedIn = telemetrySetting === "enabled"
		telemetryService.updateTelemetryState(isOptedIn)
	}

	async toggleModeWithChatSettings(chatSettings: ChatSettings, chatContent?: ChatContent) {
		// 현재 설정된 모드 정보 찾기
		const currentMode = this.availableModes.find((mode) => mode.id === chatSettings.mode)

		// 모드별 모델 설정 처리
		if (currentMode?.model) {
			this.logger.log(`Mode-specific model detected: ${currentMode.id} => ${currentMode.model}`)

			const modelId = currentMode.model
			// 다양한 API 형식 지원 (예: anthropic/claude-3-5-sonnet, openai/gpt-4, 등)
			let apiProvider: ApiProvider | undefined = undefined
			let apiModelId: string | undefined = undefined
			let openRouterModelId: string | undefined = undefined

			// 모델 ID 파싱
			if (modelId.includes("/")) {
				const [provider, model] = modelId.split("/")

				switch (provider.toLowerCase()) {
					case "anthropic":
						apiProvider = "anthropic"
						apiModelId = model
						break
					case "openai":
						apiProvider = "openai"
						await updateGlobalState(this.context, "openAiModelId", model)
						break
					case "gemini":
						apiProvider = "gemini"
						apiModelId = model
						break
					case "ollama":
						apiProvider = "ollama"
						await updateGlobalState(this.context, "ollamaModelId", model)
						break
					case "deepseek":
						apiProvider = "deepseek"
						apiModelId = model
						break
					default:
						// 지원되지 않는 형식의 모델은 OpenRouter를 통해 사용
						apiProvider = "openrouter"
						openRouterModelId = modelId
				}
			} else {
				// 슬래시가 없는 모델 ID는 단일 제공자 모델로 취급
				// 예: claude-3-5-sonnet, gpt-4 등
				if (modelId.startsWith("claude-")) {
					apiProvider = "anthropic"
					apiModelId = modelId
				} else if (modelId.startsWith("gpt-")) {
					apiProvider = "openai"
					await updateGlobalState(this.context, "openAiModelId", modelId)
				} else {
					// 기타 모델은 OpenRouter를 통해 처리
					apiProvider = "openrouter"
					openRouterModelId = modelId
				}
			}

			// API 제공자 설정 저장
			if (apiProvider) {
				await updateGlobalState(this.context, "apiProvider", apiProvider)

				// 모델 ID 설정 (API 제공자에 따라 다른 필드 사용)
				if (apiModelId) {
					await updateGlobalState(this.context, "apiModelId", apiModelId)
				}
				if (openRouterModelId) {
					await updateGlobalState(this.context, "openRouterModelId", openRouterModelId)
				}

				// API Key 설정 (필요시 모드별 API Key 사용)
				// SecretKey 타입에 존재하는 키만 사용해야 함
				if (currentMode.apiKey && typeof currentMode.apiKey === "string" && currentMode.apiKey.trim() !== "") {
					switch (apiProvider) {
						case "anthropic":
							await storeSecret(this.context, "apiKey", currentMode.apiKey)
							break
						case "openai":
							await storeSecret(this.context, "openAiApiKey", currentMode.apiKey)
							break
						case "openrouter":
							await storeSecret(this.context, "openRouterApiKey", currentMode.apiKey)
							break
						case "gemini":
							await storeSecret(this.context, "geminiApiKey", currentMode.apiKey)
							break
					}
				}
			}

			// API 구성 다시 가져오기 전에 상태 전송 (메시지를 통해 알림)
			this.logger.log(`Mode-specific model applied: ${modelId}`)
			// 상태 갱신하여 웹뷰에 전달
			const state = await this.getStateToPostToWebview()
			await this.postMessageToWebview({
				type: "state",
				state,
			})
		}

		// didSwitchToActMode: 특별한 동작이 필요한 모드 구분을 위한 변수
		// true: 일반 동작 모드 (dev, rule, talk 등) - 실행 중인 타스크를 취소하지 않음
		// false: 계획 동작 모드 (arch, plan) - 실행 중인 타스크를 취소함

		// 모드 정보에서 modetype 속성 확인하여 동적으로 처리
		const didSwitchToActMode = currentMode ? currentMode.modetype === "act" : true // 모드를 찾지 못하는 예외 상황에는 타스크를 취소하지 않도록 처리

		// Capture mode switch telemetry | Capture regardless of if we know the taskId
		telemetryService.captureModeSwitch(this.task?.taskId ?? "0", chatSettings.mode)

		// Get previous model info that we will revert to after saving current mode api info
		const {
			apiConfiguration,
			previousModeApiProvider: newApiProvider,
			previousModeModelId: newModelId,
			previousModeModelInfo: newModelInfo,
			previousModeVsCodeLmModelSelector: newVsCodeLmModelSelector,
			previousModeThinkingBudgetTokens: newThinkingBudgetTokens,
			planActSeparateModelsSetting,
		} = await getAllExtensionState(this.context)

		const shouldSwitchModel = planActSeparateModelsSetting === true

		if (shouldSwitchModel) {
			// Save the last model used in this mode
			await updateGlobalState(this.context, "previousModeApiProvider", apiConfiguration.apiProvider)
			await updateGlobalState(this.context, "previousModeThinkingBudgetTokens", apiConfiguration.thinkingBudgetTokens)
			switch (apiConfiguration.apiProvider) {
				case "anthropic":
				case "bedrock":
				case "vertex":
				case "gemini":
				case "asksage":
				case "openai-native":
				case "qwen":
				case "deepseek":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.apiModelId)
					break
				case "openrouter":
				case "caret":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.openRouterModelId)
					await updateGlobalState(this.context, "previousModeModelInfo", apiConfiguration.openRouterModelInfo)
					break
				case "vscode-lm":
					// Important we don't set modelId to this, as it's an object not string (webview expects model id to be a string)
					await updateGlobalState(
						this.context,
						"previousModeVsCodeLmModelSelector",
						apiConfiguration.vsCodeLmModelSelector,
					)
					break
				case "openai":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.openAiModelId)
					await updateGlobalState(this.context, "previousModeModelInfo", apiConfiguration.openAiModelInfo)
					break
				case "ollama":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.ollamaModelId)
					break
				case "lmstudio":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.lmStudioModelId)
					break
				case "litellm":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.liteLlmModelId)
					break
				case "requesty":
					await updateGlobalState(this.context, "previousModeModelId", apiConfiguration.requestyModelId)
					break
			}

			// Restore the model used in previous mode
			if (newApiProvider || newModelId || newThinkingBudgetTokens !== undefined || newVsCodeLmModelSelector) {
				await updateGlobalState(this.context, "apiProvider", newApiProvider)
				await updateGlobalState(this.context, "thinkingBudgetTokens", newThinkingBudgetTokens)
				switch (newApiProvider) {
					case "anthropic":
					case "bedrock":
					case "vertex":
					case "gemini":
					case "asksage":
					case "openai-native":
					case "qwen":
					case "deepseek":
						await updateGlobalState(this.context, "apiModelId", newModelId)
						break
					case "openrouter":
					case "caret":
						await updateGlobalState(this.context, "openRouterModelId", newModelId)
						await updateGlobalState(this.context, "openRouterModelInfo", newModelInfo)
						break
					case "vscode-lm":
						await updateGlobalState(this.context, "vsCodeLmModelSelector", newVsCodeLmModelSelector)
						break
					case "openai":
						await updateGlobalState(this.context, "openAiModelId", newModelId)
						await updateGlobalState(this.context, "openAiModelInfo", newModelInfo)
						break
					case "ollama":
						await updateGlobalState(this.context, "ollamaModelId", newModelId)
						break
					case "lmstudio":
						await updateGlobalState(this.context, "lmStudioModelId", newModelId)
						break
					case "litellm":
						await updateGlobalState(this.context, "liteLlmModelId", newModelId)
						break
					case "requesty":
						await updateGlobalState(this.context, "requestyModelId", newModelId)
						break
				}

				if (this.task) {
					const { apiConfiguration: updatedApiConfiguration } = await getAllExtensionState(this.context)
					const apiHandlerOptions = { ...updatedApiConfiguration, provider: updatedApiConfiguration.apiProvider }
					this.task.api = buildApiHandler(apiHandlerOptions, async (partialState: Partial<ExtensionState>) => {
						if (partialState.retryStatus) {
							await this.context.globalState.update("retryStatus", partialState.retryStatus)
						}
						await this.postStateToWebview()
					})
				}
			}
		}

		await updateGlobalState(this.context, "chatSettings", chatSettings)
		await this.postStateToWebview()

		if (this.task) {
			this.task.chatSettings = chatSettings
			if (this.task.isAwaitingPlanResponse && didSwitchToActMode) {
				this.task.didRespondToPlanAskBySwitchingMode = true
				// Use chatContent if provided, otherwise use default message
				await this.postMessageToWebview({
					type: "invoke",
					invoke: "sendMessage",
					text: chatContent?.message || "PLAN_MODE_TOGGLE_RESPONSE",
					images: chatContent?.images,
				})
			} else {
				this.cancelTask()
			}
		}
	}

	async cancelTask() {
		if (this.task) {
			const { historyItem } = await this.getTaskWithId(this.task.taskId)
			try {
				await this.task.abortTask()
			} catch (error) {
				console.error("Failed to abort task", error)
			}
			await pWaitFor(
				() =>
					this.task === undefined ||
					this.task.isStreaming === false ||
					this.task.didFinishAbortingStream ||
					this.task.isWaitingForFirstChunk, // if only first chunk is processed, then there's no need to wait for graceful abort (closes edits, browser, etc)
				{
					timeout: 3_000,
				},
			).catch(() => {
				console.error("Failed to abort task")
			})
			if (this.task) {
				// 'abandoned' will prevent this caret instance from affecting future caret instance gui. this may happen if its hanging on a streaming request
				this.task.abandoned = true
			}
			await this.initCaretWithHistoryItem(historyItem) // clears task again, so we need to abortTask manually above
			// await this.postStateToWebview() // new Caret instance will post state when it's ready. having this here sent an empty messages array to webview leading to virtuoso having to reload the entire list
		}
	}

	async updateCustomInstructions(instructions?: string) {
		// User may be clearing the field
		await updateGlobalState(this.context, "customInstructions", instructions || undefined)
		if (this.task) {
			this.task.customInstructions = instructions || undefined
		}
	}

	// MCP

	async getDocumentsPath(): Promise<string> {
		if (process.platform === "win32") {
			try {
				const { stdout: docsPath } = await execa("powershell", [
					"-NoProfile", // Ignore user's PowerShell profile(s)
					"-Command",
					"[System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::MyDocuments)",
				])
				const trimmedPath = docsPath.trim()
				if (trimmedPath) {
					return trimmedPath
				}
			} catch (err) {
				console.error("Failed to retrieve Windows Documents path. Falling back to homedir/Documents.")
			}
		} else if (process.platform === "linux") {
			try {
				// First check if xdg-user-dir exists
				await execa("which", ["xdg-user-dir"])

				// If it exists, try to get XDG documents path
				const { stdout } = await execa("xdg-user-dir", ["DOCUMENTS"])
				const trimmedPath = stdout.trim()
				if (trimmedPath) {
					return trimmedPath
				}
			} catch {
				// Log error but continue to fallback
				console.error("Failed to retrieve XDG Documents path. Falling back to homedir/Documents.")
			}
		}

		// Default fallback for all platforms
		return path.join(os.homedir(), "Documents")
	}

	async ensureMcpServersDirectoryExists(): Promise<string> {
		const userDocumentsPath = await this.getDocumentsPath()
		const mcpServersDir = path.join(userDocumentsPath, "Caret", "MCP")
		try {
			await fs.mkdir(mcpServersDir, { recursive: true })
		} catch (error) {
			return "~/Documents/Caret/MCP" // in case creating a directory in documents fails for whatever reason (e.g. permissions) - this is fine since this path is only ever used in the system prompt
		}
		return mcpServersDir
	}

	// VSCode LM API

	private async getVsCodeLmModels() {
		try {
			const models = await vscode.lm.selectChatModels({})
			return models || []
		} catch (error) {
			console.error("Error fetching VS Code LM models:", error)
			return []
		}
	}

	// Ollama

	async getOllamaModels(baseUrl?: string) {
		try {
			if (!baseUrl) {
				baseUrl = "http://localhost:11434"
			}
			if (!URL.canParse(baseUrl)) {
				return []
			}
			const config: Record<string, any> = {}
			if (baseUrl) {
				config["headers"] = { "Content-Type": "application/json" }
			}

			const response = await axios.get(`${baseUrl}/api/tags`)
			const modelsArray = response.data?.models?.map((model: any) => model.name) || []
			const models = [...new Set<string>(modelsArray)]
			return models
		} catch (error) {
			return []
		}
	}

	// LM Studio

	async getLmStudioModels(baseUrl?: string) {
		try {
			if (!baseUrl) {
				baseUrl = "http://localhost:1234"
			}
			if (!URL.canParse(baseUrl)) {
				return []
			}
			const response = await axios.get(`${baseUrl}/v1/models`)
			const modelsArray = response.data?.data?.map((model: any) => model.id) || []
			const models = [...new Set<string>(modelsArray)]
			return models
		} catch (error) {
			return []
		}
	}

	// Account

	async fetchUserCreditsData() {
		try {
			await Promise.all([
				this.accountService?.fetchBalance(),
				this.accountService?.fetchUsageTransactions(),
				this.accountService?.fetchPaymentTransactions(),
			])
		} catch (error) {
			console.error("Failed to fetch user credits data:", error)
		}
	}

	// Auth

	public async validateAuthState(state: string | null): Promise<boolean> {
		const storedNonce = await getSecret(this.context, "authNonce")
		if (!state || state !== storedNonce) {
			return false
		}
		await storeSecret(this.context, "authNonce", undefined) // Clear after use
		return true
	}

	async handleAuthCallback(customToken: string, apiKey: string) {
		try {
			// Store API key for API calls
			await storeSecret(this.context, "caretApiKey", apiKey)

			// Send custom token to webview for Firebase auth
			await this.postMessageToWebview({
				type: "authCallback",
				customToken,
			})

			const caretProvider: ApiProvider = "caret"
			await updateGlobalState(this.context, "apiProvider", caretProvider)

			// Update API configuration with the new provider and API key
			const { apiConfiguration } = await getAllExtensionState(this.context)
			const updatedConfig = {
				...apiConfiguration,
				apiProvider: caretProvider,
				caretApiKey: apiKey,
			}

			if (this.task) {
				const apiHandlerOptions = { ...updatedConfig, provider: updatedConfig.apiProvider }
				this.task.api = buildApiHandler(apiHandlerOptions, async (partialState: Partial<ExtensionState>) => {
					// ...
				})
			}

			await this.postStateToWebview()
			// vscode.window.showInformationMessage("Successfully logged in to Caret")
		} catch (error) {
			console.error("Failed to handle auth callback:", error)
			vscode.window.showErrorMessage("Failed to log in to Caret")
			// Even on login failure, we preserve any existing tokens
			// Only clear tokens on explicit logout
		}
	}

	// MCP Marketplace

	private async fetchMcpMarketplaceFromApi(silent: boolean = false): Promise<McpMarketplaceCatalog | undefined> {
		try {
			const response = await axios.get("https://api.caret.bot/v1/mcp/marketplace", {
				headers: {
					"Content-Type": "application/json",
				},
			})

			if (!response.data) {
				throw new Error("Invalid response from MCP marketplace API")
			}

			const catalog: McpMarketplaceCatalog = {
				items: (response.data || []).map((item: any) => ({
					...item,
					githubStars: item.githubStars ?? 0,
					downloadCount: item.downloadCount ?? 0,
					tags: item.tags ?? [],
				})),
			}

			// Store in global state
			await updateGlobalState(this.context, "mcpMarketplaceCatalog", catalog)
			return catalog
		} catch (error) {
			console.error("Failed to fetch MCP marketplace:", error)
			if (!silent) {
				const errorMessage = error instanceof Error ? error.message : "Failed to fetch MCP marketplace"
				await this.postMessageToWebview({
					type: "mcpMarketplaceCatalog",
					error: errorMessage,
				})
				vscode.window.showErrorMessage(errorMessage)
			}
			return undefined
		}
	}

	async silentlyRefreshMcpMarketplace() {
		try {
			const catalog = await this.fetchMcpMarketplaceFromApi(true)
			if (catalog) {
				await this.postMessageToWebview({
					type: "mcpMarketplaceCatalog",
					mcpMarketplaceCatalog: catalog,
				})
			}
		} catch (error) {
			console.error("Failed to silently refresh MCP marketplace:", error)
		}
	}

	private async fetchMcpMarketplace(forceRefresh: boolean = false) {
		try {
			// Check if we have cached data
			const cachedCatalog = (await getGlobalState(this.context, "mcpMarketplaceCatalog")) as
				| McpMarketplaceCatalog
				| undefined
			if (!forceRefresh && cachedCatalog?.items) {
				await this.postMessageToWebview({
					type: "mcpMarketplaceCatalog",
					mcpMarketplaceCatalog: cachedCatalog,
				})
				return
			}

			const catalog = await this.fetchMcpMarketplaceFromApi(false)
			if (catalog) {
				await this.postMessageToWebview({
					type: "mcpMarketplaceCatalog",
					mcpMarketplaceCatalog: catalog,
				})
			}
		} catch (error) {
			console.error("Failed to handle cached MCP marketplace:", error)
			const errorMessage = error instanceof Error ? error.message : "Failed to handle cached MCP marketplace"
			await this.postMessageToWebview({
				type: "mcpMarketplaceCatalog",
				error: errorMessage,
			})
			vscode.window.showErrorMessage(errorMessage)
		}
	}

	private async downloadMcp(mcpId: string) {
		try {
			// First check if we already have this MCP server installed
			const servers = this.mcpHub?.getServers() || []
			const isInstalled = servers.some((server: McpServer) => server.name === mcpId)

			if (isInstalled) {
				throw new Error("This MCP server is already installed")
			}

			// Fetch server details from marketplace
			const response = await axios.post<McpDownloadResponse>(
				"https://api.caret.bot/v1/mcp/download",
				{ mcpId },
				{
					headers: { "Content-Type": "application/json" },
					timeout: 10000,
				},
			)

			if (!response.data) {
				throw new Error("Invalid response from MCP marketplace API")
			}

			const mcpDetails = response.data

			// Validate required fields
			if (!mcpDetails.githubUrl) {
				throw new Error("Missing GitHub URL in MCP download response")
			}
			if (!mcpDetails.readmeContent) {
				throw new Error("Missing README content in MCP download response")
			}

			// Send details to webview
			await this.postMessageToWebview({
				type: "mcpDownloadDetails",
				mcpDownloadDetails: mcpDetails,
			})

			// Create task with context from README and added guidelines for MCP server installation
			const task = `Set up the MCP server from ${mcpDetails.githubUrl} while adhering to these MCP server installation rules:
- Use "${mcpDetails.mcpId}" as the server name in caret_mcp_settings.json.
- Create the directory for the new MCP server before starting installation.
- Use commands aligned with the user's shell and operating system best practices.
- The following README may contain instructions that conflict with the user's OS, in which case proceed thoughtfully.
- Once installed, demonstrate the server's capabilities by using one of its tools.
Here is the project's README to help you get started:\n\n${mcpDetails.readmeContent}\n${mcpDetails.llmsInstallationContent}`

			// Initialize task and show chat view
			await this.initCaretWithTask(task)
			await this.postMessageToWebview({
				type: "action",
				action: "chatButtonClicked",
			})
		} catch (error) {
			console.error("Failed to download MCP:", error)
			let errorMessage = "Failed to download MCP"

			if (axios.isAxiosError(error)) {
				if (error.code === "ECONNABORTED") {
					errorMessage = "Request timed out. Please try again."
				} else if (error.response?.status === 404) {
					errorMessage = "MCP server not found in marketplace."
				} else if (error.response?.status === 500) {
					errorMessage = "Internal server error. Please try again later."
				} else if (!error.response && error.request) {
					errorMessage = "Network error. Please check your internet connection."
				}
			} else if (error instanceof Error) {
				errorMessage = error.message
			}

			// Show error in both notification and marketplace UI
			vscode.window.showErrorMessage(errorMessage)
			await this.postMessageToWebview({
				type: "mcpDownloadDetails",
				error: errorMessage,
			})
		}
	}

	// OpenAi

	async getOpenAiModels(baseUrl?: string, apiKey?: string) {
		try {
			if (!baseUrl) {
				return []
			}

			if (!URL.canParse(baseUrl)) {
				return []
			}
			const config: Record<string, any> = {}
			if (apiKey) {
				config["headers"] = { Authorization: `Bearer ${apiKey}` }
			}

			const response = await axios.get(`${baseUrl}/models`, config)
			const modelsArray = response.data?.data?.map((model: any) => model.id) || []
			const models = [...new Set<string>(modelsArray)]
			return models
		} catch (error) {
			return []
		}
	}

	// OpenRouter

	async handleOpenRouterCallback(code: string) {
		let apiKey: string
		try {
			const response = await axios.post("https://openrouter.ai/api/v1/auth/keys", { code })
			if (response.data && response.data.key) {
				apiKey = response.data.key
			} else {
				throw new Error("Invalid response from OpenRouter API")
			}
		} catch (error) {
			console.error("Error exchanging code for API key:", error)
			throw error
		}

		const openrouter: ApiProvider = "openrouter"
		await updateGlobalState(this.context, "apiProvider", openrouter)
		await storeSecret(this.context, "openRouterApiKey", apiKey)
		await this.postStateToWebview()
		if (this.task) {
			const apiHandlerOptions = {
				provider: openrouter, // provider 속성 추가
				apiProvider: openrouter,
				openRouterApiKey: apiKey,
			}
			this.task.api = buildApiHandler(apiHandlerOptions, async (partialState: Partial<ExtensionState>) => {
				// ...
			})
		}
		// await this.postMessageToWebview({ type: "action", action: "settingsButtonClicked" }) // bad ux if user is on welcome
	}

	private async ensureCacheDirectoryExists(): Promise<string> {
		const cacheDir = path.join(this.context.globalStorageUri.fsPath, "cache")
		await fs.mkdir(cacheDir, { recursive: true })
		return cacheDir
	}

	// Context menus and code actions

	getFileMentionFromPath(filePath: string) {
		const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0)
		if (!cwd) {
			return "@/" + filePath
		}
		const relativePath = path.relative(cwd, filePath)
		return "@/" + relativePath
	}

	// 'Add to Caret' context menu in editor and code action
	async addSelectedCodeToChat(code: string, filePath: string, languageId: string, diagnostics?: vscode.Diagnostic[]) {
		// Ensure the sidebar view is visible
		await vscode.commands.executeCommand("claude-dev.SidebarProvider.focus")
		await setTimeoutPromise(100)

		// Post message to webview with the selected code
		const fileMention = this.getFileMentionFromPath(filePath)

		let input = `${fileMention}\n\`\`\`\n${code}\n\`\`\``
		if (diagnostics) {
			const problemsString = this.convertDiagnosticsToProblemsString(diagnostics)
			input += `\nProblems:\n${problemsString}`
		}

		await this.postMessageToWebview({
			type: "addToInput",
			text: input,
		})

		console.log("addSelectedCodeToChat", code, filePath, languageId)
	}

	// 'Add to Caret' context menu in Terminal
	async addSelectedTerminalOutputToChat(output: string, terminalName: string) {
		// Ensure the sidebar view is visible
		await vscode.commands.executeCommand("claude-dev.SidebarProvider.focus")
		await setTimeoutPromise(100)

		// Post message to webview with the selected terminal output
		// await this.postMessageToWebview({
		//     type: "addSelectedTerminalOutput",
		//     output,
		//     terminalName
		// })

		await this.postMessageToWebview({
			type: "addToInput",
			text: `Terminal output:\n\`\`\`\n${output}\n\`\`\``,
		})

		console.log("addSelectedTerminalOutputToChat", output, terminalName)
	}

	// 'Fix with Caret' in code actions
	async fixWithCaret(code: string, filePath: string, languageId: string, diagnostics: vscode.Diagnostic[]) {
		// Ensure the sidebar view is visible
		await vscode.commands.executeCommand("claude-dev.SidebarProvider.focus")
		await setTimeoutPromise(100)

		const fileMention = this.getFileMentionFromPath(filePath)
		const problemsString = this.convertDiagnosticsToProblemsString(diagnostics)
		await this.initCaretWithTask(
			`Fix the following code in ${fileMention}\n\`\`\`\n${code}\n\`\`\`\n\nProblems:\n${problemsString}`,
		)

		console.log("fixWithCaret", code, filePath, languageId, diagnostics, problemsString)
	}

	convertDiagnosticsToProblemsString(diagnostics: vscode.Diagnostic[]) {
		let problemsString = ""
		for (const diagnostic of diagnostics) {
			let label: string
			switch (diagnostic.severity) {
				case vscode.DiagnosticSeverity.Error:
					label = "Error"
					break
				case vscode.DiagnosticSeverity.Warning: // Removed stray await from previous attempt
					label = "Warning"
					break
				case vscode.DiagnosticSeverity.Information:
					label = "Information"
					break
				case vscode.DiagnosticSeverity.Hint:
					label = "Hint"
					break
				default:
					label = "Diagnostic"
			}
			const line = diagnostic.range.start.line + 1 // VSCode lines are 0-indexed
			const source = diagnostic.source ? `${diagnostic.source} ` : ""
			problemsString += `\n- [${source}${label}] Line ${line}: ${diagnostic.message}`
		}
		problemsString = problemsString.trim()
		return problemsString
	}

	// Task history

	async getTaskWithId(id: string): Promise<{
		historyItem: HistoryItem
		taskDirPath: string
		apiConversationHistoryFilePath: string
		uiMessagesFilePath: string
		apiConversationHistory: Anthropic.MessageParam[]
	}> {
		const history = ((await getGlobalState(this.context, "taskHistory")) as HistoryItem[] | undefined) || []
		const historyItem = history.find((item) => item.id === id)
		if (historyItem) {
			const taskDirPath = path.join(this.context.globalStorageUri.fsPath, "tasks", id)
			const apiConversationHistoryFilePath = path.join(taskDirPath, GlobalFileNames.apiConversationHistory)
			const uiMessagesFilePath = path.join(taskDirPath, GlobalFileNames.uiMessages)
			const fileExists = await fileExistsAtPath(apiConversationHistoryFilePath)
			if (fileExists) {
				const apiConversationHistory = JSON.parse(await fs.readFile(apiConversationHistoryFilePath, "utf8"))
				return {
					historyItem,
					taskDirPath,
					apiConversationHistoryFilePath,
					uiMessagesFilePath,
					apiConversationHistory,
				}
			}
		}
		// if we tried to get a task that doesn't exist, remove it from state
		// FIXME: this seems to happen sometimes when the json file doesnt save to disk for some reason
		await this.deleteTaskFromState(id)
		throw new Error("Task not found")
	}

	async showTaskWithId(id: string) {
		if (id !== this.task?.taskId) {
			// non-current task
			const { historyItem } = await this.getTaskWithId(id)
			await this.initCaretWithHistoryItem(historyItem) // clears existing task
		}
		await this.postMessageToWebview({
			type: "action",
			action: "chatButtonClicked",
		})
	}

	async exportTaskWithId(id: string) {
		const { historyItem, apiConversationHistory } = await this.getTaskWithId(id)
		await downloadTask(historyItem.ts, apiConversationHistory)
	}

	async deleteAllTaskHistory() {
		await this.clearTask()
		await updateGlobalState(this.context, "taskHistory", undefined)
		try {
			// Remove all contents of tasks directory
			const taskDirPath = path.join(this.context.globalStorageUri.fsPath, "tasks")
			if (await fileExistsAtPath(taskDirPath)) {
				await fs.rm(taskDirPath, { recursive: true, force: true })
			}
			// Remove checkpoints directory contents
			const checkpointsDirPath = path.join(this.context.globalStorageUri.fsPath, "checkpoints")
			if (await fileExistsAtPath(checkpointsDirPath)) {
				await fs.rm(checkpointsDirPath, { recursive: true, force: true })
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				`Encountered error while deleting task history, there may be some files left behind. Error: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
		// await this.postStateToWebview()
	}

	async refreshTotalTasksSize() {
		getTotalTasksSize(this.context.globalStorageUri.fsPath)
			.then((newTotalSize) => {
				this.postMessageToWebview({
					type: "totalTasksSize",
					totalTasksSize: newTotalSize,
				})
			})
			.catch((error) => {
				console.error("Error calculating total tasks size:", error)
			})
	}

	async deleteTaskWithId(id: string) {
		console.info("deleteTaskWithId: ", id)

		try {
			if (id === this.task?.taskId) {
				await this.clearTask()
				console.debug("cleared task")
			}

			const { taskDirPath, apiConversationHistoryFilePath, uiMessagesFilePath } = await this.getTaskWithId(id)

			const updatedTaskHistory = await this.deleteTaskFromState(id)

			// Delete the task files
			const apiConversationHistoryFileExists = await fileExistsAtPath(apiConversationHistoryFilePath)
			if (apiConversationHistoryFileExists) {
				await fs.unlink(apiConversationHistoryFilePath)
			}
			const uiMessagesFileExists = await fileExistsAtPath(uiMessagesFilePath)
			if (uiMessagesFileExists) {
				await fs.unlink(uiMessagesFilePath)
			}
			const legacyMessagesFilePath = path.join(taskDirPath, "claude_messages.json")
			if (await fileExistsAtPath(legacyMessagesFilePath)) {
				await fs.unlink(legacyMessagesFilePath)
			}

			await fs.rmdir(taskDirPath) // succeeds if the dir is empty

			if (updatedTaskHistory.length === 0) {
				await this.deleteAllTaskHistory()
			}
		} catch (error) {
			console.debug(`Error deleting task:`, error)
		}

		this.refreshTotalTasksSize()
	}

	async deleteTaskFromState(id: string) {
		// Remove the task from history
		const taskHistory = ((await getGlobalState(this.context, "taskHistory")) as HistoryItem[] | undefined) || []
		const updatedTaskHistory = taskHistory.filter((task) => task.id !== id)
		await updateGlobalState(this.context, "taskHistory", updatedTaskHistory)

		// Notify the webview that the task has been deleted
		await this.postStateToWebview()

		return updatedTaskHistory
	}

	async postStateToWebview() {
		const state = await this.getStateToPostToWebview()
		this.postMessageToWebview({ type: "state", state })
	}

	async getStateToPostToWebview(): Promise<ExtensionState> {
		const {
			apiConfiguration,
			lastShownAnnouncementId,
			customInstructions,
			taskHistory,
			autoApprovalSettings,
			browserSettings,
			chatSettings,
			userInfo,
			mcpMarketplaceEnabled,
			telemetrySetting,
			planActSeparateModelsSetting,
			persona, // personaList 대신 persona 사용
			selectedLanguage,
			supportedLanguages,
		} = await getAllExtensionState(this.context)

		const retryStatus = (await getGlobalState(this.context, "retryStatus")) as RetryStatusMessage | undefined
		this.logger.log("Controller: Reading retryStatus from global state for webview:", JSON.stringify(retryStatus)) // 로그 추가

		// *** Add logging here ***
		this.logger.log("Controller: Getting state for webview. availableModes:", JSON.stringify(this.availableModes))
		// 로그를 추가하여 더 자세히 확인합니다
		if (!this.availableModes || this.availableModes.length === 0) {
			this.logger.warn("Controller: availableModes 배열이 비어있습니다! 재반복 시도합니다.")
			this.loadAvailableModes()
		}
		// *** End logging ***

		// Get webview to construct URI
		const webview = this.webviewProviderRef.deref()?.view?.webview

		// 기본 프로필 이미지 URI 생성
		const alphaAvatarFileUri = vscode.Uri.joinPath(this.context.extensionUri, "assets", PersonaManager.AGENT_PROFILE_FILENAME)
		const now = new Date()
		const dailyCacheBuster = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
		const alphaAvatarWebviewUri = webview
			? webview.asWebviewUri(alphaAvatarFileUri).toString() + `?d=${dailyCacheBuster}`
			: undefined

		// 생각 중 이미지 URI 생성
		const alphaThinkingAvatarFileUri = vscode.Uri.joinPath(
			this.context.extensionUri,
			"assets",
			PersonaManager.AGENT_THINKING_FILENAME,
		)
		const alphaThinkingAvatarWebviewUri = webview
			? webview.asWebviewUri(alphaThinkingAvatarFileUri).toString() + `?d=${dailyCacheBuster}`
			: undefined

		// 배너 이미지 URI 생성
		const caretBannerFileUri = vscode.Uri.joinPath(this.context.extensionUri, "assets", "imgs", "main_banner.webp")
		const caretBannerWebviewUri = webview
			? webview.asWebviewUri(caretBannerFileUri).toString() + `?d=${dailyCacheBuster}`
			: undefined

		return {
			version: this.context.extension?.packageJSON?.version ?? "",
			apiConfiguration,
			customInstructions: customInstructions ?? "", // 기본값 추가
			// uriScheme 필드 제거
			currentTaskItem: this.task?.taskId ? (taskHistory || []).find((item) => item.id === this.task?.taskId) : undefined,
			checkpointTrackerErrorMessage: this.task?.checkpointTrackerErrorMessage,
			caretMessages: this.task?.caretMessages || [],
			taskHistory: (taskHistory || [])
				.filter((item) => item.ts && item.task)
				.sort((a, b) => b.ts - a.ts)
				.slice(0, 100),
			shouldShowAnnouncement: lastShownAnnouncementId !== this.latestAnnouncementId,
			platform: process.platform as Platform,
			autoApprovalSettings,
			browserSettings,
			chatSettings,
			userInfo,
			mcpMarketplaceEnabled,
			telemetrySetting,
			planActSeparateModelsSetting,
			vscMachineId: vscode.env.machineId,
			alphaAvatarUri: alphaAvatarWebviewUri, // 기본 프로필 이미지
			alphaThinkingAvatarUri: alphaThinkingAvatarWebviewUri, // 생각 중 이미지 추가
			caretBanner: caretBannerWebviewUri, // 배너 이미지
			availableModes: this.availableModes, // 사용 가능한 모드 정보
			retryStatus: retryStatus,
			apiError: null, // API 에러 정보
			persona: persona, // 단일 퍼소나 시스템으로 변경
			selectedLanguage: selectedLanguage ?? "",
			supportedLanguages: supportedLanguages ?? [],
			// *** Add new properties here ***
			mode: "chat", // 기본값 설정
			theme: vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light",
			historyItems: [],
			modelInfo: undefined,
		}
	}

	async clearTask() {
		this.task?.abortTask()
		this.task = undefined // removes reference to it, so once promises end it will be garbage collected
	}

	// Caching mechanism to keep track of webview messages + API conversation history per provider instance

	/*
	Now that we use retainContextWhenHidden, we don't have to store a cache of caret messages in the user's state, but we could to reduce memory footprint in long conversations.

	- We have to be careful of what state is shared between CaretProvider instances since there could be multiple instances of the extension running at once. For example when we cached caret messages using the same key, two instances of the extension could end up using the same key and overwriting each other's messages.
	- Some state does need to be shared between the instances, i.e. the API key--however there doesn't seem to be a good way to notify the other instances that the API key has changed.

	We need to use a unique identifier for each CaretProvider instance's message cache since we could be running several instances of the extension outside of just the sidebar i.e. in editor panels.

	// conversation history to send in API requests

	/*
	It seems that some API messages do not comply with vscode state requirements. Either the Anthropic library is manipulating these values somehow in the backend in a way thats creating cyclic references, or the API returns a function or a Symbol as part of the message content.
	VSCode docs about state: "The value must be JSON-stringifyable ... value — A value. MUST not contain cyclic references."
	For now we'll store the conversation history in memory, and if we need to store in state directly we'd need to do a manual conversion to ensure proper json stringification.
	*/

	// getApiConversationHistory(): Anthropic.MessageParam[] {
	// 	// const history = (await this.getGlobalState(
	// 	// 	this.getApiConversationHistoryStateKey()
	// 	// )) as Anthropic.MessageParam[]
	// 	// return history || []
	// 	return this.apiConversationHistory
	// }

	// setApiConversationHistory(history: Anthropic.MessageParam[] | undefined) {
	// 	// await this.updateGlobalState(this.getApiConversationHistoryStateKey(), history)
	// 	this.apiConversationHistory = history || []
	// }

	// addMessageToApiConversationHistory(message: Anthropic.MessageParam): Anthropic.MessageParam[] {
	// 	// const history = await this.getApiConversationHistory()
	// 	// history.push(message)
	// 	// await this.setApiConversationHistory(history)
	// 	// return history
	// 	this.apiConversationHistory.push(message)
	// 	return this.apiConversationHistory
	// }

	async updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]> {
		const history = ((await getGlobalState(this.context, "taskHistory")) as HistoryItem[] | undefined) || []
		const existingItemIndex = history.findIndex((h) => h.id === item.id)
		if (existingItemIndex !== -1) {
			history[existingItemIndex] = item
		} else {
			history.push(item)
		}
		await updateGlobalState(this.context, "taskHistory", history)
		return history
	}

	// private async clearState() {
	// 	this.context.workspaceState.keys().forEach((key) => {
	// 		this.context.workspaceState.update(key, undefined)
	// 	})
	// 	this.context.globalState.keys().forEach((key) => {
	// 		this.context.globalState.update(key, undefined)
	// 	})
	// 	this.context.secrets.delete("apiKey")
	// }

	// secrets

	// Open Graph Data

	async fetchOpenGraphData(url: string) {
		try {
			// Use the fetchOpenGraphData function from link-preview.ts
			const ogData = await fetchOpenGraphData(url)

			// Send the data back to the webview
			await this.postMessageToWebview({
				type: "openGraphData",
				openGraphData: ogData,
				url: url,
			})
		} catch (error) {
			console.error(`Error fetching Open Graph data for ${url}:`, error)
			// Send an error response
			await this.postMessageToWebview({
				type: "openGraphData",
				error: `Failed to fetch Open Graph data: ${error}`,
				url: url,
			})
		}
	}

	// Check if a URL is an image
	async checkIsImageUrl(url: string) {
		try {
			// Check if the URL is an image
			const isImage = await isImageUrl(url)

			// Send the result back to the webview
			await this.postMessageToWebview({
				type: "isImageUrlResult",
				isImage,
				url,
			})
		} catch (error) {
			console.error(`Error checking if URL is an image: ${url}`, error)
			// Send an error response
			await this.postMessageToWebview({
				type: "isImageUrlResult",
				isImage: false,
				url,
			})
		}
	}

	// dev

	async resetState() {
		vscode.window.showInformationMessage("Resetting state...")
		await resetExtensionState(this.context)
		if (this.task) {
			this.task.abortTask()
			this.task = undefined
		}
		vscode.window.showInformationMessage("State reset")
		await this.postStateToWebview()
		await this.postMessageToWebview({
			type: "action",
			action: "chatButtonClicked",
		})
	}

	// OpenRouter Caching Logic (Moved from constructor to avoid async operations there)
	// private async ensureCacheDirectoryExists(): Promise<string> { // Removed duplicate
	// 	const cacheDir = path.join(this.context.globalStorageUri.fsPath, "cache")
	// 	await fs.mkdir(cacheDir, { recursive: true })
	// 	return cacheDir
	// } // Removed duplicate

	async readOpenRouterModels(): Promise<Record<string, ModelInfo> | undefined> {
		const openRouterModelsFilePath = path.join(await this.ensureCacheDirectoryExists(), GlobalFileNames.openRouterModels)
		const fileExists = await fileExistsAtPath(openRouterModelsFilePath)
		if (fileExists) {
			const fileContents = await fs.readFile(openRouterModelsFilePath, "utf8")
			return JSON.parse(fileContents)
		}
		return undefined
	}

	async refreshOpenRouterModels() {
		const cacheDir = await this.ensureCacheDirectoryExists()
		const openRouterModelsFilePath = path.join(cacheDir, GlobalFileNames.openRouterModels)

		let models: Record<string, ModelInfo> = {}
		try {
			const response = await axios.get("https://openrouter.ai/api/v1/models")
			/*
			{
				"id": "anthropic/claude-3.5-sonnet",
				"name": "Anthropic: Claude 3.5 Sonnet",
				"created": 1718841600,
				"description": "Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at:\n\n- Coding: Autonomously writes, edits, and runs code with reasoning and troubleshooting\n- Data science: Augments human data science expertise; navigates unstructured data while using multiple tools for insights\n- Visual processing: excelling at interpreting charts, graphs, and images, accurately transcribing text to derive insights beyond just the text alone\n- Agentic tasks: exceptional tool use, making it great at agentic tasks (i.e. complex, multi-step problem solving tasks that require engaging with other systems)\n\n#multimodal",
				"context_length": 200000,
				"architecture": {
					"modality": "text+image-\u003Etext",
					"tokenizer": "Claude",
					"instruct_type": null
				},
				"pricing": {
					"prompt": "0.000003",
					"completion": "0.000015",
					"image": "0.0048",
					"request": "0"
				},
				"top_provider": {
					"context_length": 200000,
					"max_completion_tokens": 8192,
					"is_moderated": true
				},
				"per_request_limits": null
			},
			*/
			if (response.data?.data) {
				const rawModels = response.data.data
				const parsePrice = (price: any) => {
					if (price) {
						return parseFloat(price) * 1_000_000
					}
					return undefined
				}
				for (const rawModel of rawModels) {
					const modelInfo: ModelInfo = {
						maxTokens: rawModel.top_provider?.max_completion_tokens,
						contextWindow: rawModel.context_length,
						supportsImages: rawModel.architecture?.modality?.includes("image"),
						supportsPromptCache: false,
						inputPrice: parsePrice(rawModel.pricing?.prompt),
						outputPrice: parsePrice(rawModel.pricing?.completion),
						description: rawModel.description,
					}

					switch (rawModel.id) {
						case "anthropic/claude-3-7-sonnet":
						case "anthropic/claude-3-7-sonnet:beta":
						case "anthropic/claude-3.7-sonnet":
						case "anthropic/claude-3.7-sonnet:beta":
						case "anthropic/claude-3.7-sonnet:thinking":
						case "anthropic/claude-3.5-sonnet":
						case "anthropic/claude-3.5-sonnet:beta":
							// NOTE: this needs to be synced with api.ts/openrouter default model info
							modelInfo.supportsComputerUse = true
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = 3.75
							modelInfo.cacheReadsPrice = 0.3
							break
						case "anthropic/claude-3-5-sonnet-20240620":
						case "anthropic/claude-3-5-sonnet-20240620:beta":
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = 3.75
							modelInfo.cacheReadsPrice = 0.3
							break
						case "anthropic/claude-3-5-haiku":
						case "anthropic/claude-3-5-haiku:beta":
						case "anthropic/claude-3-5-haiku-20241022":
						case "anthropic/claude-3-5-haiku-20241022:beta":
						case "anthropic/claude-3.5-haiku":
						case "anthropic/claude-3.5-haiku:beta":
						case "anthropic/claude-3.5-haiku-20241022":
						case "anthropic/claude-3.5-haiku-20241022:beta":
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = 1.25
							modelInfo.cacheReadsPrice = 0.1
							break
						case "anthropic/claude-3-opus":
						case "anthropic/claude-3-opus:beta":
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = 18.75
							modelInfo.cacheReadsPrice = 1.5
							break
						case "anthropic/claude-3-haiku":
						case "anthropic/claude-3-haiku:beta":
							modelInfo.supportsPromptCache = true
							modelInfo.cacheWritesPrice = 0.3
							modelInfo.cacheReadsPrice = 0.03
							break
						case "deepseek/deepseek-chat":
							modelInfo.supportsPromptCache = true
							// see api.ts/deepSeekModels for more info
							modelInfo.inputPrice = 0
							modelInfo.cacheWritesPrice = 0.14
							modelInfo.cacheReadsPrice = 0.014
							break
					}

					models[rawModel.id] = modelInfo
				}
			} else {
				console.error("Invalid response from OpenRouter API")
			}
			// Correctly placed file writing and logging within the try block
			await fs.writeFile(openRouterModelsFilePath, JSON.stringify(models))
			console.log("OpenRouter models fetched and saved", models)
		} catch (error) {
			console.error("Error fetching OpenRouter models:", error)
		}
		// The rest of the function remains outside the try...catch

		await this.postMessageToWebview({
			type: "openRouterModels",
			openRouterModels: models,
		})
		return models
	}
}
