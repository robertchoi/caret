// CARET MODIFICATION: Caret 전용 로깅 시스템
// Cline의 기본 로깅 시스템을 확장하여 Caret 전용 로그를 제공합니다.

import { OutputChannel } from "vscode"

export enum CaretLogLevel {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
	SUCCESS = "SUCCESS",
}

export class CaretLogger {
	private static instance: CaretLogger
	private outputChannel: OutputChannel | null = null
	private logLevel: CaretLogLevel
	private isDev: boolean

	constructor(outputChannel?: OutputChannel) {
		this.outputChannel = outputChannel || null
		
		// CARET MODIFICATION: 빌드 시점에서 결정된 IS_DEV 환경변수 기반으로 로그 레벨 자동 설정
		this.isDev = process.env.IS_DEV === "true"
		this.logLevel = this.isDev ? CaretLogLevel.DEBUG : CaretLogLevel.INFO
	}

	// CARET MODIFICATION: Singleton pattern support
	static getInstance(outputChannel?: OutputChannel): CaretLogger {
		if (!CaretLogger.instance) {
			CaretLogger.instance = new CaretLogger(outputChannel)
		}
		return CaretLogger.instance
	}

	setOutputChannel(outputChannel: OutputChannel): void {
		this.outputChannel = outputChannel
	}

	setLogLevel(level: CaretLogLevel): void {
		this.logLevel = level
	}

	private shouldLog(level: CaretLogLevel): boolean {
		const levels = [CaretLogLevel.DEBUG, CaretLogLevel.INFO, CaretLogLevel.WARN, CaretLogLevel.ERROR, CaretLogLevel.SUCCESS]
		const currentLevelIndex = levels.indexOf(this.logLevel)
		const messageLevelIndex = levels.indexOf(level)
		return messageLevelIndex >= currentLevelIndex
	}

	private formatMessage(level: CaretLogLevel, message: string, context?: string): string {
		const timestamp = new Date().toISOString()
		const contextStr = context ? ` [${context}]` : ""
		return `[${timestamp}] [CARET-${level}]${contextStr} ${message}`
	}

	private log(level: CaretLogLevel, message: string, context?: string): void {
		if (!this.shouldLog(level)) return

		const formattedMessage = this.formatMessage(level, message, context)

		// VSCode 출력 채널에 로깅
		if (this.outputChannel && typeof this.outputChannel.appendLine === 'function') {
			this.outputChannel.appendLine(formattedMessage)
		}

		// CARET MODIFICATION: 콘솔 출력도 개발 모드에서만 (프로덕션에서는 VSCode 출력 채널만 사용)
		if (this.isDev) {
		switch (level) {
			case CaretLogLevel.DEBUG:
				console.debug(formattedMessage)
				break
			case CaretLogLevel.INFO:
			case CaretLogLevel.SUCCESS:
				console.info(formattedMessage)
				break
			case CaretLogLevel.WARN:
				console.warn(formattedMessage)
				break
			case CaretLogLevel.ERROR:
				console.error(formattedMessage)
				break
			}
		}
	}

	debug(message: string, context?: string): void {
		this.log(CaretLogLevel.DEBUG, message, context)
	}

	info(message: string, context?: string): void {
		this.log(CaretLogLevel.INFO, message, context)
	}

	warn(message: string, context?: string): void {
		this.log(CaretLogLevel.WARN, message, context)
	}

	error(message: string, context?: string): void {
		this.log(CaretLogLevel.ERROR, message, context)
	}

	success(message: string, context?: string): void {
		this.log(CaretLogLevel.SUCCESS, message, context)
	}

	// Caret 전용 로깅 메서드들
	welcomePageLoaded(): void {
		this.info("Caret 웰컴 페이지가 로드되었습니다", "UI")
	}

	apiConfigured(provider: string): void {
		this.success(`API 설정이 완료되었습니다: ${provider}`, "CONFIG")
	}

	taskStarted(taskName: string): void {
		this.info(`작업이 시작되었습니다: ${taskName}`, "TASK")
	}

	taskCompleted(taskName: string, duration?: number): void {
		const durationStr = duration ? ` (${duration}ms)` : ""
		this.success(`작업이 완료되었습니다: ${taskName}${durationStr}`, "TASK")
	}

	userInteraction(action: string, details?: string): void {
		const detailsStr = details ? ` - ${details}` : ""
		this.debug(`사용자 상호작용: ${action}${detailsStr}`, "USER")
	}

	extensionActivated(): void {
		this.success("Caret 익스텐션이 활성화되었습니다", "EXTENSION")
	}

	extensionDeactivated(): void {
		this.info("Caret 익스텐션이 비활성화되었습니다", "EXTENSION")
	}
}

// 싱글톤 인스턴스
export const caretLogger = new CaretLogger()

// Caret 로깅 유틸리티 함수들
export const logCaretWelcome = () => caretLogger.welcomePageLoaded()
export const logCaretApiConfig = (provider: string) => caretLogger.apiConfigured(provider)
export const logCaretTask = (taskName: string, action: "start" | "complete", duration?: number) => {
	if (action === "start") {
		caretLogger.taskStarted(taskName)
	} else {
		caretLogger.taskCompleted(taskName, duration)
	}
}
export const logCaretUser = (action: string, details?: string) => caretLogger.userInteraction(action, details)
