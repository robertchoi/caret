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


### **현재 상태**
- **문서**: 모든 003 시리즈 문서 완성 (003-01~07)
- **코드**: 3479bb0 커밋으로 하드 리셋 완료 (깨끗한 상태)
- **검증**: 🚀 **003-01에서 즉시 시작 가능**

### **🔍 중요한 발견**
- **caret-zero JSON 시스템 존재**: 15개+ JSON 섹션 파일 이미 구축됨
- **003-05 재설계 필요성**: 단순 Plan/Act 합치기 → caret-zero 통합 + Cline 보완
- **작업 범위 확대**: 4-6시간 예상, 필요시 003-05A/B 분할 고려

### **검증 결과**
- 아직 구현 단계 아님 (계획 수립 완료)

## 🚨 **중요한 결정사항**

### **설계 결정**
1. **검증 시스템 최우선**: 003-01~02에서 검증 시스템부터 구축
2. **Cline 원본 100% 보존**: 파싱/재구성 절대 금지
3. **JSON 오버레이 방식**: 원본 + 추가/수정만
4. **Agent 모드 통합**: Plan/Act 제약 해제, 협력적 지능 구현

### **제약사항**
- **기능 누락 절대 금지**: 모든 Cline 기능 100% 보존 필수
- **검증 없는 변경 금지**: 모든 변경은 검증 시스템 통과 필수
- **복잡한 추상화 금지**: 단순하고 이해하기 쉬운 구조 유지

### **주의사항**
- JSON 프롬프트 작성 시 기능 보존이 최우선
- 토큰 최적화는 기능 보존 후 진행
- 각 단계마다 회귀 테스트 필수

## 🚀 **다음 세션 즉시 시작**

### **다음 태스크: 003-01 Cline 기능 검증 시스템 구현**
- **상태**: ✅ **문서 완성** - 즉시 구현 시작 가능
- **목표**: 모든 Cline 기능 보존 확인 자동화 시스템
- **예상 시간**: 3-4시간
- **핵심 작업**: 
  - SYSTEM_PROMPT 함수 완전 분석
  - 모든 도구와 기능 목록화
  - 자동 검증 시스템 구현
  - 기능 누락 감지 메커니즘

### **구현할 파일들**
- `caret-src/core/verification/ClineFeatureValidator.ts` (새로 생성)
- `caret-src/core/verification/types.ts` (새로 생성)
- `caret-src/__tests__/cline-feature-validation.test.ts` (새로 생성)
- `caret-docs/tasks/003-01-analysis-report.md` (분석 결과 문서)

### **✅ 완료된 준비 작업**
**모든 문서 작성 완료**:
- ✅ `caret-docs/tasks/003-01-cline-feature-validation.md` - 검증 시스템 구현
- ✅ `caret-docs/tasks/003-02-progressive-replacement-verification.md` - 점진적 교체 검증
- ✅ `caret-docs/tasks/003-03-cline-wrapper-implementation.md` - Cline 래퍼 구현
- ✅ `caret-docs/tasks/003-04-json-overlay-system.md` - JSON 오버레이 시스템
- ✅ `caret-docs/tasks/003-05-agent-mode-implementation.md` - Agent 모드 (caret-zero 통합)
- ✅ `caret-docs/tasks/003-06-cline-merge-guide-documentation.md` - 머징 가이드
- ✅ `caret-docs/tasks/003-07-performance-evaluation-report.md` - 성능 평가

### **검증 방법**
- 모든 Cline 도구 감지 확인 (web_fetch 포함)
- 상세 도구 설명 보존 확인
- MCP 서버 통합 기능 확인
- Claude4 모델별 분기 확인

## 💡 **개발자를 위한 메모**

### **설계 의도**
- **이전 실패 교훈**: 파싱/재구성 방식은 정보 손실 발생
- **검증 우선 접근**: 안전한 변경을 위해 검증 시스템부터 구축
- **점진적 개선**: 한 번에 모든 것을 바꾸지 않고 단계별 접근

### **대안 검토**
- ❌ **전체 대체**: 리스크 너무 큼, 정보 손실 발생
- ❌ **파싱/재구성**: 복잡하고 기능 누락 위험
- ✅ **오버레이 방식**: 원본 보존 + 필요한 부분만 수정

### **향후 개선점**
- JSON 템플릿 동적 로딩 시스템
- Workflow Rule 기반 동적 행동 패턴
- 모델별 최적화 템플릿
- 실시간 프롬프트 편집 UI

## 🎯 **003 시리즈 전체 로드맵**

### **Phase 1: 검증 시스템 (003-01~02)**
- 003-01: Cline 기능 검증 시스템 구현
- 003-02: 점진적 교체 검증 프레임워크

### **Phase 2: 기반 구조 (003-03~04)**  
- 003-03: Cline 원본 래퍼 구현
- 003-04: JSON 오버레이 시스템 구현

### **Phase 3: Agent 모드 (003-05)**
- 003-05: Plan/Act 제거 및 Agent 모드 적용

### **Phase 4: 문서화 및 성능 평가 (003-06~07)**
- 003-06: Cline 머징 고려 개발가이드 문서화
- 003-07: 성능평가 및 개선사항 보고서 생성

---

**🚨 중요**: 다음 세션에서는 반드시 이 가이드를 먼저 읽고 003-01부터 시작할 것!

**🎯 목표**: 검증 시스템부터 구축하여 안전하고 확실한 개선을 달성하자! ✨

## 📋 **다음 세션 시작 순서**

**🚀 즉시 003-01 구현 시작**
- ✅ 모든 문서 준비 완료 - 문서 작성 단계 생략
- 바로 `caret-src/core/verification/ClineFeatureValidator.ts` 구현 시작
- TDD 방식으로 안전하게 진행
- 모든 Cline 기능 100% 보존 확인

**구현 순서**:
1. **타입 정의** (`types.ts`) - 15분
2. **기본 검증 로직** (`ClineFeatureValidator.ts`) - 1.5시간  
3. **테스트 작성** (`cline-feature-validation.test.ts`) - 1시간
4. **검증 및 문서화** (`003-01-analysis-report.md`) - 30분

**다음 단계 준비**:
- 003-01 완료 후 즉시 003-02 진행 가능
- next-session-guide.md 지속 업데이트 