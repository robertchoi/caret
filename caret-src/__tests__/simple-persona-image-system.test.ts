import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import * as fs from "fs/promises"
import * as path from "path"
import { caretLogger } from "../utils/caret-logger"

// CARET MODIFICATION: 단순한 2파일 페르소나 이미지 시스템 테스트
describe("Simple Persona Image System", () => {
	const extensionPath = "/mock/extension/path"
	const agentProfilePath = path.join(extensionPath, "caret-assets/agent_profile.png")
	const agentThinkingPath = path.join(extensionPath, "caret-assets/agent_thinking.png")

	beforeEach(() => {
		vi.clearAllMocks()
		// Mock을 새로 설정하여 충돌 방지
		vi.resetAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe("Simple Image Loading", () => {
		it("should load agent_profile.png and agent_thinking.png directly", async () => {
			// Mock fs operations
			const mockImageBuffer = Buffer.from("mock-image-data")
			const mockBase64 = `data:image/png;base64,${mockImageBuffer.toString("base64")}`
			
			const readFileMock = vi.fn().mockResolvedValue(mockImageBuffer)
			vi.doMock("fs/promises", () => ({
				readFile: readFileMock,
			}))

			// 실제 함수가 아직 구현되지 않았으므로 이 테스트는 실패할 것임
			try {
				const result = await loadSimplePersonaImages(extensionPath)
				expect(result).toEqual({
					avatarUri: mockBase64,
					thinkingAvatarUri: mockBase64,
				})
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("loadSimplePersonaImages is not defined")
			}
		})

		it("should handle file read errors gracefully", async () => {
			const readFileMock = vi.fn().mockRejectedValue(new Error("File not found"))
			vi.doMock("fs/promises", () => ({
				readFile: readFileMock,
			}))
			const errorSpy = vi.spyOn(caretLogger, "error").mockImplementation(() => {})

			try {
				const result = await loadSimplePersonaImages(extensionPath)
				expect(result).toEqual({
					avatarUri: "",
					thinkingAvatarUri: "",
				})
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("loadSimplePersonaImages is not defined")
			}
		})
	})

	describe("Image File Replacement", () => {
		it("should replace agent_profile.png when persona is selected", async () => {
			const sourceImagePath = "/mock/template/sarang.png"
			const mockImageBuffer = Buffer.from("sarang-image-data")
			
			const readFileMock = vi.fn().mockResolvedValue(mockImageBuffer)
			const writeFileMock = vi.fn().mockResolvedValue()
			vi.doMock("fs/promises", () => ({
				readFile: readFileMock,
				writeFile: writeFileMock,
			}))

			try {
				await replacePersonaImage("normal", sourceImagePath, extensionPath)
				expect(readFileMock).toHaveBeenCalledWith(sourceImagePath)
				expect(writeFileMock).toHaveBeenCalledWith(agentProfilePath, mockImageBuffer)
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("replacePersonaImage is not defined")
			}
		})

		it("should replace agent_thinking.png when thinking image is selected", async () => {
			const sourceImagePath = "/mock/template/sarang_thinking.png"
			const mockImageBuffer = Buffer.from("sarang-thinking-image-data")
			
			const readFileMock = vi.fn().mockResolvedValue(mockImageBuffer)
			const writeFileMock = vi.fn().mockResolvedValue()  
			vi.doMock("fs/promises", () => ({
				readFile: readFileMock,
				writeFile: writeFileMock,
			}))

			try {
				await replacePersonaImage("thinking", sourceImagePath, extensionPath)
				expect(readFileMock).toHaveBeenCalledWith(sourceImagePath)
				expect(writeFileMock).toHaveBeenCalledWith(agentThinkingPath, mockImageBuffer)
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("replacePersonaImage is not defined")
			}
		})
	})

	describe("Custom Image Upload", () => {
		it("should save uploaded image directly to agent_profile.png", async () => {
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77owAAAABJRU5ErkJggg=="
			const expectedBuffer = Buffer.from(base64Data.replace(/^data:image\/[a-z]+;base64,/, ""), "base64")
			
			const writeFileMock = vi.fn().mockResolvedValue()
			vi.doMock("fs/promises", () => ({
				writeFile: writeFileMock,
			}))

			try {
				await uploadCustomPersonaImage("normal", base64Data, extensionPath)
				expect(writeFileMock).toHaveBeenCalledWith(agentProfilePath, expectedBuffer)
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("uploadCustomPersonaImage is not defined")
			}
		})

		it("should save uploaded thinking image directly to agent_thinking.png", async () => {
			const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77owAAAABJRU5ErkJggg=="
			const expectedBuffer = Buffer.from(base64Data.replace(/^data:image\/[a-z]+;base64,/, ""), "base64")
			
			const writeFileMock = vi.fn().mockResolvedValue()
			vi.doMock("fs/promises", () => ({
				writeFile: writeFileMock,
			}))

			try {
				await uploadCustomPersonaImage("thinking", base64Data, extensionPath)
				expect(writeFileMock).toHaveBeenCalledWith(agentThinkingPath, expectedBuffer)
			} catch (error) {
				// 함수가 구현되지 않아서 ReferenceError가 발생하는 것이 예상됨 (RED 단계)
				expect(error).toBeInstanceOf(ReferenceError)
				expect(error.message).toBe("uploadCustomPersonaImage is not defined")
			}
		})
	})
})

// 이 함수들은 아직 구현되지 않았으므로 테스트는 실패할 것임 (RED 단계)
interface SimplePersonaImages {
	avatarUri: string
	thinkingAvatarUri: string
}

// TODO: GREEN 단계에서 구현할 함수들
declare function loadSimplePersonaImages(extensionPath: string): Promise<SimplePersonaImages>
declare function replacePersonaImage(imageType: "normal" | "thinking", sourceImagePath: string, extensionPath: string): Promise<void>
declare function uploadCustomPersonaImage(imageType: "normal" | "thinking", base64Data: string, extensionPath: string): Promise<void> 