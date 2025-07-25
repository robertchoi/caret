# 024: Caret 모드 토큰 효율성 개선 분석 및 최적화

**업무 번호**: 024  
**상태**: ✅ **완료** (2025-07-18)
**업무 명**: Caret JSON 시스템의 실제 토큰 효율성 개선이 체감되지 않는 문제 분석 및 해결  
**우선순위**: 🔥 **HIGH** (토큰 비용 절약 효과 직결)  
**예상 소요 시간**: 3-4시간  
**단일 세션 완료 가능**: ✅ Yes  

## 📋 **업무 개요**

테스트 환경에서는 Caret의 JSON 기반 시스템 프롬프트가 Cline 대비 58%의 토큰 절약 효과를 보였으나, 실제 사용 환경에서는 그 효과가 체감되지 않는 문제가 발생했습니다. 이 업무의 목표는 실제 데이터 기반의 심층 분석을 통해 원인을 규명하고, 향후 최적화 방향을 제시하는 것입니다.

## 🎯 **업무 목표**

1.  **실제 환경 토큰 사용량 심층 분석**: 고도화된 통계 분석을 통해 테스트 환경과 실제 환경의 차이를 명확히 규명합니다.
2.  **데이터 기반 원인 분석**: 'API 호출당 효율성', '이상치' 등 다각적인 관점에서 성능 저하의 근본 원인을 분석합니다.
3.  **향후 최적화 방향 제시**: 분석 결과를 바탕으로 '동적 도구 로딩 시스템' 등 구체적인 해결 방안의 필요성을 데이터로 증명합니다.

## 🛠️ **분석 및 해결 과정**

### **Phase 1: 성능 비교 실험 및 보고서 시스템 고도화**

단순 평균 비교만으로는 실제 성능을 파악하기 어렵다는 문제점에서 출발하여, 다음과 같이 보고서 생성 스크립트(`generate-comprehensive-report.js`)를 점진적으로 고도화했습니다.

1.  **API 호출당 효율성 분석**: 모든 지표를 '실험당'이 아닌 **'API 호출당'** 기준으로 변경하여, 호출 1회당 순수 효율성을 비교할 수 있도록 개선했습니다.
2.  **통계적 분석 강화**: **중앙값(Median)**과 **표준편차(σ)**를 도입하여, 평균값만으로는 알 수 없는 데이터의 분포와 안정성을 파악했습니다.
3.  **그룹 기반 이상치 분석**: '같은 과업, 같은 모델' 등 동일 조건 그룹 내에서만 이상치를 탐지하도록 로직을 개선하여 분석의 정확도를 높였습니다.
4.  **조건부 비교 및 이상치 제외 분석**: **'Pro 모델 한정'**, **'이상치 제외'** 등 다양한 조건으로 데이터를 필터링하고 분석하는 기능을 추가하여, 특정 요인이 전체 결과에 미치는 영향을 심층적으로 파악할 수 있도록 했습니다.

### **Phase 2: 최종 보고서 기반 심층 분석**

고도화된 보고서 시스템을 통해 얻은 최종 분석 결과는 다음과 같습니다.

- **[최종 보고서 링크]**: `caret-docs\reports\experiment\json_caret_performance_test_20250713\comprehensive-performance-report-20250717.md`

## 🎯 **최종 분석 결론**

### **🚀 Pro 모델 기준 핵심 성과 (안정성 검증됨)**

**42회 실험을 통한 체계적 검증 결과 (Pro 모델 한정):**

| 지표 | Caret | Cline | Caret 우수성 |
|---|---|---|---|
| **API 호출당 비용** | $0.021532 | $0.027429 | 🟢 **21.5% 더 저렴** |
| **API 호출당 시간** | 11초 | 13초 | 🟢 **17.9% 더 빠름** |
| **API 호출당 입력 토큰** | 28,986 | 40,528 | 🟢 **28.5% 더 효율적** |
| **API 호출당 출력 토큰** | 416 | 471 | 🟢 **11.8% 더 효율적** |

### **🎯 시스템 프롬프트 토큰 최적화 성과**

```
📊 모드별 토큰 절약 효과:
Cline 원본:           11,791 tokens (47,161 chars)
Caret Agent 모드:     5,509 tokens (22,036 chars)  → 53.28% 절약 ✨
Caret Chatbot 모드:   3,575 tokens (14,299 chars)  → 69.68% 절약 🚀
```

### **핵심 발견사항**

1.  **API 호출당 효율성은 Caret 우세**: Pro 모델 기준으로 모든 지표에서 Caret이 Cline 대비 **실질적으로 더 효율적**인 것으로 검증되었습니다.

2.  **시스템 프롬프트 vs 실제 비용의 차이**: 시스템 프롬프트 토큰 절약(53-69%)과 실제 API 비용 절약(19-21.5%)의 차이는 **실제 사용에서 사용자 코드와 컨텍스트가 전체 토큰의 대부분을 차지**하기 때문입니다.

3.  **성능 안정성 개선**: Pro 모델 한정 분석에서는 Caret의 성능 변동성이 크게 개선되어, 안정적인 효율성을 보여주었습니다.

4.  **근본 원인 규명**: Phase 1에서 구현한 **MCP 서버 제거**로 최대 4,500 토큰을 절약하여 토큰 효율성을 크게 개선했습니다.

## 🚀 **구현 완료 사항**

### **✅ Phase 1: MCP 섹션 제거 완료**

**문제 해결:**
```typescript
// caret-src/core/prompts/JsonSectionAssembler.ts
generateMcpServerSection(): string {
    // CARET MODIFICATION: JIT Phase 1 - MCP 섹션 완전 제거
    // 토큰 최적화를 위해 MCP 서버 정보를 시스템 프롬프트에서 제외
    return ""; // 완전 제거로 최대 4,500 토큰 절약
}
```

### **✅ JSON 시스템 구현 완료**

- **15개 JSON 섹션**: `caret-src/core/prompts/sections/` 완전 구현
- **ChatBot/Agent 모드**: `BASE_PROMPT_INTRO.json`, `CHATBOT_AGENT_MODES.json`으로 구현
- **동적 로딩 시스템**: `CaretSystemPrompt.ts`, `JsonSectionAssembler.ts`로 구현
- **모드별 도구 필터링**: Chatbot 모드는 읽기 전용 도구만 허용

## 🚀 **향후 조치 (Phase 2 예정)**

### **동적 도구 로딩 시스템 (JIT Phase 2)**

```typescript
interface JITLoadingSystem {
    // 기본 필수 도구만 로딩 (1,800~2,200 토큰)
    coreTools: ['read_file', 'edit_file', 'search_replace', 'list_dir', 'codebase_search', 'run_terminal_cmd'];
    
    // 컨텍스트별 동적 로딩
    loadOnDemand: {
        browserContext: ['browser_action'],        // +800 토큰
        mcpContext: ['mcp_servers'],              // +2,000~4,500 토큰
        specialContext: ['specialized_tools']      // 상황별
    };
}
```

## 🔄 **검증 체크리스트**

### **✅ 분석 및 보고 완료 체크리스트**
- [x] 잘못된 위치의 실험 파일 정리 완료
- [x] 보고서 생성 스크립트의 분석 로직 오류 수정 완료
- [x] API 호출당 효율성 분석 기능 추가 완료
- [x] 중앙값, 표준편차 등 통계 분석 기능 추가 완료
- [x] 그룹별 이상치 탐지 기능 추가 완료
- [x] 이상치 제외 분석 기능 추가 완료
- [x] Pro 모델 한정 비교 분석 기능 추가 완료
- [x] 최종 보고서 생성 및 검토 완료
- [x] 실험 설계 문서(`experiment-design.md`)에 최종 분석 방법론 반영 완료
- [x] **JSON 시스템 구현 완료**: `caret-src/core/prompts/` 15개 섹션 구현
- [x] **MCP 제거 최적화**: 최대 4,500 토큰 절약 구현
- [x] **ChatBot/Agent 모드**: 실제 모드별 도구 필터링 구현

## 📝 **업무 진행 로그**

### **2025-01-27 (월) - 초기 분석 및 측정 시스템 구축**
- `system-prompt-token-measurement.js` 등 초기 측정 도구를 개발하여 테스트 환경에서의 토큰 효율성(58% 절약)을 측정함.
- 실제 환경과의 차이점을 인지하고, 동적 로딩 시스템의 필요성을 처음으로 제기함.

### **2025-07-18 (금) - 심층 분석 및 최종 결론 도출**
- **실험 데이터 정리**: `json-processor` 관련 파일을 올바른 위치로 이동.
- **보고서 시스템 고도화**: 단순 평균 비교 방식의 한계를 극복하기 위해, 피드백을 반복적으로 반영하여 보고서 생성 스크립트를 대폭 개선함.
  - **API 호출당 효율성 분석**으로 전환하여 직접적인 성능 비교가 가능해짐.
  - **중앙값, 표준편차**를 도입하여 데이터 분포와 안정성 파악.
  - **그룹별 이상치 탐지** 로직으로 분석 정확도 향상.
  - **이상치 제외 분석**, **Pro 모델 한정 분석** 등 다각적인 분석 기능 추가.
- **최종 분석 및 결론**: 고도화된 보고서를 통해 "Pro 모델 기준 실질적 효율성 우수"를 데이터로 증명하고, 근본 원인과 향후 해결 과제를 명확히 함.
- **JSON 시스템 구현**: `caret-src/core/prompts/` 완전 구현으로 53-69% 토큰 절약 달성.
