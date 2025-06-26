import { McpHub } from "../../../src/services/mcp/McpHub"
import { BrowserSettings } from "../../../src/shared/BrowserSettings"

/**
 * Context for system prompt generation
 */
export interface SystemPromptContext {
	cwd: string
	supportsBrowserUse: boolean
	mcpHub: McpHub
	browserSettings: BrowserSettings
	isClaude4ModelFamily?: boolean
}

/**
 * Metrics collected during system prompt generation
 */
export interface SystemPromptMetrics {
	generationTime: number
	promptLength: number
	toolCount: number
	mcpServerCount: number
	timestamp: number
}

/**
 * Result of system prompt generation
 */
export interface SystemPromptResult {
	prompt: string
	metrics: SystemPromptMetrics
}
