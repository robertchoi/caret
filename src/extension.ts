// CARET MODIFICATION: 이 파일은 Caret 프로젝트에서 수정되었습니다.
// 원본 Cline extension.ts는 extension-ts.cline 파일로 백업되어 있습니다.
// 모든 실제 로직은 caret-src/extension.ts로 위임됩니다.

import * as vscode from "vscode"

// Caret extension 진입점으로 위임
export async function activate(context: vscode.ExtensionContext) {
	// caret-src/extension.ts의 activate 함수를 호출
	const { activate: caretActivate } = await import("../caret-src/extension")
	return caretActivate(context)
}

export async function deactivate() {
	// caret-src/extension.ts의 deactivate 함수를 호출
	const { deactivate: caretDeactivate } = await import("../caret-src/extension")
	return caretDeactivate()
}

// 원본 Cline 코드는 extension-ts.cline 파일에 백업되어 있습니다.
// 업스트림 머징 시 해당 파일을 참조하여 충돌을 해결하세요.
