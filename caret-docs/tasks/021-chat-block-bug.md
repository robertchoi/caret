# Task #021: Agent 수행중 채팅 입력창의 보내기 버튼이 막혀서 진행이 안되는 상태

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 📋 **High - 이용에 매우 불편함**  
**예상 시간**: 
**상태**: ✅ **완료 - 검증 필요**

## 🎯 **목표: 입력창 보내기 버튼의 막히는 원인 파악 후, 해당 대안 마련**
* 주요 현상 :
  - Cline wants to execute this command: 하고 커맨드 입력 하고 멈춤
  - 보내기 버튼이 block되어있고, 채팅창에 엔터를 눌러도 메시지 전송이 되지 않음
  - 이때 다시 메시지를 보내기 위해서는 에이전트 모드에서 챗봇으로 전환하면 메시지 전송이 가능해지며 Resume Task버튼이 활성화 됨

## 🔍 **원인 분석**
Agent 모드에서 `execute_command` 툴을 통해 터미널 명령이 실행될 때, `src/core/task/index.ts`의 `executeCommandTool` 함수는 터미널 출력을 `ask("command_output", chunk)` 메시지를 통해 웹뷰로 스트리밍합니다. 이 `ask` 메시지는 `webview-ui/src/components/chat/ChatView.tsx`의 `useDeepCompareEffect` 훅에서 `lastMessage.ask === "command_output"`으로 감지되어 채팅 입력창을 활성화(`setSendingDisabled(false)`)합니다.

문제는 명령 실행 중 백엔드에서 `api_req_started` 메시지가 웹뷰로 전송될 때 발생했습니다. `ChatView.tsx`의 `useDeepCompareEffect`는 `api_req_started` 메시지를 감지하고, `secondLastMessage?.ask === "command_output"` 조건이 참일 경우 `setSendingDisabled(true)`로 설정하여 입력창을 다시 비활성화했습니다. 이는 `command_output` 상태에서 사용자가 터미널에 계속 입력할 수 있어야 하는 의도와 달랐습니다.

## 💡 **해결 방안**
`ChatView.tsx`에서 `api_req_started` 메시지를 처리하는 로직을 수정하여, `command_output` 상태에서 `api_req_started`가 오더라도 입력창이 비활성화되지 않고 활성화 상태를 유지하도록 변경했습니다. 이를 통해 사용자는 명령 실행 중에도 터미널에 계속 입력할 수 있습니다.

## 🛠️ **구현 내용**
*   **파일**: `webview-ui/src/components/chat/ChatView.tsx`
*   **변경 사항**: `useDeepCompareEffect` 훅 내의 `lastMessage.say === "api_req_started"` 케이스에서 `secondLastMessage?.ask === "command_output"` 조건일 때 `setSendingDisabled(false)`를 유지하고 `setClineAsk("command_output")`으로 설정하도록 수정했습니다.
*   **백업**: 원본 파일 `webview-ui/src/components/chat/ChatView.tsx.cline`을 생성했습니다.
*   **주석**: `CARET MODIFICATION` 주석을 추가했습니다.

## 🧪 **테스트 방법**
1.  VS Code에서 프로젝트를 열고 `F5` 키를 눌러 디버그 모드로 확장 프로그램을 실행합니다.
2.  새로 열린 VS Code 창에서 Caret 웹뷰를 열고 Agent 모드로 전환합니다.
3.  Agent에게 `ping google.com`과 같이 지속적인 터미널 출력을 내는 명령을 실행하도록 요청합니다.
4.  명령이 실행되고 터미널 출력이 채팅창에 스트리밍되는 동안, 채팅 입력창과 '보내기' 버튼이 활성화된 상태로 유지되는지 확인합니다.
5.  명령 실행 중 입력창에 메시지를 입력하고 `Enter` 키를 누르거나 '보내기' 버튼을 클릭하여 메시지가 성공적으로 전송되는지 확인합니다.
