import * as vscode from "vscode";
import { WebviewProvider as ClineWebviewProvider } from "../../../src/core/webview";
import { WebviewProviderType } from "../../../src/shared/webview/types"; // WebviewProviderType도 가져옵니다.
import { caretLogger, logCaretWelcome, logCaretUser } from "../../utils/caret-logger";

export const CARET_SIDEBAR_ID = "caret.SidebarProvider"; // Caret 전용 사이드바 ID 상수 선언

export class CaretProvider extends ClineWebviewProvider {
    // Caret 전용 ID는 package.json에서 정의하고, 여기서는 기본 Cline 구조를 활용

    constructor(
        public override readonly context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel,
        // Caret은 기본적으로 탭을 사용할지, 사이드바를 사용할지 여기서 결정하거나,
        // 혹은 ClineWebviewProvider의 기본값을 따를 수 있습니다.
        // Cline의 생성자는 providerType을 선택적으로 받으므로, 여기서도 동일하게 처리합니다.
        providerType: WebviewProviderType = WebviewProviderType.TAB 
    ) {
        // ClineWebviewProvider의 생성자를 호출합니다.
        // providerType을 전달하여 Cline의 생성자에서 WebviewProviderType.TAB이 기본값이 되도록 합니다.
        super(context, outputChannel, providerType); 
        
        // Caret 로거에 출력 채널 연결
        caretLogger.setOutputChannel(outputChannel);
        
        // Caret 익스텐션 활성화 로그
        caretLogger.extensionActivated();
        
        // 웰컴 페이지 로드 로그
        logCaretWelcome();
    }

    // Caret에 특화된 기능을 여기에 추가하거나 ClineWebviewProvider의 메서드를 오버라이드 할 수 있습니다.
    // 예를 들어, resolveWebviewView를 오버라이드하여 Caret만의 HTML을 제공하거나
    // 메시지 리스너를 다르게 설정할 수 있습니다.

    // 예시: Cline의 HTML 대신 Caret의 HTML을 사용하고 싶을 경우
    // protected override getHtmlContent(webview: vscode.Webview): string {
    //     // 여기에 Caret용 HTML을 생성하는 로직을 구현합니다.
    //     // (getUri, getNonce 등 Cline의 유틸리티를 활용하거나 새로 만들 수 있습니다.)
    //     return `<html><body><h1>Hello from Caret!</h1></body></html>`;
    // }

    // 만약 resolveWebviewView 자체의 로직을 변경해야 한다면 아래와 같이 오버라이드합니다.
    // public override async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
    //    super.resolveWebviewView(webviewView); // Cline의 기본 로직을 먼저 실행
    //    // Caret에 특화된 추가 설정 (예: 다른 메시지 리스너 등록 등)
    // }
}

// CaretProvider 인스턴스를 관리하기 위한 로직 (필요하다면 Cline의 static 메서드들을 참고하여 구현)
// 예: public static getVisibleCaretInstance(): CaretProvider | undefined { ... } 