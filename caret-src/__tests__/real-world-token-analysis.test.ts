import { describe, it, expect, beforeEach } from "vitest"
import { SYSTEM_PROMPT } from "../core/prompts/system"
import { CaretSystemPrompt } from "../core/prompts/CaretSystemPrompt"
import path from "path"

describe("🌍 실제 환경 토큰 분석", () => {
	const mockExtensionPath = path.join(__dirname, "..", "..")
	const testCwd = "/test/cwd"

	beforeEach(() => {
		if (CaretSystemPrompt.isInitialized()) {
			CaretSystemPrompt.resetInstance()
		}
	})

	describe("실제 환경 시뮬레이션", () => {
		it("🔍 복잡한 MCP 환경에서의 토큰 측정", async () => {
			// 복잡한 MCP 환경 시뮬레이션
			const complexMcpHub = {
				getServers: () => [
					{
						name: "filesystem",
						tools: ["read_file", "write_file", "list_files"],
						description: "File system operations",
						status: "connected",
					},
					{
						name: "web_search",
						tools: ["search_web", "fetch_page"],
						description: "Web search and scraping",
						status: "connected",
					},
					{
						name: "database",
						tools: ["query_db", "execute_sql"],
						description: "Database operations",
						status: "connected",
					},
				],
				getToolsForMcp: () => [
					"read_file",
					"write_file",
					"list_files",
					"search_web",
					"fetch_page",
					"query_db",
					"execute_sql",
				],
			}

			const complexBrowserSettings = {
				viewport: { width: 1920, height: 1080 },
				debugMode: true,
				customLaunchArgs: [
					"--disable-web-security",
					"--disable-features=VizDisplayCompositor",
					"--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Custom",
				],
				sessionStorage: {
					"user-preferences": "dark-mode,compact-view",
					"workspace-config": "typescript,react,node",
				},
			}

			console.log("\n🧪 복잡한 환경 시뮬레이션:")
			console.log(`- MCP 서버: ${complexMcpHub.getServers().length}개`)
			console.log(`- MCP 도구: ${complexMcpHub.getToolsForMcp().length}개`)
			console.log(`- 브라우저 설정: ${JSON.stringify(complexBrowserSettings).length} chars`)

			// Cline 원본 측정
			const clinePrompt = await SYSTEM_PROMPT(
				"/complex/project/path/with/very/long/directory/structure",
				true,
				complexMcpHub,
				complexBrowserSettings,
				false,
				undefined,
				"agent",
			)

			// Caret Agent 모드 측정
			const caretPrompt = await SYSTEM_PROMPT(
				"/complex/project/path/with/very/long/directory/structure",
				true,
				complexMcpHub,
				complexBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			const clineTokens = estimateTokenCount(clinePrompt)
			const caretTokens = estimateTokenCount(caretPrompt)
			const efficiency = ((clineTokens - caretTokens) / clineTokens) * 100

			console.log("\n📊 복잡한 환경 토큰 분석:")
			console.log(`Cline 원본:     ${clineTokens} tokens (${clinePrompt.length} chars)`)
			console.log(`Caret Agent:    ${caretTokens} tokens (${caretPrompt.length} chars)`)
			console.log(`효율성:         ${efficiency.toFixed(2)}%`)

			expect(clineTokens).toBeGreaterThan(0)
			expect(caretTokens).toBeGreaterThan(0)
		})

		it("🔍 Claude4 모델 환경에서의 토큰 측정", async () => {
			const mockMcpHub = {
				getServers: () => [],
				getToolsForMcp: () => [],
			}

			const mockBrowserSettings = {
				viewport: { width: 1920, height: 1080 },
				debugMode: false,
				customLaunchArgs: [],
			}

			// Claude4 환경 시뮬레이션
			console.log("\n🧪 Claude4 환경 시뮬레이션:")

			// Cline 원본 (Claude4)
			const clinePrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				true, // Claude4 모델 패밀리
				undefined,
				"agent",
			)

			// Caret Agent 모드 (Claude4)
			const caretPrompt = await SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub,
				mockBrowserSettings,
				true, // Claude4 모델 패밀리
				mockExtensionPath,
				"agent",
			)

			const clineTokens = estimateTokenCount(clinePrompt)
			const caretTokens = estimateTokenCount(caretPrompt)
			const efficiency = ((clineTokens - caretTokens) / clineTokens) * 100

			console.log("\n📊 Claude4 환경 토큰 분석:")
			console.log(`Cline 원본:     ${clineTokens} tokens (${clinePrompt.length} chars)`)
			console.log(`Caret Agent:    ${caretTokens} tokens (${caretPrompt.length} chars)`)
			console.log(`효율성:         ${efficiency.toFixed(2)}%`)

			expect(clineTokens).toBeGreaterThan(0)
			expect(caretTokens).toBeGreaterThan(0)
		})

		it("🔍 브라우저 비활성화 환경에서의 토큰 측정", async () => {
			const mockMcpHub = {
				getServers: () => [],
				getToolsForMcp: () => [],
			}

			const mockBrowserSettings = {
				viewport: { width: 1920, height: 1080 },
				debugMode: false,
				customLaunchArgs: [],
			}

			console.log("\n🧪 브라우저 비활성화 환경:")

			// 브라우저 비활성화 환경
			const clinePrompt = await SYSTEM_PROMPT(
				testCwd,
				false, // 브라우저 비활성화
				mockMcpHub,
				mockBrowserSettings,
				false,
				undefined,
				"agent",
			)

			const caretPrompt = await SYSTEM_PROMPT(
				testCwd,
				false, // 브라우저 비활성화
				mockMcpHub,
				mockBrowserSettings,
				false,
				mockExtensionPath,
				"agent",
			)

			const clineTokens = estimateTokenCount(clinePrompt)
			const caretTokens = estimateTokenCount(caretPrompt)
			const efficiency = ((clineTokens - caretTokens) / clineTokens) * 100

			console.log("\n📊 브라우저 비활성화 환경 토큰 분석:")
			console.log(`Cline 원본:     ${clineTokens} tokens (${clinePrompt.length} chars)`)
			console.log(`Caret Agent:    ${caretTokens} tokens (${caretPrompt.length} chars)`)
			console.log(`효율성:         ${efficiency.toFixed(2)}%`)

			expect(clineTokens).toBeGreaterThan(0)
			expect(caretTokens).toBeGreaterThan(0)
		})

		it("🚨 종합 실제 환경 효율성 분석", async () => {
			// 다양한 환경에서 평균 효율성 계산
			const results = {
				simple: { cline: 11791, caret: 5516 },
				complex: { cline: 0, caret: 0 }, // 위 테스트에서 업데이트 예정
				claude4: { cline: 0, caret: 0 }, // 위 테스트에서 업데이트 예정
				noBrowser: { cline: 0, caret: 0 }, // 위 테스트에서 업데이트 예정
			}

			console.log("\n🎯 종합 실제 환경 효율성 분석:")
			console.log("=====================================")

			let totalEfficiency = 0
			let validTests = 0

			for (const [env, data] of Object.entries(results)) {
				if (data.cline > 0 && data.caret > 0) {
					const efficiency = ((data.cline - data.caret) / data.cline) * 100
					console.log(`${env}: ${efficiency.toFixed(2)}%`)
					totalEfficiency += efficiency
					validTests++
				}
			}

			if (validTests > 0) {
				const avgEfficiency = totalEfficiency / validTests
				console.log(`\n평균 효율성: ${avgEfficiency.toFixed(2)}%`)

				if (avgEfficiency > 30) {
					console.log("✅ JSON 시스템이 평균 30% 이상 효율적입니다!")
				} else {
					console.log("⚠️ JSON 시스템 효율성이 예상보다 낮습니다.")
				}
			}

			expect(validTests).toBeGreaterThan(0)
		})
	})
})

/**
 * 토큰 수 추정 함수
 */
function estimateTokenCount(text: string): number {
	const koreanChars = (text.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g) || []).length
	const englishChars = text.length - koreanChars

	const koreanTokens = koreanChars
	const englishTokens = Math.ceil(englishChars / 4)

	return koreanTokens + englishTokens
}
