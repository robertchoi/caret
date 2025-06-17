import React from "react"
import { t, getGlobalLink } from "../utils/i18n"

const CaretFooter: React.FC = () => {
	return (
		<footer className="caret-footer">
			<div className="caret-footer-container">
				{/* 링크들을 가로로 배치 */}
				<div className="caret-footer-links-horizontal">
					<a
						href={getGlobalLink("CARET_GITHUB")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.caretGithub", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARET_SERVICE")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.caretService", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_COMPANY")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.caretiveInc", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_ABOUT")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.about", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_TERMS")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.terms", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_PRIVACY")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.privacy", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_YOUTH_PROTECTION")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.youthProtection", "welcome")}
					</a>
					<span className="caret-footer-separator"> | </span>
					<a
						href={getGlobalLink("CARETIVE_SUPPORT")}
						target="_blank"
						rel="noopener noreferrer"
						className="caret-footer-link">
						{t("footer.links.support", "welcome")}
					</a>
				</div>

				{/* 회사 정보 */}
				<div className="caret-footer-company-info">
					<p className="caret-footer-company-name">
						<strong>{t("footer.company.name", "welcome")}</strong>
					</p>
					<p className="caret-footer-business-info">{t("footer.company.businessNumber", "welcome")}</p>
					<p className="caret-footer-address">{t("footer.company.address", "welcome")}</p>
				</div>

				{/* 저작권 정보 */}
				<div className="caret-footer-copyright">
					<p>
						{t("footer.copyright.text", "welcome")} | Built with ❤️ by{" "}
						<a
							href={getGlobalLink("CARET_SERVICE")}
							target="_blank"
							rel="noopener noreferrer"
							className="caret-footer-link">
							Caret Team
						</a>
					</p>
					<p className="caret-footer-version">
						<small>{t("footer.copyright.version", "welcome")}</small>
					</p>
				</div>
			</div>
		</footer>
	)
}

export default CaretFooter
