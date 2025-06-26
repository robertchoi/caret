# Next Session Guide - Task 003 Series

## 🎯 **현재 진행 상황**

### **완료된 작업**
- ✅ Task #003 마스터 문서 재작성 완료
- ✅ 이전 003-하위 작업들 실패 분석 완료  
- ✅ JSON 시스템 프롬프트 목적 명확화
- ✅ Plan/Act 모드 문제점 구체화
- ✅ Agent 모드 목표 정의
- ✅ next-session-guide.md 규칙 복원
- ✅ **003-01~07 모든 하위 작업 문서 재작성** (cline fork프로젝트인 caret의 오버레이 구조 기반, caret-zero 통합 고려)
- ✅ **003-01 Cline 기능 검증 시스템 완전 구현** (2025-01-26)

### **현재 상태**
- **문서**: 모든 003 시리즈 문서 완성 (003-01~07)
- **코드**: 003-01 완전 구현 완료
- **검증**: 🚀 **003-02에서 즉시 시작 가능**

### **🎉 003-01 완료 상세**
- **ClineFeatureValidator 시스템**: 완전 구현 (6개 모듈, 1,500+ 라인)
- **25개 테스트**: 100% 통과 (0ms 내 검증 완료)
- **15개 Cline 도구**: 완벽 커버리지 달성
- **모듈 아키텍처**: SRP 적용, 75% 코드 감소 달성
- **통합 테스트**: `npm run test:all`에 별도 카테고리로 분리
- **문서화**: `system-prompt-implementation.mdx`, `upstream-merging.mdx` 업데이트

### **🔍 검증 시스템 세부사항**
**아키텍처**:
```
ClineFeatureValidator (294 lines)
├── ToolExtractor (263 lines) - 15개 도구 추출/분류
├── McpExtractor - MCP 서버 추출
├── SystemInfoExtractor - 시스템 정보 추출  
├── ValidationEngine - 검증 로직
├── ReportGenerator - 보고서 생성
└── MetricsCollector - 성능 메트릭
```

**검증 범위**:
- **CORE_TOOLS** (7개): execute_command, read_file, write_to_file, replace_in_file, search_files, list_files, list_code_definition_names
- **INTERACTIVE_TOOLS** (2개): ask_followup_question, attempt_completion
- **TASK_TOOLS** (3개): new_task, plan_mode_respond, load_mcp_documentation
- **MCP_TOOLS** (2개): use_mcp_tool, access_mcp_resource
- **CONDITIONAL_TOOLS** (1개): browser_action

**성능 메트릭**:
- **검증 시간**: 0-1ms (목표: 100ms 이하)
- **메모리 사용**: 12-14MB (목표: 10MB 이하)
- **테스트 커버리지**: 100% (25/25 통과)

## 🚨 **중요한 결정사항**

### **설계 결정**
1. ✅ **검증 시스템 완성**: 003-01에서 완전한 검증 시스템 구축 완료
2. **Cline 원본 100% 보존**: 파싱/재구성 절대 금지
3. **JSON 오버레이 방식**: 원본 + 추가/수정만
4. **Agent 모드 통합**: Plan/Act 제약 해제, 협력적 지능 구현

### **제약사항**
- **기능 누락 절대 금지**: 모든 Cline 기능 100% 보존 필수
- ✅ **검증 없는 변경 금지**: 검증 시스템 완성으로 모든 변경 검증 가능
- **복잡한 추상화 금지**: 단순하고 이해하기 쉬운 구조 유지

### **주의사항**
- JSON 프롬프트 작성 시 기능 보존이 최우선
- 토큰 최적화는 기능 보존 후 진행
- 각 단계마다 회귀 테스트 필수 (ClineFeatureValidator 활용)

## 🚀 **다음 세션 즉시 시작**

### **다음 태스크: 003-02 Cline 원본 래퍼 구현**
- **상태**: ✅ **문서 완성** - 즉시 구현 시작 가능
- **목표**: Cline SYSTEM_PROMPT 단순 래퍼 구현
- **예상 시간**: 2-3시간
- **핵심 작업**: 
  - CaretSystemPrompt 클래스 구현
  - 기존 SYSTEM_PROMPT 호출 래핑
  - 성능 메트릭 수집 시스템
  - 완전한 기능 보존 검증

### **구현할 파일들**
- `caret-src/core/prompts/CaretSystemPrompt.ts` (새로 생성)
- `caret-src/core/prompts/types.ts` (새로 생성)
- `caret-src/__tests__/caret-system-prompt.test.ts` (새로 생성)
- `caret-src/extension.ts` (CaretSystemPrompt 통합)

### **✅ 준비된 기반 시스템**
**003-01에서 구축된 검증 인프라**:
- ✅ `ClineFeatureValidator` - 기본 검증 엔진
- ✅ `ToolExtractor` - 도구 추출 시스템
- ✅ `ValidationEngine` - 검증 로직
- ✅ `ReportGenerator` - 보고서 생성
- ✅ 25개 테스트 스위트 - 검증 기준

### **검증 방법**
- 기존 ClineFeatureValidator와 연동
- 변경 전/후 상태 비교
- 실시간 검증 파이프라인
- 자동 롤백 트리거

## 💡 **개발자를 위한 메모**

### **설계 의도**
- ✅ **검증 우선 완료**: 003-01에서 안전한 변경을 위한 검증 시스템 완성
- **점진적 개선**: 한 번에 모든 것을 바꾸지 않고 단계별 접근
- **자동화 우선**: 수동 검증 최소화, 자동 검증 최대화

### **003-01 성과**
- ✅ **완전한 검증 시스템**: 모든 Cline 기능 자동 검증
- ✅ **성능 최적화**: 0-1ms 내 검증 완료
- ✅ **모듈화**: SRP 적용으로 유지보수성 향상
- ✅ **문서화**: 개발자 가이드 완성

### **향후 개선점**
- JSON 템플릿 동적 로딩 시스템 (003-04에서 구현)
- Workflow Rule 기반 동적 행동 패턴 (003-05에서 구현)
- 모델별 최적화 템플릿
- 실시간 프롬프트 편집 UI

## 🎯 **003 시리즈 전체 로드맵**

### **Phase 1: 검증 시스템 (003-01)**
- ✅ 003-01: Cline 기능 검증 시스템 구현 **[완료]**

### **Phase 2: 기반 구조 (003-02~03)**  
- 🚀 003-02: Cline 원본 래퍼 구현 **[다음 목표]**
- 003-03: JSON 오버레이 시스템 구현

### **Phase 3: Agent 모드 (003-04)**
- 003-04: Plan/Act 제거 및 Agent 모드 적용

### **Phase 4: 문서화 및 성능 평가 (003-05~06)**
- 003-05: Cline 머징 고려 개발가이드 문서화
- 003-06: 성능평가 및 개선사항 보고서 생성

---

**🚨 중요**: 다음 세션에서는 반드시 이 가이드를 먼저 읽고 003-02부터 시작할 것!

**🎯 목표**: 검증 시스템 기반으로 안전하고 확실한 점진적 개선을 달성하자! ✨

## 📋 **다음 세션 시작 순서**

**🚀 즉시 003-02 구현 시작**
- ✅ 모든 문서 준비 완료 - 문서 작성 단계 생략
- ✅ 003-01 검증 시스템 완성 - 기반 인프라 준비 완료
- 바로 `caret-src/core/prompts/CaretSystemPrompt.ts` 구현 시작
- TDD 방식으로 안전하게 진행
- ClineFeatureValidator와 연동하여 래퍼 검증 시스템 구축

**구현 순서**:
1. **SystemPromptContext 타입** (`types.ts`) - 30분
2. **CaretSystemPrompt 클래스** (`CaretSystemPrompt.ts`) - 2시간  
3. **테스트 작성** (`caret-system-prompt.test.ts`) - 1시간
4. **검증 및 문서화** - 30분

**다음 단계 준비**:
- 003-02 완료 후 즉시 003-03 진행 가능
- next-session-guide.md 지속 업데이트 