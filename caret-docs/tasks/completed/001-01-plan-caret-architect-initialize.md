# Task #001: 캐럿 아키텍처 초기화 및 설정

## 📋 작업 개요
**목표**: Caret 프로젝트의 기본 아키텍처를 초기화하고 Cline 기반 Fork 구조를 안정화

## 🎯 작업 배경
- 기존 서브모듈 + 오버레이 방식에서 Fork 기반 통합 방식으로 전환 완료
- 현재 `caret-src/`에 잘못된 경로 참조로 인한 빌드 오류 발생
- Cline의 구조를 정확히 파악하여 안정적인 확장 방법 수립 필요

## 🔍 **Cline 구조 분석 결과**

### ✅ **확인된 Cline 핵심 구조**

#### **1. 빌드 시스템**
- **esbuild**: 메인 번들러 (TypeScript → JavaScript)
- **Vite**: webview-ui 전용 번들러 (React → JavaScript)
- **Protocol Buffers**: gRPC 통신용 (protoc-gen-ts)
- **Path Aliases**: `@core`, `@shared`, `@api` 등 경로 별칭 시스템

#### **2. 핵심 아키텍처**
```
src/
├── extension.ts           # VSCode 확장 진입점
├── core/
│   ├── webview/          # WebviewProvider (UI 관리)
│   ├── controller/       # Controller (비즈니스 로직)
│   ├── task/             # Task (AI 작업 실행)
│   └── prompts/          # 프롬프트 시스템
├── shared/               # 공통 타입/유틸리티
└── api/                  # AI 프로바이더들

webview-ui/               # React 프론트엔드 (독립 빌드)
├── src/App.tsx          # 메인 React 앱
├── vite.config.ts       # Vite 설정
└── package.json         # 독립 의존성
```

#### **3. 의존성 관계**
- **강한 결합**: WebviewProvider → Controller → Task
- **gRPC 통신**: 백엔드 ↔ 프론트엔드 실시간 통신
- **상대 경로 참조**: 모든 모듈이 상대 경로로 긴밀하게 연결

### ⚠️ **현재 문제점들**

#### **1. 즉시 해결 필요 (빌드 차단)**
- **Protocol Buffer 오류**: `protoc-gen-ts_proto` 실행 실패
- **잘못된 경로 참조**: `caret-src/`에서 `../../../cline/` 경로 사용
- **TypeScript 컴파일 오류**: 존재하지 않는 모듈 import

#### **2. 아키텍처 검증 결과**

**✅ 우리 계획의 타당성 확인:**
1. **Fork 기반 접근법**: ✅ **올바른 선택**
   - Cline의 강한 결합 구조상 오버레이 방식은 실제로 복잡함
   - 상대 경로 참조가 많아 depth 차이로 인한 문제 발생 가능성 높음

2. **백엔드 완전 분리**: ✅ **기술적으로 가능**
   - `src/` 구조를 그대로 활용하여 안정성 확보
   - `caret-src/`는 최소한의 진입점만 구현

3. **프론트엔드 기존 활용**: ✅ **최적의 선택**
   - Vite 빌드 시스템이 복잡하므로 건드리지 않는 것이 안전
   - `webview-ui/src/components/caret/` 방식으로 확장 가능

## 🏗️ **확정된 Caret 아키텍처**

### **최종 결정된 구조**
```
src/                      # Cline 원본 (건드리지 않음)
├── extension.ts          # Cline 메인 진입점
├── core/                 # Cline 핵심 로직
└── ...

caret-src/                # Caret 전용 (최소한의 진입점)
├── extension.ts          # Caret 진입점 (src/ 모듈 활용)
└── core/
    └── webview/
        └── CaretProvider.ts  # Cline WebviewProvider 확장

webview-ui/               # Cline 빌드 시스템 그대로 활용
├── src/
│   ├── components/
│   │   ├── (Cline 원본)
│   │   └── caret/        # Caret 전용 컴포넌트
│   ├── utils/
│   │   └── caret-*.ts    # Caret 전용 유틸리티
│   └── App.tsx           # 라우팅으로 Caret 모드 분기
└── (Vite 설정 그대로 유지)
```

### **핵심 원칙**
1. **Cline 코드 보존**: `src/`, `webview-ui/` 원본 유지
2. **최소 진입점**: `caret-src/extension.ts`에서 Cline 모듈 활용
3. **점진적 확장**: 필요한 기능만 Caret 전용으로 구현

## 📊 **기존 문서 업데이트 계획**

### **수정 필요한 문서들**
1. **아키텍처 가이드**: 오버레이 → Fork 기반으로 전면 수정
2. **개발 가이드**: 실제 구현 방법 업데이트
3. **룰 파일들**: 현실적인 개발 방향 반영

### **검증된 구현 방향**
- ✅ **기술적 타당성**: Cline 구조 분석 완료
- ✅ **빌드 호환성**: 기존 시스템 활용으로 안정성 확보
- ✅ **확장성**: 점진적 기능 추가 가능
- ✅ **유지보수성**: 업스트림 머징 용이

## 🚀 **구현 우선순위**

### **Phase 1: 빌드 시스템 복구** (최우선)
1. Protocol Buffer 오류 해결
2. `caret-src/` 경로 문제 수정
3. 기본 컴파일 성공 확인

### **Phase 2: 기본 기능 구현**
1. Caret 전용 진입점 구현
2. 기본 WebView 표시 확인
3. 핵심 기능 동작 검증

### **Phase 3: 확장 기능 개발**
1. Caret 고유 기능 추가
2. UI 컴포넌트 확장
3. 한글 지원 등 특화 기능

## 📋 **성공 기준**
- [ ] `npm run compile` 성공
- [ ] VSCode에서 Caret 확장 로드 성공
- [ ] 기본 WebView 표시 확인
- [ ] Cline 기능과의 호환성 확인

# 프로젝트 구조의 목표
 ## AI와의 협업 용이성 확보
   - work-logs/{developer_name}/{developer_name}-YYYY-MM-DD.md 와 caret-docs/tasks/task-status.md를 '작업로그'와 '작업문서' 기반으로 AI와 함께 개인별 task를 진행 할 수 있어야 함.
   - (for AI).caretrules.ko.md 는 캐럿, 커서, 윈드서퍼, 클라인의 룰 json 파일과 쌍으로 동기화 하며, 해당 문서는 AI의 기본 룰로 기본적으로 알아야 되는 프로젝트 배경 지식과 작업성격 별로 참고해야 하는 문서의 인덱스 (caret-docs/development) 로 동작하게 한다.
      - (for AI).caretrules.ko.md 는 캐럿, 커서, 윈드서퍼, 클라인의 룰 json 파일과 쌍으로 동기화 하며, 해당 문서는 AI의 기본 룰로 기본적으로 알아야 되는 프로젝트 배경 지식과 작업성격 별로 참고해야 하는 문서의 인덱스 (caret-docs/development) 로 동작하게 한다.
   

 ## Cline과의 머징 용이성 확보
  ### Cline의 소스 수정의 최소화
   1. 추가를 최 우선으로
     신규 기능/자료는 가능한 새 파일을 추가 하여 작성하며 아래의 위치에 만든다.
      - 문서 : /caret-docs 
         * docs는 cline고유의 문서들임
      - 백엔드 소스 : /caret-src
         * src는 cline 고유의 백엔드 소스 위치
      - 프론트엔드 소스 : /webview-ui cline 고유의 포른트앤드 소스 위치에 사용한다.
         * 신규 파일은 caret-{파일명}.확장자 말머리를 붙여 caret의 소스임을 구분한다.
         * 가능한 컴포넌트를 만들고 삽입하여 원본 소스의 수정을 최소화 한다.
      
   2. 교체와 백업 원칙
     - 교체 되는 파일은 {원본 파일명-원본확장자}.cline 파일로 복사 하여 머징 후 비교를 용이하게 한다.
     - 코드/문서 블럭의 삽입과 삭제 
        * 코드/문서 블럭은 정해진 규칙  caret-docs\development\caret-architecture-and-implementation-guide.md 의 주석 규칙에 따라 Caret의 삽입 영역을 알 수 있도록 한다.   
        * cline코드를 대체하는 경우 주석 처리를 하거나 남겨놓지 않는다. AI와 개발시 사용하지 않는 코드의 흔적을 남기는 것은 개발을 어렵게 만든다.
     - 교체된 파일에 대한 정보는 caret-docs\guides\upstream-merging.md 에 표로 관리하여 머징에 용이하게 한다.
   
   3. 검증 및 테스트 구조 확립
     - 신규 기능은 테스트 커버리지 100%를 목표로 하여 Cline의 변경에 민감하게 반응할 수 있게하며, AI의 기능 검증에 문제가 없게 하며 AI가 모든 접근이 가능하게 개발한다. (Cline 소스는 검증 안한다.) 
     
  
 
# 해야 할일 (우선순위 조정됨)
  1. **아키텍처 전략 고민 및 분석**
    - 1.1. **오버레이 구조 관련 코드 분석:** 규칙 파일(`.caretrules`, `caretrules.ko.md` 등)에 명시된 "오버레이 구조"의 실제 코드 구현 상태 분석 (Caret과 Cline 간의 연관성, 파일 단위 오버레이 방식 등).
       - 대상 디렉토리: `caret-src/`, `caret-webview-ui/`, `cline/` (참조용), `cline-patch/`
       - 중점 분석 파일 예시 (규칙 기반): `caret-src/extension.ts`, `caret-webview-ui/src/App.tsx` 등
  2. 룰 점검
    - 2.1. 마스터 한글 템플릿(`caret-docs/caretrules.ko.md`) 점검 완료 (날짜 자동화 규칙 추가, `.clinerules` 제외, 자체 경로 수정 완료 - 2025-06-17)
    - 2.2. `.caretrules` JSON 파일 점검 완료 (마스터 템플릿 경로 수정, `.clinerules` 제외, AI 프로토콜 및 경로 동기화 완료 - 2025-06-17)
    - 2.3. `.cursorrules` JSON 파일 점검 (진행 중단, 오버레이 분석 후 재개):
        - 마스터 템플릿 경로 참조 확인 및 필요시 수정
        - `.clinerules` 동기화 대상에서 제외
        - AI 프로토콜 및 경로 동기화
        - 마스터 템플릿과의 내용 동기화 확인
    - 2.4. `.windsurfrules` JSON 파일 점검:
        - 마스터 템플릿 경로 참조 확인 및 필요시 수정
        - `.clinerules` 동기화 대상에서 제외
        - AI 프로토콜 및 경로 동기화
        - 마스터 템플릿과의 내용 동기화 확인
  3. 개발 가이드 문서 점검
    - 위의 구조대로 개발할 수 있도록 문서를 점검한다.
  4. 웰컴페이지 개발
    - 로깅, 테스트를 갖춘 환영 페이지 개발

 ## 작업현황
   - 현재 git 최신 버전을 받았음.
   - **룰 점검 진행 상황 (2025-06-17):**
     - 마스터 한글 템플릿 (`caret-docs/caretrules.ko.md`) 수정 완료:
       - AI 작업 프로토콜에 OS별 날짜 자동 확인 기능 추가.
       - `.clinerules` 동기화 대상에서 제외.
     - `.caretrules` JSON 파일 수정 완료:
       - 마스터 템플릿 경로 수정 (`caret-docs/caretrules.ko.md`로 변경).
       - 동기화 대상에서 `.clinerules` 제외.
       - AI 작업 프로토콜 (날짜 자동화, 경로) 및 `work_logs` 경로 등을 마스터 템플릿과 일치하도록 업데이트.
     - `.cursorrules` JSON 파일 검토 중 "오버레이 구조" 언급 확인.
   - **작업 우선순위 변경 (2025-06-17, 마스터 지시):**
     - 룰 점검 작업 중, 규칙 파일 내 "오버레이 구조"의 중요성을 인지하여 관련 코드 분석을 우선 진행하기로 결정함.
     - 이에 따라 "해야 할일" 목록의 순서가 위와 같이 조정되었으며, 다음 작업으로 "1.1. 오버레이 구조 관련 코드 분석"을 진행할 예정임.
   - **기존 발견 사항 (룰 점검 초기):**
     - **`.clinerules` 구조:** `.clinerules`는 JSON 파일이 아닌 디렉토리로 존재하며, 내부에 `cline-overview.md` (Cline 아키텍처 문서) 포함. 동기화 대상에서 잠정 제외 결정은 유지.
     - **마스터 한글 템플릿 경로 불일치:** 템플릿 파일 자체 및 JSON 파일들에서 과거 경로(`docs/caretrules.ko.md`)로 참조하던 것을 올바른 경로(`caret-docs/caretrules.ko.md`)로 수정하는 작업 진행 중.
   - 현재 `caret-docs/development/caret-architecture-and-implementation-guide.md` 의 가이드는 이전에는 cline을 fork한 소스를 별도 서브 모듈로 두고 최소의 수정으로 진행하는 방향으로 하려 했었으나 소스들이 상대경로로 참조하고 있는 상태에서 depth가 다른 caret 소스와의 상호 소통이 어렵고, 빌드 설정이 복잡해져서 fork기반의 새 프로젝트로 합치기로 함
     따라서 해당 문서와 개발 문서의 대대적인 수정이 필요함. 혼동하지 않도록 수정 필요
   - 이전 오버레이 전략으로 구현했던 백엔드 소스는 caret-src에 있다. (예전 방식이므로 점검 필요)
   - 이전 오버레이 구현하던 프론트 소스는 아래의 위치에 있다.
      : \webview-ui\src\components\welcome\WelcomeView-tsx.cline -> \webview-ui\src\components\welcome\WelcomeView.tsx 로 교체
       * \webview-ui\src\locale\ : 언어신규
       * \webview-ui\src\caret\utils\webview-logger.ts  로거
       * \webview-ui\src\caret\utils\i18n.ts 다국어
   



 