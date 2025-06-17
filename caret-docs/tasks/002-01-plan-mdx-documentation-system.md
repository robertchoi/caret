# Task #002: MDX 문서 시스템 구축 및 통합

## 📋 작업 개요
**목표**: Caret 프로젝트의 문서 시스템을 MDX 기반으로 구축하여 인터랙티브하고 현대적인 문서 환경을 제공

## 🎯 작업 배경
- Task #001에서 코드 아키텍처 초기화가 완료된 후 진행
- 기존 마크다운 문서를 MDX로 전환하여 React 컴포넌트 활용
- Git은 MDX를 완벽 지원하므로 버전 관리 문제없음
- Cline 문서와 독립적으로 Caret 고유의 문서 시스템 구축

## 📊 현재 상황 분석

### ✅ 확인된 사항
- **Git MDX 지원**: 완벽한 버전 관리, diff, 머지 지원
- **기존 문서 구조**: `caret-docs/` 디렉토리에 마크다운 문서들 존재
- **도구 호환성**: VSCode MDX 확장으로 편집 가능

### ⚠️ 해결해야 할 사항
- 마크다운(.md) → MDX(.mdx) 전환 작업
- MDX 컴포넌트 라이브러리 구축
- 문서 빌드 시스템 설정
- Obsidian 호환성 (플러그인 활용)

## 🏗️ 구현 계획

### 1️⃣ **MDX 인프라 구축**
```
caret-docs/
├── components/              # 재사용 가능한 MDX 컴포넌트
│   ├── CodeBlock.tsx       # 코드 블록 컴포넌트
│   ├── Diagram.tsx         # 다이어그램 컴포넌트
│   ├── FeatureCard.tsx     # 기능 소개 카드
│   └── ComparisonTable.tsx # Cline vs Caret 비교표
├── styles/                 # MDX 스타일링
│   └── mdx-components.css
└── config/                 # MDX 설정 파일
    └── mdx.config.js
```

### 2️⃣ **문서 전환 작업**
**기존 마크다운 → MDX 변환:**
- `README.md` → `README.mdx`
- `development/*.md` → `development/*.mdx`
- `guides/*.md` → `guides/*.mdx`
- `tasks/*.md` → `tasks/*.mdx`

### 3️⃣ **인터랙티브 컴포넌트 개발**
```jsx
// 예시: 아키텍처 다이어그램 컴포넌트
<ArchitectureDiagram 
  focus="backend" 
  interactive={true}
  showOverlay={true} 
/>

// 예시: 기능 비교표
<FeatureComparison 
  cline={clineFeatures}
  caret={caretFeatures}
  highlight="new-features"
/>

// 예시: 설치 가이드
<InstallationGuide 
  platform="windows"
  showCommands={true}
/>
```

### 4️⃣ **빌드 시스템 설정**
- **개발 환경**: Next.js 또는 Docusaurus 기반
- **배포**: GitHub Pages 또는 Vercel
- **CI/CD**: GitHub Actions로 자동 빌드

## 📅 단계별 실행 계획

### **Phase 1: 기반 구축 (1-2일)**
1. MDX 프로젝트 초기화
2. 기본 컴포넌트 라이브러리 구축
3. 빌드 시스템 설정

### **Phase 2: 문서 전환 (2-3일)**
1. 핵심 문서부터 MDX 전환
2. 컴포넌트 적용 및 테스트
3. 내부 링크 및 참조 수정

### **Phase 3: 고급 기능 (2-3일)**
1. 인터랙티브 컴포넌트 개발
2. 다이어그램 및 차트 통합
3. 검색 기능 구현

### **Phase 4: 통합 및 배포 (1일)**
1. 최종 테스트 및 검토
2. 배포 환경 설정
3. 문서 가이드라인 작성

## 🎯 성공 기준

### ✅ **필수 요구사항**
- [ ] 모든 기존 문서가 MDX로 성공적으로 전환
- [ ] Git에서 MDX 파일이 정상적으로 추적됨
- [ ] 최소 5개 이상의 재사용 컴포넌트 구축
- [ ] 문서 빌드 및 배포 자동화

### 🌟 **추가 목표**
- [ ] 인터랙티브 아키텍처 다이어그램
- [ ] 실시간 코드 예제 실행
- [ ] 다국어 지원 (한글/영어)
- [ ] 검색 및 네비게이션 개선

## 🔗 관련 작업
- **선행 작업**: Task #001 (캐럿 아키텍처 초기화)
- **연관 작업**: 향후 기능 개발 시 문서 업데이트

## 📝 참고 자료
- [MDX 공식 문서](https://mdxjs.com/)
- [Git MDX 지원 확인](https://github.com/mdx-js/mdx)
- [VSCode MDX 확장](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx)
- [Obsidian MDX 플러그인](https://github.com/yuleicul/obsidian-mdx)

---
**작성일**: 2025-06-17  
**담당자**: luke  
**우선순위**: 중간 (Task #001 완료 후 진행) 