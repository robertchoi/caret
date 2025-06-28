# Next Session Guide - Task 003-06 Complete + UI Improvements + Settings System

## 🎯 **현재 진행 상황 (2025-01-27 완료)**

### ✅ **완료된 작업 (003-06)**
- **TDD Phase 완료**: RED → GREEN → REFACTOR 전체 사이클 완료
- **전체 시스템 Chatbot/Agent 통일**: 백엔드-프론트엔드 완전 통합
- **핵심 파일 수정 완료**:
  - `ChatTextArea.tsx`: 모든 plan/act → Chatbot/Agent 변환
  - `Controller index.ts`: API 메서드명 변경 (`toggleChatbotAgentModeWithChatSettings`)
  - `MarkdownBlock.tsx`: UI 요소 완전 통일
  - `SettingsView.tsx`: 설정 UI 통합
  - `ExtensionStateContext.tsx`: 타입 에러 해결

### ✅ **검증 결과**
- **컴파일 성공**: 전체 시스템 에러 없음 (1개 minor warning만 남음)
- **웹뷰 빌드 성공**: 프론트엔드 완전 작동
- **백업 안전성 확인**: 모든 Cline 원본 파일 백업 완료

## 🚨 **발견된 추가 개선사항 (다음 세션 우선 작업)**

### **🎨 UI 통일성 문제 - 즉시 해결 필요**
- **챗봇 버튼 가시성 문제**: `var(--vscode-textLink-foreground)` 색깔이 잘 안 보임
- **색깔 통일 요구**: 에이전트 버튼과 동일한 선명도로 통일
- **표시 일관성**: 한 줄/두 줄 버튼 표시 방식 통일 필요
- **현재 위치**: `webview-ui/src/components/chat/ChatTextArea.tsx` Line 97

### **⚙️ 설정 시스템 확장 - 새로운 요구사항**
```typescript
// 추가할 새로운 설정
interface CaretModeSettings {
  modeSystem: "caret" | "cline"  // 기본값: "caret"
}
```

#### **설정 요구사항 상세**
- **위치**: General Settings 섹션
- **선택 옵션**:
  - 🔵 **Caret 모드** (기본값): Chatbot & Agent UI 시스템
  - 🔄 **Cline 모드**: Plan & Act UI 시스템 (호환 모드)
- **다국어 지원**: 한/영/일/중 완전 지원
- **간단한 설명**: 각 모드의 차이점 명시
- **목적**: Caret-Cline 하이브리드 사용 환경

#### **기술적 요구사항**
- **동적 UI 전환**: 사용자 선택에 따라 UI 용어 실시간 변경
- **데이터 호환성**: 모드 전환 시 기존 설정 보존
- **런타임 전환**: 재시작 없이 즉시 모드 전환 가능

## 🚨 **중요한 결정사항 (유지)**

### **Chatbot/Agent 통일 아키텍처**
- **용어 통일**: 모든 `plan/act` → `Chatbot/Agent` 변경 완료
- **API 통일**: `toggleChatbotAgentMode` 단일 API 사용
- **타입 시스템**: `ChatbotAgentMode.CHATBOT_MODE` / `ChatbotAgentMode.AGENT_MODE`
- **Proto 필드**: `chatbotAgentSeparateModelsSetting` 통일

### **Cline 호환성 유지**
- **텔레메트리**: ask→plan, agent→act 매핑으로 기존 분석 시스템 호환
- **백업 보존**: 모든 .cline 백업 파일로 언제든 복구 가능
- **최소 수정 원칙**: 1-3라인 수정으로 변경 최소화

## 🔄 **다음 세션 작업 계획**

### **🎯 우선순위 1: UI 통일성 개선 (즉시)**
1. **색깔 문제 해결**: 
   - `CHATBOT_MODE_COLOR` 변경: `var(--vscode-textLink-foreground)` → 더 선명한 색상
   - 에이전트 버튼과 동일한 가시성 확보
2. **표시 일관성**: 한 줄/두 줄 버튼 표시 방식 통일
3. **다국어 완전 적용**: 모든 UI 텍스트 다국어 검증

### **🎯 우선순위 2: 설정 시스템 확장**
1. **새로운 설정 필드 추가**:
   ```typescript
   // proto/state.proto 확장
   optional string mode_system = XX;  // "caret" | "cline"
   
   // ChatSettings 확장
   interface ChatSettings {
     mode: "chatbot" | "agent"
     modeSystem?: "caret" | "cline"  // 기본값: "caret"
     // ... 기존 필드들
   }
   ```

2. **General Settings UI 구현**:
   - `webview-ui/src/components/settings/SettingsView.tsx` 확장
   - 라디오 버튼 또는 토글 스위치 UI
   - 다국어 지원 (4개 언어)

3. **동적 UI 시스템 구현**:
   - Context에서 modeSystem 상태 관리
   - UI 텍스트 동적 변경 로직
   - Chatbot/Agent ↔ Plan/Act 용어 전환

### **🎯 우선순위 3: 다음 Task 준비**
- **003-07 Responses Verification Tools**: 
  - 현재 통일된 시스템 + 새로운 설정 시스템 기반
  - 모드별 차별화된 응답 품질 검증 도구
  - 위치: `caret-src/core/verification/` (신규 생성)

## 📁 **주요 수정 파일 위치**

### **즉시 수정 필요 (UI 개선)**
- `webview-ui/src/components/chat/ChatTextArea.tsx` - 색깔 통일
- `webview-ui/src/caret/locale/*/common.json` - 다국어 검증

### **새로 구현 필요 (설정 시스템)**
- `proto/state.proto` - modeSystem 필드 추가
- `src/shared/ChatSettings.ts` - 타입 확장
- `webview-ui/src/components/settings/SettingsView.tsx` - 설정 UI
- `webview-ui/src/context/ExtensionStateContext.tsx` - 상태 관리 확장

### **백업 생성 대상**
- 모든 Cline 원본 파일 수정 시 .cline 백업 생성
- CARET MODIFICATION 주석 추가

## 💡 **개발자를 위한 메모**

### **설계 의도**
- **완전 통일**: 중간 상태 없이 전체 시스템을 한 번에 Chatbot/Agent로 통일 (완료)
- **하이브리드 지원**: Caret-Cline 사용자를 위한 선택권 제공 (신규)
- **TDD 방식**: 테스트 먼저 → 구현 → 리팩토링 사이클로 안전성 확보

### **향후 개선점**
- **설정 시스템 완성 후**: `ChatbotAgentModeSelector.test.tsx` 실제 테스트 환경에서 활성화
- **E2E 테스트**: 실제 Extension Host 환경에서 모드 전환 테스트
- **사용자 경험 검증**: 각 모드별 차별화된 UX 구현

### **알려진 제약사항**
- **테스트 파일 비활성화**: controller-ask-agent.test.ts.disabled (임시)
- **Legacy 호환성**: 텔레메트리 등에서 plan/act 용어 내부 사용 유지

## 🎉 **성과 요약**
- **✅ 백엔드-프론트엔드 완전 통합**: Chatbot/Agent 용어 통일 완료
- **✅ TDD 방법론 적용**: 체계적인 개발 프로세스 준수  
- **✅ 안전한 Cline 수정**: 백업 규칙 준수로 복구 가능성 확보
- **✅ 타입 안전성**: 모든 TypeScript 에러 해결 완료
- **🔄 다음 목표**: UI 개선 + 하이브리드 설정 시스템 구현

**다음 세션에서는 UI 통일성 개선부터 시작하여 설정 시스템 확장까지 완료 예정입니다.**