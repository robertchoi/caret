# Task #003-01: Cline 기능 검증 시스템 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 검증 시스템 기반 구축**  
**예상 시간**: 3-4시간  
**상태**: 📋 **준비 완료** - 다음 세션에서 즉시 시작 가능

## 🎯 **목표**

**핵심 목적**: Cline의 모든 기능이 JSON 시스템 프롬프트 구현 후에도 100% 보존되는지 자동으로 검증하는 시스템 구축

### **세부 목표**
1. **Cline SYSTEM_PROMPT 완전 분석**: 모든 도구, 기능, 설명 추출
2. **자동 검증 메커니즘**: 기능 누락 감지 시스템 구현
3. **회귀 테스트 기반**: 변경 전후 비교 자동화
4. **실시간 모니터링**: 개발 과정에서 지속적 검증

## 🔍 **현재 분석 결과**

### **Cline SYSTEM_PROMPT 구조 분석**
기존 분석을 통해 파악된 Cline의 핵심 구조:

```typescript
// src/core/prompts/system.ts - 주요 분기 구조
export const SYSTEM_PROMPT = async (
  cwd: string,
  supportsBrowserUse: boolean,
  mcpHub: McpHub,
  browserSettings: BrowserSettings,
  isClaude4ModelFamily: boolean = false,
) => {
  // Claude4 실험 기능 분기
  if (isClaude4ModelFamily && USE_EXPERIMENTAL_CLAUDE4_FEATURES) {
    return SYSTEM_PROMPT_CLAUDE4_EXPERIMENTAL(...)
  }
  // Claude4 표준 분기
  if (isClaude4ModelFamily) {
    return SYSTEM_PROMPT_CLAUDE4(...)
  }
  // 기본 707줄 하드코딩 프롬프트
  return `You are Cline, a highly skilled software engineer...`
}
```

### **검증해야 할 핵심 요소들**
1. **모든 도구 (Tools)**:
   - `execute_command`, `read_file`, `write_to_file`, `replace_in_file`
   - `search_files`, `list_files`, `list_code_definition_names`
   - `browser_action` (조건부), `use_mcp_tool`, `access_mcp_resource`
   - `ask_followup_question`, `attempt_completion`

2. **MCP 통합 기능**:
   - MCP 서버 도구 동적 로딩
   - 리소스 템플릿 및 직접 리소스 접근
   - 서버별 설정 및 상태 표시

3. **모델별 분기**:
   - Claude4 표준/실험 기능 분기
   - 브라우저 지원 조건부 활성화

4. **시스템 정보 동적 생성**:
   - OS 정보, 쉘 정보, 디렉토리 정보
   - 환경별 맞춤 설정

## 📋 **구현 계획**

### **Phase 0: 분석 및 설계 (30분)**
1. **도구 목록 추출**: SYSTEM_PROMPT에서 모든 도구 정의 추출
2. **기능 카테고리 분류**: 핵심/조건부/동적 기능 분류
3. **검증 기준 정의**: 각 기능별 검증 방법 명시

### **Phase 1: 기본 검증 시스템 (1.5시간)**
1. **ClineFeatureValidator 클래스 구현**:
   ```typescript
   // caret-src/core/verification/ClineFeatureValidator.ts
   export class ClineFeatureValidator {
     async validateAllFeatures(originalPrompt: string, newPrompt: string): Promise<ValidationResult>
     async extractTools(prompt: string): Promise<ToolDefinition[]>
     async validateToolCompleteness(original: ToolDefinition[], current: ToolDefinition[]): Promise<boolean>
   }
   ```

2. **도구 정의 추출 로직**:
   - 정규식 기반 도구 섹션 파싱
   - 각 도구의 Description, Parameters, Usage 추출
   - MCP 동적 도구도 포함하여 검증

### **Phase 2: 고급 검증 기능 (1.5시간)**
1. **기능 무결성 검증**:
   - 도구 설명 완전성 확인
   - 파라미터 스키마 일치성 검증
   - 사용법 예제 보존 확인

2. **MCP 통합 검증**:
   - MCP 서버별 도구 목록 확인
   - 리소스 템플릿 접근성 검증
   - 동적 설정 로딩 테스트

### **Phase 3: 자동화 및 테스트 (1시간)**
1. **Vitest 테스트 스위트**:
   ```typescript
   // caret-src/__tests__/cline-feature-validation.test.ts
   describe('Cline Feature Validation', () => {
     it('should preserve all original tools', async () => {
       const validator = new ClineFeatureValidator()
       const result = await validator.validateAllFeatures(originalPrompt, newPrompt)
       expect(result.allToolsPreserved).toBe(true)
     })
   })
   ```

2. **실시간 모니터링**:
   - CaretLogger를 통한 상세 로깅
   - 검증 실패 시 구체적 오류 메시지
   - 개발 과정에서 지속적 검증

## 🔧 **기술적 구현 상세**

### **핵심 클래스 설계**
```typescript
// caret-src/core/verification/ClineFeatureValidator.ts
export interface ToolDefinition {
  name: string
  description: string
  parameters: ParameterDefinition[]
  usage: string
  category: 'core' | 'conditional' | 'dynamic'
}

export interface ValidationResult {
  allToolsPreserved: boolean
  missingTools: string[]
  modifiedTools: string[]
  newTools: string[]
  mcpIntegrationIntact: boolean
  detailedReport: string
}

export class ClineFeatureValidator {
  private caretLogger: CaretLogger
  
  constructor() {
    this.caretLogger = CaretLogger.getInstance()
  }

  async validateAllFeatures(
    originalPrompt: string, 
    newPrompt: string,
    context: ValidationContext
  ): Promise<ValidationResult> {
    // 1. 도구 추출 및 비교
    const originalTools = await this.extractTools(originalPrompt)
    const newTools = await this.extractTools(newPrompt)
    
    // 2. MCP 통합 검증
    const mcpValidation = await this.validateMcpIntegration(originalPrompt, newPrompt)
    
    // 3. 시스템 정보 검증
    const systemInfoValidation = await this.validateSystemInfo(originalPrompt, newPrompt)
    
    // 4. 종합 리포트 생성
    return this.generateValidationReport(originalTools, newTools, mcpValidation, systemInfoValidation)
  }
}
```

### **도구 추출 로직**
```typescript
private async extractTools(prompt: string): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = []
  
  // 정규식으로 ## tool_name 섹션 추출
  const toolRegex = /## (\w+)\nDescription: ([^\n]+)\nParameters:(.*?)Usage:(.*?)(?=\n##|\n\n[A-Z]|$)/gs
  
  let match
  while ((match = toolRegex.exec(prompt)) !== null) {
    const [, name, description, parametersSection, usageSection] = match
    
    tools.push({
      name,
      description: description.trim(),
      parameters: await this.parseParameters(parametersSection),
      usage: usageSection.trim(),
      category: this.categorizeTool(name)
    })
  }
  
  return tools
}
```

## ✅ **검증 기준**

### **기능 보존 검증**
- [ ] **모든 핵심 도구 보존**: execute_command, read_file, write_to_file 등
- [ ] **조건부 도구 보존**: browser_action (supportsBrowserUse시)
- [ ] **MCP 도구 보존**: use_mcp_tool, access_mcp_resource
- [ ] **도구 설명 완전성**: Description, Parameters, Usage 모두 보존
- [ ] **시스템 정보 동적 생성**: OS, 쉘, 디렉토리 정보 정확히 포함

### **기능 무결성 검증**
- [ ] **파라미터 스키마 일치**: 모든 도구의 파라미터 정의 동일
- [ ] **사용법 예제 보존**: Usage 섹션의 XML 형식 예제 유지
- [ ] **MCP 통합 완전성**: 연결된 서버의 모든 도구 및 리소스 접근 가능

## 🚨 **위험 요소 및 대응**

### **주요 위험 요소**
1. **정규식 파싱 실패**: 프롬프트 형식 변경 시 도구 추출 실패
2. **MCP 동적 콘텐츠**: 런타임에 생성되는 MCP 도구 검증 어려움
3. **모델별 분기**: Claude4 실험/표준 분기 검증 복잡성

### **대응 방안**
1. **다중 파싱 전략**: 정규식 실패 시 fallback 파서 사용
2. **모킹 시스템**: MCP 서버 연결 없이도 검증 가능한 모킹 구현
3. **분기별 개별 테스트**: 각 모델 분기를 독립적으로 검증

## 📝 **Output 파일**

### **구현할 파일들**
1. **`caret-src/core/verification/ClineFeatureValidator.ts`**
   - 메인 검증 로직 구현
   - 도구 추출 및 비교 기능

2. **`caret-src/core/verification/types.ts`**
   - ValidationResult, ToolDefinition 등 타입 정의

3. **`caret-src/__tests__/cline-feature-validation.test.ts`**
   - Vitest 기반 검증 테스트 스위트

4. **`caret-docs/tasks/003-01-analysis-report.md`**
   - Cline 기능 분석 결과 및 검증 시스템 설계 문서

## 🔄 **Next Steps for 003-02**

003-01 완료 후 다음 단계인 003-02에서는:
- **점진적 교체 검증 프레임워크** 구현
- 단계별 변경 시 안전성 확인 시스템
- 실시간 회귀 테스트 자동화

---

**🎯 목표**: Cline의 모든 기능을 100% 보존하는 안전한 변경 시스템 구축!

**💪 원칙**: 검증 없는 변경은 절대 금지! 모든 변경은 검증 시스템 통과 필수! 