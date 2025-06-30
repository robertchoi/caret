import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the simple-persona-image module functions
vi.mock("../utils/simple-persona-image", () => ({
	loadSimplePersonaImages: vi.fn(),
	replacePersonaImage: vi.fn(),
	uploadCustomPersonaImage: vi.fn(),
}))

// Mock logger
vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}))

// Import mocked functions
const { loadSimplePersonaImages, replacePersonaImage, uploadCustomPersonaImage } = await import("../utils/simple-persona-image")
const { caretLogger } = await import("../utils/caret-logger")

const mockLoadSimplePersonaImages = vi.mocked(loadSimplePersonaImages)
const mockReplacePersonaImage = vi.mocked(replacePersonaImage)
const mockUploadCustomPersonaImage = vi.mocked(uploadCustomPersonaImage)
const mockCaretLogger = vi.mocked(caretLogger)

// CARET MODIFICATION: GREEN 단계 - 단순한 2파일 페르소나 이미지 시스템 테스트
describe("🟢 GREEN: Simple Persona Image System", () => {
	const extensionPath = "/mock/extension/path"
	const agentProfilePath = `${extensionPath}/caret-assets/agent_profile.png`
	const agentThinkingPath = `${extensionPath}/caret-assets/agent_thinking.png`

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("loadSimplePersonaImages", () => {
		it("should load agent_profile.png and agent_thinking.png successfully", async () => {
			// Arrange
			const expectedResult = {
				avatarUri: "data:image/png;base64,bW9jay1wcm9maWxlLWRhdGE=",
				thinkingAvatarUri: "data:image/png;base64,bW9jay10aGlua2luZy1kYXRh",
			}
			mockLoadSimplePersonaImages.mockResolvedValue(expectedResult)

			// Act
			const result = await loadSimplePersonaImages(extensionPath)

			// Assert
			expect(result).toEqual(expectedResult)
			expect(mockLoadSimplePersonaImages).toHaveBeenCalledWith(extensionPath)
		})

		it("should handle file read errors gracefully", async () => {
			// Arrange
			const expectedResult = {
				avatarUri: "",
				thinkingAvatarUri: "",
			}
			mockLoadSimplePersonaImages.mockResolvedValue(expectedResult)

			// Act
			const result = await loadSimplePersonaImages(extensionPath)

			// Assert
			expect(result).toEqual(expectedResult)
			expect(mockLoadSimplePersonaImages).toHaveBeenCalledWith(extensionPath)
		})
	})

	describe("replacePersonaImage", () => {
		it("should replace agent_profile.png when normal image is selected", async () => {
			// Arrange
			const sourceImagePath = "/mock/template/sarang.png"
			mockReplacePersonaImage.mockResolvedValue(undefined)

			// Act
			await replacePersonaImage("normal", sourceImagePath, extensionPath)

			// Assert
			expect(mockReplacePersonaImage).toHaveBeenCalledWith("normal", sourceImagePath, extensionPath)
		})

		it("should replace agent_thinking.png when thinking image is selected", async () => {
			// Arrange
			const sourceImagePath = "/mock/template/sarang_thinking.png"
			mockReplacePersonaImage.mockResolvedValue(undefined)

			// Act
			await replacePersonaImage("thinking", sourceImagePath, extensionPath)

			// Assert
			expect(mockReplacePersonaImage).toHaveBeenCalledWith("thinking", sourceImagePath, extensionPath)
		})

		it("should throw error when file operations fail", async () => {
			// Arrange
			const sourceImagePath = "/mock/template/invalid.png"
			mockReplacePersonaImage.mockRejectedValue(new Error("File not found"))

			// Act & Assert
			await expect(replacePersonaImage("normal", sourceImagePath, extensionPath)).rejects.toThrow("File not found")
		})
	})

	describe("uploadCustomPersonaImage", () => {
		it("should save uploaded image directly to agent_profile.png", async () => {
			// Arrange
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77owAAAABJRU5ErkJggg=="
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)

			// Act
			await uploadCustomPersonaImage("normal", base64Data, extensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith("normal", base64Data, extensionPath)
		})

		it("should save uploaded thinking image directly to agent_thinking.png", async () => {
			// Arrange
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77owAAAABJRU5ErkJggg=="
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)

			// Act
			await uploadCustomPersonaImage("thinking", base64Data, extensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith("thinking", base64Data, extensionPath)
		})

		it("should handle write errors", async () => {
			// Arrange
			const base64Data = "data:image/png;base64,invalid"
			mockUploadCustomPersonaImage.mockRejectedValue(new Error("Write failed"))

			// Act & Assert
			await expect(uploadCustomPersonaImage("normal", base64Data, extensionPath)).rejects.toThrow("Write failed")
		})

		it("should handle different image formats", async () => {
			// Arrange
			const jpegBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA=="
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)

			// Act
			await uploadCustomPersonaImage("normal", jpegBase64, extensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith("normal", jpegBase64, extensionPath)
		})
	})
}) 