import React, { useState, useEffect } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import "../styles/PersonaTemplateSelector.css"

interface PersonaTemplate {
	character: string
	en: {
		name: string
		description: string
		customInstruction: any
	}
	ko: {
		name: string
		description: string
		customInstruction: any
	}
	avatarUri: string
	thinkingAvatarUri: string
	introIllustrationUri: string
	isDefault: boolean
}

interface PersonaTemplateSelectorProps {
	onSelect?: (template: PersonaTemplate, language: string) => void
	onClose?: () => void
	isVisible?: boolean
}

export const PersonaTemplateSelector: React.FC<PersonaTemplateSelectorProps> = ({ onSelect, onClose, isVisible = false }) => {
	const [selectedCharacter, setSelectedCharacter] = useState<string>("")
	const [templates, setTemplates] = useState<PersonaTemplate[]>([])
	const [loading, setLoading] = useState(true)
	const { chatSettings } = useExtensionState()

	// 더미 데이터 (개발 초기용 - 나중에 실제 JSON 파일 로드로 대체)
	const dummyTemplates: PersonaTemplate[] = [
		{
			character: "sarang",
			en: {
				name: "Oh Sarang",
				description:
					"A member of the K-pop idol group ETERNITY, she's a quirky engineering girl who's mastered not only singing and dancing, but also math and coding.",
				customInstruction: {
					persona: { name: "Oh Sarang", nickname: "Sarang", type: "Virtual Idol Assistant" },
					signature_phrase: "That's a variable. Emotions change like functions. 📈",
				},
			},
			ko: {
				name: "오사랑",
				description: "K-pop 아이돌 ETERNITY의 멤버이자, 춤과 노래는 물론 수학과 코딩까지 섭렵한 엉뚱한 공대 소녀.",
				customInstruction: {
					persona: { name: "오사랑", nickname: "사랑이", type: "Virtual Idol Assistant" },
					signature_phrase: "그건 변수지. 감정도 함수처럼 변하니까. 📈",
				},
			},
			avatarUri: "asset:/assets/template_characters/sarang.png",
			thinkingAvatarUri: "asset:/assets/template_characters/sarang_thinking.png",
			introIllustrationUri: "asset:/assets/template_characters/sarang_illust.png",
			isDefault: true,
		},
		{
			character: "ichika",
			en: {
				name: "Ichika Madobe",
				description:
					"A well-organized and dependable assistant based on Windows 11. Acts as a calm and tidy presence in your digital workspace.",
				customInstruction: {
					persona: { name: "Madobe Ichika", nickname: "Ichika", type: "OS-tan style assistant" },
					signature_phrase: "I'll take care of it. Let's tidy things up. 🪟",
				},
			},
			ko: {
				name: "마도베 이치카",
				description:
					"윈도우 11을 모티브로 한 깔끔하고 믿음직한 조수. 언제나 조용히, 하지만 정확하게 당신의 작업을 지원합니다.",
				customInstruction: {
					persona: { name: "마도베 이치카", nickname: "이치카", type: "OS-tan style assistant" },
					signature_phrase: "이치카가 도와드릴게요. 정리해볼까요? 🪟",
				},
			},
			avatarUri: "asset:/assets/template_characters/ichika.png",
			thinkingAvatarUri: "asset:/assets/template_characters/ichika_thinking.png",
			introIllustrationUri: "asset:/assets/template_characters/ichika_illust.png",
			isDefault: false,
		},
	]

	useEffect(() => {
		// 초기 로딩 시뮬레이션 (나중에 실제 JSON 파일 로드로 대체)
		const loadTemplates = async () => {
			setLoading(true)
			// TODO: 실제 template_characters.json 파일에서 로드
			await new Promise((resolve) => setTimeout(resolve, 500)) // 로딩 시뮬레이션
			setTemplates(dummyTemplates)

			// 기본 캐릭터 선택
			const defaultTemplate = dummyTemplates.find((t) => t.isDefault)
			if (defaultTemplate) {
				setSelectedCharacter(defaultTemplate.character)
			}
			setLoading(false)
		}

		if (isVisible) {
			loadTemplates()
		}
	}, [isVisible])

	const selectedTemplate = templates.find((t) => t.character === selectedCharacter)
	const currentLanguage = chatSettings?.preferredLanguage?.toLowerCase().includes("korean") ? "ko" : "en"
	const displayData = selectedTemplate ? selectedTemplate[currentLanguage as "en" | "ko"] : null

	const handleSelect = () => {
		if (selectedTemplate && onSelect) {
			onSelect(selectedTemplate, currentLanguage)
			onClose?.()
		}
	}

	if (!isVisible) {
		return null
	}

	return (
		<div className="persona-selector-overlay">
			<div className="persona-selector-modal">
				{/* 헤더 */}
				<div className="persona-selector-header">
					<h2>AI 페르소나 선택</h2>
					<button className="close-button" onClick={onClose} title="닫기">
						✕
					</button>
				</div>

				{loading ? (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<p>페르소나 로딩 중...</p>
					</div>
				) : (
					<div className="persona-selector-content">
						{/* 캐릭터 탭 */}
						<div className="character-tabs">
							{templates.map((template) => (
								<button
									key={template.character}
									className={`character-tab ${selectedCharacter === template.character ? "active" : ""}`}
									onClick={() => setSelectedCharacter(template.character)}>
									<img
										src={template.avatarUri}
										alt={template[currentLanguage as "en" | "ko"]?.name || template.character}
										className="character-avatar"
									/>
									<span className="character-name">
										{template[currentLanguage as "en" | "ko"]?.name || template.character}
									</span>
								</button>
							))}
						</div>

						{/* 선택된 캐릭터 정보 */}
						{displayData && typeof displayData === "object" && "name" in displayData && (
							<div className="character-info">
								<div className="character-illustration">
									<img
										src={selectedTemplate?.introIllustrationUri}
										alt={displayData.name}
										className="character-intro-image"
									/>
								</div>
								<div className="character-details">
									<h3>{displayData.name}</h3>
									<p className="character-description">{displayData.description}</p>

									<div className="character-preview">
										<h4>시그니처 문구</h4>
										<p className="signature-phrase">
											"{displayData.customInstruction?.signature_phrase || "No signature phrase available"}"
										</p>
									</div>
								</div>
							</div>
						)}

						{/* 액션 버튼 */}
						<div className="persona-selector-actions">
							<button className="select-button primary" onClick={handleSelect} disabled={!selectedTemplate}>
								이 페르소나 선택
							</button>
							<button className="cancel-button secondary" onClick={onClose}>
								취소
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default PersonaTemplateSelector
