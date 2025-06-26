/**
 * Report Generation Module
 *
 * Handles generation of validation reports and summaries.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import {
	ValidationResult,
	FeatureExtractionResult,
	ToolAnalysisResult,
	McpAnalysisResult,
	SystemInfoAnalysisResult,
	ValidationContext,
} from "../types"

export class ReportGenerator {
	private caretLogger: CaretLogger

	constructor() {
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Generate complete validation result
	 */
	generateValidationResult(
		originalFeatures: FeatureExtractionResult,
		newFeatures: FeatureExtractionResult,
		toolAnalysis: ToolAnalysisResult,
		mcpAnalysis: McpAnalysisResult,
		systemInfoAnalysis: SystemInfoAnalysisResult,
		context: ValidationContext,
	): ValidationResult {
		try {
			this.caretLogger.debug("[ReportGenerator] Generating validation result", "REPORT")

			const isValid = this.determineOverallValidity(toolAnalysis, mcpAnalysis, systemInfoAnalysis)
			const allToolsPreserved = toolAnalysis.missingTools === 0 && toolAnalysis.criticalIssues.length === 0
			const missingTools = this.extractMissingToolNames(toolAnalysis)

			const result: ValidationResult = {
				isValid,
				allToolsPreserved,
				missingTools,
				toolAnalysis,
				mcpAnalysis,
				systemInfoAnalysis,
				summary: this.generateSummary(isValid, toolAnalysis, mcpAnalysis, systemInfoAnalysis),
				detailedReport: this.generateDetailedReport(
					originalFeatures,
					newFeatures,
					toolAnalysis,
					mcpAnalysis,
					systemInfoAnalysis,
				),
				recommendations: this.generateRecommendations(toolAnalysis, mcpAnalysis, systemInfoAnalysis),
			}

			this.caretLogger.debug("[ReportGenerator] Validation result generated successfully", "REPORT")
			return result
		} catch (error) {
			this.caretLogger.error("[ReportGenerator] Failed to generate validation result", "REPORT")
			throw error
		}
	}

	/**
	 * Generate summary of validation results
	 */
	private generateSummary(
		isValid: boolean,
		toolAnalysis: ToolAnalysisResult,
		mcpAnalysis: McpAnalysisResult,
		systemInfoAnalysis: SystemInfoAnalysisResult,
	): string {
		const status = isValid ? "✅ VALID" : "❌ INVALID"
		const toolStatus = toolAnalysis.criticalIssues.length === 0 ? "✅" : "❌"
		const mcpStatus = mcpAnalysis.issues.length === 0 ? "✅" : "❌"
		const systemStatus = systemInfoAnalysis.issues.length === 0 ? "✅" : "❌"

		return `${status} | Tools: ${toolStatus} (${toolAnalysis.preservedTools}/${toolAnalysis.totalTools}) | MCP: ${mcpStatus} (${mcpAnalysis.preservedServers}/${mcpAnalysis.totalServers}) | System: ${systemStatus}`
	}

	/**
	 * Generate detailed validation report
	 */
	private generateDetailedReport(
		originalFeatures: FeatureExtractionResult,
		newFeatures: FeatureExtractionResult,
		toolAnalysis: ToolAnalysisResult,
		mcpAnalysis: McpAnalysisResult,
		systemInfoAnalysis: SystemInfoAnalysisResult,
	): string {
		const sections: string[] = []

		// Header
		sections.push("=".repeat(80))
		sections.push("CLINE FEATURE VALIDATION REPORT")
		sections.push("=".repeat(80))

		// Tool Analysis Section
		sections.push("\n📋 TOOL ANALYSIS")
		sections.push("-".repeat(40))
		sections.push(`Total Tools: ${toolAnalysis.totalTools}`)
		sections.push(`Preserved: ${toolAnalysis.preservedTools}`)
		sections.push(`Missing: ${toolAnalysis.missingTools}`)
		sections.push(`New: ${toolAnalysis.newTools}`)
		sections.push(`Modified: ${toolAnalysis.modifiedTools}`)
		sections.push("")
		sections.push(`Core Tools: ${toolAnalysis.coreTools}`)
		sections.push(`Conditional Tools: ${toolAnalysis.conditionalTools}`)
		sections.push(`MCP Tools: ${toolAnalysis.mcpTools}`)
		sections.push(`Interactive Tools: ${toolAnalysis.interactiveTools}`)
		sections.push(`Task Tools: ${toolAnalysis.taskTools}`)

		if (toolAnalysis.criticalIssues.length > 0) {
			sections.push("\n🚨 CRITICAL ISSUES:")
			toolAnalysis.criticalIssues.forEach((issue) => sections.push(`  - ${issue}`))
		}

		if (toolAnalysis.warnings.length > 0) {
			sections.push("\n⚠️  WARNINGS:")
			toolAnalysis.warnings.forEach((warning) => sections.push(`  - ${warning}`))
		}

		if (toolAnalysis.toolChanges.length > 0) {
			sections.push("\n🔄 TOOL CHANGES:")
			toolAnalysis.toolChanges.forEach((change) => {
				sections.push(`  - ${change.toolName} (${change.changeType}):`)
				change.details.forEach((detail) => sections.push(`    • ${detail}`))
			})
		}

		// MCP Analysis Section
		sections.push("\n🔌 MCP ANALYSIS")
		sections.push("-".repeat(40))
		sections.push(`Total Servers: ${mcpAnalysis.totalServers}`)
		sections.push(`Preserved: ${mcpAnalysis.preservedServers}`)
		sections.push(`Missing: ${mcpAnalysis.missingServers}`)
		sections.push(`New: ${mcpAnalysis.newServers}`)
		sections.push(`Total Tools: ${mcpAnalysis.totalTools}`)
		sections.push(`Total Resources: ${mcpAnalysis.totalResources}`)

		if (mcpAnalysis.issues.length > 0) {
			sections.push("\n🚨 MCP ISSUES:")
			mcpAnalysis.issues.forEach((issue) => sections.push(`  - ${issue}`))
		}

		if (mcpAnalysis.warnings.length > 0) {
			sections.push("\n⚠️  MCP WARNINGS:")
			mcpAnalysis.warnings.forEach((warning) => sections.push(`  - ${warning}`))
		}

		// System Info Analysis Section
		sections.push("\n💻 SYSTEM INFORMATION ANALYSIS")
		sections.push("-".repeat(40))
		sections.push(`Identical: ${systemInfoAnalysis.isIdentical ? "Yes" : "No"}`)

		if (systemInfoAnalysis.differences.length > 0) {
			sections.push("\n🔄 DIFFERENCES:")
			systemInfoAnalysis.differences.forEach((diff) => sections.push(`  - ${diff}`))
		}

		if (systemInfoAnalysis.issues.length > 0) {
			sections.push("\n🚨 SYSTEM ISSUES:")
			systemInfoAnalysis.issues.forEach((issue) => sections.push(`  - ${issue}`))
		}

		if (systemInfoAnalysis.warnings.length > 0) {
			sections.push("\n⚠️  SYSTEM WARNINGS:")
			systemInfoAnalysis.warnings.forEach((warning) => sections.push(`  - ${warning}`))
		}

		// Feature Comparison Section
		sections.push("\n📊 FEATURE COMPARISON")
		sections.push("-".repeat(40))
		sections.push(`Original Features:`)
		sections.push(`  - Tools: ${originalFeatures.tools.length}`)
		sections.push(`  - MCP Servers: ${originalFeatures.mcpServers.length}`)
		sections.push(`  - Sections: ${originalFeatures.sections.length}`)
		sections.push(`  - Total Length: ${originalFeatures.metadata.totalLength} chars`)
		sections.push("")
		sections.push(`New Features:`)
		sections.push(`  - Tools: ${newFeatures.tools.length}`)
		sections.push(`  - MCP Servers: ${newFeatures.mcpServers.length}`)
		sections.push(`  - Sections: ${newFeatures.sections.length}`)
		sections.push(`  - Total Length: ${newFeatures.metadata.totalLength} chars`)

		return sections.join("\n")
	}

	/**
	 * Generate recommendations based on analysis results
	 */
	private generateRecommendations(
		toolAnalysis: ToolAnalysisResult,
		mcpAnalysis: McpAnalysisResult,
		systemInfoAnalysis: SystemInfoAnalysisResult,
	): string[] {
		const recommendations: string[] = []

		// Tool recommendations
		recommendations.push(...toolAnalysis.suggestions)

		// MCP recommendations
		recommendations.push(...mcpAnalysis.suggestions)

		// System info recommendations
		recommendations.push(...systemInfoAnalysis.suggestions)

		// General recommendations
		if (toolAnalysis.criticalIssues.length > 0) {
			recommendations.push("🚨 Address all critical tool issues before proceeding")
		}

		if (mcpAnalysis.issues.length > 0) {
			recommendations.push("🔌 Review MCP server configuration changes")
		}

		if (!systemInfoAnalysis.isIdentical) {
			recommendations.push("💻 Verify system information changes are intentional")
		}

		// Performance recommendations
		if (toolAnalysis.totalTools > 50) {
			recommendations.push("⚡ Consider tool performance impact with large tool sets")
		}

		// Default recommendation if no specific issues
		if (recommendations.length === 0) {
			recommendations.push("✅ Validation passed successfully - no specific recommendations")
		}

		return recommendations
	}

	/**
	 * Determine overall validation validity
	 */
	private determineOverallValidity(
		toolAnalysis: ToolAnalysisResult,
		mcpAnalysis: McpAnalysisResult,
		systemInfoAnalysis: SystemInfoAnalysisResult,
	): boolean {
		// Critical issues make validation invalid
		if (toolAnalysis.criticalIssues.length > 0) {
			return false
		}

		// Missing MCP servers make validation invalid
		if (mcpAnalysis.issues.length > 0) {
			return false
		}

		// Missing system info fields make validation invalid
		if (systemInfoAnalysis.issues.length > 0) {
			return false
		}

		// Otherwise, validation is valid
		return true
	}

	/**
	 * Extract missing tool names from analysis
	 */
	private extractMissingToolNames(toolAnalysis: ToolAnalysisResult): string[] {
		const missingTools: string[] = []

		// Extract from critical issues
		toolAnalysis.criticalIssues.forEach((issue) => {
			const match = issue.match(/tool '([^']+)' is missing/)
			if (match) {
				missingTools.push(match[1])
			}
		})

		// Extract from warnings
		toolAnalysis.warnings.forEach((warning) => {
			const match = warning.match(/Tool '([^']+)' is missing/)
			if (match) {
				missingTools.push(match[1])
			}
		})

		return missingTools
	}

	/**
	 * Generate validation summary for console output
	 */
	generateConsoleSummary(result: ValidationResult): string {
		const status = result.isValid ? "✅ PASS" : "❌ FAIL"
		const toolCount = `${result.toolAnalysis.preservedTools}/${result.toolAnalysis.totalTools} tools`
		const mcpCount = `${result.mcpAnalysis.preservedServers}/${result.mcpAnalysis.totalServers} MCP servers`

		return `${status} | ${toolCount} | ${mcpCount} | ${result.recommendations.length} recommendations`
	}
}
