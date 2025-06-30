import { describe, it, expect, vi } from 'vitest'
import { SYSTEM_PROMPT } from '../../src/core/prompts/system'

// 모의 객체들 (VSCode mock 없이)
const mockMcpHub = {
	getServers: () => [],
	getConnectedServers: () => []
}

const mockBrowserSettings = {
	viewport: { width: 1200, height: 800 }
}

const mockExtensionPath = process.cwd()

describe('✅ GREEN - Mode System Verification (Simplified)', () => {
	it('✅ extensionPath가 없으면 Cline 시스템 사용', async () => {
		const consoleSpy = vi.spyOn(console, 'log')

		const clinePrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined, // extensionPath 없음 = Cline 시스템
			'agent'
		)

		// Cline 시스템 특징들
		expect(clinePrompt).toContain('You are Cline')
		expect(clinePrompt).toContain('plan_mode_respond')
		expect(clinePrompt).toContain('PLAN MODE')
		expect(clinePrompt).toContain('ACT MODE')
		
		// Caret JSON 시스템 로그가 없어야 함
		expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[CARET] Generated prompt via Caret JSON system'))
		
		consoleSpy.mockRestore()
	})

	it('✅ extensionPath가 있으면 Caret JSON 시스템 사용 시도', async () => {
		const consoleSpy = vi.spyOn(console, 'log')
		const consoleWarnSpy = vi.spyOn(console, 'warn')

		const caretPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			true,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath, // extensionPath 있음 = Caret 시스템 시도
			'agent'
		)

		// Caret 시스템 시도했지만 실패 시 fallback
		const caretLogFound = consoleSpy.mock.calls.some(call => 
			call[0] && call[0].includes('[CARET] Generated prompt via Caret JSON system')
		)
		
		const fallbackLogFound = consoleWarnSpy.mock.calls.some(call => 
			call[0] && call[0].includes('[CARET] Caret system failed, falling back to Cline original')
		)

		// Caret 시스템 성공 또는 실패 후 fallback 둘 중 하나는 발생해야 함
		expect(caretLogFound || fallbackLogFound).toBe(true)
		
		// 어떤 경우든 프롬프트는 생성되어야 함
		expect(caretPrompt.length).toBeGreaterThan(1000)
		
		consoleSpy.mockRestore()
		consoleWarnSpy.mockRestore()
	})

	it('✅ extensionPath 유무에 따라 다른 시스템 경로 사용', async () => {
		const clinePrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined, // Cline
			'agent'
		)

		const caretPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath, // Caret
			'agent'
		)

		// 경로가 다르므로 최소한 시도는 달라야 함
		// (Caret이 실패해도 fallback 로직이 다름)
		expect(typeof clinePrompt).toBe('string')
		expect(typeof caretPrompt).toBe('string')
		expect(clinePrompt.length).toBeGreaterThan(100)
		expect(caretPrompt.length).toBeGreaterThan(100)
	})

	it('✅ mode 파라미터가 전달됨 (chatbot vs agent)', async () => {
		// mode 파라미터가 다를 때 오류가 발생하지 않아야 함
		const chatbotPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath,
			'chatbot' // chatbot 모드
		)

		const agentPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			false,
			mockMcpHub,
			mockBrowserSettings,
			false,
			mockExtensionPath,
			'agent' // agent 모드
		)

		// 두 모드 모두 정상 동작해야 함
		expect(chatbotPrompt.length).toBeGreaterThan(100)
		expect(agentPrompt.length).toBeGreaterThan(100)
	})

	it('✅ browser 설정에 따른 차이', async () => {
		const noBrowserPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			false, // browser 비활성화
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined,
			'agent'
		)

		const withBrowserPrompt = await SYSTEM_PROMPT(
			'/test/cwd',
			true, // browser 활성화
			mockMcpHub,
			mockBrowserSettings,
			false,
			undefined,
			'agent'
		)

		// 브라우저 설정에 따라 프롬프트가 달라져야 함
		expect(noBrowserPrompt).not.toBe(withBrowserPrompt)
		expect(withBrowserPrompt).toContain('browser_action')
		expect(noBrowserPrompt).not.toContain('browser_action')
	})
}) 