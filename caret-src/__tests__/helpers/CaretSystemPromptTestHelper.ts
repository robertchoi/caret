import { SYSTEM_PROMPT } from "../../../src/core/prompts/system"
import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptContext, SystemPromptResult } from "../../core/prompts/types"
import { JsonTemplateLoader } from "../../core/prompts/JsonTemplateLoader"
import { PromptOverlayEngine } from "../../core/prompts/PromptOverlayEngine"
import { PromptMetrics } from "../../core/prompts/PromptMetrics"

/**
 * Test Helper for CaretSystemPrompt
 *
 * Contains test-only methods separated from production code
 * to avoid confusion and maintain clean architecture
 */
export class CaretSystemPromptTestHelper {
	private caretLogger: CaretLogger
	private templateLoader: JsonTemplateLoader
	private overlayEngine: PromptOverlayEngine
	private metrics: PromptMetrics

	constructor(extensionPath: string, isTestEnvironment: boolean = true) {
		this.caretLogger = CaretLogger.getInstance()
		this.templateLoader = new JsonTemplateLoader(extensionPath, isTestEnvironment)
		this.overlayEngine = new PromptOverlayEngine()
		this.metrics = PromptMetrics.getInstance()

		this.caretLogger.info("[CaretSystemPromptTestHelper] Test helper initialized", "TEST_HELPER")
	}

	/**
	 * Generate system prompt with Cline compatibility (TEST ONLY)
	 */
	async generateSystemPrompt(context: SystemPromptContext): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`[TEST] Generating system prompt - cwd: ${context.cwd}, browser: ${context.supportsBrowserUse}, claude4: ${context.isClaude4ModelFamily}`,
				"TEST_HELPER",
			)

			// Call Cline original SYSTEM_PROMPT exactly as-is
			const prompt = await this.callOriginalSystemPrompt(context)

			// Record metrics
			const metrics = this.metrics.recordMetrics(startTime, prompt, context)
			await this.metrics.logGeneration(context, prompt, metrics)

			return { prompt, metrics }
		} catch (error) {
			this.caretLogger.error("[TEST] Failed to generate system prompt", error)
			throw error
		}
	}

	/**
	 * Generate system prompt with JSON template overlay (TEST ONLY)
	 */
	async generateSystemPromptWithTemplates(context: SystemPromptContext, templateNames: string[]): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info(
				`[TEST] Generating system prompt with templates - cwd: ${context.cwd}, templates: [${templateNames.join(", ")}]`,
				"TEST_HELPER",
			)

			// Generate base prompt from Cline
			const basePrompt = await this.callOriginalSystemPrompt(context)
			this.caretLogger.info(`[TEST] Base prompt generated - length: ${basePrompt.length}`, "TEST_HELPER")
			this.caretLogger.info(`[TEST] Base prompt preview: ${basePrompt.substring(0, 200)}...`, "TEST_HELPER")

			// Apply JSON templates
			let enhancedPrompt = basePrompt
			const appliedTemplates: string[] = []

			for (const templateName of templateNames) {
				try {
					this.caretLogger.info(`[TEST] Loading template: ${templateName}`, "TEST_HELPER")
					console.log(`🔍 [TEST] Loading template: ${templateName}`)
					const template = await this.templateLoader.loadTemplate(templateName)
					this.caretLogger.info(`[TEST] Template loaded successfully: ${template.metadata.name}`, "TEST_HELPER")
					console.log(`✅ [TEST] Template loaded successfully: ${template.metadata.name}`)
					
					this.caretLogger.info(`[TEST] Applying overlay for template: ${templateName}`, "TEST_HELPER")
					console.log(`🔧 [TEST] Applying overlay for template: ${templateName}`)
					const overlayResult = await this.overlayEngine.applyOverlay(enhancedPrompt, template)

					if (overlayResult.success) {
						enhancedPrompt = overlayResult.prompt
						appliedTemplates.push(templateName)
						this.caretLogger.info(
							`[TEST] Template applied successfully - ${templateName} v${template.metadata.version}`,
							"TEST_HELPER",
						)
						console.log(`✅ [TEST] Template applied successfully - ${templateName} v${template.metadata.version}`)
						this.caretLogger.info(`[TEST] Enhanced prompt length after ${templateName}: ${enhancedPrompt.length}`, "TEST_HELPER")
						console.log(`📏 [TEST] Enhanced prompt length after ${templateName}: ${enhancedPrompt.length}`)
						this.caretLogger.info(`[TEST] Enhanced prompt preview after ${templateName}: ${enhancedPrompt.substring(0, 300)}...`, "TEST_HELPER")
						console.log(`📝 [TEST] Enhanced prompt preview after ${templateName}: ${enhancedPrompt.substring(0, 300)}...`)
					} else {
						this.caretLogger.warn(
							`[TEST] Template application failed - ${templateName}: ${overlayResult.warnings.join(", ")}`,
							"TEST_HELPER",
						)
						console.log(`❌ [TEST] Template application failed - ${templateName}: ${overlayResult.warnings.join(", ")}`)
						this.caretLogger.warn(`[TEST] Overlay result: ${JSON.stringify(overlayResult, null, 2)}`, "TEST_HELPER")
						console.log(`❌ [TEST] Overlay result: ${JSON.stringify(overlayResult, null, 2)}`)
					}
				} catch (error) {
					this.caretLogger.error(`[TEST] Template loading failed - ${templateName}: ${error}`, "TEST_HELPER")
					console.log(`💥 [TEST] Template loading failed - ${templateName}:`, error)
					this.caretLogger.error(`[TEST] Error details: ${JSON.stringify(error, null, 2)}`, "TEST_HELPER")
					console.log(`💥 [TEST] Error details:`, error)
					// Don't silently ignore errors - log them more visibly
					console.error(`💥 [TEST] CRITICAL ERROR loading template ${templateName}:`, error)
				}
			}

			// Record enhanced metrics
			const metrics = this.metrics.recordMetrics(startTime, enhancedPrompt, context, appliedTemplates)
			metrics.enhancementRatio = enhancedPrompt.length / basePrompt.length
			await this.metrics.logEnhancedGeneration(basePrompt, enhancedPrompt, metrics, appliedTemplates)

			this.caretLogger.info(`[TEST] Final result - applied templates: [${appliedTemplates.join(", ")}], enhancement ratio: ${metrics.enhancementRatio}`, "TEST_HELPER")

			return { prompt: enhancedPrompt, metrics }
		} catch (error) {
			this.caretLogger.error("[TEST] Failed to generate enhanced system prompt", error)
			throw error
		}
	}

	/**
	 * Call Cline's original SYSTEM_PROMPT function (TEST ONLY)
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
			this.caretLogger.error("[TEST] Cline SYSTEM_PROMPT call failed", error)
			throw error
		}
	}

	/**
	 * Get metrics for testing (TEST ONLY)
	 */
	getMetrics() {
		return this.metrics.getMetrics()
	}

	/**
	 * Get average generation time for testing (TEST ONLY)
	 */
	getAverageGenerationTime() {
		return this.metrics.getAverageGenerationTime()
	}

	/**
	 * Clear metrics for testing (TEST ONLY)
	 */
	clearMetrics() {
		this.metrics.clearMetrics()
	}

	/**
	 * Generate system prompt from JSON sections (TEST ONLY)
	 * This method simulates the future JSON-based system prompt generation
	 */
	async generateFromJsonSections(
		cwd: string,
		supportsBrowserUse: boolean,
		mcpHub: any,
		browserSettings: any,
		isClaude4ModelFamily: boolean = false,
		mode: "chatbot" | "agent" = "agent",
	): Promise<string> {
		const context: SystemPromptContext = {
			cwd,
			supportsBrowserUse,
			mcpHub,
			browserSettings,
			isClaude4ModelFamily,
		}

		// For now, this just calls the original system prompt
		// In the future, this will use JSON section assembly
		const result = await this.generateSystemPrompt(context)
		return result.prompt
	}
}
