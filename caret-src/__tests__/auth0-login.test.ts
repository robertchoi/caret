// 파일: caret-src/__tests__/auth0-login.test.ts
// 테스트 대상: CaretProvider의 Auth0 로그인 기능
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import { CaretProvider } from "../core/webview/CaretProvider"
import { CaretLogger } from "../utils/caret-logger"

// CARET MODIFICATION: Mock vscode with better globalStorageUri support
vi.mock("vscode", () => ({
  ExtensionContext: vi.fn(),
  Uri: {
    file: vi.fn((path) => ({ fsPath: path, toString: () => path })),
    parse: vi.fn((uri) => ({ fsPath: uri, toString: () => uri })),
  },
  ExtensionMode: { Development: 1, Production: 2, Test: 3 },
  window: {
    createOutputChannel: vi.fn((name) => ({
      appendLine: vi.fn(), show: vi.fn(), dispose: vi.fn(), name
    })),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
    tabGroups: {
      onDidChangeTabs: vi.fn(),
    },
  },
  env: { openExternal: vi.fn() },
  workspace: {
    onDidChangeConfiguration: vi.fn(),
    onDidCreateFiles: vi.fn(),
    onDidDeleteFiles: vi.fn(),
    onDidRenameFiles: vi.fn(),
  },
}))

// CARET MODIFICATION: Mock fs.promises
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs")
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      mkdir: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
})

// CARET MODIFICATION: Mock Auth0Client
vi.mock("@auth0/auth0-spa-js", () => ({
  Auth0Client: vi.fn(() => ({
    handleRedirectCallback: vi.fn(() => Promise.resolve()),
    getUser: vi.fn(() => Promise.resolve({ email: "test@example.com" })),
  })),
}))

describe("CaretProvider Auth0 Login", () => {
  let caretProvider: CaretProvider
  let mockContext: vscode.ExtensionContext
  let mockOutputChannel: vscode.OutputChannel
  let mockCaretLogger: CaretLogger
  const mockAuth0Client = {
    handleRedirectCallback: vi.fn(() => Promise.resolve()),
    getUser: vi.fn(() => Promise.resolve({ email: "test@example.com" })),
  }

  beforeEach(async () => {
    vi.resetAllMocks()

    // CARET MODIFICATION: Better mock context setup
    mockContext = {
      extensionMode: vscode.ExtensionMode.Development,
      extensionPath: "/mock/extension/path",
      globalStorageUri: { fsPath: "/mock/global/storage" },
      subscriptions: [],
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    } as any

    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
      append: vi.fn(),
      replace: vi.fn(),
      clear: vi.fn(),
      hide: vi.fn(),
      name: "Mock Output"
    } as vscode.OutputChannel

    mockCaretLogger = new CaretLogger(mockOutputChannel)

    // Mock environment variables
    const mockEnvVars = {
      AUTH0_DOMAIN: "test-domain.auth0.com",
      AUTH0_CLIENT_ID: "test-client-id",
      AUTH0_CALLBACK_URL: "http://localhost:3000/callback",
    }

    // Mock fs.promises.readFile to return mock environment variables
    const fs = await import("fs")
    vi.mocked(fs.promises.readFile).mockResolvedValue(
      Object.entries(mockEnvVars).map(([key, value]) => `${key}=${value}`).join('\n')
    )

    // Mock Auth0Client constructor
    const { Auth0Client } = await import("@auth0/auth0-spa-js")
    vi.mocked(Auth0Client).mockImplementation(() => mockAuth0Client as any)

    caretProvider = new CaretProvider(mockContext, mockOutputChannel, undefined, mockCaretLogger)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should initialize Auth0 client with environment variables", async () => {
    // Act
    await (caretProvider as any).forTest_initializeAuth0Client()

    // Assert
    const { Auth0Client } = await import("@auth0/auth0-spa-js")
    expect(Auth0Client).toHaveBeenCalledWith({
      domain: "test-domain.auth0.com",
      clientId: "test-client-id",
      authorizationParams: {
        redirect_uri: "http://localhost:3000/callback",
        audience: "",
        scope: "openid profile email",
      },
      useRefreshTokens: true,
      cacheLocation: "localstorage",
    })
  })
  
  it("should handle login redirect URL generation", async () => {
    // Act
    const url = await caretProvider.generateLoginUrl()

    // Assert
    expect(url).toContain("test-domain.auth0.com/authorize")
    expect(url).toContain("client_id=test-client-id")
    expect(url).toContain("response_type=code")
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback")
    expect(url).toContain("scope=openid+profile+email")
  })
  
  it("should process authentication callback", async () => {
    // Arrange
    const testUrl = "http://localhost:3000/callback?code=123&state=abc"
    // Mock Auth0Client to return correct user
    mockAuth0Client.getUser.mockResolvedValue({ email: "test@example.com" })

    // Act
    await caretProvider.handleAuthCallback(testUrl)

    // Assert
    expect(mockAuth0Client.handleRedirectCallback).toHaveBeenCalledWith(testUrl)
    expect(mockAuth0Client.getUser).toHaveBeenCalled()
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Caret: Logged in as test@example.com")
  })
  
  it("should handle authentication errors gracefully", async () => {
    // Arrange
    const testError = new Error("Auth0 test error")

    // Act
    caretProvider.handleAuthError(testError)

    // Assert
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`Caret: Authentication failed. ${testError.message}`)
  })

  it("should initiate login process and open browser", async () => {
    // Arrange
    const openExternalSpy = vi.spyOn(vscode.env, "openExternal")
    const mockUri = { toString: vi.fn(() => "https://test-domain.auth0.com/authorize") }
    vi.mocked(vscode.Uri.parse).mockReturnValue(mockUri as any)

    // Act
    await caretProvider.login()

    // Assert
    expect(openExternalSpy).toHaveBeenCalled()
    expect(vscode.Uri.parse).toHaveBeenCalled()
    const parseArgs = vi.mocked(vscode.Uri.parse).mock.calls[0][0]
    expect(parseArgs).toContain("test-domain.auth0.com/authorize")
  })

  it("should handle login errors gracefully", async () => {
    // Arrange
    const testError = new Error("Login initiation failed")
    const fs = await import("fs")
    vi.mocked(fs.promises.readFile).mockRejectedValue(testError)
    const handleAuthErrorSpy = vi.spyOn(caretProvider, "handleAuthError")

    // Act
    await caretProvider.login()

    // Assert
    // The actual error message will be "Auth0 configuration incomplete." because 
    // the environment loading fails and results in missing Auth0 configuration
    expect(handleAuthErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Auth0 configuration incomplete." })
    )
  })
})
