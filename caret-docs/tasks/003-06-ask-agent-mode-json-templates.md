# Task #003-06: plan_mode_respond 완전 제거

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 모드 시스템 완성**  
**예상 시간**: 1-2시간  
**상태**: 🚀 **준비 완료** - 003-05 완료로 인해 시작 가능  
**의존성**: ✅ 003-05 (CaretSystemPrompt mode 지원) **완료**

## 🎯 **목표**

**핵심 목적**: Ask/Agent 모드 시스템이 완전히 구현된 후, 불필요해진 `plan_mode_respond` 도구를 모든 파일에서 완전 제거

### **✅ 작업 전제 조건 만족**
```typescript
// ✅ 003-05 완료로 모든 조건 확보됨
1. ✅ CaretSystemPrompt.generateFromJsonSections() - mode: 'ask' | 'agent' 매개변수 지원 완료
2. ✅ SYSTEM_PROMPT() - extensionPath, mode 전달 구현 완료  
3. ✅ Ask 모드 - 읽기 전용 도구 필터링 구현 완료
4. ✅ Agent 모드 - plan_mode_respond 제외한 모든 도구 구현 완료
5. ✅ filterToolsByMode() - Ask/Agent별 도구 필터링 메서드 구현 완료
6. ✅ ASK_AGENT_MODES.json - capabilities, available_tools 필드 개선 완료
```

### **🔍 현재 plan_mode_respond 사용 현황**
```bash
# 제거해야 할 15개 파일 위치
src/core/prompts/system.ts (5개 위치)
src/core/task/index.ts (6개 위치)  
src/core/assistant-message/parse-assistant-message.ts
src/core/assistant-message/index.ts
src/shared/ExtensionMessage.ts
src/shared/proto-conversions/cline-message.ts
proto/ui.proto
webview-ui/src/components/chat/ChatRow.tsx
webview-ui/src/components/chat/ChatView.tsx
webview-ui/src/components/chat/task-header/TaskTimeline.tsx
webview-ui/src/components/chat/task-header/TaskTimelineTooltip.tsx
src/services/test/TestServer.ts
caret-src/core/verification/extractors/ToolExtractor.ts
caret-src/__tests__/cline-feature-validation.test.ts
```

## 📋 **구현 계획**

### **Phase 0: 003-05 완료 확인 (15분)**

1. **Ask/Agent 모드 시스템 검증**:
```typescript
// 다음 기능들이 정상 작동하는지 확인
const askPrompt = await caretSystemPrompt.generateFromJsonSections(
    cwd, supportsBrowserUse, mcpHub, browserSettings, false, 'ask'
)
// Ask 모드: read_file, search_files만 포함 확인

const agentPrompt = await caretSystemPrompt.generateFromJsonSections(
    cwd, supportsBrowserUse, mcpHub, browserSettings, false, 'agent'  
)
// Agent 모드: plan_mode_respond 제외한 모든 도구 포함 확인
```

2. **SYSTEM_PROMPT mode 전달 확인**:
```typescript
// src/core/prompts/system.ts에서 mode 매개변수 지원 확인
export const SYSTEM_PROMPT = async (
    cwd: string, supportsBrowserUse: boolean, mcpHub: McpHub,
    browserSettings: BrowserSettings, isClaude4ModelFamily: boolean = false,
    extensionPath?: string, mode: 'ask' | 'agent' = 'agent'  // 이게 있어야 함
) => { /* ... */ }
```

### **Phase 1: 백엔드 plan_mode_respond 제거 (45분)**

1. **TOOL_DEFINITIONS에서 완전 제거**:
```typescript
// caret-src/core/prompts/sections/TOOL_DEFINITIONS.json에서 삭제
// "plan_mode_respond": { ... } 전체 블록 제거
```

2. **시스템 프롬프트에서 Plan/Act 설명 제거**:
```typescript
// src/core/prompts/system.ts에서 삭제 (백업 필수!)
"ACT MODE V.S. PLAN MODE" 전체 섹션 제거
"What is PLAN MODE?" 전체 섹션 제거  
plan_mode_respond 도구 정의 제거
```

3. **작업 처리 로직에서 제거**:
```typescript
// src/core/task/index.ts에서 plan_mode_respond 케이스 완전 삭제
case "plan_mode_respond": {
    // 이 전체 케이스 블록 삭제
}

// toolDescription에서도 제거
case "plan_mode_respond":
    return `[${block.name}]`  // 이 케이스 제거
```

### **Phase 2: 프로토콜 정의 정리 (15분)**

1. **ExtensionMessage.ts 업데이트**:
```typescript
// src/shared/ExtensionMessage.ts
export type ClineAsk = 
    | "completion_result" 
    | "tool" 
    | "command" 
    | "followup"
    // | "plan_mode_respond"  // 이 라인 삭제
```

2. **proto/ui.proto 업데이트**:
```proto
enum ClineAsk {
    COMPLETION_RESULT = 0;
    // PLAN_MODE_RESPOND = 1;  // 이 라인 삭제
    TOOL = 2;
    COMMAND = 3;  
    FOLLOWUP = 4;
}
```

3. **proto 재컴파일**:
```bash
npm run protos  # 프로토콜 변경사항 반영
```

### **Phase 3: UI 컴포넌트 정리 (15분)**

1. **ChatRow.tsx 업데이트**: plan_mode_respond 케이스 제거
2. **ChatView.tsx 업데이트**: plan_mode_respond 핸들링 제거  
3. **TaskTimeline 컴포넌트들**: plan_mode_respond 표시 로직 제거

### **Phase 4: 테스트 시스템 업데이트 (15분)**

1. **ClineFeatureValidator 업데이트**: plan_mode_respond 검증 제거
2. **테스트 파일들**: plan_mode_respond 관련 테스트 케이스 수정
3. **TestServer.ts**: plan_mode_respond 목킹 제거

## 🔧 **Ask/Agent 모드 동작 방식**

### **Ask 모드 (003-05에서 구현됨)**
```typescript
// Ask 모드에서는 읽기 전용 도구만 사용
const askModeTools = [
    'read_file', 'search_files', 'list_files', 'list_code_definition_names'
]

// 자연스러운 응답 (plan_mode_respond 불필요)
"I can analyze your code and provide recommendations. Let me read the file first..."
```

### **Agent 모드 (003-05에서 구현됨)**  
```typescript
// Agent 모드에서는 plan_mode_respond 제외한 모든 도구 사용
const agentModeTools = allTools.filter(tool => tool.name !== 'plan_mode_respond')

// 자연스러운 협업 응답 (plan_mode_respond 불필요)  
"I'll help you implement this feature. Let me start by creating the necessary files..."
```

## 🔍 **제거 대상 상세 분석**

### **1. 백엔드 파일들 (7개)**
```typescript
// src/core/prompts/system.ts - 5개 위치
Line 277-284: plan_mode_respond 도구 정의
Line 570-574: Plan/Act 모드 설명  
Line 575-590: "What is PLAN MODE?" 섹션

// src/core/task/index.ts - 6개 위치  
Line 2126: toolDescription 케이스
Line 3988-4088: plan_mode_respond 처리 블록
```

### **2. 프로토콜 정의 (3개)**
```typescript
// proto/ui.proto
enum ClineAsk { PLAN_MODE_RESPOND = 1; }

// src/shared/ExtensionMessage.ts  
export type ClineAsk = ... | "plan_mode_respond"

// src/shared/proto-conversions/cline-message.ts
plan_mode_respond 변환 로직
```

### **3. UI 컴포넌트 (4개)**
- ChatRow.tsx: plan_mode_respond 케이스 처리
- ChatView.tsx: plan_mode_respond 핸들링
- TaskTimeline.tsx: plan_mode_respond 표시
- TaskTimelineTooltip.tsx: plan_mode_respond 툴팁

## ⚠️ **주의사항**

### **제거 전 필수 확인사항**
1. **003-05 완료 확인**: Ask/Agent 모드 완전 구현 확인
2. **백업 생성**: 주요 파일 .cline 백업 생성
3. **기능 테스트**: Ask/Agent 모드 정상 작동 확인
4. **UI 호환성**: 기존 대화 히스토리 처리 확인

### **백업 정책**
```bash
# 주요 파일 백업 (CARET MODIFICATION 원칙)
cp src/core/prompts/system.ts src/core/prompts/system.ts.cline
cp src/core/task/index.ts src/core/task/index.ts.cline  
cp proto/ui.proto proto/ui.proto.cline
cp src/shared/ExtensionMessage.ts src/shared/ExtensionMessage.ts.cline
```

### **검증 명령어**
```bash
# plan_mode_respond 완전 제거 확인
grep -r "plan_mode_respond" . --exclude-dir=node_modules
# 결과: 0개 (완전 제거 확인)

# 컴파일 및 테스트
npm run compile
npm run protos  
npm run test:backend
```

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **plan_mode_respond 완전 제거**: grep 검색 결과 0개 ✅
2. **Ask 모드 정상 작동**: 읽기 전용 도구만 사용 ✅
3. **Agent 모드 정상 작동**: 전체 도구 사용 (plan_mode_respond 제외) ✅
4. **자연스러운 대화**: 별도 도구 없이 일반 응답으로 소통 ✅

### **기술적 성공 기준**
1. **컴파일 성공**: TypeScript 및 프로토콜 오류 없음 ✅
2. **테스트 통과**: 수정된 테스트 모두 통과 ✅
3. **UI 정상 동작**: 기존 대화 히스토리 호환성 유지 ✅
4. **성능 유지**: 응답 시간 및 메모리 사용량 동일 ✅

## 📊 **예상 작업 시간**

- **Phase 0**: 003-05 완료 확인 (15분)
- **Phase 1**: 백엔드 제거 (45분)
- **Phase 2**: 프로토콜 정리 (15분)  
- **Phase 3**: UI 정리 (15분)
- **Phase 4**: 테스트 업데이트 (15분)

**총 예상 시간**: 1시간 45분

---

**🎯 목표: Ask/Agent 모드 완성 후 plan_mode_respond 완전 제거!**

**접근 방식: 안전한 제거, 완전한 정리, 자연스러운 대화!** ✨ 