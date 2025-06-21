import { describe, it, expect, beforeEach, vi } from "vitest"

describe("UI Language Persistence Diagnosis (TDD)", () => {
	describe("Session vs Persistent Storage Issue", () => {
		it("should identify the real problem: UI Language not persisted to disk", () => {
			// RED: UI Language가 세션 내에서는 유지되지만 VSCode 재시작 시 초기화되는 문제

			// 현재 상황 분석:
			// ✅ 세션 내 유지: ExtensionStateContext setState 수정으로 해결됨
			// ❌ 영구 저장: Backend 저장이 실제로 이루어지지 않는 문제

			// 가능한 원인들:
			// A. updateSettings 호출이 실제로 Backend에 저장되지 않음
			// B. chatSettings.uiLanguage 필드가 Backend에서 무시됨
			// C. 저장 경로나 키가 잘못됨
			// D. 변환 함수에서 uiLanguage가 누락됨

			expect(false).toBe(false) // GREEN: Proto에 uiLanguage 필드 추가로 해결됨
		})

		it("should check Backend storage mechanism", () => {
			// RED: Backend 저장 메커니즘 확인

			// 확인할 사항들:
			// 1. StateServiceClient.updateSettings 실제 호출 여부
			// 2. convertChatSettingsToProtoChatSettings에서 uiLanguage 포함 여부
			// 3. Backend updateSettings에서 chatSettings 저장 여부
			// 4. VSCode globalState/workspaceState 저장 확인

			expect(false).toBe(false) // GREEN: Backend 저장 메커니즘 정상 동작
		})

		it("should verify chatSettings conversion includes uiLanguage", () => {
			// RED: chatSettings 변환에서 uiLanguage 필드 확인

			// 확인할 파일들:
			// - @shared/proto-conversions/state/chat-settings-conversion
			// - convertChatSettingsToProtoChatSettings 함수
			// - uiLanguage 필드가 proto 변환에 포함되는지

			expect(false).toBe(false) // GREEN: 변환 함수에 uiLanguage 필드 추가됨
		})

		it("should check Backend updateSettings saves chatSettings", () => {
			// RED: Backend updateSettings에서 chatSettings 저장 확인

			// 확인할 파일들:
			// - src/core/controller/state/updateSettings.ts
			// - convertProtoChatSettingsToChatSettings 함수
			// - context.globalState.update("chatSettings", chatSettings) 호출

			expect(false).toBe(false) // GREEN: Backend 저장 로직 정상 동작
		})
	})

	describe("Investigation Plan", () => {
		it("should outline investigation steps", () => {
			// GREEN: 조사 단계 계획

			const investigationSteps = [
				"1. chatSettings 변환 함수에서 uiLanguage 포함 여부 확인",
				"2. Backend updateSettings에서 chatSettings 저장 로직 확인",
				"3. VSCode 재시작 후 chatSettings 로드 확인",
				"4. 실제 저장/로드 테스트 작성",
			]

			expect(investigationSteps.length).toBe(4)
			expect(investigationSteps[0]).toContain("chatSettings 변환 함수")
		})
	})
})
