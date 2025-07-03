import { describe, it, expect, vi } from "vitest"

// Import Task prototype for method access
import { Task } from "../core/task/index"

/**
 * Unit test for the minimal patch that handles `chatbot_mode_respond` tool blocks.
 * The goal is to ensure that:
 *   1. `presentAssistantMessage()` calls `say("text", response)`.
 *   2. `didAlreadyUseTool` is set to `true` to prevent further tool handling in the same message.
 */
describe("presentAssistantMessage – chatbot_mode_respond", () => {
	it("should invoke say() with response and flag tool as used", async () => {
		const saySpy = vi.fn().mockResolvedValue(undefined)

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
					},
					partial: false,
				},
			],
			didCompleteReadingStream: false,
			userMessageContentReady: false,
			didRejectTool: false,
			didAlreadyUseTool: false,
			userMessageContent: [],
			say: saySpy,
			browserSession: { closeBrowser: vi.fn().mockResolvedValue(undefined) },
		})

		// Execute
		await stubTask.presentAssistantMessage()

		// Assertions
		expect(saySpy).toHaveBeenCalled()
		expect(saySpy.mock.calls[0][0]).toBe("text")
		expect(saySpy.mock.calls[0][1]).toBe("Hello there")
		expect(stubTask.didAlreadyUseTool).toBe(true)
	})
}) 