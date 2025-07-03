import * as vscode from "vscode"
import { setTimeout as setTimeoutPromise } from "node:timers/promises"
import { Logger } from "../src/services/logging/Logger"
import { CaretProvider, CARET_SIDEBAR_ID, CARET_TAB_PANEL_ID } from "./core/webview/CaretProvider"
import { sendSettingsButtonClickedEvent } from "../src/core/controller/ui/subscribeToSettingsButtonClicked"
import { sendChatButtonClickedEvent } from "../src/core/controller/ui/subscribeToChatButtonClicked"
import { sendMcpButtonClickedEvent } from "../src/core/controller/ui/subscribeToMcpButtonClicked"
import { sendHistoryButtonClickedEvent } from "../src/core/controller/ui/subscribeToHistoryButtonClicked"
import { sendAccountButtonClickedEvent } from "../src/core/controller/ui/subscribeToAccountButtonClicked"
import { WebviewProviderType as WebviewProviderTypeEnum } from "../src/shared/proto/ui"
import { WebviewProviderType } from "../src/shared/webview/types"
import { caretLogger } from "./utils/caret-logger"
import { CaretSystemPrompt } from "./core/prompts/CaretSystemPrompt"
import { CaretResponses } from "./core/prompts/CaretResponses"
import { DIFF_VIEW_URI_SCHEME } from "../src/integrations/editor/DiffViewProvider"

let outputChannel: vscode.OutputChannel

export async function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Caret")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	caretLogger.setOutputChannel(outputChannel)
	caretLogger.info("Caret extension activating...")
	caretLogger.extensionActivated()

	// CARET MODIFICATION: Register TextDocumentContentProvider for diff editor support
	// This fixes "Failed to open diff editor" error by providing content for cline-diff:// URIs
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider))
	caretLogger.success("Diff editor TextDocumentContentProvider registered", "SYSTEM")

	// CARET MODIFICATION: Initialize CaretSystemPrompt singleton with extensionPath
	// This resolves the extensionPath dependency for JSON-based system prompt generation
	try {
		const extensionPath = context.extensionPath
		CaretSystemPrompt.getInstance(extensionPath)
		caretLogger.success("CaretSystemPrompt initialized with JSON-based prompt system", "SYSTEM")
	} catch (error) {
		caretLogger.error("Failed to initialize CaretSystemPrompt", "SYSTEM")
		caretLogger.error(error.toString(), "SYSTEM")
	}

	// CARET MODIFICATION: Initialize CaretResponses with extensionPath
	// This loads RESPONSES.json and enables cached response retrieval
	try {
		await CaretResponses.initialize(context.extensionPath)
		caretLogger.success("CaretResponses initialized with JSON-based response system", "SYSTEM")
	} catch (error) {
		caretLogger.error("Failed to initialize CaretResponses", "SYSTEM")
		caretLogger.error(error.toString(), "SYSTEM")
	}

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

	// CARET MODIFICATION: Use Cline's original plusButtonClicked pattern with proper task management
	// Original backed up as extension-ts.cline - inherit clearTask + postState + sendEvent pattern
	context.subscriptions.push(
		vscode.commands.registerCommand("caret.plusButtonClicked", async () => {
			caretLogger.info("Command 'caret.plusButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				try {
					// Follow Cline original pattern: clearTask + postState + sendChatEvent
					await instance.controller.clearTask()
					await instance.controller.postStateToWebview()
					await sendChatButtonClickedEvent(instance.controller.id)
					caretLogger.success("Plus button action completed successfully", "UI")
				} catch (error) {
					caretLogger.error("Failed to execute plus button action", "UI")
					caretLogger.error(error.toString(), "UI")
					throw error
				}
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	// CARET MODIFICATION: Use Cline's original mcpButtonClicked pattern with proper event streaming
	// Inherit sendMcpButtonClickedEvent instead of deprecated controller method
	context.subscriptions.push(
		vscode.commands.registerCommand("caret.mcpButtonClicked", async () => {
			caretLogger.info("Command 'caret.mcpButtonClicked' triggered.")
			try {
				// Follow Cline original pattern: direct event streaming
				await sendMcpButtonClickedEvent(WebviewProviderTypeEnum.SIDEBAR)
				caretLogger.success("MCP button event sent successfully", "UI")
			} catch (error) {
				caretLogger.error("Failed to send MCP button event", "UI")
				caretLogger.error(error.toString(), "UI")
			}
		}),
	)

	// CARET MODIFICATION: Use Cline's original historyButtonClicked pattern with proper event streaming
	// Inherit sendHistoryButtonClickedEvent instead of deprecated controller method
	context.subscriptions.push(
		vscode.commands.registerCommand("caret.historyButtonClicked", async () => {
			caretLogger.info("Command 'caret.historyButtonClicked' triggered.")
			try {
				// Follow Cline original pattern: direct event streaming with webview type
				await sendHistoryButtonClickedEvent(WebviewProviderTypeEnum.SIDEBAR)
				caretLogger.success("History button event sent successfully", "UI")
			} catch (error) {
				caretLogger.error("Failed to send history button event", "UI")
				caretLogger.error(error.toString(), "UI")
			}
		}),
	)

	context.subscriptions.push(vscode.commands.registerCommand("caret.popoutButtonClicked", openCaretInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("caret.openInNewTab", openCaretInNewTab))

	// CARET MODIFICATION: Use Cline's original accountButtonClicked pattern with controller ID targeting
	// Inherit sendAccountButtonClickedEvent instead of deprecated controller method
	context.subscriptions.push(
		vscode.commands.registerCommand("caret.accountButtonClicked", async () => {
			caretLogger.info("Command 'caret.accountButtonClicked' triggered.")
			const instance = CaretProvider.getVisibleInstance()
			if (instance) {
				caretLogger.info(
					`Found visible instance with client ID: ${instance.getClientId()}. Controller exists: ${!!instance.controller}`,
				)
				try {
					// Follow Cline original pattern: send event to specific controller
					await sendAccountButtonClickedEvent(instance.controller.id)
					caretLogger.success("Account button event sent successfully", "UI")
				} catch (error) {
					caretLogger.error("Failed to send account button event", "UI")
					caretLogger.error(error.toString(), "UI")
				}
			} else {
				caretLogger.warn("No visible Caret instance found.")
			}
		}),
	)

	// CARET MODIFICATION: Settings button already properly inherits Cline's sendSettingsButtonClickedEvent
	context.subscriptions.push(
		vscode.commands.registerCommand("caret.settingsButtonClicked", async () => {
			caretLogger.info("Command 'caret.settingsButtonClicked' triggered. Sending event.")
			try {
				await sendSettingsButtonClickedEvent(WebviewProviderTypeEnum.SIDEBAR)
				caretLogger.success("Settings button event sent successfully", "UI")
			} catch (error) {
				caretLogger.error("Failed to send settings button event", "UI")
				caretLogger.error(error.toString(), "UI")
			}
		}),
	)
	caretLogger.info("Caret extension activated and all commands registered.")
}

export function deactivate() {
	outputChannel?.appendLine("Caret extension deactivated.")
}
