import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import { caretLogger } from "./caret-logger"
import { updateRuleFileContent } from "../core/updateRuleFileContent"

/**
 * 페르소나 초기화를 담당하는 클래스
 * 처음 설치 시 또는 필요한 경우 페르소나를 초기화합니다.
 */
export class PersonaInitializer {
	private context: vscode.ExtensionContext

	constructor(context: vscode.ExtensionContext) {
		this.context = context
	}

	/**
	 * 페르소나 초기화 실행
	 * template_characters.json에서 isDefault: true 설정된 페르소나를 찾아 설정합니다.
	 */
	public async initialize(): Promise<void> {
		caretLogger.info("PersonaInitializer: 페르소나 초기화 시작")
		try {
			// 1. custom_instructions.md 파일 존재 여부 확인
			const globalRulesDir = await this.ensureRulesDirectoryExists()
			const customInstructionsPath = path.join(globalRulesDir, "custom_instructions.md")

			// 2. 페르소나 이미지 존재 여부 확인
			const personaImagesExist = await this.checkPersonaImagesExist()

			// 둘 다 존재하면 초기화 건너뛰기
			if ((await this.fileExists(customInstructionsPath)) && personaImagesExist) {
				caretLogger.info("PersonaInitializer: 페르소나가 이미 설정되어 있습니다. 초기화 건너뜁니다.")
				return
			}

			// 3. template_characters.json 파일에서 기본 페르소나 찾기
			const defaultPersona = await this.findDefaultPersona()
			if (!defaultPersona) {
				caretLogger.error("PersonaInitializer: 기본 페르소나를 찾을 수 없습니다.")
				return
			}

			caretLogger.info(`PersonaInitializer: 기본 페르소나 '${defaultPersona.character}' 설정`)

			// 4. custom_instructions.md 파일이 없으면 생성/업데이트
			if (!(await this.fileExists(customInstructionsPath))) {
				await this.updateCustomInstructions(defaultPersona)
			}

			// 5. 페르소나 이미지가 없으면 설정
			if (!personaImagesExist) {
				await this.updatePersonaImagesInGlobalStorage(defaultPersona)
				await this.updatePersonaImages(defaultPersona)
			}

			caretLogger.info("PersonaInitializer: 페르소나 초기화 완료")

			// CARET MODIFICATION: 페르소나 초기화 후 웹뷰에 이미지 변경 알림
			try {
				const { CaretProvider } = await import("../core/webview/CaretProvider")
				const provider = CaretProvider.getInstance()
				if (provider) {
					provider.notifyPersonaImagesChanged()
					caretLogger.info("PersonaInitializer: 웹뷰에 페르소나 이미지 변경 알림 전송 완료")
				} else {
					caretLogger.warn("PersonaInitializer: CaretProvider 인스턴스를 찾을 수 없어 알림을 보내지 못했습니다")
				}
			} catch (error) {
				caretLogger.error(`PersonaInitializer: 페르소나 이미지 변경 알림 전송 실패: ${error}`)
			}
		} catch (error) {
			caretLogger.error(`PersonaInitializer: 페르소나 초기화 실패: ${error}`)
		}
	}

	/**
	 * 글로벌 .clinerules 디렉토리를 생성하고 경로를 반환합니다.
	 */
	private async ensureRulesDirectoryExists(): Promise<string> {
		try {
			const homeDir = process.env.HOME || process.env.USERPROFILE || ""
			const globalRulesDir = path.join(homeDir, ".clinerules")

			try {
				await fs.access(globalRulesDir)
			} catch {
				await fs.mkdir(globalRulesDir, { recursive: true })
			}

			return globalRulesDir
		} catch (error) {
			caretLogger.error(`PersonaInitializer: 글로벌 rules 디렉토리 생성 실패: ${error}`)
			throw error
		}
	}

	/**
	 * 파일이 존재하는지 확인합니다.
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * 페르소나 이미지가 존재하는지 확인합니다.
	 */
	private async checkPersonaImagesExist(): Promise<boolean> {
		try {
			const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			// 두 파일이 모두 존재하는지 확인
			return (await this.fileExists(profilePath)) && (await this.fileExists(thinkingPath))
		} catch (error) {
			caretLogger.debug("페르소나 이미지가 존재하지 않습니다:", error)
			return false
		}
	}

	/**
	 * template_characters.json 파일에서 기본 페르소나를 찾습니다.
	 */
	private async findDefaultPersona(): Promise<any> {
		try {
			const templatePath = path.join(
				this.context.extensionPath,
				"caret-assets",
				"template_characters",
				"template_characters.json",
			)

			const templatesRaw = await fs.readFile(templatePath, "utf-8")
			const templates = JSON.parse(templatesRaw)

			// isDefault: true 설정된 기본 페르소나 찾기
			return templates.find((char: any) => char.isDefault === true) || templates[0]
		} catch (error) {
			caretLogger.error(`기본 페르소나 찾기 실패: ${error}`)
			return null
		}
	}

	/**
	 * custom_instructions.md 파일을 생성하거나 업데이트합니다.
	 */
	private async updateCustomInstructions(persona: any): Promise<void> {
		try {
			// 'en' 언어 설정을 기본으로 사용
			const personaData = persona.en || Object.values(persona)[0]
			const personaInstruction = personaData.customInstruction

			if (!personaInstruction) {
				caretLogger.error("PersonaInitializer: 페르소나 지침을 찾을 수 없습니다.")
				return
			}

			// custom_instructions.md 파일 생성/업데이트
			await updateRuleFileContent({
				rulePath: "custom_instructions.md",
				isGlobal: true,
				content: JSON.stringify(personaInstruction, null, 2),
			})

			caretLogger.info("PersonaInitializer: custom_instructions.md 파일 업데이트 완료")
		} catch (error) {
			caretLogger.error(`PersonaInitializer: custom_instructions.md 업데이트 실패: ${error}`)
		}
	}

	/**
	 * 페르소나 이미지를 globalStorage에 복사합니다.
	 */
	private async updatePersonaImagesInGlobalStorage(persona: any): Promise<void> {
		try {
			// 페르소나 디렉토리 생성
			const personaDir = path.join(this.context.globalStorageUri.fsPath, "personas")
			await fs.mkdir(personaDir, { recursive: true })

			// asset: 경로를 실제 파일 경로로 변환
			let normalImagePath = persona.avatarUri
			let thinkingImagePath = persona.thinkingAvatarUri

			if (normalImagePath.startsWith("asset:/assets/")) {
				// template_characters.json에서는 경로가 "asset:/assets/template_characters/..."로 되어 있음
				// 실제 파일 경로는 "caret-assets/template_characters/..."
				normalImagePath = path.join(
					this.context.extensionPath,
					"caret-assets",
					normalImagePath.replace("asset:/assets/", ""),
				)
			} else if (normalImagePath.startsWith("asset:/")) {
				normalImagePath = path.join(this.context.extensionPath, normalImagePath.replace("asset:/", ""))
			}

			if (thinkingImagePath.startsWith("asset:/assets/")) {
				// template_characters.json에서는 경로가 "asset:/assets/template_characters/..."로 되어 있음
				// 실제 파일 경로는 "caret-assets/template_characters/..."
				thinkingImagePath = path.join(
					this.context.extensionPath,
					"caret-assets",
					thinkingImagePath.replace("asset:/assets/", ""),
				)
			} else if (thinkingImagePath.startsWith("asset:/")) {
				thinkingImagePath = path.join(this.context.extensionPath, thinkingImagePath.replace("asset:/", ""))
			}

			caretLogger.debug(
				`PersonaInitializer: globalStorage 이미지 경로 변환 - normal: ${normalImagePath}, thinking: ${thinkingImagePath}`,
			)

			// 이미지 파일 복사
			const profileDst = path.join(personaDir, "agent_profile.png")
			const thinkingDst = path.join(personaDir, "agent_thinking.png")

			await fs.copyFile(normalImagePath, profileDst)
			await fs.copyFile(thinkingImagePath, thinkingDst)

			caretLogger.info(`PersonaInitializer: 페르소나 이미지를 globalStorage에 복사 완료 (${persona.character})`)
		} catch (error) {
			caretLogger.error(`PersonaInitializer: 페르소나 이미지 복사 실패: ${error}`)
		}
	}

	/**
	 * 페르소나 이미지를 업데이트합니다.
	 */
	private async updatePersonaImages(persona: any): Promise<void> {
		try {
			// asset: 경로를 실제 파일 경로로 변환
			let normalImagePath = persona.avatarUri
			let thinkingImagePath = persona.thinkingAvatarUri

			if (normalImagePath.startsWith("asset:/assets/")) {
				// template_characters.json에서는 경로가 "asset:/assets/template_characters/..."로 되어 있음
				// 실제 파일 경로는 "caret-assets/template_characters/..."
				normalImagePath = path.join(
					this.context.extensionPath,
					"caret-assets",
					normalImagePath.replace("asset:/assets/", ""),
				)
			} else if (normalImagePath.startsWith("asset:/")) {
				normalImagePath = path.join(this.context.extensionPath, normalImagePath.replace("asset:/", ""))
			}

			if (thinkingImagePath.startsWith("asset:/assets/")) {
				// template_characters.json에서는 경로가 "asset:/assets/template_characters/..."로 되어 있음
				// 실제 파일 경로는 "caret-assets/template_characters/..."
				thinkingImagePath = path.join(
					this.context.extensionPath,
					"caret-assets",
					thinkingImagePath.replace("asset:/assets/", ""),
				)
			} else if (thinkingImagePath.startsWith("asset:/")) {
				thinkingImagePath = path.join(this.context.extensionPath, thinkingImagePath.replace("asset:/", ""))
			}

			caretLogger.debug(`PersonaInitializer: 이미지 경로 변환 - normal: ${normalImagePath}, thinking: ${thinkingImagePath}`)

			// 1. caret-assets 디렉토리에 이미지 복사 (simple-persona-image 사용)
			const { replacePersonaImage } = await import("./simple-persona-image")
			await replacePersonaImage("normal", normalImagePath, this.context.extensionPath)
			await replacePersonaImage("thinking", thinkingImagePath, this.context.extensionPath)

			// 2. globalStorage에 이미지 복사 (persona-storage 사용)
			const { replacePersonaImageFromTemplate } = await import("./persona-storage")
			await replacePersonaImageFromTemplate(this.context, "normal", normalImagePath)
			await replacePersonaImageFromTemplate(this.context, "thinking", thinkingImagePath)

			caretLogger.info("PersonaInitializer: 페르소나 이미지 업데이트 완료")
		} catch (error) {
			caretLogger.error(`PersonaInitializer: 페르소나 이미지 업데이트 실패: ${error}`)
		}
	}

	/**
	 * 언어 설정 시 기본 페르소나 자동 설정
	 * 기존 persona-initialization.ts의 initializeDefaultPersonaOnLanguageSet 대체 함수
	 */
	public async initializeOnLanguageSet(language: string): Promise<void> {
		caretLogger.info(`PersonaInitializer: 언어 설정에 따른 페르소나 초기화 시작 (${language})`)

		// 페르소나가 이미 설정되어 있는지 확인
		const personaImagesExist = await this.checkPersonaImagesExist()

		if (personaImagesExist) {
			caretLogger.info("PersonaInitializer: 페르소나 이미지가 이미 존재합니다. 초기화 건너뜁니다.")
			return
		}

		// 기본 초기화 실행
		await this.initialize()

		caretLogger.info(`PersonaInitializer: 언어 설정에 따른 페르소나 초기화 완료 (${language})`)

		// CARET MODIFICATION: 언어 설정 시 페르소나 초기화 후 웹뷰에 이미지 변경 알림
		try {
			const { CaretProvider } = await import("../core/webview/CaretProvider")
			const provider = CaretProvider.getInstance()
			if (provider) {
				provider.notifyPersonaImagesChanged()
				caretLogger.info("PersonaInitializer: 언어 설정 후 웹뷰에 페르소나 이미지 변경 알림 전송 완료")
			} else {
				caretLogger.warn(
					"PersonaInitializer: 언어 설정 후 CaretProvider 인스턴스를 찾을 수 없어 알림을 보내지 못했습니다",
				)
			}
		} catch (error) {
			caretLogger.error(`PersonaInitializer: 언어 설정 후 페르소나 이미지 변경 알림 전송 실패: ${error}`)
		}
	}
}

/**
 * 페르소나 데이터 완전 삭제 (디버그 메뉴 초기화용)
 * 기존 persona-initialization.ts의 resetPersonaData 함수를 유지
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
