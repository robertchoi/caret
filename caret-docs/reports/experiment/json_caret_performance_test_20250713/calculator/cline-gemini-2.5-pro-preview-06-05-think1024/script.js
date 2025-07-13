if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", () => {
		const display = document.getElementById("display")
		const buttons = document.querySelector(".buttons")

		let currentInput = "0"
		let operator = null
		let firstOperand = null
		let waitingForSecondOperand = false

		function updateDisplay() {
			display.textContent = currentInput
		}

		updateDisplay()

		buttons.addEventListener("click", (event) => {
			const { target } = event
			const { value } = target

			if (!target.matches("button")) {
				return
			}

			switch (value) {
				case "+":
				case "-":
				case "*":
				case "/":
					handleOperator(value)
					break
				case "=":
					handleEqual()
					break
				case "C":
					resetCalculator()
					break
				case ".":
					inputDecimal(value)
					break
				default:
					if (Number.isInteger(parseInt(value))) {
						inputDigit(value)
					}
			}
			updateDisplay()
		})

		function inputDigit(digit) {
			if (waitingForSecondOperand) {
				currentInput = digit
				waitingForSecondOperand = false
			} else {
				currentInput = currentInput === "0" ? digit : currentInput + digit
			}
		}

		function inputDecimal(dot) {
			if (waitingForSecondOperand) {
				currentInput = "0."
				waitingForSecondOperand = false
				return
			}
			if (!currentInput.includes(dot)) {
				currentInput += dot
			}
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
				const result = calculate(firstOperand, operator, inputValue)
				currentInput = String(result)
				firstOperand = result
			}

			waitingForSecondOperand = true
			operator = nextOperator
		}

		function handleEqual() {
			if (operator && !waitingForSecondOperand) {
				const inputValue = parseFloat(currentInput)
				const result = calculate(firstOperand, operator, inputValue)
				currentInput = String(result)
				firstOperand = result // 연속 계산을 위해 결과를 firstOperand에 저장
				operator = null
				waitingForSecondOperand = true
			}
		}

		function resetCalculator() {
			currentInput = "0"
			operator = null
			firstOperand = null
			waitingForSecondOperand = false
		}

		function calculate(num1, op, num2) {
			switch (op) {
				case "+":
					return num1 + num2
				case "-":
					return num1 - num2
				case "*":
					return num1 * num2
				case "/":
					return num2 === 0 ? "Error" : num1 / num2
				default:
					return num2
			}
		}
	})
}

// For Node.js testing environment
if (typeof module !== "undefined" && module.exports) {
	// This is a simplified calculator logic for testing purposes.
	// The actual DOM-related logic is in the 'DOMContentLoaded' event listener.
	const calculatorForTest = {
		calculate: (num1, operator, num2) => {
			num1 = parseFloat(num1)
			num2 = parseFloat(num2)
			switch (operator) {
				case "+":
					return num1 + num2
				case "-":
					return num1 - num2
				case "*":
					return num1 * num2
				case "/":
					return num2 === 0 ? "Error" : num1 / num2
				default:
					return null
			}
		},
	}
	module.exports = calculatorForTest
}
