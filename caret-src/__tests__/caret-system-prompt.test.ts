import { describe, it, expect, beforeEach, vi } from "vitest"
import { CaretSystemPrompt } from "../core/prompts/CaretSystemPrompt"
import { SystemPromptContext } from "../core/prompts/types"
import { ClineFeatureValidator } from "../core/verification/ClineFeatureValidator"
import { SYSTEM_PROMPT } from "@src/core/prompts/system"
import { McpHub } from "@src/services/mcp/McpHub"
import { BrowserSettings } from "@src/shared/BrowserSettings"

describe("CaretSystemPrompt - Wrapper Implementation", () => {
	let caretSystemPrompt: CaretSystemPrompt
	let validator: ClineFeatureValidator
	let mockContext: SystemPromptContext

	beforeEach(() => {
		caretSystemPrompt = new CaretSystemPrompt()
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
			expect(caretSystemPrompt).toBeDefined()
			expect(caretSystemPrompt).toBeInstanceOf(CaretSystemPrompt)
		})

		it("should initialize with empty metrics", () => {
			const metrics = caretSystemPrompt.getMetrics()
			expect(metrics).toEqual([])
		})

		it("should have zero average generation time initially", () => {
			const averageTime = caretSystemPrompt.getAverageGenerationTime()
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
			const caretResult = await caretSystemPrompt.generateSystemPrompt(mockContext)

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

			const caretResult = await caretSystemPrompt.generateSystemPrompt(mockContext)

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
			const result = await caretSystemPrompt.generateSystemPrompt(mockContext)

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

			const caretResult = await caretSystemPrompt.generateSystemPrompt(claude4Context)

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
				await caretSystemPrompt.generateSystemPrompt(mockContext)
				caretTimes.push(Date.now() - start)
			}

			const originalAvg = originalTimes.reduce((a, b) => a + b) / iterations
			const caretAvg = caretTimes.reduce((a, b) => a + b) / iterations
			const overhead = originalAvg > 0 ? (caretAvg - originalAvg) / originalAvg : 0

			// Allow 10% overhead for wrapper logic
			expect(overhead).toBeLessThan(0.1)
		})

		it("should update metrics correctly", async () => {
			await caretSystemPrompt.generateSystemPrompt(mockContext)
			await caretSystemPrompt.generateSystemPrompt(mockContext)

			const metrics = caretSystemPrompt.getMetrics()
			expect(metrics).toHaveLength(2)

			const averageTime = caretSystemPrompt.getAverageGenerationTime()
			expect(averageTime).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid context gracefully", async () => {
			const invalidContext = {
				...mockContext,
				cwd: "", // Invalid empty path
			}

			await expect(caretSystemPrompt.generateSystemPrompt(invalidContext)).rejects.toThrow()
		})
	})
})
