// Basic arithmetic functions
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
        return "Error";
    }
    return a / b;
}

// Calculator state variables
let displayValue = '0';
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;

// Function to update the display
function updateDisplay() {
    const display = document.querySelector('.calculator-screen');
    if (display) {
        display.value = displayValue;
    }
}

// Handles digit input
function inputDigit(digit) {
    if (waitingForSecondOperand === true) {
        displayValue = digit;
        waitingForSecondOperand = false;
    } else {
        displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
}

// Handles decimal point input
function inputDecimal(dot) {
    if (waitingForSecondOperand === true) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        return;
    }
    if (!displayValue.includes(dot)) {
        displayValue += dot;
    }
}

// Handles operator input
function handleOperator(nextOperator) {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        return;
    }

    if (firstOperand === null) {
        firstOperand = inputValue;
    } else if (operator) {
        const result = performCalculation[operator](firstOperand, inputValue);

        displayValue = String(result);
        firstOperand = result;
    }

    waitingForSecondOperand = true;
    operator = nextOperator;
}

// Performs the calculation based on the operator
const performCalculation = {
    '/': (firstOperand, secondOperand) => divide(firstOperand, secondOperand),
    '*': (firstOperand, secondOperand) => multiply(firstOperand, secondOperand),
    '+': (firstOperand, secondOperand) => add(firstOperand, secondOperand),
    '-': (firstOperand, secondOperand) => subtract(firstOperand, secondOperand),
    '=': (firstOperand, secondOperand) => {
        // This case is handled by handleEquals, but included for completeness
        // in case performCalculation is called directly with '='
        return secondOperand;
    }
};

// Handles the equals button
function handleEquals() {
    if (firstOperand === null || operator === null) {
        return;
    }

    const inputValue = parseFloat(displayValue);
    let result = performCalculation[operator](firstOperand, inputValue);

    if (result === "Error") {
        displayValue = "Error";
    } else {
        displayValue = String(result);
    }

    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
}

// Clears the calculator state
function clear() {
    displayValue = '0';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
}

// Main calculate function for testing purposes (Node.js environment)
// This function simulates the state changes that would happen in the browser
// based on button clicks, without actual DOM manipulation.
function calculate(action, value, currentDisplayValue, currentFirstOperand, currentOperator, currentWaitingForSecondOperand) {
    displayValue = currentDisplayValue;
    firstOperand = currentFirstOperand;
    operator = currentOperator;
    waitingForSecondOperand = currentWaitingForSecondOperand;

    switch (action) {
        case 'inputDigit':
            inputDigit(value);
            break;
        case 'inputDecimal':
            inputDecimal(value);
            break;
        case 'handleOperator':
            handleOperator(value);
            break;
        case 'handleEquals':
            handleEquals();
            break;
        case 'clear':
            clear();
            break;
        default:
            break;
    }

    return {
        displayValue,
        firstOperand,
        operator,
        waitingForSecondOperand
    };
}

// Export functions for testing in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        add,
        subtract,
        multiply,
        divide,
        calculate
    };
}
