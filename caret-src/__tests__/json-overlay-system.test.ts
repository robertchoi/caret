// CARET MODIFICATION: TDD tests for JSON Overlay System (003-03)
// Purpose: RED phase tests for prompt template loading and overlay functionality

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { promises as fs } from "fs"
import * as path from "path"
import { JsonTemplateLoader } from "../core/prompts/JsonTemplateLoader"
import { PromptOverlayEngine } from "../core/prompts/PromptOverlayEngine"
import { PromptTemplate, OverlayResult } from "../core/prompts/types"

// Mock file system
vi.mock("fs", () => ({
	promises: {
		readFile: vi.fn(),
		access: vi.fn(),
		mkdir: vi.fn(),
	},
}))

// Mock CaretLogger
vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		success: vi.fn(),
	},
}))

describe("JSON Overlay System (003-03) - TDD Implementation", () => {
	describe("JsonTemplateLoader - RED Phase", () => {
		let loader: JsonTemplateLoader
		const mockExtensionPath = "/mock/extension/path"

		beforeEach(() => {
			vi.clearAllMocks()
			// This will fail initially - RED phase
			loader = new JsonTemplateLoader(mockExtensionPath)
		})

		afterEach(() => {
			vi.clearAllMocks()
		})

		it("should load valid JSON template successfully", async () => {
			// RED: This test will fail because JsonTemplateLoader doesn't exist yet
			const mockTemplate: PromptTemplate = {
				metadata: {
					name: "agent-foundation",
					version: "1.0.0",
					description: "Basic foundation template",
					compatibleWith: ["cline-*"],
				},
				add: {
					sections: [
						{
							id: "test_section",
							title: "Test Section",
							content: "Test content",
							position: "after_objective",
						},
					],
				},
				modify: {
					personality: "collaborative assistant",
				},
			}

			// Mock file system calls - fix for vitest
			vi.mocked(fs.access).mockResolvedValue()
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockTemplate))

			const result = await loader.loadTemplate("agent-foundation")

			expect(result).toEqual(mockTemplate)
			expect(fs.readFile).toHaveBeenCalledWith(
				path.join(mockExtensionPath, "caret-src", "core", "prompts", "sections", "agent-foundation.json"),
				"utf-8",
			)
		})

		it("should cache loaded templates", async () => {
			// RED: Will fail - no caching mechanism yet
			const mockTemplate: PromptTemplate = {
				metadata: {
					name: "test-template",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {},
				modify: {},
			}

			vi.mocked(fs.access).mockResolvedValue()
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockTemplate))

			// First load
			await loader.loadTemplate("test-template")
			// Second load should use cache
			await loader.loadTemplate("test-template")

			// Should only read file once
			expect(fs.readFile).toHaveBeenCalledTimes(1)
		})

		it("should validate template structure", async () => {
			// RED: No validation exists yet
			const invalidTemplate = {
				// Missing metadata
				add: {},
				modify: {},
			}

			vi.mocked(fs.access).mockResolvedValue()
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidTemplate))

			// CARET MODIFICATION: Update expected error message to match new specific error from adaptLegacyFormat
			await expect(loader.loadTemplate("invalid-template")).rejects.toThrow(
				"Failed to load template invalid-template: Error: Unrecognized legacy format for template: invalid-template."
			)
		})

		it("should handle file not found error", async () => {
			// RED: No error handling yet
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"))

			await expect(loader.loadTemplate("nonexistent")).rejects.toThrow("Failed to load template")
		})

		it("should prevent remove operations in this phase", async () => {
			// RED: No validation for remove operations
			const templateWithRemove = {
				metadata: {
					name: "test",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {},
				modify: {},
				remove: ["some_section"], // Should be rejected
			}

			vi.mocked(fs.access).mockResolvedValue()
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(templateWithRemove))

			await expect(loader.loadTemplate("template-with-remove")).rejects.toThrow(
				"Remove operations are not allowed in this phase",
			)
		})
	})

	describe("PromptOverlayEngine - RED Phase", () => {
		let engine: PromptOverlayEngine
		const mockOriginalPrompt = `You are Cline, a highly skilled software engineer.

====

TOOL USE

You have access to tools...

## execute_command
Description: Execute CLI commands

## read_file  
Description: Read file contents

====

OBJECTIVE

You accomplish tasks iteratively.`

		beforeEach(() => {
			// This will fail initially - RED phase
			engine = new PromptOverlayEngine()
		})

		afterEach(() => {
			vi.clearAllMocks()
		})

		it("should apply simple section addition", async () => {
			// RED: PromptOverlayEngine doesn't exist yet
			const template: PromptTemplate = {
				metadata: {
					name: "test",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {
					sections: [
						{
							id: "collaborative_principles",
							title: "COLLABORATIVE PRINCIPLES",
							content: "# COLLABORATIVE PRINCIPLES\n\n- Think before acting",
							position: "after_objective",
						},
					],
				},
				modify: {},
			}

			const result: OverlayResult = await engine.applyOverlay(mockOriginalPrompt, template)

			expect(result.success).toBe(true)
			expect(result.prompt).toContain("COLLABORATIVE PRINCIPLES")
			expect(result.prompt).toContain("Think before acting")
			expect(result.appliedChanges).toContain("Added section: collaborative_principles")
		})

		it("should modify personality section", async () => {
			// RED: No personality modification logic yet
			const template: PromptTemplate = {
				metadata: {
					name: "test",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {},
				modify: {
					personality: "You are a collaborative coding assistant",
				},
			}

			const result: OverlayResult = await engine.applyOverlay(mockOriginalPrompt, template)

			expect(result.success).toBe(true)
			expect(result.prompt).toContain("collaborative coding assistant")
			expect(result.prompt).not.toContain("You are Cline, a highly skilled software engineer")
			expect(result.appliedChanges).toContain("Modified personality")
		})

		it("should add behavior guidelines", async () => {
			// RED: No behavior addition logic yet
			const template: PromptTemplate = {
				metadata: {
					name: "test",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {
					behaviors: ["Analyze the full context before taking action", "Ask for clarification when uncertain"],
				},
				modify: {},
			}

			const result: OverlayResult = await engine.applyOverlay(mockOriginalPrompt, template)

			expect(result.success).toBe(true)
			expect(result.prompt).toContain("BEHAVIORAL GUIDELINES")
			expect(result.prompt).toContain("Analyze the full context")
			expect(result.prompt).toContain("Ask for clarification")
			expect(result.appliedChanges).toContain("Added 2 behavior guidelines")
		})

		it("should preserve all Cline tools and functionality", async () => {
			// RED: No preservation validation yet
			const template: PromptTemplate = {
				metadata: {
					name: "test",
					version: "1.0.0",
					description: "Test",
					compatibleWith: ["cline-*"],
				},
				add: {
					sections: [
						{
							id: "test_section",
							title: "TEST SECTION",
							content: "Test content",
							position: "after_tools",
						},
					],
				},
				modify: {},
			}

			const result: OverlayResult = await engine.applyOverlay(mockOriginalPrompt, template)

			expect(result.success).toBe(true)
			// All original tools should be preserved
			expect(result.prompt).toContain("## execute_command")
			expect(result.prompt).toContain("## read_file")
			expect(result.prompt).toContain("TOOL USE")
			expect(result.prompt).toContain("OBJECTIVE")
		})

		it("should fallback to original prompt on failure", async () => {
			// RED: No fallback mechanism yet
			const malformedTemplate = {} as PromptTemplate // Invalid template

			const result: OverlayResult = await engine.applyOverlay(mockOriginalPrompt, malformedTemplate)

			expect(result.success).toBe(false)
			expect(result.prompt).toBe(mockOriginalPrompt) // Should return original
			expect(result.warnings.length).toBeGreaterThan(0)
		})
	})

	describe("Integration Tests - RED Phase", () => {
		it("should integrate JsonTemplateLoader with PromptOverlayEngine", async () => {
			// RED: Integration doesn't exist yet
			const mockExtensionPath = "/mock/path"
			const loader = new JsonTemplateLoader(mockExtensionPath)
			const engine = new PromptOverlayEngine()

			const mockTemplate: PromptTemplate = {
				metadata: {
					name: "agent-foundation",
					version: "1.0.0",
					description: "Agent foundation template",
					compatibleWith: ["cline-*"],
				},
				add: {
					sections: [
						{
							id: "collaborative_principles",
							title: "COLLABORATIVE PRINCIPLES",
							content: "# COLLABORATIVE PRINCIPLES\n\n- Think before acting\n- Ask when uncertain",
							position: "after_objective",
						},
					],
					behaviors: ["Analyze the full context before taking action", "Explain reasoning for significant decisions"],
				},
				modify: {
					personality: "You are a collaborative coding assistant",
				},
			}

			vi.mocked(fs.access).mockResolvedValue()
			vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockTemplate))

			const template = await loader.loadTemplate("agent-foundation")
			const originalPrompt =
				"You are Cline, a highly skilled software engineer.\n\n====\n\nOBJECTIVE\n\nYou accomplish tasks."

			const result = await engine.applyOverlay(originalPrompt, template)

			expect(result.success).toBe(true)
			expect(result.prompt).toContain("collaborative coding assistant")
			expect(result.prompt).toContain("COLLABORATIVE PRINCIPLES")
			expect(result.prompt).toContain("BEHAVIORAL GUIDELINES")
			expect(result.appliedChanges.length).toBeGreaterThan(0)
		})
	})
})
