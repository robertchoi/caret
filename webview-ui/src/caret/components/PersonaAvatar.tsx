import React, { useState, useEffect, useCallback } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import type { TemplateCharacter } from "../../../../src/shared/persona"
import { vscode } from "../../utils/vscode"
import { caretWebviewLogger } from "../utils/webview-logger"

interface PersonaAvatarProps {
	/**
	 * Current thinking state - when true, shows thinkingAvatarUri
	 * when false or undefined, shows normal avatarUri
	 */
	isThinking?: boolean
	/**
	 * Size of the avatar in pixels
	 * @default 32
	 */
	size?: number
	/**
	 * Additional CSS classes
	 */
	className?: string
	/**
	 * Additional styles
	 */
	style?: React.CSSProperties
	/**
	 * Test persona data for testing purposes
	 */
	testPersona?: TemplateCharacter | null
}

// CARET MODIFICATION: Loading fallback persona to show during data loading
const LOADING_PERSONA: TemplateCharacter = {
	character: "loading",
	avatarUri:
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTUiIGZpbGw9IiNkZGRkZGQiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIGZpbGw9IiM2NjY2NjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxMiIgcj0iMiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTAgMjAgUTE2IDI1IDIyIDIwIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjx0ZXh0IHg9IjE2IiB5PSI3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzY2NjY2NiI+Pz88L3RleHQ+Cjwvc3ZnPg==",
	thinkingAvatarUri:
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTUiIGZpbGw9IiNlZmY0ZmYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIGZpbGw9IiM2NjY2NjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxMiIgcj0iMiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTAgMjAgUTE2IDIyIDIyIDIwIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iNiIgcj0iMSIgZmlsbD0iIzY2NjY2NiIgb3BhY2l0eT0iMC44Ii8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iNSIgcj0iMS41IiBmaWxsPSIjNjY2NjY2IiBvcGFjaXR5PSIwLjYiLz4KPGNpcmNsZSBjeD0iMjIiIGN5PSI3IiByPSIwLjUiIGZpbGw9IiM2NjY2NjYiIG9wYWNpdHk9IjAuNCIvPgo8L3N2Zz4=",
	introIllustrationUri: "",
	en: { name: "Loading...", description: "Loading persona", customInstruction: {} as any },
	ko: { name: "로딩 중...", description: "페르소나 로딩 중", customInstruction: {} as any },
	isDefault: false,
}

export const PersonaAvatar: React.FC<PersonaAvatarProps> = ({
	isThinking = false,
	size = 32,
	className = "",
	style = {},
	testPersona = null,
}) => {
	// CARET MODIFICATION: 웰컴페이지처럼 window에서 직접 이미지 받는 방식으로 변경
	const [imageError, setImageError] = useState<boolean>(false)

	const extensionState = useExtensionState()
	const currentLocale = extensionState?.chatSettings?.uiLanguage || "en"

	// CARET MODIFICATION: 웰컴페이지처럼 ExtensionStateContext에서 직접 받기
	const { personaProfile, personaThinking } = extensionState

	// Handle image loading errors
	const handleImageError = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
			caretWebviewLogger.warn("PersonaAvatar: Image load error", {
				src: (e.target as HTMLImageElement).src,
				isThinking,
			})
			setImageError(true)
		},
		[isThinking],
	)

	// Reset image errors when thinking state changes
	useEffect(() => {
		setImageError(false)
	}, [isThinking, personaProfile, personaThinking])

	// CARET MODIFICATION: 직접 주입된 이미지 사용 (테스트 모드가 아닐 때)
	let imageUri: string
	let personaName: string

	if (testPersona !== null) {
		// 테스트 모드: 기존 방식 유지
		imageUri = isThinking ? testPersona.thinkingAvatarUri : testPersona.avatarUri
		const localeDetails = (testPersona[currentLocale as keyof typeof testPersona] as any) || testPersona.en
		personaName = localeDetails?.name || ""
	} else {
		// 프로덕션 모드: 직접 주입된 이미지 사용
		if (personaProfile && personaThinking) {
			// 페르소나 이미지가 있는 경우
			imageUri = isThinking ? personaThinking : personaProfile
			personaName = "오사랑" // 기본 페르소나는 사랑이
		} else {
			// 페르소나 이미지가 없는 경우 로딩 이미지 사용
			imageUri = isThinking ? LOADING_PERSONA.thinkingAvatarUri : LOADING_PERSONA.avatarUri
			const localeDetails = (LOADING_PERSONA[currentLocale as keyof typeof LOADING_PERSONA] as any) || LOADING_PERSONA.en
			personaName = localeDetails?.name || ""
		}
	}

	// 이미지 에러 시 loading persona의 이미지 사용
	if (imageError) {
		imageUri = isThinking ? LOADING_PERSONA.thinkingAvatarUri : LOADING_PERSONA.avatarUri
		const localeDetails = (LOADING_PERSONA[currentLocale as keyof typeof LOADING_PERSONA] as any) || LOADING_PERSONA.en
		personaName = localeDetails?.name || ""
	}

	const altText = `${personaName} ${isThinking ? "thinking" : "normal"}`

	// CARET MODIFICATION: Debug logging for image switching
	useEffect(() => {
		caretWebviewLogger.debug("PersonaAvatar: Direct injection mode", {
			personaName,
			isThinking,
			imageUri: imageUri ? imageUri.substring(0, 50) + "..." : "none",
			imageError,
			hasPersonaProfile: !!personaProfile,
			hasPersonaThinking: !!personaThinking,
			testMode: testPersona !== null,
		})
	}, [isThinking, personaName, imageUri, imageError, personaProfile, personaThinking, testPersona])

	return (
		<img
			src={imageUri}
			alt={altText}
			className={`persona-avatar ${className}`}
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				objectFit: "cover",
				border: "1px solid var(--vscode-settings-headerBorder)",
				flexShrink: 0,
				transition: "all 0.3s ease-in-out",
				...style,
			}}
			onError={handleImageError}
			data-testid="persona-avatar"
			data-thinking={isThinking}
			data-persona={personaName}
		/>
	)
}

export default PersonaAvatar
