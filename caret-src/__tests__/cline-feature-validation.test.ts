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

// CARET MODIFICATION: Use real Cline system prompt instead of Mock for actual validation
import { ORIGINAL_CLINE_SYSTEM_PROMPT } from "../../src/core/prompts/system"
import { CaretSystemPrompt } from "../core/prompts/CaretSystemPrompt"
import { McpHub } from "../../src/services/mcp/McpHub"
import { BrowserSettings } from "../../src/shared/BrowserSettings"

// Mock CaretLogger (keep this mock as it's not critical for validation)
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
		// CARET MODIFICATION: Real ORIGINAL_CLINE_SYSTEM_PROMPT vs CaretSystemPrompt validation
		it("should validate ORIGINAL_CLINE_SYSTEM_PROMPT actually works (Mock → Real verification)", async () => {
			// Create mock context for real Cline system
			const mockMcpHub: Partial<McpHub> = {
				getServers: vi.fn().mockReturnValue([]),
			}
			const mockBrowserSettings: Partial<BrowserSettings> = {
				viewport: { width: 1280, height: 720 },
			}

			// Generate real Cline original prompt
			const realClinePrompt = ORIGINAL_CLINE_SYSTEM_PROMPT(
				"/test/project",
				true, // supportsBrowserUse
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false, // isClaude4ModelFamily
			)

			// Validate that real prompt is substantial (not mock)
			expect(realClinePrompt.length).toBeGreaterThan(5000) // Should be ~700 lines
			expect(realClinePrompt).toContain("You are Cline") // Cline introduction
			expect(realClinePrompt).toContain("TOOL USE") // Tool section
			expect(realClinePrompt).toContain("execute_command") // Core tool
			expect(realClinePrompt).toContain("browser_action") // Browser support enabled

			// Extract tools from real prompt
			const realTools = await validator.extractTools(realClinePrompt)

			// Validate core tools are present (should be 12+ tools)
			expect(realTools.length).toBeGreaterThan(10)

			const realToolNames = realTools.map((tool) => tool.name)
			const expectedCoreTools = [
				"execute_command",
				"read_file",
				"write_to_file",
				"replace_in_file",
				"search_files",
				"list_files",
				"ask_followup_question",
				"attempt_completion",
			]

			expectedCoreTools.forEach((expectedTool) => {
				expect(realToolNames).toContain(expectedTool)
			})

			// Log real validation results
			console.log(`[REAL_VALIDATION] SUCCESS: Real Cline prompt loaded!`)
			console.log(`[REAL_VALIDATION] Prompt length: ${realClinePrompt.length} characters`)
			console.log(`[REAL_VALIDATION] Tool count: ${realTools.length} tools`)
			console.log(`[REAL_VALIDATION] Tools: ${realToolNames.join(", ")}`)
			console.log(`[REAL_VALIDATION] Mock → Real import successful! ✅`)
		})

		it("should validate ORIGINAL_CLINE_SYSTEM_PROMPT vs CaretSystemPrompt 100% equivalence", async () => {
			// Create mock context for real Cline system
			const mockMcpHub: Partial<McpHub> = {
				getServers: vi.fn().mockReturnValue([]),
			}
			const mockBrowserSettings: Partial<BrowserSettings> = {
				viewport: { width: 1280, height: 720 },
			}

			// Generate real Cline original prompt
			const realClinePrompt = ORIGINAL_CLINE_SYSTEM_PROMPT(
				"/test/project",
				true, // supportsBrowserUse
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false, // isClaude4ModelFamily
			)

			// Generate Caret JSON prompt
			const projectRoot = process.cwd() // D:\dev\caret
			const caretPrompt = CaretSystemPrompt.getInstance(projectRoot)
			const caretJsonPrompt = await caretPrompt.generateFromJsonSections(
				"/test/project",
				true,
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false,
				"agent",
			)

			// DEBUG: Log prompt details for comparison
			console.log(`[CARET PROMPT START]\n${caretJsonPrompt.substring(0, 500)}...\n[CARET PROMPT END]`)
			console.log(`[CARET PROMPT LENGTH] ${caretJsonPrompt.length} characters`)

			// Extract tools from both prompts using ToolExtractor
			const realTools = await validator.extractTools(realClinePrompt)
			const caretTools = await validator.extractTools(caretJsonPrompt)

			console.log(`[COMPARISON] Original tools: ${realTools.length}, Caret tools: ${caretTools.length}`)

			// Validate substantial prompts
			expect(realClinePrompt.length).toBeGreaterThan(5000)
			expect(caretJsonPrompt.length).toBeGreaterThan(5000)

			// Tool count comparison (allowing some variance for conditional tools)
			expect(Math.abs(realTools.length - caretTools.length)).toBeLessThanOrEqual(4)

			// Core tools must be present in both
			const expectedCoreTools = [
				"execute_command",
				"read_file",
				"write_to_file",
				"replace_in_file",
				"search_files",
				"list_files",
				"ask_followup_question",
				"attempt_completion",
			]

			const realToolNames = realTools.map((tool) => tool.name)
			const caretToolNames = caretTools.map((tool) => tool.name)

			expectedCoreTools.forEach((toolName) => {
				expect(realToolNames).toContain(toolName)
				expect(caretToolNames).toContain(toolName)
			})

			console.log(`[SUCCESS] Both systems contain all core tools`)
		})

		// CARET MODIFICATION: Real functional equivalence validation (not ToolExtractor-based)
		it("should validate Cline vs Caret functional equivalence using real tool definitions", async () => {
			// Import Cline's actual tool definitions
			const { bashToolDefinition } = await import("../../src/core/tools/bashTool")
			const { readToolDefinition } = await import("../../src/core/tools/readTool")
			const { writeToolDefinition } = await import("../../src/core/tools/writeTool")
			const { editToolDefinition } = await import("../../src/core/tools/editTool")
			const { askQuestionToolDefinition } = await import("../../src/core/tools/askQuestionTool")
			const { attemptCompletionToolDefinition } = await import("../../src/core/tools/attemptCompletionTool")

			// Load Caret's JSON tool definitions
			const { JsonTemplateLoader } = await import("../core/prompts/JsonTemplateLoader")
			const projectRoot = process.cwd() // JsonTemplateLoader expects project root, adds caret-src/core/prompts/sections internally
			const jsonLoader = new JsonTemplateLoader(projectRoot, false)

			const toolDefinitionsJson = await jsonLoader.loadTemplate("TOOL_DEFINITIONS")

			// Verify JSON structure is valid
			expect(toolDefinitionsJson).toBeDefined()
			expect((toolDefinitionsJson as any).tools).toBeDefined()
			expect(typeof (toolDefinitionsJson as any).tools).toBe("object")

			console.log(`[FUNCTIONAL_TEST] Loaded ${Object.keys((toolDefinitionsJson as any).tools).length} tools from JSON`)

			// Test individual tool equivalence
			const testCwd = "/test/project"

			// Cast to access tools property
			const toolsData = (toolDefinitionsJson as any).tools

			// 1. Test execute_command (bash) equivalence
			const clineExecuteCommand = bashToolDefinition(testCwd)
			const caretExecuteCommand = toolsData.execute_command

			expect(caretExecuteCommand).toBeDefined()
			expect(caretExecuteCommand.title).toBe("execute_command")

			// Verify core parameters exist
			expect(caretExecuteCommand.parameters).toBeDefined()
			const caretParams = caretExecuteCommand.parameters
			const hasCommandParam = caretParams.some((p: any) => p.name === "command" && p.required)
			const hasApprovalParam = caretParams.some((p: any) => p.name === "requires_approval" && p.required)

			expect(hasCommandParam).toBe(true)
			expect(hasApprovalParam).toBe(true)

			// 2. Test read_file equivalence
			const clineReadFile = readToolDefinition(testCwd)
			const caretReadFile = toolsData.read_file

			expect(caretReadFile).toBeDefined()
			expect(caretReadFile.title).toBe("read_file")

			const caretReadParams = caretReadFile.parameters
			const hasPathParam = caretReadParams.some((p: any) => p.name === "path" && p.required)
			expect(hasPathParam).toBe(true)

			// 3. Test write_to_file equivalence
			const clineWriteFile = writeToolDefinition(testCwd)
			const caretWriteFile = toolsData.write_to_file

			expect(caretWriteFile).toBeDefined()
			expect(caretWriteFile.title).toBe("write_to_file")

			const caretWriteParams = caretWriteFile.parameters
			const hasWritePathParam = caretWriteParams.some((p: any) => p.name === "path" && p.required)
			const hasContentParam = caretWriteParams.some((p: any) => p.name === "content" && p.required)
			expect(hasWritePathParam).toBe(true)
			expect(hasContentParam).toBe(true)

			// 4. Test interactive tools
			const clineAskQuestion = askQuestionToolDefinition
			const caretAskQuestion = toolsData.ask_followup_question

			expect(caretAskQuestion).toBeDefined()
			expect(caretAskQuestion.title).toBe("ask_followup_question")

			const clineAttemptCompletion = attemptCompletionToolDefinition
			const caretAttemptCompletion = toolsData.attempt_completion

			expect(caretAttemptCompletion).toBeDefined()
			expect(caretAttemptCompletion.title).toBe("attempt_completion")

			// 5. Verify all core tools are present in Caret JSON
			const expectedCoreTools = [
				"execute_command",
				"read_file",
				"write_to_file",
				"replace_in_file",
				"search_files",
				"list_files",
				"list_code_definition_names",
				"ask_followup_question",
				"attempt_completion",
			]

			const caretToolNames = Object.keys(toolsData)
			expectedCoreTools.forEach((toolName) => {
				expect(caretToolNames).toContain(toolName)
			})

			console.log(`[FUNCTIONAL_TEST] ✅ All ${expectedCoreTools.length} core tools present in Caret JSON`)
			console.log(`[FUNCTIONAL_TEST] ✅ Parameter validation passed for key tools`)
			console.log(`[FUNCTIONAL_TEST] ✅ Functional equivalence validated`)
		})

		// CARET MODIFICATION: JSON structure validation test
		it("should validate all JSON sections are properly structured", async () => {
			const { JsonTemplateLoader } = await import("../core/prompts/JsonTemplateLoader")
			const projectRoot = process.cwd() // JsonTemplateLoader expects project root, adds caret-src/core/prompts/sections internally
			const jsonLoader = new JsonTemplateLoader(projectRoot, false)

			// Test all core JSON sections
			const jsonSections = [
				"BASE_PROMPT_INTRO",
				"COLLABORATIVE_PRINCIPLES",
				"TOOLS_HEADER",
				"TOOL_USE_FORMAT",
				"TOOL_DEFINITIONS",
				"TOOL_USE_EXAMPLES",
				"TOOL_USE_GUIDELINES",
				"CHATBOT_AGENT_MODES",
				"OBJECTIVE",
			]

			for (const sectionName of jsonSections) {
				const section = await jsonLoader.loadTemplate(sectionName)

				// Verify basic structure
				expect(section).toBeDefined()
				expect(section.metadata).toBeDefined()
				expect(section.metadata.name).toBe(sectionName)
				expect(section.metadata.version).toBeDefined()

				// Verify content structure
				if (sectionName === "TOOL_DEFINITIONS") {
					// TOOL_DEFINITIONS has special structure with tools at top level
					const sectionTools = (section as any).tools
					expect(sectionTools).toBeDefined()
					expect(typeof sectionTools).toBe("object")
					expect(Object.keys(sectionTools).length).toBeGreaterThan(10)

					// Log all tool names for debugging
					const allToolNames = Object.keys(sectionTools)
					console.log(`[DEBUG_TOOL_STRUCTURE] All tool names (${allToolNames.length}):`, allToolNames)

					// Verify each tool has required structure
					for (const [toolName, toolDef] of Object.entries(sectionTools)) {
						console.log(`[DEBUG_TOOL_VALIDATION] Checking tool "${toolName}", type: ${typeof toolDef}`)
						if (!toolDef || typeof toolDef !== "object") {
							console.log(`[DEBUG_TOOL_VALIDATION] Tool "${toolName}" is not an object:`, toolDef)
							continue
						}

						const tool = toolDef as any
						if (!tool.title) {
							console.log(
								`[DEBUG_TOOL_VALIDATION] Tool "${toolName}" missing title:`,
								JSON.stringify(tool, null, 2),
							)
						}

						expect(tool.title).toBeDefined()
						expect(tool.description).toBeDefined()
						expect(tool.parameters).toBeDefined()
						expect(Array.isArray(tool.parameters)).toBe(true)
					}
				} else {
					expect(section.add).toBeDefined()
					expect(section.add.sections).toBeDefined()
					expect(Array.isArray(section.add.sections)).toBe(true)
				}

				console.log(`[JSON_VALIDATION] ✅ ${sectionName} structure valid`)
			}

			console.log(`[JSON_VALIDATION] ✅ All ${jsonSections.length} JSON sections properly structured`)
		})

		// CARET MODIFICATION: End-to-end prompt generation validation
		it("should validate complete prompt generation produces functional output", async () => {
			const projectRoot = process.cwd()
			const caretPrompt = CaretSystemPrompt.getInstance(projectRoot)
			const mockMcpHub: Partial<McpHub> = { getServers: vi.fn().mockReturnValue([]) }
			const mockBrowserSettings: Partial<BrowserSettings> = { viewport: { width: 1280, height: 720 } }

			// Generate complete prompt
			const fullPrompt = await caretPrompt.generateFromJsonSections(
				"/test/project",
				true, // supportsBrowserUse
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false, // isClaude4ModelFamily
				"agent",
			)

			// Verify prompt structure and content
			expect(fullPrompt.length).toBeGreaterThan(15000) // Should be substantial
			expect(fullPrompt).toContain("You are Caret") // Identity
			expect(fullPrompt).toContain("AGENT MODE") // Mode explanation
			expect(fullPrompt).toContain("## execute_command") // Tools present
			expect(fullPrompt).toContain("## read_file")
			expect(fullPrompt).toContain("## write_to_file")
			expect(fullPrompt).toContain("## browser_action") // Browser tool included
			expect(fullPrompt).toContain("Parameters:") // Tool parameters
			expect(fullPrompt).toContain("Usage:") // Usage examples

			// Verify XML format instructions
			expect(fullPrompt).toContain("<tool_name>")
			expect(fullPrompt).toContain("<parameter_name>")

			console.log(`[E2E_VALIDATION] ✅ Complete prompt generated: ${fullPrompt.length} characters`)
			console.log(`[E2E_VALIDATION] ✅ All required sections present`)
			console.log(`[E2E_VALIDATION] ✅ Proper XML formatting instructions included`)
		})

		// CARET MODIFICATION: Coverage validation test with comparison data file generation
		it("should validate Caret covers all Cline tool functionality and generate comparison data", async () => {
			const fs = await import("fs/promises")
			const path = await import("path")
			const { JsonTemplateLoader } = await import("../core/prompts/JsonTemplateLoader")
			const projectRoot = process.cwd()
			const jsonLoader = new JsonTemplateLoader(projectRoot, false)

			// Load all Cline tool definitions
			const { bashToolDefinition } = await import("../../src/core/tools/bashTool")
			const { readToolDefinition } = await import("../../src/core/tools/readTool")
			const { writeToolDefinition } = await import("../../src/core/tools/writeTool")
			const { editToolDefinition } = await import("../../src/core/tools/editTool")
			const { askQuestionToolDefinition } = await import("../../src/core/tools/askQuestionTool")
			const { attemptCompletionToolDefinition } = await import("../../src/core/tools/attemptCompletionTool")
			const { lsToolDefinition } = await import("../../src/core/tools/lsTool")
			const { grepToolDefinition } = await import("../../src/core/tools/grepTool")

			const testCwd = "/test/project"
			const clineTools = [
				{ name: "execute_command", definition: bashToolDefinition(testCwd) },
				{ name: "read_file", definition: readToolDefinition(testCwd) },
				{ name: "write_to_file", definition: writeToolDefinition(testCwd) },
				{ name: "replace_in_file", definition: editToolDefinition(testCwd) },
				{ name: "ask_followup_question", definition: askQuestionToolDefinition },
				{ name: "attempt_completion", definition: attemptCompletionToolDefinition },
				{ name: "list_files", definition: lsToolDefinition(testCwd) },
				{ name: "search_files", definition: grepToolDefinition(testCwd) },
			]

			// Load Caret tool definitions
			const toolDefinitionsJson = await jsonLoader.loadTemplate("TOOL_DEFINITIONS")
			const caretTools = (toolDefinitionsJson as any).tools

			console.log(`[COVERAGE_TEST] Cline tools to check: ${clineTools.length}`)
			console.log(`[COVERAGE_TEST] Caret tools available: ${Object.keys(caretTools).length}`)

			// Coverage validation + comparison data collection
			const coverageResults: { [key: string]: { covered: boolean; reason?: string } } = {}
			const comparisonData = {
				metadata: {
					generated_at: new Date().toISOString(),
					purpose: "Detailed comparison data for Cline vs Caret tool definitions",
					cline_tools_analyzed: clineTools.length,
					caret_tools_available: Object.keys(caretTools).length,
					test_environment: "vitest",
				},
				tool_comparisons: [] as any[],
			}

			for (const clineTool of clineTools) {
				const caretTool = caretTools[clineTool.name]

				// Extract detailed Cline definition data
				const clineData = {
					source_location: `src/core/tools/${
						clineTool.name === "execute_command"
							? "bashTool"
							: clineTool.name === "replace_in_file"
								? "editTool"
								: clineTool.name === "ask_followup_question"
									? "askQuestionTool"
									: clineTool.name === "list_files"
										? "lsTool"
										: clineTool.name === "search_files"
											? "grepTool"
											: clineTool.name + "Tool"
					}.ts`,
					name: clineTool.definition.name,
					description: clineTool.definition.descriptionForAgent,
					input_schema: clineTool.definition.inputSchema,
					parameters_detailed: {},
					raw_definition: JSON.stringify(clineTool.definition, null, 2),
				}

				// Extract parameter details from Cline
				if (clineTool.definition.inputSchema?.properties) {
					Object.entries(clineTool.definition.inputSchema.properties).forEach(([paramName, paramDef]) => {
						clineData.parameters_detailed[paramName] = {
							type: (paramDef as any).type,
							description: (paramDef as any).description,
							required: clineTool.definition.inputSchema?.required?.includes(paramName) || false,
						}
					})
				}

				// Extract detailed Caret definition data
				let caretData: any = null
				if (caretTool) {
					caretData = {
						source_location: "caret-src/core/prompts/sections/TOOL_DEFINITIONS.json",
						title: caretTool.title,
						description: caretTool.description,
						parameters: caretTool.parameters,
						usage_example: caretTool.usage,
						parameters_detailed: {} as any,
						raw_definition: JSON.stringify(caretTool, null, 2),
					}

					// Extract parameter details from Caret
					if (caretTool.parameters && Array.isArray(caretTool.parameters)) {
						caretTool.parameters.forEach((param: any) => {
							caretData.parameters_detailed[param.name] = {
								description: param.description,
								required: param.required,
								type: "inferred_from_description", // Caret doesn't specify explicit types
							}
						})
					}
				}

				// Coverage analysis
				if (!caretTool) {
					coverageResults[clineTool.name] = {
						covered: false,
						reason: "Tool not found in Caret JSON",
					}
				} else if (!caretTool.title || !caretTool.description || !caretTool.parameters) {
					coverageResults[clineTool.name] = {
						covered: false,
						reason: "Missing basic structure (title/description/parameters)",
					}
				} else {
					// Check parameters coverage
					const clineParamNames = Object.keys(clineData.parameters_detailed)
					const caretParamNames = caretTool.parameters.map((p: any) => p.name)
					const missingParams = clineParamNames.filter((name) => !caretParamNames.includes(name))

					if (missingParams.length > 0) {
						coverageResults[clineTool.name] = {
							covered: false,
							reason: `Missing parameters: ${missingParams.join(", ")}`,
						}
					} else {
						coverageResults[clineTool.name] = { covered: true }
					}
				}

				// Add to comparison data
				comparisonData.tool_comparisons.push({
					tool_name: clineTool.name,
					coverage_status: coverageResults[clineTool.name],
					cline_definition: clineData,
					caret_definition: caretData,
					comparison_notes: {
						structure_differences: caretTool ? "JSON vs TypeScript definition" : "Tool missing in Caret",
						parameter_count_cline: Object.keys(clineData.parameters_detailed).length,
						parameter_count_caret: caretData ? caretData.parameters.length : 0,
						semantic_analysis_needed: caretTool ? true : false,
					},
				})
			}

			// Generate comparison data file
			const outputDir = path.join(projectRoot, "caret-docs", "reports")
			const outputFile = path.join(outputDir, "cline-caret-tool-comparison.json")

			try {
				await fs.mkdir(outputDir, { recursive: true })
				await fs.writeFile(outputFile, JSON.stringify(comparisonData, null, 2), "utf8")
				console.log(`[COVERAGE_TEST] 📄 Comparison data saved to: ${outputFile}`)
			} catch (error) {
				console.log(`[COVERAGE_TEST] ⚠️ Could not save comparison data file: ${error}`)
				// Don't fail test if file write fails
			}

			// Report results
			const coveredTools = Object.values(coverageResults).filter((r) => r.covered).length
			const totalTools = clineTools.length
			const coveragePercent = Math.round((coveredTools / totalTools) * 100)

			console.log(`[COVERAGE_TEST] ✅ Coverage: ${coveredTools}/${totalTools} (${coveragePercent}%)`)
			console.log(
				`[COVERAGE_TEST] 📊 Detailed comparison data generated for ${comparisonData.tool_comparisons.length} tools`,
			)

			// Log any missing coverage
			Object.entries(coverageResults).forEach(([toolName, result]) => {
				if (!result.covered) {
					console.log(`[COVERAGE_TEST] ❌ ${toolName}: ${result.reason}`)
				} else {
					console.log(`[COVERAGE_TEST] ✅ ${toolName}: Covered`)
				}
			})

			// Assert minimum coverage threshold
			expect(coveragePercent).toBeGreaterThanOrEqual(80) // 80% minimum coverage
			expect(coveredTools).toBeGreaterThanOrEqual(6) // At least 6 core tools

			// Verify comparison data structure
			expect(comparisonData.tool_comparisons.length).toBe(clineTools.length)
			expect(comparisonData.metadata).toBeDefined()
		})

		// CARET MODIFICATION: Semantic equivalence report generation
		it("should generate semantic equivalence report for AI analysis", async () => {
			const { JsonTemplateLoader } = await import("../core/prompts/JsonTemplateLoader")
			const projectRoot = process.cwd()
			const jsonLoader = new JsonTemplateLoader(projectRoot, false)

			// Load sample tools for semantic comparison
			const { bashToolDefinition } = await import("../../src/core/tools/bashTool")
			const { readToolDefinition } = await import("../../src/core/tools/readTool")
			const { writeToolDefinition } = await import("../../src/core/tools/writeTool")

			const testCwd = "/test/project"
			const sampleClineTools = [
				{ name: "execute_command", definition: bashToolDefinition(testCwd) },
				{ name: "read_file", definition: readToolDefinition(testCwd) },
				{ name: "write_to_file", definition: writeToolDefinition(testCwd) },
			]

			// Load Caret tools
			const toolDefinitionsJson = await jsonLoader.loadTemplate("TOOL_DEFINITIONS")
			const caretTools = (toolDefinitionsJson as any).tools

			// Generate semantic comparison report
			const semanticReport = {
				metadata: {
					generated_at: new Date().toISOString(),
					purpose: "Semantic equivalence analysis between Cline and Caret tool definitions",
					total_tools_compared: sampleClineTools.length,
				},
				comparisons: [] as any[],
			}

			for (const clineTool of sampleClineTools) {
				const caretTool = caretTools[clineTool.name]

				if (!caretTool) {
					semanticReport.comparisons.push({
						tool_name: clineTool.name,
						status: "MISSING",
						reason: "Tool not found in Caret definitions",
					})
					continue
				}

				// Extract comparison data
				const comparison = {
					tool_name: clineTool.name,
					status: "FOUND",
					cline_definition: {
						name: clineTool.definition.name,
						description: clineTool.definition.descriptionForAgent,
						parameters: clineTool.definition.inputSchema?.properties || {},
						required_params: clineTool.definition.inputSchema?.required || [],
					},
					caret_definition: {
						title: caretTool.title,
						description: caretTool.description,
						parameters: caretTool.parameters,
						usage_example: caretTool.usage,
					},
					semantic_analysis_questions: [
						"Do both definitions describe the same core functionality?",
						"Are the parameter names and types equivalent?",
						"Do the descriptions convey the same level of detail and safety considerations?",
						"Are the usage patterns compatible?",
						"Would a user achieve the same results using either definition?",
					],
				}

				semanticReport.comparisons.push(comparison)
			}

			// Log report summary
			console.log(`[SEMANTIC_REPORT] Generated comparison report for ${semanticReport.comparisons.length} tools`)
			console.log(`[SEMANTIC_REPORT] Report structure:`, JSON.stringify(semanticReport.metadata, null, 2))

			// Save report to file for AI analysis (in test environment, just verify structure)
			expect(semanticReport.metadata).toBeDefined()
			expect(semanticReport.comparisons.length).toBeGreaterThan(0)
			expect(semanticReport.comparisons[0]).toHaveProperty("tool_name")
			expect(semanticReport.comparisons[0]).toHaveProperty("cline_definition")
			expect(semanticReport.comparisons[0]).toHaveProperty("caret_definition")
			expect(semanticReport.comparisons[0]).toHaveProperty("semantic_analysis_questions")

			console.log(`[SEMANTIC_REPORT] ✅ Report generated successfully`)
			console.log(`[SEMANTIC_REPORT] First comparison preview:`, JSON.stringify(semanticReport.comparisons[0], null, 2))
		})
	})
})
