# Task #003-05: CaretSystemPrompt mode 지원 추가 (Ask/Agent 모드 구현)

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - Ask/Agent 모드 시스템 구현**  
**예상 시간**: 2-3시간  
**상태**: ✅ **완료** - CaretSystemPrompt Ask/Agent 모드 지원 완성  
**의존성**: ✅ 003-04 (JSON 변환) **완료**

## 🎯 **목표**

**핵심 목적**: CaretSystemPrompt에 Ask/Agent 모드 지원을 추가하여 mode별 도구 필터링과 프롬프트 생성을 구현

### **✅ 완성된 구현**
- **✅ mode 매개변수 추가**: CaretSystemPrompt.generateFromJsonSections()에 mode: 'ask' | 'agent' 지원
- **✅ 도구 필터링 구현**: Ask 모드(읽기 전용), Agent 모드(plan_mode_respond 제외)
- **✅ SYSTEM_PROMPT 연결**: extensionPath, mode 매개변수 추가 및 CaretSystemPrompt 연결
- **✅ ASK_AGENT_MODES.json 개선**: capabilities, available_tools 필드 추가

```typescript
// ❌ 현재 CaretSystemPrompt.generateFromJsonSections()
async generateFromJsonSections(
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: any,
    browserSettings: any,
    isClaude4ModelFamily: boolean = false
): Promise<string>

// ✅ 구현해야 할 목표
async generateFromJsonSections(
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: any,
    browserSettings: any,
    isClaude4ModelFamily: boolean = false,
    mode: 'ask' | 'agent' = 'agent'  // 추가 필요!
): Promise<string>
```

## 📋 **구현 계획**

### **Phase 1: CaretSystemPrompt mode 지원 추가 (90분)**

1. **generateFromJsonSections에 mode 매개변수 추가**:
```typescript
async generateFromJsonSections(
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: any,
    browserSettings: any,
    isClaude4ModelFamily: boolean = false,
    mode: 'ask' | 'agent' = 'agent'
): Promise<string> {
    // mode에 따른 도구 필터링 로직 추가
    const filteredToolDefinitions = this.filterToolsByMode(mode)
    
    // mode별 프롬프트 섹션 조정
    const modeSections = await this.loadModeSpecificSections(mode)
    
    // 기존 로직에 mode 반영
}
```

2. **Ask/Agent 모드별 도구 필터링 구현**:
```typescript
private filterToolsByMode(mode: 'ask' | 'agent'): any {
    const allTools = this.loadAllToolDefinitions()
    
    if (mode === 'ask') {
        // Ask 모드: 읽기 전용 도구만
        return {
            ...allTools,
            tools: allTools.tools.filter(tool => 
                ['read_file', 'search_files', 'list_files', 'list_code_definition_names']
                .includes(tool.name)
            )
        }
    }
    
    // Agent 모드: plan_mode_respond 제외한 모든 도구
    return {
        ...allTools,
        tools: allTools.tools.filter(tool => tool.name !== 'plan_mode_respond')
    }
}
```

3. **모드별 섹션 로딩 추가**:
```typescript
private async loadModeSpecificSections(mode: 'ask' | 'agent'): Promise<string[]> {
    const sections: string[] = []
    
    // Ask/Agent 모드 설명 섹션 로드
    const modeTemplate = await this.templateLoader.loadTemplate('ASK_AGENT_MODES')
    const modeSection = this.formatModeSection(modeTemplate, mode)
    sections.push(modeSection)
    
    return sections
}
```

### **Phase 2: SYSTEM_PROMPT 함수 mode 전달 (30분)**

1. **system.ts에서 mode 매개변수 추가**:
```typescript
// src/core/prompts/system.ts
export const SYSTEM_PROMPT = async (
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: McpHub,
    browserSettings: BrowserSettings,
    isClaude4ModelFamily: boolean = false,
    extensionPath?: string,
    mode: 'ask' | 'agent' = 'agent'  // 추가!
) => {
    // CARET MODIFICATION: mode 매개변수를 CaretSystemPrompt에 전달
    if (extensionPath) {
        try {
            const caretPrompt = CaretSystemPrompt.getInstance(extensionPath)
            return await caretPrompt.generateFromJsonSections(
                cwd, supportsBrowserUse, mcpHub, browserSettings, 
                isClaude4ModelFamily, mode  // mode 전달!
            )
        } catch (error) {
            console.warn('[CARET] CaretSystemPrompt failed, falling back to original:', error)
        }
    }
    
    // 폴백 로직도 mode 고려
    return await ORIGINAL_SYSTEM_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
}
```

2. **task/index.ts에서 mode 전달 추가**:
```typescript
// src/core/task/index.ts에서 SYSTEM_PROMPT 호출 시 mode 전달
const systemPrompt = await SYSTEM_PROMPT(
    cwd,
    supportsBrowserUse,
    mcpHub,
    browserSettings,
    isClaude4ModelFamily,
    this.getContext().extensionPath,
    this.getCurrentMode() // mode 전달 추가
)
```

### **Phase 3: ASK_AGENT_MODES.json 개선 (30분)**

1. **모드별 상세 설명 추가**:
```json
{
  "ask_mode": {
    "title": "Ask Mode - Expert Consultation",
    "description": "In Ask mode, I provide expert consultation and analysis without making changes to your code.",
    "capabilities": [
      "Code analysis and review",
      "Architecture recommendations", 
      "Best practices guidance",
      "Problem diagnosis",
      "Learning and education"
    ],
    "available_tools": [
      "read_file", "search_files", "list_files", "list_code_definition_names"
    ],
    "behavior": "I'll analyze your code and provide detailed insights, suggestions, and explanations to help you understand and improve your project."
  },
  "agent_mode": {
    "title": "Agent Mode - Collaborative Development",
    "description": "In Agent mode, I work as your collaborative development partner with full capabilities.",
    "capabilities": [
      "Code editing and refactoring",
      "File management",
      "Command execution", 
      "Complete feature implementation",
      "Debugging and testing"
    ],
    "available_tools": "all_except_plan_mode_respond",
    "behavior": "I'll actively help implement solutions, write code, manage files, and execute commands to accomplish your development goals."
  }
}
```

### **Phase 4: 테스트 및 검증 (30분)**

1. **mode 지원 테스트 작성**:
```typescript
// caret-src/__tests__/caret-system-prompt-mode.test.ts
describe('CaretSystemPrompt Mode Support', () => {
    it('should generate Ask mode prompt with limited tools', async () => {
        const prompt = await caretSystemPrompt.generateFromJsonSections(
            '/test', true, mockMcpHub, mockBrowserSettings, false, 'ask'
        )
        
        // Ask 모드 도구만 포함되어야 함
        expect(prompt).toContain('read_file')
        expect(prompt).not.toContain('write_to_file')
        expect(prompt).not.toContain('execute_command')
    })
    
    it('should generate Agent mode prompt with full tools', async () => {
        const prompt = await caretSystemPrompt.generateFromJsonSections(
            '/test', true, mockMcpHub, mockBrowserSettings, false, 'agent'
        )
        
        // Agent 모드에서는 plan_mode_respond 제외한 모든 도구
        expect(prompt).toContain('write_to_file')
        expect(prompt).toContain('execute_command')
        expect(prompt).not.toContain('plan_mode_respond')
    })
})
```

## 🔧 **기술적 구현 상세**

### **모드별 프롬프트 차별화**
```typescript
private formatModeSection(template: any, mode: 'ask' | 'agent'): string {
    if (mode === 'ask') {
        return `
## Current Mode: ASK MODE

You are currently in Ask mode - a consultation-focused mode where you provide expert analysis and guidance without making changes to the codebase.

**Your role**: Expert consultant and advisor
**Your capabilities**: Analysis, recommendations, education, problem-solving guidance
**Your limitations**: No code editing, no file modifications, no command execution

Approach each request with thorough analysis and helpful guidance while respecting the read-only nature of this mode.
`
    } else {
        return `
## Current Mode: AGENT MODE  

You are currently in Agent mode - a collaborative development mode where you work as a full development partner.

**Your role**: Collaborative development assistant
**Your capabilities**: Full code editing, file management, command execution, complete implementation
**Your approach**: Proactive problem-solving with direct action

Work collaboratively to implement solutions, suggest improvements, and actively contribute to the development process.
`
    }
}
```

### **타입 안전성 보장**
```typescript
// caret-src/shared/types.ts
export type AssistantMode = 'ask' | 'agent'

export interface SystemPromptContext {
    cwd: string
    supportsBrowserUse: boolean
    mcpHub: any
    browserSettings: any
    isClaude4ModelFamily: boolean
    mode: AssistantMode
}
```

## ⚠️ **주의사항**

### **하위 호환성 유지**
1. **기본값 설정**: mode 매개변수 기본값을 'agent'로 설정
2. **폴백 처리**: CaretSystemPrompt 실패 시 원본 Cline 시스템 사용
3. **점진적 적용**: 기존 호출 지점에서 mode 전달 없어도 정상 작동

### **성능 고려사항**
1. **도구 필터링 최적화**: 매번 필터링하지 않고 캐싱 고려
2. **템플릿 로딩 최적화**: 모드별 섹션 캐싱
3. **메모리 사용량**: 모드별 프롬프트 생성 시 메모리 효율성

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **Ask 모드**: 읽기 전용 도구만 포함된 프롬프트 생성 ✅
2. **Agent 모드**: plan_mode_respond 제외한 모든 도구 포함 ✅
3. **모드 전달**: SYSTEM_PROMPT → CaretSystemPrompt mode 전달 ✅
4. **하위 호환성**: 기존 코드 정상 작동 ✅

### **기술적 성공 기준**
1. **컴파일 성공**: TypeScript 오류 없음 ✅
2. **테스트 통과**: mode 관련 테스트 모두 통과 ✅  
3. **성능 유지**: 프롬프트 생성 시간 동일 수준 ✅
4. **타입 안전성**: AssistantMode 타입 적용 ✅

---

**🎯 목표: CaretSystemPrompt에 Ask/Agent 모드 완전 구현!**

**접근 방식: mode 매개변수 추가, 도구 필터링, 모드별 프롬프트!** ✨ 