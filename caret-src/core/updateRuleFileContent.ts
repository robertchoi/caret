// CARET MODIFICATION: Handles the UpdateRuleFileContent RPC to update rule file contents, specifically for persona custom instructions.
import * as fs from "fs"
import * as path from "path"
import { UpdateRuleFileContentRequest, RuleFileContentResponse } from "../../src/shared/proto/file"
import { ensureRulesDirectoryExists } from "../../src/core/storage/disk"
import { cwd } from "../../src/core/task"
// No need for grpc-specific imports for basic error handling

export async function updateRuleFileContent(request: UpdateRuleFileContentRequest): Promise<RuleFileContentResponse> {
	console.log("[FileService] Received UpdateRuleFileContent request for:", request.rulePath)

	if (!request.rulePath || typeof request.content !== "string") {
		console.error("[FileService] Invalid request: rulePath and content (string) are required.")
		throw new Error("Rule path and content (string) are required.")
	}

	let targetDir: string
	try {
		if (request.isGlobal) {
			targetDir = await ensureRulesDirectoryExists()
		} else {
			// For workspace rules, use the current working directory
			targetDir = path.join(cwd, ".clinerules")
			// Ensure the workspace rules directory exists
			if (!fs.existsSync(targetDir)) {
				fs.mkdirSync(targetDir, { recursive: true })
			}
		}
	} catch (error: any) {
		console.error("[FileService] Error determining rules directory:", error)
		throw new Error(`Failed to determine rules directory: ${error.message}`)
	}

	if (!targetDir) {
		console.error("[FileService] Could not determine target directory for rule file.")
		throw new Error("Could not determine target directory.")
	}

	const filePath = path.join(targetDir, request.rulePath)
	console.log(`[FileService] Attempting to update file at: ${filePath}`)

	try {
		fs.writeFileSync(filePath, request.content, "utf8")
		console.log(`[FileService] Successfully wrote to file: ${filePath}`)

		return RuleFileContentResponse.create({
			filePath: filePath,
			content: request.content,
			success: true,
		})
	} catch (error: any) {
		console.error(`[FileService] Error writing to file ${filePath}: `, error)
		throw new Error(`Failed to write file: ${error.message}`)
	}
}
