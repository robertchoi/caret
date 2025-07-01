# Task #004: docs + caret-docs 통합 문서화 시스템 구축 계획 (Docusaurus i18n)

**작업 기간**: 2025년 1월 21일 업데이트  
**담당자**: luke  
**우선순위**: 높음  
**관련 작업**: Task #001 (아키텍처 초기화)

## 📋 **작업 개요**

기존 Cline docs/ (Mintlify 기반)를 **Docusaurus로 전환**하면서 caret-docs/와 통합하여 **단일 문서 시스템**을 구축합니다. **최소화 수정 법칙**을 준수하여 기존 구조를 최대한 보존합니다.

### **현재 상황 분석**
- **docs/**: Mintlify 기반, 완전한 영문 사용자 문서 (getting-started, features, provider-config 등) → **Docusaurus 전환**
- **caret-docs/**: MDX 기반, 한국어 개발 문서 (development, guides, tasks 등) → **docs/에 통합**

### **목표**
1. **docs/ Mintlify → Docusaurus 전환** (최소 수정)
2. **caret-docs/ → docs/ 통합** (구조 보존)
3. **Docusaurus i18n 다국어 지원**: 한국어/영어/일본어/중국어
4. **Caret 브랜딩 적용**: 점진적 브랜딩 변경
5. **도메인 연결**: `https://docs.caret.team`
6. **기존 URL 구조 보존**: SEO 및 링크 호환성 유지

## 🎯 **상세 계획**

### **Phase 1: Docusaurus 환경 구축**
- [ ] **새로운 docs-new/ 디렉토리 생성**: Docusaurus 초기화
- [ ] **다국어 설정 (i18n) 구성**: 한국어/영어/일본어/중국어
- [ ] **Caret 테마 및 브랜딩 설정**: 로고, 색상, 네비게이션
- [ ] **빌드 시스템 통합**: GitHub Actions 배포 설정

### **Phase 2: 기존 Cline 문서 내용 마이그레이션**
- [ ] **docs/ → docs-new/ 내용 이전**:
  ```
  docs-new/
  ├── getting-started/          # Cline 내용 → Caret 브랜딩
  ├── features/                 # Cline 기능 설명 → Caret 기능
  ├── provider-config/          # API 설정 가이드
  ├── enterprise-solutions/     # 엔터프라이즈 솔루션
  ├── mcp/                      # MCP 서버 설정
  └── running-models-locally/   # 로컬 모델 실행
  ```
- [ ] **Mintlify → Docusaurus MDX 변환**: 문법 및 구조 변경
- [ ] **모든 "Cline" → "Caret" 브랜딩 변경**

### **Phase 3: Caret 개발 문서 통합**
- [ ] **새로운 섹션 추가**:
  ```
  docs-new/
  ├── development/              # caret-docs에서 이전
  │   ├── caret-architecture-and-implementation-guide.mdx
  │   ├── component-architecture-principles.mdx
  │   ├── testing-guide.mdx
  │   └── locale.mdx
  ├── guides/                   # caret-docs에서 이전
  │   ├── ai-work-method-guide.mdx
  │   └── upstream-merging.mdx
  └── api/                      # 새로 생성
      ├── setup-guide.mdx       # 웰컴 페이지 연동
      └── subscription.mdx      # Caret 구독 서비스
  ```
- [ ] **네비게이션 구조 설계**: 사용자/개발자 구분
- [ ] **중복 내용 조정**: 일관성 있는 구조 구축

### **Phase 4: 다국어 번역 시스템 구축**
- [ ] **Docusaurus i18n 설정**: 4개 언어 지원
- [ ] **기존 영문 사용자 문서 번역**:
  - getting-started → 시작하기
  - features → 기능
  - provider-config → 프로바이더 설정
- [ ] **Caret 개발 문서 다국어 버전**:
  - 한국어 (기본) → 영어/일본어/중국어 번역
- [ ] **번역 워크플로우 구축**: GitHub Actions 자동화

### **Phase 5: API 도움말 페이지 및 연동**
- [ ] **API 설정 가이드 페이지**: `/api/setup-guide`
- [ ] **웰컴 페이지 연동**: `https://docs.caret.team/api/setup-guide`
- [ ] **Caret 구독 서비스 안내**: `/api/subscription`
- [ ] **프로바이더별 상세 가이드**: OpenAI, Anthropic, Gemini 등

### **Phase 6: 배포 및 도메인 연결**
- [ ] **GitHub Pages 배포**: docs-new/ → docs/ 교체
- [ ] **`docs.caret.team` 도메인 연결**
- [ ] **CI/CD 자동 배포**: 다국어 빌드 포함
- [ ] **SEO 최적화**: Caret 키워드, 메타 태그

## 🔄 **마이그레이션 전략**

### **단계별 교체 방법**
1. **병렬 개발**: docs-new/에서 Docusaurus 구축
2. **내용 검증**: 기존 docs/ 내용과 대조 확인
3. **테스트 배포**: 임시 도메인에서 테스트
4. **한번에 교체**: docs/ → docs-old/, docs-new/ → docs/

### **Mintlify → Docusaurus 변환 요소**
- **설정 파일**: docs.json → docusaurus.config.js
- **네비게이션**: navigation.groups → sidebars.js
- **MDX 문법**: Mintlify 전용 → 표준 MDX
- **테마**: Mintlify 테마 → Docusaurus 커스텀 테마

## 🔗 **관련 파일**
- `docs-new/` (신규 생성 - Docusaurus)
- `docs/` (기존 Mintlify - 내용 참조 후 교체)
- `caret-docs/development/` (통합 대상)
- `caret-docs/guides/` (통합 대상)
- `webview-ui/src/components/welcome/WelcomeView.tsx` (연동 대상)

## 📚 **참고 자료**
- [Docusaurus 공식 문서](https://docusaurus.io/)
- [Docusaurus i18n 가이드](https://docusaurus.io/docs/i18n/introduction)
- [GitHub Pages 배포](https://docusaurus.io/docs/deployment#deploying-to-github-pages)

## ⚠️ **주의사항**
1. **기존 docs/ 백업**: 완전한 백업 후 작업
2. **SEO 연속성**: URL 구조 최대한 유지
3. **번역 품질**: 전문 용어 일관성 확보
4. **무료 서비스 한계**: GitHub Pages 용량 제한 고려
5. **업스트림 호환성**: 향후 Cline 문서 업데이트 반영 전략

## 💰 **비용 효율성**
- **Mintlify**: 월 $120+ (Pro 플랜)
- **Docusaurus + GitHub Pages**: **완전 무료** ✅
- **도메인 비용만**: docs.caret.team 연결 비용만 발생 