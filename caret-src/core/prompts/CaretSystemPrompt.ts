import { SYSTEM_PROMPT } from "@src/core/prompts/system"
import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptContext, SystemPromptMetrics, SystemPromptResult } from "./types"

/**
 * Caret System Prompt Wrapper
 *
 * Wraps Cline's original SYSTEM_PROMPT function to provide:
 * - 100% compatibility with Cline
 * - Metrics collection
 * - Future JSON overlay capabilities
 *
 * Design Principles:
 * - KISS (Keep It Simple, Stupid) - Just wrap, don't modify
 * - 100% feature preservation
 * - Minimal overhead
 */
export class CaretSystemPrompt {
	private caretLogger: CaretLogger
	private metrics: SystemPromptMetrics[]

	constructor() {
		this.caretLogger = CaretLogger.getInstance()
		this.metrics = []

		this.caretLogger.info("[CaretSystemPrompt] Initialized")
	}

	/**
	 * Generate system prompt with Cline compatibility
	 */
	async generateSystemPrompt(context: SystemPromptContext): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info("[CaretSystemPrompt] Generating system prompt", {
				cwd: context.cwd,
				supportsBrowserUse: context.supportsBrowserUse,
				isClaude4ModelFamily: context.isClaude4ModelFamily,
				mcpServerCount: context.mcpHub.getServers().length,
			})

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
	 * Get all collected metrics
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
	 * Clear metrics (for testing or memory management)
	 */
	clearMetrics(): void {
		this.metrics = []
		this.caretLogger.debug("[CaretSystemPrompt] Metrics cleared")
	}
}
