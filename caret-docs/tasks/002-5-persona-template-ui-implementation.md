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

### 범위
- ✅ **포함**: PersonaTemplateSelector 컴포넌트 완성
- ✅ **포함**: 페르소나 선택 시 커스텀 인스트럭션 자동 설정
- ✅ **포함**: 다국어 페르소나 정보 표시
- ❌ **제외**: 새로운 페르소나 템플릿 추가

### 주요 산출물
- 완전히 기능하는 PersonaTemplateSelector 컴포넌트
- 페르소나별 커스텀 인스트럭션 자동 설정 시스템
- 다국어 지원 페르소나 UI

## 📚 작업 전 숙지사항 (AI 필수)
- `caret-assets/template_characters/template_characters.json`: 페르소나 데이터 구조
- `caret-assets/template_characters/*.png`: 페르소나 이미지 리소스
- `webview-ui/src/caret/locale/`: 다국어 지원 시스템
- `caret-src/core/webview/CaretProvider.ts`: 백엔드 메시지 핸들러

## ✅ 실행 체크리스트

### Phase 1: 리소스 분석 및 설계
- [ ] **1.1**: template_characters.json 구조 완전 분석
- [ ] **1.2**: 4개 페르소나 (sarang, ichika, cyan, ubuntu) 데이터 확인
- [ ] **1.3**: 다국어 customInstruction 구조 파악
- [ ] **1.4**: PersonaTemplateSelector 컴포넌트 인터페이스 설계

### Phase 2: TDD 기반 UI 구현
- [ ] **2.1**: PersonaTemplateSelector 컴포넌트 테스트 작성
- [ ] **2.2**: 페르소나 목록 표시 기능 구현
- [ ] **2.3**: 페르소나 선택 인터페이스 구현
- [ ] **2.4**: 페르소나 상세 정보 표시 (다국어)

### Phase 3: 커스텀 인스트럭션 연동
- [ ] **3.1**: 페르소나 선택 시 customInstruction 추출
- [ ] **3.2**: CaretProvider에 페르소나 설정 메시지 핸들러 추가
- [ ] **3.3**: 선택된 페르소나의 customInstruction을 시스템에 적용
- [ ] **3.4**: Rules UI와의 연동 및 새로고침

### Phase 4: 통합 테스트 및 검증
- [ ] **4.1**: 4개 언어에서 페르소나 정보 정상 표시 확인
- [ ] **4.2**: 페르소나 선택 시 커스텀 인스트럭션 정상 적용 확인
- [ ] **4.3**: WelcomeView에서 페르소나 선택 플로우 통합 테스트
- [ ] **4.4**: 기존 기능 회귀 없음 확인

## 🔧 기술적 제약사항
- Cline 원본 파일 수정 시 백업 필수 (CaretProvider 수정)
- CARET MODIFICATION 주석 추가 필수
- 최소 수정 원칙 (1-3라인 이내 권장)
- 기존 i18n 시스템 패턴 준수
- TDD 원칙 준수 (테스트 먼저 작성)

## 📝 진행 노트 (실시간 업데이트)
- 사용 가능한 페르소나: sarang (기본), ichika, cyan, ubuntu
- 각 페르소나별 3개 이미지: 기본, thinking, illust
- 완전한 다국어 customInstruction 데이터 확인
- WelcomeView에 이미 PersonaTemplateSelector 통합 준비됨

## ✅ 완료 기준
- [ ] PersonaTemplateSelector 컴포넌트 완전 구현
- [ ] 4개 페르소나 모두 선택 가능
- [ ] 선택한 페르소나의 customInstruction 자동 적용
- [ ] 4개 언어(ko, en, ja, zh) 모두 정상 작동
- [ ] WelcomeView에서 페르소나 선택 플로우 완전 통합
- [ ] 테스트 통과 확인
- [ ] 기존 기능 회귀 없음 확인

## 🎁 기대 효과
- Task 002의 원래 목표 완전 달성
- 사용자 맞춤형 AI 에이전트 경험 제공
- 다국어 지원을 통한 글로벌 사용자 지원
- Caret의 차별화된 페르소나 기능 완성 