/**
 * Validation Engine Module
 *
 * Handles the core validation logic for Cline feature preservation.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import {
	ToolDefinition,
	McpServerInfo,
	SystemInfo,
	ValidationContext,
	ToolAnalysisResult,
	McpAnalysisResult,
	SystemInfoAnalysisResult,
	ToolComparisonResult,
	ToolChange,
} from "../types"

export class ValidationEngine {
	private caretLogger: CaretLogger

	constructor() {
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Validate tool completeness between original and new prompts
	 */
	async validateToolCompleteness(
		originalTools: ToolDefinition[],
		newTools: ToolDefinition[],
		context: ValidationContext,
	): Promise<ToolAnalysisResult> {
		try {
			this.caretLogger.debug("[ValidationEngine] Starting tool completeness validation", "VALIDATION")

			const result: ToolAnalysisResult = {
				totalTools: newTools.length,
				preservedTools: 0,
				missingTools: 0,
				newTools: 0,
				modifiedTools: 0,
				coreTools: 0,
				conditionalTools: 0,
				mcpTools: 0,
				interactiveTools: 0,
				taskTools: 0,
				criticalIssues: [],
				warnings: [],
				suggestions: [],
				toolChanges: [],
			}

			// Categorize tools
			const categorizeTools = (tools: ToolDefinition[]) => {
				const categories = {
					core: 0,
					conditional: 0,
					mcp: 0,
					interactive: 0,
					task: 0,
				}

				tools.forEach((tool) => {
					categories[tool.category]++
				})

				return categories
			}

			const originalCategories = categorizeTools(originalTools)
			const newCategories = categorizeTools(newTools)

			result.coreTools = newCategories.core
			result.conditionalTools = newCategories.conditional
			result.mcpTools = newCategories.mcp
			result.interactiveTools = newCategories.interactive
			result.taskTools = newCategories.task

			// Find missing, new, and modified tools
			const originalToolNames = new Set(originalTools.map((t) => t.name))
			const newToolNames = new Set(newTools.map((t) => t.name))

			// Missing tools
			const missingToolNames = [...originalToolNames].filter((name) => !newToolNames.has(name))
			result.missingTools = missingToolNames.length

			// New tools
			const newToolNames_array = [...newToolNames].filter((name) => !originalToolNames.has(name))
			result.newTools = newToolNames_array.length

			// Preserved tools
			const preservedToolNames = [...originalToolNames].filter((name) => newToolNames.has(name))
			result.preservedTools = preservedToolNames.length

			// Check for modifications in preserved tools
			for (const toolName of preservedToolNames) {
				const originalTool = originalTools.find((t) => t.name === toolName)!
				const newTool = newTools.find((t) => t.name === toolName)!

				const comparison = await this.compareTools(originalTool, newTool)
				if (!comparison.isIdentical) {
					result.modifiedTools++
					result.toolChanges.push({
						toolName,
						changeType: "modified",
						details: comparison.differences,
					})
				}
			}

			// Generate issues and warnings
			for (const missingTool of missingToolNames) {
				const originalTool = originalTools.find((t) => t.name === missingTool)!
				if (originalTool.category === "core") {
					result.criticalIssues.push(`Critical: Core tool '${missingTool}' is missing`)
				} else {
					result.warnings.push(`Warning: Tool '${missingTool}' is missing`)
				}
			}

			for (const newTool of newToolNames_array) {
				result.warnings.push(`New tool '${newTool}' was added`)
			}

			// Generate suggestions
			if (result.missingTools > 0) {
				result.suggestions.push("Review removed tools to ensure they are not critical for Cline functionality")
			}

			if (result.newTools > 0) {
				result.suggestions.push("Validate that new tools follow Cline conventions")
			}

			if (result.modifiedTools > 0) {
				result.suggestions.push("Verify that tool modifications preserve expected behavior")
			}

			this.caretLogger.debug("[ValidationEngine] Tool completeness validation completed", "VALIDATION")
			return result
		} catch (error) {
			this.caretLogger.error("[ValidationEngine] Tool validation failed", "VALIDATION")
			throw error
		}
	}

	/**
	 * Compare two tools for differences
	 */
	private async compareTools(original: ToolDefinition, modified: ToolDefinition): Promise<ToolComparisonResult> {
		const differences: string[] = []
		let isIdentical = true

		// Compare description
		if (original.description !== modified.description) {
			differences.push(`Description changed: "${original.description}" → "${modified.description}"`)
			isIdentical = false
		}

		// Compare parameters
		if (original.parameters.length !== modified.parameters.length) {
			differences.push(`Parameter count changed: ${original.parameters.length} → ${modified.parameters.length}`)
			isIdentical = false
		} else {
			// Compare individual parameters
			for (let i = 0; i < original.parameters.length; i++) {
				const origParam = original.parameters[i]
				const modParam = modified.parameters[i]

				if (origParam.name !== modParam.name) {
					differences.push(`Parameter name changed: "${origParam.name}" → "${modParam.name}"`)
					isIdentical = false
				}

				if (origParam.required !== modParam.required) {
					differences.push(
						`Parameter "${origParam.name}" required status changed: ${origParam.required} → ${modParam.required}`,
					)
					isIdentical = false
				}

				if (origParam.type !== modParam.type) {
					differences.push(`Parameter "${origParam.name}" type changed: ${origParam.type} → ${modParam.type}`)
					isIdentical = false
				}
			}
		}

		// Compare usage
		if (original.usage !== modified.usage) {
			differences.push("Usage examples changed")
			isIdentical = false
		}

		// Compare category
		if (original.category !== modified.category) {
			differences.push(`Category changed: ${original.category} → ${modified.category}`)
			isIdentical = false
		}

		return {
			isIdentical,
			differences,
			severity: differences.length > 2 ? "high" : differences.length > 0 ? "medium" : "low",
		}
	}

	/**
	 * Validate MCP integration preservation
	 */
	async validateMcpIntegration(
		originalServers: McpServerInfo[],
		newServers: McpServerInfo[],
		context: ValidationContext,
	): Promise<McpAnalysisResult> {
		try {
			this.caretLogger.debug("[ValidationEngine] Starting MCP integration validation", "VALIDATION")

			const countToolsAndResources = (servers: McpServerInfo[]) => {
				let tools = 0
				let resources = 0
				servers.forEach((server) => {
					tools += server.tools.length
					resources += server.resourceTemplates.length + server.resources.length
				})
				return { tools, resources }
			}

			const originalCounts = countToolsAndResources(originalServers)
			const newCounts = countToolsAndResources(newServers)

			const result: McpAnalysisResult = {
				totalServers: newServers.length,
				preservedServers: 0,
				missingServers: 0,
				newServers: 0,
				totalTools: newCounts.tools,
				totalResources: newCounts.resources,
				toolsPreserved: 0,
				resourcesPreserved: 0,
				issues: [],
				warnings: [],
				suggestions: [],
			}

			const originalServerNames = new Set(originalServers.map((s) => s.name))
			const newServerNames = new Set(newServers.map((s) => s.name))

			// Missing servers
			const missingServers = [...originalServerNames].filter((name) => !newServerNames.has(name))
			result.missingServers = missingServers.length

			// New servers
			const newServerNames_array = [...newServerNames].filter((name) => !originalServerNames.has(name))
			result.newServers = newServerNames_array.length

			// Preserved servers
			const preservedServers = [...originalServerNames].filter((name) => newServerNames.has(name))
			result.preservedServers = preservedServers.length

			// Generate issues
			for (const missingServer of missingServers) {
				result.issues.push(`MCP server '${missingServer}' is missing`)
			}

			if (originalCounts.tools !== newCounts.tools) {
				result.warnings.push(`MCP tool count changed: ${originalCounts.tools} → ${newCounts.tools}`)
			}

			if (originalCounts.resources !== newCounts.resources) {
				result.warnings.push(`MCP resource count changed: ${originalCounts.resources} → ${newCounts.resources}`)
			}

			this.caretLogger.debug("[ValidationEngine] MCP integration validation completed", "VALIDATION")
			return result
		} catch (error) {
			this.caretLogger.error("[ValidationEngine] MCP validation failed", "VALIDATION")
			throw error
		}
	}

	/**
	 * Validate system information preservation
	 */
	async validateSystemInfo(
		originalInfo: SystemInfo,
		newInfo: SystemInfo,
		context: ValidationContext,
	): Promise<SystemInfoAnalysisResult> {
		try {
			this.caretLogger.debug("[ValidationEngine] Starting system info validation", "VALIDATION")

			const differences: string[] = []

			if (originalInfo.operatingSystem !== newInfo.operatingSystem) {
				differences.push(`Operating System: "${originalInfo.operatingSystem}" → "${newInfo.operatingSystem}"`)
			}

			if (originalInfo.defaultShell !== newInfo.defaultShell) {
				differences.push(`Default Shell: "${originalInfo.defaultShell}" → "${newInfo.defaultShell}"`)
			}

			if (originalInfo.homeDirectory !== newInfo.homeDirectory) {
				differences.push(`Home Directory: "${originalInfo.homeDirectory}" → "${newInfo.homeDirectory}"`)
			}

			if (originalInfo.currentWorkingDirectory !== newInfo.currentWorkingDirectory) {
				differences.push(
					`Working Directory: "${originalInfo.currentWorkingDirectory}" → "${newInfo.currentWorkingDirectory}"`,
				)
			}

			const result: SystemInfoAnalysisResult = {
				isIdentical: differences.length === 0,
				differences,
				issues: [],
				warnings: [],
				suggestions: [],
			}

			// Generate warnings for differences
			if (!result.isIdentical) {
				differences.forEach((diff) => {
					result.warnings.push(`System info changed: ${diff}`)
				})
			}

			// Check for completeness
			const requiredFields = ["operatingSystem", "defaultShell", "homeDirectory", "currentWorkingDirectory"]
			const missingFields = requiredFields.filter(
				(field) => !newInfo[field as keyof SystemInfo] || newInfo[field as keyof SystemInfo].trim().length === 0,
			)

			if (missingFields.length > 0) {
				result.issues.push(`Missing system info fields: ${missingFields.join(", ")}`)
			}

			this.caretLogger.debug("[ValidationEngine] System info validation completed", "VALIDATION")
			return result
		} catch (error) {
			this.caretLogger.error("[ValidationEngine] System info validation failed", "VALIDATION")
			throw error
		}
	}
}
