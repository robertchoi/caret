# Next Session Guide - 2025-06-30

## 🎉 Mission 1B 완료 상황
**Caret 시스템 프롬프트 구현** - **완전 성공** ✅

### ✅ 완료된 작업들
1. **브라우저 조건부 처리**: `supportsBrowserUse: false`일 때 `browser_action` 도구 제외
2. **모드별 도구 필터링**: chatbot 모드(읽기 전용), agent 모드(모든 도구)
3. **extensionPath 기반 시스템 선택**: Caret vs Cline 자동 선택
4. **로그 시스템 통합**: 완벽한 디버깅 로그 출력
5. **성능 최적화**: 템플릿 캐싱, 0-4ms 생성 시간

### 📊 테스트 결과
- **8/8 테스트 통과** (원래 3개 실패 → 0개 실패)
- 모든 핵심 요구사항 완벽 구현

---

## 🚀 다음 작업: UI 메뉴 버튼 기능 구현

### **문제 1: 상단 타이틀 옆 메뉴 버튼들 동작 실패**

#### **1.1 newTask 버튼**
- **증상**: 로그만 출력되고 새 task 생성되지 않음
```
[CARET-INFO] Command 'caret.plusButtonClicked' triggered.
[CARET-INFO] Found visible instance with client ID: xxx. Controller exists: true
```
- **원인 추정**: plusButtonClicked 이벤트 처리 로직 부재
- **해결 방향**: newTask 실행 로직 연결

#### **1.2 MCP 서버 버튼**
- **증상**: 동작하지 않음
```
[CARET-INFO] Command 'caret.mcpButtonClicked' triggered.
[CARET-INFO] Found visible instance with client ID: xxx. Controller exists: true
```
- **원인 추정**: MCP 설정 패널 열기 로직 부재
- **해결 방향**: MCP 설정 UI 연결

#### **1.3 히스토리 버튼**
- **증상**: 동작하지 않음
```
[CARET-INFO] Command 'caret.historyButtonClicked' triggered.
[CARET-INFO] Found visible instance with client ID: xxx. Controller exists: true
```
- **원인 추정**: 히스토리 패널 열기 로직 부재
- **해결 방향**: 히스토리 UI 연결

#### **1.4 오픈 인 에디터**
- **증상**: 새 에디터가 뜨고 현재 대화창이 웰컴페이지로 변경
- **예상 동작**: 현재 대화를 새 탭에서 계속
- **원인 추정**: 탭 전환 시 상태 동기화 문제
- **해결 방향**: 상태 유지 로직 구현

#### **1.5 어카운트 버튼**
- **증상**: 동작하지 않음
```
[CARET-INFO] Command 'caret.accountButtonClicked' triggered.
[CARET-INFO] Found visible instance with client ID: xxx. Controller exists: true
```
- **원인 추정**: 어카운트 설정 패널 로직 부재
- **해결 방향**: 어카운트 UI 연결

#### **1.6 설정 버튼**
- **상태**: ✅ **정상 동작**

### **문제 2: 일반설정 개선**

#### **2.1 인터페이스 모드 설정 이름 변경**
- **현재**: "인터페이스 모드" 또는 기타 이름
- **요구사항**: "Cline 모드"로 변경, **오프를 기본값**으로 설정
- **의도**: 더 직관적인 이름, 기본적으로 Caret 시스템 사용

#### **2.2 모드 변경 시 동작 개선**
- **요구사항**: 모드 변경 후 나가면 **기존 태스크 제거** + **새 태스크로 자동 시작**
- **목적**: 모드 변경에 따른 깔끔한 전환
- **구현 방향**: 모드 변경 이벤트 핸들링 + 태스크 리셋 로직

---

## 🎯 다음 세션 작업 계획

### **Phase 1: 메뉴 버튼 기능 분석**
1. **이벤트 핸들러 조사**: 각 버튼 클릭 이벤트 추적
2. **Cline 원본 동작 분석**: 원본에서 어떻게 처리하는지 확인
3. **CaretProvider 연결 상태** 확인

### **Phase 2: 버튼별 기능 구현**
1. **newTask**: 새 대화 시작 로직 구현
2. **MCP/히스토리/어카운트**: 각각의 패널 열기 구현
3. **오픈 인 에디터**: 상태 유지하며 새 탭 열기

### **Phase 3: 설정 개선**
1. **"Cline 모드" 이름 변경**: 설정 UI 텍스트 수정
2. **기본값 변경**: 오프(Caret 모드)를 기본으로
3. **모드 변경 시 태스크 리셋**: 자동 전환 로직

### **Phase 4: 테스트 및 검증**
1. **각 버튼 동작 테스트**
2. **모드 변경 시나리오 테스트**
3. **전체 워크플로우 검증**

---

## 🔍 핵심 파일들

### **Frontend (UI 버튼들)**
- `webview-ui/src/components/header/` - 상단 메뉴 버튼들
- `webview-ui/src/context/ExtensionStateContext.tsx` - 이벤트 발송
- `webview-ui/src/components/settings/` - 설정 패널

### **Backend (이벤트 처리)**
- `caret-src/core/webview/CaretProvider.ts` - 메인 이벤트 핸들러
- `src/core/webview/WebviewProvider.ts` - Cline 원본 참조용
- `caret-src/extension.ts` - 커맨드 등록

### **설정 관련**
- `webview-ui/src/components/settings/` - 설정 UI
- 설정 저장/로드 로직 확인 필요

---

## 📝 개발 방법론

### **TDD 적용**
1. **RED**: 각 버튼 기능 테스트 작성
2. **GREEN**: 최소 구현으로 테스트 통과
3. **REFACTOR**: 코드 품질 개선

### **단계별 접근**
1. **한 번에 하나씩**: 버튼별로 순차 구현
2. **Cline 참조**: 원본 동작 방식 분석 후 Caret에 적용
3. **즉시 검증**: 각 단계마다 실제 동작 확인

---

## 💡 주의사항

### **Cline 원본 파일 수정 시**
- 백업 생성: `{filename-extension}.cline`
- CARET MODIFICATION 주석 추가
- 최소 수정 원칙 (1-3줄 이내)

### **아키텍처 결정**
- **새 기능**: `caret-src/` 디렉토리에 구현
- **기존 기능 수정**: 백업 후 최소 수정
- **UI 컴포넌트**: 가능한 재사용, 필요시 확장

---

## 🎉 현재 프로젝트 상태

- ✅ **Mission 1B 완료**: 시스템 프롬프트 완벽 구현
- 🎯 **다음 목표**: UI 메뉴 기능 완성
- 📈 **진행률**: 핵심 시스템 구축 완료, UI 폴리싱 단계

**다음 세션에서 UI 메뉴 버튼 기능들을 완벽하게 구현해서 사용자 경험을 한층 업그레이드하겠습니다!** ✨