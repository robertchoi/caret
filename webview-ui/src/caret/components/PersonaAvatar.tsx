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
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9InZhcigtLXZzY29kZS1idXR0b24tYmFja2dyb3VuZCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiPgo8cGF0aCBkPSJNOCA2QzggNC44OTU0MyA4Ljg5NTQzIDQgMTAgNEgxNEMxNS4xMDQ2IDQgMTYgNC44OTU0MyAxNiA2VjhDMTYgOS4xMDQ1NyAxNS4xMDQ2IDEwIDE0IDEwSDEwQzguODk1NDMgMTAgOCA5LjEwNDU3IDggOFY2WiIgZmlsbD0idmFyKC0tdnNjb2RlLWJ1dHRvbi1mb3JlZ3JvdW5kKSIvPgo8cGF0aCBkPSJNNiAxNEM2IDEyLjg5NTQgNi44OTU0MyAxMiA4IDEySDEyQzEzLjEwNDYgMTIgMTQgMTIuODk1NCAxNiAxNFYxNkMxNiAxNy4xMDQ2IDE1LjEwNDYgMTggMTQgMThIMThDMTkuMTA0NiAxOCAyMCAxOC44OTU0IDIwIDIwViAyMkMyMCAyMy4xMDQ2IDE5LjEwNDYgMjQgMTggMjRIMTBDOC44OTU0MyAyNCA4IDIzLjEwNDYgOCAyMlYyMEM4IDE4Ljg5NTQgNy4xMDQ1NyAxOCA2IDE4VjE2QzYgMTQuODk1NCA2IDE0IDYgMTRaIiBmaWxsPSJ2YXIoLS12c2NvZGUtYnV0dG9uLWZvcmVncm91bmQpIi8+Cjwvc3ZnPgo8L3N2Zz4K",
	thinkingAvatarUri:
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9InZhcigtLXZzY29kZS1jaGFydC1ibHVlKSIgb3BhY2l0eT0iMC44Ii8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjIiIGZpbGw9InZhcigtLXZzY29kZS1idXR0b24tZm9yZWdyb3VuZCkiLz4KPGNpcmNsZSBjeD0iMjIiIGN5PSIxMiIgcj0iMSIgZmlsbD0idmFyKC0tdnNjb2RlLWJ1dHRvbi1mb3JlZ3JvdW5kKSIvPgo8Y2lyY2xlIGN4PSIxOCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9InZhcigtLXZzY29kZS1idXR0b24tZm9yZWdyb3VuZCkiLz4KPC9zdmc+Cg==",
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
	// CARET MODIFICATION: Start with loading persona for non-test mode, then update when data loads
	const [selectedPersona, setSelectedPersona] = useState<TemplateCharacter | null>(testPersona || LOADING_PERSONA)
	const [imageError, setImageError] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(testPersona === null)

	const extensionState = useExtensionState()
	const currentLocale = extensionState?.chatSettings?.uiLanguage || "en"

	// Request current persona data when component mounts (only if not in test mode)
	useEffect(() => {
		if (testPersona === null) {
			caretWebviewLogger.debug("PersonaAvatar: Requesting current persona images")

			// Request current persona images from globalStorage
			vscode.postMessage({
				type: "REQUEST_PERSONA_IMAGES",
			})
		}
	}, [testPersona])

	// Listen for persona data updates
	useEffect(() => {
		if (testPersona !== null) {
			return // Skip message listening in test mode
		}

		const handleMessage = (event: MessageEvent) => {
			const message = event.data

			// Handle current persona images response
			if (message.type === "RESPONSE_PERSONA_IMAGES") {
				const personaData = message.payload
				caretWebviewLogger.debug("PersonaAvatar: Received current persona images:", personaData)

				// Create a persona object from the current images
				if (personaData && personaData.avatarUri && personaData.thinkingAvatarUri) {
					const currentPersona: TemplateCharacter = {
						character: "current",
						avatarUri: personaData.avatarUri,
						thinkingAvatarUri: personaData.thinkingAvatarUri,
						introIllustrationUri: "",
						en: { name: "Current Persona", description: "Your current persona", customInstruction: {} as any },
						ko: { name: "현재 페르소나", description: "현재 설정된 페르소나", customInstruction: {} as any },
						isDefault: false,
					}
					setSelectedPersona(currentPersona)
					setIsLoading(false)
				} else {
					caretWebviewLogger.warn("PersonaAvatar: Invalid persona images payload:", personaData)
				}
			}

			// Handle persona update - refresh data
			if (message.type === "PERSONA_UPDATED") {
				caretWebviewLogger.debug("PersonaAvatar: Persona updated, refreshing data")
				// Reload current persona images
				vscode.postMessage({
					type: "REQUEST_PERSONA_IMAGES",
				})
			}
		}

		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [currentLocale, testPersona])

	// Get persona name in current locale
	const getPersonaName = useCallback(() => {
		const persona = selectedPersona || LOADING_PERSONA // CARET MODIFICATION: Use LOADING_PERSONA as fallback
		const localeDetails = (persona[currentLocale as keyof typeof persona] as any) || persona.en
		return localeDetails?.name || ""
	}, [selectedPersona, currentLocale])

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

	// Reset image errors when thinking state or persona changes
	useEffect(() => {
		setImageError(false)
	}, [isThinking, selectedPersona])

	// CARET MODIFICATION: Use loading persona as fallback with extra safety
	const currentPersona = selectedPersona && selectedPersona.character ? selectedPersona : LOADING_PERSONA

	// CARET MODIFICATION: 단순한 2파일 시스템 - avatarUri 또는 thinkingAvatarUri만 사용
	let imageUri = isThinking ? currentPersona.thinkingAvatarUri : currentPersona.avatarUri

	// 이미지 에러 시 loading persona의 이미지 사용
	if (imageError) {
		imageUri = isThinking ? LOADING_PERSONA.thinkingAvatarUri : LOADING_PERSONA.avatarUri
	}

	const personaName = getPersonaName()
	const altText = `${personaName} ${isThinking ? "thinking" : "normal"}`

	// CARET MODIFICATION: Debug logging for image switching
	useEffect(() => {
		caretWebviewLogger.info("PersonaAvatar: Image state changed", {
			personaName,
			isThinking,
			imageUri,
			imageError,
			personaCharacter: currentPersona.character,
			avatarUri: currentPersona.avatarUri,
			thinkingAvatarUri: currentPersona.thinkingAvatarUri,
		})
	}, [isThinking, selectedPersona, personaName, imageUri, imageError, currentPersona])

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
			data-persona={currentPersona.character}
		/>
	)
}

export default PersonaAvatar
