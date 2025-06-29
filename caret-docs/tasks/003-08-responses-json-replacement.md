# Task #003-08: responses.ts JSON 교체 작업

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🔥 **High - Phase 2 핵심 변환**  
**예상 시간**: 4-5시간  
**상태**: 📋 **예정**  
**의존성**: ✅ 003-07 (responses.ts 검증 도구 개발) 완료

## 🎯 **목표: responses.ts 안전한 JSON 변환 실행**

### **핵심 목적**
- **2-stage 접근법 Phase 2**: 검증 시스템 기반 안전한 responses.ts JSON 변환
- **단계별 변환**: 낮은 위험부터 점진적 변환으로 안전성 극대화
- **실시간 품질 검증**: 변환 과정 중 지속적 품질 모니터링
- **완벽한 호환성**: 기존 44개 사용처에서 완전 동일한 동작 보장
- **🚨 Cline/Caret 모드 구분 유지**: 모든 변환 작업에서 기존 모드별 용어 구분 완전 보존

### **🎯 핵심 요구사항 - Cline/Caret 모드 구분 유지**
**🚨 CRITICAL**: 모든 responses.ts JSON 변환 과정에서 **Cline/Caret 모드 구분**을 그대로 유지해야 합니다:
- **Caret 모드**: "Chatbot/Agent" 용어 사용 (현재 하이브리드 시스템 유지)
- **Cline 모드**: "Plan/Act" 용어 사용 (원본 Cline 용어 유지)
- **JSON 응답**: 모드별 다른 응답 템플릿 자동 선택 구현
- **매개변수 전달**: `chatSettings.mode` 매개변수를 모든 응답 함수에 전달
- **호환성 테스트**: 모드 전환 시나리오 완전 검증

### **responses.ts 변환 전략**

#### **📊 변환 범위 분석 (003-07 완료 기준)**
- **총 함수 수**: ~15-20개 함수 (분석 완료)
- **우선순위 분류**: 저위험 → 중위험 → 고위험 순차 변환
- **사용 빈도 기준**: 낮은 빈도부터 안전한 변환
- **의존성 고려**: 독립적 함수부터 의존성 있는 함수 순

#### **🛡️ 안전 변환 원칙**
- **단계별 검증**: 각 단계 완료 후 전체 시스템 검증
- **실시간 비교**: 변환 전후 응답 품질 실시간 비교
- **즉시 롤백**: 품질 저하 감지 시 자동 원상복구
- **백업 보존**: 모든 변환 단계별 백업 유지

## 📋 **단계별 JSON 변환 계획**

### **Phase 1: 저위험 오류 응답 변환 (1.5시간)**

#### **1.1 오류 응답 함수 JSON 변환**
```typescript
// 변환 대상: 오류 처리 관련 함수들 (가장 안전한 시작점)
// - formatError, handleToolError, getErrorMessage 등

// 원본: src/core/prompts/responses.ts
export const formatError = (error: Error, context?: string): string => {
  const contextInfo = context ? ` (Context: ${context})` : ''
  return `I encountered an error${contextInfo}: ${error.message}`
}

export const handleToolError = (toolName: string, error: string): string => {
  return `Tool "${toolName}" failed with error: ${error}`
}

// 변환 후: caret-src/core/prompts/sections/ERROR_RESPONSES.json
{
  "error_responses": {
    "format_error": {
      "template": "I encountered an error{{#context}} (Context: {{context}}){{/context}}: {{error_message}}",
      "parameters": {
        "error_message": {
          "type": "string",
          "required": true,
          "description": "The error message to format"
        },
        "context": {
          "type": "string", 
          "required": false,
          "description": "Optional context information"
        }
      }
    },
    "handle_tool_error": {
      "template": "Tool \"{{tool_name}}\" failed with error: {{error}}",
      "parameters": {
        "tool_name": {
          "type": "string",
          "required": true
        },
        "error": {
          "type": "string", 
          "required": true
        }
      }
    }
  }
}
```

#### **1.2 CaretSystemPrompt 오류 응답 통합**
```typescript
// caret-src/core/prompts/CaretSystemPrompt.ts - 오류 응답 처리 추가
class CaretSystemPrompt {
  async generateErrorResponse(
    errorType: string, 
    parameters: Record<string, any>
  ): Promise<string> {
    const errorSection = await this.jsonLoader.loadSection('ERROR_RESPONSES')
    const template = errorSection.error_responses[errorType]
    
    if (!template) {
      throw new Error(`Unknown error response type: ${errorType}`)
    }
    
    return this.templateEngine.render(template.template, parameters)
  }

  // 기존 functions에서 사용할 수 있는 호환성 레이어
  formatError(error: Error, context?: string): string {
    return this.generateErrorResponse('format_error', {
      error_message: error.message,
      context: context
    })
  }

  handleToolError(toolName: string, error: string): string {
    return this.generateErrorResponse('handle_tool_error', {
      tool_name: toolName,
      error: error
    })
  }
}
```

#### **1.3 점진적 대체 및 검증**
```typescript
// src/core/prompts/responses.ts - 점진적 대체
import { CaretSystemPrompt } from '../../../caret-src/core/prompts/CaretSystemPrompt'

// CARET MODIFICATION: 점진적 JSON 변환 - 오류 응답 함수들
let caretPrompt: CaretSystemPrompt | null = null

export const formatError = (error: Error, context?: string): string => {
  // 실시간 품질 비교를 위한 원본 결과 계산
  const originalResult = (() => {
    const contextInfo = context ? ` (Context: ${context})` : ''
    return `I encountered an error${contextInfo}: ${error.message}`
  })()

  // CaretSystemPrompt 사용 시도
  try {
    if (!caretPrompt) {
      // extensionPath는 전역에서 제공되어야 함
      caretPrompt = CaretSystemPrompt.getInstance(global.extensionPath)
    }
    
    const jsonResult = caretPrompt.formatError(error, context)
    
    // 실시간 품질 비교
    const qualityScore = compareResponseQuality(originalResult, jsonResult)
    if (qualityScore < 0.95) {
      console.warn(`[CARET] JSON response quality below threshold: ${qualityScore}`)
      return originalResult // Fallback to original
    }
    
    return jsonResult
  } catch (error) {
    console.warn('[CARET] Error response generation failed, using original:', error)
    return originalResult
  }
}
```

### **Phase 2: 도구 응답 변환 (1.5시간)**

#### **2.1 도구 관련 응답 JSON 변환**
```typescript
// 변환 대상: 도구 성공/실패 응답, 도구 설명 등

// TOOL_RESPONSES.json
{
  "tool_responses": {
    "tool_success": {
      "template": "✅ {{tool_name}} completed successfully{{#details}}: {{details}}{{/details}}",
      "parameters": {
        "tool_name": {
          "type": "string",
          "required": true
        },
        "details": {
          "type": "string",
          "required": false
        }
      }
    },
    "tool_progress": {
      "template": "⏳ {{tool_name}} is running{{#progress}} ({{progress}}){{/progress}}...",
      "parameters": {
        "tool_name": {
          "type": "string",
          "required": true
        },
        "progress": {
          "type": "string",
          "required": false,
          "description": "Progress indicator like percentage or step info"
        }
      }
    },
    "file_operation_success": {
      "template": "📝 {{operation}} completed: {{file_path}}{{#changes}} ({{changes}}){{/changes}}",
      "parameters": {
        "operation": {
          "type": "string",
          "required": true,
          "enum": ["Created", "Modified", "Deleted", "Renamed"]
        },
        "file_path": {
          "type": "string",
          "required": true
        },
        "changes": {
          "type": "string",
          "required": false,
          "description": "Description of changes made"
        }
      }
    }
  }
}
```

#### **2.2 실시간 품질 검증 강화**
```typescript
// caret-src/core/verification/runtime/QualityMonitor.ts
export class RuntimeQualityMonitor {
  private qualityThreshold = 0.95
  private fallbackCount = new Map<string, number>()

  async compareAndValidate(
    functionName: string,
    originalResult: string,
    jsonResult: string,
    parameters: Record<string, any>
  ): Promise<ValidationResult> {
    
    const qualityScore = await this.calculateQualityScore(originalResult, jsonResult)
    
    if (qualityScore < this.qualityThreshold) {
      // 품질 저하 감지 시 경고 및 카운트
      this.fallbackCount.set(functionName, (this.fallbackCount.get(functionName) || 0) + 1)
      
      console.warn(`[CARET] Quality degradation detected:`, {
        function: functionName,
        score: qualityScore,
        fallbackCount: this.fallbackCount.get(functionName),
        parameters,
        original: originalResult,
        converted: jsonResult
      })
      
      // 연속 실패 시 자동 롤백 고려
      if (this.fallbackCount.get(functionName)! > 5) {
        console.error(`[CARET] Function ${functionName} failing repeatedly, consider rollback`)
      }
      
      return {
        useOriginal: true,
        reason: 'quality_threshold',
        score: qualityScore
      }
    }
    
    return {
      useOriginal: false, 
      reason: 'quality_passed',
      score: qualityScore
    }
  }
}
```

### **Phase 3: 핵심 응답 변환 (2시간)**

#### **3.1 핵심 응답 함수 변환 (가장 신중)**
```typescript
// 변환 대상: 사용 빈도가 높은 핵심 응답 함수들
// - generateResponse, formatToolResult, createCompletionMessage 등

// CORE_RESPONSES.json
{
  "core_responses": {
    "generate_response": {
      "template": "{{#thinking}}{{thinking}}\n\n{{/thinking}}{{response}}{{#followup}}\n\n{{followup}}{{/followup}}",
      "parameters": {
        "thinking": {
          "type": "string",
          "required": false,
          "description": "Internal thinking process (optional)"
        },
        "response": {
          "type": "string", 
          "required": true,
          "description": "Main response content"
        },
        "followup": {
          "type": "string",
          "required": false,
          "description": "Follow-up questions or suggestions"
        }
      },
      "metadata": {
        "critical": true,
        "usage_frequency": "high",
        "rollback_priority": 1
      }
    },
    "completion_message": {
      "template": "{{message}}{{#summary}}\n\n**Summary:**\n{{summary}}{{/summary}}{{#next_steps}}\n\n**Next Steps:**\n{{next_steps}}{{/next_steps}}",
      "parameters": {
        "message": {
          "type": "string",
          "required": true
        },
        "summary": {
          "type": "string",
          "required": false
        },
        "next_steps": {
          "type": "string",
          "required": false
        }
      },
      "metadata": {
        "critical": true,
        "usage_frequency": "high"
      }
    }
  }
}
```

#### **3.2 고위험 함수 최대 안전 변환**
```typescript
// src/core/prompts/responses.ts - 최대 안전 변환
export const generateResponse = async (
  thinking: string,
  response: string, 
  followup?: string
): Promise<string> => {
  // 원본 로직 유지 (100% 호환성)
  const originalResult = (() => {
    let result = ''
    if (thinking) result += thinking + '\n\n'
    result += response
    if (followup) result += '\n\n' + followup
    return result
  })()

  // CaretSystemPrompt 시도 (최대한 안전하게)
  try {
    if (!caretPrompt) {
      caretPrompt = CaretSystemPrompt.getInstance(global.extensionPath)
    }
    
    const jsonResult = await caretPrompt.generateCoreResponse('generate_response', {
      thinking,
      response,
      followup
    })
    
    // 엄격한 품질 검증 (핵심 함수이므로)
    const validation = await runtimeMonitor.compareAndValidate(
      'generateResponse', 
      originalResult, 
      jsonResult,
      { thinking, response, followup }
    )
    
    if (validation.useOriginal) {
      return originalResult
    }
    
    return jsonResult
    
  } catch (error) {
    // 핵심 함수에서는 에러 로깅 강화
    console.error('[CARET] Critical function generateResponse failed:', error)
    await this.notifyDevelopers('generateResponse_failure', error)
    return originalResult
  }
}
```

## 🔧 **변환 실행 도구**

### **자동화된 변환 스크립트**
```bash
# 단계별 변환 실행
node caret-scripts/responses-converter.js --phase 1  # 오류 응답
node caret-scripts/responses-converter.js --phase 2  # 도구 응답  
node caret-scripts/responses-converter.js --phase 3  # 핵심 응답

# 전체 변환 (모든 단계)
node caret-scripts/responses-converter.js --all

# 품질 검증 및 리포트
node caret-scripts/responses-quality-report.js

# 롤백 (필요시)
node caret-scripts/responses-rollback.js --phase 2
```

### **변환 모니터링 대시보드**
```typescript
// caret-scripts/responses-monitor.js
class ConversionMonitor {
  async startMonitoring() {
    console.log('🔍 responses.ts JSON 변환 모니터링 시작')
    
    setInterval(async () => {
      const stats = await this.collectStats()
      this.displayStats(stats)
      
      if (stats.failureRate > 0.05) { // 5% 이상 실패시
        console.warn('⚠️  높은 실패율 감지, 롤백 고려 필요')
      }
    }, 5000) // 5초마다 체크
  }

  private async collectStats(): Promise<ConversionStats> {
    return {
      totalCalls: await this.countTotalCalls(),
      successfulConversions: await this.countSuccessful(),
      fallbackToOriginal: await this.countFallbacks(),
      averageQualityScore: await this.calculateAverageQuality(),
      criticalErrors: await this.countCriticalErrors()
    }
  }
}
```

## ✅ **완료 검증 기준**

### **변환 완성도**
- [ ] **Phase 1 완료**: 모든 오류 응답 함수 JSON 변환
- [ ] **Phase 2 완료**: 모든 도구 응답 함수 JSON 변환  
- [ ] **Phase 3 완료**: 모든 핵심 응답 함수 JSON 변환
- [ ] **호환성 유지**: 44개 사용처에서 동일한 결과

### **품질 보장**
- [ ] **품질 점수**: 평균 95% 이상 품질 유지
- [ ] **실패율 제한**: 5% 미만 fallback 발생
- [ ] **성능 유지**: 응답 생성 속도 기존 수준
- [ ] **일관성 검증**: 모든 시나리오에서 일관된 응답

### **안전성 확인**
- [ ] **백업 유지**: 모든 변환 단계별 백업 보존
- [ ] **롤백 준비**: 즉시 롤백 가능한 상태 유지
- [ ] **에러 모니터링**: 실시간 에러 감지 및 알림
- [ ] **품질 모니터링**: 지속적 품질 추적 시스템

### **통합 테스트**
- [ ] **전체 시스템 테스트**: 모든 Cline 기능 정상 동작
- [ ] **사용자 시나리오**: 실제 사용 시나리오 테스트 통과
- [ ] **스트레스 테스트**: 고부하 상황에서 안정성 확인
- [ ] **호환성 테스트**: 기존 대화 히스토리 호환성

## 🔄 **다음 단계 연결**

### **Phase 2 (responses.ts) 완성!**
✅ **완료될 시스템**:
- responses.ts 완전한 JSON 변환
- 실시간 품질 검증 시스템 운영
- 44개 사용처 완벽 호환성 유지
- 안전한 rollback 시스템 구축

### **003-09 준비사항 (Phase 3 시작)**
📋 **다음 단계 목표**:
- 나머지 파일들 (claude4.ts, claude4-experimental.ts, commands.ts, loadMcpDocumentation.ts) 검증 도구 개발
- Phase 2 경험을 바탕으로 한 더 효율적인 변환 프로세스
- 전체 시스템 통합을 위한 기반 마련

### **성공 후 기대효과**
- **응답 품질**: JSON 템플릿 기반 일관된 고품질 응답
- **유지보수성**: 코드 수정 없이 응답 패턴 변경 가능
- **확장성**: 새로운 응답 패턴 쉽게 추가 가능
- **국제화**: 다국어 응답 템플릿 지원 기반 마련

---

**🎯 목적: 안전하고 검증된 responses.ts JSON 변환으로 Caret 응답 시스템 품질 혁신!** ✨ 