import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { t } from "../utils/i18n"
import ApiOptions from "../../components/settings/ApiOptions"
import { vscode } from "../../utils/vscode"

interface CaretApiSetupProps {
	onSubmit: () => void
	onBack: () => void
	disabled?: boolean
	errorMessage?: string
}

const CaretApiSetup: React.FC<CaretApiSetupProps> = ({ onSubmit, onBack, disabled = false, errorMessage }) => {
	const containerStyle = {
		marginTop: "25px",
		padding: "20px",
		border: "1px solid var(--vscode-inputValidation-infoBorder)",
		borderRadius: "8px",
		backgroundColor: "var(--vscode-sideBar-background)",
	}

	const errorStyle = {
		marginTop: "15px",
		padding: "10px",
		backgroundColor: "var(--vscode-inputValidation-errorBackground)",
		border: "1px solid var(--vscode-inputValidation-errorBorder)",
		borderRadius: "4px",
		color: "var(--vscode-inputValidation-errorForeground)",
	}

	return (
		<div className="caret-api-setup" style={containerStyle}>
			{/* Back Button */}
			<VSCodeButton appearance="secondary" onClick={onBack} style={{ marginBottom: "20px" }}>
				{t("apiSetup.backButton", "welcome")}
			</VSCodeButton>

			{/* Title */}
			<h4>{t("apiSetup.title", "welcome")}</h4>

			{/* Instructions */}
			<p style={{ marginBottom: "20px", color: "var(--vscode-descriptionForeground)" }}>
				{t("apiSetup.instructions", "welcome")}
			</p>

			{/* API Options */}
			<ApiOptions showModelOptions={true} />

			{/* Submit Button */}
			<VSCodeButton
				onClick={onSubmit}
				disabled={disabled}
				appearance="primary"
				style={{ width: "100%", marginTop: "15px" }}>
				{t("apiSetup.saveButton", "welcome")}
			</VSCodeButton>

			{/* Error Message */}
			{errorMessage && <div style={errorStyle}>{errorMessage}</div>}

			{/* Help Section */}
			<div
				style={{
					marginTop: "20px",
					padding: "15px",
					border: "1px solid var(--vscode-panel-border)",
					borderRadius: "8px",
					backgroundColor: "var(--vscode-panel-background)",
					textAlign: "center",
				}}>
				<h4>{t("apiSetup.help.title", "welcome")}</h4>
				<VSCodeButton
					appearance="secondary"
					onClick={() => {
						vscode.postMessage({ type: "openExternalLink", link: "https://docs.caret.team" })
					}}>
					{t("apiSetup.help.button", "welcome")}
				</VSCodeButton>
			</div>
		</div>
	)
}

export default CaretApiSetup
