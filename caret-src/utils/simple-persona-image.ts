import * as fs from "fs/promises"
import * as path from "path"
import { caretLogger } from "./caret-logger"

// CARET MODIFICATION: 단순한 2파일 페르소나 이미지 시스템
export interface SimplePersonaImages {
	avatarUri: string
	thinkingAvatarUri: string
}

/**
 * agent_profile.png와 agent_thinking.png 파일을 직접 로드하여 base64 URI 반환
 */
export async function loadSimplePersonaImages(extensionPath: string): Promise<SimplePersonaImages> {
	try {
		const agentProfilePath = path.join(extensionPath, "caret-assets/agent_profile.png")
		const agentThinkingPath = path.join(extensionPath, "caret-assets/agent_thinking.png")

		caretLogger.debug(`Loading simple persona images from: ${agentProfilePath}, ${agentThinkingPath}`)

		// 두 파일을 동시에 로드
		const [profileBuffer, thinkingBuffer] = await Promise.all([
			fs.readFile(agentProfilePath),
			fs.readFile(agentThinkingPath),
		])

		// base64 데이터 URI로 변환
		const avatarUri = `data:image/png;base64,${profileBuffer.toString("base64")}`
		const thinkingAvatarUri = `data:image/png;base64,${thinkingBuffer.toString("base64")}`

		caretLogger.info(`Simple persona images loaded successfully. Profile: ${profileBuffer.length} bytes, Thinking: ${thinkingBuffer.length} bytes`)

		return {
			avatarUri,
			thinkingAvatarUri,
		}
	} catch (error) {
		caretLogger.error(`Failed to load simple persona images: ${error}`)
		return {
			avatarUri: "",
			thinkingAvatarUri: "",
		}
	}
}

/**
 * 페르소나 선택 시 템플릿 이미지를 agent_profile.png 또는 agent_thinking.png로 복사
 */
export async function replacePersonaImage(
	imageType: "normal" | "thinking",
	sourceImagePath: string,
	extensionPath: string,
): Promise<void> {
	try {
		const targetFileName = imageType === "normal" ? "agent_profile.png" : "agent_thinking.png"
		const targetPath = path.join(extensionPath, "caret-assets", targetFileName)

		caretLogger.debug(`Replacing persona image: ${sourceImagePath} -> ${targetPath}`)

		// 소스 이미지를 타겟 경로로 복사
		const imageBuffer = await fs.readFile(sourceImagePath)
		await fs.writeFile(targetPath, imageBuffer)

		caretLogger.info(`Persona image replaced successfully: ${targetFileName} (${imageBuffer.length} bytes)`)
	} catch (error) {
		caretLogger.error(`Failed to replace persona image: ${error}`)
		throw error
	}
}

/**
 * 커스텀 이미지 업로드 시 base64 데이터를 agent_profile.png 또는 agent_thinking.png로 저장
 */
export async function uploadCustomPersonaImage(
	imageType: "normal" | "thinking",
	base64Data: string,
	extensionPath: string,
): Promise<void> {
	try {
		const targetFileName = imageType === "normal" ? "agent_profile.png" : "agent_thinking.png"
		const targetPath = path.join(extensionPath, "caret-assets", targetFileName)

		caretLogger.debug(`Uploading custom persona image: ${imageType} -> ${targetPath}`)

		// base64 데이터를 버퍼로 변환
		const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, "")
		const imageBuffer = Buffer.from(base64String, "base64")

		// 타겟 경로에 이미지 저장
		await fs.writeFile(targetPath, imageBuffer)

		caretLogger.info(`Custom persona image uploaded successfully: ${targetFileName} (${imageBuffer.length} bytes)`)
	} catch (error) {
		caretLogger.error(`Failed to upload custom persona image: ${error}`)
		throw error
	}
} 