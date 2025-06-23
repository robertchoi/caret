import React, { useState, useEffect } from "react"
import { vscode } from "@/utils/vscode"
import { t } from "@/caret/utils/i18n"
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react"
import type { TemplateCharacter, PersonaInstruction } from "../../../../src/shared/persona"

interface PersonaTemplateSelectorProps {
	isOpen: boolean
	onClose: () => void
	onSelectPersona: (instruction: PersonaInstruction) => void
	currentLocale: string
	// For testing purposes
	testCharacters?: TemplateCharacter[]
}

export const PersonaTemplateSelector: React.FC<PersonaTemplateSelectorProps> = ({
	isOpen,
	onClose,
	onSelectPersona,
	currentLocale,
	testCharacters,
}) => {
	const [characters, setCharacters] = useState<TemplateCharacter[]>(testCharacters || [])
	const [selectedInstruction, setSelectedInstruction] = useState<string>("")

	useEffect(() => {
		vscode.postMessage({
			type: "REQUEST_TEMPLATE_CHARACTERS",
		})
		vscode.postMessage({
			type: "REQUEST_RULE_FILE_CONTENT",
			payload: { ruleName: "custom_instructions.md", isGlobal: true },
		})
	}, [])

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			if (message.type === "RESPONSE_TEMPLATE_CHARACTERS") {
				setCharacters(message.payload)
			}
			if (message.type === "RESPONSE_RULE_FILE_CONTENT" && message.payload.ruleName === "custom_instructions.md") {
				setSelectedInstruction(message.payload.content)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [])

	if (!isOpen) {
		return null
	}

	const handleSelect = (character: TemplateCharacter) => {
		const localeDetails = character[currentLocale as keyof typeof character] as any
		if (localeDetails && localeDetails.customInstruction) {
			onSelectPersona(localeDetails.customInstruction)
		}
		onClose()
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-[var(--vscode-sideBar-background)] rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold">{t("selector.title", "persona")}</h2>
					<VSCodeButton appearance="icon" aria-label="Close" onClick={onClose}>
						<span className="codicon codicon-close"></span>
					</VSCodeButton>
				</div>
				<p className="text-sm text-[var(--vscode-descriptionForeground)] mb-4">{t("selector.description", "persona")}</p>
				<VSCodeDivider />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
					{characters.map((char) => {
						const personaDetails = (char[currentLocale as keyof typeof char] as any) || char.en
						const isSelected = JSON.stringify(personaDetails.customInstruction, null, 2) === selectedInstruction
						return (
							<div
								key={char.character}
								className={`flex flex-col items-center p-4 border rounded-md ${isSelected ? "border-blue-500" : "border-[var(--vscode-settings-headerBorder)]"}`}>
								<img
									src={char.avatarUri}
									alt={personaDetails.name}
									className="w-24 h-24 rounded-full object-cover mb-2"
								/>
								<h3 className="font-bold text-center">{personaDetails.name}</h3>
								<p className="text-xs text-center text-[var(--vscode-descriptionForeground)] mb-4 h-10">
									{personaDetails.description}
								</p>
								<VSCodeButton onClick={() => handleSelect(char)} disabled={isSelected}>
									{isSelected
										? t("selector.selectedButtonText", "persona")
										: t("selector.selectButtonText", "persona")}
								</VSCodeButton>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
