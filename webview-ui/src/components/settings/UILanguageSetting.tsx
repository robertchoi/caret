import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import React from "react"
import { ChatSettings } from "@shared/ChatSettings"

interface UILanguageSettingProps {
	chatSettings: ChatSettings
	setChatSettings: (settings: ChatSettings) => void
}

const UILanguageSetting: React.FC<UILanguageSettingProps> = ({ chatSettings, setChatSettings }) => {
	// CARET MODIFICATION: 최대한 간단한 디버깅
	alert("🔍 UILanguageSetting 렌더링!")
	console.log("🔍 [UILanguageSetting] chatSettings:", chatSettings)

	return (
		<div style={{ marginTop: "16px" }}>
			<label htmlFor="ui-language-dropdown" className="block mb-1 text-sm font-medium">
				UI 언어
			</label>
			<VSCodeDropdown
				id="ui-language-dropdown"
				currentValue={chatSettings.uiLanguage || "ko"}
				onChange={(e: any) => {
					const newUILanguage = e.target.value
					setChatSettings({
						...chatSettings,
						uiLanguage: newUILanguage,
					})
				}}
				style={{ width: "100%" }}>
				<VSCodeOption value="ko">🇰🇷 한국어 (Korean)</VSCodeOption>
				<VSCodeOption value="en">🇺🇸 English</VSCodeOption>
				<VSCodeOption value="ja">🇯🇵 日本語 (Japanese)</VSCodeOption>
				<VSCodeOption value="zh">🇨🇳 中文 (Chinese)</VSCodeOption>
			</VSCodeDropdown>
			<p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
				Caret의 사용자 인터페이스 요소(메뉴, 버튼, 메시지 등)에 사용되는 언어입니다.
			</p>
		</div>
	)
}

export default React.memo(UILanguageSetting)
