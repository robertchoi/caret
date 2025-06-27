# Task #003-06: Ask/Agent 모드 JSON 템플릿 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 모드 시스템 혁신**  
**예상 시간**: 2-3시간  
**상태**: 📋 **준비 완료** - 003-05 완료 후 진행  
**의존성**: ✅ 003-05 (CaretSystemPrompt 통합) **완료 필요**

## 🎯 **목표**

**핵심 목적**: Cline의 Plan/Act 모드를 Cursor 스타일의 Ask/Agent 모드로 변경하고, plan_mode_respond 도구를 제거하여 더 자연스러운 협력적 AI 어시스턴트 구현

### **현재 Plan/Act 모드의 문제점**
```typescript
// ❌ 현재 Cline Plan/Act 모드
- Plan Mode: "계획만 세우고 실행 불가" → 설계 단계 활용 어려움
- Act Mode: "무조건 행동 강제" → 논의나 상담 불가능
- plan_mode_respond: "별도 도구로 응답" → 부자연스러운 대화

// Plan/Act 모드 설명 (src/core/prompts/system.ts:558-566)
"- ACT MODE: In this mode, you have access to all tools EXCEPT the plan_mode_respond tool.
- PLAN MODE: In this special mode, you have access to the plan_mode_respond tool."
```

### **목표: Ask/Agent 모드**
```json
{
  "Ask Mode": {
    "purpose": "질의응답 전용 - 코드 실행 없이 전문적 조언과 분석 제공",
    "tools": "read_file, search_files 등 분석 도구만",
    "behavior": "SW 개발 전문가 관점의 상담 역할"
  },
  "Agent Mode": {
    "purpose": "생각하며 협업하는 지능형 AI 어시스턴트 (기본값)",
    "tools": "모든 도구 접근 가능",
    "behavior": "분석과 실행을 자연스럽게 결합, 협력적 접근"
  }
}
```

### **세부 목표**
1. **plan_mode_respond 완전 제거**: 모든 관련 코드와 설명 삭제
2. **Ask/Agent JSON 템플릿 생성**: 모드별 차별화된 프롬프트 구현
3. **자연스러운 대화**: 별도 도구 없이 일반 응답으로 소통
4. **기본값 Agent**: Agent 모드를 기본값으로 설정

## 🔍 **현재 Plan/Act 구조 분석**

### **제거해야 할 Plan/Act 요소들**
```typescript
// 1. TOOL_DEFINITIONS.json에서 plan_mode_respond 제거
"plan_mode_respond": {
  "description": "Respond to the user in PLAN MODE",
  "params": {
    "response": {
      "type": "string",
      "required": true,
      "desc": "The response to provide"
    }
  }
}

// 2. Plan/Act 모드 설명 제거 (src/core/prompts/system.ts:558-566)
"- ACT MODE: In this mode, you have access to all tools EXCEPT the plan_mode_respond tool.
- PLAN MODE: In this special mode, you have access to the plan_mode_respond tool."

// 3. Plan 모드 제약 설명 제거
"You cannot edit files in plan mode"
"Switch to act mode to make changes"
```

### **추가할 Ask/Agent 모드 요소들**
```json
// Ask Mode JSON Template
{
  "mode": "ask",
  "personality": "You are a thoughtful software development consultant",
  "tools_restriction": {
    "allowed": ["read_file", "search_files", "list_files", "list_code_definition_names"],
    "forbidden": ["write_to_file", "replace_in_file", "execute_command"]
  },
  "behavior": "Provide expert analysis and advice without making changes"
}

// Agent Mode JSON Template  
{
  "mode": "agent",
  "personality": "You are a collaborative coding assistant",
  "tools_access": "all",
  "behavior": "Think and act fluidly, balancing analysis with action as needed"
}
```

## 📋 **구현 계획**

### **Phase 0: Plan/Act 요소 제거 (30분)**
1. **TOOL_DEFINITIONS.json 수정**: plan_mode_respond 도구 완전 제거
2. **Plan/Act 모드 설명 제거**: JSON 섹션에서 모드 설명 삭제
3. **백업 생성**: 수정 전 모든 파일 백업

### **Phase 1: Ask/Agent JSON 템플릿 생성 (1시간)**
1. **ASK_MODE.json 생성**:
   ```json
   {
     "mode": "ask",
     "title": "ASK MODE - Consultation & Analysis",
     "description": "In Ask mode, you provide expert software development consultation without making direct changes to code or files.",
     
     "personality": {
       "role": "You are a thoughtful software development consultant and advisor",
       "approach": "Provide comprehensive analysis, expert advice, and strategic guidance",
       "communication": "Clear, detailed explanations with practical recommendations"
     },
     
     "tool_restrictions": {
       "analysis_tools": ["read_file", "search_files", "list_files", "list_code_definition_names"],
       "forbidden_tools": ["write_to_file", "replace_in_file", "execute_command"],
       "reason": "Ask mode focuses on analysis and advice without making changes"
     },
     
     "behavior_guidelines": [
       "Thoroughly analyze the codebase and requirements before providing advice",
       "Offer multiple solution approaches with pros and cons",
       "Provide code examples and detailed explanations when helpful",
       "Ask clarifying questions to better understand the developer's needs",
       "Focus on best practices, design patterns, and maintainable solutions"
     ]
   }
   ```

2. **AGENT_MODE.json 생성**:
   ```json
   {
     "mode": "agent",
     "title": "AGENT MODE - Collaborative Development",
     "description": "In Agent mode, you work as a collaborative coding partner, balancing thoughtful analysis with practical action.",
     
     "personality": {
       "role": "You are a collaborative coding assistant and development partner", 
       "approach": "Think critically, act thoughtfully, and work alongside the developer",
       "communication": "Natural, supportive dialogue with clear reasoning"
     },
     
     "tool_access": {
       "availability": "all_tools",
       "philosophy": "Use the right tool for the right task at the right time"
     },
     
     "collaboration_principles": [
       "Think before acting - analyze the full context before taking action",
       "Ask when uncertain - don't hesitate to seek clarification or guidance",
       "Explain your reasoning - clearly communicate your thought process",
       "Respect developer intent - understand and align with the developer's goals",
       "Learn from feedback - adapt based on developer preferences and guidance"
     ],
     
     "adaptive_behavior": [
       "Balance analysis and action based on the situation complexity",
       "Engage in natural dialogue without artificial mode restrictions",
       "Take initiative when appropriate, ask for guidance when needed",
       "Provide both immediate solutions and long-term architectural insights"
     ]
   }
   ```

### **Phase 2: JSON 섹션 시스템 통합 (1시간)**
1. **MODE_SELECTION.json 생성**:
   ```json
   {
     "mode_system": {
       "default_mode": "agent",
       "available_modes": ["ask", "agent"],
       
       "mode_descriptions": {
         "ask": "Consultation and analysis without code changes",
         "agent": "Collaborative development with full tool access"
       },
       
       "mode_switching": {
         "natural": "You can naturally adapt your approach based on the user's needs",
         "explicit": "Users can explicitly request mode changes if needed"
       }
     }
   }
   ```

2. **CaretSystemPrompt 모드 지원 확장**:
   ```typescript
   // CaretSystemPrompt.ts 확장
   async generateFromJsonSections(
     // ... 기존 매개변수
     mode: 'ask' | 'agent' = 'agent'
   ): Promise<string> {
     // 기본 섹션 로딩
     const baseSections = await this.loadBaseSections()
     
     // 모드별 섹션 추가
     const modeSections = await this.loadModeSections(mode)
     
     // 모드에 따른 도구 필터링
     const toolSections = await this.filterToolsByMode(mode)
     
     return this.assemblePromptWithMode(baseSections, modeSections, toolSections)
   }
   ```

### **Phase 3: 도구 필터링 시스템 (30분)**
1. **Ask 모드 도구 제한 구현**:
   ```typescript
   private filterToolsByMode(mode: string): ToolSection[] {
     const allTools = this.loadAllTools()
     
     if (mode === 'ask') {
       // Ask 모드: 분석 도구만 허용
       return allTools.filter(tool => 
         ['read_file', 'search_files', 'list_files', 'list_code_definition_names']
         .includes(tool.name)
       )
     }
     
     // Agent 모드: 모든 도구 허용 (plan_mode_respond 제외)
     return allTools.filter(tool => tool.name !== 'plan_mode_respond')
   }
   ```

2. **모드별 동적 프롬프트 생성**: 모드에 따라 다른 도구 목록과 행동 지침 적용

## 🔧 **기술적 구현 상세**

### **JSON 섹션 조합 로직**
```typescript
// 모드별 섹션 조합 순서
const getModeSpecificSections = (mode: 'ask' | 'agent') => {
  const baseSections = [
    'BASE_PROMPT_INTRO',
    'COLLABORATION_PRINCIPLES'
  ]
  
  const modeSections = mode === 'ask' 
    ? ['ASK_MODE', 'ANALYSIS_GUIDELINES']
    : ['AGENT_MODE', 'COLLABORATIVE_GUIDELINES']
    
  return [
    ...baseSections,
    ...modeSections,
    'TOOL_USE_HEADER',
    'TOOL_DEFINITIONS', // 모드별 필터링됨
    'OBJECTIVE'
  ]
}
```

### **자연스러운 모드 전환**
```json
{
  "mode_transition": {
    "natural_adaptation": "You naturally adapt your approach based on user needs without explicit mode announcements",
    "user_preference": "If users prefer a specific working style, adjust accordingly",
    "seamless_experience": "Avoid artificial limitations that interrupt natural workflow"
  }
}
```

## ⚠️ **주의사항**

### **제거 시 주의사항**
1. **plan_mode_respond 완전 제거**: 모든 파일에서 흔적 없이 삭제
2. **기존 테스트 영향**: plan_mode_respond 관련 테스트 수정 필요
3. **UI 연동 준비**: 003-07에서 UI 변경 작업과 연계
4. **하위 호환성**: 기존 사용자 경험 최대한 보존

### **Agent 모드 구현 원칙**
1. **자연스러운 대화**: 별도 도구 없이 일반 응답
2. **균형잡힌 접근**: 분석과 실행의 적절한 조화
3. **협력적 지능**: 개발자와 함께 문제 해결
4. **상황 적응**: 복잡도에 따른 유연한 대응

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **plan_mode_respond 완전 제거**: 모든 관련 코드 삭제 완료
2. **Ask/Agent 모드 구현**: JSON 템플릿 기반 모드 시스템 완성
3. **자연스러운 대화**: 모드별 적절한 행동 패턴 구현
4. **도구 필터링**: Ask 모드에서 적절한 도구 제한

### **기술적 성공 기준**
1. **JSON 시스템 통합**: CaretSystemPrompt와 완벽 연동
2. **테스트 통과**: 수정된 기능 모든 테스트 통과
3. **성능 유지**: 모드 전환 오버헤드 최소화
4. **확장성**: 향후 추가 모드 지원 가능한 구조

---

**🎯 목표: Plan/Act → Ask/Agent 모드 혁신!**

**접근 방식: 자연스러운 협력, 상황별 적응, 사용자 중심 경험!** ✨ 