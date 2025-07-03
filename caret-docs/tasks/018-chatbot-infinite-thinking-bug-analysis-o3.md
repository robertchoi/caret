# Task 018 – 챗봇 무한 씽킹 버그 (o3 분석)

## 1. 재현 환경

* 모드: **CHATBOT** (`chatSettings.mode === "chatbot"`)
* 증상: UI가 *Thinking…* 상태에서 멈춘 채, Dev-tools 에서는 `api_req_started → api_req_finished` 사이클이 끊임없이 반복됨

## 2. Cline vs Caret 동작 비교표

| 구분 | Cline 원본 | Caret 포크 |
|------|------------|------------|
| 기획 단계 | `PLAN MODE` + **PlanModeRespond** 툴 | `CHATBOT MODE` + **ChatbotModeRespond** 툴 |
| 실행 단계 | `ACT MODE` (모든 도구 사용 가능) | `AGENT MODE` (모든 도구 사용 가능) |
| 프롬프트 강제 | PLAN 모드에서만 툴 사용 강제 | CHATBOT 모드에서도 툴 사용 강제 |
| 파서 지원 | ✅ `PlanModeRespond` 파싱 | ✅ `ChatbotModeRespond` 파싱 (parse-assistant-message.ts) |
| Task 루프 처리 | ✅ `"plan_mode_respond"` 분기 구현 | ❌ `"chatbot_mode_respond"` 분기 누락 |

## 3. 근본 원인

1. 시스템 프롬프트가 CHATBOT 모드에서 모델에게 `<ChatbotModeRespond>` 태그(툴)를 사용해 답변하도록 지시함.
2. 파싱 레이어가 이를 `tool_use` 블럭(`chatbot_mode_respond`)으로 변환.
3. `Task.presentAssistantMessage()`가 블럭을 순회하며 `block.name`을 스위치로 처리할 때
   * `plan_mode_respond`는 있지만 **`chatbot_mode_respond`는 없음**.
4. 해당 분기가 없어
   * `didAlreadyUseTool` 값이 `false`로 유지 → assistant 메시지가 완전히 처리되지 않음.
   * Extension이 재시도 → 무한 API 요청 루프 발생.

## 4. 추가 관찰 사항

* 이전에 "툴 사용 강제" 로직을 일부 제거하며 Agent 모드 문제는 완화됐지만, Chatbot 모드 프롬프트는 여전히 툴 사용을 강제해 문제가 심화됨.
* `*.cline` 백업 파일을 보면 Cline 파일에 Chatbot/Agent 관련 코드가 삽입됐으나, 실행 레이어 업데이트가 누락됨.

## 5. 해결 방안

**A. 최소 패치**  
`src/core/task/index.ts`에 `case "chatbot_mode_respond"`를 추가하여 Plan 분기를 단순화해 복사:
```ts
case "chatbot_mode_respond": {
  const response = removeClosingTag("response", block.params.response);
  await this.say("assistant", response);
  this.didAlreadyUseTool = true;
  break;
}
```
*읽기 전용 상담만 수행, 모드 전환 없음*

**B. 리팩터**  
Plan‧Chatbot 공통 상담 핸들러로 추출하여 중복 제거.

**C. 프롬프트 수정**  
Chatbot 모드에서 툴 강제를 제거해 일반 대화로 응답하도록 변경.

## 6. 다음 단계 체크리스트

- [ ] 해결 전략 선택 (A/B/C)
- [ ] Cline 원본 파일 수정 시 1–3줄 이내 + 백업/CARET MODIFICATION 주석 준수
- [ ] `caret-src/__tests__/chatbot-mode.test.ts`에 단위 테스트 작성 (무한 루프 재현 방지 확인)
- [ ] Agent, Plan/Act 플로우 회귀 테스트
- [ ] 문서 업데이트 후 task #018 **Resolved** 표시

---

마스터~ 알파가 정리해 드렸어요! ｡•ᴗ•｡☕✨ 