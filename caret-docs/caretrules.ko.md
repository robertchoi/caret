# Caret 프로젝트 종합 규칙 및 개발 가이드

**Caret**: VSCode용 AI 코딩 어시스턴트 확장 - Cline 기반 Fork 프로젝트

## 프로젝트 개요

**프로젝트명**: Caret (캐럿 - '^' 기호, 당근🥕 아님)
**설명**: 개인화된 개발 파트너십에 중점을 둔 VSCode AI 어시스턴트 확장
**기반**: Cline 프로젝트의 Fork로 직접 통합
**저장소**: https://github.com/aicoding-caret/caret

**네이밍 컨벤션**: Caret은 프로그래밍에서 사용하는 텍스트 커서 기호 '^'를 의미하며, 프로그래밍 현장에서 위치와 방향을 나타내는 중요한 기호입니다.

## 아키텍처 원칙

**Fork 기반 구조**: Cline 코드베이스를 `src/` 디렉토리에 직접 통합하여 최소 확장 전략 채택

**디렉토리 구성**:
```
caret/
├── src/                      # Cline 원본 코드 (보존 필수)
├── caret-src/                # Caret 확장 기능 (최소한)
├── webview-ui/               # React 프론트엔드 (Cline 빌드 시스템 활용)
├── caret-assets/             # Caret 전용 리소스
├── caret-docs/               # Caret 문서 시스템
└── caret-scripts/            # Caret 자동화 스크립트
```

**코드 관리 원칙 (CRITICAL - AI 필수 준수)**:

### 1. Cline 원본 파일 수정 시 절대 원칙
- **디렉토리**: `src/`, `webview-ui/`, `proto/`, `scripts/`, `evals/`, `docs/`, `locales/` 및 루트 설정 파일
- **원칙 1**: **주석처리된 안 쓰는 코드도 절대 건드리지 말 것** (머징 고려)
- **원칙 2**: **최소 수정의 원칙** - 1-3라인 이내 권장
- **원칙 3**: **수정 시 주석처리하지 말고 완전히 대체**
- **원칙 4**: **반드시 CARET MODIFICATION 주석 추가**

### 2. 백업 규칙 (MANDATORY)
```bash
# 1단계: 백업 생성 (수정 전 필수)
cp src/extension.ts src/extension-ts.cline

# 2단계: 파일 상단에 CARET MODIFICATION 주석 추가
// CARET MODIFICATION: 구체적인 수정 내용 설명
// Original backed up to: src/extension-ts.cline
// Purpose: 수정 목적
```

### 3. 자유 수정 가능 영역
- **caret-src/**: Caret 전용 디렉토리 - 완전 자유 수정
- **caret-docs/**: Caret 문서 - 완전 자유 수정  
- **caret-assets/**: Caret 리소스 - 완전 자유 수정

### 4. 수정 예시 (올바른 방법)
```typescript
// ❌ 잘못된 방법 - 주석처리로 남김
// const oldValue = "claude-dev.SidebarProvider"  // 원본
const newValue = "caret.SidebarProvider"  // 새로운 값

// ✅ 올바른 방법 - 완전 대체
const newValue = "caret.SidebarProvider"  // CARET: 사이드바 ID 변경
```

**Cline 패턴 활용**:
- **Task 실행 시스템**: 스트리밍 처리, race condition 방지 잠금 메커니즘
- **API 관리**: 토큰 추적 및 컨텍스트 자동 관리
- **에러 처리**: 자동 재시도 및 사용자 확인 프로세스
- **상태 관리**: Global/Workspace/Secrets 다중 저장소, 인스턴스 동기화
- **실시간 통신**: Controller ↔ ExtensionStateContext 패턴

## 개발 환경 및 빌드

**필수 요구사항**: Node.js 18+, npm/yarn, VSCode, Git

**개발 환경 설정**:
```bash
git clone https://github.com/aicoding-caret/caret.git
cd caret
npm install
cd webview-ui && npm install && cd ..
npm run protos          # Protocol Buffer 컴파일 (필수)
npm run compile         # TypeScript 컴파일
# VSCode에서 F5로 개발 모드 실행
```

**주요 빌드 명령어**:
```bash
npm run protos          # Protocol Buffer 컴파일
npm run compile         # TypeScript 컴파일
npm run build:webview   # React 빌드
npm run watch           # 개발용 watch 모드
npm run package         # VSIX 패키지 생성
```

## 개발 프로세스

**Git 커밋 컨벤션**:
```
[type]: [description]
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드/설정 변경
```

**상태 관리**: CaretProvider가 Cline의 WebviewProvider를 확장하며, Cline 패턴을 준수하여 최소 확장으로 기존 기능 활용

**도구 통합**: Cline의 기존 통합(`src/integrations/`), API 프로바이더(`src/api/providers/`), 체크포인트(`src/integrations/checkpoints/`) 활용

## AI 작업 프로토콜

**작업 시작 프로토콜 (CRITICAL)** - AI 어시스턴트는 다음 순서를 **반드시** 준수:
1. **사용자 식별**: `git config user.name`으로 현재 사용자 확인
2. **날짜 확인**: OS별 명령어로 현재 날짜 확인  
3. **작업 로그 확인/생성**: `caret-docs/work-logs/{username}/{date}.md`
4. **관련 작업 문서 식별**: `caret-docs/tasks/task-status.md` 참조
5. **문서 검토**: 계획서, 체크리스트, 보고서 메타적 검토
6. **개발자 보고**: 문서 검토 완료 및 작업 준비 상태 보고

**핵심 개발 원칙**:
- **품질 우선**: 속도보다 정확성과 품질 우선
- **테스트 필수**: 모든 테스트 통과, 실패 시 근본 원인 해결
- **문제 회피 금지**: 임시 방편이나 '나중에 수정' 접근 금지
- **기술 부채 방지**: 처음부터 올바른 구현
- **완전성 추구**: 부분적/불완전한 상태로 작업 종료 금지
- **검증 우선**: 코드 변경 후 반드시 컴파일, 테스트, 실행 검증
- **CARET 주석 필수**: Caret 수정 시 반드시 CARET MODIFICATION 주석 추가

**Phase 기반 작업 설계**:
- **계획 원칙**: 모든 작업을 명확한 Phase 단위로 분할, 각 Phase는 독립적 완료 가능
- **실행 원칙**: Phase 시작 전 관련 가이드 문서 및 원칙 재확인

**파일 수정 전 필수 체크리스트**:
1. **Cline 원본 파일인가?** (`src/`, `webview-ui/`, `proto/`, `scripts/`, `evals/`, `docs/`, `locales/`)
2. **백업 생성했는가?** (`{파일명-확장자}.cline`)
3. **CARET MODIFICATION 주석 추가했는가?**
4. **최소 수정 원칙 지켰는가?** (1-3라인 이내)
5. **주석처리하지 않고 완전 대체했는가?**

**자가 진단 및 개선 요청**: 원칙 위반이나 불명확한 지침 발견 시 작업 중단하고 가이드 개선 요청

**개발 방식 변화 시 가이드 업데이트 (MANDATORY)**:
- **변화 감지**: 새로운 개발 패턴, 도구, 방법론 도입 시 즉시 문서화
- **가이드 동기화**: 실제 구현과 문서 간 불일치 발견 시 우선적 업데이트
- **경험 축적**: 문제 해결 과정에서 얻은 인사이트를 가이드에 반영
- **실무 반영**: 이론적 내용보다 실제 작업에서 검증된 방법론 우선
- **예시**: 통합테스트 방식 변화(모킹 → 실제 빌드 검증), 모듈 시스템 호환성 문제 해결 등

## 문서화 시스템

**문서 구조 및 표준화 (2025-01-21 완료)**:
- **MDX 형식**: 모든 개발 문서 `.mdx`로 통일 완료
- **통합 완료**: UI-to-Storage-Flow 관련 10개 분할 문서를 1개로 통합
- **실제 코드 일치**: 모든 경로/예시가 실제 코드베이스와 일치하도록 수정
- **프레임워크 업데이트**: Jest → Vitest 변환 완료
- **불필요한 문서 정리**: 작업 문서/검토 리포트 등 정리 완료
- **Cline 패턴 통합**: 아키텍처 가이드에 Cline 기술 패턴 통합

**디렉토리 구성**:
```
caret-docs/
├── development/              # 개발 가이드 (.mdx 표준화 완료)
├── guides/                   # 작업 방법론
├── tasks/                    # 작업 문서
└── work-logs/               # 사용자별 작업 로그
```

**핵심 문서**:
- **개발 가이드**: `./development/index.mdx`
- **아키텍처 가이드**: `./development/caret-architecture-and-implementation-guide.mdx`
- **테스트 가이드**: `./development/testing-guide.mdx` (Vitest 기반)
- **로깅 가이드**: `./development/logging.mdx`

**문서 작성 표준**:
- **용어 일관성**: Caret은 '^' 기호 (당근🥕 아님)
- **경로 정확성**: 실제 코드베이스와 정확히 일치
- **예시 코드**: 실제 작동하는 코드만 포함
- **MDX 형식**: 모든 기술 문서는 `.mdx` 형식

**작업 문서 형식**:
```
작업 번호: 3자리 숫자 (001, 002, ...)
계획서: {task-number}-01-plan-{task-name}.md
체크리스트: {task-number}-02-action-checklist-{task-name}.md
보고서: {task-number}-03-report-{task-name}.md
```

## 테스트 및 품질 관리

**테스트 프레임워크**: Vitest (업데이트 완료)

**기본 명령어**:
```bash
npm test                    # 모든 테스트 실행
npm run test:coverage      # 커버리지 포함 테스트
npm run test:watch         # Watch 모드
```

**테스트 작성 표준**:
```typescript
import { describe, it, expect, vi } from 'vitest'
describe('Caret 기능', () => {
  it('should 기대 동작 when 조건', () => {
    // Arrange, Act, Assert 패턴
  })
})
```

**품질 표준**:
- **Caret 전용 코드**: 100% 테스트 커버리지 목표
- **TDD 방법론**: Red-Green-Refactor 사이클
- **테스트 우선**: 기능 구현 전 테스트 작성

**로깅 시스템 (실제 구현 반영)**:
- **CaretLogger (백엔드)**: `caret-src/utils/caret-logger.ts`
- **WebviewLogger (프론트엔드)**: `webview-ui/src/caret/utils/webview-logger.ts`

## 프로젝트 관리

**스크립트 관리**: Caret 스크립트는 `caret-scripts/`에 위치 (Cline `scripts/`와 분리)

**주요 스크립트**:
```bash
node caret-scripts/caret-coverage-check.js    # 커버리지 확인
node caret-scripts/sync-caretrules.js         # 룰 파일 동기화
node caret-scripts/test-report.js             # 테스트 리포트 생성
```

**업스트림 머징**: Cline 업데이트 통합 프로세스 - 변경사항 확인, 충돌 해결(`src/` 디렉토리), 호환성 검증, 문서 업데이트

**규칙 파일 관리**: 
- **마스터 파일**: `caret-docs/caretrules.ko.md` (한국어 템플릿)
- **자동 동기화**: AI가 마스터 파일 변경 시 JSON 파일들(`.caretrules`, `.windsurfrules`, `.cursorrules`) 자동 동기화

## 핵심 참조 파일

**설정 파일**: `.caretrules`, `caret-docs/caretrules.ko.md`, `caret-docs/development/index.mdx`
**진입점**: `caret-src/extension.ts`, `caret-src/core/webview/CaretProvider.ts`, `src/extension.ts`
**프론트엔드**: `webview-ui/src/App.tsx`, `webview-ui/src/context/ExtensionStateContext.tsx`, `webview-ui/src/caret/`

## 최근 업데이트 (2025-01-21)

**완료된 주요 개선사항**:
1. **문서 표준화**: 모든 development 문서 `.mdx` 형식으로 통일
2. **문서 통합**: UI-to-Storage-Flow 분할 문서 10개 → integrated 1개로 통합
3. **실제 코드 일치**: 모든 경로/예시가 실제 코드베이스와 정확히 일치
4. **테스트 프레임워크**: Jest → Vitest 완전 전환
5. **로깅 시스템**: CaretLogger, WebviewLogger 실제 위치 반영
6. **불필요한 문서 정리**: 작업 문서, 검토 리포트 등 정리
7. **링크 무결성**: README.md 깨진 링크 수정
8. **빌드 시스템**: Protocol Buffer 컴파일 단계 추가
9. **Cline 기술 패턴**: Task 실행, 스트리밍, 상태 관리, API 관리 패턴 통합

**개선 효과**:
- **실무 정확성**: 문서와 실제 코드 100% 일치
- **개발 효율성**: 통합된 문서로 정보 접근성 향상
- **표준화**: MDX 기반 일관된 문서 시스템 구축
- **테스트 일관성**: Vitest 기반 통일된 테스트 환경
- **기술 패턴 활용**: Cline의 검증된 아키텍처 패턴 적극 활용

**마지막 업데이트**: 2025-01-21 - Fork 기반 아키텍처 완성 및 문서 시스템 표준화 완료
