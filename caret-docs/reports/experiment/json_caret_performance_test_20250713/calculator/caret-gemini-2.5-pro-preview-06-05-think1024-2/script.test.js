// 가상 DOM 환경이나 테스트 프레임워크 없이 순수 JavaScript로 테스트를 작성합니다.
// 실제 로직 파일(script.js)이 필요합니다.

const assert = {
    strictEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Failed: ${actual} !== ${expected}`);
        }
    },
    throws(fn, message) {
        let caught = false;
        try {
            fn();
        } catch (e) {
            caught = true;
        }
        if (!caught) {
            throw new Error(message || 'Expected function to throw an error.');
        }
    }
};

function runTests() {
    const testResults = [];
    const logResult = (name, success, error) => {
        testResults.push({ name, success, error });
        console.log(`[${success ? 'PASS' : 'FAIL'}] ${name}`);
        if (!success) {
            console.error(error);
        }
    };

    // 테스트 케이스
    try {
        // 덧셈 테스트
        calculator.clear();
        calculator.inputDigit('5');
        calculator.setOperator('+');
        calculator.inputDigit('3');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), '8', '덧셈 테스트 실패');
        logResult('덧셈: 5 + 3 = 8', true);
    } catch (e) {
        logResult('덧셈: 5 + 3 = 8', false, e);
    }

    try {
        // 뺄셈 테스트
        calculator.clear();
        calculator.inputDigit('1');
        calculator.inputDigit('0');
        calculator.setOperator('-');
        calculator.inputDigit('4');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), '6', '뺄셈 테스트 실패');
        logResult('뺄셈: 10 - 4 = 6', true);
    } catch (e) {
        logResult('뺄셈: 10 - 4 = 6', false, e);
    }

    try {
        // 곱셈 테스트
        calculator.clear();
        calculator.inputDigit('7');
        calculator.setOperator('*');
        calculator.inputDigit('2');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), '14', '곱셈 테스트 실패');
        logResult('곱셈: 7 * 2 = 14', true);
    } catch (e) {
        logResult('곱셈: 7 * 2 = 14', false, e);
    }

    try {
        // 나눗셈 테스트
        calculator.clear();
        calculator.inputDigit('1');
        calculator.inputDigit('2');
        calculator.setOperator('/');
        calculator.inputDigit('4');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), '3', '나눗셈 테스트 실패');
        logResult('나눗셈: 12 / 4 = 3', true);
    } catch (e) {
        logResult('나눗셈: 12 / 4 = 3', false, e);
    }

    try {
        // 소수 연산 테스트
        calculator.clear();
        calculator.inputDigit('1');
        calculator.inputDecimal();
        calculator.inputDigit('5');
        calculator.setOperator('+');
        calculator.inputDigit('2');
        calculator.inputDecimal();
        calculator.inputDigit('5');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), '4', '소수 연산 테스트 실패');
        logResult('소수 연산: 1.5 + 2.5 = 4', true);
    } catch (e) {
        logResult('소수 연산: 1.5 + 2.5 = 4', false, e);
    }

    try {
        // 연속 연산 테스트
        calculator.clear();
        calculator.inputDigit('2');
        calculator.setOperator('*');
        calculator.inputDigit('3');
        calculator.calculate(); // 6
        calculator.setOperator('+');
        calculator.inputDigit('5');
        calculator.calculate(); // 11
        assert.strictEqual(calculator.getDisplayValue(), '11', '연속 연산 테스트 실패');
        logResult('연속 연산: 2 * 3 + 5 = 11', true);
    } catch (e) {
        logResult('연속 연산: 2 * 3 + 5 = 11', false, e);
    }

    try {
        // 0으로 나누기 테스트
        calculator.clear();
        calculator.inputDigit('8');
        calculator.setOperator('/');
        calculator.inputDigit('0');
        calculator.calculate();
        assert.strictEqual(calculator.getDisplayValue(), 'Error', '0으로 나누기 테스트 실패');
        logResult('0으로 나누기: 8 / 0 = Error', true);
    } catch (e) {
        logResult('0으로 나누기: 8 / 0 = Error', false, e);
    }

    try {
        // 초기화 테스트
        calculator.clear();
        calculator.inputDigit('1');
        calculator.inputDigit('2');
        calculator.clear();
        assert.strictEqual(calculator.getDisplayValue(), '0', '초기화 테스트 실패');
        logResult('초기화 (AC)', true);
    } catch (e) {
        logResult('초기화 (AC)', false, e);
    }

    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    console.log(`\nTest Summary: ${successCount} / ${totalCount} passed.`);
}

// 이 테스트 파일은 브라우저에서 script.js와 함께 로드되어야 합니다.
// 예: <script src="script.js"></script> <script src="script.test.js"></script>
// 그리고 콘솔에서 runTests()를 호출하여 실행합니다.
