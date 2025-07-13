// CARET MODIFICATION: Calculator logic tests based on calculator-spec.md
// CARET MODIFICATION: Calculator logic tests based on calculator-spec.md
// Using Vitest syntax.

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest" // Import Vitest globals

const { add, subtract, multiply, divide, calculate, calculator } = require("./script")

describe("Calculator Core Logic Tests", () => {
	// Mock console.error for divide by zero test
	let consoleErrorSpy
	beforeAll(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
	})
	afterAll(() => {
		consoleErrorSpy.mockRestore()
	})

	describe("Basic Arithmetic Operations", () => {
		it("add(a, b) should return the sum of a and b", () => {
			expect(add(1, 2)).toBe(3)
			expect(add(-1, 1)).toBe(0)
			expect(add(0.1, 0.2)).toBeCloseTo(0.3) // Use toBeCloseTo for floating point numbers
		})

		it("subtract(a, b) should return the difference of a and b", () => {
			expect(subtract(5, 3)).toBe(2)
			expect(subtract(3, 5)).toBe(-2)
			expect(subtract(10, 0.5)).toBe(9.5)
		})

		it("multiply(a, b) should return the product of a and b", () => {
			expect(multiply(2, 3)).toBe(6)
			expect(multiply(-2, 3)).toBe(-6)
			expect(multiply(0.5, 4)).toBe(2)
		})

		it("divide(a, b) should return the quotient of a and b", () => {
			expect(divide(6, 3)).toBe(2)
			expect(divide(10, 4)).toBe(2.5)
		})

		it("divide(a, 0) should handle division by zero", () => {
			// Expecting Infinity as per common JS behavior for division by zero
			expect(divide(5, 0)).toBe(Infinity)
			expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Division by zero is not allowed.")
		})
	})

	describe("Continuous Calculation", () => {
		// Note: The spec states "연산자 우선순위는 고려하지 않고, 입력 순서대로 계산"
		// This implies a simple left-to-right evaluation.
		it("calculate(expression) should perform continuous operations from left to right", () => {
			// Test case: "1 + 2 + 3 = 6"
			expect(calculate("1+2+3")).toBe(6)

			// Test case: "10 - 5 - 2 = 3"
			expect(calculate("10-5-2")).toBe(3)

			// Test case: "3 * 4 = 12"
			expect(calculate("3*4")).toBe(12)

			// Test case: "10 / 2 = 5"
			expect(calculate("10/2")).toBe(5)
		})
	})

	describe("Decimal Point Handling", () => {
		it("should correctly handle decimal numbers in addition", () => {
			expect(add(0.1, 0.2)).toBeCloseTo(0.3)
		})

		it("should correctly handle decimal numbers in subtraction", () => {
			expect(subtract(1.0, 0.5)).toBe(0.5)
		})

		it("should correctly handle decimal numbers in multiplication", () => {
			expect(multiply(2.5, 2)).toBe(5)
		})

		it("should correctly handle decimal numbers in division", () => {
			expect(divide(5.5, 2)).toBe(2.75)
		})
	})

	describe("Clear Functionality", () => {
		it("clear() should reset the calculator state", () => {
			calculator.currentValue = "123"
			calculator.operator = "+"
			calculator.previousValue = "456"
			calculator.clear()
			expect(calculator.currentValue).toBe("0")
			expect(calculator.operator).toBe(null)
			expect(calculator.previousValue).toBe(null)
		})
	})
})
