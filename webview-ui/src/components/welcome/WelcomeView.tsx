// CARET MODIFICATION: Refactored to use component-based architecture while preserving original Cline structure patterns
// Original backed up to: WelcomeView-tsx.caret-backup
import React from "react"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { validateApiConfiguration } from "@utils/validate"
import { vscode } from "@utils/vscode"
import CaretWelcomeSection from "@/caret/components/CaretWelcomeSection"
import CaretApiSetup from "@/caret/components/CaretApiSetup"

import CaretFooter from "@/caret/components/CaretFooter"
import { t } from "@/caret/utils/i18n"
import { CARET_URLS, getLocalizedUrl } from "@/caret/constants/urls"

const WelcomeView = () => {
	const { apiConfiguration, caretBanner } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)

	const disableLetsGoButton = apiErrorMessage !== null

	const handleOpenLink = (link: string, linkName: string) => {
		vscode.postMessage({ type: "openExternalLink", link })
	}

	const handleSubmitApiKey = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
		vscode.postMessage({ type: "start" })
	}

	const handleShowApiOptions = () => {
		// If API is already configured, start directly
		if (!apiErrorMessage) {
			vscode.postMessage({ type: "start" })
		} else {
			// Otherwise, show API setup
			setShowApiOptions(true)
		}
	}

	const handleHideApiOptions = () => {
		setShowApiOptions(false)
	}

	const handleCaretAccountNotify = () => {
		vscode.postMessage({ type: "notifyCaretAccount" })
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	// Helper to render sections consistently (preserving original Cline pattern)
	const renderSection = (
		headerKey: string,
		bodyKey: string,
		buttonTextKey?: string,
		buttonHandler?: () => void,
		buttonAppearance: "primary" | "secondary" = "secondary",
		children?: React.ReactNode,
	) => (
		<CaretWelcomeSection
			headerKey={headerKey}
			bodyKey={bodyKey}
			buttonConfig={
				buttonTextKey && buttonHandler
					? {
							textKey: buttonTextKey,
							handler: buttonHandler,
							appearance: buttonAppearance,
						}
					: undefined
			}
			allowHtml={true}>
			{children}
		</CaretWelcomeSection>
	)

	return (
		<div
			data-testid="caret-welcome-view"
			data-overlay-version="caret"
			className="caret-welcome"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: "flex",
				flexDirection: "column",
			}}>
			<div
				style={{
					flex: 1,
					padding: "15px",
					overflowY: "auto",
				}}>
				<center style={{ marginBottom: "20px" }}>
					{/* Use caretBanner from ExtensionStateContext */}
					<img
						src={caretBanner}
						alt={t("bannerAlt", "welcome")}
						style={{
							maxWidth: "320px",
							margin: "5px 0 15px",
						}}
					/>
					<h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>{t("greeting", "welcome")}</h2>
					<p
						style={{
							color: "var(--vscode-descriptionForeground)",
							maxWidth: "600px",
							fontSize: "0.85rem",
							margin: "0 auto",
						}}>
						{t("catchPhrase", "welcome")}
					</p>
				</center>

				{renderSection("coreFeatures.header", "coreFeatures.description")}

				{!showApiOptions &&
					renderSection(
						"getStarted.header",
						"getStarted.body",
						apiErrorMessage ? "API 설정하기" : "getStarted.button",
						handleShowApiOptions,
						"primary",
					)}

				{renderSection("community.header", "community.body", "community.button", handleCaretAccountNotify, "secondary")}

				{renderSection("educationOffer.header", "educationOffer.body")}

				{showApiOptions && (
					<CaretApiSetup
						onSubmit={handleSubmitApiKey}
						onBack={handleHideApiOptions}
						disabled={disableLetsGoButton}
						errorMessage={apiErrorMessage || undefined}
					/>
				)}

				{/* Footer 컴포넌트 - 일반 페이지 하단 */}
				<CaretFooter />
			</div>
		</div>
	)
}

export default WelcomeView
