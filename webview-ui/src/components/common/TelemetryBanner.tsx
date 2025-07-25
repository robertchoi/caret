import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { memo, useState } from "react"
import styled from "styled-components"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"
import { TelemetrySetting } from "@shared/TelemetrySetting"
import { t } from "@/caret/utils/i18n"

const BannerContainer = styled.div`
	background-color: var(--vscode-banner-background);
	padding: 12px 20px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	flex-shrink: 0;
	margin-bottom: 6px;
	position: relative;
`

const CloseButton = styled.button`
	position: absolute;
	top: 12px;
	right: 12px;
	background: none;
	border: none;
	color: var(--vscode-foreground);
	cursor: pointer;
	font-size: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px;
	opacity: 0.7;
	&:hover {
		opacity: 1;
	}
`

const ButtonContainer = styled.div`
	display: flex;
	gap: 8px;
	width: 100%;

	& > vscode-button {
		flex: 1;
	}
`

const TelemetryBanner = () => {
	const { navigateToSettings } = useExtensionState()

	const handleOpenSettings = () => {
		handleClose()
		navigateToSettings()
	}

	const handleClose = () => {
		vscode.postMessage({ type: "telemetrySetting", telemetrySetting: "enabled" satisfies TelemetrySetting })
	}

	return (
		<BannerContainer>
			<CloseButton onClick={handleClose} aria-label={t("telemetry.closeBannerAria", "common")}>
				✕
			</CloseButton>
			<div>
				<strong>{t("telemetry.helpImprove", "common")}</strong>
				<i>
					<br />
					{t("telemetry.experimentalFeatures", "common")}
				</i>
				<div style={{ marginTop: 4 }}>
					{t("telemetry.description", "common")}
					<div style={{ marginTop: 4 }}>
						{t("telemetry.settingsLink", "common")}{" "}
						<VSCodeLink href="#" onClick={handleOpenSettings}>
							{t("settingsView.title", "settings")}
						</VSCodeLink>
						.
					</div>
				</div>
			</div>
		</BannerContainer>
	)
}

export default memo(TelemetryBanner)
