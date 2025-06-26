# Task #003: 시스템 프롬프트 복원 (마스터)

**작업 기간**: 4일 (각 서브태스크 1일씩)  
**담당자**: luke  
**우선순위**: 🚨 **긴급 (Critical)**  
**전체 예상 시간**: 12시간

## 🎯 작업 개요

### 목표
- 과거에 존재했던 시스템 프롬프트 관리 기능을 현재의 변경된 Cline 아키텍처에 맞게 복원하고 개선한다
- 사용자가 AI 에이전트의 시스템 프롬프트를 커스터마이징할 수 있도록 기능 제공

### 배경
- **원래 목표**: 커스텀 시스템 프롬프트 템플릿 관리 및 적용 기능 복원
- 이전 프로젝트는 /caret-zero 폴더에 위치함
  * 실제 프로젝트는 root에 있으므로 같은 파일들이 검색되므로 혼동 주의
- 옮겨와야 하는 기능들: caret-zero\src\core\prompts
- 고려해야 할 점: caret-zero는 현재의 cline보다 이전 버전을 기준으로 작성하였음
  * 따라서 현재 cline 최신 소스의 프롬프트를 제대로 100% 커버리지하는지 확인이 필요함
  * claude4.ts, claude4-experimental.ts 등 모델별 특화 프롬프트 지원 방식 고려 필요

### 작업 방법
* 코드 현황 분석 후 서브 태스크를 만들고 진행한다
* 신규 아키텍처와 개발가이드를 따른다. cline의 백업, 혹은 caret-src 폴더의 소스 분리와 상속
* TDD를 수행한다

## 🗂️ 서브태스크

### 1. [003-01] 시스템 프롬프트 복원 계획
- **상태**: ✅ 완료
- **담당자**: luke
- **예상 시간**: 3시간
- **문서**: [003-01-system-prompt-restoration-plan.md](./003-01-system-prompt-restoration-plan.md)
- **설명**: 코드베이스 분석 및 복원 전략 수립, 서브태스크 정의 및 작업 계획 문서화

### 2. [003-02] 템플릿 및 섹션 파일 이전
- **상태**: 🔄 진행 예정
- **담당자**: luke
- **예상 시간**: 3시간
- **설명**: 
  - `caret-assets/templates/prompts/` 디렉토리 구조 생성
  - caret-zero에서 JSON/MD 템플릿 파일들 이전
  - 테스트: 템플릿 파일 로딩 검증

### 3. [003-03] 프롬프트 관리 코드 구현
- **상태**: 🔄 진행 예정
- **담당자**: luke
- **예상 시간**: 3시간
- **설명**:
  - `CaretPromptManager` 클래스 구현 
  - 템플릿 로딩 및 프롬프트 생성 로직 구현
  - Cline 원본 코드와의 통합 (필요시 최소 수정)

### 4. [003-04] 프롬프트 커스터마이제이션 UI 구현
- **상태**: 🔄 진행 예정
- **담당자**: luke
- **예상 시간**: 3시간
- **설명**:
  - 웹뷰 UI에 프롬프트 관리 패널 추가
  - 템플릿 선택 및 커스터마이징 기능 구현 
  - 설정 저장 및 로딩 기능 연동

## 🔍 구현 세부사항

### 시스템 프롬프트 관리 클래스 구조

```typescript
// caret-src/core/prompts/CaretPromptManager.ts
import { SYSTEM_PROMPT as ClINE_SYSTEM_PROMPT } from '../../../src/core/prompts/system';
import path from 'path';
import fs from 'fs/promises';

export class CaretPromptManager {
  private templatesPath: string;
  private currentTemplateName: string;
  
  constructor(extensionPath: string) {
    this.templatesPath = path.join(extensionPath, 'caret-assets', 'templates', 'prompts');
    this.currentTemplateName = 'default';
  }
  
  // 템플릿 목록 가져오기
  async getAvailableTemplates(): Promise<string[]> {
    // 구현
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
