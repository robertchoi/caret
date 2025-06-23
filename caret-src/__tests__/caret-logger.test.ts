import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import {
	caretLogger,
	CaretLogger,
	CaretLogLevel,
	logCaretWelcome,
	logCaretApiConfig,
	logCaretTask,
	logCaretUser,
} from "../utils/caret-logger"

// Mock vscode
vi.mock("vscode", () => ({
	OutputChannel: {},
}))

describe("CaretLogger", () => {
	let mockOutputChannel: vscode.OutputChannel

	beforeEach(() => {
		vi.clearAllMocks()

		// Mock OutputChannel
		mockOutputChannel = {
			appendLine: vi.fn(),
			append: vi.fn(),
			clear: vi.fn(),
			dispose: vi.fn(),
			hide: vi.fn(),
			show: vi.fn(),
			name: "Caret",
			replace: vi.fn(),
		} as any

		// Reset logger state
		caretLogger.setOutputChannel(mockOutputChannel)
		caretLogger.setLogLevel(CaretLogLevel.DEBUG) // Reset to default
	})

	describe("setOutputChannel", () => {
		it("should set output channel", () => {
			const newChannel = { appendLine: vi.fn() } as any
			caretLogger.setOutputChannel(newChannel)

			caretLogger.info("test message", "TEST")
			expect(newChannel.appendLine).toHaveBeenCalled()
		})
	})

	describe("log level management", () => {
		it("should set log level", () => {
			caretLogger.setLogLevel(CaretLogLevel.WARN)

			// Debug and info should not log
			caretLogger.debug("Debug message", "TEST")
			caretLogger.info("Info message", "TEST")

			// Warn should log
			caretLogger.warn("Warning message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(1)
			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-WARN\] \[TEST\] Warning message/),
			)
		})

		it("should respect log level hierarchy", () => {
			caretLogger.setLogLevel(CaretLogLevel.ERROR)

			// Only error and success should log
			caretLogger.debug("Debug message")
			caretLogger.info("Info message")
			caretLogger.warn("Warning message")
			caretLogger.error("Error message")
			caretLogger.success("Success message")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(2)
		})

		it("should log all levels when set to DEBUG", () => {
			caretLogger.setLogLevel(CaretLogLevel.DEBUG)

			caretLogger.debug("Debug message")
			caretLogger.info("Info message")
			caretLogger.warn("Warning message")
			caretLogger.error("Error message")
			caretLogger.success("Success message")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(5)
		})
	})

	describe("logging methods", () => {
		it("should log debug messages", () => {
			caretLogger.debug("Debug message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-DEBUG\] \[TEST\] Debug message/),
			)
		})

		it("should log info messages", () => {
			caretLogger.info("Info message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[TEST\] Info message/),
			)
		})

		it("should log warn messages", () => {
			caretLogger.warn("Warning message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-WARN\] \[TEST\] Warning message/),
			)
		})

		it("should log error messages", () => {
			caretLogger.error("Error message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-ERROR\] \[TEST\] Error message/),
			)
		})

		it("should log success messages", () => {
			caretLogger.success("Success message", "TEST")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[TEST\] Success message/),
			)
		})

		it("should include timestamp in log messages", () => {
			caretLogger.info("Test message", "TEST")

			const logCall = vi.mocked(mockOutputChannel.appendLine).mock.calls[0][0]
			expect(logCall).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
		})

		it("should handle messages without category", () => {
			caretLogger.info("No category message")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-INFO\] No category message/))
		})

		it("should handle empty category", () => {
			caretLogger.info("Empty category message", "")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] Empty category message/),
			)
		})
	})

	describe("special logging methods", () => {
		it("should log extension activated message", () => {
			caretLogger.extensionActivated()

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[EXTENSION\] Caret 익스텐션이 활성화되었습니다/),
			)
		})

		it("should log extension deactivated message", () => {
			caretLogger.extensionDeactivated()

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[EXTENSION\] Caret 익스텐션이 비활성화되었습니다/),
			)
		})

		it("should log welcome page loaded message", () => {
			caretLogger.welcomePageLoaded()

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[UI\] Caret 웰컴 페이지가 로드되었습니다/),
			)
		})

		it("should log task started message", () => {
			caretLogger.taskStarted("Test Task")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[TASK\] 작업이 시작되었습니다: Test Task/),
			)
		})

		it("should log task completed message without duration", () => {
			caretLogger.taskCompleted("Test Task")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[TASK\] 작업이 완료되었습니다: Test Task$/),
			)
		})

		it("should log task completed message with duration", () => {
			caretLogger.taskCompleted("Test Task", 1500)

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[TASK\] 작업이 완료되었습니다: Test Task \(1500ms\)/),
			)
		})

		it("should log user interaction without details", () => {
			caretLogger.userInteraction("click")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-DEBUG\] \[USER\] 사용자 상호작용: click$/),
			)
		})

		it("should log user interaction with details", () => {
			caretLogger.userInteraction("click", "button-submit")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-DEBUG\] \[USER\] 사용자 상호작용: click - button-submit/),
			)
		})

		it("should log API configuration message", () => {
			caretLogger.apiConfigured("OpenAI")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[CONFIG\] API 설정이 완료되었습니다: OpenAI/),
			)
		})
	})

	describe("utility functions", () => {
		it("should log welcome using utility function", () => {
			logCaretWelcome()

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[UI\] Caret 웰컴 페이지가 로드되었습니다/),
			)
		})

		it("should log API config using utility function", () => {
			logCaretApiConfig("Claude")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[CONFIG\] API 설정이 완료되었습니다: Claude/),
			)
		})

		it("should log task start using utility function", () => {
			logCaretTask("Test Task", "start")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-INFO\] \[TASK\] 작업이 시작되었습니다: Test Task/),
			)
		})

		it("should log task complete using utility function", () => {
			logCaretTask("Test Task", "complete", 2000)

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-SUCCESS\] \[TASK\] 작업이 완료되었습니다: Test Task \(2000ms\)/),
			)
		})

		it("should log user interaction using utility function", () => {
			logCaretUser("navigation", "settings-page")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringMatching(/\[CARET-DEBUG\] \[USER\] 사용자 상호작용: navigation - settings-page/),
			)
		})
	})

	describe("error handling", () => {
		it("should handle missing output channel gracefully", () => {
			caretLogger.setOutputChannel(null as any)

			// Should not throw error
			expect(() => caretLogger.info("Test message", "TEST")).not.toThrow()
		})

		it("should handle output channel appendLine error", () => {
			const errorChannel = {
				appendLine: vi.fn().mockImplementation(() => {
					throw new Error("Channel error")
				}),
			} as any

			caretLogger.setOutputChannel(errorChannel)

			// Should throw error because the actual implementation doesn't catch it
			expect(() => caretLogger.info("Test message", "TEST")).toThrow("Channel error")
		})
	})

	describe("log formatting", () => {
		it("should format log with all components", () => {
			caretLogger.info("Test message", "CATEGORY")

			const logMessage = vi.mocked(mockOutputChannel.appendLine).mock.calls[0][0]

			// Should contain timestamp, level, category, and message
			expect(logMessage).toMatch(
				/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[CARET-INFO\] \[CATEGORY\] Test message$/,
			)
		})

		it("should format log without category", () => {
			caretLogger.warn("Warning message")

			const logMessage = vi.mocked(mockOutputChannel.appendLine).mock.calls[0][0]

			// Should contain timestamp, level, and message (no category brackets)
			expect(logMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[CARET-WARN\] Warning message$/)
		})

		it("should handle multiline messages", () => {
			caretLogger.debug("Line 1\nLine 2\nLine 3", "MULTILINE")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining("Line 1\nLine 2\nLine 3"))
		})

		it("should handle special characters in messages", () => {
			const specialMessage = 'Message with "quotes" and <tags> and [brackets] and {braces}'
			caretLogger.info(specialMessage, "SPECIAL")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining(specialMessage))
		})

		it("should handle unicode characters", () => {
			const unicodeMessage = "🚀 Unicode test: こんにちは 你好 🎉"
			caretLogger.info(unicodeMessage, "UNICODE")

			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining(unicodeMessage))
		})
	})

	describe("console logging", () => {
		beforeEach(() => {
			vi.spyOn(console, "debug").mockImplementation(() => {})
			vi.spyOn(console, "info").mockImplementation(() => {})
			vi.spyOn(console, "warn").mockImplementation(() => {})
			vi.spyOn(console, "error").mockImplementation(() => {})
		})

		it("should log to console.debug for DEBUG level", () => {
			caretLogger.debug("Debug message", "TEST")

			expect(console.debug).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-DEBUG\] \[TEST\] Debug message/))
		})

		it("should log to console.info for INFO level", () => {
			caretLogger.info("Info message", "TEST")

			expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-INFO\] \[TEST\] Info message/))
		})

		it("should log to console.info for SUCCESS level", () => {
			caretLogger.success("Success message", "TEST")

			expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-SUCCESS\] \[TEST\] Success message/))
		})

		it("should log to console.warn for WARN level", () => {
			caretLogger.warn("Warning message", "TEST")

			expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-WARN\] \[TEST\] Warning message/))
		})

		it("should log to console.error for ERROR level", () => {
			caretLogger.error("Error message", "TEST")

			expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/\[CARET-ERROR\] \[TEST\] Error message/))
		})
	})

	describe("CaretLogger constructor", () => {
		it("should create logger without output channel", () => {
			const logger = new CaretLogger()

			// Should not throw when logging without output channel
			expect(() => logger.info("Test message")).not.toThrow()
		})

		it("should create logger with output channel", () => {
			const channel = { appendLine: vi.fn() } as any
			const logger = new CaretLogger(channel)

			logger.info("Test message")
			expect(channel.appendLine).toHaveBeenCalled()
		})
	})
})
