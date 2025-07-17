// 가상 DOM 환경 설정 (테스트 환경에서 DOM API를 사용하기 위함)
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><div id="display"></div>');
global.document = dom.window.document;

const {
    handleNumber,
    handleOperator,
    handleEqual,
    handleClear,
    handleDecimal,
    state
} = require('./script.js');

// 테스트 전 각 상태 초기화
beforeEach(() => {
    state.displayValue = '0';
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    document.getElementById('display').textContent = state.displayValue;
});

describe('계산기 핵심 로직 테스트', () => {
    test('덧셈: 1 + 2 = 3', () => {
        handleNumber('1');
        handleOperator('+');
        handleNumber('2');
        handleEqual();
        expect(state.displayValue).toBe('3');
    });

    test('뺄셈: 5 - 2 = 3', () => {
        handleNumber('5');
        handleOperator('-');
        handleNumber('2');
        handleEqual();
        expect(state.displayValue).toBe('3');
    });

    test('곱셈: 3 * 4 = 12', () => {
        handleNumber('3');
        handleOperator('*');
        handleNumber('4');
        handleEqual();
        expect(state.displayValue).toBe('12');
    });

    test('나눗셈: 10 / 2 = 5', () => {
        handleNumber('10');
        handleOperator('/');
        handleNumber('2');
        handleEqual();
        expect(state.displayValue).toBe('5');
    });

    test('소수 계산: 1.5 + 2.5 = 4', () => {
        handleNumber('1');
        handleDecimal();
        handleNumber('5');
        handleOperator('+');
        handleNumber('2');
        handleDecimal();
        handleNumber('5');
        handleEqual();
        expect(state.displayValue).toBe('4');
    });

    test('연속 계산: 1 + 2 + 3 = 6', () => {
        handleNumber('1');
        handleOperator('+');
        handleNumber('2');
        handleEqual();
        handleOperator('+');
        handleNumber('3');
        handleEqual();
        expect(state.displayValue).toBe('6');
    });

    test('0으로 나누기: 5 / 0 -> Error', () => {
        handleNumber('5');
        handleOperator('/');
        handleNumber('0');
        handleEqual();
        expect(state.displayValue).toBe('Error');
    });

    test('초기화(AC): 상태가 초기화되어야 함', () => {
        handleNumber('5');
        handleOperator('+');
        handleNumber('2');
        handleClear();
        expect(state.displayValue).toBe('0');
        expect(state.firstOperand).toBe(null);
        expect(state.operator).toBe(null);
        expect(state.waitingForSecondOperand).toBe(false);
    });
});
