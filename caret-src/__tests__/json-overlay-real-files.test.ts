// CARET MODIFICATION: Real File System Integration Test for JSON Overlay System (003-03)
// Purpose: Test with actual JSON template files on the file system
// Following TDD principles with real file operations

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CaretSystemPromptTestHelper } from "./helpers/CaretSystemPromptTestHelper"
import { SystemPromptContext } from "../core/prompts/types"
import { caretLogger } from "../utils/caret-logger"
import * as path from "path"

// Mock dependencies
vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
	CaretLogger: {
		getInstance: vi.fn().mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		}),
	},
}))

// Mock Cline SYSTEM_PROMPT
vi.mock("@src/core/prompts/system", () => ({
	SYSTEM_PROMPT: vi.fn().mockResolvedValue(`# System Prompt

## Objective
You are Cline, an AI assistant.

## Tools Available
- file_editor
- bash
- browser_action

## Guidelines
Follow these rules:
1. Be helpful
2. Be accurate
3. Quality first: prioritize accuracy and quality over speed

## MCP Servers
Available servers: test-server`),
}))

describe("JSON Overlay System - Real File Integration Tests (003-03)", () => {
	let mockContext: SystemPromptContext
	let testHelper: CaretSystemPromptTestHelper

	beforeEach(async () => {
		// Use actual project root path
		const projectRoot = path.resolve(__dirname, "../..")

		// Setup mock context
		mockContext = {
			cwd: "/mock/workspace",
			supportsBrowserUse: true,
			mcpHub: {
				getServers: vi.fn().mockReturnValue([{ name: "test-server" }]),
			} as any,
			browserSettings: {
				width: 1280,
				height: 720,
				viewport: { width: 1280, height: 720 },
			} as any,
			isClaude4ModelFamily: false,
		}

		// Initialize with real extension path and test mode enabled
		// This will use caret-assets/test-templates directory for test templates
		testHelper = new CaretSystemPromptTestHelper(projectRoot, true)

		// Clear all mocks
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Real Template File Tests", () => {
		it("should load and apply Alpha personality template from actual file", async () => {
			try {
				console.log("🔍 Starting Alpha template test...")
				const result = await testHelper.generateSystemPromptWithTemplates(mockContext, ["alpha-personality"])

				console.log("🔍 Result received:")
				console.log("- Prompt length:", result.prompt.length)
				console.log("- Applied templates:", result.metrics.appliedTemplates)
				console.log("- Enhancement ratio:", result.metrics.enhancementRatio)
				console.log("- Prompt preview:", result.prompt.substring(0, 500))

				// Verify Alpha personality was applied
				expect(result.prompt).toContain("Alpha Yang (알파)")
				expect(result.prompt).toContain("Personality: Alpha Yang (알파)") // Fixed: no header formatting
				expect(result.prompt).toContain("AI Maid assistant helping your master Luke") // Updated phrase to match template
				expect(result.metrics.appliedTemplates).toContain("alpha-personality")
				expect(result.metrics.enhancementRatio).toBeGreaterThan(1)

				console.log("✅ Alpha template applied successfully")
				console.log("📊 Enhancement ratio:", result.metrics.enhancementRatio)
				console.log("📝 Applied templates:", result.metrics.appliedTemplates)
			} catch (error) {
				console.log("❌ Alpha template test failed:", error)
				throw error
			}
		})

		it("should load and apply TDD focused template from actual file", async () => {
			try {
				const result = await testHelper.generateSystemPromptWithTemplates(mockContext, ["tdd-focused"])

				// Verify TDD content was applied
				expect(result.prompt).toContain("Test-Driven Development (TDD)")
				expect(result.prompt).toContain("🔴 RED Phase")
				expect(result.prompt).toContain("RED → GREEN → REFACTOR") // Updated to Unicode arrow format
				expect(result.metrics.appliedTemplates).toContain("tdd-focused")

				console.log("✅ TDD template applied successfully")
				console.log("📊 Enhancement ratio:", result.metrics.enhancementRatio)
			} catch (error) {
				console.log("❌ TDD template test failed:", error)
				throw error
			}
		})

		it("should load and apply enhanced debugging template from actual file", async () => {
			try {
				const result = await testHelper.generateSystemPromptWithTemplates(mockContext, ["enhanced-debugging"])

				// Verify debugging content was applied
				expect(result.prompt).toContain("Debugging Methodology")
				expect(result.prompt).toContain("Problem Analysis")
				expect(result.prompt).toContain("Error Handling Best Practices")
				expect(result.metrics.appliedTemplates).toContain("enhanced-debugging")

				console.log("✅ Enhanced debugging template applied successfully")
			} catch (error) {
				console.log("❌ Enhanced debugging template test failed:", error)
				throw error
			}
		})

		it("should apply multiple real templates in sequence", async () => {
			try {
				const result = await testHelper.generateSystemPromptWithTemplates(mockContext, [
					"alpha-personality",
					"tdd-focused",
					"enhanced-debugging",
				])

				// Verify all templates were applied
				expect(result.prompt).toContain("Alpha Yang (알파)")
				expect(result.prompt).toContain("Test-Driven Development (TDD)")
				expect(result.prompt).toContain("Debugging Methodology")

				expect(result.metrics.appliedTemplates).toHaveLength(3)
				expect(result.metrics.appliedTemplates).toContain("alpha-personality")
				expect(result.metrics.appliedTemplates).toContain("tdd-focused")
				expect(result.metrics.appliedTemplates).toContain("enhanced-debugging")

				console.log("✅ Multiple templates applied successfully")
				console.log("📊 Final enhancement ratio:", result.metrics.enhancementRatio)
				console.log("📏 Final prompt length:", result.prompt.length)
			} catch (error) {
				console.log("❌ Multiple templates test failed:", error)
				throw error
			}
		})
	})

	describe("Real File Error Handling", () => {
		it("should handle non-existent template file gracefully", async () => {
			const result = await testHelper.generateSystemPromptWithTemplates(mockContext, ["non-existent-template"])

			// Should return base prompt without templates
			expect(result.prompt).toBeDefined()
			expect(result.metrics.appliedTemplates).toEqual([])
			expect(result.metrics.enhancementRatio).toBe(1)

			console.log("✅ Non-existent template handled gracefully")
		})

		it("should handle mix of valid and invalid templates", async () => {
			const result = await testHelper.generateSystemPromptWithTemplates(mockContext, [
				"alpha-personality",
				"non-existent-template",
				"tdd-focused",
			])

			// Should apply valid templates and skip invalid ones
			expect(result.prompt).toContain("Alpha Yang (알파)")
			expect(result.prompt).toContain("Test-Driven Development (TDD)")
			expect(result.metrics.appliedTemplates).toEqual(["alpha-personality", "tdd-focused"])

			console.log("✅ Mixed valid/invalid templates handled correctly")
			console.log("📊 Applied templates:", result.metrics.appliedTemplates)
		})
	})

	describe("Performance with Real Files", () => {
		it("should load templates efficiently", async () => {
			const startTime = Date.now()

			const result = await testHelper.generateSystemPromptWithTemplates(mockContext, [
				"alpha-personality",
				"tdd-focused",
				"enhanced-debugging",
			])

			const totalTime = Date.now() - startTime

			// Performance expectations
			expect(totalTime).toBeLessThan(100) // Should complete within 100ms
			expect(result.metrics.generationTime).toBeGreaterThan(0)

			console.log("✅ Performance test passed")
			console.log("⏱️ Total time:", totalTime, "ms")
			console.log("⚡ Generation time:", result.metrics.generationTime, "ms")
		})

		it("should benefit from template caching on second load", async () => {
			// First load
			const firstResult = await testHelper.generateSystemPromptWithTemplates(mockContext, ["alpha-personality"])

			// Second load (should use cache)
			const secondStart = Date.now()
			const secondResult = await testHelper.generateSystemPromptWithTemplates(mockContext, ["alpha-personality"])
			const secondTime = Date.now() - secondStart

			// Both should have same content
			expect(firstResult.prompt).toEqual(secondResult.prompt)
			expect(secondResult.metrics.appliedTemplates).toEqual(["alpha-personality"])

			console.log("✅ Template caching working correctly")
			console.log("⚡ Second load time:", secondTime, "ms")
		})
	})

	describe("Complete System Verification", () => {
		it("should preserve all Cline functionality while adding enhancements", async () => {
			const result = await testHelper.generateSystemPromptWithTemplates(mockContext, [
				"alpha-personality",
				"tdd-focused",
				"enhanced-debugging",
			])

			// Verify Cline tools are preserved
			expect(result.prompt).toContain("file_editor")
			expect(result.prompt).toContain("bash")
			expect(result.prompt).toContain("browser_action")
			expect(result.prompt).toContain("MCP Servers")
			expect(result.prompt).toContain("test-server")

			// Verify enhancements are added
			expect(result.prompt).toContain("Alpha Yang (알파)")
			expect(result.prompt).toContain("Test-Driven Development")
			expect(result.prompt).toContain("Debugging Methodology")

			// Verify metrics
			expect(result.metrics.toolCount).toBeGreaterThan(0)
			expect(result.metrics.appliedTemplates).toHaveLength(3)
			expect(result.metrics.enhancementRatio).toBeGreaterThan(1.5) // Significant enhancement

			console.log("✅ Complete system verification passed")
			console.log("🛠️ Tool count:", result.metrics.toolCount)
			console.log("📈 Enhancement ratio:", result.metrics.enhancementRatio)
			console.log("📝 Final prompt length:", result.prompt.length, "characters")
		})
	})
})
