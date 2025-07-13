// script.js

// --- Pure Calculation Logic ---
// This part is for direct testing (from script.test.js)
const calculator = {
	add: (a, b) => a + b,
	subtract: (a, b) => a - b,
	multiply: (a, b) => a * b,
	divide: (a, b) => {
		if (b === 0) {
			return "Error"
		}
		return a / b
	},
}

// --- UI Interaction Logic ---
// 브라우저 환경에서만 실행되도록 체크
if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", () => {
		const display = document.getElementById("display")
		let currentInput = "0"
		let operator = null
		let firstOperand = null
		let waitingForSecondOperand = false

		function updateDisplay() {
			display.textContent = currentInput
		}

		updateDisplay()

		function inputDigit(digit) {
			if (waitingForSecondOperand) {
				currentInput = digit
				waitingForSecondOperand = false
			} else {
				currentInput = currentInput === "0" ? digit : currentInput + digit
			}
			updateDisplay()
		}

		function inputDecimal() {
			if (waitingForSecondOperand) {
				currentInput = "0."
				waitingForSecondOperand = false
				return
			}
			if (!currentInput.includes(".")) {
				currentInput += "."
			}
			updateDisplay()
		}

		function handleOperator(nextOperator) {
			const inputValue = parseFloat(currentInput)

			if (operator && waitingForSecondOperand) {
				operator = nextOperator
				return
			}

			if (firstOperand === null) {
				firstOperand = inputValue
			} else if (operator) {
				const result = performCalculation[operator](firstOperand, inputValue)
				currentInput = String(result)
				firstOperand = result
			}

			waitingForSecondOperand = true
			operator = nextOperator
			updateDisplay()
		}

		const performCalculation = {
			"/": (first, second) => (second === 0 ? "Error" : first / second),
			"*": (first, second) => first * second,
			"+": (first, second) => first + second,
			"-": (first, second) => first - second,
			"=": (first, second) => second,
		}

		function resetCalculator() {
			currentInput = "0"
			operator = null
			firstOperand = null
			waitingForSecondOperand = false
			updateDisplay()
		}

		document.querySelector(".buttons").addEventListener("click", (event) => {
			const { target } = event
			if (!target.matches("button")) {
				return
			}

			if (target.classList.contains("operator")) {
				handleOperator(target.value)
				return
			}

			if (target.classList.contains("decimal")) {
				inputDecimal()
				return
			}

			if (target.classList.contains("clear")) {
				resetCalculator()
				return
			}

			inputDigit(target.value)
		})
	})
}

// Node.js 환경에서 테스트할 수 있도록 모듈로 내보내기
if (typeof module !== "undefined" && module.exports) {
	module.exports = calculator
}
