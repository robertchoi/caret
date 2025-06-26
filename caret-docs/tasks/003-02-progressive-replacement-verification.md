# Task #003-02: 점진적 교체 검증 프레임워크 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 안전한 변경 보장**  
**예상 시간**: 2-3시간  
**상태**: 📋 **준비 완료** - 003-01 완료 후 진행  
**의존성**: 003-01 (ClineFeatureValidator) 완료 필수

## 🎯 **목표**

**핵심 목적**: 단계별 SYSTEM_PROMPT 변경 시 각 단계마다 기능 손실 없음을 자동으로 보장하는 점진적 검증 프레임워크 구축

### **세부 목표**
1. **단계별 안전성 보장**: 각 변경 단계마다 자동 검증
2. **실시간 회귀 테스트**: 변경 즉시 기능 테스트 수행
3. **롤백 메커니즘**: 검증 실패 시 자동 롤백
4. **변경 추적**: 모든 변경사항 상세 기록

## 🎨 **설계 철학**

### **점진적 교체 원칙**
```typescript
// ✅ 올바른 점진적 접근
const progressiveSteps = [
  'Step 1: Cline 원본 래퍼 (기능 변경 없음)',
  'Step 2: JSON 오버레이 로딩 (추가만)',
  'Step 3: Plan/Act 제약 제거',
  'Step 4: Agent 모드 행동 패턴 적용',
  'Step 5: 토큰 최적화'
]

// Each step MUST pass 100% validation before proceeding
```

**🚨 절대 금지 사항**:
- 한 번에 여러 단계 동시 변경
- 검증 없는 다음 단계 진행
- 기능 손실 허용하는 "임시" 구현

## 📋 **구현 계획**

### **Phase 0: 프레임워크 설계 (30분)**
1. **변경 단계 정의**: 각 단계별 변경 범위 명확화
2. **검증 체크포인트**: 단계별 통과해야 할 검증 기준
3. **롤백 전략**: 실패 시 복구 방법 정의

### **Phase 1: 기본 프레임워크 (1시간)**
1. **ProgressiveReplacementManager 구현**:
   ```typescript
   // caret-src/core/verification/ProgressiveReplacementManager.ts
   export class ProgressiveReplacementManager {
     async executeStep(step: ReplacementStep): Promise<StepResult>
     async validateStep(step: ReplacementStep): Promise<ValidationResult>
     async rollbackIfNeeded(step: ReplacementStep, result: ValidationResult): Promise<void>
   }
   ```

2. **변경 단계 정의**:
   - 각 단계별 입력/출력 명세
   - 검증 기준 및 허용 오차 정의
   - 실패 시 롤백 절차

### **Phase 2: 실시간 검증 시스템 (1시간)**
1. **실시간 회귀 테스트**:
   - 변경 직후 전체 기능 테스트 실행
   - 성능 영향 최소화하면서 빠른 검증
   - 핵심 기능 우선 검증 순서

2. **변경 추적 시스템**:
   - 모든 변경사항 상세 로깅
   - 변경 전후 diff 자동 생성
   - 문제 발생 시 추적 가능한 상세 기록

### **Phase 3: 고급 기능 및 최적화 (30-60분)**
1. **자동 롤백 메커니즘**:
   - 검증 실패 시 즉시 이전 상태로 복구
   - 부분 실패 시 안전한 중간 상태 유지
   - 사용자 알림 및 상태 리포트

2. **성능 최적화**:
   - 중복 검증 최소화
   - 캐싱을 통한 검증 속도 향상
   - 병렬 검증 처리

## 🔧 **기술적 구현 상세**

### **핵심 클래스 설계**
```typescript
// caret-src/core/verification/ProgressiveReplacementManager.ts
export interface ReplacementStep {
  id: string
  name: string
  description: string
  inputPrompt: string
  transformation: PromptTransformation
  validationCriteria: ValidationCriteria
  rollbackData?: RollbackData
}

export interface StepResult {
  success: boolean
  outputPrompt?: string
  validationResult: ValidationResult
  executionTime: number
  errors?: string[]
  warnings?: string[]
}

export class ProgressiveReplacementManager {
  private validator: ClineFeatureValidator
  private caretLogger: CaretLogger
  private rollbackStack: RollbackData[]

  constructor(validator: ClineFeatureValidator) {
    this.validator = validator
    this.caretLogger = CaretLogger.getInstance()
    this.rollbackStack = []
  }

  async executeStep(step: ReplacementStep): Promise<StepResult> {
    const startTime = Date.now()
    
    try {
      // 1. 변경 전 상태 백업
      const rollbackData = await this.createRollbackPoint(step)
      
      // 2. 변경 적용
      const transformedPrompt = await this.applyTransformation(
        step.inputPrompt, 
        step.transformation
      )
      
      // 3. 즉시 검증
      const validationResult = await this.validator.validateAllFeatures(
        step.inputPrompt,
        transformedPrompt,
        { step: step.id, criteria: step.validationCriteria }
      )
      
      // 4. 검증 결과에 따른 처리
      if (validationResult.allToolsPreserved && this.meetsStepCriteria(validationResult, step)) {
        // 성공: 롤백 스택에 추가
        this.rollbackStack.push(rollbackData)
        
        return {
          success: true,
          outputPrompt: transformedPrompt,
          validationResult,
          executionTime: Date.now() - startTime
        }
      } else {
        // 실패: 자동 롤백
        await this.executeRollback(rollbackData)
        
        return {
          success: false,
          validationResult,
          executionTime: Date.now() - startTime,
          errors: [
            `Step ${step.id} failed validation`,
            ...validationResult.missingTools.map(tool => `Missing tool: ${tool}`),
            ...validationResult.modifiedTools.map(tool => `Modified tool: ${tool}`)
          ]
        }
      }
    } catch (error) {
      this.caretLogger.error(`Step ${step.id} execution failed:`, error)
      
      return {
        success: false,
        validationResult: { 
          allToolsPreserved: false, 
          missingTools: [], 
          modifiedTools: [], 
          newTools: [],
          mcpIntegrationIntact: false,
          detailedReport: `Execution error: ${error}` 
        },
        executionTime: Date.now() - startTime,
        errors: [`Execution error: ${error}`]
      }
    }
  }
}
```

### **변경 단계 정의**
```typescript
// caret-src/core/verification/ReplacementSteps.ts
export const REPLACEMENT_STEPS: ReplacementStep[] = [
  {
    id: 'step-1-wrapper',
    name: 'Cline 원본 래퍼 구현',
    description: 'SYSTEM_PROMPT를 그대로 호출하는 래퍼 구현 (기능 변경 없음)',
    inputPrompt: '', // 원본 Cline 프롬프트
    transformation: {
      type: 'wrapper',
      preserveOriginal: true,
      addCaretExtensions: false
    },
    validationCriteria: {
      allowedChanges: [],
      forbiddenChanges: ['tool_removal', 'tool_modification', 'functionality_change'],
      performanceThreshold: { maxSlowdown: 0.05 } // 5% 이하 성능 영향만 허용
    }
  },
  
  {
    id: 'step-2-json-overlay',
    name: 'JSON 오버레이 시스템 추가',
    description: 'JSON 템플릿 로딩 및 기본 오버레이 적용 (추가만, 제거 없음)',
    inputPrompt: '', // step-1 결과
    transformation: {
      type: 'json_overlay',
      preserveOriginal: true,
      addCaretExtensions: true,
      overlayMode: 'additive_only' // 기존 내용 제거 금지
    },
    validationCriteria: {
      allowedChanges: ['content_addition', 'formatting_improvement'],
      forbiddenChanges: ['tool_removal', 'functionality_reduction'],
      requireNewFeatures: ['json_template_loading', 'overlay_application']
    }
  },
  
  {
    id: 'step-3-plan-act-removal',
    name: 'Plan/Act 제약 제거',
    description: 'Plan 모드 제한사항 제거, Act 모드 문제 행동 개선',
    inputPrompt: '', // step-2 결과
    transformation: {
      type: 'behavior_modification',
      preserveOriginal: true,
      targetSections: ['plan_mode_limitations', 'act_mode_behaviors'],
      replacementStrategy: 'agent_mode_integration'
    },
    validationCriteria: {
      allowedChanges: ['behavior_improvement', 'constraint_removal'],
      forbiddenChanges: ['tool_removal', 'capability_reduction'],
      requiredBehaviors: ['collaborative_analysis', 'balanced_action']
    }
  },
  
  {
    id: 'step-4-agent-mode',
    name: 'Agent 모드 행동 패턴 적용',
    description: '협력적 사고와 실행을 결합한 Agent 모드 행동 패턴 적용',
    inputPrompt: '', // step-3 결과
    transformation: {
      type: 'agent_mode_application',
      preserveOriginal: true,
      behaviorPatterns: ['collaborative_thinking', 'contextual_action', 'help_seeking'],
      workflowRules: 'adaptive'
    },
    validationCriteria: {
      allowedChanges: ['behavior_enhancement', 'workflow_improvement'],
      forbiddenChanges: ['core_functionality_change'],
      requiredCapabilities: ['analysis_and_action', 'developer_collaboration']
    }
  },
  
  {
    id: 'step-5-optimization',
    name: '토큰 최적화 및 구조 개선',
    description: '의미 보존하면서 토큰 효율성 향상, 논리적 구조 개선',
    inputPrompt: '', // step-4 결과
    transformation: {
      type: 'optimization',
      preserveOriginal: false, // 최적화 단계에서는 구조 변경 허용
      optimizationTargets: ['token_efficiency', 'logical_flow', 'clarity'],
      preservationRequirements: ['all_tools', 'all_capabilities', 'all_behaviors']
    },
    validationCriteria: {
      allowedChanges: ['structure_improvement', 'efficiency_enhancement', 'clarity_improvement'],
      forbiddenChanges: ['functionality_loss', 'capability_reduction'],
      performanceRequirements: ['token_reduction', 'preserved_functionality']
    }
  }
]
```

## ✅ **검증 기준**

### **단계별 통과 기준**
- [ ] **100% 기능 보존**: 모든 단계에서 기능 손실 절대 금지
- [ ] **성능 영향 최소**: 각 단계별 성능 저하 5% 이하
- [ ] **즉시 검증 통과**: 변경 직후 전체 검증 시스템 통과
- [ ] **롤백 가능성**: 모든 변경사항 완전 롤백 가능

### **프레임워크 자체 검증**
- [ ] **자동 롤백 동작**: 검증 실패 시 즉시 이전 상태 복구
- [ ] **상세 로깅**: 모든 변경사항과 검증 결과 기록
- [ ] **성능 최적화**: 검증 프로세스 자체가 개발 속도 저해하지 않음

## 🚨 **위험 요소 및 대응**

### **주요 위험 요소**
1. **부분 실패 처리**: 일부만 성공한 변경의 안전한 처리
2. **롤백 실패**: 롤백 과정에서 추가 오류 발생
3. **성능 병목**: 검증 과정이 개발 속도 저해

### **대응 방안**
1. **원자적 변경**: 각 단계를 완전히 성공하거나 완전히 실패하도록 설계
2. **다중 백업**: 여러 시점의 롤백 포인트 유지
3. **비동기 검증**: 핵심 검증은 즉시, 상세 검증은 백그라운드

## 📝 **Output 파일**

### **구현할 파일들**
1. **`caret-src/core/verification/ProgressiveReplacementManager.ts`**
   - 점진적 교체 관리 로직

2. **`caret-src/core/verification/ReplacementSteps.ts`**
   - 변경 단계 정의 및 검증 기준

3. **`caret-src/core/verification/types.ts`** (확장)
   - ReplacementStep, StepResult 등 타입 추가

4. **`caret-src/__tests__/progressive-replacement.test.ts`**
   - 점진적 교체 테스트 스위트

## 🔄 **Next Steps for 003-03**

003-02 완료 후 다음 단계인 003-03에서는:
- **Cline 원본 래퍼 구현** - 검증된 환경에서 안전한 첫 단계
- **step-1-wrapper** 실제 적용 및 검증
- **JSON 오버레이 시스템 준비**

---

**🎯 목표**: 모든 변경이 안전하고 검증된 점진적 교체 시스템!

**💪 원칙**: 한 번에 하나씩, 검증 후 다음 단계! 절대 서두르지 않기! 