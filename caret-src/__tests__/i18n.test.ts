import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import { getCurrentLanguage, getLocalizedData, DEFAULT_LANGUAGE } from "../utils/i18n"

// Mock vscode module
vi.mock("vscode", () => ({
	env: {
		language: "en",
	},
}))

describe("caret-src/utils/i18n.ts", () => {
	// Store original env.language for restoration
	let originalLanguage: string

	beforeEach(() => {
		originalLanguage = vscode.env.language
	})

	afterEach(() => {
		// Restore original language
		vi.mocked(vscode.env).language = originalLanguage
	})

	describe("DEFAULT_LANGUAGE constant", () => {
		it('should be defined as "en"', () => {
			expect(DEFAULT_LANGUAGE).toBe("en")
		})

		it("should be a string", () => {
			expect(typeof DEFAULT_LANGUAGE).toBe("string")
		})

		it("should not be empty", () => {
			expect(DEFAULT_LANGUAGE.length).toBeGreaterThan(0)
		})
	})

	describe("getCurrentLanguage function", () => {
		it("should return current VSCode language", () => {
			vi.mocked(vscode.env).language = "ko"

			const result = getCurrentLanguage()

			expect(result).toBe("ko")
		})

		it("should return default language when VSCode language is not set", () => {
			vi.mocked(vscode.env).language = ""

			const result = getCurrentLanguage()

			expect(result).toBe(DEFAULT_LANGUAGE)
		})

		it("should return default language when VSCode language is undefined", () => {
			vi.mocked(vscode.env).language = undefined as any

			const result = getCurrentLanguage()

			expect(result).toBe(DEFAULT_LANGUAGE)
		})

		it("should return default language when VSCode language is null", () => {
			vi.mocked(vscode.env).language = null as any

			const result = getCurrentLanguage()

			expect(result).toBe(DEFAULT_LANGUAGE)
		})

		it("should extract language code from locale with region", () => {
			vi.mocked(vscode.env).language = "ko-KR"

			const result = getCurrentLanguage()

			expect(result).toBe("ko")
		})

		it("should extract language code from locale with multiple parts", () => {
			vi.mocked(vscode.env).language = "zh-Hans-CN"

			const result = getCurrentLanguage()

			expect(result).toBe("zh")
		})

		it("should handle single language code without region", () => {
			vi.mocked(vscode.env).language = "ja"

			const result = getCurrentLanguage()

			expect(result).toBe("ja")
		})

		it("should handle English variants", () => {
			const englishVariants = ["en-US", "en-GB", "en-AU", "en-CA"]

			englishVariants.forEach((variant) => {
				vi.mocked(vscode.env).language = variant
				const result = getCurrentLanguage()
				expect(result).toBe("en")
			})
		})

		it("should handle common language codes", () => {
			const commonLanguages = ["fr", "de", "es", "it", "pt", "ru", "ar", "hi"]

			commonLanguages.forEach((lang) => {
				vi.mocked(vscode.env).language = lang
				const result = getCurrentLanguage()
				expect(result).toBe(lang)
			})
		})

		it("should be case sensitive", () => {
			vi.mocked(vscode.env).language = "EN-US"

			const result = getCurrentLanguage()

			expect(result).toBe("EN")
		})

		it("should handle empty string after split", () => {
			vi.mocked(vscode.env).language = "-US"

			const result = getCurrentLanguage()

			expect(result).toBe("")
		})
	})

	describe("getLocalizedData function", () => {
		it("should return data for specified language", () => {
			const data = {
				en: { message: "Hello" },
				ko: { message: "안녕하세요" },
				ja: { message: "こんにちは" },
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({ message: "안녕하세요" })
		})

		it("should return default language data when specified language is not found", () => {
			const data = {
				en: { message: "Hello" },
				ko: { message: "안녕하세요" },
			}

			const result = getLocalizedData(data, "ja")

			expect(result).toEqual({ message: "Hello" })
		})

		it("should return empty object when neither specified nor default language exists", () => {
			const data = {
				fr: { message: "Bonjour" },
				de: { message: "Hallo" },
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({})
		})

		it("should handle empty data object", () => {
			const data = {}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({})
		})

		it("should handle null data", () => {
			const data = null as any

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({})
		})

		it("should handle undefined data", () => {
			const data = undefined as any

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({})
		})

		it("should handle complex nested data structures", () => {
			const data = {
				en: {
					messages: {
						greeting: "Hello",
						farewell: "Goodbye",
					},
					buttons: {
						ok: "OK",
						cancel: "Cancel",
					},
				},
				ko: {
					messages: {
						greeting: "안녕하세요",
						farewell: "안녕히 가세요",
					},
					buttons: {
						ok: "확인",
						cancel: "취소",
					},
				},
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({
				messages: {
					greeting: "안녕하세요",
					farewell: "안녕히 가세요",
				},
				buttons: {
					ok: "확인",
					cancel: "취소",
				},
			})
		})

		it("should handle data with different structures per language", () => {
			const data = {
				en: { message: "Hello", extra: "Extra text" },
				ko: { message: "안녕하세요" }, // missing 'extra' field
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual({ message: "안녕하세요" })
		})

		it("should handle empty string as language parameter", () => {
			const data = {
				en: { message: "Hello" },
				"": { message: "Empty language" },
			}

			const result = getLocalizedData(data, "")

			expect(result).toEqual({ message: "Empty language" })
		})

		it("should handle special characters in language codes", () => {
			const data = {
				en: { message: "Hello" },
				"zh-Hans": { message: "你好" },
			}

			const result = getLocalizedData(data, "zh-Hans")

			expect(result).toEqual({ message: "你好" })
		})

		it("should return reference to original data, not a copy", () => {
			const originalData = { message: "Hello" }
			const data = {
				en: originalData,
				ko: { message: "안녕하세요" },
			}

			const result = getLocalizedData(data, "en")

			expect(result).toBe(originalData)
		})

		it("should handle arrays as data values", () => {
			const data = {
				en: ["Hello", "World"],
				ko: ["안녕하세요", "세계"],
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toEqual(["안녕하세요", "세계"])
		})

		it("should handle primitive values as data", () => {
			const data = {
				en: "Hello",
				ko: "안녕하세요",
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toBe("안녕하세요")
		})

		it("should handle numeric values as data", () => {
			const data = {
				en: 100,
				ko: 200,
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toBe(200)
		})

		it("should handle boolean values as data", () => {
			const data = {
				en: true,
				ko: false,
			}

			const result = getLocalizedData(data, "ko")

			expect(result).toBe(false)
		})
	})

	describe("integration tests", () => {
		it("should work together - getCurrentLanguage with getLocalizedData", () => {
			vi.mocked(vscode.env).language = "ko-KR"

			const data = {
				en: { message: "Hello" },
				ko: { message: "안녕하세요" },
			}

			const currentLang = getCurrentLanguage()
			const localizedData = getLocalizedData(data, currentLang)

			expect(currentLang).toBe("ko")
			expect(localizedData).toEqual({ message: "안녕하세요" })
		})

		it("should fallback to default language in integration scenario", () => {
			vi.mocked(vscode.env).language = "fr-FR"

			const data = {
				en: { message: "Hello" },
				ko: { message: "안녕하세요" },
			}

			const currentLang = getCurrentLanguage()
			const localizedData = getLocalizedData(data, currentLang)

			expect(currentLang).toBe("fr")
			expect(localizedData).toEqual({ message: "Hello" }) // Falls back to 'en'
		})

		it("should handle complete workflow with missing VSCode language", () => {
			vi.mocked(vscode.env).language = undefined as any

			const data = {
				en: { message: "Hello" },
				ko: { message: "안녕하세요" },
			}

			const currentLang = getCurrentLanguage()
			const localizedData = getLocalizedData(data, currentLang)

			expect(currentLang).toBe("en")
			expect(localizedData).toEqual({ message: "Hello" })
		})
	})

	describe("error handling", () => {
		it("should not throw when accessing properties of null/undefined", () => {
			expect(() => {
				getLocalizedData(null as any, "ko")
			}).not.toThrow()

			expect(() => {
				getLocalizedData(undefined as any, "ko")
			}).not.toThrow()
		})

		it("should handle malformed language codes gracefully", () => {
			vi.mocked(vscode.env).language = "---"

			expect(() => {
				getCurrentLanguage()
			}).not.toThrow()

			const result = getCurrentLanguage()
			expect(result).toBe("")
		})

		it("should handle circular references in data", () => {
			const circularData: any = {
				en: { message: "Hello" },
			}
			circularData.en.self = circularData

			expect(() => {
				getLocalizedData(circularData, "en")
			}).not.toThrow()
		})
	})
})
