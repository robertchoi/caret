/**
 * Cline Feature Validation System Tests
 *
 * Comprehensive test suite for validating that all Cline system prompt
 * features are preserved when modifications are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
	ClineFeatureValidator,
	ToolExtractor,
	ValidationEngine,
	ValidationContext,
	SystemPromptVariant,
	ToolDefinition,
	ToolCategory,
	ValidationResult,
} from "../core/verification"

// Mock the Cline system module
vi.mock("@src/core/prompts/system", () => ({
	SYSTEM_PROMPT: vi.fn(),
}))

vi.mock("@src/core/prompts/model_prompts/claude4", () => ({
	SYSTEM_PROMPT_CLAUDE4: vi.fn(),
}))

vi.mock("@src/core/prompts/model_prompts/claude4-experimental", () => ({
	SYSTEM_PROMPT_CLAUDE4_EXPERIMENTAL: vi.fn(),
}))

// Mock CaretLogger
vi.mock("@caret-src/utils/caret-logger", () => ({
	CaretLogger: vi.fn().mockImplementation(() => ({
		info: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	})),
}))

// Global mock prompt for all tests
const mockOriginalPrompt = `
You are Cline, a highly skilled software engineer.

====

TOOL USE

## execute_command
Description: Request to execute a CLI command on the system.
Parameters:
- command: (required) The CLI command to execute.
- requires_approval: (required) A boolean indicating whether this command requires approval.
Usage:
<execute_command>
<command>Your command here</command>
<requires_approval>true or false</requires_approval>
</execute_command>

## read_file
Description: Request to read the contents of a file at the specified path.
Parameters:
- path: (required) The path of the file to read.
Usage:
<read_file>
<path>File path here</path>
</read_file>

====

SYSTEM INFORMATION

Operating System: Windows 11
Default Shell: PowerShell
Home Directory: C:\\Users\\test
Current Working Directory: C:\\workspace\\project
`

describe("ClineFeatureValidator", () => {
	let validator: ClineFeatureValidator
	let toolExtractor: ToolExtractor
	let validationEngine: ValidationEngine
	let mockContext: ValidationContext

	beforeEach(() => {
		validator = new ClineFeatureValidator()
		toolExtractor = new ToolExtractor()
		validationEngine = new ValidationEngine()
		mockContext = {
			variant: "default" as SystemPromptVariant,
			testMode: true,
			strictMode: false,
			ignoreWarnings: false,
		}
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Construction and Initialization", () => {
		it("should create validator instance successfully", () => {
			expect(validator).toBeInstanceOf(ClineFeatureValidator)
		})

		it("should initialize with empty metrics", () => {
			const metrics = validator.getValidationMetrics()
			expect(metrics).toEqual([])
		})

		it("should be able to clear metrics", () => {
			validator.clearValidationMetrics()
			const metrics = validator.getValidationMetrics()
			expect(metrics).toEqual([])
		})
	})

	describe("Tool Extraction", () => {
		const mockPromptWithTools = `
You are Cline, a highly skilled software engineer.

====

TOOL USE

# Tools

## execute_command
Description: Request to execute a CLI command on the system.
Parameters:
- command: (required) The CLI command to execute.
- requires_approval: (required) A boolean indicating whether this command requires approval.
Usage:
<execute_command>
<command>Your command here</command>
<requires_approval>true or false</requires_approval>
</execute_command>

## read_file
Description: Request to read the contents of a file at the specified path.
Parameters:
- path: (required) The path of the file to read.
Usage:
<read_file>
<path>File path here</path>
</read_file>

## browser_action
Description: Request to interact with a Puppeteer-controlled browser.
Parameters:
- action: (required) The action to perform.
- url: (optional) URL for launch action.
Usage:
<browser_action>
<action>launch</action>
<url>https://example.com</url>
</browser_action>
`

		it("should extract tools from system prompt", async () => {
			const tools = await toolExtractor.extractTools(mockPromptWithTools)

			expect(tools).toBeDefined()
			expect(tools.length).toBeGreaterThan(0)

			// Check for expected core tools
			const toolNames = tools.map((tool) => tool.name)
			expect(toolNames).toContain("execute_command")
			expect(toolNames).toContain("read_file")
			expect(toolNames).toContain("browser_action")
		})

		it("should extract tool details correctly", async () => {
			const tools = await toolExtractor.extractTools(mockPromptWithTools)

			const executeCommand = tools.find((tool) => tool.name === "execute_command")
			expect(executeCommand).toBeDefined()
			expect(executeCommand?.description).toContain("execute a CLI command")
			expect(executeCommand?.parameters).toBeDefined()
			expect(executeCommand?.parameters.length).toBeGreaterThan(0)
			expect(executeCommand?.usage).toBeDefined()
			expect(executeCommand?.category).toBe("core" as ToolCategory)
		})

		it("should categorize tools correctly", async () => {
			const tools = await toolExtractor.extractTools(mockPromptWithTools)

			const executeCommand = tools.find((tool) => tool.name === "execute_command")
			expect(executeCommand?.category).toBe("core")

			const browserAction = tools.find((tool) => tool.name === "browser_action")
			expect(browserAction?.category).toBe("conditional")
		})

		it("should extract parameters correctly", async () => {
			const tools = await toolExtractor.extractTools(mockPromptWithTools)

			const executeCommand = tools.find((tool) => tool.name === "execute_command")
			expect(executeCommand?.parameters).toBeDefined()
			expect(executeCommand?.parameters.length).toBe(2)

			const commandParam = executeCommand?.parameters.find((p) => p.name === "command")
			expect(commandParam?.required).toBe(true)
			expect(commandParam?.type).toBe("string")

			const approvalParam = executeCommand?.parameters.find((p) => p.name === "requires_approval")
			expect(approvalParam?.required).toBe(true)
			expect(approvalParam?.type).toBe("boolean")
		})

		it("should handle malformed tool sections gracefully", async () => {
			const malformedPrompt = `
## invalid_tool
This tool has no proper structure
Random text without proper formatting
`

			const tools = await toolExtractor.extractTools(malformedPrompt, {
				includeExamples: true,
				includeUsage: true,
				strictParsing: false,
			})

			// Should not crash and return partial results
			expect(tools).toBeDefined()
		})
	})

	describe("Feature Extraction", () => {
		const mockCompletePrompt = `
You are Cline, a highly skilled software engineer.

====

TOOL USE

## execute_command
Description: Execute CLI commands.
Parameters:
- command: (required) Command to execute.
Usage:
<execute_command>
<command>npm test</command>
</execute_command>

====

MCP SERVERS

## weather-server (\`npx @modelcontextprotocol/server-weather\`)

### Available Tools
- get_forecast: Get weather forecast for a location

### Resource Templates  
- weather://{location}: Weather data for location

====

SYSTEM INFORMATION

Operating System: Windows 11
Default Shell: PowerShell
Home Directory: C:\\Users\\test
Current Working Directory: C:\\workspace\\project
`

		it("should extract features comprehensively", async () => {
			const features = await validator.extractFeatures(mockCompletePrompt, mockContext)

			expect(features).toBeDefined()
			expect(features.tools).toBeDefined()
			expect(features.mcpServers).toBeDefined()
			expect(features.systemInfo).toBeDefined()
			expect(features.sections).toBeDefined()
			expect(features.metadata).toBeDefined()
		})

		it("should generate correct metadata", async () => {
			const features = await validator.extractFeatures(mockCompletePrompt, mockContext)

			expect(features.metadata.totalLength).toBe(mockCompletePrompt.length)
			expect(features.metadata.toolCount).toBeGreaterThan(0)
			expect(features.metadata.variant).toBe(mockContext.variant)
			expect(features.metadata.generationTimestamp).toBeGreaterThan(0)
		})
	})

	describe("Tool Completeness Validation", () => {
		const originalTools: ToolDefinition[] = [
			{
				name: "execute_command",
				description: "Execute CLI commands",
				parameters: [{ name: "command", required: true, type: "string", description: "Command to execute" }],
				usage: "<execute_command><command>test</command></execute_command>",
				examples: [],
				category: "core",
			},
			{
				name: "read_file",
				description: "Read file contents",
				parameters: [{ name: "path", required: true, type: "string", description: "File path" }],
				usage: "<read_file><path>test.txt</path></read_file>",
				examples: [],
				category: "core",
			},
		]

		it("should pass validation when all tools are preserved", async () => {
			const newTools = [...originalTools] // Exact copy

			const result = await validationEngine.validateToolCompleteness(originalTools, newTools, mockContext)

			expect(result.missingTools).toBe(0)
			expect(result.criticalIssues).toHaveLength(0)
			expect(result.preservedTools).toBe(originalTools.length)
		})

		it("should detect missing core tools", async () => {
			const newTools = originalTools.filter((tool) => tool.name !== "execute_command")

			const result = await validationEngine.validateToolCompleteness(originalTools, newTools, mockContext)

			expect(result.missingTools).toBe(1)
			expect(result.criticalIssues.length).toBeGreaterThan(0)
			expect(result.criticalIssues[0]).toContain("execute_command")
		})

		it("should detect new tools", async () => {
			const newTools = [
				...originalTools,
				{
					name: "new_tool",
					description: "A new tool",
					parameters: [],
					usage: "",
					examples: [],
					category: "core" as ToolCategory,
				},
			]

			const result = await validationEngine.validateToolCompleteness(originalTools, newTools, mockContext)

			expect(result.newTools).toBe(1)
			expect(result.warnings.length).toBeGreaterThan(0)
			expect(result.warnings[0]).toContain("new_tool")
		})

		it("should categorize tools correctly in analysis", async () => {
			const result = await validationEngine.validateToolCompleteness(originalTools, originalTools, mockContext)

			expect(result.coreTools).toBe(2) // Both tools are core
			expect(result.totalTools).toBe(2)
		})
	})

	describe("Comprehensive Validation", () => {
		// Using global mockOriginalPrompt defined at the top

		it("should validate successfully when prompts are identical", async () => {
			const result = await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			expect(result.isValid).toBe(true)
			expect(result.allToolsPreserved).toBe(true)
			expect(result.missingTools).toHaveLength(0)
			expect(result.summary).toContain("✅")
		})

		it("should detect issues when tools are missing", async () => {
			const modifiedPrompt = mockOriginalPrompt.replace("## execute_command", "## removed_command")

			const result = await validator.validateAllFeatures(mockOriginalPrompt, modifiedPrompt, mockContext)

			expect(result.isValid).toBe(false)
			expect(result.allToolsPreserved).toBe(false)
			expect(result.summary).toContain("❌")
		})

		it("should record validation metrics", async () => {
			await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			const metrics = validator.getValidationMetrics()
			expect(metrics).toHaveLength(1)
			expect(metrics[0].totalTime).toBeGreaterThanOrEqual(0) // Allow 0ms for fast validation
			expect(metrics[0].toolsExtracted).toBeGreaterThan(0)
		})

		it("should generate detailed reports", async () => {
			const result = await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			expect(result.detailedReport).toBeDefined()
			expect(result.recommendations).toBeDefined()
			expect(result.recommendations.length).toBeGreaterThan(0)
		})
	})

	describe("Error Handling", () => {
		it("should handle extraction errors gracefully", async () => {
			const invalidPrompt = null as any

			await expect(validator.extractTools(invalidPrompt)).rejects.toThrow()
		})

		it("should handle validation errors gracefully", async () => {
			const invalidContext = null as any

			await expect(validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, invalidContext)).rejects.toThrow()
		})
	})

	describe("Performance and Metrics", () => {
		it("should complete validation within reasonable time", async () => {
			const startTime = Date.now()

			await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			const duration = Date.now() - startTime
			expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
		})

		it("should track memory usage", async () => {
			await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			const metrics = validator.getValidationMetrics()
			expect(metrics[0].memoryUsage).toBeGreaterThan(0)
		})

		it("should provide detailed metrics", async () => {
			await validator.validateAllFeatures(mockOriginalPrompt, mockOriginalPrompt, mockContext)

			const metrics = validator.getValidationMetrics()
			const metric = metrics[0]

			expect(metric.validationTime).toBeGreaterThanOrEqual(0) // Allow 0ms for fast validation
			expect(metric.totalTime).toBeGreaterThanOrEqual(0) // Allow 0ms for fast validation
			expect(metric.toolsExtracted).toBeGreaterThan(0)
			expect(metric.sectionsAnalyzed).toBeGreaterThanOrEqual(0)
			expect(metric.errors).toBeGreaterThanOrEqual(0)
			expect(metric.warnings).toBeGreaterThanOrEqual(0)
		})
	})
})

describe("Integration Tests", () => {
	let validator: ClineFeatureValidator
	let mockContext: ValidationContext

	beforeEach(() => {
		validator = new ClineFeatureValidator()
		mockContext = {
			variant: "default" as SystemPromptVariant,
			testMode: false,
			strictMode: true,
			ignoreWarnings: false,
		}
	})

	describe("Real Cline Prompt Validation", () => {
		// This would test against actual Cline prompts in a real scenario
		it("should validate core tools are always present", async () => {
			const coreToolNames = [
				"execute_command",
				"read_file",
				"write_to_file",
				"replace_in_file",
				"search_files",
				"list_files",
				"list_code_definition_names",
				"ask_followup_question",
				"attempt_completion",
				"new_task",
				"plan_mode_respond",
				"load_mcp_documentation",
			]

			// Mock prompt containing all core tools
			const mockClinePrompt = coreToolNames
				.map(
					(name) => `
## ${name}
Description: ${name} tool description
Parameters:
- param: (required) parameter
Usage:
<${name}><param>value</param></${name}>
`,
				)
				.join("\n")

			const tools = await validator.extractTools(mockClinePrompt)
			const extractedNames = tools.map((tool) => tool.name)

			coreToolNames.forEach((expectedTool) => {
				expect(extractedNames).toContain(expectedTool)
			})
		})

		it("should validate MCP tools are present", async () => {
			const mcpPrompt = `
## use_mcp_tool
Description: Use MCP server tool
Parameters:
- server_name: (required) Server name
- tool_name: (required) Tool name
- arguments: (required) Tool arguments
Usage:
<use_mcp_tool>
<server_name>weather</server_name>
<tool_name>get_forecast</tool_name>
<arguments>{"city": "NYC"}</arguments>
</use_mcp_tool>

## access_mcp_resource
Description: Access MCP resource
Parameters:
- server_name: (required) Server name
- uri: (required) Resource URI
Usage:
<access_mcp_resource>
<server_name>files</server_name>
<uri>file://path/to/file</uri>
</access_mcp_resource>
`

			const tools = await validator.extractTools(mcpPrompt)
			const extractedNames = tools.map((tool) => tool.name)

			expect(extractedNames).toContain("use_mcp_tool")
			expect(extractedNames).toContain("access_mcp_resource")

			const mcpTools = tools.filter((tool) => ["use_mcp_tool", "access_mcp_resource"].includes(tool.name))
			mcpTools.forEach((tool) => {
				expect(tool.category).toBe("mcp")
			})
		})
	})
})
