// script.js 파일의 함수들을 테스트하기 위한 파일입니다.
// Node.js 환경에서 실행되므로, 브라우저 환경의 DOM 조작 코드는 포함하지 않습니다.

const { add, subtract, multiply, divide, calculate } = require('./script');

describe('Calculator Basic Operations', () => {
    test('add function should correctly add two numbers', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(-1, 1)).toBe(0);
        expect(add(0, 0)).toBe(0);
        expect(add(2.5, 3.5)).toBe(6);
    });

    test('subtract function should correctly subtract two numbers', () => {
        expect(subtract(5, 3)).toBe(2);
        expect(subtract(3, 5)).toBe(-2);
        expect(subtract(0, 0)).toBe(0);
        expect(subtract(10, 2.5)).toBe(7.5);
    });

    test('multiply function should correctly multiply two numbers', () => {
        expect(multiply(2, 3)).toBe(6);
        expect(multiply(-2, 3)).toBe(-6);
        expect(multiply(0, 100)).toBe(0);
        expect(multiply(2.5, 2)).toBe(5);
    });

    test('divide function should correctly divide two numbers', () => {
        expect(divide(6, 3)).toBe(2);
        expect(divide(10, 4)).toBe(2.5);
        expect(divide(-6, 3)).toBe(-2);
        expect(divide(0, 5)).toBe(0);
    });

    test('divide function should return "Error" when dividing by zero', () => {
        expect(divide(10, 0)).toBe("Error");
        expect(divide(0, 0)).toBe("Error"); // 0/0도 에러로 처리
    });
});

describe('Calculator Core Logic (calculate function)', () => {
    let displayValue = '';
    let firstOperand = null;
    let operator = null;
    let waitingForSecondOperand = false;

    beforeEach(() => {
        // 각 테스트 전에 상태 초기화
        displayValue = '0';
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
    });

    // 숫자 입력 테스트
    test('inputDigit should append digits to displayValue', () => {
        displayValue = calculate('inputDigit', '1', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('1');
        displayValue = calculate('inputDigit', '2', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('12');
    });

    test('inputDigit should replace displayValue if waitingForSecondOperand is true', () => {
        waitingForSecondOperand = true;
        displayValue = '123';
        displayValue = calculate('inputDigit', '4', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('4');
        expect(calculate('inputDigit', '4', displayValue, firstOperand, operator, waitingForSecondOperand).waitingForSecondOperand).toBe(false);
    });

    test('inputDecimal should add a decimal point if not already present', () => {
        displayValue = calculate('inputDigit', '1', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        displayValue = calculate('inputDecimal', '.', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('1.');
        displayValue = calculate('inputDigit', '2', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('1.2');
        displayValue = calculate('inputDecimal', '.', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue; // 두 번째 소수점 무시
        expect(displayValue).toBe('1.2');
    });

    test('inputDecimal should start with "0." if displayValue is "0"', () => {
        displayValue = calculate('inputDecimal', '.', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('0.');
    });

    test('inputDecimal should start with "0." if waitingForSecondOperand is true', () => {
        waitingForSecondOperand = true;
        displayValue = '123';
        displayValue = calculate('inputDecimal', '.', displayValue, firstOperand, operator, waitingForSecondOperand).displayValue;
        expect(displayValue).toBe('0.');
        expect(calculate('inputDecimal', '.', displayValue, firstOperand, operator, waitingForSecondOperand).waitingForSecondOperand).toBe(false);
    });

    // 연산자 처리 테스트
    test('handleOperator should set firstOperand and operator for the first operation', () => {
        displayValue = '10';
        const result = calculate('handleOperator', '+', displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.firstOperand).toBe(10);
        expect(result.operator).toBe('+');
        expect(result.waitingForSecondOperand).toBe(true);
        expect(result.displayValue).toBe('10'); // displayValue는 변경되지 않음
    });

    test('handleOperator should perform calculation for subsequent operations', () => {
        firstOperand = 10;
        operator = '+';
        displayValue = '5';
        waitingForSecondOperand = false;
        const result = calculate('handleOperator', '-', displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.displayValue).toBe('15');
        expect(result.firstOperand).toBe(15);
        expect(result.operator).toBe('-');
        expect(result.waitingForSecondOperand).toBe(true);
    });

    test('handleOperator should update operator if an operator is already set and waitingForSecondOperand is true', () => {
        firstOperand = 10;
        operator = '+';
        waitingForSecondOperand = true;
        const result = calculate('handleOperator', '-', displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.operator).toBe('-');
        expect(result.firstOperand).toBe(10);
        expect(result.waitingForSecondOperand).toBe(true);
    });

    // '=' 버튼 테스트
    test('handleEquals should perform the final calculation', () => {
        firstOperand = 10;
        operator = '+';
        displayValue = '5';
        waitingForSecondOperand = false;
        const result = calculate('handleEquals', '=', displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.displayValue).toBe('15');
        expect(result.firstOperand).toBe(null);
        expect(result.operator).toBe(null);
        expect(result.waitingForSecondOperand).toBe(false);
    });

    test('handleEquals should handle division by zero', () => {
        firstOperand = 10;
        operator = '/';
        displayValue = '0';
        waitingForSecondOperand = false;
        const result = calculate('handleEquals', '=', displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.displayValue).toBe('Error');
        expect(result.firstOperand).toBe(null);
        expect(result.operator).toBe(null);
        expect(result.waitingForSecondOperand).toBe(false);
    });

    // 초기화 테스트
    test('clear function should reset all states', () => {
        displayValue = '123';
        firstOperand = 456;
        operator = '+';
        waitingForSecondOperand = true;
        const result = calculate('clear', null, displayValue, firstOperand, operator, waitingForSecondOperand);
        expect(result.displayValue).toBe('0');
        expect(result.firstOperand).toBe(null);
        expect(result.operator).toBe(null);
        expect(result.waitingForSecondOperand).toBe(false);
    });

    // 연속 연산 테스트
    test('should handle chained operations correctly', () => {
        let state = { displayValue: '0', firstOperand: null, operator: null, waitingForSecondOperand: false };

        state = calculate('inputDigit', '1', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 1
        state = calculate('inputDigit', '0', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 10
        state = calculate('handleOperator', '+', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // firstOperand = 10, operator = +

        state = calculate('inputDigit', '5', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 5
        state = calculate('handleOperator', '*', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 10 + 5 = 15, firstOperand = 15, operator = *

        state = calculate('inputDigit', '2', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 2
        state = calculate('handleEquals', '=', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 15 * 2 = 30

        expect(state.displayValue).toBe('30');
        expect(state.firstOperand).toBe(null);
        expect(state.operator).toBe(null);
    });

    test('should handle chained operations with decimal correctly', () => {
        let state = { displayValue: '0', firstOperand: null, operator: null, waitingForSecondOperand: false };

        state = calculate('inputDigit', '1', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand);
        state = calculate('inputDecimal', '.', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand);
        state = calculate('inputDigit', '5', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 1.5
        state = calculate('handleOperator', '+', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // firstOperand = 1.5, operator = +

        state = calculate('inputDigit', '2', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand);
        state = calculate('inputDecimal', '.', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand);
        state = calculate('inputDigit', '5', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 2.5
        state = calculate('handleEquals', '=', state.displayValue, state.firstOperand, state.operator, state.waitingForSecondOperand); // 1.5 + 2.5 = 4

        expect(state.displayValue).toBe('4');
    });
});
