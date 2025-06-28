import { SYSTEM_PROMPT } from "../../../src/core/prompts/system"
import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptContext, SystemPromptMetrics, SystemPromptResult } from "./types"
import { JsonTemplateLoader } from "./JsonTemplateLoader"
import { PromptOverlayEngine } from "./PromptOverlayEngine"
import { promises as fs } from "fs"
import * as path from "path"

/**
 * Caret System Prompt Wrapper
 *
 * Wraps Cline's original SYSTEM_PROMPT function to provide:
 * - 100% compatibility with Cline
 * - Metrics collection
 * - JSON overlay capabilities for prompt customization
 *
 * Design Principles:
 * - KISS (Keep It Simple, Stupid) - Just wrap, don't modify
 * - 100% feature preservation
 * - Minimal overhead
 * - JSON overlay system for advanced customization
 * - Singleton pattern for extensionPath management (CARET MODIFICATION)
 */
export class CaretSystemPrompt {
	private static instance: CaretSystemPrompt
	private caretLogger: CaretLogger
	private metrics: SystemPromptMetrics[]
	private templateLoader: JsonTemplateLoader
	private overlayEngine: PromptOverlayEngine

	constructor(extensionPath: string, isTestEnvironment: boolean = false) {
		this.caretLogger = CaretLogger.getInstance()
		this.metrics = []
		this.templateLoader = new JsonTemplateLoader(extensionPath, isTestEnvironment)
		this.overlayEngine = new PromptOverlayEngine()

		if (isTestEnvironment) {
			this.caretLogger.info("[CaretSystemPrompt] Initialized with JSON overlay system (TEST MODE)")
		} else {
			this.caretLogger.info("[CaretSystemPrompt] Initialized with JSON overlay system")
		}
	}

	/**
	 * Get singleton instance (CARET MODIFICATION for extensionPath management)
	 * This solves the extensionPath parameter issue in system.ts integration
	 */
	static getInstance(extensionPath?: string): CaretSystemPrompt {
		if (!CaretSystemPrompt.instance) {
			if (!extensionPath) {
				throw new Error("[CaretSystemPrompt] extensionPath required for first initialization")
			}
			CaretSystemPrompt.instance = new CaretSystemPrompt(extensionPath)
		}
		return CaretSystemPrompt.instance
	}

	/**
	 * Generate system prompt with Cline compatibility
	 */
	async generateSystemPrompt(context: SystemPromptContext): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`Generating system prompt - cwd: ${context.cwd}, browser: ${context.supportsBrowserUse}, claude4: ${context.isClaude4ModelFamily}, mcpServers: ${context.mcpHub.getServers().length}`,
				"CaretSystemPrompt",
			)

			// Call Cline original SYSTEM_PROMPT exactly as-is
			const prompt = await this.callOriginalSystemPrompt(context)

			// Collect metrics
			const metrics: SystemPromptMetrics = {
				generationTime: Date.now() - startTime,
				promptLength: prompt.length,
				toolCount: this.extractToolCount(prompt),
				mcpServerCount: context.mcpHub.getServers().length,
				timestamp: Date.now(),
			}

			this.metrics.push(metrics)
			await this.logPromptGeneration(context, prompt, metrics)

			return {
				prompt,
				metrics,
			}
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate system prompt", error)
			throw error
		}
	}

	/**
	 * Generate system prompt with JSON template overlay
	 *
	 * @param context System prompt context
	 * @param templateNames Array of template names to apply
	 * @returns Promise<SystemPromptResult> Enhanced prompt with templates applied
	 */
	async generateSystemPromptWithTemplates(context: SystemPromptContext, templateNames: string[]): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`Generating system prompt with templates - cwd: ${context.cwd}, templates: [${templateNames.join(", ")}], count: ${templateNames.length}`,
				"CaretSystemPrompt",
			)

			// Step 1: Generate base prompt from Cline
			const basePrompt = await this.callOriginalSystemPrompt(context)
			this.caretLogger.info(`Base prompt generated - length: ${basePrompt.length}`, "CaretSystemPrompt")

			// Step 2: Apply JSON templates
			let enhancedPrompt = basePrompt
			const appliedTemplates: string[] = []

			for (const templateName of templateNames) {
				try {
					const template = await this.templateLoader.loadTemplate(templateName)
					const overlayResult = await this.overlayEngine.applyOverlay(enhancedPrompt, template)

					if (overlayResult.success) {
						enhancedPrompt = overlayResult.prompt
						appliedTemplates.push(templateName)
						this.caretLogger.info(
							`Template applied successfully - ${templateName} v${template.metadata.version}, length change: ${overlayResult.prompt.length - basePrompt.length}`,
							"CaretSystemPrompt",
						)
					} else {
						this.caretLogger.warn(
							`Template application failed - ${templateName}: ${overlayResult.warnings.join(", ")}`,
							"CaretSystemPrompt",
						)
					}
				} catch (error) {
					this.caretLogger.error(`Template loading failed - ${templateName}: ${error.toString()}`, "CaretSystemPrompt")
				}
			}

			// Step 3: Collect enhanced metrics
			const metrics: SystemPromptMetrics = {
				generationTime: Date.now() - startTime,
				promptLength: enhancedPrompt.length,
				toolCount: this.extractToolCount(enhancedPrompt),
				mcpServerCount: context.mcpHub.getServers().length,
				timestamp: Date.now(),
				appliedTemplates,
				enhancementRatio: enhancedPrompt.length / basePrompt.length,
			}

			this.metrics.push(metrics)
			await this.logEnhancedPromptGeneration(context, basePrompt, enhancedPrompt, metrics, appliedTemplates)

			return {
				prompt: enhancedPrompt,
				metrics,
			}
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate enhanced system prompt", error)
			throw error
		}
	}

	/**
	 * Generate system prompt from JSON sections (NEW METHOD for 003-04)
	 *
	 * Replaces Cline's hardcoded 707-line system prompt with JSON-based composition
	 * while maintaining 100% feature compatibility
	 */
	async generateFromJsonSections(
		cwd: string,
		supportsBrowserUse: boolean,
		mcpHub: any, // McpHub type
		browserSettings: any, // BrowserSettings type
		isClaude4ModelFamily: boolean = false,
		mode: "chatbot" | "agent" = "agent", // CARET MODIFICATION: Chatbot/Agent 모드 지원 추가
		modeSystem?: string, // CARET MODIFICATION: Plan/Act 모드 지원 추가
	): Promise<string> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`Generating system prompt from JSON sections - cwd: ${cwd}, browser: ${supportsBrowserUse}, claude4: ${isClaude4ModelFamily}, mode: ${mode}, mcpServers: ${mcpHub?.getServers?.()?.length ?? 0}`,
				"CaretSystemPrompt",
			)

			// Step 1: Load and assemble base JSON sections
			const baseSections = await this.loadAndAssembleBaseSections(mode, modeSystem)

			// Step 2: Generate dynamic sections (MCP, system info)
			const dynamicSections = await this.generateDynamicSections(cwd, mcpHub)

			// Step 3: Add conditional sections (browser, Claude4)
			const conditionalSections = await this.addConditionalSections(
				supportsBrowserUse,
				browserSettings,
				isClaude4ModelFamily,
			)

			// Step 4: Assemble final prompt
			const finalPrompt = this.assembleFinalPrompt([...baseSections, ...dynamicSections, ...conditionalSections])

			// Log metrics
			const generationTime = Date.now() - startTime
			this.caretLogger.info(
				`JSON sections prompt generated - length: ${finalPrompt.length}, time: ${generationTime}ms, sections: ${baseSections.length + dynamicSections.length + conditionalSections.length}`,
				"CaretSystemPrompt",
			)

			return finalPrompt
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate from JSON sections", error)

			// Fallback to original Cline prompt for safety
			this.caretLogger.warn("[CaretSystemPrompt] Falling back to original Cline prompt")
			return await this.callOriginalSystemPrompt({
				cwd,
				supportsBrowserUse,
				mcpHub,
				browserSettings,
				isClaude4ModelFamily,
			})
		}
	}

	/**
	 * Load and assemble base JSON sections in correct order
	 */
	private async loadAndAssembleBaseSections(mode: "chatbot" | "agent" = "agent", modeSystem?: string): Promise<string[]> {
		const SECTION_ORDER = [
			"BASE_PROMPT_INTRO", // "You are..." introduction
			"COLLABORATIVE_PRINCIPLES", // Caret's collaborative attitudes + meta-guidelines
			"TOOLS_HEADER", // "TOOL USE" section header
			"TOOL_USE_FORMAT", // XML formatting explanation
			"TOOL_DEFINITIONS", // All tool definitions
			"TOOL_USE_EXAMPLES", // Tool usage examples
			"TOOL_USE_GUIDELINES", // Tool usage guidelines
			"CHATBOT_AGENT_MODES", // Caret's Chatbot/Agent mode (improved from Plan/Act)
		]

		const sections: string[] = []

		for (const sectionName of SECTION_ORDER) {
			try {
				const template = await this.templateLoader.loadTemplate(sectionName)

				// CARET MODIFICATION: mode별 도구 필터링 적용
				let sectionContent: string
				if (sectionName === "TOOL_DEFINITIONS") {
					sectionContent = this.formatJsonSection(this.filterToolsByMode(template, mode, modeSystem))
				} else {
					sectionContent = this.formatJsonSection(template)
				}

				sections.push(sectionContent)

				this.caretLogger.debug(
					`Loaded section ${sectionName} (${sectionContent.length} chars, mode: ${mode})`,
					"CaretSystemPrompt",
				)
			} catch (error) {
				this.caretLogger.warn(`Failed to load section ${sectionName}: ${error.toString()}`, "CaretSystemPrompt")
				// Continue with other sections
			}
		}

		return sections
	}

	/**
	 * Generate dynamic sections (MCP servers, system info, etc.)
	 */
	private async generateDynamicSections(cwd: string, mcpHub: any): Promise<string[]> {
		const sections: string[] = []

		// MCP Servers section (dynamic)
		if (mcpHub?.getServers) {
			const mcpSection = await this.generateMcpServerSection(mcpHub)
			if (mcpSection) {
				sections.push(mcpSection)
			}
		}

		// System Information section (dynamic)
		const systemInfoSection = await this.generateSystemInfoSection(cwd)
		sections.push(systemInfoSection)

		return sections
	}

	/**
	 * Add conditional sections based on settings
	 */
	private async addConditionalSections(
		supportsBrowserUse: boolean,
		browserSettings: any,
		isClaude4ModelFamily: boolean,
	): Promise<string[]> {
		const sections: string[] = []

		// Browser support section (conditional)
		if (supportsBrowserUse) {
			const browserSection = await this.generateBrowserSection(browserSettings)
			sections.push(browserSection)
		}

		// Claude4 features section (conditional)
		if (isClaude4ModelFamily) {
			const claude4Section = await this.generateClaude4Section()
			sections.push(claude4Section)
		}

		// Final objective section (always included)
		try {
			const objectiveTemplate = await this.templateLoader.loadTemplate("OBJECTIVE")
			const objectiveSection = this.formatJsonSection(objectiveTemplate)
			sections.push(objectiveSection)
		} catch (error) {
			this.caretLogger.warn("[CaretSystemPrompt] Failed to load OBJECTIVE section", error)
			// Add fallback objective
			sections.push(`\n\n====\n\nOBJECTIVE\n\nYou accomplish tasks iteratively, step by step.`)
		}

		return sections
	}

	/**
	 * Generate MCP servers section dynamically
	 */
	private async generateMcpServerSection(mcpHub: any): Promise<string> {
		try {
			const servers = mcpHub.getServers()
			if (!servers || servers.length === 0) {
				return "\n\n====\n\nMCP SERVERS\n\n(No MCP servers currently connected)"
			}

			let mcpSection = "\n\n====\n\nMCP SERVERS\n\n# Connected MCP Servers\n\n"

			for (const server of servers) {
				if (server.status === "connected") {
					mcpSection += `## ${server.name}\n`

					// Add tools if available
					if (server.tools && server.tools.length > 0) {
						mcpSection += `### Available Tools\n`
						for (const tool of server.tools) {
							mcpSection += `- ${tool.name}: ${tool.description || "No description"}\n`
						}
						mcpSection += `\n`
					}

					// Add resources if available
					if (server.resources && server.resources.length > 0) {
						mcpSection += `### Resources\n`
						for (const resource of server.resources) {
							mcpSection += `- ${resource.uri}: ${resource.description || "No description"}\n`
						}
						mcpSection += `\n`
					}
				}
			}

			return mcpSection
		} catch (error) {
			this.caretLogger.warn("[CaretSystemPrompt] Failed to generate MCP section", error)
			return "\n\n====\n\nMCP SERVERS\n\n(Error loading MCP servers)"
		}
	}

	/**
	 * Generate system information section dynamically
	 */
	private async generateSystemInfoSection(cwd: string): Promise<string> {
		try {
			// Import os modules dynamically to handle potential missing dependencies
			const os = await import("os")

			const systemInfo =
				`\n\n====\n\nSYSTEM INFORMATION\n\n` +
				`Operating System: ${os.platform()} ${os.release()}\n` +
				`Working Directory: ${cwd}\n`

			return systemInfo
		} catch (error) {
			this.caretLogger.warn("[CaretSystemPrompt] Failed to generate system info", error)
			return `\n\n====\n\nSYSTEM INFORMATION\n\nWorking Directory: ${cwd}\n`
		}
	}

	/**
	 * Generate browser support section
	 */
	private async generateBrowserSection(browserSettings: any): Promise<string> {
		const viewport = browserSettings?.viewport || { width: 1024, height: 768 }

		return (
			`\n\n====\n\nBROWSER SUPPORT\n\n` +
			`Browser automation is enabled with Puppeteer.\n` +
			`Viewport: ${viewport.width}x${viewport.height}\n` +
			`Available browser_action tool for web interaction.\n`
		)
	}

	/**
	 * Generate Claude4 specific features section
	 */
	private async generateClaude4Section(): Promise<string> {
		return (
			`\n\n====\n\nCLAUDE 4 FEATURES\n\n` +
			`Advanced reasoning and analysis capabilities enabled.\n` +
			`Enhanced context understanding for complex tasks.\n`
		)
	}

	/**
	 * Format JSON template to string content
	 */
	private formatJsonSection(template: any): string {
		if (typeof template === "string") {
			return template
		}

		// Handle different JSON template formats
		if (template.content) {
			return template.content
		}

		if (template.introduction) {
			// Handle BASE_PROMPT_INTRO format
			let content = template.introduction + "\n\n"

			if (template.tool_use_header) {
				content += `====\n\n${template.tool_use_header}\n\n`
			}

			if (template.tool_use_description) {
				content += template.tool_use_description + "\n\n"
			}

			return content
		}

		// Handle CHATBOT_AGENT_MODES format
		if (template.title && template.agent_mode && template.chatbot_mode) {
			let content = `\n\n====\n\n${template.title}\n\n`
			content += `${template.mode_description}\n\n`

			// Agent Mode 섹션
			content += `## ${template.agent_mode.title}\n\n`
			content += `${template.agent_mode.description}\n\n`

			if (template.agent_mode.capabilities) {
				content += `**Capabilities:**\n`
				for (const capability of template.agent_mode.capabilities) {
					content += `- ${capability}\n`
				}
				content += `\n`
			}

			if (template.agent_mode.available_tools) {
				content += `**Available Tools:** ${template.agent_mode.available_tools}\n\n`
			}

			content += `**Behavior:** ${template.agent_mode.behavior}\n\n`
			content += `**Philosophy:** ${template.agent_mode.philosophy}\n\n`

			// Chatbot Mode 섹션
			content += `## ${template.chatbot_mode.title}\n\n`
			content += `${template.chatbot_mode.description}\n\n`

			if (template.chatbot_mode.capabilities) {
				content += `**Capabilities:**\n`
				for (const capability of template.chatbot_mode.capabilities) {
					content += `- ${capability}\n`
				}
				content += `\n`
			}

			if (template.chatbot_mode.available_tools) {
				content += `**Available Tools:** ${template.chatbot_mode.available_tools}\n\n`
			}

			content += `**Behavior:** ${template.chatbot_mode.behavior}\n\n`
			content += `**Guidance:** ${template.chatbot_mode.guidance}\n\n`

			// Mode Philosophy 섹션
			if (template.mode_philosophy) {
				content += `## ${template.mode_philosophy.title}\n\n`
				content += `- ${template.mode_philosophy.agent_default}\n`
				content += `- ${template.mode_philosophy.ask_safety}\n`
				content += `- ${template.mode_philosophy.natural_choice}\n`
			}

			return content
		}

		// Handle COLLABORATIVE_PRINCIPLES format
		if (template.title && template.quality_first && template.help_seeking) {
			let content = `\n\n====\n\n${template.title}\n\n`

			// Add each principle
			content += `${template.quality_first.principle}: ${template.quality_first.description}\n`
			content += `- ${template.quality_first.implementation}\n\n`

			content += `${template.help_seeking.principle}: ${template.help_seeking.description}\n`
			content += `- ${template.help_seeking.implementation}\n\n`

			content += `${template.verification_first.principle}: ${template.verification_first.description}\n`
			content += `- ${template.verification_first.implementation}\n\n`

			content += `${template.systematic_approach.principle}: ${template.systematic_approach.description}\n`
			content += `- ${template.systematic_approach.implementation}\n\n`

			// Add meta-guidelines
			if (template.meta_guidelines) {
				content += `## ${template.meta_guidelines.title}\n\n`
				content += `- ${template.meta_guidelines.trust_working_code}\n`
				content += `- ${template.meta_guidelines.focus_overall_flow}\n`
				content += `- ${template.meta_guidelines.knowledge_temporal}\n`
				content += `- ${template.meta_guidelines.request_improvements}\n`
				content += `- ${template.meta_guidelines.continuous_monitoring}\n`
			}

			return content
		}

		// Fallback: convert to string
		return JSON.stringify(template, null, 2)
	}

	/**
	 * Assemble final prompt from all sections
	 */
	private assembleFinalPrompt(sections: string[]): string {
		// Filter out empty sections and join with appropriate spacing
		const validSections = sections.filter((section) => section && section.trim().length > 0)
		return validSections.join("\n")
	}

	/**
	 * Call Cline's original SYSTEM_PROMPT function
	 * This is the core wrapper - must preserve 100% functionality
	 */
	private async callOriginalSystemPrompt(context: SystemPromptContext): Promise<string> {
		return await SYSTEM_PROMPT(
			context.cwd,
			context.supportsBrowserUse,
			context.mcpHub,
			context.browserSettings,
			context.isClaude4ModelFamily ?? false,
		)
	}

	/**
	 * Extract tool count from prompt (simple counting for metrics)
	 */
	private extractToolCount(prompt: string): number {
		// Simple regex to count ## tool_name patterns
		const toolMatches = prompt.match(/^## \w+$/gm)
		return toolMatches ? toolMatches.length : 0
	}

	/**
	 * Log prompt generation details
	 */
	private async logPromptGeneration(context: SystemPromptContext, result: string, metrics: SystemPromptMetrics): Promise<void> {
		this.caretLogger.info(
			"[CaretSystemPrompt] System prompt generated successfully",
			`promptLength: ${result.length}, generationTime: ${metrics.generationTime}ms, toolCount: ${metrics.toolCount}, mcpServerCount: ${metrics.mcpServerCount}, firstLine: "${result.split("\n")[0].substring(0, 100)}", endsWithObjective: ${result.includes("OBJECTIVE")}`,
		)

		// Performance warning (5ms threshold)
		if (metrics.generationTime > 5) {
			this.caretLogger.warn(
				"[CaretSystemPrompt] Slow prompt generation detected",
				`generationTime: ${metrics.generationTime}ms, threshold: 5ms`,
			)
		}
	}

	/**
	 * Log enhanced prompt generation details
	 */
	private async logEnhancedPromptGeneration(
		context: SystemPromptContext,
		basePrompt: string,
		enhancedPrompt: string,
		metrics: SystemPromptMetrics,
		appliedTemplates: string[],
	): Promise<void> {
		this.caretLogger.info(
			"[CaretSystemPrompt] Enhanced system prompt generated successfully",
			`basePromptLength: ${basePrompt.length}, enhancedPromptLength: ${enhancedPrompt.length}, enhancementRatio: ${metrics.enhancementRatio}, generationTime: ${metrics.generationTime}ms, toolCount: ${metrics.toolCount}, mcpServerCount: ${metrics.mcpServerCount}, templatesApplied: ${appliedTemplates.length}, lengthIncrease: ${enhancedPrompt.length - basePrompt.length}`,
		)

		// Performance warning (10ms threshold for enhanced prompts)
		if (metrics.generationTime > 10) {
			this.caretLogger.warn(
				"[CaretSystemPrompt] Slow enhanced prompt generation detected",
				`generationTime: ${metrics.generationTime}ms, threshold: 10ms, templatesApplied: ${appliedTemplates.length}`,
			)
		}

		// Log template application summary
		if (appliedTemplates.length > 0) {
			this.caretLogger.info(
				"[CaretSystemPrompt] Template application summary",
				`successfulTemplates: [${appliedTemplates.join(", ")}], enhancementPercentage: ${Math.round((metrics.enhancementRatio! - 1) * 100)}%, avgLengthPerTemplate: ${Math.round((enhancedPrompt.length - basePrompt.length) / appliedTemplates.length)}`,
			)
		}
	}

	/**
	 * Get all collected metrics
	 */
	getMetrics(): SystemPromptMetrics[] {
		return [...this.metrics]
	}

	/**
	 * Get average generation time
	 */
	getAverageGenerationTime(): number {
		if (this.metrics.length === 0) {
			return 0
		}

		const total = this.metrics.reduce((sum, m) => sum + m.generationTime, 0)
		return total / this.metrics.length
	}

	/**
	 * Clear metrics (for testing or memory management)
	 */
	clearMetrics(): void {
		this.metrics = []
		this.caretLogger.debug("[CaretSystemPrompt] Metrics cleared")
	}

	/**
	 * CARET MODIFICATION: Filter tools based on Chatbot/Agent and Plan/Act modes
	 */
	private filterToolsByMode(template: any, mode: "chatbot" | "agent", modeSystem?: string): any {
		// If not a tool definitions object, return as-is
		if (!template || !template.tools || !Array.isArray(template.tools)) {
			return template
		}

		const filteredTemplate = { ...template }

		// CARET MODIFICATION: Plan/Act 모드 구현 (Cline 원본 로직)
		if (modeSystem === "cline") {
			if (mode === "chatbot") {
				// Plan 모드: plan_mode_respond + 읽기 도구들만 허용
				const allowedTools = [
					"plan_mode_respond",
					"read_file",
					"search_files",
					"list_files",
					"list_code_definition_names",
					"ask_followup_question",
				]

				filteredTemplate.tools = template.tools.filter((tool: any) => allowedTools.includes(tool.name))

				this.caretLogger.info(
					`[CaretSystemPrompt] Plan mode tool filtering: ${filteredTemplate.tools.length}/${template.tools.length} tools (${filteredTemplate.tools.map((t: any) => t.name).join(", ")})`,
				)
			} else {
				// Act 모드: plan_mode_respond 제외한 모든 도구
				const blockedTools = ["plan_mode_respond"]

				filteredTemplate.tools = template.tools.filter((tool: any) => !blockedTools.includes(tool.name))

				this.caretLogger.info(
					`[CaretSystemPrompt] Act mode tool filtering: ${filteredTemplate.tools.length}/${template.tools.length} tools (blocked: ${blockedTools.join(", ")})`,
				)
			}
		} else {
			// Caret 모드: 기존 Chatbot/Agent 로직
			if (mode === "chatbot") {
				// Chatbot 모드: 읽기 전용 도구만 허용
				const allowedTools = ["read_file", "search_files", "list_files", "list_code_definition_names"]

				filteredTemplate.tools = template.tools.filter((tool: any) => allowedTools.includes(tool.name))

				this.caretLogger.info(
					`[CaretSystemPrompt] Chatbot mode tool filtering: ${filteredTemplate.tools.length}/${template.tools.length} tools (${filteredTemplate.tools.map((t: any) => t.name).join(", ")})`,
				)
			} else {
				// Agent 모드: plan_mode_respond 제외한 모든 도구 (Caret에서는 plan_mode_respond 사용 안함)
				const blockedTools = ["plan_mode_respond"]

				filteredTemplate.tools = template.tools.filter((tool: any) => !blockedTools.includes(tool.name))

				this.caretLogger.info(
					`[CaretSystemPrompt] Agent mode tool filtering: ${filteredTemplate.tools.length}/${template.tools.length} tools (blocked: ${blockedTools.join(", ")})`,
				)
			}
		}

		return filteredTemplate
	}
}
