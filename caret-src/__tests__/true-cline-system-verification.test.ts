import { describe, it, expect, vi } from "vitest"
import { McpHub } from "../../src/services/mcp/McpHub"
import { BrowserSettings } from "../../src/shared/BrowserSettings"

// CARET MODIFICATION: TRUE_CLINE_SYSTEM_PROMPT 검증 테스트
describe("TRUE_CLINE_SYSTEM_PROMPT Verification", () => {
	let mockMcpHub: McpHub
	let mockBrowserSettings: BrowserSettings

	beforeEach(() => {
		// McpHub mock 설정
		mockMcpHub = {
			getServers: vi.fn().mockReturnValue([]),
		} as any

		// BrowserSettings mock 설정
		mockBrowserSettings = {
			viewport: { width: 1280, height: 720 },
			disableToolUse: false,
		} as any

		// caret-logger mock 설정
		vi.doMock("../utils/caret-logger", () => ({
			caretLogger: {
				success: vi.fn(),
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			},
		}))
	})

	it("should import TRUE_CLINE_SYSTEM_PROMPT successfully", async () => {
		// TRUE_CLINE_SYSTEM_PROMPT 함수를 정상적으로 import할 수 있는지 확인
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")

		expect(TRUE_CLINE_SYSTEM_PROMPT).toBeDefined()
		expect(typeof TRUE_CLINE_SYSTEM_PROMPT).toBe("function")
	})

	it("should generate system prompt for ACT mode", async () => {
		// ACT 모드로 시스템 프롬프트 생성
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")

		const result = await TRUE_CLINE_SYSTEM_PROMPT(
			"/test/directory",
			false, // supportsBrowserUse
			mockMcpHub,
			mockBrowserSettings,
			false, // isClaude4ModelFamily
			"act",
		)

		expect(result).toBeDefined()
		expect(typeof result).toBe("string")
		expect(result.length).toBeGreaterThan(1000) // 충분히 긴 시스템 프롬프트인지 확인
		expect(result).toContain("You are Cline") // Cline 시스템 프롬프트 시작 부분
		expect(result).toContain("TOOL USE") // 도구 사용 섹션 포함
	})

	it("should generate system prompt for PLAN mode", async () => {
		// PLAN 모드로 시스템 프롬프트 생성
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")

		const result = await TRUE_CLINE_SYSTEM_PROMPT(
			"/test/directory",
			false, // supportsBrowserUse
			mockMcpHub,
			mockBrowserSettings,
			false, // isClaude4ModelFamily
			"plan",
		)

		expect(result).toBeDefined()
		expect(typeof result).toBe("string")
		expect(result.length).toBeGreaterThan(1000) // 충분히 긴 시스템 프롬프트인지 확인
		expect(result).toContain("You are Cline") // Cline 시스템 프롬프트 시작 부분
		expect(result).toContain("plan_mode_respond") // Plan 모드 도구 포함
	})

	it("should be different from modified system prompt", async () => {
		// 진짜 Cline 원본과 수정된 시스템 프롬프트가 다른지 확인
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")
		const { SYSTEM_PROMPT } = await import("../../src/core/prompts/system")

		const trueClinePrompt = await TRUE_CLINE_SYSTEM_PROMPT(
			"/test/directory",
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			"act",
		)

		const modifiedPrompt = await SYSTEM_PROMPT(
			"/test/directory",
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined, // extensionPath가 없으면 ORIGINAL_CLINE_SYSTEM_PROMPT 호출
		)

		// 두 프롬프트의 길이가 다른지 확인 (Caret 수정사항으로 인해)
		expect(trueClinePrompt.length).not.toBe(modifiedPrompt.length)

		// 둘 다 Cline으로 시작하지만 내용이 다른지 확인
		expect(trueClinePrompt).toContain("You are Cline")
		expect(modifiedPrompt).toContain("You are Cline")
	})

	it("should measure token length for comparison", async () => {
		// 토큰 길이 측정을 위한 간단한 검증
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")

		const prompt = await TRUE_CLINE_SYSTEM_PROMPT("/test/directory", false, mockMcpHub, mockBrowserSettings, false, "act")

		// 대략적인 토큰 수 계산 (단어 수 / 0.75)
		const wordCount = prompt.split(/\s+/).length
		const approximateTokens = Math.ceil(wordCount / 0.75)

		console.log(`📊 TRUE_CLINE_SYSTEM_PROMPT Token Analysis:`)
		console.log(`   Characters: ${prompt.length.toLocaleString()}`)
		console.log(`   Words: ${wordCount.toLocaleString()}`)
		console.log(`   Approximate Tokens: ${approximateTokens.toLocaleString()}`)

		expect(approximateTokens).toBeGreaterThan(0)
		expect(approximateTokens).toBeLessThan(50000) // 합리적인 상한선
	})
})
