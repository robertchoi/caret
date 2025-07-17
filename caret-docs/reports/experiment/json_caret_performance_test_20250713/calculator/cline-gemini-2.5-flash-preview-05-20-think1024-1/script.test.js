// script.test.js

// 계산기 로직 함수들을 가져옵니다. (가정: script.js에 정의되어 있음)
// Node.js 환경에서 테스트를 실행하기 위해 CommonJS 모듈 시스템을 사용합니다.
const { add, subtract, multiply, divide, operate, handleNumber, handleOperator, handleEquals, handleClear } = require('./script');

describe('Calculator Core Logic', () => {
    // 각 테스트 전에 상태를 초기화합니다.
    let calculatorState;

    beforeEach(() => {
        calculatorState = {
            displayValue: '0',
            firstOperand: null,
            waitingForSecondOperand: false,
            operator: null,
        };
    });

    // 덧셈 함수 테스트
    test('add function should correctly add two numbers', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(-1, 1)).toBe(0);
        expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });

    // 뺄셈 함수 테스트
    test('subtract function should correctly subtract two numbers', () => {
        expect(subtract(5, 3)).toBe(2);
        expect(subtract(3, 5)).toBe(-2);
        expect(subtract(10, 0)).toBe(10);
    });

    // 곱셈 함수 테스트
    test('multiply function should correctly multiply two numbers', () => {
        expect(multiply(2, 3)).toBe(6);
        expect(multiply(-2, 3)).toBe(-6);
        expect(multiply(0, 100)).toBe(0);
    });

    // 나눗셈 함수 테스트
    test('divide function should correctly divide two numbers', () => {
        expect(divide(6, 3)).toBe(2);
        expect(divide(10, 4)).toBe(2.5);
    });

    // 0으로 나누기 예외 처리 테스트
    test('divide function should return "Error" when dividing by zero', () => {
        expect(divide(10, 0)).toBe('Error');
        expect(divide(0, 0)).toBe('Error'); // 0/0도 오류로 처리
    });

    // operate 함수 테스트
    test('operate function should perform correct operation based on operator', () => {
        expect(operate('+', 1, 2)).toBe(3);
        expect(operate('-', 5, 3)).toBe(2);
        expect(operate('*', 2, 3)).toBe(6);
        expect(operate('/', 6, 3)).toBe(2);
        expect(operate('/', 10, 0)).toBe('Error');
    });

    // 숫자 입력 처리 테스트
    test('handleNumber should correctly update displayValue', () => {
        // 초기 '0' 상태에서 숫자 입력
        handleNumber('5', calculatorState);
        expect(calculatorState.displayValue).toBe('5');

        // 연속 숫자 입력
        handleNumber('2', calculatorState);
        expect(calculatorState.displayValue).toBe('52');

        // 소수점 입력
        handleNumber('.', calculatorState);
        expect(calculatorState.displayValue).toBe('52.');
        handleNumber('5', calculatorState);
        expect(calculatorState.displayValue).toBe('52.5');

        // 두 번째 피연산자 입력 시작
        calculatorState.firstOperand = 10;
        calculatorState.waitingForSecondOperand = true;
        handleNumber('7', calculatorState);
        expect(calculatorState.displayValue).toBe('7');
        expect(calculatorState.waitingForSecondOperand).toBe(false);
    });

    test('handleNumber should not allow multiple decimal points', () => {
        handleNumber('1', calculatorState);
        handleNumber('.', calculatorState);
        handleNumber('2', calculatorState);
        handleNumber('.', calculatorState); // 두 번째 소수점 무시
        expect(calculatorState.displayValue).toBe('1.2');
    });

    // 연산자 입력 처리 테스트
    test('handleOperator should correctly set firstOperand and operator', () => {
        handleNumber('10', calculatorState);
        handleOperator('+', calculatorState);
        expect(calculatorState.firstOperand).toBe(10);
        expect(calculatorState.operator).toBe('+');
        expect(calculatorState.waitingForSecondOperand).toBe(true);
        expect(calculatorState.displayValue).toBe('10'); // 연산자 입력 후 디스플레이는 그대로 유지

        // 연산자 변경
        handleOperator('-', calculatorState);
        expect(calculatorState.firstOperand).toBe(10);
        expect(calculatorState.operator).toBe('-');
        expect(calculatorState.waitingForSecondOperand).toBe(true);
    });

    test('handleOperator should perform calculation if operator already exists', () => {
        handleNumber('10', calculatorState);
        handleOperator('+', calculatorState); // firstOperand = 10, operator = '+'
        handleNumber('5', calculatorState);
        handleOperator('*', calculatorState); // 10 + 5 = 15 계산 후 firstOperand = 15, operator = '*'
        expect(calculatorState.displayValue).toBe('15');
        expect(calculatorState.firstOperand).toBe(15);
        expect(calculatorState.operator).toBe('*');
        expect(calculatorState.waitingForSecondOperand).toBe(true);
    });

    // 등호 입력 처리 테스트
    test('handleEquals should perform final calculation', () => {
        handleNumber('10', calculatorState);
        handleOperator('+', calculatorState);
        handleNumber('5', calculatorState);
        handleEquals(calculatorState);
        expect(calculatorState.displayValue).toBe('15');
        expect(calculatorState.firstOperand).toBe(null);
        expect(calculatorState.operator).toBe(null);
        expect(calculatorState.waitingForSecondOperand).toBe(false);

        // 0으로 나누기 오류 처리
        handleNumber('10', calculatorState);
        handleOperator('/', calculatorState);
        handleNumber('0', calculatorState);
        handleEquals(calculatorState);
        expect(calculatorState.displayValue).toBe('Error');
    });

    // 초기화 기능 테스트
    test('handleClear should reset all calculator state', () => {
        handleNumber('123', calculatorState);
        handleOperator('+', calculatorState);
        handleNumber('456', calculatorState);
        handleClear(calculatorState);
        expect(calculatorState.displayValue).toBe('0');
        expect(calculatorState.firstOperand).toBe(null);
        expect(calculatorState.waitingForSecondOperand).toBe(false);
        expect(calculatorState.operator).toBe(null);
    });
});
