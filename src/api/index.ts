import { Anthropic } from "@anthropic-ai/sdk"
import { ApiConfiguration, ModelInfo } from "../shared/api"
import { AnthropicHandler } from "./providers/anthropic"
import { AwsBedrockHandler } from "./providers/bedrock"
import { OpenRouterHandler } from "./providers/openrouter"
import { VertexHandler } from "./providers/vertex"
import { OpenAiHandler } from "./providers/openai"
import { OllamaHandler } from "./providers/ollama"
import { LmStudioHandler } from "./providers/lmstudio"
import { GeminiHandler } from "./providers/gemini"
import { OpenAiNativeHandler } from "./providers/openai-native"
import { ApiStream, ApiStreamUsageChunk } from "./transform/stream"
import { DeepSeekHandler } from "./providers/deepseek"
import { RequestyHandler } from "./providers/requesty"
import { TogetherHandler } from "./providers/together"
import { NebiusHandler } from "./providers/nebius"
import { QwenHandler } from "./providers/qwen"
import { MistralHandler } from "./providers/mistral"
import { DoubaoHandler } from "./providers/doubao"
import { VsCodeLmHandler } from "./providers/vscode-lm"
import { ClineHandler } from "./providers/cline"
import { LiteLlmHandler } from "./providers/litellm"
import { FireworksHandler } from "./providers/fireworks"
import { AskSageHandler } from "./providers/asksage"
import { XAIHandler } from "./providers/xai"
import { SambanovaHandler } from "./providers/sambanova"
import { CerebrasHandler } from "./providers/cerebras"
import { SapAiCoreHandler } from "./providers/sapaicore"
import { caretLogger } from "../../caret-src/utils/caret-logger"

export interface ApiHandler {
	createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream
	getModel(): { id: string; info: ModelInfo }
	getApiStreamUsage?(): Promise<ApiStreamUsageChunk | undefined>
}

export interface SingleCompletionHandler {
	completePrompt(prompt: string): Promise<string>
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
	const { apiProvider, ...options } = configuration

	// CARET MODIFICATION: Debug logging to track API provider selection and parameters
	caretLogger.debug("==================== API HANDLER BUILD ====================", "API")
	caretLogger.debug(`Selected API Provider: "${apiProvider}"`, "API")
	caretLogger.debug(`Full Configuration: ${JSON.stringify(configuration, null, 2)}`, "API")
	caretLogger.debug(`Provider-specific options: ${JSON.stringify(options, null, 2)}`, "API")

	// Log specific API keys to see what's available
	caretLogger.debug("API Keys Status:", "API")
	caretLogger.debug(`  - anthropic apiKey: ${options.apiKey ? "SET" : "NOT SET"}`, "API")
	caretLogger.debug(`  - openRouter apiKey: ${options.openRouterApiKey ? "SET" : "NOT SET"}`, "API")
	caretLogger.debug(`  - openAI apiKey: ${options.openAiApiKey ? "SET" : "NOT SET"}`, "API")
	caretLogger.debug(`  - gemini apiKey: ${options.geminiApiKey ? "SET" : "NOT SET"}`, "API")
	caretLogger.debug(`  - cline apiKey: ${options.clineApiKey ? "SET" : "NOT SET"}`, "API")
	caretLogger.debug("===========================================================", "API")

	switch (apiProvider) {
		case "anthropic":
			caretLogger.debug("Creating AnthropicHandler", "API")
			return new AnthropicHandler(options)
		case "openrouter":
			caretLogger.debug(`Creating OpenRouterHandler with key: ${options.openRouterApiKey ? "SET" : "NOT SET"}`, "API")
			return new OpenRouterHandler(options)
		case "bedrock":
			caretLogger.debug("Creating AwsBedrockHandler", "API")
			return new AwsBedrockHandler(options)
		case "vertex":
			caretLogger.debug("Creating VertexHandler", "API")
			return new VertexHandler(options)
		case "openai":
			caretLogger.debug("Creating OpenAiHandler", "API")
			return new OpenAiHandler(options)
		case "ollama":
			caretLogger.debug("Creating OllamaHandler", "API")
			return new OllamaHandler(options)
		case "lmstudio":
			caretLogger.debug("Creating LmStudioHandler", "API")
			return new LmStudioHandler(options)
		case "gemini":
			caretLogger.debug("Creating GeminiHandler", "API")
			return new GeminiHandler(options)
		case "openai-native":
			caretLogger.debug("Creating OpenAiNativeHandler", "API")
			return new OpenAiNativeHandler(options)
		case "deepseek":
			caretLogger.debug("Creating DeepSeekHandler", "API")
			return new DeepSeekHandler(options)
		case "requesty":
			caretLogger.debug("Creating RequestyHandler", "API")
			return new RequestyHandler(options)
		case "fireworks":
			caretLogger.debug("Creating FireworksHandler", "API")
			return new FireworksHandler(options)
		case "together":
			caretLogger.debug("Creating TogetherHandler", "API")
			return new TogetherHandler(options)
		case "qwen":
			caretLogger.debug("Creating QwenHandler", "API")
			return new QwenHandler(options)
		case "doubao":
			caretLogger.debug("Creating DoubaoHandler", "API")
			return new DoubaoHandler(options)
		case "mistral":
			caretLogger.debug("Creating MistralHandler", "API")
			return new MistralHandler(options)
		case "vscode-lm":
			caretLogger.debug("Creating VsCodeLmHandler", "API")
			return new VsCodeLmHandler(options)
		case "cline":
			caretLogger.debug("Creating ClineHandler", "API")
			return new ClineHandler(options)
		case "litellm":
			caretLogger.debug("Creating LiteLlmHandler", "API")
			return new LiteLlmHandler(options)
		case "nebius":
			caretLogger.debug("Creating NebiusHandler", "API")
			return new NebiusHandler(options)
		case "asksage":
			caretLogger.debug("Creating AskSageHandler", "API")
			return new AskSageHandler(options)
		case "xai":
			caretLogger.debug("Creating XAIHandler", "API")
			return new XAIHandler(options)
		case "sambanova":
			caretLogger.debug("Creating SambanovaHandler", "API")
			return new SambanovaHandler(options)
		case "cerebras":
			caretLogger.debug("Creating CerebrasHandler", "API")
			return new CerebrasHandler(options)
		case "sapaicore":
			caretLogger.debug("Creating SapAiCoreHandler", "API")
			return new SapAiCoreHandler(options)
		default:
			caretLogger.warn(`⚠️  Unknown provider "${apiProvider}", falling back to AnthropicHandler`, "API")
			return new AnthropicHandler(options)
	}
}
