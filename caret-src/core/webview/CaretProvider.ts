import * as vscode from "vscode"
import { WebviewProvider as ClineWebviewProvider } from "../../../src/core/webview/index"
import { WebviewProviderType } from "../../../src/shared/webview/types" // WebviewProviderType도 가져옵니다.
import { caretLogger, logCaretWelcome, logCaretUser } from "../../utils/caret-logger"
import { getUri } from "../../../src/core/webview/getUri"
import { getNonce } from "../../../src/core/webview/getNonce"
// CARET MODIFICATION: Import Node.js fs and path modules for reading .vite-port
import * as fs from "fs"
import * as path from "path"
import { ensureRulesDirectoryExists } from "../../../src/core/storage/disk" // For global rules path helper
import { UpdateRuleFileContentRequest } from "../../../src/shared/proto/file" // Proto for request
import { EmptyRequest } from "../../../src/shared/proto/common" // For refreshRules

export const CARET_SIDEBAR_ID = "caret.SidebarProvider" // Caret 전용 사이드바 ID 상수 선언

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
	// Caret 전용 ID는 package.json에서 정의하고, 여기서는 기본 Cline 구조를 활용

	constructor(
		public override readonly context: vscode.ExtensionContext,
		outputChannel: vscode.OutputChannel,
		// Caret은 기본적으로 탭을 사용할지, 사이드바를 사용할지 여기서 결정하거나,
		// 혹은 ClineWebviewProvider의 기본값을 따를 수 있습니다.
		// Cline의 생성자는 providerType을 선택적으로 받으므로, 여기서도 동일하게 처리합니다.
		providerType: WebviewProviderType = WebviewProviderType.SIDEBAR, // 기본값을 SIDEBAR로 변경
	) {
		// ClineWebviewProvider의 생성자를 호출합니다.
		// providerType을 전달하여 Cline의 생성자에서 제대로 처리되도록 합니다.
		super(context, outputChannel, providerType)

		// Caret 로거에 출력 채널 연결
		caretLogger.setOutputChannel(outputChannel)

		// Caret 익스텐션 활성화 로그
		caretLogger.extensionActivated()

		// 웰컴 페이지 로드 로그
		logCaretWelcome()

		// IMPORTANT: Cline의 WebviewProvider는 이미 Controller를 생성하므로
		// 우리는 추가로 Controller를 만들 필요가 없습니다.
		// super() 호출로 이미 this.controller가 생성되어 있습니다.
	}

	/**
	 * Caret 전용 HTML 콘텐츠 생성 - caretBanner URI 추가
	 * resolveWebviewView에서 HTML을 직접 수정하여 Caret 이미지 및 브랜딩 적용
	 */
	private getCaretHtmlContent(webview: vscode.Webview): string {
		// Caret 배너 이미지 URI 생성
		const caretBannerUri = getUri(webview, this.context.extensionUri, ["caret-assets", "caret-main-banner.webp"])

		// Cline의 기본 자산들
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

		// Caret 브랜딩이 적용된 HTML 반환
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
                        // Inject the provider type
                        window.WEBVIEW_PROVIDER_TYPE = "SIDEBAR";
                        
                        // Inject the client ID
                        window.clineClientId = "${this.getClientId()}";
                        
                        // Inject Caret banner URI
                        window.caretBanner = "${caretBannerUri}";
                    </script>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
            `
	}

	/**
	 * Caret 전용 HMR HTML 콘텐츠 생성 (개발 모드용)
	 */
	private async getCaretHMRHtmlContent(webview: vscode.Webview): Promise<string> {
		// CARET MODIFICATION: Development mode to use Vite dev server for HMR
		// Dynamically read port from webview-ui/.vite-port
		let localServerPort = "5173" // Default port as fallback
		try {
			const portFilePath = path.join(this.context.extensionPath, "webview-ui", ".vite-port")
			// CARET MODIFICATION: Log the path being checked for .vite-port
			caretLogger.info(`[CaretProvider] Checking for .vite-port file at: ${portFilePath}`)
			if (fs.existsSync(portFilePath)) {
				const portFileContent = fs.readFileSync(portFilePath, "utf-8")
				const parsedPort = parseInt(portFileContent.trim(), 10)
				if (!isNaN(parsedPort)) {
					localServerPort = parsedPort.toString()
					caretLogger.info(`[CaretProvider] Successfully read Vite dev server port: ${localServerPort} from .vite-port`)
				} else {
					caretLogger.warn(
						`[CaretProvider] Failed to parse port from .vite-port file. Content: "${portFileContent}". Falling back to default port ${localServerPort}.`,
					)
				}
			} else {
				caretLogger.warn(
					`[CaretProvider] .vite-port file not found at ${portFilePath}. Falling back to default port ${localServerPort}.`,
				)
			}
		} catch (error) {
			caretLogger.error(
				"[CaretProvider] Error reading .vite-port file. Falling back to default port " + localServerPort,
				error,
			)
		}

		const localServerUrl = `http://localhost:${localServerPort}`
		// CARET MODIFICATION: Log the derived localServerUrl
		caretLogger.info(`[CaretProvider] Using localServerUrl for HMR: ${localServerUrl}`)
		const localWsServerUrl = `ws://localhost:${localServerPort}`

		// Caret 배너 이미지 URI 생성 (동일하게 유지)
		const caretBannerUri = getUri(webview, this.context.extensionUri, ["caret-assets", "caret-main-banner.webp"])
		const nonce = getNonce()

		// CARET MODIFICATION: CSP to use dynamic localServerPort and localServerUrl
		return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<!-- CSP for Vite dev server -->
					<meta http-equiv="Content-Security-Policy" content="
						default-src 'none';
						connect-src ${webview.cspSource} ${localWsServerUrl} ${localServerUrl} https://*.posthog.com https://*.firebaseauth.com https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com;
						font-src ${webview.cspSource} data:;
						style-src ${webview.cspSource} 'unsafe-inline' ${localServerUrl};
						img-src ${webview.cspSource} https: data: ${localServerUrl};
						script-src 'nonce-${nonce}' 'unsafe-eval' ${localServerUrl};
					">
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>Caret - AI Development Partner (Dev)</title>
					<!-- Vite HMR client -->
					<script type="module" nonce="${nonce}" src="${localServerUrl}/@vite/client"></script>
				</head>
				<body>
					<div id="root"></div>
					<script type="text/javascript" nonce="${nonce}">
						// Inject the provider type
						window.WEBVIEW_PROVIDER_TYPE = "SIDEBAR";
						
						// Inject the client ID
						window.clineClientId = "${this.getClientId()}";
						
						// Inject Caret banner URI
						window.caretBanner = "${caretBannerUri}";
					</script>
					<!-- Main entry point for the webview UI -->
					<script type="module" nonce="${nonce}" src="${localServerUrl}/src/main.tsx"></script>
				</body>
			</html>
		`
	}

	public override async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		// CARET MODIFICATION: Log current extension mode
		const currentMode = this.context.extensionMode
		caretLogger.info(
			`[CaretProvider] resolveWebviewView called. ExtensionMode: ${currentMode === vscode.ExtensionMode.Development ? "Development (1)" : currentMode === vscode.ExtensionMode.Production ? "Production (2)" : "Test (0) / Unknown"} (Raw value: ${currentMode})`,
		)

		// Cline의 기본 resolveWebviewView를 먼저 호출
		await super.resolveWebviewView(webviewView)

		// CARET MODIFICATION: Initialize custom_instructions.md with default persona if needed.
		try {
			caretLogger.info("[CaretProvider] Checking and initializing custom_instructions.md if necessary...")
			const customInstructionsFilename = "custom_instructions.md"
			const globalRulesDir = await ensureRulesDirectoryExists()
			if (!globalRulesDir) {
				caretLogger.error(
					"[CaretProvider] Could not determine global rules directory. Skipping custom_instructions.md initialization.",
				)
			} else {
				const customInstructionsFilePath = path.join(globalRulesDir, customInstructionsFilename)
				let needsUpdate = true
				if (fs.existsSync(customInstructionsFilePath)) {
					const currentContent = fs.readFileSync(customInstructionsFilePath, "utf8").trim()
					if (currentContent !== "") {
						needsUpdate = false
						caretLogger.info(
							`[CaretProvider] Found existing custom_instructions.md with content at: ${customInstructionsFilePath}. No update needed.`,
						)
					}
				}

				if (needsUpdate) {
					caretLogger.info(
						`[CaretProvider] custom_instructions.md needs to be created or updated with default. Path: ${customInstructionsFilePath}`,
					)
					const personaTemplatePath = path.join(
						this.context.extensionPath,
						"caret-assets",
						"template_characters",
						"template_characters.json",
					)
					const personaTemplates: PersonaCharacter[] = JSON.parse(fs.readFileSync(personaTemplatePath, "utf8"))
					const defaultPersona =
						personaTemplates.find((p) => p.isDefault === true || p.character === "sarang") || personaTemplates[0]

					if (defaultPersona) {
						let langStr = (vscode.env.language || "en").toLowerCase().split("-")[0]
						if (!["en", "ko", "ja", "zh"].includes(langStr)) {
							langStr = "en"
						}
						const langKey = langStr as PersonaLanguageKey

						const personaLangData = defaultPersona[langKey]
						const customInstructionObj = personaLangData?.customInstruction || defaultPersona.en.customInstruction
						const customInstructionContent = JSON.stringify(customInstructionObj, null, 2)

						const request = UpdateRuleFileContentRequest.create({
							rulePath: customInstructionsFilename,
							content: customInstructionContent,
							isGlobal: true,
						})

						caretLogger.info(
							`[CaretProvider] Updating custom_instructions.md with default persona (${defaultPersona.character}, lang: ${langKey})`,
						)
						if (this.controller && this.controller.fileServiceClient) {
							await this.controller.fileServiceClient.updateRuleFileContent(request)
							caretLogger.info("[CaretProvider] Successfully updated custom_instructions.md. Refreshing rules...")
							await this.controller.fileServiceClient.refreshRules(EmptyRequest.create())
							caretLogger.info("[CaretProvider] Rules refreshed after initializing custom_instructions.md.")
						} else {
							caretLogger.error(
								"[CaretProvider] Controller or FileServiceClient not available for updating custom_instructions.md.",
							)
						}
					} else {
						caretLogger.warn("[CaretProvider] Could not find a default persona in template_characters.json.")
					}
				}
			}
		} catch (error: any) {
			caretLogger.error("[CaretProvider] Error during custom_instructions.md initialization:", error)
		}
		// END CARET MODIFICATION

		// 그 다음 Caret 전용 HTML로 교체
		if (webviewView.webview) {
			const htmlContent =
				currentMode === vscode.ExtensionMode.Development
					? await this.getCaretHMRHtmlContent(webviewView.webview)
					: this.getCaretHtmlContent(webviewView.webview)

			// CARET MODIFICATION: Log a snippet of the HTML being set
			const htmlSnippet = htmlContent.substring(0, Math.min(htmlContent.length, 200))
			caretLogger.info(`[CaretProvider] Setting webview HTML (first 200 chars): ${htmlSnippet}...`)

			webviewView.webview.html = htmlContent
		}
	}

	// Caret에 특화된 기능을 여기에 추가하거나 ClineWebviewProvider의 메서드를 오버라이드 할 수 있습니다.
	// 예를 들어, resolveWebviewView를 오버라이드하여 Caret만의 HTML을 제공하거나
	// 메시지 리스너를 다르게 설정할 수 있습니다.
}

// CaretProvider 인스턴스를 관리하기 위한 로직 (필요하다면 Cline의 static 메서드들을 참고하여 구현)
// 예: public static getVisibleCaretInstance(): CaretProvider | undefined { ... }
