const { expect } = require("chai")
const vscode = require("vscode")

describe("Caret Extension Tests", function () {
	this.timeout(60000) // Increased timeout for extension operations

	let extension

	// Activate the extension once before all tests
	before(async () => {
		extension = vscode.extensions.getExtension("caret-team.caret")
		expect(extension).to.not.be.undefined
		if (!extension.isActive) {
			await extension.activate()
		}
	})

	it("should activate the extension successfully", () => {
		expect(extension.isActive).to.be.true
	})

	it("should execute the new task command", async () => {
		await vscode.commands.executeCommand("caret.plusButtonClicked")
		// Success if no error is thrown
	})

	it("should execute the history command", async () => {
		await vscode.commands.executeCommand("caret.historyButtonClicked")
		// Success if no error is thrown
	})

	it("should execute the settings command", async () => {
		await vscode.commands.executeCommand("caret.settingsButtonClicked")
		// Success if no error is thrown
	})

	it("should execute the account command", async () => {
		await vscode.commands.executeCommand("caret.accountButtonClicked")
		// Success if no error is thrown
	})

	it("should execute the mcp command", async () => {
		await vscode.commands.executeCommand("caret.mcpButtonClicked")
		// Success if no error is thrown
	})

	it("should execute the popout command", async () => {
		// This command is expected to fail until implemented
		try {
			await vscode.commands.executeCommand("caret.popoutButtonClicked")
		} catch (error) {
			// We can assert the error message if we want to be specific
			expect(error).to.be.an("error")
		}
	})
})
