import * as vscode from "vscode"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { readFile } from "fs/promises"
import * as path from "path"
import * as fs from "fs"

import { getNonce } from "../../../src/core/webview/getNonce"
import { getUri } from "../../../src/core/webview/getUri"
import { Controller } from "../../../src/core/controller/index"
import { findLast } from "../../../src/shared/array"
import { WebviewProviderType } from "../../../src/shared/webview/types"
import { sendThemeEvent } from "../../../src/core/controller/ui/subscribeToTheme"
import { getTheme } from "../../utils/caretGetTheme"
import { caretLogger, logCaretWelcome } from "../../utils/caret-logger"

export const CARET_SIDEBAR_ID = "caret.SidebarProvider"
export const CARET_TAB_PANEL_ID = "caret.TabPanelProvider"

export class CaretProvider implements vscode.WebviewViewProvider {
	public static readonly sideBarId = CARET_SIDEBAR_ID
	public static readonly tabPanelId = CARET_TAB_PANEL_ID
	private static activeInstances: Set<CaretProvider> = new Set()
	private static clientIdMap = new Map<CaretProvider, string>()
	public view?: vscode.WebviewView | vscode.WebviewPanel
	private disposables: vscode.Disposable[] = []
	controller: Controller
	private clientId: string

	constructor(
		readonly context: vscode.ExtensionContext,
		private readonly outputChannel: vscode.OutputChannel,
		private readonly providerType: WebviewProviderType = WebviewProviderType.SIDEBAR,
	) {
		CaretProvider.activeInstances.add(this)
		this.clientId = uuidv4()
		CaretProvider.clientIdMap.set(this, this.clientId)
		this.controller = new Controller(context, outputChannel, (message) => this.view?.webview.postMessage(message))
		caretLogger.setOutputChannel(outputChannel)
		caretLogger.extensionActivated()
		logCaretWelcome()
	}

	public getClientId(): string {
		return this.clientId
	}

	public static getClientIdForInstance(instance: CaretProvider): string | undefined {
		return CaretProvider.clientIdMap.get(instance)
	}

	async dispose() {
		if (this.view && "dispose" in this.view) {
			this.view.dispose()
		}
		while (this.disposables.length) {
			const x = this.disposables.pop()
			if (x) {
				x.dispose()
			}
		}
		await this.controller.dispose()
		CaretProvider.activeInstances.delete(this)
		CaretProvider.clientIdMap.delete(this)
	}

	public static getVisibleInstance(): CaretProvider | undefined {
		return findLast(Array.from(this.activeInstances), (instance) => instance.view?.visible === true)
	}

	public static getAllInstances(): CaretProvider[] {
		return Array.from(this.activeInstances)
	}

	public static getSidebarInstance() {
		return Array.from(this.activeInstances).find((instance) => instance.view && "onDidChangeVisibility" in instance.view)
	}

	public static getTabInstances(): CaretProvider[] {
		return Array.from(this.activeInstances).filter((instance) => instance.view && "onDidChangeViewState" in instance.view)
	}

	public static async disposeAllInstances() {
		const instances = Array.from(this.activeInstances)
		for (const instance of instances) {
			await instance.dispose()
		}
	}

	async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		this.view = webviewView
		const isDev = this.context.extensionMode === vscode.ExtensionMode.Development

		const localResourceRoots = [this.context.extensionUri]
		if (isDev) {
			let localServerPort = "5173"
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

		webviewView.webview.html = isDev
			? await this.getHMRHtmlContent(webviewView.webview)
			: this.getHtmlContent(webviewView.webview)

		webviewView.webview.onDidReceiveMessage(
			(message) => this.controller.handleWebviewMessage(message),
			null,
			this.disposables,
		)

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

		webviewView.onDidDispose(() => this.dispose(), null, this.disposables)

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

		this.controller.clearTask()
		this.controller.postStateToWebview()
		this.outputChannel.appendLine("Caret Webview view resolved")
	}

	private getHtmlContent(webview: vscode.Webview): string {
		const stylesUri = getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.css"])
		const scriptUri = getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.js"])
		const codiconsUri = getUri(webview, this.context.extensionUri, [
			"node_modules",
			"@vscode",
			"codicons",
			"dist",
			"codicon.css",
		])
		const katexCssUri = getUri(webview, this.context.extensionUri, [
			"webview-ui",
			"node_modules",
			"katex",
			"dist",
			"katex.min.css",
		])
		const nonce = getNonce()
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			caretBannerDataUri = `data:image/webp;base64,${fs.readFileSync(bannerPath).toString("base64")}`
		} catch (e) {
			/* ignore */
		}

		return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<link rel="stylesheet" type="text/css" href="${stylesUri}">
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="${katexCssUri}" rel="stylesheet" />
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com; font-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
				<title>Caret</title>
				</head>
				<body>
					<noscript>You need to enable JavaScript to run this app.</noscript>
					<div id="root"></div>
					 <script type="text/javascript" nonce="${nonce}">
						window.WEBVIEW_PROVIDER_TYPE = ${JSON.stringify(this.providerType)};
						window.clineClientId = "${this.clientId}";
						window.caretBanner = "${caretBannerDataUri}";
					</script>
					<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
				</body>
			</html>
		`
	}

	private async getHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		let localServerPort = "5173"
		try {
			const portFilePath = path.join(this.context.extensionPath, "webview-ui", ".vite-port")
			if (fs.existsSync(portFilePath)) {
				localServerPort = fs.readFileSync(portFilePath, "utf-8").trim()
			}
		} catch (error) {
			caretLogger.error("Error reading .vite-port file.", error)
		}

		const localServerUrl = `http://localhost:${localServerPort}`
		const localWsServerUrl = `ws://localhost:${localServerPort}`

		try {
			await axios.get(localServerUrl)
		} catch (error) {
			vscode.window.showErrorMessage("Caret: Vite dev server is not running. Please run 'npm run dev:webview'.")
			return this.getHtmlContent(webview)
		}

		const nonce = getNonce()
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			caretBannerDataUri = `data:image/webp;base64,${fs.readFileSync(bannerPath).toString("base64")}`
		} catch (e) {
			/* ignore */
		}

		const reactRefresh = /*html*/ `
			<script nonce="${nonce}" type="module">
				import RefreshRuntime from "${localServerUrl}/@react-refresh"
				RefreshRuntime.injectIntoGlobalHook(window)
				window.$RefreshReg$ = () => {}
				window.$RefreshSig$ = () => (type) => type
				window.__vite_plugin_react_preamble_installed__ = true
			</script>
		`

		return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>Caret - AI Development Partner (Dev)</title>
					<meta http-equiv="Content-Security-Policy" content="
						default-src 'none';
						connect-src ${webview.cspSource} ${localWsServerUrl} ${localServerUrl} https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com;
						font-src ${webview.cspSource} data:;
						style-src 'unsafe-inline' ${webview.cspSource} ${localServerUrl};
						img-src ${webview.cspSource} https: data: ${localServerUrl};
						script-src 'unsafe-inline' 'unsafe-eval' ${localServerUrl} 'nonce-${nonce}';
					">
					<link href="${getUri(webview, this.context.extensionUri, ["node_modules", "@vscode", "codicons", "dist", "codicon.css"])}" rel="stylesheet" />
					<link href="${getUri(webview, this.context.extensionUri, ["webview-ui", "node_modules", "katex", "dist", "katex.min.css"])}" rel="stylesheet" />
				</head>
				<body>
					<div id="root"></div>
					<script type="text/javascript" nonce="${nonce}">
						window.WEBVIEW_PROVIDER_TYPE = ${JSON.stringify(this.providerType)};
						window.clineClientId = "${this.clientId}";
						window.caretBanner = "${caretBannerDataUri}";
					</script>
					${reactRefresh}
					<script type="module" nonce="${nonce}" src="${localServerUrl}/src/main.tsx"></script>
				</body>
			</html>
		`
	}
}
