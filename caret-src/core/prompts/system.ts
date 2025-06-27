// CARET MODIFICATION: JSON-based system prompt replacement
// This replaces Cline's hardcoded 707-line system prompt with JSON-based generation
// while maintaining 100% feature compatibility

import { CaretSystemPrompt } from './CaretSystemPrompt'

// Keep addUserInstructions as-is from Cline (no change needed)
export { addUserInstructions } from "../../../src/core/prompts/system"

/**
 * SYSTEM_PROMPT replacement with JSON-based generation
 * 
 * This function maintains the exact same signature as Cline's original SYSTEM_PROMPT
 * but uses CaretSystemPrompt.generateFromJsonSections() internally
 */
export const SYSTEM_PROMPT = async (
	cwd: string,
	supportsBrowserUse: boolean,
	mcpHub: any, // McpHub type from Cline
	browserSettings: any, // BrowserSettings type from Cline
	isClaude4ModelFamily: boolean = false,
): Promise<string> => {
	try {
		// Get CaretSystemPrompt singleton instance
		// Note: extensionPath will be provided during extension initialization
		const caretSystemPrompt = CaretSystemPrompt.getInstance()
		
		// Generate prompt using JSON sections
		const prompt = await caretSystemPrompt.generateFromJsonSections(
			cwd,
			supportsBrowserUse,
			mcpHub,
			browserSettings,
			isClaude4ModelFamily
		)
		
		return prompt
		
	} catch (error) {
		// Fallback to original Cline system prompt if JSON generation fails
		console.error("[CaretSystemPrompt] JSON generation failed, falling back to Cline original:", error)
		
		const { SYSTEM_PROMPT: originalSystemPrompt } = await import("../../../src/core/prompts/system")
		return await originalSystemPrompt(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
	}
}