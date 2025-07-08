import * as vscode from "vscode"
import axios from "axios"
import * as fs from "fs"
import * as path from "path"
import { WebviewProvider as ClineWebviewProvider } from "../../../src/core/webview/index"
import { WebviewProviderType } from "../../../src/shared/webview/types"
import { getNonce } from "../../../src/core/webview/getNonce"
import { getUri } from "../../../src/core/webview/getUri"
import { getTheme } from "../../utils/caretGetTheme"
import { sendThemeEvent } from "../../../src/core/controller/ui/subscribeToTheme"
import { caretLogger, logCaretWelcome } from "../../utils/caret-logger"

export const CARET_SIDEBAR_ID = "caret.SidebarProvider"
export const CARET_TAB_PANEL_ID = "caret.TabPanelProvider"

export class CaretProvider extends ClineWebviewProvider {
	// CARET MODIFICATION: 싱글톤 패턴을 위한 정적 인스턴스 변수 추가
	private static instance: CaretProvider | null = null

	// 페르소나 이미지 데이터 URI 저장용 변수
	private _personaProfileDataUri: string = ""
	private _personaThinkingDataUri: string = ""

	constructor(
		public override readonly context: vscode.ExtensionContext,
		outputChannel: vscode.OutputChannel,
		providerType: WebviewProviderType = WebviewProviderType.SIDEBAR,
	) {
		super(context, outputChannel, providerType)
		caretLogger.info(`CaretProvider constructor called for ${providerType}.`)
		caretLogger.setOutputChannel(outputChannel)
		caretLogger.extensionActivated()
		logCaretWelcome()

		// CARET MODIFICATION: 싱글톤 인스턴스 설정
		CaretProvider.instance = this
	}

	// CARET MODIFICATION: 싱글톤 인스턴스 접근자 메서드
	public static getInstance(): CaretProvider | null {
		return CaretProvider.instance
	}

	public override async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		caretLogger.info(`resolveWebviewView started for ${this.providerType} with client ID: ${this.getClientId()}`)
		this.view = webviewView
		const isDev = this.context.extensionMode === vscode.ExtensionMode.Development

		// 1. Set webview options, adding Vite HMR server for development mode.
		const localResourceRoots = [this.context.extensionUri]
		if (isDev) {
			let localServerPort = "5173" // Default Vite port
			try {
				const portFilePath = path.join(this.context.extensionPath, "webview-ui", ".vite-port")
				if (fs.existsSync(portFilePath)) {
					localServerPort = fs.readFileSync(portFilePath, "utf-8").trim()
				}
			} catch (error) {
				caretLogger.error("Error reading .vite-port file", error)
			}
			localResourceRoots.push(vscode.Uri.parse(`http://localhost:${localServerPort}`))
		}
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: localResourceRoots,
		}

		// 2. Set HTML content. This will call the overridden getHMRHtmlContent or getHtmlContent.
		webviewView.webview.html = isDev
			? await this.getHMRHtmlContent(webviewView.webview)
			: this.getHtmlContent(webviewView.webview)

		// 3. Set up listeners using the now-accessible `protected disposables`.
		// This correctly wires up the webview to the controller.
		webviewView.webview.onDidReceiveMessage(
			(message) => this.controller.handleWebviewMessage(message),
			null,
			this.disposables,
		)

		// Visibility change listener
		if ("onDidChangeViewState" in webviewView) {
			webviewView.onDidChangeViewState(
				() => {
					if (this.view?.visible) {
						this.controller.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.disposables,
			)
		} else if ("onDidChangeVisibility" in webviewView) {
			webviewView.onDidChangeVisibility(
				() => {
					if (this.view?.visible) {
						this.controller.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.disposables,
			)
		}

		// Dispose listener
		webviewView.onDidDispose(() => this.dispose(), null, this.disposables)

		// Configuration change listener for theme and other settings
		vscode.workspace.onDidChangeConfiguration(
			async (e) => {
				if (e.affectsConfiguration("workbench.colorTheme")) {
					const theme = await getTheme()
					if (theme) {
						await sendThemeEvent(JSON.stringify(theme))
					}
				}
				if (e.affectsConfiguration("caret.mcpMarketplace.enabled")) {
					await this.controller.postStateToWebview()
				}
			},
			null,
			this.disposables,
		)

		// 4. Finalize initialization.
		this.controller.clearTask()
		this.controller.postStateToWebview() // Ensure webview has the latest state on load.
		this.outputChannel.appendLine("Caret Webview view resolved successfully.")
		caretLogger.info(
			`resolveWebviewView finished for ${this.providerType} with client ID: ${this.getClientId()}. Controller is ready.`,
		)
	}

	protected override getHtmlContent(webview: vscode.Webview): string {
		// Get the original HTML content
		const originalHtml = super.getHtmlContent(webview)
		let caretBannerDataUri = ""
		let caretIconDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			// CARET MODIFICATION: 배너 이미지를 caret-main-banner.webp로 변경
			caretLogger.info(`[CaretProvider] Attempting to load banner from: ${bannerPath}`)
			if (fs.existsSync(bannerPath)) {
				const fileBuffer = fs.readFileSync(bannerPath)
				caretBannerDataUri = `data:image/webp;base64,${fileBuffer.toString("base64")}`
				caretLogger.info(`[CaretProvider] Banner loaded successfully, size: ${fileBuffer.length} bytes`)
			} else {
				caretLogger.error(`[CaretProvider] Banner file not found: ${bannerPath}`)
			}

			const iconPath = path.join(this.context.extensionPath, "caret-assets", "icons", "icon.png")
			caretLogger.info(`[CaretProvider] Attempting to load caret icon from: ${iconPath}`)
			if (fs.existsSync(iconPath)) {
				const iconBuffer = fs.readFileSync(iconPath)
				caretIconDataUri = `data:image/png;base64,${iconBuffer.toString("base64")}`
				caretLogger.info(`[CaretProvider] Caret icon loaded successfully, size: ${iconBuffer.length} bytes`)
			} else {
				caretLogger.error(`[CaretProvider] Caret icon file not found: ${iconPath}`)
			}
		} catch (e) {
			// CARET MODIFICATION: 오류 로깅 추가
			caretLogger.error(`[CaretProvider] Error loading banner image:`, e)
		}

		// CARET MODIFICATION: 페르소나 이미지 로딩 추가
		let personaProfileDataUri = this._personaProfileDataUri || ""
		let personaThinkingDataUri = this._personaThinkingDataUri || ""

		// 저장된 이미지가 없으면 파일에서 로드
		if (!personaProfileDataUri || !personaThinkingDataUri) {
			try {
				const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
				const profilePath = path.join(personaDir, "agent_profile.png")
				const thinkingPath = path.join(personaDir, "agent_thinking.png")

				if (fs.existsSync(profilePath)) {
					const profileBuffer = fs.readFileSync(profilePath)
					personaProfileDataUri = `data:image/png;base64,${profileBuffer.toString("base64")}`
					this._personaProfileDataUri = personaProfileDataUri
					caretLogger.debug(`[CaretProvider] Persona profile loaded, size: ${profileBuffer.length} bytes`)
				}

				if (fs.existsSync(thinkingPath)) {
					const thinkingBuffer = fs.readFileSync(thinkingPath)
					personaThinkingDataUri = `data:image/png;base64,${thinkingBuffer.toString("base64")}`
					this._personaThinkingDataUri = personaThinkingDataUri
					caretLogger.debug(`[CaretProvider] Persona thinking loaded, size: ${thinkingBuffer.length} bytes`)
				}
			} catch (e) {
				caretLogger.debug(`[CaretProvider] No persona images found or error loading:`, e)
			}
		}

		// Update the title
		let updatedHtml = originalHtml.replace(/<title>Cline<\/title>/, `<title>Caret</title>`)

		// Add caret banner and persona images for the UI
		updatedHtml = updatedHtml.replace(
			/window\.clineClientId = "[^"]*";/,
			`window.clineClientId = "\${this.clientId}";
                    window.caretBanner = "${caretBannerDataUri}";
                    window.caretIcon = "${caretIconDataUri}";
                    window.personaProfile = "${personaProfileDataUri}";
                    window.personaThinking = "${personaThinkingDataUri}";`,
		)

		// Update Content-Security-Policy to allow data: URLs and asset URLs for persona images
		updatedHtml = updatedHtml.replace(/content="([^"]*)"/, (match, csp) => {
			// Only modify the img-src policy
			const policies = csp.split("; ")
			const updatedPolicies = policies.map((policy: string) => {
				if (policy.startsWith("img-src")) {
					// CARET MODIFICATION: 이미지 로딩을 위한 CSP 설정 강화
					const imgSrcValue = `img-src 'self' ${webview.cspSource} https://*.vscode-cdn.net https: data: blob: asset: vscode-resource: *`
					console.log("[CaretProvider] Setting CSP img-src:", imgSrcValue)
					return imgSrcValue
				}
				return policy
			})
			return `content="${updatedPolicies.join("; ")}"`
		})

		return updatedHtml
	}

	public override async dispose() {
		caretLogger.info(`Disposing CaretProvider for ${this.providerType} with client ID: ${this.getClientId()}.`)
		await super.dispose()
	}

	protected override async getHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		// Get the original HMR HTML content
		const originalHtml = await super.getHMRHtmlContent(webview)
		let caretBannerDataUri = ""
		let caretIconDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			// CARET MODIFICATION: 배너 이미지 로딩 디버깅 추가
			caretLogger.info(`[CaretProvider] HMR - Attempting to load banner from: ${bannerPath}`)
			if (fs.existsSync(bannerPath)) {
				const fileBuffer = fs.readFileSync(bannerPath)
				caretBannerDataUri = `data:image/webp;base64,${fileBuffer.toString("base64")}`
				caretLogger.info(`[CaretProvider] HMR - Banner loaded successfully, size: ${fileBuffer.length} bytes`)
			} else {
				caretLogger.error(`[CaretProvider] HMR - Banner file not found: ${bannerPath}`)
			}

			const iconPath = path.join(this.context.extensionPath, "caret-assets", "icons", "icon.png")
			caretLogger.info(`[CaretProvider] HMR - Attempting to load caret icon from: ${iconPath}`)
			if (fs.existsSync(iconPath)) {
				const iconBuffer = fs.readFileSync(iconPath)
				caretIconDataUri = `data:image/png;base64,${iconBuffer.toString("base64")}`
				caretLogger.info(`[CaretProvider] HMR - Caret icon loaded successfully, size: ${iconBuffer.length} bytes`)
			} else {
				caretLogger.error(`[CaretProvider] HMR - Caret icon file not found: ${iconPath}`)
			}
		} catch (e) {
			// CARET MODIFICATION: 오류 로깅 추가
			caretLogger.error(`[CaretProvider] HMR - Error loading banner image:`, e)
		}

		// CARET MODIFICATION: 페르소나 이미지 로딩 추가 (HMR 모드)
		let personaProfileDataUri = this._personaProfileDataUri || ""
		let personaThinkingDataUri = this._personaThinkingDataUri || ""

		// 저장된 이미지가 없으면 파일에서 로드
		if (!personaProfileDataUri || !personaThinkingDataUri) {
			try {
				const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
				const profilePath = path.join(personaDir, "agent_profile.png")
				const thinkingPath = path.join(personaDir, "agent_thinking.png")

				if (fs.existsSync(profilePath)) {
					const profileBuffer = fs.readFileSync(profilePath)
					personaProfileDataUri = `data:image/png;base64,${profileBuffer.toString("base64")}`
					this._personaProfileDataUri = personaProfileDataUri
					caretLogger.debug(`[CaretProvider] HMR - Persona profile loaded, size: ${profileBuffer.length} bytes`)
				}

				if (fs.existsSync(thinkingPath)) {
					const thinkingBuffer = fs.readFileSync(thinkingPath)
					personaThinkingDataUri = `data:image/png;base64,${thinkingBuffer.toString("base64")}`
					this._personaThinkingDataUri = personaThinkingDataUri
					caretLogger.debug(`[CaretProvider] HMR - Persona thinking loaded, size: ${thinkingBuffer.length} bytes`)
				}
			} catch (e) {
				caretLogger.debug(`[CaretProvider] HMR - No persona images found or error loading:`, e)
			}
		}

		// Update the title
		let updatedHtml = originalHtml.replace(/<title>Cline<\/title>/, `<title>Caret</title>`)

		// Add caret banner and persona images for the UI
		updatedHtml = updatedHtml.replace(
			/window\.clineClientId = "[^"]*";/,
			`window.clineClientId = "\${this.clientId}";
						window.caretBanner = "${caretBannerDataUri}";
						window.caretIcon = "${caretIconDataUri}";
						window.personaProfile = "${personaProfileDataUri}";
						window.personaThinking = "${personaThinkingDataUri}";`,
		)

		// Update Content-Security-Policy for HMR mode to allow data: URLs and asset URLs
		const cspRegex = /const csp = \[(.*?)\]/s // Use 's' flag for multiline matching
		if (cspRegex.test(updatedHtml)) {
			updatedHtml = updatedHtml.replace(cspRegex, (match, cspContent) => {
				// Find and replace the img-src line
				const updatedCspContent = cspContent.replace(
					/`img-src [^`]+`/,
					`\`img-src 'self' \${webview.cspSource} https://*.vscode-cdn.net https: data: blob: asset: vscode-resource:\``,
				)
				return `const csp = [${updatedCspContent}]`
			})
		}

		return updatedHtml
	}

	/**
	 * CARET MODIFICATION: 페르소나 이미지 변경 알림 메서드
	 * 페르소나 이미지가 변경될 때 웹뷰에 알리고 전역 변수를 업데이트합니다.
	 * 이 메서드는 PersonaInitializer와 컨트롤러의 이미지 업로드 핸들러에서 호출됩니다.
	 */
	public notifyPersonaImagesChanged(): void {
		try {
			// 1. globalStorage에서 최신 이미지 로드
			const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			let personaProfileDataUri = ""
			let personaThinkingDataUri = ""

			if (fs.existsSync(profilePath)) {
				const profileBuffer = fs.readFileSync(profilePath)
				personaProfileDataUri = `data:image/png;base64,${profileBuffer.toString("base64")}`
				this._personaProfileDataUri = personaProfileDataUri
				caretLogger.debug(`[CaretProvider] Persona profile updated, size: ${profileBuffer.length} bytes`)
			}

			if (fs.existsSync(thinkingPath)) {
				const thinkingBuffer = fs.readFileSync(thinkingPath)
				personaThinkingDataUri = `data:image/png;base64,${thinkingBuffer.toString("base64")}`
				this._personaThinkingDataUri = personaThinkingDataUri
				caretLogger.debug(`[CaretProvider] Persona thinking updated, size: ${thinkingBuffer.length} bytes`)
			}

			// 2. 웹뷰에 메시지 전송
			if (personaProfileDataUri && personaThinkingDataUri) {
				this.controller.postMessageToWebview({
					type: "RESPONSE_PERSONA_IMAGES",
					payload: {
						avatarUri: personaProfileDataUri,
						thinkingAvatarUri: personaThinkingDataUri,
					},
				})

				caretLogger.info("[CaretProvider] 페르소나 이미지 업데이트 알림 전송 완료")
			} else {
				caretLogger.warn("[CaretProvider] 페르소나 이미지를 찾을 수 없어 업데이트 알림을 보내지 않았습니다.")
			}
		} catch (e) {
			caretLogger.error(`[CaretProvider] 페르소나 이미지 업데이트 알림 실패: ${e}`)
		}
	}
}
