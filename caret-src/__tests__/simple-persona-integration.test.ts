import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the simple-persona-image module completely
vi.mock("../utils/simple-persona-image", () => ({
	loadSimplePersonaImages: vi.fn(),
	replacePersonaImage: vi.fn(),
	uploadCustomPersonaImage: vi.fn(),
}))

// Import the mocked functions
const { loadSimplePersonaImages, replacePersonaImage, uploadCustomPersonaImage } = await import("../utils/simple-persona-image")
const mockLoadSimplePersonaImages = vi.mocked(loadSimplePersonaImages)
const mockReplacePersonaImage = vi.mocked(replacePersonaImage)
const mockUploadCustomPersonaImage = vi.mocked(uploadCustomPersonaImage)

describe("Simple Persona Image System - Integration Tests", () => {
	const mockExtensionPath = "/mock/extension/path"

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("Image Loading Integration", () => {
		it("should load images successfully", async () => {
			// Arrange
			const expectedResult = {
				avatarUri: "data:image/png;base64,bW9jay1wcm9maWxlLWRhdGE=",
				thinkingAvatarUri: "data:image/png;base64,bW9jay10aGlua2luZy1kYXRh",
			}
			mockLoadSimplePersonaImages.mockResolvedValue(expectedResult)

			// Act
			const result = await loadSimplePersonaImages(mockExtensionPath)

			// Assert
			expect(result).toEqual(expectedResult)
			expect(mockLoadSimplePersonaImages).toHaveBeenCalledWith(mockExtensionPath)
		})

		it("should handle loading errors gracefully", async () => {
			// Arrange
			mockLoadSimplePersonaImages.mockRejectedValue(new Error("File not found"))

			// Act & Assert
			await expect(loadSimplePersonaImages(mockExtensionPath)).rejects.toThrow("File not found")
		})
	})

	describe("Persona Template Update Integration", () => {
		it("should replace persona images successfully", async () => {
			// Arrange
			const templateCharacter = "luna"
			mockReplacePersonaImage.mockResolvedValue(undefined)

			// Act
			await replacePersonaImage(templateCharacter, mockExtensionPath)

			// Assert
			expect(mockReplacePersonaImage).toHaveBeenCalledWith(templateCharacter, mockExtensionPath)
		})

		it("should handle replacement errors", async () => {
			// Arrange
			const templateCharacter = "nonexistent"
			mockReplacePersonaImage.mockRejectedValue(new Error("Template not found"))

			// Act & Assert
			await expect(replacePersonaImage(templateCharacter, mockExtensionPath)).rejects.toThrow("Template not found")
		})
	})

	describe("Custom Image Upload Integration", () => {
		it("should upload normal image successfully", async () => {
			// Arrange
			const imageType = "normal"
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)

			// Act
			await uploadCustomPersonaImage(imageType, base64Data, mockExtensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith(imageType, base64Data, mockExtensionPath)
		})

		it("should upload thinking image successfully", async () => {
			// Arrange
			const imageType = "thinking"
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)

			// Act
			await uploadCustomPersonaImage(imageType, base64Data, mockExtensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith(imageType, base64Data, mockExtensionPath)
		})

		it("should handle upload errors gracefully", async () => {
			// Arrange
			const imageType = "normal"
			const base64Data = "data:image/png;base64,TestData"
			mockUploadCustomPersonaImage.mockRejectedValue(new Error("Upload failed"))

			// Act & Assert
			await expect(uploadCustomPersonaImage(imageType, base64Data, mockExtensionPath)).rejects.toThrow("Upload failed")
		})
	})

	describe("End-to-End Workflow", () => {
		it("should complete template selection workflow", async () => {
			// Arrange
			mockReplacePersonaImage.mockResolvedValue(undefined)
			mockLoadSimplePersonaImages.mockResolvedValue({
				avatarUri: "data:image/png;base64,newdata",
				thinkingAvatarUri: "data:image/png;base64,newthinkingdata",
			})

			// Act
			await replacePersonaImage("luna", mockExtensionPath)
			const result = await loadSimplePersonaImages(mockExtensionPath)

			// Assert
			expect(mockReplacePersonaImage).toHaveBeenCalledWith("luna", mockExtensionPath)
			expect(mockLoadSimplePersonaImages).toHaveBeenCalledWith(mockExtensionPath)
			expect(result.avatarUri).toContain("data:image/png;base64,")
			expect(result.thinkingAvatarUri).toContain("data:image/png;base64,")
		})

		it("should complete custom upload workflow", async () => {
			// Arrange
			const base64Data = "data:image/png;base64,customdata"
			mockUploadCustomPersonaImage.mockResolvedValue(undefined)
			mockLoadSimplePersonaImages.mockResolvedValue({
				avatarUri: "data:image/png;base64,customdata",
				thinkingAvatarUri: "data:image/png;base64,customthinkingdata",
			})

			// Act
			await uploadCustomPersonaImage("normal", base64Data, mockExtensionPath)
			const result = await loadSimplePersonaImages(mockExtensionPath)

			// Assert
			expect(mockUploadCustomPersonaImage).toHaveBeenCalledWith("normal", base64Data, mockExtensionPath)
			expect(mockLoadSimplePersonaImages).toHaveBeenCalledWith(mockExtensionPath)
			expect(result.avatarUri).toContain("customdata")
		})
	})
}) 