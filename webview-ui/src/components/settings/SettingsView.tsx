import { UnsavedChangesDialog } from "@/components/common/AlertDialog"
import HeroTooltip from "@/components/common/HeroTooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StateServiceClient } from "@/services/grpc-client"
import { cn } from "@/utils/cn"
import { validateApiConfiguration, validateModelId } from "@/utils/validate"
import { vscode } from "@/utils/vscode"
import { ExtensionMessage } from "@shared/ExtensionMessage"
import { EmptyRequest, StringRequest } from "@shared/proto/common"
// CARET MODIFICATION: Chatbot/Agent 용어 통일 - PlanActMode 제거
import { ChatbotAgentMode, ResetStateRequest, ToggleChatbotAgentModeRequest, UpdateSettingsRequest } from "@shared/proto/state"
import { VSCodeButton, VSCodeCheckbox, VSCodeLink, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react"
import { CheckCheck, FlaskConical, Info, LucideIcon, Settings, SquareMousePointer, SquareTerminal, Webhook } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useEvent } from "react-use"
import { Tab, TabContent, TabHeader, TabList, TabTrigger } from "../common/Tab"
import { TabButton } from "../mcp/configuration/McpConfigurationView"
import ApiOptions from "./ApiOptions"
import BrowserSettingsSection from "./BrowserSettingsSection"
import FeatureSettingsSection from "./FeatureSettingsSection"
import PreferredLanguageSetting from "./PreferredLanguageSetting" // Added import
import CaretUILanguageSetting from "../../caret/components/CaretUILanguageSetting" // CARET MODIFICATION: Moved to Caret directory
import Section from "./Section"
import SectionHeader from "./SectionHeader"
import TerminalSettingsSection from "./TerminalSettingsSection"
import { convertApiConfigurationToProtoApiConfiguration } from "@shared/proto-conversions/state/settings-conversion"
import { convertChatSettingsToProtoChatSettings } from "@shared/proto-conversions/state/chat-settings-conversion"
//import { caretWebviewLogger } from "@/caret/utils/webview-logger" // CARET MODIFICATION: 주석 처리
import { caretWebviewLogger } from "@/caret/utils/webview-logger"
import { t } from "@/caret/utils/i18n"
import { useCurrentLanguage } from "@/caret/hooks/useCurrentLanguage"
const { IS_DEV } = process.env

// Styles for the tab system
const settingsTabsContainer = "flex flex-1 overflow-hidden [&.narrow_.tab-label]:hidden"
const settingsTabList =
	"w-48 data-[compact=true]:w-12 flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--vscode-sideBar-background)]"
const settingsTabTrigger =
	"whitespace-nowrap overflow-hidden min-w-0 h-12 px-4 py-3 box-border flex items-center border-l-2 border-transparent text-[var(--vscode-foreground)] opacity-70 bg-transparent hover:bg-[var(--vscode-list-hoverBackground)] data-[compact=true]:w-12 data-[compact=true]:p-4 cursor-pointer"
const settingsTabTriggerActive =
	"opacity-100 border-l-2 border-l-[var(--vscode-focusBorder)] border-t-0 border-r-0 border-b-0 bg-[var(--vscode-list-activeSelectionBackground)]"

// Tab definitions
interface SettingsTab {
	id: string
	name: string
	tooltipText: string
	headerText: string
	icon: LucideIcon
}

export const SETTINGS_TABS: SettingsTab[] = [
	{
		id: "api-config",
		name: "API Configuration",
		tooltipText: "API Configuration",
		headerText: "API Configuration",
		icon: Webhook,
	},
	{
		id: "general",
		name: "General",
		tooltipText: "General Settings",
		headerText: "General Settings",
		icon: Settings,
	},
	{
		id: "features",
		name: "Features",
		tooltipText: "Feature Settings",
		headerText: "Feature Settings",
		icon: CheckCheck,
	},
	{
		id: "browser",
		name: "Browser",
		tooltipText: "Browser Settings",
		headerText: "Browser Settings",
		icon: SquareMousePointer,
	},
	{
		id: "terminal",
		name: "Terminal",
		tooltipText: "Terminal Settings",
		headerText: "Terminal Settings",
		icon: SquareTerminal,
	},
	// Only show in dev mode
	...(IS_DEV
		? [
				{
					id: "debug",
					name: "Debug",
					tooltipText: "Debug Tools",
					headerText: "Debug",
					icon: FlaskConical,
				},
			]
		: []),
	{
		id: "about",
		name: "About",
		tooltipText: "About Cline",
		headerText: "About",
		icon: Info,
	},
]

type SettingsViewProps = {
	onDone: () => void
	targetSection?: string
}

const SettingsView = ({ onDone, targetSection }: SettingsViewProps) => {
	// CARET MODIFICATION: SettingsView 렌더링 확인
	// caretWebviewLogger.debug("🎯 SettingsView 컴포넌트 렌더링!"); // CARET MODIFICATION: 주석 처리
	//caretWebviewLogger.debug("🎯 SettingsView props:", { onDone, targetSection })
	// Track if there are unsaved changes
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	// State for the unsaved changes dialog
	const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
	// Store the action to perform after confirmation
	const pendingAction = useRef<() => void>()
	const {
		apiConfiguration,
		version,
		openRouterModels,
		telemetrySetting,
		setTelemetrySetting,
		chatSettings,
		setChatSettings,
		planActSeparateModelsSetting,
		setPlanActSeparateModelsSetting,
		enableCheckpointsSetting,
		setEnableCheckpointsSetting,
		mcpMarketplaceEnabled,
		setMcpMarketplaceEnabled,
		mcpRichDisplayEnabled,
		setMcpRichDisplayEnabled,
		shellIntegrationTimeout,
		setShellIntegrationTimeout,
		terminalOutputLineLimit,
		setTerminalOutputLineLimit,
		terminalReuseEnabled,
		setTerminalReuseEnabled,
		defaultTerminalProfile,
		setDefaultTerminalProfile,
		mcpResponsesCollapsed,
		setMcpResponsesCollapsed,
		setApiConfiguration,
		setModeSystem, // CARET MODIFICATION: Add modeSystem setter
	} = useExtensionState()

	// Store the original state to detect changes
	const originalState = useRef({
		apiConfiguration,
		telemetrySetting,
		planActSeparateModelsSetting,
		enableCheckpointsSetting,
		mcpMarketplaceEnabled,
		mcpRichDisplayEnabled,
		mcpResponsesCollapsed,
		chatSettings,
		shellIntegrationTimeout,
		terminalReuseEnabled,
		terminalOutputLineLimit,
		defaultTerminalProfile,
	})
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [modelIdErrorMessage, setModelIdErrorMessage] = useState<string | undefined>(undefined)
	const handleSubmit = async (withoutDone: boolean = false) => {
		const apiValidationResult = validateApiConfiguration(apiConfiguration)
		const modelIdValidationResult = validateModelId(apiConfiguration, openRouterModels)

		// setApiErrorMessage(apiValidationResult)
		// setModelIdErrorMessage(modelIdValidationResult)

		let apiConfigurationToSubmit = apiConfiguration
		if (!apiValidationResult && !modelIdValidationResult) {
			// vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
			// vscode.postMessage({
			// 	type: "telemetrySetting",
			// 	text: telemetrySetting,
			// })
			// console.log("handleSubmit", withoutDone)
			// vscode.postMessage({
			// 	type: "separateModeSetting",
			// 	text: separateModeSetting,
			// })
		} else {
			// if the api configuration is invalid, we don't save it
			apiConfigurationToSubmit = undefined
		}

		try {
			// CARET MODIFICATION: console.log to logger
			// caretWebviewLogger.debug("[DEBUG] Saving settings with chatSettings:", chatSettings); // CARET MODIFICATION: 주석 처리
			await StateServiceClient.updateSettings(
				UpdateSettingsRequest.create({
					chatbotAgentSeparateModelsSetting: planActSeparateModelsSetting,
					telemetrySetting,
					enableCheckpointsSetting,
					mcpMarketplaceEnabled,
					mcpRichDisplayEnabled,
					shellIntegrationTimeout,
					terminalReuseEnabled,
					mcpResponsesCollapsed,
					apiConfiguration: apiConfigurationToSubmit
						? convertApiConfigurationToProtoApiConfiguration(apiConfigurationToSubmit)
						: undefined,
					chatSettings: chatSettings ? convertChatSettingsToProtoChatSettings(chatSettings) : undefined,
					terminalOutputLineLimit,
				}),
			)
			// CARET MODIFICATION: console.log to logger
			// caretWebviewLogger.info("[DEBUG] Settings saved successfully"); // CARET MODIFICATION: 주석 처리

			// Update default terminal profile if it has changed
			if (defaultTerminalProfile !== originalState.current.defaultTerminalProfile) {
				await StateServiceClient.updateDefaultTerminalProfile({
					value: defaultTerminalProfile || "default",
				} as StringRequest)
			}

			// Update the original state to reflect the saved changes
			originalState.current = {
				apiConfiguration,
				telemetrySetting,
				planActSeparateModelsSetting,
				enableCheckpointsSetting,
				mcpMarketplaceEnabled,
				mcpRichDisplayEnabled,
				mcpResponsesCollapsed,
				chatSettings,
				shellIntegrationTimeout,
				terminalReuseEnabled,
				terminalOutputLineLimit,
				defaultTerminalProfile,
			}
		} catch (error) {
			// CARET MODIFICATION: console.error to logger
			// caretWebviewLogger.error("Failed to update settings:", error); // CARET MODIFICATION: 주석 처리
			caretWebviewLogger.error("Failed to update settings:", error)
		}

		if (!withoutDone) {
			onDone()
		}
	}

	useEffect(() => {
		setApiErrorMessage(undefined)
		setModelIdErrorMessage(undefined)
	}, [apiConfiguration])

	// Check for unsaved changes by comparing current state with original state
	useEffect(() => {
		const hasChanges =
			JSON.stringify(apiConfiguration) !== JSON.stringify(originalState.current.apiConfiguration) ||
			telemetrySetting !== originalState.current.telemetrySetting ||
			planActSeparateModelsSetting !== originalState.current.planActSeparateModelsSetting ||
			enableCheckpointsSetting !== originalState.current.enableCheckpointsSetting ||
			mcpMarketplaceEnabled !== originalState.current.mcpMarketplaceEnabled ||
			mcpRichDisplayEnabled !== originalState.current.mcpRichDisplayEnabled ||
			JSON.stringify(chatSettings) !== JSON.stringify(originalState.current.chatSettings) ||
			mcpResponsesCollapsed !== originalState.current.mcpResponsesCollapsed ||
			JSON.stringify(chatSettings) !== JSON.stringify(originalState.current.chatSettings) ||
			shellIntegrationTimeout !== originalState.current.shellIntegrationTimeout ||
			terminalOutputLineLimit !== originalState.current.terminalOutputLineLimit ||
			terminalReuseEnabled !== originalState.current.terminalReuseEnabled ||
			defaultTerminalProfile !== originalState.current.defaultTerminalProfile

		setHasUnsavedChanges(hasChanges)
	}, [
		apiConfiguration,
		telemetrySetting,
		planActSeparateModelsSetting,
		enableCheckpointsSetting,
		mcpMarketplaceEnabled,
		mcpRichDisplayEnabled,
		mcpResponsesCollapsed,
		chatSettings,
		shellIntegrationTimeout,
		terminalReuseEnabled,
		terminalOutputLineLimit,
		defaultTerminalProfile,
	])

	// Handle cancel button click
	const handleCancel = useCallback(() => {
		if (hasUnsavedChanges) {
			// Show confirmation dialog
			setIsUnsavedChangesDialogOpen(true)
			pendingAction.current = () => {
				// Reset all tracked state to original values
				setTelemetrySetting(originalState.current.telemetrySetting)
				setPlanActSeparateModelsSetting(originalState.current.planActSeparateModelsSetting)
				setChatSettings(originalState.current.chatSettings)
				if (typeof setApiConfiguration === "function") {
					setApiConfiguration(originalState.current.apiConfiguration ?? {})
				}
				if (typeof setEnableCheckpointsSetting === "function") {
					setEnableCheckpointsSetting(
						typeof originalState.current.enableCheckpointsSetting === "boolean"
							? originalState.current.enableCheckpointsSetting
							: false,
					)
				}
				if (typeof setMcpMarketplaceEnabled === "function") {
					setMcpMarketplaceEnabled(
						typeof originalState.current.mcpMarketplaceEnabled === "boolean"
							? originalState.current.mcpMarketplaceEnabled
							: false,
					)
				}
				if (typeof setMcpRichDisplayEnabled === "function") {
					setMcpRichDisplayEnabled(
						typeof originalState.current.mcpRichDisplayEnabled === "boolean"
							? originalState.current.mcpRichDisplayEnabled
							: true,
					)
				}
				// Reset terminal settings
				if (typeof setShellIntegrationTimeout === "function") {
					setShellIntegrationTimeout(originalState.current.shellIntegrationTimeout)
				}
				if (typeof setTerminalOutputLineLimit === "function") {
					setTerminalOutputLineLimit(originalState.current.terminalOutputLineLimit)
				}
				if (typeof setTerminalReuseEnabled === "function") {
					setTerminalReuseEnabled(originalState.current.terminalReuseEnabled ?? true)
				}
				if (typeof setDefaultTerminalProfile === "function") {
					setDefaultTerminalProfile(originalState.current.defaultTerminalProfile ?? "default")
				}
				if (typeof setMcpResponsesCollapsed === "function") {
					setMcpResponsesCollapsed(originalState.current.mcpResponsesCollapsed ?? false)
				}
				// Close settings view
				onDone()
			}
		} else {
			// No changes, just close
			onDone()
		}
	}, [
		hasUnsavedChanges,
		onDone,
		setTelemetrySetting,
		setPlanActSeparateModelsSetting,
		setChatSettings,
		setApiConfiguration,
		setEnableCheckpointsSetting,
		setMcpMarketplaceEnabled,
		setMcpRichDisplayEnabled,
		setMcpResponsesCollapsed,
	])

	// Handle confirmation dialog actions
	const handleConfirmDiscard = useCallback(() => {
		setIsUnsavedChangesDialogOpen(false)
		if (pendingAction.current) {
			pendingAction.current()
			pendingAction.current = undefined
		}
	}, [])

	const handleCancelDiscard = useCallback(() => {
		setIsUnsavedChangesDialogOpen(false)
		pendingAction.current = undefined
	}, [])

	// validate as soon as the component is mounted
	/*
	useEffect will use stale values of variables if they are not included in the dependency array. 
	so trying to use useEffect with a dependency array of only one value for example will use any 
	other variables' old values. In most cases you don't want this, and should opt to use react-use 
	hooks.
    
		// uses someVar and anotherVar
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [someVar])
	If we only want to run code once on mount we can use react-use's useEffectOnce or useMount
	*/

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		switch (message.type) {
			// Handle tab navigation through targetSection prop instead
			case "grpc_response":
				if (message.grpc_response?.message?.action === "scrollToSettings") {
					const tabId = message.grpc_response?.message?.value
					if (tabId) {
						// CARET MODIFICATION: console.log to logger
						// console.log("Opening settings tab from GRPC response:", tabId)
						caretWebviewLogger.debug("Opening settings tab from GRPC response:", tabId)
						// Check if the value corresponds to a valid tab ID
						const isValidTabId = SETTINGS_TABS.some((tab) => tab.id === tabId)

						if (isValidTabId) {
							// Set the active tab directly
							setActiveTab(tabId)
						} else {
							// Fall back to the old behavior of scrolling to an element
							setTimeout(() => {
								const element = document.getElementById(tabId)
								if (element) {
									element.scrollIntoView({ behavior: "smooth" })

									element.style.transition = "background-color 0.5s ease"
									element.style.backgroundColor = "var(--vscode-textPreformat-background)"

									setTimeout(() => {
										element.style.backgroundColor = "transparent"
									}, 1200)
								}
							}, 300)
						}
					}
				}
				break
		}
	}, [])

	useEvent("message", handleMessage)

	const handleResetState = async (resetGlobalState?: boolean) => {
		try {
			await StateServiceClient.resetState(
				ResetStateRequest.create({
					global: resetGlobalState,
				}),
			)
		} catch (error) {
			// CARET MODIFICATION: console.error to logger
			// console.error("Failed to reset state:", error)
			caretWebviewLogger.error("Failed to reset state:", error)
		}
	}

	// CARET MODIFICATION: Chatbot/Agent 통일 - 직접 비교
	const handleChatbotAgentModeChange = async (tab: "chatbot" | "agent") => {
		// CARET MODIFICATION: Chatbot/Agent 통일 - 직접 모드 비교
		if (tab === chatSettings.mode) {
			return
		}

		// Update settings first to ensure any changes to the current tab are saved
		await handleSubmit(true)

		try {
			await StateServiceClient.toggleChatbotAgentMode(
				ToggleChatbotAgentModeRequest.create({
					chatSettings: {
						// CARET MODIFICATION: Chatbot/Agent 통일 - 직접 모드 사용
						mode: tab === "chatbot" ? ChatbotAgentMode.CHATBOT_MODE : ChatbotAgentMode.AGENT_MODE,
						preferredLanguage: chatSettings.preferredLanguage,
						openAiReasoningEffort: chatSettings.openAIReasoningEffort,
					},
				}),
			)
		} catch (error) {
			// CARET MODIFICATION: console.error to logger
			// console.error("Failed to toggle Chatbot/Agent mode:", error)
			caretWebviewLogger.error("Failed to toggle Chatbot/Agent mode:", error)
		}
	}

	// Track active tab - default to general tab
	const [activeTab, setActiveTab] = useState<string>(targetSection || "general")

	// Update active tab when targetSection changes
	useEffect(() => {
		if (targetSection) {
			setActiveTab(targetSection)
		}
	}, [targetSection])

	// Enhanced tab change handler with debugging
	const handleTabChange = useCallback(
		(tabId: string) => {
			// CARET MODIFICATION: console.log to logger, corrected arguments
			// caretWebviewLogger.debug("Tab change requested:", { tabId, currentTab: activeTab }); // CARET MODIFICATION: 주석 처리
			setActiveTab(tabId)
			// CARET MODIFICATION: console.log to logger, corrected arguments
			// caretWebviewLogger.debug("Active tab changed to:", { activeTab }); // CARET MODIFICATION: 주석 처리
		},
		[activeTab],
	)

	const handleCompactTabClick = (tab: "general" | "api" | "advanced" | "chat") => {
		// CARET MODIFICATION: console.log to logger, corrected arguments
		// caretWebviewLogger.debug("Compact tab clicked:", { tabId: tab }); // CARET MODIFICATION: 주석 처리
		handleTabChange(tab)
	}

	// Debug tab changes
	useEffect(() => {
		// CARET MODIFICATION: console.log to logger
		// console.log("Active tab changed to:", activeTab)
		caretWebviewLogger.debug("Active tab changed to:", activeTab)
	}, [activeTab])

	// Track whether we're in compact mode
	const [isCompactMode, setIsCompactMode] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// Setup resize observer to detect when we should switch to compact mode
	useEffect(() => {
		if (!containerRef.current) return

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// If container width is less than 500px, switch to compact mode
				setIsCompactMode(entry.contentRect.width < 500)
			}
		})

		observer.observe(containerRef.current)

		return () => {
			observer?.disconnect()
		}
	}, [])

	return (
		<Tab>
			<TabHeader className="flex justify-between items-center gap-2">
				<div className="flex items-center gap-1">
					<h3 className="text-[var(--vscode-foreground)] m-0">Settings</h3>
				</div>
				<div className="flex gap-2">
					<VSCodeButton appearance="secondary" onClick={handleCancel}>
						Cancel
					</VSCodeButton>
					<VSCodeButton onClick={() => handleSubmit(false)} disabled={!hasUnsavedChanges}>
						Save
					</VSCodeButton>
				</div>
			</TabHeader>

			{/* Vertical tabs layout */}
			<div ref={containerRef} className={cn(settingsTabsContainer, isCompactMode && "narrow")}>
				{/* Tab sidebar */}
				<TabList
					value={activeTab}
					onValueChange={handleTabChange}
					className={cn(settingsTabList)}
					data-compact={isCompactMode}>
					{SETTINGS_TABS.map((tab) =>
						isCompactMode ? (
							<HeroTooltip key={tab.id} content={tab.tooltipText} placement="right">
								<div
									className={cn(
										activeTab === tab.id
											? `${settingsTabTrigger} ${settingsTabTriggerActive}`
											: settingsTabTrigger,
										"focus:ring-0",
									)}
									data-compact={isCompactMode}
									data-testid={`tab-${tab.id}`}
									data-value={tab.id}
									onClick={() => {
										// CARET MODIFICATION: console.log to logger
										// caretWebviewLogger.debug("Compact tab clicked:", { tabId: tab.id }); // CARET MODIFICATION: 주석 처리
										handleCompactTabClick(tab.id as "general" | "api" | "advanced" | "chat")
									}}>
									<div className={cn("flex items-center gap-2", isCompactMode && "justify-center")}>
										<tab.icon className="w-4 h-4" />
										<span className="tab-label">{tab.name}</span>
									</div>
								</div>
							</HeroTooltip>
						) : (
							<TabTrigger
								key={tab.id}
								value={tab.id}
								className={cn(
									activeTab === tab.id
										? `${settingsTabTrigger} ${settingsTabTriggerActive}`
										: settingsTabTrigger,
									"focus:ring-0",
								)}
								data-compact={isCompactMode}
								data-testid={`tab-${tab.id}`}>
								<div className={cn("flex items-center gap-2", isCompactMode && "justify-center")}>
									<tab.icon className="w-4 h-4" />
									<span className="tab-label">{tab.name}</span>
								</div>
							</TabTrigger>
						),
					)}
				</TabList>

				{/* Helper function to render section header */}
				{(() => {
					const renderSectionHeader = (tabId: string) => {
						const tab = SETTINGS_TABS.find((t) => t.id === tabId)
						if (!tab) return null

						return (
							<SectionHeader>
								<div className="flex items-center gap-2">
									{(() => {
										const Icon = tab.icon
										return <Icon className="w-4" />
									})()}
									<div>{tab.headerText}</div>
								</div>
							</SectionHeader>
						)
					}

					return (
						<TabContent className="flex-1 overflow-auto">
							{/* API Configuration Tab */}
							{activeTab === "api-config" && (
								<div>
									{renderSectionHeader("api-config")}
									<Section>
										{/* Tabs container */}
										{/* CARET MODIFICATION: Chatbot/Agent 버튼을 항상 표시 (조건부 제거) */}
										<div className="rounded-md mb-5 bg-[var(--vscode-panel-background)]">
											<div className="flex gap-[1px] mb-[10px] -mt-2 border-0 border-b border-solid border-[var(--vscode-panel-border)]">
												{/* CARET MODIFICATION: Chatbot/Agent 통일 - 올바른 모드 비교 */}
												<TabButton
													isActive={chatSettings.mode === "agent"}
													onClick={() => handleChatbotAgentModeChange("agent")}>
													🤖 Agent
												</TabButton>
												<TabButton
													isActive={chatSettings.mode === "chatbot"}
													onClick={() => handleChatbotAgentModeChange("chatbot")}>
													💬 Chatbot
												</TabButton>
											</div>

											{/* Content container - 체크박스 상태에 따라 다른 키 사용 */}
											<div className="-mb-3">
												<ApiOptions
													key={planActSeparateModelsSetting ? chatSettings.mode : "single"}
													showModelOptions={true}
													apiErrorMessage={apiErrorMessage}
													modelIdErrorMessage={modelIdErrorMessage}
												/>
											</div>
										</div>

										<div className="mb-[5px]">
											{/* CARET MODIFICATION: Plan/Act -> Chatbot/Agent 텍스트 업데이트 */}
											<VSCodeCheckbox
												className="mb-[5px]"
												checked={planActSeparateModelsSetting}
												onChange={(e: any) => {
													const checked = e.target.checked === true
													setPlanActSeparateModelsSetting(checked)
												}}>
												{t("settings.separateModels.label")}
											</VSCodeCheckbox>
											<p className="text-xs mt-[5px] text-[var(--vscode-descriptionForeground)]">
												{t("settings.separateModels.description")}
											</p>
										</div>
									</Section>
								</div>
							)}

							{/* General Settings Tab */}
							{activeTab === "general" && (
								<div>
									{renderSectionHeader("general")}
									<Section>
										{chatSettings && (
											<PreferredLanguageSetting
												chatSettings={chatSettings}
												setChatSettings={setChatSettings}
											/>
										)}

										{/* CARET MODIFICATION: UI Language Setting */}
										{chatSettings &&
											(() => {
												// caretWebviewLogger.debug(\`🎯 General 탭! Rendering CaretUILanguageSetting with chatSettings.\\`); // 주석 유지
												// CARET MODIFICATION: console.log to logger
												// console.log(
												// 	"🎯 [SettingsView] chatSettings for CaretUILanguageSetting:",
												// 	chatSettings,
												// )
												caretWebviewLogger.debug(
													"🎯 [SettingsView] chatSettings for CaretUILanguageSetting:",
													chatSettings,
												)

												try {
													// caretWebviewLogger.debug(\\`🔥 CaretUILanguageSetting 렌더링 시도!\\`) // 주석 유지
													return (
														<CaretUILanguageSetting
															chatSettings={chatSettings}
															setChatSettings={setChatSettings}
														/>
													)
												} catch (error) {
													// caretWebviewLogger.error(\\`❌ CaretUILanguageSetting 에러: \\${error}\\`) // 주석 유지
													// CARET MODIFICATION: console.error to logger
													// console.error("CaretUILanguageSetting Error:", error) // console.error 사용
													caretWebviewLogger.error("CaretUILanguageSetting Error:", error)
													return <div>CaretUILanguageSetting Error: {String(error)}</div>
												}
											})()}
										{!chatSettings &&
											// CARET MODIFICATION: console.debug to logger
											// console.debug(
											// 	"🎯 General 탭! chatSettings not available, CaretUILanguageSetting not rendered.",
											// )
											caretWebviewLogger.debug(
												"🎯 General 탭! chatSettings not available, CaretUILanguageSetting not rendered.",
											)}

										{/* CARET MODIFICATION: Mode System Selection */}
										{chatSettings && (
											<div className="mb-[15px]">
												<label className="block text-sm font-medium mb-2">
													{t("settings.modeSystem.label")}
												</label>
												<div className="flex gap-2">
													<VSCodeButton
														appearance={chatSettings.modeSystem === "caret" ? "primary" : "secondary"}
														onClick={() => {
															setModeSystem("caret")
														}}>
														{t("settings.modeSystem.options.caret")}
													</VSCodeButton>
													<VSCodeButton
														appearance={chatSettings.modeSystem === "cline" ? "primary" : "secondary"}
														onClick={() => {
															setModeSystem("cline")
														}}>
														{t("settings.modeSystem.options.cline")}
													</VSCodeButton>
												</div>
												<p className="text-xs mt-[5px] text-[var(--vscode-descriptionForeground)]">
													{t("settings.modeSystem.description")}
												</p>
											</div>
										)}

										<div className="mb-[5px]">
											<VSCodeCheckbox
												className="mb-[5px]"
												checked={telemetrySetting !== "disabled"}
												onChange={(e: any) => {
													const checked = e.target.checked === true
													setTelemetrySetting(checked ? "enabled" : "disabled")
												}}>
												Allow anonymous error and usage reporting
											</VSCodeCheckbox>
											<p className="text-xs mt-[5px] text-[var(--vscode-descriptionForeground)]">
												Help improve Cline by sending anonymous usage data and error reports. No code,
												prompts, or personal information are ever sent. See our{" "}
												<VSCodeLink
													href="https://docs.cline.bot/more-info/telemetry"
													className="text-inherit">
													telemetry overview
												</VSCodeLink>{" "}
												and{" "}
												<VSCodeLink href="https://cline.bot/privacy" className="text-inherit">
													privacy policy
												</VSCodeLink>{" "}
												for more details.
											</p>
										</div>
									</Section>
								</div>
							)}

							{/* Feature Settings Tab */}
							{activeTab === "features" && (
								<div>
									{renderSectionHeader("features")}
									<Section>
										<FeatureSettingsSection />
									</Section>
								</div>
							)}

							{/* Browser Settings Tab */}
							{activeTab === "browser" && (
								<div>
									{renderSectionHeader("browser")}
									<Section>
										<BrowserSettingsSection />
									</Section>
								</div>
							)}

							{/* Terminal Settings Tab */}
							{activeTab === "terminal" && (
								<div>
									{renderSectionHeader("terminal")}
									<Section>
										<TerminalSettingsSection />
									</Section>
								</div>
							)}

							{/* Debug Tab (only in dev mode) */}
							{IS_DEV && activeTab === "debug" && (
								<div>
									{renderSectionHeader("debug")}
									<Section>
										<VSCodeButton
											onClick={() => handleResetState()}
											className="mt-[5px] w-auto"
											style={{ backgroundColor: "var(--vscode-errorForeground)", color: "black" }}>
											Reset Workspace State
										</VSCodeButton>
										<VSCodeButton
											onClick={() => handleResetState(true)}
											className="mt-[5px] w-auto"
											style={{ backgroundColor: "var(--vscode-errorForeground)", color: "black" }}>
											Reset Global State
										</VSCodeButton>
										<p className="text-xs mt-[5px] text-[var(--vscode-descriptionForeground)]">
											This will reset all global state and secret storage in the extension.
										</p>
									</Section>
								</div>
							)}

							{/* About Tab */}
							{activeTab === "about" && (
								<div>
									{renderSectionHeader("about")}
									<Section>
										<div className="text-center text-[var(--vscode-descriptionForeground)] text-xs leading-[1.2] px-0 py-0 pr-2 pb-[15px] mt-auto">
											<p className="break-words m-0 p-0">
												If you have any questions or feedback, feel free to open an issue at{" "}
												<VSCodeLink href="https://github.com/cline/cline" className="inline">
													https://github.com/cline/cline
												</VSCodeLink>
											</p>
											<p className="italic mt-[10px] mb-0 p-0">v{version}</p>
										</div>
									</Section>
								</div>
							)}
						</TabContent>
					)
				})()}
			</div>

			{/* Unsaved Changes Dialog */}
			<UnsavedChangesDialog
				open={isUnsavedChangesDialogOpen}
				onOpenChange={setIsUnsavedChangesDialogOpen}
				onConfirm={handleConfirmDiscard}
				onCancel={handleCancelDiscard}
			/>
		</Tab>
	)
}

export default memo(SettingsView)
