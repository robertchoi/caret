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
	const { caretLogger } = await import("../../utils/caret-logger")

	// CARET MODIFICATION: 항상 extensionPath 제공되어야 함 (아키텍처 수정 완료)
	if (!extensionPath) {
		caretLogger.error("❌ [CARET-SYSTEM] extensionPath not provided! Architecture is broken.", "SYSTEM")
		throw new Error("extensionPath is required for Caret system")
	}

	try {
		caretLogger.info(`🎯 [CARET-SYSTEM] ✅ caret-src/core/prompts/system.ts 호출됨! mode=${mode}`, "SYSTEM")

		// CARET MODIFICATION: 동적 도구 로딩 시스템 구현 예정 위치
		// TODO: Phase 2에서 컨텍스트별 도구 필터링 구현
		caretLogger.info(`🔧 [CARET-SYSTEM] 동적 로딩 시스템 초기화 중... (Phase 1: 기본 MCP 제거)`, "SYSTEM")

		// Initialize CaretSystemPrompt with extensionPath
		if (!CaretSystemPrompt.isInitialized()) {
			CaretSystemPrompt.initialize(extensionPath)
			caretLogger.success("✅ [CARET-SYSTEM] CaretSystemPrompt 초기화 완료", "SYSTEM")
		}

		const caretSystemPrompt = CaretSystemPrompt.getInstance()

		// Generate prompt using JSON sections with mode support
		caretLogger.info(`🚀 [CARET-SYSTEM] generateFromJsonSections 호출 시작 - mode=${mode}`, "SYSTEM")
		const prompt = await caretSystemPrompt.generateFromJsonSections(
			cwd,
			supportsBrowserUse,
			mcpHub,
			browserSettings,
			isClaude4ModelFamily,
			mode, // CARET MODIFICATION: Pass mode parameter
		)

		const promptLength = prompt.length
		const estimatedTokens = Math.ceil(promptLength / 4)
		caretLogger.success(
			`✅ [CARET-SYSTEM] 시스템 프롬프트 생성 완료! mode=${mode}, length=${promptLength}, ~${estimatedTokens} tokens`,
			"SYSTEM",
		)

		return prompt
	} catch (error) {
		caretLogger.error(`❌ [CARET-SYSTEM] JSON generation failed: ${error}`, "SYSTEM")
		throw error // extensionPath가 있으면 fallback하지 않고 에러 전파
	}
}
