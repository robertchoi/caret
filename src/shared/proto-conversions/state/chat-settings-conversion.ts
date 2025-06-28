import { ChatContent } from "@shared/ChatContent"
import { ChatSettings } from "@shared/ChatSettings"
// CARET MODIFICATION: Chatbot/Agent 용어 통일
import { ChatContent as ProtoChatContent, ChatSettings as ProtoChatSettings, ChatbotAgentMode } from "../../../shared/proto/state"

/**
 * Converts domain ChatSettings objects to proto ChatSettings objects
 */
export function convertChatSettingsToProtoChatSettings(chatSettings: ChatSettings): ProtoChatSettings {
	return ProtoChatSettings.create({
		mode: chatSettings.mode === "chatbot" ? ChatbotAgentMode.CHATBOT_MODE : ChatbotAgentMode.AGENT_MODE, // CARET MODIFICATION: CHATBOT_MODE/AGENT_MODE 매핑
		preferredLanguage: chatSettings.preferredLanguage,
		openAiReasoningEffort: chatSettings.openAIReasoningEffort,
		uiLanguage: chatSettings.uiLanguage, // CARET MODIFICATION: UI 언어 필드 추가
	})
}

/**
 * Converts proto ChatSettings objects to domain ChatSettings objects
 */
export function convertProtoChatSettingsToChatSettings(protoChatSettings: ProtoChatSettings): ChatSettings {
	// eslint-disable-next-line eslint-rules/no-protobuf-object-literals
	return {
		mode: protoChatSettings.mode === ChatbotAgentMode.CHATBOT_MODE ? "chatbot" : "agent", // CARET MODIFICATION: CHATBOT_MODE/AGENT_MODE 매핑
		preferredLanguage: protoChatSettings.preferredLanguage,
		openAIReasoningEffort: protoChatSettings.openAiReasoningEffort as "low" | "medium" | "high" | undefined,
		uiLanguage: protoChatSettings.uiLanguage, // CARET MODIFICATION: UI 언어 필드 추가
	}
}

/**
 * Converts domain ChatContent objects to proto ChatContent objects
 */
export function convertChatContentToProtoChatContent(chatContent?: ChatContent): ProtoChatContent | undefined {
	if (!chatContent) {
		return undefined
	}

	return ProtoChatContent.create({
		message: chatContent.message,
		images: chatContent.images || [],
		files: chatContent.files || [],
	})
}

/**
 * Converts proto ChatContent objects to domain ChatContent objects
 */
export function convertProtoChatContentToChatContent(protoChatContent?: ProtoChatContent): ChatContent | undefined {
	if (!protoChatContent) {
		return undefined
	}

	// eslint-disable-next-line eslint-rules/no-protobuf-object-literals
	return {
		message: protoChatContent.message,
		images: protoChatContent.images || [],
		files: protoChatContent.files || [],
	}
}
