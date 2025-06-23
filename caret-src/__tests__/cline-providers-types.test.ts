import { describe, it, expect, vi, beforeEach } from "vitest"

// Import types from Cline original code
import type {
	LanguageModelChatSelector,
	OpenRouterErrorResponse,
	OpenRouterProviderErrorMetadata,
	OpenRouterModerationErrorMetadata,
} from "../../src/api/providers/types"

describe("Cline providers/types.ts - Usage Testing", () => {
	describe("LanguageModelChatSelector interface", () => {
		it("should accept valid selector with all optional fields", () => {
			const selector: LanguageModelChatSelector = {
				vendor: "microsoft",
				family: "gpt",
				version: "4",
				id: "gpt-4-turbo",
			}

			expect(selector.vendor).toBe("microsoft")
			expect(selector.family).toBe("gpt")
			expect(selector.version).toBe("4")
			expect(selector.id).toBe("gpt-4-turbo")
		})

		it("should accept selector with only vendor", () => {
			const selector: LanguageModelChatSelector = {
				vendor: "anthropic",
			}

			expect(selector.vendor).toBe("anthropic")
			expect(selector.family).toBeUndefined()
			expect(selector.version).toBeUndefined()
			expect(selector.id).toBeUndefined()
		})

		it("should accept selector with only id", () => {
			const selector: LanguageModelChatSelector = {
				id: "claude-3-sonnet",
			}

			expect(selector.id).toBe("claude-3-sonnet")
			expect(selector.vendor).toBeUndefined()
			expect(selector.family).toBeUndefined()
			expect(selector.version).toBeUndefined()
		})

		it("should accept empty selector object", () => {
			const selector: LanguageModelChatSelector = {}

			expect(selector.vendor).toBeUndefined()
			expect(selector.family).toBeUndefined()
			expect(selector.version).toBeUndefined()
			expect(selector.id).toBeUndefined()
		})

		it("should be used in ApiConfiguration type from shared/api.ts", () => {
			// Test that LanguageModelChatSelector is properly typed in API configuration
			const mockApiConfig = {
				vsCodeLmModelSelector: {
					vendor: "openai",
					family: "gpt",
					version: "4",
					id: "gpt-4",
				} as LanguageModelChatSelector,
			}

			expect(mockApiConfig.vsCodeLmModelSelector?.vendor).toBe("openai")
			expect(mockApiConfig.vsCodeLmModelSelector?.family).toBe("gpt")
		})
	})

	describe("OpenRouterErrorResponse type", () => {
		it("should accept valid error response with basic error", () => {
			const errorResponse: OpenRouterErrorResponse = {
				error: {
					message: "Invalid API key",
					code: 401,
				},
			}

			expect(errorResponse.error.message).toBe("Invalid API key")
			expect(errorResponse.error.code).toBe(401)
			expect(errorResponse.error.metadata).toBeUndefined()
		})

		it("should accept error response with provider metadata", () => {
			const providerMetadata: OpenRouterProviderErrorMetadata = {
				provider_name: "anthropic",
				raw: { error: "Rate limit exceeded" },
			}

			const errorResponse: OpenRouterErrorResponse = {
				error: {
					message: "Provider error",
					code: 429,
					metadata: providerMetadata,
				},
			}

			expect(errorResponse.error.metadata).toBeDefined()
			expect((errorResponse.error.metadata as OpenRouterProviderErrorMetadata).provider_name).toBe("anthropic")
		})

		it("should accept error response with moderation metadata", () => {
			const moderationMetadata: OpenRouterModerationErrorMetadata = {
				reasons: ["inappropriate_content", "harmful_language"],
				flagged_input: "This is inappropriate content that was flagged...",
				provider_name: "openai",
				model_slug: "gpt-4",
			}

			const errorResponse: OpenRouterErrorResponse = {
				error: {
					message: "Content moderation violation",
					code: 400,
					metadata: moderationMetadata,
				},
			}

			expect(errorResponse.error.metadata).toBeDefined()
			const metadata = errorResponse.error.metadata as OpenRouterModerationErrorMetadata
			expect(metadata.reasons).toEqual(["inappropriate_content", "harmful_language"])
			expect(metadata.flagged_input).toBe("This is inappropriate content that was flagged...")
			expect(metadata.provider_name).toBe("openai")
			expect(metadata.model_slug).toBe("gpt-4")
		})

		it("should accept error response with generic metadata", () => {
			const errorResponse: OpenRouterErrorResponse = {
				error: {
					message: "Unknown error",
					code: 500,
					metadata: { custom_field: "custom_value", timestamp: Date.now() },
				},
			}

			expect(errorResponse.error.metadata).toBeDefined()
			expect(typeof errorResponse.error.metadata).toBe("object")
		})
	})

	describe("Type usage in actual Cline code", () => {
		describe("OpenRouter provider usage", () => {
			it("should properly type error handling in openrouter.ts pattern", () => {
				// Simulate the usage pattern from src/api/providers/openrouter.ts
				const mockChunk = {
					error: {
						message: "Model not found",
						code: 404,
						metadata: {
							provider_name: "anthropic",
							raw: { error: "Model not available" },
						},
					},
				}

				// Test the type casting pattern used in actual code
				const error = mockChunk.error as OpenRouterErrorResponse["error"]

				expect(error.message).toBe("Model not found")
				expect(error.code).toBe(404)
				expect(error.metadata).toBeDefined()
			})

			it("should properly type error handling in cline.ts pattern", () => {
				// Simulate the usage pattern from src/api/providers/cline.ts
				const mockChunk = {
					error: {
						message: "Rate limit exceeded",
						code: 429,
						metadata: {
							provider_name: "openai",
							raw: { retry_after: 60 },
						},
					},
				}

				// Test the type casting pattern used in actual code
				const error = mockChunk.error as OpenRouterErrorResponse["error"]

				expect(error.message).toBe("Rate limit exceeded")
				expect(error.code).toBe(429)
				expect(error.metadata).toBeDefined()
			})
		})

		describe("VSCode LM selector usage", () => {
			it("should support stringifyVsCodeLmModelSelector pattern", () => {
				// Test the pattern used in src/shared/vsCodeSelectorUtils.ts
				const selector: LanguageModelChatSelector = {
					vendor: "microsoft",
					family: "phi",
					version: "3",
					id: "phi-3-mini",
				}

				// Simulate stringification logic
				const parts = [selector.vendor, selector.family, selector.version, selector.id].filter(Boolean)

				const stringified = parts.join("/")
				expect(stringified).toBe("microsoft/phi/3/phi-3-mini")
			})

			it("should handle partial selector stringification", () => {
				const selector: LanguageModelChatSelector = {
					vendor: "anthropic",
					id: "claude-3-sonnet",
				}

				const parts = [selector.vendor, selector.family, selector.version, selector.id].filter(Boolean)

				const stringified = parts.join("/")
				expect(stringified).toBe("anthropic/claude-3-sonnet")
			})
		})
	})

	describe("Error metadata types", () => {
		it("should properly type OpenRouterProviderErrorMetadata", () => {
			const metadata: OpenRouterProviderErrorMetadata = {
				provider_name: "test-provider",
				raw: {
					error_code: "INVALID_REQUEST",
					details: "Missing required parameter",
				},
			}

			expect(metadata.provider_name).toBe("test-provider")
			expect(typeof metadata.raw).toBe("object")
		})

		it("should properly type OpenRouterModerationErrorMetadata", () => {
			const metadata: OpenRouterModerationErrorMetadata = {
				reasons: ["violence", "hate_speech"],
				flagged_input: "This content was flagged for containing inappropriate material that violates our guidelines...",
				provider_name: "content-moderator",
				model_slug: "moderation-v1",
			}

			expect(Array.isArray(metadata.reasons)).toBe(true)
			expect(metadata.reasons).toContain("violence")
			expect(metadata.reasons).toContain("hate_speech")
			expect(metadata.flagged_input.length).toBeGreaterThan(0)
			expect(metadata.provider_name).toBe("content-moderator")
			expect(metadata.model_slug).toBe("moderation-v1")
		})

		it("should handle long flagged input truncation scenario", () => {
			const longInput = "A".repeat(200) // 200 characters
			const truncatedInput =
				longInput.length > 100
					? longInput.substring(0, 47) + "..." + longInput.substring(longInput.length - 47)
					: longInput

			const metadata: OpenRouterModerationErrorMetadata = {
				reasons: ["inappropriate_length"],
				flagged_input: truncatedInput,
				provider_name: "length-moderator",
				model_slug: "truncation-v1",
			}

			expect(metadata.flagged_input.length).toBeLessThanOrEqual(100)
			expect(metadata.flagged_input).toContain("...")
		})
	})
})
