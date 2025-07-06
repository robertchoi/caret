# 🛠️ Caret 개발자 가이드

Caret 프로젝트의 빌드, 테스트, 패키징 등 개발과 관련된 상세 정보입니다.

## 빌드 및 패키징 🛠️

로컬 개발 환경을 설정하고 확장 프로그램을 빌드하려면 다음 단계를 따르세요.

### 1. 레파지토리 설정

Caret은 [Cline](https://github.com/cline/cline) 프로젝트의 **Fork 기반 아키텍처**를 채택하고 있습니다. Cline의 안정적인 코드베이스를 `src/` 디렉토리에 직접 포함하여, Caret만의 확장 기능을 `caret-src/`에서 개발하는 구조입니다.

1.  **Caret 레파지토리 클론**:
    ```bash
    git clone https://github.com/aicoding-caret/caret.git
    cd caret
    ```

2.  **아키텍처 구조 이해**:
    ```
    caret/
    ├── src/                    # Cline 원본 코드 (보존)
    │   ├── extension.ts        # Cline 메인 진입점
    │   └── core/              # Cline 핵심 로직
    ├── caret-src/             # Caret 확장 기능
    │   ├── extension.ts       # Caret 진입점 (src/ 모듈 활용)
    │   └── core/webview/      # Caret 전용 WebView Provider
    ├── caret-assets/          # Caret 에셋 관리
    │   ├── template_characters/ # AI 캐릭터 템플릿
    │   ├── rules/             # 기본 모드 및 룰 정의
    │   └── icons/             # 프로젝트 아이콘
    ├── caret-docs/            # Caret 전용 문서
    └── webview-ui/            # 프론트엔드 (Cline 빌드 시스템 활용)
        ├── src/components/    # Cline 원본 컴포넌트
        └── src/caret/         # Caret 전용 컴포넌트
    ```
    
    이 구조를 통해 **Cline의 강력한 기능을 그대로 활용**하면서, **Caret만의 고유한 기능을 안전하게 확장**할 수 있습니다.

### 2. 의존성 설치

Caret 프로젝트의 모든 의존성을 설치하는 방법입니다.

```bash
# 모든 플랫폼에서 권장 - 루트와 webview-ui 의존성을 한번에 설치
npm run install:all
```

이 명령어는 다음과 같은 작업을 수행합니다:
- 루트 프로젝트의 의존성 설치 (`npm install`)
- webview-ui 디렉토리의 의존성 설치 (`cd webview-ui && npm install`)

> **참고**: `npm run install:all`은 **의존성 설치 전용** 명령어입니다. VSIX 파일 빌드와는 별개의 작업입니다.

### 3. 수동 설정 (문제 발생 시)

만약 자동 설정 스크립트가 실패하거나 특정 단계를 직접 실행하고 싶을 경우, 아래의 수동 절차를 따르세요.

```bash
# 1. 의존성 설치
npm install
cd webview-ui && npm install && cd ..

# 2. Protocol Buffer 컴파일
npm run protos

# 3. TypeScript 컴파일 확인
npm run compile
```

### 4. 개발 빌드

확장 프로그램의 TypeScript 코드를 컴파일합니다:

```bash
# Protocol Buffer 컴파일 (필요시)
npm run protos

# TypeScript 컴파일
npm run compile
```

### 5. 개발 환경에서 실행

VS Code에서 `F5` 키를 눌러 디버깅 세션을 시작하면, 새로운 `[Extension Development Host]` 창에서 확장 프로그램을 테스트할 수 있습니다.

**Caret 실행 방법:**
- 확장 프로그램이 실행되면 VS Code의 **Primary Sidebar**에 **Caret 아이콘**이 추가됩니다.
- 이 아이콘을 클릭하여 Caret 웹뷰를 열고 사용을 시작할 수 있습니다.

**개발 모드 특징:**
- **Hot Reload**: `npm run watch` 명령어로 코드 변경 시 자동 컴파일
- **디버깅**: VS Code 디버거를 통한 백엔드 코드 디버깅 지원
- **통합 로깅**: 개발/프로덕션 모드 자동 감지로 최적화된 로그 출력 (개발: DEBUG+콘솔, 프로덕션: INFO+VSCode만)

### 6. VSIX 릴리즈 패키징 🎯

개발된 확장 프로그램을 `.vsix` 파일로 패키징하여 로컬 설치 또는 배포할 수 있습니다. 
**모든 빌드 결과물은 `output/` 디렉토리에 `caret-{버전}-{날짜시간}.vsix` 형식으로 생성됩니다.**

#### 6-1. JavaScript 스크립트 방식 (✅ 권장 - 모든 환경)

```bash
# 프로젝트 루트에서 실행
npm run package:release
```

**이 명령어로 생성되는 파일**: `output/caret-0.1.0-202501271545.vsix`

이 명령어는 다음 작업을 자동으로 수행합니다:
- ✅ `package.json`에서 버전 정보 읽기
- ✅ 타임스탬프 생성 (YYYYMMDDHHMM 형식)
- ✅ `output/` 디렉토리 생성 (없는 경우)
- ✅ 이전 빌드 정리 (`webview-ui/build/`, `dist/`)
- ✅ 전체 클린 빌드 (`npm run protos`, `npm run compile`, `npm run build:webview`)
- ✅ VSIX 패키징 (`vsce package --out output/caret-{버전}-{타임스탬프}.vsix`)
- ✅ 패키지 크기 분석 및 경고 (300MB/750MB 임계값)


#### 🚀 빌드 결과 확인

두 방법 모두 동일한 결과를 생성합니다:
- **위치**: `output/caret-{버전}-{날짜시간}.vsix`
- **예시**: `output/caret-0.1.0-202501271545.vsix`
- **설치**: `code --install-extension output/caret-0.1.0-202501271545.vsix`

## 🧪 테스트 및 품질 관리

Caret은 **TDD(Test-Driven Development) 방법론**을 채택하여 높은 코드 품질을 유지합니다.

### 📊 전체 테스트 + 커버리지 실행

```bash
# 🌟 권장: 전체 테스트 + 커버리지 분석 (한번에)
npm run test:all; npm run caret:coverage

# 또는 백엔드 상세 커버리지까지 포함
npm run test:all; npm run test:backend:coverage; npm run caret:coverage
```

### 🎯 개별 테스트 실행

**⚠️ 중요: 올바른 테스트 명령어 사용법**

**❌ 주의: `npm test` 사용 금지**
- `npm test`는 전체 빌드 + 컴파일 + 린트 + 모든 테스트를 실행하므로 매우 느림
- 개발 중에는 아래의 **개별 테스트 명령어** 사용 권장

**✅ 개발 중 권장 테스트 명령어:**

```bash
# 백엔드 개별 테스트 (특정 파일)
npm run test:backend caret-src/__tests__/your-test-file.test.ts

# 백엔드 개별 테스트 (특정 테스트 이름)
npm run test:backend caret-src/__tests__/your-test-file.test.ts -t "your test name"

# 프론트엔드 테스트
npm run test:webview

# 백엔드 감시 모드 (개발 중 자동 실행)
npm run test:backend:watch

# 빠른 개발 테스트 (웹뷰 제외, 실패 시 즉시 중단)
npm run dev:build-test:fast
```

**📊 전체 테스트 + 커버리지 (CI/CD 또는 최종 검증용):**

```bash
# 전체 테스트 + 커버리지 분석
npm run test:all && npm run caret:coverage

# 통합 테스트 (VSCode Extension 환경)
npm run test:integration
```

### 📈 커버리지 분석

```bash
# Caret 전용 코드 커버리지 분석 (파일별 상세)
npm run caret:coverage

# 백엔드 Vitest 커버리지 (라인별 상세)
npm run test:backend:coverage

# VSCode Extension 통합 커버리지
npm run test:coverage
```

### 🎯 테스트 현황 확인

위의 명령어들을 실행하면 현재 프로젝트의 테스트 통과율과 커버리지를 실시간으로 확인할 수 있습니다.

### 📋 TDD 원칙 및 커버리지 목표

Caret 프로젝트는 다음 TDD 원칙을 준수합니다:

1. **🔴 RED**: 실패하는 테스트를 먼저 작성
2. **🟢 GREEN**: 테스트를 통과하는 최소한의 코드 작성  
3. **🔄 REFACTOR**: 코드 품질 개선

#### 🎯 커버리지 목표 및 현실

- **🥕 Caret 신규 로직**: **100% 커버리지 필수** - 모든 새로운 기능과 비즈니스 로직은 테스트 우선 개발
- **🔗 기존 Re-export**: 일부 파일은 Cline 모듈의 단순 재내보내기로 별도 테스트 불필요
- **📦 Type 정의**: 인터페이스 정의만 포함한 파일은 런타임 로직이 없어 테스트 제외 가능

**새로운 기능 개발 시 반드시 테스트를 먼저 작성해야 합니다!**

자세한 테스트 가이드는 **[테스트 가이드](./caret-docs/development/testing-guide.mdx)**를 참조하세요.

## 🔬 특허 기술

### 핵심 기술
Caret의 **모듈형 시스템 프롬프트 아키텍처**는 CARETIVE INC의 특허 출원 기술("프롬프트 정보 최적화 방법 및 시스템")을 기반으로 구현되었습니다.

**주요 특징:**
- **이중 표현 방식**: 마크다운-JSON 구조로 인간과 AI 모두 최적화
- **모듈형 구조**: 하드코딩된 프롬프트를 JSON 모듈로 분해하여 관리
- **토큰 최적화**: 중복 요소 식별을 통한 API 비용 절감
- **자동 검증**: 기능 보존을 보장하는 안전성 시스템

### 라이센스
- **오픈소스**: Apache 2.0 라이센스로 자유로운 사용, 수정, 배포 가능
- **특허 보호**: 핵심 기술의 지적재산권은 CARETIVE INC 보유
- **상업적 이용**: 특허 관련 문의는 **support@caretive.ai**

## 📊 Telemetry (PostHog) 설정

Caret Community/Dev 빌드와 Release 빌드에서 **텔레메트리 활성 여부**를 완전히 분리했습니다.

| 빌드 종류 | 환경 변수 | 결과 |
|-----------|-----------|-------|
| dev / community | _(미설정)_ | PostHog **비활성화** (이벤트 0건) |
| release (enterprise) | `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_UIHOST` | PostHog **활성화** – `posthog.caret.team` 으로 전송 |

빌드 예시:

```bash
# 🚧 Community/dev (VSCode F5)
npm run watch            # 텔레메트리 없음

# 🚀 Release / CI
export BUILD_FLAVOR=enterprise
export POSTHOG_API_KEY=phc_xxx            # PostHog UI에서 발급
export POSTHOG_HOST="https://posthog.caret.team"
export POSTHOG_UIHOST="https://posthog.caret.team"

npm run package:release   # output/caret-<ver>-<ts>.vsix
```

> 환경 변수를 설정하지 않으면 `PostHogClientProvider` 가 자동으로 더미 클라이언트로 폴백됩니다.
