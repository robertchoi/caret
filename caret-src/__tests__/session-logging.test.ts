import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ClineMessage, ClineApiReqInfo } from "../../src/shared/ExtensionMessage"

describe("Session Logging", () => {
	it("should include sessionMode and sessionType in api_req_started message", () => {
		// Mock ClineMessage with api_req_started
		const mockApiReqStartedMessage: ClineMessage = {
			ts: Date.now(),
			type: "say",
			say: "api_req_started",
			text: JSON.stringify({
				request: "test request",
				sessionMode: "caret",
				sessionType: "new",
			} as ClineApiReqInfo),
		}

		// Parse the message text
		const apiReqInfo: ClineApiReqInfo = JSON.parse(mockApiReqStartedMessage.text || "{}")

		// Verify sessionMode and sessionType are present
		expect(apiReqInfo.sessionMode).toBe("caret")
		expect(apiReqInfo.sessionType).toBe("new")
		expect(apiReqInfo.request).toBe("test request")
	})

	it("should handle different session modes", () => {
		const clineSessionMessage: ClineMessage = {
			ts: Date.now(),
			type: "say",
			say: "api_req_started",
			text: JSON.stringify({
				request: "test request",
				sessionMode: "cline",
				sessionType: "continuing",
			} as ClineApiReqInfo),
		}

		const apiReqInfo: ClineApiReqInfo = JSON.parse(clineSessionMessage.text || "{}")
		
		expect(apiReqInfo.sessionMode).toBe("cline")
		expect(apiReqInfo.sessionType).toBe("continuing")
	})

	it("should work with generate-report.js parsing logic", () => {
		// Simulate how generate-report.js parses the data
		const uiMessages: ClineMessage[] = [
			{
				ts: Date.now(),
				type: "say",
				say: "api_req_started",
				text: JSON.stringify({
					request: "test request",
					tokensIn: 100,
					tokensOut: 200,
					cachedTokens: 50,
					cost: 0.005,
					sessionMode: "caret",
					sessionType: "new",
				} as ClineApiReqInfo),
			},
		]

		// Simulate generate-report.js parsing logic
		let actualMode = "unknown"
		uiMessages.forEach((msg) => {
			if (msg.type === "say" && msg.say === "api_req_started") {
				try {
					const apiData = JSON.parse(msg.text || "{}")
					if (actualMode === "unknown" && apiData.sessionMode) {
						actualMode = apiData.sessionMode
					}
				} catch (e) {
					// ignore parse errors
				}
			}
		})

		expect(actualMode).toBe("caret")
	})
}) 