# Task #003-07: UI Plan/Act → Ask/Agent 버튼 변경

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🎨 **High - UI 일관성 완성**  
**예상 시간**: 1-2시간  
**상태**: 📋 **대기 중** - 003-06 (plan_mode_respond 제거) 완료 후 진행  
**의존성**: ❌ 003-06 (plan_mode_respond 완전 제거) **대기 중**

## 🎯 **목표**

**핵심 목적**: 백엔드 Ask/Agent 모드 시스템이 완성된 후, WebView UI에서 Plan/Act 토글 버튼을 Ask/Agent 버튼으로 변경하여 새로운 모드 시스템과 일치시키고 더 직관적인 사용자 경험 제공

### **⚠️ 작업 전제 조건**
```typescript
// ✅ 003-05, 003-06 완료 후 확보되어야 할 조건들
1. CaretSystemPrompt - Ask/Agent 모드별 프롬프트 생성 완료
2. plan_mode_respond - 모든 파일에서 완전 제거 완료
3. 백엔드 mode 시스템 - SYSTEM_PROMPT에서 mode 전달 완료
4. 도구 필터링 - Ask(읽기 전용), Agent(전체) 구분 완료
```

### **UI 변경 범위**
```typescript
// ❌ 기존 Plan/Act 버튼
<button>Plan</button> / <button>Act</button>
// isInPlanMode: boolean 상태

// ✅ 새로운 Ask/Agent 버튼  
<button>Ask</button> / <button>Agent</button>
// currentMode: 'ask' | 'agent' 상태
```

### **세부 목표**
1. **버튼 텍스트 변경**: Plan → Ask, Act → Agent
2. **모드 상태 변경**: plan/act → ask/agent
3. **아이콘 업데이트**: 모드에 맞는 새로운 아이콘 적용
4. **툴팁/설명 수정**: 새로운 모드 설명으로 업데이트
5. **기본값 설정**: Agent 모드를 기본값으로 설정

## 🔍 **현재 UI 구조 분석**

### **Plan/Act 버튼 위치 파악**
예상 파일들:
- `webview-ui/src/components/ChatView/ChatView.tsx`
- `webview-ui/src/components/SettingsView/SettingsView.tsx`  
- `webview-ui/src/components/common/ModeToggle.tsx` (추정)
- `webview-ui/src/context/ExtensionStateContext.tsx` (상태 관리)

### **현재 상태 구조 (추정)**
```typescript
// ExtensionStateContext.tsx
interface ExtensionState {
  // ❌ 기존 상태
  isInPlanMode: boolean
  
  // ✅ 변경할 상태
  currentMode: 'ask' | 'agent'
}

// 버튼 컴포넌트 (추정)
const ModeToggle = () => {
  const { isInPlanMode, setIsInPlanMode } = useExtensionState()
  
  return (
    <div>
      <button onClick={() => setIsInPlanMode(true)}>
        Plan
      </button>
      <button onClick={() => setIsInPlanMode(false)}>
        Act  
      </button>
    </div>
  )
}
```

### **목표 구조**
```typescript
// ExtensionStateContext.tsx
interface ExtensionState {
  currentMode: 'ask' | 'agent'
  setCurrentMode: (mode: 'ask' | 'agent') => void
}

// 새로운 ModeToggle 컴포넌트
const ModeToggle = () => {
  const { currentMode, setCurrentMode } = useExtensionState()
  
  return (
    <div className="mode-toggle">
      <button 
        className={currentMode === 'ask' ? 'active' : ''}
        onClick={() => setCurrentMode('ask')}
        title="Ask mode: Get expert advice and analysis"
      >
        <QuestionIcon />
        Ask
      </button>
      <button 
        className={currentMode === 'agent' ? 'active' : ''}
        onClick={() => setCurrentMode('agent')}
        title="Agent mode: Collaborative development assistant"
      >
        <BotIcon />
        Agent
      </button>
    </div>
  )
}
```

## 📋 **구현 계획**

### **Phase 0: 003-06 완료 확인 (15분)**
1. **plan_mode_respond 완전 제거 확인**:
```bash
# plan_mode_respond가 완전히 제거되었는지 확인
grep -r "plan_mode_respond" . --exclude-dir=node_modules
# 결과: 0개 (완전 제거 확인)
```

2. **Ask/Agent 백엔드 시스템 작동 확인**:
```typescript
// SYSTEM_PROMPT에서 mode 전달이 정상 작동하는지 확인
const askPrompt = await SYSTEM_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings, false, extensionPath, 'ask')
const agentPrompt = await SYSTEM_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings, false, extensionPath, 'agent')
```

### **Phase 1: 현재 Plan/Act 구현 분석 (30분)**
1. **파일 위치 확인**: grep으로 Plan/Act 관련 파일들 찾기
2. **상태 구조 파악**: 현재 isInPlanMode 상태 관리 방식 확인
3. **UI 컴포넌트 분석**: 버튼 스타일링과 레이아웃 확인
4. **백엔드 연동 분석**: 모드 상태가 백엔드로 어떻게 전달되는지 확인

### **Phase 2: 상태 관리 업데이트 (30분)**
1. **ExtensionStateContext 수정**:
   ```typescript
   // Before: isInPlanMode: boolean
   // After: currentMode: 'ask' | 'agent'
   
   interface ExtensionState {
     // 기존 제거
     // isInPlanMode: boolean
     
     // 새로운 상태 추가
     currentMode: 'ask' | 'agent'
   }
   
   // 기본값을 Agent로 설정
   const initialState: ExtensionState = {
     currentMode: 'agent', // 기본값 Agent
     // ... 기타 상태들
   }
   ```

2. **상태 변경 함수 업데이트**:
   ```typescript
   const setCurrentMode = (mode: 'ask' | 'agent') => {
     setState(prev => ({ ...prev, currentMode: mode }))
     
     // 백엔드에 모드 변경 알림
     vscode.postMessage({
       type: 'modeChanged',
       mode: mode
     })
   }
   ```

### **Phase 3: UI 컴포넌트 변경 (45분)**
1. **버튼 텍스트 및 아이콘 변경**:
   ```typescript
   const ModeToggle: React.FC = () => {
     const { currentMode, setCurrentMode } = useExtensionState()
     
     return (
       <div className="flex gap-2">
         <button
           className={`mode-button ${currentMode === 'ask' ? 'active' : ''}`}
           onClick={() => setCurrentMode('ask')}
           title="Ask mode: Get expert advice and analysis without code changes"
         >
           <svg className="w-4 h-4 mr-1">
             <path d="M8 2a6 6 0 100 12 6 6 0 000-12zM8 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zM8 4a1 1 0 100 2 1 1 0 000-2z"/>
           </svg>
           Ask
         </button>
         
         <button
           className={`mode-button ${currentMode === 'agent' ? 'active' : ''}`}
           onClick={() => setCurrentMode('agent')}
           title="Agent mode: Collaborative development with full capabilities"
         >
           <svg className="w-4 h-4 mr-1">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
           </svg>
           Agent
         </button>
       </div>
     )
   }
   ```

2. **CSS 스타일링 업데이트**:
   ```css
   .mode-button {
     @apply px-3 py-1.5 rounded-md text-sm font-medium transition-colors;
     @apply border border-gray-300 bg-white text-gray-700;
     @apply hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500;
   }
   
   .mode-button.active {
     @apply bg-blue-600 text-white border-blue-600;
   }
   
   .mode-button:hover {
     @apply bg-gray-100;
   }
   
   .mode-button.active:hover {
     @apply bg-blue-700;
   }
   ```

### **Phase 4: 백엔드 연동 업데이트 (15분)**
1. **메시지 타입 업데이트**:
   ```typescript
   // webview-ui/src/types/index.ts
   export interface ModeChangeMessage {
     type: 'modeChanged'
     mode: 'ask' | 'agent'
   }
   
   // 기존 planMode 관련 타입 제거
   // export interface PlanModeMessage { ... }
   ```

2. **백엔드 메시지 핸들러 수정**:
   ```typescript
   // caret-src/core/webview/CaretProvider.ts
   case 'modeChanged':
     // 기존 planMode 핸들러 제거
     // case 'planModeToggle':
     
     // 새로운 모드 핸들러 추가
     const { mode } = message as ModeChangeMessage
     this.currentMode = mode
     
     // 프롬프트 시스템에 모드 전달
     this.caretSystemPrompt.setMode(mode)
     break
   ```

## 🎨 **UI/UX 개선사항**

### **새로운 아이콘 디자인**
```typescript
// Ask 모드 아이콘 (질문/상담)
const AskIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
)

// Agent 모드 아이콘 (협업/도구)
const AgentIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)
```

### **툴팁 설명 개선**
```typescript
const modeDescriptions = {
  ask: {
    title: "Ask Mode",
    description: "Get expert advice and analysis without making changes to your code",
    features: ["Code analysis", "Best practices", "Architecture advice", "Problem solving"]
  },
  agent: {
    title: "Agent Mode", 
    description: "Collaborative development assistant with full capabilities",
    features: ["Code editing", "File management", "Command execution", "Complete solutions"]
  }
}
```

### **상태 표시 개선**
```typescript
const ModeIndicator = () => {
  const { currentMode } = useExtensionState()
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className={`w-2 h-2 rounded-full ${
        currentMode === 'ask' ? 'bg-blue-500' : 'bg-green-500'
      }`} />
      <span>
        {currentMode === 'ask' ? 'Consultation Mode' : 'Development Mode'}
      </span>
    </div>
  )
}
```

## 🔧 **기술적 구현 상세**

### **타입 안전성 보장**
```typescript
// types/index.ts
export type AssistantMode = 'ask' | 'agent'

export interface ExtensionState {
  currentMode: AssistantMode
  setCurrentMode: (mode: AssistantMode) => void
}

// 타입 가드
export const isValidMode = (mode: string): mode is AssistantMode => {
  return mode === 'ask' || mode === 'agent'
}
```

### **로컬 스토리지 연계**
```typescript
// 모드 설정 저장
const persistMode = (mode: AssistantMode) => {
  localStorage.setItem('caret-mode', mode)
}

// 모드 설정 복원
const restoreMode = (): AssistantMode => {
  const saved = localStorage.getItem('caret-mode')
  return isValidMode(saved) ? saved : 'agent' // 기본값 Agent
}
```

### **접근성 개선**
```typescript
const ModeToggle = () => {
  return (
    <div role="radiogroup" aria-label="Assistant mode selection">
      <button
        role="radio"
        aria-checked={currentMode === 'ask'}
        aria-label="Ask mode: consultation and analysis"
        onClick={() => setCurrentMode('ask')}
      >
        Ask
      </button>
      <button
        role="radio" 
        aria-checked={currentMode === 'agent'}
        aria-label="Agent mode: collaborative development"
        onClick={() => setCurrentMode('agent')}
      >
        Agent
      </button>
    </div>
  )
}
```

## ⚠️ **주의사항**

### **하위 호환성 유지**
1. **점진적 마이그레이션**: 기존 isInPlanMode 상태를 즉시 제거하지 말고 currentMode로 변환
2. **폴백 처리**: 기존 설정값 migration 로직 구현
3. **테스트 커버리지**: 모든 UI 상태 변경 테스트

### **사용자 경험 고려사항**
1. **기본값 Agent**: 대부분 사용자는 실행 가능한 모드를 선호
2. **모드 설명**: 첫 사용자를 위한 명확한 설명 제공
3. **시각적 피드백**: 현재 모드 상태를 명확히 표시

### **성능 최적화**
1. **불필요한 리렌더링 방지**: React.memo 사용
2. **상태 업데이트 최적화**: 배치 업데이트 활용
3. **아이콘 최적화**: SVG 아이콘 최적화

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **버튼 변경 완료**: Plan/Act → Ask/Agent 완전 전환 ✅
2. **상태 관리 업데이트**: currentMode 상태 정상 작동 ✅
3. **백엔드 연동**: 모드 변경 시 백엔드 정상 연동 ✅
4. **기본값 설정**: Agent 모드 기본값 적용 ✅

### **UI/UX 성공 기준**
1. **시각적 일관성**: 새로운 디자인 시스템 적용 ✅
2. **사용성**: 직관적인 모드 전환 가능 ✅
3. **접근성**: 키보드 네비게이션 및 스크린 리더 지원 ✅
4. **반응성**: 모든 화면 크기에서 정상 작동 ✅

### **기술적 성공 기준**
1. **타입 안전성**: TypeScript 오류 없음 ✅
2. **테스트 통과**: 모든 UI 테스트 정상 통과 ✅
3. **성능 유지**: 렌더링 성능 영향 없음 ✅
4. **호환성**: 기존 사용자 설정 정상 migration ✅

---

**🎯 목표: Plan/Act UI → Ask/Agent UI 완전 전환!**

**접근 방식: 사용자 친화적 디자인, 직관적 경험, 완벽한 연동!** ✨ 