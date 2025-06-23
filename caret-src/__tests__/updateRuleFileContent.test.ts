import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as fs from "fs"
import * as path from "path"

// Mock dependencies
vi.mock("fs")
vi.mock("path")
vi.mock("../../src/core/storage/disk", () => ({
	ensureRulesDirectoryExists: vi.fn(),
}))
vi.mock("../../src/core/task", () => ({
	cwd: "/mock/workspace",
}))

import { updateRuleFileContent } from "../core/updateRuleFileContent"
import { ensureRulesDirectoryExists } from "../../src/core/storage/disk"

const mockFs = vi.mocked(fs)
const mockPath = vi.mocked(path)
const mockEnsureRulesDirectoryExists = vi.mocked(ensureRulesDirectoryExists)

describe("updateRuleFileContent", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// Setup default mocks
		mockPath.join.mockImplementation((...paths) => paths.join("/"))
		mockEnsureRulesDirectoryExists.mockResolvedValue("/mock/global/rules")

		// Mock fs methods
		mockFs.existsSync = vi.fn()
		mockFs.mkdirSync = vi.fn()
		mockFs.writeFileSync = vi.fn()
		mockFs.unlinkSync = vi.fn()

		// Mock console methods
		vi.spyOn(console, "log").mockImplementation(() => {})
		vi.spyOn(console, "error").mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe("parameter validation", () => {
		it("should throw error when rulePath is missing", async () => {
			await expect(
				updateRuleFileContent({
					rulePath: "",
					content: "test content",
					isGlobal: true,
				}),
			).rejects.toThrow("Rule path and content/deleteFile/enabled are required.")
		})

		it("should throw error when content, deleteFile, and enabled are all missing", async () => {
			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					isGlobal: true,
				}),
			).rejects.toThrow("Rule path and content/deleteFile/enabled are required.")
		})

		it("should accept valid deleteFile parameter", async () => {
			mockFs.existsSync.mockReturnValue(true)

			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				deleteFile: true,
			})

			expect(result.success).toBe(true)
		})

		it("should accept valid enabled parameter", async () => {
			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				enabled: true,
			})

			expect(result.success).toBe(true)
		})
	})

	describe("global rules handling", () => {
		it("should use global rules directory when isGlobal is true", async () => {
			await updateRuleFileContent({
				rulePath: "custom_instructions.md",
				content: "test content",
				isGlobal: true,
			})

			expect(mockEnsureRulesDirectoryExists).toHaveBeenCalled()
			expect(mockPath.join).toHaveBeenCalledWith("/mock/global/rules", "custom_instructions.md")
		})

		it("should handle error when global rules directory cannot be determined", async () => {
			mockEnsureRulesDirectoryExists.mockRejectedValue(new Error("Permission denied"))

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					content: "test content",
					isGlobal: true,
				}),
			).rejects.toThrow("Failed to determine rules directory: Permission denied")
		})
	})

	describe("workspace rules handling", () => {
		it("should use workspace directory when isGlobal is false", async () => {
			mockFs.existsSync.mockReturnValue(true)

			await updateRuleFileContent({
				rulePath: "custom_instructions.md",
				content: "test content",
				isGlobal: false,
			})

			expect(mockPath.join).toHaveBeenCalledWith("/mock/workspace", ".clinerules")
			expect(mockPath.join).toHaveBeenCalledWith("/mock/workspace/.clinerules", "custom_instructions.md")
		})

		it("should create workspace rules directory if it does not exist", async () => {
			mockFs.existsSync.mockReturnValue(false)

			await updateRuleFileContent({
				rulePath: "test.md",
				content: "test content",
				isGlobal: false,
			})

			expect(mockFs.mkdirSync).toHaveBeenCalledWith("/mock/workspace/.clinerules", { recursive: true })
		})
	})

	describe("file operations", () => {
		it("should write content to file successfully", async () => {
			const result = await updateRuleFileContent({
				rulePath: "test.md",
				content: "test content",
				isGlobal: true,
			})

			expect(mockFs.writeFileSync).toHaveBeenCalledWith("/mock/global/rules/test.md", "test content", "utf8")
			expect(result).toEqual({
				filePath: "/mock/global/rules/test.md",
				content: "test content",
				success: true,
			})
		})

		it("should delete file when deleteFile is true and file exists", async () => {
			mockFs.existsSync.mockReturnValue(true)

			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				deleteFile: true,
			})

			expect(mockFs.unlinkSync).toHaveBeenCalledWith("/mock/global/rules/test.md")
			expect(result.success).toBe(true)
		})

		it("should skip deletion when deleteFile is true but file does not exist", async () => {
			mockFs.existsSync.mockReturnValue(false)

			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				deleteFile: true,
			})

			expect(mockFs.unlinkSync).not.toHaveBeenCalled()
			expect(result.success).toBe(true)
		})

		it("should handle write errors gracefully", async () => {
			mockFs.writeFileSync.mockImplementation(() => {
				throw new Error("Write permission denied")
			})

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					content: "test content",
					isGlobal: true,
				}),
			).rejects.toThrow("Failed to write/delete file: Write permission denied")
		})

		it("should handle delete errors gracefully", async () => {
			mockFs.existsSync.mockReturnValue(true)
			mockFs.unlinkSync.mockImplementation(() => {
				throw new Error("Delete permission denied")
			})

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					isGlobal: true,
					deleteFile: true,
				}),
			).rejects.toThrow("Failed to write/delete file: Delete permission denied")
		})

		it("should handle different file paths correctly", async () => {
			const testCases = [
				{ path: "custom_instructions.md", expected: "/mock/global/rules/custom_instructions.md" },
				{ path: "nested/file.md", expected: "/mock/global/rules/nested/file.md" },
				{ path: "test.txt", expected: "/mock/global/rules/test.txt" },
			]

			for (const testCase of testCases) {
				const result = await updateRuleFileContent({
					rulePath: testCase.path,
					content: "test content",
					isGlobal: true,
				})

				expect(mockFs.writeFileSync).toHaveBeenCalledWith(testCase.expected, "test content", "utf8")
				expect(result.filePath).toBe(testCase.expected)
			}
		})
	})

	describe("error handling", () => {
		it("should handle fs.existsSync errors", async () => {
			mockFs.existsSync.mockImplementation(() => {
				throw new Error("File system error")
			})

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					isGlobal: false,
					content: "test content",
				}),
			).rejects.toThrow("Failed to determine rules directory: File system error")
		})

		it("should handle fs.mkdirSync errors", async () => {
			mockFs.existsSync.mockReturnValue(false)
			mockFs.mkdirSync.mockImplementation(() => {
				throw new Error("Directory creation failed")
			})

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					isGlobal: false,
					content: "test content",
				}),
			).rejects.toThrow("Failed to determine rules directory: Directory creation failed")
		})

		it("should handle path.join errors", async () => {
			mockPath.join.mockImplementation(() => {
				throw new Error("Path join failed")
			})

			await expect(
				updateRuleFileContent({
					rulePath: "test.md",
					isGlobal: true,
					content: "test content",
				}),
			).rejects.toThrow("Path join failed")
		})
	})

	describe("edge cases", () => {
		it("should handle enabled parameter with true value", async () => {
			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				enabled: true,
			})

			expect(result.success).toBe(true)
		})

		it("should handle enabled parameter with false value", async () => {
			const result = await updateRuleFileContent({
				rulePath: "test.md",
				isGlobal: true,
				enabled: false,
			})

			expect(result.success).toBe(true)
		})

		it("should handle very long file paths", async () => {
			const longPath = "a".repeat(200) + ".md"

			const result = await updateRuleFileContent({
				rulePath: longPath,
				content: "test content",
				isGlobal: true,
			})

			expect(result.success).toBe(true)
		})

		it("should handle special characters in file paths", async () => {
			const specialPath = "test-file_name[1].md"

			const result = await updateRuleFileContent({
				rulePath: specialPath,
				content: "test content",
				isGlobal: true,
			})

			expect(result.success).toBe(true)
		})
	})
})
