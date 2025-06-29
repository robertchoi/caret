import { describe, it, expect } from "vitest"
import path from "path"

describe("Caret JSON System Test", () => {
	it("✅ should load JSON sections successfully", async () => {
		console.log("[TEST] 🎯 Testing Caret JSON system...")

		const extensionPath = process.cwd()

		// Import and create Caret system
		const { CaretSystemPrompt } = await import("../core/prompts/CaretSystemPrompt")
		const caretSystemPrompt = new CaretSystemPrompt(extensionPath, false) // 실제 sections 경로 사용

		const mockMcpHub = {
			getServers: () => [],
			listResources: () => Promise.resolve([]),
		}

		const mockBrowserSettings = {
			viewport: { width: 1280, height: 720 },
		}

		// Generate Caret prompt
		const caretPrompt = await caretSystemPrompt.generateFromJsonSections(
			"/test/project",
			true, // browser support
			mockMcpHub,
			mockBrowserSettings,
			false, // claude4
			"agent", // mode
		)

		console.log(`[TEST] 📊 Caret prompt length: ${caretPrompt.length} characters`)
		console.log(`[TEST] 📝 First 200 chars: ${caretPrompt.substring(0, 200)}...`)

		// Basic validations
		expect(caretPrompt).toBeDefined()
		expect(typeof caretPrompt).toBe("string")
		expect(caretPrompt.length).toBeGreaterThan(15000) // Should be substantial now with JSON files ✅ (19,602 chars)
		expect(caretPrompt).toContain("Caret")
		expect(caretPrompt).toContain("AGENT MODE")
		expect(caretPrompt).toContain("execute_command")
		expect(caretPrompt).toContain("## execute_command") // Tools are formatted as markdown headers

		console.log(`[TEST] ✅ Caret JSON system is working! Generated ${caretPrompt.length} characters`)
	})
})
