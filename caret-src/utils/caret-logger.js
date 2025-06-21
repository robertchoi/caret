"use strict"
// CARET MODIFICATION: Caret 전용 로깅 시스템
// Cline의 기본 로깅 시스템을 확장하여 Caret 전용 로그를 제공합니다.
Object.defineProperty(exports, "__esModule", { value: true })
exports.logCaretUser =
	exports.logCaretTask =
	exports.logCaretApiConfig =
	exports.logCaretWelcome =
	exports.caretLogger =
	exports.CaretLogger =
	exports.CaretLogLevel =
		void 0
var CaretLogLevel
;(function (CaretLogLevel) {
	CaretLogLevel["DEBUG"] = "DEBUG"
	CaretLogLevel["INFO"] = "INFO"
	CaretLogLevel["WARN"] = "WARN"
	CaretLogLevel["ERROR"] = "ERROR"
	CaretLogLevel["SUCCESS"] = "SUCCESS"
})(CaretLogLevel || (exports.CaretLogLevel = CaretLogLevel = {}))
class CaretLogger {
	outputChannel = null
	logLevel = CaretLogLevel.DEBUG
	constructor(outputChannel) {
		this.outputChannel = outputChannel || null
	}
	setOutputChannel(outputChannel) {
		this.outputChannel = outputChannel
	}
	setLogLevel(level) {
		this.logLevel = level
	}
	shouldLog(level) {
		const levels = [CaretLogLevel.DEBUG, CaretLogLevel.INFO, CaretLogLevel.WARN, CaretLogLevel.ERROR, CaretLogLevel.SUCCESS]
		const currentLevelIndex = levels.indexOf(this.logLevel)
		const messageLevelIndex = levels.indexOf(level)
		return messageLevelIndex >= currentLevelIndex
	}
	formatMessage(level, message, context) {
		const timestamp = new Date().toISOString()
		const contextStr = context ? ` [${context}]` : ""
		return `[${timestamp}] [CARET-${level}]${contextStr} ${message}`
	}
	log(level, message, context) {
		if (!this.shouldLog(level)) return
		const formattedMessage = this.formatMessage(level, message, context)
		// VSCode 출력 채널에 로깅
		if (this.outputChannel) {
			this.outputChannel.appendLine(formattedMessage)
		}
		// 콘솔에도 로깅 (개발 중)
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
	debug(message, context) {
		this.log(CaretLogLevel.DEBUG, message, context)
	}
	info(message, context) {
		this.log(CaretLogLevel.INFO, message, context)
	}
	warn(message, context) {
		this.log(CaretLogLevel.WARN, message, context)
	}
	error(message, context) {
		this.log(CaretLogLevel.ERROR, message, context)
	}
	success(message, context) {
		this.log(CaretLogLevel.SUCCESS, message, context)
	}
	// Caret 전용 로깅 메서드들
	welcomePageLoaded() {
		this.info("Caret 웰컴 페이지가 로드되었습니다", "UI")
	}
	apiConfigured(provider) {
		this.success(`API 설정이 완료되었습니다: ${provider}`, "CONFIG")
	}
	taskStarted(taskName) {
		this.info(`작업이 시작되었습니다: ${taskName}`, "TASK")
	}
	taskCompleted(taskName, duration) {
		const durationStr = duration ? ` (${duration}ms)` : ""
		this.success(`작업이 완료되었습니다: ${taskName}${durationStr}`, "TASK")
	}
	userInteraction(action, details) {
		const detailsStr = details ? ` - ${details}` : ""
		this.debug(`사용자 상호작용: ${action}${detailsStr}`, "USER")
	}
	extensionActivated() {
		this.success("Caret 익스텐션이 활성화되었습니다", "EXTENSION")
	}
	extensionDeactivated() {
		this.info("Caret 익스텐션이 비활성화되었습니다", "EXTENSION")
	}
}
exports.CaretLogger = CaretLogger
// 싱글톤 인스턴스
exports.caretLogger = new CaretLogger()
// Caret 로깅 유틸리티 함수들
const logCaretWelcome = () => exports.caretLogger.welcomePageLoaded()
exports.logCaretWelcome = logCaretWelcome
const logCaretApiConfig = (provider) => exports.caretLogger.apiConfigured(provider)
exports.logCaretApiConfig = logCaretApiConfig
const logCaretTask = (taskName, action, duration) => {
	if (action === "start") {
		exports.caretLogger.taskStarted(taskName)
	} else {
		exports.caretLogger.taskCompleted(taskName, duration)
	}
}
exports.logCaretTask = logCaretTask
const logCaretUser = (action, details) => exports.caretLogger.userInteraction(action, details)
exports.logCaretUser = logCaretUser
//# sourceMappingURL=caret-logger.js.map
