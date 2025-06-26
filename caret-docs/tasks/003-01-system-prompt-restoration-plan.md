# Task #003-01: 시스템 프롬프트 복원 계획

**작업 기간**: 1일  
**담당자**: luke  
**우선순위**: 🚨 **긴급 (Critical)**  
**예상 시간**: 3시간

## 🔍 작업 분석

### 시스템 프롬프트 관리 코드 구조 분석

#### caret-zero(기존) 시스템 프롬프트 관련 파일
- `src/core/prompts/system.ts`: 시스템 프롬프트 생성 로직
- `src/core/prompts/responses.ts`: 다양한 응답 형식 및 프롬프트 관련 함수
- `src/core/prompts/sections/`: 프롬프트 섹션 JSON/MD 파일들
- `src/core/prompts/rules/`: 프롬프트 규칙 JSON/MD 파일들

#### cline(현재) 시스템 프롬프트 관련 파일
- `src/core/prompts/system.ts`: 메인 시스템 프롬프트 생성 로직
- `src/core/prompts/model_prompts/`: 모델별 특화 프롬프트(claude4.ts, claude4-experimental.ts 등)
- `src/core/prompts/responses.ts`: 응답 형식 정의 함수들

### 최신 Cline 소스 상세 분석

시스템 프롬프트 기능 복원을 위해 현재 Cline 소스를 자세히 분석할 필요가 있습니다. 놓치기 쉬운 개선사항과 새로운 기능을 파악해야 합니다.

#### 모델별 특화 프롬프트
- 현재 Cline은 각 AI 모델에 최적화된 시스템 프롬프트를 제공합니다
- `src/core/prompts/model_prompts/` 디렉토리의 파일들 분석 필요
- 특히 `claude4.ts`, `claude4-experimental.ts` 등의 파일을 확인해 모델에 따라 어떻게 프롬프트가 달라지는지 파악
- 이러한 모델별 최적화를 Caret의 템플릿 시스템에도 반영해야 함

#### 프롬프트 섹션 구조 분석
- 최신 Cline에서 새로 추가된 섹션이 있는지 확인
- 각 섹션의 중요도와 우선순위 검토
- 섹션 간 종속성이나 상호작용 분석

#### 툴 호출 관련 프롬프트 부분
- 툴 호출 관련 프롬프트가 이전과 비교하여 어떻게 변경되었는지 분석
- 새로운 툴 정의 방식이나 호출 패턴이 있는지 확인

### 아키텍처 결정

1. **분리 방식**: 
   - `caret-src/core/prompts/` 디렉토리에 새로운 구현 코드 배치
   - Cline 원본 코드는 최소한의 수정만 적용 (필요시 백업 필수)
   - Caret 특화 템플릿과 섹션은 `caret-assets/templates/prompts/`에 배치

2. **상속 구조**:
   - `CaretPromptManager` 클래스를 만들어 Cline의 시스템 프롬프트 생성 로직을 확장
   - 기존 `SYSTEM_PROMPT` 함수를 오버라이드하여 Caret 특화 프롬프트를 주입
   - 모델별 특화 프롬프트 지원 로직을 포함하여 구현

## 🧪 TDD 및 검증 계획

### 테스트 전략

1. **단위 테스트**
   - `CaretPromptManager` 클래스의 각 메소드에 대한 단위 테스트 작성
   - 템플릿 로딩, 섹션 처리, 프롬프트 생성 등 각 기능별 테스트
   - 모듈화된 테스트로 각 구성요소 검증

2. **통합 테스트**
   - 전체 프롬프트 생성 과정 엔드투엔드 테스트
   - 다양한 모델 유형에 대한 프롬프트 생성 테스트
   - 실제 설정 파일 로딩과 프롬프트 생성 흐름 검증

3. **프롬프트 내용 검증**
   - 생성된 시스템 프롬프트 내용의 정확성 검사
   - 모든 필수 섹션이 포함되었는지 확인
   - 모델별 특화 프롬프트가 정확히 적용되는지 검증

### TDD 접근 방식

```typescript
// caret-src/tests/core/prompts/CaretPromptManager.test.ts
import { CaretPromptManager } from '../../../caret-src/core/prompts/CaretPromptManager';

describe('CaretPromptManager', () => {
  // 테스트 픽스처 설정
  let manager: CaretPromptManager;
  const mockExtensionPath = '/mock/extension/path';
  
  beforeEach(() => {
    manager = new CaretPromptManager(mockExtensionPath);
  });
  
  // 템플릿 목록 가져오기 테스트
  test('should retrieve available template list', async () => {
    // 임시 템플릿 파일 생성
    // 함수 실행
    // 결과 검증
  });
  
  // 템플릿 로딩 테스트
  test('should load template file correctly', async () => {
    // 테스트 템플릿 파일 준비
    // 함수 실행
    // 결과 검증
  });
  
  // 시스템 프롬프트 생성 테스트
  test('should generate system prompt with template', async () => {
    // 모의 템플릿 설정
    // 프롬프트 생성 함수 호출
    // 결과 프롬프트에 필수 섹션이 포함되어 있는지 검증
  });
  
  // 모델별 특화 프롬프트 테스트
  test('should apply model-specific prompt sections', async () => {
    // 테스트 모델 유형 설정
    // 프롬프트 생성
    // 모델별 특화 섹션이 포함되어 있는지 확인
  });
});
```

### 검증 지표

1. **템플릿 파일 포맷 검증**
   - JSON 형식 유효성
   - 필수 섹션 존재 여부
   - 문법적 정확성 검증

2. **생성된 시스템 프롬프트 내용 검증**
   - 필수 섹션 포함 여부 (tools, code_edit_tools, communication_style 등)
   - 모델별 특화 섹션 적용 여부
   - 포맷 및 문법 정확성

3. **통합 테스트**
   - AI 응답 품질 확인
   - 커스터마이즈된 프롬프트가 제대로 반영되는지 확인
   - UI와의 연동 정상 동작 확인

## 🔎 개발 관리 전략

작업량이 많고 복잡한 시스템 프롬프트 복원 과정에서 실수나 누락을 최소화하기 위한 전략입니다.

### 단계별 체크리스트

1. **코드 이해 체크리스트**
   - [ ] caret-zero의 시스템 프롬프트 생성 로직 완전 이해
   - [ ] 최신 Cline의 시스템 프롬프트 생성 로직 완전 이해
   - [ ] 모델별 특화 프롬프트 처리 방식 이해
   - [ ] 모든 필수 섹션 및 룰 파일 확인

2. **템플릿 이전 체크리스트**
   - [ ] `caret-assets/templates/prompts/` 디렉토리 구조 생성
   - [ ] 기본 템플릿 복사 및 변환
   - [ ] 모델별 특화 템플릿 준비 (Claude4 등)
   - [ ] 필수 섹션 및 규칙 파일 모두 이전 완료
   - [ ] 템플릿 로딩 테스트 통과

3. **코드 구현 체크리스트**
   - [ ] `CaretPromptManager` 클래스 기본 구조 구현
   - [ ] 템플릿 로딩 및 목록 조회 기능 구현
   - [ ] 프롬프트 생성 기본 로직 구현
   - [ ] 모델별 특화 프롬프트 처리 로직 구현
   - [ ] 테스트 코드 작성 및 테스트 통과

4. **UI 연동 체크리스트**
   - [ ] 웹뷰 패널에 프롬프트 관리 UI 추가
   - [ ] 템플릿 선택 기능 구현
   - [ ] 프롬프트 커스터마이징 기능 구현
   - [ ] 설정 저장 및 로딩 기능 구현
   - [ ] UI 테스트 완료

### 코드 품질 관리

1. **점진적 개발 접근**
   - 작은 단위로 나누어 개발하고 각 단계마다 테스트 진행
   - 기능별 브랜치 사용 (feature/system-prompt-template 등)
   - 변경사항 커밋 전 항상 리뷰 및 테스트 수행

2. **문서화 전략**
   - 복잡한 로직은 반드시 코드 내 주석으로 설명
   - 각 클래스와 중요 메서드에 JSDoc 스타일 문서화
   - 구현 과정과 결정사항은 작업 로그에 상세히 기록

3. **진행 상황 추적**
   - 서브태스크별 진행 상황 매일 업데이트
   - 발생한 문제점과 해결 방법 기록
   - 중요 이슈는 작업 로그에 Red/Yellow/Green으로 표시

### 우선순위 관리

1. **핵심 기능 우선**
   - 기본 템플릿 로딩 및 프롬프트 생성 → 모델별 특화 지원 → UI 연동 순으로 진행
   - 각 단계에서 최소 동작 버전(MVP) 먼저 구현 후 개선
   - 복잡한 기능은 단순 버전으로 시작하여 점진적 확장

2. **위험 요소 조기 해결**
   - 모델별 특화 프롬프트 처리 방식 등 복잡한 부분 먼저 프로토타입 제작
   - Cline 원본 코드와의 통합 지점 먼저 확인하고 전략 수립
   - 성능 병목이 예상되는 부분은 초기에 테스트

## ✅ 서브태스크

### 1. [003-01] 시스템 프롬프트 복원 계획
- 코드베이스 분석 및 복원 전략 수립
- 최신 Cline 소스 상세 분석 및 개선사항 파악
- TDD 및 검증 계획 수립
- 서브태스크 정의 및 작업 계획 문서화

### 2. [003-02] 템플릿 및 섹션 파일 이전
- `caret-assets/templates/prompts/` 디렉토리 구조 생성
- 최신 Cline 소스의 프롬프트 섹션 분석 및 비교
- caret-zero에서 JSON/MD 템플릿 파일들 이전 (최신 Cline 개선사항 반영)
- 모델별 특화 프롬프트 지원 구조 구현
- 테스트: 템플릿 파일 로딩 및 유효성 검증

### 3. [003-03] 프롬프트 관리 코드 구현
- `CaretPromptManager` 클래스 구현 
- 템플릿 로딩 및 프롬프트 생성 로직 구현
- Cline 원본 코드와의 통합 (필요시 최소 수정)

### 4. [003-04] 프롬프트 커스터마이제이션 UI 구현
- 웹뷰 UI에 프롬프트 관리 패널 추가
- 템플릿 선택 및 커스터마이징 기능 구현 
- 설정 저장 및 로딩 기능 연동

## 📝 구현 계획

### 1단계: 기본 구조 설정 (003-02)
```typescript
// caret-src/core/prompts/CaretPromptManager.ts
import { SYSTEM_PROMPT as ClINE_SYSTEM_PROMPT } from '../../../src/core/prompts/system';
import path from 'path';
import fs from 'fs/promises';

export class CaretPromptManager {
  private templatesPath: string;
  
  constructor(extensionPath: string) {
    this.templatesPath = path.join(extensionPath, 'caret-assets', 'templates', 'prompts');
  }
  
  // 템플릿 로딩 함수
  async loadTemplateFile(filename: string): Promise<string> {
    // 구현
  }
  
  // 시스템 프롬프트 생성 함수 (Cline 함수를 래핑)
  async generateSystemPrompt(/* 파라미터 */): Promise<string> {
    // 구현
  }
}
```

### 2단계: 프롬프트 생성 로직 구현 (003-03)
```typescript
// caret-src/core/prompts/index.ts
import { CaretPromptManager } from './CaretPromptManager';
import { SYSTEM_PROMPT as CLINE_SYSTEM_PROMPT } from '../../../src/core/prompts/system';

// Cline의 SYSTEM_PROMPT를 확장하는 새 함수 구현
export const SYSTEM_PROMPT = async (/* 파라미터 */) => {
  // 커스텀 템플릿을 적용한 시스템 프롬프트 생성 로직
}
```

### 3단계: UI 구현 및 연동 (003-04)
- 웹뷰에 프롬프트 관리 UI 컴포넌트 추가
- 설정 저장 및 로드 기능 연동

## 🔄 테스트 전략

1. **템플릿 파일 검증**: 
   - 템플릿 파일의 포맷 검증 (JSON, MD)
   - 필수 섹션 존재 여부 확인

2. **프롬프트 생성 검증**: 
   - 생성된 시스템 프롬프트 포맷 검증
   - 모든 필수 섹션이 포함되는지 확인

3. **통합 테스트**: 
   - 실제 AI 응답이 프롬프트에 맞게 동작하는지 확인
   - 커스터마이징이 정상 적용되는지 검증

## 📌 주의사항

1. **Cline 원본 코드 수정 최소화**:
   - 수정 전 항상 `.cline` 확장자로 백업 생성
   - 수정 시 `// CARET MODIFICATION` 주석 반드시 추가

2. **파일 위치 확인**:
   - Caret 신규 코드는 `caret-src/` 내에 위치
   - 템플릿 파일은 `caret-assets/templates/prompts/` 내에 위치

3. **하위호환성 유지**:
   - 기존 Cline 시스템 프롬프트 기능이 손상되지 않도록 주의
