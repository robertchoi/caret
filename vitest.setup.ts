import { vi } from "vitest"

// VSCode API 모킹
vi.mock("vscode", () => ({
	env: {
		machineId: "test-machine-id",
		sessionId: "test-session-id",
		language: "en",
		remoteName: undefined,
		shell: "/bin/bash",
	},
	window: {
		showErrorMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showInformationMessage: vi.fn(),
		createOutputChannel: vi.fn(() => ({
			appendLine: vi.fn(),
			show: vi.fn(),
		})),
		createTextEditorDecorationType: vi.fn(() => ({
			dispose: vi.fn(),
		})),
		activeTextEditor: undefined,
		visibleTextEditors: [],
		onDidChangeActiveTextEditor: vi.fn(),
		onDidChangeVisibleTextEditors: vi.fn(),
		onDidChangeTextEditorSelection: vi.fn(),
		onDidChangeTextEditorViewColumn: vi.fn(),
		onDidChangeTextEditorVisibleRanges: vi.fn(),
		showTextDocument: vi.fn(),
		showQuickPick: vi.fn(),
		showInputBox: vi.fn(),
	},
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn(),
			update: vi.fn(),
		})),
	},
	commands: {
		registerCommand: vi.fn(),
	},
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path })),
		parse: vi.fn((path: string) => ({ fsPath: path })),
	},
	ExtensionContext: vi.fn(),
	ConfigurationTarget: {
		Global: 1,
		Workspace: 2,
		WorkspaceFolder: 3,
	},
}))

// Node.js 모듈 모킹 (필요시) - CARET MODIFICATION: Fix default export issue
vi.mock("os", async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		platform: vi.fn(() => "win32"),
		release: vi.fn(() => "10.0.26100"),
		homedir: vi.fn(() => "/mock/home"),
	}
})

vi.mock("path", async () => {
	const actual = await vi.importActual("path")
	return {
		...actual,
		join: vi.fn((...args: string[]) => args.join("/")),
		resolve: vi.fn((...args: string[]) => args.join("/")),
	}
})
