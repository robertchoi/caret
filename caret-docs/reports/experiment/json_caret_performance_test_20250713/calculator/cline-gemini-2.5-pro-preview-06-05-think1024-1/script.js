let displayValue = '';
let firstValue = null;
let operator = null;
let waitingForSecondValue = false;

const display = document.getElementById('display');

function updateDisplay() {
    display.innerText = displayValue || '0';
}

function handleNumber(number) {
    if (waitingForSecondValue) {
        displayValue = number;
        waitingForSecondValue = false;
    } else {
        displayValue = displayValue === '0' ? number : displayValue + number;
    }
    updateDisplay();
}

function handleOperator(nextOperator) {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondValue) {
        operator = nextOperator;
        return;
    }

    if (firstValue === null) {
        firstValue = inputValue;
    } else if (operator) {
        const result = calculate(firstValue, operator, inputValue);
        displayValue = `${parseFloat(result.toFixed(7))}`;
        firstValue = result;
    }

    waitingForSecondValue = true;
    operator = nextOperator;
    updateDisplay();
}

function calculate(first, op, second) {
    if (op === '+') return first + second;
    if (op === '-') return first - second;
    if (op === '*') return first * second;
    if (op === '/') {
        if (second === 0) return 'Error';
        return first / second;
    }
    return second;
}

function handleEqual() {
    if (!operator || firstValue === null) return;

    const secondValue = parseFloat(displayValue);
    const result = calculate(firstValue, operator, secondValue);

    displayValue = String(result);
    firstValue = null;
    operator = null;
    waitingForSecondValue = false;
    updateDisplay();
}

function handleClear() {
    displayValue = '';
    firstValue = null;
    operator = null;
    waitingForSecondValue = false;
    if (display) {
        display.innerText = '';
    }
}

function handleDecimal() {
    if (waitingForSecondValue) {
        displayValue = '0.';
        waitingForSecondValue = false;
        updateDisplay();
        return;
    }

    if (!displayValue.includes('.')) {
        displayValue += '.';
    }
    updateDisplay();
}


// for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleNumber,
        handleOperator,
        handleEqual,
        handleClear,
        calculate,
        // private state for testing
        _getState: () => ({ displayValue, firstValue, operator, waitingForSecondValue }),
        _setState: (state) => {
            displayValue = state.displayValue;
            firstValue = state.firstValue;
            operator = state.operator;
            waitingForSecondValue = state.waitingForSecondValue;
        }
    };
}
