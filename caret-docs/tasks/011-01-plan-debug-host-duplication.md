# Task 011: 디버그 호스트 중복 실행 문제 해결 계획 (수정)

- **문서 상태**: `수정 완료`
- **작업 상태**: `수정 중`
- **담당자**: `Alpha`
- **검토자**: `luke`

## 1. 목표

VS Code 확장 기능 디버그 모드 실행 시, 'Cline'과 'Caret'이 중복으로 로드되어 발생하는 ID 충돌 문제를 근본적으로 해결한다. 최종적으로 Caret 확장 기능이 독립적으로 실행되고, 모든 기능이 정상 동작하도록 만든다.

## 2. 최종 원인 분석 (수정)

- **ID 충돌**: `package.json`과 코드 내에서 사용되는 ID가 설치된 'Cline' 확장과 중복되어 발생.
- **잘못된 진입점**: `esbuild.js`가 `src/extension.ts`를 진입점으로 사용하여, Caret 코드가 아닌 Cline 코드가 빌드에 포함됨.
- **잘못된 상속 및 확장**: `CaretProvider`가 `ClineWebviewProvider`를 상속하는 과정에서, `private` 멤버 접근 문제, 리소스(`codicon`) 로딩 로직 누락, HMR 스크립트 누락 등 복합적인 문제가 발생하여 UI 렌더링 및 상호작용 실패를 유발함.
- **잘못된 명령어 구현**: `caret-src/extension.ts`에서 UI 버튼과 연결된 명령어 핸들러들이 원본 로직과 다르게 구현되거나, 누락되어 버튼이 동작하지 않음.

## 3. 최종 해결 계획 (수정)

### Phase 1: 원칙 및 개발 가이드 수정 (예정)
- **목표**: AI가 '상속'과 '직접 수정'의 기준을 명확히 이해하고, 향후 유사한 실수를 방지하도록 개발 원칙을 수정한다.
- **작업 계획**:
    1. **`caretrules.ko.md` 수정**: '상속 vs 직접 수정'에 대한 기준을 명확하게 수정한다.
    2. **`.caretrules` 동기화**: `node caret-scripts/sync-caretrules.js`를 실행하여 변경사항을 동기화한다.
    3. **개발 가이드 문서 수정**: `caret-docs/development/caret-architecture-and-implementation-guide.mdx`에 "핵심 클래스 확장 가이드" 섹션을 신설하여 구체적인 절차를 문서화한다.
    4. **변경사항 커밋**: "docs: Clarify development principles for inheritance and modification" 메시지로 커밋한다.

### Phase 2: 코드 복구 및 최종 수정 (예정)
- **목표**: 잘못 수정된 파일들을 이전 커밋 상태로 되돌리고, 명확화된 원칙에 따라 최소한의 수정만으로 모든 기능을 복구한다.
- **작업 계획**:
    1. **원본 파일 복원**: `git checkout 7b90066a -- <file_path>` 명령어를 사용하여, 문제가 발생한 `caret-src/core/webview/CaretProvider.ts`와 `caret-src/extension.ts`를 안정적인 상태로 되돌린다.
    2. **`.caretrules` 절차 준수**:
        - **백업**: `src/core/webview/index.ts`의 백업 파일(`index-ts.cline`)을 생성한다.
        - **최소 수정**: `src/core/webview/index.ts`에서 `private disposables`를 `protected disposables`로 변경하고, `CARET MODIFICATION` 주석을 추가한다.
    3. **`CaretProvider.ts` 수정**:
        - `ClineWebviewProvider`를 상속받아, `resolveWebviewView`를 오버라이드한다.
        - `protected`가 된 `disposables`를 사용하여 이벤트 리스너를 올바르게 등록한다.
        - `localResourceRoots`에 Vite 개발 서버 경로와 `codicons` 경로를 추가한다.
        - `getHMRHtmlContent`에 `codicons` 링크와 `react-refresh` 스크립트가 포함되도록 수정한다.
    4. **`extension.ts` 수정**:
        - 원본 `src/extension.ts`의 로직을 기반으로, 모든 버튼의 명령어 핸들러(`settings`, `history`, `plus`, `popout` 등)를 올바르게 재구현한다.
        - `caret.openInNewTab` 명령어를 등록하고 구현한다.
    5. **최종 검증**:
        - `npm run compile`로 빌드가 성공하는지 확인한다.
        - `npm run test:all`로 모든 테스트가 통과하는지 확인한다.
        - 디버그 모드를 실행하여, UI, 아이콘, 모든 버튼이 완벽하게 동작하는지 최종 검증한다.
