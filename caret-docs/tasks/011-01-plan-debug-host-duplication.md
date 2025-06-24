# Task 011: 디버그 호스트 중복 실행 문제 해결 계획 (수정)

- **문서 상태**: `수정 완료`
- **작업 상태**: `분석 완료`
- **담당자**: `Alpha`
- **검토자**: `luke`

## 1. 목표

VS Code 확장 기능 디버그 모드 실행 시, 'Cline'과 'Caret'이 중복으로 로드되어 발생하는 ID 충돌 문제를 근본적으로 해결한다. 최종적으로 Caret 확장 기능이 독립적으로 실행되고, 모든 기능이 정상 동작하도록 만든다.

## 2. 최종 원인 분석

- **ID 충돌**: `package.json`에 정의된 `views`, `commands` 등의 ID와, 코드 내부(`*.ts`)에서 `registerCommand`, `executeCommand` 등으로 사용되는 명령어 ID가 설치된 'Cline' 확장과 중복되어 충돌을 일으킴.
- **잘못된 진입점**: `esbuild.js`가 `src/extension.ts`를 진입점으로 사용하여, Caret을 위한 코드(`caret-src`)가 아닌 Cline의 코드가 빌드 결과물에 포함됨.

## 3. 해결을 위한 최종 단계별 계획

### Phase 1: 분석 및 보고 (완료)
- **목표**: 하드코딩된 `"cline.*"` 명령어의 전체 변경 범위를 파악하고 보고한다.
- **작업 완료**:
    1. **`registerCommand("cline.")` 검색 (21건 발견)**:
        - `src/extension.ts` (14건)
        - `src/dev/commands/tasks.ts` (1건)
        - `caret-src/extension.ts` (6건)
    2. **`executeCommand("cline.")` 검색 (6건 발견)**:
        - `src/extension.ts` (5건)
        - `src/test/extension.test.ts` (1건)
    3. **게이트웨이 함수 부재 확인**: ID를 매핑하는 중앙 관리 지점은 없으며, 모두 하드코딩되어 있음을 확인.
    4. **결론**: ID 변경 작업은 필수적이며, 변경 범위는 약 30곳 내외로 관리가능한 수준으로 판단.

### Phase 2: 구조 수정 및 ID 변경 (완료)
- **목표**: 빌드 시스템을 수정하고, 모든 ID를 `caret.*`으로 변경하여 독립성을 확보한다.
- **작업**:
    1. **빌드 진입점 변경**: `esbuild.js` 파일을 수정하여, 빌드 진입점을 `src/extension.ts`에서 `caret-src/extension.ts`로 변경했다.
    2. **`package.json` ID 전체 변경**: `contributes` 섹션의 모든 `views`, `commands`, `menus`, `keybindings` 등의 ID를 `cline.*` 또는 `claude-dev.*`에서 `caret.*`으로 수정했다.
    3. **코드 내 ID 변경 (`caret-src/` 내부)**: `caret-src/extension.ts` 등 Caret 코드 내부에서 `registerCommand`와 `executeCommand`로 호출하는 모든 ID를 `caret.*`으로 수정했다.
    4. **`src/` 원본 파일 복원**: 이전 단계에서 잘못 수정했던 `src/extension.ts`의 진입점 전환 코드를 제거하고 원본 상태로 되돌렸다.

### Phase 3: 검증 (부분적 성공)
- **목표**: 문제가 완전히 해결되었는지 확인한다.
- **작업**:
    1. `npm run compile`을 실행하여 빌드가 성공하는지 확인했다.
    2. VS Code 디버그 세션('Run Extension')을 시작했다.
    3. ID 충돌 오류 없이 Caret 확장 기능이 정상적으로 활성화되는 것을 확인했다.
    4. **문제 발생**: 웹뷰에 Caret의 웰컴 페이지가 표시되지 않고, 백지 화면이 나타나는 문제가 발생했다.

### Phase 4: UI 렌더링 문제 해결 및 후속 문제 분석 (진행 중)
- **목표**: 웹뷰의 백지 화면 문제를 해결하고, 모든 기능이 정상 동작하도록 한다.
- **진행 상황**:
    1. **원인 분석**:
        - **1차 원인**: 웹뷰의 콘텐츠 보안 정책(CSP) 및 `localResourceRoots` 설정이 Vite 개발 서버(`http://localhost:5173`)의 리소스 로딩을 차단하고 있었음.
        - **2차 원인**: 원본 `ClineWebviewProvider`에 존재하던 HMR(Hot Module Replacement)용 `react-refresh` 스크립트가 `CaretProvider`에서 누락되었음.
        - **3차 원인**: `ExtensionStateContext.tsx`에서 UI 렌더링 조건이 API 키 존재 여부에 의존하여, 키가 없는 경우 UI가 멈추는 문제가 있었음.
    2. **수정 작업**:
        - `CaretProvider.ts`를 대대적으로 수정하여 `localResourceRoots`에 개발 서버 경로를 추가하고, CSP 정책을 완화하며, 누락된 `react-refresh` 스크립트를 다시 추가함.
        - `ExtensionStateContext.tsx`의 렌더링 조건을 API 키 대신 `clineClientId` 존재 여부로 변경함.
    3. **현재 상태**:
        - **성공**: **UI가 정상적으로 표시됨.** Cline 확장 프로그램을 삭제한 후, ID 중복으로 인한 중복 실행 문제는 완전히 해결됨.
        - **새로운 문제 발생**:
            - UI 상/하단의 아이콘들이 보이지 않음 (엑스박스 표시).
            - 설정 버튼 등 대부분의 버튼이 동작하지 않음.
        - **원인 추정**: `CaretProvider.ts`를 수정하는 과정에서, 아이콘 폰트(`codicon.css`) 로딩 관련 HTML/CSP 설정이 누락되었거나, 버튼과 연결된 gRPC/명령어 실행 로직이 새로운 보안 정책에 의해 차단되었을 가능성이 높음.

### Phase 5: UI 상호작용 복구 (예정)
- **목표**: 아이콘 및 버튼 동작 문제를 해결한다.
- **작업 계획**:
    1. **원본-수정본 비교**: 원본 `ClineWebviewProvider` (`src/core/webview/index.ts`)와 현재 `CaretProvider.ts`를 정밀 비교하여 누락된 리소스 로딩 로직(특히 `codicon`)을 찾는다.
    2. **`CaretProvider.ts` 복구 및 수정**: 원본의 안정적인 리소스 로딩 방식을 기반으로 `CaretProvider.ts`를 재구성한다. HMR과 Caret 독립 실행에 필요한 최소한의 수정만 남기고, 아이콘 및 버튼 관련 로직은 원본과 동일하게 복구한다.
    3. **최종 검증**: 모든 UI 요소가 정상적으로 표시되고, 모든 버튼이 올바르게 동작하는지 확인한다.
