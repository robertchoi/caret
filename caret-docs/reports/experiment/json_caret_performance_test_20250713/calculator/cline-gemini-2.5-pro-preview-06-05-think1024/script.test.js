// 순수 JavaScript로 작성된 간단한 테스트 스위트
const describe = (description, fn) => {
	console.log(description)
	fn()
}

const it = (description, fn) => {
	try {
		fn()
		console.log(`  ✓ ${description}`)
	} catch (error) {
		console.error(`  ✗ ${description}`)
		console.error(error)
		process.exit(1) // 테스트 실패 시 프로세스 종료
	}
}

const expect = (actual) => ({
	toBe: (expected) => {
		if (actual !== expected) {
			throw new Error(`Expected ${actual} to be ${expected}`)
		}
	},
})

// 실제 script.js 파일에서 calculator 로직을 가져옵니다.
const calculator = require("./script.js")

describe("Calculator Logic", () => {
	it("should add two numbers correctly", () => {
		expect(calculator.calculate(1, "+", 2)).toBe(3)
	})

	it("should subtract two numbers correctly", () => {
		expect(calculator.calculate(10, "-", 3)).toBe(7)
	})

	it("should multiply two numbers correctly", () => {
		expect(calculator.calculate(4, "*", 5)).toBe(20)
	})

	it("should divide two numbers correctly", () => {
		expect(calculator.calculate(10, "/", 2)).toBe(5)
	})

	it("should handle division by zero", () => {
		expect(calculator.calculate(5, "/", 0)).toBe("Error")
	})

	it("should handle decimal calculations", () => {
		expect(calculator.calculate(1.5, "+", 2.5)).toBe(4)
	})

	it("should perform chained calculations", () => {
		let result = calculator.calculate(1, "+", 2) // 3
		result = calculator.calculate(result, "*", 4) // 12
		expect(result).toBe(12)
	})
})

console.log("All tests passed!")
