// script.js 파일의 함수들을 테스트하기 위한 파일
// Node.js 환경에서 실행되므로, CommonJS 모듈 시스템을 사용합니다.
const { add, subtract, multiply, divide, operate } = require('./script');

// Jest와 같은 테스트 프레임워크를 사용한다고 가정하고 테스트 코드를 작성합니다.

describe('Calculator Core Logic', () => {
    // 덧셈 함수 테스트
    test('add(a, b) should correctly add two numbers', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(-1, 1)).toBe(0);
        expect(add(0.1, 0.2)).toBeCloseTo(0.3); // 부동 소수점 오차 고려
        expect(add(100, 200)).toBe(300);
    });

    // 뺄셈 함수 테스트
    test('subtract(a, b) should correctly subtract two numbers', () => {
        expect(subtract(5, 3)).toBe(2);
        expect(subtract(3, 5)).toBe(-2);
        expect(subtract(10, 0)).toBe(10);
        expect(subtract(0.5, 0.2)).toBeCloseTo(0.3);
    });

    // 곱셈 함수 테스트
    test('multiply(a, b) should correctly multiply two numbers', () => {
        expect(multiply(2, 4)).toBe(8);
        expect(multiply(-2, 3)).toBe(-6);
        expect(multiply(0, 5)).toBe(0);
        expect(multiply(2.5, 2)).toBe(5);
    });

    // 나눗셈 함수 테스트
    test('divide(a, b) should correctly divide two numbers', () => {
        expect(divide(10, 2)).toBe(5);
        expect(divide(7, 2)).toBe(3.5);
        expect(divide(-10, 2)).toBe(-5);
        expect(divide(0, 5)).toBe(0);
    });

    // 0으로 나누기 테스트
    test('divide(a, 0) should return "Error" for division by zero', () => {
        expect(divide(5, 0)).toBe("Error");
        expect(divide(0, 0)).toBe("Error"); // 0/0도 오류로 처리
    });

    // operate 함수 테스트
    describe('operate(operator, a, b)', () => {
        test('should perform addition correctly', () => {
            expect(operate('+', 1, 2)).toBe(3);
        });

        test('should perform subtraction correctly', () => {
            expect(operate('-', 5, 3)).toBe(2);
        });

        test('should perform multiplication correctly', () => {
            expect(operate('*', 2, 4)).toBe(8);
        });

        test('should perform division correctly', () => {
            expect(operate('/', 10, 2)).toBe(5);
        });

        test('should handle division by zero', () => {
            expect(operate('/', 5, 0)).toBe("Error");
        });

        test('should return "Error" for unknown operator', () => {
            expect(operate('%', 1, 2)).toBe("Error");
        });
    });
});
