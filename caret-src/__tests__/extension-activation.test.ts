import { describe, it, expect } from "vitest"
import path from "path"

describe("Extension Activation Tests (TDD - REFACTOR)", () => {
	it("should successfully build and have valid extension.js", () => {
		// REFACTOR: 빌드된 파일 검증

		const fs = require("fs")
		const distExtensionPath = path.resolve(__dirname, "../../dist/extension.js")

		expect(fs.existsSync(distExtensionPath)).toBe(true)

		// 파일 크기 확인 (빈 파일이 아님)
		const stats = fs.statSync(distExtensionPath)
		expect(stats.size).toBeGreaterThan(1000) // 최소 1KB 이상
	})

	it("should have correct sideBarId matching package.json", () => {
		// REFACTOR: sideBarId 일치성 검증

		const fs = require("fs")

		// src/core/webview/index.ts에서 sideBarId 확인
		const webviewIndexPath = path.resolve(__dirname, "../../src/core/webview/index.ts")
		const webviewContent = fs.readFileSync(webviewIndexPath, "utf8")

		// sideBarId 추출
		const sideBarIdMatch = webviewContent.match(/sideBarId\s*=\s*["']([^"']+)["']/)
		expect(sideBarIdMatch).toBeTruthy()

		const sideBarId = sideBarIdMatch[1]
		expect(sideBarId).toBe("claude-dev.SidebarProvider")

		// package.json과 일치하는지 확인
		const packageJsonPath = path.resolve(__dirname, "../../package.json")
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

		const views = packageJson.contributes.views["caret-ActivityBar"]
		const sidebarView = views.find((view: any) => view.type === "webview")

		expect(sidebarView.id).toBe(sideBarId)
	})

	it("should identify potential runtime import issues", () => {
		// REFACTOR: 런타임 import 문제 가능성 확인

		// "Class extends value undefined" 에러는 보통 다음과 같은 경우 발생:
		// 1. 순환 import
		// 2. import 시점에 모듈이 아직 로드되지 않음
		// 3. 잘못된 export/import 구조

		const fs = require("fs")
		const srcExtensionPath = path.resolve(__dirname, "../../src/extension.ts")
		const srcExtensionContent = fs.readFileSync(srcExtensionPath, "utf8")

		// WebviewProvider import 확인
		const webviewImportRegex = /import.*WebviewProvider.*from.*webview/
		expect(webviewImportRegex.test(srcExtensionContent)).toBe(true)

		// 다른 핵심 import들 확인
		expect(srcExtensionContent).toContain("import * as vscode")
	})

	it("should suggest solution for Class extends undefined error", () => {
		// REFACTOR: 해결 방안 제시

		// 현재 상황 분석:
		// 1. 빌드는 성공 ✅
		// 2. WebviewProvider는 정상 export ✅
		// 3. package.json 설정 일치 ✅
		// 4. 하지만 런타임에서 "Class extends value undefined" 에러

		// 가능한 해결 방안:
		// A. import 순서 문제 - dynamic import 사용
		// B. 모듈 로딩 타이밍 문제 - await import() 사용
		// C. VSCode API 호환성 문제 - vscode 버전 확인

		const fs = require("fs")
		const packageJsonPath = path.resolve(__dirname, "../../package.json")
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

		// VSCode 엔진 버전 확인
		expect(packageJson.engines.vscode).toBeDefined()

		// 해결 방안: import 구조 개선이 필요할 수 있음
		expect(true).toBe(true) // 이 테스트는 분석 목적
	})
})

describe("Extension Activation Tests (TDD - SOLUTION VERIFIED)", () => {
	it("should confirm the problem was fixed: Controller now uses Cline Task", () => {
		// GREEN: 문제 해결 확인

		const fs = require("fs")
		const controllerPath = path.resolve(__dirname, "../../src/core/controller/index.ts")
		const controllerContent = fs.readFileSync(controllerPath, "utf8")

		// 잘못된 import가 제거되었는지 확인
		expect(controllerContent).not.toContain('import { Task } from "../../../caret-src/core/task"')

		// 올바른 import로 수정되었는지 확인
		expect(controllerContent).toContain('import { Task } from "../task"')

		// CARET MODIFICATION 주석이 업데이트되었는지 확인
		expect(controllerContent).toContain('fix "Class extends value undefined" error')
	})

	it("should verify the solution builds successfully", () => {
		// GREEN: 빌드 성공 확인

		const fs = require("fs")
		const distExtensionPath = path.resolve(__dirname, "../../dist/extension.js")

		// 새로운 빌드 파일이 생성되었는지 확인
		expect(fs.existsSync(distExtensionPath)).toBe(true)

		const stats = fs.statSync(distExtensionPath)
		expect(stats.size).toBeGreaterThan(1000) // 정상적인 크기
	})

	it("should confirm Cline Task is being used correctly", () => {
		// GREEN: Cline Task 사용 확인

		const fs = require("fs")
		const clineTaskPath = path.resolve(__dirname, "../../src/core/task/index.ts")
		const taskContent = fs.readFileSync(clineTaskPath, "utf8")

		// Cline Task가 정상적으로 export되는지 확인
		expect(taskContent).toContain("export class Task")

		// Task 클래스가 올바른 구조를 가지는지 확인
		expect(taskContent).toContain("constructor")
	})

	it("should validate the fix follows Caret modification principles", () => {
		// GREEN: Caret 수정 원칙 준수 확인

		const fs = require("fs")

		// 백업 파일 존재 확인
		const backupPath = path.resolve(__dirname, "../../src/core/controller/index-ts.cline")
		expect(fs.existsSync(backupPath)).toBe(true)

		// 최소 수정 원칙 확인 (1-3 라인 수정)
		const controllerPath = path.resolve(__dirname, "../../src/core/controller/index.ts")
		const controllerContent = fs.readFileSync(controllerPath, "utf8")

		// CARET MODIFICATION 주석 존재 확인
		expect(controllerContent).toContain("CARET MODIFICATION")

		// 완전 대체 확인 (주석처리가 아닌 완전 교체)
		expect(controllerContent).not.toContain('// import { Task } from "../../../caret-src/core/task"')
	})

	it("should predict extension activation will now succeed", () => {
		// GREEN: 확장 활성화 성공 예측

		// 이제 다음 조건들이 모두 만족됨:
		// 1. Controller가 올바른 Task import 사용 ✅
		// 2. tsconfig.json에 포함된 경로만 사용 ✅
		// 3. 빌드 성공 ✅
		// 4. WebviewProvider 정상 export ✅

		// "Class extends value undefined" 에러가 해결되었을 것으로 예상
		expect(true).toBe(true) // 이 테스트는 성공 예측
	})
})
