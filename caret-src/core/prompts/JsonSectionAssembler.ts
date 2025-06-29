import { CaretLogger } from "../../utils/caret-logger"
import { JsonTemplateLoader } from "./JsonTemplateLoader"

/**
 * JSON Section Assembler
 *
 * Handles JSON section loading and assembly for system prompts
 * Separated from CaretSystemPrompt for KISS principle
 */
export class JsonSectionAssembler {
	private caretLogger: CaretLogger
	private templateLoader: JsonTemplateLoader

	constructor(templateLoader: JsonTemplateLoader) {
		this.caretLogger = CaretLogger.getInstance()
		this.templateLoader = templateLoader
	}

	/**
	 * Load and assemble base JSON sections
	 */
	async loadBaseSections(mode: "chatbot" | "agent" = "agent"): Promise<string[]> {
		const sections: string[] = []
		const sectionOrder = [
			"BASE_PROMPT_INTRO",
			"COLLABORATIVE_PRINCIPLES",
			"TOOLS_HEADER",
			"TOOL_USE_FORMAT",
			"TOOL_DEFINITIONS",
			"TOOL_USE_EXAMPLES",
			"TOOL_USE_GUIDELINES",
			"CHATBOT_AGENT_MODES",
		]

		for (const sectionName of sectionOrder) {
			try {
				const template = await this.templateLoader.loadTemplate(sectionName)
				const formatted = this.formatJsonSection(template, mode)
				sections.push(formatted)
				this.caretLogger.debug(`Loaded section ${sectionName} (${formatted.length} chars, mode: ${mode})`)
			} catch (error) {
				this.caretLogger.warn(`Failed to load ${sectionName} section: ${error}`)
			}
		}

		return sections
	}

	/**
	 * Generate dynamic sections (MCP, system info)
	 */
	async generateDynamicSections(cwd: string, mcpHub: any): Promise<string[]> {
		const sections: string[] = []

		// MCP servers section
		const mcpSection = await this.generateMcpServerSection(mcpHub)
		sections.push(mcpSection)

		// System information section
		const systemSection = await this.generateSystemInfoSection(cwd)
		sections.push(systemSection)

		return sections
	}

	/**
	 * Add conditional sections (browser, Claude4)
	 */
	async addConditionalSections(
		supportsBrowserUse: boolean,
		browserSettings: any,
		isClaude4ModelFamily: boolean,
	): Promise<string[]> {
		const sections: string[] = []

		if (supportsBrowserUse) {
			const browserSection = await this.generateBrowserSection(browserSettings)
			sections.push(browserSection)
		}

		if (isClaude4ModelFamily) {
			const claude4Section = await this.generateClaude4Section()
			sections.push(claude4Section)
		}

		return sections
	}

	/**
	 * Load final sections
	 */
	async loadFinalSections(): Promise<string[]> {
		const sections: string[] = []

		try {
			const template = await this.templateLoader.loadTemplate("OBJECTIVE")
			const formatted = this.formatJsonSection(template)
			sections.push(formatted)
		} catch (error) {
			this.caretLogger.warn(`Failed to load OBJECTIVE section: ${error}`)
		}

		return sections
	}

	/**
	 * Format JSON template section
	 */
	private formatJsonSection(template: any, mode?: string): string {
		if (!template?.add?.sections) {
			return ""
		}

		const sections = template.add.sections
		let result = ""

		for (const section of sections) {
			// Apply mode filtering if specified
			if (mode && section.mode && section.mode !== mode) {
				continue
			}

			result += section.content + "\n"
		}

		// Handle tools section for TOOL_DEFINITIONS
		if (template.tools && typeof template.tools === "object") {
			this.caretLogger.debug(`Found tools section with ${Object.keys(template.tools).length} tools`)
			result += "\n" // Add spacing before tools

			for (const [toolName, toolDef] of Object.entries(template.tools)) {
				if (typeof toolDef === "object" && toolDef !== null && "title" in toolDef) {
					const tool = toolDef as any
					result += `\n## ${tool.title}\n`
					if (tool.description) {
						result += `Description: ${tool.description}\n`
					}
					if (tool.parameters && Array.isArray(tool.parameters)) {
						result += `Parameters:\n`
						for (const param of tool.parameters) {
							result += `- ${param.name}${param.required ? " (required)" : " (optional)"}: ${param.description}\n`
						}
					}
					if (tool.usage) {
						result += `Usage:\n${tool.usage}\n`
					}
				}
			}
		}

		return result.trim()
	}

	/**
	 * Generate MCP server section
	 */
	private async generateMcpServerSection(mcpHub: any): Promise<string> {
		try {
			const servers = mcpHub?.getServers?.() ?? []

			if (servers.length === 0) {
				return `\n====\n\nMCP SERVERS\n\n(No MCP servers currently connected)\n`
			}

			let section = `\n====\n\nMCP SERVERS\n\nConnected servers:\n`
			for (const server of servers) {
				section += `- ${server.name}: ${server.description || "No description"}\n`
			}
			return section
		} catch (error) {
			this.caretLogger.warn(`Failed to generate MCP section: ${error}`)
			return `\n====\n\nMCP SERVERS\n\n(Error loading MCP servers)\n`
		}
	}

	/**
	 * Generate system information section
	 */
	private async generateSystemInfoSection(cwd: string): Promise<string> {
		const osInfo = process.platform + " " + process.version
		return `\n====\n\nSYSTEM INFORMATION\n\nOperating System: ${osInfo}\nWorking Directory: ${cwd}\n`
	}

	/**
	 * Generate browser section
	 */
	private async generateBrowserSection(browserSettings: any): Promise<string> {
		const viewport = browserSettings?.viewport || { width: 1280, height: 720 }
		return `\n====\n\nBROWSER SUPPORT\n\nBrowser automation is enabled with Puppeteer.\nViewport: ${viewport.width}x${viewport.height}\nAvailable browser_action tool for web interaction.\n`
	}

	/**
	 * Generate Claude 4 section
	 */
	private async generateClaude4Section(): Promise<string> {
		return `\n====\n\nCLAUDE 4 FEATURES\n\nAdvanced Claude 4 model features are enabled.\n`
	}

	/**
	 * Assemble final prompt from sections
	 */
	assembleFinalPrompt(sections: string[]): string {
		const prompt = sections.filter((s) => s.trim().length > 0).join("\n\n")

		this.caretLogger.debug(`Final prompt assembled - sections: ${sections.length}, length: ${prompt.length}`)

		return prompt
	}
}
