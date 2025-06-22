import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { t } from "@/caret/utils/i18n"
import { caretWebviewLogger } from "@/caret/utils/webview-logger"

interface PersonaManagementProps {
	className?: string
}

export const PersonaManagement: React.FC<PersonaManagementProps> = ({ className }) => {
	const handleSelectPersonaTemplate = () => {
		caretWebviewLogger.debug("Persona template selector button clicked")
		// TODO: Open persona template selector modal
	}

	return (
		<div className={className}>
			<div className="text-sm font-normal mb-2">{t("rules.section.personaManagement")}</div>
			<VSCodeButton appearance="secondary" onClick={handleSelectPersonaTemplate}>
				{t("rules.button.selectPersonaTemplate")}
			</VSCodeButton>
		</div>
	)
}

export default PersonaManagement
