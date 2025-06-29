# Task #003-07: responses.ts 검증 도구 개발

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🔥 **High - Phase 2 안전한 시작**  
**예상 시간**: 3-4시간  
**상태**: 📋 **준비 완료 (Phase 1 기반)**  
**의존성**: ✅ 003-06 (UI Chatbot/Agent 변경 + 통합 테스트) 완료

## 🎯 **목표: responses.ts 안전한 JSON 변환을 위한 검증 시스템 구축**

### **핵심 목적**
- **system.ts 확장과 동일한 접근법**: 검증된 CaretSystemPrompt 패턴을 responses.ts에 적용
- **2-stage 접근법 Phase 1**: responses.ts 안전한 변환을 위한 검증 도구 개발
- **위험 분석**: responses.ts는 44회 사용되는 핵심 파일로 극도의 주의 필요
- **완전한 검증**: 변환 전후 응답 품질, 형식, 일관성 자동 검증
- **안전장치 구축**: 실시간 비교, 롤백 메커니즘, 품질 보장 시스템

### **🏗️ system.ts 성공 경험 기반 확장**

#### **✅ system.ts에서 검증된 패턴**
```typescript
// ✅ 성공한 시스템 - caret-src/core/prompts/system.ts
export const SYSTEM_PROMPT = (
  systemPromptOptions: SystemPromptOptions
): Promise<string> => {
  // CARET MODIFICATION: JSON 템플릿 기반 확장 시스템
  if (systemPromptOptions.useCaretSystemPrompt) {
    return CaretSystemPrompt.generateSystemPrompt(systemPromptOptions)
  }
  
  // Cline 원본 호출 (100% 호환성 보장)
  return ClineSystemPrompt.SYSTEM_PROMPT(systemPromptOptions)
}
```

#### **🚀 responses.ts 확장 목표**
```typescript
// 🎯 목표: 동일한 패턴으로 responses.ts 확장
export const formatResponse = {
  // 44개 기존 함수들 모두 확장
  v1: (params) => useCaretResponses 
    ? CaretResponses.formatV1(params) 
    : ClineResponses.formatV1(params),
  
  tool: (params) => useCaretResponses
    ? CaretResponses.formatTool(params)
    : ClineResponses.formatTool(params),
  
  // ... 44개 모든 응답 함수
}
```

### **responses.ts 변환 도전과제**

#### **📊 복잡성 분석**
- **파일 크기**: 301줄 (system.ts 727줄보다 작지만 더 복잡한 구조)
- **사용 빈도**: 44회 참조 (system.ts 1회보다 매우 높은 의존성)
- **응답 템플릿**: 다양한 시나리오별 응답 패턴 포함
- **정확성 요구**: 사용자 경험에 직접적 영향

#### **🛡️ 안전성 필요사항**
- **응답 품질 유지**: 변환 후에도 동일한 품질 응답
- **형식 호환성**: 기존 응답 형식과 완벽 호환
- **성능 보장**: 응답 생성 속도 유지
- **일관성 검증**: 모든 사용 케이스에서 일관된 동작

## 📋 **검증 도구 개발 계획**

### **Phase 1: responses.ts 분석 및 매핑 도구 (1.5시간)**

#### **1.1 응답 패턴 분석기 개발**
```typescript
// caret-src/core/verification/tools/ResponsesAnalyzer.ts
export class ResponsesAnalyzer {
  private responsesPath: string
  private usageMap: Map<string, ResponseUsage[]> = new Map()

  constructor(projectRoot: string) {
    this.responsesPath = path.join(projectRoot, 'src/core/prompts/responses.ts')
  }

  async analyzeResponsePatterns(): Promise<ResponseAnalysis> {
    const content = await fs.readFile(this.responsesPath, 'utf-8')
    
    return {
      functionDefinitions: this.extractFunctionDefinitions(content),
      exportedResponses: this.extractExportedResponses(content),
      templateStructures: this.extractTemplateStructures(content),
      parameterPatterns: this.extractParameterPatterns(content),
      conditionalLogic: this.extractConditionalLogic(content),
      // system.ts 분석에서 학습한 패턴 적용
      extensionPoints: this.identifyExtensionPoints(content)
    }
  }

  private extractFunctionDefinitions(content: string): FunctionDef[] {
    // 정규식으로 모든 함수 정의 추출
    const functionRegex = /export\s+(?:const|function)\s+(\w+)\s*[=:]?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g
    const functions: FunctionDef[] = []
    
    let match
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        startIndex: match.index,
        signature: match[0],
        extensionStrategy: this.planExtensionStrategy(match[1])
      })
    }
    
    return functions
  }

  private planExtensionStrategy(functionName: string): ExtensionStrategy {
    // system.ts 확장 경험을 기반으로 각 함수별 확장 전략 수립
    return {
      wrapperPattern: 'conditional_delegation', // CaretSystemPrompt와 동일한 패턴
      backupRequired: true,
      riskLevel: this.assessFunctionRisk(functionName),
      testPriority: this.calculateTestPriority(functionName)
    }
  }

  async findAllUsages(): Promise<Map<string, ResponseUsage[]>> {
    // 프로젝트 전체에서 responses.ts 함수 사용처 검색
    const usageSearch = new UsageSearcher(this.projectRoot)
    return await usageSearch.searchResponsesUsages()
  }
}

interface ResponseAnalysis {
  functionDefinitions: FunctionDef[]
  exportedResponses: string[]
  templateStructures: TemplateStructure[]
  parameterPatterns: ParameterPattern[]
  conditionalLogic: ConditionalBlock[]
  extensionPoints: ExtensionPoint[] // system.ts 경험 기반 추가
}
```

#### **1.2 사용처 매핑 및 의존성 분석**
```typescript
// caret-src/core/verification/tools/UsageMapper.ts
export class ResponseUsageMapper {
  async createUsageMap(): Promise<ResponseUsageMap> {
    const usages = await this.scanAllUsages()
    
    return {
      byFunction: this.groupByFunction(usages),
      byFile: this.groupByFile(usages),
      criticalPaths: this.identifyCriticalPaths(usages),
      testCoverage: await this.analyzeTestCoverage(usages),
      // system.ts 분석에서 학습한 패턴 추가
      extensionReadiness: this.assessExtensionReadiness(usages),
      carETConversionPlan: this.createCaretConversionPlan(usages)
    }
  }

  private async scanAllUsages(): Promise<ResponseUsage[]> {
    const results: ResponseUsage[] = []
    
    // src/ 디렉토리 전체 스캔
    const files = await glob('src/**/*.ts', { ignore: 'src/**/*.test.ts' })
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const usages = this.extractUsagesFromFile(content, file)
      results.push(...usages)
    }
    
    return results
  }

  private identifyCriticalPaths(usages: ResponseUsage[]): CriticalPath[] {
    // 높은 빈도로 사용되거나 핵심 기능에 사용되는 패턴 식별
    return usages
      .filter(usage => this.isCriticalUsage(usage))
      .map(usage => this.toCriticalPath(usage))
  }

  private createCaretConversionPlan(usages: ResponseUsage[]): CaretConversionPlan {
    // system.ts 성공 경험을 기반으로 변환 계획 수립
    return {
      phase1Functions: this.identifyLowRiskFunctions(usages),
      phase2Functions: this.identifyMediumRiskFunctions(usages),
      phase3Functions: this.identifyHighRiskFunctions(usages),
      wrapperStrategy: 'system_prompt_pattern', // 검증된 패턴 재사용
      backupPlan: this.createBackupPlan(usages)
    }
  }
}

interface ResponseUsageMap {
  byFunction: Map<string, ResponseUsage[]>
  byFile: Map<string, ResponseUsage[]>  
  criticalPaths: CriticalPath[]
  testCoverage: TestCoverageReport
  extensionReadiness: ExtensionReadiness  // 새로 추가
  carETConversionPlan: CaretConversionPlan // 새로 추가
}
```

### **Phase 2: JSON 변환 시뮬레이터 (1시간)**

#### **2.1 응답 변환 시뮬레이터 (system.ts 경험 적용)**
```typescript
// caret-src/core/verification/tools/ResponseSimulator.ts
export class ResponseConversionSimulator {
  private analyzer: ResponsesAnalyzer
  private templateEngine: JsonTemplateLoader
  private systemPromptExperience: SystemPromptLessons // system.ts에서 학습한 교훈

  constructor() {
    // system.ts 확장에서 학습한 경험 로드
    this.systemPromptExperience = new SystemPromptLessons()
  }

  async simulateConversion(): Promise<ConversionSimulation> {
    const analysis = await this.analyzer.analyzeResponsePatterns()
    const conversionPlan = this.createConversionPlan(analysis)
    
    return {
      originalAnalysis: analysis,
      conversionPlan: conversionPlan,
      expectedStructure: await this.generateExpectedJsonStructure(analysis),
      riskAssessment: this.assessConversionRisks(analysis),
      testScenarios: this.generateTestScenarios(analysis),
      // system.ts 경험 기반 추가 항목들
      systemPromptLessons: this.systemPromptExperience.getApplicableLessons(),
      wrapperCodeGeneration: this.generateWrapperCode(analysis),
      backupStrategy: this.planBackupStrategy(analysis)
    }
  }

  private createConversionPlan(analysis: ResponseAnalysis): ConversionPlan {
    return {
      functionsToConvert: analysis.functionDefinitions.map(f => ({
        original: f,
        targetJsonPath: this.mapToJsonPath(f),
        conversionStrategy: this.determineStrategy(f),
        dependencies: this.findDependencies(f),
        // system.ts 패턴 적용
        wrapperTemplate: this.generateWrapperTemplate(f),
        caretImplementation: this.planCaretImplementation(f),
        clinePreservation: this.ensureClinePreservation(f)
      })),
      preservedLogic: this.identifyPreservedLogic(analysis),
      newTemplateStructure: this.designNewStructure(analysis)
    }
  }

  private generateWrapperTemplate(functionDef: FunctionDef): WrapperTemplate {
    // system.ts의 성공적인 래퍼 패턴을 responses.ts에 적용
    return {
      pattern: 'conditional_delegation',
      template: `
export const ${functionDef.name} = (params: ${functionDef.paramType}) => {
  // CARET MODIFICATION: JSON 템플릿 기반 응답 시스템
  if (useCaretResponses) {
    return CaretResponses.${functionDef.name}(params)
  }
  
  // Cline 원본 호출 (100% 호환성 보장)
  return ClineResponses.${functionDef.name}(params)
}`,
      caretImplementation: this.planCaretResponseImplementation(functionDef),
      clinePreservation: 'complete_backup_with_rename'
    }
  }

  async generateExpectedJsonStructure(analysis: ResponseAnalysis): Promise<ResponseJsonStructure> {
    // responses.ts → JSON 구조 예상 결과 생성 (system.ts 경험 활용)
    return {
      sections: {
        error_responses: this.extractErrorResponses(analysis),
        success_responses: this.extractSuccessResponses(analysis),
        tool_responses: this.extractToolResponses(analysis),
        context_responses: this.extractContextResponses(analysis)
      },
      templates: this.generateTemplateMap(analysis),
      parameters: this.extractParameterSchemas(analysis),
      // system.ts JSON 구조에서 학습한 패턴 적용
      systemIntegration: this.planSystemPromptIntegration(analysis),
      chatbotAgentSupport: this.ensureChatbotAgentModeSupport(analysis)
    }
  }
}
```

#### **2.2 품질 비교 엔진 (system.ts 검증 경험 활용)**
```typescript
// caret-src/core/verification/tools/QualityComparator.ts
export class ResponseQualityComparator {
  private systemPromptBenchmarks: SystemPromptBenchmarks // system.ts 검증에서 얻은 기준

  async compareResponses(
    originalFunction: string,
    jsonTemplate: JsonResponseTemplate,
    testCases: ResponseTestCase[]
  ): Promise<QualityComparison> {
    
    const results: ComparisonResult[] = []
    
    for (const testCase of testCases) {
      const originalResult = await this.executeOriginalFunction(originalFunction, testCase.input)
      const jsonResult = await this.executeJsonTemplate(jsonTemplate, testCase.input)
      
      results.push({
        testCase: testCase,
        original: originalResult,
        converted: jsonResult,
        qualityScore: this.calculateQualityScore(originalResult, jsonResult),
        differences: this.findDifferences(originalResult, jsonResult),
        compatibility: this.checkCompatibility(originalResult, jsonResult),
        // system.ts 검증에서 학습한 추가 검증 항목들
        systemPromptCompatibility: this.checkSystemPromptCompatibility(originalResult, jsonResult),
        chatbotAgentModeSupport: this.verifyChatbotAgentSupport(originalResult, jsonResult),
        performanceImpact: this.measurePerformanceImpact(originalResult, jsonResult)
      })
    }
    
    return {
      overallScore: this.calculateOverallScore(results),
      passedTests: results.filter(r => r.qualityScore >= 0.95).length,
      failedTests: results.filter(r => r.qualityScore < 0.95),
      recommendations: this.generateRecommendations(results),
      // system.ts 검증 경험 기반 추가
      systemPromptLessons: this.applySystemPromptLessons(results),
      readinessAssessment: this.assessConversionReadiness(results)
    }
  }

  private calculateQualityScore(original: string, converted: string): number {
    // system.ts 검증에서 학습한 품질 평가 기준 적용
    const semanticScore = this.calculateSemanticSimilarity(original, converted)
    const structuralScore = this.calculateStructuralSimilarity(original, converted)
    const lengthScore = this.calculateLengthAppropriateness(original, converted)
    const chatbotAgentScore = this.evaluateChatbotAgentCompatibility(original, converted)
    
    return (semanticScore * 0.4) + (structuralScore * 0.3) + (lengthScore * 0.2) + (chatbotAgentScore * 0.1)
  }
}
```

### **Phase 3: 실시간 검증 시스템 (1.5시간)**

#### **3.1 변환 전후 자동 비교 시스템 (system.ts 경험 적용)**
```typescript
// caret-src/core/verification/tools/AutoValidator.ts
export class ResponseAutoValidator {
  private qualityComparator: ResponseQualityComparator
  private usageMapper: ResponseUsageMapper
  private systemPromptValidator: SystemPromptCompatibilityValidator // system.ts 호환성 검증

  async validateFullConversion(): Promise<ValidationReport> {
    const usageMap = await this.usageMapper.createUsageMap()
    const validationResults: ValidationResult[] = []

    // 모든 함수에 대해 검증 수행 (system.ts 검증 패턴 적용)
    for (const [functionName, usages] of usageMap.byFunction) {
      const testCases = this.generateTestCasesFromUsages(usages)
      const comparisonResult = await this.qualityComparator.compareResponses(
        functionName,
        this.getJsonTemplate(functionName),
        testCases
      )
      
      // system.ts와의 호환성 검증 추가
      const systemCompatibility = await this.systemPromptValidator.validateCompatibility(
        functionName, comparisonResult
      )
      
      validationResults.push({
        functionName,
        usageCount: usages.length,
        comparisonResult,
        criticalityLevel: this.assessCriticality(functionName, usages),
        riskLevel: this.assessRisk(comparisonResult),
        systemPromptCompatibility: systemCompatibility, // 새로 추가
        chatbotAgentReadiness: this.assessChatbotAgentReadiness(comparisonResult) // 새로 추가
      })
    }

    return {
      totalFunctions: validationResults.length,
      passedValidation: validationResults.filter(r => r.riskLevel === 'low').length,
      highRiskFunctions: validationResults.filter(r => r.riskLevel === 'high'),
      overallReadiness: this.calculateOverallReadiness(validationResults),
      detailedResults: validationResults,
      // system.ts 검증 경험 기반 추가
      systemPromptIntegration: this.assessSystemPromptIntegration(validationResults),
      phase1Confidence: this.calculatePhase1Confidence(validationResults)
    }
  }

  private generateTestCasesFromUsages(usages: ResponseUsage[]): ResponseTestCase[] {
    // 실제 사용 패턴을 기반으로 테스트 케이스 생성 (system.ts 경험 활용)
    return usages.map(usage => ({
      name: `${usage.file}:${usage.line}`,
      input: this.extractInputFromUsage(usage),
      expectedPattern: this.inferExpectedPattern(usage),
      context: usage.context,
      // system.ts 테스트에서 학습한 추가 케이스들
      chatbotAgentContext: this.extractChatbotAgentContext(usage),
      systemPromptContext: this.extractSystemPromptContext(usage)
    }))
  }
}
```

#### **3.2 안전장치 및 롤백 시스템 (system.ts 성공 경험 기반)**
```typescript
// caret-src/core/verification/tools/SafetySystem.ts
export class ResponsesSafetySystem {
  private backupManager: BackupManager
  private validator: ResponseAutoValidator
  private systemPromptIntegration: SystemPromptIntegration // system.ts와의 통합 관리

  async createSafeConversionPlan(): Promise<SafeConversionPlan> {
    // 1. 현재 상태 백업 (system.ts 백업 경험 활용)
    await this.backupManager.createFullBackup('responses.ts')
    
    // 2. system.ts와의 호환성 확인
    const systemCompatibility = await this.systemPromptIntegration.validateCompatibility()
    
    // 3. 단계별 변환 계획 수립 (system.ts 확장 패턴 적용)
    const conversionSteps = this.planGradualConversion()
    
    // 4. 각 단계별 안전장치 설정
    const safetyChecks = this.setupSafetyChecks()
    
    return {
      steps: conversionSteps,
      safetyChecks: safetyChecks,
      rollbackPoints: this.setupRollbackPoints(),
      emergencyProcedures: this.setupEmergencyProcedures(),
      // system.ts 경험 기반 추가
      systemPromptIntegration: systemCompatibility,
      chatbotAgentPreservation: this.ensureChatbotAgentModePreservation(),
      phase1Foundation: this.validatePhase1Foundation()
    }
  }

  private planGradualConversion(): ConversionStep[] {
    return [
      {
        name: 'error_responses_conversion',
        scope: 'Low-risk error response functions',
        functions: this.identifyLowRiskFunctions(),
        safetyLevel: 'high',
        // system.ts 패턴 적용
        wrapperStrategy: 'system_prompt_pattern',
        backupRequired: true,
        systemPromptImpact: 'minimal'
      },
      {
        name: 'tool_responses_conversion', 
        scope: 'Tool-related response functions',
        functions: this.identifyToolResponseFunctions(),
        safetyLevel: 'medium',
        wrapperStrategy: 'system_prompt_pattern',
        backupRequired: true,
        systemPromptImpact: 'low'
      },
      {
        name: 'core_responses_conversion',
        scope: 'Core response functions',
        functions: this.identifyCoreResponseFunctions(),
        safetyLevel: 'critical',
        wrapperStrategy: 'system_prompt_pattern',
        backupRequired: true,
        systemPromptImpact: 'medium'
      }
    ]
  }
}
```

## 🔧 **도구 통합 및 사용법**

### **검증 도구 실행 방법**
```bash
# 1. responses.ts 전체 분석 (system.ts 경험 적용)
node caret-scripts/responses-analyzer.js

# 2. system.ts 호환성 체크
node caret-scripts/responses-system-integration-check.js

# 3. 변환 시뮬레이션 수행
node caret-scripts/responses-simulator.js

# 4. 품질 비교 테스트 (chatbot/agent 모드 포함)
node caret-scripts/responses-quality-check.js

# 5. 안전 변환 계획 생성
node caret-scripts/responses-safety-plan.js
```

### **검증 리포트 구조 (system.ts 경험 반영)**
```typescript
// 생성될 검증 리포트
interface ResponsesVerificationReport {
  analysis: {
    totalFunctions: number
    usageFrequency: Map<string, number>
    complexityScore: number
    riskAssessment: RiskLevel
    systemPromptCompatibility: SystemPromptCompatibility // 새로 추가
  }
  simulation: {
    conversionPlan: ConversionPlan
    expectedStructure: ResponseJsonStructure
    qualityPrediction: number
    wrapperCodeGeneration: WrapperCode[] // system.ts 패턴 적용
  }
  validation: {
    readinessScore: number
    highRiskAreas: string[]
    recommendations: string[]
    safetyPlan: SafeConversionPlan
    systemPromptIntegration: SystemPromptIntegrationPlan // 새로 추가
  }
  phase1Foundation: {
    chatbotAgentSupport: ChatbotAgentSupportStatus
    systemPromptCompatibility: SystemPromptCompatibilityStatus
    conversionReadiness: ConversionReadinessScore
  }
}
```

## ✅ **완료 검증 기준**

### **분석 도구 완성도**
- [ ] **전체 함수 매핑**: responses.ts 모든 함수 분석 완료
- [ ] **사용처 추적**: 44개 사용처 정확한 매핑
- [ ] **의존성 분석**: 함수 간 의존성 관계 파악
- [ ] **복잡도 평가**: 각 함수별 변환 복잡도 측정
- [ ] **system.ts 호환성**: system.ts와의 통합 지점 분석 ✨

### **시뮬레이션 정확도**
- [ ] **구조 예측**: JSON 변환 후 예상 구조 정확한 설계
- [ ] **품질 예측**: 변환 후 응답 품질 예측 모델 완성
- [ ] **호환성 검증**: 기존 사용 패턴과의 호환성 확인
- [ ] **성능 영향**: 변환 후 성능 영향 예측
- [ ] **래퍼 코드**: system.ts 패턴 기반 래퍼 코드 자동 생성 ✨

### **안전장치 구축**
- [ ] **실시간 비교**: 원본과 변환된 응답 실시간 비교 시스템
- [ ] **자동 롤백**: 품질 저하 감지 시 자동 롤백
- [ ] **단계별 검증**: 각 변환 단계별 안전성 확인
- [ ] **비상 복구**: 문제 발생 시 즉시 복구 가능
- [ ] **system.ts 통합**: system.ts와의 안전한 통합 보장 ✨

### **도구 실용성**
- [ ] **사용 편의성**: 명령어 하나로 전체 검증 수행
- [ ] **상세 리포트**: 개발자가 이해하기 쉬운 검증 결과
- [ ] **액션 가이드**: 다음 단계에 대한 명확한 가이드
- [ ] **위험 경고**: 고위험 영역에 대한 명확한 경고
- [ ] **Phase 1 기반**: 완료된 Phase 1 시스템과의 완벽한 통합 ✨

## 🔄 **다음 단계 연결**

### **003-08 준비사항**
✅ **완료될 검증 시스템**:
- responses.ts 완전한 분석 및 매핑
- 변환 품질 예측 및 검증 시스템
- 실시간 비교 및 안전장치 구축
- 단계별 안전 변환 계획 수립
- **system.ts 호환성 보장 시스템** ✨
- **Phase 1 기반 통합 확인** ✨

📋 **003-08에서 할 일**:
- 검증 시스템 기반 실제 responses.ts JSON 변환
- system.ts 패턴 적용한 래퍼 코드 구현
- 단계별 안전 변환으로 리스크 최소화
- 실시간 품질 검증으로 안전성 보장
- ChatBot/Agent 모드와의 완벽한 통합

### **Phase 1 성과 기반 확장**
- **안정적인 기반**: 594개 테스트 통과, 검증된 시스템
- **성공한 패턴**: system.ts 확장에서 검증된 래퍼 패턴 재사용
- **완성된 통합**: ChatBot/Agent 모드와의 완벽한 연계
- **즉시 적용**: 모든 기반 시스템 완료로 바로 시작 가능

---

**🎯 목적: system.ts 성공 경험 기반 responses.ts의 안전한 JSON 변환 기반 구축!** ✨ 
**🏗️ 핵심: 검증된 CaretSystemPrompt 패턴을 responses.ts에 확장 적용!** 🚀 