/**
 * Cline Feature Validation System Types
 *
 * This module defines all the types and interfaces needed for validating
 * that Cline's system prompt features are preserved when modified.
 */

import { McpHub } from "@services/mcp/McpHub"
import { BrowserSettings } from "@shared/BrowserSettings"

/**
 * Context required for system prompt generation
 */
export interface SystemPromptContext {
	cwd: string
	supportsBrowserUse: boolean
	mcpHub: McpHub
	browserSettings: BrowserSettings
	isClaude4ModelFamily?: boolean
}

/**
 * Definition of a tool available in the system prompt
 */
export interface ToolDefinition {
	name: string
	description: string
	parameters: ParameterDefinition[]
	usage: string
	examples: string[]
	category: ToolCategory
}

/**
 * Parameter definition for a tool
 */
export interface ParameterDefinition {
	name: string
	required: boolean
	type: "string" | "boolean" | "object" | "array"
	description: string
}

/**
 * Categories of tools in Cline
 */
export type ToolCategory =
	| "core" // Always available (execute_command, read_file, etc.)
	| "conditional" // Available based on conditions (browser_action)
	| "mcp" // MCP-related tools (use_mcp_tool, access_mcp_resource)
	| "interactive" // User interaction tools (ask_followup_question, attempt_completion)
	| "task" // Task management tools (new_task, plan_mode_respond)

/**
 * System prompt branches/variants
 */
export type SystemPromptVariant =
	| "default" // Standard Cline prompt
	| "claude4" // Claude4 optimized
	| "claude4-experimental" // Claude4 with experimental features

/**
 * MCP server information extracted from prompt
 */
export interface McpServerInfo {
	name: string
	config: string
	tools: McpToolDefinition[]
	resourceTemplates: McpResourceTemplate[]
	resources: McpResourceDefinition[]
	status: "connected" | "disconnected"
}

/**
 * MCP tool definition
 */
export interface McpToolDefinition {
	name: string
	description: string
	inputSchema?: any
}

/**
 * MCP resource template
 */
export interface McpResourceTemplate {
	name: string
	uriTemplate: string
	description: string
}

/**
 * MCP resource definition
 */
export interface McpResourceDefinition {
	name: string
	uri: string
	description: string
}

/**
 * System information included in prompt
 */
export interface SystemInfo {
	operatingSystem: string
	defaultShell: string
	homeDirectory: string
	currentWorkingDirectory: string
}

/**
 * Comprehensive validation result
 */
export interface ValidationResult {
	// Overall validation status
	isValid: boolean
	allToolsPreserved: boolean
	mcpIntegrationIntact: boolean
	systemInfoCorrect: boolean

	// Missing or modified content
	missingTools: string[]
	modifiedTools: ToolComparisonResult[]
	newTools: string[]
	missingMcpFeatures: string[]

	// Detailed analysis
	toolAnalysis: ToolAnalysisResult
	mcpAnalysis: McpAnalysisResult
	systemInfoAnalysis: SystemInfoAnalysisResult

	// Report generation
	summary: string
	detailedReport: string
	recommendations: string[]
}

/**
 * Tool comparison result for modified tools
 */
export interface ToolComparisonResult {
	toolName: string
	changes: ToolChange[]
	severity: "minor" | "major" | "breaking"
}

/**
 * Individual tool change
 */
export interface ToolChange {
	field: "description" | "parameters" | "usage" | "examples"
	original: string
	modified: string
	impact: string
}

/**
 * Tool analysis result
 */
export interface ToolAnalysisResult {
	totalTools: number
	coreTools: number
	conditionalTools: number
	mcpTools: number
	interactiveTools: number
	taskTools: number

	preservedTools: number
	modifiedTools: number
	missingTools: number
	newTools: number

	criticalIssues: string[]
	warnings: string[]
}

/**
 * MCP integration analysis result
 */
export interface McpAnalysisResult {
	serverCount: number
	connectedServers: number
	totalTools: number
	totalResources: number

	integrationPreserved: boolean
	dynamicContentHandled: boolean

	issues: string[]
	warnings: string[]
}

/**
 * System information analysis result
 */
export interface SystemInfoAnalysisResult {
	osInfoPresent: boolean
	shellInfoPresent: boolean
	directoryInfoPresent: boolean
	dynamicGenerationWorking: boolean

	issues: string[]
}

/**
 * Validation context for different scenarios
 */
export interface ValidationContext {
	variant: SystemPromptVariant
	testMode: boolean
	strictMode: boolean
	ignoreWarnings: boolean
	customValidationRules?: ValidationRule[]
}

/**
 * Custom validation rule
 */
export interface ValidationRule {
	name: string
	description: string
	severity: "error" | "warning" | "info"
	validator: (originalPrompt: string, newPrompt: string) => ValidationIssue[]
}

/**
 * Validation issue
 */
export interface ValidationIssue {
	type: "error" | "warning" | "info"
	message: string
	location?: string
	suggestion?: string
}

/**
 * Feature extraction result from prompt analysis
 */
export interface FeatureExtractionResult {
	tools: ToolDefinition[]
	mcpServers: McpServerInfo[]
	systemInfo: SystemInfo
	sections: PromptSection[]
	metadata: PromptMetadata
}

/**
 * Prompt section information
 */
export interface PromptSection {
	name: string
	startLine: number
	endLine: number
	content: string
	type: "header" | "tools" | "mcp" | "rules" | "examples" | "system"
}

/**
 * Prompt metadata
 */
export interface PromptMetadata {
	totalLength: number
	toolCount: number
	mcpServerCount: number
	variant: SystemPromptVariant
	generationTimestamp: number
}

/**
 * Tool extraction options
 */
export interface ToolExtractionOptions {
	includeExamples: boolean
	includeUsage: boolean
	strictParsing: boolean
	customPatterns?: RegExp[]
}

/**
 * Performance metrics for validation
 */
export interface ValidationMetrics {
	extractionTime: number
	validationTime: number
	totalTime: number
	memoryUsage: number

	toolsExtracted: number
	sectionsAnalyzed: number
	issuesFound: number

	errors: number
	warnings: number
	suggestions: number
}

/**
 * Extended validation types for AI prompt files analysis
 */

export interface ExtendedValidationResult {
	systemValidationPattern: any
	promptFilesAnalysis: PromptFilesValidationResult
	conversionPlan: ConversionPlan
	riskAssessment: RiskAssessment
	clineMode: boolean
	targetFiles: string[]
	timestamp: number
	isValid: boolean
	recommendedNext: string[]
}

export interface PromptFilesValidationResult {
	fileAnalyses: Record<string, any>
	analysisMetadata: AnalysisMetadata
}

export interface AnalysisMetadata {
	analyzedFiles: string[]
	successfulAnalyses: number
	failedAnalyses: number
	clineMode: boolean
	timestamp: number
}

export interface ConversionPlan {
	conversionOrder: ConversionPhase[]
	estimatedTokenSavings: Record<string, string>
}

export interface ConversionPhase {
	file: string
	priority: number
	reason: string
	expectedEffort: "low" | "medium" | "high"
	expectedBenefit: "low" | "medium" | "high" | "very_high"
}

export interface RiskAssessment {
	overallRiskLevel: "low" | "medium" | "high"
	riskFactors: RiskFactor[]
	recommendedApproach: string
}

export interface RiskFactor {
	factor: string
	level: "low" | "medium" | "high" | "critical"
	mitigation: string
}

/**
 * Claude4 Analysis Types
 */

export interface Claude4Analysis {
	mainPrompt?: MainPromptAnalysis
	experimental?: ExperimentalPromptAnalysis
	compatibility: CompatibilityAnalysis
	conversionReadiness: ConversionReadiness
	tokenOptimization: TokenOptimizationAnalysis
	modeSpecificAnalysis: ModeSpecificAnalysis
}

export interface MainPromptAnalysis {
	modelOptimizations: ModelOptimization[]
	performanceCriticalSections: PerformanceSection[]
	toolDefinitions: ToolDefinition[]
	conditionalLogic: ConditionalBlock[]
	templateStructures: TemplateStructure[]
	jsonConversionCandidates: JsonCandidate[]
}

export interface ExperimentalPromptAnalysis {
	experimentalFeatures: ExperimentalFeature[]
	stabilityIndicators: StabilityIndicator[]
	changeFrequency: ChangeFrequencyAnalysis
	riskFactors: ExperimentalRiskFactor[]
	conversionStrategy: ConversionStrategy
}

export interface ModelOptimization {
	type: "claude4_specific" | "performance" | "token_optimization"
	content: string
	startIndex: number
	length: number
	conversionComplexity: "low" | "medium" | "high"
}

export interface PerformanceSection {
	name: string
	content: string
	startIndex: number
	endIndex: number
	criticalityLevel: "low" | "medium" | "high" | "critical"
	conversionRisk: "low" | "medium" | "high"
}

export interface ExperimentalFeature {
	type: "marked_experimental" | "feature_flag" | "experimental_comment"
	content: string
	stabilityRisk: "low" | "medium" | "high"
	conversionPriority: "low" | "medium" | "high"
}

export interface ConditionalBlock {
	condition: string
	content: string
	complexity: "low" | "medium" | "high"
	jsonCompatibility: boolean
}

export interface TemplateStructure {
	name: string
	pattern: string
	variableCount: number
	jsonReadiness: "ready" | "needs_work" | "complex"
}

export interface JsonCandidate {
	section: string
	conversionType: "direct" | "template" | "dynamic"
	estimatedEffort: "low" | "medium" | "high"
	tokenSavingPotential: number
}

export interface StabilityIndicator {
	indicator: string
	value: string | number
	interpretation: "stable" | "moderate" | "unstable"
}

export interface ChangeFrequencyAnalysis {
	recentChanges: number
	changePattern: "stable" | "evolving" | "rapid"
	riskLevel: "low" | "medium" | "high"
}

export interface ExperimentalRiskFactor {
	factor: string
	impact: "low" | "medium" | "high"
	mitigation: string
}

export interface ConversionStrategy {
	approach: "full_json" | "hybrid" | "gradual"
	description: string
	phases: string[]
	riskLevel: "low" | "medium" | "high"
	estimatedEffort: "low" | "medium" | "high"
}

export interface CompatibilityAnalysis {
	clineMode: CompatibilityScore
	caretMode: CompatibilityScore
	conversionChallenges: string[]
	recommendedStrategy: string
}

export interface CompatibilityScore {
	score: number
	issues: string[]
	strengths: string[]
}

export interface ConversionReadiness {
	overallScore: number
	readinessFactors: ReadinessFactor[]
	blockers: string[]
	recommendations: string[]
}

export interface ReadinessFactor {
	factor: string
	score: number
	weight: number
	description: string
}

export interface TokenOptimizationAnalysis {
	currentTokenCount: number
	estimatedOptimizedCount: number
	optimizationPotential: number
	optimizationAreas: OptimizationArea[]
}

export interface OptimizationArea {
	area: string
	currentTokens: number
	optimizedTokens: number
	technique: string
}

export interface ModeSpecificAnalysis {
	clineMode: {
		planActReferences: PlanActReference[]
		clineSpecificTerms: string[]
		originalBehaviorPatterns: BehaviorPattern[]
	}
	caretMode: {
		chatbotAgentReferences: ChatbotAgentReference[]
		caretSpecificTerms: string[]
		jsonConversionTargets: JsonConversionTarget[]
	}
	modeCompatibility: {
		conflictingTerms: ConflictingTerm[]
		conversionChallenges: ConversionChallenge[]
		dualModeStrategy: DualModeStrategy
	}
}

export interface PlanActReference {
	reference: string
	context: string
	conversionNote: string
}

export interface BehaviorPattern {
	pattern: string
	frequency: number
	importance: "low" | "medium" | "high" | "critical"
}

export interface ChatbotAgentReference {
	reference: string
	context: string
	jsonStructure: string
}

export interface JsonConversionTarget {
	target: string
	conversionType: "direct" | "template" | "conditional"
	complexity: "low" | "medium" | "high"
}

export interface ConflictingTerm {
	term: string
	clineUsage: string
	caretUsage: string
	resolutionStrategy: string
}

export interface ConversionChallenge {
	challenge: string
	impact: "low" | "medium" | "high"
	solution: string
}

export interface DualModeStrategy {
	strategy: string
	implementation: string[]
	validationSteps: string[]
}

/**
 * Commands Analysis Types
 */

export interface CommandsAnalysis {
	commandDefinitions: CommandDefinition[]
	responsePatterns: ResponsePattern[]
	parameterSchemas: ParameterSchema[]
	usagePatterns: UsagePattern[]
	jsonConversionReadiness: JsonReadinessScore
	conversionRecommendations: ConversionRecommendation[]
}

export interface CommandDefinition {
	name: string
	type: "function" | "constant" | "template"
	content: string
	parameters: Parameter[]
	conversionComplexity: "low" | "medium" | "high"
	jsonTemplate: string
}

export interface ResponsePattern {
	pattern: string
	frequency: number
	conversionType: "direct" | "template" | "dynamic"
}

export interface ParameterSchema {
	parameter: string
	type: string
	required: boolean
	jsonCompatible: boolean
}

export interface UsagePattern {
	context: string
	frequency: number
	conversionImpact: "low" | "medium" | "high"
}

export interface Parameter {
	name: string
	type: string
	required: boolean
	description?: string
}

export interface JsonReadinessScore {
	structureScore: number
	complexityScore: number
	riskScore: number
	conversionEffort: "low" | "medium" | "high"
	recommendedPriority: "low" | "medium" | "high"
	confidenceLevel: number
}

export interface ConversionRecommendation {
	recommendation: string
	priority: "low" | "medium" | "high"
	effort: "low" | "medium" | "high"
	benefit: string
}

/**
 * MCP Documentation Analysis Types
 */

export interface McpDocAnalysis {
	dynamicContentSections: DynamicSection[]
	externalDependencies: ExternalDependency[]
	templateGeneration: TemplateGenerationAnalysis
	complexConversionAreas: ComplexArea[]
	conversionStrategy: ConversionStrategy
	riskAssessment: McpRiskAssessment
}

export interface DynamicSection {
	type: "mcp_hub_call" | "server_iteration" | "tool_iteration" | "resource_filtering"
	content: string
	startIndex: number
	endIndex: number
	conversionComplexity: "low" | "medium" | "high"
}

export interface ExternalDependency {
	dependency: string
	type: "api" | "service" | "data"
	impact: "low" | "medium" | "high"
	conversionStrategy: string
}

export interface TemplateGenerationAnalysis {
	staticSections: StaticSection[]
	dynamicSections: DynamicGenerationSection[]
	templateCompatibility: "high" | "medium" | "low"
}

export interface StaticSection {
	section: string
	jsonReadiness: "ready" | "needs_work" | "complex"
	conversionEffort: "low" | "medium" | "high"
}

export interface DynamicGenerationSection {
	section: string
	generationType: "iteration" | "conditional" | "api_dependent"
	conversionApproach: "template" | "hybrid" | "preserve_dynamic"
}

export interface ComplexArea {
	area: string
	complexity: "medium" | "high" | "very_high"
	challenges: string[]
	recommendedApproach: string
}

export interface McpRiskAssessment {
	overallRisk: "low" | "medium" | "high"
	specificRisks: SpecificRisk[]
	mitigationStrategies: string[]
}

export interface SpecificRisk {
	risk: string
	probability: "low" | "medium" | "high"
	impact: "low" | "medium" | "high"
	mitigation: string
}
