import { describe, it, expect, beforeEach } from "vitest"
import { SYSTEM_PROMPT } from "../core/prompts/system"
import { CaretSystemPrompt } from "../core/prompts/CaretSystemPrompt"
import path from "path"

describe("🔍 토큰 길이 분석 시스템", () => {
	const mockExtensionPath = path.join(__dirname, "..", "..")
	const mockMcpHub = {
		getServers: () => [],
		getToolsForMcp: () => [],
	}
	const mockBrowserSettings = {
		viewport: { width: 1920, height: 1080 },
		debugMode: false,
		customLaunchArgs: [],
	}
	const testCwd = "/test/cwd"

	beforeEach(() => {
		// 각 테스트 전에 인스턴스 초기화
		if (CaretSystemPrompt.isInitialized()) {
			CaretSystemPrompt.resetInstance()
		}
	})

	describe("토큰 길이 측정 및 비교", () => {
		it("Cline 원본 시스템 프롬프트 토큰 길이 측정", async () => {
			const clinePrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				undefined, // Cline 원본 사용
				"agent",
			)

			const clineTokenCount = estimateTokenCount(clinePrompt)
			console.log(`📊 Cline 원본 토큰 길이: ${clineTokenCount} tokens (${clinePrompt.length} chars)`)

			expect(clinePrompt.length).toBeGreaterThan(0)
			expect(clineTokenCount).toBeGreaterThan(0)
		})

		it("Caret JSON 시스템 Agent 모드 토큰 길이 측정", async () => {
			const caretAgentPrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath, // Caret JSON 시스템 사용
				"agent",
			)

			const caretAgentTokenCount = estimateTokenCount(caretAgentPrompt)
			console.log(`📊 Caret Agent 모드 토큰 길이: ${caretAgentTokenCount} tokens (${caretAgentPrompt.length} chars)`)

			expect(caretAgentPrompt.length).toBeGreaterThan(0)
			expect(caretAgentTokenCount).toBeGreaterThan(0)
		})

		it("Caret JSON 시스템 Chatbot 모드 토큰 길이 측정", async () => {
			const caretChatbotPrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath, // Caret JSON 시스템 사용
				"chatbot",
			)

			const caretChatbotTokenCount = estimateTokenCount(caretChatbotPrompt)
			console.log(`📊 Caret Chatbot 모드 토큰 길이: ${caretChatbotTokenCount} tokens (${caretChatbotPrompt.length} chars)`)

			expect(caretChatbotPrompt.length).toBeGreaterThan(0)
			expect(caretChatbotTokenCount).toBeGreaterThan(0)
		})

		it("🚨 토큰 길이 비교 및 효율성 분석", async () => {
			// 모든 시스템의 토큰 길이 측정
			const clinePrompt = await SYSTEM_PROMPT(testCwd, true, mockMcpHub, mockBrowserSettings, false, undefined, "agent")
			const caretAgentPrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)
			const caretChatbotPrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"chatbot",
			)

			const clineTokens = estimateTokenCount(clinePrompt)
			const caretAgentTokens = estimateTokenCount(caretAgentPrompt)
			const caretChatbotTokens = estimateTokenCount(caretChatbotPrompt)

			console.log("\n📊 토큰 길이 종합 분석:")
			console.log(`Cline 원본:           ${clineTokens} tokens (${clinePrompt.length} chars)`)
			console.log(`Caret Agent 모드:     ${caretAgentTokens} tokens (${caretAgentPrompt.length} chars)`)
			console.log(`Caret Chatbot 모드:   ${caretChatbotTokens} tokens (${caretChatbotPrompt.length} chars)`)

			// 효율성 계산
			const agentEfficiency = ((clineTokens - caretAgentTokens) / clineTokens) * 100
			const chatbotEfficiency = ((clineTokens - caretChatbotTokens) / clineTokens) * 100

			console.log(`\n🎯 효율성 분석:`)
			console.log(`Agent 모드 효율성:    ${agentEfficiency.toFixed(2)}% (음수면 비효율적)`)
			console.log(`Chatbot 모드 효율성:  ${chatbotEfficiency.toFixed(2)}% (음수면 비효율적)`)

			// 경고 조건 체크
			if (agentEfficiency < 0) {
				console.warn(
					`🚨 경고: Agent 모드가 Cline 원본보다 ${Math.abs(agentEfficiency).toFixed(2)}% 더 많은 토큰을 사용합니다!`,
				)
			}
			if (chatbotEfficiency < 0) {
				console.warn(
					`🚨 경고: Chatbot 모드가 Cline 원본보다 ${Math.abs(chatbotEfficiency).toFixed(2)}% 더 많은 토큰을 사용합니다!`,
				)
			}

			// 테스트 결과 검증
			expect(clineTokens).toBeGreaterThan(0)
			expect(caretAgentTokens).toBeGreaterThan(0)
			expect(caretChatbotTokens).toBeGreaterThan(0)
		})
	})

	describe("섹션별 토큰 사용량 분석", () => {
		it("JSON 섹션별 토큰 사용량 측정", async () => {
			// CaretSystemPrompt 인스턴스 생성
			const caretSystemPrompt = new CaretSystemPrompt(mockExtensionPath, true)

			// 각 섹션별 토큰 사용량 측정을 위한 mock 함수
			const originalGenerateFromJsonSections = caretSystemPrompt.generateFromJsonSections.bind(caretSystemPrompt)

			let sectionAnalysis: { [key: string]: number } = {}

			// 섹션 분석 로직은 추후 구현
			const fullPrompt = await originalGenerateFromJsonSections(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				false,
				"agent",
			)

			const totalTokens = estimateTokenCount(fullPrompt)
			console.log(`📊 전체 JSON 시스템 토큰 수: ${totalTokens} tokens`)

			expect(totalTokens).toBeGreaterThan(0)
		})
	})
})

/**
 * 토큰 수 추정 함수
 * OpenAI의 일반적인 규칙: 영어 4글자 = 1토큰, 한국어 1글자 = 1토큰
 */
function estimateTokenCount(text: string): number {
	// 한국어와 영어를 분리하여 토큰 수 계산
	const koreanChars = (text.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g) || []).length
	const englishChars = text.length - koreanChars

	// 한국어: 1글자 = 1토큰, 영어: 4글자 = 1토큰
	const koreanTokens = koreanChars
	const englishTokens = Math.ceil(englishChars / 4)

	return koreanTokens + englishTokens
}
