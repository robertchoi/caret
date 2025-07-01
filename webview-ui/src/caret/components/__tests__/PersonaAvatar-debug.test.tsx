import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import PersonaAvatar from "../PersonaAvatar"

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

// Mock vscode API - correct path from PersonaAvatar's perspective
vi.mock("../../../utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

// Import mocked vscode after mocking
import { vscode } from "../../../utils/vscode"
const mockPostMessage = vi.mocked(vscode.postMessage)

// Mock webview logger to prevent it from calling vscode.postMessage
vi.mock("../utils/webview-logger", () => ({
	caretWebviewLogger: {
		debug: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	},
	LogLevel: {
		DEBUG: "debug",
		INFO: "info", 
		WARN: "warn",
		ERROR: "error",
	},
}))

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe("PersonaAvatar Debug Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		
		// Set default mock return value for useExtensionState
		mockUseExtensionState.mockReturnValue({
			chatSettings: { uiLanguage: "en" },
			clineSettings: {},
		} as any)
	})

	it("should render with loading state", () => {
		// Act - explicitly pass null for testPersona
		renderWithProviders(<PersonaAvatar testPersona={null} />)

		// Assert
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toBeInTheDocument()
		expect(avatar).toHaveAttribute("data-persona", "loading")
		expect(avatar).toHaveAttribute("alt", "Loading... normal")
	})

	it("should call vscode.postMessage when testPersona is null", () => {
		// Act - explicitly pass null for testPersona
		renderWithProviders(<PersonaAvatar testPersona={null} />)

		// Assert - PersonaAvatar calls REQUEST_PERSONA_IMAGES + logger calls for logs
		expect(mockPostMessage).toHaveBeenCalledTimes(2)
		
		// Check that REQUEST_PERSONA_IMAGES was called
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "REQUEST_PERSONA_IMAGES",
		})
		
		// Check that logging was called  
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "log",
			entry: expect.objectContaining({
				component: "Caret",
				level: "info",
				message: "PersonaAvatar: Image state changed",
			}),
		})
	})

	it("should NOT call REQUEST_PERSONA_IMAGES when testPersona is provided", () => {
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

		// Assert - Should only call logger (1 time), NOT REQUEST_PERSONA_IMAGES
		expect(mockPostMessage).toHaveBeenCalledTimes(1)
		
		// Should only call logging, not REQUEST_PERSONA_IMAGES
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "log",
			entry: expect.objectContaining({
				component: "Caret",
				level: "info",
				message: "PersonaAvatar: Image state changed",
			}),
		})
		
		// Should NOT call REQUEST_PERSONA_IMAGES
		expect(mockPostMessage).not.toHaveBeenCalledWith({
			type: "REQUEST_PERSONA_IMAGES",
		})
		
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toHaveAttribute("data-persona", "test")
		expect(avatar).toHaveAttribute("src", "test://avatar.png")
	})

	it("should render without testPersona prop (undefined case)", () => {
		// Act - render without testPersona prop (should default to null internally)
		renderWithProviders(<PersonaAvatar />)

		// Assert
		const avatar = screen.getByTestId("persona-avatar")
		expect(avatar).toBeInTheDocument()
		expect(avatar).toHaveAttribute("data-persona", "loading")
		
		// Should call vscode.postMessage twice (REQUEST_PERSONA_IMAGES + logging)
		expect(mockPostMessage).toHaveBeenCalledTimes(2)
		
		// Check that REQUEST_PERSONA_IMAGES was called
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "REQUEST_PERSONA_IMAGES",
		})
		
		// Check that logging was called  
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: "log",
			entry: expect.objectContaining({
				component: "Caret",
				level: "info",
				message: "PersonaAvatar: Image state changed",
			}),
		})
	})
}) 