# 024: Caret 모드 토큰 효율성 개선 분석 및 최적화

**업무 번호**: 024  
**업무 명**: Caret JSON 시스템의 실제 토큰 효율성 개선이 체감되지 않는 문제 분석 및 해결  
**우선순위**: 🔥 **HIGH** (토큰 비용 절약 효과 직결)  
**예상 소요 시간**: 3-4시간  
**단일 세션 완료 가능**: ✅ Yes  

## 📋 **업무 개요**

테스트 환경에서는 Caret JSON 시스템이 58% 토큰 절약을 보여주지만, 실제 사용 환경에서는 체감상 큰 개선이 없는 상황입니다. 

**핵심 문제**: 
- 테스트 환경: 58% 토큰 절약 (8,274 → 3,472 토큰)
- 실제 환경: 체감상 큰 개선 없음
- 실제 환경에서의 토큰 사용량 투명성 부족
- 동적 로딩 시스템 미구현으로 인한 비효율성

## 🎯 **업무 목표**

1. **실제 환경 토큰 사용량 분석**: 테스트 vs 실제 환경의 차이점 정확한 파악
2. **동적 도구 로딩 시스템 구현**: 컨텍스트별 필요한 도구만 선택적 로딩
3. **실시간 토큰 모니터링**: 실제 사용 중 토큰 사용량 투명성 확보

## 🔍 **현재 상황 분석**

### **테스트 환경 vs 실제 환경 차이점**

#### **테스트 환경 (58% 토큰 절약)**
```typescript
// 단순한 테스트 조건
const mockParams = {
    cwd: process.cwd(),
    supportsBrowserUse: false,        // 브라우저 비활성화
    mcpHub: { getServers: () => [] }, // MCP 서버 0개
    browserSettings: {},
    isClaude4ModelFamily: false
}

결과: Cline 8,274 토큰 → Caret 3,472 토큰 (58% 절약)
```

#### **실제 환경 (체감상 개선 없음)**
```typescript
// 복잡한 실제 조건
const realParams = {
    cwd: workspaceRoot,
    supportsBrowserUse: true,         // 브라우저 활성화 → 추가 도구들
    mcpHub: { getServers: () => [     // MCP 서버 여러 개
        mcpServer1, mcpServer2, mcpServer3...
    ]},
    browserSettings: { enabled: true },
    isClaude4ModelFamily: true,
    // + 대화 히스토리 (수천 토큰)
    // + 사용자 설정 (.caretrules 등)
    // + 컨텍스트 파일들
}

결과: 시스템 프롬프트 절약 효과가 전체에서 희석됨
```

### **토큰 사용량 구성 분석**
```
전체 API 호출 토큰 = 시스템 프롬프트 + 대화 히스토리 + 현재 메시지 + 컨텍스트

예시:
- 시스템 프롬프트: 8,274 → 3,472 토큰 (4,802 토큰 절약)
- 대화 히스토리: 15,000 토큰 (길어질수록 증가)
- 현재 메시지: 500 토큰
- 추가 컨텍스트: 2,000 토큰 (MCP, 브라우저 등)

총 토큰: 25,774 → 20,972 토큰 (18.6% 절약)
```

### **체감 효과 감소 원인**
1. **MCP 서버 추가 도구들**: 각 서버마다 도구 정의 추가
2. **브라우저 도구 활성화**: 브라우저 관련 도구들 대량 추가
3. **대화 히스토리 증가**: 시스템 프롬프트 비중 감소
4. **동적 로딩 미구현**: 불필요한 도구들도 모두 포함

## 🛠️ **해결 방안**

### **Phase 1: 실제 환경 토큰 사용량 투명성 확보**

1. **실시간 토큰 모니터링 시스템 구현**
   ```typescript
   // 실제 API 호출 시 토큰 사용량 상세 로깅
   const tokenUsage = {
       systemPrompt: calculateTokens(systemPrompt),
       conversationHistory: calculateTokens(history),
       currentMessage: calculateTokens(message),
       additionalContext: calculateTokens(mcpTools + browserTools),
       total: totalTokens
   }
   
   logger.info('Token Usage Breakdown', tokenUsage)
   ```

2. **환경별 토큰 사용량 비교 분석**
   - 단순 환경 vs 복잡 환경 토큰 사용량 측정
   - MCP 서버 개수에 따른 토큰 증가량 분석
   - 브라우저 도구 활성화에 따른 토큰 증가량 분석

### **Phase 2: 동적 도구 로딩 시스템 구현**

1. **컨텍스트 기반 도구 필터링**
   ```typescript
   // 현재 작업 컨텍스트에 따른 도구 선별
   const getRequiredTools = (context: TaskContext) => {
       const tools = []
       
       // 기본 도구 (항상 포함)
       tools.push(...CORE_TOOLS)
       
       // 조건부 도구
       if (context.needsBrowser) tools.push(...BROWSER_TOOLS)
       if (context.mcpServers.length > 0) tools.push(...getMcpTools(context.mcpServers))
       if (context.mode === 'chatbot') tools = tools.filter(t => READ_ONLY_TOOLS.includes(t))
       
       return tools
   }
   ```

2. **MCP 서버별 선택적 로딩**
   ```typescript
   // 활성 MCP 서버만 도구 포함
   const activeMcpServers = this.mcpHub.getServers().filter(s => s.isActive)
   const mcpTools = activeMcpServers.flatMap(server => server.getTools())
   ```

### **Phase 3: 실제 환경 최적화**

1. **대화 히스토리 압축**
   - 오래된 메시지 요약 처리
   - 불필요한 컨텍스트 제거
   - 핵심 정보만 유지

2. **Aggressive Chatbot 모드 활용**
   - 질문/분석 작업 시 읽기 전용 도구만 사용
   - 50%+ 추가 토큰 절약 효과

## 🎯 **세부 구현 계획**

### **Step 1: 실시간 토큰 모니터링 시스템 구현**
```typescript
// src/core/task/token-monitor.ts 생성
export class TokenMonitor {
    static calculateTokens(text: string): number {
        return Math.ceil(text.split(/\s+/).length * 1.33)
    }
    
    static logTokenUsage(systemPrompt: string, history: string, message: string, context: any) {
        const usage = {
            systemPrompt: this.calculateTokens(systemPrompt),
            conversationHistory: this.calculateTokens(history),
            currentMessage: this.calculateTokens(message),
            additionalContext: this.calculateTokens(JSON.stringify(context)),
            total: 0
        }
        usage.total = usage.systemPrompt + usage.conversationHistory + usage.currentMessage + usage.additionalContext
        
        logger.info('🔍 Token Usage Breakdown', usage)
        return usage
    }
}
```

### **Step 2: 동적 도구 로딩 시스템 구현**
```typescript
// src/core/prompts/dynamic-tool-loader.ts 생성
export class DynamicToolLoader {
    static getRequiredTools(context: TaskContext): ToolDefinition[] {
        const tools = [...CORE_TOOLS]
        
        // 조건부 도구 추가
        if (context.supportsBrowserUse) tools.push(...BROWSER_TOOLS)
        if (context.mcpServers.length > 0) tools.push(...this.getMcpTools(context.mcpServers))
        if (context.mode === 'chatbot') return tools.filter(t => READ_ONLY_TOOLS.includes(t.name))
        
        return tools
    }
    
    private static getMcpTools(servers: McpServer[]): ToolDefinition[] {
        return servers.filter(s => s.isActive).flatMap(s => s.getTools())
    }
}
```

### **Step 3: JSON 시스템 프롬프트 최적화**
```typescript
// src/core/prompts/system.ts 수정
export const SYSTEM_PROMPT = async (
    cwd: string,
    supportsBrowserUse: boolean,
    mcpHub: McpHub,
    browserSettings: BrowserSettings,
    isClaude4ModelFamily: boolean = false,
    extensionPath?: string,
    mode: 'chatbot' | 'agent' = 'agent'
) => {
    if (extensionPath) {
        // 동적 도구 로딩 적용
        const context = { supportsBrowserUse, mcpServers: mcpHub.getServers(), mode }
        const requiredTools = DynamicToolLoader.getRequiredTools(context)
        
        return await CaretSystemPrompt.generateOptimized(requiredTools, mode)
    }
    
    // Cline 원본 방식
    return await generateClineSystemPrompt(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
}
```

### **Step 4: 실제 환경 토큰 사용량 측정**
```typescript
// src/core/task/index.ts 수정
async execute() {
    const systemPrompt = await this.generateSystemPrompt()
    const history = this.getConversationHistory()
    const message = this.currentMessage
    
    // 토큰 사용량 모니터링
    const tokenUsage = TokenMonitor.logTokenUsage(systemPrompt, history, message, {
        mcpServers: this.mcpHub.getServers(),
        browserSettings: this.browserSettings,
        mode: this.chatSettings.mode
    })
    
    // API 호출 시 실제 토큰 사용량과 비교
    const response = await this.apiProvider.call({
        system: systemPrompt,
        messages: [...history, message]
    })
    
    logger.info('📊 Actual vs Estimated Tokens', {
        estimated: tokenUsage.total,
        actual: response.usage?.total_tokens || 0
    })
}
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

---

## 📝 **업무 진행 로그**

### **2025-01-27 (월) - 토큰 효율성 분석 및 측정 개선**

#### **🔍 발견된 주요 문제점**

1. **시스템 프롬프트 로딩의 정확한 로깅 및 측정 수단 개선 필요**
   - 테스트 환경에서는 58% 토큰 절약 확인
   - 실제 환경에서는 체감상 큰 개선 없음
   - 측정 방법론의 정확도 문제

2. **Caret의 툴 시스템 프롬프트 동적 로딩 개발 필요**
   - 현재 JSON 시스템도 모든 도구를 포함하고 있음
   - 컨텍스트별 선택적 도구 로딩 시스템 필요
   - MCP 서버, 브라우저 설정 등에 따른 동적 필터링

3. **caret-zero vs 현재 시스템의 차이점 분석**
   - caret-zero: 순수 JSON 시스템으로 78% 토큰 절약 달성
   - 현재 시스템: 호환성 때문에 제한적 최적화
   - 호환성 vs 최적화의 트레이드오프 문제

4. **실제 환경 vs 테스트 환경의 차이점**
   - 테스트: 단순 환경 (MCP 서버 0개, 브라우저 비활성화)
   - 실제: 복잡한 환경 (MCP 서버 여러 개, 브라우저 활성화, 대화 히스토리)
   - 추가 컨텍스트로 인한 토큰 절약 효과 감소

5. **Task 로그 분석 시도 및 실패**
   - VSCode 글로벌 스토리지의 task 로그 분석 시도
   - JSON 파싱 에러 및 복잡한 파일 구조로 인한 실패
   - 실제 시스템 프롬프트 토큰 역추적 불가

#### **🛠️ 개발한 측정 도구들**

1. **`system-prompt-token-measurement.js`**
   - 순수 시스템 프롬프트 토큰 측정 스크립트
   - 다양한 토큰 추정 방법 구현
   - 실제 환경 시뮬레이션

2. **`analyze-existing-task-logs.js`**
   - 기존 task 로그 역추적 분석 스크립트
   - API 호출 기록에서 시스템 프롬프트 추출 시도
   - 실패로 인한 추가 개선 필요

3. **Vitest 기반 토큰 비교 테스트**
   - `caret-vs-cline-token-comparison.test.ts` 활용
   - 정확한 58% 토큰 절약 측정 확인
   - 테스트 환경 한계 확인

#### **📊 측정 결과**

```
🔹 Cline 모드 (TRUE_CLINE_SYSTEM_PROMPT):
   - 40,051 글자, 6,221 단어
   - ≈ 8,274 토큰

🔹 Caret Agent 모드 (JSON):
   - 18,727 글자, 2,610 단어  
   - ≈ 3,472 토큰

💰 절약: 58% 토큰 절약 (4,802 토큰)
```

#### **🎯 다음 세션에서 진행할 작업**

1. **TRUE_CLINE_SYSTEM_PROMPT 함수 구현**
   - `system-ts.cline` 기반 진짜 Cline 원본 시스템 프롬프트
   - Plan/Act 모드 처리 로직 포함

2. **동적 도구 로딩 시스템 개발**
   - 컨텍스트별 필요한 도구만 선택적 로딩
   - MCP 서버 상태에 따른 동적 필터링
   - 브라우저 설정에 따른 조건부 도구 포함

3. **실제 환경 토큰 측정 시스템 개선**
   - 정확한 실제 환경 토큰 사용량 측정
   - 대화 히스토리 포함한 전체 컨텍스트 분석
   - 실시간 토큰 사용량 모니터링

4. **Task 클래스 수정**
   - Cline 모드에서 진짜 원본 시스템 프롬프트 사용
   - Plan/Act 모드 정상 처리
   - 백업 및 CARET MODIFICATION 주석 추가

#### **💡 핵심 인사이트**

- **호환성의 딜레마**: 현재 시스템은 Cline 호환성을 유지하면서 최적화하려다 보니 제한적
- **측정의 복잡성**: 실제 환경에서의 토큰 사용량 측정은 예상보다 복잡
- **caret-zero의 교훈**: 순수 JSON 시스템의 잠재력 확인, 현재 시스템 개선 방향 제시
- **동적 로딩의 필요성**: 컨텍스트별 선택적 도구 로딩이 진짜 토큰 절약의 핵심

#### **🚨 해결해야 할 과제**

1. 정확한 토큰 효율성 측정 방법론 확립
2. 실제 환경에서의 토큰 사용량 투명성 확보
3. 호환성과 최적화의 균형점 찾기
4. 동적 도구 로딩 시스템 아키텍처 설계

---

**다음 세션 가이드**: 위의 측정 결과를 바탕으로 TRUE_CLINE_SYSTEM_PROMPT 구현부터 시작하여 동적 도구 로딩 시스템까지 단계별로 진행할 예정입니다. 