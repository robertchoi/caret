// CARET MODIFICATION: Added uiLanguage field for UI internationalization
export type OpenAIReasoningEffort = "low" | "medium" | "high"

// CARET MODIFICATION: Chatbot/Agent 용어 통일 - Ask에서 Chatbot으로 변경
// CARET MODIFICATION: Mission 2 - Cline/Caret 모드 용어 통합 지원
export interface ChatSettings {
	mode: "chatbot" | "agent" | "plan" | "act" // Caret: chatbot/agent, Cline: plan/act
	preferredLanguage?: string // AI와의 대화 언어
	uiLanguage?: string // CARET MODIFICATION: UI 표시 언어 (Caret 전용)
	modeSystem?: string // CARET MODIFICATION: Interface mode system (Caret/Cline)
	openAIReasoningEffort?: OpenAIReasoningEffort
}

export type PartialChatSettings = Partial<ChatSettings>

// CARET MODIFICATION: Chatbot/Agent 용어 통일 - 기본값을 agent로 설정
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
	mode: "agent",
	preferredLanguage: "English",
	uiLanguage: "en", // CARET MODIFICATION: 기본 UI 언어는 영어 (VSCode 설정 따라감)
	modeSystem: "caret", // CARET MODIFICATION: Default interface mode system
	openAIReasoningEffort: "medium",
}
