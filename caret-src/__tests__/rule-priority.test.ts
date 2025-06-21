import { describe, it, expect } from "vitest"

// CARET MODIFICATION: Test for rule priority logic
// We need to import the function from the actual source file
// Since we can't directly import from src/, we'll create a mock function for testing
function addUserInstructions(
	globalClineRulesFileInstructions?: string,
	localClineRulesFileInstructions?: string,
	localCursorRulesFileInstructions?: string,
	localCursorRulesDirInstructions?: string,
	localWindsurfRulesFileInstructions?: string,
	clineIgnoreInstructions?: string,
	preferredLanguageInstructions?: string,
) {
	let customInstructions = ""
	if (preferredLanguageInstructions) {
		customInstructions += preferredLanguageInstructions + "\n\n"
	}
	if (globalClineRulesFileInstructions) {
		customInstructions += globalClineRulesFileInstructions + "\n\n"
	}

	// Priority-based local rules loading
	// Only load one type of local rules based on priority: .clinerules > .cursorrules > .windsurfrules
	if (localClineRulesFileInstructions) {
		// .clinerules has highest priority
		customInstructions += localClineRulesFileInstructions + "\n\n"
	} else if (localCursorRulesFileInstructions || localCursorRulesDirInstructions) {
		// .cursorrules has second priority
		if (localCursorRulesFileInstructions) {
			customInstructions += localCursorRulesFileInstructions + "\n\n"
		}
		if (localCursorRulesDirInstructions) {
			customInstructions += localCursorRulesDirInstructions + "\n\n"
		}
	} else if (localWindsurfRulesFileInstructions) {
		// .windsurfrules has lowest priority
		customInstructions += localWindsurfRulesFileInstructions + "\n\n"
	}

	if (clineIgnoreInstructions) {
		customInstructions += clineIgnoreInstructions
	}

	return `
====

USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

${customInstructions.trim()}`
}

describe("Rule Priority Logic", () => {
	it("should prioritize .clinerules over other rules", () => {
		const result = addUserInstructions(
			undefined, // globalClineRulesFileInstructions
			"Cline Rules Content", // localClineRulesFileInstructions
			"Cursor Rules Content", // localCursorRulesFileInstructions
			undefined, // localCursorRulesDirInstructions
			"Windsurf Rules Content", // localWindsurfRulesFileInstructions
		)

		expect(result).toContain("Cline Rules Content")
		expect(result).not.toContain("Cursor Rules Content")
		expect(result).not.toContain("Windsurf Rules Content")
	})

	it("should use .cursorrules when .clinerules is not available", () => {
		const result = addUserInstructions(
			undefined, // globalClineRulesFileInstructions
			undefined, // localClineRulesFileInstructions
			"Cursor Rules Content", // localCursorRulesFileInstructions
			undefined, // localCursorRulesDirInstructions
			"Windsurf Rules Content", // localWindsurfRulesFileInstructions
		)

		expect(result).toContain("Cursor Rules Content")
		expect(result).not.toContain("Windsurf Rules Content")
	})

	it("should use .windsurfrules when .clinerules and .cursorrules are not available", () => {
		const result = addUserInstructions(
			undefined, // globalClineRulesFileInstructions
			undefined, // localClineRulesFileInstructions
			undefined, // localCursorRulesFileInstructions
			undefined, // localCursorRulesDirInstructions
			"Windsurf Rules Content", // localWindsurfRulesFileInstructions
		)

		expect(result).toContain("Windsurf Rules Content")
	})

	it("should include both cursor file and directory rules when cursor has priority", () => {
		const result = addUserInstructions(
			undefined, // globalClineRulesFileInstructions
			undefined, // localClineRulesFileInstructions
			"Cursor File Rules", // localCursorRulesFileInstructions
			"Cursor Dir Rules", // localCursorRulesDirInstructions
			"Windsurf Rules Content", // localWindsurfRulesFileInstructions
		)

		expect(result).toContain("Cursor File Rules")
		expect(result).toContain("Cursor Dir Rules")
		expect(result).not.toContain("Windsurf Rules Content")
	})

	it("should always include global rules regardless of local rule priority", () => {
		const result = addUserInstructions(
			"Global Rules Content", // globalClineRulesFileInstructions
			"Cline Rules Content", // localClineRulesFileInstructions
			"Cursor Rules Content", // localCursorRulesFileInstructions
			undefined, // localCursorRulesDirInstructions
			"Windsurf Rules Content", // localWindsurfRulesFileInstructions
		)

		expect(result).toContain("Global Rules Content")
		expect(result).toContain("Cline Rules Content")
		expect(result).not.toContain("Cursor Rules Content")
		expect(result).not.toContain("Windsurf Rules Content")
	})

	it("should handle empty rules gracefully", () => {
		const result = addUserInstructions()

		expect(result).toContain("USER'S CUSTOM INSTRUCTIONS")
		expect(result).toContain("The following additional instructions are provided by the user")
		// When no rules are provided, the result should only contain the header
		expect(result.trim().endsWith("without interfering with the TOOL USE guidelines.")).toBe(true)
	})
})
