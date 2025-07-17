export interface SystemPromptUsage {
	mode: "caret" | "cline"
	promptLength: number
	estimatedTokens: number
	modelId: string
	timestamp: number
	isCaretJson?: boolean
	isTrueCline?: boolean
}

export interface UsageComparison {
	caret: {
		count: number
		avgPromptLength: number
		avgTokens: number
	}
	cline: {
		count: number
		avgPromptLength: number
		avgTokens: number
	}
	difference: {
		promptLengthDiff: number
		tokenDiff: number
		percentageDiff: number
	}
}

export class SystemPromptUsageTracker {
	private usageHistory: SystemPromptUsage[] = []

	recordUsage(usage: SystemPromptUsage): void {
		this.usageHistory.push(usage)
	}

	getUsageHistory(): SystemPromptUsage[] {
		return [...this.usageHistory]
	}

	estimateTokens(promptText: string): number {
		// 대략적인 토큰 추정: 4글자 = 1토큰
		return Math.ceil(promptText.length / 4)
	}

	getUsageComparison(): UsageComparison {
		const caretUsages = this.usageHistory.filter((u) => u.mode === "caret")
		const clineUsages = this.usageHistory.filter((u) => u.mode === "cline")

		const caretAvgLength =
			caretUsages.length > 0 ? caretUsages.reduce((sum, u) => sum + u.promptLength, 0) / caretUsages.length : 0
		const caretAvgTokens =
			caretUsages.length > 0 ? caretUsages.reduce((sum, u) => sum + u.estimatedTokens, 0) / caretUsages.length : 0

		const clineAvgLength =
			clineUsages.length > 0 ? clineUsages.reduce((sum, u) => sum + u.promptLength, 0) / clineUsages.length : 0
		const clineAvgTokens =
			clineUsages.length > 0 ? clineUsages.reduce((sum, u) => sum + u.estimatedTokens, 0) / clineUsages.length : 0

		const promptLengthDiff = caretAvgLength - clineAvgLength
		const tokenDiff = caretAvgTokens - clineAvgTokens
		const percentageDiff = clineAvgLength > 0 ? (promptLengthDiff / clineAvgLength) * 100 : 0

		return {
			caret: {
				count: caretUsages.length,
				avgPromptLength: caretAvgLength,
				avgTokens: caretAvgTokens,
			},
			cline: {
				count: clineUsages.length,
				avgPromptLength: clineAvgLength,
				avgTokens: clineAvgTokens,
			},
			difference: {
				promptLengthDiff,
				tokenDiff,
				percentageDiff,
			},
		}
	}

	generateUsageReport(): string {
		const comparison = this.getUsageComparison()

		const formatNumber = (num: number): string => {
			return new Intl.NumberFormat().format(Math.round(num))
		}

		const caretLength = formatNumber(comparison.caret.avgPromptLength)
		const caretTokens = formatNumber(comparison.caret.avgTokens)
		const clineLength = formatNumber(comparison.cline.avgPromptLength)
		const clineTokens = formatNumber(comparison.cline.avgTokens)
		const diffLength = formatNumber(Math.abs(comparison.difference.promptLengthDiff))
		const diffTokens = formatNumber(Math.abs(comparison.difference.tokenDiff))

		const diffSign = comparison.difference.promptLengthDiff >= 0 ? "+" : "-"

		return `
## System Prompt Usage Comparison

**Caret Mode:** ${caretLength} chars (~${caretTokens} tokens)
**Cline Mode:** ${clineLength} chars (~${clineTokens} tokens)
**Difference:** ${diffSign}${diffLength} chars (${diffSign}${diffTokens} tokens)
**Percentage:** ${comparison.difference.percentageDiff.toFixed(1)}%

**Sample Count:**
- Caret: ${comparison.caret.count} requests
- Cline: ${comparison.cline.count} requests
		`.trim()
	}

	extractUsageFromApiInfo(apiInfo: any, mode: "caret" | "cline", modelId: string): SystemPromptUsage {
		const systemMessage = apiInfo.messages?.find((m: any) => m.role === "system")
		const promptLength = systemMessage?.content?.length || apiInfo.systemPromptInfo?.length || 0
		const estimatedTokens = this.estimateTokens(systemMessage?.content || "")

		return {
			mode,
			promptLength,
			estimatedTokens,
			modelId,
			timestamp: Date.now(),
			isCaretJson: apiInfo.systemPromptInfo?.isCaretJson || false,
			isTrueCline: apiInfo.systemPromptInfo?.isTrueCline || false,
		}
	}
}
