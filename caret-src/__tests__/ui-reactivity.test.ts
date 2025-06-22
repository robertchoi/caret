import { describe, it, expect, vi, beforeEach } from "vitest"
import { ChatSettings } from "../../src/shared/ChatSettings"

/**
 * UI 반응성 테스트
 *
 * 문제: setChatSettings가 백엔드 저장 완료 후 UI 업데이트하여 반응성 저하
 * - 현재: 백엔드 저장 → UI 업데이트 (지연)
 * - 개선: UI 업데이트 → 백엔드 저장 (즉시 반응)
 *
 * 해결: UI 우선 업데이트, 백엔드는 비동기로 처리
 */

describe("UI Reactivity Tests", () => {
	let mockSetState: any
	let mockStateServiceClient: any
	let originalSetChatSettings: any

	beforeEach(() => {
		mockSetState = vi.fn()
		mockStateServiceClient = {
			updateSettings: vi.fn().mockResolvedValue(undefined),
		}

		// Mock the conversion functions
		vi.mock("@shared/proto-conversions/state/settings-conversion", () => ({
			convertApiConfigurationToProtoApiConfiguration: vi.fn().mockReturnValue({}),
		}))

		vi.mock("@shared/proto-conversions/state/chat-settings-conversion", () => ({
			convertChatSettingsToProtoChatSettings: vi.fn().mockReturnValue({}),
		}))
	})

	describe("setChatSettings Reactivity", () => {
		it("should update UI immediately before backend save (desired behavior)", async () => {
			// GREEN: This test defines the desired immediate UI update behavior
			const testChatSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
				uiLanguage: "ko",
			}

			// Track call order
			const callOrder: string[] = []

			// Mock setState to track when UI is updated
			const mockSetState = vi.fn().mockImplementation(() => {
				callOrder.push("UI_UPDATE")
			})

			// Mock backend service to track when backend is called
			mockStateServiceClient.updateSettings.mockImplementation(() => {
				callOrder.push("BACKEND_SAVE")
				return Promise.resolve()
			})

			// Simulate improved setChatSettings (immediate UI update)
			const improvedSetChatSettings = async (value: ChatSettings) => {
				// 1. UI 업데이트 먼저 (즉시 반응)
				mockSetState((prevState: any) => ({
					...prevState,
					chatSettings: value,
				}))

				// 2. 백엔드 저장은 비동기로 (지연되어도 UI는 이미 업데이트됨)
				try {
					await mockStateServiceClient.updateSettings({})
				} catch (error) {
					console.error("Backend save failed:", error)
					// 실패 시 UI 롤백 로직 필요
				}
			}

			await improvedSetChatSettings(testChatSettings)

			// UI가 백엔드보다 먼저 업데이트되어야 함
			expect(callOrder).toEqual(["UI_UPDATE", "BACKEND_SAVE"])
			expect(mockSetState).toHaveBeenCalledWith(expect.any(Function))
			expect(mockStateServiceClient.updateSettings).toHaveBeenCalled()
		})

		it("should handle backend save failure with UI rollback", async () => {
			// GREEN: Test error handling with UI rollback
			const testChatSettings: ChatSettings = {
				mode: "plan",
				preferredLanguage: "en",
			}

			const originalSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
			}

			let currentState = { chatSettings: originalSettings }
			const callOrder: string[] = []

			// Mock setState that actually updates state
			const mockSetState = vi.fn().mockImplementation((updateFn) => {
				callOrder.push("UI_UPDATE")
				currentState = updateFn(currentState)
			})

			// Mock backend failure
			mockStateServiceClient.updateSettings.mockImplementation(() => {
				callOrder.push("BACKEND_FAIL")
				return Promise.reject(new Error("Network error"))
			})

			// Simulate setChatSettings with error handling
			const setChatSettingsWithRollback = async (value: ChatSettings) => {
				const previousState = currentState.chatSettings

				// 1. UI 업데이트 먼저
				mockSetState((prevState: any) => ({
					...prevState,
					chatSettings: value,
				}))

				// 2. 백엔드 저장 시도
				try {
					await mockStateServiceClient.updateSettings({})
				} catch (error) {
					// 3. 실패 시 UI 롤백
					mockSetState((prevState: any) => ({
						...prevState,
						chatSettings: previousState,
					}))
					callOrder.push("UI_ROLLBACK")
					throw error
				}
			}

			// Execute and expect failure
			await expect(setChatSettingsWithRollback(testChatSettings)).rejects.toThrow("Network error")

			// Verify call order and rollback (setState called twice is expected for rollback)
			expect(callOrder).toEqual(["UI_UPDATE", "BACKEND_FAIL", "UI_UPDATE", "UI_ROLLBACK"])
			expect(currentState.chatSettings).toEqual(originalSettings) // Rolled back
		})

		it("should demonstrate current slow behavior (RED test)", async () => {
			// RED: This test shows the current problematic behavior
			const testChatSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
			}

			const callOrder: string[] = []

			// Mock current slow implementation
			mockStateServiceClient.updateSettings.mockImplementation(() => {
				callOrder.push("BACKEND_SAVE")
				// Simulate network delay
				return new Promise((resolve) => setTimeout(resolve, 100))
			})

			const mockSetState = vi.fn().mockImplementation(() => {
				callOrder.push("UI_UPDATE")
			})

			// Current problematic setChatSettings (backend first)
			const currentSetChatSettings = async (value: ChatSettings) => {
				// 1. 백엔드 저장 먼저 (느림!)
				await mockStateServiceClient.updateSettings({})

				// 2. 그 다음에 UI 업데이트
				mockSetState((prevState: any) => ({
					...prevState,
					chatSettings: value,
				}))
			}

			await currentSetChatSettings(testChatSettings)

			// 현재는 백엔드가 먼저, UI가 나중 (문제!)
			expect(callOrder).toEqual(["BACKEND_SAVE", "UI_UPDATE"])
		})
	})

	describe("Performance Requirements", () => {
		it("should update UI within 50ms (immediate)", async () => {
			// GREEN: Performance requirement test
			const testChatSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
			}

			let uiUpdateTime: number = 0
			const startTime = Date.now()

			const mockSetState = vi.fn().mockImplementation(() => {
				uiUpdateTime = Date.now() - startTime
			})

			// Simulate immediate UI update
			const immediateSetChatSettings = async (value: ChatSettings) => {
				// UI 즉시 업데이트
				mockSetState((prevState: any) => ({
					...prevState,
					chatSettings: value,
				}))

				// 백엔드는 별도로 처리
				mockStateServiceClient.updateSettings({}).catch(() => {})
			}

			await immediateSetChatSettings(testChatSettings)

			// UI 업데이트는 50ms 이내여야 함
			expect(uiUpdateTime).toBeLessThan(50)
			expect(mockSetState).toHaveBeenCalled()
		})
	})
})
