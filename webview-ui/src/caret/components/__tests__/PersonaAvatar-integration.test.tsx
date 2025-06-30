import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import PersonaAvatar from "../PersonaAvatar"
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

describe("PersonaAvatar Component - Frontend-Backend Integration", () => {
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

	describe("Template Characters Request Flow", () => {
		it("should request template characters on mount", () => {
			// Act
			renderWithProviders(<PersonaAvatar />)

			// Assert
			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "REQUEST_TEMPLATE_CHARACTERS",
			})
		})

		it("should not request template characters when testPersona is provided", () => {
			// Arrange
			const testPersona: TemplateCharacter = {
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

			// Assert - Should only call logger (1 time), NOT REQUEST_TEMPLATE_CHARACTERS
			expect(mockPostMessage).toHaveBeenCalledTimes(1)
			
			// Should only call logging, not REQUEST_TEMPLATE_CHARACTERS
			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "log",
				entry: expect.objectContaining({
					component: "Caret",
					level: "info",
					message: "PersonaAvatar: Image state changed",
				}),
			})
			
			// Should NOT call REQUEST_TEMPLATE_CHARACTERS
			expect(mockPostMessage).not.toHaveBeenCalledWith({
				type: "REQUEST_TEMPLATE_CHARACTERS",
			})
		})

		it("should update avatar when template characters response is received", async () => {
			// Arrange
			const mockPersona: TemplateCharacter = {
				character: "current",
				avatarUri: "data:image/png;base64,ProfileImageData",
				thinkingAvatarUri: "data:image/png;base64,ThinkingImageData",
				introIllustrationUri: "",
				en: { name: "Current Persona", description: "Currently set persona", customInstruction: {} as any },
				ko: { name: "현재 페르소나", description: "현재 설정된 페르소나", customInstruction: {} as any },
				isDefault: true,
			}

			// Act
			renderWithProviders(<PersonaAvatar />)

			// Initially should show loading
			let avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("data-persona", "loading")

			// Simulate receiving template characters
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockPersona],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Assert
			await waitFor(() => {
				const updatedAvatar = screen.getByTestId("persona-avatar")
				expect(updatedAvatar).toHaveAttribute("data-persona", "current")
				expect(updatedAvatar).toHaveAttribute("src", "data:image/png;base64,ProfileImageData")
				expect(updatedAvatar).toHaveAttribute("alt", "Current Persona normal")
			})
		})

		it("should handle empty template characters response", async () => {
			// Act
			renderWithProviders(<PersonaAvatar />)

			// Simulate receiving empty response
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Assert - should stay in loading state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("data-persona", "loading")
			})
		})
	})

	describe("Persona Update Flow", () => {
		it("should refresh data when PERSONA_UPDATED message is received", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)
			vi.clearAllMocks() // Clear the initial REQUEST_TEMPLATE_CHARACTERS call

			// Act
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "PERSONA_UPDATED",
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Assert
			await waitFor(() => {
				expect(mockPostMessage).toHaveBeenCalledWith({
					type: "REQUEST_TEMPLATE_CHARACTERS",
				})
			})
		})

		it("should handle rapid persona updates", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)
			vi.clearAllMocks()

			// Act - Send multiple PERSONA_UPDATED messages
			for (let i = 0; i < 5; i++) {
				act(() => {
					const mockEvent = new MessageEvent("message", {
						data: {
							type: "PERSONA_UPDATED",
						},
					})
					window.dispatchEvent(mockEvent)
				})
			}

			// Assert
			await waitFor(() => {
				expect(mockPostMessage).toHaveBeenCalledTimes(5)
				expect(mockPostMessage).toHaveBeenCalledWith({
					type: "REQUEST_TEMPLATE_CHARACTERS",
				})
			})
		})
	})

	describe("Thinking State with Backend Data", () => {
		it("should use correct image URLs based on thinking state with real backend data", async () => {
			// Arrange
			const mockPersona: TemplateCharacter = {
				character: "luna",
				avatarUri: "data:image/png;base64,LunaNormalImage",
				thinkingAvatarUri: "data:image/png;base64,LunaThinkingImage",
				introIllustrationUri: "",
				en: { name: "Luna", description: "Luna persona", customInstruction: {} as any },
				ko: { name: "루나", description: "루나 페르소나", customInstruction: {} as any },
				isDefault: false,
			}

			const { rerender } = renderWithProviders(<PersonaAvatar />)

			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [mockPersona],
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Assert normal state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,LunaNormalImage")
				expect(avatar).toHaveAttribute("data-thinking", "false")
			})

			// Act - Switch to thinking state
			rerender(
				<I18nextProvider i18n={i18n}>
					<PersonaAvatar isThinking={true} />
				</I18nextProvider>
			)

			// Assert thinking state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,LunaThinkingImage")
				expect(avatar).toHaveAttribute("data-thinking", "true")
			})
		})
	})

	describe("Custom Image Upload Integration", () => {
		it("should display uploaded custom images after backend processing", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Simulate initial persona load
			const initialPersona: TemplateCharacter = {
				character: "current",
				avatarUri: "data:image/png;base64,OriginalImage",
				thinkingAvatarUri: "data:image/png;base64,OriginalThinking",
				introIllustrationUri: "",
				en: { name: "Current", description: "Current persona", customInstruction: {} as any },
				ko: { name: "현재", description: "현재 페르소나", customInstruction: {} as any },
				isDefault: true,
			}

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [initialPersona],
					},
				}))
			})

			// Assert initial state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,OriginalImage")
			})

			// Act - Simulate custom image upload result (after backend processing)
			const updatedPersona: TemplateCharacter = {
				...initialPersona,
				avatarUri: "data:image/png;base64,UploadedCustomImage",
				thinkingAvatarUri: "data:image/png;base64,UploadedCustomThinking",
			}

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [updatedPersona],
					},
				}))
			})

			// Assert updated state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,UploadedCustomImage")
			})
		})

		it("should handle upload success notification", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Act - Simulate upload success message
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "PERSONA_IMAGE_UPLOAD_SUCCESS",
						payload: {
							imageType: "normal",
							message: "Image uploaded successfully",
						},
					},
				})
				window.dispatchEvent(mockEvent)
			})

			// Assert - Component should still be rendered (no crash)
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toBeInTheDocument()
			})
		})
	})

	describe("Error Handling Integration", () => {
		it("should handle malformed backend messages gracefully", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Act - Send malformed messages
			const malformedMessages = [
				{ type: "RESPONSE_TEMPLATE_CHARACTERS" }, // Missing payload
				{ type: "RESPONSE_TEMPLATE_CHARACTERS", payload: null }, // Null payload
				{ type: "RESPONSE_TEMPLATE_CHARACTERS", payload: "invalid" }, // Invalid payload type
				{ type: "RESPONSE_TEMPLATE_CHARACTERS", payload: [{ invalidData: true }] }, // Invalid persona structure
			]

			for (const message of malformedMessages) {
				act(() => {
					window.dispatchEvent(new MessageEvent("message", { data: message }))
				})
			}

			// Assert - Component should still be rendered and stable (no crash)
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toBeInTheDocument()
				// Should fallback to loading persona or at least not crash
				const personaAttr = avatar.getAttribute("data-persona")
				expect(personaAttr === "loading" || personaAttr === null).toBe(true)
			})
		})

		it("should handle image load errors from backend data", async () => {
			// Arrange
			const personaWithInvalidImage: TemplateCharacter = {
				character: "broken",
				avatarUri: "invalid://broken-image.png",
				thinkingAvatarUri: "invalid://broken-thinking.png",
				introIllustrationUri: "",
				en: { name: "Broken", description: "Broken persona", customInstruction: {} as any },
				ko: { name: "깨진", description: "깨진 페르소나", customInstruction: {} as any },
				isDefault: false,
			}

			renderWithProviders(<PersonaAvatar />)

			// Act - Send persona with invalid image URLs
			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [personaWithInvalidImage],
					},
				}))
			})

			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "invalid://broken-image.png")
			})

			// Act - Simulate image load error
			const avatar = screen.getByTestId("persona-avatar")
			fireEvent.error(avatar)

			// Assert - Component should handle error gracefully with fallback image
			await waitFor(() => {
				// Component should show fallback loading persona image
				const fallbackAvatar = screen.getByTestId("persona-avatar")
				expect(fallbackAvatar).toBeInTheDocument()
				expect(fallbackAvatar.getAttribute("src")).toContain("data:image/svg+xml;base64,")
			})
		})
	})

	describe("Locale Support Integration", () => {
		it("should display correct persona names based on backend locale data", async () => {
			// Arrange
			const multiLocalePersona: TemplateCharacter = {
				character: "multilang",
				avatarUri: "data:image/png;base64,TestImage",
				thinkingAvatarUri: "data:image/png;base64,TestThinking",
				introIllustrationUri: "",
				en: { name: "English Name", description: "English description", customInstruction: {} as any },
				ko: { name: "한국어 이름", description: "한국어 설명", customInstruction: {} as any },
				isDefault: false,
			}

			// Test English locale
			mockUseExtensionState.mockReturnValue({
				chatSettings: { uiLanguage: "en" },
				clineSettings: {},
			} as any)

			const { rerender } = renderWithProviders(<PersonaAvatar />)

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [multiLocalePersona],
					},
				}))
			})

			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("alt", "English Name normal")
			})

			// Test Korean locale
			mockUseExtensionState.mockReturnValue({
				chatSettings: { uiLanguage: "ko" },
				clineSettings: {},
			} as any)

			rerender(
				<I18nextProvider i18n={i18n}>
					<PersonaAvatar />
				</I18nextProvider>
			)

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [multiLocalePersona],
					},
				}))
			})

			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("alt", "한국어 이름 normal")
			})
		})
	})

	describe("Performance and Memory", () => {
		it("should properly cleanup event listeners", () => {
			// Arrange
			const { unmount } = renderWithProviders(<PersonaAvatar />)

			// Act
			unmount()

			// Assert - Simulate message after unmount (should not cause errors)
			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_TEMPLATE_CHARACTERS",
						payload: [],
					},
				}))
			})

			// Should not cause any errors or memory leaks
			expect(screen.queryByTestId("persona-avatar")).not.toBeInTheDocument()
		})

		it("should handle rapid persona data updates efficiently", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Act - Send rapid updates
			for (let i = 0; i < 10; i++) {
				const persona: TemplateCharacter = {
					character: `persona-${i}`,
					avatarUri: `data:image/png;base64,ImageData${i}`,
					thinkingAvatarUri: `data:image/png;base64,ThinkingData${i}`,
					introIllustrationUri: "",
					en: { name: `Persona ${i}`, description: `Persona ${i}`, customInstruction: {} as any },
					ko: { name: `페르소나 ${i}`, description: `페르소나 ${i}`, customInstruction: {} as any },
					isDefault: false,
				}

				act(() => {
					window.dispatchEvent(new MessageEvent("message", {
						data: {
							type: "RESPONSE_TEMPLATE_CHARACTERS",
							payload: [persona],
						},
					}))
				})
			}

			// Assert - Should end up with the last persona
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("data-persona", "persona-9")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,ImageData9")
			})
		})
	})
}) 