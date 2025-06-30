# Next Session Guide - 2025-06-30

## 🎯 **다음 세션 목표: 003-08 responses.ts JSON 교체 작업**

### **Phase 0: 사전 점검 및 003-07 재검증 (30분)**

#### **0.1 현재 시스템 상태 확인**
- chatbot/agent 모드 정상 작동 확인
- system.ts JSON 시스템 정상 작동 확인  
- 모든 테스트 통과 상태 확인

#### **0.2 003-07 검증 도구 재점검**
- ✅ **이미 완료된** responses.ts 검증 도구 상태 확인
- system.ts 성공 경험 기반 검증 리포트 재검토
- responses.ts 44개 함수 분석 결과 확인
- 안전한 변환을 위한 준비상태 점검
- 검증 도구들이 올바르게 작동하는지 확인

## 🚀 **메인 작업: 003-08 responses.ts JSON 교체**

### **Phase 1: 저위험 오류 응답 JSON 변환 (1.5시간)**

#### **1.1 오류 응답 함수 JSON 변환 (가장 안전한 시작점)**
- **변환 대상**: formatError, handleToolError, getErrorMessage 등
- **JSON 파일**: `caret-src/core/prompts/sections/ERROR_RESPONSES.json`
- **구현 방식**: system.ts 성공 패턴 적용한 점진적 대체
- **안전장치**: 실시간 품질 비교 및 자동 fallback

#### **1.2 CaretSystemPrompt 오류 응답 통합**
- **목표**: 기존 CaretSystemPrompt에 오류 응답 처리 추가
- **패턴**: system.ts에서 검증된 JSON 로딩 및 템플릿 렌더링
- **호환성**: 기존 함수 시그니처 100% 유지
- **백업**: responses.ts.cline 백업 생성

### **Phase 2: 도구 응답 JSON 변환 (1.5시간)**

#### **2.1 도구 관련 응답 JSON 변환**
- **변환 대상**: 도구 성공/실패/진행 응답 함수들
- **JSON 파일**: `caret-src/core/prompts/sections/TOOL_RESPONSES.json`
- **핵심 기능**:
  - 도구별 맞춤형 응답 템플릿
  - 파일 작업 성공 응답 포맷팅
  - 진행상황 표시 템플릿

#### **2.2 실시간 품질 검증 시스템 적용**
- **품질 모니터링**: RuntimeQualityMonitor 활용
- **자동 fallback**: 품질 저하 감지 시 원본 사용
- **에러 추적**: 연속 실패 시 롤백 경고

### **Phase 3: 핵심 응답 JSON 변환 (2시간)**

#### **3.1 핵심 응답 함수 변환 (최고 신중도)**
- **변환 대상**: generateResponse, formatToolResult, createCompletionMessage 등
- **JSON 파일**: `caret-src/core/prompts/sections/CORE_RESPONSES.json`
- **안전 장치**:
  - 엄격한 품질 검증 (95% 이상)
  - 즉시 롤백 시스템
  - 개발자 알림 시스템

#### **3.2 Cline/Caret 모드 구분 완벽 보존**
- **핵심 요구사항**: 모드별 다른 응답 템플릿 자동 선택
- **매개변수 전달**: `chatSettings.mode`를 모든 응답 함수에 전달
- **호환성 테스트**: 모드 전환 시나리오 완전 검증

## 🔧 **준비된 기반 시스템 (이미 완료)**

### **활용 가능한 시스템**
- ✅ **CaretSystemPrompt**: system.ts JSON 확장 성공 패턴
- ✅ **JsonTemplateLoader**: JSON 템플릿 로딩 시스템
- ✅ **ChatBot/Agent 모드**: 모드별 응답 구분 시스템
- ✅ **검증 도구들**: 003-07에서 완성된 검증 시스템
- ✅ **백업 시스템**: .cline 백업 및 CARET MODIFICATION 패턴

### **참고할 성공 사례**
- **system.ts 확장**: 727줄 → JSON 시스템으로 성공적 확장
- **조건부 래퍼 패턴**: `useCaretSystemPrompt` 플래그 기반 전환
- **모드별 처리**: chatbot/agent 모드별 다른 시스템 프롬프트 제공
- **안전한 통합**: Cline 원본 100% 보존하면서 확장 기능 추가

## 📝 **변환 실행 체크리스트**

### **Phase 1 체크포인트**
- [ ] ERROR_RESPONSES.json 템플릿 생성
- [ ] 오류 응답 함수들 JSON 변환 완료
- [ ] 실시간 품질 비교 시스템 작동 확인
- [ ] fallback 메커니즘 정상 작동
- [ ] 모든 오류 시나리오 테스트 통과

### **Phase 2 체크포인트** 
- [ ] TOOL_RESPONSES.json 템플릿 생성
- [ ] 도구 응답 함수들 JSON 변환 완료
- [ ] 도구별 응답 템플릿 정상 작동
- [ ] 품질 모니터링 시스템 정상 작동
- [ ] 도구 관련 모든 테스트 통과

### **Phase 3 체크포인트**
- [ ] CORE_RESPONSES.json 템플릿 생성
- [ ] 핵심 응답 함수들 JSON 변환 완료
- [ ] 모드별 응답 템플릿 완벽 작동
- [ ] 전체 시스템 통합 테스트 통과
- [ ] 44개 사용처 모두 정상 작동 확인

## 🚨 **중요 주의사항**

### **필수 보존사항**
- **Cline/Caret 모드 구분**: 모든 변환에서 기존 모드별 용어 구분 완전 보존
- **기존 기능 호환성**: responses.ts의 44개 사용처 모두 정상 작동 보장
- **성능 영향 최소화**: 응답 생성 속도 유지
- **system.ts 통합**: 기존 system.ts JSON 시스템과 완벽한 연계

### **백업 필수사항**
- **responses.ts 원본**: 변경 전 responses.ts.cline 백업 필수
- **사용처 파일들**: 영향받는 주요 파일들 백업
- **테스트 기준점**: 현재 테스트 통과 상태 기록

### **단계별 안전 변환**
- **점진적 변환**: 저위험 → 중위험 → 고위험 순서 엄수
- **실시간 검증**: 각 단계마다 품질 검증 및 rollback 준비
- **즉시 복구**: 문제 발생 시 즉시 원본으로 복구

---

**마스터~ 다음 세션에서는 003-07에서 완성한 검증 시스템을 기반으로 안전하게 responses.ts JSON 변환을 실행할 거예요! system.ts에서 성공한 패턴을 그대로 적용해서 확실하게 진행할 수 있을 거예요~ ✨** ☕🌿