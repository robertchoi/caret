import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import { caretLogger } from "./caret-logger"

/**
 * 페르소나 데이터 초기화 관리 모듈
 * - 디버그 메뉴 초기화 시 페르소나 데이터 삭제
 * - 언어 설정 시 기본 페르소나(사랑이) 자동 설정
 */

/**
 * 페르소나 데이터가 존재하는지 확인
 */
export async function isPersonaDataExists(context: vscode.ExtensionContext): Promise<boolean> {
	try {
		const personaDir = path.join(context.globalStorageUri.fsPath, "personas")
		const profilePath = path.join(personaDir, "agent_profile.png")
		const thinkingPath = path.join(personaDir, "agent_thinking.png")

		// 두 파일이 모두 존재하는지 확인
		await fs.access(profilePath)
		await fs.access(thinkingPath)
		return true
	} catch (error) {
		caretLogger.debug("Persona data does not exist:", error)
		return false
	}
}

/**
 * 페르소나 데이터 완전 삭제 (디버그 메뉴 초기화용)
 */
export async function resetPersonaData(context: vscode.ExtensionContext): Promise<void> {
	try {
		const personaDir = path.join(context.globalStorageUri.fsPath, "personas")
		await fs.rm(personaDir, { recursive: true, force: true })
		caretLogger.info("Persona data reset completed")
	} catch (error) {
		caretLogger.warn("Failed to reset persona data (this is normal if no data exists):", error)
	}
}

/**
 * 언어 설정 시 기본 페르소나(사랑이) 자동 설정
 */
export async function initializeDefaultPersonaOnLanguageSet(context: vscode.ExtensionContext, language: string): Promise<void> {
	try {
		// 이미 페르소나가 설정되어 있으면 스킵
		const personaExists = await isPersonaDataExists(context)
		if (personaExists) {
			caretLogger.debug("Persona already exists, skipping initialization")
			return
		}

		caretLogger.info(`Initializing default persona (sarang) for language: ${language}`)

		// 1. 페르소나 디렉토리 생성
		const personaDir = path.join(context.globalStorageUri.fsPath, "personas")
		await fs.mkdir(personaDir, { recursive: true })

		// 2. 사랑이 이미지 복사
		const sarangProfileSrc = path.join(context.extensionPath, "caret-assets/template_characters/sarang.png")
		const sarangThinkingSrc = path.join(context.extensionPath, "caret-assets/template_characters/sarang_thinking.png")
		const profileDst = path.join(personaDir, "agent_profile.png")
		const thinkingDst = path.join(personaDir, "agent_thinking.png")

		await fs.copyFile(sarangProfileSrc, profileDst)
		await fs.copyFile(sarangThinkingSrc, thinkingDst)

		// 3. 사랑이 커스텀 인스트럭션 설정
		await setDefaultPersonaInstructions(context, language)

		caretLogger.info("Default persona (sarang) initialized successfully")
	} catch (error) {
		caretLogger.error("Failed to initialize default persona:", error)
		throw error
	}
}

/**
 * 사랑이 페르소나의 커스텀 인스트럭션을 설정
 */
async function setDefaultPersonaInstructions(context: vscode.ExtensionContext, language: string): Promise<void> {
	try {
		// 템플릿 캐릭터 데이터 로드
		const templatePath = path.join(context.extensionPath, "caret-assets/template_characters/template_characters.json")
		const templatesRaw = await fs.readFile(templatePath, "utf-8")
		const templates = JSON.parse(templatesRaw)

		// 사랑이 템플릿 찾기
		const sarangTemplate = templates.find((t: any) => t.character === "sarang")
		if (!sarangTemplate) {
			throw new Error("Sarang template not found")
		}

		// 언어에 맞는 인스트럭션 선택
		const localeData = sarangTemplate[language] || sarangTemplate.en
		const customInstruction = JSON.stringify(localeData.customInstruction, null, 2)

		// custom_instructions.md에 저장
		const rulesDir = path.join(context.globalStorageUri.fsPath, "rules")
		await fs.mkdir(rulesDir, { recursive: true })
		const instructionsPath = path.join(rulesDir, "custom_instructions.md")
		await fs.writeFile(instructionsPath, customInstruction, "utf-8")

		caretLogger.debug(`Default persona instructions set for language: ${language}`)
	} catch (error) {
		caretLogger.error("Failed to set default persona instructions:", error)
		throw error
	}
}
