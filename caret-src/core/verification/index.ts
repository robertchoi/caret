/**
 * Cline Feature Validation System - Module Index
 *
 * Centralized exports for all validation system components.
 * Makes importing clean and organized throughout the codebase.
 */

// Main validator (orchestrator)
export { ClineFeatureValidator } from "./ClineFeatureValidator"

// Extended prompt validation system (003-07)
export { ExtendedPromptValidator } from "./ExtendedPromptValidator"

// Specialized analysis tools
export { Claude4PromptAnalyzer } from "./tools/Claude4PromptAnalyzer"
export { CommandsAnalyzer } from "./tools/CommandsAnalyzer"
export { McpDocumentationAnalyzer } from "./tools/McpDocumentationAnalyzer"

// Type definitions
export * from "./types"

// Specialized modules for extensibility
export { ToolExtractor } from "./extractors/ToolExtractor"
export { McpExtractor } from "./extractors/McpExtractor"
export { SystemInfoExtractor } from "./extractors/SystemInfoExtractor"

// Validation engine
export { ValidationEngine } from "./engines/ValidationEngine"

// Report generation
export { ReportGenerator } from "./generators/ReportGenerator"

// Metrics collection
export { MetricsCollector } from "./collectors/MetricsCollector"

// Export validation context types for external use
export type { SystemPromptContext } from "./types"

// Convenience re-exports for backward compatibility
export type {
	ValidationResult,
	ValidationContext,
	FeatureExtractionResult,
	ToolDefinition,
	ToolAnalysisResult,
	McpAnalysisResult,
	SystemInfoAnalysisResult,
	ValidationMetrics,
} from "./types"
