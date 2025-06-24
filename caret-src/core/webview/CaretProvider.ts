import * as vscode from "vscode"
import { WebviewProvider as ClineWebviewProvider } from "../../../src/core/webview/index"
import { WebviewProviderType } from "../../../src/shared/webview/types"
import { caretLogger, logCaretWelcome } from "../../utils/caret-logger"
import { getTheme } from "../../utils/caretGetTheme"
import { getUri } from "../../../src/core/webview/getUri"
import { getNonce } from "../../../src/core/webview/getNonce"
import * as fs from "fs"
import * as path from "path"
import { ensureRulesDirectoryExists } from "../../../src/core/storage/disk"
import { EmptyRequest } from "../../../src/shared/proto/common"
import { updateRuleFileContent, UpdateRuleFileContentParams } from "../../core/updateRuleFileContent"
import { sendThemeEvent } from "../../../src/core/controller/ui/subscribeToTheme"

export const CARET_SIDEBAR_ID = "caret.SidebarProvider"

type PersonaLanguageKey = "en" | "ko" | "ja" | "zh"

interface PersonaData {
	name: string
	description: string
	customInstruction: object
}

interface PersonaCharacter {
	character: string
	en: PersonaData
	ko: PersonaData
	ja: PersonaData
	zh: PersonaData
	isDefault?: boolean
}

export class CaretProvider extends ClineWebviewProvider {
	private caretDisposables: vscode.Disposable[] = []

	constructor(
		public override readonly context: vscode.ExtensionContext,
		outputChannel: vscode.OutputChannel,
		providerType: WebviewProviderType = WebviewProviderType.SIDEBAR,
	) {
		super(context, outputChannel, providerType)
		caretLogger.setOutputChannel(outputChannel)
		caretLogger.extensionActivated()
		logCaretWelcome()
	}

	public override async dispose() {
		while (this.caretDisposables.length) {
			this.caretDisposables.pop()?.dispose()
		}
		await super.dispose()
	}

	private getCaretHtmlContent(webview: vscode.Webview): string {
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			if (fs.existsSync(bannerPath)) {
				const imageBuffer = fs.readFileSync(bannerPath)
				caretBannerDataUri = `data:image/webp;base64,${imageBuffer.toString("base64")}`
			}
		} catch (error) {
			caretLogger.error(`[CaretProvider] 배너 이미지 로드 실패:`, error)
		}

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
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com; font-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}' 'unsafe-eval';">
                <title>Caret - AI Development Partner</title>
                </head>
                <body>
                    <noscript>You need to enable JavaScript to run this app.</noscript>
                    <div id="root"></div>
                     <script type="text/javascript" nonce="${nonce}">
                        window.WEBVIEW_PROVIDER_TYPE = "SIDEBAR";
                        window.clineClientId = "${this.getClientId()}";
                        window.caretBanner = "${caretBannerDataUri}";
                    </script>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
            `
	}

	private async getCaretHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		let localServerPort = "5173"
		try {
			const portFilePath = path.join(this.context.extensionPath, "webview-ui", ".vite-port")
			if (fs.existsSync(portFilePath)) {
				localServerPort = fs.readFileSync(portFilePath, "utf-8").trim()
			}
		} catch (error) {
			caretLogger.error("[CaretProvider] Error reading .vite-port file.", error)
		}

		const localServerUrl = `http://localhost:${localServerPort}`
		const localWsServerUrl = `ws://localhost:${localServerPort}`
		let caretBannerDataUri = ""
		try {
			const bannerPath = path.join(this.context.extensionPath, "caret-assets", "caret-main-banner.webp")
			if (fs.existsSync(bannerPath)) {
				const imageBuffer = fs.readFileSync(bannerPath)
				caretBannerDataUri = `data:image/webp;base64,${imageBuffer.toString("base64")}`
			}
		} catch (error) {
			caretLogger.error(`[CaretProvider] 배너 이미지 로드 실패:`, error)
		}

		return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta http-equiv="Content-Security-Policy" content="
						default-src 'none';
						connect-src ${webview.cspSource} ${localWsServerUrl} ${localServerUrl} https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com;
						font-src ${webview.cspSource} data:;
						style-src 'unsafe-inline' ${webview.cspSource} ${localServerUrl};
						img-src ${webview.cspSource} https: data: ${localServerUrl};
						script-src 'unsafe-inline' 'unsafe-eval' ${localServerUrl};
					">
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>Caret - AI Development Partner (Dev)</title>
					<script type="module" src="${localServerUrl}/@vite/client"></script>
					<script type="module">
						import RefreshRuntime from "${localServerUrl}/@react-refresh";
						RefreshRuntime.injectIntoGlobalHook(window);
						window.$RefreshReg$ = () => {};
						window.$RefreshSig$ = () => (type) => type;
						window.__vite_plugin_react_preamble_installed__ = true;
					</script>
				</head>
				<body>
					<div id="root"></div>
					<script type="text/javascript">
						window.WEBVIEW_PROVIDER_TYPE = "SIDEBAR";
						window.clineClientId = "${this.getClientId()}";
						window.caretBanner = "${caretBannerDataUri}";
					</script>
					<script type="module" src="${localServerUrl}/src/main.tsx"></script>
				</body>
			</html>
		`
	}

	public override async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		const currentMode = this.context.extensionMode
		caretLogger.info(`[CaretProvider] resolveWebviewView called. ExtensionMode: ${currentMode}`)

		this.view = webviewView

		const localResourceRoots = [this.context.extensionUri]
		if (currentMode === vscode.ExtensionMode.Development) {
			const portFilePath = path.join(this.context.extensionPath, "webview-ui", ".vite-port")
			if (fs.existsSync(portFilePath)) {
				const port = fs.readFileSync(portFilePath, "utf-8").trim()
				const localServerUri = vscode.Uri.parse(`http://localhost:${port}`)
				localResourceRoots.push(localServerUri)
			}
		}

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: localResourceRoots,
		}

		webviewView.webview.html =
			currentMode === vscode.ExtensionMode.Development
				? await this.getCaretHMRHtmlContent(webviewView.webview)
				: this.getCaretHtmlContent(webviewView.webview)

		webviewView.webview.onDidReceiveMessage(
			(message) => this.controller.handleWebviewMessage(message),
			null,
			this.caretDisposables,
		)

		if ("onDidChangeViewState" in webviewView) {
			webviewView.onDidChangeViewState(
				() => {
					if (this.view?.visible) {
						this.controller.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.caretDisposables,
			)
		} else if ("onDidChangeVisibility" in webviewView) {
			webviewView.onDidChangeVisibility(
				() => {
					if (this.view?.visible) {
						this.controller.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.caretDisposables,
			)
		}

		webviewView.onDidDispose(() => this.dispose(), null, this.caretDisposables)

		vscode.workspace.onDidChangeConfiguration(
			async (e) => {
				if (e.affectsConfiguration("workbench.colorTheme")) {
					const theme = await getTheme()
					if (theme) {
						await sendThemeEvent(JSON.stringify(theme))
					}
				}
				if (e.affectsConfiguration("cline.mcpMarketplace.enabled")) {
					await this.controller.postStateToWebview()
				}
			},
			null,
			this.caretDisposables,
		)

		this.controller.clearTask()
		caretLogger.info("Webview view resolved and configured by CaretProvider.")
		this.controller.postStateToWebview()
	}
}
