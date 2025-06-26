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
