// CARET MODIFICATION: Added uiLanguage field for UI internationalization
export type OpenAIReasoningEffort = "low" | "medium" | "high"

export interface ChatSettings {
	mode: "plan" | "act"
	preferredLanguage?: string // AI와의 대화 언어
	uiLanguage?: string // CARET MODIFICATION: UI 표시 언어 (Caret 전용)
	openAIReasoningEffort?: OpenAIReasoningEffort
}

export type PartialChatSettings = Partial<ChatSettings>

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
	mode: "act",
	preferredLanguage: "English",
	uiLanguage: "en", // CARET MODIFICATION: 기본 UI 언어는 영어 (VSCode 설정 따라감)
	openAIReasoningEffort: "medium",
}
