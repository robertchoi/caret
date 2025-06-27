# Task #003-05: CaretSystemPrompt 통합 구현

**프로젝트**: Caret  
**담당자**: luke  
**우선순위**: 🚨 **Critical - 시스템 연결 완성**  
**예상 시간**: 2-3시간  
**상태**: 📋 **준비 완료** - 003-04 완료 후 진행  
**의존성**: ✅ 003-04 (JSON 변환) **완료 필요**

## 🎯 **목표**

**핵심 목적**: `src/core/prompts/system.ts`의 SYSTEM_PROMPT 함수를 CaretSystemPrompt로 리디렉션하여 Cline 하드코딩에서 Caret JSON 시스템으로 완전 전환

### **현재 상황 분석**
```typescript
// 현재: src/core/prompts/system.ts - 707줄 하드코딩
export const SYSTEM_PROMPT = async (...) => {
  if (isClaude4ModelFamily && USE_EXPERIMENTAL_CLAUDE4_FEATURES) {
    return SYSTEM_PROMPT_CLAUDE4_EXPERIMENTAL(...)
  }
  if (isClaude4ModelFamily) {
    return SYSTEM_PROMPT_CLAUDE4(...)
  }
  return `You are Cline, a highly skilled software engineer...` // 707줄 하드코딩
}

// caret-src/core/prompts/system.ts - 단순 re-export
export { SYSTEM_PROMPT, addUserInstructions } from "../../../src/core/prompts/system";
```

### **목표 구조**
```typescript
// 목표: src/core/prompts/system.ts - CaretSystemPrompt 연동
import { CaretSystemPrompt } from "../../../caret-src/core/prompts/CaretSystemPrompt"

export const SYSTEM_PROMPT = async (...) => {
  // Cline 원본 기능 보존하면서 Caret JSON 시스템 활용
  const caretPrompt = new CaretSystemPrompt(extensionPath)
  return await caretPrompt.generateFromJsonSections(...)
}
```

### **세부 목표**
1. **완전한 기능 대체**: Cline 하드코딩을 CaretSystemPrompt로 완전 교체
2. **분기 로직 보존**: Claude4 실험/표준 분기 기능 유지
3. **extensionPath 해결**: CaretSystemPrompt에 필요한 경로 정보 전달
4. **검증 통과**: 모든 기능이 정상 작동함을 확인

## 🔍 **현재 구현 상태 분석**

### **✅ 준비된 구성 요소**
- **CaretSystemPrompt.ts**: JSON 섹션 기반 프롬프트 생성 시스템 ✅
- **sections/*.json**: 15개 JSON 섹션 파일 완비 ✅
- **ClineFeatureValidator**: 기능 검증 시스템 ✅
- **generateFromJsonSections()**: 003-04에서 구현 예정 ✅

### **❌ 해결해야 할 문제들**
1. **extensionPath 접근**: SYSTEM_PROMPT 함수에서 extension 경로 정보 필요
2. **분기 로직 통합**: Claude4 모델별 분기를 JSON 시스템에 통합
3. **성능 최적화**: 인스턴스 생성 최적화 (싱글톤 패턴 검토)
4. **오류 처리**: CaretSystemPrompt 실패 시 폴백 메커니즘

## 📋 **구현 계획**

### **Phase 0: 의존성 분석 및 설계 (30분)**
1. **extensionPath 해결 방안**:
   ```typescript
   // 옵션 1: 글로벌 변수 활용
   // 옵션 2: Context 매개변수 추가  
   // 옵션 3: 환경 변수 또는 설정 파일
   ```

2. **분기 로직 통합 설계**: Claude4 분기를 JSON 템플릿으로 처리
3. **성능 최적화 계획**: 인스턴스 재사용 전략

### **Phase 1: CaretSystemPrompt 확장 (1시간)**
1. **Claude4 분기 처리**:
   ```typescript
   // CaretSystemPrompt.ts 확장
   async generateFromJsonSections(
     cwd: string,
     supportsBrowserUse: boolean,
     mcpHub: McpHub,
     browserSettings: BrowserSettings,
     isClaude4ModelFamily: boolean,
     useExperimentalFeatures?: boolean
   ): Promise<string> {
     // Claude4 모델별 JSON 템플릿 선택
     const templates = this.selectTemplatesForModel(isClaude4ModelFamily, useExperimentalFeatures)
     
     // JSON 섹션 기반 프롬프트 생성
     return await this.generateWithTemplates(templates, context)
   }
   ```

2. **전역 인스턴스 관리**:
   ```typescript
   // 싱글톤 패턴으로 성능 최적화
   class CaretSystemPromptManager {
     private static instance: CaretSystemPrompt
     
     static getInstance(extensionPath?: string): CaretSystemPrompt {
       if (!this.instance && extensionPath) {
         this.instance = new CaretSystemPrompt(extensionPath)
       }
       return this.instance
     }
   }
   ```

### **Phase 2: SYSTEM_PROMPT 함수 교체 (1시간)**
1. **src/core/prompts/system.ts 백업 및 수정**:
   ```bash
   # CARET MODIFICATION: 원본 백업
   cp src/core/prompts/system.ts src/core/prompts/system.ts.cline
   ```

2. **SYSTEM_PROMPT 함수 교체**:
   ```typescript
   import { CaretSystemPromptManager } from "../../../caret-src/core/prompts/CaretSystemPrompt"
   import { USE_EXPERIMENTAL_CLAUDE4_FEATURES } from "@core/task/index"
   
   // CARET MODIFICATION: JSON 기반 시스템 프롬프트로 대체
   export const SYSTEM_PROMPT = async (
     cwd: string,
     supportsBrowserUse: boolean,
     mcpHub: McpHub,
     browserSettings: BrowserSettings,
     isClaude4ModelFamily: boolean = false,
   ) => {
     try {
       // extensionPath 해결 (Context에서 가져오기)
       const extensionPath = getExtensionPath() // 구현 필요
       
       // CaretSystemPrompt 인스턴스 가져오기
       const caretPrompt = CaretSystemPromptManager.getInstance(extensionPath)
       
       // JSON 섹션 기반 프롬프트 생성
       return await caretPrompt.generateFromJsonSections(
         cwd,
         supportsBrowserUse,
         mcpHub,
         browserSettings,
         isClaude4ModelFamily,
         USE_EXPERIMENTAL_CLAUDE4_FEATURES
       )
     } catch (error) {
       // 폴백: 원본 Cline 시스템 사용
       console.error('[CARET] CaretSystemPrompt failed, falling back to original:', error)
       return await ORIGINAL_SYSTEM_PROMPT(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
     }
   }
   ```

### **Phase 3: 통합 테스트 및 검증 (30분)**
1. **기능 검증**:
   - ClineFeatureValidator로 모든 기능 보존 확인
   - Claude4 분기 기능 정상 작동 확인
   - MCP 서버 통합 기능 테스트

2. **성능 검증**:
   - 프롬프트 생성 시간 측정
   - 메모리 사용량 모니터링
   - 오류 발생률 확인

## 🔧 **기술적 구현 상세**

### **extensionPath 해결 방안**
```typescript
// 옵션 1: vscode.ExtensionContext에서 가져오기
import * as vscode from 'vscode'

function getExtensionPath(): string {
  // Extension Context에서 경로 추출
  const extension = vscode.extensions.getExtension('caret.caret')
  if (!extension) {
    throw new Error('Caret extension not found')
  }
  return extension.extensionPath
}

// 옵션 2: 환경 변수 활용
process.env.CARET_EXTENSION_PATH = extensionPath
```

### **Claude4 분기 통합**
```typescript
// CaretSystemPrompt.ts 내부
private selectTemplatesForModel(
  isClaude4: boolean, 
  useExperimental: boolean
): string[] {
  const baseTemplates = ['base-prompt', 'tool-definitions', 'objective']
  
  if (isClaude4) {
    if (useExperimental) {
      return [...baseTemplates, 'claude4-experimental-features']
    }
    return [...baseTemplates, 'claude4-standard-features']
  }
  
  return baseTemplates
}
```

### **폴백 메커니즘**
```typescript
// 원본 Cline 함수 보존
const ORIGINAL_SYSTEM_PROMPT = async (...args) => {
  // 원본 707줄 하드코딩 로직 보존
  return `You are Cline, a highly skilled software engineer...`
}

// 오류 시 자동 폴백
export const SYSTEM_PROMPT = async (...args) => {
  try {
    return await CARET_SYSTEM_PROMPT(...args)
  } catch (error) {
    logger.error('[CARET] Falling back to original system prompt:', error)
    return await ORIGINAL_SYSTEM_PROMPT(...args)
  }
}
```

## ⚠️ **주의사항**

### **Cline 원본 수정 체크리스트**
- [ ] ✅ 원본 백업 생성: `system.ts.cline`
- [ ] ✅ CARET MODIFICATION 주석 추가
- [ ] ✅ 최소한의 변경으로 구현
- [ ] ✅ 폴백 메커니즘 포함
- [ ] ✅ 기능 검증 시스템 통과

### **중요한 제약사항**
1. **기능 100% 보존**: 원본 Cline과 완전 동일한 동작
2. **성능 영향 최소**: 인스턴스 생성 오버헤드 최소화
3. **오류 처리**: CaretSystemPrompt 실패 시 원본으로 폴백
4. **Claude4 분기 유지**: 모든 모델별 기능 보존

## 🎯 **성공 기준**

### **기능적 성공 기준**
1. **완전한 기능 보존**: ClineFeatureValidator 25/25 테스트 통과
2. **분기 기능 유지**: Claude4 실험/표준 모드 정상 작동
3. **MCP 통합 유지**: 동적 MCP 서버 지원 기능 보존
4. **성능 유지**: 기존 대비 10% 이하 성능 영향

### **기술적 성공 기준**
1. **컴파일 성공**: TypeScript 오류 없음
2. **테스트 통과**: 모든 기존 테스트 정상 통과
3. **로깅 시스템**: 상세한 오류 추적 가능
4. **폴백 검증**: 오류 상황에서 원본 시스템 정상 작동

---

**🎯 목표: Cline SYSTEM_PROMPT → CaretSystemPrompt 완전 전환!**

**접근 방식: 안전한 통합, 강력한 폴백, 완벽한 검증!** ✨ 