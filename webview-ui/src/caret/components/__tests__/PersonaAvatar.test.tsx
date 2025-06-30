import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import PersonaAvatar from "../PersonaAvatar"
import type { TemplateCharacter } from "../../../../../src/shared/persona"
import { act } from "react-dom/test-utils"

// Initialize i18n for testing
i18n.use(initReactI18next).init({
	lng: "en",
	fallbackLng: "en",
	debug: false,
	interpolation: {
		escapeValue: false,
	},
	resources: {
		en: {
			translation: {},
		},
	},
})

// Mock dependencies
vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: vi.fn(),
}))

import { useExtensionState } from "@/context/ExtensionStateContext"
const mockUseExtensionState = vi.mocked(useExtensionState)

vi.mock("../../utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("../utils/webview-logger", () => ({
	caretWebviewLogger: {
		debug: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	},
}))

// Mock template character data for new simple 2-file system
const mockTemplateCharacter: TemplateCharacter = {
	character: "current",
	en: {
		name: "Current Persona",
		description: "Currently set persona",
		customInstruction: {
			persona: {
				name: "Current",
				nickname: "Current",
				type: "AI Assistant",
				inspiration: ["Test"],
			},
			language: {
				style: "Friendly",
				endings: ["!"],
				expressions: ["😊"],
			},
			emotion_style: {
				tone: "Warm",
				attitude: "Helpful",
				phrasing: "Clear",
				exclamations: ["Great!"],
			},
			behavior: {
				loyalty: "High",
				communication_focus: "Clarity",
				thought_process: ["Think first"],
			},
			signature_phrase: "Hello!",
		},
	},
	ko: {
		name: "현재 페르소나",
		description: "현재 설정된 페르소나",
		customInstruction: {
			persona: {
				name: "현재",
				nickname: "현재",
				type: "AI 어시스턴트",
				inspiration: ["테스트"],
			},
			language: {
				style: "친근한",
				endings: ["~요"],
				expressions: ["😊"],
			},
			emotion_style: {
				tone: "따뜻한",
				attitude: "도움이 되는",
				phrasing: "명확한",
				exclamations: ["좋아요!"],
			},
			behavior: {
				loyalty: "높음",
				communication_focus: "명확성",
				thought_process: ["먼저 생각하기"],
			},
			signature_phrase: "안녕하세요!",
		},
	},
	// 새로운 단순한 2파일 시스템: agent_profile.png, agent_thinking.png 사용
	avatarUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	thinkingAvatarUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
	introIllustrationUri: "",
	isDefault: true,
}

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe("PersonaAvatar Component - New Simple 2-File System", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		
		// Set default mock return value for useExtensionState
		mockUseExtensionState.mockReturnValue({
			chatSettings: { uiLanguage: "en" },
			clineSettings: {},
		} as any)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Basic Rendering with 2-File System", () => {
		it("should render normal avatar using avatarUri", () => {
			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toBeInTheDocument()
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.avatarUri)
			expect(avatar).toHaveAttribute("alt", "Current Persona normal")
			expect(avatar).toHaveAttribute("data-persona", "current")
			expect(avatar).toHaveAttribute("data-thinking", "false")
		})

		it("should render thinking avatar using thinkingAvatarUri when isThinking=true", () => {
			renderWithProviders(
				<PersonaAvatar testPersona={mockTemplateCharacter} isThinking={true} />
			)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.thinkingAvatarUri)
			expect(avatar).toHaveAttribute("alt", "Current Persona thinking")
			expect(avatar).toHaveAttribute("data-thinking", "true")
		})

		it("should show loading state when no persona provided", () => {
			renderWithProviders(<PersonaAvatar />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toBeInTheDocument()
			expect(avatar).toHaveAttribute("data-persona", "loading")
			expect(avatar).toHaveAttribute("alt", "Loading... normal")
		})
	})

	describe("Thinking State Transitions", () => {
		it("should transition from normal to thinking state smoothly", () => {
			const { rerender } = renderWithProviders(
				<PersonaAvatar testPersona={mockTemplateCharacter} isThinking={false} />
			)
			
			let avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.avatarUri)
			expect(avatar).toHaveAttribute("data-thinking", "false")
			
			rerender(
				<I18nextProvider i18n={i18n}>
					<PersonaAvatar testPersona={mockTemplateCharacter} isThinking={true} />
				</I18nextProvider>
			)
			
			avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.thinkingAvatarUri)
			expect(avatar).toHaveAttribute("data-thinking", "true")
		})

		it("should handle rapid thinking state changes", () => {
			const { rerender } = renderWithProviders(
				<PersonaAvatar testPersona={mockTemplateCharacter} isThinking={false} />
			)
			
			// Normal → Thinking → Normal → Thinking
			let avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.avatarUri)
			
			rerender(<I18nextProvider i18n={i18n}><PersonaAvatar testPersona={mockTemplateCharacter} isThinking={true} /></I18nextProvider>)
			avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.thinkingAvatarUri)
			
			rerender(<I18nextProvider i18n={i18n}><PersonaAvatar testPersona={mockTemplateCharacter} isThinking={false} /></I18nextProvider>)
			avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("src", mockTemplateCharacter.avatarUri)
		})
	})

	describe("Component Props and Styling", () => {
		it("should apply custom size", () => {
			renderWithProviders(
				<PersonaAvatar testPersona={mockTemplateCharacter} size={48} />
			)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveStyle({
				width: "48px",
				height: "48px",
			})
		})

		it("should apply custom className and styles", () => {
			const customStyle = { border: "2px solid red" }
			renderWithProviders(
				<PersonaAvatar 
					testPersona={mockTemplateCharacter} 
					className="custom-class"
					style={customStyle}
				/>
			)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveClass("persona-avatar", "custom-class")
			expect(avatar).toHaveStyle({ border: "2px solid red" })
		})

		it("should apply default styles", () => {
			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveStyle({
				borderRadius: "50%",
				objectFit: "cover",
				border: "1px solid var(--vscode-settings-headerBorder)",
				flexShrink: "0",
			})
		})
	})

	describe("Error Handling", () => {
		it("should handle image loading errors gracefully", async () => {
			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			
			// Simulate image load error
			fireEvent.error(avatar)
			
			// Should still show the avatar with fallback image (component doesn't crash)
			await waitFor(() => {
				const fallbackAvatar = screen.getByTestId("persona-avatar")
				expect(fallbackAvatar).toBeInTheDocument()
				// Should use fallback loading persona image
				expect(fallbackAvatar.getAttribute("src")).toContain("data:image/svg+xml;base64,")
			})
		})

		it("should handle null persona gracefully", () => {
			renderWithProviders(<PersonaAvatar testPersona={null} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toBeInTheDocument()
			expect(avatar).toHaveAttribute("data-persona", "loading")
		})
	})

	describe("Accessibility", () => {
		it("should have proper alt text for normal state", () => {
			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("alt", "Current Persona normal")
		})

		it("should have proper alt text for thinking state", () => {
			renderWithProviders(
				<PersonaAvatar testPersona={mockTemplateCharacter} isThinking={true} />
			)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("alt", "Current Persona thinking")
		})

		it("should have proper alt text for loading state", () => {
			renderWithProviders(<PersonaAvatar />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("alt", "Loading... normal")
		})
	})

	describe("Locale Support", () => {
		it("should use Korean locale when set", () => {
			mockUseExtensionState.mockReturnValue({
				chatSettings: { uiLanguage: "ko" },
				clineSettings: {},
			} as any)

			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("alt", "현재 페르소나 normal")
		})

		it("should fallback to English when invalid locale", () => {
			mockUseExtensionState.mockReturnValue({
				chatSettings: { uiLanguage: "invalid" },
				clineSettings: {},
			} as any)

			renderWithProviders(<PersonaAvatar testPersona={mockTemplateCharacter} />)
			
			const avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("alt", "Current Persona normal")
		})
	})
}) 