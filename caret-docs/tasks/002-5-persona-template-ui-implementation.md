# Task #002-5: 페르소나 템플릿 선택 UI 구현

**작업 기간**: 1일  
**담당자**: luke  
**우선순위**: 🎯 **Medium** (002 시리즈 완료를 위한 핵심 작업)  
**예상 시간**: 4시간

## 🎯 작업 개요

### 목표
- `caret-assets/template_characters/` 리소스를 활용하여 페르소나 템플릿 선택 UI를 구현하고 커스텀 인스트럭션 설정 기능 완성

### 배경
- **Task 002의 원래 목표**: 페르소나 설정 기능 복원
- **기반 시스템 완료**: 프로젝트 룰, UI 언어 설정, 저장소 시스템 모두 안정화
- **풍부한 리소스 확인**: 4개 페르소나 (sarang, ichika, cyan, ubuntu) + 완전한 다국어 지원
- **추가 요구사항 반영**: 사용자가 제공한 이미지를 바탕으로, 기존 Rules UI (`ClineRulesToggleModal.tsx`) 내에 "페르소나 관리" 기능을 통합하고, 선택된 페르소나의 `customInstruction`을 전역 규칙 파일인 `custom_instructions.md`에 적용합니다. 파일 경로는 Cline의 표준 전역 규칙 관리 방식을 따르도록 합니다.

### 범위
- ✅ **포함**: `ClineRulesToggleModal.tsx` 내 "페르소나 관리" 섹션 및 "템플릿 캐릭터 선택" 버튼 UI 신설
- ✅ **포함**: "템플릿 캐릭터 선택" 버튼 클릭 시, 신규 `PersonaTemplateSelector.tsx` (또는 유사 컴포넌트)를 사용한 페르소나 선택 모달 표시
- ✅ **포함**: 페르소나 선택 시, 해당 페르소나의 `customInstruction` (UI 언어 기준)을 `custom_instructions.md` (전역 규칙 파일)에 저장 (생성 또는 덮어쓰기) - 신규 gRPC 메소드 `UpdateRuleFileContent` 활용
- ✅ **포함**: `custom_instructions.md` 업데이트 후 Rules UI의 "Global Rules" 목록 즉시 새로고침
- ✅ **포함**: 다국어 페르소나 정보 표시 및 신규 UI 요소 다국어 지원 (ko, en, ja, zh)
- ❌ **제외**: 새로운 페르소나 템플릿 추가 (기존 4종 활용)

### 주요 산출물
- `ClineRulesToggleModal.tsx`에 통합된 "페르소나 관리" 기능
- 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 컴포넌트
- 페르소나 선택 시 `custom_instructions.md` (전역 규칙) 자동 업데이트 시스템 (신규 gRPC 메소드 `UpdateRuleFileContent` 기반)
- 다국어 지원 페르소나 UI 및 Rules UI 내 신규 섹션

## 📚 작업 전 숙지사항 (AI 필수)
- `caret-assets/template_characters/template_characters.json`: 페르소나 데이터 구조
- `caret-assets/template_characters/*.png`: 페르소나 이미지 리소스
- `webview-ui/src/caret/locale/`: 다국어 지원 시스템 (ko, en, ja, zh 모든 신규 UI 텍스트 추가 필요)
- `webview-ui/src/components/cline-rules/ClineRulesToggleModal.tsx`: Rules UI 구현체 (주요 수정 대상)
- `webview-ui/src/context/ExtensionStateContext.tsx`: 웹뷰 전역 상태 관리
- `caret-src/core/webview/CaretProvider.ts`: 백엔드 메시지 핸들러 (웹뷰 요청 처리 및 `FileServiceClient` 호출)
- `proto/file.proto`: gRPC 서비스 정의 (신규 `UpdateRuleFileContent` RPC 및 메시지 추가됨)
- `src/core/controller/file/`: `FileService` gRPC 서비스 메소드 구현 위치 (신규 `updateRuleFileContent.ts` 핸들러 추가 필요)
- **Caret 개발 가이드라인 (필수 숙지)**:
    - `caret-docs/development/index.mdx` (프로젝트 전반 개발 프로세스)
    - `caret-docs/development/caret-architecture-and-implementation-guide.mdx` (아키텍처, UI-Storage 흐름, 상태 관리)
    - `caret-docs/development/component-architecture-principles.mdx` (UI 컴포넌트 설계 원칙)
    - `caret-docs/development/frontend-backend-interaction-patterns.mdx` (웹뷰-익스텐션 통신 패턴)
    - `caret-docs/development/logging.mdx` (`CaretLogger` 및 `WebviewLogger` 사용 지침)
    - `caret-docs/development/testing-guide.mdx` (TDD 원칙 및 테스트 작성법)
    - `caret-docs/caretrules.ko.md` (파일 수정 원칙 및 체크리스트)

## ✅ 실행 체크리스트

### Phase 0: 사전 준비 및 아키텍처 결정 ✅ **완료**
- [X] **0.1**: Cline 원본 파일 백업 (`proto/file.proto` → `proto/file-proto.cline`).
- [X] **0.2**: ~~`proto/file.proto` 수정~~ → **아키텍처 변경**: gRPC 방식 대신 Caret 독립 유틸리티 방식 채택
    - ~~`FileService`에 RPC 추가~~ → `caret-src/core/updateRuleFileContent.ts` 독립 함수로 구현
    - ~~proto 메시지 정의~~ → TypeScript 네이티브 인터페이스 사용
    - **이유**: Cline 원본 파일 보호 및 Caret 코드 분리 원칙 준수
- [X] **0.3**: ~~프로토콜 버퍼 재컴파일~~ → Caret 독립 구조로 정리 완료
    - `caret-src/core/updateRuleFileContent.ts`: Caret 전용 파일 업데이트 유틸리티 완성
    - 모든 컴파일 오류 해결 및 테스트 통과 (277/277) ✅

### Phase 1: 리소스 분석 및 설계
- [X] **1.1**: `template_characters.json` 구조 완전 분석 (기존 유지)
- [X] **1.2**: 4개 페르소나 (sarang, ichika, cyan, ubuntu) 데이터 확인 (기존 유지)
- [X] **1.3**: 다국어 `customInstruction` 구조 파악 (기존 유지)
- [ ] **1.4 (변경)**: `ClineRulesToggleModal.tsx` 내 "페르소나 관리" 섹션 인터페이스 상세 설계.
    - **"페르소나 관리" 섹션 UI (기존 Rules UI 내 통합)**:
        - 위치: `ClineRulesToggleModal.tsx` 컴포넌트의 "Rules" 탭 선택 시, "Global Rules" 섹션 바로 위에 배치합니다.
        - 제목: "페르소나 관리" (다국어 지원, 예: `t("rules.section.personaManagement")`). 스타일은 기존 섹션 제목(예: "Global Rules")과 일관성을 유지합니다 (`text-sm font-normal mb-2` 등).
        - 내용: "템플릿 캐릭터 선택" 버튼 (`VSCodeButton` 활용, 텍스트 또는 아이콘+텍스트 형태)을 포함합니다. 이 버튼은 페르소나 선택 모달을 호출합니다. (다국어 지원, 예: `t("rules.button.selectPersonaTemplate")`).
- [ ] **1.4.1 (신규)**: 신규 `PersonaTemplateSelector.tsx` 페르소나 템플릿 선택 모달 UI 상세 설계 (첫 번째 제공 이미지 참고).
    - 모달 제목: "페르소나 템플릿 선택" 또는 "AI 에이전트 설정" (다국어 지원).
    - 레이아웃: `caret-assets/template_characters/` 리소스의 페르소나들을 카드 형태로 나열 (예: Grid 레이아웃).
    - 각 페르소나 카드 구성:
        - 페르소나 대표 이미지 (예: `[persona_id].png`): **원형으로 표시 (예: `border-radius: 50%`)**.
        - 페르소나 이름 (다국어 지원, `template_characters.json` 기반).
        - 페르소나 짧은 설명 (다국어 지원, `template_characters.json` 기반).
        - "선택" (`VSCodeButton`) 버튼: 클릭 시 해당 페르소나의 `customInstruction`을 `custom_instructions.md`에 적용.
    - 모달 표시 시 배경 처리: 모달 뒤의 내용은 **흐릿하게(dimmed) 처리**하여 모달에 집중할 수 있도록 합니다.
    - 추가 정보: 모달 내에 "선택된 페르소나의 지시사항이 `custom_instructions.md` (전역 규칙)에 저장됩니다." 와 같은 안내 문구 표시 (다국어 지원).
- [ ] **1.5 (신규)**: `custom_instructions.md` 파일 처리 전략 수립:
    - 대상 파일: `custom_instructions.md`. **Caret의 페르소나 선택 기능은 Cline 시스템이 인식하는 활성 `custom_instructions.md` 전역 규칙 파일의 내용을 관리합니다. 이 파일의 실제 경로는 Cline의 표준 전역 규칙 해석 방식(예: 시스템 기본 전역 규칙 폴더 또는 사용자별 오버라이드 폴더 내 `custom_instructions.md` 파일)을 따르며, Caret 백엔드(`FileServiceClient`)는 이 활성 경로를 확인하여 파일 내용을 업데이트/생성합니다.**
    - 내용 업데이트 방식: 페르소나 선택 시 해당 `customInstruction`으로 덮어쓰기 (신규 `UpdateRuleFileContent` RPC 사용).
    - **기본 페르소나 및 초기화**: "사랑이(Sarang)"를 기본 페르소나로 지정합니다. 페르소나 관리 기능 첫 로드 시, 또는 `custom_instructions.md` 파일이 없거나 비어 있을 경우, "사랑이"의 `customInstruction` (현재 UI 언어 기준)을 `custom_instructions.md`에 자동으로 기록합니다. UI(모달 등)에도 이 기본 상태가 반영되어야 합니다.
    - 백엔드 연동: `src/core/controller/file/` 내 신규 핸들러 (`updateRuleFileContent.ts` 가칭)를 통해 `UpdateRuleFileContent` RPC로 파일 내용 업데이트 및 규칙 목록 새로고침 방안 설계.
- [ ] **1.6 (신규)**: 신규 UI 요소에 대한 다국어 리소스 추가 계획 (`personaManagement.title`, `personaManagement.selectTemplateButton` 등 키 정의).

### Phase 2: TDD 기반 UI 구현
- [ ] **2.1 (변경)**: `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 "템플릿 캐릭터 선택" 버튼 UI 구현.
    - 테스트: 섹션 및 버튼이 올바른 위치에 렌더링되고, 다국어가 적용되는지, 페르소나 선택 모달 호출 시 배경 흐림 효과가 적용되는지 확인.
- [ ] **2.2 (신규)**: "템플릿 캐릭터 선택" 버튼 클릭 시 신규 `PersonaTemplateSelector.tsx` 모달 표시 로직 구현.
    - 테스트: 모달이 정상적으로 열리고 닫히는지, 페르소나 데이터가 올바르게 전달되는지, **기본 페르소나("사랑이")가 초기 상태로 올바르게 표시/선택되어 있는지 확인.**
- [ ] **2.3 (신규)**: 신규 `PersonaTemplateSelector.tsx` 모달 내 페르소나 목록 표시, 선택 인터페이스, 다국어 상세 정보 표시 기능 구현.
    - 테스트: 페르소나 목록, 이미지(원형 표시), 정보(다국어)가 올바르게 표시되는지, 선택 기능이 정상 작동하는지 확인.

### Phase 3: 커스텀 인스트럭션 연동
- [ ] **3.1**: 페르소나 선택 시 현재 UI 언어 기준의 `customInstruction` 추출 (기존 유지).
- [X] **3.1.1 (신규)**: **Caret 독립 파일 업데이트 유틸리티 구현 완료**:
    - `caret-src/core/updateRuleFileContent.ts` 파일 생성 및 완전한 로직 구현 완료.
    - `UpdateRuleFileContentRequest` 타입 기반으로 `custom_instructions.md` 파일 내용 업데이트 기능 구현.
    - Cline 전역 규칙 경로 결정 방식 준수 (`ensureRulesDirectoryExists`, `cwd` 활용).
    - CARET MODIFICATION 주석 추가 완료.
    - ~~gRPC 방식~~ → 직접 함수 호출 방식으로 아키텍처 변경.
    - 모든 TypeScript 컴파일 오류 해결 및 전체 테스트 통과 (277/277) ✅
- [ ] **3.1.2 (신규)**: **초기화 로직 구현**: 페르소나 관리 기능 로드 시 (예: `CaretProvider` 또는 관련 서비스 초기화 단계), `custom_instructions.md` 파일 상태를 확인하고, 필요시 (파일 없거나 비어있을 시) 기본 페르소나("사랑이")의 `customInstruction`(현재 VSCode UI 언어 기준)으로 파일을 생성/업데이트하는 로직을 백엔드 연동(`UpdateRuleFileContent` RPC 사용)하여 실행. 이후 `refreshRules()` 호출로 UI 반영.
- [ ] **3.2 (변경)**: `CaretProvider.ts`에서 `caret-src/core/updateRuleFileContent.ts` 함수를 직접 import하여 `custom_instructions.md` 파일 내용 업데이트/생성 로직 추가.
    - 요청 시 파일 이름(`custom_instructions.md`), `isGlobal=true` 플래그, 새로운 콘텐츠를 백엔드로 전달.
    - [CARET MODIFICATION] 주석 및 백업 규칙은 `CaretProvider.ts` 등 Cline 원본 파일 수정 시 준수.
- [ ] **3.3 (변경)**: 선택된 페르소나의 `customInstruction`을 `updateRuleFileContent()` 함수를 통해 `custom_instructions.md` 파일에 적용 (생성 또는 덮어쓰기).
- [ ] **3.4 (변경)**: `custom_instructions.md` 업데이트 후 `FileServiceClient.refreshRules()`를 호출하여 Rules UI의 "Global Rules" 목록을 즉시 새로고침.

### Phase 4: 통합 테스트 및 검증
- [ ] **4.1 (변경)**: 4개 언어(ko, en, ja, zh)에서 페르소나 템플릿 선택 모달(신규 `PersonaTemplateSelector.tsx`, **원형 이미지, 배경 흐림 효과 포함**) 및 Rules UI의 "페르소나 관리" 섹션이 정상적으로 표시되고 작동하는지 확인.
- [ ] **4.2 (변경)**: 페르소나 선택 시 `custom_instructions.md` 파일 내용이 실제로 업데이트되고, "Global Rules" 목록에 해당 파일이 표시/갱신되며, 사용자가 토글하거나 **VSCode 편집기를 통해 편집 가능한지 확인.**
- [ ] **4.3 (변경)**: Rules UI의 "페르소나 관리" 기능을 통한 전체 플로우(모달 열기 > 페르소나 선택 > `custom_instructions.md` 업데이트 > Global Rules 목록 반영) 통합 테스트.
- [ ] **4.4**: 기존 기능(다른 규칙 파일 관리 등)에 대한 회귀 없음 확인 (기존 유지).

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `ensureRulesDirectoryExists` (from `@core/storage/disk`) 및 `getWorkspaceRulesPath` (from `@core/task`) 등을 사용하여 전역/작업공간 규칙 경로 처리.
    *   CARET MODIFICATION 주석 추가.
4.  **`src/core/controller/file/methods.ts` 확인**:
    *   `npm run protos` 재실행 후, `updateRuleFileContent` 핸들러가 `methods.ts`에 정상적으로 import 및 등록되었음을 확인.
5.  **`custom_instructions.md` 초기화 로직 `caret-src/core/webview/CaretProvider.ts`에 구현 시도 (Phase 3.1.2 일부 진행)**:
    *   웹뷰 로드 시 `custom_instructions.md` 파일 상태 (전역 규칙 경로) 확인.
    *   파일이 없거나 비어있을 경우, `template_characters.json`에서 기본 페르소나("sarang")의 `customInstruction` (현재 UI 언어 기준)을 가져옴.
    *   신규 `updateRuleFileContent` RPC를 호출하여 파일 내용 업데이트 및 `refreshRules` RPC 호출 로직 추가 시도.

**현재 발생 문제 및 블로킹 포인트:**

*   **`caret-src/core/webview/CaretProvider.ts`의 지속적인 Linter 오류 (TypeScript Import 경로 문제)**:
    *   **오류 내용**:
        *   `Module '"../../../src/utils/fs"' has no exported member 'getGlobalRulesPath'.` (이 import는 `ensureRulesDirectoryExists` from `../../../src/core/storage/disk`로 대체하려고 했으나, 잔존 또는 다른 문제로 계속 발생)
        *   `Type 'string' is not assignable to type 'never'.` (및 유사한 타입 오류들, `UpdateRuleFileContentRequest.create({...})` 호출 시 발생)
    *   **문제 원인 추정**:
        *   `CaretProvider.ts` (`caret-src/core/webview/`) 파일에서 `src/core/storage/disk.ts`, `src/shared/proto/file.ts`, `src/shared/proto/common.ts` 등의 모듈을 가져올 때, 상대 경로 계산 또는 TypeScript 경로 별칭(`@shared/`, `@core/` 등) 해석에 문제가 있는 것으로 보임.
        *   루트 `tsconfig.json`에는 `"baseUrl": "."` 및 `paths` 별칭이 정의되어 있으나, `caret-src/` 내부의 TypeScript 컴파일 환경에서 이를 올바르게 참조하지 못하거나 충돌이 있을 가능성.
        *   여러 차례 (`../../../src/...` 형태의) 정확한 상대 경로로 수정을 시도했으나, 린터 오류가 해결되지 않고 반복됨. (동일 파일 3회 수정 시도 후 중단된 상태)
    *   **필요 조치**:
        *   `CaretProvider.ts` 내에서 사용하는 `ensureRulesDirectoryExists`, `UpdateRuleFileContentRequest`, `EmptyRequest` 등의 import 경로를 정확히 수정해야 함.
        *   `caret-src/` 디렉토리의 TypeScript 설정 (별도의 `tsconfig.json` 존재 여부, 루트 `tsconfig.json` 상속 관계 등)을 면밀히 검토하여 경로 해석 문제를 해결해야 함.
        *   문제가 해결된 후, `custom_instructions.md` 초기화 로직이 정상적으로 컴파일되고 작동하는지 확인 필요.

**다음 작업 제안:**

1.  `caret-src/core/webview/CaretProvider.ts`의 import 경로 문제를 최우선으로 해결.
    *   `caret-src/` 내부의 `tsconfig.json` 파일이 있다면 해당 설정을 확인하고, 없다면 루트 `tsconfig.json`의 `paths`와 `baseUrl` 설정을 기준으로 `CaretProvider.ts`에서의 정확한 상대 경로를 다시 한번 계산하여 적용.
    *   VSCode의 TypeScript Language Server가 경로를 올바르게 인식하는지 확인.
2.  `CaretProvider.ts`의 린터 오류 해결 후, `npm run compile` (또는 `npm run watch`)을 통해 전체 프로젝트 빌드가 성공하는지 확인.
3.  Phase 0.3의 `npm run protos` 실행이 완료되었는지, `src/core/controller/file/methods.ts`에 `updateRuleFileContent`가 올바르게 등록되었는지 최종 확인. (현재는 확인된 것으로 보이나, `CaretProvider.ts` 문제 해결 후 재점검 필요)
4.  이후 "실행 체크리스트"의 Phase 1.4부터 순차적으로 진행.

---
## ✅ 완료 기준
- [ ] `ClineRulesToggleModal.tsx`에 "페르소나 관리" 섹션 및 버튼 완전 구현.
- [ ] "템플릿 캐릭터 선택" 버튼으로 신규 `PersonaTemplateSelector.tsx` 페르소나 선택 모달 정상 작동.
- [ ] 4개 페르소나 모두 선택 가능하며, 선택 시 `custom_instructions.md` (전역 규칙) 내용 자동 업데이트 (신규 `UpdateRuleFileContent` RPC 사용).
- [ ] `custom_instructions.md` 파일이 "Global Rules" 목록에 표시되고 관리 가능 (토글, 편집 등).
- [ ] 4개 언어(ko, en, ja, zh) 모두에서 신규 기능 및 관련 UI 정상 작동.
- [ ] 전체 페르소나 선택 플로우 (Rules UI -> 모달 -> 선택 -> 적용 -> Rules UI 반영) 완전 통합.
- [ ] 모든 관련 테스트 통과 확인.
- [ ] 기존 Rules UI 기능 및 기타 기능 회귀 없음 확인.

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (`CaretProvider.ts`, `ClineRulesToggleModal.tsx`, `proto/file.proto`, `src/core/controller/file/` 내 파일 등 수정 시).
- CARET MODIFICATION 주석 추가 필수. ([Caret 프로젝트 규칙][memory:845928451928494580])
- 최소 수정 원칙 (1-3라인 이내 권장).
- 기존 i18n 시스템 패턴 준수.
- TDD 원칙 준수 (테스트 먼저 작성). ([Caret 테스트 가이드][memory:76604380466147906])
- `custom_instructions.md` 파일은 다른 전역 규칙과 동일한 방식으로 시스템에 의해 관리되어야 하며, Caret은 이 파일의 내용을 페르소나 설정에 따라 동적으로 업데이트하는 역할을 수행합니다.
- **`custom_instructions.md` 편집**: 페르소나 선택을 통해 `custom_instructions.md` 파일 내용이 업데이트된 후, 이 파일은 "Global Rules" 목록의 다른 규칙 파일들처럼 VSCode 편집기에서 열어 직접 수정할 수 있습니다 (표준 Rules UI의 편집 버튼 기능 활용).
- **gRPC 서비스 확장**:
    - `proto/file.proto`에 `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`)가 추가되었습니다.
    - `src/core/controller/file/` 디렉토리에 이 RPC를 처리하는 새로운 핸들러 파일 (예: `updateRuleFileContent.ts`) 생성이 필요합니다.
    - `npm run protos` (또는 `proto/build-proto.js`) 실행 후, `src/core/controller/file/methods.ts`에 새 메소드가 자동 등록되는지 확인해야 합니다. (자동 등록 안 될 시 `build-proto.js` 스크립트 수정 또는 `methods.ts` 직접 수정 고려 - 후자는 최후의 수단)
    - 이 서비스는 활성 `custom_instructions.md` 파일의 정확한 경로를 찾아 처리해야 합니다.
- **개발 가이드 준수**: 파일 저장 로직, 메뉴(UI) 구성 및 상태 관리, 백엔드 연동 방식 등은 프로젝트 내 관련 개발 가이드 (`caret-docs/development/index.mdx`, `caret-docs/development/caret-architecture-and-implementation-guide.mdx` 등)를 반드시 숙지하고 준수해야 합니다.
- **데이터 흐름 및 예외 처리**:
    - **예상 흐름**: 페르소나 선택 (UI: `PersonaTemplateSelector.tsx`) → `ExtensionStateContext` 또는 `CaretProvider` (메시지 핸들링, `UpdateRuleFileContent` RPC 호출) → `src/core/controller/file/updateRuleFileContent.ts` (gRPC 요청 처리, 파일 작업) → `refreshRules` (상태 동기화) → UI 업데이트 (`ClineRulesToggleModal.tsx`).
    - **예외 처리**: 파일 읽기/쓰기 실패, `template_characters.json` 로드 실패 등의 경우, 사용자에게 명확한 오류 메시지를 UI에 표시하고, 관련 로그는 `WebviewLogger` (프론트엔드) 및 `CaretLogger` (백엔드)를 사용하여 상세히 기록합니다. [로깅 시스템 가이드 준수][memory:4698064151242661552].
- **로깅**:
    - 프론트엔드 (`WebviewLogger`): 페르소나 모달 열기/닫기, 페르소나 선택 이벤트, 백엔드 요청 시도 및 결과 (성공/실패) 등을 로그로 남깁니다.
    - 백엔드 (`CaretLogger` 또는 Cline 로거): `custom_instructions.md` 업데이트 요청 수신, 파일 쓰기/생성 성공/실패, 초기화 로직 수행 여부 및 결과 등을 로그로 남깁니다.

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- **신규 UI**: Rules 설정 모달 내 "페르소나 관리" 섹션 (Global Rules 상단) 및 `PersonaTemplateSelector.tsx` (신규 페르소나 선택 모달).
- **핵심 로직**: 페르소나 선택 -> `custom_instructions.md` (전역 규칙) 내용 업데이트 (`UpdateRuleFileContent` RPC 사용) -> Rules UI 새로고침.
- **경로 처리**: `custom_instructions.md`는 Cline의 표준 전역 규칙 경로에 위치.
- **`PersonaTemplateSelector.tsx`**: 기존에 없던 파일로, 신규 생성이 필요함.
- **`FileService.ts`**: `src/core/controller/file/` 디렉토리 내 개별 RPC 핸들러 파일들로 구성됨. `UpdateRuleFileContent` RPC를 위한 핸들러 신규 생성 및 등록 필요.

---
### ⚠️ 현재까지 작업 현황 및 문제점 (다른 AI 모델 인계용)

**진행된 작업:**

1.  **`proto/file.proto` 수정 완료 (Phase 0.1, 0.2)**:
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가.
    *   CARET MODIFICATION 주석 추가 및 백업 파일 생성 완료.
2.  **`npm run protos` 실행으로 프로토콜 버퍼 관련 코드 생성/업데이트 시도 (Phase 0.3 일부 진행)**:
    *   터미널에서 `npm run protos` 실행하여 `src/core/controller/file/methods.ts` 등에 반영 시도.
3.  **백엔드 RPC 핸들러 `src/core/controller/file/updateRuleFileContent.ts` 생성 완료 (Phase 3.1.1 일부 진행)**:
    *   `UpdateRuleFileContentRequest`를 받아 `custom_instructions.md` 파일의 내용을 업데이트하는 기본 로직 구현.
    *   `UpdateRuleFileContent` RPC 및 관련 메시지 (`UpdateRuleFileContentRequest`, `RuleFileContentResponse`) 추가