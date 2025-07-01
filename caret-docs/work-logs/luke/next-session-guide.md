# 다음 세션 가이드 (2025-07-01 업데이트)

## 🎉 현재 완료 상태: Task 003-07 성공적 완료

### ✅ 003-07 완료 사항
- **AI 핵심 프롬프트 파일 검증 도구 개발 완료**
- **테스트 결과**: 15개 테스트 중 14개 성공 (94% 성공률)
- **주요 성과**:
  - Claude4 파일 분석: 21,397토큰 → 30% 최적화 잠재력
  - Commands 분석: 100% JSON 준비도 (최우선 변환 대상)
  - MCP 분석: medium 위험도, 하이브리드 전략 권장
  - 변환 순서 확정: commands.ts(1) → claude4.ts(2) → claude4-experimental.ts(3) → loadMcpDocumentation.ts(4)

## 🎯 권장 다음 작업: Task 003-08

### 📋 Task 003-08: AI 프롬프트 JSON 변환 실행
**우선순위**: 🔥 Critical  
**예상 시간**: 3-4시간  
**상태**: ✅ 준비 완료 (003-07 검증 도구 완성)

### Phase 1: commands.ts 변환 (최우선)
```typescript
🎯 목표: 가장 안전한 첫 번째 변환
📊 기대 효과: 40% 토큰 절약, 100% 준비도
⚡ 위험도: 낮음 (구조화된 명령어 패턴)
📁 경로: src/core/prompts/commands.ts
```

### 핵심 전략
1. **검증된 패턴 활용**: system.ts JSON 변환 성공 경험 기반
2. **단계적 접근**: commands.ts → claude4.ts → claude4-experimental.ts → loadMcpDocumentation.ts
3. **안전성 우선**: 각 단계마다 완전한 테스트와 검증

## 📚 준비된 도구들 (003-07 완성)

### 검증 시스템
- `ExtendedPromptValidator.ts`: 종합 검증 오케스트레이터
- `Claude4PromptAnalyzer.ts`: Claude4 전문 분석 도구
- `CommandsAnalyzer.ts`: 명령어 구조 분석 도구  
- `McpDocumentationAnalyzer.ts`: MCP 문서 분석 도구

### 테스트 확인 방법
```bash
npx vitest run caret-src/__tests__/003-07-prompt-verification-tools.test.ts
```

## 🛠️ 003-08 시작 체크리스트

### Pre-Start 확인
- [ ] 003-07 테스트 통과 확인 (94% 이상)
- [ ] 검증 도구 정상 동작 확인
- [ ] 백업 시스템 준비 (.cline 백업)
- [ ] Cline 원본 파일 수정 규칙 숙지

### Phase 1: commands.ts 변환 준비
- [ ] commands.ts 구조 분석 결과 검토
- [ ] JSON 템플릿 설계 계획 수립  
- [ ] 테스트 케이스 준비 (TDD RED → GREEN → REFACTOR)
- [ ] 백업 생성: `commands.ts.cline`

## 📊 예상 성과 (003-08 완료 시)

### 토큰 효율성 개선
- **commands.ts**: 40% 토큰 절약
- **claude4.ts**: 30% 토큰 절약  
- **전체 AI 프롬프트**: 평균 25-35% 효율성 향상

### AI 행동 개선
- 모듈형 프롬프트 구조
- 동적 로딩 및 최적화
- Cline/Caret 모드 호환성 보장

## 🚨 주의사항

### Cline 원본 파일 수정 규칙
1. **필수 백업**: 수정 전 `.cline` 백업 생성
2. **CARET MODIFICATION 주석**: 모든 수정 사항에 명시
3. **최소 수정 원칙**: 1-3줄 이내 변경 권장
4. **완전 교체**: 주석 처리가 아닌 완전 교체

### 검증 필수 사항
- AI 행동 100% 보존 확인
- 기존 기능 완전 호환성 테스트
- Cline/Caret 모드 양방향 검증
- 토큰 효율성 정량 측정

## 🎯 Success Metrics

### 003-08 완료 기준
- [ ] commands.ts JSON 변환 완료
- [ ] 기존 AI 행동 100% 보존
- [ ] 토큰 효율성 35% 이상 향상
- [ ] 모든 테스트 통과
- [ ] Cline/Caret 모드 완전 호환

---

**현재 상태**: 003-07 완료, 003-08 준비 완료  
**다음 세션 목표**: commands.ts JSON 변환 실행  
**마지막 업데이트**: 2025-01-07 by Alpha Yang ✨

# 다음 세션 가이드 - Task 003-08 패턴 재검토 필요

**날짜**: 2025-01-22  
**현재 상태**: ⚠️ **Phase 1 패턴 문제 발견**  
**긴급도**: 🔥 **높음 - 아키텍처 패턴 수정 필요**

## 🚨 **Phase 1에서 발견된 중요 문제**

### **❌ 잘못된 구현 패턴 사용**
- **문제점**: JSON 템플릿 **내부에서** `cline`/`caret` 모드 구분 시도
- **참조 패턴**: system.ts에 이미 **올바른 패턴** 존재
- **영향**: Commands JSON 템플릿에 불필요한 Cline 내용 포함

### **✅ 올바른 패턴 (system.ts 참조)**
```typescript
export const SYSTEM_PROMPT = async (..., extensionPath?, mode?) => {
  if (!extensionPath) {
    // Cline 모드 → 기존 하드코딩 프롬프트 사용 (100% 변경 없음)
    return ORIGINAL_SYSTEM_PROMPT(...)
  } else {
    // Caret 모드 → JSON 시스템 사용 (Caret 전용 내용만)
    return CaretSystemPrompt.generate(...)
  }
}
```

## 📋 **다음 세션 우선순위 작업**

### **Phase 1 수정 작업 (최우선)**
1. **🔄 JSON 템플릿 정리**
   - JSON 템플릿에서 모든 `"cline"` 내용 제거
   - `"caret"` 내용만 유지 (협업적, 파트너십 언어)
   - 수정할 파일들:
     - `NEW_TASK_TOOL.json`
     - `CONDENSE_TOOL.json` 
     - `NEW_RULE_TOOL.json`
     - `REPORT_BUG_TOOL.json`

2. **🔄 CaretCommands 클래스 리팩터링**
   - `mode: 'cline' | 'caret'` 매개변수 제거
   - `currentMode` 속성 및 관련 로직 제거
   - `switchMode()` 및 모드 관련 메서드 제거
   - Caret 전용 기능으로 단순화

3. **🔄 Commands.ts 래퍼 구현**
   - `src/core/prompts/commands.ts`에 system.ts 패턴 적용
   - 백업 생성: `commands.ts.cline`
   - CARET MODIFICATION 주석 추가
   - extensionPath 기반 시스템 선택 구현

4. **🔄 테스트 업데이트**
   - `003-08-commands-json-conversion.test.ts` 업데이트
   - Cline 모드 테스트 제거
   - Caret 전용 기능에 집중
   - 예상 출력값 업데이트

### **아키텍처 검증 체크리스트**
- [ ] **Cline 호환성**: 기존 하드코딩 함수 변경 없음
- [ ] **Caret 최적화**: Caret 모드 전용 JSON 시스템
- [ ] **패턴 일관성**: system.ts 성공 패턴 준수
- [ ] **백업 보호**: 수정 전 .cline 파일 생성
- [ ] **테스트 커버리지**: 업데이트된 테스트 100% 통과

## 📁 **현재 파일 상태**

### **✅ 완료됨 (그대로 유지)**
- `caret-src/core/prompts/JsonTemplateLoader.ts` (loadRawJson 메서드)
- `src/core/prompts/commands.ts.cline` (백업 파일)
- 테스트 프레임워크 구조

### **🔄 수정 필요**
- 4개 JSON 템플릿 파일 전체 (Cline 내용 제거)
- `CaretCommands.ts` (모드 로직 제거)
- `003-08-commands-json-conversion.test.ts` (기대값 업데이트)

### **⏳ 구현 대기**
- `src/core/prompts/commands.ts` 래퍼 (system.ts 패턴)

## 🎯 **다음 세션 성공 기준**

1. **✅ 패턴 정렬**: Commands가 system.ts 패턴 정확히 준수
2. **✅ Cline 보존**: 기존 commands.ts 동작 100% 변경 없음
3. **✅ Caret 향상**: JSON 시스템이 토큰 효율성 제공
4. **✅ 테스트 검증**: 모든 테스트가 올바른 기대값으로 통과
5. **✅ Phase 2 준비**: claude4.ts 변환을 위한 깔끔한 기반

## 🔍 **주요 참조 파일**

### **패턴 참조**
- `caret-src/core/prompts/system.ts` (20-35줄) - **올바른 패턴**
- `src/core/prompts/system.ts` - 기존 하드코딩 참조

### **검토할 파일**
- `caret-src/core/prompts/sections/commands/*.json` - **Cline 내용 제거**
- `caret-src/core/prompts/CaretCommands.ts` - **Caret 전용으로 단순화**

## 💡 **구현 전략**

1. **패턴으로 새로 시작**: system.ts 패턴 정확히 적용
2. **단계별 검증**: 각 변경 후 테스트
3. **단순함 유지**: 모드 로직 과도하게 엔지니어링 피하기
4. **가치에 집중**: Caret은 토큰 효율성, Cline은 안정성

---

## 📋 **구체적인 실행 가이드 (단계별)**

### **🔧 1단계: JSON 템플릿 정리 (30분)**

#### **수정할 파일**: `caret-src/core/prompts/sections/commands/*.json`

**❌ 현재 잘못된 형태**:
```json
{
  "content_sections": {
    "description": {
      "cline": "전통적인 언어",
      "caret": "협업적인 언어"
    }
  }
}
```

**✅ 올바른 형태**:
```json
{
  "content_sections": {
    "description": "협업적인 언어 (Caret 전용)"
  }
}
```

**실행 방법**:
1. 각 JSON 파일에서 `"cline":` 줄 완전 삭제
2. `"caret":` 키 제거하고 값만 유지
3. 협업적/파트너십 언어로 내용 통일

---

### **🔧 2단계: CaretCommands 클래스 단순화 (45분)**

#### **수정할 파일**: `caret-src/core/prompts/CaretCommands.ts`

**❌ 제거할 코드**:
```typescript
// 제거: 생성자의 mode 매개변수
constructor(extensionPath: string, mode: 'cline' | 'caret' = 'caret')

// 제거: currentMode 관련 모든 코드
private currentMode: 'cline' | 'caret'

// 제거: 모드 관련 메서드들
getCurrentMode(): 'cline' | 'caret'
switchMode(mode: 'cline' | 'caret'): void

// 제거: applyModeVariations 메서드
private applyModeVariations(jsonTemplate: any, parameters: any): any
```

**✅ 단순화된 형태**:
```typescript
export class CaretCommands {
  constructor(extensionPath: string) {
    // mode 매개변수 제거
  }
  
  async generateCommand(commandName: string, parameters: any): Promise<string> {
    // 모드 구분 로직 제거, Caret 전용 로직만
  }
}
```

---

### **🔧 3단계: commands.ts 래퍼 구현 (60분)**

#### **참조 패턴**: `caret-src/core/prompts/system.ts` 20-35줄

**구현할 파일**: `src/core/prompts/commands.ts`

**1. 백업 생성**:
```bash
# 이미 존재하는지 확인
ls src/core/prompts/commands.ts.cline
# 없으면 생성 (있으면 건드리지 말 것!)
cp src/core/prompts/commands.ts src/core/prompts/commands.ts.cline
```

**2. 래퍼 패턴 구현**:
```typescript
import { CaretCommands } from '../../../caret-src/core/prompts/CaretCommands'

// CARET MODIFICATION: 기존 하드코딩 함수들 백업
const ORIGINAL_newTaskToolResponse = () => {
  // 기존 179줄 하드코딩 내용 그대로 복사
}

// CARET MODIFICATION: extensionPath 기반 시스템 선택
export const newTaskToolResponse = async (): Promise<string> => {
  const extensionPath = (global as any).extensionPath
  
  if (!extensionPath) {
    // Cline 모드: 기존 하드코딩 사용
    return ORIGINAL_newTaskToolResponse()
  } else {
    // Caret 모드: JSON 시스템 사용
    const caretCommands = new CaretCommands(extensionPath)
    return await caretCommands.newTaskToolResponse()
  }
}
```

---

### **🔧 4단계: 테스트 업데이트 (30분)**

#### **수정할 파일**: `caret-src/__tests__/003-08-commands-json-conversion.test.ts`

**❌ 제거할 테스트**:
```typescript
// 모든 Cline 모드 관련 테스트 제거
it('should instantiate with Cline mode', () => {
it('should support mode switching', () => {
it('should generate different identity for Cline mode', () => {
```

**✅ 업데이트할 테스트**:
```typescript
// 생성자 테스트 수정
it('should instantiate with Caret mode only', () => {
  const commands = new CaretCommands(extensionPath)
  expect(commands).toBeDefined()
  // mode 관련 검증 제거
})

// 예상 출력값 수정 - Caret 전용 내용만
expect(result).toContain('collaborative')
expect(result).toContain('partnership')
expect(result).not.toContain('traditional') // Cline 용어 없어야 함
```

---

### **🔧 5단계: 검증 및 테스트 (15분)**

**실행 순서**:
```bash
# 1. 컴파일 확인
npm run compile

# 2. 테스트 실행
npm test -- --run caret-src/__tests__/003-08-commands-json-conversion.test.ts

# 3. 전체 테스트 확인
npm test
```

**성공 기준**:
- ✅ 컴파일 에러 없음
- ✅ 모든 테스트 통과
- ✅ Cline 모드 관련 코드 완전 제거
- ✅ extensionPath 기반 시스템 선택 동작

---

## 🚨 **주의사항**

1. **백업 확인**: `commands.ts.cline` 파일이 이미 있으면 덮어쓰지 말 것
2. **단계별 검증**: 각 단계마다 컴파일/테스트 확인
3. **원본 보존**: system.ts 패턴 정확히 따라하기
4. **Cline 내용 완전 제거**: JSON에서 `"cline"` 키워드 전부 삭제

---

**다음 AI 지시사항**: 
위의 5단계를 순서대로 실행하되, 각 단계마다 검증 후 다음 단계 진행. 에러 발생 시 즉시 중단하고 문제 분석.