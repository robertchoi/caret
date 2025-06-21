// CARET MODIFICATION: Enhanced rules toggle modal with caretrules support. Original backed up as ClineRulesToggleModal-tsx.cline
import { CODE_BLOCK_BG_COLOR } from "@/components/common/CodeBlock"
import Tooltip from "@/components/common/Tooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { FileServiceClient } from "@/services/grpc-client"
import { vscode } from "@/utils/vscode"
import { caretWebviewLogger } from "@/caret/utils/webview-logger"
import { EmptyRequest } from "@shared/proto/common"
import {
	ClineRulesToggles,
	RefreshedRules,
	ToggleClineRuleRequest,
	ToggleCaretRuleRequest,
	ToggleCursorRuleRequest,
	ToggleWindsurfRuleRequest,
	ToggleWorkflowRequest,
} from "@shared/proto/file"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import React, { useEffect, useRef, useState } from "react"
import { useClickAway, useWindowSize } from "react-use"
import styled from "styled-components"
import RulesToggleList from "./RulesToggleList"

const ClineRulesToggleModal: React.FC = () => {
	const {
		globalClineRulesToggles = {},
		localClineRulesToggles = {},
		localCaretRulesToggles = {},
		localCursorRulesToggles = {},
		localWindsurfRulesToggles = {},
		localWorkflowToggles = {},
		globalWorkflowToggles = {},
		setGlobalClineRulesToggles,
		setLocalClineRulesToggles,
		setLocalCaretRulesToggles,
		setLocalCursorRulesToggles,
		setLocalWindsurfRulesToggles,
		setLocalWorkflowToggles,
		setGlobalWorkflowToggles,
	} = useExtensionState()
	const [isVisible, setIsVisible] = useState(false)
	const buttonRef = useRef<HTMLDivElement>(null)
	const modalRef = useRef<HTMLDivElement>(null)
	const { width: viewportWidth, height: viewportHeight } = useWindowSize()
	const [arrowPosition, setArrowPosition] = useState(0)
	const [menuPosition, setMenuPosition] = useState(0)
	const [currentView, setCurrentView] = useState<"rules" | "workflows">("rules")

	useEffect(() => {
		if (isVisible) {
			console.log("[DEBUG] Rules modal opened, refreshing rules...")
			FileServiceClient.refreshRules({} as EmptyRequest)
				.then((response: RefreshedRules) => {
					console.log("[DEBUG] Rules refresh response:", response)
					if (response.globalClineRulesToggles?.toggles) {
						setGlobalClineRulesToggles(response.globalClineRulesToggles.toggles)
						console.log("[DEBUG] Set global cline rules:", response.globalClineRulesToggles.toggles)
					}
					if (response.localClineRulesToggles?.toggles) {
						setLocalClineRulesToggles(response.localClineRulesToggles.toggles)
						console.log("[DEBUG] Set local cline rules:", response.localClineRulesToggles.toggles)
					}
					if (response.localCaretRulesToggles?.toggles) {
						setLocalCaretRulesToggles(response.localCaretRulesToggles.toggles)
						console.log("[DEBUG] Set local caret rules:", response.localCaretRulesToggles.toggles)
					}
					if (response.localCursorRulesToggles?.toggles) {
						setLocalCursorRulesToggles(response.localCursorRulesToggles.toggles)
						console.log("[DEBUG] Set local cursor rules:", response.localCursorRulesToggles.toggles)
					}
					if (response.localWindsurfRulesToggles?.toggles) {
						setLocalWindsurfRulesToggles(response.localWindsurfRulesToggles.toggles)
						console.log("[DEBUG] Set local windsurf rules:", response.localWindsurfRulesToggles.toggles)
					}
					if (response.localWorkflowToggles?.toggles) {
						setLocalWorkflowToggles(response.localWorkflowToggles.toggles)
						console.log("[DEBUG] Set local workflows:", response.localWorkflowToggles.toggles)
					}
					if (response.globalWorkflowToggles?.toggles) {
						setGlobalWorkflowToggles(response.globalWorkflowToggles.toggles)
						console.log("[DEBUG] Set global workflows:", response.globalWorkflowToggles.toggles)
					}
				})
				.catch((error) => {
					caretWebviewLogger.error("Failed to refresh rules", error)
					console.error("Failed to refresh rules:", error)
				})
		}
	}, [isVisible])

	// Format rules for display
	const globalRules = Object.entries(globalClineRulesToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const localRules = Object.entries(localClineRulesToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const caretRules = Object.entries(localCaretRulesToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const cursorRules = Object.entries(localCursorRulesToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const windsurfRules = Object.entries(localWindsurfRulesToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const localWorkflows = Object.entries(localWorkflowToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	const globalWorkflows = Object.entries(globalWorkflowToggles || {})
		.map(([path, enabled]): [string, boolean] => [path, enabled as boolean])
		.sort(([a], [b]) => a.localeCompare(b))

	// Toggle handlers
	const toggleRule = (isGlobal: boolean, rulePath: string, enabled: boolean) => {
		FileServiceClient.toggleClineRule(
			ToggleClineRuleRequest.create({
				isGlobal,
				rulePath,
				enabled,
			}),
		)
			.then((response) => {
				if (response.globalClineRulesToggles?.toggles) {
					setGlobalClineRulesToggles(response.globalClineRulesToggles.toggles)
				}
				if (response.localClineRulesToggles?.toggles) {
					setLocalClineRulesToggles(response.localClineRulesToggles.toggles)
				}
			})
			.catch((error) => {
				caretWebviewLogger.error("Error toggling Cline rule", error)
				console.error("Error toggling Cline rule:", error)
			})
	}

	const toggleCaretRule = (rulePath: string, enabled: boolean) => {
		console.log("[DEBUG] Toggling Caret rule:", rulePath, "enabled:", enabled)
		FileServiceClient.toggleCaretRule(
			ToggleCaretRuleRequest.create({
				rulePath,
				enabled,
			}),
		)
			.then((response) => {
				console.log("[DEBUG] Caret rule toggle response:", response)
				if (response.toggles) {
					setLocalCaretRulesToggles(response.toggles)
					console.log("[DEBUG] Updated local caret rule toggles:", response.toggles)
				}
			})
			.catch((error) => {
				caretWebviewLogger.error("Error toggling Caret rule", error)
				console.error("Error toggling Caret rule:", error)
			})
	}

	const toggleCursorRule = (rulePath: string, enabled: boolean) => {
		FileServiceClient.toggleCursorRule(
			ToggleCursorRuleRequest.create({
				rulePath,
				enabled,
			}),
		)
			.then((response) => {
				if (response.toggles) {
					setLocalCursorRulesToggles(response.toggles)
				}
			})
			.catch((error) => {
				caretWebviewLogger.error("Error toggling Cursor rule", error)
				console.error("Error toggling Cursor rule:", error)
			})
	}

	const toggleWindsurfRule = (rulePath: string, enabled: boolean) => {
		FileServiceClient.toggleWindsurfRule(
			ToggleWindsurfRuleRequest.create({
				rulePath,
				enabled,
			} as ToggleWindsurfRuleRequest),
		)
			.then((response: ClineRulesToggles) => {
				if (response.toggles) {
					setLocalWindsurfRulesToggles(response.toggles)
				}
			})
			.catch((error) => {
				caretWebviewLogger.error("Error toggling Windsurf rule", error)
				console.error("Error toggling Windsurf rule:", error)
			})
	}

	const toggleWorkflow = (isGlobal: boolean, workflowPath: string, enabled: boolean) => {
		FileServiceClient.toggleWorkflow(
			ToggleWorkflowRequest.create({
				workflowPath,
				enabled,
				isGlobal,
			}),
		)
			.then((response) => {
				if (response.toggles) {
					if (isGlobal) {
						setGlobalWorkflowToggles(response.toggles)
					} else {
						setLocalWorkflowToggles(response.toggles)
					}
				}
			})
			.catch((error) => {
				caretWebviewLogger.error("Failed to toggle workflow", error)
				console.error("Failed to toggle workflow:", error)
			})
	}

	// Close modal when clicking outside
	useClickAway(modalRef, () => {
		setIsVisible(false)
	})

	// Calculate positions for modal and arrow
	useEffect(() => {
		if (isVisible && buttonRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect()
			const buttonCenter = buttonRect.left + buttonRect.width / 2
			const rightPosition = document.documentElement.clientWidth - buttonCenter - 5

			setArrowPosition(rightPosition)
			setMenuPosition(buttonRect.top + 1)
		}
	}, [isVisible, viewportWidth, viewportHeight])

	return (
		<div ref={modalRef}>
			<div ref={buttonRef} className="inline-flex min-w-0 max-w-full">
				<Tooltip tipText="Manage Cline Rules & Workflows" visible={isVisible ? false : undefined}>
					<VSCodeButton appearance="icon" aria-label="Cline Rules" onClick={() => setIsVisible(!isVisible)}>
						<span className="codicon codicon-law"></span>
					</VSCodeButton>
				</Tooltip>
			</div>
			{isVisible && (
				<div
					className="fixed left-[15px] right-[15px] border border-[var(--vscode-editorGroup-border)] p-3 rounded z-[1000] overflow-y-auto"
					style={{
						bottom: `calc(100vh - ${menuPosition}px + 6px)`,
						background: CODE_BLOCK_BG_COLOR,
						maxHeight: "calc(100vh - 100px)",
						overscrollBehavior: "contain",
					}}>
					<div
						className="fixed w-[10px] h-[10px] z-[-1] rotate-45 border-r border-b border-[var(--vscode-editorGroup-border)]"
						style={{
							bottom: `calc(100vh - ${menuPosition}px)`,
							right: arrowPosition,
							background: CODE_BLOCK_BG_COLOR,
						}}
					/>

					{/* Tabs container */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: "10px",
						}}>
						<div
							style={{
								display: "flex",
								gap: "1px",
								borderBottom: "1px solid var(--vscode-panel-border)",
							}}>
							<TabButton isActive={currentView === "rules"} onClick={() => setCurrentView("rules")}>
								Rules
							</TabButton>
							<TabButton isActive={currentView === "workflows"} onClick={() => setCurrentView("workflows")}>
								Workflows
							</TabButton>
						</div>
					</div>

					{/* Description text */}
					<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-4">
						{currentView === "rules" ? (
							<p>
								Rules allow you to provide Cline with system-level guidance. Think of them as a persistent way to
								include context and preferences for your projects or globally for every conversation.{" "}
								<VSCodeLink
									href="https://docs.cline.bot/features/cline-rules"
									style={{ display: "inline" }}
									className="text-xs">
									Docs
								</VSCodeLink>
							</p>
						) : (
							<p>
								Workflows allow you to define a series of steps to guide Cline through a repetitive set of tasks,
								such as deploying a service or submitting a PR. To invoke a workflow, type{" "}
								<span className="text-[var(--vscode-foreground)] font-bold">/workflow-name</span> in the chat.{" "}
								<VSCodeLink
									href="https://docs.cline.bot/features/slash-commands/workflows"
									style={{ display: "inline" }}
									className="text-xs">
									Docs
								</VSCodeLink>
							</p>
						)}
					</div>

					{currentView === "rules" ? (
						<>
							{/* Global Rules Section */}
							<div className="mb-3">
								<div className="text-sm font-normal mb-2">Global Rules</div>
								<RulesToggleList
									rules={globalRules}
									toggleRule={(rulePath, enabled) => toggleRule(true, rulePath, enabled)}
									listGap="small"
									isGlobal={true}
									ruleType={"cline"}
									showNewRule={true}
									showNoRules={false}
								/>
							</div>

							{/* Local Rules Section */}
							<div style={{ marginBottom: -10 }}>
								<div className="text-sm font-normal mb-2">Workspace Rules</div>
								{/* Caret Rules */}
								{caretRules.length > 0 && (
									<>
										<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1 mt-2">
											Caret Rules (.caretrules)
										</div>
										<RulesToggleList
											rules={caretRules}
											toggleRule={toggleCaretRule}
											listGap="small"
											isGlobal={false}
											ruleType={"caret"}
											showNewRule={false}
											showNoRules={false}
										/>
									</>
								)}
								{/* Cline Rules */}
								{localRules.length > 0 && (
									<>
										<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1 mt-2">
											Cline Rules (.clinerules)
										</div>
										<RulesToggleList
											rules={localRules}
											toggleRule={(rulePath, enabled) => toggleRule(false, rulePath, enabled)}
											listGap="small"
											isGlobal={false}
											ruleType={"cline"}
											showNewRule={true}
											showNoRules={false}
										/>
									</>
								)}
								{/* Cursor Rules */}
								{cursorRules.length > 0 && (
									<>
										<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1 mt-2">
											Cursor Rules (.cursorrules)
										</div>
										<RulesToggleList
											rules={cursorRules}
											toggleRule={toggleCursorRule}
											listGap="small"
											isGlobal={false}
											ruleType={"cursor"}
											showNewRule={false}
											showNoRules={false}
										/>
									</>
								)}
								{/* Windsurf Rules */}
								{windsurfRules.length > 0 && (
									<>
										<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1 mt-2">
											Windsurf Rules (.windsurfrules)
										</div>
										<RulesToggleList
											rules={windsurfRules}
											toggleRule={toggleWindsurfRule}
											listGap="small"
											isGlobal={false}
											ruleType={"windsurf"}
											showNewRule={false}
											showNoRules={false}
										/>
									</>
								)}
							</div>
						</>
					) : (
						<>
							{/* Global Workflows Section */}
							<div className="mb-3">
								<div className="text-sm font-normal mb-2">Global Workflows</div>
								<RulesToggleList
									rules={globalWorkflows}
									toggleRule={(rulePath, enabled) => toggleWorkflow(true, rulePath, enabled)}
									listGap="small"
									isGlobal={true}
									ruleType={"workflow"}
									showNewRule={true}
									showNoRules={false}
								/>
							</div>

							{/* Local Workflows Section */}
							<div style={{ marginBottom: -10 }}>
								<div className="text-sm font-normal mb-2">Workspace Workflows</div>
								<RulesToggleList
									rules={localWorkflows}
									toggleRule={(rulePath, enabled) => toggleWorkflow(false, rulePath, enabled)}
									listGap="small"
									isGlobal={false}
									ruleType={"workflow"}
									showNewRule={true}
									showNoRules={false}
								/>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	)
}

const StyledTabButton = styled.button<{ isActive: boolean }>`
	background: none;
	border: none;
	border-bottom: 2px solid ${(props) => (props.isActive ? "var(--vscode-foreground)" : "transparent")};
	color: ${(props) => (props.isActive ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)")};
	padding: 8px 16px;
	cursor: pointer;
	font-size: 13px;
	margin-bottom: -1px;
	font-family: inherit;

	&:hover {
		color: var(--vscode-foreground);
	}
`

export const TabButton = ({
	children,
	isActive,
	onClick,
}: {
	children: React.ReactNode
	isActive: boolean
	onClick: () => void
}) => (
	<StyledTabButton isActive={isActive} onClick={onClick}>
		{children}
	</StyledTabButton>
)

export default ClineRulesToggleModal
