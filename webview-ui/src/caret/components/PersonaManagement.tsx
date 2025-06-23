import React, { useState, useContext } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { t } from "@/caret/utils/i18n"
import { caretWebviewLogger } from "@/caret/utils/webview-logger"
import { PersonaTemplateSelector } from "./PersonaTemplateSelector"
import type { PersonaInstruction } from "../../../../src/shared/persona"
import { ExtensionStateContext } from "../../context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"
import { WebviewMessage } from "../../../../src/shared/WebviewMessage"

interface PersonaManagementProps {
	className?: string
}

export const PersonaManagement: React.FC<PersonaManagementProps> = ({ className }) => {
	const [isSelectorOpen, setIsSelectorOpen] = useState(false)
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

	const handlePersonaSelected = (personaInstruction: PersonaInstruction) => {
		caretWebviewLogger.debug("Persona selected:", personaInstruction)
		// Send selected personaInstruction to backend to update custom_instructions.md
		vscode.postMessage({
			type: "UPDATE_PERSONA_CUSTOM_INSTRUCTION", // New message type
			payload: { personaInstruction: personaInstruction }, // The selected persona instruction data
		} as WebviewMessage)

		// TODO: And then refresh global rules (this will likely be handled by backend after update)
		setIsSelectorOpen(false) // Close modal after selection
	}

	return (
		<div className={className}>
			<div className="text-sm font-normal mb-2">{t("rules.section.personaManagement")}</div>
			<VSCodeButton appearance="secondary" onClick={handleSelectPersonaTemplate}>
				{t("rules.button.selectPersonaTemplate")}
			</VSCodeButton>

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
