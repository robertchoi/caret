# 작업 상태 관리
 * 진행 중, 대기중인 작업를 관리한다.

## 진행 중인 작업 (Working)
### luke (담당자)
- **Task #003:** System Prompt JSON 템플릿 시스템 구현 (담당자: luke)
  - 요약: Cline 하드코딩 시스템 프롬프트를 JSON 기반으로 개선, Plan/Act → Agent 모드 통합
  - 상태: 🚀 **003-01 시작 준비 완료** - 다음 세션에서 즉시 시작
  - Phase 1 (검증): 003-01~02 | Phase 2 (기반): 003-03~04 | Phase 3 (Agent): 003-05 | Phase 4 (문서화): 003-06~07
  - 🔍 **중요 발견**: caret-zero에 JSON 시스템 이미 구축됨 → 003-05 Agent 모드 재설계 완료
  - 📋 **하위 작업 상태**: 
    - 003-01 (Cline 기능 검증): ✅ 문서 완성, 🚀 즉시 시작 가능
    - 003-02~07: ✅ 문서 완성, 📋 준비 완료
  [003-system-prompt-restoration.md](./003-system-prompt-restoration.md) 

- **Task #012:** 테스트 커버리지 정상화 (일시 중단)
  - 요약: 테스트 실패 분석 및 임시 해결책 적용, 일부 테스트 파일의 실패 테스트 skip 처리
  [012-01-test-coverage-normalization.md](./012-01-test-coverage-normalization.md)


### justin (담당자)

## 대기 중인 작업 (Pending)

- **Task #004:** MDX 문서 시스템 구축 및 통합 (담당자: TBD)
  - 요약: 문서화 시스템 구축 및 통합
  [004-01-plan-mdx-documentation-system.md](./004-01-plan-mdx-documentation-system.md) 
- **Task #005:** 업스트림 머징 전략 검증 및 안정화 (담당자: TBD)
  - 요약: Cline 업스트림 머징 프로세스 개선
  [005-01-plan-upstream-merge-strategy-validation.md](./005-01-plan-upstream-merge-strategy-validation.md)
- **Task #006:** 모델 커스텀 API JSON 검토 (담당자: TBD)
  - 요약: API 모델 설정 검토 및 개선
  [006-01-plan-model-custom-api-json-review.md](./006-01-plan-model-custom-api-json-review.md)
- **Task #007:** 서비스 및 회사 홈페이지 연동 (담당자: luke)
  - 요약: caret.team 서비스 및 caretive.ai 홈페이지 연동
  [007-01-plan-service-homepage-integration.md](./007-01-plan-service-homepage-integration.md)
- **Task #008:** 신규 개발자 온보딩 가이드 개선 (담당자: luke)
  - 요약: 신규 개발자가 태스크 할당 후 즉시 작업 가능하도록 종합 온보딩 가이드 구축
  [008-01-plan-new-developer-onboarding-guide.md](./008-01-plan-new-developer-onboarding-guide.md)
- **Task #009:** API 프로바이더 구조 개선 (담당자: TBD)
  - 요약: i18n 적용과 JSON 관리 체계화를 통한 API 프로바이더 구조 개선
  [009-01-plan-api-provider-structure-improvement.md](./009-01-plan-api-provider-structure-improvement.md)

## 완료된 작업번호:담당자 (Complete)
- **Task #001:luke** 캐럿 아키텍처 초기화 및 설정 (코드 중심)
  - 요약: VSCode Extension 기본 구조 및 빌드 시스템 구축  
  [001-01-plan-caret-architect-initialize.md](./completed/001-01-plan-caret-architect-initialize.md) 
- **Task #011:luke** 디버그 호스트 UI 버튼 동작 불능 문제 해결 
  [011-01-plan-debug-host-duplication.md](./completed/011-01-plan-debug-host-duplication.md)
- **Task #002:luke** 페르소나 기능 복원 
  - 요약: AI 페르소나 시스템 복구 및 개선
  [002-01-plan-persona-feature-restoration.md](./completed/002-01-plan-persona-feature-restoration.md) 

