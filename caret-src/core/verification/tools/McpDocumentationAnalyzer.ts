/**
 * MCP Documentation Analysis Tool
 *
 * Specialized analyzer for loadMcpDocumentation.ts (362 lines):
 * - Dynamic content generation
 * - External dependencies (McpHub)
 * - Complex template structures
 * - High conversion complexity
 *
 * Expected to be the last conversion target due to complexity.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { CaretLogger } from "../../../utils/caret-logger"
import {
	McpDocAnalysis,
	DynamicSection,
	ExternalDependency,
	TemplateGenerationAnalysis,
	StaticSection,
	DynamicGenerationSection,
	ComplexArea,
	McpRiskAssessment,
	SpecificRisk,
	ConversionStrategy,
} from "../types"

export class McpDocumentationAnalyzer {
	private mcpDocPath: string
	private caretLogger: CaretLogger

	constructor(projectRoot: string) {
		this.mcpDocPath = path.join(projectRoot, "src/core/prompts/loadMcpDocumentation.ts")
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Analyze MCP documentation generation - main entry point
	 */
	async analyzeMcpDocGeneration(): Promise<McpDocAnalysis> {
		this.caretLogger.info("[McpDocumentationAnalyzer] Starting loadMcpDocumentation.ts analysis")

		try {
			const content = await fs.readFile(this.mcpDocPath, "utf-8")

			return {
				dynamicContentSections: await this.extractDynamicSections(content),
				externalDependencies: await this.identifyExternalDependencies(content),
				templateGeneration: await this.analyzeTemplateGeneration(content),
				complexConversionAreas: await this.identifyComplexAreas(content),
				conversionStrategy: await this.recommendConversionStrategy(content),
				riskAssessment: await this.assessConversionRisk(content),
			}
		} catch (error) {
			this.caretLogger.error(`[McpDocumentationAnalyzer] Failed to analyze loadMcpDocumentation.ts: ${error}`)
			throw error
		}
	}

	/**
	 * Extract dynamic content sections - most complex part
	 */
	private async extractDynamicSections(content: string): Promise<DynamicSection[]> {
		const dynamicPatterns = [
			{ pattern: /mcpHub\.[\w.]+(\([^)]*\))?/g, type: "mcp_hub_call" as const },
			{ pattern: /servers\.map\s*\([^}]+\}/gs, type: "server_iteration" as const },
			{ pattern: /tools\.forEach\s*\([^}]+\}/gs, type: "tool_iteration" as const },
			{ pattern: /resources\.filter\s*\([^}]+\}/gs, type: "resource_filtering" as const },
		]

		const sections: DynamicSection[] = []

		for (const { pattern, type } of dynamicPatterns) {
			let match
			while ((match = pattern.exec(content)) !== null) {
				sections.push({
					type,
					content: match[0],
					startIndex: match.index,
					endIndex: match.index + match[0].length,
					conversionComplexity: this.assessDynamicComplexity(match[0], type),
				})
			}
		}

		// Analyze async/await patterns
		const asyncPatterns = await this.extractAsyncPatterns(content)
		sections.push(...asyncPatterns)

		this.caretLogger.info(`[McpDocumentationAnalyzer] Found ${sections.length} dynamic sections`)
		return sections
	}

	/**
	 * Identify external dependencies
	 */
	private async identifyExternalDependencies(content: string): Promise<ExternalDependency[]> {
		const dependencies: ExternalDependency[] = []

		// McpHub dependency
		if (content.includes("McpHub")) {
			dependencies.push({
				dependency: "McpHub",
				type: "service",
				impact: "high",
				conversionStrategy: "Preserve service calls, wrap in JSON template context",
			})
		}

		// getMcpServersPath dependency
		if (content.includes("getMcpServersPath")) {
			dependencies.push({
				dependency: "getMcpServersPath",
				type: "api",
				impact: "medium",
				conversionStrategy: "Convert to template variable with dynamic resolution",
			})
		}

		// External API references
		const apiReferences = content.match(/https?:\/\/[^\s"']+/g) || []
		for (const apiRef of apiReferences) {
			dependencies.push({
				dependency: apiRef,
				type: "api",
				impact: "low",
				conversionStrategy: "Keep as static template content",
			})
		}

		// Import dependencies
		const importMatches = content.match(/import\s+.*?\s+from\s+["']([^"']+)["']/g) || []
		for (const importMatch of importMatches) {
			const moduleMatch = importMatch.match(/from\s+["']([^"']+)["']/)
			if (moduleMatch) {
				dependencies.push({
					dependency: moduleMatch[1],
					type: "service",
					impact: this.assessImportImpact(moduleMatch[1]),
					conversionStrategy: "Preserve import structure, adapt for JSON context",
				})
			}
		}

		return dependencies
	}

	/**
	 * Analyze template generation patterns
	 */
	private async analyzeTemplateGeneration(content: string): Promise<TemplateGenerationAnalysis> {
		const staticSections = await this.extractStaticSections(content)
		const dynamicSections = await this.extractDynamicGenerationSections(content)

		// Assess overall template compatibility
		const templateCompatibility = this.assessTemplateCompatibility(staticSections, dynamicSections)

		return {
			staticSections,
			dynamicSections,
			templateCompatibility,
		}
	}

	/**
	 * Extract static sections that can be directly converted to JSON
	 */
	private async extractStaticSections(content: string): Promise<StaticSection[]> {
		const sections: StaticSection[] = []

		// Look for large static string blocks
		const staticStringRegex = /`([^`]*(?:\n[^`]*)*)`/g
		let match
		while ((match = staticStringRegex.exec(content)) !== null) {
			const staticContent = match[1]

			// Only consider it static if it has no template variables or function calls
			if (!staticContent.includes("${") && !staticContent.includes("mcpHub") && staticContent.length > 100) {
				sections.push({
					section: "Static Documentation Block",
					jsonReadiness: this.assessStaticJsonReadiness(staticContent),
					conversionEffort: this.assessStaticConversionEffort(staticContent),
				})
			}
		}

		// Look for instruction text
		const instructionSections = this.extractInstructionSections(content)
		sections.push(...instructionSections)

		return sections
	}

	/**
	 * Extract dynamic generation sections
	 */
	private async extractDynamicGenerationSections(content: string): Promise<DynamicGenerationSection[]> {
		const sections: DynamicGenerationSection[] = []

		// Iteration patterns
		const iterationPatterns = [
			{ pattern: /\.map\s*\(/g, type: "iteration" as const },
			{ pattern: /\.forEach\s*\(/g, type: "iteration" as const },
			{ pattern: /\.filter\s*\(/g, type: "iteration" as const },
		]

		for (const { pattern, type } of iterationPatterns) {
			const matches = content.match(pattern) || []
			if (matches.length > 0) {
				sections.push({
					section: `Array ${type} operations`,
					generationType: type,
					conversionApproach: this.recommendIterationConversion(type),
				})
			}
		}

		// Conditional patterns
		if (content.includes("await") || content.includes("async")) {
			sections.push({
				section: "Async operations",
				generationType: "api_dependent",
				conversionApproach: "hybrid",
			})
		}

		// Template literal patterns with complex expressions
		const complexTemplateRegex = /\$\{[^}]*(?:mcpHub|await|\.map|\.filter)[^}]*\}/g
		const complexTemplateMatches = content.match(complexTemplateRegex) || []
		if (complexTemplateMatches.length > 0) {
			sections.push({
				section: "Complex template expressions",
				generationType: "conditional",
				conversionApproach: "preserve_dynamic",
			})
		}

		return sections
	}

	/**
	 * Identify complex areas that need special attention
	 */
	private async identifyComplexAreas(content: string): Promise<ComplexArea[]> {
		const complexAreas: ComplexArea[] = []

		// Async/await complexity
		const asyncCount = (content.match(/async|await/g) || []).length
		if (asyncCount > 5) {
			complexAreas.push({
				area: "Asynchronous Operations",
				complexity: "high",
				challenges: ["Multiple async dependencies", "Complex async/await chains", "Error handling in async context"],
				recommendedApproach: "Hybrid approach: JSON templates + preserved async logic",
			})
		}

		// McpHub integration complexity
		const mcpHubCallCount = (content.match(/mcpHub\./g) || []).length
		if (mcpHubCallCount > 3) {
			complexAreas.push({
				area: "McpHub Service Integration",
				complexity: "very_high",
				challenges: ["External service dependency", "Dynamic data fetching", "Runtime state dependency"],
				recommendedApproach: "Preserve service calls, wrap in JSON template context",
			})
		}

		// Template complexity
		const templateVariableCount = (content.match(/\$\{[^}]+\}/g) || []).length
		if (templateVariableCount > 10) {
			complexAreas.push({
				area: "Template Variable Complexity",
				complexity: "medium",
				challenges: ["Many template variables", "Complex expression evaluation", "Variable scope management"],
				recommendedApproach: "Gradual conversion with variable mapping",
			})
		}

		// Code generation patterns
		if (content.includes("npx") || content.includes("npm install")) {
			complexAreas.push({
				area: "Code Generation Instructions",
				complexity: "medium",
				challenges: ["Platform-specific commands", "Dynamic path generation", "Context-dependent instructions"],
				recommendedApproach: "Template-based with platform detection",
			})
		}

		return complexAreas
	}

	/**
	 * Recommend conversion strategy based on complexity analysis
	 */
	private async recommendConversionStrategy(content: string): Promise<ConversionStrategy> {
		const complexity = await this.calculateOverallComplexity(content)

		if (complexity.score > 0.8) {
			return {
				approach: "hybrid",
				description: "JSON templates for static content + preserved dynamic logic",
				phases: [
					"Phase 1: Extract static documentation to JSON",
					"Phase 2: Create template structure for dynamic content",
					"Phase 3: Preserve McpHub integration as-is",
					"Phase 4: Implement hybrid rendering system",
				],
				riskLevel: "high",
				estimatedEffort: "high",
			}
		} else if (complexity.score > 0.5) {
			return {
				approach: "gradual",
				description: "Incremental JSON conversion with preserved complexity",
				phases: [
					"Phase 1: Identify and extract static sections",
					"Phase 2: Convert simple dynamic sections",
					"Phase 3: Preserve complex async operations",
					"Phase 4: Create unified generation system",
				],
				riskLevel: "medium",
				estimatedEffort: "high",
			}
		} else {
			return {
				approach: "full_json",
				description: "Complete JSON template conversion",
				phases: [
					"Phase 1: Extract all static content",
					"Phase 2: Convert dynamic sections to JSON templates",
					"Phase 3: Implement template engine integration",
				],
				riskLevel: "low",
				estimatedEffort: "medium",
			}
		}
	}

	/**
	 * Assess conversion risk
	 */
	private async assessConversionRisk(content: string): Promise<McpRiskAssessment> {
		const risks: SpecificRisk[] = []

		// External service dependency risk
		if (content.includes("mcpHub")) {
			risks.push({
				risk: "External Service Dependency",
				probability: "high",
				impact: "high",
				mitigation: "Preserve service integration, use dependency injection pattern",
			})
		}

		// Async complexity risk
		const asyncComplexity = (content.match(/async|await/g) || []).length
		if (asyncComplexity > 5) {
			risks.push({
				risk: "Asynchronous Complexity",
				probability: "medium",
				impact: "medium",
				mitigation: "Incremental conversion, preserve async patterns",
			})
		}

		// Dynamic content generation risk
		const dynamicPatterns = (content.match(/\$\{[^}]*(?:map|filter|forEach)[^}]*\}/g) || []).length
		if (dynamicPatterns > 3) {
			risks.push({
				risk: "Dynamic Content Generation",
				probability: "high",
				impact: "medium",
				mitigation: "Hybrid approach, template engine for dynamic sections",
			})
		}

		// File size and complexity risk
		if (content.length > 20000) {
			risks.push({
				risk: "Large File Complexity",
				probability: "medium",
				impact: "medium",
				mitigation: "Break into smaller modules, gradual conversion",
			})
		}

		const overallRisk = this.calculateOverallRisk(risks)

		return {
			overallRisk,
			specificRisks: risks,
			mitigationStrategies: [
				"Start with static content extraction",
				"Preserve all McpHub service calls",
				"Implement hybrid rendering system",
				"Extensive testing with different MCP configurations",
				"Gradual rollout with fallback to original implementation",
			],
		}
	}

	// Helper methods

	/**
	 * Assess dynamic complexity based on type and content
	 */
	private assessDynamicComplexity(content: string, type: string): "low" | "medium" | "high" {
		if (type === "mcp_hub_call") {
			return "high" // Always high due to external dependency
		}

		if (content.includes("await") || content.includes("async")) {
			return "high"
		}

		if (content.includes("map") && content.includes("filter")) {
			return "medium"
		}

		return "low"
	}

	/**
	 * Extract async patterns
	 */
	private async extractAsyncPatterns(content: string): Promise<DynamicSection[]> {
		const patterns: DynamicSection[] = []

		const asyncRegex = /await\s+[^;\n]+/g
		let match
		while ((match = asyncRegex.exec(content)) !== null) {
			patterns.push({
				type: "mcp_hub_call",
				content: match[0],
				startIndex: match.index,
				endIndex: match.index + match[0].length,
				conversionComplexity: "high",
			})
		}

		return patterns
	}

	/**
	 * Assess import impact
	 */
	private assessImportImpact(moduleName: string): "low" | "medium" | "high" {
		if (moduleName.includes("McpHub")) return "high"
		if (moduleName.startsWith("@")) return "medium"
		return "low"
	}

	/**
	 * Assess template compatibility
	 */
	private assessTemplateCompatibility(
		staticSections: StaticSection[],
		dynamicSections: DynamicGenerationSection[],
	): "high" | "medium" | "low" {
		const staticRatio = staticSections.length / (staticSections.length + dynamicSections.length)

		if (staticRatio > 0.7) return "high"
		if (staticRatio > 0.4) return "medium"
		return "low"
	}

	/**
	 * Assess static JSON readiness
	 */
	private assessStaticJsonReadiness(content: string): "ready" | "needs_work" | "complex" {
		if (content.includes("```") || content.includes("\\")) return "needs_work"
		if (content.length > 5000) return "complex"
		return "ready"
	}

	/**
	 * Assess static conversion effort
	 */
	private assessStaticConversionEffort(content: string): "low" | "medium" | "high" {
		if (content.includes("${") || content.includes("\\n")) return "medium"
		if (content.length > 10000) return "high"
		return "low"
	}

	/**
	 * Extract instruction sections
	 */
	private extractInstructionSections(content: string): StaticSection[] {
		const sections: StaticSection[] = []

		// Look for step-by-step instructions
		const instructionPatterns = [/1\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*/g, /###\s+[^\n]+(?:\n[^#]*)?/g]

		for (const pattern of instructionPatterns) {
			const matches = content.match(pattern) || []
			for (const match of matches) {
				sections.push({
					section: "Instruction Text",
					jsonReadiness: "ready",
					conversionEffort: "low",
				})
			}
		}

		return sections
	}

	/**
	 * Recommend iteration conversion approach
	 */
	private recommendIterationConversion(type: string): "template" | "hybrid" | "preserve_dynamic" {
		switch (type) {
			case "iteration":
				return "hybrid" // Complex iteration needs hybrid approach
			default:
				return "template"
		}
	}

	/**
	 * Calculate overall complexity
	 */
	private async calculateOverallComplexity(content: string): Promise<{ score: number; factors: string[] }> {
		const factors = []
		let score = 0

		// Async complexity
		const asyncCount = (content.match(/async|await/g) || []).length
		if (asyncCount > 0) {
			score += asyncCount * 0.1
			factors.push(`Async operations: ${asyncCount}`)
		}

		// McpHub dependencies
		const mcpHubCount = (content.match(/mcpHub\./g) || []).length
		if (mcpHubCount > 0) {
			score += mcpHubCount * 0.15
			factors.push(`McpHub calls: ${mcpHubCount}`)
		}

		// Template variables
		const templateVarCount = (content.match(/\$\{[^}]+\}/g) || []).length
		if (templateVarCount > 0) {
			score += templateVarCount * 0.05
			factors.push(`Template variables: ${templateVarCount}`)
		}

		// File size factor
		const sizeComplexity = content.length / 50000
		score += sizeComplexity
		factors.push(`File size complexity: ${sizeComplexity.toFixed(2)}`)

		return {
			score: Math.min(1.0, score),
			factors,
		}
	}

	/**
	 * Calculate overall risk level
	 */
	private calculateOverallRisk(risks: SpecificRisk[]): "low" | "medium" | "high" {
		const highRisks = risks.filter((r) => r.impact === "high").length
		const mediumRisks = risks.filter((r) => r.impact === "medium").length

		if (highRisks > 2) return "high"
		if (highRisks > 0 || mediumRisks > 3) return "medium"
		return "low"
	}
}
