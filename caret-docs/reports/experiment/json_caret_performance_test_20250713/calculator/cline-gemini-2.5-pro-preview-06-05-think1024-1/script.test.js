// 가상 DOM 환경 설정 (테스트 환경에서 DOM API를 사용하기 위함)
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><div id="display"></div>');
global.document = dom.window.document;

// 테스트할 스크립트 파일 로드
const {
    handleNumber,
    handleOperator,
    handleEqual,
    handleClear,
    calculate
} = require('./script.js');

// 테스트 스위트
describe('계산기 로직 테스트', () => {

    // 각 테스트 전에 상태 초기화
    beforeEach(() => {
        handleClear();
    });

    // 덧셈 테스트
    test('덧셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('5');
        handleOperator('+');
        handleNumber('3');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('8');
    });

    // 뺄셈 테스트
    test('뺄셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('10');
        handleOperator('-');
        handleNumber('4');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('6');
    });

    // 곱셈 테스트
    test('곱셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('3');
        handleOperator('*');
        handleNumber('7');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('21');
    });

    // 나눗셈 테스트
    test('나눗셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('15');
        handleOperator('/');
        handleNumber('5');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('3');
    });

    // 연속된 연산 테스트
    test('연속된 연산을 정확하게 처리해야 합니다.', () => {
        handleNumber('5');
        handleOperator('+');
        handleNumber('3');
        handleOperator('-');
        handleNumber('2');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('6');
    });

    // 소수점 덧셈 테스트
    test('소수점 덧셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('2.5');
        handleOperator('+');
        handleNumber('1.5');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('4');
    });

    // 소수점 곱셈 테스트
    test('소수점 곱셈을 정확하게 계산해야 합니다.', () => {
        handleNumber('0.5');
        handleOperator('*');
        handleNumber('2');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('1');
    });

    // 0으로 나누기 예외 처리 테스트
    test('0으로 나누려고 할 때 "Error"를 표시해야 합니다.', () => {
        handleNumber('10');
        handleOperator('/');
        handleNumber('0');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('Error');
    });

    // 초기화(Clear) 기능 테스트
    test('C 버튼을 누르면 모든 상태가 초기화되어야 합니다.', () => {
        handleNumber('5');
        handleOperator('+');
        handleNumber('3');
        handleClear();
        expect(document.getElementById('display').innerText).toBe('');
        // 내부 상태도 초기화되었는지 확인 (추가적인 테스트)
        handleNumber('1');
        handleOperator('+');
        handleNumber('2');
        handleEqual();
        expect(document.getElementById('display').innerText).toBe('3');
    });

    // calculate 함수 직접 테스트
    describe('calculate 함수 단위 테스트', () => {
        test('5 + 3 = 8', () => {
            expect(calculate(5, '+', 3)).toBe(8);
        });
        test('10 - 4 = 6', () => {
            expect(calculate(10, '-', 4)).toBe(6);
        });
        test('3 * 7 = 21', () => {
            expect(calculate(3, '*', 7)).toBe(21);
        });
        test('15 / 5 = 3', () => {
            expect(calculate(15, '/', 5)).toBe(3);
        });
        test('10 / 0 returns "Error"', () => {
            expect(calculate(10, '/', 0)).toBe('Error');
        });
    });
});
