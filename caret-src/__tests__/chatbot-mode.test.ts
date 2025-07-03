import { describe, it, expect, vi } from "vitest"

// Import Task prototype for method access
import { Task } from "../core/task/index"

/**
 * Unit test for the chatbot_mode_respond tool handling.
 * The goal is to ensure that:
 *   1. `presentAssistantMessage()` calls `ask("chatbot_mode_respond", ...)`.
 *   2. `didAlreadyUseTool` is set to `true` to prevent further tool handling in the same message.
 */
describe("presentAssistantMessage – chatbot_mode_respond", () => {
	it("should invoke ask() with chatbot_mode_respond and flag tool as used", async () => {
		const askSpy = vi.fn().mockResolvedValue({ response: "messageResponse", text: "user response" })

		// Create a stub task instance with only the fields required by presentAssistantMessage
		const stubTask: any = Object.assign(Object.create(Task.prototype), {
			abort: false,
			presentAssistantMessageLocked: false,
			presentAssistantMessageHasPendingUpdates: false,
			currentStreamingContentIndex: 0,
			assistantMessageContent: [
				{
					type: "tool_use",
					name: "chatbot_mode_respond",
					params: {
						response: "Hello there",
						options: '["Continue", "Stop"]'
					},
					partial: false,
				},
			],
			didCompleteReadingStream: false,
			userMessageContentReady: false,
			didRejectTool: false,
			didAlreadyUseTool: false,
			userMessageContent: [],
			consecutiveMistakeCount: 0,
			isAwaitingPlanResponse: false,
			clineMessages: [],
			ask: askSpy,
			saveCheckpoint: vi.fn().mockResolvedValue(undefined),
			say: vi.fn().mockResolvedValue(undefined),
			browserSession: { closeBrowser: vi.fn().mockResolvedValue(undefined) },
		})

		// Execute
		await stubTask.presentAssistantMessage()

		// Assertions
		expect(askSpy).toHaveBeenCalled()
		expect(askSpy.mock.calls[0][0]).toBe("chatbot_mode_respond")
		expect(stubTask.didAlreadyUseTool).toBe(true)
	})
}) 