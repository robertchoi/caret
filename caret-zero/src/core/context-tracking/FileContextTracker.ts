import * as path from "path"
import * as vscode from "vscode"
import { getTaskMetadata, saveTaskMetadata, FileMetadataEntry } from "../storage/disk" // Import types from disk.ts
import type { Controller } from "../controller" // Import Controller type directly

// Define ControllerLike locally if needed, or adjust imports if it exists elsewhere
interface ControllerLike {
	context: vscode.ExtensionContext
}

// This class is responsible for tracking file operations that may result in stale context.
// If a user modifies a file outside of Caret, the context may become stale and need to be updated.
// We do not want Caret to reload the context every time a file is modified, so we use this class merely
// to inform Caret that the change has occurred, and tell Caret to reload the file before making
// any changes to it. This fixes an issue with diff editing, where Caret was unable to complete a diff edit.
// a diff edit because the file was modified since Caret last read it.

// FileContextTracker
//
// This class is responsible for tracking file operations.
// If the full contents of a file are pass to Caret via a tool, mention, or edit, the file is marked as active.
// If a file is modified outside of Caret, we detect and track this change to prevent stale context.
export class FileContextTracker {
	readonly taskId: string
	private controllerRef: WeakRef<Controller> // Use Controller type

	// File tracking and watching
	private fileWatchers = new Map<string, vscode.FileSystemWatcher>()
	private recentlyModifiedFiles = new Set<string>()
	private recentlyEditedByCaret = new Set<string>()

	constructor(controller: Controller, taskId: string) {
		// Use Controller type
		this.controllerRef = new WeakRef(controller)
		this.taskId = taskId
	}

	// While a task is ref'd by a controller, it will always have access to the extension context
	// This error is thrown if the controller derefs the task after e.g., aborting the task
	private context(): vscode.ExtensionContext {
		const context = this.controllerRef.deref()?.context
		if (!context) {
			throw new Error("Unable to access extension context")
		}
		return context
	}

	// Gets the current working directory or returns undefined if it cannot be determined
	private getCwd(): string | undefined {
		const cwd = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath).at(0)
		if (!cwd) {
			console.info("No workspace folder available - cannot determine current working directory")
		}
		return cwd
	}

	// File watchers are set up for each file that is tracked in the task metadata.
	async setupFileWatcher(filePath: string) {
		// Only setup watcher if it doesn't already exist for this file
		if (this.fileWatchers.has(filePath)) {
			return
		}

		const cwd = this.getCwd()
		if (!cwd) {
			return
		}

		// Create a file system watcher for this specific file
		const fileUri = vscode.Uri.file(path.resolve(cwd, filePath))
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(path.dirname(fileUri.fsPath), path.basename(fileUri.fsPath)),
		)

		// Track file changes
		watcher.onDidChange(() => {
			if (this.recentlyEditedByCaret.has(filePath)) {
				this.recentlyEditedByCaret.delete(filePath) // This was an edit by Caret, no need to inform Caret
			} else {
				this.recentlyModifiedFiles.add(filePath) // This was a user edit, we will inform Caret
				this.trackFileContext(filePath, "user_edited") // Update the task metadata with file tracking
			}
		})

		// Store the watcher so we can dispose it later
		this.fileWatchers.set(filePath, watcher)
	}

	// Tracks a file operation in metadata and sets up a watcher for the file
	// This is the main entry point for FileContextTracker and is called when a file is passed to Caret via a tool, mention, or edit.
	async trackFileContext(filePath: string, operation: "read_tool" | "user_edited" | "caret_edited" | "file_mentioned") {
		try {
			const cwd = this.getCwd()
			if (!cwd) {
				return
			}

			const context = this.context()
			// Add file to metadata
			await this.addFileToFileContextTracker(context, this.taskId, filePath, operation)

			// Set up file watcher for this file
			await this.setupFileWatcher(filePath)
		} catch (error) {
			console.error("Failed to track file operation:", error)
		}
	}

	// Adds a file to the metadata tracker
	// This handles the business logic of determining if the file is new, stale, or active.
	// It also updates the metadata with the latest read/edit dates.
	async addFileToFileContextTracker(
		context: vscode.ExtensionContext,
		taskId: string,
		filePath: string,
		source: FileMetadataEntry["record_source"],
	) {
		try {
			const metadata = await getTaskMetadata(context, taskId)
			const now = Date.now()

			// Mark existing entries for this file as stale
			metadata.files_in_context.forEach((entry: FileMetadataEntry) => {
				// Add type annotation
				if (entry.path === filePath && entry.record_state === "active") {
					entry.record_state = "stale"
				}
			})

			// Helper to get the latest date for a specific field and file
			const getLatestDateForField = (path: string, field: keyof FileMetadataEntry): number | null => {
				const relevantEntries = metadata.files_in_context
					.filter((entry: FileMetadataEntry) => entry.path === path && entry[field]) // Add type annotation
					.sort((a: FileMetadataEntry, b: FileMetadataEntry) => (b[field] as number) - (a[field] as number)) // Add type annotations

				return relevantEntries.length > 0 ? (relevantEntries[0][field] as number) : null
			}

			let newEntry: FileMetadataEntry = {
				path: filePath,
				record_state: "active",
				record_source: source,
				caret_read_date: getLatestDateForField(filePath, "caret_read_date"),
				caret_edit_date: getLatestDateForField(filePath, "caret_edit_date"),
				user_edit_date: getLatestDateForField(filePath, "user_edit_date"),
			}

			switch (source) {
				// user_edited: The user has edited the file
				case "user_edited":
					newEntry.user_edit_date = now
					this.recentlyModifiedFiles.add(filePath)
					break

				// caret_edited: Caret has edited the file
				case "caret_edited":
					newEntry.caret_read_date = now
					newEntry.caret_edit_date = now
					break

				// read_tool/file_mentioned: Caret has read the file via a tool or file mention
				case "read_tool":
				case "file_mentioned":
					newEntry.caret_read_date = now
					break
			}

			metadata.files_in_context.push(newEntry)
			await saveTaskMetadata(context, taskId, metadata)
		} catch (error) {
			console.error("Failed to add file to metadata:", error)
		}
	}

	// Returns (and then clears) the set of recently modified files
	getAndClearRecentlyModifiedFiles(): string[] {
		const files = Array.from(this.recentlyModifiedFiles)
		this.recentlyModifiedFiles.clear()
		return files
	}

	// Marks a file as edited by Caret to prevent false positives in file watchers
	markFileAsEditedByCaret(filePath: string): void {
		this.recentlyEditedByCaret.add(filePath)
	}

	// Disposes all file watchers
	dispose(): void {
		for (const watcher of this.fileWatchers.values()) {
			watcher.dispose()
		}
		this.fileWatchers.clear()
	}
}
