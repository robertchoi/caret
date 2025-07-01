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
		it("should request template characters on mount", async () => {
			// Act
			renderWithProviders(<PersonaAvatar />)
			
			// Assert
			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "REQUEST_PERSONA_IMAGES",
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
		})

		it("should update avatar when template characters response is received", async () => {
			// Arrange
			const mockPersonaImages = {
				avatarUri: "data:image/png;base64,ProfileImageData",
				thinkingAvatarUri: "data:image/png;base64,ThinkingImageData"
			}

			// Act
			renderWithProviders(<PersonaAvatar />)

			// Initially should show loading
			let avatar = screen.getByTestId("persona-avatar")
			expect(avatar).toHaveAttribute("data-persona", "loading")

			// Simulate receiving persona images
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: mockPersonaImages,
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

			// Simulate receiving empty/invalid response
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: null,
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
			vi.clearAllMocks() // Clear the initial REQUEST_PERSONA_IMAGES call

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
					type: "REQUEST_PERSONA_IMAGES",
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
					type: "REQUEST_PERSONA_IMAGES",
				})
			})
		})
	})

	describe("Thinking State with Backend Data", () => {
		it("should use correct image URLs based on thinking state with real backend data", async () => {
			// Arrange
			const mockPersonaImages = {
				avatarUri: "data:image/png;base64,LunaNormalImage",
				thinkingAvatarUri: "data:image/png;base64,LunaThinkingImage"
			}

			const { rerender } = renderWithProviders(<PersonaAvatar />)

			// Simulate receiving persona data
			act(() => {
				const mockEvent = new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: mockPersonaImages,
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
			const initialPersonaImages = {
				avatarUri: "data:image/png;base64,OriginalImage",
				thinkingAvatarUri: "data:image/png;base64,OriginalThinking"
			}

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: initialPersonaImages,
					},
				}))
			})

			// Assert initial state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,OriginalImage")
			})

			// Act - Simulate custom image upload result (after backend processing)
			const updatedPersonaImages = {
				avatarUri: "data:image/png;base64,UploadedCustomImage",
				thinkingAvatarUri: "data:image/png;base64,UploadedCustomThinking"
			}

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: updatedPersonaImages,
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
		it("should handle invalid message data gracefully", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Act - Send malformed messages
			const malformedMessages = [
				{ type: "RESPONSE_PERSONA_IMAGES" }, // Missing payload
				{ type: "RESPONSE_PERSONA_IMAGES", payload: null }, // Null payload
				{ type: "RESPONSE_PERSONA_IMAGES", payload: "invalid" }, // Invalid payload type
				{ type: "RESPONSE_PERSONA_IMAGES", payload: { invalidData: true } }, // Invalid persona structure
			]

			for (const message of malformedMessages) {
				act(() => {
					window.dispatchEvent(new MessageEvent("message", { data: message }))
				})
			}

			// Assert - Should remain in loading state
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("data-persona", "loading")
			})
		})

		it("should handle image load errors from backend data", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Simulate receiving invalid image data
			const personaWithInvalidImage = {
				avatarUri: "invalid://broken-image.png",
				thinkingAvatarUri: "data:image/png;base64,ValidThinking"
			}

			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: personaWithInvalidImage,
					},
				}))
			})

			// Wait for component to process message
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("src", "invalid://broken-image.png")
			})

			// Act - Trigger image error
			const avatar = screen.getByTestId("persona-avatar")
			fireEvent.error(avatar)

			// Assert - Should fallback to loading persona image
			await waitFor(() => {
				const updatedAvatar = screen.getByTestId("persona-avatar")
				// Should use loading persona's avatar when image fails
				expect(updatedAvatar.getAttribute("src")).toContain("data:image/svg+xml;base64")
			})
		})
	})

	describe("Locale Support Integration", () => {
		it("should display correct persona names based on backend locale data", async () => {
			// Arrange
			const mockPersonaImages = {
				avatarUri: "data:image/png;base64,PersonaImage",
				thinkingAvatarUri: "data:image/png;base64,PersonaThinking"
			}

			renderWithProviders(<PersonaAvatar />)

			// Simulate receiving persona data
			act(() => {
				window.dispatchEvent(new MessageEvent("message", {
					data: {
						type: "RESPONSE_PERSONA_IMAGES",
						payload: mockPersonaImages,
					},
				}))
			})

			// Assert English name (component creates Current Persona internally)
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("alt", "Current Persona normal")
			})
		})
	})

	describe("Performance and Memory", () => {
		it("should handle rapid persona data updates efficiently", async () => {
			// Arrange
			renderWithProviders(<PersonaAvatar />)

			// Act - Send multiple rapid updates
			for (let i = 0; i < 10; i++) {
				const personaImages = {
					avatarUri: `data:image/png;base64,Image${i}`,
					thinkingAvatarUri: `data:image/png;base64,Thinking${i}`
				}

				act(() => {
					window.dispatchEvent(new MessageEvent("message", {
						data: {
							type: "RESPONSE_PERSONA_IMAGES",
							payload: personaImages,
						},
					}))
				})
			}

			// Assert - Should show the last update
			await waitFor(() => {
				const avatar = screen.getByTestId("persona-avatar")
				expect(avatar).toHaveAttribute("data-persona", "current")
				expect(avatar).toHaveAttribute("src", "data:image/png;base64,Image9")
			})
		})

		it("should clean up event listeners on unmount", () => {
			// Arrange
			const { unmount } = renderWithProviders(<PersonaAvatar />)
			const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

			// Act
			unmount()

			// Assert
			expect(removeEventListenerSpy).toHaveBeenCalledWith("message", expect.any(Function))
		})
	})
}) 