# 다음 세션 가이드 - Luke 작업 로그

## 🎯 다음 작업: Mission 2 - 모드 설정 동기화 문제 해결

### **문제 정의**
- **Caret 모드 선택 시**: UI는 변경되지만 AI는 Agent 기본값을 제대로 인지하지 못함
- **Cline 모드 선택 시**: UI는 변경되지만 AI는 Plan 기본값을 제대로 인지하지 못함

### **해결 전략**
1. **Caret 개발가이드 분석**: 메시지 전송/저장 방식 이해
2. **코드 분석**: 프론트엔드-백엔드 메시지 흐름 파악
3. **구조변경 없는 로깅**: Caret 로그 시스템 활용
4. **테스트 기반 검증**: 단위테스트 + 통합테스트로 분석 검증
5. **대응 방안 도출**: 실제 문제 원인 파악 후 해결책 제시

---

## 📋 다음 세션 실행 계획

### **Phase 1: 분석 준비**
- [ ] Caret 개발가이드 확인 (메시지 전송/저장 패턴)
- [ ] 관련 코드 구조 분석 (CaretProvider, ExtensionStateContext)
- [ ] 현재 모드 설정 흐름 파악

### **Phase 2: 로깅 및 테스트**
- [ ] Caret 로깅 시스템 활용한 디버깅 포인트 추가
- [ ] 단위테스트 작성 (모드 설정 로직)
- [ ] 통합테스트 작성 (프론트-백엔드 관통)

### **Phase 3: 문제 분석 및 해결**
- [ ] 테스트 결과 기반 문제점 식별
- [ ] 분석 결과 보고서 작성
- [ ] 대응 방안 제시 및 구현

---

## 🔍 기술적 접근

### **분석 대상 영역**
- **프론트엔드**: `webview-ui/src/context/ExtensionStateContext.tsx`
- **백엔드**: `caret-src/core/webview/CaretProvider.ts`
- **메시지 흐름**: postMessage → handleMessage 패턴
- **설정 저장**: workspaceState vs globalState 패턴

### **예상 문제 영역**
- 모드 변경 메시지 전달 누락
- 설정 저장/로드 불일치
- AI 프롬프트 업데이트 타이밍 문제
- 상태 동기화 지연

### **성공 기준**
- [ ] 메시지 흐름 완전 이해
- [ ] 문제 발생 지점 정확 식별
- [ ] 재현 가능한 테스트 케이스 작성
- [ ] 근본 원인 파악
- [ ] 구조 변경 없는 최소 수정으로 해결

### **⚠️ 중요: 파일명/함수명 변경 필요**
**인터페이스 모드 설정 관련 작업 시 주의사항:**
- 현재 "인터페이스 모드"라는 용어를 더 적절한 명칭으로 변경
- 관련 파일명과 함수명도 의미에 맞게 리네이밍
- 사용자 친화적인 설명으로 업데이트

---

## 📚 참조할 문서들
- `caret-docs/development/caret-architecture-and-implementation-guide.mdx`
- `caret-docs/development/frontend-backend-interaction-patterns.mdx`
- `caret-docs/development/testing-guide.mdx`
- `caret-docs/development/logging.mdx`

---

**작업 우선순위**: Mission 2 모드 설정 동기화 완료  
**목표**: 사용자가 선택한 모드와 AI가 인지하는 모드 완전 일치