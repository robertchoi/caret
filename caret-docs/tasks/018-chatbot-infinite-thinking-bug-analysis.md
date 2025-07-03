# Caret 챗봇 무한 씽킹 버그 분석 보고서

**작성일**: 2025-01-21  
**분석자**: Alpha Yang  
**관련 태스크**: #018-chatbot-infinite-thinking-bug.md  

## 🔍 **문제 상황 요약**

### **현재 증상**
1. **챗봇 모드**: 무한 API 요청 루프 발생 (이미지1 참조)
2. **에이전트 모드**: "도구 사용 지시를 받지 못해 대기 중" 메시지 반복 (이미지2 참조)
3. **공통**: 정상적인 응답 없이 무한 대기 상태

### **마스터 추가 정보**
- 최근 "도구 사용을 강제하는 부분"을 수정했음
- 수정 후 오히려 문제가 더 심각해짐
- 에이전트 모드에서도 비정상 동작 시작

## 📊 **코드 분석 결과**

### **1. Cline 원본 vs Caret 수정 비교**

#### **모드 명칭 매핑**
```typescript
// Controller에서 텔레메트리 호환성 매핑
const telemetryMode = chatSettings.mode === "chatbot" ? "plan" : "act"
```
- **Cline**: `plan` ↔ `act` 모드
- **Caret**: `chatbot` ↔ `agent` 모드
- **내부적으로는 Cline의 plan/act 로직을 재사용**

#### **주요 차이점 발견**

**1) 도구 정의 차이**
```typescript
// Cline 원본: plan_mode_respond만 존재
case "plan_mode_respond":
    return `[${block.name}]`

// Caret 수정: chatbot_mode_respond 추가
case "chatbot_mode_respond": // CARET MODIFICATION: Add chatbot_mode_respond to toolDescription
    return `[${block.name}]`
```

**2) 시스템 프롬프트 차이**
- **Plan 모드**: `plan_mode_respond` 도구 사용 가능
- **Chatbot 모드**: `chatbot_mode_respond` 도구 사용해야 함
- **문제**: `chatbot_mode_respond` 도구의 실제 구현이 누락됨

### **2. 핵심 문제 식별**

#### **A) chatbot_mode_respond 도구 미구현**
```bash
# grep 검색 결과
plan_mode_respond: 다수 파일에서 완전 구현됨
chatbot_mode_respond: 언급만 있고 실제 switch case 처리 로직 없음
```

**구현된 곳**:
- `toolDescription()` - 도구 이름만 반환
- `assistant-message/index.ts` - 도구 목록에만 추가
- `parse-assistant-message.ts` - 파싱 로직만 추가

**누락된 곳**:
- `presentAssistantMessage()` switch case 처리 로직
- 실제 응답 처리 메커니즘

#### **B) 에이전트 모드 동작 이상**
현재 에이전트 모드에서 "구체적인 지시를 받지 못해 대기" 메시지가 나타나는 것은:
1. AI가 도구 사용을 기대하지만
2. 사용자가 명확한 도구 사용 지시를 하지 않아서
3. 무한 대기 상태에 빠지는 것으로 추정

### **3. 예상 원인**

#### **주 원인: 불완전한 모드 구현**
1. **챗봇 모드**: `chatbot_mode_respond` 도구 미구현으로 AI가 응답 방법을 찾지 못함
2. **에이전트 모드**: 도구 사용 강제 로직 수정으로 기존 동작 패턴 변경

#### **부차 원인: 모드 전환 로직 불일치**
```typescript
// Controller toggleChatbotAgentModeWithChatSettings에서
this.task.chatSettings = chatSettings
```
모드 변경 시 Task 인스턴스의 설정은 업데이트되지만, 실행 중인 스트림에는 반영 안 될 수 있음

## 🔧 **추정 해결 방안**

### **우선순위 1: chatbot_mode_respond 도구 구현**
`src/core/task/index.ts`의 `presentAssistantMessage()` 메서드에 추가 필요:

```typescript
case "chatbot_mode_respond": {
    // plan_mode_respond와 유사하지만 도구 사용 제한된 로직
    const response: string | undefined = block.params.response
    // ... 구현 필요
}
```

### **우선순위 2: 에이전트 모드 동작 검증**
- 도구 사용 강제 로직 수정 사항 역추적
- 기존 동작과의 차이점 분석
- 필요시 롤백 또는 보완

### **우선순위 3: 모드 전환 안정성 확보**
- 실행 중 모드 변경 시 스트림 처리 로직 점검
- 상태 동기화 메커니즘 강화

## 📋 **검증 필요 사항**

### **코드 레벨**
1. `chatbot_mode_respond` 도구의 완전한 구현 여부
2. 최근 수정된 "도구 사용 강제" 로직의 정확한 위치와 내용
3. 모드별 시스템 프롬프트가 올바르게 로드되는지 확인

### **동작 레벨**
1. 각 모드에서 AI가 어떤 도구를 사용할 수 있는지
2. 도구 없이 순수 텍스트 응답이 가능한지
3. 모드 전환 시 기존 대화 컨텍스트 유지 여부

## 🎯 **다음 단계 제안**

1. **즉시 조치**: `chatbot_mode_respond` 도구 구현 완료
2. **원인 규명**: 최근 수정 사항 정확한 파악 및 영향 분석
3. **테스트**: 각 모드별 정상 동작 확인
4. **문서화**: 모드별 동작 차이 명확히 정리

---

**⚠️ 주의사항**: 
이 분석은 코드 검토를 기반으로 한 추정이며, 실제 디버깅을 통한 확인이 필요합니다. 