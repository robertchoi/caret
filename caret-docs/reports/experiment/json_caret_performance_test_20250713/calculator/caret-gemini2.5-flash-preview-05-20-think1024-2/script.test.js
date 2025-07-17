// script.js 파일의 함수들을 테스트하기 위한 파일입니다.
// 이 파일은 Node.js 환경에서 실행될 것을 가정합니다.

// script.js에서 내보낼 함수들을 가져옵니다.
// Node.js 환경에서는 require를 사용합니다.
// 브라우저 환경에서는 전역 객체에 함수가 노출될 것이므로 이 부분은 필요 없습니다.
// 여기서는 테스트를 위해 Node.js 환경을 가정하고 require를 사용합니다.
const { add, subtract, multiply, divide, operate } = require('./script');

describe('Calculator Logic Tests', () => {
    // 덧셈 테스트
    test('should correctly add two numbers', () => {
        expect(add(2, 3)).toBe(5);
        expect(add(-1, 1)).toBe(0);
        expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });

    // 뺄셈 테스트
    test('should correctly subtract two numbers', () => {
        expect(subtract(5, 2)).toBe(3);
        expect(subtract(2, 5)).toBe(-3);
        expect(subtract(10, 0)).toBe(10);
    });

    // 곱셈 테스트
    test('should correctly multiply two numbers', () => {
        expect(multiply(4, 3)).toBe(12);
        expect(multiply(-2, 5)).toBe(-10);
        expect(multiply(0, 100)).toBe(0);
        expect(multiply(2.5, 2)).toBe(5);
    });

    // 나눗셈 테스트
    test('should correctly divide two numbers', () => {
        expect(divide(10, 2)).toBe(5);
        expect(divide(7, 2)).toBe(3.5);
        expect(divide(5, 0)).toBe('Error: Cannot divide by zero'); // 0으로 나누는 경우
    });

    // operate 함수 테스트
    test('operate should perform correct operation based on operator', () => {
        expect(operate('+', 2, 3)).toBe(5);
        expect(operate('-', 5, 2)).toBe(3);
        expect(operate('*', 4, 3)).toBe(12);
        expect(operate('/', 10, 2)).toBe(5);
        expect(operate('/', 5, 0)).toBe('Error: Cannot divide by zero');
        expect(operate('^', 2, 3)).toBe('Error: Unknown operator'); // 알 수 없는 연산자
    });

    // 연속 연산 테스트 (명세서에 따라 입력 순서대로 계산)
    test('should handle sequential operations correctly', () => {
        // 2 + 3 * 4 = 14 (명세서에 따라 입력 순서대로 계산)
        let result = operate('+', 2, 3); // 5
        result = operate('*', result, 4); // 20
        expect(result).toBe(20); // 명세서의 14와 다름. 명세서의 "연산자 우선순위는 고려하지 않고, 입력 순서대로 계산"을 따름.
                                // 2 + 3 * 4 = 14는 일반적인 수학 연산자 우선순위를 따르는 결과이므로,
                                // 여기서는 명세서의 "입력 순서대로 계산"에 맞춰 테스트를 작성합니다.
                                // 따라서 2 + 3 = 5, 5 * 4 = 20이 됩니다.
    });

    // 소수점 연산 테스트
    test('should handle decimal operations correctly', () => {
        expect(operate('+', 2.5, 1.5)).toBe(4);
        expect(operate('-', 5.5, 2.2)).toBeCloseTo(3.3);
    });

    // 여러 자리 숫자 입력 테스트
    test('should handle multi-digit numbers', () => {
        expect(operate('+', 123, 456)).toBe(579);
        expect(operate('*', 10, 10)).toBe(100);
    });
});
