// CARET MODIFICATION: Context-aware 언어 Hook
import { useExtensionState } from "@/context/ExtensionStateContext"
import { SupportedLanguage } from "../constants/urls"

/**
 * 현재 사용자가 설정한 UI 언어를 가져오는 Hook
 * ExtensionStateContext에서 chatSettings.uiLanguage를 읽어옵니다.
 */
export const useCurrentLanguage = (): SupportedLanguage => {
	const { chatSettings } = useExtensionState()

	// 사용자 설정에서 UI 언어 가져오기, 기본값은 한국어
	const uiLanguage = chatSettings?.uiLanguage || "ko"

	// 지원하는 언어인지 확인 (안전성)
	const supportedLanguages: SupportedLanguage[] = ["ko", "en", "ja", "zh"]
	if (supportedLanguages.includes(uiLanguage as SupportedLanguage)) {
		return uiLanguage as SupportedLanguage
	}

	// 지원하지 않는 언어면 기본값 반환
	return "ko"
}

/**
 * 디버깅용 로그와 함께 현재 언어를 가져오는 Hook
 */
export const useCurrentLanguageWithLog = (): SupportedLanguage => {
	const { chatSettings } = useExtensionState()
	const language = useCurrentLanguage()

	// 개발 환경에서만 로그 출력
	if (process.env.NODE_ENV === "development") {
		console.log("[UI Language] Current language:", language)
		console.log("[UI Language] ChatSettings.uiLanguage:", chatSettings?.uiLanguage)
	}

	return language
}
