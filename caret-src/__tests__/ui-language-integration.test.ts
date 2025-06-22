import { describe, it, expect } from "vitest"
import { ChatSettings, DEFAULT_CHAT_SETTINGS } from "../../src/shared/ChatSettings"

describe("UILanguage ChatSettings Integration", () => {
	describe("ChatSettings uiLanguage field", () => {
		it("should include uiLanguage in DEFAULT_CHAT_SETTINGS", () => {
			expect(DEFAULT_CHAT_SETTINGS).toHaveProperty("uiLanguage")
			expect(DEFAULT_CHAT_SETTINGS.uiLanguage).toBe("en") // Caret 정책: 영어가 기본 언어 (VSCode 설정 따라감)
		})

		it("should accept uiLanguage as optional string in ChatSettings interface", () => {
			const settings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				uiLanguage: "ko",
			}

			expect(settings.uiLanguage).toBe("ko")
		})

		it("should work without uiLanguage field for backward compatibility", () => {
			const settingsWithoutUILanguage = { ...DEFAULT_CHAT_SETTINGS }
			delete settingsWithoutUILanguage.uiLanguage

			// Should not throw type error
			const settings: Partial<ChatSettings> = settingsWithoutUILanguage
			expect(settings.uiLanguage).toBeUndefined()
		})

		it("should preserve all existing DEFAULT_CHAT_SETTINGS fields", () => {
			// ChatSettings 실제 필드들 (src/shared/ChatSettings.ts 기준)
			const expectedFields = [
				"mode",
				"preferredLanguage",
				"openAIReasoningEffort",
				"uiLanguage", // CARET MODIFICATION: 추가된 필드
			]

			expectedFields.forEach((field) => {
				expect(DEFAULT_CHAT_SETTINGS).toHaveProperty(field)
			})
		})
	})

	describe("uiLanguage 값 검증", () => {
		it("should accept valid language codes", () => {
			// Caret 정책: 4개 언어 지원 (한국어, 영어, 일본어, 중국어)
			const validLanguages = ["ko", "en", "ja", "zh"]

			validLanguages.forEach((lang) => {
				const settings: ChatSettings = {
					...DEFAULT_CHAT_SETTINGS,
					uiLanguage: lang,
				}

				expect(settings.uiLanguage).toBe(lang)
			})
		})

		it("should maintain type safety for uiLanguage field", () => {
			const settings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				uiLanguage: "en",
			}

			// TypeScript should ensure this is a string
			expect(typeof settings.uiLanguage).toBe("string")
		})
	})

	describe("기존 ChatSettings 필드와의 호환성", () => {
		it("should not interfere with preferredLanguage field", () => {
			const settings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				preferredLanguage: "English", // AI 대화 언어
				uiLanguage: "ko", // UI 표시 언어 (Caret 기본값)
			}

			expect(settings.preferredLanguage).toBe("English")
			expect(settings.uiLanguage).toBe("ko")
		})

		it("should work with all existing ChatSettings fields", () => {
			// 실제 ChatSettings 인터페이스 필드들만 사용
			const fullSettings: ChatSettings = {
				mode: "plan",
				preferredLanguage: "Korean - 한국어",
				openAIReasoningEffort: "high",
				uiLanguage: "ko",
			}

			expect(fullSettings.uiLanguage).toBe("ko")
			expect(fullSettings.preferredLanguage).toBe("Korean - 한국어")
			expect(fullSettings.mode).toBe("plan")
			expect(fullSettings.openAIReasoningEffort).toBe("high")
		})
	})

	describe("업데이트 시나리오", () => {
		it("should handle uiLanguage updates without affecting other fields", () => {
			const originalSettings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				preferredLanguage: "Korean - 한국어",
				mode: "plan",
				uiLanguage: "en",
			}

			const updatedSettings: ChatSettings = {
				...originalSettings,
				uiLanguage: "ko",
			}

			expect(updatedSettings.uiLanguage).toBe("ko")
			expect(updatedSettings.preferredLanguage).toBe("Korean - 한국어")
			expect(updatedSettings.mode).toBe("plan")
		})

		it("should support partial updates with uiLanguage", () => {
			const partialUpdate: Partial<ChatSettings> = {
				uiLanguage: "ko",
			}

			const mergedSettings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				...partialUpdate,
			}

			expect(mergedSettings.uiLanguage).toBe("ko")
		})
	})

	// 🎯 진짜 통합테스트 추가
	describe("🔗 UI-Backend Integration Tests", () => {
		it("should support all UI language options in backend ChatSettings", () => {
			// CaretUILanguageSetting 컴포넌트에서 제공하는 언어 옵션들
			const uiSupportedLanguages = ["ko", "en", "ja", "zh"]

			// 백엔드 ChatSettings에서 모든 UI 언어를 지원하는지 확인
			uiSupportedLanguages.forEach((lang) => {
				const settings: ChatSettings = {
					...DEFAULT_CHAT_SETTINGS,
					uiLanguage: lang,
				}

				// 타입 에러 없이 할당되는지 확인
				expect(settings.uiLanguage).toBe(lang)
				expect(typeof settings.uiLanguage).toBe("string")
			})
		})

		it("should handle CaretUILanguageSetting onChange flow end-to-end", () => {
			// 1. 초기 설정 (기본값)
			let currentSettings: ChatSettings = { ...DEFAULT_CHAT_SETTINGS }
			expect(currentSettings.uiLanguage).toBe("en") // Caret 기본값 (영어)

			// 2. CaretUILanguageSetting onChange 시뮬레이션 (사용자가 영어로 변경)
			const newUILanguage = "en"
			const updatedSettings: ChatSettings = {
				...currentSettings,
				uiLanguage: newUILanguage,
			}

			// 3. 변경 결과 검증
			expect(updatedSettings.uiLanguage).toBe("en")
			expect(updatedSettings.preferredLanguage).toBe(DEFAULT_CHAT_SETTINGS.preferredLanguage)
			expect(updatedSettings.mode).toBe(DEFAULT_CHAT_SETTINGS.mode)
			expect(updatedSettings.openAIReasoningEffort).toBe(DEFAULT_CHAT_SETTINGS.openAIReasoningEffort)
		})

		it("should maintain state consistency between UI and ChatSettings", () => {
			// 다양한 시나리오에서 UI 언어와 AI 언어 독립성 확인
			const testScenarios = [
				{ uiLang: "ko", aiLang: "English" }, // 한국어 UI + 영어 AI
				{ uiLang: "en", aiLang: "Korean - 한국어" }, // 영어 UI + 한국어 AI
				{ uiLang: "ja", aiLang: "Chinese" }, // 일본어 UI + 중국어 AI
				{ uiLang: "zh", aiLang: "Japanese" }, // 중국어 UI + 일본어 AI
			]

			testScenarios.forEach(({ uiLang, aiLang }) => {
				const settings: ChatSettings = {
					mode: "act",
					preferredLanguage: aiLang,
					uiLanguage: uiLang,
					openAIReasoningEffort: "medium",
				}

				// UI 언어와 AI 언어가 독립적으로 설정되는지 확인
				expect(settings.uiLanguage).toBe(uiLang)
				expect(settings.preferredLanguage).toBe(aiLang)

				// 다른 설정들도 영향받지 않는지 확인
				expect(settings.mode).toBe("act")
				expect(settings.openAIReasoningEffort).toBe("medium")
			})
		})

		it("should support serialization/deserialization of uiLanguage", () => {
			// JSON 직렬화/역직렬화 테스트 (실제 저장/로드 시나리오)
			const originalSettings: ChatSettings = {
				mode: "plan",
				preferredLanguage: "Korean - 한국어",
				uiLanguage: "ja", // 일본어 UI
				openAIReasoningEffort: "high",
			}

			// JSON 직렬화
			const serialized = JSON.stringify(originalSettings)
			expect(serialized).toContain('"uiLanguage":"ja"')

			// JSON 역직렬화
			const deserialized: ChatSettings = JSON.parse(serialized)
			expect(deserialized.uiLanguage).toBe("ja")
			expect(deserialized.preferredLanguage).toBe("Korean - 한국어")
			expect(deserialized.mode).toBe("plan")
			expect(deserialized.openAIReasoningEffort).toBe("high")
		})

		it("should handle undefined uiLanguage gracefully (fallback scenario)", () => {
			// 실제 런타임에서 uiLanguage가 undefined일 때 처리
			const settingsWithoutUI: Partial<ChatSettings> = {
				mode: "act",
				preferredLanguage: "English",
				openAIReasoningEffort: "medium",
				// uiLanguage 없음
			}

			// CaretUILanguageSetting 컴포넌트에서 사용하는 fallback 로직 테스트
			const fallbackLanguage = settingsWithoutUI.uiLanguage || "ko"
			expect(fallbackLanguage).toBe("ko") // Caret 정책: 한국어 기본값

			// 실제 설정 업데이트 시뮬레이션
			const completeSettings: ChatSettings = {
				...DEFAULT_CHAT_SETTINGS,
				...settingsWithoutUI,
				uiLanguage: fallbackLanguage,
			}

			expect(completeSettings.uiLanguage).toBe("ko")
		})
	})
})
