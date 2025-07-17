// script.js - 계산기 로직 및 UI 상호작용

// 핵심 계산 함수들
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
        return "Error"; // 0으로 나누기 오류 처리
    }
    return a / b;
}

// 연산자 기반으로 계산을 수행하는 함수
function operate(operator, a, b) {
    a = Number(a);
    b = Number(b);
    switch (operator) {
        case '+':
            return add(a, b);
        case '-':
            return subtract(a, b);
        case '*':
            return multiply(a, b);
        case '/':
            return divide(a, b);
        default:
            return "Error"; // 알 수 없는 연산자
    }
}

// UI 관련 변수
let displayValue = '0';
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;

const display = document.querySelector('.calculator-display');

// 숫자 버튼 클릭 처리
function inputDigit(digit) {
    if (waitingForSecondOperand === true) {
        displayValue = digit;
        waitingForSecondOperand = false;
    } else {
        displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
    updateDisplay();
}

// 소수점 버튼 클릭 처리
function inputDecimal(dot) {
    if (waitingForSecondOperand === true) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        return;
    }
    if (!displayValue.includes(dot)) {
        displayValue += dot;
    }
    updateDisplay();
}

// 연산자 버튼 클릭 처리
function handleOperator(nextOperator) {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        return;
    }

    if (firstOperand === null) {
        firstOperand = inputValue;
    } else if (operator) {
        const result = operate(operator, firstOperand, inputValue);

        if (result === "Error") {
            displayValue = "Error";
            firstOperand = null;
            operator = null;
            waitingForSecondOperand = false;
            updateDisplay();
            return;
        }
        displayValue = String(result);
        firstOperand = result;
    }

    waitingForSecondOperand = true;
    operator = nextOperator;
    updateDisplay();
}

// 'C' (Clear) 버튼 클릭 처리
function resetCalculator() {
    displayValue = '0';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    updateDisplay();
}

// 디스플레이 업데이트
function updateDisplay() {
    display.textContent = displayValue;
}

// 이벤트 리스너 설정
const calculator = document.querySelector('.calculator');
calculator.addEventListener('click', (event) => {
    const { target } = event;
    if (!target.matches('button')) {
        return;
    }

    if (target.classList.contains('operator')) {
        handleOperator(target.value);
        return;
    }

    if (target.classList.contains('decimal')) {
        inputDecimal(target.value);
        return;
    }

    if (target.classList.contains('clear')) {
        resetCalculator();
        return;
    }

    inputDigit(target.value);
});

// 초기 디스플레이 설정
document.addEventListener('DOMContentLoaded', updateDisplay);

// 테스트를 위해 함수들을 내보냅니다. (Node.js 환경에서 테스트 시 필요)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        add,
        subtract,
        multiply,
        divide,
        operate
    };
}
