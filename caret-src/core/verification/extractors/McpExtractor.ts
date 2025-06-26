/**
 * MCP Extraction Module
 *
 * Handles extraction of MCP server information from Cline system prompts.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import { McpServerInfo, McpToolDefinition, McpResourceTemplate, McpResourceDefinition } from "../types"

export class McpExtractor {
	private caretLogger: CaretLogger

	// MCP detection patterns
	private static readonly PATTERNS = {
		SERVER_SECTION: /^## (.+) \(`([^`]+)`\)\s*$/gm,
		TOOLS_SECTION: /### Available Tools\s*$([\s\S]*?)^(?=###|\n##|\Z)/m,
		RESOURCES_SECTION: /### Resource Templates\s*$([\s\S]*?)^(?=###|\n##|\Z)/m,
		DIRECT_RESOURCES: /### Direct Resources\s*$([\s\S]*?)^(?=###|\n##|\Z)/m,
	}

	constructor() {
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Extract MCP server information from system prompt
	 */
	async extractMcpServers(prompt: string): Promise<McpServerInfo[]> {
		const servers: McpServerInfo[] = []

		try {
			this.caretLogger.debug("[McpExtractor] Starting MCP server extraction", "EXTRACTION")

			// Look for MCP server sections
			const serverMatches = Array.from(prompt.matchAll(McpExtractor.PATTERNS.SERVER_SECTION))

			for (const match of serverMatches) {
				const serverName = match[1]
				const config = match[2]

				// Find the server section content
				const startIndex = match.index!
				const nextServerMatch = prompt.slice(startIndex + match[0].length).match(McpExtractor.PATTERNS.SERVER_SECTION)
				const endIndex = nextServerMatch
					? startIndex + match[0].length + nextServerMatch.index!
					: prompt.indexOf("====", startIndex + match[0].length)

				const serverSection = prompt.slice(startIndex, endIndex > 0 ? endIndex : prompt.length)

				// Extract tools, resource templates, and resources
				const tools = await this.extractMcpTools(serverSection)
				const resourceTemplates = await this.extractMcpResourceTemplates(serverSection)
				const resources = await this.extractMcpResources(serverSection)

				servers.push({
					name: serverName,
					config,
					tools,
					resourceTemplates,
					resources,
				})
			}

			this.caretLogger.debug(`[McpExtractor] Extracted ${servers.length} MCP servers`, "EXTRACTION")
			return servers
		} catch (error) {
			this.caretLogger.error("[McpExtractor] MCP server extraction failed", "EXTRACTION")
			throw error
		}
	}

	/**
	 * Extract MCP tools from server section
	 */
	private async extractMcpTools(serverSection: string): Promise<McpToolDefinition[]> {
		const tools: McpToolDefinition[] = []

		try {
			const toolsMatch = serverSection.match(McpExtractor.PATTERNS.TOOLS_SECTION)
			if (!toolsMatch) return tools

			const toolsSection = toolsMatch[1]
			const toolLines = toolsSection.split("\n").filter((line) => line.trim().startsWith("-"))

			for (const line of toolLines) {
				const match = line.match(/^-\s*(\w+):\s*(.+)$/)
				if (match) {
					tools.push({
						name: match[1],
						description: match[2].trim(),
					})
				}
			}
		} catch (error) {
			this.caretLogger.warn(`[McpExtractor] MCP tools extraction failed: ${error}`, "EXTRACTION")
		}

		return tools
	}

	/**
	 * Extract MCP resource templates from server section
	 */
	private async extractMcpResourceTemplates(serverSection: string): Promise<McpResourceTemplate[]> {
		const templates: McpResourceTemplate[] = []

		try {
			const templatesMatch = serverSection.match(McpExtractor.PATTERNS.RESOURCES_SECTION)
			if (!templatesMatch) return templates

			const templatesSection = templatesMatch[1]
			const templateLines = templatesSection.split("\n").filter((line) => line.trim().startsWith("-"))

			for (const line of templateLines) {
				const match = line.match(/^-\s*(.+?):\s*(.+)$/)
				if (match) {
					templates.push({
						pattern: match[1].trim(),
						description: match[2].trim(),
					})
				}
			}
		} catch (error) {
			this.caretLogger.warn(`[McpExtractor] MCP resource templates extraction failed: ${error}`, "EXTRACTION")
		}

		return templates
	}

	/**
	 * Extract MCP direct resources from server section
	 */
	private async extractMcpResources(serverSection: string): Promise<McpResourceDefinition[]> {
		const resources: McpResourceDefinition[] = []

		try {
			const resourcesMatch = serverSection.match(McpExtractor.PATTERNS.DIRECT_RESOURCES)
			if (!resourcesMatch) return resources

			const resourcesSection = resourcesMatch[1]
			const resourceLines = resourcesSection.split("\n").filter((line) => line.trim().startsWith("-"))

			for (const line of resourceLines) {
				const match = line.match(/^-\s*(.+?):\s*(.+)$/)
				if (match) {
					resources.push({
						uri: match[1].trim(),
						description: match[2].trim(),
					})
				}
			}
		} catch (error) {
			this.caretLogger.warn(`[McpExtractor] MCP resources extraction failed: ${error}`, "EXTRACTION")
		}

		return resources
	}

	/**
	 * Validate MCP server configuration format
	 */
	validateServerConfig(config: string): boolean {
		try {
			// Basic validation - should start with npx or be a valid command
			return config.includes("npx") || config.includes("/") || config.includes("\\")
		} catch {
			return false
		}
	}

	/**
	 * Get total tool count across all servers
	 */
	getTotalToolCount(servers: McpServerInfo[]): number {
		return servers.reduce((total, server) => total + server.tools.length, 0)
	}

	/**
	 * Get total resource count across all servers
	 */
	getTotalResourceCount(servers: McpServerInfo[]): number {
		return servers.reduce((total, server) => total + server.resourceTemplates.length + server.resources.length, 0)
	}
}
