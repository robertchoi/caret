import { describe, it, expect, beforeEach, vi } from "vitest"
import { CaretSystemPromptTestHelper } from "./helpers/CaretSystemPromptTestHelper"
import { SystemPromptContext } from "../core/prompts/types"
import { ClineFeatureValidator } from "../core/verification/ClineFeatureValidator"
import { SYSTEM_PROMPT } from "@src/core/prompts/system"
import { McpHub } from "@src/services/mcp/McpHub"
import { BrowserSettings } from "@src/shared/BrowserSettings"

describe("testHelper - Wrapper Implementation", () => {
	let testHelper: CaretSystemPromptTestHelper
	let validator: ClineFeatureValidator
	let mockContext: SystemPromptContext

	beforeEach(() => {
		testHelper = new CaretSystemPromptTestHelper("/test/extension/path")
		validator = new ClineFeatureValidator()

		// Mock context setup
		const mockMcpHub: Partial<McpHub> = {
			getServers: vi.fn().mockReturnValue([]),
			// Add minimal MCP hub methods as needed
		}

		const mockBrowserSettings: BrowserSettings = {
			viewport: { width: 1280, height: 720 },
			// Add other required browser settings
		} as BrowserSettings

		mockContext = {
			cwd: "/test/project",
			supportsBrowserUse: true,
			mcpHub: mockMcpHub as McpHub,
			browserSettings: mockBrowserSettings,
			isClaude4ModelFamily: false,
		}
	})

	describe("Constructor and Initialization", () => {
		it("should create instance without errors", () => {
			expect(testHelper).toBeDefined()
			expect(testHelper).toBeInstanceOf(CaretSystemPromptTestHelper)
		})

		it("should initialize with empty metrics", () => {
			const metrics = testHelper.getMetrics()
			expect(metrics).toEqual([])
		})

		it("should have zero average generation time initially", () => {
			const averageTime = testHelper.getAverageGenerationTime()
			expect(averageTime).toBe(0)
		})
	})

	describe("System Prompt Generation", () => {
		it("should generate identical prompt to original Cline", async () => {
			// Generate original Cline prompt
			const originalPrompt = await SYSTEM_PROMPT(
				mockContext.cwd,
				mockContext.supportsBrowserUse,
				mockContext.mcpHub,
				mockContext.browserSettings,
				mockContext.isClaude4ModelFamily,
			)

			// Generate Caret wrapper prompt
			const caretResult = await testHelper.generateSystemPrompt(mockContext)

			// Must be completely identical
			expect(caretResult.prompt).toBe(originalPrompt)
		})

		it("should preserve all Cline features", async () => {
			const originalPrompt = await SYSTEM_PROMPT(
				mockContext.cwd,
				mockContext.supportsBrowserUse,
				mockContext.mcpHub,
				mockContext.browserSettings,
				mockContext.isClaude4ModelFamily,
			)

			const caretResult = await testHelper.generateSystemPrompt(mockContext)

			// Use 003-01 validation system
			const validationResult = await validator.validateAllFeatures(originalPrompt, caretResult.prompt, {
				strictMode: true,
				variant: "default",
			})

			expect(validationResult.allToolsPreserved).toBe(true)
			expect(validationResult.missingTools).toEqual([])
			expect(validationResult.modifiedTools).toEqual([])
			expect(validationResult.mcpIntegrationIntact).toBe(true)
		})

		it("should collect accurate metrics", async () => {
			const result = await testHelper.generateSystemPrompt(mockContext)

			expect(result.metrics).toBeDefined()
			expect(result.metrics.generationTime).toBeGreaterThanOrEqual(0)
			expect(result.metrics.promptLength).toBeGreaterThan(0)
			expect(result.metrics.toolCount).toBeGreaterThan(0)
			expect(result.metrics.mcpServerCount).toBeGreaterThanOrEqual(0)
			expect(result.metrics.timestamp).toBeGreaterThan(0)
		})
	})

	describe("Claude4 Model Family Support", () => {
		it("should handle Claude4 standard correctly", async () => {
			const claude4Context = { ...mockContext, isClaude4ModelFamily: true }

			const originalPrompt = await SYSTEM_PROMPT(
				claude4Context.cwd,
				claude4Context.supportsBrowserUse,
				claude4Context.mcpHub,
				claude4Context.browserSettings,
				true,
			)

			const caretResult = await testHelper.generateSystemPrompt(claude4Context)

			expect(caretResult.prompt).toBe(originalPrompt)
			// Should not contain default Cline introduction
			expect(caretResult.prompt).not.toContain("You are Cline, a highly skilled software engineer")
		})
	})

	describe("Performance Requirements", () => {
		it("should have minimal performance overhead", async () => {
			const iterations = 5
			const originalTimes: number[] = []
			const caretTimes: number[] = []

			// Measure original performance
			for (let i = 0; i < iterations; i++) {
				const start = Date.now()
				await SYSTEM_PROMPT(
					mockContext.cwd,
					mockContext.supportsBrowserUse,
					mockContext.mcpHub,
					mockContext.browserSettings,
					mockContext.isClaude4ModelFamily,
				)
				originalTimes.push(Date.now() - start)
			}

			// Measure wrapper performance
			for (let i = 0; i < iterations; i++) {
				const start = Date.now()
				await testHelper.generateSystemPrompt(mockContext)
				caretTimes.push(Date.now() - start)
			}

			const originalAvg = originalTimes.reduce((a, b) => a + b) / iterations
			const caretAvg = caretTimes.reduce((a, b) => a + b) / iterations
			const overhead = originalAvg > 0 ? (caretAvg - originalAvg) / originalAvg : 0

			// Allow 10% overhead for wrapper logic
			expect(overhead).toBeLessThan(0.1)
		})

		it("should update metrics correctly", async () => {
			await testHelper.generateSystemPrompt(mockContext)
			await testHelper.generateSystemPrompt(mockContext)

			const metrics = testHelper.getMetrics()
			expect(metrics).toHaveLength(2)

			const averageTime = testHelper.getAverageGenerationTime()
			expect(averageTime).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid context gracefully", async () => {
			const invalidContext = {
				...mockContext,
				cwd: "", // Invalid empty path
			}

			await expect(testHelper.generateSystemPrompt(invalidContext)).rejects.toThrow()
		})
	})
})
