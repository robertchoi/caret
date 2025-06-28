// CARET MODIFICATION: TDD-based CaretSystemPrompt wrapper implementation
// Purpose: Simple wrapper around Cline's SYSTEM_PROMPT with testable design

import { CaretLogger } from "../../utils/caret-logger"

export interface SystemPromptContext {
	cwd: string
	supportsBrowserUse: boolean
	mcpHub: { getServers: () => any[] }
	browserSettings: any
	isClaude4ModelFamily?: boolean
}

export interface SystemPromptMetrics {
	promptLength: number
	toolCount: number
	mcpServerCount: number
	generationTime: number
	timestamp: number
}

export interface SystemPromptResult {
	prompt: string
	metrics: SystemPromptMetrics
}

// 의존성 주입을 위한 SYSTEM_PROMPT 함수 타입
export type SystemPromptFunction = (
	cwd: string,
	supportsBrowserUse: boolean,
	mcpHub: any,
	browserSettings: any,
	isClaude4ModelFamily: boolean,
) => Promise<string>

/**
 * CaretSystemPromptTDD - 테스트 가능한 Cline SYSTEM_PROMPT 래퍼
 *
 * 설계 원칙:
 * - 100% compatibility with Cline SYSTEM_PROMPT
 * - KISS principle: 단순한 래핑만 수행
 * - Minimal overhead: 5% 이하 성능 오버헤드
 * - Testable design: 의존성 주입을 통한 테스트 가능성
 */
export class CaretSystemPromptTDD {
	private systemPromptFn: SystemPromptFunction
	private caretLogger: any
	private metrics: SystemPromptMetrics[]

	constructor(systemPromptFn?: SystemPromptFunction, logger?: any) {
		// 의존성 주입: 테스트에서는 Mock 함수, 실제에서는 실제 SYSTEM_PROMPT
		this.systemPromptFn = systemPromptFn || this.getDefaultSystemPrompt()
		this.caretLogger = logger || this.getDefaultLogger()
		this.metrics = []
	}

	private getDefaultLogger(): any {
		// 실제 환경에서만 CaretLogger 사용
		try {
			return CaretLogger.getInstance()
		} catch (error) {
			// 테스트 환경에서는 Mock 로거 반환
			return {
				info: () => {},
				warn: () => {},
				error: () => {},
			}
		}
	}

	private getDefaultSystemPrompt(): SystemPromptFunction {
		// 실제 환경에서만 Cline SYSTEM_PROMPT 임포트
		try {
			const { SYSTEM_PROMPT } = require("@src/core/prompts/system")
			return SYSTEM_PROMPT
		} catch (error) {
			// 테스트 환경에서는 Mock 함수 반환
			return async () => "Default Mock System Prompt"
		}
	}

	async generateSystemPrompt(context: SystemPromptContext): Promise<SystemPromptResult> {
		const startTime = Date.now()

		try {
			this.caretLogger.info("[CaretSystemPromptTDD] Generating system prompt", `cwd: ${context.cwd}, supportsBrowserUse: ${context.supportsBrowserUse}, isClaude4ModelFamily: ${context.isClaude4ModelFamily}, mcpServerCount: ${context.mcpHub.getServers().length}`)

			// Cline 원본 호출 (의존성 주입된 함수 사용)
			const prompt = await this.systemPromptFn(
				context.cwd,
				context.supportsBrowserUse,
				context.mcpHub,
				context.browserSettings,
				context.isClaude4ModelFamily ?? false,
			)

			// 메트릭 수집
			const metrics: SystemPromptMetrics = {
				promptLength: prompt.length,
				toolCount: this.extractToolCount(prompt),
				mcpServerCount: context.mcpHub.getServers().length,
				generationTime: Date.now() - startTime,
				timestamp: Date.now(),
			}

			this.metrics.push(metrics)

			// 성능 경고 (5ms 이상 소요 시)
			if (metrics.generationTime > 5) {
				this.caretLogger.warn("[CaretSystemPromptTDD] Slow prompt generation detected", `generationTime: ${metrics.generationTime}ms, threshold: 5ms`)
			}

			this.caretLogger.info("[CaretSystemPromptTDD] System prompt generated successfully", `promptLength: ${prompt.length}, generationTime: ${metrics.generationTime}ms, toolCount: ${metrics.toolCount}, mcpServerCount: ${metrics.mcpServerCount}`)

			return {
				prompt,
				metrics,
			}
		} catch (error) {
			this.caretLogger.error("[CaretSystemPromptTDD] Failed to generate system prompt", error)
			throw error
		}
	}

	private extractToolCount(prompt: string): number {
		// 간단한 도구 개수 추출 (## 헤더 기준)
		const toolMatches = prompt.match(/^## \w+/gm)
		return toolMatches ? toolMatches.length : 0
	}

	// 메트릭 관련 메서드들
	getMetrics(): SystemPromptMetrics[] {
		return [...this.metrics]
	}

	getAverageGenerationTime(): number {
		if (this.metrics.length === 0) return 0
		const total = this.metrics.reduce((sum, m) => sum + m.generationTime, 0)
		return total / this.metrics.length
	}

	clearMetrics(): void {
		this.metrics = []
	}
}
