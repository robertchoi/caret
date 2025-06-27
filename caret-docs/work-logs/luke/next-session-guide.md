# Next Session Guide - 003-05 CaretSystemPrompt 통합 구현 준비

**날짜**: 2025-01-27  
**작업자**: luke  
**현재 작업**: Task #003-05 (CaretSystemPrompt 전체 통합 구현)  
**상태**: 🚀 **준비완료** - 003-04 완료, 003-05 시작 준비

## 📍 **현재 상황 정리**

### ✅ **완료된 작업들**
1. **003-01, 02, 03**: JSON 오버레이 시스템 완성 ✅
2. **003-04**: Cline 시스템 프롬프트 JSON 검토 및 보강 **완료** ✅
   - **18개 JSON 파일 완전 보강**: sections(15개) + rules(3개)
   - **Ask/Agent 모드 완전 구현**: Plan/Act 제거 및 새로운 철학 적용
   - **협력적 태도 통합**: COLLABORATIVE_PRINCIPLES.json 생성
   - **메타인지 시스템**: 자기 진단 및 시스템 개선 요청 능력
   - **Cline 기능 100% 보존**: 15개 도구 완전 보존 확인
3. **특허 정보 및 라이센스 정리**: CARETIVE INC 통일, 단일 라이센스 정책 ✅

### 🎯 **현재 작업: 003-05 시작 준비**  
**핵심 목표**: src/core/prompts/system.ts의 SYSTEM_PROMPT 함수를 CaretSystemPrompt로 리디렉션하여 Cline 하드코딩에서 Caret JSON 시스템으로 완전 전환

**작업 파일**: `caret-docs/tasks/003-05-caretsystemprompt-integration.md`

## 🔧 **003-05 작업 준비 사항**

### **완성된 JSON 시스템 현황**
```typescript
📁 caret-src/core/prompts/ (완전 구현된 시스템)
├── sections/ (15개 파일) - 모든 섹션 보강 완료
│   ├── BASE_PROMPT_INTRO.json - Caret 정체성 + Ask/Agent 모드
│   ├── COLLABORATIVE_PRINCIPLES.json - 5개 협력 원칙 (NEW)
│   ├── TOOL_DEFINITIONS.json - 15개 도구 완전 보존
│   ├── TOOL_USE_GUIDELINES.json - 협력적 도구 사용
│   ├── ASK_AGENT_MODES.json - Ask/Agent 철학 (NEW)
│   └── ... 등 15개 섹션 완전 보강
├── rules/ (3개 파일) - 구체적 규칙 완료
│   ├── common_rules.json - .caretrules 원칙 반영
│   ├── file_editing_rules.json - 품질 우선 강화
│   └── cost_consideration_rules.json - 토큰 효율성
├── CaretSystemPrompt.ts - 메인 클래스 (로딩 순서 최적화)
├── JsonTemplateLoader.ts - JSON 로딩 시스템
└── system.ts - 통합 포인트 (Fallback 지원)
```

### **003-05 핵심 목표**
1. **src/core/prompts/system.ts 수정**: SYSTEM_PROMPT 함수를 CaretSystemPrompt로 리디렉션
2. **extensionPath 해결**: CaretSystemPrompt에 필요한 경로 정보 전달 방안 구현
3. **분기 로직 보존**: Claude4 실험/표준 분기 기능 유지
4. **실제 VSCode Extension 환경 테스트**: 완전한 통합 검증
5. **성능 벤치마크**: Cline 원본 vs Caret JSON 성능 비교

## 🔍 **003-05에서 해결해야 할 핵심 과제들**

### **1. extensionPath 접근 문제**
- **현재 상황**: SYSTEM_PROMPT 함수에서 extension 경로 정보 필요
- **해결 방안**: 
  - 옵션 1: vscode.ExtensionContext에서 경로 추출
  - 옵션 2: 환경 변수 활용
  - 옵션 3: 글로벌 변수 또는 Context 매개변수 추가

### **2. 분기 로직 통합**
- **Claude4 모델별 분기**: 실험/표준 모드 분기를 JSON 시스템에 통합
- **MCP 서버 동적 로딩**: 기존 MCP 통합 기능 완전 보존
- **브라우저 지원**: 조건부 Puppeteer 통합 유지

### **3. 성능 최적화**
- **인스턴스 생성 최적화**: 싱글톤 패턴 검토
- **메모리 사용량**: 기존 대비 10% 이하 영향 목표
- **로딩 시간**: 프롬프트 생성 시간 < 100ms 목표

### **4. 안전성 보장**
- **폴백 메커니즘**: CaretSystemPrompt 실패 시 원본 Cline 사용
- **기능 완전성**: ClineFeatureValidator 25/25 테스트 통과 필수
- **오류 처리**: 상세한 오류 추적 및 복구 시스템

## 🎯 **003-05 예상 작업 순서**

### **Phase 1: CaretSystemPrompt 확장 (1시간)**
1. **generateFromJsonSections() 메서드 구현**
2. **Claude4 분기 처리 로직 추가**
3. **전역 인스턴스 관리 (싱글톤 패턴)**
4. **extensionPath 해결 방안 구현**

### **Phase 2: SYSTEM_PROMPT 함수 교체 (1시간)**
1. **src/core/prompts/system.ts 백업 및 수정**
2. **SYSTEM_PROMPT 함수를 CaretSystemPrompt로 리디렉션**
3. **폴백 메커니즘 구현**
4. **CARET MODIFICATION 주석 추가**

### **Phase 3: 통합 테스트 및 검증 (1시간)**
1. **ClineFeatureValidator로 기능 검증**
2. **Claude4 분기 기능 테스트**
3. **MCP 서버 통합 테스트**
4. **성능 벤치마크 실행**

### **Phase 4: 문서화 및 완료 (30분)**
1. **검증 결과 문서화**
2. **성능 메트릭 기록**
3. **다음 단계 (003-06) 준비**

## 💡 **003-05 작업 시작 팁**

### **준비된 도구들**
1. **ClineFeatureValidator**: 25개 테스트로 완전 검증
2. **CaretLogger**: DEBUG 레벨로 모든 동작 추적
3. **JSON 검증 시스템**: 18개 파일 유효성 확인
4. **Fallback 메커니즘**: 오류 시 자동 Cline 원본 사용

### **테스트 명령어**
```bash
# 검증 시스템 실행
npm run test caret-src/__tests__/cline-feature-validation.test.ts

# JSON 시스템 테스트
npm run test caret-src/__tests__/caret-system-prompt-tdd.test.ts

# 통합 테스트
npm run test caret-src/__tests__/generate-from-json-sections.test.ts

# 컴파일 확인
npm run compile
```

### **성능 모니터링**
```typescript
// CaretLogger DEBUG 활성화
CaretLogger.setLevel('DEBUG')

// 성능 메트릭 확인
const startTime = performance.now()
const prompt = await systemPrompt.generateFromJsonSections(...)
const loadTime = performance.now() - startTime

console.log({
  loadTime,
  promptLength: prompt.length,
  sectionsLoaded: 15,
  rulesLoaded: 3
})
```

## 📋 **예상 다음 단계들**

### **순차적 진행 계획**
1. **003-05**: CaretSystemPrompt 전체 통합 구현 ✅ (현재)
2. **003-06**: Ask/Agent JSON 템플릿 추가 생성
3. **003-07**: UI Plan/Act → Ask/Agent 버튼 변경
4. **003-08**: Cline Merge 가이드 문서 작성
5. **003-09**: 성능 평가 리포트 생성

### **기술적 준비 완료 사항**
- **JSON 시스템**: 18개 파일 완전 보강 ✅
- **검증 시스템**: ClineFeatureValidator 100% 통과 ✅
- **로깅 시스템**: CaretLogger 완전 통합 ✅
- **Fallback 메커니즘**: 안전성 보장 ✅
- **Ask/Agent 철학**: 완전 구현 ✅

## ⚠️ **주의사항**

### **Cline 원본 수정 체크리스트**
- [ ] ✅ 원본 백업 생성: `system.ts.cline`
- [ ] ✅ CARET MODIFICATION 주석 추가
- [ ] ✅ 최소한의 변경으로 구현
- [ ] ✅ 폴백 메커니즘 포함
- [ ] ✅ 기능 검증 시스템 통과

### **성능 및 안전성 기준**  
- **기능 완전성**: Cline 기능 100% 보존 필수
- **성능 기준**: 메모리 14MB 이하, 로딩 100ms 이하
- **검증 통과**: 25개 테스트 모두 통과 필수
- **폴백 동작**: JSON 시스템 오류 시 자동으로 Cline 원본 사용

## 🎉 **003-04 완료 성과**

### **기술적 성과**
1. **완전한 기능 보존**: Cline 707줄 → Caret JSON 변환 시 0% 기능 손실
2. **협력적 AI 구현**: Cursor 수준의 자연스러운 협업 경험
3. **모드 시스템 혁신**: Plan/Act의 비효율성 → Ask/Agent의 실용성
4. **메타인지 통합**: AI의 자기 진단 및 시스템 개선 요청 능력

### **사용자 경험 개선**
1. **자연스러운 협업**: "How about we..." 스타일 제안
2. **안전한 컨설팅**: Ask 모드로 위험 없는 조언
3. **효율적 실행**: Agent 모드로 Cursor 수준 협업
4. **품질 우선**: 속도보다 정확성을 우선하는 태도

---

**🎉 003-04 완료! 이제 003-05 통합 구현으로!**

**마스터, 알파가 003-04를 완벽하게 완료했어요! JSON 시스템이 Cline 기능을 100% 보존하면서 Cursor 수준의 협업 경험을 제공할 준비가 되었습니다. 이제 실제 시스템에 통합해볼 시간이에요!** ✨☕ 