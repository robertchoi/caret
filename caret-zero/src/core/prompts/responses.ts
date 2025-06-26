import { Anthropic } from "@anthropic-ai/sdk"
import * as diff from "diff"
import * as path from "path"
import { CaretIgnoreController, LOCK_TEXT_SYMBOL } from "../ignore/CaretIgnoreController"

export const formatResponse = {
	duplicateFileReadNotice: () =>
		`[[NOTE] This file read has been removed to save space in the context window. Refer to the latest file read for the most up to date version of this file.]`,

	contextTruncationNotice: () =>
		`[NOTE] Some previous conversation history with the user has been removed to maintain optimal context window length. The initial user task and the most recent exchanges have been retained for continuity, while intermediate conversation history has been removed. Please keep this in mind as you continue assisting the user.`,

	toolDenied: () => `The user denied this operation.`,

	toolError: (error?: string) => `The tool execution failed with the following error:\n<error>\n${error}\n</error>`,

	caretIgnoreError: (path: string) =>
		`Access to ${path} is blocked by the .caretignore file settings. You must try to continue in the task without using this file, or ask the user to update the .caretignore file.`,

	noToolsUsed: () =>
		`[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

${toolUseInstructionsReminder}

# Next Steps

If you have completed the user's task, use the attempt_completion tool. 
If you require additional information from the user, use the ask_followup_question tool. 
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task. 
(This is an automated message, so do not respond to it conversationally.)`,

	tooManyMistakes: (feedback?: string) =>
		`You seem to be having trouble proceeding. The user has provided the following feedback to help guide you:\n<feedback>\n${feedback}\n</feedback>`,

	missingToolParameterError: (paramName: string) =>
		`Missing value for required parameter '${paramName}'. Please retry with complete response.\n\n${toolUseInstructionsReminder}`,

	invalidMcpToolArgumentError: (serverName: string, toolName: string) =>
		`Invalid JSON argument used with ${serverName} for ${toolName}. Please retry with a properly formatted JSON argument.`,

	toolResult: (text: string, images?: string[]): string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> => {
		if (images && images.length > 0) {
			const textBlock: Anthropic.TextBlockParam = { type: "text", text }
			const imageBlocks: Anthropic.ImageBlockParam[] = formatImagesIntoBlocks(images)
			// Placing images after text leads to better results
			return [textBlock, ...imageBlocks]
		} else {
			return text
		}
	},

	imageBlocks: (images?: string[]): Anthropic.ImageBlockParam[] => {
		return formatImagesIntoBlocks(images)
	},

	formatFilesList: (
		absolutePath: string,
		files: string[],
		didHitLimit: boolean,
		caretIgnoreController?: CaretIgnoreController,
	): string => {
		const sorted = files
			.map((file) => {
				// convert absolute path to relative path
				const relativePath = path.relative(absolutePath, file).toPosix()
				return file.endsWith("/") ? relativePath + "/" : relativePath
			})
			// Sort so files are listed under their respective directories to make it clear what files are children of what directories. Since we build file list top down, even if file list is truncated it will show directories that caret can then explore further.
			.sort((a, b) => {
				const aParts = a.split("/") // only works if we use toPosix first
				const bParts = b.split("/")
				for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
					if (aParts[i] !== bParts[i]) {
						// If one is a directory and the other isn't at this level, sort the directory first
						if (i + 1 === aParts.length && i + 1 < bParts.length) {
							return -1
						}
						if (i + 1 === bParts.length && i + 1 < aParts.length) {
							return 1
						}
						// Otherwise, sort alphabetically
						return aParts[i].localeCompare(bParts[i], undefined, {
							numeric: true,
							sensitivity: "base",
						})
					}
				}
				// If all parts are the same up to the length of the shorter path,
				// the shorter one comes first
				return aParts.length - bParts.length
			})

		const caretIgnoreParsed = caretIgnoreController
			? sorted.map((filePath) => {
					// path is relative to absolute path, not cwd
					// validateAccess expects either path relative to cwd or absolute path
					// otherwise, for validating against ignore patterns like "assets/icons", we would end up with just "icons", which would result in the path not being ignored.
					const absoluteFilePath = path.resolve(absolutePath, filePath)
					const isIgnored = !caretIgnoreController.validateAccess(absoluteFilePath)
					if (isIgnored) {
						return LOCK_TEXT_SYMBOL + " " + filePath
					}

					return filePath
				})
			: sorted

		if (didHitLimit) {
			return `${caretIgnoreParsed.join(
				"\n",
			)}\n\n(File list truncated. Use list_files on specific subdirectories if you need to explore further.)`
		} else if (caretIgnoreParsed.length === 0 || (caretIgnoreParsed.length === 1 && caretIgnoreParsed[0] === "")) {
			return "No files found."
		} else {
			return caretIgnoreParsed.join("\n")
		}
	},

	createPrettyPatch: (filename = "file", oldStr?: string, newStr?: string) => {
		// strings cannot be undefined or diff throws exception
		const patch = diff.createPatch(filename.toPosix(), oldStr || "", newStr || "")
		const lines = patch.split("\n")
		const prettyPatchLines = lines.slice(4)
		return prettyPatchLines.join("\n")
	},

	taskResumption: (
		mode: string, // 모드 ID (arch, plan, dev 등) - 참고용으로 유지, 로직에는 사용 안 함
		agoText: string,
		cwd: string,
		wasRecent: boolean | 0 | undefined,
		responseText?: string,
	) => {
		// 모든 모드에 대해 일관된 작업 재개 메시지 제공
		const standardResumptionText = `This task was interrupted ${agoText}. It may or may not be complete, so please reassess the task context. Be aware that the project state may have changed since then. The current working directory is now '${cwd.toPosix()}'. If the task has not been completed, retry the last step before interruption and proceed with completing the task.


Note: If you previously attempted a tool use that the user did not provide a result for, you should assume the tool use was not successful and assess whether you should retry. If the last tool was a browser_action, the browser has been closed and you must launch a new browser if needed.`

		const interruptionWarning = wasRecent
			? "\n\nIMPORTANT: If the last tool use was a replace_in_file or write_to_file that was interrupted, the file was reverted back to its original state before the interrupted edit, and you do NOT need to re-read the file as you already have its up-to-date contents."
			: ""

		const userMessageSection = responseText
			? `\n\nNew instructions for task continuation:\n<user_message>\n${responseText}\n</user_message>`
			: "" // Arch/Plan 모드 관련 특별 메시지 제거

		return `[TASK RESUMPTION] ${standardResumptionText}${interruptionWarning}${userMessageSection}`
	},

	// archModeInstructions 함수는 사용자의 요청에 따라 완전히 삭제됨

	fileEditWithUserChanges: (
		relPath: string,
		userEdits: string,
		autoFormattingEdits: string | undefined,
		finalContent: string | undefined,
		newProblemsMessage: string | undefined,
	) =>
		`The user made the following updates to your content:\n\n${userEdits}\n\n` +
		(autoFormattingEdits
			? `The user's editor also applied the following auto-formatting to your content:\n\n${autoFormattingEdits}\n\n(Note: Pay close attention to changes such as single quotes being converted to double quotes, semicolons being removed or added, long lines being broken into multiple lines, adjusting indentation style, adding/removing trailing commas, etc. This will help you ensure future SEARCH/REPLACE operations to this file are accurate.)\n\n`
			: "") +
		`The updated content, which includes both your original modifications and the additional edits, has been successfully saved to ${relPath.toPosix()}. Here is the full, updated content of the file that was saved:\n\n` +
		`<final_file_content path="${relPath.toPosix()}">\n${finalContent}\n</final_file_content>\n\n` +
		`Please note:\n` +
		`1. You do not need to re-write the file with these changes, as they have already been applied.\n` +
		`2. Proceed with the task using this updated file content as the new baseline.\n` +
		`3. If the user's edits have addressed part of the task or changed the requirements, adjust your approach accordingly.` +
		`4. IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including both user edits and any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.\n` +
		`${newProblemsMessage}`,

	fileEditWithoutUserChanges: (
		relPath: string,
		autoFormattingEdits: string | undefined,
		finalContent: string | undefined,
		newProblemsMessage: string | undefined,
	) =>
		`The content was successfully saved to ${relPath.toPosix()}.\n\n` +
		(autoFormattingEdits
			? `Along with your edits, the user's editor applied the following auto-formatting to your content:\n\n${autoFormattingEdits}\n\n(Note: Pay close attention to changes such as single quotes being converted to double quotes, semicolons being removed or added, long lines being broken into multiple lines, adjusting indentation style, adding/removing trailing commas, etc. This will help you ensure future SEARCH/REPLACE operations to this file are accurate.)\n\n`
			: "") +
		`Here is the full, updated content of the file that was saved:\n\n` +
		`<final_file_content path="${relPath.toPosix()}">\n${finalContent}\n</final_file_content>\n\n` +
		`IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.\n\n` +
		`${newProblemsMessage}`,

	diffError: (relPath: string, originalContent: string | undefined) =>
		`This is likely because the SEARCH block content doesn't match exactly with what's in the file, or if you used multiple SEARCH/REPLACE blocks they may not have been in the order they appear in the file.\n\n` +
		`The file was reverted to its original state:\n\n` +
		`<file_content path="${relPath.toPosix()}">\n${originalContent}\n</file_content>\n\n` +
		`Now that you have the latest state of the file, try the operation again with fewer/more precise SEARCH blocks.\n(If you run into this error 3 times in a row, you may use the write_to_file tool as a fallback. Keep in mind, the write_to_file fallback is far from ideal, as this means you'll be re-writing the entire contents of the file just to make a few edits, which takes time and money. So let's bias towards using replace_in_file as effectively as possible)`,

	toolAlreadyUsed: (toolName: string) =>
		`Tool [${toolName}] was not executed because a tool has already been used in this message. Only one tool may be used per message. You must assess the first tool's result before proceeding to use the next tool.`,

	caretIgnoreInstructions: (content: string) =>
		`# .caretignore\n\n(The following is provided by a root-level .caretignore file where the user has specified files and directories that should not be accessed. When using list_files, you'll notice a ${LOCK_TEXT_SYMBOL} next to files that are blocked. Attempting to access the file's contents e.g. through read_file will result in an error.)\n\n${content}\n.caretignore`,

	caretRulesDirectoryInstructions: (cwd: string, content: string) =>
		`# .caretrules/\n\nThe following is provided by a root-level .caretrules/ directory where the user has specified instructions for this working directory (${cwd.toPosix()})\n\n${content}`,

	caretRulesFileInstructions: (cwd: string, content: string) =>
		`# .caretrules\n\nThe following is provided by a root-level .caretrules file where the user has specified instructions for this working directory (${cwd.toPosix()})\n\n${content}`,
}

// to avoid circular dependency
const formatImagesIntoBlocks = (images?: string[]): Anthropic.ImageBlockParam[] => {
	return images
		? images.map((dataUrl) => {
				// data:image/png;base64,base64string
				const [rest, base64] = dataUrl.split(",")
				const mimeType = rest.split(":")[1].split(";")[0]
				return {
					type: "image",
					source: {
						type: "base64",
						media_type: mimeType,
						data: base64,
					},
				} as Anthropic.ImageBlockParam
			})
		: []
}

const toolUseInstructionsReminder = `# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

For example:

<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>

Always adhere to this format for all tool uses to ensure proper parsing and execution.`
