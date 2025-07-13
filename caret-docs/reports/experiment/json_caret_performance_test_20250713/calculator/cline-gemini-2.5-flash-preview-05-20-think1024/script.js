// CARET MODIFICATION: Calculator logic based on calculator-spec.md and script.test.js

// Basic arithmetic operations
function add(a, b) {
	return a + b
}

function subtract(a, b) {
	return a - b
}

function multiply(a, b) {
	return a * b
}

function divide(a, b) {
	if (b === 0) {
		console.error("Error: Division by zero is not allowed.")
		return Infinity // Or throw an error, depending on desired behavior
	}
	return a / b
}

// Calculator state and logic
const calculator = {
	currentValue: "0",
	previousValue: null,
	operator: null,
	waitingForSecondOperand: false, // To handle continuous operations

	// Resets the calculator state
	clear() {
		this.currentValue = "0"
		this.previousValue = null
		this.operator = null
		this.waitingForSecondOperand = false
	},

	// Appends a digit to the current value
	inputDigit(digit) {
		if (this.waitingForSecondOperand === true) {
			this.currentValue = digit
			this.waitingForSecondOperand = false
		} else {
			this.currentValue = this.currentValue === "0" ? digit : this.currentValue + digit
		}
	},

	// Handles decimal point input
	inputDecimal(dot) {
		if (this.waitingForSecondOperand === true) {
			this.currentValue = "0."
			this.waitingForSecondOperand = false
			return
		}
		if (!this.currentValue.includes(dot)) {
			this.currentValue += dot
		}
	},

	// Handles operator input
	handleOperator(nextOperator) {
		const inputValue = parseFloat(this.currentValue)

		if (this.operator && this.waitingForSecondOperand) {
			this.operator = nextOperator
			return
		}

		if (this.previousValue === null) {
			this.previousValue = inputValue
		} else if (this.operator) {
			const result = operate(this.previousValue, inputValue, this.operator)
			this.currentValue = String(result)
			this.previousValue = result
		}

		this.waitingForSecondOperand = true
		this.operator = nextOperator
	},

	// Performs the calculation based on the operator
	performCalculation() {
		const inputValue = parseFloat(this.currentValue)

		if (this.previousValue === null || this.operator === null) {
			return
		}

		const result = operate(this.previousValue, inputValue, this.operator)
		this.currentValue = String(result)
		this.previousValue = null
		this.operator = null
		this.waitingForSecondOperand = false
	},
}

// Helper function to perform operation based on operator string
function operate(firstOperand, secondOperand, operator) {
	switch (operator) {
		case "+":
			return add(firstOperand, secondOperand)
		case "-":
			return subtract(firstOperand, secondOperand)
		case "*":
			return multiply(firstOperand, secondOperand)
		case "/":
			return divide(firstOperand, secondOperand)
		default:
			return secondOperand
	}
}

// Export functions for testing
module.exports = {
	add,
	subtract,
	multiply,
	divide,
	calculator, // Export the calculator object for state-based testing
	// The `calculate` function from spec is handled by the calculator object's state management
	// For the continuous calculation test case in script.test.js, we'll use the basic functions directly.
	// If a string expression parser is needed, it would be implemented here.
	// For now, the `calculate` function in the test will directly use add/subtract/multiply/divide.
	// If the spec implies a single `calculate` function that parses a string like "1 + 2 * 3",
	// that would be a more complex implementation. The current spec implies left-to-right.
	calculate: (expression) => {
		// This is a simplified interpretation for the test case "1 + 2 + 3 = 6"
		// It assumes a sequence of operations rather than a full expression parser.
		// For the purpose of the test, we'll use the calculator object's logic.
		// If the test expects a string like "1 + 2 * 3 - 4 / 2", a more complex parser is needed.
		// Given the spec's "입력 순서대로 계산" (calculate in input order),
		// a simple state machine (like the `calculator` object) is appropriate.
		// The test cases in script.test.js for `calculate` are already adapted to this.
		// So, this `calculate` export is primarily for the test file's `require` statement.
		// It will not be used directly for parsing complex strings here.
		// The `calculator` object handles the stateful calculation.
		// For the test `calculate(expression)` to work, we need to simulate input.
		// Let's make a simple parser for the test cases.
		const tokens = expression.split(/([+\-*/=])/).filter((token) => token.trim() !== "")
		let currentResult = parseFloat(tokens[0])
		for (let i = 1; i < tokens.length; i += 2) {
			const op = tokens[i]
			const nextNum = parseFloat(tokens[i + 1])
			if (op === "+") currentResult = add(currentResult, nextNum)
			else if (op === "-") currentResult = subtract(currentResult, nextNum)
			else if (op === "*") currentResult = multiply(currentResult, nextNum)
			else if (op === "/") currentResult = divide(currentResult, nextNum)
		}
		return currentResult
	},
	clear: () => calculator.clear(), // Export clear from the calculator object
}
