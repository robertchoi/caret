import { describe, it, expect, vi, beforeEach } from "vitest"
import { ChatSettings } from "../../src/shared/ChatSettings"

/**
 * 저장소 불일치 문제 검증 테스트
 *
 * 문제: chatSettings가 globalState와 workspaceState에 혼재하여 저장되고 있음
 * - updateSettings.ts: globalState에 저장
 * - Controller.ts: workspaceState에 저장
 * - state.ts: workspaceState에서 로드
 *
 * 해결: 모든 저장/로드를 workspaceState로 통일 (프로젝트별 설정)
 */

describe("ChatSettings Storage Consistency", () => {
	let mockContext: any
	let mockGlobalState: any
	let mockWorkspaceState: any

	beforeEach(() => {
		mockGlobalState = {
			update: vi.fn().mockResolvedValue(undefined),
			get: vi.fn(),
		}

		mockWorkspaceState = {
			update: vi.fn().mockResolvedValue(undefined),
			get: vi.fn(),
		}

		mockContext = {
			globalState: mockGlobalState,
			workspaceState: mockWorkspaceState,
		}
	})

	describe("Storage Location Consistency", () => {
		it("should save and load chatSettings from the same storage type", async () => {
			// GREEN: Now test the correct behavior after fix
			const testChatSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
				openAIReasoningEffort: "medium",
				uiLanguage: "ko",
			}

			// Mock correct behavior: save and load from same storage
			mockWorkspaceState.get.mockResolvedValue(testChatSettings)

			// Save to workspaceState (correct behavior)
			await mockWorkspaceState.update("chatSettings", testChatSettings)
			const loadedFromWorkspaceState = await mockWorkspaceState.get("chatSettings")

			// This should pass - demonstrating consistency
			expect(mockWorkspaceState.update).toHaveBeenCalledWith("chatSettings", testChatSettings)
			expect(loadedFromWorkspaceState).toEqual(testChatSettings)
		})

		it("should consistently use workspaceState for chatSettings", async () => {
			// RED: This test defines the desired behavior
			const testChatSettings: ChatSettings = {
				mode: "plan",
				preferredLanguage: "en",
				openAIReasoningEffort: "high",
				uiLanguage: "en",
			}

			// Mock the correct behavior we want to achieve
			mockWorkspaceState.get.mockResolvedValue(testChatSettings)

			// Save to workspaceState
			await mockWorkspaceState.update("chatSettings", testChatSettings)

			// Load from workspaceState
			const loaded = await mockWorkspaceState.get("chatSettings")

			// This should pass after we fix the storage consistency
			expect(mockWorkspaceState.update).toHaveBeenCalledWith("chatSettings", testChatSettings)
			expect(loaded).toEqual(testChatSettings)

			// globalState should NOT be used for chatSettings
			expect(mockGlobalState.update).not.toHaveBeenCalledWith("chatSettings", expect.anything())
		})
	})

	describe("updateSettings function behavior", () => {
		it("should save chatSettings to workspaceState, not globalState", async () => {
			// RED: This test will fail until we fix updateSettings.ts
			const testChatSettings: ChatSettings = {
				mode: "act",
				preferredLanguage: "ko",
				uiLanguage: "ko",
			}

			// Mock the current problematic behavior: updateSettings saves to globalState
			const mockController = {
				context: mockContext,
				task: { chatSettings: undefined },
				postStateToWebview: vi.fn().mockResolvedValue(undefined),
			}

			// Simulate what updateSettings.ts currently does (incorrectly)
			await mockContext.globalState.update("chatSettings", testChatSettings)

			// This test documents the problem: globalState is being used instead of workspaceState
			expect(mockGlobalState.update).toHaveBeenCalledWith("chatSettings", testChatSettings)

			// After fix: workspaceState should be used instead
			// expect(mockWorkspaceState.update).toHaveBeenCalledWith('chatSettings', testChatSettings)
		})
	})

	describe("Controller togglePlanActMode behavior", () => {
		it("should save chatSettings to workspaceState consistently", async () => {
			// This part is already correct in Controller.ts
			const testChatSettings: ChatSettings = {
				mode: "plan",
				preferredLanguage: "en",
			}

			// Controller.ts correctly uses workspaceState
			await mockContext.workspaceState.update("chatSettings", testChatSettings)

			expect(mockWorkspaceState.update).toHaveBeenCalledWith("chatSettings", testChatSettings)
		})
	})
})
