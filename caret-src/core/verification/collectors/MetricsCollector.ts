/**
 * Metrics Collection Module
 *
 * Handles collection and management of validation performance metrics.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import { ValidationMetrics, ValidationResult } from "../types"

export class MetricsCollector {
	private caretLogger: CaretLogger
	private validationMetrics: ValidationMetrics[]

	constructor() {
		this.caretLogger = new CaretLogger()
		this.validationMetrics = []
	}

	/**
	 * Start metrics collection for a validation session
	 */
	startValidationMetrics(): ValidationSession {
		return new ValidationSession()
	}

	/**
	 * Record completed validation metrics
	 */
	recordValidationMetrics(
		session: ValidationSession,
		result: ValidationResult,
		extractedToolCount: number,
		sectionsAnalyzed: number,
	): void {
		try {
			const endTime = Date.now()
			const totalTime = endTime - session.startTime
			const memoryUsage = process.memoryUsage().heapUsed

			const metrics: ValidationMetrics = {
				extractionTime: session.extractionTime,
				validationTime: session.validationTime,
				totalTime,
				memoryUsage,
				toolsExtracted: extractedToolCount,
				sectionsAnalyzed,
				issuesFound: result.toolAnalysis.criticalIssues.length + result.mcpAnalysis.issues.length,
				errors: result.toolAnalysis.criticalIssues.length,
				warnings: result.toolAnalysis.warnings.length + result.mcpAnalysis.warnings.length,
				suggestions: result.recommendations.length,
			}

			this.validationMetrics.push(metrics)
			this.logValidationResult(result, metrics)
		} catch (error) {
			this.caretLogger.error("[MetricsCollector] Failed to record validation metrics", "METRICS")
			this.caretLogger.error(error instanceof Error ? error.message : String(error))
		}
	}

	/**
	 * Get all recorded validation metrics
	 */
	getValidationMetrics(): ValidationMetrics[] {
		return [...this.validationMetrics]
	}

	/**
	 * Clear all recorded metrics
	 */
	clearValidationMetrics(): void {
		this.validationMetrics = []
		this.caretLogger.debug("[MetricsCollector] Validation metrics cleared", "METRICS")
	}

	/**
	 * Get average validation time
	 */
	getAverageValidationTime(): number {
		if (this.validationMetrics.length === 0) return 0

		const totalTime = this.validationMetrics.reduce((sum, metric) => sum + metric.totalTime, 0)
		return totalTime / this.validationMetrics.length
	}

	/**
	 * Get peak memory usage
	 */
	getPeakMemoryUsage(): number {
		if (this.validationMetrics.length === 0) return 0

		return Math.max(...this.validationMetrics.map((metric) => metric.memoryUsage))
	}

	/**
	 * Get validation performance summary
	 */
	getPerformanceSummary(): {
		totalValidations: number
		averageTime: number
		peakMemory: number
		totalErrors: number
		totalWarnings: number
	} {
		return {
			totalValidations: this.validationMetrics.length,
			averageTime: this.getAverageValidationTime(),
			peakMemory: this.getPeakMemoryUsage(),
			totalErrors: this.validationMetrics.reduce((sum, metric) => sum + metric.errors, 0),
			totalWarnings: this.validationMetrics.reduce((sum, metric) => sum + metric.warnings, 0),
		}
	}

	/**
	 * Export metrics to JSON format
	 */
	exportMetrics(): string {
		return JSON.stringify(
			{
				summary: this.getPerformanceSummary(),
				metrics: this.validationMetrics,
			},
			null,
			2,
		)
	}

	/**
	 * Log validation result with metrics
	 */
	private logValidationResult(result: ValidationResult, metrics: ValidationMetrics): void {
		try {
			const status = result.isValid ? "✅" : "❌"
			this.caretLogger.info(
				`[MetricsCollector] Validation ${status} | Time: ${metrics.totalTime}ms | Memory: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB | Tools: ${metrics.toolsExtracted} | Issues: ${metrics.issuesFound}`,
				"METRICS",
			)

			if (metrics.totalTime > 5000) {
				this.caretLogger.warn("[MetricsCollector] Validation took longer than 5 seconds", "PERFORMANCE")
			}

			if (metrics.memoryUsage > 100 * 1024 * 1024) {
				// 100MB
				this.caretLogger.warn("[MetricsCollector] High memory usage detected", "PERFORMANCE")
			}
		} catch (error) {
			this.caretLogger.error("[MetricsCollector] Failed to log validation result", "METRICS")
		}
	}
}

/**
 * Validation session for tracking timing
 */
export class ValidationSession {
	public readonly startTime: number
	public extractionTime: number = 0
	public validationTime: number = 0
	private extractionStartTime: number = 0
	private validationStartTime: number = 0

	constructor() {
		this.startTime = Date.now()
	}

	/**
	 * Start extraction timing
	 */
	startExtraction(): void {
		this.extractionStartTime = Date.now()
	}

	/**
	 * End extraction timing
	 */
	endExtraction(): void {
		if (this.extractionStartTime > 0) {
			this.extractionTime = Date.now() - this.extractionStartTime
		}
	}

	/**
	 * Start validation timing
	 */
	startValidation(): void {
		this.validationStartTime = Date.now()
	}

	/**
	 * End validation timing
	 */
	endValidation(): void {
		if (this.validationStartTime > 0) {
			this.validationTime = Date.now() - this.validationStartTime
		}
	}

	/**
	 * Get elapsed time since session start
	 */
	getElapsedTime(): number {
		return Date.now() - this.startTime
	}
}
