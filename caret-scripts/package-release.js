const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const projectRoot = path.resolve(__dirname, "..")

function getTimestamp() {
	const now = new Date()
	const YYYY = now.getFullYear()
	const MM = String(now.getMonth() + 1).padStart(2, "0")
	const DD = String(now.getDate()).padStart(2, "0")
	const HH = String(now.getHours()).padStart(2, "0")
	const mm = String(now.getMinutes()).padStart(2, "0")
	return `${YYYY}${MM}${DD}${HH}${mm}`
}

function runCommand(command, description) {
	console.log(`\n📦 [${description}] Running command: ${command}`)
	try {
		execSync(command, { stdio: "inherit", cwd: projectRoot })
		console.log(`✅ [${description}] Command completed successfully.`)
	} catch (error) {
		console.error(`❌ [${description}] Command failed: ${error.message}`)
		// execSync throws an error that includes stderr, so no need to log it separately
		process.exit(1)
	}
}

function cleanDirectory(directoryPath, description) {
	console.log(`\n🧹 [${description}] Cleaning directory: ${directoryPath}`)
	if (fs.existsSync(directoryPath)) {
		try {
			fs.rmSync(directoryPath, { recursive: true, force: true })
			console.log(`✅ [${description}] Directory cleaned successfully.`)
		} catch (error) {
			console.error(`❌ [${description}] Failed to clean directory: ${error.message}`)
			process.exit(1)
		}
	} else {
		console.log(`ℹ️ [${description}] Directory does not exist, skipping cleanup.`)
	}
}

console.log("🚀 Starting Caret VSIX release packaging process...")

// 1. Read version from package.json
let version
try {
	const packageJsonPath = path.join(projectRoot, "package.json")
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
	version = packageJson.version
	if (!version) {
		throw new Error("Version not found in package.json")
	}
	console.log(`ℹ️ Project version: ${version}`)
} catch (error) {
	console.error(`❌ Failed to read version from package.json: ${error.message}`)
	process.exit(1)
}

// 2. Generate timestamp and VSIX filename/path
const timestamp = getTimestamp()
const vsixFilename = `caret-${version}-${timestamp}.vsix`
const outputDir = path.join(projectRoot, "output")
const outputPath = path.join(outputDir, vsixFilename)
console.log(`ℹ️ Target VSIX file: ${outputPath}`)

// 3. Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
	try {
		fs.mkdirSync(outputDir, { recursive: true })
		console.log(`✅ Output directory created: ${outputDir}`)
	} catch (error) {
		console.error(`❌ Failed to create output directory: ${error.message}`)
		process.exit(1)
	}
}

// 4. Clean build artifacts
const webviewUiBuildPath = path.join(projectRoot, "webview-ui", "build")
const rootDistPath = path.join(projectRoot, "dist") // vsce might create this
cleanDirectory(webviewUiBuildPath, "Webview UI Build Directory")
cleanDirectory(rootDistPath, "Root Dist Directory")

// 5. Run build commands
runCommand("npm run protos", "Protocol Buffers Compilation")
runCommand("npm run compile", "Backend TypeScript Compilation")
runCommand("npm run build:webview", "Webview UI Production Build")

// 6. Package with vsce
const vsceCmd = `npx vsce package --out "${outputPath}"`
runCommand(vsceCmd, "VSIX Packaging with VSCE")

console.log(`\n🎉 Successfully packaged VSIX: ${outputPath}`)
console.log("✨ Caret release packaging process completed! ✨")
