import React, { useState, useContext, useEffect } from "react"
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react"
import { t } from "@/caret/utils/i18n"
import { caretWebviewLogger } from "@/caret/utils/webview-logger"
import { PersonaTemplateSelector } from "./PersonaTemplateSelector"
import type { PersonaInstruction, TemplateCharacter } from "../../../../src/shared/persona"
import { ExtensionStateContext } from "../../context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"
import { WebviewMessage } from "../../../../src/shared/WebviewMessage"

interface PersonaManagementProps {
	className?: string
}

export const PersonaManagement: React.FC<PersonaManagementProps> = ({ className }) => {
	const [isSelectorOpen, setIsSelectorOpen] = useState(false)
	const [selectedPersona, setSelectedPersona] = useState<TemplateCharacter | null>(null)
	const [currentInstruction, setCurrentInstruction] = useState<string>("")
	const extensionState = useContext(ExtensionStateContext)
	const currentLocale = extensionState?.chatSettings?.uiLanguage || "en"

	const handleSelectPersonaTemplate = () => {
		caretWebviewLogger.debug("Persona template selector button clicked. Opening modal...")
		setIsSelectorOpen(true)
	}

	const handleCloseSelector = () => {
		setIsSelectorOpen(false)
		caretWebviewLogger.debug("Persona template selector modal closed.")
	}

	// Load current persona data
	useEffect(() => {
		// Request template characters
		vscode.postMessage({
			type: "REQUEST_TEMPLATE_CHARACTERS",
		})

		// Request current custom instructions
		vscode.postMessage({
			type: "REQUEST_RULE_FILE_CONTENT",
			payload: { ruleName: "custom_instructions.md", isGlobal: true },
		})
	}, [])

	// Listen for message responses
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			// Handle template characters response
			if (message.type === "RESPONSE_TEMPLATE_CHARACTERS") {
				const characters: TemplateCharacter[] = message.payload
				caretWebviewLogger.debug("Received template characters:", characters)

				// Find selected persona based on current instruction
				if (currentInstruction && currentInstruction.trim() && characters.length > 0) {
					caretWebviewLogger.debug("Current instruction:", currentInstruction)

					const matchedPersona = characters.find((char) => {
						const localeDetails = (char[currentLocale as keyof typeof char] as any) || char.en
						const personaJson = JSON.stringify(localeDetails.customInstruction, null, 2)
						caretWebviewLogger.debug(`Comparing with ${char.character}:`, personaJson)
						return personaJson === currentInstruction
					})

					if (matchedPersona) {
						caretWebviewLogger.debug("Found matched persona:", matchedPersona.character)
						setSelectedPersona(matchedPersona)
					} else {
						caretWebviewLogger.debug("No matched persona found, using default")
						// Set default persona if no match
						const defaultPersona = characters.find((c) => c.isDefault) || characters[0]
						if (defaultPersona) setSelectedPersona(defaultPersona)
					}
				} else if (characters.length > 0) {
					// If no current instruction, set default persona
					const defaultPersona = characters.find((c) => c.isDefault) || characters[0]
					if (defaultPersona) setSelectedPersona(defaultPersona)
				}
			}

			// Store current custom instruction
			if (message.type === "RESPONSE_RULE_FILE_CONTENT" && message.payload.ruleName === "custom_instructions.md") {
				setCurrentInstruction(message.payload.content)
			}

			// Handle persona update success - refresh data
			if (message.type === "PERSONA_UPDATED") {
				// Reload template characters and current instruction
				vscode.postMessage({
					type: "REQUEST_TEMPLATE_CHARACTERS",
				})
				vscode.postMessage({
					type: "REQUEST_RULE_FILE_CONTENT",
					payload: { ruleName: "custom_instructions.md", isGlobal: true },
				})
			}
		}

		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [currentLocale, currentInstruction])

	// Additional effect to ensure proper loading when component remounts
	useEffect(() => {
		if (currentInstruction && currentInstruction.trim()) {
			// Re-request template characters to ensure proper matching
			vscode.postMessage({
				type: "REQUEST_TEMPLATE_CHARACTERS",
			})
		}
	}, [currentInstruction])

	const handlePersonaSelected = (personaInstruction: PersonaInstruction) => {
		caretWebviewLogger.debug("Persona selected:", personaInstruction)
		// Send selected personaInstruction to backend to update custom_instructions.md
		vscode.postMessage({
			type: "UPDATE_PERSONA_CUSTOM_INSTRUCTION", // New message type
			payload: { personaInstruction: personaInstruction }, // The selected persona instruction data
		} as WebviewMessage)

		// Update current instruction to trigger re-matching
		setCurrentInstruction(JSON.stringify(personaInstruction, null, 2))

		// Close modal after selection
		setIsSelectorOpen(false)
	}

	// Get persona name in current locale
	const getPersonaName = () => {
		if (!selectedPersona) return ""
		const localeDetails = (selectedPersona[currentLocale as keyof typeof selectedPersona] as any) || selectedPersona.en
		return localeDetails?.name || ""
	}

	return (
		<div className={className} data-testid="persona-management">
			<div className="text-sm font-normal mb-2">{t("rules.section.personaManagement", "common")}</div>

			{/* Display selected persona images when available */}
			{selectedPersona && (
				<div className="mb-4 mt-2">
					<div className="flex justify-center space-x-4 mb-2">
						<div className="text-center">
							<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">
								{t("normalState", "persona")}
							</div>
							<img
								src={selectedPersona.avatarUri}
								alt={`${getPersonaName()} normal`}
								className="w-20 h-20 rounded-full object-cover border-2 border-[var(--vscode-settings-headerBorder)]"
							/>
						</div>
						<div className="text-center">
							<div className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">
								{t("thinkingState", "persona")}
							</div>
							<img
								src={selectedPersona.thinkingAvatarUri}
								alt={`${getPersonaName()} thinking`}
								className="w-20 h-20 rounded-full object-cover border-2 border-[var(--vscode-settings-headerBorder)]"
							/>
						</div>
					</div>
					<div className="text-center text-sm font-medium">{getPersonaName()}</div>
				</div>
			)}

			<div className="flex justify-end">
				<VSCodeButton appearance="secondary" onClick={handleSelectPersonaTemplate}>
					{selectedPersona
						? t("rules.button.changePersonaTemplate", "common")
						: t("rules.button.selectPersonaTemplate", "common")}
				</VSCodeButton>
			</div>

			{isSelectorOpen && (
				<PersonaTemplateSelector
					isOpen={isSelectorOpen}
					onClose={handleCloseSelector}
					onSelectPersona={handlePersonaSelected}
					currentLocale={currentLocale}
				/>
			)}
		</div>
	)
}

export default PersonaManagement
