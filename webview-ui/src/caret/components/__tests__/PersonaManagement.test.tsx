import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import PersonaManagement from "../PersonaManagement"

// Mock dependencies
vi.mock("@/caret/utils/webview-logger", () => ({
	caretWebviewLogger: {
		debug: vi.fn(),
		error: vi.fn(),
	},
}))

vi.mock("@/caret/utils/i18n", () => ({
	t: (key: string) => {
		const translations: Record<string, string> = {
			"rules.section.personaManagement": "Persona Management",
			"rules.button.selectPersonaTemplate": "Select Template Character",
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

describe("PersonaManagement", () => {
	beforeEach(() => {
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
})
