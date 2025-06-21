import * as vscode from "vscode"
import { WebviewProvider as ClineWebviewProvider } from "../../../src/core/webview/index"
import { WebviewProviderType } from "../../../src/shared/webview/types" // WebviewProviderType도 가져옵니다.
import { caretLogger, logCaretWelcome, logCaretUser } from "../../utils/caret-logger"
import { getUri } from "../../../src/core/webview/getUri"
import { getNonce } from "../../../src/core/webview/getNonce"

export const CARET_SIDEBAR_ID = "caret.SidebarProvider" // Caret 전용 사이드바 ID 상수 선언

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
		// 개발 모드에서는 Cline의 기본 HMR 로직을 사용하되, caretBanner만 추가
		// 우선 간단히 production 버전을 사용하고, 필요하면 나중에 HMR 지원 추가
		return this.getCaretHtmlContent(webview)
	}

	public override async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
		// Cline의 기본 resolveWebviewView를 먼저 호출
		await super.resolveWebviewView(webviewView)

		// 그 다음 Caret 전용 HTML로 교체
		if (webviewView.webview) {
			webviewView.webview.html =
				this.context.extensionMode === vscode.ExtensionMode.Development
					? await this.getCaretHMRHtmlContent(webviewView.webview)
					: this.getCaretHtmlContent(webviewView.webview)
		}
	}

	// Caret에 특화된 기능을 여기에 추가하거나 ClineWebviewProvider의 메서드를 오버라이드 할 수 있습니다.
	// 예를 들어, resolveWebviewView를 오버라이드하여 Caret만의 HTML을 제공하거나
	// 메시지 리스너를 다르게 설정할 수 있습니다.
}

// CaretProvider 인스턴스를 관리하기 위한 로직 (필요하다면 Cline의 static 메서드들을 참고하여 구현)
// 예: public static getVisibleCaretInstance(): CaretProvider | undefined { ... }
