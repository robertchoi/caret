import React from "react"

const CaretFooter: React.FC = () => {
	return (
		<footer className="caret-footer">
			<div className="caret-footer-container">
				{/* 서비스 및 오픈소스 링크 */}
				<div className="caret-footer-company">
					<div className="caret-footer-links">
						<a 
							href="https://github.com/aicoding-caret/caret" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							Caret GitHub
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://github.com/cline/cline" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							Based on Cline
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caret.team" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							Caret Service
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caretive.ai" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							Caretive Inc
						</a>
					</div>

					{/* 회사 정책 및 지원 링크 */}
					<div className="caret-footer-policy-links">
						<a 
							href="https://caretive.ai/about" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							회사소개
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caretive.ai/terms" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							이용약관
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caretive.ai/privacy" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							개인정보처리방침
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caretive.ai/youth-protection" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							청소년보호정책
						</a>
						<span className="caret-footer-separator">•</span>
						<a 
							href="https://caretive.ai/support" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link"
						>
							고객센터
						</a>
					</div>
					
					<div className="caret-footer-company-info">
						<p className="caret-footer-company-name">
							<strong>Caretive INC</strong>
						</p>
						<p className="caret-footer-business-info">
							사업자등록번호: 459-81-03703
						</p>
						<p className="caret-footer-address">
							경기도 화성시 동탄순환대로 823, 4층 409-681호(영천동, 에이팩시티)
						</p>
					</div>
				</div>

				{/* 저작권 정보 */}
				<div className="caret-footer-copyright">
					<p>
						© 2025 Caretive INC. All rights reserved. | 
						Built with ❤️ by Caret Team | 
						Based on <a 
							href="https://github.com/cline/cline" 
							target="_blank" 
							rel="noopener noreferrer"
							className="caret-footer-link-inline"
						>
							Cline
						</a>
					</p>
					<p className="caret-footer-version">
						<small>Caret v1.0.0 (Cline 기반)</small>
					</p>
				</div>
			</div>
		</footer>
	)
}

export default CaretFooter 