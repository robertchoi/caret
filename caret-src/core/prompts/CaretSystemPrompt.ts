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
			this.caretLogger.info(`[CaretSystemPrompt] Generating system prompt - cwd: ${context.cwd}, browser: ${context.supportsBrowserUse}, claude4: ${context.isClaude4ModelFamily}, mcpServers: ${context.mcpHub.getServers().length}`)

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
			this.caretLogger.info(`[CaretSystemPrompt] Generating system prompt with templates - cwd: ${context.cwd}, templates: [${templateNames.join(', ')}], count: ${templateNames.length}`)

			// Step 1: Generate base prompt from Cline
			const basePrompt = await this.callOriginalSystemPrompt(context)
			this.caretLogger.info("[CaretSystemPrompt] Base prompt generated", {
				basePromptLength: basePrompt.length,
			})

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
						this.caretLogger.info("[CaretSystemPrompt] Template applied successfully", {
							templateName,
							templateVersion: template.metadata.version,
							promptLengthChange: overlayResult.prompt.length - basePrompt.length,
						})
					} else {
						this.caretLogger.warn("[CaretSystemPrompt] Template application failed", {
							templateName,
							warnings: overlayResult.warnings,
						})
					}
				} catch (error) {
					this.caretLogger.error("[CaretSystemPrompt] Template loading failed", {
						templateName,
						error: error.toString(),
					})
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
		isClaude4ModelFamily: boolean = false
	): Promise<string> {
		const startTime = Date.now()

		try {
			this.caretLogger.info("[CaretSystemPrompt] Generating system prompt from JSON sections", {
				cwd,
				supportsBrowserUse,
				isClaude4ModelFamily,
				mcpServerCount: mcpHub?.getServers?.()?.length ?? 0,
			})

			// Step 1: Load and assemble base JSON sections
			const baseSections = await this.loadAndAssembleBaseSections()

			// Step 2: Generate dynamic sections (MCP, system info)  
			const dynamicSections = await this.generateDynamicSections(cwd, mcpHub)

			// Step 3: Add conditional sections (browser, Claude4)
			const conditionalSections = await this.addConditionalSections(
				supportsBrowserUse,
				browserSettings,
				isClaude4ModelFamily
			)

			// Step 4: Assemble final prompt
			const finalPrompt = this.assembleFinalPrompt([
				...baseSections,
				...dynamicSections, 
				...conditionalSections
			])

			// Log metrics
			const generationTime = Date.now() - startTime
			this.caretLogger.info("[CaretSystemPrompt] JSON sections prompt generated", {
				promptLength: finalPrompt.length,
				generationTime,
				sectionCount: baseSections.length + dynamicSections.length + conditionalSections.length,
			})

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
				isClaude4ModelFamily
			})
		}
	}

	/**
	 * Load and assemble base JSON sections in correct order
	 */
	private async loadAndAssembleBaseSections(): Promise<string[]> {
		const SECTION_ORDER = [
			'BASE_PROMPT_INTRO',      // "You are..." introduction
			'COLLABORATIVE_PRINCIPLES', // Caret's collaborative attitudes + meta-guidelines
			'TOOLS_HEADER',           // "TOOL USE" section header
			'TOOL_USE_FORMAT',        // XML formatting explanation
			'TOOL_DEFINITIONS',       // All tool definitions
			'TOOL_USE_EXAMPLES',      // Tool usage examples
			'TOOL_USE_GUIDELINES',    // Tool usage guidelines
			'ASK_AGENT_MODES',        // Caret's Ask/Agent mode (improved from Plan/Act)
		]

		const sections: string[] = []

		for (const sectionName of SECTION_ORDER) {
			try {
				const template = await this.templateLoader.loadTemplate(sectionName)
				const sectionContent = this.formatJsonSection(template)
				sections.push(sectionContent)
				
				this.caretLogger.debug("[CaretSystemPrompt] Loaded section", {
					sectionName,
					contentLength: sectionContent.length
				})
			} catch (error) {
				this.caretLogger.warn("[CaretSystemPrompt] Failed to load section", {
					sectionName,
					error: error.toString()
				})
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
		isClaude4ModelFamily: boolean
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
			const objectiveTemplate = await this.templateLoader.loadTemplate('OBJECTIVE')
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
				if (server.status === 'connected') {
					mcpSection += `## ${server.name}\n`
					
					// Add tools if available
					if (server.tools && server.tools.length > 0) {
						mcpSection += `### Available Tools\n`
						for (const tool of server.tools) {
							mcpSection += `- ${tool.name}: ${tool.description || 'No description'}\n`
						}
						mcpSection += `\n`
					}

					// Add resources if available  
					if (server.resources && server.resources.length > 0) {
						mcpSection += `### Resources\n`
						for (const resource of server.resources) {
							mcpSection += `- ${resource.uri}: ${resource.description || 'No description'}\n`
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
			const os = await import('os')
			
			const systemInfo = `\n\n====\n\nSYSTEM INFORMATION\n\n` +
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
		
		return `\n\n====\n\nBROWSER SUPPORT\n\n` +
			`Browser automation is enabled with Puppeteer.\n` +
			`Viewport: ${viewport.width}x${viewport.height}\n` +
			`Available browser_action tool for web interaction.\n`
	}

	/**
	 * Generate Claude4 specific features section
	 */
	private async generateClaude4Section(): Promise<string> {
		return `\n\n====\n\nCLAUDE 4 FEATURES\n\n` +
			`Advanced reasoning and analysis capabilities enabled.\n` +
			`Enhanced context understanding for complex tasks.\n`
	}

	/**
	 * Format JSON template to string content
	 */
	private formatJsonSection(template: any): string {
		if (typeof template === 'string') {
			return template
		}

		// Handle different JSON template formats
		if (template.content) {
			return template.content
		}

		if (template.introduction) {
			// Handle BASE_PROMPT_INTRO format
			let content = template.introduction + '\n\n'
			
			if (template.tool_use_header) {
				content += `====\n\n${template.tool_use_header}\n\n`
			}
			
			if (template.tool_use_description) {
				content += template.tool_use_description + '\n\n'
			}

			return content
		}

		// Handle ASK_AGENT_MODES format  
		if (template.title && template.agent_mode && template.ask_mode) {
			let content = `\n\n====\n\n${template.title}\n\n`
			content += `${template.mode_description}\n\n`
			content += `- ${template.agent_mode.title}: ${template.agent_mode.description}\n`
			content += ` - ${template.agent_mode.behavior}\n`
			content += ` - ${template.agent_mode.philosophy}\n`
			content += `- ${template.ask_mode.title}: ${template.ask_mode.description}\n`
			content += ` - ${template.ask_mode.behavior}\n`
			content += ` - ${template.ask_mode.guidance}\n\n`
			
			if (template.mode_philosophy) {
				content += `## ${template.mode_philosophy.title}\n\n`
				content += `${template.mode_philosophy.agent_default}\n`
				content += `${template.mode_philosophy.ask_safety}\n`
				content += `${template.mode_philosophy.natural_choice}\n`
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
		const validSections = sections.filter(section => section && section.trim().length > 0)
		return validSections.join('\n')
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
		this.caretLogger.info("[CaretSystemPrompt] System prompt generated successfully", {
			promptLength: result.length,
			generationTime: metrics.generationTime,
			toolCount: metrics.toolCount,
			mcpServerCount: metrics.mcpServerCount,
			firstLine: result.split("\n")[0].substring(0, 100),
			endsWithObjective: result.includes("OBJECTIVE"),
		})

		// Performance warning (5ms threshold)
		if (metrics.generationTime > 5) {
			this.caretLogger.warn("[CaretSystemPrompt] Slow prompt generation detected", {
				generationTime: metrics.generationTime,
				threshold: 5,
			})
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
		this.caretLogger.info("[CaretSystemPrompt] Enhanced system prompt generated successfully", {
			basePromptLength: basePrompt.length,
			enhancedPromptLength: enhancedPrompt.length,
			enhancementRatio: metrics.enhancementRatio,
			generationTime: metrics.generationTime,
			toolCount: metrics.toolCount,
			mcpServerCount: metrics.mcpServerCount,
			appliedTemplates,
			templatesApplied: appliedTemplates.length,
			lengthIncrease: enhancedPrompt.length - basePrompt.length,
		})

		// Performance warning (10ms threshold for enhanced prompts)
		if (metrics.generationTime > 10) {
			this.caretLogger.warn("[CaretSystemPrompt] Slow enhanced prompt generation detected", {
				generationTime: metrics.generationTime,
				threshold: 10,
				templatesApplied: appliedTemplates.length,
			})
		}

		// Log template application summary
		if (appliedTemplates.length > 0) {
			this.caretLogger.info("[CaretSystemPrompt] Template application summary", {
				successfulTemplates: appliedTemplates,
				enhancementPercentage: Math.round((metrics.enhancementRatio! - 1) * 100),
				avgLengthPerTemplate: Math.round((enhancedPrompt.length - basePrompt.length) / appliedTemplates.length),
			})
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
		if (this.metrics.length === 0) { return 0 }

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
}
