import { describe, it, expect, vi, beforeEach } from "vitest"
import { PersonaInitializer } from "../utils/persona-initializer"
import * as fs from "fs/promises"
import * as path from "path"

// 모듈 모킹
vi.mock("fs/promises")
vi.mock("path")
vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}))
vi.mock("../core/updateRuleFileContent", () => ({
	updateRuleFileContent: vi.fn().mockResolvedValue({ success: true, filePath: "/mock/.clinerules/custom_instructions.md" }),
}))
vi.mock("../utils/simple-persona-image", () => ({
	replacePersonaImage: vi.fn().mockResolvedValue(undefined),
}))

// 환경 변수 모킹
vi.stubEnv("HOME", "/mock/home")

describe("PersonaInitializer", () => {
	const mockContext = {
		extensionPath: "/mock/extension/path",
		globalStorageUri: { fsPath: "/mock/global/storage" },
		workspaceState: {
			get: vi.fn(),
			update: vi.fn(),
		},
		globalState: {
			get: vi.fn(),
			update: vi.fn(),
		},
	} as any

	// 템플릿 캐릭터 모킹 데이터
	const mockTemplateCharacters = [
		{
			character: "caret",
			en: {
				name: "Caret",
				description: "A friendly robot who loves to code.",
				customInstruction: { persona: { name: "Caret" } },
			},
			avatarUri: "asset:/assets/template_characters/caret.png",
			thinkingAvatarUri: "asset:/assets/template_characters/caret_thinking.png",
			isDefault: true,
		},
		{
			character: "sarang",
			en: {
				name: "Sarang",
				description: "K-pop idol assistant.",
				customInstruction: { persona: { name: "Sarang" } },
			},
			avatarUri: "asset:/assets/template_characters/sarang.png",
			thinkingAvatarUri: "asset:/assets/template_characters/sarang_thinking.png",
			isDefault: false,
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()

		// 파일 시스템 모킹
		vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
			if (filePath.includes("template_characters.json")) {
				return Promise.resolve(JSON.stringify(mockTemplateCharacters) as any)
			}
			return Promise.reject(new Error(`파일을 찾을 수 없음: ${filePath}`))
		})

		vi.mocked(fs.access).mockImplementation((filePath: any) => {
			if (filePath.includes("custom_instructions.md")) {
				return Promise.reject(new Error("파일 없음")) // 기본적으로 파일이 없는 것으로 설정
			}
			return Promise.resolve(undefined as any)
		})

		vi.mocked(fs.mkdir).mockResolvedValue(undefined as any)

		vi.mocked(path.join).mockImplementation((...args: string[]) => args.join("/"))
	})

	it("파일이 없는 경우 새로 생성해야 함", async () => {
		// fs.access가 reject를 반환하여 파일이 없음을 시뮬레이션
		const { updateRuleFileContent } = await import("../core/updateRuleFileContent")
		const { replacePersonaImage } = await import("../utils/simple-persona-image")

		const initializer = new PersonaInitializer(mockContext)
		await initializer.initialize()

		// custom_instructions.md 파일 생성 확인
		expect(updateRuleFileContent).toHaveBeenCalledWith({
			rulePath: "custom_instructions.md",
			isGlobal: true,
			content: expect.stringContaining("Caret"),
		})

		// 이미지 복사 확인
		expect(replacePersonaImage).toHaveBeenCalledTimes(2)
		expect(replacePersonaImage).toHaveBeenCalledWith("normal", expect.stringContaining("caret.png"), "/mock/extension/path")
		expect(replacePersonaImage).toHaveBeenCalledWith(
			"thinking",
			expect.stringContaining("caret_thinking.png"),
			"/mock/extension/path",
		)
	})

	it("파일이 이미 있는 경우 초기화를 건너뛰어야 함", async () => {
		// fs.access가 resolve를 반환하여 파일이 이미 있음을 시뮬레이션
		vi.mocked(fs.access).mockImplementation((filePath: any) => {
			if (filePath.includes("custom_instructions.md")) {
				return Promise.resolve(undefined as any) // 파일 존재
			}
			return Promise.resolve(undefined as any)
		})

		const { updateRuleFileContent } = await import("../core/updateRuleFileContent")
		const { replacePersonaImage } = await import("../utils/simple-persona-image")

		const initializer = new PersonaInitializer(mockContext)
		await initializer.initialize()

		// 파일이 이미 있으므로 호출되지 않아야 함
		expect(updateRuleFileContent).not.toHaveBeenCalled()
		expect(replacePersonaImage).not.toHaveBeenCalled()
	})

	it("파일 읽기 에러 발생 시 처리해야 함", async () => {
		vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("파일 읽기 실패"))

		const initializer = new PersonaInitializer(mockContext)
		await initializer.initialize() // 에러가 발생해도 초기화 함수는 정상적으로 실행 완료

		const { updateRuleFileContent } = await import("../core/updateRuleFileContent")
		expect(updateRuleFileContent).not.toHaveBeenCalled()
	})

	it("기본 페르소나가 없는 경우 첫 번째 항목을 사용해야 함", async () => {
		// isDefault가 없는 템플릿 데이터
		const noDefaultMockData = [
			{
				character: "ichika",
				en: {
					name: "Ichika",
					description: "Windows assistant.",
					customInstruction: { persona: { name: "Ichika" } },
				},
				avatarUri: "asset:/assets/template_characters/ichika.png",
				thinkingAvatarUri: "asset:/assets/template_characters/ichika_thinking.png",
			},
			{
				character: "cyan",
				en: {
					name: "Cyan",
					description: "macOS assistant.",
					customInstruction: { persona: { name: "Cyan" } },
				},
				avatarUri: "asset:/assets/template_characters/cyan.png",
				thinkingAvatarUri: "asset:/assets/template_characters/cyan_thinking.png",
			},
		]

		vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
			if (filePath.includes("template_characters.json")) {
				return Promise.resolve(JSON.stringify(noDefaultMockData) as any)
			}
			return Promise.reject(new Error(`파일을 찾을 수 없음: ${filePath}`))
		})

		const { updateRuleFileContent } = await import("../core/updateRuleFileContent")

		const initializer = new PersonaInitializer(mockContext)
		await initializer.initialize()

		// 첫 번째 항목인 Ichika가 선택되어야 함
		expect(updateRuleFileContent).toHaveBeenCalledWith({
			rulePath: "custom_instructions.md",
			isGlobal: true,
			content: expect.stringContaining("Ichika"),
		})
	})
})
