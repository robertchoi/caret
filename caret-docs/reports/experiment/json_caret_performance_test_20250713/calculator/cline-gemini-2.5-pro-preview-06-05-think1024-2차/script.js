// --- Calculator State ---
let displayValue = "0"
let firstOperand = null
let operator = null
let waitingForSecondOperand = false

// --- DOM Elements (for browser environment) ---
// 이 스크립트는 Node.js 환경의 테스트를 위해 로직만 포함합니다.
// 실제 브라우저에서 UI와 연결하려면 아래와 같은 코드가 필요합니다.
/*
const display = document.querySelector('.calculator-display');
const keys = document.querySelector('.calculator-keys');

keys.addEventListener('click', (event) => {
    const { target } = event;
    if (!target.matches('button')) {
        return;
    }

    if (target.classList.contains('operator')) {
        handleOperator(target.value);
        updateDisplay();
        return;
    }

    if (target.classList.contains('decimal')) {
        handleDecimal(target.value);
        updateDisplay();
        return;
    }

    if (target.classList.contains('all-clear')) {
        handleClear();
        updateDisplay();
        return;
    }
    
    if (target.classList.contains('equal-sign')) {
        handleEqual();
        updateDisplay();
        return;
    }

    handleNumber(target.value);
    updateDisplay();
});

function updateDisplay() {
    display.textContent = displayValue;
}
updateDisplay();
*/

// --- Calculator Logic ---

function handleNumber(number) {
	if (waitingForSecondOperand) {
		displayValue = number
		waitingForSecondOperand = false
	} else {
		displayValue = displayValue === "0" ? number : displayValue + number
	}
}

function handleDecimal() {
	if (!displayValue.includes(".")) {
		displayValue += "."
	}
}

function handleOperator(nextOperator) {
	const inputValue = parseFloat(displayValue)

	if (operator && waitingForSecondOperand) {
		operator = nextOperator
		return
	}

	if (firstOperand === null) {
		firstOperand = inputValue
	} else if (operator) {
		const result = performCalculation[operator](firstOperand, inputValue)
		displayValue = `${parseFloat(result.toFixed(7))}`
		firstOperand = result
	}

	waitingForSecondOperand = true
	operator = nextOperator
}

const performCalculation = {
	"/": (first, second) => (second === 0 ? "Error" : first / second),
	"*": (first, second) => first * second,
	"+": (first, second) => first + second,
	"-": (first, second) => first - second,
}

function handleEqual() {
	if (operator && !waitingForSecondOperand) {
		const inputValue = parseFloat(displayValue)
		const result = performCalculation[operator](firstOperand, inputValue)

		if (result === "Error") {
			displayValue = "Error"
		} else {
			displayValue = `${parseFloat(result.toFixed(7))}`
		}

		firstOperand = null
		operator = null
		waitingForSecondOperand = true
	}
}

function handleClear() {
	displayValue = "0"
	firstOperand = null
	operator = null
	waitingForSecondOperand = false
}

function getDisplayValue() {
	return displayValue
}

// --- Module Exports (for Node.js testing) ---
// 브라우저 환경에서는 이 부분이 필요 없습니다.
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		handleNumber,
		handleDecimal,
		handleOperator,
		handleEqual,
		handleClear,
		getDisplayValue,
	}
}
