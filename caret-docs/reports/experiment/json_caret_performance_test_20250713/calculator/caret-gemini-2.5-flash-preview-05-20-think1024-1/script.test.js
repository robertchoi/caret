// calculator/caret-gemini-2.5-flash-preview-05-20-think1024-1/script.test.js

// 테스트를 위한 간단한 assert 함수
function assert(condition, message) {
    if (!condition) {
        console.error(`Assertion Failed: ${message}`);
        return false;
    }
    console.log(`Assertion Passed: ${message}`);
    return true;
}

// script.js에서 내보낸 calculator 객체를 사용
// script.js가 먼저 로드되어야 합니다.
// let calculator = {}; // 이 줄은 제거하거나 주석 처리합니다.

// 테스트 실행 함수
function runTests() {
    console.log("--- 계산기 로직 테스트 시작 ---");

    // 각 테스트 전에 계산기 초기화
    calculator.clear();

    // 덧셈 테스트
    calculator.appendNumber("2");
    calculator.setOperator("+");
    calculator.appendNumber("3");
    calculator.equals();
    assert(calculator.getCurrentInput() === "5", "덧셈: 2 + 3 = 5");
    calculator.clear();

    // 뺄셈 테스트
    calculator.appendNumber("5");
    calculator.setOperator("-");
    calculator.appendNumber("2");
    calculator.equals();
    assert(calculator.getCurrentInput() === "3", "뺄셈: 5 - 2 = 3");
    calculator.clear();

    // 곱셈 테스트
    calculator.appendNumber("4");
    calculator.setOperator("*");
    calculator.appendNumber("3");
    calculator.equals();
    assert(calculator.getCurrentInput() === "12", "곱셈: 4 * 3 = 12");
    calculator.clear();

    // 나눗셈 테스트
    calculator.appendNumber("10");
    calculator.setOperator("/");
    calculator.appendNumber("2");
    calculator.equals();
    assert(calculator.getCurrentInput() === "5", "나눗셈: 10 / 2 = 5");
    calculator.clear();

    // 소수점 연산 테스트
    calculator.appendNumber("2");
    calculator.appendNumber(".");
    calculator.appendNumber("5");
    calculator.setOperator("+");
    calculator.appendNumber("1");
    calculator.appendNumber(".");
    calculator.appendNumber("5");
    calculator.equals();
    assert(calculator.getCurrentInput() === "4", "소수점 연산: 2.5 + 1.5 = 4");
    calculator.clear();

    // 연속 연산 테스트 (입력 순서대로 계산)
    calculator.appendNumber("2");
    calculator.setOperator("+");
    calculator.appendNumber("3");
    calculator.setOperator("*"); // 2 + 3 = 5, 그 다음 5 * 4 = 20
    calculator.appendNumber("4");
    calculator.equals();
    assert(calculator.getCurrentInput() === "20", "연속 연산: 2 + 3 * 4 = 20 (입력 순서대로)");
    calculator.clear();

    // 0으로 나누기 테스트
    calculator.appendNumber("5");
    calculator.setOperator("/");
    calculator.appendNumber("0");
    calculator.equals();
    assert(calculator.getCurrentInput() === "Error", "0으로 나누기: 5 / 0 = Error");
    calculator.clear();

    // 초기화 테스트
    calculator.appendNumber("123");
    calculator.setOperator("+");
    calculator.appendNumber("456");
    calculator.clear();
    assert(calculator.getCurrentInput() === "0", "초기화: C 버튼 클릭 시 모든 상태 초기화");
    calculator.clear();

    // 음수 결과 테스트
    calculator.appendNumber("2");
    calculator.setOperator("-");
    calculator.appendNumber("5");
    calculator.equals();
    assert(calculator.getCurrentInput() === "-3", "음수 결과: 2 - 5 = -3");
    calculator.clear();

    // 다중 소수점 입력 방지 테스트
    calculator.appendNumber("2");
    calculator.appendNumber(".");
    calculator.appendNumber("5");
    calculator.appendNumber("."); // 두 번째 소수점 입력 시도
    assert(calculator.getCurrentInput() === "2.5", "다중 소수점 입력 방지: 2..5와 같은 잘못된 입력 방지");
    calculator.clear();

    console.log("--- 계산기 로직 테스트 완료 ---");
}
