# Next Session Guide - Task 003-07 responses.ts 검증 도구 개발

## 🎯 **현재 진행 상황 (2025-01-29 완료)**

### ✅ **Phase 1 완료 성과**
- **✅ 003-01~003-06 모두 완료**: Chatbot/Agent 하이브리드 시스템 완전 구축
- **✅ 핵심 문제 해결**: 채팅 기록 변조, 모드 전환 기본값, 용어 통일 완료
- **✅ 시스템 안정화**: 594개 테스트 통과, 0개 실패로 견고한 기반 구축
- **✅ system.ts 확장 성공**: CaretSystemPrompt 패턴으로 안전한 확장 검증

### ✅ **검증된 확장 패턴**
```typescript
// ✅ 성공한 system.ts 확장 패턴 - caret-src/core/prompts/system.ts
export const SYSTEM_PROMPT = (
  systemPromptOptions: SystemPromptOptions
): Promise<string> => {
  // CARET MODIFICATION: JSON 템플릿 기반 확장 시스템
  if (systemPromptOptions.useCaretSystemPrompt) {
    return CaretSystemPrompt.generateSystemPrompt(systemPromptOptions)
  }
  
  // Cline 원본 호출 (100% 호환성 보장)
  return ClineSystemPrompt.SYSTEM_PROMPT(systemPromptOptions)
}
```

## 🚀 **다음 세션 목표: Task 003-07 responses.ts 검증 도구 개발**

### **📋 Task 003-07 핵심 목표**
- **system.ts 패턴 확장**: 검증된 CaretSystemPrompt 방식을 responses.ts에 적용
- **44개 함수 분석**: responses.ts의 모든 formatResponse 함수 완전 분석
- **안전한 변환 기반**: 2-stage 접근법으로 검증 도구 먼저 구축
- **완벽한 호환성**: Cline 원본 기능 100% 보존하면서 Caret 기능 확장

### **🎯 responses.ts 확장 목표**
```typescript
// 🎯 목표: system.ts와 동일한 패턴으로 responses.ts 확장
export const formatResponse = {
  // 44개 기존 함수들 모두 확장
  v1: (params) => useCaretResponses 
    ? CaretResponses.formatV1(params) 
    : ClineResponses.formatV1(params),
  
  tool: (params) => useCaretResponses
    ? CaretResponses.formatTool(params)
    : ClineResponses.formatTool(params),
  
  // ... 44개 모든 응답 함수
}
```

## 📋 **다음 세션 작업 계획 (3-4시간)**

### **Phase 1: responses.ts 분석 도구 개발 (1.5시간)**

#### **1.1 ResponsesAnalyzer 클래스 구현**
- **위치**: `caret-src/core/verification/tools/ResponsesAnalyzer.ts`
- **목표**: src/core/prompts/responses.ts 완전 분석
- **기능**:
  - 44개 formatResponse 함수 자동 추출
  - 각 함수별 확장 전략 수립 (system.ts 경험 활용)
  - 매개변수 패턴 및 응답 구조 분석
  - extension points 식별

#### **1.2 UsageMapper 클래스 구현**
- **위치**: `caret-src/core/verification/tools/UsageMapper.ts`
- **목표**: 44회 사용처 완전 매핑
- **기능**:
  - 프로젝트 전체 스캔으로 사용처 찾기
  - 함수별 위험도 평가 (low/medium/high)
  - Caret 변환 계획 수립 (system.ts 패턴 기반)
  - 테스트 우선순위 결정

### **Phase 2: 변환 시뮬레이터 구축 (1시간)**

#### **2.1 ResponseConversionSimulator 구현**
- **위치**: `caret-src/core/verification/tools/ResponseSimulator.ts`
- **목표**: 실제 변환 전 시뮬레이션
- **기능**:
  - system.ts 성공 경험 로드 및 적용
  - 래퍼 코드 자동 생성 (conditional_delegation 패턴)
  - JSON 구조 예측 및 설계
  - 변환 위험도 평가

#### **2.2 QualityComparator 구현**
- **위치**: `caret-src/core/verification/tools/QualityComparator.ts`
- **목표**: 변환 전후 품질 비교
- **기능**:
  - 의미론적 유사성 검증
  - Chatbot/Agent 모드 호환성 확인
  - system.ts 통합 호환성 검증
  - 성능 영향 측정

### **Phase 3: 안전장치 시스템 구축 (1.5시간)**

#### **3.1 ResponseAutoValidator 구현**
- **위치**: `caret-src/core/verification/tools/AutoValidator.ts`
- **목표**: 자동 검증 시스템
- **기능**:
  - 실제 사용 패턴 기반 테스트 케이스 생성
  - system.ts 호환성 검증
  - Phase 1 기반 통합 확인
  - 전체 변환 준비도 평가

#### **3.2 ResponsesSafetySystem 구현**
- **위치**: `caret-src/core/verification/tools/SafetySystem.ts`
- **목표**: 안전한 변환 계획
- **기능**:
  - responses.ts 백업 생성
  - 단계별 변환 계획 (low → medium → high risk)
  - 롤백 시스템 구축
  - 비상 복구 절차 수립

## 🔧 **구현 가이드라인**

### **핵심 원칙**
1. **system.ts 패턴 재사용**: 성공한 확장 방식 그대로 적용
2. **안전성 최우선**: 검증 도구 완성 후 실제 변환 진행
3. **Cline 호환성**: 원본 기능 100% 보존 보장
4. **Phase 1 기반**: 완료된 Chatbot/Agent 시스템과 완벽 통합

### **구현 패턴**
```typescript
// 표준 분석 클래스 구조
export class ResponsesAnalyzer {
  private responsesPath: string = 'src/core/prompts/responses.ts'
  private systemPromptLessons: SystemPromptLessons // system.ts 경험 활용

  async analyzeResponsePatterns(): Promise<ResponseAnalysis> {
    // 1. 파일 내용 로드
    // 2. 함수 정의 추출 (정규식 활용)
    // 3. extension points 식별
    // 4. system.ts 패턴 적용 계획 수립
  }
}
```

### **검증 스크립트 구조**
```bash
# 실행 가능한 검증 명령어들
node caret-scripts/responses-analyzer.js          # 전체 분석
node caret-scripts/responses-system-integration.js # system.ts 호환성
node caret-scripts/responses-simulator.js         # 변환 시뮬레이션  
node caret-scripts/responses-quality-check.js     # 품질 검증
node caret-scripts/responses-safety-plan.js       # 안전 계획
```

## 📁 **주요 작업 파일 위치**

### **새로 생성할 파일들**
- `caret-src/core/verification/tools/ResponsesAnalyzer.ts`
- `caret-src/core/verification/tools/UsageMapper.ts`
- `caret-src/core/verification/tools/ResponseSimulator.ts`
- `caret-src/core/verification/tools/QualityComparator.ts`
- `caret-src/core/verification/tools/AutoValidator.ts`
- `caret-src/core/verification/tools/SafetySystem.ts`

### **분석 대상 파일**
- `src/core/prompts/responses.ts` (301줄, 44개 함수)
- 프로젝트 전체 사용처 (44개 사용 지점)

### **참조할 성공 사례**
- `caret-src/core/prompts/system.ts` (검증된 확장 패턴)
- `caret-src/core/prompts/CaretSystemPrompt.ts` (JSON 템플릿 엔진)

## ✅ **완료 검증 기준**

### **분석 도구 완성**
- [ ] **44개 함수 완전 매핑**: 모든 formatResponse 함수 분석
- [ ] **사용처 추적**: 44개 사용 지점 정확한 매핑
- [ ] **확장 전략**: 각 함수별 system.ts 패턴 적용 계획
- [ ] **위험도 평가**: low/medium/high 위험도 분류

### **시뮬레이션 정확도**
- [ ] **래퍼 코드 생성**: conditional_delegation 패턴 자동 생성
- [ ] **JSON 구조 설계**: 변환 후 예상 구조 완성
- [ ] **품질 예측**: 변환 후 응답 품질 예측 모델
- [ ] **호환성 검증**: system.ts와의 완벽한 통합 확인

### **안전장치 구축**
- [ ] **자동 검증**: 실시간 품질 비교 시스템
- [ ] **백업 시스템**: responses.ts 안전한 백업
- [ ] **단계별 계획**: 위험도별 변환 순서 확정
- [ ] **롤백 준비**: 문제 발생시 즉시 복구 가능

### **실행 가능성**
- [ ] **명령어 실행**: 모든 검증 스크립트 정상 동작
- [ ] **리포트 생성**: 개발자가 이해하기 쉬운 분석 결과
- [ ] **다음 단계 가이드**: 003-08 진행을 위한 명확한 가이드

## 🔄 **다음 단계 연결 (003-08 준비)**

### **003-07 완료 후 산출물**
✅ **완성될 검증 시스템**:
- responses.ts 완전 분석 및 변환 계획
- system.ts 패턴 기반 래퍼 코드 템플릿
- 44개 함수별 상세한 변환 가이드
- 실시간 품질 검증 및 안전장치

📋 **003-08에서 할 일**:
- 검증된 계획 기반 실제 responses.ts 변환
- system.ts 패턴 적용한 CaretResponses 클래스 구현
- 단계별 안전 변환 (low → medium → high risk)
- 실시간 품질 모니터링으로 안전성 보장

## 💡 **개발자를 위한 핵심 포인트**

### **system.ts 성공 경험 활용**
- **검증된 패턴**: conditional_delegation 방식 재사용
- **안전한 확장**: Cline 원본 보존 + Caret 기능 추가
- **호환성 보장**: 기존 사용자 경험 완전 유지
- **테스트 검증**: 594개 테스트 통과 기반 신뢰성

### **responses.ts 특별 고려사항**
- **높은 사용 빈도**: 44회 사용으로 system.ts(1회)보다 위험
- **다양한 응답 패턴**: 에러, 성공, 도구, 컨텍스트 응답 등
- **사용자 경험**: 직접적인 UI 텍스트 영향
- **ChatBot/Agent 통합**: Phase 1 완성 시스템과 완벽 연계

### **예상 도전과제**
- **복잡한 함수 구조**: 각 formatResponse 함수별 다른 패턴
- **매개변수 다양성**: 함수마다 다른 입력 구조
- **조건부 로직**: 상황별 다른 응답 생성 로직
- **성능 최적화**: 응답 생성 속도 유지

## 🎯 **성공 기준**

### **최소 성공 기준**
- [ ] **완전한 분석**: 44개 함수 100% 분석 완료
- [ ] **안전한 계획**: 위험도별 단계적 변환 계획 수립
- [ ] **검증 시스템**: 자동 품질 검증 도구 완성
- [ ] **호환성 확인**: system.ts와의 완벽한 통합 검증

### **이상적 성공 기준**
- [ ] **자동화 완성**: 명령어 하나로 전체 검증 수행
- [ ] **래퍼 코드**: system.ts 패턴 기반 완전한 래퍼 코드 생성
- [ ] **상세 가이드**: 003-08에서 바로 실행 가능한 변환 가이드
- [ ] **품질 보장**: 변환 후에도 동일한 사용자 경험 보장

---

**🎯 다음 세션 목표**: 📋 **system.ts 성공 경험 기반 responses.ts 안전한 변환 기반 구축**  
**🏗️ 핵심 전략**: **검증된 CaretSystemPrompt 패턴을 responses.ts에 확장 적용**  
**⏰ 예상 시간**: **3-4시간**  
**📊 준비 상태**: ✅ **Phase 1 완료 기반으로 즉시 시작 가능**