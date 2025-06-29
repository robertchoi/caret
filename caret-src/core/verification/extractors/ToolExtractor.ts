/**
 * Tool Extraction Module
 *
 * Handles extraction of tool definitions from Cline system prompts.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import { ToolDefinition, ParameterDefinition, ToolCategory, ToolExtractionOptions } from "../types"

export class ToolExtractor {
	private caretLogger: CaretLogger

	// Tool detection patterns
	private static readonly PATTERNS = {
		TOOL_HEADER: /^## (\w+)\s*$/gm,
		DESCRIPTION: /Description:\s*(.+?)$/m,
		PARAMETERS: /Parameters:\s*\n([\s\S]*?)(?=\nUsage:|\n<|\Z)/m,
		USAGE: /Usage:\s*\n([\s\S]*?)(?=\n##|\n====|\Z)/m,
		PARAMETER_LINE: /^-\s*(\w+):\s*\(([^)]+)\)\s*(.+)$/gm,
	}

	// Expected core tools (must always be present)
	private static readonly CORE_TOOLS = [
		"execute_command",
		"read_file",
		"write_to_file",
		"replace_in_file",
		"search_files",
		"list_files",
		"list_code_definition_names",
	]

	// Interactive tools (user interaction)
	private static readonly INTERACTIVE_TOOLS = ["ask_followup_question", "attempt_completion"]

	// Task management tools
	private static readonly TASK_TOOLS = ["new_task", "load_mcp_documentation"]

	// Conditional tools (present based on conditions)
	private static readonly CONDITIONAL_TOOLS = [
		"browser_action", // Present when supportsBrowserUse is true
	]

	// MCP tools (always present for MCP integration)
	private static readonly MCP_TOOLS = ["use_mcp_tool", "access_mcp_resource"]

	constructor() {
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Extract all tools from a system prompt
	 */
	async extractTools(
		prompt: string,
		options: ToolExtractionOptions = {
			includeExamples: true,
			includeUsage: true,
			strictParsing: false,
		},
	): Promise<ToolDefinition[]> {
		const tools: ToolDefinition[] = []

		try {
			this.caretLogger.debug("[ToolExtractor] Starting tool extraction", "EXTRACTION")

			// Find all tool headers
			const toolMatches = Array.from(prompt.matchAll(ToolExtractor.PATTERNS.TOOL_HEADER))

			for (const match of toolMatches) {
				const toolName = match[1]
				const startIndex = match.index!

				// Find the end of this tool section - more reliable approach
				const restOfPrompt = prompt.slice(startIndex + match[0].length)
				const nextToolMatch = restOfPrompt.match(/^## \w+\s*$/m)
				const nextSectionMatch = restOfPrompt.match(/^====|^# [A-Z]/m)

				let endIndex = prompt.length
				if (nextToolMatch) {
					endIndex = startIndex + match[0].length + nextToolMatch.index!
				}
				if (nextSectionMatch) {
					endIndex = Math.min(endIndex, startIndex + match[0].length + nextSectionMatch.index!)
				}

				const toolSection = prompt.slice(startIndex, endIndex)

				// Extract tool details
				const tool = await this.parseToolSection(toolName, toolSection, options)
				if (tool) {
					tools.push(tool)
				}
			}

			this.caretLogger.debug(`[ToolExtractor] Extracted ${tools.length} tools`, "EXTRACTION")
			return tools
		} catch (error) {
			this.caretLogger.error("[ToolExtractor] Tool extraction failed", "EXTRACTION")
			throw error
		}
	}

	/**
	 * Parse individual tool section
	 */
	private async parseToolSection(
		name: string,
		section: string,
		options: ToolExtractionOptions,
	): Promise<ToolDefinition | null> {
		try {
			// Extract description with flexible pattern
			const descMatch = section.match(/Description:\s*(.+)/i)
			const description = descMatch ? descMatch[1].trim() : ""

			// Extract parameters
			const parameters = await this.extractParameters(section)

			// Extract usage with more flexible pattern
			const usageMatch = section.match(/Usage:\s*([\s\S]*?)(?=\n##|\n====|\Z)/i)
			const usage = options.includeUsage && usageMatch ? usageMatch[1].trim() : ""

			// Extract examples (if available in the section)
			const examples = options.includeExamples ? await this.extractExamples(section) : []

			// Categorize tool
			const category = this.categorizeToolUnknownPurpose(name)

			return {
				name,
				description,
				parameters,
				usage,
				examples,
				category,
			}
		} catch (error) {
			this.caretLogger.warn(`[ToolExtractor] Failed to parse tool ${name}: ${error}`, "EXTRACTION")
			if (options.strictParsing) {
				throw error
			}
			return null
		}
	}

	/**
	 * Extract parameters from tool section
	 */
	private async extractParameters(section: string): Promise<ParameterDefinition[]> {
		const parameters: ParameterDefinition[] = []

		try {
			// More flexible parameters extraction
			const paramMatch = section.match(/Parameters:\s*([\s\S]*?)(?=\nUsage:|<|$)/i)

			if (!paramMatch) return parameters

			const paramSection = paramMatch[1]

			// Look for parameter lines starting with -
			const paramMatches = Array.from(paramSection.matchAll(/^-\s*(\w+):\s*\(([^)]+)\)\s*(.+)$/gm))

			for (const match of paramMatches) {
				const name = match[1]
				const requirementInfo = match[2] // This is actually requirement info like "required"
				const description = match[3]

				parameters.push({
					name,
					required: requirementInfo.toLowerCase().includes("required"),
					type: this.inferParameterType(description), // Infer type from description instead
					description: description.trim(),
				})
			}
		} catch (error) {
			this.caretLogger.warn(`[ToolExtractor] Parameter extraction failed: ${error}`, "EXTRACTION")
		}

		return parameters
	}

	/**
	 * Extract examples from tool section
	 */
	private async extractExamples(section: string): Promise<string[]> {
		const examples: string[] = []

		// Look for XML examples in the usage section
		const xmlPattern = /<(\w+)>[\s\S]*?<\/\1>/g
		const matches = Array.from(section.matchAll(xmlPattern))

		for (const match of matches) {
			examples.push(match[0])
		}

		return examples
	}

	/**
	 * Categorize tool based on its name and purpose
	 */
	private categorizeToolUnknownPurpose(toolName: string): ToolCategory {
		if (ToolExtractor.CORE_TOOLS.includes(toolName)) {
			return "core"
		}
		if (ToolExtractor.CONDITIONAL_TOOLS.includes(toolName)) {
			return "conditional"
		}
		if (ToolExtractor.MCP_TOOLS.includes(toolName)) {
			return "mcp"
		}
		if (ToolExtractor.INTERACTIVE_TOOLS.includes(toolName)) {
			return "interactive"
		}
		if (ToolExtractor.TASK_TOOLS.includes(toolName)) {
			return "task"
		}
		return "core" // Default to core
	}

	/**
	 * Infer parameter type from description
	 */
	private inferParameterType(description: string): "string" | "boolean" | "object" | "array" {
		const lowerDesc = description.toLowerCase()

		if (lowerDesc.includes("boolean") || lowerDesc.includes("true or false")) return "boolean"
		if (lowerDesc.includes("object") || lowerDesc.includes("json")) return "object"
		if (lowerDesc.includes("array") || lowerDesc.includes("list of")) return "array"

		return "string"
	}

	/**
	 * Get core tools that must always be present
	 */
	static getCoreTools(): string[] {
		return [...ToolExtractor.CORE_TOOLS]
	}

	/**
	 * Get conditional tools
	 */
	static getConditionalTools(): string[] {
		return [...ToolExtractor.CONDITIONAL_TOOLS]
	}

	/**
	 * Get MCP tools
	 */
	static getMcpTools(): string[] {
		return [...ToolExtractor.MCP_TOOLS]
	}

	/**
	 * Get interactive tools
	 */
	static getInteractiveTools(): string[] {
		return [...ToolExtractor.INTERACTIVE_TOOLS]
	}

	/**
	 * Get task management tools
	 */
	static getTaskTools(): string[] {
		return [...ToolExtractor.TASK_TOOLS]
	}

	/**
	 * Get all expected tools (for comprehensive validation)
	 */
	static getAllExpectedTools(): string[] {
		return [
			...ToolExtractor.CORE_TOOLS,
			...ToolExtractor.CONDITIONAL_TOOLS,
			...ToolExtractor.MCP_TOOLS,
			...ToolExtractor.INTERACTIVE_TOOLS,
			...ToolExtractor.TASK_TOOLS,
		]
	}
}
