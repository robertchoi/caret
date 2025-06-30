# 다음 세션 가이드 - Luke 작업 로그

## 🎯 다음 작업: Mission 2 - 모드 변경 시 자동 New Task + 명칭 개선

### **문제 정의**
- **핵심 문제**: 모드 변경(Caret ↔ Cline) 시 시스템 프롬프트가 즉시 반영되지 않음
- **원인**: 시스템 프롬프트는 새 Task 시작 시에만 적용되는데, 진행 중인 Task에서는 모드 변경해도 기존 프롬프트 유지
- **사용자 기대**: 모드 변경 즉시 해당 모드의 AI 동작 방식으로 전환

### **해결 방안**
1. **모드 변경 시 자동 New Task**: 사용자가 모드를 바꾸면 자동으로 새 태스크 시작
2. **명칭 개선**: "인터페이스 모드" → **"모드 설정"**으로 변경
3. **파일/함수명 정리**: 명칭 변경에 맞춰 관련 코드도 리네이밍

---

## 📋 다음 세션 실행 계획

### **Phase 1: 모드 변경 → New Task 자동화**
- [ ] 모드 변경 감지 로직 분석
- [ ] 프론트엔드: 모드 변경 시 new task 트리거 추가
- [ ] 백엔드: 모드 변경 → clearTask + postState 흐름 구현
- [ ] 기존 UI 메뉴 버튼의 Plus Button 로직 재사용
- [ ] **동작 변경**: 기존 task 닫고, 새 task 띄우기

### **Phase 2: 명칭 및 파일명 개선 (구체적 요구사항)**
- [ ] **UI 텍스트 변경**:
  - **제목**: "인터페이스 모드" → **"모드 설정"**
  - **설명**: "Cline모드 설정시 Cline과 같은 방식으로 이용할 수 있습니다."
- [ ] **관련 파일/함수명 리네이밍**:
  - 파일명: `interfaceMode` → `modeSettings` 또는 `assistantMode`
  - 함수명: `setInterfaceMode` → `setModeSettings` 또는 `setAssistantMode`
  - 설정키: `interfaceMode` → `modeSettings` 또는 `assistantMode`

### **Phase 3: 테스트 및 검증**
- [ ] 모드 변경 → 자동 New Task 동작 테스트
- [ ] 시스템 프롬프트 즉시 적용 확인
- [ ] 명칭 변경 후 모든 기능 정상 동작 검증

### **Phase 4: 추가 고민사항 검토**
- [ ] **Task별 모드 설정값 표시**: 각 task별로 모드설정값을 가지고 다르게 보여줘야 할까?
  - 현재: 글로벌 설정으로 모든 task에 적용
  - 검토 필요: task별 개별 모드 설정 필요성
  - UI 고려사항: task 헤더에 현재 모드 표시?

---

## 🔍 기술적 접근

### **구현 대상 영역**
- **모드 변경 감지**: `webview-ui/src/context/ExtensionStateContext.tsx`
- **New Task 트리거**: 기존 Plus Button 로직 활용
- **설정 저장/로드**: `workspaceState` 패턴 유지
- **명칭 변경**: 프론트엔드 + 백엔드 관련 모든 파일

### **구현 전략**
1. **기존 Plus Button 패턴 재사용**:
   ```typescript
   // 모드 변경 시 자동 실행
   await instance.controller.clearTask()
   await instance.controller.postStateToWebview()
   await sendChatButtonClickedEvent(instance.controller.id)
   ```

2. **모드 변경 감지 후 자동 트리거**:
   ```typescript
   // 모드 변경 감지
   const handleModeChange = async (newMode) => {
       await setModeSettings(newMode)  // 설정 저장
       await triggerNewTask()  // 자동 새 태스크 (기존 task 닫고)
   }
   ```

### **UI 텍스트 업데이트**
- **제목**: "모드 설정"
- **설명**: "Cline모드 설정시 Cline과 같은 방식으로 이용할 수 있습니다."
- **옵션들**: "Caret", "Cline" 유지

### **⚠️ 주의사항**
- **Cline 원본 파일 수정 시**: 백업 + CARET MODIFICATION 주석 필수
- **설정 키 변경**: 기존 사용자 설정 마이그레이션 고려
- **파일명 변경**: import 경로 모두 업데이트

---

## 🎯 성공 기준

### **기능 성공 기준**
- [ ] 모드 변경 즉시 해당 모드의 시스템 프롬프트 적용
- [ ] 사용자 경험 개선: 모드 전환이 직관적이고 즉시 반영
- [ ] 기존 기능 완전 보존: 모든 기존 동작 정상 작동

### **코드 품질 기준**
- [ ] 새 명칭("모드 설정")이 코드 전체에 일관되게 적용
- [ ] 파일명과 함수명이 의미에 부합
- [ ] 사용자 친화적인 UI 텍스트 적용

### **추가 검토 사항**
- [ ] Task별 모드 설정 표시 필요성 검토 및 결정
- [ ] 사용자 경험 관점에서 최적의 UI/UX 결정

---

## 📚 참조할 문서들
- `caret-docs/development/frontend-backend-interaction-patterns.mdx`
- 기존 Plus Button 구현: `caret-src/extension.ts`
- 모드 설정 관련: `webview-ui/src/context/ExtensionStateContext.tsx`

---

**작업 우선순위**: 모드 변경 시 자동 New Task + "모드 설정" 명칭 적용  
**핵심 목표**: 모드 변경 즉시 시스템 프롬프트 반영 + 명확한 UI 텍스트