import { describe, it, expect, beforeEach, vi } from "vitest"
import { CaretSystemPrompt } from "../core/prompts/CaretSystemPrompt"
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

describe("CaretSystemPrompt - Basic Wrapper Implementation", () => {
	let caretSystemPrompt: CaretSystemPrompt
	let mockContext: SystemPromptContext

	beforeEach(() => {
		caretSystemPrompt = new CaretSystemPrompt()

		// Create minimal mock context
		const mockMcpHub = {
			getServers: vi.fn().mockReturnValue([]),
		}

		const mockBrowserSettings = {
			viewport: { width: 1280, height: 720 },
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
		it("should generate system prompt successfully", async () => {
			const result = await caretSystemPrompt.generateSystemPrompt(mockContext)

			expect(result).toBeDefined()
			expect(result.prompt).toBeDefined()
			expect(result.metrics).toBeDefined()
			expect(typeof result.prompt).toBe("string")
			expect(result.prompt.length).toBeGreaterThan(0)
		})

		it("should collect accurate metrics", async () => {
			const result = await caretSystemPrompt.generateSystemPrompt(mockContext)

			expect(result.metrics.generationTime).toBeGreaterThanOrEqual(0)
			expect(result.metrics.promptLength).toBeGreaterThan(0)
			expect(result.metrics.toolCount).toBeGreaterThan(0)
			expect(result.metrics.mcpServerCount).toBe(0) // No MCP servers in mock
			expect(result.metrics.timestamp).toBeGreaterThan(0)
		})

		it("should contain expected Cline content", async () => {
			const result = await caretSystemPrompt.generateSystemPrompt(mockContext)

			expect(result.prompt).toContain("You are Cline")
			expect(result.prompt).toContain("TOOL USE")
			expect(result.prompt).toContain("execute_command")
			expect(result.prompt).toContain("read_file")
			expect(result.prompt).toContain(mockContext.cwd)
		})

		it("should handle Claude4 context correctly", async () => {
			const claude4Context = { ...mockContext, isClaude4ModelFamily: true }

			const result = await caretSystemPrompt.generateSystemPrompt(claude4Context)

			expect(result.prompt).toBeDefined()
			expect(result.prompt).toContain("Claude4: true")
		})
	})

	describe("Metrics Management", () => {
		it("should accumulate metrics correctly", async () => {
			await caretSystemPrompt.generateSystemPrompt(mockContext)
			await caretSystemPrompt.generateSystemPrompt(mockContext)

			const metrics = caretSystemPrompt.getMetrics()
			expect(metrics).toHaveLength(2)

			const averageTime = caretSystemPrompt.getAverageGenerationTime()
			expect(averageTime).toBeGreaterThan(0)
		})

		it("should clear metrics when requested", async () => {
			await caretSystemPrompt.generateSystemPrompt(mockContext)
			expect(caretSystemPrompt.getMetrics()).toHaveLength(1)

			caretSystemPrompt.clearMetrics()
			expect(caretSystemPrompt.getMetrics()).toHaveLength(0)
			expect(caretSystemPrompt.getAverageGenerationTime()).toBe(0)
		})
	})

	describe("Performance Requirements", () => {
		it("should complete generation in reasonable time", async () => {
			const startTime = Date.now()
			await caretSystemPrompt.generateSystemPrompt(mockContext)
			const endTime = Date.now()

			const duration = endTime - startTime
			// Should complete within 100ms for mocked version
			expect(duration).toBeLessThan(100)
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
				const result = await caretSystemPrompt.generateSystemPrompt(invalidContext)
				expect(result).toBeDefined()
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
			}
		})
	})
})
