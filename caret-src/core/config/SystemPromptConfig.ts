// CARET MODIFICATION: System Prompt Mode Selection Config (003-04)
// Purpose: 단순한 Cline/Caret 모드 선택 시스템

import * as vscode from "vscode"
import { caretLogger } from "../../utils/caret-logger"

export interface SystemPromptConfig {
	mode: "cline" | "caret" // 선택 모드 (auto 모드 제거)
	fallbackToCline: boolean // 에러시 Cline으로 fallback
}

export class SystemPromptConfigManager {
	private static instance: SystemPromptConfigManager | null = null
	private config: SystemPromptConfig | null = null
	private readonly defaultConfig: SystemPromptConfig = {
		mode: "caret", // 기본값을 caret으로 변경
		fallbackToCline: true,
	}

	private constructor() {
		// Singleton pattern
	}

	public static getInstance(): SystemPromptConfigManager {
		if (!SystemPromptConfigManager.instance) {
			SystemPromptConfigManager.instance = new SystemPromptConfigManager()
		}
		return SystemPromptConfigManager.instance
	}

	/**
	 * VSCode 설정에서 현재 설정 로드
	 */
	public async getConfig(): Promise<SystemPromptConfig> {
		try {
			const workspaceConfig = vscode.workspace.getConfiguration("caret.systemPrompt")

			this.config = {
				mode: workspaceConfig.get("mode", this.defaultConfig.mode),
				fallbackToCline: workspaceConfig.get("fallbackToCline", this.defaultConfig.fallbackToCline),
			}

			caretLogger.info(`[SystemPromptConfig] Loaded config: ${JSON.stringify(this.config)}`)
			return this.config
		} catch (error) {
			caretLogger.warn(`[SystemPromptConfig] Failed to load config, using defaults:`, error)
			this.config = { ...this.defaultConfig }
			return this.config
		}
	}

	/**
	 * 시스템 모드 변경
	 */
	public async setMode(mode: "cline" | "caret"): Promise<void> {
		try {
			const workspaceConfig = vscode.workspace.getConfiguration("caret.systemPrompt")
			await workspaceConfig.update("mode", mode, vscode.ConfigurationTarget.Workspace)

			if (this.config) {
				this.config.mode = mode
			}

			caretLogger.success(`[SystemPromptConfig] Mode changed to: ${mode}`)

			// UI에 알림 표시
			vscode.window.showInformationMessage(`🔄 Caret System Prompt Mode: ${mode.toUpperCase()}`)
		} catch (error) {
			caretLogger.error(`[SystemPromptConfig] Failed to set mode to ${mode}:`, error)
			throw error
		}
	}

	/**
	 * 현재 모드가 특정 모드인지 확인
	 */
	public async isMode(mode: "cline" | "caret"): Promise<boolean> {
		const config = await this.getConfig()
		return config.mode === mode
	}

	/**
	 * 설정 초기화
	 */
	public async resetToDefaults(): Promise<void> {
		try {
			const workspaceConfig = vscode.workspace.getConfiguration("caret.systemPrompt")

			await workspaceConfig.update("mode", this.defaultConfig.mode, vscode.ConfigurationTarget.Workspace)
			await workspaceConfig.update(
				"fallbackToCline",
				this.defaultConfig.fallbackToCline,
				vscode.ConfigurationTarget.Workspace,
			)

			this.config = { ...this.defaultConfig }

			caretLogger.success("[SystemPromptConfig] Settings reset to defaults")
			vscode.window.showInformationMessage("🔄 Caret System Prompt settings reset to defaults")
		} catch (error) {
			caretLogger.error("[SystemPromptConfig] Failed to reset settings:", error)
			throw error
		}
	}

	/**
	 * 설정 변경 감지 리스너 등록
	 */
	public onConfigChanged(callback: (config: SystemPromptConfig) => void): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration(async (e) => {
			if (e.affectsConfiguration("caret.systemPrompt")) {
				const newConfig = await this.getConfig()
				callback(newConfig)
			}
		})
	}

	// 003-11, 003-12에서 사용할 수 있는 테스트 도구들
	/**
	 * 테스트용 모드 로깅 (003-11, 003-12에서 활용 가능)
	 */
	public logModeUsage(mode: "cline" | "caret", context: string): void {
		caretLogger.info(`[TEST] Mode: ${mode}, Context: ${context}, Timestamp: ${Date.now()}`)
	}

	/**
	 * 테스트용 설정 스냅샷 (003-11, 003-12에서 활용 가능)
	 */
	public async getConfigSnapshot(): Promise<{ config: SystemPromptConfig; timestamp: number }> {
		const config = await this.getConfig()
		return {
			config: { ...config },
			timestamp: Date.now(),
		}
	}
}
