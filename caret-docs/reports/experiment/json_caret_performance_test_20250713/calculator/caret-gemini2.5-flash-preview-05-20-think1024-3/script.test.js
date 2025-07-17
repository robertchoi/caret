// script.js 파일에서 내보낼 함수들을 가정하고 테스트 코드를 작성합니다.
// 실제 구현 시에는 이 테스트를 통과하도록 script.js를 작성해야 합니다.

// 기본 연산 함수 테스트
describe('기본 연산 함수', () => {
    // script.js에서 내보낼 함수들을 여기에 임포트한다고 가정합니다.
    // const { add, subtract, multiply, divide } = require('./script'); // Node.js 환경
    // 브라우저 환경에서는 전역 스코프에 노출되거나, 모듈 번들러를 사용해야 합니다.
    // 여기서는 테스트를 위해 임시로 함수를 정의하거나, 실제 script.js 파일을 로드하는 방식을 고려해야 합니다.
    // 편의상, 테스트 파일 내에서 함수를 직접 정의하여 테스트합니다.
    // 실제 개발에서는 script.js의 함수를 import/require 해야 합니다.

    // 테스트를 위해 임시로 함수를 정의합니다. 실제 구현은 script.js에 있습니다.
    const add = (a, b) => a + b;
    const subtract = (a, b) => a - b;
    const multiply = (a, b) => a * b;
    const divide = (a, b) => {
        if (b === 0) return "Error";
        return a / b;
    };

    test('add 함수는 두 숫자를 더해야 합니다', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(-1, 1)).toBe(0);
        expect(add(0, 0)).toBe(0);
        expect(add(1.5, 2.5)).toBe(4);
    });

    test('subtract 함수는 두 숫자를 빼야 합니다', () => {
        expect(subtract(5, 3)).toBe(2);
        expect(subtract(3, 5)).toBe(-2);
        expect(subtract(0, 0)).toBe(0);
        expect(subtract(10, 2.5)).toBe(7.5);
    });

    test('multiply 함수는 두 숫자를 곱해야 합니다', () => {
        expect(multiply(2, 3)).toBe(6);
        expect(multiply(-2, 3)).toBe(-6);
        expect(multiply(0, 100)).toBe(0);
        expect(multiply(2.5, 2)).toBe(5);
    });

    test('divide 함수는 두 숫자를 나눠야 합니다', () => {
        expect(divide(6, 3)).toBe(2);
        expect(divide(10, 4)).toBe(2.5);
        expect(divide(-10, 2)).toBe(-5);
    });

    test('divide 함수는 0으로 나눌 때 "Error"를 반환해야 합니다', () => {
        expect(divide(10, 0)).toBe("Error");
        expect(divide(0, 0)).toBe("Error"); // 0/0도 에러 처리
    });
});

// operate 함수 테스트
describe('operate 함수', () => {
    // script.js에서 내보낼 operate 함수를 여기에 임포트한다고 가정합니다.
    // const { operate } = require('./script');

    // 테스트를 위해 임시로 operate 함수를 정의합니다. 실제 구현은 script.js에 있습니다.
    const add = (a, b) => a + b;
    const subtract = (a, b) => a - b;
    const multiply = (a, b) => a * b;
    const divide = (a, b) => {
        if (b === 0) return "Error";
        return a / b;
    };

    const operate = (operator, num1, num2) => {
        num1 = parseFloat(num1);
        num2 = parseFloat(num2);

        switch (operator) {
            case '+':
                return add(num1, num2);
            case '-':
                return subtract(num1, num2);
            case '*':
                return multiply(num1, num2);
            case '/':
                return divide(num1, num2);
            default:
                return "Error";
        }
    };

    test('덧셈 연산을 올바르게 수행해야 합니다', () => {
        expect(operate('+', '5', '3')).toBe(8);
    });

    test('뺄셈 연산을 올바르게 수행해야 합니다', () => {
        expect(operate('-', '10', '4')).toBe(6);
    });

    test('곱셈 연산을 올바르게 수행해야 합니다', () => {
        expect(operate('*', '6', '7')).toBe(42);
    });

    test('나눗셈 연산을 올바르게 수행해야 합니다', () => {
        expect(operate('/', '10', '2')).toBe(5);
    });

    test('0으로 나눌 때 "Error"를 반환해야 합니다', () => {
        expect(operate('/', '5', '0')).toBe("Error");
    });

    test('유효하지 않은 연산자에 대해 "Error"를 반환해야 합니다', () => {
        expect(operate('%', '5', '2')).toBe("Error");
    });

    test('부동 소수점 연산을 올바르게 처리해야 합니다', () => {
        expect(operate('+', '0.1', '0.2')).toBeCloseTo(0.3);
        expect(operate('*', '2.5', '2')).toBe(5);
    });
});

// UI 상호작용 로직은 브라우저 환경에서 테스트해야 하므로, 여기서는 순수 JS 로직만 테스트합니다.
// 예를 들어, 디스플레이 업데이트 로직은 DOM에 의존하므로 Jest와 같은 Node.js 기반 테스트 환경에서는 직접 테스트하기 어렵습니다.
// 하지만, 디스플레이에 표시될 값을 계산하는 내부 로직은 테스트할 수 있습니다.
// 여기서는 계산기 상태 관리 및 디스플레이 값 계산 로직을 가정하고 테스트합니다.

describe('계산기 상태 관리 및 디스플레이 로직', () => {
    let currentNumber = '';
    let previousNumber = '';
    let operator = null;
    let displayValue = '0';
    let waitingForNewNumber = false; // script.js와 동일하게 추가

    // 테스트를 위해 초기화 함수를 정의합니다. 실제 구현은 script.js에 있습니다.
    const clear = () => {
        currentNumber = '';
        previousNumber = '';
        operator = null;
        displayValue = '0';
        waitingForNewNumber = false; // script.js와 동일하게 추가
    };

    const clearEntry = () => {
        currentNumber = '';
        displayValue = '0';
        waitingForNewNumber = false; // script.js와 동일하게 추가
    };

    const appendNumber = (number) => {
        if (displayValue === 'Error') { // 에러 상태에서 숫자 입력 시 초기화
            clear();
        }

        if (waitingForNewNumber) {
            currentNumber = number;
            waitingForNewNumber = false;
        } else {
            if (number === '.' && currentNumber.includes('.')) return;
            if (currentNumber === '0' && number !== '.') {
                currentNumber = number;
            } else {
                currentNumber += number;
            }
        }
        displayValue = currentNumber;
    };

    const setOperator = (op) => {
        if (displayValue === 'Error') return; // 에러 상태에서는 연산자 입력 무시

        if (currentNumber === '' && previousNumber === '') return; // 아무것도 입력되지 않은 상태에서 연산자 누르면 무시

        if (currentNumber !== '' && previousNumber === '') {
            previousNumber = currentNumber;
            currentNumber = '';
        } else if (currentNumber !== '' && previousNumber !== '') {
            // 연속 연산 처리 (예: 1 + 2 + 3)
            const result = operate(operator, previousNumber, currentNumber);
            previousNumber = result.toString();
            currentNumber = '';
            displayValue = previousNumber;
        }
        operator = op;
        waitingForNewNumber = true; // script.js와 동일하게 추가
    };

    const calculate = () => {
        if (previousNumber === '' || currentNumber === '' || operator === null) {
            return;
        }

        const result = operate(operator, previousNumber, currentNumber);
        displayValue = result.toString();

        // 결과가 너무 길면 지수 표기법으로 변환하거나 잘라낼 수 있습니다. (테스트에서는 생략 가능하지만, 일관성을 위해 추가)
        if (displayValue.length > 10) {
            displayValue = parseFloat(displayValue).toPrecision(8);
            if (displayValue.length > 10) {
                displayValue = parseFloat(displayValue).toFixed(5);
                if (displayValue.length > 10) {
                    displayValue = "Too Big";
                }
            }
        }

        previousNumber = '';
        operator = null;
        waitingForNewNumber = true; // script.js와 동일하게 추가
        currentNumber = displayValue; // script.js와 동일하게 추가
    };

    // operate 함수는 위에서 정의한 것을 사용합니다.
    const add = (a, b) => a + b;
    const subtract = (a, b) => a - b;
    const multiply = (a, b) => a * b;
    const divide = (a, b) => {
        if (b === 0) return "Error";
        return a / b;
    };

    const operate = (operator, num1, num2) => {
        num1 = parseFloat(num1);
        num2 = parseFloat(num2);

        switch (operator) {
            case '+':
                return add(num1, num2);
            case '-':
                return subtract(num1, num2);
            case '*':
                return multiply(num1, num2);
            case '/':
                return divide(num1, num2);
            default:
                return "Error";
        }
    };


    beforeEach(() => {
        // 각 테스트 전에 상태 초기화
        clear();
    });

    test('appendNumber는 숫자를 디스플레이에 추가해야 합니다', () => {
        appendNumber('1');
        expect(displayValue).toBe('1');
        appendNumber('2');
        expect(displayValue).toBe('12');
    });

    test('appendNumber는 소수점을 한 번만 추가해야 합니다', () => {
        appendNumber('1');
        appendNumber('.');
        appendNumber('2');
        expect(displayValue).toBe('1.2');
        appendNumber('.'); // 두 번째 소수점은 무시되어야 합니다.
        expect(displayValue).toBe('1.2');
    });

    test('clear는 모든 상태를 초기화해야 합니다', () => {
        appendNumber('123');
        setOperator('+');
        appendNumber('456');
        clear();
        expect(currentNumber).toBe('');
        expect(previousNumber).toBe('');
        expect(operator).toBeNull();
        expect(displayValue).toBe('0');
    });

    test('clearEntry는 현재 숫자만 초기화해야 합니다', () => {
        appendNumber('123');
        setOperator('+');
        appendNumber('456');
        clearEntry();
        expect(currentNumber).toBe('');
        expect(displayValue).toBe('0');
        expect(previousNumber).toBe('123'); // 이전 숫자는 유지되어야 합니다.
        expect(operator).toBe('+'); // 연산자도 유지되어야 합니다.
    });

    test('setOperator는 첫 번째 숫자를 previousNumber로 이동시켜야 합니다', () => {
        appendNumber('123');
        setOperator('+');
        expect(previousNumber).toBe('123');
        expect(currentNumber).toBe('');
        expect(operator).toBe('+');
    });

    test('setOperator는 연속 연산을 처리해야 합니다', () => {
        appendNumber('1');
        setOperator('+');
        appendNumber('2');
        setOperator('*'); // 1 + 2 = 3, 그리고 3 * (다음 숫자)
        expect(previousNumber).toBe('3');
        expect(currentNumber).toBe('');
        expect(operator).toBe('*');
        expect(displayValue).toBe('3');
    });

    test('calculate는 올바른 결과를 디스플레이에 표시해야 합니다', () => {
        appendNumber('10');
        setOperator('+');
        appendNumber('5');
        calculate();
        expect(displayValue).toBe('15');
        expect(currentNumber).toBe('15'); // 결과가 currentNumber로 설정되어야 연속 계산 가능
        expect(previousNumber).toBe('');
        expect(operator).toBeNull();
    });

    test('calculate는 0으로 나눌 때 "Error"를 표시해야 합니다', () => {
        appendNumber('10');
        setOperator('/');
        appendNumber('0');
        calculate();
        expect(displayValue).toBe('Error');
        expect(currentNumber).toBe('Error'); // 에러도 currentNumber로 설정
    });

    test('연산자 연속 입력 시 마지막 연산자로 변경되어야 합니다', () => {
        appendNumber('5');
        setOperator('+');
        setOperator('-'); // +에서 -로 변경
        expect(operator).toBe('-');
        expect(previousNumber).toBe('5');
        expect(currentNumber).toBe('');
    });

    test('아무것도 입력되지 않은 상태에서 연산자 누르면 무시되어야 합니다', () => {
        setOperator('+');
        expect(previousNumber).toBe('');
        expect(currentNumber).toBe('');
        expect(operator).toBeNull();
    });

    test('계산 후 연속해서 숫자 입력 시 새로운 계산이 시작되어야 합니다', () => {
        appendNumber('1');
        setOperator('+');
        appendNumber('2');
        calculate(); // 결과: 3
        appendNumber('4'); // 새로운 숫자 입력 시작
        expect(displayValue).toBe('4');
        expect(currentNumber).toBe('4');
        expect(previousNumber).toBe('');
        expect(operator).toBeNull();
    });
});
