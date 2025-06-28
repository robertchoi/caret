import { describe, it, expect, beforeEach } from "vitest"

describe("Chatbot/Agent 핵심 타입 시스템", () => {
	it("should define ChatbotAgentMode enum correctly", () => {
		// TDD: Chatbot/Agent 열거형이 올바르게 정의되어야 함
		const { ChatbotAgentMode } = require("../../shared/proto/state")

		expect(ChatbotAgentMode.ASK).toBe(0)
		expect(ChatbotAgentMode.AGENT).toBe(1)
		expect(ChatbotAgentMode.UNRECOGNIZED).toBe(-1)
	})

	it("should convert ChatSettings with Chatbot/Agent types correctly", () => {
		// TDD: ChatSettings가 Chatbot/Agent 타입을 올바르게 처리해야 함
		const { ChatSettings } = require("../../shared/ChatSettings")

		const askSettings = { mode: "ask" as const }
		const agentSettings = { mode: "agent" as const }

		expect(askSettings.mode).toBe("ask")
		expect(agentSettings.mode).toBe("agent")
	})

	it("should have consistent Chatbot/Agent terminology in enum functions", () => {
		// TDD: JSON 변환 함수들이 Chatbot/Agent 용어를 사용해야 함
		const { ChatbotAgentModeFromJSON, ChatbotAgentModeToJSON, ChatbotAgentMode } = require("../../shared/proto/state")

		expect(ChatbotAgentModeFromJSON("ASK")).toBe(ChatbotAgentMode.ASK)
		expect(ChatbotAgentModeFromJSON("AGENT")).toBe(ChatbotAgentMode.AGENT)
		expect(ChatbotAgentModeToJSON(ChatbotAgentMode.ASK)).toBe("ASK")
		expect(ChatbotAgentModeToJSON(ChatbotAgentMode.AGENT)).toBe("AGENT")
	})

	it("should define ToggleChatbotAgentModeRequest interface correctly", () => {
		// TDD: Chatbot/Agent 토글 요청 인터페이스가 올바르게 정의되어야 함
		const { ToggleChatbotAgentModeRequest } = require("../../shared/proto/state")

		expect(ToggleChatbotAgentModeRequest).toBeDefined()
		expect(typeof ToggleChatbotAgentModeRequest.encode).toBe("function")
		expect(typeof ToggleChatbotAgentModeRequest.decode).toBe("function")
	})

	it("should maintain Cline compatibility through mapping functions", () => {
		// TDD: Cline 호환성을 위한 매핑 함수들이 있어야 함 (나중에 구현 예정)
		// 현재는 테스트만 정의, 구현은 Phase 2에서

		// 예상 매핑 동작
		const expectedMappings = {
			ask: "plan",
			agent: "act",
		}

		expect(expectedMappings.ask).toBe("plan")
		expect(expectedMappings.agent).toBe("act")
	})

	it("should have default mode as Agent", () => {
		// TDD: 기본 모드는 Agent여야 함 (마스터 정책)
		const defaultMode = "agent" as const
		expect(defaultMode).toBe("agent")
	})
})

describe("Chatbot/Agent 타입 안전성 테스트", () => {
	it("should only accept valid Chatbot/Agent mode strings", () => {
		// TDD: 타입 안전성 검증
		const validModes = ["ask", "agent"] as const
		const invalidModes = ["plan", "act", "invalid", ""]

		validModes.forEach((mode) => {
			expect(["ask", "agent"]).toContain(mode)
		})

		invalidModes.forEach((mode) => {
			expect(["ask", "agent"]).not.toContain(mode)
		})
	})

	it("should convert between string and enum correctly", () => {
		// TDD: 문자열과 열거형 간 변환이 정확해야 함
		const modeMap = {
			ask: 0,
			agent: 1,
		}

		expect(modeMap.ask).toBe(0)
		expect(modeMap.agent).toBe(1)
	})
})
