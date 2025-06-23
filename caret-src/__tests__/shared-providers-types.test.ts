import { describe, it, expect } from "vitest"
import type { ProviderConfig } from "../shared/providers/types"

describe("caret-src/shared/providers/types.ts", () => {
	describe("ProviderConfig interface", () => {
		it("should accept valid provider config with all required fields", () => {
			const validConfig: ProviderConfig = {
				id: "test-provider",
				name: "Test Provider",
				defaultModel: "test-model",
				fields: {},
			}

			expect(validConfig.id).toBe("test-provider")
			expect(validConfig.name).toBe("Test Provider")
			expect(validConfig.defaultModel).toBe("test-model")
			expect(validConfig.fields).toEqual({})
		})

		it("should accept config with apiKey field", () => {
			const configWithApiKey: ProviderConfig = {
				id: "api-provider",
				name: "API Provider",
				defaultModel: "api-model",
				fields: {
					apiKey: {
						label: "API Key",
						placeholder: "Enter your API key",
						helpText: "Get your API key from the provider",
						helpLink: "https://example.com/api-key",
					},
				},
			}

			expect(configWithApiKey.fields.apiKey).toBeDefined()
			expect(configWithApiKey.fields.apiKey?.label).toBe("API Key")
			expect(configWithApiKey.fields.apiKey?.placeholder).toBe("Enter your API key")
			expect(configWithApiKey.fields.apiKey?.helpText).toBe("Get your API key from the provider")
			expect(configWithApiKey.fields.apiKey?.helpLink).toBe("https://example.com/api-key")
		})

		it("should accept config with baseUrl field", () => {
			const configWithBaseUrl: ProviderConfig = {
				id: "url-provider",
				name: "URL Provider",
				defaultModel: "url-model",
				fields: {
					baseUrl: {
						label: "Base URL",
						placeholder: "https://api.example.com",
						defaultUrl: "https://api.example.com",
						helpText: "Enter the base URL for the API",
					},
				},
			}

			expect(configWithBaseUrl.fields.baseUrl).toBeDefined()
			expect(configWithBaseUrl.fields.baseUrl?.label).toBe("Base URL")
			expect(configWithBaseUrl.fields.baseUrl?.defaultUrl).toBe("https://api.example.com")
		})

		it("should accept config with secretKey field", () => {
			const configWithSecretKey: ProviderConfig = {
				id: "secret-provider",
				name: "Secret Provider",
				defaultModel: "secret-model",
				fields: {
					secretKey: {
						label: "Secret Key",
						placeholder: "Enter your secret key",
						helpText: "Keep this secret key secure",
					},
				},
			}

			expect(configWithSecretKey.fields.secretKey).toBeDefined()
			expect(configWithSecretKey.fields.secretKey?.label).toBe("Secret Key")
		})

		it("should accept config with region field", () => {
			const configWithRegion: ProviderConfig = {
				id: "region-provider",
				name: "Region Provider",
				defaultModel: "region-model",
				fields: {
					region: {
						label: "Region",
						placeholder: "us-east-1",
						helpText: "Select your region",
						helpLink: "https://example.com/regions",
					},
				},
			}

			expect(configWithRegion.fields.region).toBeDefined()
			expect(configWithRegion.fields.region?.label).toBe("Region")
		})

		it("should accept config with projectId field", () => {
			const configWithProjectId: ProviderConfig = {
				id: "project-provider",
				name: "Project Provider",
				defaultModel: "project-model",
				fields: {
					projectId: {
						label: "Project ID",
						placeholder: "your-project-id",
						helpText: "Enter your project ID",
					},
				},
			}

			expect(configWithProjectId.fields.projectId).toBeDefined()
			expect(configWithProjectId.fields.projectId?.label).toBe("Project ID")
		})

		it("should accept config with endpoint field", () => {
			const configWithEndpoint: ProviderConfig = {
				id: "endpoint-provider",
				name: "Endpoint Provider",
				defaultModel: "endpoint-model",
				fields: {
					endpoint: {
						label: "Endpoint",
						placeholder: "https://api.example.com/v1",
						defaultUrl: "https://api.example.com/v1",
						helpText: "Enter the API endpoint",
					},
				},
			}

			expect(configWithEndpoint.fields.endpoint).toBeDefined()
			expect(configWithEndpoint.fields.endpoint?.label).toBe("Endpoint")
		})

		it("should accept config with customUrl field", () => {
			const configWithCustomUrl: ProviderConfig = {
				id: "custom-provider",
				name: "Custom Provider",
				defaultModel: "custom-model",
				fields: {
					customUrl: {
						label: "Custom URL",
						placeholder: "https://custom.example.com",
						helpText: "Enter your custom URL",
						helpLink: "https://example.com/custom-url",
					},
				},
			}

			expect(configWithCustomUrl.fields.customUrl).toBeDefined()
			expect(configWithCustomUrl.fields.customUrl?.label).toBe("Custom URL")
		})

		it("should accept config with multiple fields", () => {
			const configWithMultipleFields: ProviderConfig = {
				id: "multi-provider",
				name: "Multi Provider",
				defaultModel: "multi-model",
				fields: {
					apiKey: {
						label: "API Key",
						placeholder: "Enter API key",
						helpText: "Your API key",
					},
					baseUrl: {
						label: "Base URL",
						placeholder: "https://api.example.com",
						defaultUrl: "https://api.example.com",
					},
					region: {
						label: "Region",
						placeholder: "us-east-1",
						helpText: "Select region",
					},
				},
			}

			expect(configWithMultipleFields.fields.apiKey).toBeDefined()
			expect(configWithMultipleFields.fields.baseUrl).toBeDefined()
			expect(configWithMultipleFields.fields.region).toBeDefined()
		})

		it("should accept config with validation rules", () => {
			const configWithValidation: ProviderConfig = {
				id: "validated-provider",
				name: "Validated Provider",
				defaultModel: "validated-model",
				fields: {},
				validation: {
					apiKey: /^[a-zA-Z0-9]+$/,
					baseUrl: /^https?:\/\/.+/,
					region: ["us-east-1", "us-west-2", "eu-west-1"],
				},
			}

			expect(configWithValidation.validation).toBeDefined()
			expect(configWithValidation.validation?.apiKey).toBeInstanceOf(RegExp)
			expect(configWithValidation.validation?.baseUrl).toBeInstanceOf(RegExp)
			expect(Array.isArray(configWithValidation.validation?.region)).toBe(true)
		})

		it("should accept config with features", () => {
			const configWithFeatures: ProviderConfig = {
				id: "feature-provider",
				name: "Feature Provider",
				defaultModel: "feature-model",
				fields: {},
				features: {
					supportsPromptCache: true,
					supportsImages: false,
					supportsComputerUse: true,
				},
			}

			expect(configWithFeatures.features).toBeDefined()
			expect(configWithFeatures.features?.supportsPromptCache).toBe(true)
			expect(configWithFeatures.features?.supportsImages).toBe(false)
			expect(configWithFeatures.features?.supportsComputerUse).toBe(true)
		})

		it("should accept config with all optional properties", () => {
			const fullConfig: ProviderConfig = {
				id: "full-provider",
				name: "Full Provider",
				defaultModel: "full-model",
				fields: {
					apiKey: {
						label: "API Key",
						placeholder: "Enter API key",
						helpText: "Your API key",
						helpLink: "https://example.com/api",
					},
					baseUrl: {
						label: "Base URL",
						placeholder: "https://api.example.com",
						defaultUrl: "https://api.example.com",
						helpText: "Base URL for API",
					},
				},
				validation: {
					apiKey: /^[a-zA-Z0-9]+$/,
					baseUrl: /^https?:\/\/.+/,
					region: ["us-east-1", "us-west-2"],
				},
				features: {
					supportsPromptCache: true,
					supportsImages: true,
					supportsComputerUse: false,
				},
			}

			expect(fullConfig.id).toBe("full-provider")
			expect(fullConfig.name).toBe("Full Provider")
			expect(fullConfig.defaultModel).toBe("full-model")
			expect(fullConfig.fields).toBeDefined()
			expect(fullConfig.validation).toBeDefined()
			expect(fullConfig.features).toBeDefined()
		})
	})

	describe("type safety", () => {
		it("should enforce required properties", () => {
			// This test verifies that TypeScript enforces required properties
			// If this compiles, the type definition is working correctly
			const config: ProviderConfig = {
				id: "test",
				name: "Test",
				defaultModel: "test-model",
				fields: {},
			}

			expect(config).toBeDefined()
		})

		it("should allow optional properties to be undefined", () => {
			const minimalConfig: ProviderConfig = {
				id: "minimal",
				name: "Minimal",
				defaultModel: "minimal-model",
				fields: {},
				// validation and features are optional
			}

			expect(minimalConfig.validation).toBeUndefined()
			expect(minimalConfig.features).toBeUndefined()
		})

		it("should handle empty fields object", () => {
			const emptyFieldsConfig: ProviderConfig = {
				id: "empty-fields",
				name: "Empty Fields",
				defaultModel: "empty-model",
				fields: {},
			}

			expect(emptyFieldsConfig.fields).toEqual({})
			expect(Object.keys(emptyFieldsConfig.fields)).toHaveLength(0)
		})
	})
})
