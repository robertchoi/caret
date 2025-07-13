# AI 에이전트 성능 비교 실험 설계서

## 1. 실험 목적

본 실험의 주요 목적은 **Caret**과 **Cline** AI 코딩 어시스턴트의 성능을 정량적으로 비교 분석하는 것입니다. Caret은 Cline을 기반으로 개선되었으며, Cline 모드를 지원하므로 두 에이전트 간의 직접적인 성능 비교가 가능합니다.

또한, **Cursor**와의 비교를 통해 외부 AI 에이전트와의 성능 차이도 함께 분석하여 Caret의 상대적 성능 수준을 파악하고자 합니다.

## 2. 실험 대상 및 변수

### 2.1. 실험 과제 (3종)

1.  **Calculator**: 간단한 웹 계산기 애플리케이션 개발
2.  **Markdown**: 마크다운 뷰어 애플리케이션 개발
3.  **Todolist**: Todo 리스트 애플리케이션 개발

### 2.2. 비교 대상 AI 에이전트

*   **Caret vs. Cline (주요 비교)**
    *   **AI 에이전트**: `caret`, `cline`
    *   **사용 모델**:
        *   `gemini-2.5-pro-preview-06-05 extended thinking`
        *   `gemini-2.5-flash-preview-05-20 extended thinking`
    *   **비교 조합**: 3개 과제 x 2개 모델 x 2개 AI 에이전트 = **총 12회 실험**
    *   **아래는 세션의 명령 예시**
```
@/caret-docs\reports\experiment\json_caret_performance_test_20250713\calcualtor-comparison-instructions.md  에 따라 실험 진행해줘.
AI에이전트명은 caret-gemini-2.5-pro-preview-06-05-think1024
```

*   **Caret vs. Cursor (부가 비교)**
    *   **AI 에이전트**: `caret`, `cursor`
    *   **사용 모델**: `claude-3.7-sonet`
    *   **비교 조합**: 3개 과제 x 1개 모델 x 2개 AI 에이전트 = **총 6회 실험**
    *   **특이사항**: 공정한 비교를 위해, 이 실험에서는 Caret 에이전트도 외부 API 설정을 통해 `claude-3.7-sonet` 모델을 사용하도록 구성합니다. 이를 통해 동일한 모델 조건 하에서 각 에이전트의 순수 성능(처리 속도, API 호출 효율성 등)을 측정합니다.

## 3. 실험 수행 방법

### 3.1. 공통 수행 절차

1.  각 실험 과제에 해당하는 **작업 지시서**(`...-comparison-instructions.md`)의 5단계 절차를 정확히 따릅니다.
2.  각 단계별로 명시된 요청(prompt)을 AI 에이전트에게 전달하고, 결과물을 생성합니다.
3.  모든 단계가 완료되면, 5단계에 명시된 **성능 보고서 생성 스크립트**를 실행합니다.
    ```bash
    # 예시: calculator 과제를 caret 에이전트로 수행한 경우
    node ./generate-report.js calculator caret
    ```
4.  생성된 성능 보고서(`{AI에이전트명}-{yyyymmdd}-report.md`)를 해당 과제 폴더에 저장합니다.

### 3.2. 에이전트별 수행 환경

*   **Caret/Cline**: Caret VSCode 익스텐션 내에서 `Caret` 또는 `Cline` 모드를 선택하여 실험을 진행합니다.
    *   **Caret vs. Cursor 비교 시**: Caret의 모델 설정을 `claude-3.7-sonet`으로 변경하여 외부 API를 통해 실험을 진행합니다.
*   **Cursor**: Cursor IDE 환경에서 동일한 과제와 요청을 사용하여 실험을 진행합니다. Cursor의 경우, 성능 데이터(토큰 사용량, 비용 등)를 수동으로 기록해야 할 수 있습니다.

## 4. 측정 지표

성능 보고서 생성 스크립트를 통해 다음 지표를 자동으로 추출하고 기록합니다.

*   **총 입력/출력 토큰 (Tokens In/Out)**: API 호출에 사용된 총 토큰 수
*   **총 API 비용 (Cost)**: API 사용에 따른 예상 비용
*   **API 호출 횟수 (API Calls)**: 전체 과업 수행 중 API를 호출한 총 횟수
*   **총 실행 시간 (Total Latency)**: 첫 작업 시작부터 마지막 작업 완료까지의 시간
*   **실행 기간 (Execution Period)**: 실제 실험이 진행된 시작 및 종료 시각

Cursor와의 비교 시, 수행 시간과 API 호출 횟수를 중심으로 비교 분석을 진행합니다.

## 5. 기대 효과

본 실험을 통해 각 AI 에이전트와 모델 조합의 성능 특성을 명확히 파악하고, Caret의 개선 방향과 성능 최적화를 위한 구체적인 데이터를 확보할 수 있을 것으로 기대합니다.
