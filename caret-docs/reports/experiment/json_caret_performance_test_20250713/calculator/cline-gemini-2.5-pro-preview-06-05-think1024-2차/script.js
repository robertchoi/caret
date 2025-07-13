// script.js

// --- 순수 계산 로직 ---
const calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => (b === 0 ? 'Error' : a / b),
};

// --- UI 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const buttons = document.querySelector('.buttons');

    let currentInput = '0';
    let operator = null;
    let firstOperand = null;
    let waitingForSecondOperand = false;

    function updateDisplay() {
        display.textContent = currentInput;
    }

    updateDisplay();

    function inputDigit(digit) {
        if (waitingForSecondOperand) {
            currentInput = digit;
            waitingForSecondOperand = false;
        } else {
            currentInput = currentInput === '0' ? digit : currentInput + digit;
        }
    }

    function inputDecimal() {
        if (!currentInput.includes('.')) {
            currentInput += '.';
        }
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(currentInput);

        if (operator && waitingForSecondOperand) {
            operator = nextOperator;
            return;
        }

        if (firstOperand === null) {
            firstOperand = inputValue;
        } else if (operator) {
            const result = performCalculation[operator](firstOperand, inputValue);
            currentInput = String(result);
            firstOperand = result;
        }

        waitingForSecondOperand = true;
        operator = nextOperator;
    }

    const performCalculation = {
        '/': (first, second) => calculator.divide(first, second),
        '*': (first, second) => calculator.multiply(first, second),
        '+': (first, second) => calculator.add(first, second),
        '-': (first, second) => calculator.subtract(first, second),
    };

    function handleEqual() {
        if (!operator || waitingForSecondOperand) return;

        const inputValue = parseFloat(currentInput);
        const result = performCalculation[operator](firstOperand, inputValue);

        currentInput = String(result);
        operator = null;
        firstOperand = null;
        waitingForSecondOperand = false;
    }

    function resetCalculator() {
        currentInput = '0';
        operator = null;
        firstOperand = null;
        waitingForSecondOperand = false;
    }

    buttons.addEventListener('click', (event) => {
        const { target } = event;
        if (!target.matches('button')) {
            return;
        }

        const { value } = target;

        switch (value) {
            case '+':
            case '-':
            case '*':
            case '/':
                handleOperator(value);
                break;
            case '=':
                handleEqual();
                break;
            case '.':
                inputDecimal();
                break;
            case 'clear':
                resetCalculator();
                break;
            default:
                if (Number.isInteger(parseInt(value))) {
                    inputDigit(value);
                }
        }

        updateDisplay();
    });
});

// For testing purposes
const add = calculator.add;
const subtract = calculator.subtract;
const multiply = calculator.multiply;
const divide = calculator.divide;
