# Caret 문서 허브

안녕하세요! Caret 프로젝트의 공식 문서 허브에 오신 것을 환영합니다.
이곳에서는 Caret의 아키텍처, 개발 가이드, 온보딩 절차 등 모든 핵심 문서를 찾아보실 수 있습니다.

## 문서 구조 안내

Caret의 문서는 목적에 따라 다음과 같이 체계적으로 분류되어 있습니다.

### 📂 `development/` (Onboarding & Development Guides)
> **_For: 새로운 기여자, Caret을 처음 빌드하거나 시스템의 동작 원리를 깊게 이해하고 싶은 개발자, AI_**

새로운 개발자가 Caret 프로젝트에 빠르게 적응하고, 개발 환경을 설정하며, 첫 기여를 시작하는 데 필요한 온보딩 정보와 함께, Caret의 핵심 설계 사상, 주요 시스템 동작 원리, 개발 표준 및 가이드라인 등을 제공합니다.

-   **[01-new-developer-guide.mdx](./development/new-developer-guide.mdx)**: 레파지토리 클론부터 첫 실행까지의 과정을 안내하는 신규 개발자 온보딩 가이드입니다.

### 📂 `guides/`
> **_For: 특정 작업을 수행해야 하는 개발자, AI_**

특정 개발 작업을 수행하는 방법에 대한 단계별 가이드를 제공합니다.

-   **[upstream-merging.mdx](./guides/upstream-merging.mdx)**: 원본 `cline` 레파지토리의 최신 변경 사항을 Caret 프로젝트에 안전하게 병합하는 방법을 안내합니다.

---

## AI와 개발자를 위한 문서 구분

-   **AI가 읽는 문서 (AI-Context Documents)**: 주로 `development/` 와 `guides/` 폴더의 문서들입니다. AI 에이전트가 "이 시스템은 어떻게 동작해?" 또는 "머지 작업을 어떻게 해?"와 같은 질문에 답하기 위해 이 문서들을 참고합니다. 이 문서 목록은 프로젝트 루트의 **`.caretrules`** 파일에 명시되어 관리됩니다.
-   **개발자가 읽는 문서 (Developer-Facing Documents)**: 위의 모든 문서가 해당됩니다. 특히 `development/` 폴더의 온보딩 관련 문서(예: `new-developer-guide.mdx`)는 새로운 팀원이 프로젝트에 합류했을 때 가장 먼저 읽어야 할 문서입니다.

궁금한 점이 있다면 언제나 AI 에이전트에게 질문해주세요! 