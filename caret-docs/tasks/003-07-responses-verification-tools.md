# Task #003-07: responses.ts 검증 도구 개발

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🔥 **High - Phase 2 안전한 시작**  
**예상 시간**: 3-4시간  
**상태**: 📋 **예정**  
**의존성**: ✅ 003-06 (UI Chatbot/Agent 변경 + 통합 테스트) 완료

## 🎯 **목표: responses.ts 안전한 JSON 변환을 위한 검증 시스템 구축**

### **핵심 목적**
- **2-stage 접근법 Phase 1**: responses.ts 안전한 변환을 위한 검증 도구 개발
- **위험 분석**: responses.ts는 44회 사용되는 핵심 파일로 극도의 주의 필요
- **완전한 검증**: 변환 전후 응답 품질, 형식, 일관성 자동 검증
- **안전장치 구축**: 실시간 비교, 롤백 메커니즘, 품질 보장 시스템

### **responses.ts 변환 도전과제**

#### **📊 복잡성 분석**
- **파일 크기**: 301줄 (system.ts보다 복잡한 구조)
- **사용 빈도**: 44회 참조 (매우 높은 의존성)
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
      conditionalLogic: this.extractConditionalLogic(content)
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
        // 함수 body 추출 로직
      })
    }
    
    return functions
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
      testCoverage: await this.analyzeTestCoverage(usages)
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
}

interface ResponseUsageMap {
  byFunction: Map<string, ResponseUsage[]>
  byFile: Map<string, ResponseUsage[]>  
  criticalPaths: CriticalPath[]
  testCoverage: TestCoverageReport
}
```

### **Phase 2: JSON 변환 시뮬레이터 (1시간)**

#### **2.1 응답 변환 시뮬레이터**
```typescript
// caret-src/core/verification/tools/ResponseSimulator.ts
export class ResponseConversionSimulator {
  private analyzer: ResponsesAnalyzer
  private templateEngine: JsonTemplateLoader

  async simulateConversion(): Promise<ConversionSimulation> {
    const analysis = await this.analyzer.analyzeResponsePatterns()
    const conversionPlan = this.createConversionPlan(analysis)
    
    return {
      originalAnalysis: analysis,
      conversionPlan: conversionPlan,
      expectedStructure: await this.generateExpectedJsonStructure(analysis),
      riskAssessment: this.assessConversionRisks(analysis),
      testScenarios: this.generateTestScenarios(analysis)
    }
  }

  private createConversionPlan(analysis: ResponseAnalysis): ConversionPlan {
    return {
      functionsToConvert: analysis.functionDefinitions.map(f => ({
        original: f,
        targetJsonPath: this.mapToJsonPath(f),
        conversionStrategy: this.determineStrategy(f),
        dependencies: this.findDependencies(f)
      })),
      preservedLogic: this.identifyPreservedLogic(analysis),
      newTemplateStructure: this.designNewStructure(analysis)
    }
  }

  async generateExpectedJsonStructure(analysis: ResponseAnalysis): Promise<ResponseJsonStructure> {
    // responses.ts → JSON 구조 예상 결과 생성
    return {
      sections: {
        error_responses: this.extractErrorResponses(analysis),
        success_responses: this.extractSuccessResponses(analysis),
        tool_responses: this.extractToolResponses(analysis),
        context_responses: this.extractContextResponses(analysis)
      },
      templates: this.generateTemplateMap(analysis),
      parameters: this.extractParameterSchemas(analysis)
    }
  }
}
```

#### **2.2 품질 비교 엔진**
```typescript
// caret-src/core/verification/tools/QualityComparator.ts
export class ResponseQualityComparator {
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
        compatibility: this.checkCompatibility(originalResult, jsonResult)
      })
    }
    
    return {
      overallScore: this.calculateOverallScore(results),
      passedTests: results.filter(r => r.qualityScore >= 0.95).length,
      failedTests: results.filter(r => r.qualityScore < 0.95),
      recommendations: this.generateRecommendations(results)
    }
  }

  private calculateQualityScore(original: string, converted: string): number {
    // 의미론적 유사성, 구조적 일치성, 길이 적절성 등 종합 평가
    const semanticScore = this.calculateSemanticSimilarity(original, converted)
    const structuralScore = this.calculateStructuralSimilarity(original, converted)
    const lengthScore = this.calculateLengthAppropriateness(original, converted)
    
    return (semanticScore * 0.5) + (structuralScore * 0.3) + (lengthScore * 0.2)
  }
}
```

### **Phase 3: 실시간 검증 시스템 (1.5시간)**

#### **3.1 변환 전후 자동 비교 시스템**
```typescript
// caret-src/core/verification/tools/AutoValidator.ts
export class ResponseAutoValidator {
  private qualityComparator: ResponseQualityComparator
  private usageMapper: ResponseUsageMapper

  async validateFullConversion(): Promise<ValidationReport> {
    const usageMap = await this.usageMapper.createUsageMap()
    const validationResults: ValidationResult[] = []

    // 모든 함수에 대해 검증 수행
    for (const [functionName, usages] of usageMap.byFunction) {
      const testCases = this.generateTestCasesFromUsages(usages)
      const comparisonResult = await this.qualityComparator.compareResponses(
        functionName,
        this.getJsonTemplate(functionName),
        testCases
      )
      
      validationResults.push({
        functionName,
        usageCount: usages.length,
        comparisonResult,
        criticalityLevel: this.assessCriticality(functionName, usages),
        riskLevel: this.assessRisk(comparisonResult)
      })
    }

    return {
      totalFunctions: validationResults.length,
      passedValidation: validationResults.filter(r => r.riskLevel === 'low').length,
      highRiskFunctions: validationResults.filter(r => r.riskLevel === 'high'),
      overallReadiness: this.calculateOverallReadiness(validationResults),
      detailedResults: validationResults
    }
  }

  private generateTestCasesFromUsages(usages: ResponseUsage[]): ResponseTestCase[] {
    // 실제 사용 패턴을 기반으로 테스트 케이스 생성
    return usages.map(usage => ({
      name: `${usage.file}:${usage.line}`,
      input: this.extractInputFromUsage(usage),
      expectedPattern: this.inferExpectedPattern(usage),
      context: usage.context
    }))
  }
}
```

#### **3.2 안전장치 및 롤백 시스템**
```typescript
// caret-src/core/verification/tools/SafetySystem.ts
export class ResponsesSafetySystem {
  private backupManager: BackupManager
  private validator: ResponseAutoValidator

  async createSafeConversionPlan(): Promise<SafeConversionPlan> {
    // 1. 현재 상태 백업
    await this.backupManager.createFullBackup('responses.ts')
    
    // 2. 단계별 변환 계획 수립
    const conversionSteps = this.planGradualConversion()
    
    // 3. 각 단계별 안전장치 설정
    const safetyChecks = this.setupSafetyChecks()
    
    return {
      steps: conversionSteps,
      safetyChecks: safetyChecks,
      rollbackPoints: this.setupRollbackPoints(),
      emergencyProcedures: this.setupEmergencyProcedures()
    }
  }

  private planGradualConversion(): ConversionStep[] {
    return [
      {
        name: 'error_responses_conversion',
        scope: 'Low-risk error response functions',
        functions: this.identifyLowRiskFunctions(),
        safetyLevel: 'high'
      },
      {
        name: 'tool_responses_conversion', 
        scope: 'Tool-related response functions',
        functions: this.identifyToolResponseFunctions(),
        safetyLevel: 'medium'
      },
      {
        name: 'core_responses_conversion',
        scope: 'Core response functions',
        functions: this.identifyCoreResponseFunctions(),
        safetyLevel: 'critical'
      }
    ]
  }
}
```

## 🔧 **도구 통합 및 사용법**

### **검증 도구 실행 방법**
```bash
# 1. responses.ts 전체 분석
node caret-scripts/responses-analyzer.js

# 2. 변환 시뮬레이션 수행
node caret-scripts/responses-simulator.js

# 3. 품질 비교 테스트
node caret-scripts/responses-quality-check.js

# 4. 안전 변환 계획 생성
node caret-scripts/responses-safety-plan.js
```

### **검증 리포트 구조**
```typescript
// 생성될 검증 리포트
interface ResponsesVerificationReport {
  analysis: {
    totalFunctions: number
    usageFrequency: Map<string, number>
    complexityScore: number
    riskAssessment: RiskLevel
  }
  simulation: {
    conversionPlan: ConversionPlan
    expectedStructure: ResponseJsonStructure
    qualityPrediction: number
  }
  validation: {
    readinessScore: number
    highRiskAreas: string[]
    recommendations: string[]
    safetyPlan: SafeConversionPlan
  }
}
```

## ✅ **완료 검증 기준**

### **분석 도구 완성도**
- [ ] **전체 함수 매핑**: responses.ts 모든 함수 분석 완료
- [ ] **사용처 추적**: 44개 사용처 정확한 매핑
- [ ] **의존성 분석**: 함수 간 의존성 관계 파악
- [ ] **복잡도 평가**: 각 함수별 변환 복잡도 측정

### **시뮬레이션 정확도**
- [ ] **구조 예측**: JSON 변환 후 예상 구조 정확한 설계
- [ ] **품질 예측**: 변환 후 응답 품질 예측 모델 완성
- [ ] **호환성 검증**: 기존 사용 패턴과의 호환성 확인
- [ ] **성능 영향**: 변환 후 성능 영향 예측

### **안전장치 구축**
- [ ] **실시간 비교**: 원본과 변환된 응답 실시간 비교 시스템
- [ ] **자동 롤백**: 품질 저하 감지 시 자동 롤백
- [ ] **단계별 검증**: 각 변환 단계별 안전성 확인
- [ ] **비상 복구**: 문제 발생 시 즉시 복구 가능

### **도구 실용성**
- [ ] **사용 편의성**: 명령어 하나로 전체 검증 수행
- [ ] **상세 리포트**: 개발자가 이해하기 쉬운 검증 결과
- [ ] **액션 가이드**: 다음 단계에 대한 명확한 가이드
- [ ] **위험 경고**: 고위험 영역에 대한 명확한 경고

## 🔄 **다음 단계 연결**

### **003-08 준비사항**
✅ **완료될 검증 시스템**:
- responses.ts 완전한 분석 및 매핑
- 변환 품질 예측 및 검증 시스템
- 실시간 비교 및 안전장치 구축
- 단계별 안전 변환 계획 수립

📋 **003-08에서 할 일**:
- 검증 시스템 기반 실제 responses.ts JSON 변환
- 단계별 안전 변환으로 리스크 최소화
- 실시간 품질 검증으로 안전성 보장

### **안전성 보장 시스템**
- **사전 검증**: 변환 전 완전한 안전성 검증
- **단계별 진행**: 낮은 위험부터 점진적 변환
- **실시간 모니터링**: 변환 과정 중 지속적 품질 감시
- **즉시 롤백**: 문제 감지 시 자동 원상복구

---

**🎯 목적: 완벽한 안전장치로 responses.ts의 안전한 JSON 변환 기반 구축!** ✨ 