import { useCurrentLanguage } from "./useCurrentLanguage"
import { tWithLang } from "../utils/i18n"
import { SupportedLanguage } from "../constants/urls"

/**
 * Context-aware 번역 Hook
 * 사용자가 설정한 UI 언어에 따라 번역을 제공합니다.
 */
export const useTranslation = () => {
	const currentLanguage = useCurrentLanguage()

	/**
	 * 현재 사용자 언어에 맞는 번역을 반환하는 함수
	 * @param key 번역 키 (예: "settings.uiLanguage.title")
	 * @param namespace 네임스페이스 (기본값: "common")
	 * @returns 번역된 텍스트
	 */
	const t = (key: string, namespace: string = "common"): string => {
		return tWithLang(key, currentLanguage, namespace)
	}

	return { t, currentLanguage }
}

/**
 * 디버깅용 로그와 함께 번역을 제공하는 Hook
 */
export const useTranslationWithLog = () => {
	const currentLanguage = useCurrentLanguage()

	const t = (key: string, namespace: string = "common"): string => {
		const translation = tWithLang(key, currentLanguage, namespace)

		// 개발 환경에서만 로그 출력
		if (process.env.NODE_ENV === "development") {
			console.log(`[Translation] Key: ${key}, Language: ${currentLanguage}, Result: ${translation}`)
		}

		return translation
	}

	return { t, currentLanguage }
}
