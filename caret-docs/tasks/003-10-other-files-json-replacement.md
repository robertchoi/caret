# Task #003-10: 나머지 파일들 JSON 교체 작업

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🔥 **High - Phase 3 핵심 변환**  
**예상 시간**: 6-8시간  
**상태**: 📋 **예정**  
**의존성**: ✅ 003-09 (나머지 파일들 검증 도구 개발) 완료

## 🎯 **목표: 나머지 4개 파일의 안전한 JSON 변환 실행**

### **핵심 목적**
- **2-stage 접근법 Phase 2**: 검증 시스템 기반 4개 파일의 단계적 안전한 JSON 변환
- **위험도별 순차 변환**: commands.ts → experimental → claude4.ts → mcpDoc 순서
- **실시간 품질 보장**: 각 단계별 품질 모니터링 및 즉시 롤백
- **성능 최적화 유지**: Claude4 최적화 구간 보존 및 성능 영향 최소화
- **🚨 Cline/Caret 모드 구분 유지**: 모든 JSON 변환 작업에서 기존 모드별 용어 구분 완전 보존

### **🎯 핵심 요구사항 - Cline/Caret 모드 구분 유지**
**🚨 CRITICAL**: 모든 나머지 파일들의 JSON 변환 과정에서 **Cline/Caret 모드 구분**을 그대로 유지해야 합니다:
- **Caret 모드**: "Chatbot/Agent" 용어 사용 (현재 하이브리드 시스템 유지)
- **Cline 모드**: "Plan/Act" 용어 사용 (원본 Cline 용어 유지)
- **Commands.ts**: 모드별 다른 명령어 응답 메시지 지원
- **Claude4.ts**: 모드별 최적화된 프롬프트 템플릿 지원
- **Experimental**: 모드별 실험적 기능 활성화 차별화
- **MCP 문서**: 모드별 문서 생성 스타일 구분 지원

### **변환 전략 개요**

#### **📊 변환 순서 (위험도 기준)**
1. **commands.ts** (179줄) - 최저 위험: 구조화된 명령어
2. **claude4-experimental.ts** (347줄) - 중간 위험: 실험적 기능
3. **claude4.ts** (715줄) - 높은 위험: 성능 최적화 핵심
4. **loadMcpDocumentation.ts** (362줄) - 최고 위험: 동적 생성

#### **🛡️ 단계별 안전장치**
- **단계별 백업**: 각 파일 변환 전 완전한 백업 생성
- **A/B 테스트**: 원본과 JSON 버전 동시 실행 및 비교
- **성능 벤치마크**: Claude4 관련 파일은 응답 속도 실시간 모니터링
- **즉시 롤백**: 품질 저하 감지 시 자동 원상복구

## 📋 **단계별 변환 실행 계획**

### **Step 1: commands.ts 변환 (1.5시간)**

#### **1.1 명령어 시스템 JSON 변환**
```typescript
// 원본: src/core/prompts/commands.ts
export const getCommandResponse = (command: string, result: string): string => {
  switch (command) {
    case 'list_files':
      return `📁 Files listed:\n${result}`
    case 'read_file':
      return `📖 File content:\n${result}`
    case 'write_file':
      return `✏️ File written:\n${result}`
    default:
      return `🔧 Command executed:\n${result}`
  }
}

// 변환 후: caret-src/core/prompts/sections/COMMAND_RESPONSES.json
{
  "command_responses": {
    "list_files": {
      "template": "📁 Files listed:\n{{result}}",
      "parameters": {
        "result": {
          "type": "string",
          "required": true,
          "description": "File listing output"
        }
      }
    },
    "read_file": {
      "template": "📖 File content:\n{{result}}",
      "parameters": {
        "result": {
          "type": "string", 
          "required": true,
          "description": "File content to display"
        }
      }
    },
    "write_file": {
      "template": "✏️ File written:\n{{result}}",
      "parameters": {
        "result": {
          "type": "string",
          "required": true,
          "description": "Write operation result"
        }
      }
    },
    "default": {
      "template": "🔧 Command executed:\n{{result}}",
      "parameters": {
        "result": {
          "type": "string",
          "required": true,
          "description": "Command execution result"
        }
      }
    }
  }
}
```

#### **1.2 CaretSystemPrompt 명령어 응답 통합**
```typescript
// caret-src/core/prompts/CaretSystemPrompt.ts
async generateCommandResponse(command: string, result: string): Promise<string> {
  const commandSection = await this.jsonLoader.loadSection('COMMAND_RESPONSES')
  const responseKey = command in commandSection.command_responses ? command : 'default'
  const template = commandSection.command_responses[responseKey]
  
  return this.templateEngine.render(template.template, { result })
}
```

### **Step 2: claude4-experimental.ts 변환 (2시간)**

#### **2.1 실험적 기능 구간 분류**
```typescript
// 실험적 기능별 JSON 섹션 분리
// EXPERIMENTAL_FEATURES.json
{
  "experimental_features": {
    "beta_tools": {
      "template": "🧪 **Beta Feature**: {{feature_name}}\n{{description}}\n\n{{usage_instructions}}",
      "parameters": {
        "feature_name": { "type": "string", "required": true },
        "description": { "type": "string", "required": true },
        "usage_instructions": { "type": "string", "required": false }
      },
      "metadata": {
        "stability": "experimental",
        "rollback_priority": "high"
      }
    },
    "advanced_reasoning": {
      "template": "🤔 **Advanced Reasoning Mode**\n{{reasoning_process}}\n\n**Conclusion**: {{conclusion}}",
      "parameters": {
        "reasoning_process": { "type": "string", "required": true },
        "conclusion": { "type": "string", "required": true }
      },
      "metadata": {
        "stability": "experimental",
        "performance_impact": "medium"
      }
    }
  }
}
```

#### **2.2 Feature Flag 시스템 통합**
```typescript
// 실험적 기능 on/off 토글 시스템
class ExperimentalFeatureManager {
  private featureFlags: Map<string, boolean> = new Map()

  async generateExperimentalResponse(
    featureType: string, 
    parameters: Record<string, any>,
    fallbackEnabled: boolean = true
  ): Promise<string> {
    
    if (!this.isFeatureEnabled(featureType) && fallbackEnabled) {
      // 실험적 기능이 비활성화된 경우 안전한 대체
      return this.generateFallbackResponse(featureType, parameters)
    }
    
    try {
      return await this.caretPrompt.generateExperimentalResponse(featureType, parameters)
    } catch (error) {
      console.warn(`[CARET] Experimental feature ${featureType} failed:`, error)
      return fallbackEnabled ? 
        this.generateFallbackResponse(featureType, parameters) :
        this.generateErrorResponse(error)
    }
  }
}
```

### **Step 3: claude4.ts 변환 (2.5시간) - 최고 주의**

#### **3.1 성능 최적화 구간 보존**
```typescript
// claude4.ts의 성능 최적화 구간을 JSON으로 변환하되 원본 성능 유지
// CLAUDE4_OPTIMIZED.json
{
  "claude4_optimizations": {
    "token_efficient_system": {
      "template": "{{system_context}}{{#tools}}\n\nTools: {{tools}}{{/tools}}{{#constraints}}\n\nConstraints: {{constraints}}{{/constraints}}",
      "parameters": {
        "system_context": { 
          "type": "string", 
          "required": true,
          "optimization": "token_minimal" 
        },
        "tools": { 
          "type": "array", 
          "required": false,
          "optimization": "compressed_format"
        },
        "constraints": { 
          "type": "string", 
          "required": false,
          "optimization": "essential_only"
        }
      },
      "metadata": {
        "performance_critical": true,
        "token_budget": "strict",
        "latency_target": "< 100ms"
      }
    }
  }
}
```

#### **3.2 성능 벤치마크 시스템**
```typescript
// 성능 모니터링 강화 (Claude4 전용)
class Claude4PerformanceBenchmark {
  private baselineMetrics: PerformanceMetrics
  
  async benchmarkConversion(): Promise<BenchmarkResult> {
    // 원본 성능 측정
    const originalMetrics = await this.measureOriginalPerformance()
    
    // JSON 버전 성능 측정
    const jsonMetrics = await this.measureJsonPerformance()
    
    return {
      tokenEfficiency: this.compareTokenUsage(originalMetrics, jsonMetrics),
      responseLatency: this.compareLatency(originalMetrics, jsonMetrics),
      qualityScore: await this.compareQuality(originalMetrics, jsonMetrics),
      performanceRatio: this.calculatePerformanceRatio(originalMetrics, jsonMetrics),
      recommendation: this.generateRecommendation(originalMetrics, jsonMetrics)
    }
  }

  private generateRecommendation(original: PerformanceMetrics, json: PerformanceMetrics): string {
    const latencyDiff = json.averageLatency - original.averageLatency
    const tokenDiff = json.tokenUsage - original.tokenUsage
    
    if (latencyDiff > 50 || tokenDiff > 100) {
      return 'ROLLBACK_RECOMMENDED'
    } else if (latencyDiff > 20 || tokenDiff > 50) {
      return 'OPTIMIZATION_NEEDED'
    } else {
      return 'CONVERSION_APPROVED'
    }
  }
}
```

### **Step 4: loadMcpDocumentation.ts 변환 (2시간) - 하이브리드 접근**

#### **4.1 하이브리드 변환 전략**
```typescript
// 동적 생성 부분은 함수로 유지, 정적 템플릿은 JSON으로 변환
// MCP_DOCUMENTATION.json
{
  "mcp_documentation": {
    "server_overview": {
      "template": "# {{server_name}}\n\n{{description}}\n\n## Available Tools\n{{#tools}}{{> tool_item}}{{/tools}}",
      "partials": {
        "tool_item": "- **{{name}}**: {{description}}\n"
      },
      "parameters": {
        "server_name": { "type": "string", "required": true },
        "description": { "type": "string", "required": true },
        "tools": { 
          "type": "array", 
          "required": true,
          "items": {
            "name": { "type": "string" },
            "description": { "type": "string" }
          }
        }
      }
    },
    "dynamic_content": {
      "generation_function": "generateDynamicMcpContent",
      "template_base": "{{static_header}}\n\n{{dynamic_content}}\n\n{{static_footer}}",
      "parameters": {
        "static_header": { "type": "string", "source": "template" },
        "dynamic_content": { "type": "string", "source": "function" },
        "static_footer": { "type": "string", "source": "template" }
      }
    }
  }
}

// 동적 생성 함수는 별도 유지
export async function generateDynamicMcpContent(mcpHub: McpHub): Promise<string> {
  // 기존 복잡한 동적 생성 로직 유지
  const servers = await mcpHub.getAvailableServers()
  return servers.map(server => generateServerDoc(server)).join('\n\n')
}
```

## 🔧 **변환 실행 및 모니터링**

### **자동화된 변환 실행**
```bash
# 단계별 변환 (위험도 순)
node caret-scripts/convert-commands.js      # Step 1: 가장 안전
node caret-scripts/convert-experimental.js  # Step 2: 중간 위험
node caret-scripts/convert-claude4.js       # Step 3: 높은 위험
node caret-scripts/convert-mcpdoc.js        # Step 4: 최고 위험

# 실시간 성능 모니터링
node caret-scripts/performance-monitor.js &

# 품질 검증 대시보드
node caret-scripts/quality-dashboard.js &
```

### **변환 후 검증 체크리스트**
```bash
# 각 단계 완료 후 실행
npm run compile                    # 컴파일 성공 확인
npm test                          # 기존 테스트 통과 확인
node caret-scripts/quality-check.js  # 품질 점수 확인
node caret-scripts/performance-benchmark.js  # 성능 영향 측정
```

## ✅ **완료 검증 기준**

### **변환 완성도**
- [ ] **commands.ts**: 모든 명령어 응답 JSON 변환
- [ ] **experimental.ts**: 실험적 기능 Feature Flag 시스템 완성
- [ ] **claude4.ts**: 성능 최적화 유지하며 JSON 변환
- [ ] **mcpDoc.ts**: 하이브리드 방식으로 안전한 변환

### **성능 및 품질**
- [ ] **성능 유지**: Claude4 응답 속도 기존 수준 유지
- [ ] **품질 보장**: 모든 응답 95% 이상 품질 점수
- [ ] **안정성**: 실험적 기능 Feature Flag로 안전성 확보
- [ ] **호환성**: 기존 MCP 문서 생성 완벽 호환

### **시스템 통합**
- [ ] **전체 컴파일**: TypeScript 오류 없음
- [ ] **테스트 통과**: 모든 기존 테스트 성공
- [ ] **실제 사용**: 실제 시나리오에서 정상 동작
- [ ] **롤백 준비**: 모든 단계별 즉시 롤백 가능

## 🔄 **다음 단계 연결**

### **Phase 3 (나머지 파일들) 완성!**
✅ **완료될 시스템**:
- 4개 파일 모두 JSON 변환 완료
- 성능 최적화 구간 보존
- Feature Flag 기반 실험적 기능 관리
- 하이브리드 방식으로 복잡한 동적 생성 처리

### **003-11 준비사항 (최종 통합)**
📋 **다음 단계 목표**:
- 전체 프롬프트 시스템 통합 테스트
- system.ts + responses.ts + 4개 파일 완전 연동 검증
- 성능 및 품질 최종 검증
- 사용자 시나리오 E2E 테스트

### **최종 완성 후 기대효과**
- **완전한 JSON 기반**: Cline 전체 프롬프트 시스템 JSON 템플릿화
- **유연한 커스터마이징**: 코드 수정 없이 프롬프트 패턴 변경
- **성능 최적화**: Claude4 최적화 유지하며 구조적 개선
- **안전한 실험**: Feature Flag로 새로운 기능 안전하게 테스트

---

**🎯 목적: 4개 파일의 완전한 JSON 변환으로 Caret 프롬프트 시스템 혁신 완성!** ✨ 