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

# Next Session Guide - Caret-Cline 모드 시스템 정리

**일시**: 2025-01-28 → 다음 세션  
**작업자**: luke  
**우선순위**: 🚨 **Critical - 시스템 혼란 상태 정리**

## 🚨 **현재 문제 상황 요약**

### **핵심 문제들**
1. **채팅 기록 변조**: 과거 대화 내용이 현재 설정에 따라 동적으로 변경됨 (가장 심각)
2. **모드 전환 혼란**: Caret/Cline 모드 전환이 예상대로 동작하지 않음
3. **용어 혼재**: ASK 용어가 여전히 일부 남아있음  
4. **시스템 프롬프트 오염**: Cline 원본을 수정해서 복잡해짐
5. **설정 기본값 문제**: 모드 전환 시 올바른 기본값으로 설정되지 않음

### **예상했던 동작**
```
Caret 모드: 기본값 Agent, 버튼 [Chatbot] [Agent]
Cline 모드: 기본값 Plan, 버튼 [Plan] [Act]
```

### **실제 문제**
- 모드가 마구 헷갈림
- 채팅 창의 과거 대화가 현재 설정에 따라 변경됨
- 설정과 버튼이 정확히 연동되지 않음

## 📋 **다음 세션 작업 계획**

### **Phase 1: 상황 파악 (30분)**

#### **1.1 Git 상태 확인**
```bash
# 현재 변경된 파일들 확인
git status
git diff --name-only

# 백업 파일들 확인
find . -name "*.cline" -type f
```

#### **1.2 핵심 파일들 상태 점검**
- `src/core/prompts/system.ts` (Cline 원본 시스템 프롬프트)
- `webview-ui/src/components/common/MarkdownBlock.tsx` (채팅 기록 변조 원인)
- `caret-src/core/prompts/CaretSystemPrompt.ts` (복잡해진 부분)
- `webview-ui/src/components/chat/ChatTextArea.tsx` (모드 전환 UI)

#### **1.3 문제 우선순위 재확인**
1. 채팅 기록 변조 (최우선 - 사용자 신뢰 문제)
2. 모드 전환 혼란 (기능 문제)
3. 용어 통일 (일관성 문제)

### **Phase 2: 원본 복원 (45분)**

#### **2.1 Cline 원본 완전 복원**
```bash
# 시스템 프롬프트 원본 복원
cp src/core/prompts/system-ts.cline src/core/prompts/system.ts

# 기타 중요 파일들 원본 복원
cp webview-ui/src/components/common/MarkdownBlock-tsx.cline webview-ui/src/components/common/MarkdownBlock.tsx
```

#### **2.2 복원 후 동작 확인**
- 컴파일 성공 확인
- 기본 Cline 기능 동작 확인
- 채팅 기록 변조 문제 해결 확인

### **Phase 3: 단순한 재설계 (90분)**

#### **3.1 설계 원칙 재정립**
```typescript
// 목표: 단순하고 명확한 구조
// 1. Cline 원본 시스템 프롬프트 절대 건드리지 않기
// 2. UI 레이어에서만 표시 용어 변환
// 3. 채팅 기록 무결성 절대 보장
// 4. 내부 로직은 Cline 원본 그대로 유지
```

#### **3.2 UI 레이어 전용 용어 변환**
- `MarkdownBlock.tsx`: 정적 텍스트만 변환, 동적 변환 금지
- `ChatTextArea.tsx`: 버튼 텍스트만 변경
- 과거 채팅 기록에는 절대 영향 주지 않기

#### **3.3 모드 시스템 단순화**
```typescript
// 단순한 접근법
interface SimpleModeSystem {
  // UI에서만 버튼 텍스트 변경
  // 내부적으로는 ask/agent 그대로 사용
  // modeSystem 설정에 따라 UI 표시만 변경
}
```

### **Phase 4: 검증 (30분)**

#### **4.1 핵심 기능 테스트**
1. **채팅 기록 무결성**: 과거 대화가 변경되지 않는지 확인
2. **모드 전환**: Caret/Cline 모드 전환이 올바르게 동작하는지
3. **기본값**: 각 모드의 올바른 기본값 설정 확인

#### **4.2 컴파일 및 빌드 확인**
```bash
npm run compile
cd webview-ui && npm run build
```

## ⚠️ **절대 금지사항**

### **하지 말아야 할 것들**
- ❌ `src/core/prompts/system.ts` (Cline 원본) 수정 금지
- ❌ 채팅 기록에 영향을 주는 동적 변환 금지  
- ❌ 복잡한 다층 변환 로직 구현 금지
- ❌ 과거 대화 내용을 현재 설정에 따라 변경하는 로직 금지

### **반드시 지켜야 할 원칙**
- ✅ 단순함 우선 (KISS 원칙)
- ✅ Cline 원본 보존 최우선
- ✅ 채팅 기록 무결성 절대 보장
- ✅ UI 표시만 변경, 내부 로직 보존

## 🎯 **성공 기준**

### **최소 성공 기준**
1. **채팅 기록 무결성**: 과거 대화가 절대 변경되지 않음
2. **기본 기능 동작**: Caret/Cline 기본 기능이 정상 동작
3. **컴파일 성공**: 에러 없이 빌드 완료

### **이상적 성공 기준**
1. **명확한 모드 구분**: Caret(Chatbot/Agent) vs Cline(Plan/Act)
2. **올바른 기본값**: Caret=Agent 기본, Cline=Plan 기본
3. **용어 일관성**: UI에서 ASK 용어 완전 제거

## 📁 **중요 파일 위치**

### **절대 건드리면 안 되는 파일**
- `src/core/prompts/system.ts` (Cline 원본 시스템 프롬프트)

### **신중하게 수정할 파일들**
- `webview-ui/src/components/common/MarkdownBlock.tsx` (채팅 표시)
- `webview-ui/src/components/chat/ChatTextArea.tsx` (모드 전환 UI)
- `caret-src/core/prompts/CaretSystemPrompt.ts` (Caret 확장)

### **백업 파일들**
- 모든 `.cline` 확장자 파일들 (복원 시 사용)

## 🔧 **유용한 명령어**

### **상태 확인**
```bash
# Git 상태
git status
git diff

# 백업 파일 찾기
find . -name "*.cline" -type f

# 컴파일 확인
npm run compile
```

### **복원 명령어**
```bash
# 중요 파일 복원 (필요시)
cp src/core/prompts/system-ts.cline src/core/prompts/system.ts
cp webview-ui/src/components/common/MarkdownBlock-tsx.cline webview-ui/src/components/common/MarkdownBlock.tsx
```

---

**현재 상태**: ⚠️ **문제 상황 - 정리 필요**  
**다음 목표**: 🔍 **문제 파악 → 원본 복원 → 단순한 재설계**  
**예상 시간**: 3-4시간  
**핵심 원칙**: **단순함 + Cline 원본 보존 + 채팅 기록 무결성**