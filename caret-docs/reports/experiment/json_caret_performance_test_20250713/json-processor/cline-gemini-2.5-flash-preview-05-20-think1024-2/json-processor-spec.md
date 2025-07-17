# JSON 데이터 처리 시스템 요구사항 명세서

## 1. 개요
본 문서는 JSON 데이터를 효율적으로 처리하기 위한 시스템의 요구사항을 정의합니다. 이 시스템은 다양한 데이터 변환, 필터링, 집계, 정렬 기능을 제공하며, JSON 및 CSV 파일 입출력을 지원합니다.

## 2. 기능 요구사항

### 2.1. 데이터 변환
*   **중첩 JSON 평면화 (Flattening Nested JSON)**
    *   **설명**: 중첩된 JSON 객체를 단일 레벨의 평면화된 객체로 변환합니다. 중첩된 키는 `.` (점)으로 연결하여 표현합니다.
    *   **입력 예시**:
        ```json
        {
          "user": {
            "profile": {
              "name": "John Doe",
              "age": 30
            },
            "contact": {
              "email": "john.doe@example.com"
            }
          },
          "address": {
            "city": "New York",
            "zip": "10001"
          }
        }
        ```
    *   **출력 예시**:
        ```json
        {
          "user.profile.name": "John Doe",
          "user.profile.age": 30,
          "user.contact.email": "john.doe@example.com",
          "address.city": "New York",
          "address.zip": "10001"
        }
        ```
    *   **테스트 핵심 로직**:
        *   단순 중첩 객체 평면화
        *   여러 레벨의 중첩 객체 평면화
        *   배열 내 객체 평면화 (배열 인덱스 포함)
        *   빈 객체 또는 null 값 처리
*   **배열 데이터 그룹화 (Grouping Array Data)**
    *   **설명**: 특정 필드를 기준으로 배열 데이터를 그룹화합니다.
    *   **입력 예시**:
        ```json
        [
          {"name": "Alice", "department": "HR", "location": "Seoul"},
          {"name": "Bob", "department": "IT", "location": "Busan"},
          {"name": "Charlie", "department": "HR", "location": "Seoul"},
          {"name": "David", "department": "IT", "location": "Seoul"}
        ]
        ```
    *   **출력 예시 (department 기준)**:
        ```json
        {
          "HR": [
            {"name": "Alice", "department": "HR", "location": "Seoul"},
            {"name": "Charlie", "department": "HR", "location": "Seoul"}
          ],
          "IT": [
            {"name": "Bob", "department": "IT", "location": "Busan"},
            {"name": "David", "department": "IT", "location": "Seoul"}
          ]
        }
        ```
    *   **테스트 핵심 로직**:
        *   단일 필드 그룹화
        *   다중 필드 그룹화 (예: department, location)
        *   존재하지 않는 필드로 그룹화 시 빈 객체 반환
        *   빈 배열 입력 처리

### 2.2. 필터링 및 검색
*   **복잡한 조건 필터링 (Complex Conditional Filtering)**
    *   **설명**: AND/OR 조건을 조합하여 데이터를 필터링합니다. 정규식 기반 검색을 지원합니다.
    *   **조건 예시**: `(age > 25 AND department = "IT") OR (location = "Seoul" AND name LIKE "A.*")`
    *   **테스트 핵심 로직**:
        *   단일 조건 필터링 (숫자, 문자열, 불리언)
        *   AND 조건 필터링
        *   OR 조건 필터링
        *   AND/OR 혼합 조건 필터링
        *   정규식 기반 문자열 검색
        *   대소문자 구분/미구분 검색
        *   존재하지 않는 필드에 대한 조건 처리

### 2.3. 집계 및 통계
*   **숫자형 데이터 집계 (Numeric Data Aggregation)**
    *   **설명**: 지정된 숫자형 필드에 대해 합계(sum), 평균(average), 최대값(max), 최소값(min)을 계산합니다.
    *   **테스트 핵심 로직**:
        *   단일 필드에 대한 합계, 평균, 최대, 최소 계산
        *   유효하지 않은 숫자 데이터 (null, undefined, 문자열) 처리
        *   빈 배열 또는 해당 필드가 없는 경우 처리
*   **빈도 분석 (Frequency Analysis)**
    *   **설명**: 특정 필드의 값에 대한 빈도를 계산합니다.
    *   **테스트 핵심 로직**:
        *   문자열, 숫자, 불리언 필드에 대한 빈도 계산
        *   대소문자 구분/미구분 빈도 계산 옵션
        *   빈 배열 또는 해당 필드가 없는 경우 처리

### 2.4. 정렬 및 정제
*   **다중 필드 정렬 (Multi-field Sorting)**
    *   **설명**: 여러 필드를 기준으로 오름차순 또는 내림차순으로 데이터를 정렬합니다.
    *   **정렬 조건 예시**: `[{field: "department", order: "asc"}, {field: "age", order: "desc"}]`
    *   **테스트 핵심 로직**:
        *   단일 필드 오름차순/내림차순 정렬
        *   다중 필드 정렬 (우선순위 적용)
        *   숫자, 문자열, 날짜 데이터 정렬
        *   null, undefined 값 처리 (항상 마지막에 위치)
*   **중복 제거 (Deduplication)**
    *   **설명**: 특정 필드 또는 모든 필드를 기준으로 중복된 데이터를 제거합니다.
    *   **테스트 핵심 로직**:
        *   단일 필드 기준 중복 제거
        *   모든 필드 기준 중복 제거
        *   객체 내 중복 값 처리
        *   빈 배열 처리
*   **데이터 유효성 검증 (Data Validation)**
    *   **설명**: 스키마 정의에 따라 데이터의 유효성을 검증하고, 유효하지 않은 데이터를 식별하거나 제거합니다.
    *   **스키마 예시**: `{name: "string", age: "number", email: "email"}`
    *   **테스트 핵심 로직**:
        *   기본 타입 (string, number, boolean) 유효성 검증
        *   필수 필드 누락 검증
        *   정규식 기반 패턴 검증 (예: 이메일 형식)
        *   유효하지 않은 데이터 식별 및 보고

### 2.5. 파일 입출력
*   **JSON 파일 읽기/쓰기**
    *   **설명**: JSON 형식의 파일을 읽고 쓸 수 있습니다.
    *   **테스트 핵심 로직**:
        *   유효한 JSON 파일 읽기
        *   유효하지 않은 JSON 파일 처리 (오류 보고)
        *   JSON 데이터 파일 쓰기
*   **CSV 파일 읽기/쓰기**
    *   **설명**: CSV 형식의 파일을 읽고 쓸 수 있습니다.
    *   **테스트 핵심 로직**:
        *   유효한 CSV 파일 읽기 (헤더 포함/미포함)
        *   CSV 데이터 파일 쓰기 (헤더 포함/미포함)
        *   특수 문자 (쉼표, 따옴표) 포함된 CSV 데이터 처리

## 3. 성능 요구사항
*   **대용량 데이터 처리**: 100,000개 이상의 레코드를 포함하는 JSON/CSV 파일을 5초 이내에 처리할 수 있어야 합니다.
*   **메모리 효율성**: 대용량 데이터 처리 시 과도한 메모리 사용을 피해야 합니다.
*   **응답 시간**: CLI 명령 실행 후 1초 이내에 초기 응답을 제공해야 합니다.

## 4. 기술 스택
*   **언어**: Node.js (JavaScript)
*   **테스트 프레임워크**: Jest (또는 Node.js의 `assert` 모듈을 사용한 순수 JavaScript 테스트)
*   **외부 라이브러리**: 최소화 (필요 시 `csv-parse`, `csv-stringify` 등 검토)

## 5. 프로젝트 구조 (예시)
```
json-processor/
└── {AI에이전트명}/
    ├── json-processor-spec.md
    ├── processor.js          # 핵심 데이터 처리 로직
    ├── processor.test.js     # processor.js 테스트 코드
    ├── cli.js                # CLI 인터페이스
    ├── sample.json           # 샘플 JSON 데이터
    ├── sample.csv            # 샘플 CSV 데이터
    └── package.json          # 프로젝트 의존성 관리
