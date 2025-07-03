// CARET MODIFICATION: Logger.ts를 CaretLogger로 통합하여 개발/프로덕션 모드 필터링 추가
// Original backed up to: src/services/logging/Logger.ts.cline
// Purpose: Cline Logger의 무조건 출력 문제를 해결하고 CaretLogger의 고급 기능 활용

import type { OutputChannel } from "vscode"
import { ErrorService } from "../error/ErrorService"
import { CaretLogger, CaretLogLevel } from "../../../caret-src/utils/caret-logger"

/**
 * CaretLogger 기반 로깅 유틸리티 (백엔드용)
 * 개발 모드 필터링과 컨텍스트 지원을 제공하며 기존 Cline Logger API와 호환됩니다.
 */
export class Logger {
	private static caretLogger: CaretLogger
	private static isDev: boolean = false

	static initialize(outputChannel: OutputChannel) {
		Logger.caretLogger = new CaretLogger(outputChannel)
		Logger.isDev = process.env.IS_DEV === "true"		
	}

	static error(message: string, exception?: Error) {
		Logger.caretLogger.error(message, "CLINE")
		ErrorService.logMessage(message, "error")
		exception && ErrorService.logException(exception)
	}
	
	static warn(message: string) {
		Logger.caretLogger.warn(message, "CLINE")
		ErrorService.logMessage(message, "warning")
	}
	
	static log(message: string) {
		Logger.caretLogger.info(message, "CLINE")
	}
	
	static debug(message: string) {
		// 개발 모드에서만 디버그 로그 출력
		if (Logger.isDev) {
			Logger.caretLogger.debug(message, "CLINE")
		}
	}
	
	static info(message: string) {
		Logger.caretLogger.info(message, "CLINE")
	}
	
	static trace(message: string) {
		// 개발 모드에서만 트레이스 로그 출력
		if (Logger.isDev) {
			Logger.caretLogger.debug(`[TRACE] ${message}`, "CLINE")
		}
	}
}
