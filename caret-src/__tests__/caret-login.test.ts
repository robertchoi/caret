// caret-src/__tests__/caret-login.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import { CaretProvider } from "../core/webview/CaretProvider"
import { WebviewProviderType } from "../../src/shared/webview/types"
import { Controller } from "../../src/core/controller"
import * as path from "path"
import * as fs from "fs" // CARET MODIFICATION: Import fs for vi.mocked usage
import { CaretProviderTestHelper } from "./helpers/CaretProviderTestHelper" // CARET MODIFICATION: Import TestHelper

// Mock VSCode API
vi.mock("vscode", () => ({
	ExtensionContext: vi.fn(),
	Uri: {
		file: vi.fn(),
		parse: vi.fn((uriString) => ({
			toString: () => uriString,
			fsPath: uriString,
			scheme: "https",
			authority: "",
			path: "/",
			query: "",
			fragment: "",
		})),
		joinPath: vi.fn((baseUri, ...paths) => {
			return {
				fsPath: [baseUri.fsPath, ...paths].join("/"),
				with: vi.fn(),
			}
		}),
	},
	WebviewView: vi.fn(),
	WebviewPanel: vi.fn(),
	workspace: {
		onDidChangeConfiguration: vi.fn(),
	},
	ExtensionMode: {
		Development: 1,
		Production: 2,
		Test: 3,
	},
	window: {
		createOutputChannel: vi.fn((name: string) => ({
			appendLine: vi.fn(),
			show: vi.fn(),
			dispose: vi.fn(),
			name: name,
		})),
		showErrorMessage: vi.fn(),
		showInformationMessage: vi.fn(),
	},
	Disposable: vi.fn(),
	// CARET MODIFICATION: Add env mock for openExternal
	env: {
		openExternal: vi.fn(),
	},
}))

// Mock Controller
vi.mock("../../src/core/controller/index", () => ({
	Controller: vi.fn(() => ({
		handleWebviewMessage: vi.fn(),
		postMessageToWebview: vi.fn(),
		clearTask: vi.fn(),
		postStateToWebview: vi.fn(),
		dispose: vi.fn(),
	})),
}))

// Mock other dependencies
vi.mock("../../src/core/webview/getNonce", () => ({
	getNonce: vi.fn(() => "mock-nonce"),
}))

vi.mock("../../src/core/webview/getUri", () => ({
	getUri: vi.fn((webview, extensionUri, pathList) => ({
		toString: () => `vscode-resource://${extensionUri.fsPath}/${pathList.join("/")}`,
	})),
}))

vi.mock("../utils/caretGetTheme", () => ({
	getTheme: vi.fn(() => ({
		theme: "dark",
		colors: {},
	})),
}))

vi.mock("../../src/core/controller/ui/subscribeToTheme", () => ({
	sendThemeEvent: vi.fn(),
}))

vi.mock("uuid", () => ({
	v4: vi.fn(() => "mock-uuid"),
}))

// Mock CaretLogger - 호이스팅 블록 내에서 정의
vi.mock("../utils/caret-logger", () => ({
	CaretLogger: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		success: vi.fn(),
		setOutputChannel: vi.fn(),
		extensionActivated: vi.fn(),
		welcomePageLoaded: vi.fn(),
		apiConfigured: vi.fn(),
		taskStarted: vi.fn(),
		taskCompleted: vi.fn(),
		userInteraction: vi.fn(),
		extensionDeactivated: vi.fn(),
	})),
	caretLogger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		success: vi.fn(),
		setOutputChannel: vi.fn(),
		extensionActivated: vi.fn(),
		welcomePageLoaded: vi.fn(),
		apiConfigured: vi.fn(),
		taskStarted: vi.fn(),
		taskCompleted: vi.fn(),
		userInteraction: vi.fn(),
		extensionDeactivated: vi.fn(),
	},
	logCaretWelcome: vi.fn(),
}))

// CARET MODIFICATION: Mock fs at the module level - improved path matching
vi.mock("fs", () => ({
	existsSync: vi.fn(() => true),
	readFileSync: vi.fn((filePath: any) => {
		const filePathStr = filePath.toString()
		if (filePathStr.includes(".vite-port")) {
			return Buffer.from("5173")
		}
		return Buffer.from("dummy_base64_image", "base64")
	}),
	promises: {
		readFile: vi.fn((filePath: any) => {
			const filePathStr = filePath.toString()
			// CARET MODIFICATION: Improved path matching for both relative and absolute paths
			if (filePathStr.includes(".env.dev") || filePathStr.endsWith(".env.dev")) {
				return Promise.resolve("AUTH0_DOMAIN=dev-domain.auth0.com\nAUTH0_CLIENT_ID=dev-client-id\nAUTH0_CALLBACK_URL=http://localhost:3000/callback")
			}
			if (filePathStr.includes(".env.prod") || filePathStr.endsWith(".env.prod")) {
				return Promise.resolve("AUTH0_DOMAIN=prod-domain.auth0.com\nAUTH0_CLIENT_ID=prod-client-id\nAUTH0_CALLBACK_URL=http://localhost:3000/callback")
			}
			if (filePathStr.includes(".vite-port")) {
				return Promise.resolve("5173")
			}
			return Promise.resolve(Buffer.from("dummy_base64_image", "base64"))
		}),
	},
}))

describe("CaretProvider Login and API Handling", () => {
	let context: vscode.ExtensionContext
	let outputChannel: vscode.OutputChannel
	let caretProvider: CaretProvider
	let mockWebviewView: vscode.WebviewView
	let caretProviderTestHelper: CaretProviderTestHelper // CARET MODIFICATION: Add TestHelper instance

	beforeEach(() => {
		vi.clearAllMocks() // Clear mocks before setting new ones

		// VSCode 객체들 생성
		outputChannel = vscode.window.createOutputChannel("Caret Test Output")
		context = {
			extensionUri: {
				fsPath: "/mock/extension/path",
				toString: () => "/mock/extension/path",
			},
			extensionMode: vscode.ExtensionMode.Development,
			globalStorageUri: {
				fsPath: "/mock/global/storage",
				toString: () => "/mock/global/storage",
			},
			extensionPath: "/mock/extension/path",
			subscriptions: [],
		} as any

		mockWebviewView = {
			webview: {
				options: {},
				html: "",
				onDidReceiveMessage: vi.fn(),
				cspSource: "vscode-webview://mock-csp-source",
			},
			onDidChangeViewState: vi.fn(),
			onDidDispose: vi.fn(),
			visible: true,
		} as any

		caretProvider = new CaretProvider(context, outputChannel, WebviewProviderType.SIDEBAR)
		caretProviderTestHelper = new CaretProviderTestHelper(caretProvider) // CARET MODIFICATION: Initialize TestHelper
	})

	afterEach(() => {
		vi.clearAllMocks() // Clear mocks after each test to ensure isolation
	})

	it("should initialize CaretProvider correctly", () => {
		expect(caretProvider).toBeDefined()
		expect(caretProvider.getClientId()).toBe("mock-uuid")
	})

	it("should resolve webview view and set HTML content", async () => {
		await caretProvider.resolveWebviewView(mockWebviewView)

		expect(mockWebviewView.webview.options.enableScripts).toBe(true)
		expect(mockWebviewView.webview.options.localResourceRoots).toContain(context.extensionUri)
		expect(mockWebviewView.webview.html).toContain("<title>Caret</title>")
		expect(mockWebviewView.webview.html).toContain('window.WEBVIEW_PROVIDER_TYPE = "sidebar";')
		expect(mockWebviewView.webview.html).toContain('window.clineClientId = "mock-uuid";') // CARET MODIFICATION: Corrected typo
		expect(mockWebviewView.webview.html).toContain('window.caretBanner = "data:image/webp;base64,')
		expect(mockWebviewView.webview.html).toContain('window.caretIcon = "data:image/png;base64,')
		expect(mockWebviewView.webview.html).toContain('window.personaProfile = "data:image/png;base64,')
		expect(mockWebviewView.webview.html).toContain('window.personaThinking = "data:image/png;base64,')
		expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled()
		expect(outputChannel.appendLine).toHaveBeenCalledWith("Caret Webview view resolved successfully.")
	})

	it("should dispose correctly", async () => {
		await caretProvider.resolveWebviewView(mockWebviewView)
		const disposeSpy = vi.spyOn(caretProvider, "dispose")
		
		const onDidDisposeCallback = (mockWebviewView.onDidDispose as any).mock.calls[0][0] as () => Promise<void>
		await onDidDisposeCallback()

		expect(disposeSpy).toHaveBeenCalled()
	})

	it("should load environment variables from .env.dev in development mode", async () => {
		const envVars = await caretProviderTestHelper.callLoadEnvironmentVariables() // CARET MODIFICATION: Use TestHelper
		
		expect(envVars).toEqual({
			AUTH0_DOMAIN: "dev-domain.auth0.com",
			AUTH0_CLIENT_ID: "dev-client-id",
			AUTH0_CALLBACK_URL: "http://localhost:3000/callback",
		})
	})

	// CARET MODIFICATION: Add test for login method
	it("should initiate login process and open browser", async () => {
		// Mock vscode.env.openExternal
		const openExternalSpy = vi.spyOn(vscode.env, "openExternal")

		// CARET MODIFICATION: Use consistent module-level mocking
		// The login method uses the same environment variables as the loadEnvironmentVariables test
		// No need to override the mock - just use the default mocking behavior

		// Call the login method via the test helper
		await caretProviderTestHelper.callLogin()

		// Assertions
		expect(openExternalSpy).toHaveBeenCalledTimes(1)
		
		// Safe access to the first call argument
		const firstCall = openExternalSpy.mock.calls[0]
		expect(firstCall).toBeDefined()
		expect(firstCall[0]).toBeDefined()
		
		const authUrl = firstCall[0].toString()
		expect(authUrl).toContain("https://dev-domain.auth0.com/authorize")
		expect(authUrl).toContain("client_id=dev-client-id")
		expect(authUrl).toContain("response_type=code")
		expect(authUrl).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback") // URL encoded
		expect(authUrl).toContain("scope=openid+profile+email") // URL encoded spaces become +
		expect(authUrl).toContain("audience=") // Should be empty or specific audience if needed
		expect(authUrl).toContain("state=mock-uuid") // Should contain a state parameter
		expect(authUrl).toContain("nonce=mock-uuid") // Should contain a nonce parameter
	})
})
