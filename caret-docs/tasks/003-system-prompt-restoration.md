# Task #003: System Prompt JSON 템플릿 시스템 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 기본 기능 완전성**  
**전체 기간**: 1주 (실제 작업 시간)  
**상태**: 🔄 **재설계 중** - 이전 접근 방식 폐기 후 새로 시작

## 🚨 **문제 정의**

### **핵심 문제: Cline의 하드코딩된 시스템 프롬프트**

**Cline의 근본적 한계**:
```typescript
// ❌ Cline의 문제점 (src/core/prompts/system.ts)
return `You are Cline, a highly skilled software engineer...
====
TOOL USE
You have access to a set of tools...
// ... 707줄 하드코딩 계속...
`
```

**이로 인한 구체적 문제들**:
1. **수정 불가능**: 코드 변경 없이 프롬프트 개선 불가
2. **모델별 최적화 어려움**: 각 모델에 맞는 프롬프트 불가  
3. **토큰 낭비**: 불필요한 부분도 항상 포함
4. **유지보수 어려움**: 프롬프트 변경 시 코드 수정 필요
5. **모호하고 추상적인 명령**: 구체적 행동 지침 부족
6. **비구조적 배치**: 논리적 흐름 없는 섹션 배치

### **🎯 JSON 시스템 프롬프트의 핵심 목적**

**✅ JSON 시스템이 해결할 문제들**:
1. **관리 용이성**: 하드코딩된 프롬프트를 구조화된 JSON으로 관리
2. **구체적 행동 지침**: 모호하고 추상적인 명령을 명확하고 구체적으로 변환
3. **구조적 배치**: 논리적 흐름에 따른 체계적 섹션 구성
4. **토큰 최적화**: 간결한 표현으로 불필요한 토큰 절약
5. **모델별 최적화**: 각 모델에 특화된 프롬프트 제공

**🚨 절대 원칙: 기능 누락 금지**
```typescript
// ✅ JSON 시스템 프롬프트 작성/검토 시 필수 확인사항
const jsonPromptValidation = {
  functionalityPreservation: "원본 시스템 프롬프트의 모든 기능 100% 보존",
  toolCompleteness: "모든 도구와 상세 설명 누락 없음",
  behaviorConsistency: "기존 동작 패턴 완전 유지",
  capabilityMaintenance: "모든 기능과 역량 그대로 보존",
  regressionPrevention: "기능 퇴화 절대 금지"
}
```

**JSON 프롬프트 작성 원칙**:
- **기능 우선**: 기존 기능 보존이 최우선
- **구체화**: 추상적 표현을 구체적 행동으로 변환
- **구조화**: 논리적 흐름에 따른 섹션 배치
- **최적화**: 의미 보존하면서 토큰 효율성 향상
- **검증 필수**: 모든 변경사항은 기능 검증 통과 필수

### **Plan/Act 모드의 구체적 문제점**

**❌ Plan 모드의 제약사항**:
- **파일 편집 불가**: 논의만 가능, 실제 협업 작업 불가
- **수동적 태도**: 분석만 하고 실행하지 않음
- **비효율적 워크플로우**: 개발자가 일일이 Act 모드로 전환해야 함

**❌ Act 모드의 문제 행동**:
1. **성급한 행동**: 충분한 분석 없이 즉시 작업 시작
2. **불완전한 분석**: 코드 분석을 끝까지 완료하지 않음
3. **근시안적 사고**: 전체 그림을 보지 않고 발견된 문제만 해결
4. **고집스러운 시도**: 해결 불가능한 문제도 끝까지 시도하여 상황 악화
5. **도움 요청 회피**: 개발자에게 쉽게 도움을 요청하지 않음

**🎯 Agent 모드 통합의 배경**:
- **Workflow Rule 설정 기능**: 새로운 rule 설정 기능으로 단일 모드에서도 다양한 작업 패턴 지원 가능
- **모드 전환 비용 제거**: Plan/Act 전환 없이 상황에 맞는 적절한 행동
- **통합된 지능**: 분석과 실행을 자연스럽게 결합한 협력적 접근

**🎯 Agent 모드로 해결할 목표**:
```typescript
// ✅ Agent 모드의 개선된 행동 (Workflow Rule 기반)
const agentModeGoals = {
  collaboration: "생각하며 협업 - 분석과 실행을 자연스럽게 결합",
  thoroughAnalysis: "문제 발견 시 전체 맥락 파악 후 행동",
  helpSeeking: "어려운 문제는 개발자와 협력하여 해결",
  balancedApproach: "분석과 실행의 적절한 균형",
  contextualThinking: "부분 문제를 전체 아키텍처 관점에서 접근",
  workflowAdaptation: "Rule 설정에 따른 유연한 작업 패턴 적용"
}
```

### **이전 시도의 실패 분석**

**❌ 003-01~04에서 범한 설계 오류들**:
1. **Cline 원본 파싱/재구성 시도** - 정보 손실 발생
2. **과도한 추상화** - extractXXX, analyzeClineFeatures 등
3. **전체 대체 시도** - Cline 707줄을 JSON으로 완전 교체
4. **복잡한 파이프라인** - generateCustomPrompt → loadTemplate → analyzeClineFeatures → merge
5. **성능 개선 과장** - 0.24ms 차이를 "92.8% 개선"으로 표현

**🔍 실제 테스트에서 드러난 문제들**:
- Template loading 실패 시 SYSTEM_PROMPT 폴백 작동 안함
- web_fetch 등 핵심 도구 누락
- Tool extraction이 단순 목록만 반환 (상세 설명 없음)
- 4/8 테스트 실패 (50% 실패율)

## 🎯 **올바른 해결 방향**

### **핵심 설계 철학: Cline 원본 보존 + JSON 오버레이**

```typescript
// ✅ 올바른 접근 방식
class CaretPromptSystem {
  async generatePrompt(context: PromptContext): Promise<string> {
    // 1. Cline 원본 그대로 사용 (정보 손실 없음)
    const clinePrompt = await SYSTEM_PROMPT(context)
    
    // 2. JSON 템플릿으로 맞춤화만 추가
    const overlay = await this.loadJsonOverlay('agent-mode')
    
    // 3. 단순 조합 (파싱/재구성 없음)
    return this.applyOverlay(clinePrompt, overlay)
  }
}
```

### **JSON 템플릿의 올바른 역할**
```json
// ✅ 올바른 JSON 템플릿 역할
{
  "mode": "agent",
  "personality": {
    "remove": ["You are Cline"],
    "add": "You are a collaborative coding assistant"
  },
  "planActRemoval": {
    "remove": [
      "plan_mode_respond limitations",
      "You cannot edit files in plan mode",
      "Switch to act mode to make changes"
    ],
    "add": "Agent mode: Think and act fluidly as needed"
  },
  "behaviorGuidelines": {
    "analysis": "Complete thorough analysis before taking action",
    "collaboration": "Ask for help when uncertain or when it would be more efficient",
    "contextualThinking": "Consider the broader architecture and implications",
    "balancedApproach": "Balance thinking and action appropriately",
    "workflowAdaptation": "Apply workflow rules dynamically based on context"
  },
  "optimizations": {
    "language": "Model-specific optimizations (Claude4, etc.)",
    "tokenEfficiency": "Remove redundant sections for efficiency",
    "structuralClarity": "Logical flow and clear section organization"
  }
}
```

## 📋 **새로운 003 시리즈 설계**

### **🔧 Phase 1: 검증 시스템 구축 (최우선)**
| Task | 제목 | 목표 | 예상 시간 |
|------|------|------|-----------|
| **003-01** | Cline 기능 검증 시스템 구현 | 모든 Cline 기능 보존 확인 자동화 시스템 | 3-4시간 |

### **🏗️ Phase 2: 기반 구조 (검증된 환경에서)**
| Task | 제목 | 목표 | 예상 시간 |
|------|------|------|-----------|
| **003-02** | Cline 원본 래퍼 구현 | SYSTEM_PROMPT 단순 래퍼, 검증 통과 확인 | 2-3시간 |
| **003-03** | JSON 오버레이 시스템 구현 | 기본 JSON 로딩, 오버레이 적용, 검증 통과 | 2-3시간 |

### **🎯 Phase 3: Agent 모드 구현**
| Task | 제목 | 목표 | 예상 시간 |
|------|------|------|-----------|
| **003-04** | Plan/Act 제거 및 Agent 모드 적용 | 모드 제약 해제, 협력적 행동 패턴 적용 | 3-4시간 |

### **📚 Phase 4: 문서화 및 성능 평가**
| Task | 제목 | 목표 | 예상 시간 |
|------|------|------|-----------|
| **003-05** | Cline 머징 고려 개발가이드 문서화 | 향후 Cline 업데이트 대응 방안 및 시스템 유지보수 가이드 | 2-3시간 |
| **003-06** | 성능평가 및 개선사항 보고서 생성 | 기존 Cline 대비 개선사항 측정, 성능 분석, 종합 보고서 작성 | 2-3시간 |

## 🔧 **핵심 설계 원칙**

### **1. 검증 우선 (최우선 원칙)**
- **자동화된 기능 검증**: 모든 Cline 기능이 정확히 작동하는지 자동 확인
- **점진적 교체 검증**: 각 단계마다 기능 손실 없음 보장
- **회귀 테스트**: 변경 후에도 기존 기능 100% 유지 확인
- **실시간 모니터링**: 개발 과정에서 지속적 검증

### **2. Cline 원본 100% 보존**
- SYSTEM_PROMPT 함수를 그대로 호출
- 파싱/재구성 절대 금지
- 모든 도구와 기능 보존

### **3. 최소 오버레이만**
- JSON 템플릿은 추가/수정만
- 기존 기능 제거 최소화
- 점진적 개선 가능

### **4. 단순성 유지**
- 복잡한 파이프라인 금지
- 이해하기 쉬운 구조
- 유지보수 용이성 우선

### **5. 세션 간 연속성 보장**
- **next-session-guide.md**: 각 서브태스크 완료 시 다음 세션을 위한 가이드 작성
- **작업 컨텍스트 보존**: 현재 진행 상황, 중요한 결정사항, 주의사항 기록
- **연속 작업 지원**: 새로운 AI 세션에서도 완벽한 작업 계속 가능

## 📝 **Next-Session-Guide 규칙**

### **next-session-guide.md 작성 원칙**
```markdown
# Next Session Guide - Task 003-XX

## 🎯 **현재 진행 상황**
- **완료된 작업**: 구체적으로 무엇을 완료했는지
- **현재 상태**: 코드, 테스트, 문서의 현재 상태
- **검증 결과**: 통과한 테스트와 확인된 기능들

## 🚨 **중요한 결정사항**
- **설계 결정**: 왜 이렇게 구현했는지
- **제약사항**: 지켜야 할 원칙들
- **주의사항**: 다음 작업 시 주의할 점들

## 🔄 **다음 단계 준비**
- **다음 태스크**: 003-XX의 구체적 목표
- **필요한 파일들**: 수정/생성해야 할 파일 목록
- **검증 방법**: 다음 단계에서 확인해야 할 사항들

## 💡 **개발자를 위한 메모**
- **설계 의도**: 왜 이런 접근을 택했는지
- **대안 검토**: 고려했던 다른 방법들
- **향후 개선점**: 나중에 개선할 수 있는 부분들
```

### **next-session-guide.md 위치 및 관리**
- **위치**: `caret-docs/work-logs/luke/next-session-guide.md`
- **업데이트 시점**: 각 서브태스크 완료 직후
- **내용 갱신**: 새로운 세션 시작 전 최신 상태로 업데이트
- **백업**: 중요한 결정사항은 태스크 문서에도 기록

### **AI 세션 전환 시 체크리스트**
1. **현재 작업 완료 확인**: 모든 변경사항 커밋
2. **next-session-guide.md 업데이트**: 현재 상황과 다음 단계 기록
3. **검증 결과 기록**: 통과한 테스트와 확인된 기능들
4. **중요 결정사항 문서화**: 설계 의도와 제약사항 명시
5. **다음 세션 준비**: 새로운 AI가 바로 작업할 수 있도록 준비

## ⚠️ **주의사항 및 제약조건**

### **절대 하지 말아야 할 것들**
1. **Cline SYSTEM_PROMPT 파싱/재구성** - 정보 손실 위험
2. **검증 없는 변경** - 모든 변경은 검증 시스템 통과 필수
3. **전체 시스템 한 번에 교체** - 리스크 너무 큼
4. **성능 개선 과장** - 실제 측정값 기반으로만 언급
5. **복잡한 추상화** - 단순함이 최고

### **검증 기준 (자동화 필수)**
- ✅ 모든 Cline 도구 포함 (web_fetch 등)
- ✅ 상세한 도구 설명 보존
- ✅ MCP 서버 통합 기능 유지
- ✅ 브라우저 지원 기능 유지
- ✅ Claude4 모델별 분기 지원
- ✅ Plan/Act 제약 제거 확인
- ✅ Agent 모드 행동 패턴 검증

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **완전한 기능 보존**: Cline의 모든 기능이 그대로 작동 (자동 검증)
2. **JSON 유연성**: 코드 수정 없이 프롬프트 변경 가능
3. **Agent 모드**: Plan/Act 제한 없는 자연스러운 협력적 대화
4. **Workflow Rule 통합**: Rule 설정에 따른 유연한 작업 패턴 지원
5. **토큰 최적화**: 불필요한 섹션 제거로 효율성 향상

### **기술적 성공 기준**
1. **검증 시스템**: 100% 자동화된 기능 검증
2. **테스트 통과율**: 100% (기능 손실 없음)
3. **성능**: 기존 Cline 수준 유지 (성능 저하 없음)
4. **코드 품질**: 단순하고 이해하기 쉬운 구조
5. **유지보수성**: 새로운 기능 쉽게 추가 가능

## �� **참고 자료**

### **분석 대상 파일들**
- `src/core/prompts/system.ts` - Cline 메인 프롬프트 (707줄)
- `src/core/prompts/model_prompts/claude4.ts` - Claude4 표준
- `src/core/prompts/model_prompts/claude4-experimental.ts` - 실험 기능
- `caret-zero/src/core/prompts/` - 이전 시도 참고용

### **검증 도구 (새로 구현)**
- **Cline 기능 검증 시스템** - 모든 도구와 기능 자동 검증
- **점진적 교체 검증** - 단계별 변경 시 안전성 확인
- Vitest 기반 TDD 테스트 시스템
- CaretLogger를 통한 상세 로깅

---

**🎯 목표: Cline의 완전한 기능 + JSON의 유연성 + Agent 모드의 협력적 지능!**

**접근 방식: 검증 시스템 먼저, 그 다음 단순하고 안전하게!** ✨
