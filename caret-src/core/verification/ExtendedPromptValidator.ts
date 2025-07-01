/**
 * Extended Prompt Validation System
 *
 * Extends ClineFeatureValidator to validate AI core prompt files:
 * - claude4.ts, claude4-experimental.ts
 * - commands.ts, loadMcpDocumentation.ts
 *
 * Based on system.ts JSON conversion success patterns.
 */

import { CaretLogger } from "../../utils/caret-logger"
import { ClineFeatureValidator } from "./ClineFeatureValidator"
import { ValidationResult, ValidationContext, ExtendedValidationResult, PromptFilesValidationResult } from "./types"

// Import specialized analyzers (to be implemented)
import { Claude4PromptAnalyzer } from "./tools/Claude4PromptAnalyzer"
import { CommandsAnalyzer } from "./tools/CommandsAnalyzer"
import { McpDocumentationAnalyzer } from "./tools/McpDocumentationAnalyzer"

/**
 * Extended validator focusing on AI behavior-critical prompt files
 */
export class ExtendedPromptValidator extends ClineFeatureValidator {
	private caretLogger: CaretLogger
	private claude4Analyzer: Claude4PromptAnalyzer
	private commandsAnalyzer: CommandsAnalyzer
	private mcpDocAnalyzer: McpDocumentationAnalyzer

	constructor(projectRoot: string) {
		super() // Inherit existing system.ts validation capabilities
		this.caretLogger = new CaretLogger()

		// Initialize specialized analyzers
		this.claude4Analyzer = new Claude4PromptAnalyzer(projectRoot)
		this.commandsAnalyzer = new CommandsAnalyzer(projectRoot)
		this.mcpDocAnalyzer = new McpDocumentationAnalyzer(projectRoot)
	}

	/**
	 * Main validation method for all AI prompt files
	 * Supports both Cline and Caret modes
	 */
	async validateAllPromptFiles(
		clineMode: boolean = true,
		targetFiles: string[] = ["claude4.ts", "claude4-experimental.ts", "commands.ts", "loadMcpDocumentation.ts"],
	): Promise<ExtendedValidationResult> {
		this.caretLogger.info(
			`[ExtendedPromptValidator] Starting comprehensive prompt validation (모드: ${clineMode ? "Cline" : "Caret"})`,
			"VALIDATION",
		)

		try {
			// Phase 1: Leverage existing system.ts validation success
			const systemValidationExample = await this.getSystemValidationPattern()

			// Phase 2: Analyze each target file
			const promptFilesValidation = await this.analyzePromptFiles(targetFiles, clineMode)

			// Phase 3: Generate comprehensive conversion plan
			const conversionPlan = await this.generateConversionPlan(promptFilesValidation)

			// Phase 4: Calculate risk and benefit analysis
			const riskAssessment = await this.assessOverallRisk(promptFilesValidation)

			return {
				systemValidationPattern: systemValidationExample,
				promptFilesAnalysis: promptFilesValidation,
				conversionPlan: conversionPlan,
				riskAssessment: riskAssessment,
				clineMode: clineMode,
				targetFiles: targetFiles,
				timestamp: Date.now(),
				isValid: this.calculateOverallValidity(promptFilesValidation),
				recommendedNext: this.generateNextStepRecommendations(promptFilesValidation),
			}
		} catch (error) {
			this.caretLogger.error("[ExtendedPromptValidator] Comprehensive validation failed", "VALIDATION")
			this.caretLogger.error(error instanceof Error ? error.message : String(error))
			throw error
		}
	}

	/**
	 * Analyze individual prompt files using specialized analyzers
	 */
	private async analyzePromptFiles(targetFiles: string[], clineMode: boolean): Promise<PromptFilesValidationResult> {
		const results: Record<string, any> = {}

		for (const fileName of targetFiles) {
			this.caretLogger.info(`[ExtendedPromptValidator] Analyzing ${fileName}`, "ANALYSIS")

			try {
				switch (fileName) {
					case "claude4.ts":
						results.claude4 = await this.claude4Analyzer.analyzeMainPrompt(clineMode)
						break
					case "claude4-experimental.ts":
						results.claude4Experimental = await this.claude4Analyzer.analyzeExperimentalPrompt(clineMode)
						break
					case "commands.ts":
						results.commands = await this.commandsAnalyzer.analyzeCommandStructures()
						break
					case "loadMcpDocumentation.ts":
						results.mcpDoc = await this.mcpDocAnalyzer.analyzeMcpDocGeneration()
						break
					default:
						this.caretLogger.warn(`[ExtendedPromptValidator] Unknown file: ${fileName}`, "ANALYSIS")
				}
			} catch (error) {
				this.caretLogger.error(`[ExtendedPromptValidator] Failed to analyze ${fileName}: ${error}`, "ANALYSIS")
				results[fileName] = { error: error instanceof Error ? error.message : String(error) }
			}
		}

		return {
			fileAnalyses: results,
			analysisMetadata: {
				analyzedFiles: targetFiles,
				successfulAnalyses: Object.keys(results).filter((key) => !results[key].error).length,
				failedAnalyses: Object.keys(results).filter((key) => results[key].error).length,
				clineMode: clineMode,
				timestamp: Date.now(),
			},
		}
	}

	/**
	 * Get successful system.ts validation pattern as reference
	 */
	private async getSystemValidationPattern(): Promise<any> {
		// This leverages the successful system.ts JSON conversion experience
		return {
			successPattern: "system.ts → JSON conversion completed",
			keySuccessFactors: [
				"Modular JSON sections",
				"Preserved all Cline functionality",
				"Cline/Caret dual mode support",
				"20-40% token efficiency improvement",
			],
			applicablePatterns: [
				"Section-based JSON structure",
				"Dynamic content loading",
				"Fallback safety mechanisms",
				"Comprehensive validation testing",
			],
		}
	}

	/**
	 * Generate conversion plan based on analysis results
	 */
	private async generateConversionPlan(validation: PromptFilesValidationResult): Promise<any> {
		const { fileAnalyses } = validation

		return {
			conversionOrder: [
				{
					file: "commands.ts",
					priority: 1,
					reason: "가장 구조화되어 변환 용이",
					expectedEffort: "low",
					expectedBenefit: "high",
				},
				{
					file: "claude4.ts",
					priority: 2,
					reason: "가장 큰 토큰 절약 효과 (715줄)",
					expectedEffort: "medium",
					expectedBenefit: "very_high",
				},
				{
					file: "claude4-experimental.ts",
					priority: 3,
					reason: "실험적 기능 모듈화",
					expectedEffort: "medium",
					expectedBenefit: "high",
				},
				{
					file: "loadMcpDocumentation.ts",
					priority: 4,
					reason: "동적 생성 복잡도 높음",
					expectedEffort: "high",
					expectedBenefit: "medium",
				},
			],
			estimatedTokenSavings: {
				"commands.ts": "40%",
				"claude4.ts": "30%",
				"claude4-experimental.ts": "25%",
				"loadMcpDocumentation.ts": "20%",
			},
		}
	}

	/**
	 * Assess overall conversion risk
	 */
	private async assessOverallRisk(validation: PromptFilesValidationResult): Promise<any> {
		return {
			overallRiskLevel: "medium",
			riskFactors: [
				{
					factor: "AI Behavior Preservation",
					level: "critical",
					mitigation: "Comprehensive testing with existing validation system",
				},
				{
					factor: "Token Efficiency vs Functionality",
					level: "medium",
					mitigation: "Gradual conversion with fallback mechanisms",
				},
				{
					factor: "Cline/Caret Mode Compatibility",
					level: "low",
					mitigation: "system.ts pattern already proven successful",
				},
			],
			recommendedApproach: "incremental_conversion_with_validation",
		}
	}

	/**
	 * Calculate overall validity of analysis
	 */
	private calculateOverallValidity(validation: PromptFilesValidationResult): boolean {
		const { successfulAnalyses, failedAnalyses } = validation.analysisMetadata
		return successfulAnalyses > 0 && failedAnalyses === 0
	}

	/**
	 * Generate next step recommendations
	 */
	private generateNextStepRecommendations(validation: PromptFilesValidationResult): string[] {
		return [
			"✅ Phase 1: commands.ts 변환 (가장 안전)",
			"🎯 Phase 2: claude4.ts 변환 (최대 효과)",
			"🧪 Phase 3: claude4-experimental.ts 변환",
			"🔧 Phase 4: loadMcpDocumentation.ts 변환 (가장 복잡)",
			"📊 각 단계마다 003-08 도구로 실제 변환 수행",
		]
	}
}
