import { describe, it, expect, vi, beforeEach } from "vitest"
import { SystemPromptUsageTracker } from "../core/prompts/SystemPromptUsageTracker"

describe("🔴 RED - System Prompt Usage Tracking", () => {
	let tracker: SystemPromptUsageTracker

	beforeEach(() => {
		tracker = new SystemPromptUsageTracker()
	})

	describe("Usage Recording", () => {
		it("🔴 SHOULD FAIL: should record system prompt usage", () => {
			const usage = {
				mode: "caret" as const,
				promptLength: 15000,
				estimatedTokens: 3750,
				modelId: "gemini-2.5-pro-preview",
				timestamp: Date.now(),
			}

			tracker.recordUsage(usage)

			const history = tracker.getUsageHistory()
			expect(history).toHaveLength(1)
			expect(history[0]).toEqual(usage)
		})

		it("🔴 SHOULD FAIL: should calculate token estimates correctly", () => {
			const promptText = "A".repeat(4000) // 4000 characters
			const estimatedTokens = tracker.estimateTokens(promptText)

			// 대략 4글자 = 1토큰으로 추정
			expect(estimatedTokens).toBe(1000)
		})

		it("🔴 SHOULD FAIL: should track usage differences between modes", () => {
			tracker.recordUsage({
				mode: "caret",
				promptLength: 20000,
				estimatedTokens: 5000,
				modelId: "gemini-2.5-pro-preview",
				timestamp: Date.now(),
			})

			tracker.recordUsage({
				mode: "cline",
				promptLength: 12000,
				estimatedTokens: 3000,
				modelId: "gemini-2.5-pro-preview",
				timestamp: Date.now(),
			})

			const comparison = tracker.getUsageComparison()
			expect(comparison.caret.avgPromptLength).toBe(20000)
			expect(comparison.cline.avgPromptLength).toBe(12000)
			expect(comparison.difference.promptLengthDiff).toBe(8000)
			expect(comparison.difference.tokenDiff).toBe(2000)
		})
	})

	describe("Report Generation", () => {
		it("🔴 SHOULD FAIL: should generate usage comparison report", () => {
			// Setup test data
			tracker.recordUsage({
				mode: "caret",
				promptLength: 18500,
				estimatedTokens: 4625,
				modelId: "gemini-2.5-pro-preview",
				timestamp: Date.now(),
			})

			tracker.recordUsage({
				mode: "cline",
				promptLength: 10200,
				estimatedTokens: 2550,
				modelId: "gemini-2.5-pro-preview",
				timestamp: Date.now(),
			})

			const report = tracker.generateUsageReport()

			expect(report).toContain("System Prompt Usage Comparison")
			expect(report).toContain("Caret Mode: 18,500 chars (~4,625 tokens)")
			expect(report).toContain("Cline Mode: 10,200 chars (~2,550 tokens)")
			expect(report).toContain("Difference: +8,300 chars (+2,075 tokens)")
		})
	})

	describe("Integration with API Logging", () => {
		it("🔴 SHOULD FAIL: should extract usage from API request info", () => {
			const mockApiInfo = {
				messages: [
					{ role: "system", content: "A".repeat(15000) },
					{ role: "user", content: "test message" },
				],
				systemPromptInfo: {
					length: 15000,
					wordCount: 2500,
					preview: "A".repeat(200) + "...",
					isCaretJson: true,
					isTrueCline: false,
				},
			}

			const usage = tracker.extractUsageFromApiInfo(mockApiInfo, "caret", "gemini-2.5-pro-preview")

			expect(usage.mode).toBe("caret")
			expect(usage.promptLength).toBe(15000)
			expect(usage.estimatedTokens).toBe(3750)
			expect(usage.isCaretJson).toBe(true)
			expect(usage.isTrueCline).toBe(false)
		})
	})
})
