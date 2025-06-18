// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import { setTimeout as setTimeoutPromise } from "node:timers/promises"; // WelcomeView에 불필요
import * as vscode from "vscode"
// import { Logger } from "./services/logging/Logger" // Removed static Logger import
// import { createCaretAPI } from "./exports"
// import { getAllExtensionState, updateGlobalState } from "./core/storage/state"
// import { PersonaManager } from "./core/persona/PersonaManager"
import * as path from "node:path" // Node.js 'path' 모듈을 명시적으로 가져옵니다.
// import "./utils/path" // necessary to have access to String.prototype.toPosix
// import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import { CaretProvider, CARET_SIDEBAR_ID } from "./core/webview/CaretProvider"
import { WebviewProviderType } from "../src/shared/webview/types"
import { caretLogger } from "./utils/caret-logger"
import assert from "node:assert" // Node.js 'assert' 모듈을 가져옵니다.

/*
Built using https://github.com/microsoft/vscode-webview-ui-toolkit

Inspired by
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra

*/

let outputChannel: vscode.OutputChannel

// IS_DEV 와 DEV_WORKSPACE_FOLDER를 맨 위 스코프에서 정의합니다.
const { IS_DEV, DEV_WORKSPACE_FOLDER } = process.env

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log("Caret extension is now active!") // 간단한 콘솔 로그로 변경

	outputChannel = vscode.window.createOutputChannel("Caret")
	context.subscriptions.push(outputChannel)
	outputChannel.appendLine("Caret Output Channel initialized.")

	// Caret 로거 초기화
	caretLogger.setOutputChannel(outputChannel)
	caretLogger.extensionActivated()

	// 테스트 로그
	console.log("🚀 [CARET-TEST] Extension Started - Console Log")
	caretLogger.debug("🚀 Caret Logger Test - Extension Started!", "TEST")
	caretLogger.info("📝 Caret Logger Test - Info Level", "TEST")
	caretLogger.warn("⚠️ Caret Logger Test - Warning Level", "TEST")
	console.log("📝 [CARET-TEST] Logger calls completed")

	const sidebarWebviewProvider = new CaretProvider(context, outputChannel, WebviewProviderType.SIDEBAR)
	// sidebarWebviewProvider.controller.logger.log("Caret extension activated") // WebviewProvider 자체에서 로깅, controller 없음

	// --- Persona Management: uc0c1ud0dc ub3d9uae30ud654 ubc0f ucd08uae30ud654 ---
	// const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
	// let extensionState = await getAllExtensionState(context)
	// if (!extensionState.persona) {
	// 	// persona.jsonuc5d0uc11c uc77duc5b4uc11c uc804uc5ed uc0c1ud0dcuc5d0 uc800uc7a5
	// 	const persona = PersonaManager.loadPersona(workspaceRoot)
	// 	// nulluc774uba74 undefinedub85c ubcc0ud658
	// 	await updateGlobalState(context, "persona", persona || undefined)
	// 	extensionState.persona = persona || undefined
	// }
	// uc9c0uc6d0 uc5b8uc5b4 ubaa9ub85duc774 uc5c6uc73cuba74 uae30ubcf8uac12(en, ko)uc73cub85c uc124uc815
	// if (!extensionState.supportedLanguages) {
	// 	await updateGlobalState(context, "supportedLanguages", ["en", "ko"])
	// 	extensionState.supportedLanguages = ["en", "ko"]
	// }
	// postStateToWebviewub85c ub3d9uae30ud654
	// sidebarWebviewProvider.controller.postStateToWebview()

	if (IS_DEV && IS_DEV === "true") {
		// IS_DEV 문자열 비교
		outputChannel.appendLine("[DEV MODE] Extension activated in development mode.")
	}

	// vscode.commands.executeCommand("setContext", "caret.isDevMode", IS_DEV && IS_DEV === "true") // 복원
	if (IS_DEV && IS_DEV === "true") {
		// IS_DEV 문자열 비교로 변경
		vscode.commands.executeCommand("setContext", "caret.isDevMode", true)
	} else {
		vscode.commands.executeCommand("setContext", "caret.isDevMode", false)
	}

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CARET_SIDEBAR_ID, sidebarWebviewProvider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	outputChannel.appendLine("Caret Sidebar Webview Provider registered.")

	// Persona Management, 각종 버튼 command 등록, DiffView, URI Handler, CodeActionProvider 등은
	// WelcomeView의 최소 기능 구현을 위해 일단 모두 주석 처리합니다.
	// 나중에 필요한 기능을 점진적으로 추가하면서 관련 코드를 복구하거나 새로 작성합니다.

	// 예시: sidebarWebviewProvider.controller.logger.log("Caret extension activated");
	// 위와 같은 WebviewProvider 내부 로직 호출은 WebviewProvider 구현에 따라 필요할 수 있음.
	// 지금은 WebviewProvider가 자체적으로 초기화된다고 가정.

	// --- openCaretInNewTab 및 관련 command 주석 처리 (tabPanelId, setTimeoutPromise, controller 등 사용) ---
	// const openCaretInNewTab = async () => {
	// 	// const tabWebview = new WebviewProvider(context, outputChannel); // 새 인스턴스
	// 	// const panel = vscode.window.createWebviewPanel(WebviewProvider.tabPanelId, "Caret", targetCol, { ... });
	// 	// panel.iconPath = { ... };
	// 	// tabWebview.resolveWebviewView(panel); // 직접 호출하지 않음
	// 	// await setTimeoutPromise(100);
	// 	// await vscode.commands.executeCommand("workbench.action.lockEditorGroup");
	// };
	// context.subscriptions.push(vscode.commands.registerCommand("caret.popoutButtonClicked", openCaretInNewTab));
	// context.subscriptions.push(vscode.commands.registerCommand("caret.openInNewTab", openCaretInNewTab));

	// 테스트 호환성을 위한 기본 명령어 등록
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.plusButtonClicked", async (webview: any) => {
			outputChannel?.appendLine("[DEBUG] plusButtonClicked called")
			// 기본 동작: 웹뷰에 메시지 전송 (CaretProvider에서 처리)
			// TODO: 실제 채팅 기능 구현 시 확장
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.historyButtonClicked", async (webview: any) => {
			outputChannel?.appendLine("[DEBUG] historyButtonClicked called")
			// 기본 동작: 히스토리 표시 (CaretProvider에서 처리)
			// TODO: 실제 히스토리 기능 구현 시 확장
		}),
	)

	// 이하 모든 command 핸들러 (mcpButtonClicked, settingsButtonClicked, historyButtonClicked, accountButtonClicked) 내부의
	// instance?.controller.postMessageToWebview(...) 부분과
	// WebviewProvider.getSidebarInstance(), WebviewProvider.getTabInstances() 호출 부분 주석 처리 필요.
	// DiffViewProvider, URI Handler, addToChat, addTerminalOutputToChat, CodeActionProvider, fixWithCaret command,
	// createCaretAPI 호출, 개발모드 파일 감시 로직 등 모두 주석 처리.

	// telemetryService.shutdown(); // telemetryService 없음
	// return createCaretAPI(outputChannel, sidebarWebviewProvider.controller); // controller 없음, createCaretAPI 없음

	// 예시: sidebarWebviewProvider.controller.logger.log("Caret extension activated");
	// 위와 같은 WebviewProvider 내부 로직 호출은 WebviewProvider 구현에 따라 필요할 수 있음.
	// 지금은 WebviewProvider가 자체적으로 초기화된다고 가정.

	// 이곳에 확장 기능 비활성화 시 정리할 로직을 추가할 수 있습니다.

	// This is a workaround to reload the extension when the source code changes
	// since vscode doesn't support hot reload for extensions

	// 개발 모드 파일 감시 로직 복원
	if (IS_DEV && IS_DEV === "true") {
		assert(DEV_WORKSPACE_FOLDER, "DEV_WORKSPACE_FOLDER must be set in development mode for hot-reloading.")

		const workspaceRootUri = vscode.workspace.workspaceFolders?.[0]?.uri
		let watchPathUri: vscode.Uri

		if (DEV_WORKSPACE_FOLDER) {
			if (path.isAbsolute(DEV_WORKSPACE_FOLDER)) {
				watchPathUri = vscode.Uri.file(DEV_WORKSPACE_FOLDER)
			} else if (workspaceRootUri) {
				watchPathUri = vscode.Uri.joinPath(workspaceRootUri, DEV_WORKSPACE_FOLDER)
			} else {
				// Fallback or error if no absolute path and no workspace folder
				console.error(
					"[DEV MODE] Cannot determine watch path: DEV_WORKSPACE_FOLDER is relative and no workspace is open.",
				)
				// 혹은 적절한 기본 경로를 사용하거나, watcher를 시작하지 않을 수 있습니다.
				// 여기서는 일단 에러를 출력하고 넘어갑니다.
				throw new Error("[DEV MODE] Watch path configuration error.")
			}

			// Watcher는 caret-src 내부를 보도록 수정합니다.
			// workspace.createFileSystemWatcher는 base Uri를 첫 인자로 받을 수 있습니다.
			const watcherPattern = new vscode.RelativePattern(watchPathUri, "caret-src/**/*")
			const watcher = vscode.workspace.createFileSystemWatcher(watcherPattern)

			outputChannel?.appendLine(`[DEV MODE] Watching for file changes in: ${watchPathUri.fsPath}/caret-src`)

			watcher.onDidChange((uri) => {
				const message = `[DEV MODE] File changed: ${uri.fsPath}. Reloading VSCode...`
				if (outputChannel) {
					outputChannel.appendLine(message)
				} else {
					console.info(message)
				}
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			})

			watcher.onDidCreate((uri) => {
				const message = `[DEV MODE] File created: ${uri.fsPath}. Reloading VSCode...`
				if (outputChannel) {
					outputChannel.appendLine(message)
				} else {
					console.info(message)
				}
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			})

			watcher.onDidDelete((uri) => {
				const message = `[DEV MODE] File deleted: ${uri.fsPath}. Reloading VSCode...`
				if (outputChannel) {
					outputChannel.appendLine(message)
				} else {
					console.info(message)
				}
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			})

			// activate 함수 외부이므로 context.subscriptions.push(watcher)를 직접 사용할 수 없습니다.
			// 하지만 watcher는 deactivate 시점에 자동으로 정리될 필요는 없을 수도 있습니다 (프로세스 종료 시 정리).
			// 만약 명시적인 정리가 필요하다면, deactivate 함수에서 접근 가능한 곳에 watcher 인스턴스를 저장해야 합니다.
		} else if (IS_DEV && IS_DEV === "true" && !DEV_WORKSPACE_FOLDER) {
			outputChannel?.appendLine("[DEV MODE] Hot-reloading disabled: DEV_WORKSPACE_FOLDER is not set.")
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// telemetryService.shutdown()
	// Logger.log("Caret extension deactivated") // Cannot log here as controller might be disposed
	outputChannel?.appendLine("Caret extension deactivated.")
	// 이곳에 확장 기능 비활성화 시 정리할 로직을 추가할 수 있습니다.
}

// TODO: Find a solution for automatically removing DEV related content from production builds.
//  This type of code is fine in production to keep. We just will want to remove it from production builds
//  to bring down built asset sizes.
//
// This is a workaround to reload the extension when the source code changes
// since vscode doesn't support hot reload for extensions
// const { IS_DEV, DEV_WORKSPACE_FOLDER } = process.env // 주석 처리

// if (IS_DEV && IS_DEV !== "false") { // 주석 처리
// 	assert(DEV_WORKSPACE_FOLDER, "DEV_WORKSPACE_FOLDER must be set in development") // 주석 처리
// 	const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(DEV_WORKSPACE_FOLDER, "src/**/*"))

// 	watcher.onDidChange(({ scheme, path }) => {
// 		console.info(`${scheme} ${path} changed. Reloading VSCode...`)

// 		vscode.commands.executeCommand("workbench.action.reloadWindow")
// 	})
// } // 주석 처리
