import { describe, it, expect, vi } from "vitest"
import { buildApiHandler } from "../../../src/api/index"
import { ApiConfiguration } from "../../../src/shared/api"

// Mock the Logger
vi.mock("../../../src/services/logging/Logger", () => ({
	Logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}))

// Mock OpenAI for integration test
vi.mock("openai", () => ({
	default: vi.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: vi.fn().mockImplementation(() => ({
					async *[Symbol.asyncIterator]() {
						yield {
							choices: [
								{
									delta: { content: "Hello from Caret API!" },
								},
							],
						}
					},
				})),
			},
		},
	})),
}))

describe("Provider Integration Test", () => {
	it('should use CaretHandler when provider is "cline"', () => {
		const config: ApiConfiguration = {
			apiProvider: "cline",
			clineApiKey: "test-key",
			taskId: "integration-test",
		}

		const handler = buildApiHandler(config)

		// Verify we get an instance
		expect(handler).toBeDefined()
		expect(typeof handler.createMessage).toBe("function")
		expect(typeof handler.getModel).toBe("function")
	})

	it("should create stream with CaretHandler successfully", async () => {
		const config: ApiConfiguration = {
			apiProvider: "cline",
			clineApiKey: "test-key",
			taskId: "stream-test",
			openRouterModelId: "test-model",
			openRouterModelInfo: {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsImages: true,
				supportsPromptCache: false,
				inputPrice: 0.001,
				outputPrice: 0.002,
			},
		}

		const handler = buildApiHandler(config)
		const systemPrompt = "You are a helpful AI assistant."
		const messages: any[] = []

		// Create message stream
		const generator = handler.createMessage(systemPrompt, messages)

		// Get first chunk to verify it works
		const firstResult = await generator.next()

		expect(firstResult.done).toBe(false)
		expect(firstResult.value).toBeDefined()
	})

	it("should return correct model info", () => {
		const config: ApiConfiguration = {
			apiProvider: "cline",
			clineApiKey: "test-key",
			taskId: "model-test",
			openRouterModelId: "gpt-4",
			openRouterModelInfo: {
				maxTokens: 8192,
				contextWindow: 16384,
				supportsImages: true,
				supportsPromptCache: false,
				inputPrice: 0.01,
				outputPrice: 0.03,
			},
		}

		const handler = buildApiHandler(config)
		const model = handler.getModel()

		expect(model.id).toBe("gpt-4")
		expect(model.info.maxTokens).toBe(8192)
		expect(model.info.contextWindow).toBe(16384)
	})

	it("should handle grok-3 model replacement", () => {
		const config: ApiConfiguration = {
			apiProvider: "cline",
			clineApiKey: "test-key",
			taskId: "grok-test",
			openRouterModelId: "x-ai/grok-3",
			openRouterModelInfo: {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsImages: true,
				supportsPromptCache: false,
				inputPrice: 0.001,
				outputPrice: 0.002,
			},
		}

		const handler = buildApiHandler(config)
		const model = handler.getModel()

		// Should replace grok-3 with grok-3-beta
		expect(model.id).toBe("x-ai/grok-3-beta")
	})
})
