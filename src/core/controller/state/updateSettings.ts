import { Controller } from ".."
import { Empty } from "../../../shared/proto/common"
import { UpdateSettingsRequest } from "../../../shared/proto/state"
import { updateApiConfiguration } from "../../storage/state"
import { buildApiHandler } from "../../../api"
import { convertProtoApiConfigurationToApiConfiguration } from "../../../shared/proto-conversions/state/settings-conversion"
import { convertProtoChatSettingsToChatSettings } from "../../../shared/proto-conversions/state/chat-settings-conversion"
import { TelemetrySetting } from "@/shared/TelemetrySetting"
// CARET MODIFICATION: Mission 2 - 백엔드 로깅 시스템 사용
import { caretLogger } from "../../../../caret-src/utils/caret-logger"

/**
 * Updates multiple extension settings in a single request
 * @param controller The controller instance
 * @param request The request containing the settings to update
 * @returns An empty response
 */
export async function updateSettings(controller: Controller, request: UpdateSettingsRequest): Promise<Empty> {
	try {
		// CARET MODIFICATION: Mission 2 - 백엔드 설정 업데이트 로깅
		caretLogger.info("📥 [BACKEND-RECEIVE] updateSettings called", "STATE")
		// Update API configuration
		if (request.apiConfiguration) {
			const apiConfiguration = convertProtoApiConfigurationToApiConfiguration(request.apiConfiguration)
			await updateApiConfiguration(controller.context, apiConfiguration)

			if (controller.task) {
				controller.task.api = buildApiHandler(apiConfiguration)
			}
		}

		// Update telemetry setting
		if (request.telemetrySetting) {
			await controller.updateTelemetrySetting(request.telemetrySetting as TelemetrySetting)
		}

		// CARET MODIFICATION: Chatbot/Agent 용어 통일 - planActSeparateModelsSetting → chatbotAgentSeparateModelsSetting
		if (request.chatbotAgentSeparateModelsSetting !== undefined) {
			await controller.context.globalState.update("planActSeparateModelsSetting", request.chatbotAgentSeparateModelsSetting)
		}

		// Update checkpoints setting
		if (request.enableCheckpointsSetting !== undefined) {
			await controller.context.globalState.update("enableCheckpointsSetting", request.enableCheckpointsSetting)
		}

		// Update MCP marketplace setting
		if (request.mcpMarketplaceEnabled !== undefined) {
			await controller.context.globalState.update("mcpMarketplaceEnabled", request.mcpMarketplaceEnabled)
		}

		// Update MCP responses collapsed setting
		if (request.mcpResponsesCollapsed !== undefined) {
			await controller.context.globalState.update("mcpResponsesCollapsed", request.mcpResponsesCollapsed)
		}

		// Update MCP responses collapsed setting
		if (request.mcpRichDisplayEnabled !== undefined) {
			await controller.context.globalState.update("mcpRichDisplayEnabled", request.mcpRichDisplayEnabled)
		}

		// CARET MODIFICATION: Update uiLanguage separately in globalState (app-wide setting)
		if (request.uiLanguage !== undefined) {
			await controller.context.globalState.update("uiLanguage", request.uiLanguage)
		}

		// Update chat settings
		// CARET MODIFICATION: Use workspaceState instead of globalState for chatSettings consistency
		if (request.chatSettings) {
			const chatSettings = convertProtoChatSettingsToChatSettings(request.chatSettings)
			// CARET MODIFICATION: Remove uiLanguage from chatSettings before saving (stored separately in globalState)
			const { uiLanguage, ...chatSettingsWithoutUILanguage } = chatSettings

			// CARET MODIFICATION: Mission 2 - 저장 로깅
			caretLogger.info(`💾 [BACKEND-SAVE] Saving chatSettings: mode=${chatSettingsWithoutUILanguage.mode}`, "STATE")

			await controller.context.workspaceState.update("chatSettings", chatSettingsWithoutUILanguage)
			if (controller.task) {
				controller.task.chatSettings = chatSettingsWithoutUILanguage
				caretLogger.info("🔄 [BACKEND-SYNC] Updated controller.task.chatSettings", "STATE")
			}
		}

		// Update terminal timeout setting
		if (request.shellIntegrationTimeout !== undefined) {
			await controller.context.globalState.update("shellIntegrationTimeout", Number(request.shellIntegrationTimeout))
		}

		// Update terminal reuse setting
		if (request.terminalReuseEnabled !== undefined) {
			await controller.context.globalState.update("terminalReuseEnabled", request.terminalReuseEnabled)
		}

		// Update terminal output line limit
		if (request.terminalOutputLineLimit !== undefined) {
			await controller.context.globalState.update("terminalOutputLineLimit", Number(request.terminalOutputLineLimit))
		}

		// CARET MODIFICATION: Mission 2 GREEN - 확장된 조건부 브로드캐스트 로직
		// Skip broadcast for single-field updates to prevent circular messages
		const isUILanguageOnlyUpdate =
			request.uiLanguage !== undefined &&
			!request.apiConfiguration &&
			!request.telemetrySetting &&
			!request.chatSettings &&
			request.chatbotAgentSeparateModelsSetting === undefined &&
			request.enableCheckpointsSetting === undefined &&
			request.mcpMarketplaceEnabled === undefined &&
			request.mcpResponsesCollapsed === undefined &&
			request.mcpRichDisplayEnabled === undefined &&
			request.shellIntegrationTimeout === undefined &&
			request.terminalReuseEnabled === undefined &&
			request.terminalOutputLineLimit === undefined

		// CARET MODIFICATION: Mission 2 - chatSettings 단일 업데이트도 브로드캐스트 스킵
		const isChatSettingsOnlyUpdate =
			request.chatSettings &&
			request.uiLanguage === undefined &&
			!request.apiConfiguration &&
			!request.telemetrySetting &&
			request.chatbotAgentSeparateModelsSetting === undefined &&
			request.enableCheckpointsSetting === undefined &&
			request.mcpMarketplaceEnabled === undefined &&
			request.mcpResponsesCollapsed === undefined &&
			request.mcpRichDisplayEnabled === undefined &&
			request.shellIntegrationTimeout === undefined &&
			request.terminalReuseEnabled === undefined &&
			request.terminalOutputLineLimit === undefined

		const shouldSkipBroadcast = isUILanguageOnlyUpdate || isChatSettingsOnlyUpdate

		// CARET MODIFICATION: Mission 2 - 브로드캐스트 결정 로깅
		caretLogger.info(`📡 [BACKEND-BROADCAST] shouldSkipBroadcast=${shouldSkipBroadcast}`, "STATE")

		if (!shouldSkipBroadcast) {
			caretLogger.info("📤 [BACKEND-BROADCAST] Sending state to webview", "STATE")
			// Post updated state to webview (only for multi-field updates)
			await controller.postStateToWebview()
			caretLogger.info("✅ [BACKEND-BROADCAST] State sent to webview successfully", "STATE")
		} else {
			const reason = isUILanguageOnlyUpdate ? "uiLanguage-only" : "chatSettings-only"
			caretLogger.info(`⏸️ [BACKEND-BROADCAST] SKIPPED postStateToWebview() for ${reason} update`, "STATE")
		}

		return Empty.create()
	} catch (error) {
		console.error("Failed to update settings:", error)
		throw error
	}
}
