import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import {
	ensurePersonaDirectoryExists,
	initializeDefaultPersonaImages,
	loadPersonaImagesFromStorage,
	saveCustomPersonaImage,
	PersonaStorageImages,
} from "../utils/persona-storage"

// Mock vscode
const mockContext = {
	globalStorageUri: {
		fsPath: "/mock/globalStorage",
	},
	extensionPath: "/mock/extension",
} as vscode.ExtensionContext

// Mock fs
vi.mock("fs/promises")
const mockFs = vi.mocked(fs)

// Mock caret logger
vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}))

describe("Persona Storage System", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	describe("ensurePersonaDirectoryExists", () => {
		it("should create personas directory in globalStorage and return path", async () => {
			const expectedPath = path.join("/mock/globalStorage", "personas")
			mockFs.mkdir.mockResolvedValue(undefined)

			const result = await ensurePersonaDirectoryExists(mockContext)

			expect(result).toBe(expectedPath)
			expect(mockFs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true })
		})

		it("should handle directory creation errors gracefully", async () => {
			const expectedPath = path.join("/mock/globalStorage", "personas")
			mockFs.mkdir.mockRejectedValue(new Error("Permission denied"))

			await expect(ensurePersonaDirectoryExists(mockContext)).rejects.toThrow("Permission denied")
		})
	})

	describe("initializeDefaultPersonaImages", () => {
		it("should copy default images to globalStorage when they don't exist", async () => {
			const personaDir = path.join("/mock/globalStorage", "personas")
			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			// Mock files don't exist (access throws)
			mockFs.access.mockRejectedValue(new Error("ENOENT"))

			// Mock successful copy
			mockFs.copyFile.mockResolvedValue(undefined)

			await initializeDefaultPersonaImages(mockContext)

			// Should create directory
			expect(mockFs.mkdir).toHaveBeenCalledWith(personaDir, { recursive: true })

			// Should check if files exist
			expect(mockFs.access).toHaveBeenCalledWith(profilePath)
			expect(mockFs.access).toHaveBeenCalledWith(thinkingPath)

			// Should copy default images
			expect(mockFs.copyFile).toHaveBeenCalledWith(
				path.join("/mock/extension", "caret-assets/agent_profile.png"),
				profilePath,
			)
			expect(mockFs.copyFile).toHaveBeenCalledWith(
				path.join("/mock/extension", "caret-assets/agent_thinking.png"),
				thinkingPath,
			)
		})

		it("should skip copying when images already exist", async () => {
			const personaDir = path.join("/mock/globalStorage", "personas")

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			// Mock files exist (access succeeds)
			mockFs.access.mockResolvedValue(undefined)

			await initializeDefaultPersonaImages(mockContext)

			// Should not copy files
			expect(mockFs.copyFile).not.toHaveBeenCalled()
		})
	})

	describe("loadPersonaImagesFromStorage", () => {
		it("should load persona images from globalStorage as file URIs", async () => {
			const personaDir = path.join("/mock/globalStorage", "personas")

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			const result = await loadPersonaImagesFromStorage(mockContext)

			const expected: PersonaStorageImages = {
				avatarUri: `vscode-file://${path.join(personaDir, "agent_profile.png")}`,
				thinkingAvatarUri: `vscode-file://${path.join(personaDir, "agent_thinking.png")}`,
			}

			expect(result).toEqual(expected)
		})
	})

	describe("saveCustomPersonaImage", () => {
		it("should save custom persona image and return file URI", async () => {
			const personaDir = path.join("/mock/globalStorage", "personas")
			const base64Data =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			// Mock file writing
			mockFs.writeFile.mockResolvedValue(undefined)

			const result = await saveCustomPersonaImage(mockContext, "normal", base64Data)

			const expectedPath = path.join(personaDir, "agent_profile.png")
			const expectedUri = `vscode-file://${expectedPath}`

			// Should create directory
			expect(mockFs.mkdir).toHaveBeenCalledWith(personaDir, { recursive: true })

			// Should write file
			expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, expect.any(Buffer))

			// Should return file URI
			expect(result).toBe(expectedUri)
		})

		it("should save thinking image to correct filename", async () => {
			const personaDir = path.join("/mock/globalStorage", "personas")
			const base64Data =
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			// Mock file writing
			mockFs.writeFile.mockResolvedValue(undefined)

			const result = await saveCustomPersonaImage(mockContext, "thinking", base64Data)

			const expectedPath = path.join(personaDir, "agent_thinking.png")
			const expectedUri = `vscode-file://${expectedPath}`

			expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, expect.any(Buffer))
			expect(result).toBe(expectedUri)
		})

		it("should handle invalid base64 data", async () => {
			const invalidBase64 = "invalid-base64-data"

			// Mock directory creation
			mockFs.mkdir.mockResolvedValue(undefined)

			await expect(saveCustomPersonaImage(mockContext, "normal", invalidBase64)).rejects.toThrow()
		})
	})
})
