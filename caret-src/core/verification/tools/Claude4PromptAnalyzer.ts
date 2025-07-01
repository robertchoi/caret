/**
 * Claude4 Prompt Analysis Tool
 *
 * Specialized analyzer for Claude4 model-specific prompts:
 * - claude4.ts (715 lines) - Main Claude4 optimizations
 * - claude4-experimental.ts (347 lines) - Experimental features
 *
 * Focuses on AI behavior preservation and token optimization.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { CaretLogger } from "../../../utils/caret-logger"
import {
	Claude4Analysis,
	MainPromptAnalysis,
	ExperimentalPromptAnalysis,
	ModelOptimization,
	PerformanceSection,
	ExperimentalFeature,
	ConditionalBlock,
	TemplateStructure,
	JsonCandidate,
	StabilityIndicator,
	ChangeFrequencyAnalysis,
	ConversionStrategy,
	CompatibilityAnalysis,
	ConversionReadiness,
	TokenOptimizationAnalysis,
	ModeSpecificAnalysis,
} from "../types"

export class Claude4PromptAnalyzer {
	private claude4Path: string
	private experimentalPath: string
	private caretLogger: CaretLogger

	constructor(projectRoot: string) {
		this.claude4Path = path.join(projectRoot, "src/core/prompts/model_prompts/claude4.ts")
		this.experimentalPath = path.join(projectRoot, "src/core/prompts/model_prompts/claude4-experimental.ts")
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Analyze main Claude4 prompt file
	 */
	async analyzeMainPrompt(clineMode: boolean = true): Promise<MainPromptAnalysis> {
		this.caretLogger.info(`[Claude4PromptAnalyzer] Analyzing claude4.ts (모드: ${clineMode ? "Cline" : "Caret"})`)

		try {
			const content = await fs.readFile(this.claude4Path, "utf-8")

			return {
				modelOptimizations: await this.extractModelOptimizations(content),
				performanceCriticalSections: await this.identifyPerformanceSections(content),
				toolDefinitions: await this.extractToolDefinitions(content),
				conditionalLogic: await this.extractConditionalLogic(content),
				templateStructures: await this.extractTemplateStructures(content),
				jsonConversionCandidates: await this.identifyJsonCandidates(content),
			}
		} catch (error) {
			this.caretLogger.error(`[Claude4PromptAnalyzer] Failed to analyze claude4.ts: ${error}`)
			throw error
		}
	}

	/**
	 * Analyze experimental Claude4 prompt file
	 */
	async analyzeExperimentalPrompt(clineMode: boolean = true): Promise<ExperimentalPromptAnalysis> {
		this.caretLogger.info(
			`[Claude4PromptAnalyzer] Analyzing claude4-experimental.ts (모드: ${clineMode ? "Cline" : "Caret"})`,
		)

		try {
			const content = await fs.readFile(this.experimentalPath, "utf-8")

			return {
				experimentalFeatures: await this.extractExperimentalFeatures(content),
				stabilityIndicators: await this.assessStability(content),
				changeFrequency: await this.analyzeChangeFrequency(content),
				riskFactors: await this.identifyRiskFactors(content),
				conversionStrategy: await this.recommendExperimentalStrategy(content),
			}
		} catch (error) {
			this.caretLogger.error(`[Claude4PromptAnalyzer] Failed to analyze claude4-experimental.ts: ${error}`)
			throw error
		}
	}

	/**
	 * Generate comprehensive Claude4 analysis
	 */
	async analyzeModelSpecificPrompts(clineMode: boolean = true): Promise<Claude4Analysis> {
		this.caretLogger.info(`[Claude4PromptAnalyzer] Starting comprehensive Claude4 analysis`)

		const mainPrompt = await this.analyzeMainPrompt(clineMode)
		const experimental = await this.analyzeExperimentalPrompt(clineMode)

		return {
			mainPrompt,
			experimental,
			compatibility: await this.analyzeCompatibility(mainPrompt, experimental),
			conversionReadiness: await this.assessConversionReadiness(mainPrompt, experimental),
			tokenOptimization: await this.analyzeTokenOptimization(mainPrompt, experimental),
			modeSpecificAnalysis: await this.analyzeModeSpecificFeatures(mainPrompt, experimental, clineMode),
		}
	}

	/**
	 * Extract model optimization patterns
	 */
	private async extractModelOptimizations(content: string): Promise<ModelOptimization[]> {
		const optimizationPatterns = [
			{ pattern: /\/\*\*[\s\S]*?Claude4[\s\S]*?\*\//g, type: "claude4_specific" as const },
			{ pattern: /\/\/\s*Performance:[\s\S]*?(?=\n\/\/|\n\n|\n\s*$)/g, type: "performance" as const },
			{ pattern: /\/\/\s*Token[\s\S]*?(?=\n\/\/|\n\n|\n\s*$)/g, type: "token_optimization" as const },
		]

		const optimizations: ModelOptimization[] = []

		for (const { pattern, type } of optimizationPatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				optimizations.push({
					type,
					content: match[0],
					startIndex: match.index,
					length: match[0].length,
					conversionComplexity: this.assessOptimizationComplexity(match[0]),
				})
			}
		}

		// Analyze function-level optimizations
		const functionOptimizations = this.extractFunctionOptimizations(content)
		optimizations.push(...functionOptimizations)

		return optimizations
	}

	/**
	 * Identify performance-critical sections
	 */
	private async identifyPerformanceSections(content: string): Promise<PerformanceSection[]> {
		const performanceMarkers = ["PERFORMANCE_CRITICAL", "TOKEN_OPTIMIZED", "LATENCY_SENSITIVE", "MODEL_SPECIFIC"]

		const sections: PerformanceSection[] = []

		// Look for explicit performance markers
		for (const marker of performanceMarkers) {
			const regex = new RegExp(`\/\/.*${marker}[\\s\\S]*?(?=\n\/\/|\n\n|$)`, "g")
			let match
			while ((match = regex.exec(content)) !== null) {
				sections.push({
					name: marker,
					content: match[0],
					startIndex: match.index,
					endIndex: match.index + match[0].length,
					criticalityLevel: this.determineCriticalityLevel(marker),
					conversionRisk: this.assessConversionRisk(match[0]),
				})
			}
		}

		// Analyze large string sections (likely prompt templates)
		const largeStringSections = this.extractLargeStringSections(content)
		sections.push(...largeStringSections)

		return sections
	}

	/**
	 * Extract tool definitions from Claude4 prompt
	 */
	private async extractToolDefinitions(content: string): Promise<any[]> {
		const toolPatterns = [
			/## (\w+)\s*\n.*?Description:.*?(?=##|\n\n|$)/gs,
			/(?:execute_command|read_file|write_to_file|replace_in_file|list_files|browser_action|use_mcp_tool)/g,
		]

		const tools: any[] = []

		for (const pattern of toolPatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				const toolName = match[1] || match[0]
				tools.push({
					name: toolName,
					content: match[0],
					startIndex: match.index,
					length: match[0].length,
					jsonCompatible: this.assessJsonCompatibility(match[0]),
				})
			}
		}

		return tools
	}

	/**
	 * Extract conditional logic blocks
	 */
	private async extractConditionalLogic(content: string): Promise<ConditionalBlock[]> {
		const conditionalPatterns = [
			/supportsBrowserUse\s*\?\s*`[\s\S]*?`\s*:\s*""/g,
			/if\s*\([^)]+\)\s*\{[\s\S]*?\}/g,
			/\?\s*`[\s\S]*?`\s*:\s*`[\s\S]*?`/g,
		]

		const blocks: ConditionalBlock[] = []

		for (const pattern of conditionalPatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				blocks.push({
					condition: this.extractCondition(match[0]),
					content: match[0],
					complexity: this.assessConditionComplexity(match[0]),
					jsonCompatibility: this.assessJsonCompatibility(match[0]),
				})
			}
		}

		return blocks
	}

	/**
	 * Extract template structures
	 */
	private async extractTemplateStructures(content: string): Promise<TemplateStructure[]> {
		const templatePatterns = [
			/\$\{[^}]+\}/g, // Template literals
			/`[\s\S]*?\$\{[\s\S]*?\}[\s\S]*?`/g, // Template strings
			/cwd\.toPosix\(\)/g, // Method calls in templates
		]

		const structures: TemplateStructure[] = []

		for (const pattern of templatePatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				const variableCount = (match[0].match(/\$\{[^}]+\}/g) || []).length
				structures.push({
					name: this.extractTemplateName(match[0]),
					pattern: match[0],
					variableCount,
					jsonReadiness: this.assessTemplateJsonReadiness(match[0], variableCount),
				})
			}
		}

		return structures
	}

	/**
	 * Identify JSON conversion candidates
	 */
	private async identifyJsonCandidates(content: string): Promise<JsonCandidate[]> {
		const candidates: JsonCandidate[] = []

		// Large static text blocks
		const staticTextRegex = /`[\s\S]{200,}?`/g
		let match
		while ((match = staticTextRegex.exec(content)) !== null) {
			if (!match[0].includes("${")) {
				// No template variables
				candidates.push({
					section: "Static Text Block",
					conversionType: "direct",
					estimatedEffort: "low",
					tokenSavingPotential: Math.floor(match[0].length * 0.3),
				})
			}
		}

		// Structured sections (tool definitions, etc.)
		const structuredSections = await this.identifyStructuredSections(content)
		candidates.push(...structuredSections)

		return candidates
	}

	/**
	 * Extract experimental features
	 */
	private async extractExperimentalFeatures(content: string): Promise<ExperimentalFeature[]> {
		const experimentalPatterns = [
			{ pattern: /\/\/\s*EXPERIMENTAL:[\s\S]*?(?=\n\/\/|\n\n)/g, type: "marked_experimental" as const },
			{ pattern: /USE_EXPERIMENTAL_[\w_]+/g, type: "feature_flag" as const },
			{ pattern: /\/\*\*[\s\S]*?experimental[\s\S]*?\*\//gi, type: "experimental_comment" as const },
		]

		const features: ExperimentalFeature[] = []

		for (const { pattern, type } of experimentalPatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				features.push({
					type,
					content: match[0],
					stabilityRisk: this.assessStabilityRisk(match[0]),
					conversionPriority: this.calculateConversionPriority(match[0]),
				})
			}
		}

		return features
	}

	/**
	 * Assess stability indicators
	 */
	private async assessStability(content: string): Promise<StabilityIndicator[]> {
		return [
			{
				indicator: "Experimental Markers",
				value: (content.match(/experimental/gi) || []).length,
				interpretation: this.interpretStabilityValue(
					(content.match(/experimental/gi) || []).length,
					"experimental_count",
				),
			},
			{
				indicator: "Feature Flags",
				value: (content.match(/USE_EXPERIMENTAL_/g) || []).length,
				interpretation: this.interpretStabilityValue((content.match(/USE_EXPERIMENTAL_/g) || []).length, "feature_flags"),
			},
			{
				indicator: "Code Complexity",
				value: this.calculateCodeComplexity(content),
				interpretation: this.interpretStabilityValue(this.calculateCodeComplexity(content), "complexity"),
			},
		]
	}

	/**
	 * Analyze change frequency (mock implementation)
	 */
	private async analyzeChangeFrequency(content: string): Promise<ChangeFrequencyAnalysis> {
		// In a real implementation, this would analyze git history
		const experimentalCount = (content.match(/experimental/gi) || []).length

		return {
			recentChanges: Math.floor(experimentalCount / 10), // Mock calculation
			changePattern: experimentalCount > 20 ? "rapid" : experimentalCount > 10 ? "evolving" : "stable",
			riskLevel: experimentalCount > 20 ? "high" : experimentalCount > 10 ? "medium" : "low",
		}
	}

	/**
	 * Identify risk factors
	 */
	private async identifyRiskFactors(content: string): Promise<any[]> {
		const risks = []

		if (content.includes("EXPERIMENTAL")) {
			risks.push({
				factor: "Experimental Features",
				impact: "high",
				mitigation: "Thorough testing before JSON conversion",
			})
		}

		if (content.length > 30000) {
			risks.push({
				factor: "Large File Size",
				impact: "medium",
				mitigation: "Incremental conversion approach",
			})
		}

		return risks
	}

	/**
	 * Recommend experimental conversion strategy
	 */
	private async recommendExperimentalStrategy(content: string): Promise<ConversionStrategy> {
		const complexity = this.calculateCodeComplexity(content)

		if (complexity > 0.8) {
			return {
				approach: "hybrid",
				description: "JSON templates + dynamic features",
				phases: ["Static sections to JSON", "Dynamic logic preserved", "Template engine integration"],
				riskLevel: "medium",
				estimatedEffort: "high",
			}
		} else {
			return {
				approach: "gradual",
				description: "Incremental JSON conversion",
				phases: ["Identify stable sections", "Convert static content", "Optimize experimental features"],
				riskLevel: "low",
				estimatedEffort: "medium",
			}
		}
	}

	// Helper methods

	private assessOptimizationComplexity(content: string): "low" | "medium" | "high" {
		if (content.includes("${") || content.includes("function")) return "high"
		if (content.length > 500) return "medium"
		return "low"
	}

	private determineCriticalityLevel(marker: string): "low" | "medium" | "high" | "critical" {
		if (marker.includes("CRITICAL")) return "critical"
		if (marker.includes("PERFORMANCE")) return "high"
		if (marker.includes("TOKEN")) return "medium"
		return "low"
	}

	private assessConversionRisk(content: string): "low" | "medium" | "high" {
		if (content.includes("CRITICAL") || content.includes("${")) return "high"
		if (content.length > 1000) return "medium"
		return "low"
	}

	private extractLargeStringSections(content: string): PerformanceSection[] {
		const sections: PerformanceSection[] = []
		const largeStringRegex = /`[\s\S]{1000,}?`/g
		let match
		while ((match = largeStringRegex.exec(content)) !== null) {
			sections.push({
				name: "Large String Section",
				content: match[0].substring(0, 200) + "...",
				startIndex: match.index,
				endIndex: match.index + match[0].length,
				criticalityLevel: "medium",
				conversionRisk: "low",
			})
		}
		return sections
	}

	private extractFunctionOptimizations(content: string): ModelOptimization[] {
		// Extract function-level optimizations
		const optimizations: ModelOptimization[] = []
		const functionRegex = /export\s+(?:const|function)\s+\w+[\s\S]*?(?=export|\n\n|$)/g
		let match
		while ((match = functionRegex.exec(content)) !== null) {
			if (match[0].includes("Claude4") || match[0].includes("optimize")) {
				optimizations.push({
					type: "claude4_specific",
					content: match[0].substring(0, 200) + "...",
					startIndex: match.index,
					length: match[0].length,
					conversionComplexity: "medium",
				})
			}
		}
		return optimizations
	}

	private assessJsonCompatibility(content: string): boolean {
		// Simple heuristic for JSON compatibility
		return !content.includes("${") && !content.includes("function") && content.length < 5000
	}

	private extractCondition(content: string): string {
		const conditionMatch = content.match(/(?:if\s*\(|^\s*)([^?{]+)(?:\?|{)/)
		return conditionMatch ? conditionMatch[1].trim() : "Unknown condition"
	}

	private assessConditionComplexity(content: string): "low" | "medium" | "high" {
		if (content.includes("&&") || content.includes("||")) return "high"
		if (content.includes("?") && content.includes(":")) return "medium"
		return "low"
	}

	private extractTemplateName(content: string): string {
		const match = content.match(/\$\{(\w+)/)
		return match ? match[1] : "Unknown Template"
	}

	private assessTemplateJsonReadiness(content: string, variableCount: number): "ready" | "needs_work" | "complex" {
		if (variableCount === 0) return "ready"
		if (variableCount <= 3) return "needs_work"
		return "complex"
	}

	private async identifyStructuredSections(content: string): Promise<JsonCandidate[]> {
		const candidates: JsonCandidate[] = []

		// Tool sections
		const toolSectionRegex = /## \w+\s*\nDescription:[\s\S]*?(?=##|\n\n|$)/g
		let match
		while ((match = toolSectionRegex.exec(content)) !== null) {
			candidates.push({
				section: "Tool Definition Section",
				conversionType: "template",
				estimatedEffort: "medium",
				tokenSavingPotential: Math.floor(match[0].length * 0.25),
			})
		}

		return candidates
	}

	private assessStabilityRisk(content: string): "low" | "medium" | "high" {
		if (content.includes("EXPERIMENTAL") || content.includes("UNSTABLE")) return "high"
		if (content.includes("BETA") || content.includes("WIP")) return "medium"
		return "low"
	}

	private calculateConversionPriority(content: string): "low" | "medium" | "high" {
		if (content.includes("PRIORITY") || content.includes("IMPORTANT")) return "high"
		if (content.length > 1000) return "medium"
		return "low"
	}

	private interpretStabilityValue(value: number, type: string): "stable" | "moderate" | "unstable" {
		switch (type) {
			case "experimental_count":
				return value > 10 ? "unstable" : value > 5 ? "moderate" : "stable"
			case "feature_flags":
				return value > 5 ? "unstable" : value > 2 ? "moderate" : "stable"
			case "complexity":
				return value > 0.8 ? "unstable" : value > 0.5 ? "moderate" : "stable"
			default:
				return "moderate"
		}
	}

	private calculateCodeComplexity(content: string): number {
		const complexityFactors = [
			(content.match(/if\s*\(/g) || []).length * 0.1,
			(content.match(/function/g) || []).length * 0.15,
			(content.match(/\$\{/g) || []).length * 0.05,
			(content.length / 10000) * 0.3,
		]

		return Math.min(
			1.0,
			complexityFactors.reduce((sum, factor) => sum + factor, 0),
		)
	}

	// Placeholder methods for comprehensive analysis
	private async analyzeCompatibility(
		main: MainPromptAnalysis,
		experimental: ExperimentalPromptAnalysis,
	): Promise<CompatibilityAnalysis> {
		return {
			clineMode: { score: 0.9, issues: [], strengths: ["Existing patterns"] },
			caretMode: { score: 0.8, issues: ["Needs JSON structure"], strengths: ["Modular approach"] },
			conversionChallenges: ["Dynamic content", "Template variables"],
			recommendedStrategy: "Incremental conversion with extensive testing",
		}
	}

	private async assessConversionReadiness(
		main: MainPromptAnalysis,
		experimental: ExperimentalPromptAnalysis,
	): Promise<ConversionReadiness> {
		return {
			overallScore: 0.75,
			readinessFactors: [
				{ factor: "Code Structure", score: 0.8, weight: 0.3, description: "Well-structured functions" },
				{ factor: "Static Content", score: 0.9, weight: 0.4, description: "Large static sections suitable for JSON" },
				{ factor: "Dynamic Complexity", score: 0.5, weight: 0.3, description: "Some complex dynamic sections" },
			],
			blockers: ["Complex template variables", "Performance-critical sections"],
			recommendations: ["Start with static sections", "Preserve critical optimizations"],
		}
	}

	private async analyzeTokenOptimization(
		main: MainPromptAnalysis,
		experimental: ExperimentalPromptAnalysis,
	): Promise<TokenOptimizationAnalysis> {
		const mainTokens = await this.estimateTokenCount(this.claude4Path)
		const experimentalTokens = await this.estimateTokenCount(this.experimentalPath)

		return {
			currentTokenCount: mainTokens + experimentalTokens,
			estimatedOptimizedCount: Math.floor((mainTokens + experimentalTokens) * 0.7),
			optimizationPotential: 0.3,
			optimizationAreas: [
				{
					area: "Static text sections",
					currentTokens: mainTokens * 0.6,
					optimizedTokens: mainTokens * 0.4,
					technique: "JSON compression",
				},
				{
					area: "Tool definitions",
					currentTokens: mainTokens * 0.3,
					optimizedTokens: mainTokens * 0.2,
					technique: "Template structure",
				},
			],
		}
	}

	private async estimateTokenCount(filePath: string): Promise<number> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			// Rough token estimation: ~4 characters per token
			return Math.floor(content.length / 4)
		} catch {
			return 0
		}
	}

	private async analyzeModeSpecificFeatures(
		main: MainPromptAnalysis,
		experimental: ExperimentalPromptAnalysis,
		clineMode: boolean,
	): Promise<ModeSpecificAnalysis> {
		return {
			clineMode: {
				planActReferences: [],
				clineSpecificTerms: ["Cline", "Plan", "Act"],
				originalBehaviorPatterns: [],
			},
			caretMode: {
				chatbotAgentReferences: [],
				caretSpecificTerms: ["Caret", "Chatbot", "Agent"],
				jsonConversionTargets: [],
			},
			modeCompatibility: {
				conflictingTerms: [],
				conversionChallenges: [],
				dualModeStrategy: {
					strategy: "Dual JSON templates",
					implementation: ["Mode-specific JSON sections", "Dynamic loading"],
					validationSteps: ["Test both modes", "Verify behavior preservation"],
				},
			},
		}
	}
}
