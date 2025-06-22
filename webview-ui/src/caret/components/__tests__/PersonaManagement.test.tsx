import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
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

			expect(caretWebviewLogger.debug).toHaveBeenCalledWith("Persona template selector button clicked")
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
})
