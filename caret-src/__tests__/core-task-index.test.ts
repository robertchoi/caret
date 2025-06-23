import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"

// Mock dependencies
vi.mock("vscode", () => ({
	ExtensionContext: vi.fn(),
	workspace: {
		workspaceFolders: [],
	},
}))

// Mock Cline Task
vi.mock("../../src/core/task", () => ({
	Task: class MockClineTask {
		constructor(...args: any[]) {
			// Store constructor arguments for testing
			this.constructorArgs = args
		}
		constructorArgs: any[]
	},
	USE_EXPERIMENTAL_CLAUDE4_FEATURES: true,
	cwd: "/mock/cwd",
}))

// Mock other dependencies
vi.mock("../../src/services/mcp/McpHub", () => ({
	McpHub: vi.fn(),
}))

vi.mock("../../src/integrations/workspace/WorkspaceTracker", () => ({
	default: vi.fn(),
}))

describe("caret-src/core/task/index.ts", () => {
	let mockContext: any
	let mockMcpHub: any
	let mockWorkspaceTracker: any
	let mockUpdateTaskHistory: any
	let mockPostStateToWebview: any
	let mockPostMessageToWebview: any
	let mockReinitExistingTaskFromId: any
	let mockCancelTask: any
	let mockApiConfiguration: any
	let mockAutoApprovalSettings: any
	let mockBrowserSettings: any
	let mockChatSettings: any

	beforeEach(async () => {
		vi.clearAllMocks()

		// Setup mock objects
		mockContext = { subscriptions: [] }
		mockMcpHub = {}
		mockWorkspaceTracker = {}
		mockUpdateTaskHistory = vi.fn()
		mockPostStateToWebview = vi.fn()
		mockPostMessageToWebview = vi.fn()
		mockReinitExistingTaskFromId = vi.fn()
		mockCancelTask = vi.fn()
		mockApiConfiguration = {}
		mockAutoApprovalSettings = {}
		mockBrowserSettings = {}
		mockChatSettings = {}
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe("Task class", () => {
		it("should be importable", async () => {
			const { Task } = await import("../core/task/index")
			expect(Task).toBeDefined()
			expect(typeof Task).toBe("function")
		})

		it("should be constructible", async () => {
			const { Task } = await import("../core/task/index")

			const task = new Task(
				mockContext,
				mockMcpHub,
				mockWorkspaceTracker,
				mockUpdateTaskHistory,
				mockPostStateToWebview,
				mockPostMessageToWebview,
				mockReinitExistingTaskFromId,
				mockCancelTask,
				mockApiConfiguration,
				mockAutoApprovalSettings,
				mockBrowserSettings,
				mockChatSettings,
				5000,
				true,
				100,
				"bash",
				true,
			)

			expect(task).toBeInstanceOf(Task)
		})

		it("should provide default task message when no parameters are provided", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
			const { Task } = await import("../core/task/index")

			new Task(
				mockContext,
				mockMcpHub,
				mockWorkspaceTracker,
				mockUpdateTaskHistory,
				mockPostStateToWebview,
				mockPostMessageToWebview,
				mockReinitExistingTaskFromId,
				mockCancelTask,
				mockApiConfiguration,
				mockAutoApprovalSettings,
				mockBrowserSettings,
				mockChatSettings,
				5000,
				true,
				100,
				"bash",
				true,
			)

			expect(consoleSpy).toHaveBeenCalledWith("[CaretTask] Providing default task message for API setup completion")
			expect(consoleSpy).toHaveBeenCalledWith("[CaretTask] Initialized successfully with enhanced parameter validation")

			consoleSpy.mockRestore()
		})

		it("should accept custom task parameter", async () => {
			const { Task } = await import("../core/task/index")

			const customTask = "Custom task message"

			const task = new Task(
				mockContext,
				mockMcpHub,
				mockWorkspaceTracker,
				mockUpdateTaskHistory,
				mockPostStateToWebview,
				mockPostMessageToWebview,
				mockReinitExistingTaskFromId,
				mockCancelTask,
				mockApiConfiguration,
				mockAutoApprovalSettings,
				mockBrowserSettings,
				mockChatSettings,
				5000,
				true,
				100,
				"bash",
				true,
				customTask,
			)

			expect(task).toBeInstanceOf(Task)
		})

		it("should accept images parameter", async () => {
			const { Task } = await import("../core/task/index")

			const customImages = ["image1.png", "image2.jpg"]

			const task = new Task(
				mockContext,
				mockMcpHub,
				mockWorkspaceTracker,
				mockUpdateTaskHistory,
				mockPostStateToWebview,
				mockPostMessageToWebview,
				mockReinitExistingTaskFromId,
				mockCancelTask,
				mockApiConfiguration,
				mockAutoApprovalSettings,
				mockBrowserSettings,
				mockChatSettings,
				5000,
				true,
				100,
				"bash",
				true,
				undefined, // task
				customImages,
			)

			expect(task).toBeInstanceOf(Task)
		})

		it("should accept files parameter", async () => {
			const { Task } = await import("../core/task/index")

			const customFiles = ["file1.txt", "file2.js"]

			const task = new Task(
				mockContext,
				mockMcpHub,
				mockWorkspaceTracker,
				mockUpdateTaskHistory,
				mockPostStateToWebview,
				mockPostMessageToWebview,
				mockReinitExistingTaskFromId,
				mockCancelTask,
				mockApiConfiguration,
				mockAutoApprovalSettings,
				mockBrowserSettings,
				mockChatSettings,
				5000,
				true,
				100,
				"bash",
				true,
				undefined, // task
				undefined, // images
				customFiles,
			)

			expect(task).toBeInstanceOf(Task)
		})
	})

	describe("exports", () => {
		it("should export USE_EXPERIMENTAL_CLAUDE4_FEATURES", async () => {
			const { USE_EXPERIMENTAL_CLAUDE4_FEATURES } = await import("../core/task/index")
			expect(USE_EXPERIMENTAL_CLAUDE4_FEATURES).toBeDefined()
		})

		it("should export cwd", async () => {
			const { cwd } = await import("../core/task/index")
			expect(cwd).toBeDefined()
		})
	})

	describe("integration", () => {
		it("should work with all required parameters", async () => {
			const { Task } = await import("../core/task/index")

			expect(() => {
				new Task(
					mockContext,
					mockMcpHub,
					mockWorkspaceTracker,
					mockUpdateTaskHistory,
					mockPostStateToWebview,
					mockPostMessageToWebview,
					mockReinitExistingTaskFromId,
					mockCancelTask,
					mockApiConfiguration,
					mockAutoApprovalSettings,
					mockBrowserSettings,
					mockChatSettings,
					5000,
					true,
					100,
					"bash",
					true,
					"Test task",
					["test.png"],
					["test.txt"],
				)
			}).not.toThrow()
		})
	})
})
