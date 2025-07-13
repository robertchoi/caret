// CARET MODIFICATION: Token comparison test between Caret JSON system and TRUE_CLINE_SYSTEM_PROMPT
import { describe, it, expect } from "vitest"

describe("Caret vs Cline Token Comparison", () => {
	const mockSettings = {
		mcpHub: {
			getServers: () => [],
		},
		browserSettings: {
			viewport: { width: 1024, height: 768 },
		},
	}

	it("should compare token efficiency between Caret JSON system and TRUE_CLINE_SYSTEM_PROMPT", async () => {
		// Get TRUE_CLINE_SYSTEM_PROMPT
		const { TRUE_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/true-cline-system")
		const trueClinePrompt = await TRUE_CLINE_SYSTEM_PROMPT(
			"/test/directory",
			false, // supportsBrowserUse
			mockSettings.mcpHub,
			mockSettings.browserSettings,
			false, // isClaude4Model
			"act" // mode
		)

		// Get Caret JSON system prompt
		const { SYSTEM_PROMPT } = await import("../../src/core/prompts/system")
		const caretPrompt = await SYSTEM_PROMPT(
			"/test/directory",
			false, // supportsBrowserUse
			mockSettings.mcpHub,
			mockSettings.browserSettings,
			false, // isClaude4Model
			process.cwd(), // extensionPath - triggers Caret JSON system
			"agent" // mode
		)

		// Token analysis function
		const analyzeTokens = (text: string) => {
			const chars = text.length
			const words = text.split(/\s+/).length
			const approxTokens = Math.ceil(words * 1.33) // Rough estimate
			return { chars, words, approxTokens }
		}

		const clineAnalysis = analyzeTokens(trueClinePrompt)
		const caretAnalysis = analyzeTokens(caretPrompt)

		console.log(`📊 Token Comparison Results:`)
		console.log(`🔹 TRUE_CLINE_SYSTEM_PROMPT:`)
		console.log(`   Characters: ${clineAnalysis.chars.toLocaleString()}`)
		console.log(`   Words: ${clineAnalysis.words.toLocaleString()}`)
		console.log(`   Approximate Tokens: ${clineAnalysis.approxTokens.toLocaleString()}`)
		console.log(``)
		console.log(`🔹 Caret JSON System:`)
		console.log(`   Characters: ${caretAnalysis.chars.toLocaleString()}`)
		console.log(`   Words: ${caretAnalysis.words.toLocaleString()}`)
		console.log(`   Approximate Tokens: ${caretAnalysis.approxTokens.toLocaleString()}`)
		console.log(``)
		console.log(`📈 Efficiency Analysis:`)
		const tokenSavings = clineAnalysis.approxTokens - caretAnalysis.approxTokens
		const savingsPercent = ((tokenSavings / clineAnalysis.approxTokens) * 100).toFixed(1)
		console.log(`   Token Savings: ${tokenSavings.toLocaleString()} tokens`)
		console.log(`   Savings Percentage: ${savingsPercent}%`)
		console.log(`   Caret is ${savingsPercent}% more efficient`)

		// Verify both prompts are valid
		expect(trueClinePrompt.length).toBeGreaterThan(1000)
		expect(caretPrompt.length).toBeGreaterThan(1000)
		expect(trueClinePrompt).toContain("You are Cline")
		expect(caretPrompt).toContain("You are Cline") // Should also have this

		// Show actual efficiency
		console.log(`\n🎯 Conclusion: ${tokenSavings > 0 ? 'Caret is more efficient' : 'TRUE_CLINE is more efficient'} by ${Math.abs(tokenSavings)} tokens`)
	})

	it("should compare chatbot mode vs agent mode efficiency", async () => {
		const { SYSTEM_PROMPT } = await import("../../src/core/prompts/system")
		
		const agentPrompt = await SYSTEM_PROMPT(
			"/test/directory", false, mockSettings.mcpHub, mockSettings.browserSettings,
			false, process.cwd(), "agent"
		)
		
		const chatbotPrompt = await SYSTEM_PROMPT(
			"/test/directory", false, mockSettings.mcpHub, mockSettings.browserSettings,
			false, process.cwd(), "chatbot"
		)

		const agentWords = agentPrompt.split(/\s+/).length
		const chatbotWords = chatbotPrompt.split(/\s+/).length
		const chatbotSavings = agentWords - chatbotWords
		const savingsPercent = ((chatbotSavings / agentWords) * 100).toFixed(1)

		console.log(`📊 Mode Comparison:`)
		console.log(`🔹 Agent Mode: ${agentWords.toLocaleString()} words`)
		console.log(`🔹 Chatbot Mode: ${chatbotWords.toLocaleString()} words`)
		console.log(`💰 Chatbot Savings: ${chatbotSavings.toLocaleString()} words (${savingsPercent}%)`)

		expect(chatbotWords).toBeLessThan(agentWords) // Chatbot should be smaller
	})
}) 