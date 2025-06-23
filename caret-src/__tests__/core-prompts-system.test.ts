import { describe, it, expect, vi } from "vitest"

// Mock the Cline system module
vi.mock("../../src/core/prompts/system", () => ({
	SYSTEM_PROMPT: "You are Cline, an AI assistant powered by Claude.",
	addUserInstructions: vi.fn((basePrompt: string, userInstructions?: string) => {
		if (!userInstructions) return basePrompt
		return `${basePrompt}\n\nUser Instructions:\n${userInstructions}`
	}),
}))

import { SYSTEM_PROMPT, addUserInstructions } from "../core/prompts/system"

describe("caret-src/core/prompts/system.ts", () => {
	describe("SYSTEM_PROMPT export", () => {
		it("should export SYSTEM_PROMPT from Cline", () => {
			expect(SYSTEM_PROMPT).toBeDefined()
			expect(typeof SYSTEM_PROMPT).toBe("string")
			expect(SYSTEM_PROMPT.length).toBeGreaterThan(0)
		})

		it("should have proper system prompt content", () => {
			expect(SYSTEM_PROMPT).toContain("You are Cline")
			expect(SYSTEM_PROMPT).toContain("Claude")
		})
	})

	describe("addUserInstructions export", () => {
		it("should export addUserInstructions function from Cline", () => {
			expect(addUserInstructions).toBeDefined()
			expect(typeof addUserInstructions).toBe("function")
		})

		it("should add user instructions to system prompt", () => {
			const basePrompt = "Base prompt"
			const userInstructions = "User specific instructions"

			const result = addUserInstructions(basePrompt, userInstructions)

			expect(result).toBeDefined()
			expect(typeof result).toBe("string")
			expect(result).toContain(basePrompt)
			expect(result).toContain(userInstructions)
		})

		it("should handle empty user instructions", () => {
			const basePrompt = "Base prompt"
			const userInstructions = ""

			const result = addUserInstructions(basePrompt, userInstructions)

			expect(result).toBeDefined()
			expect(typeof result).toBe("string")
		})

		it("should handle undefined user instructions", () => {
			const basePrompt = "Base prompt"
			const userInstructions = undefined

			const result = addUserInstructions(basePrompt, userInstructions)

			expect(result).toBeDefined()
			expect(typeof result).toBe("string")
		})
	})

	describe("module exports integrity", () => {
		it("should maintain compatibility with Cline system prompts", () => {
			// Verify that our re-exports maintain the same interface as Cline
			expect(SYSTEM_PROMPT).toBeDefined()
			expect(addUserInstructions).toBeDefined()

			// Test that the function signature is preserved
			const testResult = addUserInstructions("test", "instructions")
			expect(typeof testResult).toBe("string")
		})

		it("should not modify exported values", async () => {
			// Ensure that re-exporting doesn't alter the original values
			const originalPrompt = SYSTEM_PROMPT
			const originalFunction = addUserInstructions

			// Import again to verify consistency
			const { SYSTEM_PROMPT: reimportedPrompt, addUserInstructions: reimportedFunction } = await import(
				"../core/prompts/system"
			)

			expect(reimportedPrompt).toBe(originalPrompt)
			expect(reimportedFunction).toBe(originalFunction)
		})
	})
})
