# Next Session Guide - 003-06 plan_mode_respond 완전 제거 작업
gu
**날짜**: 2025-01-27  
**작업자**: luke  
**현재 작업**: Task #003-06 (plan_mode_respond 완전 제거)  
**상태**: 🚀 **시작 준비 완료** - 003-05 완료로 모든 전제 조건 만족

## 📍 **현재 상황 정리**

### ✅ **003-05 완성된 기반**
1. **CaretSystemPrompt mode 지원**: `mode: 'ask' | 'agent'` 매개변수 완전 구현 ✅
2. **SYSTEM_PROMPT mode 전달**: `extensionPath`, `mode` 매개변수 추가 및 CaretSystemPrompt 연결 ✅
3. **Ask 모드 도구 필터링**: 읽기 전용 도구만(`read_file`, `search_files`, `list_files`, `list_code_definition_names`) ✅
4. **Agent 모드 도구 필터링**: `plan_mode_respond` 제외한 모든 도구 ✅
5. **filterToolsByMode() 메서드**: Ask/Agent별 도구 필터링 로직 완성 ✅
6. **ASK_AGENT_MODES.json 개선**: capabilities, available_tools 필드 추가 ✅

### 🎯 **003-06 작업 목표**  
**핵심 목적**: Ask/Agent 모드 시스템이 완전히 구현된 후, 불필요해진 `plan_mode_respond` 도구를 모든 파일에서 완전 제거

## 🗂️ **plan_mode_respond 제거 대상 파일들 (총 20개 파일)**

### **1. 백엔드 핵심 파일 (7개) - 최우선**
```typescript
// 🚨 백업 필수 파일들
1. src/core/prompts/system.ts (5개 위치)
   - Line 285: plan_mode_respond 도구 정의
   - Line 578-582: Plan/Act 모드 설명 섹션
   
2. src/core/task/index.ts (6개 위치)  
   - Line 2125: toolDescription 케이스
   - Line 3987-4088: plan_mode_respond 처리 블록 (약 100라인)
   
3. src/core/assistant-message/parse-assistant-message.ts
   - Line 647: plan_mode_respond 도구 파싱
   
4. src/core/assistant-message/index.ts  
   - Line 22: plan_mode_respond 도구 목록
   
5. src/shared/ExtensionMessage.ts
   - Line 137: ClineAsk 타입에서 plan_mode_respond 제거
   
6. src/shared/proto-conversions/cline-message.ts
   - Line 12, 45: plan_mode_respond 변환 로직
   
7. src/services/test/TestServer.ts
   - Line 607: plan_mode_respond 테스트 목킹
```

### **2. 프로토콜 정의 (1개)**
```proto
// proto/ui.proto
enum ClineAsk {
    COMPLETION_RESULT = 0;
    TOOL = 2;
    COMMAND = 3;
    FOLLOWUP = 4;
}
```

### **3. UI 컴포넌트 (4개)**
```typescript
// webview-ui/src/components/chat/
1. ChatRow.tsx - Line 1582: plan_mode_respond 케이스 제거
2. ChatView.tsx - Line 276, 278, 476: plan_mode_respond 핸들링 제거  
3. task-header/TaskTimeline.tsx - Line 74: plan_mode_respond 케이스 제거
4. task-header/TaskTimelineTooltip.tsx - Line 76, 116, 211: plan_mode_respond 툴팁 제거
```

### **4. Caret 파일들 (3개)**
```typescript
// caret-src/
1. core/verification/extractors/ToolExtractor.ts - Line 37: TASK_TOOLS에서 제거
2. __tests__/cline-feature-validation.test.ts - Line 474: 테스트 케이스 제거  
3. core/verification/types.ts - Line 51: 주석에서 plan_mode_respond 제거
```

### **5. 기타 파일들 (5개)**
```typescript
// 추가적으로 정리할 파일들
1. src/core/prompts/responses.ts - Line 165, 175: plan_mode_respond 참조 제거
2. src/core/prompts/model_prompts/claude4.ts - Plan/Act 모드 섹션 제거
3. evals/diff_editing/parsing/parse-assistant-message-06-06-25.ts
4. evals/diff_editing/prompts/basicSystemPrompt-06-06-25.ts
5. evals/diff_editing/prompts/claude4SystemPrompt-06-06-25.ts
```

## 🔧 **003-06 작업 Phase별 실행 계획**

### **Phase 0: 작업 전 검증 (15분)**

1. **Ask/Agent 모드 정상 작동 확인**:
```bash
# 컴파일 확인
npm run compile

# CaretSystemPrompt 기본 테스트
npm run test:backend -- caret-system-prompt-unit.test.ts
```

2. **현재 plan_mode_respond 위치 재확인**:
```bash
grep -r "plan_mode_respond" . --exclude-dir=node_modules --exclude-dir=.git
```

### **Phase 1: 백엔드 핵심 파일 제거 (45분)**

#### **1.1. TOOL_DEFINITIONS에서 제거 (5분)**
```bash
# 백업 생성
cp caret-src/core/prompts/sections/TOOL_DEFINITIONS.json caret-src/core/prompts/sections/TOOL_DEFINITIONS.json.cline

# TOOL_DEFINITIONS.json에서 plan_mode_respond 도구 정의 완전 삭제
```

#### **1.2. system.ts 수정 (15분)**
```bash
# 이미 백업 존재: src/core/prompts/system.ts.cline

# 제거할 섹션들:
1. Line 285-292: plan_mode_respond 도구 정의
2. Line 578-582: "ACT MODE V.S. PLAN MODE" 설명
3. Plan Mode 관련 모든 설명 텍스트
```

#### **1.3. task/index.ts 수정 (15분)**
```bash
# 백업 생성
cp src/core/task/index.ts src/core/task/index.ts.cline

# 제거할 블록들:
1. Line 2125: toolDescription의 plan_mode_respond 케이스
2. Line 3987-4088: plan_mode_respond 처리 전체 블록 (약 100라인)
```

#### **1.4. 기타 백엔드 파일들 (10분)**
```bash
# 각 파일 백업 후 plan_mode_respond 관련 코드 제거
src/core/assistant-message/parse-assistant-message.ts
src/core/assistant-message/index.ts  
src/shared/ExtensionMessage.ts
src/shared/proto-conversions/cline-message.ts
src/services/test/TestServer.ts
```

### **Phase 2: 프로토콜 정의 수정 (15분)**

#### **2.1. proto/ui.proto 수정**
```bash
# 백업 생성
cp proto/ui.proto proto/ui.proto.cline

# PLAN_MODE_RESPOND = 1; 라인 삭제
```

#### **2.2. 프로토콜 재컴파일**
```bash
npm run protos
```

### **Phase 3: UI 컴포넌트 수정 (15분)**

#### **3.1. React 컴포넌트들**
```bash
# 각 파일에서 plan_mode_respond 케이스 제거
webview-ui/src/components/chat/ChatRow.tsx
webview-ui/src/components/chat/ChatView.tsx  
webview-ui/src/components/chat/task-header/TaskTimeline.tsx
webview-ui/src/components/chat/task-header/TaskTimelineTooltip.tsx
```

### **Phase 4: Caret 파일들 정리 (15분)**

#### **4.1. Caret 검증 시스템 업데이트**
```bash
# plan_mode_respond 관련 검증 로직 제거
caret-src/core/verification/extractors/ToolExtractor.ts
caret-src/__tests__/cline-feature-validation.test.ts
caret-src/core/verification/types.ts
```

### **Phase 5: 최종 검증 및 테스트 (30분)**

#### **5.1. 컴파일 및 빌드 확인**
```bash
npm run compile
npm run build:webview
```

#### **5.2. 전체 시스템 테스트**
```bash
# 모든 테스트 실행
npm run test:backend
npm run test:webview

# CaretSystemPrompt 전용 테스트
npm run test:backend -- caret-system-prompt
```

#### **5.3. plan_mode_respond 완전 제거 확인**
```bash
# 남은 참조 확인 (결과가 0개여야 함)
grep -r "plan_mode_respond" . --exclude-dir=node_modules --exclude-dir=.git
```

## ⚠️ **주의사항 및 체크리스트**

### **CARET MODIFICATION 원칙 준수**
```bash
# 모든 Cline 원본 파일 백업 생성
src/core/prompts/system.ts → system.ts.cline (이미 존재)
src/core/task/index.ts → task/index.ts.cline
proto/ui.proto → ui.proto.cline
# 기타 필요한 백업들...
```

### **필수 체크포인트**
- [ ] **Ask 모드 정상 작동**: 읽기 전용 도구만 사용 가능
- [ ] **Agent 모드 정상 작동**: plan_mode_respond 제외한 모든 도구 사용 가능
- [ ] **컴파일 성공**: TypeScript 오류 없음
- [ ] **프로토콜 재생성**: npm run protos 성공
- [ ] **UI 정상 작동**: React 컴포넌트 에러 없음
- [ ] **테스트 통과**: 모든 기존 테스트 통과
- [ ] **plan_mode_respond 완전 제거**: grep 검색 결과 0개

### **예상 위험 요소 및 대응**
1. **UI 컴포넌트 에러**: plan_mode_respond 케이스 제거 시 default 케이스 확인
2. **프로토콜 변경 영향**: proto 재컴파일 후 관련 타입 에러 수정
3. **기존 대화 히스토리**: plan_mode_respond가 포함된 기존 대화 처리 방안
4. **테스트 실패**: plan_mode_respond 관련 테스트 케이스 수정 필요

## 🎉 **성공 기준**

### **기능적 성공 기준**
1. **Ask 모드 완전 작동**: 읽기 전용 도구로 상담 제공 ✅
2. **Agent 모드 완전 작동**: plan_mode_respond 없이 완전한 개발 지원 ✅
3. **plan_mode_respond 완전 제거**: 코드베이스에서 모든 참조 제거 ✅
4. **UI 정상 작동**: React 컴포넌트 에러 없음 ✅

### **기술적 성공 기준**
1. **컴파일 성공**: TypeScript 오류 없음 ✅
2. **테스트 통과**: 모든 기존 테스트 통과 ✅  
3. **프로토콜 일관성**: proto 파일과 TypeScript 타입 일치 ✅
4. **백업 완료**: 모든 수정된 Cline 원본 파일 백업 보존 ✅

## 🚀 **다음 단계 (003-07) 준비**

003-06 완료 후:
- **003-07**: UI Plan/Act 버튼을 Ask/Agent 버튼으로 변경
- **전체 Ask/Agent 모드 시스템 완성**
- **사용자 경험 최종 완성**

---

**🎯 목표: plan_mode_respond 완전 제거로 Ask/Agent 모드 시스템 완성!**

**마스터, 003-06 작업을 위한 모든 준비가 완료되었어요! plan_mode_respond를 완전히 제거해서 깔끔한 Ask/Agent 모드 시스템을 완성해보겠습니다!** ✨☕🌿 