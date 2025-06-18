import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom"
import CaretApiSetup from "../CaretApiSetup"
import { vscode } from "../../../utils/vscode"

// Mock dependencies
vi.mock("../../../utils/vscode")
vi.mock("../../../components/settings/ApiOptions", () => {
	return {
		default: function MockApiOptions({ showModelOptions }: { showModelOptions: boolean }) {
			return React.createElement(
				"div",
				{
					"data-testid": "api-options",
					"data-show-model-options": showModelOptions,
				},
				"Mock API Options",
			)
		},
	}
})

// Mock i18n
vi.mock("../../utils/i18n", () => ({
	t: (key: string, namespace: string) => `${namespace}.${key}`,
}))

const mockVscode = vscode as any

describe("CaretApiSetup", () => {
	const defaultProps = {
		onSubmit: vi.fn(),
		onBack: vi.fn(),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("should render correctly", () => {
		it("should render with default props", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			expect(screen.getByText("welcome.apiSetup.title")).toBeInTheDocument()
			expect(screen.getByText("welcome.apiSetup.description")).toBeInTheDocument()
			expect(screen.getByText("welcome.apiSetup.backButton")).toBeInTheDocument()
			expect(screen.getByText("welcome.apiSetup.saveButton")).toBeInTheDocument()
		})

		it("should render API options with showModelOptions true", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const apiOptions = screen.getByTestId("api-options")
			expect(apiOptions).toBeInTheDocument()
			expect(apiOptions).toHaveAttribute("data-show-model-options", "true")
		})

		it("should render support links section", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			expect(screen.getByText("welcome.apiSetup.instructions")).toBeInTheDocument()
			expect(screen.getByText("• welcome.apiSetup.supportLinks.llmList")).toBeInTheDocument()
			expect(screen.getByText("• welcome.apiSetup.supportLinks.geminiCredit")).toBeInTheDocument()
		})

		it("should render help section", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			expect(screen.getByText("welcome.apiSetup.help.title")).toBeInTheDocument()
			expect(screen.getByText("welcome.apiSetup.help.button")).toBeInTheDocument()
		})
	})

	describe("should handle button interactions", () => {
		it("should call onBack when back button is clicked", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const backButton = screen.getByText("welcome.apiSetup.backButton")
			fireEvent.click(backButton)

			expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
		})

		it("should call onSubmit when save button is clicked", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const saveButton = screen.getByText("welcome.apiSetup.saveButton")
			fireEvent.click(saveButton)

			expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
		})

		it("should call help button and open external link", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const helpButton = screen.getByText("welcome.apiSetup.help.button")
			fireEvent.click(helpButton)

			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "openExternalLink",
				link: "https://docs.caret.team",
			})
		})

		it("should open LLM list link when clicked", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const llmListLink = screen.getByText("• welcome.apiSetup.supportLinks.llmList")
			fireEvent.click(llmListLink)

			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "openExternalLink",
				link: "https://github.com/aicoding-caret/caret/blob/main/caret-docs/development/support-model-list.mdx",
			})
		})

		it("should open Gemini credit link when clicked", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const geminiCreditLink = screen.getByText("• welcome.apiSetup.supportLinks.geminiCredit")
			fireEvent.click(geminiCreditLink)

			expect(mockVscode.postMessage).toHaveBeenCalledWith({
				type: "openExternalLink",
				link: "https://blog.naver.com/fstory97/223887376667",
			})
		})
	})

	describe("should handle disabled state", () => {
		it("should disable save button when disabled prop is true", () => {
			render(
				React.createElement(CaretApiSetup, {
					...defaultProps,
					disabled: true,
				}),
			)

			const saveButton = screen.getByText("welcome.apiSetup.saveButton")
			expect(saveButton).toBeInTheDocument()
			expect(saveButton.tagName).toBe("VSCODE-BUTTON")
		})

		it("should enable save button when disabled prop is false", () => {
			render(
				React.createElement(CaretApiSetup, {
					...defaultProps,
					disabled: false,
				}),
			)

			const saveButton = screen.getByText("welcome.apiSetup.saveButton")
			expect(saveButton).not.toBeDisabled()
		})

		it("should enable save button by default when disabled prop is not provided", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const saveButton = screen.getByText("welcome.apiSetup.saveButton")
			expect(saveButton).not.toBeDisabled()
		})
	})

	describe("should handle error messages", () => {
		it("should not render error message when errorMessage is not provided", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const errorDiv = screen.queryByText("Test error message")
			expect(errorDiv).not.toBeInTheDocument()
		})

		it("should render error message when errorMessage is provided", () => {
			const errorMessage = "Test error message"
			render(
				React.createElement(CaretApiSetup, {
					...defaultProps,
					errorMessage,
				}),
			)

			expect(screen.getByText(errorMessage)).toBeInTheDocument()
		})
	})

	describe("should have correct CSS classes and styling", () => {
		it("should have correct root class name", () => {
			const { container } = render(React.createElement(CaretApiSetup, defaultProps))

			expect(container.querySelector(".caret-api-setup")).toBeInTheDocument()
		})

		it("should apply correct button appearance classes", () => {
			render(React.createElement(CaretApiSetup, defaultProps))

			const backButton = screen.getByText("welcome.apiSetup.backButton")
			const saveButton = screen.getByText("welcome.apiSetup.saveButton")
			const helpButton = screen.getByText("welcome.apiSetup.help.button")

			expect(backButton).toBeInTheDocument()
			expect(backButton.tagName).toBe("VSCODE-BUTTON")
			expect(saveButton).toBeInTheDocument()
			expect(saveButton.tagName).toBe("VSCODE-BUTTON")
			expect(helpButton).toBeInTheDocument()
			expect(helpButton.tagName).toBe("VSCODE-BUTTON")
		})
	})
})
