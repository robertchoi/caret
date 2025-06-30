import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

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

vi.mock("../utils/webview-logger", () => ({
	caretWebviewLogger: {
		debug: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	},
}))

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

// Test the actual implementation
describe("PersonaAvatar Simple Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		
		// Set default mock return value for useExtensionState
		mockUseExtensionState.mockReturnValue({
			chatSettings: { uiLanguage: "en" },
			clineSettings: {},
		} as any)
	})

	it("should render with testPersona", async () => {
		// Import PersonaAvatar after mocks are set up
		const { default: PersonaAvatar } = await import("../PersonaAvatar")
		
		// Arrange
		const testPersona = {
			character: "test",
			avatarUri: "test://avatar.png",
			thinkingAvatarUri: "test://thinking.png",
			introIllustrationUri: "",
			en: { name: "Test", description: "Test persona", customInstruction: {} as any },
			ko: { name: "테스트", description: "테스트 페르소나", customInstruction: {} as any },
			isDefault: false,
		}

		// Act
		renderWithProviders(<PersonaAvatar testPersona={testPersona} />)

		// Assert
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toBeInTheDocument()
		expect(avatar).toHaveAttribute("data-persona", "test")
		expect(avatar).toHaveAttribute("src", "test://avatar.png")
		expect(avatar).toHaveAttribute("alt", "Test normal")
	})

	it("should render loading state", async () => {
		// Import PersonaAvatar after mocks are set up
		const { default: PersonaAvatar } = await import("../PersonaAvatar")

		// Act
		renderWithProviders(<PersonaAvatar testPersona={null} />)

		// Assert
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toBeInTheDocument()
		expect(avatar).toHaveAttribute("data-persona", "loading")
		expect(avatar).toHaveAttribute("alt", "Loading... normal")
	})

	it("should use thinking state correctly", async () => {
		// Import PersonaAvatar after mocks are set up
		const { default: PersonaAvatar } = await import("../PersonaAvatar")
		
		// Arrange
		const testPersona = {
			character: "test",
			avatarUri: "test://avatar.png",
			thinkingAvatarUri: "test://thinking.png",
			introIllustrationUri: "",
			en: { name: "Test", description: "Test persona", customInstruction: {} as any },
			ko: { name: "테스트", description: "테스트 페르소나", customInstruction: {} as any },
			isDefault: false,
		}

		// Act
		renderWithProviders(<PersonaAvatar testPersona={testPersona} isThinking={true} />)

		// Assert
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toBeInTheDocument()
		expect(avatar).toHaveAttribute("data-thinking", "true")
		expect(avatar).toHaveAttribute("src", "test://thinking.png")
		expect(avatar).toHaveAttribute("alt", "Test thinking")
	})
}) 