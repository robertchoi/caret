import { SYSTEM_PROMPT } from "../../../src/core/prompts/system"
import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptContext, SystemPromptResult } from "./types"
import { JsonTemplateLoader } from "./JsonTemplateLoader"
import { PromptOverlayEngine } from "./PromptOverlayEngine"
import { PromptMetrics } from "./PromptMetrics"
import { JsonSectionAssembler } from "./JsonSectionAssembler"

/**
 * Caret System Prompt Wrapper
 *
 * Simple wrapper around Cline's SYSTEM_PROMPT with:
 * - 100% compatibility with Cline
 * - JSON overlay capabilities
 * - Metrics collection
 *
 * Design Principles:
 * - KISS (Keep It Simple, Stupid)
 * - Single responsibility: prompt generation
 * - Delegate complex tasks to specialized classes
 */
export class CaretSystemPrompt {
	private static instance: CaretSystemPrompt
	private caretLogger: CaretLogger
	private templateLoader: JsonTemplateLoader
	private overlayEngine: PromptOverlayEngine
	private metrics: PromptMetrics
	private assembler: JsonSectionAssembler

	constructor(extensionPath: string, isTestEnvironment: boolean = false) {
		this.caretLogger = CaretLogger.getInstance()
		this.templateLoader = new JsonTemplateLoader(extensionPath, isTestEnvironment)
		this.overlayEngine = new PromptOverlayEngine()
		this.metrics = PromptMetrics.getInstance()
		this.assembler = new JsonSectionAssembler(this.templateLoader)

		this.caretLogger.info("[CaretSystemPrompt] Initialized with JSON overlay system", "JSON_LOADER")
	}

	/**
	 * Singleton pattern for extensionPath management
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

			// Record metrics
			const metrics = this.metrics.recordMetrics(startTime, prompt, context)
			await this.metrics.logGeneration(context, prompt, metrics)

			return { prompt, metrics }
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate system prompt", error)
			throw error
		}
	}

	/**
	 * Generate system prompt with JSON template overlay
	 */
	async generateSystemPromptWithTemplates(context: SystemPromptContext, templateNames: string[]): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`Generating system prompt with templates - cwd: ${context.cwd}, templates: [${templateNames.join(", ")}], count: ${templateNames.length}`,
				"CaretSystemPrompt",
			)

			// Generate base prompt from Cline
			const basePrompt = await this.callOriginalSystemPrompt(context)
			this.caretLogger.info(`Base prompt generated - length: ${basePrompt.length}`, "CaretSystemPrompt")

			// Apply JSON templates
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
							`Template applied successfully - ${templateName} v${template.metadata.version}`,
							"CaretSystemPrompt",
						)
					} else {
						this.caretLogger.warn(
							`Template application failed - ${templateName}: ${overlayResult.warnings.join(", ")}`,
							"CaretSystemPrompt",
						)
					}
				} catch (error) {
					this.caretLogger.error(`Template loading failed - ${templateName}: ${error}`, "CaretSystemPrompt")
				}
			}

			// Record enhanced metrics
			const metrics = this.metrics.recordMetrics(startTime, enhancedPrompt, context, appliedTemplates)
			metrics.enhancementRatio = enhancedPrompt.length / basePrompt.length
			await this.metrics.logEnhancedGeneration(basePrompt, enhancedPrompt, metrics, appliedTemplates)

			return { prompt: enhancedPrompt, metrics }
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate enhanced system prompt", error)
			throw error
		}
	}

	/**
	 * Generate system prompt from JSON sections
	 *
	 * Replaces Cline's hardcoded system prompt with JSON-based composition
	 * while maintaining 100% feature compatibility
	 */
	async generateFromJsonSections(
		cwd: string,
		supportsBrowserUse: boolean,
		mcpHub: any,
		browserSettings: any,
		isClaude4ModelFamily: boolean = false,
		mode: "chatbot" | "agent" = "agent",
	): Promise<string> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`Generating system prompt from JSON sections - cwd: ${cwd}, browser: ${supportsBrowserUse}, claude4: ${isClaude4ModelFamily}, mode: ${mode}, mcpServers: ${mcpHub?.getServers?.()?.length ?? 0}`,
				"CaretSystemPrompt",
			)

			// Step 1: Load base sections
			const baseSections = await this.assembler.loadBaseSections(mode)

			// Step 2: Add dynamic sections
			const dynamicSections = await this.assembler.generateDynamicSections(cwd, mcpHub)

			// Step 3: Add conditional sections
			const conditionalSections = await this.assembler.addConditionalSections(
				supportsBrowserUse,
				browserSettings,
				isClaude4ModelFamily,
			)

			// Step 4: Add final sections
			const finalSections = await this.assembler.loadFinalSections()

			// Step 5: Assemble final prompt
			const allSections = [...baseSections, ...dynamicSections, ...conditionalSections, ...finalSections]
			const finalPrompt = this.assembler.assembleFinalPrompt(allSections)

			this.caretLogger.info(
				`JSON sections prompt generated - length: ${finalPrompt.length}, time: ${Date.now() - startTime}ms, sections: ${allSections.length}`,
				"CaretSystemPrompt",
			)

			return finalPrompt
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Failed to generate JSON sections prompt", error)
			throw error
		}
	}

	/**
	 * Call Cline's original SYSTEM_PROMPT function
	 */
	private async callOriginalSystemPrompt(context: SystemPromptContext): Promise<string> {
		try {
			return await SYSTEM_PROMPT(
				context.cwd,
				context.supportsBrowserUse,
				context.mcpHub,
				context.browserSettings,
				context.isClaude4ModelFamily,
			)
		} catch (error) {
			this.caretLogger.error("[CaretSystemPrompt] Cline SYSTEM_PROMPT call failed", error)
			throw error
		}
	}

	/**
	 * Get metrics (delegate to PromptMetrics)
	 */
	getMetrics() {
		return this.metrics.getMetrics()
	}

	/**
	 * Get average generation time (delegate to PromptMetrics)
	 */
	getAverageGenerationTime() {
		return this.metrics.getAverageGenerationTime()
	}

	/**
	 * Clear metrics (delegate to PromptMetrics)
	 */
	clearMetrics() {
		this.metrics.clearMetrics()
	}
}
