import React from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

interface CaretWelcomeProps {
	onGetStarted?: () => void
}

const CaretWelcome: React.FC<CaretWelcomeProps> = ({ onGetStarted }) => {
	const handleGetStarted = () => {
		console.log("Caret Welcome: Get Started clicked")
		if (onGetStarted) {
			onGetStarted()
		}
	}

	return (
		<div className="caret-welcome">
			<div className="caret-welcome-container">
				{/* Caret 로고 및 브랜딩 */}
				<div className="caret-header">
					<h1 className="caret-title">🥕 Caret</h1>
					<p className="caret-subtitle">
						개인화된 AI 개발 파트너십을 위한 VSCode 확장
					</p>
					<p className="caret-description">
						Caret은 Cline을 기반으로 한 Fork 프로젝트로, 
						더욱 개인화되고 효율적인 AI 코딩 경험을 제공합니다.
					</p>
				</div>

				{/* 주요 기능 소개 */}
				<div className="caret-features">
					<h2>✨ 주요 기능</h2>
					<ul className="caret-feature-list">
						<li>🤖 <strong>AI 개발 파트너십:</strong> 개인화된 AI 어시스턴트</li>
						<li>🔧 <strong>Fork 기반 아키텍처:</strong> Cline 코어 + Caret 확장</li>
						<li>🌐 <strong>한글 지원:</strong> 완전한 한국어 인터페이스</li>
						<li>📝 <strong>스마트 로깅:</strong> 개발 과정 추적 및 분석</li>
					</ul>
				</div>

				{/* 시작하기 버튼 */}
				<div className="caret-actions">
					<VSCodeButton 
						onClick={handleGetStarted}
						appearance="primary"
					>
						시작하기
					</VSCodeButton>
				</div>

				{/* 개발 정보 */}
				<div className="caret-info">
					<p className="caret-version">
						<small>Caret v1.0.0 (Cline 기반)</small>
					</p>
					<p className="caret-credits">
						<small>
							Built with ❤️ by Caret Team | 
							Based on <a href="https://github.com/cline/cline" target="_blank" rel="noopener noreferrer">Cline</a>
						</small>
					</p>
				</div>
			</div>
		</div>
	)
}

export default CaretWelcome 