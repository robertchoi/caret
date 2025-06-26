# Task #003-05: Agent 모드 구현 (caret-zero 통합)

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - JSON 시스템 통합 및 완성**  
**예상 시간**: 4-6시간 (작업 범위에 따라 분할 필요)  
**상태**: 📋 **준비 완료** - 003-01~04 완료 후 진행  
**의존성**: 003-04 (JSON 오버레이 시스템) 완료 필수

## 🎯 **목표**

**핵심 목적**: caret-zero의 기존 JSON 시스템을 003-04 오버레이 시스템 기준에 맞게 평가/이전하고, Cline 기능 누락 없이 완전한 Agent 모드 구현

### **세부 목표**
1. **caret-zero JSON 평가**: 기존 JSON 템플릿들의 품질과 완성도 검증 및 보강
  - caret-zero, cline, 혹은 AI가 인지하고 있는 cursor의 system_prompt들의 내용과도 교차 검증 검토
2. **Cline 기능 보존**: web_fetch 등 누락된 기능 식별 및 복원
3. **003-04 시스템 통합**: 오버레이 시스템 기준에 맞는 구조로 재구성
4. **Plan/Act 완전 제거**: plan_mode_respond 등 잔존 제약사항 제거
5. **하드코딩 JSON 변환**: 누락된 Cline 하드코딩 부분을 JSON으로 추가 변환


## ⚠️ **작업 범위 및 분할 고려사항**

**작업 복잡도 분석**:
- caret-zero에 15개+ JSON 섹션 파일 검토 필요
- 3개 rules 파일 평가 및 통합
- Cline 707줄 하드코딩과의 완전성 비교
- 003-04 오버레이 시스템 구조로 재구성

**🚨 분할 권장사항**:
```
Phase A (2-3시간): caret-zero → 003-04 시스템 통합
- JSON 구조 평가 및 변환
- 기본 기능 보존 검증

Phase B (2-3시간): Cline 하드코딩 누락 부분 JSON 변환
- 상세 비교 분석
- 추가 변환 작업

→ 필요시 003-05A, 003-05B로 분할하여 각각 별도 세션에서 진행
```

## 🎨 **설계 철학**

### **caret-zero 기존 작업 활용 원칙**
```typescript
// ✅ caret-zero JSON 시스템 재활용 접근
const reuseStrategy = {
  preserve: "검증된 JSON 구조와 내용은 최대한 보존",
  enhance: "누락된 Cline 기능을 선별적으로 추가",
  standardize: "003-04 오버레이 시스템 구조로 통일",
  validate: "ClineFeatureValidator로 완전성 검증",
  optimize: "간결하고 명료한 표현으로 개선"
}

// 🔍 현재 발견된 caret-zero 이슈들
const identifiedIssues = [
  "plan_mode_respond 도구 잔존 (Plan/Act 미완 제거)",
  "web_fetch 누락 가능성 (Claude4 전용 도구)",
  "003-04 오버레이 구조와 차이 (통합 필요)",
  "일부 도구 설명 간소화 (상세도 부족 가능성)",
  "rules 구조 최적화 필요"
]
```

### **단계별 통합 전략**
```
1. 평가 (Assessment): caret-zero vs Cline 완전성 비교
2. 변환 (Conversion): 003-04 오버레이 구조로 변환
3. 보완 (Supplement): 누락된 기능 JSON으로 추가
4. 검증 (Validation): ClineFeatureValidator로 완전성 확인
5. 최적화 (Optimization): 간결성과 명료성 개선
```

## 📋 **구현 계획**

### **Phase 0: 범위 파악 및 분석 (1시간)**
1. **caret-zero JSON 완전성 분석**:
   ```typescript
   // 분석 대상 파일들
   const analysisTargets = {
     sections: [
       "BASE_PROMPT_INTRO.json", "TOOL_DEFINITIONS.json",
       "MCP_*.json", "EDITING_FILES_GUIDE.json", 
       "CAPABILITIES_SUMMARY.json", "OBJECTIVE.json", "etc..."
     ],
     rules: [
       "common_rules.json", "file_editing_rules.json",
       "cost_consideration_rules.json"
     ],
     systemFile: "system.ts" // JSON 조립 로직 분석
   }
   ```

2. **Cline vs caret-zero 기능 비교**:
   - ClineFeatureValidator로 누락 기능 식별
   - web_fetch, 상세 도구 설명 등 확인
   - plan_mode_respond 제거 필요성 확인

3. **작업 분할 결정**:
   - Phase A/B 분할 필요성 판단
   - 각 Phase별 예상 시간 재산정

### **Phase 1: caret-zero JSON 평가 및 변환 (1.5-2시간)**
1. **JSON 구조 003-04 호환성 검토**:
   ```typescript
   // caret-zero 구조 → 003-04 오버레이 구조 변환
   const conversionMap = {
     "caret-zero sections/": "003-04 PromptTemplate.add.sections[]",
     "caret-zero rules/": "003-04 PromptTemplate.add.behaviors[]",
     "system.ts logic": "003-04 OverlayEngine logic"
   }
   ```

2. **핵심 문제 해결**:
   - plan_mode_respond 도구 완전 제거
   - 도구 설명 상세도 Cline 수준으로 복원
   - MCP 통합 방식 003-04와 정렬

### **Phase 2: 누락 기능 보완 (1-1.5시간)**
1. **Cline 하드코딩 대비 누락 분석**:
   - web_fetch 도구 추가 (Claude4 전용)
   - 상세 도구 설명 보완
   - 시스템 정보 동적 생성 확인

2. **JSON 템플릿 완성**:
   ```json
   // agent-complete.json (최종 완성 템플릿)
   {
     "metadata": {
       "name": "agent-complete", 
       "description": "Complete Agent mode with all Cline features"
     },
     "add": {
       "sections": [...], // caret-zero 변환 + 추가
       "behaviors": [...] // 협력적 지능 + 누락 기능
     },
     "remove": {
       "planActConstraints": [...] // plan_mode_respond 등 제거
     }
   }
   ```

### **Phase 3: 검증 및 최적화 (30-60분)**
1. **완전성 검증**:
   - ClineFeatureValidator로 100% 기능 보존 확인
   - 원본 Cline vs 최종 Agent 모드 비교

2. **품질 개선**:
   - 간결성과 명료성 개선
   - 중복 제거 및 구조 최적화

## 🔧 **기술적 구현 상세**

### **caret-zero 분석 및 변환 도구**
```typescript
// caret-src/core/analysis/CaretZeroAnalyzer.ts
export class CaretZeroAnalyzer {
  private caretLogger: CaretLogger
  private clineValidator: ClineFeatureValidator

  async analyzeCompleteness(): Promise<CaretZeroAnalysisResult> {
    // 1. caret-zero JSON 파일들 로딩
    const sections = await this.loadCaretZeroSections()
    const rules = await this.loadCaretZeroRules()
    
    // 2. 생성된 프롬프트와 Cline 원본 비교
    const caretZeroPrompt = await this.generateCaretZeroPrompt()
    const clinePrompt = await this.generateClinePrompt()
    
    // 3. 기능 완전성 검증
    const validation = await this.clineValidator.validateAllFeatures(clinePrompt, caretZeroPrompt)
    
    return {
      missingFeatures: validation.missingTools,
      qualityIssues: await this.identifyQualityIssues(sections, rules),
      conversionPlan: await this.generateConversionPlan(sections, rules),
      enhancementNeeds: await this.identifyEnhancementNeeds(validation)
    }
  }

  private async identifyQualityIssues(sections: any, rules: any): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    
    // plan_mode_respond 도구 잔존 확인
    if (sections.TOOL_DEFINITIONS?.tools?.plan_mode_respond) {
      issues.push({
        type: 'legacy_constraint',
        severity: 'critical',
        description: 'plan_mode_respond tool still exists',
        fixAction: 'remove_completely'
      })
    }
    
    // 도구 설명 상세도 확인
    for (const [toolName, toolDef] of Object.entries(sections.TOOL_DEFINITIONS?.tools || {})) {
      if (this.isDescriptionTooSimple(toolDef as any)) {
        issues.push({
          type: 'insufficient_detail',
          severity: 'major',
          description: `Tool ${toolName} description too simple`,
          fixAction: 'enhance_description'
        })
      }
    }
    
    return issues
  }
}
```

### **003-04 오버레이 구조 변환기**
```typescript
// caret-src/core/conversion/CaretZeroConverter.ts
export class CaretZeroConverter {
  async convertToOverlayFormat(caretZeroData: any): Promise<PromptTemplate> {
    const template: PromptTemplate = {
      metadata: {
        name: "agent-complete",
        version: "1.0.0",
        description: "Complete Agent mode from caret-zero conversion + Cline enhancements",
        compatibleWith: ["cline-*"],
        source: "caret-zero-converted"
      },
      
      add: {
        sections: await this.convertSections(caretZeroData.sections),
        behaviors: await this.convertRules(caretZeroData.rules),
        tools: await this.addMissingTools() // web_fetch 등
      },
      
      remove: {
        planActConstraints: [
          "plan_mode_respond", // 도구 자체 제거
          "You cannot edit files in plan mode",
          "Switch to act mode to make changes"
        ]
      },
      
      modify: {
        personality: await this.enhancePersonality(caretZeroData.intro),
        toolDescriptions: await this.enhanceToolDescriptions(caretZeroData.tools)
      }
    }
    
    return template
  }

  private async convertSections(sections: any): Promise<TemplateSection[]> {
    const converted: TemplateSection[] = []
    
    // BASE_PROMPT_INTRO → collaborative principles 섹션으로 변환
    if (sections.BASE_PROMPT_INTRO) {
      converted.push({
        id: "collaborative_principles",
        title: "COLLABORATIVE PRINCIPLES",
        content: this.formatCollaborativePrinciples(sections.BASE_PROMPT_INTRO),
        position: "after_objective"
      })
    }
    
    // CAPABILITIES_SUMMARY → enhanced capabilities로 변환
    if (sections.CAPABILITIES_SUMMARY) {
      converted.push({
        id: "enhanced_capabilities",
        title: "ENHANCED CAPABILITIES",
        content: await this.enhanceCapabilities(sections.CAPABILITIES_SUMMARY),
        position: "before_objective"
      })
    }
    
    return converted
  }

  private async addMissingTools(): Promise<ToolAddition[]> {
    const additions: ToolAddition[] = []
    
    // web_fetch 도구 추가 (Claude4 전용)
    additions.push({
      name: "web_fetch",
      description: "Fetch content from a URL. This tool is only available for Claude4 models.",
      parameters: {
        url: {
          required: true,
          type: "string",
          description: "The URL to fetch content from"
        }
      },
      usage: "<web_fetch>\n<url>https://example.com</url>\n</web_fetch>",
      condition: "claude4_only"
    })
    
    return additions
  }
}
```

### **품질 개선 및 최적화**
```typescript
// caret-src/core/optimization/PromptOptimizer.ts
export class PromptOptimizer {
  async optimizeForClarity(template: PromptTemplate): Promise<PromptTemplate> {
    // 1. 중복 제거
    const deduplicated = await this.removeDuplicates(template)
    
    // 2. 명료성 개선
    const clarified = await this.improveClarityAndConciseness(deduplicated)
    
    // 3. 논리적 구조 최적화
    const structured = await this.optimizeLogicalFlow(clarified)
    
    return structured
  }

  private async improveClarityAndConciseness(template: PromptTemplate): Promise<PromptTemplate> {
    // 모호한 표현을 구체적으로 변환
    const clarityMappings = {
      "operate cautiously": "verify assumptions before acting, check preconditions",
      "proceed step-by-step": "break complex tasks into smaller steps, verify each step",
      "collaborate continuously": "ask for guidance when uncertain, explain significant decisions"
    }
    
    // behaviors 섹션 개선
    if (template.add?.behaviors) {
      template.add.behaviors = template.add.behaviors.map(behavior => 
        this.applyClarityMappings(behavior, clarityMappings)
      )
    }
    
    return template
  }
}

### **템플릿 처리 확장**
```typescript
// caret-src/core/prompts/PromptOverlayEngine.ts (확장)
export class PromptOverlayEngine {
  // 기존 메서드들...

  async applyOverlay(originalPrompt: string, template: PromptTemplate): Promise<OverlayResult> {
    let modifiedPrompt = originalPrompt
    const appliedChanges: string[] = []
    const warnings: string[] = []

    try {
      // 1. 제거 작업 (remove 섹션) - Agent 모드에서만 허용
      if (template.remove && template.metadata.name === 'agent-mode') {
        const removeResult = await this.removeConstraints(modifiedPrompt, template.remove)
        modifiedPrompt = removeResult.prompt
        appliedChanges.push(...removeResult.appliedChanges)
        warnings.push(...removeResult.warnings)
      }

      // 2. 기존 add/modify 작업들
      // ... (003-04의 기존 로직)

      // 3. Workflow Rules 적용
      if (template.workflowRules) {
        const rulesResult = await this.applyWorkflowRules(modifiedPrompt, template.workflowRules)
        modifiedPrompt = rulesResult.prompt
        appliedChanges.push(...rulesResult.appliedChanges)
        warnings.push(...rulesResult.warnings)
      }

      return {
        success: true,
        prompt: modifiedPrompt,
        appliedChanges,
        warnings
      }

    } catch (error) {
      // 에러 처리...
    }
  }

  private async removeConstraints(prompt: string, removeConfig: any): Promise<{
    prompt: string
    appliedChanges: string[]
    warnings: string[]
  }> {
    let modifiedPrompt = prompt
    const appliedChanges: string[] = []
    const warnings: string[] = []

    // Plan 모드 제약사항 제거
    if (removeConfig.planModeConstraints) {
      for (const constraint of removeConfig.planModeConstraints) {
        const pattern = new RegExp(constraint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        if (modifiedPrompt.match(pattern)) {
          modifiedPrompt = modifiedPrompt.replace(pattern, '')
          appliedChanges.push(`Removed plan mode constraint: ${constraint}`)
        }
      }
    }

    // Act 모드 문제 문구 제거
    if (removeConfig.actModeProblems) {
      for (const problem of removeConfig.actModeProblems) {
        // 한국어 문구는 영어 패턴으로 찾아서 제거
        const patterns = this.getActModePatterns(problem)
        for (const pattern of patterns) {
          if (modifiedPrompt.match(pattern)) {
            modifiedPrompt = modifiedPrompt.replace(pattern, '')
            appliedChanges.push(`Removed act mode problem: ${problem}`)
          }
        }
      }
    }

    // 모드 전환 지시사항 제거
    if (removeConfig.modeTransitionInstructions) {
      for (const instruction of removeConfig.modeTransitionInstructions) {
        const pattern = new RegExp(instruction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        if (modifiedPrompt.match(pattern)) {
          modifiedPrompt = modifiedPrompt.replace(pattern, '')
          appliedChanges.push(`Removed mode transition instruction: ${instruction}`)
        }
      }
    }

    return { prompt: modifiedPrompt, appliedChanges, warnings }
  }

  private getActModePatterns(koreanDescription: string): RegExp[] {
    // 한국어 설명을 바탕으로 영어 패턴 매핑
    const patternMap: Record<string, RegExp[]> = {
      "성급한 행동을 방지하기 위한 과도한 제약": [
        /act mode.*?immediately.*?without.*?analysis/gi,
        /jump.*?straight.*?into.*?implementation/gi
      ],
      "불완전한 분석을 유도하는 문구": [
        /don't.*?spend.*?too.*?much.*?time.*?analyzing/gi,
        /proceed.*?quickly.*?with.*?implementation/gi
      ],
      "고집스러운 시도를 조장하는 지침": [
        /keep.*?trying.*?until.*?successful/gi,
        /don't.*?give.*?up.*?easily/gi
      ]
    }

    return patternMap[koreanDescription] || []
  }

  private async applyWorkflowRules(prompt: string, workflowRules: any): Promise<{
    prompt: string
    appliedChanges: string[]
    warnings: string[]
  }> {
    const appliedChanges: string[] = []
    const warnings: string[] = []

    // Workflow Rules를 프롬프트에 통합
    const rulesSection = `

====

# WORKFLOW ADAPTATION RULES

Based on the current context and user preferences, adapt your behavior:

${Object.entries(workflowRules).map(([key, value]) => 
  `- **${key.replace(/([A-Z])/g, ' $1').toLowerCase()}**: ${value}`
).join('\n')}

These rules should guide your decision-making process and interaction style with the developer.`

    const modifiedPrompt = prompt + rulesSection
    appliedChanges.push('Applied workflow adaptation rules')

    return { prompt: modifiedPrompt, appliedChanges, warnings }
  }
}
```

### **Agent 모드 활성화 옵션**
```typescript
// caret-src/core/prompts/CaretSystemPrompt.ts (확장)
export interface SystemPromptContext {
  // 기존 필드들...
  agentMode?: boolean // Agent 모드 활성화 옵션
  workflowRules?: WorkflowRule // 사용자별 워크플로우 룰
}

export class CaretSystemPrompt {
  async generateSystemPrompt(context: SystemPromptContext): Promise<string> {
    const startTime = Date.now()
    
    try {
      // 1. Cline 원본 호출
      let systemPrompt = await this.callOriginalSystemPrompt(context)
      
      // 2. Agent 모드 적용 (옵션)
      if (context.agentMode) {
        systemPrompt = await this.applyAgentMode(systemPrompt, context.workflowRules)
      }
      
      // 3. 메트릭 수집 및 로깅
      // ... (기존 로직)
      
      return systemPrompt
      
    } catch (error) {
      this.caretLogger.error('[CaretSystemPrompt] Failed to generate system prompt', error)
      throw error
    }
  }

  private async applyAgentMode(prompt: string, workflowRules?: WorkflowRule): Promise<string> {
    try {
      // Agent 모드 템플릿 로딩
      const agentTemplate = await this.templateLoader.loadTemplate('agent-mode')
      
      // Workflow Rules 통합 (사용자 설정이 있는 경우)
      if (workflowRules) {
        agentTemplate.workflowRules = { ...agentTemplate.workflowRules, ...workflowRules }
      }
      
      // 오버레이 적용
      const overlayResult = await this.overlayEngine.applyOverlay(prompt, agentTemplate)
      
      if (!overlayResult.success) {
        this.caretLogger.warn('[CaretSystemPrompt] Agent mode overlay failed, using original prompt', {
          warnings: overlayResult.warnings
        })
        return prompt
      }
      
      this.caretLogger.info('[CaretSystemPrompt] Agent mode applied successfully', {
        appliedChanges: overlayResult.appliedChanges.length,
        warnings: overlayResult.warnings.length
      })
      
      return overlayResult.prompt
      
    } catch (error) {
      this.caretLogger.error('[CaretSystemPrompt] Failed to apply agent mode, using original prompt', error)
      return prompt
    }
  }
}
```

## ✅ **검증 기준**

### **기능 보존 검증**
- [ ] **모든 도구 보존**: Agent 모드 후에도 모든 Cline 도구 유지
- [ ] **MCP 통합 보존**: 동적 MCP 기능 정상 작동
- [ ] **시스템 정보 보존**: OS, 쉘, 디렉토리 정보 유지
- [ ] **모델별 분기 보존**: Claude4 분기 로직 영향 없음

### **Agent 모드 특성**
- [ ] **Plan/Act 제약 제거**: 모드 전환 지시사항 완전 제거
- [ ] **협력적 행동**: 분석과 실행의 자연스러운 조합
- [ ] **상황 적응**: 복잡도에 따른 적절한 접근 방식
- [ ] **개발자 협력**: 불확실할 때 적극적 소통

### **Workflow Rule 통합**
- [ ] **동적 적응**: 사용자 설정에 따른 행동 조정
- [ ] **규칙 적용**: workflowRules 설정이 행동에 반영
- [ ] **개인화**: 개발자별 선호도 학습 및 적용

## 🚨 **위험 요소 및 대응**

### **주요 위험 요소**
1. **과도한 제거**: 필요한 제약사항까지 제거하여 불안정한 행동
2. **행동 일관성**: Agent 모드에서 예측하기 어려운 행동 패턴  
3. **성능 영향**: 복잡한 템플릿 처리로 인한 지연

### **대응 방안**
1. **선별적 제거**: 검증된 Plan/Act 제약사항만 제거
2. **명확한 가이드라인**: 구체적 행동 패턴으로 일관성 확보
3. **최적화된 템플릿**: 효율적인 제거/추가 로직

## 📝 **Output 파일**

### **구현할 파일들**
1. **`caret-assets/prompt-templates/agent-mode.json`**
   - Agent 모드 완전 구현 템플릿

2. **`caret-src/core/prompts/PromptOverlayEngine.ts`** (확장)
   - remove 섹션 처리 및 Workflow Rules 적용

3. **`caret-src/core/prompts/CaretSystemPrompt.ts`** (확장)  
   - Agent 모드 옵션 및 템플릿 적용

4. **`caret-src/core/prompts/types.ts`** (확장)
   - WorkflowRule, AgentModeConfig 타입 추가

5. **`caret-src/__tests__/agent-mode.test.ts`**
   - Agent 모드 행동 패턴 테스트

## 📝 **Output 파일**

### **Phase A 출력물 (caret-zero 통합)**
1. **`caret-src/core/analysis/CaretZeroAnalyzer.ts`**
   - caret-zero JSON 완전성 분석 도구

2. **`caret-src/core/conversion/CaretZeroConverter.ts`**
   - 003-04 오버레이 구조로 변환하는 컨버터

3. **`caret-assets/prompt-templates/agent-complete.json`**
   - caret-zero 변환 + Cline 보완된 완전한 Agent 모드 템플릿

### **Phase B 출력물 (하드코딩 변환)**
4. **`caret-src/core/optimization/PromptOptimizer.ts`**
   - 간결성과 명료성 개선 도구

5. **`caret-src/__tests__/caret-zero-integration.test.ts`**
   - caret-zero 통합 및 Agent 모드 테스트

6. **`caret-docs/003-05-analysis-report.md`**
   - caret-zero 분석 결과 및 통합 결과 보고서

## ⚠️ **작업 분할 최종 권장사항**

**단일 세션 진행 가능 조건**:
- caret-zero JSON 파일 수가 예상보다 적음 (15개 이하)
- 주요 누락 기능이 web_fetch 정도로 제한적
- 품질 이슈가 심각하지 않은 경우

**분할 진행 권장 조건**:
- caret-zero 분석 결과 대규모 재작업 필요
- 20개 이상 JSON 파일 개별 검토 필요
- 다수의 Cline 기능 누락 발견
- 003-04 시스템과 근본적 구조 차이 존재

**🚨 최종 결정**: Phase 0 분석 결과에 따라 진행 방식 결정

## 🔄 **Next Steps for 003-06**

003-05 완료 후 다음 단계인 003-06에서는:
- **Cline 머징 고려 개발가이드** - JSON 템플릿 시스템 유지보수
- **향후 Cline 업데이트 대응 방안** - 하드코딩 변경 추적 및 JSON 반영
- **시스템 운영 가이드** - Agent 모드 최적화 및 성능 모니터링

---

**🎯 목표**: caret-zero 기존 작업 최대 활용 + Cline 완전성 보장!

**💪 원칙**: 검증된 것은 보존! 누락된 것은 보완! 품질은 개선! 