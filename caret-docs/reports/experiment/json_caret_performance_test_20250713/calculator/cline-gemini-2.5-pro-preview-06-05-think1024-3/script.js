if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const display = document.querySelector('.display');
        const buttons = document.querySelector('.buttons');

    let calculatorState = {
        displayValue: '0',
        firstOperand: null,
        waitingForSecondOperand: false,
        operator: null,
    };

    function updateDisplay() {
        display.textContent = calculatorState.displayValue;
    }

    updateDisplay();

    buttons.addEventListener('click', (event) => {
        const { target } = event;
        const { textContent } = target;

        if (!target.matches('button')) {
            return;
        }

        switch (textContent) {
            case '+':
            case '-':
            case '*':
            case '/':
                handleOperator(textContent);
                break;
            case '=':
                handleEqualSign();
                break;
            case '.':
                inputDecimal(textContent);
                break;
            case 'C':
                resetCalculator();
                break;
            default:
                if (Number.isInteger(parseFloat(textContent))) {
                    inputDigit(textContent);
                }
        }
        updateDisplay();
    });

    function inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = calculatorState;

        if (waitingForSecondOperand === true) {
            calculatorState.displayValue = digit;
            calculatorState.waitingForSecondOperand = false;
        } else {
            calculatorState.displayValue = displayValue === '0' ? digit : displayValue + digit;
        }
    }

    function inputDecimal(dot) {
        if (calculatorState.waitingForSecondOperand) return;
        if (!calculatorState.displayValue.includes(dot)) {
            calculatorState.displayValue += dot;
        }
    }

    function handleOperator(nextOperator) {
        const { firstOperand, displayValue, operator } = calculatorState;
        const inputValue = parseFloat(displayValue);

        if (operator && calculatorState.waitingForSecondOperand) {
            calculatorState.operator = nextOperator;
            return;
        }

        if (firstOperand == null) {
            calculatorState.firstOperand = inputValue;
        } else if (operator) {
            const result = calculate(firstOperand, operator, inputValue);
            calculatorState.displayValue = `${parseFloat(result.toFixed(7))}`;
            calculatorState.firstOperand = result;
        }

        calculatorState.waitingForSecondOperand = true;
        calculatorState.operator = nextOperator;
    }
    
    function handleEqualSign() {
        const { operator, firstOperand, displayValue } = calculatorState;
        if (operator && !calculatorState.waitingForSecondOperand) {
            const inputValue = parseFloat(displayValue);
            const result = calculate(firstOperand, operator, inputValue);

            calculatorState.displayValue = `${parseFloat(result.toFixed(7))}`;
            calculatorState.firstOperand = result;
            calculatorState.operator = null;
            calculatorState.waitingForSecondOperand = true;
        }
    }

    function resetCalculator() {
        calculatorState.displayValue = '0';
        calculatorState.firstOperand = null;
        calculatorState.waitingForSecondOperand = false;
        calculatorState.operator = null;
    }
    });
}

// Node.js 환경에서의 테스트를 위해 export 추가
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculate;
}

function calculate(firstOperand, operator, secondOperand) {
    switch (operator) {
        case '+':
            return firstOperand + secondOperand;
        case '-':
            return firstOperand - secondOperand;
        case '*':
            return firstOperand * secondOperand;
        case '/':
            return secondOperand === 0 ? 'Error' : firstOperand / secondOperand;
        default:
            return secondOperand;
    }
}
