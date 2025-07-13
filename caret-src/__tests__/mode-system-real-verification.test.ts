import { describe, it, expect, vi, beforeEach } from "vitest"
import { SYSTEM_PROMPT } from "../../src/core/prompts/system"

// Mock VSCode
const mockVSCode = {
	window: {
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	workspace: {
		getConfiguration: vi.fn(),
	},
}

vi.mock("vscode", () => mockVSCode)

// 실제 환경 시뮬레이션
const mockMcpHub = {
	getServers: () => [],
	getConnectedServers: () => [],
}

const mockBrowserSettings = {
	viewport: { width: 1920, height: 1080 },
	debugMode: false,
	customLaunchArgs: [],
}

const mockExtensionPath = process.cwd()

describe("🔍 실제 모드 시스템 동작 검증", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// Console spy 설정
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
		const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		return () => {
			consoleSpy.mockRestore()
			consoleWarnSpy.mockRestore()
			consoleErrorSpy.mockRestore()
		}
	})

	it("🔍 Cline 모드 - extensionPath 없음으로 원본 시스템 사용", async () => {
		const consoleSpy = vi.spyOn(console, "log")
		const consoleWarnSpy = vi.spyOn(console, "warn")

		const clinePrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined, // extensionPath 없음 = Cline 시스템
			"agent",
		)

		// 실제 로그 확인
		const allLogs = [...consoleSpy.mock.calls.flat(), ...consoleWarnSpy.mock.calls.flat()]

		console.log("🔍 Cline 모드 로그:", allLogs)

		// Cline 시스템 특징 확인
		expect(clinePrompt).toContain("You are Cline")
		expect(clinePrompt.length).toBeGreaterThan(1000)

		// 토큰 길이 출력
		console.log(`📊 Cline 시스템 프롬프트 길이: ${clinePrompt.length} chars`)

		consoleSpy.mockRestore()
		consoleWarnSpy.mockRestore()
	})

	it("🔍 Caret 모드 - extensionPath 있음으로 JSON 시스템 시도", async () => {
		const consoleSpy = vi.spyOn(console, "log")
		const consoleWarnSpy = vi.spyOn(console, "warn")
		const consoleErrorSpy = vi.spyOn(console, "error")

		const caretPrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath, // extensionPath 있음 = Caret 시스템 시도
			"agent",
		)

		// 실제 로그 확인
		const allLogs = [
			...consoleSpy.mock.calls.flat(),
			...consoleWarnSpy.mock.calls.flat(),
			...consoleErrorSpy.mock.calls.flat(),
		]

		console.log("🔍 Caret 모드 로그:", allLogs)

		// 프롬프트 존재 확인
		expect(caretPrompt.length).toBeGreaterThan(1000)

		// 토큰 길이 출력
		console.log(`📊 Caret 시스템 프롬프트 길이: ${caretPrompt.length} chars`)

		// JSON 시스템 시도 여부 확인
		const jsonSystemLogs = allLogs.filter(
			(log) =>
				typeof log === "string" &&
				(log.includes("JSON system") || log.includes("CaretSystemPrompt") || log.includes("JSON generation failed")),
		)

		console.log("🔍 JSON 시스템 관련 로그:", jsonSystemLogs)

		consoleSpy.mockRestore()
		consoleWarnSpy.mockRestore()
		consoleErrorSpy.mockRestore()
	})

	it("🔍 실제 토큰 길이 비교", async () => {
		const clinePrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined, // Cline
			"agent",
		)

		const caretPrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath, // Caret
			"agent",
		)

		// 토큰 길이 비교
		console.log(`
📊 실제 토큰 길이 비교:
- Cline 시스템: ${clinePrompt.length} chars
- Caret 시스템: ${caretPrompt.length} chars
- 차이: ${caretPrompt.length - clinePrompt.length} chars
- 효율성: ${
			clinePrompt.length > caretPrompt.length
				? `${(((clinePrompt.length - caretPrompt.length) / clinePrompt.length) * 100).toFixed(2)}% 절약`
				: `${(((caretPrompt.length - clinePrompt.length) / clinePrompt.length) * 100).toFixed(2)}% 증가`
		}`)

		// 실제 다른 시스템이 사용되는지 확인
		expect(clinePrompt).not.toBe(caretPrompt)
	})

	it("🔍 모드 매핑 확인 - Plan이 Chatbot으로 변환되는지", async () => {
		// Plan 모드 시뮬레이션
		const planModePrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath,
			"chatbot", // Plan 모드는 chatbot으로 변환됨
		)

		// Act 모드 시뮬레이션
		const actModePrompt = await SYSTEM_PROMPT(
			"/test/cwd",
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath,
			"agent", // Act 모드는 agent로 변환됨
		)

		console.log(`
📊 모드별 프롬프트 길이:
- Plan → Chatbot: ${planModePrompt.length} chars
- Act → Agent: ${actModePrompt.length} chars
- 차이: ${actModePrompt.length - planModePrompt.length} chars`)

		expect(planModePrompt).not.toBe(actModePrompt)
	})
})
