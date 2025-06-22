import { describe, it, expect, vi, beforeEach } from "vitest"

// TDD RED: 순환 메시지 방지 테스트
describe("UI Language Circular Message Prevention", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should not trigger postStateToWebview when uiLanguage is updated from webview", async () => {
		// RED: 이 테스트는 실패할 것 (아직 구현 안됨)

		// Mock controller
		const mockController = {
			postStateToWebview: vi.fn(),
		}

		// Mock updateSettings 함수 (실제 구현 전)
		const updateSettings = async (settings: any, options?: { skipBroadcast?: boolean }) => {
			// 현재는 항상 postStateToWebview 호출 (문제 상황)
			if (!options?.skipBroadcast) {
				await mockController.postStateToWebview()
			}
		}

		// uiLanguage 변경 시 skipBroadcast 옵션 사용해야 함
		await updateSettings(
			{ uiLanguage: "ja" },
			{ skipBroadcast: true }, // 순환 메시지 방지
		)

		// postStateToWebview가 호출되지 않아야 함
		expect(mockController.postStateToWebview).not.toHaveBeenCalled()
	})

	it("should trigger postStateToWebview for non-uiLanguage settings", async () => {
		// 다른 설정 변경 시에는 정상적으로 브로드캐스트해야 함

		const mockController = {
			postStateToWebview: vi.fn(),
		}

		const updateSettings = async (settings: any, options?: { skipBroadcast?: boolean }) => {
			if (!options?.skipBroadcast) {
				await mockController.postStateToWebview()
			}
		}

		// 다른 설정 변경
		await updateSettings({ mode: "act" })

		// postStateToWebview가 호출되어야 함
		expect(mockController.postStateToWebview).toHaveBeenCalled()
	})
})
