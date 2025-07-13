// 실제 계산기 로직
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

// --- UI 상호작용 로직 ---
// 브라우저 환경에서만 실행되도록 확인
if (typeof window !== "undefined") {
	const display = document.getElementById("display")
	const buttons = document.querySelector(".buttons")

	let currentInput = "0"
	let operator = null
	let firstOperand = null
	let shouldResetDisplay = false

	function updateDisplay() {
		display.textContent = currentInput
	}

	function clear() {
		currentInput = "0"
		operator = null
		firstOperand = null
		shouldResetDisplay = false
		updateDisplay()
	}

	function calculate() {
		if (operator === null || firstOperand === null) return
		const secondOperand = parseFloat(currentInput)
		let result
		switch (operator) {
			case "+":
				result = calculator.add(firstOperand, secondOperand)
				break
			case "-":
				result = calculator.subtract(firstOperand, secondOperand)
				break
			case "*":
				result = calculator.multiply(firstOperand, secondOperand)
				break
			case "/":
				result = calculator.divide(firstOperand, secondOperand)
				break
			default:
				return
		}
		currentInput = String(result)
		operator = null
		firstOperand = null
		shouldResetDisplay = true
		updateDisplay()
	}

	buttons.addEventListener("click", (event) => {
		const { target } = event
		if (!target.matches("button")) return

		const { value } = target.dataset
		console.log("Button clicked:", value) // 디버깅용 로그 추가

		if (value === "C") {
			clear()
			return
		}

		if (value === "=") {
			calculate()
			return
		}

		if (["+", "-", "*", "/"].includes(value)) {
			if (operator !== null) calculate()
			firstOperand = parseFloat(currentInput)
			operator = value
			shouldResetDisplay = true
			return
		}

		if (value === ".") {
			if (shouldResetDisplay) {
				currentInput = "0."
				shouldResetDisplay = false
			} else if (!currentInput.includes(".")) {
				currentInput += "."
			}
			updateDisplay()
			return
		}

		// 숫자 입력 처리
		if (shouldResetDisplay || currentInput === "0") {
			currentInput = value
			shouldResetDisplay = false
		} else {
			currentInput += value
		}
		updateDisplay()
	})

	clear() // 초기화
}

// 이 파일은 브라우저와 Node.js 환경 모두에서 동작해야 합니다.
// Node.js의 테스트 환경을 위해 module.exports를 사용합니다.
if (typeof module !== "undefined" && module.exports) {
	module.exports = calculator
}
