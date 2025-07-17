// script.js

// 전역 변수 (계산기 상태)
let currentNumber = '';
let previousNumber = '';
let operator = null;
let displayValue = '0';
let waitingForNewNumber = false; // 연산자 입력 후 새 숫자 입력을 기다리는지 여부

// DOM 요소
const display = document.getElementById('display');
const numberButtons = document.querySelectorAll('.number');
const operatorButtons = document.querySelectorAll('.operator');
const equalsButton = document.getElementById('equals');
const clearButton = document.getElementById('clear');
const clearEntryButton = document.getElementById('clear-entry');
const decimalButton = document.getElementById('decimal');

// 초기 디스플레이 업데이트
updateDisplay();

// 이벤트 리스너
numberButtons.forEach(button => {
    button.addEventListener('click', () => appendNumber(button.textContent));
});

operatorButtons.forEach(button => {
    button.addEventListener('click', () => setOperator(button.textContent));
});

equalsButton.addEventListener('click', calculate);
clearButton.addEventListener('click', clear);
clearEntryButton.addEventListener('click', clearEntry);
decimalButton.addEventListener('click', () => appendNumber('.'));

// --- 핵심 로직 함수 ---

// 디스플레이 업데이트
function updateDisplay() {
    display.textContent = displayValue;
}

// 숫자 추가
function appendNumber(number) {
    if (displayValue === 'Error') { // 에러 상태에서 숫자 입력 시 초기화
        clear();
    }

    if (waitingForNewNumber) {
        currentNumber = number;
        waitingForNewNumber = false;
    } else {
        if (number === '.' && currentNumber.includes('.')) {
            return;
        }
        if (currentNumber === '0' && number !== '.') {
            currentNumber = number;
        } else {
            currentNumber += number;
        }
    }
    displayValue = currentNumber;
    updateDisplay();
}

// 연산자 설정
function setOperator(op) {
    if (displayValue === 'Error') return; // 에러 상태에서는 연산자 입력 무시

    if (currentNumber === '' && previousNumber === '') return; // 아무것도 입력되지 않은 상태에서 연산자 누르면 무시

    if (currentNumber !== '' && previousNumber === '') {
        previousNumber = currentNumber;
        currentNumber = '';
    } else if (currentNumber !== '' && previousNumber !== '') {
        // 연속 연산 처리 (예: 1 + 2 + 3)
        calculate(); // 이전 연산 먼저 수행
        previousNumber = displayValue; // 계산된 결과를 previousNumber로 설정
        currentNumber = ''; // currentNumber 초기화
    }
    operator = op;
    waitingForNewNumber = true; // 다음 숫자 입력을 기다림
    displayValue = previousNumber; // 연산자 입력 후에도 이전 결과/숫자 표시
    updateDisplay();
}

// 계산 수행
function calculate() {
    if (previousNumber === '' || currentNumber === '' || operator === null) {
        // 필요한 모든 값이 없으면 계산하지 않음
        return;
    }

    const result = operate(operator, previousNumber, currentNumber);
    displayValue = result.toString();

    // 결과가 너무 길면 지수 표기법으로 변환하거나 잘라낼 수 있습니다.
    if (displayValue.length > 10) { // 예시: 10자리 초과 시
        displayValue = parseFloat(displayValue).toPrecision(8); // 정밀도 조절
        if (displayValue.length > 10) { // 그래도 길면 잘라냄
            displayValue = parseFloat(displayValue).toFixed(5); // 소수점 5자리로 제한
            if (displayValue.length > 10) {
                displayValue = "Too Big"; // 더 이상 표시할 수 없는 경우
            }
        }
    }

    previousNumber = '';
    operator = null;
    waitingForNewNumber = true; // 계산 후 새 숫자 입력을 기다림
    currentNumber = displayValue; // 결과값을 currentNumber에 저장 (다음 연산을 위해)
    updateDisplay();
}

// 모든 상태 초기화 (C)
function clear() {
    currentNumber = '';
    previousNumber = '';
    operator = null;
    displayValue = '0';
    waitingForNewNumber = false;
    updateDisplay();
}

// 현재 입력 값 초기화 (CE)
function clearEntry() {
    if (displayValue === 'Error') { // 에러 상태에서 CE 누르면 초기화
        clear();
        return;
    }
    currentNumber = '';
    displayValue = '0';
    waitingForNewNumber = false; // CE 후에는 새 숫자 입력 대기 상태 해제
    updateDisplay();
}

// --- 기본 연산 함수 (테스트 코드와 동일하게 내보내기) ---
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

// operate 함수 (테스트 코드와 동일하게 내보내기)
function operate(operator, num1, num2) {
    num1 = parseFloat(num1);
    num2 = parseFloat(num2);

    if (isNaN(num1) || isNaN(num2)) { // 숫자가 아닌 경우 에러 처리
        return "Error";
    }

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
}

// Jest 테스트를 위해 함수들을 내보냅니다. (Node.js 환경에서만 필요)
// 브라우저 환경에서는 전역 스코프에 노출되므로 이 부분은 실제 배포 시에는 필요 없을 수 있습니다.
// module.exports = {
//     add,
//     subtract,
//     multiply,
//     divide,
//     operate,
//     // UI 관련 함수는 DOM에 의존하므로 Node.js 테스트에서는 직접 내보내지 않습니다.
//     // 하지만, 테스트 코드에서 전역 변수를 직접 조작하여 테스트할 수 있도록
//     // 필요한 경우 상태 변수들을 노출하거나, 테스트용 헬퍼 함수를 만들 수 있습니다.
// };
