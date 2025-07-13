// 순수 JavaScript를 사용한 간단한 테스트 스위트
const assert = {
	strictEqual: function (actual, expected, message) {
		if (actual !== expected) {
			throw new Error(message || `Failed: ${actual} !== ${expected}`)
		}
	},
}

function runTest(name, testFunction) {
	try {
		testFunction()
		console.log(`✅ [PASS] ${name}`)
	} catch (error) {
		console.error(`❌ [FAIL] ${name}`)
		console.error(error)
	}
}

// 테스트 대상 함수 (script.js에서 가져오기)
const calculator = require("./script.js")

// --- 테스트 케이스 ---

runTest("덧셈 테스트", () => {
	assert.strictEqual(calculator.add(1, 2), 3, "1 + 2는 3이어야 합니다.")
})

runTest("뺄셈 테스트", () => {
	assert.strictEqual(calculator.subtract(5, 2), 3, "5 - 2는 3이어야 합니다.")
})

runTest("곱셈 테스트", () => {
	assert.strictEqual(calculator.multiply(3, 4), 12, "3 * 4는 12여야 합니다.")
})

runTest("나눗셈 테스트", () => {
	assert.strictEqual(calculator.divide(10, 2), 5, "10 / 2는 5여야 합니다.")
})

runTest("소수점 덧셈 테스트", () => {
	assert.strictEqual(calculator.add(1.5, 2.5), 4, "1.5 + 2.5는 4여야 합니다.")
})

runTest("0으로 나누기 테스트", () => {
	assert.strictEqual(calculator.divide(5, 0), "Error", "0으로 나누면 'Error'를 반환해야 합니다.")
})

console.log("\n테스트가 완료되었습니다.")
