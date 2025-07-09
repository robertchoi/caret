import * as vscode from "vscode"
import crypto from "crypto"
import { Controller } from "../index"
import { storeSecret } from "../../storage/state"
import { EmptyRequest, String } from "../../../shared/proto/common"

// CARET MODIFICATION: Get Auth0 configuration based on environment
function getAuth0Config(controller: Controller) {
	const isDevelopment = controller.context.extensionMode === vscode.ExtensionMode.Development

	console.log(`[DEBUG] Running in ${isDevelopment ? "Development" : "Production"} mode`)

	if (isDevelopment) {
		// 개발용: 실제 값 사용 (로컬에서만)
		return {
			domain: "dev-mhyfo64i58pmcx8a.us.auth0.com",
			clientId: "dJfQIAoLllarppDygmrcLyIPjuZpIcJP",
			// WARNING: 아래 clientSecret은 샘플값입니다. 실제 개발시에는 올바른 값으로 교체하세요.
			clientSecret: "SAMPLE_SECRET_REPLACE_WITH_REAL_VALUE_FOR_DEVELOPMENT",
			callbackUrl: "https://dev-api.caret.team/api/auth/callback",
		}
	} else {
		// 프로덕션용: 샘플 값 (실제 배포시 교체 필요)
		return {
			domain: "prod-domain.auth0.com",
			clientId: "SAMPLE_PROD_CLIENT_ID",
			// WARNING: 아래 clientSecret은 샘플값입니다. 실제 배포시에는 올바른 값으로 교체하세요.
			clientSecret: "SAMPLE_PROD_SECRET_REPLACE_WITH_REAL_VALUE_FOR_PRODUCTION",
			callbackUrl: "https://api.caret.team/api/auth/callback",
		}
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
		// Get Auth0 configuration based on environment
		const auth0Config = getAuth0Config(controller)

		// CARET MODIFICATION: Debug environment variables
		console.log(`[DEBUG] AUTH0_DOMAIN: ${auth0Config.domain}`)
		console.log(`[DEBUG] AUTH0_CLIENT_ID: ${auth0Config.clientId}`)
		console.log(`[DEBUG] AUTH0_CALLBACK_URL: ${auth0Config.callbackUrl}`)

		if (!auth0Config.domain || !auth0Config.clientId || !auth0Config.callbackUrl) {
			console.error("Auth0 configuration missing")
			console.error(
				`[ERROR] Missing config - Domain: ${!!auth0Config.domain}, ClientId: ${!!auth0Config.clientId}, CallbackUrl: ${!!auth0Config.callbackUrl}`,
			)
			throw new Error("Auth0 configuration missing")
		}

		// Generate Auth0 login URL
		const state = nonce // Use the nonce as state
		const scope = "openid profile email"
		const responseType = "code"

		const authUrl =
			`https://${auth0Config.domain}/authorize?` +
			`client_id=${encodeURIComponent(auth0Config.clientId)}&` +
			`response_type=${encodeURIComponent(responseType)}&` +
			`redirect_uri=${encodeURIComponent(auth0Config.callbackUrl)}&` +
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
