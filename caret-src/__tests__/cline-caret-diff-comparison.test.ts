import { describe, it, expect, beforeEach, vi } from "vitest"
import path from "path"
import fs from "fs/promises"

describe("Cline vs Caret Diff Comparison for Semantic Analysis", () => {
	let testCwd: string
	let projectRoot: string
	let outputDir: string

	beforeEach(() => {
		testCwd = "/test/project"
		projectRoot = process.cwd()
		outputDir = path.join(projectRoot, "caret-docs", "reports", "json-caret")
	})

	describe("🔍 Generate Comparison Files for AI Analysis", () => {
		it("should generate complete diff comparison for semantic analysis", async () => {
			console.log("[DIFF] 🎯 Generating comprehensive diff comparison files...")

			// Step 1: Generate both system prompts
			const { clinePrompt, caretPrompt } = await generateBothPrompts()

			// Step 2: Generate structured comparison data
			const comparisonData = await generateComparisonData(clinePrompt, caretPrompt)

			// Step 3: Generate diff analysis files
			await generateDiffAnalysisFiles(comparisonData)

			console.log("[DIFF] ✅ All comparison files generated successfully")
			console.log(`[DIFF] 📁 Files saved to: ${outputDir}`)

			// Verify files exist
			const expectedFiles = [
				"cline-vs-caret-diff-report.json",
				"cline-full-prompt.txt",
				"caret-full-prompt.txt",
				"side-by-side-comparison.html",
				"semantic-analysis-input.json",
			]

			for (const file of expectedFiles) {
				const filePath = path.join(outputDir, file)
				expect(
					await fs
						.access(filePath)
						.then(() => true)
						.catch(() => false),
				).toBe(true)
				console.log(`[VERIFY] ✅ ${file} created`)
			}
		}, 15000)

		it("should identify specific differences between systems", async () => {
			console.log("[DIFF] 🔍 Identifying specific system differences...")

			const { clinePrompt, caretPrompt } = await generateBothPrompts()
			const differences = await identifySpecificDifferences(clinePrompt, caretPrompt)

			// Save detailed difference analysis
			const diffAnalysis = {
				timestamp: new Date().toISOString(),
				comparison_summary: {
					cline_length: clinePrompt.length,
					caret_length: caretPrompt.length,
					size_difference: Math.abs(clinePrompt.length - caretPrompt.length),
					size_difference_percentage: (
						(Math.abs(clinePrompt.length - caretPrompt.length) / clinePrompt.length) *
						100
					).toFixed(2),
				},
				identified_differences: differences,
				semantic_analysis_questions: [
					"Are the tool definitions functionally equivalent?",
					"Do both systems provide the same capabilities to users?",
					"Are there any missing features in either system?",
					"Do the response formats maintain consistency?",
					"Are the browser actions identical?",
					"Is the MCP integration equivalent?",
					"Do slash commands work the same way?",
				],
			}

			await fs.mkdir(outputDir, { recursive: true })
			await fs.writeFile(
				path.join(outputDir, "detailed-difference-analysis.json"),
				JSON.stringify(diffAnalysis, null, 2),
				"utf8",
			)

			console.log(`[DIFF] 📊 Found ${differences.length} difference categories`)
			console.log(`[DIFF] 📏 Size difference: ${diffAnalysis.comparison_summary.size_difference_percentage}%`)
			console.log("[DIFF] ✅ Detailed analysis saved")

			expect(differences.length).toBeGreaterThan(0)
		}, 15000)
	})
})

// Helper Functions
async function generateBothPrompts(): Promise<{ clinePrompt: string; caretPrompt: string }> {
	const testCwd = "/test/project"
	const extensionPath = process.cwd()

	// Mock objects for both systems (compatible with Cline's URI expectations)
	const mockCwd = {
		scheme: "file",
		authority: "",
		path: testCwd,
		query: "",
		fragment: "",
		fsPath: testCwd,
		with: vi.fn(),
		toString: () => `file://${testCwd}`,
		toJSON: () => ({
			scheme: "file",
			authority: "",
			path: testCwd,
			query: "",
			fragment: "",
			external: `file://${testCwd}`,
		}),
		toPosix: () => testCwd.replace(/\\/g, "/"),
	}

	const mockMcpHub = {
		getServers: () => [],
		listResources: () => Promise.resolve([]),
	}

	const mockBrowserSettings = { viewport: { width: 1280, height: 720 } }

	// Generate Cline prompt (using ORIGINAL_CLINE_SYSTEM_PROMPT to avoid Caret extensions)
	const { ORIGINAL_CLINE_SYSTEM_PROMPT } = await import("../../src/core/prompts/system")
	const clinePrompt = ORIGINAL_CLINE_SYSTEM_PROMPT(
		testCwd, // Use string cwd directly
		true, // supportsBrowserUse
		mockMcpHub,
		mockBrowserSettings,
		false, // isClaude4ModelFamily
	)

	// Generate Caret prompt
	const { CaretSystemPrompt } = await import("../core/prompts/CaretSystemPrompt")
	const caretSystemPrompt = new CaretSystemPrompt(extensionPath, false) // 실제 sections 경로 사용
	const caretPrompt = await caretSystemPrompt.generateFromJsonSections(
		testCwd,
		true, // supportsBrowserUse
		mockMcpHub,
		mockBrowserSettings,
		false, // isClaude4ModelFamily
		"agent", // mode
	)

	return { clinePrompt, caretPrompt }
}

async function generateComparisonData(clinePrompt: string, caretPrompt: string) {
	const outputDir = path.join(process.cwd(), "caret-docs", "reports", "json-caret")
	await fs.mkdir(outputDir, { recursive: true })

	// Save full prompts
	await fs.writeFile(path.join(outputDir, "cline-full-prompt.txt"), clinePrompt, "utf8")
	await fs.writeFile(path.join(outputDir, "caret-full-prompt.txt"), caretPrompt, "utf8")

	// Extract structural data
	const clineTools = extractToolsFromPrompt(clinePrompt)
	const caretTools = extractToolsFromPrompt(caretPrompt)
	const clineSections = extractSections(clinePrompt)
	const caretSections = extractSections(caretPrompt)

	const comparisonData = {
		metadata: {
			timestamp: new Date().toISOString(),
			cline_prompt_length: clinePrompt.length,
			caret_prompt_length: caretPrompt.length,
			size_difference: Math.abs(clinePrompt.length - caretPrompt.length),
		},
		tools_comparison: {
			cline_tools: clineTools,
			caret_tools: caretTools,
			tools_only_in_cline: clineTools.filter((t) => !caretTools.includes(t)),
			tools_only_in_caret: caretTools.filter((t) => !clineTools.includes(t)),
			common_tools: clineTools.filter((t) => caretTools.includes(t)),
		},
		sections_comparison: {
			cline_sections: clineSections,
			caret_sections: caretSections,
			sections_only_in_cline: clineSections.filter((s) => !caretSections.includes(s)),
			sections_only_in_caret: caretSections.filter((s) => !clineSections.includes(s)),
		},
		content_analysis: {
			cline_has_plan_act_mode: clinePrompt.includes("PLAN MODE") || clinePrompt.includes("ACT MODE"),
			caret_has_chatbot_agent_mode: caretPrompt.includes("CHATBOT MODE") || caretPrompt.includes("AGENT MODE"),
			both_have_browser_support: clinePrompt.includes("browser_action") && caretPrompt.includes("browser_action"),
			both_have_mcp_support: clinePrompt.includes("use_mcp_tool") && caretPrompt.includes("use_mcp_tool"),
		},
	}

	return comparisonData
}

async function generateDiffAnalysisFiles(comparisonData: any) {
	const outputDir = path.join(process.cwd(), "caret-docs", "reports", "json-caret")

	// 1. Main diff report
	await fs.writeFile(path.join(outputDir, "cline-vs-caret-diff-report.json"), JSON.stringify(comparisonData, null, 2), "utf8")

	// 2. Semantic analysis input
	const semanticInput = {
		analysis_type: "cline_caret_equivalence",
		input_files: {
			cline_prompt: "cline-full-prompt.txt",
			caret_prompt: "caret-full-prompt.txt",
		},
		analysis_questions: [
			"Functional Equivalence: Can both systems achieve the same tasks?",
			"Tool Parity: Do both systems provide identical tool capabilities?",
			"User Experience: Will users get the same results from both systems?",
			"Feature Coverage: Are there any missing features in either system?",
			"Response Quality: Do both systems provide equivalent response formatting?",
			"Integration Support: Are MCP and browser integrations equivalent?",
			"Command Support: Do slash commands work identically?",
		],
		comparison_data: comparisonData,
		expected_outcome: "semantic_equivalence_analysis",
	}

	await fs.writeFile(path.join(outputDir, "semantic-analysis-input.json"), JSON.stringify(semanticInput, null, 2), "utf8")

	// 3. Side-by-side comparison HTML
	const htmlComparison = generateSideBySideHTML(comparisonData)
	await fs.writeFile(path.join(outputDir, "side-by-side-comparison.html"), htmlComparison, "utf8")
}

async function identifySpecificDifferences(clinePrompt: string, caretPrompt: string): Promise<any[]> {
	const differences: any[] = []

	// Size difference
	const sizeDiff = Math.abs(clinePrompt.length - caretPrompt.length)
	if (sizeDiff > 1000) {
		differences.push({
			category: "prompt_size",
			description: `Significant size difference: ${sizeDiff} characters`,
			impact: "high",
			requires_analysis: true,
		})
	}

	// Mode system differences
	const clineHasPlanAct = clinePrompt.includes("PLAN MODE") || clinePrompt.includes("ACT MODE")
	const caretHasChatAgent = caretPrompt.includes("CHATBOT MODE") || caretPrompt.includes("AGENT MODE")

	if (clineHasPlanAct !== caretHasChatAgent) {
		differences.push({
			category: "mode_system",
			description: "Different mode systems: Cline (Plan/Act) vs Caret (Chatbot/Agent)",
			impact: "medium",
			requires_analysis: true,
		})
	}

	// Tool differences
	const clineTools = extractToolsFromPrompt(clinePrompt)
	const caretTools = extractToolsFromPrompt(caretPrompt)
	const toolsDiff = clineTools.length !== caretTools.length

	if (toolsDiff) {
		differences.push({
			category: "tool_count",
			description: `Tool count difference: Cline ${clineTools.length} vs Caret ${caretTools.length}`,
			impact: "low",
			requires_analysis: false,
		})
	}

	// Content-specific differences
	const contentChecks = [
		{ key: "slash_commands", cline: clinePrompt.includes("/newtask"), caret: caretPrompt.includes("/newtask") },
		{
			key: "response_formatting",
			cline: clinePrompt.includes("formatResponse"),
			caret: caretPrompt.includes("formatResponse"),
		},
		{ key: "mcp_documentation", cline: clinePrompt.includes("MCP server"), caret: caretPrompt.includes("MCP server") },
	]

	for (const check of contentChecks) {
		if (check.cline !== check.caret) {
			differences.push({
				category: check.key,
				description: `${check.key} availability differs between systems`,
				impact: "medium",
				requires_analysis: true,
			})
		}
	}

	return differences
}

function extractToolsFromPrompt(prompt: string): string[] {
	const toolMatches = prompt.match(/## (\w+)/g) || []
	const validTools = [
		"execute_command",
		"read_file",
		"write_to_file",
		"replace_in_file",
		"search_files",
		"list_files",
		"list_code_definition_names",
		"browser_action",
		"use_mcp_tool",
		"access_mcp_resource",
		"ask_followup_question",
		"attempt_completion",
		"new_task",
		"plan_mode_respond",
		"load_mcp_documentation",
	]
	return toolMatches.map((match) => match.replace("## ", "")).filter((tool) => validTools.includes(tool))
}

function extractSections(prompt: string): string[] {
	const sectionMatches = prompt.match(/^#+\s+(.+)$/gm) || []
	return sectionMatches.map((match) => match.replace(/^#+\s+/, ""))
}

function generateSideBySideHTML(comparisonData: any): string {
	return `
<!DOCTYPE html>
<html>
<head>
    <title>Cline vs Caret Comparison</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .system-panel { border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
        .cline { background-color: #f0f8ff; }
        .caret { background-color: #f0fff0; }
        .diff-highlight { background-color: #ffeb3b; padding: 2px 4px; }
        .stats { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔍 Cline vs Caret System Comparison</h1>
    
    <div class="stats">
        <h3>📊 Statistics</h3>
        <p>Cline Prompt Length: ${comparisonData.metadata.cline_prompt_length} chars</p>
        <p>Caret Prompt Length: ${comparisonData.metadata.caret_prompt_length} chars</p>
        <p>Size Difference: ${comparisonData.metadata.size_difference} chars</p>
    </div>

    <div class="comparison-grid">
        <div class="system-panel cline">
            <h3>🔧 Cline System</h3>
            <p><strong>Tools:</strong> ${comparisonData.tools_comparison.cline_tools.length}</p>
            <ul>
                ${comparisonData.tools_comparison.cline_tools.map((tool) => `<li>${tool}</li>`).join("")}
            </ul>
        </div>
        
        <div class="system-panel caret">
            <h3>⚡ Caret System</h3>
            <p><strong>Tools:</strong> ${comparisonData.tools_comparison.caret_tools.length}</p>
            <ul>
                ${comparisonData.tools_comparison.caret_tools.map((tool) => `<li>${tool}</li>`).join("")}
            </ul>
        </div>
    </div>

    <h3>🔍 Key Differences</h3>
    <ul>
        <li><span class="diff-highlight">Tools only in Cline:</span> ${comparisonData.tools_comparison.tools_only_in_cline.join(", ") || "None"}</li>
        <li><span class="diff-highlight">Tools only in Caret:</span> ${comparisonData.tools_comparison.tools_only_in_caret.join(", ") || "None"}</li>
        <li><span class="diff-highlight">Plan/Act Mode (Cline):</span> ${comparisonData.content_analysis.cline_has_plan_act_mode ? "Yes" : "No"}</li>
        <li><span class="diff-highlight">Chatbot/Agent Mode (Caret):</span> ${comparisonData.content_analysis.caret_has_chatbot_agent_mode ? "Yes" : "No"}</li>
        <li><span class="diff-highlight">Browser Support:</span> ${comparisonData.content_analysis.both_have_browser_support ? "Both" : "Partial"}</li>
        <li><span class="diff-highlight">MCP Support:</span> ${comparisonData.content_analysis.both_have_mcp_support ? "Both" : "Partial"}</li>
    </ul>

    <p><em>Generated on ${comparisonData.metadata.timestamp}</em></p>
</body>
</html>`
}
