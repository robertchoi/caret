import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptMetrics, SystemPromptContext } from "./types"

/**
 * Prompt Metrics Collector
 *
 * Handles all metrics collection and analysis for system prompts
 * Separated from CaretSystemPrompt for KISS principle
 */
export class PromptMetrics {
	private static instance: PromptMetrics
	private caretLogger: CaretLogger
	private metrics: SystemPromptMetrics[]

	constructor() {
		this.caretLogger = CaretLogger.getInstance()
		this.metrics = []
	}

	static getInstance(): PromptMetrics {
		if (!PromptMetrics.instance) {
			PromptMetrics.instance = new PromptMetrics()
		}
		return PromptMetrics.instance
	}

	/**
	 * Record metrics for a prompt generation
	 */
	recordMetrics(
		startTime: number,
		prompt: string,
		context: SystemPromptContext,
		appliedTemplates?: string[],
	): SystemPromptMetrics {
		const metrics: SystemPromptMetrics = {
			generationTime: Date.now() - startTime,
			promptLength: prompt.length,
			toolCount: this.extractToolCount(prompt),
			mcpServerCount: context.mcpHub.getServers().length,
			timestamp: Date.now(),
			appliedTemplates,
		}

		if (appliedTemplates && appliedTemplates.length > 0) {
			// Calculate enhancement ratio if templates were applied
			metrics.enhancementRatio = 1.0 // Will be calculated by caller
		}

		this.metrics.push(metrics)
		return metrics
	}

	/**
	 * Extract tool count from prompt text
	 */
	private extractToolCount(prompt: string): number {
		const toolMatches = prompt.match(/## \w+/g)
		return toolMatches ? toolMatches.length : 0
	}

	/**
	 * Get all recorded metrics
	 */
	getMetrics(): SystemPromptMetrics[] {
		return [...this.metrics]
	}

	/**
	 * Get average generation time
	 */
	getAverageGenerationTime(): number {
		if (this.metrics.length === 0) return 0
		const total = this.metrics.reduce((sum, m) => sum + m.generationTime, 0)
		return total / this.metrics.length
	}

	/**
	 * Clear all metrics
	 */
	clearMetrics(): void {
		this.metrics = []
		this.caretLogger.info("[PromptMetrics] Metrics cleared")
	}

	/**
	 * Log prompt generation metrics
	 */
	async logGeneration(context: SystemPromptContext, result: string, metrics: SystemPromptMetrics): Promise<void> {
		this.caretLogger.info(
			`Prompt generated - length: ${result.length}, tools: ${metrics.toolCount}, time: ${metrics.generationTime}ms`,
			"PromptMetrics",
		)
	}

	/**
	 * Log enhanced prompt generation metrics
	 */
	async logEnhancedGeneration(
		basePrompt: string,
		enhancedPrompt: string,
		metrics: SystemPromptMetrics,
		appliedTemplates: string[],
	): Promise<void> {
		this.caretLogger.info(
			`Enhanced prompt generated - base: ${basePrompt.length} → enhanced: ${enhancedPrompt.length} chars, templates: [${appliedTemplates.join(", ")}], time: ${metrics.generationTime}ms`,
			"PromptMetrics",
		)
	}
}
