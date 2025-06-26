/**
 * System Information Extraction Module
 *
 * Handles extraction of system information from Cline system prompts.
 * Separated from main validator following Single Responsibility Principle.
 */

import { CaretLogger } from "../../../utils/caret-logger"
import { SystemInfo } from "../types"

export class SystemInfoExtractor {
	private caretLogger: CaretLogger

	// System info patterns
	private static readonly PATTERNS = {
		OS_INFO: /Operating System:\s*(.+)$/m,
		SHELL_INFO: /Default Shell:\s*(.+)$/m,
		HOME_DIR: /Home Directory:\s*(.+)$/m,
		WORKING_DIR: /Current Working Directory:\s*(.+)$/m,
	}

	constructor() {
		this.caretLogger = new CaretLogger()
	}

	/**
	 * Extract system information from prompt
	 */
	async extractSystemInfo(prompt: string): Promise<SystemInfo> {
		try {
			this.caretLogger.debug("[SystemInfoExtractor] Starting system info extraction", "EXTRACTION")

			const osMatch = prompt.match(SystemInfoExtractor.PATTERNS.OS_INFO)
			const shellMatch = prompt.match(SystemInfoExtractor.PATTERNS.SHELL_INFO)
			const homeMatch = prompt.match(SystemInfoExtractor.PATTERNS.HOME_DIR)
			const workingMatch = prompt.match(SystemInfoExtractor.PATTERNS.WORKING_DIR)

			const systemInfo: SystemInfo = {
				operatingSystem: osMatch ? osMatch[1].trim() : "",
				defaultShell: shellMatch ? shellMatch[1].trim() : "",
				homeDirectory: homeMatch ? homeMatch[1].trim() : "",
				currentWorkingDirectory: workingMatch ? workingMatch[1].trim() : "",
			}

			this.caretLogger.debug("[SystemInfoExtractor] System info extraction completed", "EXTRACTION")
			return systemInfo
		} catch (error) {
			this.caretLogger.error("[SystemInfoExtractor] System info extraction failed", "EXTRACTION")
			throw error
		}
	}

	/**
	 * Validate system information completeness
	 */
	validateSystemInfo(systemInfo: SystemInfo): boolean {
		const requiredFields = ["operatingSystem", "defaultShell", "homeDirectory", "currentWorkingDirectory"]

		return requiredFields.every(
			(field) => systemInfo[field as keyof SystemInfo] && systemInfo[field as keyof SystemInfo].trim().length > 0,
		)
	}

	/**
	 * Compare two system info objects
	 */
	compareSystemInfo(
		original: SystemInfo,
		modified: SystemInfo,
	): {
		isIdentical: boolean
		differences: string[]
	} {
		const differences: string[] = []

		if (original.operatingSystem !== modified.operatingSystem) {
			differences.push(`Operating System: "${original.operatingSystem}" → "${modified.operatingSystem}"`)
		}

		if (original.defaultShell !== modified.defaultShell) {
			differences.push(`Default Shell: "${original.defaultShell}" → "${modified.defaultShell}"`)
		}

		if (original.homeDirectory !== modified.homeDirectory) {
			differences.push(`Home Directory: "${original.homeDirectory}" → "${modified.homeDirectory}"`)
		}

		if (original.currentWorkingDirectory !== modified.currentWorkingDirectory) {
			differences.push(`Working Directory: "${original.currentWorkingDirectory}" → "${modified.currentWorkingDirectory}"`)
		}

		return {
			isIdentical: differences.length === 0,
			differences,
		}
	}

	/**
	 * Generate system info summary
	 */
	generateSystemInfoSummary(systemInfo: SystemInfo): string {
		return `System: ${systemInfo.operatingSystem} | Shell: ${systemInfo.defaultShell} | Home: ${systemInfo.homeDirectory} | CWD: ${systemInfo.currentWorkingDirectory}`
	}
}
