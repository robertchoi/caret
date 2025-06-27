import { SYSTEM_PROMPT } from "@src/core/prompts/system"
import { CaretLogger } from "../../utils/caret-logger"
import { SystemPromptContext, SystemPromptMetrics, SystemPromptResult } from "./types"
import { JsonTemplateLoader } from "./JsonTemplateLoader"
import { PromptOverlayEngine } from "./PromptOverlayEngine"

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
 */
export class CaretSystemPrompt {
	private caretLogger: CaretLogger
	private metrics: SystemPromptMetrics[]
	private templateLoader: JsonTemplateLoader
	private overlayEngine: PromptOverlayEngine

	constructor(extensionPath: string) {
		this.caretLogger = CaretLogger.getInstance()
		this.metrics = []
		this.templateLoader = new JsonTemplateLoader(extensionPath)
		this.overlayEngine = new PromptOverlayEngine()

		this.caretLogger.info("[CaretSystemPrompt] Initialized with JSON overlay system")
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
	 * Generate system prompt with JSON template overlay
	 *
	 * @param context System prompt context
	 * @param templateNames Array of template names to apply
	 * @returns Promise<SystemPromptResult> Enhanced prompt with templates applied
	 */
	async generateSystemPromptWithTemplates(context: SystemPromptContext, templateNames: string[]): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info("[CaretSystemPrompt] Generating system prompt with templates", {
				cwd: context.cwd,
				templateNames,
				templateCount: templateNames.length,
			})

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
