# 024: Cline 모드 시스템 프롬프트 수정 업무

**업무 번호**: 024  
**업무 명**: Cline 모드에서 진짜 Cline 원본 시스템 프롬프트 사용 및 Plan/Act 모드 처리 수정  
**우선순위**: 🔥 **HIGH** (토큰 효율성 측정 정확도와 직결)  
**예상 소요 시간**: 2-3시간  
**단일 세션 완료 가능**: ✅ Yes  

## 📋 **업무 개요**

현재 Caret에서 "Cline 모드"로 설정해도 실제로는 수정된 시스템 프롬프트를 사용하고 있어서, 진짜 Cline 원본과의 토큰 효율성 비교가 불가능한 상황입니다. 

**핵심 문제**: 
- UI에서 Cline 모드 선택 시에도 실제로는 수정된 `system.ts`의 `ORIGINAL_CLINE_SYSTEM_PROMPT` 함수 사용
- 진짜 Cline 원본 시스템 프롬프트(`system-ts.cline`) 미사용
- Plan/Act 모드가 Caret Chatbot/Agent로 잘못 변환됨

## 🎯 **업무 목표**

1. **진짜 Cline 원본 시스템 프롬프트 사용**: `system-ts.cline` 파일 기반으로 정확한 Cline 원본 시스템 사용
2. **Plan/Act 모드 처리 수정**: Plan/Act 모드를 Caret 모드로 변환하지 않고 그대로 전달
3. **정확한 토큰 비교 가능**: Cline 원본 vs Caret JSON 시스템의 정확한 토큰 효율성 비교

## 🔍 **현재 상황 분석**

### **문제 발견 과정**
```typescript
// Task 클래스에서 현재 방식 (잘못됨)
if (this.chatSettings.modeSystem === "cline") {
    systemPrompt = await SYSTEM_PROMPT(
        cwd, supportsBrowserUse, this.mcpHub, this.browserSettings, 
        isClaude4Model, undefined  // ← 이것도 수정된 system.ts 사용
    )
} else {
    // Plan/Act → Caret Chatbot/Agent로 변환 (문제!)
    const caretCompatibleMode = 
        (this.chatSettings.mode === "plan") ? "chatbot" : "agent"
    
    systemPrompt = await SYSTEM_PROMPT(
        cwd, supportsBrowserUse, this.mcpHub, this.browserSettings, 
        isClaude4Model, this.context.extensionPath, caretCompatibleMode
    )
}
```

### **파일 구조 분석**
- `src/core/prompts/system.ts`: 현재 수정된 파일 (Caret 연동 로직 포함)
- `src/core/prompts/system.ts.cline`: 수정된 파일의 백업 (여전히 수정된 버전)
- `src/core/prompts/system-ts.cline`: **진짜 Cline 원본 시스템 프롬프트** ⭐

### **시스템 프롬프트 차이점**
```typescript
// 진짜 Cline 원본 (system-ts.cline)
export const SYSTEM_PROMPT = async (
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: McpHub,
    browserSettings: BrowserSettings,
    isClaude4ModelFamily: boolean = false,
) => { ... }

// 현재 수정된 버전 (system.ts)
export const SYSTEM_PROMPT = async (
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: McpHub,
    browserSettings: BrowserSettings,
    isClaude4ModelFamily: boolean = false,
    extensionPath?: string,     // ← Caret 연동 추가
    mode: 'chatbot' | 'agent' = 'agent'  // ← 모드 파라미터 추가
) => { ... }
```

## 🛠️ **해결 방안**

### **Phase 1: 진짜 Cline 원본 시스템 프롬프트 함수 생성**

1. **TRUE_CLINE_SYSTEM_PROMPT 함수 생성**
   - `system-ts.cline` 파일 내용을 기반으로 완전히 별도의 함수 생성
   - 원본 Cline의 Plan/Act 모드 처리 로직 포함
   - 수정 사항 없이 100% 원본 그대로 구현

2. **Plan/Act 모드 처리 로직 추가**
   ```typescript
   // Cline 원본에서 Plan/Act 모드 처리 방식
   // environment_details에서 mode 정보 제공
   // 시스템 프롬프트 자체에서 Plan/Act 구분 처리
   ```

### **Phase 2: Task 클래스 수정**

1. **Cline 모드 시스템 프롬프트 호출 수정**
   ```typescript
   if (this.chatSettings.modeSystem === "cline") {
       // 진짜 Cline 원본 시스템 프롬프트 사용
       systemPrompt = await TRUE_CLINE_SYSTEM_PROMPT(
           cwd, supportsBrowserUse, this.mcpHub, this.browserSettings, 
           isClaude4Model, this.chatSettings.mode  // Plan/Act 모드 전달
       )
   } else {
       // Caret 모드는 기존 방식 유지
       const caretCompatibleMode = 
           (this.chatSettings.mode === "plan") ? "chatbot" : "agent"
       
       systemPrompt = await SYSTEM_PROMPT(
           cwd, supportsBrowserUse, this.mcpHub, this.browserSettings, 
           isClaude4Model, this.context.extensionPath, caretCompatibleMode
       )
   }
   ```

2. **Plan/Act 모드 변환 로직 수정**
   - Cline 모드일 때는 Plan/Act 모드 그대로 전달
   - Caret 모드일 때만 Chatbot/Agent로 변환

### **Phase 3: 검증 및 테스트**

1. **모드 동작 검증**
   - UI에서 Cline 모드 선택 시 진짜 원본 시스템 프롬프트 사용 확인
   - Plan/Act 모드가 제대로 처리되는지 확인
   - 로그를 통한 실제 시스템 프롬프트 확인

2. **토큰 효율성 재측정**
   - 진짜 Cline 원본 vs Caret JSON 시스템 정확한 비교
   - 실제 환경에서의 토큰 사용량 측정

## 🎯 **세부 구현 계획**

### **Step 1: 진짜 Cline 원본 시스템 프롬프트 함수 생성**
```typescript
// src/core/prompts/true-cline-system.ts 생성
export const TRUE_CLINE_SYSTEM_PROMPT = async (
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: McpHub,
    browserSettings: BrowserSettings,
    isClaude4ModelFamily: boolean = false,
    mode: 'plan' | 'act' = 'act'  // Plan/Act 모드 지원
) => {
    // system-ts.cline 파일 내용 그대로 구현
    // Plan/Act 모드 처리 로직 추가
}
```

### **Step 2: environment_details에서 모드 정보 제공**
```typescript
// Cline 원본 방식: environment_details에서 현재 모드 정보 제공
// "Mode: Plan" 또는 "Mode: Act" 정보 추가
```

### **Step 3: Task 클래스 수정**
```typescript
// src/core/task/index.ts 수정
if (this.chatSettings.modeSystem === "cline") {
    const { TRUE_CLINE_SYSTEM_PROMPT } = await import('../prompts/true-cline-system')
    systemPrompt = await TRUE_CLINE_SYSTEM_PROMPT(
        cwd, supportsBrowserUse, this.mcpHub, this.browserSettings, 
        isClaude4Model, this.chatSettings.mode as 'plan' | 'act'
    )
}
```

### **Step 4: 백업 및 안전성 확보**
```bash
# 현재 파일 백업 : 기존 cline파일 있으면 백업하지 말것
cp src/core/task/index.ts src/core/task/index-ts.cline


# 수정 후 CARET MODIFICATION 주석 추가
```

## 🔄 **검증 체크리스트**

### **✅ 구현 완료 체크리스트**
- [ ] `TRUE_CLINE_SYSTEM_PROMPT` 함수 생성 완료
- [ ] Plan/Act 모드 처리 로직 구현 완료
- [ ] Task 클래스 수정 완료
- [ ] 백업 파일 생성 완료
- [ ] CARET MODIFICATION 주석 추가 완료

### **✅ 동작 검증 체크리스트**
- [ ] UI에서 Cline 모드 선택 시 진짜 원본 시스템 프롬프트 사용 확인
- [ ] Plan 모드에서 계획 기능 정상 동작 확인
- [ ] Act 모드에서 실행 기능 정상 동작 확인
- [ ] 로그를 통한 시스템 프롬프트 확인
- [ ] 토큰 길이 재측정 완료

### **✅ 토큰 효율성 재검증**
- [ ] 진짜 Cline 원본 토큰 수 측정
- [ ] Caret JSON 시스템 토큰 수 측정
- [ ] 정확한 효율성 비교 완료
- [ ] 실제 환경에서의 토큰 사용량 측정

## 🚨 **주의사항**

### **1. 백업 필수**
```bash
# Cline 원본 파일 수정 전 반드시 백업
cp src/core/task/index.ts src/core/task/index-ts.cline
```

### **2. 최소 수정 원칙**
- Task 클래스 수정 시 최소한의 변경만 수행
- 기존 Caret 모드 동작에는 영향 없도록 수정
- CARET MODIFICATION 주석 반드시 추가

### **3. 환경 변수 및 설정**
- `system-ts.cline` 파일의 모든 import 및 의존성 확인
- Plan/Act 모드 처리 시 기존 환경 변수 활용
- 브라우저 설정, MCP 허브 등 모든 파라미터 정확히 전달

### **4. 호환성 확인**
- 기존 Caret JSON 시스템과의 호환성 유지
- 다른 모드(Claude4, Experimental 등)에 영향 없음 확인
- 모든 테스트 케이스 통과 확인

## 🎯 **예상 결과**

### **1. 정확한 토큰 비교 가능**
- 진짜 Cline 원본 vs Caret JSON 시스템의 정확한 토큰 효율성 비교
- 실제 환경에서의 토큰 사용량 정확한 측정

### **2. 모드 시스템 정상화**
- UI에서 Cline 모드 선택 시 실제 Cline 원본 시스템 사용
- Plan/Act 모드 정상 동작
- Caret 모드와 Cline 모드의 명확한 구분

### **3. 비용 효율성 검증**
- JSON 시스템의 실제 토큰 절약 효과 정확한 측정
- 이전 실험 결과와의 차이점 명확한 분석

## 🔧 **개발 환경 설정**

```bash
# 컴파일 및 테스트
npm run compile
npm run test:caret-src -- --testNamePattern="mode-system"

# 실제 환경에서 테스트
npm run build:webview
npm run package
```

## 📚 **관련 문서**

- `caret-docs/development/caret-architecture-and-implementation-guide.mdx`
- `caret-docs/development/testing-guide.mdx`
- `caret-docs/development/ai-work-index.en.mdx`
- `src/core/prompts/system-ts.cline` (진짜 Cline 원본)
- `src/core/task/index.ts` (Task 클래스)

## 🎉 **성공 기준**

1. **UI 테스트**: Cline 모드 선택 시 진짜 원본 시스템 프롬프트 사용
2. **기능 테스트**: Plan/Act 모드 정상 동작
3. **토큰 테스트**: 정확한 토큰 효율성 비교 가능
4. **회귀 테스트**: 기존 Caret 모드 기능에 영향 없음

---

**중요**: 이 업무는 토큰 효율성 분석의 정확도와 직결되므로, 다른 세션에서 진행할 때 위의 모든 사항을 꼼꼼히 확인하며 진행해야 합니다. 