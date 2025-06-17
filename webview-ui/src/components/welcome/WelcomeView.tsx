// CARET MODIFICATION: 이 파일은 Caret 프로젝트에서 수정되었습니다.
// 원본 Cline WelcomeView.tsx는 WelcomeView-tsx.cline 파일로 백업되어 있습니다.
// Caret 전용 웰컴 페이지를 표시하도록 수정되었습니다.

import React from 'react'
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { validateApiConfiguration } from "@utils/validate"
import { vscode } from "@utils/vscode"
import ApiOptions from "@components/settings/ApiOptions"
import CaretWelcome from "@/caret/components/CaretWelcome"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)
	const [showCaretWelcome, setShowCaretWelcome] = useState(true)

	const disableLetsGoButton = apiErrorMessage !== null

	const handleSubmitApiKey = () => {
		// Use a more generic message posting for now
		console.log("API Configuration submitted:", apiConfiguration)
		// TODO: Implement proper API configuration message handling
	}

	const handleShowApiOptions = () => {
		setShowApiOptions(true)
		setShowCaretWelcome(false)
	}

	const handleCaretGetStarted = () => {
		console.log("Caret Welcome: Get Started clicked")
		setShowCaretWelcome(false)
		setShowApiOptions(true)
	}

	const handleBackToWelcome = () => {
		setShowCaretWelcome(true)
		setShowApiOptions(false)
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	// Show Caret Welcome Page first
	if (showCaretWelcome) {
		return <CaretWelcome onGetStarted={handleCaretGetStarted} />
	}

	// Show API Configuration
	return (
		<div
			data-testid="caret-welcome-view"
			data-overlay-version="caret"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				padding: "20px",
				display: "flex",
				flexDirection: "column",
				background: "var(--vscode-editor-background)",
				color: "var(--vscode-editor-foreground)",
			}}>
			<div
				style={{
					height: "100%",
					overflowY: "auto",
					maxWidth: "600px",
					margin: "0 auto",
					width: "100%",
				}}>
				
				{/* Header with back button */}
				<div style={{ marginBottom: "30px", textAlign: "center" }}>
					<VSCodeButton 
						appearance="secondary" 
						onClick={handleBackToWelcome}
						style={{ marginBottom: "20px" }}
					>
						← 뒤로 가기
					</VSCodeButton>
					<div style={{ fontSize: "2rem", margin: "10px 0 20px" }}>^</div>
					<h2>🔧 API 설정</h2>
					<p style={{ color: "var(--vscode-descriptionForeground)", fontSize: "1.1em" }}>
						Caret을 사용하기 위해 AI API를 설정해주세요.
					</p>
				</div>

				{/* API Configuration Section */}
				<div style={{ 
					padding: "20px", 
					border: "1px solid var(--vscode-panel-border)", 
					borderRadius: "8px", 
					backgroundColor: "var(--vscode-panel-background)",
					marginBottom: "20px"
				}}>
					<h3>API 키 설정</h3>
					<p style={{ marginBottom: "20px", color: "var(--vscode-descriptionForeground)" }}>
						OpenAI, Anthropic, 또는 기타 AI 서비스의 API 키를 설정하거나 로컬 LLM을 구성하세요.
					</p>
					
					<ApiOptions showModelOptions={true} />
					
					<VSCodeButton 
						onClick={handleSubmitApiKey} 
						disabled={disableLetsGoButton} 
						appearance="primary"
						style={{ width: "100%", marginTop: "20px" }}
					>
						저장하고 시작하기
					</VSCodeButton>
					
					{apiErrorMessage && (
						<div style={{ 
							marginTop: "15px", 
							padding: "10px", 
							backgroundColor: "var(--vscode-inputValidation-errorBackground)",
							border: "1px solid var(--vscode-inputValidation-errorBorder)",
							borderRadius: "4px",
							color: "var(--vscode-inputValidation-errorForeground)"
						}}>
							{apiErrorMessage}
						</div>
					)}
				</div>

				{/* Help Section */}
				<div style={{ 
					padding: "20px", 
					border: "1px solid var(--vscode-panel-border)", 
					borderRadius: "8px", 
					backgroundColor: "var(--vscode-panel-background)",
					textAlign: "center"
				}}>
					<h4>도움이 필요하신가요?</h4>
					<p style={{ color: "var(--vscode-descriptionForeground)", marginBottom: "15px" }}>
						API 설정에 대한 자세한 가이드는 GitHub 저장소를 참조하세요.
					</p>
					<VSCodeButton 
						appearance="secondary"
						onClick={() => {
							console.log("Opening external link: https://github.com/aicoding-caret/caret")
							// TODO: Implement proper external link opening
						}}
					>
						GitHub에서 도움말 보기
					</VSCodeButton>
				</div>
			</div>
		</div>
	)
}

export default WelcomeView
