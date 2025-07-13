// 간단한 테스트 프레임워크
const test = (description, fn) => {
    try {
        fn();
        console.log(`✅ PASS: ${description}`);
    } catch (error) {
        console.error(`❌ FAIL: ${description}`);
        console.error(error);
    }
};

const assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
        }
    },
    throws: (fn, message) => {
        let caughtError = false;
        try {
            fn();
        } catch (e) {
            caughtError = true;
        }
        if (!caughtError) {
            throw new Error(message || 'Expected function to throw an error.');
        }
    }
};

// calculator.js (가상)의 함수들을 테스트합니다.
// 실제 구현은 script.js 파일에 작성될 것입니다.

// 테스트 스위트: 계산기 핵심 로직
console.log('--- Running Calculator Logic Tests ---');

test('덧셈: 5 + 3 = 8', () => {
    assert.strictEqual(calculate(5, 3, '+'), 8);
});

test('뺄셈: 10 - 4 = 6', () => {
    assert.strictEqual(calculate(10, 4, '-'), 6);
});

test('곱셈: 7 * 2 = 14', () => {
    assert.strictEqual(calculate(7, 2, '*'), 14);
});

test('나눗셈: 12 / 4 = 3', () => {
    assert.strictEqual(calculate(12, 4, '/'), 3);
});

test('0으로 나누기: 오류를 발생시켜야 함', () => {
    assert.strictEqual(calculate(5, 0, '/'), 'Error');
});

test('소수 덧셈: 0.1 + 0.2 = 0.3', () => {
    // 부동소수점 오차를 고려하여 근사치 비교가 필요할 수 있으나, 여기서는 간단히 처리
    assert.strictEqual(parseFloat(calculate(0.1, 0.2, '+').toPrecision(15)), 0.3);
});

test('소수 곱셈: 0.5 * 0.5 = 0.25', () => {
    assert.strictEqual(calculate(0.5, 0.5, '*'), 0.25);
});

test('연속 계산 시나리오 (가정)', () => {
    // 이 로직은 UI와 밀접하게 연관되어 있어 단위 테스트로 만들기 복잡합니다.
    // 여기서는 calculate 함수가 상태를 관리하지 않는다고 가정하고,
    // UI 로직이 상태를 올바르게 전달하는지 검증하는 방식으로 접근합니다.
    let result = calculate(3, 5, '+'); // 3 + 5 = 8
    assert.strictEqual(result, 8);
    result = calculate(result, 2, '*'); // 8 * 2 = 16
    assert.strictEqual(result, 16);
});

test('초기화 로직 (가정)', () => {
    // UI 상태 초기화를 테스트해야 하므로, 여기서는 핵심 계산 함수 자체의 상태 없음을 확인
    calculator.firstOperand = '10';
    calculator.operator = '+';
    calculator.displayValue = '5';
    // clearCalculator 함수가 있다고 가정
    clearCalculator();
    assert.strictEqual(calculator.firstOperand, null);
    assert.strictEqual(calculator.operator, null);
    assert.strictEqual(calculator.displayValue, '0');
});
