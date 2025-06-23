import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"

// Mock vscode
vi.mock("vscode", () => ({
	window: {
		createOutputChannel: vi.fn(() => ({
			appendLine: vi.fn(),
			dispose: vi.fn(),
		})),
		registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
		createFileSystemWatcher: vi.fn(() => ({
			onDidChange: vi.fn(),
			onDidCreate: vi.fn(),
			onDidDelete: vi.fn(),
			dispose: vi.fn(),
		})),
	},
	commands: {
		executeCommand: vi.fn(),
		registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
	},
	Uri: {
		file: vi.fn((path) => ({ fsPath: path, toString: () => `file://${path}` })),
		joinPath: vi.fn((base, ...paths) => ({
			fsPath: `${base.fsPath}/${paths.join("/")}`,
			toString: () => `file://${base.fsPath}/${paths.join("/")}`,
		})),
	},
	RelativePattern: vi.fn((base, pattern) => ({ base, pattern })),
}))

// Mock CaretProvider
vi.mock("../core/webview/CaretProvider", () => ({
	CaretProvider: vi.fn(() => ({})),
	CARET_SIDEBAR_ID: "caret-sidebar",
}))

// Mock other dependencies
vi.mock("../../src/shared/webview/types", () => ({
	WebviewProviderType: { SIDEBAR: "sidebar" },
}))

vi.mock("../utils/caret-logger", () => ({
	caretLogger: {
		setOutputChannel: vi.fn(),
		extensionActivated: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	},
}))

vi.mock("../../src/services/logging/Logger", () => ({
	Logger: {
		initialize: vi.fn(),
		log: vi.fn(),
	},
}))

// Mock node:assert
vi.mock("node:assert", () => ({
	default: vi.fn(),
}))

describe("Extension File Watcher Logic", () => {
	let mockContext: any
	let mockOutputChannel: any
	let mockWatcher: any

	beforeEach(() => {
		vi.clearAllMocks()
		vi.resetModules()

		mockOutputChannel = {
			appendLine: vi.fn(),
			dispose: vi.fn(),
		}

		mockWatcher = {
			onDidChange: vi.fn(),
			onDidCreate: vi.fn(),
			onDidDelete: vi.fn(),
			dispose: vi.fn(),
		}

		mockContext = {
			subscriptions: [],
		}

		vi.mocked(vscode.window.createOutputChannel).mockReturnValue(mockOutputChannel)
		vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue(mockWatcher)

		// Reset workspace folders
		vi.mocked(vscode.workspace).workspaceFolders = [{ uri: { fsPath: "/workspace" } }]
	})

	describe("Development Mode File Watching", () => {
		it("should create file watcher with absolute DEV_WORKSPACE_FOLDER", async () => {
			// Set environment for development mode
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "/absolute/dev/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Verify file watcher was created with absolute path
				expect(vscode.Uri.file).toHaveBeenCalledWith("/absolute/dev/path")
				expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
				expect(mockWatcher.onDidChange).toHaveBeenCalled()
				expect(mockWatcher.onDidCreate).toHaveBeenCalled()
				expect(mockWatcher.onDidDelete).toHaveBeenCalled()
			} finally {
				process.env = originalEnv
			}
		})

		it("should create file watcher with relative DEV_WORKSPACE_FOLDER", async () => {
			// Set environment for development mode with relative path
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "relative/dev/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Verify Uri.joinPath was called for relative path
				expect(vscode.Uri.joinPath).toHaveBeenCalled()
				expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
				expect(mockWatcher.onDidChange).toHaveBeenCalled()
				expect(mockWatcher.onDidCreate).toHaveBeenCalled()
				expect(mockWatcher.onDidDelete).toHaveBeenCalled()
			} finally {
				process.env = originalEnv
			}
		})

		it("should handle file change events", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "/test/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Get the onDidChange callback
				const onDidChangeCallback = vi.mocked(mockWatcher.onDidChange).mock.calls[0][0]

				// Simulate file change event
				const mockUri = { fsPath: "/test/path/caret-src/test.ts" }
				onDidChangeCallback(mockUri)

				// Verify reload command was executed
				expect(vscode.commands.executeCommand).toHaveBeenCalledWith("workbench.action.reloadWindow")
			} finally {
				process.env = originalEnv
			}
		})

		it("should handle file create events", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "/test/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Get the onDidCreate callback
				const onDidCreateCallback = vi.mocked(mockWatcher.onDidCreate).mock.calls[0][0]

				// Simulate file create event
				const mockUri = { fsPath: "/test/path/caret-src/new.ts" }
				onDidCreateCallback(mockUri)

				// Verify reload command was executed
				expect(vscode.commands.executeCommand).toHaveBeenCalledWith("workbench.action.reloadWindow")
			} finally {
				process.env = originalEnv
			}
		})

		it("should handle file delete events", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "/test/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Get the onDidDelete callback
				const onDidDeleteCallback = vi.mocked(mockWatcher.onDidDelete).mock.calls[0][0]

				// Simulate file delete event
				const mockUri = { fsPath: "/test/path/caret-src/deleted.ts" }
				onDidDeleteCallback(mockUri)

				// Verify reload command was executed
				expect(vscode.commands.executeCommand).toHaveBeenCalledWith("workbench.action.reloadWindow")
			} finally {
				process.env = originalEnv
			}
		})

		it("should handle error when no workspace folder exists", async () => {
			// Mock no workspace folders
			vi.mocked(vscode.workspace).workspaceFolders = undefined

			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "relative/path",
			}

			try {
				const { activate } = await import("../extension")

				// Should throw error when no workspace folder exists
				await expect(activate(mockContext)).rejects.toThrow()
			} finally {
				process.env = originalEnv
				// Restore workspace folders
				vi.mocked(vscode.workspace).workspaceFolders = [{ uri: { fsPath: "/workspace" } }]
			}
		})

		it("should log file watcher messages to output channel", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "true",
				DEV_WORKSPACE_FOLDER: "/test/path",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Verify output channel received file watcher setup message
				expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
					expect.stringContaining("[DEV MODE] Watching for file changes in:"),
				)
			} finally {
				process.env = originalEnv
			}
		})
	})

	describe("Production Mode", () => {
		it("should not create file watcher in production mode", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
				IS_DEV: "false",
			}

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Verify file watcher was NOT created
				expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled()
			} finally {
				process.env = originalEnv
			}
		})

		it("should not create file watcher when IS_DEV is undefined", async () => {
			const originalEnv = process.env
			process.env = {
				...originalEnv,
			}
			delete process.env.IS_DEV

			try {
				const { activate } = await import("../extension")
				await activate(mockContext)

				// Verify file watcher was NOT created
				expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled()
			} finally {
				process.env = originalEnv
			}
		})
	})
})
