import * as vscode from "vscode"
import * as path from "node:path"
import assert from "node:assert"
import { CaretProvider, CARET_SIDEBAR_ID, CARET_TAB_PANEL_ID } from "./core/webview/CaretProvider"
import { WebviewProviderType } from "../src/shared/webview/types"
import { caretLogger } from "./utils/caret-logger"
import { Logger } from "../src/services/logging/Logger"
import { sendMcpButtonClickedEvent } from "../src/core/controller/ui/subscribeToMcpButtonClicked"
import { sendHistoryButtonClickedEvent } from "../src/core/controller/ui/subscribeToHistoryButtonClicked"
import { sendAccountButtonClickedEvent } from "../src/core/controller/ui/subscribeToAccountButtonClicked"
import { sendSettingsButtonClickedEvent } from "../src/core/controller/ui/subscribeToSettingsButtonClicked"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"

let outputChannel: vscode.OutputChannel

const { IS_DEV, DEV_WORKSPACE_FOLDER } = process.env

export async function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Caret")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	caretLogger.setOutputChannel(outputChannel)
	caretLogger.extensionActivated()

	const sidebarWebviewProvider = new CaretProvider(context, outputChannel, WebviewProviderType.SIDEBAR)

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CARET_SIDEBAR_ID, sidebarWebviewProvider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	// --- COMMAND REGISTRATION ---

	const openCaretInNewTab = async () => {
		const tabWebview = new CaretProvider(context, outputChannel, WebviewProviderType.TAB)
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))
		const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
		if (!hasVisibleEditors) {
			await vscode.commands.executeCommand("workbench.action.newGroupRight")
		}
		const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

		const panel = vscode.window.createWebviewPanel(CARET_TAB_PANEL_ID, "Caret", targetCol, {
			enableScripts: true,
			retainContextWhenHidden: true,
		})
		panel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "caret-assets", "icons", "icon.svg"),
			dark: vscode.Uri.joinPath(context.extensionUri, "caret-assets", "icons", "icon_w.svg"),
		}
		tabWebview.resolveWebviewView(panel)
		await setTimeoutPromise(100)
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.plusButtonClicked", async () => {
			const instance = CaretProvider.getSidebarInstance()
			if (instance) {
				await instance.controller.clearTask()
				await instance.controller.postStateToWebview()
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.mcpButtonClicked", () => sendMcpButtonClickedEvent(WebviewProviderType.SIDEBAR)),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.historyButtonClicked", () =>
			sendHistoryButtonClickedEvent(WebviewProviderType.SIDEBAR),
		),
	)

	context.subscriptions.push(vscode.commands.registerCommand("caret.popoutButtonClicked", openCaretInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("caret.openInNewTab", openCaretInNewTab))

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.accountButtonClicked", () =>
			sendAccountButtonClickedEvent(WebviewProviderType.SIDEBAR),
		),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.settingsButtonClicked", () =>
			sendSettingsButtonClickedEvent(WebviewProviderType.SIDEBAR),
		),
	)

	// --- DEV MODE ---
	if (IS_DEV === "true") {
		assert(DEV_WORKSPACE_FOLDER, "DEV_WORKSPACE_FOLDER must be set in development mode for hot-reloading.")
		const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(DEV_WORKSPACE_FOLDER, "src/**/*"))
		const reload = (uri: vscode.Uri) => {
			outputChannel.appendLine(`[DEV MODE] File changed: ${uri.fsPath}. Reloading...`)
			vscode.commands.executeCommand("workbench.action.reloadWindow")
		}
		watcher.onDidChange(reload)
		watcher.onDidCreate(reload)
		watcher.onDidDelete(reload)
		context.subscriptions.push(watcher)
	}
}

export function deactivate() {
	outputChannel?.appendLine("Caret extension deactivated.")
}
