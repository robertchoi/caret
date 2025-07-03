# Task #005: Caret 전반의 다국어 지원 (i18n) 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 📋 **High - 사용자 경험 및 접근성 개선**  
**예상 시간**: 4-6시간  
**상태**: 📋 **예정**  

## 🎯 **목표: Caret 백엔드 응답 및 웹뷰 UI 전반의 다국어 지원 구현**

### **핵심 목적**
- **통합 다국어 지원**: AI 응답 메시지, 설정 페이지 UI, 홈페이지 UI 등 Caret의 모든 사용자 대면 텍스트에 한국어/영어/일본어/중국어 다국어 지원
- **기존 i18n 시스템 활용**: `webview-ui/src/caret/utils/i18n.ts`에 구현된 JSON 기반 국제화 시스템을 확장 및 활용
- **사용자 경험 개선**: 현지화된 메시지와 UI로 접근성 및 사용성 향상
- **🔄 Cline/Caret 모드 지원**: 모드별 다른 메시지 톤 및 스타일 적용

### **🎯 responses.ts 현황 분석**

#### **현재 구조 (44개 메시지 함수)**
```typescript
// src/core/prompts/responses.ts
export const formatResponse = {
  // 사용자 피드백 메시지
  duplicateFileReadNotice: () => `[[NOTE] 이 파일은 이미 최근에 읽었습니다...]`,
  contextTruncationNotice: () => `[NOTE] 이전 대화 기록이 일부 제거되었습니다...]`,
  
  // 도구 관련 메시지
  toolDenied: () => `사용자가 이 작업을 거부했습니다.`,
  toolError: (error: string) => `도구 실행이 실패했습니다: ${error}`,
  noToolsUsed: () => `도구를 사용하지 않았습니다! 도구를 사용해서 다시 시도하세요`,
  
  // 작업 관리 메시지
  taskResumption: (task: string, timeAgo: string, cwd: string) => 
    `작업이 ${timeAgo}에 중단되었습니다. 프로젝트 상태가 변경되었을 수 있습니다...`,
  
  // ... 44개 메시지 함수 총합
}
```

#### **변환 대상 메시지 카테고리**
```typescript
📋 메시지 분류:
├── 🔧 도구 관련 (15개)
│   ├── toolDenied, toolError, noToolsUsed
│   ├── fileReadNotice, contextTruncation
│   └── toolUsageValidation
├── 📝 작업 관리 (12개)
│   ├── taskResumption, taskCompletion
│   ├── workflowGuidance, progressUpdate
│   └── modeTransition
├── ❌ 오류 처리 (8개)
│   ├── errorRecovery, fallbackMode
│   ├── validationFailure, systemError
│   └── connectionIssue
├── 💬 상호작용 (6개)
│   ├── userInteraction, feedbackRequest
│   ├── clarificationNeeded, confirmationRequest
│   └── guidanceProvision
└── 🎯 시스템 상태 (3개)
    ├── systemStatus, performanceMetrics
    └── capabilityNotification
```

## 📋 **i18n 구현 계획**

### **Phase 1: 기존 i18n 시스템 이해 및 백엔드 통합 방안 수립 (1시간)**

#### **1.1 기존 웹뷰 i18n 시스템 분석**
- `webview-ui/src/caret/utils/i18n.ts` 파일에 구현된 JSON 기반 다국어 시스템 (`t` 함수, `setGlobalUILanguage` 등) 분석
- `webview-ui/src/caret/locale/` 디렉토리 내 언어별 JSON 파일 구조 (`common.json`, `settings.json` 등) 파악

#### **1.2 백엔드 응답 메시지 통합 방안 수립**
- `src/core/prompts/responses.ts`의 AI 응답 메시지를 웹뷰의 JSON 기반 i18n 시스템과 연동하는 방안 모색
- **옵션 1 (권장)**: 백엔드에서도 `webview-ui/src/caret/locale/`의 JSON 파일을 공유하거나, 유사한 구조로 백엔드 전용 언어팩을 구성하고 `caret-src/utils/i18n.ts`를 확장하여 사용.
- **옵션 2**: `005` 태스크의 초기 계획처럼 `i18next`를 백엔드에 도입하되, 웹뷰의 `t` 함수와 호환되도록 인터페이스를 맞추는 방안. (복잡도 높음)
- **결정**: 현재 Caret의 `webview-ui`에 이미 JSON 기반의 다국어 시스템이 잘 구축되어 있으므로, 백엔드 응답 메시지도 이 시스템을 확장하여 사용하는 것을 우선적으로 고려합니다. `caret-src/utils/i18n.ts`를 웹뷰의 `i18n.ts`와 유사하게 확장하여 백엔드에서 다국어 데이터를 로드하고 `t` 함수를 사용할 수 있도록 합니다.

### **Phase 2: 언어팩 확장 및 생성 (1.5시간)**

#### **2.1 백엔드 응답 메시지 언어팩 (`responses.json`) 생성**
- `webview-ui/src/caret/locale/en/responses.json`, `ko/responses.json` 등 생성
- `src/core/prompts/responses.ts`의 44개 메시지 함수를 JSON 키-값 쌍으로 변환

#### **2.2 설정 페이지 UI 언어팩 (`settings.json`) 보완**
- `webview-ui/src/caret/locale/ko/settings.json` 등 기존 파일에 누락된 설정 UI 텍스트 추가
- `webview-ui/src/caret/components/CaretUILanguageSetting.tsx` 및 기타 설정 관련 컴포넌트의 모든 텍스트 추출 및 번역

#### **2.3 홈페이지 UI 언어팩 (`homepage.json` 또는 `welcome.json` 확장) 생성**
- 홈페이지 UI에 필요한 새로운 네임스페이스 (`homepage` 또는 기존 `welcome` 확장) 정의
- `webview-ui/src/caret/locale/en/homepage.json`, `ko/homepage.json` 등 생성 및 텍스트 번역

#### **2.4 UI 텍스트 번역 상세 체크리스트 (next-session-guide.md 기반)**

##### **2.4.1 웰컴뷰 (Welcome View)**
- **하단 풋터 번역 문제 (영문/일본어/중국어)**
  - `footer.links.github`
  - `footer.links.caretiveCompany`

##### **2.4.2 메인 페이지 및 채팅창**
- **하단의 "자동 승인 설정" 번역 안됨 (i18n 문제/한글 기준 확인된 내용)**
  - `autoApprove.title`
  - `autoApprove.actionHeader`
  - `autoApprove.readFilesExternally.label`
  - `autoApprove.executeAllCommands.label`
  - `autoApprove.quickSettingsHeader`
  - `autoApprove.maxRequestLabel`
  - `autoApprove.label`
  - `autoApprove.enableAutoApprove.shortName`
- **채팅창 추가 다국어 설정 필요**
  - **상단 Task 영역**: `Task`, `Tokens`
  - **가운데 대화 영역**:
    - `API Request`
    - `Checkpoint`, `Compare`, `Restore`
    - `Thinking`
    - `Cline has a question` (Caret 혹은 한글은 캐럿으로)

### **Phase 3: CaretResponses 클래스 및 UI 컴포넌트 적용 (2시간)**

#### **3.1 백엔드 `CaretResponses` 클래스 구현 및 `responses.ts` 적용**
- `caret-src/core/prompts/CaretResponses.ts`를 구현하여 백엔드 응답 메시지에 다국어 적용
- `src/core/prompts/responses.ts`의 기존 함수들을 `CaretResponses`를 통해 다국어 메시지를 반환하도록 래핑

#### **3.2 설정 페이지 UI 컴포넌트 적용**
- `webview-ui/src/caret/components/CaretUILanguageSetting.tsx` 및 기타 설정 관련 컴포넌트 내 텍스트에 `t` 함수 적용
- `webview-ui/src/caret/utils/i18n.ts`의 `t` 함수를 사용하여 텍스트 번역

#### **3.3 홈페이지 UI 컴포넌트 적용**
- 홈페이지 관련 UI 컴포넌트 식별 및 해당 텍스트에 `t` 함수 적용

### **Phase 4: 통합 및 테스트 (1시간)**

#### **4.1 전체 다국어 시스템 통합 테스트**
- 백엔드 응답 메시지, 설정 페이지 UI, 홈페이지 UI의 다국어 적용 확인
- 한국어/영어/일본어/중국어 전환 시 모든 텍스트가 올바르게 변경되는지 검증
- Cline/Caret 모드별 메시지 톤 및 스타일이 올바르게 적용되는지 확인

#### **4.2 성능 최적화**
- 언어팩 로딩 및 전환 시 성능 저하 여부 확인 및 최적화

## 🎯 **Cline/Caret 모드별 차이점**

### **메시지 톤 차이**
```typescript
// Cline 모드 - 정형적, 직접적
"[CLINE] 사용자가 이 작업을 거부했습니다."
"[CLINE] 도구 실행이 실패했습니다: 파일을 찾을 수 없음"

// Caret 모드 - 친근한, 협력적
"[CARET] 사용자가 이 작업을 거부했어요~"
"[CARET] 도구 실행이 실패했어요: 파일을 찾을 수 없음"
```

### **상호작용 스타일 차이**
```typescript
// Cline 모드
"Do you want to continue? Delete file: important.txt"

// Caret 모드  
"계속 진행하시겠어요? 파일을 삭제하려고 해요: important.txt"
```

## 📊 **검증 및 품질 보장**

### **✅ 성공 기준**
- [ ] **44개 메시지 함수 i18n 적용**: 모든 응답 메시지 다국어 지원
- [ ] **한국어/영어 언어팩 완성**: 완전한 번역 및 현지화
- [ ] **Cline/Caret 모드별 톤 적용**: 모드별 다른 메시지 스타일
- [ ] **점진적 호환성**: 기존 코드 100% 동작 보장 (fallback)
- [ ] **언어 설정 UI**: 사용자가 쉽게 언어 변경 가능
- [ ] **성능 최적화**: 언어팩 캐싱으로 빠른 응답

## 🚀 **다음 단계 연결**

### **003-10 준비사항**
✅ **완료될 결과물**:
- 완전한 다국어 지원 시스템
- Cline/Caret 모드별 메시지 톤 차별화
- 사용자 친화적인 언어 설정 UI
- 44개 메시지의 완전한 i18n 적용

📋 **003-10에서 할 일**:
- Cline vs Caret 성능 비교 시스템 구축
- 토큰 사용량, 응답 품질, 사용자 만족도 비교
- 최적화 방향 결정을 위한 데이터 수집

### **최종 목표**
- **완전한 다국어 지원**: 한국어/영어 사용자 모두를 위한 현지화
- **모드별 차별화**: Cline/Caret 각각에 최적화된 메시지 경험
- **사용자 중심 설계**: 쉬운 언어 변경 및 모드 전환
- **확장 가능한 구조**: 추가 언어 지원 용이

**🎯 핵심 목적: 사용자 경험 개선을 통한 Caret의 접근성 및 사용성 향상!** ✨
