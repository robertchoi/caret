# Task #003-01: 시스템 프롬프트 복원 계획

**작업 기간**: 1일  
**담당자**: luke  
**우선순위**: 🚨 **긴급 (Critical)**  
**예상 시간**: 3시간

## 🔍 Phase 0: 필수 사전 검토 (MANDATORY)

### 0.1 필수 문서 체크리스트

**📋 작업 성격 분석**: 시스템 프롬프트 복원 → Frontend-Backend 상호작용, 컴포넌트 개발, 테스트 관련

**✅ 필수 검토 문서:**
- [x] **frontend-backend-interaction-patterns.mdx** (UI-Backend 연동 패턴)
- [x] **caret-architecture-and-implementation-guide.mdx** (아키텍처 원칙)
- [ ] **component-architecture-principles.mdx** (UI 컴포넌트 개발 원칙)
- [ ] **testing-guide.mdx** (TDD 방법론 및 테스트 전략)

### 0.2 아키텍처 결정 체크리스트

**🏗️ Caret vs Cline 디렉토리 결정:**
- ✅ **Caret 신규 코드**: `caret-src/core/prompts/CaretPromptManager.ts`
- ✅ **템플릿 저장소**: `caret-assets/templates/prompts/`
- ⚠️ **Cline 원본 수정**: `src/core/prompts/system.ts` (필요시만 최소 수정)

**🔐 백업 요구사항:**
- src/core/prompts/system.ts → src/core/prompts/system-ts.cline

**💾 저장소 타입 결정:**
- `currentTemplate`: workspaceState (프로젝트별 설정)
- `userTemplates`: globalState (사용자 전역 설정)
- `templateHistory`: workspaceState (프로젝트별 히스토리)

### 0.3 수정 원칙 재확인

**🚨 Cline 머징 고려 수정 원칙 (CRITICAL)**:
- **원칙 1**: 주석처리된 안 쓴 코드도 절대 건드리지 말 것 (머징 고려)
- **원칙 2**: 수정 시 주석처리 금지, 완전 대체만
- **원칙 3**: 최소 수정 (1-3라인 이내 권장)
- **원칙 4**: 반드시 CARET MODIFICATION 주석 추가
- **원칙 5**: 기존 Cline 로직은 **절대 변경하지 않음**

### 🚨 0.4 완전한 기능 검증 전략 (CRITICAL)

**🎯 마스터 우려사항 해결**: "교체 후 완전한 기능 검증이 가능한지"

#### A. 현재 Cline vs 과거 caret-zero 프롬프트 완전 비교

**📊 현재 Cline 프롬프트 구조 (2025-01 기준)**:
```typescript
// src/core/prompts/system.ts - 현재 Cline
- 모델별 분기: claude4, claude4-experimental 특화 프롬프트
- 고도로 최적화된 도구 정의 (execute_command, read_file, write_to_file 등)
- MCP 서버 통합 (use_mcp_tool, access_mcp_resource)
- 브라우저 지원 (browser_action) 조건부 포함
- 🚨 Plan Mode vs Act Mode 분기 (제거 대상)
- 새로운 도구들: list_code_definition_names, web_fetch 등
```

**🎯 Caret 목표 프롬프트 구조**:
```typescript
// caret-src/core/prompts/CaretPromptManager.ts - 새로운 설계
- ❌ Plan/Act 모드 분기 제거 (plan모드의 write 제한 해제, act모드의 성급한 액션 금지)
- ✅ 통합 Agent 모드 (연속적 추론 및 실행, 자율성과 개발자 협력성 강화)
- ✅ 워크플로우 기반 다중 파일 처리
- ✅ 간결성 + 구조성 + 명확성 원칙 적용
- ✅ 모호성 제거된 명령어 체계
```

**📊 과거 caret-zero 프롬프트 구조**:
```typescript
// caret-zero/src/core/prompts/system.ts - 과거 버전
- JSON 기반 섹션별 프롬프트 구성
- 15개 섹션 파일 (BASE_PROMPT_INTRO.json, TOOL_DEFINITIONS.json 등)
- 3개 규칙 파일 (common_rules.json, file_editing_rules.json 등)
- 템플릿 기반 동적 프롬프트 생성
```

#### 🚨 A.5 기존 caret-zero 검증 스크립트 활용 (NEW)

**✅ 발견된 유효한 스크립트들**:

**1. `runtime-equivalence-test.js` - 핵심 검증 도구**
```javascript
// 위치: caret-zero/scripts/runtime-equivalence-test.js
// 목적: 실제 런타임에서 로딩 결과 동등성 검증
// 활용: Cline vs Caret 템플릿 기능 동등성 검증에 직접 활용 가능!
```

**2. `md-json-equivalence-test.js` - 내용 동등성 검증**
```javascript
// 위치: caret-zero/scripts/md-json-equivalence-test.js  
// 목적: 마크다운과 JSON 파일의 의미적 등가성 검증
// 활용: 템플릿 변환 시 내용 손실 없음 확인
```

**3. `token-analysis.js` - 성능 최적화**
```javascript
// 위치: caret-zero/scripts/token-analysis.js
// 목적: 토큰 효율성 분석 (15% 이상 절감 목표)
// 활용: 프롬프트 최적화 및 성능 검증
```

**🔧 스크립트 현재 프로젝트 적용 계획**:
```bash
# 1. 기존 스크립트를 현재 프로젝트에 맞게 복사 및 수정
cp caret-zero/scripts/runtime-equivalence-test.js caret-scripts/cline-caret-equivalence-test.js

# 2. Cline vs Caret 비교로 로직 수정
# 3. 현재 프로젝트 구조에 맞는 경로 수정
```

**🧪 수정된 검증 스크립트 활용**:
```typescript
// caret-scripts/cline-caret-equivalence-test.js (수정 버전)
async function testClineVsCaretEquivalence() {
  console.log("Cline vs Caret 템플릿 기능 동등성 검증 시작")
  
  // 1. 현재 Cline SYSTEM_PROMPT 결과 추출
  const clinePrompt = await SYSTEM_PROMPT(mockContext)
  
  // 2. Caret 템플릿 적용 결과 추출
  const caretPrompt = await CaretPromptManager.generateCustomPrompt('default', mockContext)
  
  // 3. 도구 정의 완전성 검증
  const clineTools = extractToolDefinitions(clinePrompt)
  const caretTools = extractToolDefinitions(caretPrompt)
  
  // 4. 기능 동등성 확인
  const equivalenceResult = verifyToolEquivalence(clineTools, caretTools)
  
  // 5. 상세 결과 리포트
  generateEquivalenceReport(equivalenceResult)
  
  return equivalenceResult.isEquivalent
}

// 도구 정의 추출 함수
function extractToolDefinitions(promptText) {
  // 프롬프트에서 도구 정의 섹션 파싱
  const toolMatches = promptText.match(/## (\w+)\nDescription: ([^#]+)/g)
  return toolMatches?.map(match => {
    const [, toolName, description] = match.match(/## (\w+)\nDescription: ([^#]+)/)
    return { toolName, description: description.trim() }
  }) || []
}

// 도구 동등성 검증 함수
function verifyToolEquivalence(clineTools, caretTools) {
  const missingTools = clineTools.filter(
    cTool => !caretTools.some(carTool => carTool.toolName === cTool.toolName)
  )
  
  const extraTools = caretTools.filter(
    carTool => !clineTools.some(cTool => cTool.toolName === carTool.toolName)
  )
  
  return {
    isEquivalent: missingTools.length === 0,
    missingTools,
    extraTools,
    totalClineTools: clineTools.length,
    totalCaretTools: caretTools.length
  }
}
```

#### B. 프롬프트 차이점 상세 분석 계획

**🔍 1단계: 도구 비교 분석**
```bash
# 현재 Cline 도구 목록 추출
grep -n "Description:" src/core/prompts/system.ts | head -20

# caret-zero 도구 목록 추출  
grep -n "name.*description" caret-zero/src/core/prompts/sections/TOOL_DEFINITIONS.json
```

**🔍 2단계: 누락 기능 체크리스트**
- [ ] **새로운 도구들**: web_fetch, list_code_definition_names ✅
- [ ] **모델별 최적화**: Claude4 experimental 특화 프롬프트 ✅
- [ ] **MCP 통합**: 최신 MCP 서버 지원 기능 ✅
- [ ] **브라우저 개선**: 최신 Puppeteer 통합 ✅
- [ ] **에러 처리**: 향상된 도구 사용 가이드라인 ✅
- [ ] **🚨 Plan/Act 모드 제약**: 제거하여 자유로운 Agent 모드 구현 🎯
- [ ] **워크플로우 다중 파일**: 여러 파일 동시 처리 지원 🎯

**🔍 3단계: 성능 개선사항 체크리스트**
- [ ] **프롬프트 최적화**: 토큰 효율성 개선
- [ ] **컨텍스트 관리**: 더 나은 작업 컨텍스트 유지
- [ ] **사용자 경험**: 개선된 에러 메시지 및 가이드

#### C. 완전한 기능 검증 프로토콜

**🧪 1단계: 기본 기능 검증**
```typescript
// 검증 시나리오 1: 기본 도구 사용
describe('Basic Tool Functionality', () => {
  it('should execute commands correctly', async () => {
    // execute_command 도구 검증
  })
  
  it('should read/write files correctly', async () => {
    // read_file, write_to_file 도구 검증
  })
  
  it('should handle MCP integration', async () => {
    // MCP 도구 검증
  })
})
```

**🧪 2단계: 템플릿 전환 검증**
```typescript
// 검증 시나리오 2: 템플릿 적용 전후 비교
describe('Template Application Verification', () => {
  it('should maintain all Cline capabilities with custom template', async () => {
    // 1. 기본 Cline 프롬프트로 작업 실행
    const clineResult = await executeWithClinePrompt(testTask)
    
    // 2. Caret 커스텀 템플릿으로 동일 작업 실행
    const caretResult = await executeWithCaretTemplate(testTask)
    
    // 3. 결과 비교 (기능 손실 없음 확인)
    expect(caretResult.toolsUsed).toEqual(clineResult.toolsUsed)
    expect(caretResult.success).toBe(true)
  })
})
```

**🧪 3단계: 회귀 테스트 (Regression Test)**
```typescript
// 검증 시나리오 3: 기존 기능 보존 확인
const regressionTests = [
  'file_editing_workflow',
  'command_execution',
  'mcp_server_interaction', 
  'browser_automation',
  'error_handling',
  'multi_step_tasks'
]

regressionTests.forEach(testCase => {
  it(`should preserve ${testCase} functionality`, async () => {
    // 각 핵심 기능별 회귀 테스트
  })
})
```

#### D. 프롬프트 품질 보장 체크리스트

**📋 필수 검증 항목:**
- [ ] **도구 완전성**: 모든 Cline 도구가 템플릿에서 사용 가능한가?
- [ ] **파라미터 정확성**: 도구 파라미터 정의가 정확한가?
- [ ] **컨텍스트 유지**: 작업 컨텍스트가 올바르게 전달되는가?
- [ ] **에러 처리**: 에러 상황에서 적절히 대응하는가?
- [ ] **성능 동등성**: 응답 시간과 품질이 기존과 같은가?

**🎯 성공 기준:**
1. ✅ **기능 동등성**: 모든 Cline 기능이 커스텀 템플릿에서도 동작
2. ✅ **성능 유지**: 응답 품질과 속도가 기존 수준 이상
3. ✅ **호환성 보장**: 기존 사용자 워크플로우에 영향 없음
4. ✅ **확장성 확보**: 새로운 템플릿 추가가 용이함

## 🎯 Phase 1: TDD RED - 실패하는 테스트 작성

### 1.1 테스트 파일 위치 확인

**🚨 STOP POINT 1: 테스트 경로 검증**
- [ ] webview 테스트: `webview-ui/src/caret/**/*.test.tsx`만 가능
- [ ] 백엔드 테스트: `caret-src/__tests__/`에 위치
- [ ] include 경로 설정 확인 후 테스트 파일 생성
- [ ] **즉시 검증**: `npm run test:webview` 실행으로 인식 확인

### 1.2 핵심 테스트 시나리오

```typescript
// caret-src/__tests__/CaretPromptManager.test.ts
describe('CaretPromptManager', () => {
  it('should generate custom prompt independently from Cline', async () => {
    // RED: 실패하는 테스트 작성
    const manager = new CaretPromptManager('/mock/extension/path')
    const result = await manager.generateCustomPrompt('creative-assistant', mockContext)
    
    expect(result).toContain('creative assistant')
    expect(result).not.toContain('Cline') // Cline과 독립적
  })
  
  it('should manage template settings with correct storage types', async () => {
    // 저장소 타입 검증 테스트
  })
  
  // 🚨 NEW: 완전한 기능 검증 테스트
  it('should preserve all Cline tool definitions in custom template', async () => {
    // 모든 Cline 도구가 커스텀 템플릿에서도 사용 가능한지 검증
    const manager = new CaretPromptManager('/mock/extension/path')
    const customPrompt = await manager.generateCustomPrompt('default', mockContext)
    
    // 필수 도구들이 모두 포함되어 있는지 확인
    const requiredTools = [
      'execute_command', 'read_file', 'write_to_file', 'replace_in_file',
      'search_files', 'list_files', 'use_mcp_tool', 'browser_action'
    ]
    
    requiredTools.forEach(tool => {
      expect(customPrompt).toContain(tool)
    })
  })
})
```

## 🔧 Phase 2: TDD GREEN - 최소 구현

### 2.1 독립적 템플릿 시스템 구현

**구현 위치**: `caret-src/core/prompts/CaretPromptManager.ts`

```typescript
export class CaretPromptManager {
  private templatesPath: string;
  private currentTemplate: string;
  
  constructor(extensionPath: string) {
    this.templatesPath = path.join(extensionPath, 'caret-assets', 'templates', 'prompts');
    this.currentTemplate = 'default';
  }
  
  // 🚨 NEW: Cline 프롬프트 완전 분석 및 템플릿 생성
  async generateCustomPrompt(templateName: string, context: PromptContext): Promise<string> {
    // 1. 현재 Cline 프롬프트 구조 분석
    const clineBasePrompt = await this.analyzeClinePromptStructure(context)
    
    // 2. 템플릿 로딩 및 적용
    const template = await this.loadTemplate(templateName)
    
    // 3. Cline 기능 완전 보존하면서 템플릿 적용
    return this.mergeTemplateWithClineFeatures(template, clineBasePrompt, context)
  }
  
  // Cline의 모든 기능을 분석하여 템플릿에 포함
  private async analyzeClinePromptStructure(context: PromptContext): Promise<ClinePromptStructure> {
    return {
      tools: this.extractAllClineTools(context),
      rules: this.extractAllClineRules(context),
      capabilities: this.extractClineCapabilities(context),
      mcpIntegration: this.extractMcpFeatures(context),
      browserSupport: this.extractBrowserFeatures(context)
    }
  }
  
  // 템플릿과 Cline 기능을 안전하게 병합
  private mergeTemplateWithClineFeatures(
    template: CaretTemplate, 
    clineStructure: ClinePromptStructure, 
    context: PromptContext
  ): string {
    // 모든 Cline 기능을 보존하면서 템플릿 개성 추가
    let mergedPrompt = template.basePrompt
    
    // 모든 도구 정의 포함
    mergedPrompt += this.formatToolDefinitions(clineStructure.tools)
    
    // 모든 규칙 포함
    mergedPrompt += this.formatRules(clineStructure.rules)
    
    // MCP, 브라우저 등 고급 기능 포함
    mergedPrompt += this.formatAdvancedFeatures(clineStructure)
    
    return mergedPrompt
  }
}
```

### 2.2 설정 저장 전략

```typescript
// 저장소 타입 명시
interface PromptSettings {
  currentTemplate: string;        // workspaceState (프로젝트별)
  userTemplates: TemplateInfo[];  // globalState (사용자 전역)
  templateHistory: string[];      // workspaceState (프로젝트별)
}

// Frontend-Backend 상호작용 패턴 적용
const setPromptTemplate = async (templateName: string) => {
  // Optimistic Update 패턴
  const previousTemplate = state.currentTemplate;
  setState(prev => ({ ...prev, currentTemplate: templateName }));
  
  try {
    await StateServiceClient.updateSettings({
      currentTemplate: templateName  // 단일 필드만 업데이트
    });
  } catch (error) {
    // 실패시 롤백
    setState(prev => ({ ...prev, currentTemplate: previousTemplate }));
    throw error;
  }
};
```

## 🧪 TDD 및 검증 계획

### 테스트 전략 (testing-guide.mdx 준수)

**1. RED-GREEN-REFACTOR 사이클 강제**
```typescript
// RED: 실패하는 테스트 작성
describe('CaretPromptManager', () => {
  it('should load template without affecting Cline system prompt', async () => {
    // Given
    const manager = new CaretPromptManager('/mock/path');
    const templateName = 'creative-assistant';
    
    // When
    const customPrompt = await manager.generateCustomPrompt(templateName, mockContext);
    
    // Then
    expect(customPrompt).toContain('creative assistant');
    expect(customPrompt).not.toContain('Cline'); // Cline과 독립적
    expect(mockClineSystemPrompt).not.toHaveBeenCalled(); // Cline 함수 호출되지 않음
  });
});
```

**2. 통합 테스트 (실제 빌드 검증)**
```typescript
// 실제 Extension Host 환경에서 테스트
it('should apply template in real VSCode environment', async () => {
  // 실제 확장 환경에서 템플릿 적용 테스트
});
```

**3. 커버리지 목표**
- Caret 신규 코드: 100% 커버리지 필수
- `npm run caret:coverage`로 분리 분석

## 🗂️ 수정된 서브태스크

### 1. [003-01] 시스템 프롬프트 복원 계획 ✅
- Phase 0 필수 문서 체크 완료
- 아키텍처 결정 수정 (독립적 템플릿 시스템)
- 저장소 타입 및 상호작용 패턴 명시
- **🚨 NEW**: 완전한 기능 검증 전략 수립

### 2. [003-02] 독립적 템플릿 시스템 구현
- **수정된 목표**: Cline 오버라이드 방식 → 독립적 템플릿 관리
- `CaretPromptManager` 클래스 구현 (TDD 방식)
- **🚨 NEW**: Cline 프롬프트 완전 분석 및 기능 보존 로직
- **🚨 NEW**: Plan/Act 모드 제약 해제 → 통합 Agent 모드 구현
- **🚨 NEW**: 프롬프트 품질 기준 적용 (간결성, 구조성, 명확성)
- 테스트: 템플릿 로딩, 프롬프트 생성, **기능 완전성** 검증

### 3. [003-03] Backend 통합 및 설정 관리
- StateService 연동 (단일 필드 업데이트 패턴)
- workspaceState/globalState 저장소 분리
- **필요시만 Cline system.ts 최소 수정** (백업 필수)

### 4. [003-04] 프롬프트 관리 UI 구현
- React 컴포넌트 (component-architecture-principles.mdx 준수)
- 템플릿 선택 및 미리보기 기능
- Frontend-Backend 상호작용 패턴 적용

## 🔄 파일 수정 체크리스트 (강화)

### Cline 원본 파일 수정시 필수 절차

**📋 수정 전 체크:**
- [ ] 이 파일이 Cline 원본인가? (`src/`, `webview-ui/`, `proto/`, `scripts/`, `evals/`, `docs/`, `locales/`)
- [ ] 백업 파일 생성했나? (`{filename}-{extension}.cline`)
- [ ] 수정 이유가 명확한가? (템플릿 적용 기능 등)
- [ ] 최소 수정 범위인가? (1-3라인 이내)

**✏️ 수정 중 체크:**
- [ ] `// CARET MODIFICATION: [구체적 설명]` 주석 추가
- [ ] 기존 코드 주석처리 금지 (완전 대체만)
- [ ] 주석처리된 미사용 코드 건드리지 않음

**✅ 수정 후 체크:**
- [ ] 컴파일 오류 없음 (`npm run compile`)
- [ ] 기존 테스트 통과 (`npm run test`)
- [ ] 백업 파일로 복구 가능함 확인

### 🚨 Cline 머징 고려 SYSTEM_PROMPT 수정 방식 (CRITICAL)

**수정 위치**: `src/core/prompts/system.ts`  
**백업 필수**: `src/core/prompts/system-ts.cline`  

**❌ 잘못된 방법 - 주석처리로 남김**:
```typescript
// const systemPrompt = await buildClinePrompt(...) // 원본
const systemPrompt = await buildCaretPrompt(...)  // 새로운 로직
```

**✅ 올바른 방법 - 완전 대체 + 머징 고려**:
```typescript
// CARET MODIFICATION: 커스텀 템플릿 지원 추가
// Original backed up to: src/core/prompts/system-ts.cline
// Purpose: CaretPromptManager를 통한 커스텀 시스템 프롬프트 지원

import { CaretPromptManager } from '../../../caret-src/core/prompts/CaretPromptManager'

export const SYSTEM_PROMPT = async (
	cwd: string,
	supportsBrowserUse: boolean,
	mcpHub: McpHub,
	browserSettings: BrowserSettings,
	isClaude4ModelFamily: boolean = false,
) => {
	// CARET MODIFICATION: 커스텀 템플릿 우선 적용 (1라인 추가)
	const caretTemplate = await CaretPromptManager.getActiveTemplate()
	if (caretTemplate) {
		return await CaretPromptManager.buildSystemPrompt(caretTemplate, {
			cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily
		})
	}

	// 기존 Cline 로직 완전 유지 (수정하지 않음)
	// ... existing code ...
}
```

**💡 머징 고려 핵심 원칙**:
- 기존 Cline 코드는 **절대 건드리지 않음** (주석처리/삭제 금지)
- 새로운 로직만 **최상단에 추가**
- Cline 업스트림 변경사항이 와도 **충돌 최소화**

## 💡 위험 요소 및 대응 방안

### 1. Cline 업스트림 충돌 위험
**대응**: 독립적 템플릿 시스템으로 Cline 의존성 최소화

### 2. 순환 메시지 문제
**대응**: 단일 필드 업데이트 패턴 적용

### 3. 저장소 타입 불일치
**대응**: 명확한 저장소 분리 및 일관성 검증

### 🚨 4. 기능 누락 위험 (NEW)
**대응**: 완전한 Cline 프롬프트 분석 및 회귀 테스트

### 🚨 5. 성능 저하 위험 (NEW)
**대응**: 벤치마크 테스트 및 성능 모니터링

## 📝 최종 구현 계획

### 1단계: TDD 기반 핵심 로직 구현
```typescript
// RED: 테스트 작성
describe('Template System', () => {
  it('should manage templates independently from Cline', async () => {
    // 테스트 작성
  });
});

// GREEN: 최소 구현
class CaretPromptManager {
  async generateCustomPrompt(template: string): Promise<string> {
    // 최소 구현
  }
}

// REFACTOR: 품질 개선
```

### 2단계: 백엔드 통합 (Frontend-Backend 패턴)
```typescript
// 단일 필드 업데이트 패턴 적용
const updatePromptTemplate = async (templateName: string) => {
  await StateServiceClient.updateSettings({
    currentTemplate: templateName  // 오직 이 필드만
  });
};
```

### 3단계: UI 구현 (Component Architecture 원칙)
```typescript
// VSCode 테마 통합, i18n 지원
const PromptTemplateSelector = () => {
  const { currentTemplate } = useExtensionState();
  return (
    <div style={{ border: "1px solid var(--vscode-settings-headerBorder)" }}>
      <h3>{t('promptTemplate.title', 'settings')}</h3>
      {/* 템플릿 선택 UI */}
    </div>
  );
};
```

## 🎯 성공 기준

1. ✅ **TDD 완료**: 모든 코드가 테스트 우선 작성
2. ✅ **독립성 확보**: Cline 시스템 프롬프트와 완전 분리
3. ✅ **패턴 준수**: Frontend-Backend 상호작용 패턴 적용
4. ✅ **최소 수정**: Cline 원본 코드 수정 최소화 (머징 고려)
5. ✅ **커버리지 달성**: Caret 신규 코드 100% 테스트 커버리지
6. 🚨 **NEW: 기능 완전성**: 모든 Cline 기능이 커스텀 템플릿에서도 동작
7. 🚨 **NEW: 성능 동등성**: 기존 Cline과 동일한 성능 보장

---

## Phase 4: 성능 비교 보고서 생성

### 4.1 기존 caret-zero 성능 분석 시스템 활용
- `runtime-equivalence-test.js` 활용한 기능 동등성 검증
- `token-analysis.js` 활용한 토큰 절감율 측정 (15% 이상 목표)
- `md-json-equivalence-test.js` 활용한 템플릿 변환 검증

### 🚨 4.1.1 Cline Plan/Act 모드 제약 해제 분석
**핵심 변경 사항:**
- ❌ 기존 Cline: Plan 모드 + Act 모드 (4+1 구조)
- ✅ Caret 목표: 통합 Agent 모드 (단일 모드, 유연한 워크플로우)

**프롬프트 검토 중점 사항:**
- Plan/Act 모드 관련 제약 조건 식별 및 제거
- 모드 전환 로직 대신 연속적 에이전트 동작 설계
- 워크플로우 기반 다중 파일 처리 지원

### 4.2 성능 비교 보고서 구성
**토큰 효율성 분석**
- 기존 Cline vs 새로운 Caret 템플릿 시스템 토큰 사용량 비교
- 컨텍스트 윈도우 사용률 비교 (47.9k/200.0k → 목표값)
- 프롬프트 최적화 효과 측정

**실제 사용 성능 비교**
- API 호출 빈도 및 비용 효율성 분석 ($0.4930 vs $0.4747 패턴)
- 응답 시간 및 품질 비교
- 메모리 사용량 비교

**개발 생산성 비교**
- 템플릿 적용 전후 개발 속도
- 오류 발생률 및 코드 품질 지표
- 사용자 경험 개선도 측정 (TDD 품질 vs 완성도)

**🚨 NEW: 프롬프트 품질 검토 기준**
**간결성 (Conciseness)**
- 불필요한 중복 제거
- 핵심 지시사항만 포함
- 토큰 효율성 최적화

**구조성 (Structure)**
- 논리적 섹션 구분
- 계층적 정보 구성
- 일관된 형식 적용

**명확성 (Clarity)**
- 모호한 표현 제거
- 구체적이고 명확한 지시
- 오해 가능성 최소화

**Plan/Act 모드 제약 해제 효과**
- 모드 전환 오버헤드 제거
- 연속적 추론-실행 흐름 개선
- 워크플로우 유연성 향상

### 4.3 성능 비교 보고서 생성 스크립트 작성
```javascript
// caret-scripts/performance-comparison-report.js
const performanceReport = {
  tokenEfficiency: {
    clineOriginal: await measureClineTokenUsage(),
    caretTemplate: await measureCaretTemplateUsage(),
    reductionPercent: calculateReduction()
  },
  functionalEquivalence: {
    clineFeatures: await analyzeClineFeatures(),
    caretFeatures: await analyzeCaretFeatures(),
    completenessScore: calculateCompleteness()
  },
  costEfficiency: {
    apiCalls: compareAPICalls(),
    tokenCost: compareTokenCost(),
    developmentTime: compareDevelopmentTime()
  }
};
```

### 4.4 보고서 출력 형식
```markdown
# Caret vs Cline 성능 비교 보고서

## 📊 핵심 지표
- 토큰 절감율: XX% (목표: 15% 이상)
- 기능 완전성: XX% (목표: 100%)
- 비용 효율성: $X.XX → $X.XX (XX% 절감)
- 개발 생산성: XX% 향상

## 🎯 상세 분석
[기존 caret-zero 실험 데이터와 연계한 상세 분석]
```

이제 수정된 계획으로 안전하고 효율적인 시스템 프롬프트 복원이 가능합니다! 🚀
