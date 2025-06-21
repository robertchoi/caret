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

// 현재 언어를 가져오는 함수 (추후 사용자 설정에서 읽어올 수 있도록 확장 가능)
export const getCurrentLanguage = (): SupportedLanguage => {
	// TODO: 사용자 설정에서 언어 가져오기
	return "ko" // Default to Korean for Caret
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
export const t = (key: string, namespace: string = "common"): string => {
	const currentLang = getCurrentLanguage()
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
	return getLocalizedUrl(key, language || getCurrentLanguage())
}

export const getGlobalLink = (key: CaretUrlKey): string => {
	return getUrl(key)
}

// Export as default for compatibility
export default { t, tWithLang, getLink, getGlobalLink, getCurrentLanguage }

// 필요한 경우 여기서 언어 관련 util 함수 추가 가능
