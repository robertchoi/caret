/**
 * Cline Feature Validation System - Module Index
 *
 * Centralized exports for all validation system components.
 * Makes importing clean and organized throughout the codebase.
 */

// Main validator (orchestrator)
export { ClineFeatureValidator } from "./ClineFeatureValidator"

// Type definitions
export * from "./types"

// Specialized extractors
export { ToolExtractor } from "./extractors/ToolExtractor"
export { McpExtractor } from "./extractors/McpExtractor"
export { SystemInfoExtractor } from "./extractors/SystemInfoExtractor"

// Validation engine
export { ValidationEngine } from "./engines/ValidationEngine"

// Report generation
export { ReportGenerator } from "./generators/ReportGenerator"

// Metrics collection
export { MetricsCollector, ValidationSession } from "./collectors/MetricsCollector"

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
