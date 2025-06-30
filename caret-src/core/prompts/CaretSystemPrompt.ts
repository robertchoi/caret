import { CaretLogger } from "../../utils/caret-logger"
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
	 * CARET MODIFICATION: Initialize singleton instance
	 */
	static initialize(extensionPath: string): void {
		if (!CaretSystemPrompt.instance) {
			CaretSystemPrompt.instance = new CaretSystemPrompt(extensionPath)
		}
	}

	/**
	 * CARET MODIFICATION: Check if singleton is initialized
	 */
	static isInitialized(): boolean {
		return CaretSystemPrompt.instance !== undefined
	}

	// ❌ REMOVED: generateSystemPrompt() moved to CaretSystemPromptTestHelper
	// This method was only used in tests and caused confusion in production code

	// ❌ REMOVED: generateSystemPromptWithTemplates() moved to CaretSystemPromptTestHelper
	// This method was only used in JSON overlay tests and caused confusion in production code

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
				mode, // CARET MODIFICATION: Pass mode parameter
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

	// ❌ REMOVED: callOriginalSystemPrompt() moved to CaretSystemPromptTestHelper
	// This method was only used by test-only methods and caused confusion in production code

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
