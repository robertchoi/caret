# Task #016: 페르소나 초기화 및 이미지 문제 해결

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **High - 사용자 경험 및 초기 설정 안정성**  
**예상 시간**: 1.5-2.5시간  
**상태**: 🔄 **진행 중**  

## 🎯 **목표: Caret 초기 설치 시 페르소나 관련 문제 해결 및 기본 설정 강화**

### **핵심 목적**
- **페르소나 초기화 안정성 확보**: 처음 설치 시 페르소나가 sarang으로 나오고, custom_instruction.md 가 재설정이 안되는 문제
  -> 페르소나 초기화에 대한 기능은 별도의 클래스로 뺄수 있는지 확인 (초기화시 수행하게 함)
  -> caret-assets\template_characters\template_characters.json 에 isDefault : true가 된 정보를 기반으로 재셋팅이 되어야 함. 현재 초기화시 sarang으로 셋팅됨
  -> custom_instructions.md 파일이 없는 경우 생성하고, 덮어쓰기 수행 필요 (현재 삭제하면 업데이트가 안되는 것을 보아 없는 경우 생성 로직이 없음)
  
- **newTask 페이지** : 페르소나 이미지 노출
  - 현재 캐럿의 아이콘으로 노출되고 있으나 이를 페르소나의 이미지로 변경

  
### **🎯 현황 분석 및 관련 파일**

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

1. **페르소나 초기화 기능 구현**
   - `PersonaInitializer` 클래스 구현 완료
   - `template_characters.json`에서 `isDefault: true`인 페르소나를 찾아 초기화하는 로직 구현
   - `custom_instructions.md` 파일이 없을 경우 생성하는 로직 구현

2. **페르소나 이미지 관련 문제 분석**
   - 페르소나 이미지 업데이트는 정상 작동 확인
   - 사용자 이미지 업로드는 업로드는 되나, 이전 이미지가 나오는 시점 문제가 있는 것으로 추정
   - 초기화 시 이미지가 제대로 표시되지 않는 문제 발견

3. **이미지 처리 로직 통합**
   - `CaretProvider`에 `notifyPersonaImagesChanged` 메서드 추가하여 이미지 업데이트 로직 일원화
   - 페르소나 매니저의 이미지 업데이트는 정상적으로 작동하나, 채팅 row의 업데이트 로직과 차이가 있음
   - 웹뷰 내 이미지 업데이트 메시지 타입 통일 (`RESPONSE_PERSONA_IMAGES`)

### **📋 다음 작업 계획**

1. **NewTask 페이지 페르소나 이미지 적용**
   - NewTask 페이지에 페르소나 이미지 표시 로직 구현
   - 페르소나 매니저와 동일한 이미지 로딩 방식 적용

2. **ChatRow 컴포넌트 이미지 업데이트 로직 개선**
   - ChatRow 컴포넌트의 이미지 업데이트 로직 분석
   - 페르소나 매니저와 일관된 방식으로 업데이트 로직 수정

3. **통합 테스트**
   - 페르소나 초기화, 이미지 업로드, 템플릿 선택 시 모든 화면에서 일관되게 이미지가 업데이트되는지 확인
