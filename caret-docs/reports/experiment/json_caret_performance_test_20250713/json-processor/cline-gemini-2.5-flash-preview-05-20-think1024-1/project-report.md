# JSON 데이터 처리 시스템 프로젝트 보고서

## 1. 프로젝트 개요
본 프로젝트는 JSON 데이터를 효율적으로 처리하기 위한 시스템을 구현합니다. 이 시스템은 데이터 변환(평면화, 그룹화), 필터링 및 검색, 집계 및 통계, 정렬 및 정제, 그리고 파일 입출력(JSON, CSV) 기능을 제공합니다. Node.js와 Jest를 사용하여 테스트 주도 개발(TDD) 방식으로 구현되었으며, CLI 인터페이스를 통해 쉽게 사용할 수 있습니다.

## 2. 구현된 기능 목록

### 2.1. 데이터 변환
- **중첩 JSON 평면화**: 중첩된 JSON 객체를 점(.) 표기법을 사용하여 평면화된 키-값 쌍으로 변환합니다.
- **배열 데이터 그룹화**: 지정된 키(필드)를 기준으로 배열 데이터를 그룹화합니다. 단일 및 다중 키 그룹화를 지원합니다.

### 2.2. 필터링 및 검색
- **복잡한 조건 필터링**: `eq`, `ne`, `gt`, `lt`, `ge`, `le`, `regex` 연산자를 지원하며, AND/OR 논리 연산자를 통해 복잡한 필터링 조건을 적용할 수 있습니다.

### 2.3. 집계 및 통계
- **숫자형 데이터 집계**: 지정된 숫자형 필드에 대해 합계(sum), 평균(average), 최대값(max), 최소값(min)을 계산합니다.
- **빈도 분석**: 특정 필드의 값에 대한 빈도수를 계산합니다.

### 2.4. 정렬 및 정제
- **다중 필드 정렬**: 하나 이상의 필드를 기준으로 데이터를 오름차순 또는 내림차순으로 정렬합니다.
- **중복 제거**: 지정된 필드를 기준으로 중복된 데이터를 제거합니다.
- **데이터 유효성 검증**: 필수 필드 존재 여부를 검증합니다.

### 2.5. 파일 입출력
- **JSON 형식 지원**: JSON 파일을 읽고 쓸 수 있습니다.
- **CSV 형식 지원**: CSV 파일을 읽고 JSON으로 변환하거나, JSON 데이터를 CSV로 변환하여 쓸 수 있습니다.

## 3. 사용된 기술 스택
- **Node.js**: 서버 측 JavaScript 런타임 환경으로, 시스템의 핵심 로직 구현에 사용되었습니다.
- **Jest**: JavaScript 테스트 프레임워크로, TDD 방식에 따라 모든 핵심 기능에 대한 단위 테스트를 작성하는 데 사용되었습니다.
- **fs (Node.js 내장 모듈)**: 파일 시스템 작업을 위해 사용되었습니다.
- **path (Node.js 내장 모듈)**: 파일 경로 처리를 위해 사용되었습니다.

## 4. 프로젝트 구조 설명
```
json-processor/
└── cline-gemini-2.5-flash-preview-05-20-think1024-1/
    ├── json-processor-spec.md    # 요구사항 명세서
    ├── processor.js              # 핵심 데이터 처리 로직 구현
    ├── processor.test.js         # processor.js에 대한 테스트 코드
    ├── cli.js                    # 명령줄 인터페이스 (CLI) 구현
    ├── sample.json               # CLI 테스트를 위한 샘플 JSON 데이터
    ├── package.json              # 프로젝트 의존성 및 스크립트 정의 (Jest 포함)
    └── project-report.md         # 현재 프로젝트 보고서
```

- `processor.js`: JSON 데이터 처리의 모든 핵심 로직(변환, 필터링, 집계, 정렬, 정제, 파일 I/O)이 포함된 클래스입니다.
- `processor.test.js`: `processor.js`에 구현된 각 기능에 대한 단위 테스트를 포함합니다. TDD 원칙에 따라 기능 구현 전에 작성되었습니다.
- `cli.js`: Node.js의 `process.argv`를 사용하여 명령줄 인수를 파싱하고, `JsonProcessor` 클래스의 메서드를 호출하여 다양한 데이터 처리 작업을 수행하는 CLI 애플리케이션입니다.
- `sample.json`: CLI 명령을 테스트하고 시스템의 실제 동작을 검증하기 위한 예시 JSON 데이터 파일입니다.
- `package.json`: 프로젝트의 메타데이터, 의존성(Jest), 그리고 `npm test`, `npm run cli`와 같은 스크립트를 정의합니다.

## 5. TDD 접근 방식 요약
본 프로젝트는 테스트 주도 개발(TDD) 방법론을 엄격히 따랐습니다. 각 기능 요구사항에 대해 다음 단계를 반복했습니다:
1.  **테스트 작성**: 먼저 기능이 어떻게 작동해야 하는지를 정의하는 실패하는 테스트 케이스를 작성했습니다.
2.  **코드 구현**: 테스트를 통과시키기 위한 최소한의 코드를 `processor.js`에 구현했습니다.
3.  **리팩토링**: 테스트가 통과하면 코드를 개선하고 최적화했습니다.

이러한 접근 방식은 코드의 견고성을 높이고, 버그를 조기에 발견하며, 요구사항에 대한 명확한 이해를 바탕으로 개발을 진행하는 데 기여했습니다.

## 6. 성능 테스트 결과
(이 섹션은 4단계 검증 및 보완 후 실제 CLI 실행을 통해 확인된 내용을 바탕으로 업데이트될 예정입니다.)
현재까지의 단위 테스트 결과, 모든 기능이 예상대로 작동하며, 소규모 데이터셋에서는 빠른 응답 시간을 보였습니다. 대용량 데이터에 대한 성능은 CLI를 통한 실제 실행 시 추가 검증이 필요합니다.

## 7. 검증 및 보완 (4단계)
- `json-processor-spec.md` 파일의 내용은 요구사항을 정확히 반영하고 있습니다.
- `processor.test.js`의 테스트 코드는 데이터 변환, 필터링, 집계, 정렬, 정제, 파일 입출력 등 모든 핵심 로직을 검증하고 있습니다.
- `processor.js`의 핵심 로직은 모든 테스트를 성공적으로 통과했습니다.
- CLI 실행 확인:
  - `flatten` 명령: `node cli.js flatten sample.json flattened.json` 명령을 실행하여 `sample.json` 파일이 성공적으로 평면화되어 `flattened.json`으로 저장됨을 확인했습니다.
  - `group` 명령: `node cli.js group sample.json grouped.json department city` 명령을 실행하여 `sample.json` 파일이 `department`와 `city`를 기준으로 성공적으로 그룹화되어 `grouped.json`으로 저장됨을 확인했습니다.
  - `filter` 명령: `node cli.js filter sample.json filtered.json age:gt:30:number department:eq:Sales --operator AND` 명령을 실행하여 `sample.json` 파일에서 `age`가 30보다 크고 `department`가 'Sales'인 데이터가 성공적으로 필터링되어 `filtered.json`으로 저장됨을 확인했습니다.
  - `aggregate` 명령 (sum): `node cli.js aggregate sample.json salary sum` 명령을 실행하여 `sample.json` 파일의 `salary` 필드 합계가 올바르게 계산됨을 확인했습니다 (결과: 455000).
  - `sort` 명령: `node cli.js sort sample.json sorted.json age:desc name:asc` 명령을 실행하여 `sample.json` 파일이 `age` 내림차순, `name` 오름차순으로 성공적으로 정렬되어 `sorted.json`으로 저장됨을 확인했습니다.
  - `deduplicate` 명령: `node cli.js deduplicate sample.json deduplicated.json id name` 명령을 실행하여 `sample.json` 파일에서 `id`와 `name` 필드를 기준으로 중복된 데이터가 성공적으로 제거되어 `deduplicated.json`으로 저장됨을 확인했습니다.
  - `validate` 명령: `node cli.js validate sample.json id name age` 명령을 실행하여 `sample.json` 파일의 데이터 유효성 검증 결과가 `Valid`임을 확인했습니다.
  - `read-csv` 명령: `node cli.js read-csv sample.csv csv_to_json.json` 명령을 실행하여 `sample.csv` 파일이 성공적으로 JSON으로 변환되어 `csv_to_json.json`으로 저장됨을 확인했습니다.
  - `write-csv` 명령: `node cli.js write-csv csv_to_json.json json_to_csv.csv` 명령을 실행하여 JSON 데이터가 성공적으로 CSV로 변환되어 `json_to_csv.csv`로 저장됨을 확인했습니다.
