import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import PersonaManagement from "../PersonaManagement"
import type { TemplateCharacter } from "../../../../../src/shared/persona"

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
			common: {
				"rules.section.personaManagement": "Persona Management",
				"rules.button.selectPersonaTemplate": "Select Persona Template",
				"rules.button.changePersonaTemplate": "Change Persona Template",
			},
			persona: {
				normalState: "Normal",
				thinkingState: "Thinking",
				"upload.normal": "Upload Normal Image",
				"upload.thinking": "Upload Thinking Image",
				"upload.success": "Image uploaded successfully",
				"upload.error": "Failed to upload image",
			},
		},
	},
})

// Mock dependencies
vi.mock("@/caret/utils/webview-logger", () => ({
	caretWebviewLogger: {
		debug: vi.fn(),
		error: vi.fn(),
	},
}))

vi.mock("@/caret/utils/i18n", () => ({
	t: (key: string, namespace?: string) => {
		const translations: Record<string, string> = {
			"rules.section.personaManagement": "Persona Management",
			"rules.button.selectPersonaTemplate": "Select Template Character",
			"rules.button.changePersonaTemplate": "Change Template Character",
			"normalState": "Normal",
			"thinkingState": "Thinking",
			"upload.normal": "Upload Normal Image",
			"upload.thinking": "Upload Thinking Image",
			"upload.success": "Image uploaded successfully",
			"upload.error": "Failed to upload image",
		}
		return translations[key] || key
	},
}))

vi.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: vi.fn(),
	},
}))

vi.mock("../../context/ExtensionStateContext", () => ({
	ExtensionStateContext: {
		Consumer: ({ children }: any) => children({ chatSettings: { uiLanguage: "en" } }),
	},
}))

// Mock PersonaTemplateSelector component
vi.mock("../PersonaTemplateSelector", () => ({
	PersonaTemplateSelector: ({ isOpen, onClose, onSelectPersona }: any) => {
		if (!isOpen) return null
		return (
			<div data-testid="persona-selector">
				<div>selector.title</div>
				<button aria-label="Close" onClick={onClose}>
					Close
				</button>
				<button
					onClick={() =>
						onSelectPersona({
							persona: { name: "Test Persona" },
							language: { style: "Friendly" },
							emotion_style: { tone: "Warm" },
							behavior: { loyalty: "High" },
							signature_phrase: "Hello!",
						})
					}>
					Select Test Persona
				</button>
			</div>
		)
	},
}))

// Mock template character data
const mockTemplateCharacter: TemplateCharacter = {
	character: "sarang",
	en: {
		name: "Sarang",
		description: "AI assistant",
		customInstruction: {
			persona: {
				name: "Sarang",
				nickname: "Sarang",
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
		name: "사랑",
		description: "AI 비서",
		customInstruction: {} as any,
	},
	avatarUri: "asset:/sarang.png",
	thinkingAvatarUri: "asset:/sarang_thinking.png",
	introIllustrationUri: "asset:/sarang_intro.png",
	isDefault: true,
}

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe("PersonaManagement", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe("Component Rendering", () => {
		it("should render persona management section title", () => {
			render(<PersonaManagement />)
			expect(screen.getByText("Persona Management")).toBeInTheDocument()
		})

		it("should render select template character button", () => {
			render(<PersonaManagement />)
			const selectButton = screen.getByText("Select Template Character")
			expect(selectButton).toBeInTheDocument()
			expect(selectButton.tagName.toLowerCase()).toBe("vscode-button")
		})

		it("should apply custom className when provided", () => {
			const { container } = render(<PersonaManagement className="custom-class" />)
			const section = container.firstChild as HTMLElement
			expect(section).toHaveClass("custom-class")
		})

		it("should have consistent styling with Rules UI sections", () => {
			render(<PersonaManagement />)
			const title = screen.getByText("Persona Management")
			expect(title).toHaveClass("text-sm", "font-normal", "mb-2")
		})
	})

	describe("Button Interaction", () => {
		it("should call debug logger when select button is clicked", async () => {
			const { caretWebviewLogger } = await import("@/caret/utils/webview-logger")

			render(<PersonaManagement />)

			const selectButton = screen.getByText("Select Template Character")
			fireEvent.click(selectButton)

			expect(caretWebviewLogger.debug).toHaveBeenCalledWith("Persona template selector button clicked. Opening modal...")
		})

		it("should render VSCodeButton component", () => {
			render(<PersonaManagement />)
			const selectButton = screen.getByText("Select Template Character")
			expect(selectButton.tagName.toLowerCase()).toBe("vscode-button")
		})
	})

	describe("Internationalization", () => {
		it("should use i18n keys for all text content", () => {
			render(<PersonaManagement />)

			// Verify i18n keys are used
			expect(screen.getByText("Persona Management")).toBeInTheDocument()
			expect(screen.getByText("Select Template Character")).toBeInTheDocument()
		})
	})

	describe("Modal Functionality", () => {
		it("should open persona selector modal when button is clicked", async () => {
			render(<PersonaManagement />)

			const selectButton = screen.getByText("Select Template Character")

			// Initially modal should not be open
			expect(screen.queryByTestId("persona-selector")).not.toBeInTheDocument()

			// Click the button to open modal
			fireEvent.click(selectButton)

			// Modal should now be open
			await waitFor(() => {
				expect(screen.getByTestId("persona-selector")).toBeInTheDocument()
			})
		})

		it("should close modal when handleCloseSelector is called", async () => {
			const { caretWebviewLogger } = await import("@/caret/utils/webview-logger")

			render(<PersonaManagement />)

			const selectButton = screen.getByText("Select Template Character")

			// Open modal first
			fireEvent.click(selectButton)

			await waitFor(() => {
				expect(screen.getByTestId("persona-selector")).toBeInTheDocument()
			})

			// Find and click close button
			const closeButton = screen.getByLabelText("Close")
			fireEvent.click(closeButton)

			// Modal should be closed
			await waitFor(() => {
				expect(screen.queryByTestId("persona-selector")).not.toBeInTheDocument()
			})

			expect(caretWebviewLogger.debug).toHaveBeenCalledWith("Persona template selector modal closed.")
		})

		it("should handle persona selection and send message to backend", async () => {
			const { caretWebviewLogger } = await import("@/caret/utils/webview-logger")
			const { vscode } = await import("@/utils/vscode")

			render(<PersonaManagement />)

			const selectButton = screen.getByText("Select Template Character")

			// Open modal
			fireEvent.click(selectButton)

			await waitFor(() => {
				expect(screen.getByTestId("persona-selector")).toBeInTheDocument()
			})

			// Click the persona selection button
			const selectPersonaButton = screen.getByText("Select Test Persona")
			fireEvent.click(selectPersonaButton)

			// Verify the expected calls
			expect(caretWebviewLogger.debug).toHaveBeenCalledWith("Persona selected:", {
				persona: { name: "Test Persona" },
				language: { style: "Friendly" },
				emotion_style: { tone: "Warm" },
				behavior: { loyalty: "High" },
				signature_phrase: "Hello!",
			})

			expect(vscode.postMessage).toHaveBeenCalledWith({
				type: "UPDATE_PERSONA_CUSTOM_INSTRUCTION",
				payload: {
					personaInstruction: {
						persona: { name: "Test Persona" },
						language: { style: "Friendly" },
						emotion_style: { tone: "Warm" },
						behavior: { loyalty: "High" },
						signature_phrase: "Hello!",
					},
				},
			})

			// Modal should be closed after selection
			await waitFor(() => {
				expect(screen.queryByTestId("persona-selector")).not.toBeInTheDocument()
			})
		})
	})

	describe("Custom Image Upload Feature", () => {
		it("should show upload buttons when persona is selected", async () => {
			renderWithProviders(<PersonaManagement />)
			
			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockTemplateCharacter],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			await waitFor(() => {
				expect(screen.getByText("Upload Normal Image")).toBeInTheDocument()
				expect(screen.getByText("Upload Thinking Image")).toBeInTheDocument()
			})
		})

		it("should handle normal image upload button click", async () => {
			// Mock document.createElement to capture input creation
			const originalCreateElement = document.createElement
			const mockClick = vi.fn()
			const mockSetAttribute = vi.fn()
			
			const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
				if (tagName === 'input') {
					const input = originalCreateElement.call(document, tagName) as HTMLInputElement
					input.click = mockClick
					input.setAttribute = mockSetAttribute
					return input
				}
				return originalCreateElement.call(document, tagName)
			})

			renderWithProviders(<PersonaManagement />)
			
			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockTemplateCharacter],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			await waitFor(() => {
				const uploadButton = screen.getByText("Upload Normal Image")
				fireEvent.click(uploadButton)
			})

			// Should create input and set attributes
			expect(createElementSpy).toHaveBeenCalledWith('input')
			expect(mockSetAttribute).toHaveBeenCalledWith('data-testid', 'normal-image-input')
			expect(mockClick).toHaveBeenCalled()
			
			createElementSpy.mockRestore()
		})

		it("should handle thinking image upload button click", async () => {
			// Mock document.createElement to capture input creation
			const originalCreateElement = document.createElement
			const mockClick = vi.fn()
			const mockSetAttribute = vi.fn()
			
			const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
				if (tagName === 'input') {
					const input = originalCreateElement.call(document, tagName) as HTMLInputElement
					input.click = mockClick
					input.setAttribute = mockSetAttribute
					return input
				}
				return originalCreateElement.call(document, tagName)
			})

			renderWithProviders(<PersonaManagement />)
			
			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockTemplateCharacter],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			await waitFor(() => {
				const uploadButton = screen.getByText("Upload Thinking Image")
				fireEvent.click(uploadButton)
			})

			// Should create input and set attributes
			expect(createElementSpy).toHaveBeenCalledWith('input')
			expect(mockSetAttribute).toHaveBeenCalledWith('data-testid', 'thinking-image-input')
			expect(mockClick).toHaveBeenCalled()
			
			createElementSpy.mockRestore()
		})

		it("should show success message after successful upload", async () => {
			renderWithProviders(<PersonaManagement />)
			
			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockTemplateCharacter],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Simulate successful upload response
			act(() => {
				const successEvent = new MessageEvent("message", {
					data: {
						type: "UPLOAD_CUSTOM_PERSONA_IMAGE_RESPONSE",
						payload: {
							success: true,
							imageType: "normal",
							personaCharacter: "sarang",
						},
					},
				})
				window.dispatchEvent(successEvent)
			})

			await waitFor(() => {
				expect(screen.getByText("Image uploaded successfully")).toBeInTheDocument()
			})
		})

		it("should show error message after failed upload", async () => {
			renderWithProviders(<PersonaManagement />)
			
			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockTemplateCharacter],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Simulate failed upload response
			act(() => {
				const errorEvent = new MessageEvent("message", {
					data: {
						type: "UPLOAD_CUSTOM_PERSONA_IMAGE_RESPONSE",
						payload: {
							success: false,
							error: "File too large",
							imageType: "normal",
							personaCharacter: "sarang",
						},
					},
				})
				window.dispatchEvent(errorEvent)
			})

			await waitFor(() => {
				expect(screen.getByText("Failed to upload image")).toBeInTheDocument()
			})
		})
	})
})
