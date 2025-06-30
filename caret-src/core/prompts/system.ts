// CARET MODIFICATION: JSON-based system prompt replacement
// This replaces Cline's hardcoded 707-line system prompt with JSON-based generation
// while maintaining 100% feature compatibility

import { CaretSystemPrompt } from "./CaretSystemPrompt"

// Keep addUserInstructions as-is from Cline (no change needed)
export { addUserInstructions } from "../../../src/core/prompts/system"

/**
 * SYSTEM_PROMPT replacement with JSON-based generation
 *
 * CARET MODIFICATION: Extended to support extensionPath and mode parameters
 * for Caret vs Cline system selection and mode-based prompt generation
 */
export const SYSTEM_PROMPT = async (
	cwd: string,
	supportsBrowserUse: boolean,
	mcpHub: any, // McpHub type from Cline
	browserSettings: any, // BrowserSettings type from Cline
	isClaude4ModelFamily: boolean = false,
	extensionPath?: string, // CARET MODIFICATION: Added extensionPath parameter
	mode: "chatbot" | "agent" = "agent", // CARET MODIFICATION: Added mode parameter
): Promise<string> => {
	// CARET MODIFICATION: System selection based on extensionPath
	if (!extensionPath) {
		// No extensionPath = Use Cline original system
		console.warn("[MODE_CHECK] ⚠️ [MODE-CHECK-SYSTEM] Cline 원본 프롬프트 사용: mode=" + mode + " (mode 파라미터 무시됨!)")
		const { SYSTEM_PROMPT: originalSystemPrompt } = await import("../../../src/core/prompts/system")
		return await originalSystemPrompt(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
	}

	try {
		// extensionPath provided = Use Caret JSON system
		console.log("[CARET] Generated prompt via Caret JSON system (mode: " + mode + ")")

		// Initialize CaretSystemPrompt with extensionPath
		if (!CaretSystemPrompt.isInitialized()) {
			CaretSystemPrompt.initialize(extensionPath)
		}

		const caretSystemPrompt = CaretSystemPrompt.getInstance()

		// Generate prompt using JSON sections with mode support
		const prompt = await caretSystemPrompt.generateFromJsonSections(
			cwd,
			supportsBrowserUse,
			mcpHub,
			browserSettings,
			isClaude4ModelFamily,
			mode, // CARET MODIFICATION: Pass mode parameter
		)

		return prompt
	} catch (error) {
		// Fallback to original Cline system prompt if JSON generation fails
		console.error("[CaretSystemPrompt] JSON generation failed, falling back to Cline original:", error)

		const { SYSTEM_PROMPT: originalSystemPrompt } = await import("../../../src/core/prompts/system")
		return await originalSystemPrompt(cwd, supportsBrowserUse, mcpHub, browserSettings, isClaude4ModelFamily)
	}
}
