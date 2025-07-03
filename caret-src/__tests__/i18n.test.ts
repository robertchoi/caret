import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import { getCurrentLanguage, DEFAULT_LANGUAGE, t, SupportedLanguage } from "../utils/i18n" // t와 SupportedLanguage 임포트

// Mock vscode module
vi.mock("vscode", () => ({
	env: {
		language: "en",
	},
}))


vi.mock("path", () => ({
	join: vi.fn((...args: string[]) => args.join("/")), // Simple join for testing paths
}))

describe("caret-src/utils/i18n.ts", () => {
	// Store original env.language for restoration
	let originalLanguage: string

	beforeEach(() => {
		originalLanguage = vscode.env.language
		vi.clearAllMocks()
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
		it("should return current VSCode language if supported", () => {
			vi.mocked(vscode.env).language = "ko"
			expect(getCurrentLanguage()).toBe("ko")

			vi.mocked(vscode.env).language = "ja"
			expect(getCurrentLanguage()).toBe("ja")
		})

		it("should return default language when VSCode language is not set or unsupported", () => {
			vi.mocked(vscode.env).language = ""
			expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE)

			vi.mocked(vscode.env).language = undefined as any
			expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE)

			vi.mocked(vscode.env).language = null as any
			expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE)

			vi.mocked(vscode.env).language = "fr" // Unsupported language
			expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE)
		})

		it("should extract language code from locale with region", () => {
			vi.mocked(vscode.env).language = "ko-KR"
			expect(getCurrentLanguage()).toBe("ko")
		})

		it("should extract language code from locale with multiple parts", () => {
			vi.mocked(vscode.env).language = "zh-Hans-CN"
			expect(getCurrentLanguage()).toBe("zh")
		})

		it("should handle single language code without region", () => {
			vi.mocked(vscode.env).language = "ja"
			expect(getCurrentLanguage()).toBe("ja")
		})

		it("should handle English variants", () => {
			const englishVariants = ["en-US", "en-GB", "en-AU", "en-CA"]
			englishVariants.forEach((variant) => {
				vi.mocked(vscode.env).language = variant
				expect(getCurrentLanguage()).toBe("en")
			})
		})

		it("should handle malformed language codes gracefully", () => {
			vi.mocked(vscode.env).language = "---"
			expect(getCurrentLanguage()).toBe(DEFAULT_LANGUAGE) // Should fallback to default
		})
	})

	describe("t function", () => {
		it("should return translated string for current language", () => {
			vi.mocked(vscode.env).language = "ko"
			expect(t("testKey", "responses")).toBe("안녕하세요")

			vi.mocked(vscode.env).language = "en"
			expect(t("testKey", "responses")).toBe("Hello from English")
		})

		it("should return translated string for specified language", () => {
			expect(t("testKey", "responses", undefined, "ja")).toBe("こんにちは")
			expect(t("testKey", "responses", undefined, "zh")).toBe("你好")
		})

		it("should replace parameters in the translated string", () => {
			vi.mocked(vscode.env).language = "ko"
			expect(t("paramTest", "responses", { name: "Master" })).toBe("안녕하세요 Master")

			vi.mocked(vscode.env).language = "en"
			expect(t("paramTest", "responses", { name: "Alpha" })).toBe("Hello Alpha")
		})

		it("should fallback to English if translation is not found for current language", () => {
			vi.mocked(vscode.env).language = "fr" // Unsupported, will fallback to en
			expect(t("testKey", "responses")).toBe("Hello from English")
		})

		it("should return the key itself if translation is not found in any language", () => {
			vi.mocked(vscode.env).language = "ko"
			expect(t("nonExistentKey", "responses")).toBe("nonExistentKey")
		})

		it("should handle missing namespace gracefully", () => {
			vi.mocked(vscode.env).language = "en"
			expect(t("testKey", "nonExistentNamespace")).toBe("testKey")
		})

		it("should handle empty options object", () => {
			vi.mocked(vscode.env).language = "en"
			expect(t("paramTest", "responses", {})).toBe("Hello {{name}}") // Parameter not replaced if not provided
		})
	})
})
