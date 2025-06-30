import { describe, it, expect, vi, beforeEach } from "vitest"
import { SYSTEM_PROMPT } from "../core/prompts/system"

// 모의 객체들
const mockMcpHub = {
	getServers: () => [],
	getConnectedServers: () => [],
}

const mockBrowserSettings = {
	viewport: { width: 1200, height: 800 },
}

const mockExtensionPath = process.cwd()

// VSCode API mock (hoisting 문제 해결)
vi.mock(
	"vscode",
	() => ({
		workspace: {
			getConfiguration: vi.fn((section: string) => {
				if (section === "caret.systemPrompt") {
					return {
						get: vi.fn((key: string, defaultValue: any) => {
							if (key === "mode") return "caret" // 강제로 caret 모드
							if (key === "fallbackToCline") return true
							return defaultValue
						}),
					}
				}
				return {
					get: vi.fn((key: string, defaultValue: any) => defaultValue),
				}
			}),
		},
		window: {
			showInformationMessage: vi.fn(),
			createTextEditorDecorationType: vi.fn(() => ({
				dispose: vi.fn(),
				key: "test-decoration-type",
			})),
		},
		env: {
			machineId: "test-machine-id",
			sessionId: "test-session-id",
			language: "en",
			shell: "/bin/bash",
		},
		ConfigurationTarget: {
			Workspace: 2,
		},
	}),
	{ virtual: true },
)

describe("🔴 RED - Mode System Verification", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("Cline vs Caret Mode Differentiation", () => {
		it("🔴 SHOULD FAIL: Cline mode should include planModeRespondTool", async () => {
			// Cline 모드 (extensionPath 없음)
			const clinePrompt = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				undefined, // extensionPath 없음 = Cline 모드
				"agent",
			)

			// Cline 모드에서는 planModeRespondTool이 포함되어야 함
			expect(clinePrompt).toContain("plan_mode_respond")
			expect(clinePrompt).toContain("PLAN MODE")
			expect(clinePrompt).toContain("ACT MODE")
		})

		it("🔴 SHOULD FAIL: Caret mode should exclude planModeRespondTool", async () => {
			// Caret 모드 (extensionPath 있음)
			const caretPrompt = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath, // extensionPath 있음 = Caret 모드
				"agent",
			)

			// Caret 모드에서는 planModeRespondTool이 없어야 함
			expect(caretPrompt).not.toContain("plan_mode_respond")
			expect(caretPrompt).not.toContain("PLAN MODE")
			expect(caretPrompt).not.toContain("ACT MODE")
		})

		it("🔴 SHOULD FAIL: Caret mode should use JSON-based tools", async () => {
			const caretPrompt = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			// Caret JSON 시스템의 특징들
			expect(caretPrompt).toContain("execute_command")
			expect(caretPrompt).toContain("read_file")
			expect(caretPrompt).toContain("write_to_file")

			// JSON 기반 도구 형식인지 확인
			expect(caretPrompt).toContain("<execute_command>")
			expect(caretPrompt).toContain("<read_file>")
		})

		it("🔴 SHOULD FAIL: Different prompts for chatbot vs agent mode in Caret", async () => {
			const caretChatbotPrompt = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"chatbot",
			)

			const caretAgentPrompt = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			// chatbot과 agent 모드에서 다른 프롬프트가 생성되어야 함
			expect(caretChatbotPrompt).not.toBe(caretAgentPrompt)
			expect(caretChatbotPrompt.length).toBeGreaterThan(0)
			expect(caretAgentPrompt.length).toBeGreaterThan(0)
		})

		it("🔴 SHOULD FAIL: Caret mode should have different prompt structure", async () => {
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

			// 두 프롬프트는 달라야 함
			expect(clinePrompt).not.toBe(caretPrompt)

			// 길이도 다를 것으로 예상
			const lengthDifferenceRatio =
				Math.abs(clinePrompt.length - caretPrompt.length) / Math.max(clinePrompt.length, caretPrompt.length)
			expect(lengthDifferenceRatio).toBeGreaterThan(0.1) // 10% 이상 차이
		})

		it("🔴 SHOULD FAIL: Caret mode should log JSON system usage", async () => {
			const consoleSpy = vi.spyOn(console, "log")

			await SYSTEM_PROMPT("/test/cwd", true, mockMcpHub, mockBrowserSettings, false, mockExtensionPath, "agent")

			// Caret JSON 시스템 사용 로그가 출력되어야 함
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[CARET] Generated prompt via Caret JSON system"))

			consoleSpy.mockRestore()
		})
	})

	describe("Mode System Integration", () => {
		it("🔴 SHOULD FAIL: extensionPath presence determines system choice", async () => {
			// extensionPath 없음 = Cline
			const promptWithoutPath = await SYSTEM_PROMPT(
				"/test/cwd",
				false,
				mockMcpHub,
				mockBrowserSettings,
				false,
				undefined,
				"agent",
			)

			// extensionPath 있음 = Caret
			const promptWithPath = await SYSTEM_PROMPT(
				"/test/cwd",
				false,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			// 시스템이 다르게 선택되어야 함
			expect(promptWithoutPath).not.toBe(promptWithPath)
		})

		it("🔴 SHOULD FAIL: Browser settings affect both systems", async () => {
			// Browser 비활성화
			const promptNoBrowser = await SYSTEM_PROMPT(
				"/test/cwd",
				false,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			// Browser 활성화
			const promptWithBrowser = await SYSTEM_PROMPT(
				"/test/cwd",
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			// 브라우저 설정에 따라 프롬프트가 달라져야 함
			expect(promptNoBrowser).not.toBe(promptWithBrowser)
			expect(promptWithBrowser).toContain("browser_action")
			expect(promptNoBrowser).not.toContain("browser_action")
		})
	})
})
