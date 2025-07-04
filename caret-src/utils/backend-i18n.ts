import { ChatSettings } from "../../src/shared/ChatSettings"

interface BackendMessages {
	[key: string]: {
		[locale: string]: string
	}
}

const messages: BackendMessages = {
	"task.retryWithoutParam": {
		en: "Cline tried to use {toolName}{pathInfo} without value for required parameter '{paramName}'. Retrying...",
		ko: "Cline이 {toolName}{pathInfo}을(를) 필수 매개변수 '{paramName}' 값 없이 사용하려고 했습니다. 재시도 중...",
		ja: "Clineが{toolName}{pathInfo}を必須パラメータ'{paramName}'の値なしで使用しようとしました。再試行中...",
		zh: "Cline试图在没有必需参数'{paramName}'值的情况下使用{toolName}{pathInfo}。重试中..."
	}
}

export function backendT(key: string, chatSettings: ChatSettings, params?: Record<string, string>): string {
	const locale = chatSettings.uiLanguage || "en"
	const message = messages[key]
	
	if (!message) {
		console.warn(`[Backend i18n] Missing key: ${key}`)
		return key
	}
	
	let text = message[locale] || message.en || key
	
	// Simple template replacement
	if (params) {
		Object.entries(params).forEach(([paramKey, value]) => {
			text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value)
		})
	}
	
	return text
} 