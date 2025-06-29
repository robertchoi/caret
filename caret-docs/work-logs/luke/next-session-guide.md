# 다음 세션 가이드 - Mission 1 진행 상황 및 방향 재설정

## 🎯 **현재 상황 (2025-01-29 롤백 후)**

### ✅ **Phase 1 완료 성과 (보존됨)**
- **✅ 003-01~003-06 모두 완료**: Chatbot/Agent 하이브리드 시스템 완전 구축
- **✅ 핵심 문제 해결**: 채팅 기록 변조, 모드 전환 기본값, 용어 통일 완료
- **✅ 시스템 안정화**: 594개 테스트 통과, 0개 실패로 견고한 기반 구축
- **✅ system.ts 확장 성공**: CaretSystemPrompt 패턴으로 안전한 확장 검증

### 🚨 **롤백된 문제들**
- **system.ts JSON 검증**: Mock 테스트 → 실제 검증으로 변경 작업 필요
- **모드 초기값 설정**: Caret/Cline 모드 변경시 기본값 문제 (11시간 작업 롤백)

## 🚀 **다음 세션 핵심 미션 2개**

---

## 📋 **현재 진행 상황 요약**

### **Mission 1: System.ts JSON 시스템 완전 검증**

#### **✅ Mission 1A: Mock → Real 검증 (완료)**
- **상태**: 100% 완료 ✅
- **성과**: Mock 기반 검증을 실제 Cline 시스템 프롬프트로 성공적으로 교체
- **결과**: ORIGINAL_CLINE_SYSTEM_PROMPT (47,215자) 검증 작동 중
- **수정된 파일들**: 
  - `caret-src/__tests__/cline-feature-validation.test.ts`
  - `vitest.config.ts` (@hosts, @generated 별칭 추가)
  - `vitest.setup.ts` (os 모듈 mock 수정)

#### **🔄 Mission 1B: JSON 동등성 (진행 중 - 2단계 접근)**

##### **1B-1단계: 비교 데이터 생성**
- **목표**: Cline vs Caret 도구 정의, 1B-2단계에서 사용할 구조화된 비교 데이터 생성
- **출력**: JSON 파일 형태의 나란히 비교 데이터
- **출력 위치**: `caret-docs/reports/json-caret/tool-comparison-data.json`
- **포함 내용**: 매개변수 세부사항, 설명, 사용 패턴, 소스 위치
- **성공 기준**: 핵심 도구 100% (caret에서 사용하지 않는 plan/act모드와 연관된 기능 제외하고 전체 기능 동일해야 함)

##### **1B-2단계: AI 의미론적 동등성 분석**
- **목표**: AI 기반 기능적 동등성 분석
- **입력 파일**: `caret-docs/reports/json-caret/tool-comparison-data.json`
- **출력 파일**: `caret-docs/reports/json-caret/semantic-equivalence-report.md`
- **분석 질문들**:
  - 두 시스템이 동일한 기능을 달성하는가?
  - 매개변수 패턴이 동등한가?
  - 사용자가 동일한 결과를 얻을 수 있는가?
- **출력**: 상세한 동등성 보고서

**📁 향후 계획**: `caret-docs/reports/json-caret/` 폴더는 JSON 시스템 관련 모든 분석 자료의 중앙 저장소로 사용
- 동등성 비교 분석
- 성능 평가 보고서
- 관련 메트릭 및 벤치마크 데이터

## 🔧 **핵심 기술 배경지식 - 새로운 AI가 반드시 알아야 할 내용**

### **시스템 구조 이해**

#### **Cline 원본 시스템**:
- **위치**: `src/core/prompts/system.ts`
- **방식**: `SYSTEM_PROMPT` 상수로 47,215자 일반 텍스트 저장
- **도구 정의**: 텍스트 내에 `## tool_name` 형식으로 도구 정의 포함
- **사용법**: AI에게 직접 텍스트로 전달

#### **Caret JSON 시스템**:
- **위치**: `caret-src/core/prompts/CaretSystemPrompt.ts`
- **방식**: JSON 템플릿 기반 동적 생성
- **도구 정의**: `caret-src/core/prompts/sections/TOOL_DEFINITIONS.json`에 JSON 형태로 저장
- **변환**: `formatJsonSection()` 함수로 JSON → 텍스트 변환

### **핵심 발견사항들**

#### **1. ToolExtractor의 정체**
- **중요**: ToolExtractor는 Cline 원본이 아닌 Caret 팀이 만든 분석 도구임
- **위치**: `caret-src/core/verification/` (Caret 생성)
- **한계**: `## tool_name` 패턴만 인식, JSON Schema 형식 인식 불가
- **실제 Cline**: 하드코딩된 도구 배열 사용 (`claude4-experimental.ts`)

#### **2. 포맷 차이점**
- **Cline 형식**: `## execute_command\nDescription: Execute a command...`
- **JSON Schema**: `<function>{"name": "execute_command", "description": "..."}</function>`
- **Caret JSON**: 처음엔 JSON 출력했지만 formatJsonSection 수정 후 Cline 형식으로 변환됨

#### **3. formatJsonSection 수정 내역**
```typescript
// 수정 전: template.tools 처리 없음 → JSON 그대로 출력
// 수정 후: template.tools 섹션 처리 추가
if (template.tools && typeof template.tools === 'object') {
    for (const [toolName, toolDef] of Object.entries(template.tools)) {
        if (typeof toolDef === 'object' && toolDef.title) {
            result += `\n## ${toolDef.title}\n`
            if (toolDef.description) {
                result += `Description: ${toolDef.description}\n`
            }
            // ... 매개변수 처리
        }
    }
}
```

## 📁 **현재 파일 상태와 구체적 위치**

### **핵심 파일들**:

#### **테스트 파일**: `caret-src/__tests__/cline-feature-validation.test.ts`
- **현재 상태**: 기본 기능 테스트 작동 중 ✅
- **문제**: 복잡한 비교 테스트에 타입 에러 존재
- **해야할 일**: 깨진 테스트 정리, 1B-1단계 구현

#### **프롬프트 생성**: `caret-src/core/prompts/CaretSystemPrompt.ts`
- **현재 상태**: formatJsonSection 수정 완료, JSON → 텍스트 변환 작동
- **핵심 함수**: `generateFromJsonSections()` - JSON 템플릿들을 텍스트로 변환
- **결과**: 19,761자 생성 (이전 5,459자에서 4배 증가)

#### **도구 정의**: `caret-src/core/prompts/sections/TOOL_DEFINITIONS.json`
- **현재 상태**: 15개 도구 정의됨
- **형식**: `{"tools": {"execute_command": {"title": "execute_command", ...}}}`
- **변환 결과**: 14,373자의 도구 섹션 생성 (이전 71자에서 대폭 증가)

#### **Cline 원본 프롬프트**: `src/core/prompts/system.ts`
- **중요**: `SYSTEM_PROMPT` 상수에 47,215자 텍스트
- **import 방법**: `import { SYSTEM_PROMPT as ORIGINAL_CLINE_SYSTEM_PROMPT } from '../../../src/core/prompts/system'`
- **검증됨**: 테스트에서 성공적으로 import하여 사용 중

### **환경 설정 파일들**:

#### **vitest.config.ts** - 추가된 별칭들:
```typescript
'@hosts': path.resolve(__dirname, './src/hosts'),
'@generated': path.resolve(__dirname, './src/generated')
```

#### **vitest.setup.ts** - os 모듈 mock 수정:
```typescript
vi.mock('os', async () => {
    const actual = await vi.importOriginal('os')
    return {
        ...actual,
        default: actual
    }
})
```

## 🎯 **1B-1단계 구체적 구현 방법**

### **목표**: 비교 데이터 파일 생성

#### **필요한 데이터 추출**:

1. **Cline 도구 데이터**:
   ```typescript
   // src/core/prompts/system.ts에서 SYSTEM_PROMPT 파싱
   // ToolExtractor.extractTools() 사용 (## tool_name 패턴 인식)
   ```

2. **Caret 도구 데이터**:
   ```typescript
   // TOOL_DEFINITIONS.json 직접 읽기
   // 또는 CaretSystemPrompt.generateFromJsonSections() 결과 파싱
   ```

#### **비교 데이터 구조** (예시):
```json
{
  "comparison_metadata": {
    "generated_at": "2025-01-29T...",
    "cline_source": "src/core/prompts/system.ts",
    "caret_source": "caret-src/core/prompts/sections/TOOL_DEFINITIONS.json"
  },
  "tools": {
    "execute_command": {
      "cline": {
        "name": "execute_command",
        "description": "Execute a command in the terminal...",
        "parameters": {
          "command": {"required": true, "type": "string"},
          "requires_approval": {"required": false, "type": "boolean"}
        }
      },
      "caret": {
        "name": "execute_command", 
        "description": "Execute a command in the terminal...",
        "parameters": {
          "command": {"required": true, "type": "string"},
          "requires_approval": {"required": false, "type": "boolean"}
        }
      },
      "comparison": {
        "name_match": true,
        "description_match": true,
        "parameter_count_match": true,
        "parameter_names_match": true,
        "required_params_match": true
      }
    }
  }
}
```

#### **구현 단계**:
1. **테스트 파일 정리**: 타입 에러 있는 복잡한 테스트 제거
2. **데이터 추출 함수 작성**: Cline, Caret 각각의 도구 정보 추출
3. **비교 로직 구현**: 매개변수 이름, 개수, 필수여부 비교
4. **JSON 파일 출력**: `caret-docs/reports/json-caret/tool-comparison-data.json` 생성
5. **검증**: 생성된 파일이 올바른 형식인지 확인

### **예상 문제점과 해결책**:

#### **문제 1**: 매개변수 파싱 어려움
- **원인**: 텍스트 형식이 일정하지 않을 수 있음
- **해결**: 정규식 패턴을 여러 개 준비하여 robust하게 파싱

#### **문제 2**: 타입 시스템 충돌
- **원인**: Cline 타입과 Caret 타입 불일치
- **해결**: any 타입 사용하거나 별도 인터페이스 정의

#### **문제 3**: 파일 경로 문제
- **원인**: Windows 경로 vs Unix 경로
- **해결**: path.join() 사용, `caret-docs/reports/json-caret/` 디렉토리 생성 확인

## 🎯 **1B-2단계 구체적 구현 방법**

### **목표**: AI 의미론적 동등성 분석

#### **분석 방법**:
1. **1B-1단계 결과 로드**: `caret-docs/reports/json-caret/tool-comparison-data.json` 읽기
2. **차이점 추출**: 일치하지 않는 도구들 리스트업
3. **AI 프롬프트 생성**: 각 차이점에 대한 분석 요청
4. **의미론적 판단**: 기능적으로 동등한지 AI가 판단
5. **보고서 생성**: 최종 동등성 여부 결론

#### **AI 분석 질문 템플릿**:
```
도구: execute_command
Cline 버전: {cline_definition}
Caret 버전: {caret_definition}

질문:
1. 두 정의가 기능적으로 동등한가?
2. 매개변수 차이가 실제 사용에 영향을 주는가?
3. 사용자 경험에 차이가 있는가?
```

## 🚨 **반드시 확인해야 할 핵심 사항들**

### **매개변수 일치성 체크리스트**:
- [ ] **execute_command**: command(필수), requires_approval(선택)
- [ ] **read_file**: path(필수)
- [ ] **write_to_file**: path(필수), content(필수)
- [ ] **search_files**: pattern(필수), file_pattern(선택)
- [ ] **list_files**: path(필수)

### **제외해야 할 Cline 기능들** (Plan/Act 모드 관련):
- plan 관련 도구들
- act 모드 전용 기능들
- Caret에서 사용하지 않는 실험적 기능들

## 🎯 **다음 세션 액션 플랜**

### **즉시 할 일 (Phase 1)**:
1. **현재 테스트 파일 정리** 
   - 파일: `caret-src/__tests__/cline-feature-validation.test.ts`
   - 작업: 타입 에러 있는 복잡한 테스트들 제거
   - 보존: 기본 기능 테스트는 유지

2. **1B-1단계 실행** 
   - 구현: 비교 데이터 생성 함수
   - 출력: `caret-docs/reports/json-caret/tool-comparison-data.json`
   - 검증: 파일 형식 및 데이터 정확성 확인

3. **데이터 품질 수동 검토**
   - 확인: 핵심 도구들이 모두 포함되었는지
   - 검증: 매개변수 정보가 정확한지
   - 준비: 1B-2단계를 위한 데이터 완성도

### **Phase 2**:
4. **1B-2단계 실행** 
   - 로드: 1B-1단계 생성 데이터
   - 분석: AI 기반 의미론적 동등성 판단
   - 출력: `caret-docs/reports/json-caret/semantic-equivalence-report.md`

5. **Mission 1B 완료 결정** 
   - 기준: 핵심 도구 100% 기능적 동등성 확인
   - 예외처리: Plan/Act 모드 관련 기능 제외
   - 결론: Caret JSON 시스템의 Cline 대비 완전성 판단

6. **결과 문서화** 
   - 파일: `caret-docs/reports/json-caret/mission-1b-completion-report.md`
   - 내용: 검증 과정, 결과, 향후 개선사항

### **Mission 2 (대기 중)**:
- 모드 초기값 설정 (Caret 모드 → Agent 기본값, Cline 모드 → Plan 기본값)
- 시작 안 함 - Mission 1 완료 대기 중

## 💻 **테스트 실행 명령어**

```bash
# 현재 테스트 실행
npm test cline-feature-validation

# 단일 테스트 실행 (디버깅용)
npm test -- --reporter=verbose cline-feature-validation

# 커버리지 포함
npm run test:coverage

# 와치 모드
npm run test:watch
```

## 🧠 **핵심 기술 학습 사항**

1. **Mock vs Real**: 항상 모의 분석보다 실제 시스템 검증 선호
2. **구조 vs 기능**: 구조가 다를 때 기능적 동등성에 집중
3. **도구 분석**: 실제 시스템 동작과 일치하는 분석 도구 생성
4. **검증 전략**: 명확한 성공 기준을 가진 다단계 접근
5. **ToolExtractor ≠ Cline**: Caret 분석 도구와 실제 Cline 시스템 구분 필수
6. **formatJsonSection 패턴**: JSON → 텍스트 변환 시 모든 섹션 처리 확인

## ⚠️ **해결해야 할 알려진 문제들**

1. **복잡한 커버리지 테스트의 타입 에러** 
   - 위치: `cline-feature-validation.test.ts` 하단부
   - 해결: 단순화 또는 제거, 1B-1단계로 재구현

2. **파일 출력 경로 처리** 
   - 문제: Windows/Unix 경로 차이
   - 해결: `path.join()` 사용, `caret-docs/reports/json-caret/` 디렉토리 생성 확인

3. **테스트 격리** 
   - 문제: 테스트 간 상태 공유 가능성
   - 해결: 각 테스트마다 독립적인 설정과 정리

4. **명확한 성공 기준** 
   - 문제: "100% 동등성"의 모호함
   - 해결: 핵심 도구별 구체적 체크리스트 작성

## 📊 **진행 상황 체크리스트**

### **Mission 1A**: ✅ 완료
- [x] Mock → Real 검증 전환
- [x] ORIGINAL_CLINE_SYSTEM_PROMPT import
- [x] 47,215자 실제 프롬프트 검증
- [x] vitest 설정 수정
- [x] 테스트 통과 확인

### **Mission 1B-1단계**: 🔄 대기 중
- [ ] 테스트 파일 정리
- [ ] Cline 도구 데이터 추출 함수
- [ ] Caret 도구 데이터 추출 함수  
- [ ] 비교 로직 구현
- [ ] JSON 파일 출력
- [ ] 데이터 품질 검증

### **Mission 1B-2단계**: ⏳ 1단계 후
- [ ] 비교 데이터 로드
- [ ] AI 분석 프롬프트 생성
- [ ] 의미론적 동등성 분석
- [ ] 보고서 생성
- [ ] 최종 결론 도출

---

**상태**: 새로운 AI 세션에서 바로 시작 가능하도록 기술 세부사항 완비
**우선순위**: 1B-1단계 (비교 데이터) → 1B-2단계 (AI 분석) 완료
**목표**: Caret JSON의 Cline 텍스트 대비 기능적 동등성에 대한 확실한 답변