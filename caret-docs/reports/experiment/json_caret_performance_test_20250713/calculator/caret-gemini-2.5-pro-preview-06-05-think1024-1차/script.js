const calculator = {
    // 순수 계산 로직
    calculate: (n1, n2, operator) => {
        const num1 = parseFloat(n1);
        const num2 = parseFloat(n2);
        if (operator === '+') return num1 + num2;
        if (operator === '-') return num1 - num2;
        if (operator === '*') return num1 * num2;
        if (operator === '/') {
            if (num2 === 0) return 'Error';
            return num1 / num2;
        }
    },
    // UI와 상태 관리를 위한 속성
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,
};

function updateDisplay() {
    const display = document.querySelector('.calculator-screen');
    display.value = calculator.displayValue;
}

function inputDigit(digit) {
    const { displayValue, waitingForSecondOperand } = calculator;

    if (waitingForSecondOperand === true) {
        calculator.displayValue = digit;
        calculator.waitingForSecondOperand = false;
    } else {
        calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
}

function inputDecimal(dot) {
    if (calculator.waitingForSecondOperand === true) {
        calculator.displayValue = '0.';
        calculator.waitingForSecondOperand = false;
        return;
    }
    if (!calculator.displayValue.includes(dot)) {
        calculator.displayValue += dot;
    }
}

function handleOperator(nextOperator) {
    const { firstOperand, displayValue, operator } = calculator;
    const inputValue = parseFloat(displayValue);

    if (operator && calculator.waitingForSecondOperand) {
        calculator.operator = nextOperator;
        return;
    }

    if (firstOperand == null && !isNaN(inputValue)) {
        calculator.firstOperand = inputValue;
    } else if (operator) {
        const result = calculator.calculate(firstOperand, inputValue, operator);
        // 부동소수점 오차 처리
        const roundedResult = parseFloat(result.toPrecision(15));
        calculator.displayValue = String(roundedResult);
        calculator.firstOperand = roundedResult;
    }

    calculator.waitingForSecondOperand = true;
    calculator.operator = nextOperator;
}

function resetCalculator() {
    calculator.displayValue = '0';
    calculator.firstOperand = null;
    calculator.waitingForSecondOperand = false;
    calculator.operator = null;
}

// DOM이 로드된 후 이벤트 리스너를 설정합니다.
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();

    const keys = document.querySelector('.calculator-keys');
    keys.addEventListener('click', (event) => {
        const { target } = event;
        if (!target.matches('button')) {
            return;
        }

        if (target.value === '=') {
            handleOperator(target.value);
            // '=' 버튼을 누르면 waitingForSecondOperand를 false로 설정하여
            // 다음 숫자 입력 시 화면이 지워지지 않고 연속 계산이 가능하도록 합니다.
            // 단, handleOperator 내부에서 이미 계산이 완료되고 displayValue가 업데이트됩니다.
            // 연속 계산을 위해 firstOperand는 결과값으로 유지됩니다.
            calculator.waitingForSecondOperand = false;
            updateDisplay();
            return;
        }

        if (target.classList.contains('operator')) {
            handleOperator(target.value);
            updateDisplay();
            return;
        }

        if (target.classList.contains('decimal')) {
            inputDecimal(target.value);
            updateDisplay();
            return;
        }

        if (target.classList.contains('all-clear')) {
            resetCalculator();
            updateDisplay();
            return;
        }

        inputDigit(target.value);
        updateDisplay();
    });
});
