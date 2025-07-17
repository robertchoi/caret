const calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,
};

function calculate(firstOperand, operator, secondOperand) {
    const first = parseFloat(firstOperand);
    const second = parseFloat(secondOperand);

    if (operator === '+') {
        return first + second;
    } else if (operator === '-') {
        return first - second;
    } else if (operator === '*') {
        return first * second;
    } else if (operator === '/') {
        if (second === 0) {
            return 'Error';
        }
        return first / second;
    }

    return second;
}

// UI 로직 (나중에 index.html과 연결)
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
    if (calculator.waitingForSecondOperand) return;
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
        const result = calculate(firstOperand, operator, inputValue);
        
        // 부동 소수점 문제 해결
        const roundedResult = Math.round(result * 10000000000) / 10000000000;
        calculator.displayValue = `${roundedResult}`;
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

function updateDisplay() {
    const display = document.querySelector('.calculator-screen');
    display.value = calculator.displayValue;
}

// 이 부분은 브라우저 환경에서 실행될 때 필요합니다.
// document.addEventListener('DOMContentLoaded', () => {
//     updateDisplay();
//     const keys = document.querySelector('.calculator-keys');
//     keys.addEventListener('click', (event) => {
//         const { target } = event;
//         if (!target.matches('button')) {
//             return;
//         }

//         if (target.classList.contains('operator')) {
//             handleOperator(target.value);
//             updateDisplay();
//             return;
//         }

//         if (target.classList.contains('decimal')) {
//             inputDecimal(target.value);
//             updateDisplay();
//             return;
//         }

//         if (target.classList.contains('all-clear')) {
//             resetCalculator();
//             updateDisplay();
//             return;
//         }
        
//         if (target.classList.contains('equal-sign')) {
//             handleOperator(target.value);
//             updateDisplay();
//             return;
//         }

//         inputDigit(target.value);
//         updateDisplay();
//     });
// });
