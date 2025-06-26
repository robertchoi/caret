/**
 * Cline Feature Validation System - Refactored
 *
 * Main orchestrator class that coordinates all validation components.
 * Refactored following Single Responsibility Principle to use specialized modules.
 */

import { CaretLogger } from "../../utils/caret-logger"
import { SYSTEM_PROMPT } from "@src/core/prompts/system"
import { SYSTEM_PROMPT_CLAUDE4 } from "@src/core/prompts/model_prompts/claude4"
import { SYSTEM_PROMPT_CLAUDE4_EXPERIMENTAL } from "@src/core/prompts/model_prompts/claude4-experimental"

import {
	ValidationResult,
	ValidationContext,
	FeatureExtractionResult,
	PromptSection,
	PromptMetadata,
	ValidationMetrics,
	ToolExtractionOptions,
} from "./types"

// Import specialized modules
import { ToolExtractor } from "./extractors/ToolExtractor"
import { McpExtractor } from "./extractors/McpExtractor"
import { SystemInfoExtractor } from "./extractors/SystemInfoExtractor"
import { ValidationEngine } from "./engines/ValidationEngine"
import { ReportGenerator } from "./generators/ReportGenerator"
import { MetricsCollector, ValidationSession } from "./collectors/MetricsCollector"

/**
 * Main validator class - now focused on orchestration
 */
export class ClineFeatureValidator {
	private caretLogger: CaretLogger

	// Specialized modules
	private toolExtractor: ToolExtractor
	private mcpExtractor: McpExtractor
	private systemInfoExtractor: SystemInfoExtractor
	private validationEngine: ValidationEngine
	private reportGenerator: ReportGenerator
	private metricsCollector: MetricsCollector

	constructor() {
		this.caretLogger = new CaretLogger()

		// Initialize specialized modules
		this.toolExtractor = new ToolExtractor()
		this.mcpExtractor = new McpExtractor()
		this.systemInfoExtractor = new SystemInfoExtractor()
		this.validationEngine = new ValidationEngine()
		this.reportGenerator = new ReportGenerator()
		this.metricsCollector = new MetricsCollector()
	}

	/**
	 * Main validation method - orchestrates all components
	 */
	async validateAllFeatures(originalPrompt: string, newPrompt: string, context: ValidationContext): Promise<ValidationResult> {
		const session = this.metricsCollector.startValidationMetrics()

		try {
			this.caretLogger.info("[ClineFeatureValidator] Starting comprehensive validation", "VALIDATION")

			// Extract features from both prompts
			session.startExtraction()
			const originalFeatures = await this.extractFeatures(originalPrompt, context)
			const newFeatures = await this.extractFeatures(newPrompt, context)
			session.endExtraction()

			// Perform detailed validation
			session.startValidation()
			const toolAnalysis = await this.validationEngine.validateToolCompleteness(
				originalFeatures.tools,
				newFeatures.tools,
				context,
			)

			const mcpAnalysis = await this.validationEngine.validateMcpIntegration(
				originalFeatures.mcpServers,
				newFeatures.mcpServers,
				context,
			)

			const systemInfoAnalysis = await this.validationEngine.validateSystemInfo(
				originalFeatures.systemInfo,
				newFeatures.systemInfo,
				context,
			)
			session.endValidation()

			// Generate validation result
			const result = this.reportGenerator.generateValidationResult(
				originalFeatures,
				newFeatures,
				toolAnalysis,
				mcpAnalysis,
				systemInfoAnalysis,
				context,
			)

			// Record metrics
			this.metricsCollector.recordValidationMetrics(
				session,
				result,
				originalFeatures.tools.length + newFeatures.tools.length,
				originalFeatures.sections.length + newFeatures.sections.length,
			)

			return result
		} catch (error) {
			this.caretLogger.error("[ClineFeatureValidator] Validation failed", "VALIDATION")
			this.caretLogger.error(error instanceof Error ? error.message : String(error))
			throw error
		}
	}

	/**
	 * Extract all features from a system prompt
	 */
	async extractFeatures(prompt: string, context: ValidationContext): Promise<FeatureExtractionResult> {
		try {
			this.caretLogger.debug("[ClineFeatureValidator] Extracting features from prompt", "EXTRACTION")

			// Extract using specialized modules
			const tools = await this.toolExtractor.extractTools(prompt, {
				includeExamples: true,
				includeUsage: true,
				strictParsing: context.strictMode,
			})

			const mcpServers = await this.mcpExtractor.extractMcpServers(prompt)
			const systemInfo = await this.systemInfoExtractor.extractSystemInfo(prompt)
			const sections = await this.extractSections(prompt)

			// Generate metadata
			const metadata: PromptMetadata = {
				totalLength: prompt.length,
				toolCount: tools.length,
				mcpServerCount: mcpServers.length,
				sectionCount: sections.length,
				variant: context.variant,
				generationTimestamp: Date.now(),
			}

			return {
				tools,
				mcpServers,
				systemInfo,
				sections,
				metadata,
			}
		} catch (error) {
			this.caretLogger.error("[ClineFeatureValidator] Feature extraction failed", "EXTRACTION")
			throw error
		}
	}

	/**
	 * Extract tools using specialized module
	 */
	async extractTools(prompt: string, options?: ToolExtractionOptions): Promise<import("./types").ToolDefinition[]> {
		return this.toolExtractor.extractTools(prompt, options)
	}

	/**
	 * Extract sections from prompt
	 */
	private async extractSections(prompt: string): Promise<PromptSection[]> {
		const sections: PromptSection[] = []

		try {
			// Split by major section dividers
			const sectionDividers = /^====\s*(.+?)\s*====$/gm
			const matches = Array.from(prompt.matchAll(sectionDividers))

			for (let i = 0; i < matches.length; i++) {
				const match = matches[i]
				const sectionName = match[1]
				const startIndex = match.index!
				const endIndex = i + 1 < matches.length ? matches[i + 1].index! : prompt.length

				const content = prompt.slice(startIndex, endIndex)

				sections.push({
					name: sectionName,
					content: content.trim(),
					startIndex,
					endIndex,
					length: content.length,
					type: this.categorizeSection(sectionName),
				})
			}

			// Add main header section if it exists
			if (matches.length > 0) {
				const firstSection = matches[0]
				if (firstSection.index! > 0) {
					const headerContent = prompt.slice(0, firstSection.index!)
					sections.unshift({
						name: "Header",
						content: headerContent.trim(),
						startIndex: 0,
						endIndex: firstSection.index!,
						length: headerContent.length,
						type: "header",
					})
				}
			}
		} catch (error) {
			this.caretLogger.warn(`[ClineFeatureValidator] Section extraction failed: ${error}`, "EXTRACTION")
		}

		return sections
	}

	/**
	 * Categorize section by name
	 */
	private categorizeSection(header: string): "header" | "tools" | "mcp" | "rules" | "examples" | "system" {
		const lowerHeader = header.toLowerCase()

		if (lowerHeader.includes("tool")) return "tools"
		if (lowerHeader.includes("mcp") || lowerHeader.includes("server")) return "mcp"
		if (lowerHeader.includes("rule") || lowerHeader.includes("guideline")) return "rules"
		if (lowerHeader.includes("example")) return "examples"
		if (lowerHeader.includes("system") || lowerHeader.includes("information")) return "system"

		return "header"
	}

	/**
	 * Get validation metrics
	 */
	getValidationMetrics(): ValidationMetrics[] {
		return this.metricsCollector.getValidationMetrics()
	}

	/**
	 * Clear validation metrics
	 */
	clearValidationMetrics(): void {
		this.metricsCollector.clearValidationMetrics()
	}

	/**
	 * Get performance summary
	 */
	getPerformanceSummary() {
		return this.metricsCollector.getPerformanceSummary()
	}

	/**
	 * Export metrics to JSON
	 */
	exportMetrics(): string {
		return this.metricsCollector.exportMetrics()
	}

	/**
	 * Static method to get core tools
	 */
	static getCoreTools(): string[] {
		return ToolExtractor.getCoreTools()
	}

	/**
	 * Static method to get conditional tools
	 */
	static getConditionalTools(): string[] {
		return ToolExtractor.getConditionalTools()
	}

	/**
	 * Static method to get MCP tools
	 */
	static getMcpTools(): string[] {
		return ToolExtractor.getMcpTools()
	}
}
