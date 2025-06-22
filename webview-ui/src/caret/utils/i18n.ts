// 글로벌 다국어/국제화 유틸 - Caret 전용 버전 (JSON 파일 기반)

import koWelcome from "../locale/ko/welcome.json"
import enWelcome from "../locale/en/welcome.json"
import jaWelcome from "../locale/ja/welcome.json"
import zhWelcome from "../locale/zh/welcome.json"
import koCommon from "../locale/ko/common.json"
import enCommon from "../locale/en/common.json"
import jaCommon from "../locale/ja/common.json"
import zhCommon from "../locale/zh/common.json"
import { getLocalizedUrl, getUrl, type CaretLocalizedUrlKey, type CaretUrlKey, type SupportedLanguage } from "../constants/urls"

// JSON 파일에서 번역 데이터 로드
const translations = {
	ko: {
		common: koCommon,
		welcome: koWelcome,
	},
	en: {
		common: enCommon,
		welcome: enWelcome,
	},
	ja: {
		common: jaCommon,
		welcome: jaWelcome,
	},
	zh: {
		common: zhCommon,
		welcome: zhWelcome,
	},
}

// CARET MODIFICATION: 웹뷰 전역 UI 언어 관리
let currentEffectiveLanguage: SupportedLanguage = "en" // 기본 언어 'en'
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["ko", "en", "ja", "zh"]

/**
 * 웹뷰 전역에 적용될 UI 언어를 설정합니다.
 * @param lang 설정할 언어 코드
 */
export const setGlobalUILanguage = (lang: SupportedLanguage) => {
	if (SUPPORTED_LANGUAGES.includes(lang)) {
		currentEffectiveLanguage = lang
	} else {
		currentEffectiveLanguage = "en" // 지원하지 않는 경우 영어로 폴백
	}
}

// 내부적으로 현재 적용된 UI 언어를 가져오는 함수
const getInternalCurrentLanguage = (): SupportedLanguage => {
	return currentEffectiveLanguage
}

// 기존 getCurrentLanguage 함수는 외부에서 직접 사용하지 않도록 하거나, getInternalCurrentLanguage로 대체합니다.
// 여기서는 혼동을 피하기 위해 주석 처리하거나 삭제하는 것을 고려할 수 있으나,
// 일단은 내부 로직 변경을 우선합니다.
export const getCurrentLanguage = (): SupportedLanguage => {
	// 이 함수는 이제 getInternalCurrentLanguage를 통해 전역 상태를 반영해야 합니다.
	// 하지만 App.tsx에서 setGlobalUILanguage를 호출하기 전까지는
	// Context가 완전히 준비되지 않았을 수 있으므로 주의가 필요합니다.
	// 우선은 이전처럼 동작하되, t 함수 등에서는 getInternalCurrentLanguage를 사용합니다.
	return "en" // 이 부분은 App.tsx 연동 후 역할 재검토 필요
}

// Helper function to get nested value using dot notation
const getNestedValue = (obj: any, path: string): any => {
	return path.split(".").reduce((current, key) => current?.[key], obj)
}

// 템플릿 변수를 치환하는 함수
const replaceTemplateVariables = (text: string, language: SupportedLanguage): string => {
	return (
		text
			// 교육 프로그램 링크
			.replace(/\{\{educationLink\}\}/g, getLocalizedUrl("EDUCATION_PROGRAM", language))
			// Gemini 크레딧 가이드 링크
			.replace(/\{\{geminiCreditLink\}\}/g, getLocalizedUrl("GEMINI_CREDIT_GUIDE", language))
			// Caret GitHub 링크
			.replace(/\{\{caretGitLink\}\}/g, getLocalizedUrl("CARET_GITHUB_DETAILED", language))
			// 일반 URL들
			.replace(/\{\{caretService\}\}/g, getUrl("CARET_SERVICE"))
			.replace(/\{\{caretGithub\}\}/g, getUrl("CARET_GITHUB"))
			.replace(/\{\{caretiveCompany\}\}/g, getUrl("CARETIVE_COMPANY"))
	)
}

// Simple translation function with dot notation support and template variable replacement
export const t = (key: string, namespace: string = "common", language?: SupportedLanguage): string => {
	const currentLang = language || getInternalCurrentLanguage() // 수정: 내부 함수 사용
	const namespaceData = translations[currentLang]?.[namespace as keyof (typeof translations)[typeof currentLang]]

	if (namespaceData) {
		const value = getNestedValue(namespaceData, key)
		if (value) {
			return replaceTemplateVariables(value, currentLang)
		}
	}

	// Fallback to English
	const enNamespaceData = translations.en[namespace as keyof (typeof translations)["en"]]
	if (enNamespaceData) {
		const value = getNestedValue(enNamespaceData, key)
		if (value) {
			return replaceTemplateVariables(value, "en")
		}
	}

	// Last fallback - return the key itself
	return key
}

// 특정 언어의 번역을 가져오는 함수
export const tWithLang = (key: string, language: SupportedLanguage, namespace: string = "common"): string => {
	const namespaceData = translations[language]?.[namespace as keyof (typeof translations)[typeof language]]

	if (namespaceData) {
		const value = getNestedValue(namespaceData, key)
		if (value) {
			return replaceTemplateVariables(value, language)
		}
	}

	// Fallback to Korean
	const koNamespaceData = translations.ko[namespace as keyof (typeof translations)["ko"]]
	if (koNamespaceData) {
		const value = getNestedValue(koNamespaceData, key)
		if (value) {
			return replaceTemplateVariables(value, "ko")
		}
	}

	return key
}

// 링크만 가져오는 헬퍼 함수
export const getLink = (key: CaretLocalizedUrlKey, language?: SupportedLanguage): string => {
	return getLocalizedUrl(key, language || getInternalCurrentLanguage()) // 수정: 내부 함수 사용
}

export const getGlobalLink = (key: CaretUrlKey): string => {
	return getUrl(key)
}

// Export as default for compatibility
// 기존 getCurrentLanguage는 외부에서 직접 사용하지 않는 것이 좋으므로 default export에서 제외하는 것을 고려
export default { t, tWithLang, getLink, getGlobalLink, setGlobalUILanguage }

// 필요한 경우 여기서 언어 관련 util 함수 추가 가능
