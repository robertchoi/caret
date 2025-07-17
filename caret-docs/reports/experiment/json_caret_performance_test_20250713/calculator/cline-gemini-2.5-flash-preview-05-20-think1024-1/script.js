// script.js

// 계산기 상태를 관리하는 객체
let calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,
};

// 기본 산술 연산 함수들
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        return 'Error'; // 0으로 나누기 오류 처리
    }
    return a / b;
}

// 연산 수행 함수
function operate(operator, num1, num2) {
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
            return num2; // 유효하지 않은 연산자일 경우 두 번째 피연산자 반환
    }
}

// 숫자 버튼 클릭 처리
function handleNumber(number, state) {
    if (number === '.') {
        if (state.waitingForSecondOperand === true) {
            state.displayValue = '0.';
            state.waitingForSecondOperand = false;
            return;
        }
        if (!state.displayValue.includes('.')) {
            state.displayValue += '.';
        }
        return;
    }

    if (state.waitingForSecondOperand === true) {
        state.displayValue = number;
        state.waitingForSecondOperand = false;
    } else {
        state.displayValue = state.displayValue === '0' ? number : state.displayValue + number;
    }
}

// 연산자 버튼 클릭 처리
function handleOperator(nextOperator, state) {
    const inputValue = parseFloat(state.displayValue);

    if (state.operator && state.waitingForSecondOperand) {
        state.operator = nextOperator;
        return;
    }

    if (state.firstOperand === null && !isNaN(inputValue)) {
        state.firstOperand = inputValue;
    } else if (state.operator) {
        const result = operate(state.operator, state.firstOperand, inputValue);

        state.displayValue = String(result);
        state.firstOperand = result;
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOperator;
}

// 등호 버튼 클릭 처리
function handleEquals(state) {
    if (state.firstOperand === null || state.operator === null) {
        return; // 연산할 내용이 없으면 아무것도 하지 않음
    }

    const inputValue = parseFloat(state.displayValue);
    const result = operate(state.operator, state.firstOperand, inputValue);

    state.displayValue = String(result);
    state.firstOperand = null;
    state.waitingForSecondOperand = false;
    state.operator = null;
}

// 초기화 버튼 클릭 처리
function handleClear(state) {
    state.displayValue = '0';
    state.firstOperand = null;
    state.waitingForSecondOperand = false;
    state.operator = null;
}

// Node.js 환경에서 테스트를 위해 함수들을 export 합니다.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        add,
        subtract,
        multiply,
        divide,
        operate,
        handleNumber,
        handleOperator,
        handleEquals,
        handleClear
    };
}
