import { describe, it, expect, vi } from "vitest"

// Mock testHelper to avoid extensionPath issues
vi.mock("../core/prompts/testHelper", () => ({
	testHelper: {
		getInstance: vi.fn(() => ({
			generateFromJsonSections: vi.fn(
				async () => "You are Cline, an AI assistant powered by Claude. (Generated from JSON sections)",
			),
		})),
	},
}))

// Mock the original Cline system module for fallback
vi.mock("../../src/core/prompts/system", () => ({
	SYSTEM_PROMPT: vi.fn(async (cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily) => {
		return "You are Cline, an AI assistant powered by Claude. (Original Cline fallback)"
	}),
	addUserInstructions: vi.fn(
		(
			globalClineRulesFileInstructions,
			localClineRulesFileInstructions,
			localCaretRulesFileInstructions,
			localCursorRulesFileInstructions,
			localCursorRulesDirInstructions,
			localWindsurfRulesFileInstructions,
			clineIgnoreInstructions,
			preferredLanguageInstructions,
		) => {
			return "User instructions added"
		},
	),
}))

import { SYSTEM_PROMPT, addUserInstructions } from "../core/prompts/system"

describe("caret-src/core/prompts/system.ts", () => {
	describe("SYSTEM_PROMPT export", () => {
		it("should export SYSTEM_PROMPT function from Cline", () => {
			expect(SYSTEM_PROMPT).toBeDefined()
			expect(typeof SYSTEM_PROMPT).toBe("function")
		})

		it("should have proper system prompt content when called", async () => {
			const result = await SYSTEM_PROMPT("/test/cwd", false, { getServers: () => [] }, {}, false)
			expect(result).toContain("You are Cline")
			expect(result).toContain("Claude")
		})
	})

	describe("addUserInstructions export", () => {
		it("should export addUserInstructions function from Cline", () => {
			expect(addUserInstructions).toBeDefined()
			expect(typeof addUserInstructions).toBe("function")
		})

		it("should add user instructions to system prompt", () => {
			const result = addUserInstructions("global", "local", "caret", "cursor", "cursorDir", "windsurf", "ignore", "lang")

			expect(result).toBeDefined()
			expect(typeof result).toBe("string")
			expect(result).toContain("User instructions added")
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
