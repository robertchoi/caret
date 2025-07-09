import * as vscode from "vscode"
import crypto from "crypto"
import * as path from "path"
import * as fs from "fs"
import { Controller } from "../index"
import { storeSecret } from "../../storage/state"
import { EmptyRequest, String } from "../../../shared/proto/common"

// Load environment variables from .env file in webview-ui directory
function loadEnvFile() {
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
		const webviewUiPath = path.join(workspaceRoot, "webview-ui")

		// Try .env.dev first (development), then .env.prod (production)
		const envDevPath = path.join(webviewUiPath, ".env.dev")
		const envProdPath = path.join(webviewUiPath, ".env.prod")

		let envPath: string
		let envType: string

		if (fs.existsSync(envDevPath)) {
			envPath = envDevPath
			envType = "development"
		} else if (fs.existsSync(envProdPath)) {
			envPath = envProdPath
			envType = "production"
		} else {
			console.warn("No .env.dev or .env.prod file found in webview-ui directory")
			return
		}

		console.log(`Loading ${envType} environment variables from: ${envPath}`)

		const envContent = fs.readFileSync(envPath, "utf-8")
		const lines = envContent.split("\n")

		lines.forEach((line) => {
			const trimmed = line.trim()
			if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
				const [key, ...valueParts] = trimmed.split("=")
				const value = valueParts.join("=").replace(/^["']|["']$/g, "")
				process.env[key.trim()] = value.trim()
			}
		})
	} catch (error) {
		console.error("Failed to load .env file:", error)
	}
}

/**
 * Handles the user clicking the login link in the UI.
 * Generates a secure nonce for state validation, stores it in secrets,
 * and opens the authentication URL in the external browser.
 *
 * @param controller The controller instance.
 * @returns The login URL as a string.
 */
export async function accountLoginClicked(controller: Controller, _: EmptyRequest): Promise<String> {
	// Generate nonce for state validation
	const nonce = crypto.randomBytes(32).toString("hex")
	await storeSecret(controller.context, "authNonce", nonce)

	// Open browser for authentication with state param
	console.log("Login button clicked in account page")
	console.log("Opening Auth0 authentication page")

	// CARET MODIFICATION: Use Auth0 login directly in Controller
	try {
		// Load environment variables
		loadEnvFile()

		const auth0Domain = process.env.AUTH0_DOMAIN
		const auth0ClientId = process.env.AUTH0_CLIENT_ID
		const auth0RedirectUri = process.env.AUTH0_REDIRECT_URI

		if (!auth0Domain || !auth0ClientId || !auth0RedirectUri) {
			console.error("Auth0 environment variables not configured")
			throw new Error("Auth0 configuration missing")
		}

		// Generate Auth0 login URL
		const state = nonce // Use the nonce as state
		const scope = "openid profile email"
		const responseType = "code"

		const authUrl =
			`https://${auth0Domain}/authorize?` +
			`client_id=${encodeURIComponent(auth0ClientId)}&` +
			`response_type=${encodeURIComponent(responseType)}&` +
			`redirect_uri=${encodeURIComponent(auth0RedirectUri)}&` +
			`scope=${encodeURIComponent(scope).replace(/%20/g, "+")}&` +
			`state=${encodeURIComponent(state)}&` +
			`nonce=${encodeURIComponent(nonce)}`

		console.log("Generated Auth0 URL:", authUrl)

		await vscode.env.openExternal(vscode.Uri.parse(authUrl))
		return String.create({
			value: authUrl,
		})
	} catch (error) {
		console.error("Failed to generate Auth0 login URL:", error)
		throw error
	}
}
