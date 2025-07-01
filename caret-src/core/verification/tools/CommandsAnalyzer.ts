/**
 * Commands Analysis Tool
 *
 * Specialized analyzer for commands.ts (179 lines):
 * - Structured command response templates
 * - High JSON conversion readiness
 * - Low conversion risk
 *
 * Expected to be the first conversion target due to structure.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { CaretLogger } from "../../../utils/caret-logger"
import {
	CommandsAnalysis,
	CommandDefinition,
	ResponsePattern,
	ParameterSchema,
	UsagePattern,
	Parameter,
	JsonReadinessScore,
	ConversionRecommendation,
} from "../types"

export class CommandsAnalyzer {
	private commandsPath: string
	private caretLogger: CaretLogger

	constructor(projectRoot: string) {
		this.commandsPath = path.join(projectRoot, "src/core/prompts/commands.ts")
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Analyze command structures - main entry point
	 */
	async analyzeCommandStructures(): Promise<CommandsAnalysis> {
		this.caretLogger.info("[CommandsAnalyzer] Starting commands.ts analysis")

		try {
			const content = await fs.readFile(this.commandsPath, "utf-8")

			return {
				commandDefinitions: await this.extractCommandDefinitions(content),
				responsePatterns: await this.extractResponsePatterns(content),
				parameterSchemas: await this.extractParameterSchemas(content),
				usagePatterns: await this.analyzeUsagePatterns(content),
				jsonConversionReadiness: await this.assessJsonReadiness(content),
				conversionRecommendations: await this.generateConversionRecommendations(content),
			}
		} catch (error) {
			this.caretLogger.error(`[CommandsAnalyzer] Failed to analyze commands.ts: ${error}`)
			throw error
		}
	}

	/**
	 * Extract command definitions from the file
	 */
	private async extractCommandDefinitions(content: string): Promise<CommandDefinition[]> {
		const commands: CommandDefinition[] = []

		// Pattern for exported command functions
		const commandRegex = /export\s+const\s+(\w+(?:Command|Response|Tool)?)\s*=\s*\(\)\s*=>\s*\n?\s*`([\s\S]*?)`/g

		let match
		while ((match = commandRegex.exec(content)) !== null) {
			const commandName = match[1]
			const commandContent = match[2]

			commands.push({
				name: commandName,
				type: this.determineCommandType(commandName),
				content: commandContent,
				parameters: this.extractParametersFromCommand(commandContent),
				conversionComplexity: this.assessCommandConversionComplexity(commandContent),
				jsonTemplate: this.generateJsonTemplate(commandName, commandContent),
			})
		}

		this.caretLogger.info(`[CommandsAnalyzer] Extracted ${commands.length} command definitions`)
		return commands
	}

	/**
	 * Extract response patterns
	 */
	private async extractResponsePatterns(content: string): Promise<ResponsePattern[]> {
		const patterns: ResponsePattern[] = []

		// Common response patterns in commands
		const responsePatterns = [
			{ pattern: /<explicit_instructions.*?>/g, type: "directive_wrapper" },
			{ pattern: /<(\w+)>/g, type: "xml_tag" },
			{ pattern: /Usage:\s*\n<(\w+)>/g, type: "usage_example" },
			{ pattern: /Parameters:\s*\n-\s*(\w+):/g, type: "parameter_definition" },
		]

		for (const { pattern, type } of responsePatterns) {
			const matches = content.match(pattern) || []
			if (matches.length > 0) {
				patterns.push({
					pattern: type,
					frequency: matches.length,
					conversionType: this.determineConversionType(type),
				})
			}
		}

		return patterns
	}

	/**
	 * Extract parameter schemas
	 */
	private async extractParameterSchemas(content: string): Promise<ParameterSchema[]> {
		const schemas: ParameterSchema[] = []

		// Extract parameter definitions from tool descriptions
		const parameterRegex = /-\s*(\w+):\s*\((required|optional)\)\s*(.*?)(?=\n-|\n\n|Usage:|$)/gs

		let match
		while ((match = parameterRegex.exec(content)) !== null) {
			const paramName = match[1]
			const required = match[2] === "required"
			const description = match[3].trim()

			schemas.push({
				parameter: paramName,
				type: this.inferParameterType(description),
				required: required,
				jsonCompatible: this.isJsonCompatible(description),
			})
		}

		return schemas
	}

	/**
	 * Analyze usage patterns
	 */
	private async analyzeUsagePatterns(content: string): Promise<UsagePattern[]> {
		const patterns: UsagePattern[] = []

		// Count different usage contexts
		const usageContexts = [
			{ context: "Tool definitions", pattern: /Description:/g },
			{ context: "Parameter specifications", pattern: /Parameters:/g },
			{ context: "Usage examples", pattern: /Usage:/g },
			{ context: "XML templates", pattern: /<\w+>/g },
		]

		for (const { context, pattern } of usageContexts) {
			const matches = content.match(pattern) || []
			if (matches.length > 0) {
				patterns.push({
					context: context,
					frequency: matches.length,
					conversionImpact: this.assessConversionImpact(context, matches.length),
				})
			}
		}

		return patterns
	}

	/**
	 * Assess JSON conversion readiness - commands.ts should score very high
	 */
	private async assessJsonReadiness(content: string): Promise<JsonReadinessScore> {
		// Commands.ts is highly structured and ideal for JSON conversion
		const structureIndicators = {
			exportedFunctions: (content.match(/export\s+const\s+\w+/g) || []).length,
			templateStrings: (content.match(/`[\s\S]*?`/g) || []).length,
			staticContent: content.length - (content.match(/\$\{[\s\S]*?\}/g) || []).join("").length,
			xmlStructures: (content.match(/<\w+>/g) || []).length,
		}

		// High structure score due to consistent patterns
		const structureScore = Math.min(
			1.0,
			structureIndicators.exportedFunctions * 0.2 + structureIndicators.xmlStructures * 0.01 + 0.6, // Base score for well-structured file
		)

		// Low complexity score (good for conversion)
		const complexityScore = Math.max(
			0.1,
			1.0 - ((content.match(/function\s*\(/g) || []).length * 0.1 + (content.match(/if\s*\(/g) || []).length * 0.05),
		)

		// Very low risk score due to static nature
		const riskScore = Math.max(0.05, (content.match(/dynamic|runtime|eval/gi) || []).length * 0.1)

		return {
			structureScore: structureScore,
			complexityScore: complexityScore,
			riskScore: riskScore,
			conversionEffort: "low",
			recommendedPriority: "high",
			confidenceLevel: 0.95, // Very high confidence for commands.ts
		}
	}

	/**
	 * Generate conversion recommendations
	 */
	private async generateConversionRecommendations(content: string): Promise<ConversionRecommendation[]> {
		const recommendations: ConversionRecommendation[] = []

		// Primary recommendation: Direct JSON conversion
		recommendations.push({
			recommendation: "Direct JSON template conversion",
			priority: "high",
			effort: "low",
			benefit: "High token efficiency, modular structure, easy maintenance",
		})

		// Structure-specific recommendations
		if (content.includes("<explicit_instructions")) {
			recommendations.push({
				recommendation: "Convert explicit_instructions wrapper to JSON template",
				priority: "high",
				effort: "low",
				benefit: "Standardized directive structure",
			})
		}

		if (content.includes("Usage:")) {
			recommendations.push({
				recommendation: "Separate usage examples into dedicated JSON section",
				priority: "medium",
				effort: "low",
				benefit: "Reusable examples, better organization",
			})
		}

		// Parameter handling recommendation
		const parameterCount = (content.match(/Parameters:/g) || []).length
		if (parameterCount > 0) {
			recommendations.push({
				recommendation: "Extract parameter schemas to JSON definitions",
				priority: "medium",
				effort: "medium",
				benefit: "Type safety, validation, documentation generation",
			})
		}

		return recommendations
	}

	/**
	 * Extract parameters from command content
	 */
	private extractParametersFromCommand(content: string): Parameter[] {
		const parameters: Parameter[] = []
		const paramRegex = /-\s*(\w+):\s*\((required|optional)\)\s*(.*?)(?=\n-|\n\n|Usage:|$)/gs

		let match
		while ((match = paramRegex.exec(content)) !== null) {
			parameters.push({
				name: match[1],
				type: this.inferParameterType(match[3]),
				required: match[2] === "required",
				description: match[3].trim(),
			})
		}

		return parameters
	}

	/**
	 * Determine command type based on name
	 */
	private determineCommandType(name: string): "function" | "constant" | "template" {
		if (name.includes("Response") || name.includes("Tool")) {
			return "template"
		}
		if (name.includes("Command")) {
			return "function"
		}
		return "constant"
	}

	/**
	 * Assess command conversion complexity
	 */
	private assessCommandConversionComplexity(content: string): "low" | "medium" | "high" {
		// Commands are mostly static templates, so complexity should be low
		const complexityIndicators = [
			(content.match(/\$\{/g) || []).length, // Template variables
			(content.match(/function/g) || []).length, // Function calls
			(content.match(/if\s*\(/g) || []).length, // Conditionals
		]

		const totalComplexity = complexityIndicators.reduce((sum, count) => sum + count, 0)

		if (totalComplexity === 0) return "low"
		if (totalComplexity <= 2) return "low" // Still low due to static nature
		if (totalComplexity <= 5) return "medium"
		return "high"
	}

	/**
	 * Generate JSON template for command
	 */
	private generateJsonTemplate(commandName: string, content: string): string {
		// Generate a sample JSON structure for the command
		const template = {
			name: commandName,
			type: "command_response",
			template: content.substring(0, 200) + "...",
			parameters: this.extractParametersFromCommand(content).map((p) => ({
				name: p.name,
				required: p.required,
				type: p.type,
			})),
			usage_pattern: this.extractUsagePattern(content),
		}

		return JSON.stringify(template, null, 2)
	}

	/**
	 * Extract usage pattern from content
	 */
	private extractUsagePattern(content: string): string {
		const usageMatch = content.match(/Usage:\s*\n([\s\S]*?)(?=\n\n|$)/)
		return usageMatch ? usageMatch[1].trim() : "No usage pattern found"
	}

	/**
	 * Determine conversion type for response patterns
	 */
	private determineConversionType(patternType: string): "direct" | "template" | "dynamic" {
		switch (patternType) {
			case "directive_wrapper":
			case "xml_tag":
				return "template"
			case "usage_example":
				return "direct"
			case "parameter_definition":
				return "template"
			default:
				return "direct"
		}
	}

	/**
	 * Infer parameter type from description
	 */
	private inferParameterType(description: string): string {
		if (description.toLowerCase().includes("boolean") || description.includes("true or false")) {
			return "boolean"
		}
		if (description.toLowerCase().includes("number") || description.includes("coordinate")) {
			return "number"
		}
		if (description.toLowerCase().includes("array") || description.includes("list")) {
			return "array"
		}
		if (description.toLowerCase().includes("object") || description.includes("json")) {
			return "object"
		}
		return "string" // Default type
	}

	/**
	 * Check if parameter description suggests JSON compatibility
	 */
	private isJsonCompatible(description: string): boolean {
		const incompatibleKeywords = ["function", "dynamic", "runtime", "eval", "code"]
		return !incompatibleKeywords.some((keyword) => description.toLowerCase().includes(keyword))
	}

	/**
	 * Assess conversion impact for usage patterns
	 */
	private assessConversionImpact(context: string, frequency: number): "low" | "medium" | "high" {
		// Commands.ts has low impact due to static nature
		if (context === "Tool definitions" && frequency > 3) return "medium"
		if (context === "XML templates" && frequency > 10) return "medium"
		return "low" // Generally low impact for structured commands
	}
}
