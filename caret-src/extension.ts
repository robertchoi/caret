import * as vscode from "vscode"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"
import { Logger } from "../src/services/logging/Logger"
import { CaretProvider, CARET_SIDEBAR_ID, CARET_TAB_PANEL_ID } from "./core/webview/CaretProvider"
import { sendSettingsButtonClickedEvent } from "../src/core/controller/ui/subscribeToSettingsButtonClicked"
import { WebviewProviderType } from "../src/shared/webview/types"
import { caretLogger } from "./utils/caret-logger"

let outputChannel: vscode.OutputChannel

export async function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Caret")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	caretLogger.setOutputChannel(outputChannel)
	caretLogger.info("Caret extension activating...")
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
			caretLogger.info("Command 'caret.plusButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				await instance.controller.clearTask()
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.mcpButtonClicked", () => {
			caretLogger.info("Command 'caret.mcpButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				instance.controller.handleMcpButtonClick()
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.historyButtonClicked", () => {
			caretLogger.info("Command 'caret.historyButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				instance.controller.handleHistoryButtonClick()
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	context.subscriptions.push(vscode.commands.registerCommand("caret.popoutButtonClicked", openCaretInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("caret.openInNewTab", openCaretInNewTab))

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.accountButtonClicked", () => {
			caretLogger.info("Command 'caret.accountButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				instance.controller.handleAccountButtonClick()
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("caret.settingsButtonClicked", () => {
			caretLogger.info("Command 'caret.settingsButtonClicked' triggered. Sending event.")
			sendSettingsButtonClickedEvent()
		}),
	)
	caretLogger.info("Caret extension activated and all commands registered.")
}

export function deactivate() {
	outputChannel?.appendLine("Caret extension deactivated.")
}
