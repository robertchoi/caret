// Jest와 유사한 테스트 환경을 가정하고 순수 JavaScript로 테스트를 작성합니다.
// 실제 실행을 위해서는 Jest나 유사한 테스트 러너가 필요합니다.

const calculator = require("./script")

// 테스트 스위트(Test Suite) 정의
function describe(name, fn) {
	console.log(`\n--- ${name} ---`)
	fn()
}

// 개별 테스트 케이스(Test Case) 정의
function it(name, fn) {
	try {
		fn()
		console.log(`  [PASS] ${name}`)
	} catch (error) {
		console.error(`  [FAIL] ${name}`)
		console.error(error)
	}
}

// 단언(Assertion) 함수 정의
const expect = (actual) => ({
	toBe: (expected) => {
		if (actual !== expected) {
			throw new Error(`Expected ${actual} to be ${expected}`)
		}
	},
})

// --- 계산기 로직 테스트 시작 ---

describe("Calculator Logic", () => {
	it("should perform addition correctly", () => {
		// 1 + 2 = 3
		calculator.handleNumber("1")
		calculator.handleOperator("+")
		calculator.handleNumber("2")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("3")
	})

	it("should perform subtraction correctly", () => {
		// 10 - 3 = 7
		calculator.handleClear()
		calculator.handleNumber("10")
		calculator.handleOperator("-")
		calculator.handleNumber("3")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("7")
	})

	it("should perform multiplication correctly", () => {
		// 4 * 5 = 20
		calculator.handleClear()
		calculator.handleNumber("4")
		calculator.handleOperator("*")
		calculator.handleNumber("5")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("20")
	})

	it("should perform division correctly", () => {
		// 10 / 2 = 5
		calculator.handleClear()
		calculator.handleNumber("10")
		calculator.handleOperator("/")
		calculator.handleNumber("2")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("5")
	})

	it("should handle division by zero", () => {
		// 5 / 0 = Error
		calculator.handleClear()
		calculator.handleNumber("5")
		calculator.handleOperator("/")
		calculator.handleNumber("0")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("Error")
	})

	it("should clear the display and all internal state", () => {
		calculator.handleNumber("1")
		calculator.handleOperator("+")
		calculator.handleNumber("2")
		calculator.handleClear()
		expect(calculator.getDisplayValue()).toBe("0")
		// 내부 상태도 초기화되었는지 확인 (구현에 따라 추가 테스트 필요)
	})

	it("should handle continuous calculations", () => {
		// 2 * 3 = 6, then + 4 = 10
		calculator.handleClear()
		calculator.handleNumber("2")
		calculator.handleOperator("*")
		calculator.handleNumber("3")
		calculator.handleEqual()
		calculator.handleOperator("+")
		calculator.handleNumber("4")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("10")
	})

	it("should handle decimal point calculations", () => {
		// 1.5 + 2.5 = 4
		calculator.handleClear()
		calculator.handleNumber("1")
		calculator.handleDecimal()
		calculator.handleNumber("5")
		calculator.handleOperator("+")
		calculator.handleNumber("2")
		calculator.handleDecimal()
		calculator.handleNumber("5")
		calculator.handleEqual()
		expect(calculator.getDisplayValue()).toBe("4")
	})
})
