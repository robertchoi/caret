const state = {
    displayValue: '0',
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
};

function updateDisplay() {
    const display = document.getElementById('display');
    display.textContent = state.displayValue;
}

function handleNumber(number) {
    if (state.waitingForSecondOperand) {
        state.displayValue = number;
        state.waitingForSecondOperand = false;
    } else {
        state.displayValue = state.displayValue === '0' ? number : state.displayValue + number;
    }
    updateDisplay();
}

function handleOperator(nextOperator) {
    const { firstOperand, displayValue, operator } = state;
    const inputValue = parseFloat(displayValue);

    if (operator && state.waitingForSecondOperand) {
        state.operator = nextOperator;
        return;
    }

    if (firstOperand === null) {
        state.firstOperand = inputValue;
    } else if (operator) {
        const result = performCalculation[operator](firstOperand, inputValue);
        state.displayValue = String(result);
        state.firstOperand = result;
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOperator;
    updateDisplay();
}

function handleDecimal() {
    if (!state.displayValue.includes('.')) {
        state.displayValue += '.';
    }
    updateDisplay();
}

const performCalculation = {
    '/': (firstOperand, secondOperand) => {
        if (secondOperand === 0) {
            return 'Error';
        }
        return firstOperand / secondOperand;
    },
    '*': (firstOperand, secondOperand) => firstOperand * secondOperand,
    '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
    '-': (firstOperand, secondOperand) => firstOperand - secondOperand,
};

function handleEqual() {
    const { operator, firstOperand, displayValue } = state;
    const inputValue = parseFloat(displayValue);

    if (operator && !state.waitingForSecondOperand) {
        const result = performCalculation[operator](firstOperand, inputValue);
        state.displayValue = String(result);
        state.firstOperand = result; // 연속 계산을 위해 결과 저장
        state.operator = null; // = 누른 후 연산자 초기화
        state.waitingForSecondOperand = true; // 새로운 계산 시작 대기
    }
    updateDisplay();
}

function handleClear() {
    state.displayValue = '0';
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    updateDisplay();
}

// Node.js 환경에서 실행하기 위해 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleNumber,
        handleOperator,
        handleEqual,
        handleClear,
        handleDecimal,
        state,
        updateDisplay // 테스트에서 display 업데이트를 위해 추가
    };
}
