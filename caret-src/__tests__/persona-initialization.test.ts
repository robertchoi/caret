import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import { resetPersonaData, initializeDefaultPersonaOnLanguageSet, isPersonaDataExists } from "../utils/persona-initialization"

// Mock vscode
const mockContext = {
	globalStorageUri: {
		fsPath: "/mock/globalStorage",
	},
	extensionPath: "/mock/extension",
	globalState: {
		update: vi.fn(),
		get: vi.fn(),
	},
} as any

// Mock fs
const mockFs = vi.mocked(fs)
vi.mock("fs/promises")

describe("Persona Initialization System", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe("resetPersonaData", () => {
		it("should remove persona images directory during reset", async () => {
			// Arrange
			const personaDir = path.join("/mock/globalStorage", "personas")
			mockFs.rm = vi.fn().mockResolvedValue(undefined)

			// Act
			await resetPersonaData(mockContext)

			// Assert
			expect(mockFs.rm).toHaveBeenCalledWith(personaDir, { recursive: true, force: true })
		})

		it("should handle missing persona directory gracefully", async () => {
			// Arrange
			mockFs.rm = vi.fn().mockRejectedValue(new Error("ENOENT: no such file or directory"))

			// Act & Assert
			await expect(resetPersonaData(mockContext)).resolves.not.toThrow()
		})
	})

	describe("isPersonaDataExists", () => {
		it("should return true when persona images exist", async () => {
			// Arrange
			mockFs.access = vi.fn().mockResolvedValue(undefined)

			// Act
			const result = await isPersonaDataExists(mockContext)

			// Assert
			expect(result).toBe(true)
			expect(mockFs.access).toHaveBeenCalledTimes(2) // profile and thinking images
		})

		it("should return false when persona images don't exist", async () => {
			// Arrange
			mockFs.access = vi.fn().mockRejectedValue(new Error("ENOENT"))

			// Act
			const result = await isPersonaDataExists(mockContext)

			// Assert
			expect(result).toBe(false)
		})
	})

	describe("initializeDefaultPersonaOnLanguageSet", () => {
		it("should set default persona (sarang) when language is set and no persona exists", async () => {
			// Arrange
			const language = "ko"
			const mockTemplateData = [
				{
					character: "sarang",
					ko: {
						name: "오사랑",
						description: "K-pop 아이돌",
						customInstruction: {
							persona: { name: "오사랑", nickname: "사랑이", type: "Virtual Idol Assistant" },
							language: { style: "Analytical and concise" },
							emotion_style: { tone: "Logical yet occasionally flustered" },
							behavior: { loyalty: "Supports the user with calculated care" },
							signature_phrase: "그건 변수지. 📈",
						},
					},
					en: {
						name: "Oh Sarang",
						description: "K-pop idol",
						customInstruction: {
							persona: { name: "Oh Sarang", nickname: "Sarang", type: "Virtual Idol Assistant" },
							language: { style: "Analytical and concise" },
							emotion_style: { tone: "Logical yet occasionally flustered" },
							behavior: { loyalty: "Supports the user with calculated care" },
							signature_phrase: "That's a variable. 📈",
						},
					},
				},
			]

			mockFs.access = vi.fn().mockRejectedValue(new Error("ENOENT")) // No persona exists
			mockFs.mkdir = vi.fn().mockResolvedValue(undefined)
			mockFs.copyFile = vi.fn().mockResolvedValue(undefined)
			mockFs.writeFile = vi.fn().mockResolvedValue(undefined)
			mockFs.readFile = vi.fn().mockResolvedValue(JSON.stringify(mockTemplateData))

			// Act
			await initializeDefaultPersonaOnLanguageSet(mockContext, language)

			// Assert
			// Should copy sarang images to persona directory
			expect(mockFs.copyFile).toHaveBeenCalledWith(
				path.join("/mock/extension", "caret-assets/template_characters/sarang.png"),
				path.join("/mock/globalStorage", "personas", "agent_profile.png"),
			)
			expect(mockFs.copyFile).toHaveBeenCalledWith(
				path.join("/mock/extension", "caret-assets/template_characters/sarang_thinking.png"),
				path.join("/mock/globalStorage", "personas", "agent_thinking.png"),
			)

			// Should write custom instructions based on language
			expect(mockFs.writeFile).toHaveBeenCalledWith(
				"/mock/globalStorage/rules/custom_instructions.md",
				expect.stringContaining("사랑이"),
				"utf-8",
			)
		})

		it("should skip initialization when persona already exists", async () => {
			// Arrange
			const language = "en"
			mockFs.access = vi.fn().mockResolvedValue(undefined) // Persona exists
			mockFs.copyFile = vi.fn()

			// Act
			await initializeDefaultPersonaOnLanguageSet(mockContext, language)

			// Assert
			expect(mockFs.copyFile).not.toHaveBeenCalled()
		})

		it("should use English instructions for unsupported languages", async () => {
			// Arrange
			const language = "fr" // Unsupported language
			const mockTemplateData = [
				{
					character: "sarang",
					ko: {
						name: "오사랑",
						customInstruction: {
							persona: { name: "오사랑", nickname: "사랑이" },
						},
					},
					en: {
						name: "Oh Sarang",
						customInstruction: {
							persona: { name: "Oh Sarang", nickname: "Sarang" },
						},
					},
				},
			]

			mockFs.access = vi.fn().mockRejectedValue(new Error("ENOENT"))
			mockFs.mkdir = vi.fn().mockResolvedValue(undefined)
			mockFs.copyFile = vi.fn().mockResolvedValue(undefined)
			mockFs.writeFile = vi.fn().mockResolvedValue(undefined)
			mockFs.readFile = vi.fn().mockResolvedValue(JSON.stringify(mockTemplateData))

			// Act
			await initializeDefaultPersonaOnLanguageSet(mockContext, language)

			// Assert
			expect(mockFs.writeFile).toHaveBeenCalledWith(
				"/mock/globalStorage/rules/custom_instructions.md",
				expect.stringContaining("Oh Sarang"), // English name
				"utf-8",
			)
		})
	})
})
