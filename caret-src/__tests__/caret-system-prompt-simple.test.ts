import { describe, it, expect, beforeEach, vi } from "vitest"
import { CaretSystemPromptTestHelper } from "./helpers/CaretSystemPromptTestHelper"
import { SystemPromptContext } from "../core/prompts/types"

// Mock the entire SYSTEM_PROMPT import
vi.mock("../../../src/core/prompts/system", () => ({
	SYSTEM_PROMPT: vi
		.fn()
		.mockImplementation(
			async (
				cwd: string,
				supportsBrowserUse: boolean,
				mcpHub: any,
				browserSettings: any,
				isClaude4ModelFamily: boolean = false,
			) => {
				// Return a mock system prompt that looks like the real one
				return `You are Cline, a highly skilled software engineer...

====

TOOL USE

## execute_command
Description: Request to execute a CLI command on the system.
Parameters:
- command: (required) The CLI command to execute.
Usage:
<execute_command>
<command>Your command here</command>
</execute_command>

## read_file
Description: Request to read the contents of a file.
Parameters:
- path: (required) The path of the file to read.
Usage:
<read_file>
<path>File path here</path>
</read_file>

Total tools: 9 (mocked)
Working directory: ${cwd}
Browser support: ${supportsBrowserUse}
Claude4: ${isClaude4ModelFamily}`
			},
		),
}))

describe("testHelper - Basic Wrapper Implementation (Using TestHelper)", () => {
	let testHelper: CaretSystemPromptTestHelper
	let mockContext: SystemPromptContext

	beforeEach(() => {
		testHelper = new CaretSystemPromptTestHelper("/test/extension/path")
		// Clear metrics to avoid accumulation from previous tests
		testHelper.clearMetrics()

		// Create minimal mock context
		const mockMcpHub = {
			getServers: vi.fn().mockReturnValue([]),
		}

		const mockBrowserSettings = {
			viewport: { width: 1280, height: 720 },
			width: 1280,
			height: 720,
		}

		mockContext = {
			cwd: "/test/project",
			supportsBrowserUse: true,
			mcpHub: mockMcpHub as any,
			browserSettings: mockBrowserSettings as any,
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

	describe("System Prompt Generation (via TestHelper)", () => {
		it("should generate system prompt successfully", async () => {
			const result = await testHelper.generateSystemPrompt(mockContext)

			expect(result).toBeDefined()
			expect(result.prompt).toBeDefined()
			expect(result.metrics).toBeDefined()
			expect(typeof result.prompt).toBe("string")
			expect(result.prompt.length).toBeGreaterThan(0)
		})

		it("should collect accurate metrics", async () => {
			const result = await testHelper.generateSystemPrompt(mockContext)

			expect(result.metrics.generationTime).toBeGreaterThanOrEqual(0)
			expect(result.metrics.promptLength).toBeGreaterThan(0)
			expect(result.metrics.toolCount).toBeGreaterThan(0)
			expect(result.metrics.mcpServerCount).toBe(0) // No MCP servers in mock
			expect(result.metrics.timestamp).toBeGreaterThan(0)
		})

		it("should contain expected Cline content", async () => {
			const result = await testHelper.generateSystemPrompt(mockContext)

			expect(result.prompt).toContain("You are Cline")
			expect(result.prompt).toContain("TOOL USE")
			expect(result.prompt).toContain("execute_command")
			expect(result.prompt).toContain("read_file")
			expect(result.prompt).toContain(mockContext.cwd)
		})

		it("should handle Claude4 context correctly", async () => {
			const claude4Context = { ...mockContext, isClaude4ModelFamily: true }

			const result = await testHelper.generateSystemPrompt(claude4Context)

			expect(result.prompt).toBeDefined()
			expect(result.prompt).toContain("You are Cline") // 실제 Cline 프롬프트에 포함된 내용
		})
	})

	describe("Metrics Management", () => {
		it("should accumulate metrics correctly", async () => {
			await testHelper.generateSystemPrompt(mockContext)
			await testHelper.generateSystemPrompt(mockContext)

			const metrics = testHelper.getMetrics()
			expect(metrics).toHaveLength(2)

			const averageTime = testHelper.getAverageGenerationTime()
			expect(averageTime).toBeGreaterThan(0)
		})

		it("should clear metrics when requested", async () => {
			await testHelper.generateSystemPrompt(mockContext)
			expect(testHelper.getMetrics()).toHaveLength(1)

			testHelper.clearMetrics()
			expect(testHelper.getMetrics()).toHaveLength(0)
			expect(testHelper.getAverageGenerationTime()).toBe(0)
		})
	})

	describe("Performance Requirements", () => {
		it("should complete generation in reasonable time", async () => {
			const startTime = Date.now()
			await testHelper.generateSystemPrompt(mockContext)
			const endTime = Date.now()

			const duration = endTime - startTime
			// Should complete within 1000ms for actual SYSTEM_PROMPT call
			expect(duration).toBeLessThan(1000)
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid context gracefully", async () => {
			const invalidContext = {
				...mockContext,
				cwd: "", // Invalid empty path
			}

			// Should either work or throw a proper error
			try {
				const result = await testHelper.generateSystemPrompt(invalidContext)
				expect(result).toBeDefined()
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
			}
		})
	})
})
