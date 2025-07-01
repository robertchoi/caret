# Task #003-08: AI 핵심 프롬프트 파일 JSON 변환 실행

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🔥 **Critical - AI 행동 개선 실행**  
**예상 시간**: 5-6시간  
**상태**: 📋 **예정**  
**의존성**: ✅ 003-07 (AI 프롬프트 검증 도구) 완료

## 🎯 **목표: AI 핵심 프롬프트 파일들의 실제 JSON 변환 실행**

### **핵심 목적**
- **AI 행동 개선**: claude4.ts 등 핵심 프롬프트의 실제 JSON 모듈화 구현
- **토큰 비용 절약**: 20-40% 토큰 효율성 달성 (검증된 예측 기반)
- **003-07 검증 활용**: 검증 도구 기반 안전한 단계별 변환
- **Cline/Caret 양쪽 모드 지원**: 모드별 다른 동작 패턴 완벽 구현
- **🚨 완벽한 호환성**: 기존 AI 행동 100% 보존하며 향상

### **🎯 변환 실행 계획**

#### **🔥 Phase별 변환 우선순위 (003-07 분석 결과 기반)**
```typescript
📁 변환 우선순위:
├── Phase 1: commands.ts (179줄) - 저위험, 높은 구조화
│   ├── 변환 위험도: 🟢 Low
│   ├── 예상 토큰 절약: 🔥 40%
│   └── 검증 용이성: ✅ High
├── Phase 2: claude4.ts (715줄) - 최대 효과
│   ├── 변환 위험도: 🟡 Medium
│   ├── 예상 토큰 절약: 🔥 30%
│   └── 영향도: 🔥 Very High
├── Phase 3: claude4-experimental.ts (347줄) - 실험 기능
│   ├── 변환 위험도: 🟡 Medium
│   ├── 예상 토큰 절약: 🔥 25%
│   └── 혁신성: ✅ High
└── Phase 4: loadMcpDocumentation.ts (362줄) - 복잡도 최고
    ├── 변환 위험도: 🔴 High
    ├── 예상 토큰 절약: 🟡 20%
    └── 기술적 도전: 🔥 Very High
```

### **🎯 Cline/Caret 모드 구현 전략**

#### **모드별 동작 차이점**
```typescript
// Cline 모드 (기존 Plan/Act 패턴)
{
  "mode_detection": "plan|act",
  "terminology": {
    "task_mode": "Plan Mode / Act Mode",
    "interaction_style": "Traditional tool-based workflow",
    "completion": "attempt_completion tool"
  },
  "prompt_sections": ["PLAN_MODE_INSTRUCTIONS", "ACT_MODE_GUIDELINES"]
}

// Caret 모드 (Chatbot/Agent 패턴)  
{
  "mode_detection": "chatbot|agent",
  "terminology": {
    "task_mode": "Chatbot Mode / Agent Mode", 
    "interaction_style": "Collaborative partnership",
    "completion": "Natural conversation flow"
  },
  "prompt_sections": ["CHATBOT_AGENT_MODES", "COLLABORATIVE_PRINCIPLES"]
}
```

## 📋 **단계별 JSON 변환 실행 계획**

### **Phase 1: commands.ts JSON 변환 (1시간) - 최우선**

#### **1.1 명령어 구조 분석 및 JSON 추출**
```typescript
// 현재: src/core/prompts/commands.ts (179줄)
export const someCommand = (param1: string, param2: number) => {
  return `Command: ${param1} with value ${param2}`
}

// 변환 후: caret-src/core/prompts/sections/COMMANDS.json
{
  "commands": {
    "some_command": {
      "template": "Command: {{param1}} with value {{param2}}",
      "parameters": {
        "param1": {
          "type": "string",
          "required": true,
          "description": "Command identifier"
        },
        "param2": {
          "type": "number", 
          "required": true,
          "description": "Command value"
        }
      },
      "mode_variations": {
        "cline": {
          "prefix": "[CLINE] ",
          "style": "formal"
        },
        "caret": {
          "prefix": "[CARET] ",
          "style": "collaborative" 
        }
      }
    }
  }
}
```

#### **1.2 CaretCommands 클래스 구현**
```typescript
// caret-src/core/prompts/CaretCommands.ts
export class CaretCommands {
  private jsonLoader: JsonTemplateLoader
  private currentMode: 'cline' | 'caret'

  constructor(extensionPath: string, mode: 'cline' | 'caret' = 'caret') {
    this.jsonLoader = new JsonTemplateLoader(extensionPath)
    this.currentMode = mode
  }

  async generateCommand(
    commandName: string, 
    parameters: Record<string, any>
  ): Promise<string> {
    const commandsSection = await this.jsonLoader.loadSection('COMMANDS')
    const commandTemplate = commandsSection.commands[commandName]
    
    if (!commandTemplate) {
      throw new Error(`Unknown command: ${commandName}`)
    }

    // 모드별 변형 적용
    const modeVariation = commandTemplate.mode_variations[this.currentMode]
    let result = this.jsonLoader.renderTemplate(commandTemplate.template, parameters)
    
    if (modeVariation?.prefix) {
      result = modeVariation.prefix + result
    }

    return result
  }

  // 기존 함수들과의 호환성을 위한 래퍼 메서드들
  someCommand(param1: string, param2: number): string {
    return this.generateCommand('some_command', { param1, param2 })
  }
}
```

#### **1.3 점진적 교체 및 검증**
```typescript
// src/core/prompts/commands.ts - 점진적 래퍼 적용
import { CaretCommands } from '../../../caret-src/core/prompts/CaretCommands'

// CARET MODIFICATION: 점진적 JSON 변환 - 명령어 시스템
let caretCommands: CaretCommands | null = null

export const someCommand = (param1: string, param2: number): string => {
  // 원본 결과 계산 (fallback용)
  const originalResult = `Command: ${param1} with value ${param2}`

  try {
    if (!caretCommands) {
      const extensionPath = (global as any).extensionPath
      const mode = (global as any).caretMode || 'caret' 
      caretCommands = new CaretCommands(extensionPath, mode)
    }
    
    const jsonResult = caretCommands.someCommand(param1, param2)
    
    // 003-07 검증 도구로 품질 검증
    const qualityScore = await validateCommandOutput(originalResult, jsonResult)
    if (qualityScore < 0.95) {
      console.warn(`[CARET] Command quality below threshold: ${qualityScore}`)
      return originalResult
    }
    
    return jsonResult
  } catch (error) {
    console.warn('[CARET] Command generation failed, using original:', error)
    return originalResult
  }
}
```

### **Phase 2: claude4.ts JSON 변환 (2시간) - 최대 효과**

#### **2.1 Claude4 프롬프트 섹션 분리**
```typescript
// 현재: src/core/prompts/model_prompts/claude4.ts (715줄)
export const SYSTEM_PROMPT_CLAUDE4 = async (...) => {
  return `You are Cline, a highly skilled software engineer...
  // 715줄의 하드코딩된 프롬프트
  `
}

// 변환 후: JSON 섹션들로 분리
📁 caret-src/core/prompts/sections/claude4/
├── CLAUDE4_BASE_INTRO.json - 기본 소개 및 정체성
├── CLAUDE4_TOOL_DEFINITIONS.json - Claude4 최적화된 도구 정의
├── CLAUDE4_PERFORMANCE_OPTIMIZATIONS.json - 성능 최적화 구간
├── CLAUDE4_RULES.json - Claude4 특화 규칙
├── CLAUDE4_CAPABILITIES.json - 역량 및 제한사항
├── CLAUDE4_OBJECTIVE.json - 목표 및 절차
└── CLAUDE4_MODE_VARIATIONS.json - Cline/Caret 모드별 변형
```

#### **2.2 Claude4 모드별 변형 구현**
```typescript
// CLAUDE4_MODE_VARIATIONS.json
{
  "mode_variations": {
    "cline": {
      "identity": "You are Cline, a highly skilled software engineer...",
      "task_management": {
        "modes": ["PLAN MODE", "ACT MODE"],
        "mode_switching": "Manual user toggle",
        "completion_tool": "attempt_completion"
      },
      "terminology": {
        "work_mode": "Plan/Act workflow",
        "interaction": "Tool-based execution",
        "user_guidance": "Direct command following"
      }
    },
    "caret": {
      "identity": "You are Caret, a collaborative AI coding partner...",
      "task_management": {
        "modes": ["Chatbot Mode", "Agent Mode"], 
        "mode_switching": "Intelligent context-aware",
        "completion_tool": "collaborative_completion"
      },
      "terminology": {
        "work_mode": "Chatbot/Agent collaboration",
        "interaction": "Natural partnership",
        "user_guidance": "Proactive suggestion and guidance"
      }
    }
  }
}
```

#### **2.3 CaretClaude4Prompt 클래스 구현**
```typescript
// caret-src/core/prompts/CaretClaude4Prompt.ts
export class CaretClaude4Prompt {
  private jsonLoader: JsonTemplateLoader
  private currentMode: 'cline' | 'caret'

  constructor(extensionPath: string, mode: 'cline' | 'caret' = 'caret') {
    this.jsonLoader = new JsonTemplateLoader(extensionPath)
    this.currentMode = mode
  }

  async generateClaude4Prompt(
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: any,
    browserSettings: any
  ): Promise<string> {
    // JSON 섹션들 로드
    const sections = await Promise.all([
      this.jsonLoader.loadSection('claude4/CLAUDE4_BASE_INTRO'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_TOOL_DEFINITIONS'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_PERFORMANCE_OPTIMIZATIONS'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_RULES'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_CAPABILITIES'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_OBJECTIVE'),
      this.jsonLoader.loadSection('claude4/CLAUDE4_MODE_VARIATIONS')
    ])

    // 모드별 변형 적용
    const modeVariations = sections[6].mode_variations[this.currentMode]
    
    // 동적 정보 수집
    const dynamicContext = {
      cwd: cwd,
      supportsBrowserUse,
      mcpServers: await this.extractMcpServers(mcpHub),
      systemInfo: await this.getSystemInfo(),
      mode: this.currentMode,
      modeTerminology: modeVariations.terminology
    }

    // 템플릿 렌더링 및 조합
    return this.jsonLoader.renderCombinedTemplate(sections, dynamicContext)
  }

  private async extractMcpServers(mcpHub: any): Promise<any[]> {
    // MCP 서버 정보 동적 추출 (기존 로직 재활용)
    return []
  }

  private async getSystemInfo(): Promise<any> {
    // 시스템 정보 동적 생성 (기존 로직 재활용)
    return {}
  }
}
```

### **Phase 3: claude4-experimental.ts JSON 변환 (1.5시간)**

#### **3.1 실험적 기능 모듈화**
```typescript
// 현재: src/core/prompts/model_prompts/claude4-experimental.ts (347줄)
export const SYSTEM_PROMPT_CLAUDE4_EXPERIMENTAL = async (...) => {
  // MultiEdit Tool, 실험적 기능들
}

// 변환 후: 실험적 기능 섹션화
📁 caret-src/core/prompts/sections/claude4-experimental/
├── EXPERIMENTAL_FEATURES.json - 실험적 기능 목록
├── MULTIEDIT_TOOL.json - MultiEdit 도구 정의  
├── EXPERIMENTAL_GUIDELINES.json - 실험 기능 사용 가이드
├── FEATURE_FLAGS.json - 기능 플래그 관리
└── EXPERIMENTAL_MODE_VARIATIONS.json - 모드별 실험 기능 차이
```

#### **3.2 실험적 기능 플래그 시스템**
```typescript
// FEATURE_FLAGS.json
{
  "feature_flags": {
    "multiedit_tool": {
      "enabled": true,
      "stability": "experimental",
      "modes": {
        "cline": {
          "enabled": true,
          "behavior": "conservative"
        },
        "caret": {
          "enabled": true, 
          "behavior": "adaptive"
        }
      }
    },
    "advanced_reasoning": {
      "enabled": false,
      "stability": "alpha",
      "description": "Enhanced reasoning capabilities"
    }
  }
}
```

### **Phase 4: loadMcpDocumentation.ts JSON 변환 (1.5시간)**

#### **4.1 동적 콘텐츠 하이브리드 접근법**
```typescript
// 현재: src/core/prompts/loadMcpDocumentation.ts (362줄)
export const loadMcpDocumentation = async (mcpHub: McpHub): Promise<string> => {
  // 복잡한 동적 문서 생성 로직
}

// 변환 후: JSON 템플릿 + 동적 로직 결합
📁 caret-src/core/prompts/sections/mcp/
├── MCP_DOC_TEMPLATES.json - 기본 문서 템플릿
├── MCP_SERVER_TEMPLATES.json - 서버별 템플릿
├── MCP_TOOL_TEMPLATES.json - 도구별 템플릿
└── MCP_MODE_VARIATIONS.json - 모드별 문서 스타일
```

#### **4.2 하이브리드 문서 생성기**
```typescript
// caret-src/core/prompts/CaretMcpDocumentation.ts
export class CaretMcpDocumentation {
  private jsonLoader: JsonTemplateLoader
  private currentMode: 'cline' | 'caret'

  async generateMcpDocumentation(mcpHub: McpHub): Promise<string> {
    // JSON 템플릿 로드
    const templates = await this.jsonLoader.loadSection('mcp/MCP_DOC_TEMPLATES')
    const modeVariations = await this.jsonLoader.loadSection('mcp/MCP_MODE_VARIATIONS')
    
    // 동적 정보 수집 (기존 로직 재활용)
    const servers = await this.extractMcpServers(mcpHub)
    const tools = await this.extractMcpTools(mcpHub)
    const resources = await this.extractMcpResources(mcpHub)

    // 모드별 문서 스타일 적용
    const modeStyle = modeVariations.mode_variations[this.currentMode]
    
    // 하이브리드 생성: JSON 템플릿 + 동적 데이터
    return this.jsonLoader.renderMcpDocumentation(templates, {
      servers,
      tools, 
      resources,
      mode: this.currentMode,
      style: modeStyle
    })
  }
}
```

## 🔧 **통합 시스템 구현**

### **통합 JSON 로더 시스템**
```typescript
// caret-src/core/prompts/JsonTemplateLoader.ts 확장
export class JsonTemplateLoader {
  private sectionCache: Map<string, any> = new Map()
  private currentMode: 'cline' | 'caret'

  async loadPromptFile(
    fileName: 'claude4' | 'claude4-experimental' | 'commands' | 'loadMcpDocumentation',
    mode: 'cline' | 'caret' = 'caret',
    context: any = {}
  ): Promise<string> {
    this.currentMode = mode

    switch (fileName) {
      case 'claude4':
        const claude4Generator = new CaretClaude4Prompt(this.extensionPath, mode)
        return claude4Generator.generateClaude4Prompt(
          context.cwd, 
          context.supportsBrowserUse,
          context.mcpHub,
          context.browserSettings
        )
      
      case 'claude4-experimental':
        const experimentalGenerator = new CaretClaude4ExperimentalPrompt(this.extensionPath, mode)
        return experimentalGenerator.generateExperimentalPrompt(context)
      
      case 'commands':
        // 개별 명령어는 CaretCommands 클래스 사용
        throw new Error('Commands should be accessed via CaretCommands class')
      
      case 'loadMcpDocumentation':
        const mcpGenerator = new CaretMcpDocumentation(this.extensionPath, mode)
        return mcpGenerator.generateMcpDocumentation(context.mcpHub)
    }
  }
}
```

### **메인 통합 포인트 수정**
```typescript
// src/core/prompts/model_prompts/claude4.ts - 래퍼 적용
import { CaretClaude4Prompt } from '../../../caret-src/core/prompts/CaretClaude4Prompt'

export const SYSTEM_PROMPT_CLAUDE4 = async (
  cwd: string,
  supportsBrowserUse: boolean, 
  mcpHub: any,
  browserSettings: any
): Promise<string> => {
  // CARET MODIFICATION: JSON 기반 Claude4 프롬프트 생성
  
  try {
    const extensionPath = (global as any).extensionPath
    const mode = (global as any).caretMode || 'cline' // 기본값은 Cline 모드
    
    if (extensionPath && mode === 'caret') {
      // Caret 모드: JSON 시스템 사용
      const caretClaude4 = new CaretClaude4Prompt(extensionPath, 'caret')
      const jsonResult = await caretClaude4.generateClaude4Prompt(
        cwd, supportsBrowserUse, mcpHub, browserSettings
      )
      
      // 003-07 검증 도구로 품질 검증
      console.log('[CARET] Claude4 prompt generated via JSON system')
      return jsonResult
    } else {
      // Cline 모드: 기존 하드코딩 시스템 유지
      console.log('[CLINE] Claude4 prompt using original hardcoded system')
      return ORIGINAL_CLAUDE4_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings)
    }
  } catch (error) {
    console.warn('[CARET] JSON Claude4 generation failed, falling back to original:', error)
    return ORIGINAL_CLAUDE4_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings)
  }
}

// 기존 하드코딩 프롬프트 보존 (이름만 변경)
function ORIGINAL_CLAUDE4_PROMPT(
  cwd: string,
  supportsBrowserUse: boolean,
  mcpHub: any, 
  browserSettings: any
): string {
  // 715줄 원본 하드코딩 내용 그대로 유지
  return `You are Cline, a highly skilled software engineer...`
  // ... 원본 715줄 코드
}
```

## 📊 **검증 및 품질 보장**

### **003-07 검증 도구 통합**
```typescript
// 각 변환 단계에서 003-07 도구 활용
import { ExtendedPromptValidator } from '../../../caret-src/core/verification/ExtendedPromptValidator'

export class ConversionValidator {
  private validator: ExtendedPromptValidator

  async validateConversion(
    originalPrompt: string,
    convertedPrompt: string, 
    targetFile: string,
    mode: 'cline' | 'caret'
  ): Promise<ConversionValidationResult> {
    
    // 003-07 검증 도구 사용
    const validationResult = await this.validator.validateAllPromptFiles(
      mode === 'cline', // clineMode boolean
      [targetFile]
    )

    return {
      functionalEquivalence: validationResult.functionalEquivalence,
      tokenEfficiency: this.calculateTokenSavings(originalPrompt, convertedPrompt),
      modeCompatibility: this.validateModeCompatibility(convertedPrompt, mode),
      qualityScore: validationResult.qualityScore,
      recommendations: validationResult.recommendations
    }
  }
}
```

### **✅ 성공 기준**
- [ ] **Phase 1 완료**: commands.ts JSON 변환 및 검증 통과
- [ ] **Phase 2 완료**: claude4.ts JSON 변환 및 토큰 절약 달성
- [ ] **Phase 3 완료**: claude4-experimental.ts 실험 기능 모듈화
- [ ] **Phase 4 완료**: loadMcpDocumentation.ts 하이브리드 시스템 구현
- [ ] **양방향 호환성**: Cline/Caret 모드 모두 완벽 동작
- [ ] **토큰 절약**: 전체 평균 25% 이상 토큰 효율성 달성
- [ ] **003-09 준비**: 안전한 변환 완료로 성능 비교 준비

## 🚀 **다음 단계 연결**

### **003-09 준비사항**
✅ **완료될 결과물**:
- 4개 프롬프트 파일의 완전한 JSON 모듈화
- Cline/Caret 모드별 다른 동작 패턴 구현
- 20-40% 토큰 절약 달성 
- 기존 AI 행동 100% 보존

📋 **003-09에서 할 일**:
- responses.ts i18n 다국어 지원 적용
- 사용자 경험 개선 (AI → 사용자 메시지)

### **최종 목표**
- **AI 행동 완전 JSON 관리**: 코드 수정 없이 AI 행동 변경 가능
- **Cline/Caret 듀얼 시스템**: 모드별 최적화된 AI 협업 경험
- **토큰 비용 대폭 절약**: 전체 시스템 효율성 향상
- **확장 가능한 아키텍처**: 새로운 AI 기능 쉽게 추가 가능

**🎯 핵심 목적: AI 행동 개선과 토큰 비용 절약을 동시에 달성하는 혁신적 JSON 시스템 완성!** ✨ 