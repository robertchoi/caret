# Task #016: 페르소나 초기화 및 이미지 문제 해결

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **High - 사용자 경험 및 초기 설정 안정성**  
**예상 시간**: 1.5-2.5시간  
**상태**: 📋 **예정**  

## 🎯 **목표: Caret 초기 설치 시 페르소나 관련 문제 해결 및 기본 설정 강화**

### **핵심 목적**
- **페르소나 초기화 안정성 확보**: 처음 설치 시 페르소나가 비어 있거나 잘못 설정되는 문제 해결
- **페르소나 이미지 표시 개선**: 페르소나 이미지가 올바르게 표시되지 않는 문제 해결
- **기본 페르소나 설정**: 초기화 시 기본 페르소나(사랑이)가 설정되도록 기능 추가

### **🎯 현황 분석 및 관련 파일**
- **문제 현상**:
  - 처음 설치 시 페르소나가 비워져 있음 (이치카에 셋팅되어 있으나, 실제로는 비어있는 것처럼 보임)
  - 페르소나 이미지가 표시되지 않음
  - 초기화 메뉴에서 페르소나 이미지가 삭제되지 않는 문제
- **관련 파일 (예상)**:
  - `caret-src/core/config/PersonaConfig.ts` (페르소나 설정 관리)
  - `caret-src/providers/CaretProvider.ts` (초기화 로직)
  - `webview-ui/src/caret/components/PersonaManagement.tsx` (페르소나 관리 UI)
  - `webview-ui/src/caret/components/PersonaAvatar.tsx` (페르소나 아바타 표시)
  - `caret-assets/template_characters/` (기본 페르소나 이미지)

### **상세 분석 결과**
- **페르소나 이미지 로드 방식 (`webview-ui/src/caret/components/PersonaAvatar.tsx`):**
  - `ExtensionStateContext`에서 `personaProfile`, `personaThinking` URI를 초기값으로 가져오거나, 백엔드 메시지(`RESPONSE_PERSONA_IMAGES`)를 통해 동적으로 업데이트됩니다.
  - 로딩 중/에러 시에는 Base64 인코딩된 SVG 폴백 이미지를 사용합니다.
- **규칙 창 이미지 표시 방식 (`webview-ui/src/caret/components/PersonaManagement.tsx`):**
  - 컴포넌트 로드 시 `REQUEST_PERSONA_IMAGES` 메시지를 통해 백엔드에 이미지 URI를 명시적으로 요청하고, 응답을 즉시 `<img>` 태그에 반영합니다.
  - 페르소나 템플릿 선택 및 이미지 업로드 시 `window.postMessage`를 통해 웹뷰 내 다른 컴포넌트에 변경 사항을 즉시 브로드캐스트하고 전역 변수를 업데이트합니다.
- **규칙 창과 다른 UI 간 이미지 표시 불일치 원인 추정:**
  - 규칙 창은 이미지를 명시적으로 요청하고 즉시 반영하는 반면, 다른 UI(예: 채팅 영역)는 초기 로드 시 `ExtensionStateContext`의 값이 비어있거나, 백엔드의 "순환 메시지 방지 패턴"으로 인해 단일 필드 업데이트 시 전체 상태 브로드캐스트가 스킵되어 이미지 업데이트가 지연/누락될 수 있습니다.
- **Caret 아이콘(새 태스크 시 표시) 설정 파일 및 방식 (`caret-src/utils/persona-initialization.ts`):**
  - `initializeDefaultPersonaOnLanguageSet` 함수가 Caret 초기 설치 또는 언어 설정 변경 시 호출됩니다.
  - 이 함수는 `caret-assets/template_characters/sarang.png` 및 `sarang_thinking.png` 파일을 읽어와 `globalStorageUri/personas/agent_profile.png` 및 `agent_thinking.png`로 복사하여 기본 페르소나 이미지를 설정합니다.
  - 따라서 `newTask` 시 보이는 Caret 아이콘은 기본 페르소나 '사랑이'의 이미지입니다.
- **개발 가이드 명시 여부:**
  - 프론트엔드-백엔드 상호작용 패턴은 `caret-docs/development/frontend-backend-interaction-patterns.mdx` 문서에 명시되어 있습니다. 특히, 백엔드에서 단일 필드 업데이트 시 브로드캐스트를 스킵하는 내용이 포함되어 있습니다.

### **📋 구현 계획**

#### **Phase 1: 문제 진단 및 초기화 로직 분석 (0.5시간)**
- 처음 설치 시 페르소나가 비워져 있는 현상 재현 시도
- `CaretProvider` 또는 관련 초기화 로직에서 페르소나 설정이 어떻게 이루어지는지 분석
- `PersonaConfig`의 저장 및 로드 방식 검토

#### **Phase 2: 페르소나 이미지 문제 해결 (1시간)**
- 페르소나 이미지가 표시되지 않는 원인 파악 (경로 문제, 로딩 문제 등)
- 초기화 시 페르소나 이미지가 삭제되지 않는 문제 해결
- 기본 페르소나(사랑이) 이미지를 포함하여 초기화 시 설정되도록 구현
  - `caret-assets/template_characters/sarang.png` 활용

#### **Phase 3: 기본 페르소나 설정 기능 추가 (0.5시간)**
- 초기화 시 기본 페르소나(사랑이)가 자동으로 설정되도록 로직 추가
- 추후 신규 캐릭터(캐럿)으로 변경 예정임을 고려하여 확장성 있게 구현
- **템플릿 페르소나 이름 출력 제거**: 페르소나 관리 페이지에서 템플릿 페르소나의 이름이 출력되지 않도록 수정 (사용자 업로드 페르소나와의 혼동 방지)

## 📊 **검증 및 품질 보장**

### **✅ 성공 기준**
- [ ] **초기 설치 시 페르소나 정상 설정**: Caret 설치 후 페르소나가 비어있지 않고 기본값으로 설정됨
- [ ] **페르소나 이미지 정상 표시**: 설정된 페르소나 이미지가 UI에 올바르게 표시됨
- [ ] **초기화 기능 개선**: 초기화 시 페르소나 이미지가 올바르게 처리되고 기본 페르소나가 설정됨

## 🚀 **다음 단계 연결**

### **최종 목표**
- Caret의 초기 사용자 경험 개선
- 페르소나 기능의 안정성 및 신뢰성 확보
