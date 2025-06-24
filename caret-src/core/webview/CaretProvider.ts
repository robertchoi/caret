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
		const originalHtml = super.getHtmlContent(webview)
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			caretBannerDataUri = `data:image/webp;base64,${fs.readFileSync(bannerPath).toString("base64")}`
		} catch (e) {
			/* ignore */
		}

		let updatedHtml = originalHtml.replace(/<title>Cline<\/title>/, `<title>Caret</title>`)
		updatedHtml = updatedHtml.replace(
			`window.clineClientId = "\${this.clientId}";`,
			`window.clineClientId = "\${this.clientId}";\n                    window.caretBanner = "${caretBannerDataUri}";`,
		)
		return updatedHtml
	}

	public override async dispose() {
		caretLogger.info(`Disposing CaretProvider for ${this.providerType} with client ID: ${this.getClientId()}.`)
		await super.dispose()
	}

	protected override async getHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		const originalHtml = await super.getHMRHtmlContent(webview)
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			caretBannerDataUri = `data:image/webp;base64,${fs.readFileSync(bannerPath).toString("base64")}`
		} catch (e) {
			/* ignore */
		}

		let updatedHtml = originalHtml.replace(/<title>Cline<\/title>/, `<title>Caret</title>`)
		updatedHtml = updatedHtml.replace(
			`window.clineClientId = "\${this.clientId}";`,
			`window.clineClientId = "\${this.clientId}";\n\t\t\t\t\t\twindow.caretBanner = "${caretBannerDataUri}";`,
		)
		return updatedHtml
	}
}
