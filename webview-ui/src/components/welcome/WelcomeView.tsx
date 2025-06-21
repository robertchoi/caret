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
import { ModelsServiceClient } from "@/services/grpc-client"
import { UpdateApiConfigurationRequest } from "@shared/proto/models"
import { convertApiConfigurationToProto } from "@shared/proto-conversions/models/api-configuration-conversion"

import CaretFooter from "@/caret/components/CaretFooter"
import PersonaTemplateSelector from "@/caret/components/PersonaTemplateSelector"
import { t } from "@/caret/utils/i18n"
import { CARET_URLS, getLocalizedUrl } from "@/caret/constants/urls"

const WelcomeView = () => {
	const { apiConfiguration, caretBanner } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)
	const [showPersonaSelector, setShowPersonaSelector] = useState(false)

	const disableLetsGoButton = !!apiErrorMessage

	const handleOpenLink = (link: string, linkName: string) => {
		vscode.postMessage({ type: "openExternalLink", link })
	}

	const handleSubmitApiKey = async () => {
		try {
			if (!apiConfiguration) return

			// gRPC를 통해 API configuration 저장 (원래 Cline 방식)
			const protoConfig = convertApiConfigurationToProto(apiConfiguration)
			await ModelsServiceClient.updateApiConfigurationProto(
				UpdateApiConfigurationRequest.create({
					apiConfiguration: protoConfig,
				}),
			)
			// API 설정 완료 후 자동으로 채팅 화면으로 이동
		} catch (error) {
			console.error("Failed to save API configuration:", error)
		}
	}

	const handleShowApiOptions = async () => {
		// If API is already configured, save and activate chat
		if (!apiErrorMessage && apiConfiguration) {
			try {
				const protoConfig = convertApiConfigurationToProto(apiConfiguration)
				await ModelsServiceClient.updateApiConfigurationProto(
					UpdateApiConfigurationRequest.create({
						apiConfiguration: protoConfig,
					}),
				)
			} catch (error) {
				console.error("Failed to save API configuration:", error)
			}
		} else {
			// Otherwise, show API setup
			setShowApiOptions(true)
		}
	}

	const handleHideApiOptions = () => {
		setShowApiOptions(false)
	}

	const handleGitHubLink = () => {
		handleOpenLink(CARET_URLS.CARET_GITHUB, "GitHub")
	}

	const handleShowPersonaSelector = () => {
		setShowPersonaSelector(true)
	}

	const handleHidePersonaSelector = () => {
		setShowPersonaSelector(false)
	}

	const handlePersonaSelect = (template: any, language: string) => {
		// TODO: 선택된 페르소나를 custom_instructions.md에 저장하는 로직 구현
		console.log("선택된 페르소나:", template, "언어:", language)
		// 임시로 log 메시지 타입을 사용하여 백엔드에 전달
		vscode.postMessage({
			type: "log",
			text: JSON.stringify({
				action: "SET_PERSONA",
				template,
				language,
			}),
		})
		setShowPersonaSelector(false)
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

	// API 설정 페이지를 완전히 별도 페이지로 렌더링
	if (showApiOptions) {
		return (
			<div
				data-testid="caret-api-setup-page"
				data-overlay-version="caret"
				className="caret-api-setup-page"
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					flexDirection: "column",
					backgroundColor: "var(--vscode-editor-background)",
				}}>
				<div
					style={{
						flex: 1,
						padding: "20px",
						overflowY: "auto",
					}}>
					{/* API 설정 컴포넌트 - 페이지 전체 */}
					<CaretApiSetup
						onSubmit={handleSubmitApiKey}
						onBack={handleHideApiOptions}
						disabled={disableLetsGoButton}
						errorMessage={apiErrorMessage || undefined}
					/>
				</div>
			</div>
		)
	}

	// 메인 웰컴 페이지
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
				</center>

				{renderSection("coreFeatures.header", "coreFeatures.description")}

				{renderSection("getStarted.header", "getStarted.body", "getStarted.button", handleShowApiOptions, "primary")}

				{renderSection("persona.header", "persona.body", "persona.button", handleShowPersonaSelector, "secondary")}

				{renderSection("community.header", "community.body", "community.githubLink", handleGitHubLink, "secondary")}

				{renderSection("educationOffer.header", "educationOffer.body")}

				{/* Footer 컴포넌트 - 일반 페이지 하단 */}
				<CaretFooter />
			</div>

			{/* PersonaTemplateSelector 모달 */}
			<PersonaTemplateSelector
				isVisible={showPersonaSelector}
				onSelect={handlePersonaSelect}
				onClose={handleHidePersonaSelector}
			/>
		</div>
	)
}

export default WelcomeView
