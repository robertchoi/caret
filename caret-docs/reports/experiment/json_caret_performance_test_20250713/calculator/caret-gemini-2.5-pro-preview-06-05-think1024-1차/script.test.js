// 순수 JavaScript로 작성된 간단한 테스트 스위트
function describe(description, fn) {
    console.log(description);
    fn();
}

function it(description, fn) {
    try {
        fn();
        console.log(`  ✓ ${description}`);
    } catch (error) {
        console.error(`  ✗ ${description}`);
        console.error(error);
    }
}

function assertEquals(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${actual} is not equal to ${expected}`);
    }
}

// calculator.js의 함수들을 테스트합니다.
// calculator 객체는 script.js 파일에 정의될 예정입니다.

describe('계산기 핵심 로직 테스트', () => {

    it('덧셈을 정확하게 수행해야 합니다.', () => {
        assertEquals(calculator.calculate(5, 3, '+'), 8);
        assertEquals(calculator.calculate(-1, 5, '+'), 4);
        assertEquals(calculator.calculate(0, 0, '+'), 0);
    });

    it('뺄셈을 정확하게 수행해야 합니다.', () => {
        assertEquals(calculator.calculate(10, 4, '-'), 6);
        assertEquals(calculator.calculate(5, 5, '-'), 0);
        assertEquals(calculator.calculate(3, 5, '-'), -2);
    });

    it('곱셈을 정확하게 수행해야 합니다.', () => {
        assertEquals(calculator.calculate(7, 2, '*'), 14);
        assertEquals(calculator.calculate(5, 0, '*'), 0);
        assertEquals(calculator.calculate(-3, 4, '*'), -12);
    });

    it('나눗셈을 정확하게 수행해야 합니다.', () => {
        assertEquals(calculator.calculate(12, 4, '/'), 3);
        assertEquals(calculator.calculate(10, 4, '/'), 2.5);
    });

    it('0으로 나누려고 할 때 오류를 반환해야 합니다.', () => {
        assertEquals(calculator.calculate(5, 0, '/'), 'Error');
    });

    it('소수점 계산을 정확하게 수행해야 합니다.', () => {
        // 부동소수점 오차를 피하기 위해 toFixed와 같은 처리가 필요할 수 있습니다.
        // 테스트에서는 근사치를 비교하는 방식을 사용할 수도 있지만, 여기서는 직접 비교합니다.
        // 실제 구현 시 이 부분을 고려해야 합니다.
        const result = calculator.calculate(0.1, 0.2, '+');
        assertEquals(parseFloat(result.toPrecision(15)), 0.3);
    });

    // 연속 계산 및 초기화 로직은 UI와 상호작용하므로,
    // 해당 기능은 script.js 내에서 상태를 관리하는 함수들을 통해 테스트해야 합니다.
    // 여기서는 순수 계산 함수만 테스트합니다.
    // UI와 결합된 테스트는 추후 수동으로 진행하거나 별도의 UI 테스트 프레임워크가 필요합니다.
});
