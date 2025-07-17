// 가상 테스트 환경 설정
const assert = {
    strictEqual: function(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Failed: ${actual} !== ${expected}`);
        }
    }
};

function runTest(name, testFunction) {
    try {
        testFunction();
        console.log(`✅ [PASS] ${name}`);
    } catch (error) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(error);
    }
}

// 테스트 스위트
console.log("Calculator Logic Tests");

runTest("덧셈: 5 + 3 = 8", () => {
    assert.strictEqual(calculate('5', '+', '3'), 8, "5 + 3 should be 8");
});

runTest("뺄셈: 10 - 4 = 6", () => {
    assert.strictEqual(calculate('10', '-', '4'), 6, "10 - 4 should be 6");
});

runTest("곱셈: 7 * 2 = 14", () => {
    assert.strictEqual(calculate('7', '*', '2'), 14, "7 * 2 should be 14");
});

runTest("나눗셈: 12 / 4 = 3", () => {
    assert.strictEqual(calculate('12', '/', '4'), 3, "12 / 4 should be 3");
});

runTest("0으로 나누기: 오류를 반환해야 함", () => {
    assert.strictEqual(calculate('5', '/', '0'), 'Error', "Division by zero should return 'Error'");
});

runTest("소수 덧셈: 0.1 + 0.2 = 0.3", () => {
    // 부동 소수점 오차를 고려하여 근사치 비교
    const result = calculate('0.1', '+', '0.2');
    if (Math.abs(result - 0.3) > Number.EPSILON) {
        throw new Error(`0.1 + 0.2 should be close to 0.3, but got ${result}`);
    }
    console.log("✅ [PASS] 소수 덧셈: 0.1 + 0.2 = 0.3");
});

runTest("소수 곱셈: 0.2 * 0.3 = 0.06", () => {
    const result = calculate('0.2', '*', '0.3');
    if (Math.abs(result - 0.06) > Number.EPSILON) {
        throw new Error(`0.2 * 0.3 should be close to 0.06, but got ${result}`);
    }
    console.log("✅ [PASS] 소수 곱셈: 0.2 * 0.3 = 0.06");
});

// 실제 script.js의 calculate 함수를 직접 사용합니다.
// window.calculate는 index.html에서 전역으로 노출시켰습니다.
