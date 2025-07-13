// script.test.js

// Jest와 같은 테스트 러너가 없으므로, 간단한 assert 함수를 만들어 테스트합니다.
function assert(condition, message) {
	if (!condition) {
		throw new Error(message || "Assertion failed")
	}
}

// 테스트를 그룹화하기 위한 간단한 describe/it 구조
const tests = []
function describe(description, fn) {
	console.log(description)
	fn()
}

function it(description, fn) {
	tests.push({ description, fn })
}

function runTests() {
	tests.forEach((test) => {
		try {
			test.fn()
			console.log(`  ✓ ${test.description}`)
		} catch (e) {
			console.error(`  ✗ ${test.description}`)
			console.error(e)
		}
	})
}

// script.js에서 calculator 객체를 가져옵니다.
const calculator = require("./script.js")

describe("Calculator Logic", () => {
	it("should correctly add two numbers", () => {
		assert(calculator.add(5, 3) === 8, "5 + 3 should be 8")
		assert(calculator.add(-1, 1) === 0, "-1 + 1 should be 0")
		assert(calculator.add(0.1, 0.2) === 0.30000000000000004, "0.1 + 0.2 should be ~0.3") // 부동소수점 문제 참고
	})

	it("should correctly subtract two numbers", () => {
		assert(calculator.subtract(10, 4) === 6, "10 - 4 should be 6")
		assert(calculator.subtract(5, 10) === -5, "5 - 10 should be -5")
	})

	it("should correctly multiply two numbers", () => {
		assert(calculator.multiply(3, 7) === 21, "3 * 7 should be 21")
		assert(calculator.multiply(2.5, 2) === 5, "2.5 * 2 should be 5")
	})

	it("should correctly divide two numbers", () => {
		assert(calculator.divide(10, 2) === 5, "10 / 2 should be 5")
		assert(calculator.divide(5, 2) === 2.5, "5 / 2 should be 2.5")
	})

	it("should handle division by zero", () => {
		assert(calculator.divide(10, 0) === "Error", 'Division by zero should return "Error"')
	})
})

// 모든 테스트를 실행합니다.
runTests()

// 이 파일은 Node.js 환경에서 `node script.test.js`로 실행하여 테스트할 수 있습니다.
