// CARET MODIFICATION: Mission 1B-1 - Comprehensive Cline vs Caret Comparison Test
// Purpose: Generate complete comparison data for semantic equivalence analysis
// Following TDD principles and Caret development guidelines

import { describe, it, expect, vi, beforeAll } from "vitest"
import path from "path"
import fs from "fs/promises"
import { CaretSystemPromptTestHelper } from "./helpers/CaretSystemPromptTestHelper"
import type { McpHub } from "../../src/shared/mcp-hub"
import type { BrowserSettings } from "../../src/api/providers/Anthropic"

describe("Mission 1B-1: Cline vs Caret Comprehensive Comparison", () => {
	let caretPrompt: CaretSystemPromptTestHelper
	const projectRoot = process.cwd()
	const testCwd = "/test/project"

	beforeAll(async () => {
		caretPrompt = new CaretSystemPromptTestHelper(projectRoot)
	})

	describe("Phase 1: Basic System Validation", () => {
		it("should load Cline original system prompt successfully", async () => {
			const { SYSTEM_PROMPT } = await import("../../src/core/prompts/system")

			expect(SYSTEM_PROMPT).toBeDefined()
			expect(typeof SYSTEM_PROMPT).toBe("function")

			const mockMcpHub: Partial<McpHub> = { getServers: vi.fn().mockReturnValue([]) }
			const mockBrowserSettings: Partial<BrowserSettings> = { viewport: { width: 1280, height: 720 } }

			const clinePrompt = await SYSTEM_PROMPT(
				testCwd,
				true, // supportsBrowserUse
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false, // isClaude4ModelFamily
				projectRoot,
				"agent",
			)

			expect(clinePrompt.length).toBeGreaterThan(15000) // Cline prompt is substantial
			console.log(`[CLINE_VALIDATION] ✅ Cline prompt loaded: ${clinePrompt.length} chars`)
		})

		it("should load Caret JSON system successfully", async () => {
			const mockMcpHub: Partial<McpHub> = { getServers: vi.fn().mockReturnValue([]) }
			const mockBrowserSettings: Partial<BrowserSettings> = { viewport: { width: 1280, height: 720 } }

			const caretGeneratedPrompt = await caretPrompt.generateFromJsonSections(
				testCwd,
				true, // supportsBrowserUse
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false, // isClaude4ModelFamily
				"agent",
			)

			expect(caretGeneratedPrompt.length).toBeGreaterThan(18000) // Caret prompt should be substantial (now generates 19,602 chars)
			console.log(`[CARET_VALIDATION] ✅ Caret prompt loaded: ${caretGeneratedPrompt.length} chars`)
		})
	})

	describe("Phase 2: Comprehensive Comparison Data Generation", () => {
		it("should generate COMPLETE Cline vs Caret comparison data for semantic analysis", async () => {
			console.log("[1B-1_PHASE] 🚀 Starting comprehensive comparison data generation...")

			// Step 1: Load both systems with identical parameters
			const clineSystemModule = await import("../../src/core/prompts/system")
			const CLINE_SYSTEM_PROMPT = clineSystemModule.SYSTEM_PROMPT
			const mockMcpHub: Partial<McpHub> = { getServers: vi.fn().mockReturnValue([]) }
			const mockBrowserSettings: Partial<BrowserSettings> = { viewport: { width: 1280, height: 720 } }

			const clinePrompt = await CLINE_SYSTEM_PROMPT(
				testCwd,
				true,
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false,
				projectRoot,
				"agent",
			)

			const caretGeneratedPrompt = await caretPrompt.generateFromJsonSections(
				testCwd,
				true,
				mockMcpHub as McpHub,
				mockBrowserSettings as BrowserSettings,
				false,
				"agent",
			)

			// Step 2: Load and analyze all tools
			const clineToolAnalysis = await analyzeClineTools(testCwd)
			const caretToolAnalysis = await analyzeCaretTools()

			// Step 3: Analyze structural sections
			const clineStructure = analyzeClineStructure(clinePrompt)
			const caretStructure = analyzeCaretStructure(caretGeneratedPrompt, caretToolAnalysis.jsonSections)

			// Step 4: Generate comprehensive comparison data
			const comparisonData = {
				metadata: {
					generated_at: new Date().toISOString(),
					purpose: "Mission 1B-1: Complete Cline vs Caret comparison for semantic equivalence analysis",
					mission_phase: "1B-1_data_generation",
					test_environment: "vitest",
					caret_project_root: projectRoot,
					exclude_plan_act_mode: true,
				},
				prompt_comparison: {
					cline: {
						source: "src/core/prompts/system.ts - SYSTEM_PROMPT function",
						length_chars: clinePrompt.length,
						generated_with_params: {
							cwd: testCwd,
							supportsBrowserUse: true,
							isClaude4ModelFamily: false,
							mode: "agent",
						},
					},
					caret: {
						source: "caret-src/core/prompts/testHelper.ts + JSON sections",
						length_chars: caretGeneratedPrompt.length,
						generated_with_params: {
							cwd: testCwd,
							supportsBrowserUse: true,
							isClaude4ModelFamily: false,
							mode: "agent",
						},
					},
					size_comparison: {
						cline_longer: clinePrompt.length > caretGeneratedPrompt.length,
						size_difference_chars: Math.abs(clinePrompt.length - caretGeneratedPrompt.length),
						size_difference_percentage: Math.round(
							(Math.abs(clinePrompt.length - caretGeneratedPrompt.length) /
								Math.max(clinePrompt.length, caretGeneratedPrompt.length)) *
								100,
						),
					},
				},
				tool_analysis: {
					cline_tools: clineToolAnalysis.tools,
					caret_tools: caretToolAnalysis.tools,
					coverage_analysis: analyzeCoverage(clineToolAnalysis.tools, caretToolAnalysis.tools),
				},
				content_structure_analysis: {
					cline_structure: clineStructure,
					caret_structure: caretStructure,
					section_comparison: compareStructuralSections(clinePrompt, caretToolAnalysis.jsonSections),
				},
				semantic_analysis_preparation: {
					note: "Data prepared for 1B-2 phase AI semantic analysis",
					comparison_dimensions: [
						"tool_functional_equivalence",
						"parameter_compatibility",
						"user_experience_consistency",
						"instruction_clarity",
						"behavior_patterns",
					],
					analysis_questions: [
						"Do both systems provide identical user capabilities?",
						"Are parameter requirements functionally equivalent?",
						"Would users get the same results from both systems?",
						"Are there any functional gaps in Caret vs Cline?",
					],
				},
			}

			// Step 5: Save all comparison data and analysis files
			const outputDir = path.join(projectRoot, "caret-docs", "reports", "json-caret")
			await fs.mkdir(outputDir, { recursive: true })

			// Main comparison data file (for 1B-2 phase)
			const comparisonFile = path.join(outputDir, "tool-comparison-data.json")
			await fs.writeFile(comparisonFile, JSON.stringify(comparisonData, null, 2), "utf8")

			// Full prompts for detailed AI analysis
			const clineFullFile = path.join(outputDir, "cline-full-prompt.txt")
			const caretFullFile = path.join(outputDir, "caret-full-prompt.txt")
			await fs.writeFile(clineFullFile, clinePrompt, "utf8")
			await fs.writeFile(caretFullFile, caretGeneratedPrompt, "utf8")

			// Coverage gap analysis
			const coverageAnalysis = comparisonData.tool_analysis.coverage_analysis
			if (coverageAnalysis.missing_tools.length > 0) {
				const gapAnalysisFile = path.join(outputDir, "coverage-gap-analysis.json")
				const gapData = {
					missing_tools: coverageAnalysis.missing_tools,
					recommendations: coverageAnalysis.missing_tools.map((tool) => ({
						tool_name: tool,
						action_required: "Implement in Caret JSON TOOL_DEFINITIONS",
						priority: "HIGH - needed for 100% coverage",
					})),
				}
				await fs.writeFile(gapAnalysisFile, JSON.stringify(gapData, null, 2), "utf8")
				console.log(`[1B-1_GAPS] ⚠️ Coverage gaps found, analysis saved to: ${gapAnalysisFile}`)
			}

			console.log(`[1B-1_COMPLETE] 📄 Main comparison data: ${comparisonFile}`)
			console.log(`[1B-1_COMPLETE] 📄 Full prompts saved for AI analysis`)
			console.log(`[1B-1_COMPLETE] 🎯 Coverage: ${coverageAnalysis.coverage_percentage}%`)
			console.log(
				`[1B-1_COMPLETE] 🎯 Tools covered: ${coverageAnalysis.covered_tools}/${coverageAnalysis.total_cline_tools}`,
			)

			// Verification assertions
			expect(comparisonData.tool_analysis.cline_tools).toBeDefined()
			expect(Object.keys(comparisonData.tool_analysis.caret_tools).length).toBeGreaterThan(10)
			expect(comparisonData.prompt_comparison.cline.length_chars).toBeGreaterThan(15000)
			expect(comparisonData.prompt_comparison.caret.length_chars).toBeGreaterThan(18000)

			// Coverage requirement (95% minimum, allowing for plan/act exclusion)
			const coveragePercentage = coverageAnalysis.coverage_percentage
			expect(coveragePercentage).toBeGreaterThanOrEqual(95)

			console.log(`[1B-1_SUCCESS] ✅ Mission 1B-1 completed successfully!`)
		})
	})
})

// Helper functions for analysis
async function analyzeClineTools(cwd: string) {
	const { bashToolDefinition } = await import("../../src/core/tools/bashTool")
	const { readToolDefinition } = await import("../../src/core/tools/readTool")
	const { writeToolDefinition } = await import("../../src/core/tools/writeTool")
	const { editToolDefinition } = await import("../../src/core/tools/editTool")
	const { askQuestionToolDefinition } = await import("../../src/core/tools/askQuestionTool")
	const { attemptCompletionToolDefinition } = await import("../../src/core/tools/attemptCompletionTool")
	const { lsToolDefinition } = await import("../../src/core/tools/lsTool")
	const { grepToolDefinition } = await import("../../src/core/tools/grepTool")
	const { listCodeDefinitionNamesToolDefinition } = await import("../../src/core/tools/listCodeDefinitionNamesTool")
	const { browserActionToolDefinition } = await import("../../src/core/tools/browserActionTool")
	const { useMCPToolDefinition } = await import("../../src/core/tools/useMcpTool")
	const { accessMcpResourceToolDefinition } = await import("../../src/core/tools/accessMcpResourceTool")
	const { newTaskToolDefinition } = await import("../../src/core/tools/newTaskTool")

	// Mock browser settings for browserActionToolDefinition
	const mockBrowserSettings = { viewport: { width: 1280, height: 720 } }

	return {
		tools: {
			execute_command: bashToolDefinition(cwd),
			read_file: readToolDefinition(cwd),
			write_to_file: writeToolDefinition(cwd),
			replace_in_file: editToolDefinition,
			ask_followup_question: askQuestionToolDefinition,
			attempt_completion: attemptCompletionToolDefinition,
			list_files: lsToolDefinition,
			search_files: grepToolDefinition,
			list_code_definition_names: listCodeDefinitionNamesToolDefinition(cwd),
			browser_action: browserActionToolDefinition(mockBrowserSettings),
			use_mcp_tool: useMCPToolDefinition,
			access_mcp_resource: accessMcpResourceToolDefinition,
			new_task: newTaskToolDefinition,
			// Note: plan_mode_respond excluded as it's plan/act mode specific
		},
	}
}

async function analyzeCaretTools() {
	const { JsonTemplateLoader } = await import("../core/prompts/JsonTemplateLoader")
	const projectRoot = process.cwd()
	const jsonLoader = new JsonTemplateLoader(projectRoot, false)

	const jsonSections: any = {}
	const sectionNames = [
		"BASE_PROMPT_INTRO",
		"COLLABORATIVE_PRINCIPLES",
		"TOOLS_HEADER",
		"TOOL_USE_FORMAT",
		"TOOL_DEFINITIONS",
		"TOOL_USE_EXAMPLES",
		"TOOL_USE_GUIDELINES",
		"CHATBOT_AGENT_MODES",
		"OBJECTIVE",
	]

	for (const sectionName of sectionNames) {
		try {
			jsonSections[sectionName] = await jsonLoader.loadTemplate(sectionName)
		} catch (error) {
			console.warn(`[CARET_SECTIONS] Could not load ${sectionName}:`, error)
			jsonSections[sectionName] = null
		}
	}

	return {
		tools: jsonSections.TOOL_DEFINITIONS?.tools || {},
		jsonSections: jsonSections,
	}
}

function analyzeCoverage(clineTools: any, caretTools: any) {
	const clineToolNames = Object.keys(clineTools)
	const caretToolNames = Object.keys(caretTools)

	const covered = clineToolNames.filter((name) => caretToolNames.includes(name))
	const missing = clineToolNames.filter((name) => !caretToolNames.includes(name))
	const extra = caretToolNames.filter((name) => !clineToolNames.includes(name))

	return {
		total_cline_tools: clineToolNames.length,
		total_caret_tools: caretToolNames.length,
		covered_tools: covered.length,
		missing_tools: missing,
		extra_tools: extra,
		coverage_percentage: Math.round((covered.length / clineToolNames.length) * 100),
	}
}

function analyzeClineStructure(prompt: string) {
	const lines = prompt.split("\n")
	const sections: any[] = []
	let currentSection: any = null

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (line.startsWith("====") || line.startsWith("##")) {
			if (currentSection) {
				sections.push(currentSection)
			}
			currentSection = {
				type: line.startsWith("##") ? "tool_definition" : "section_header",
				title: line.replace(/[=#]/g, "").trim(),
				line_number: i + 1,
				content_lines: 0,
			}
		} else if (currentSection && line.length > 0) {
			currentSection.content_lines++
		}
	}

	if (currentSection) {
		sections.push(currentSection)
	}

	return {
		total_lines: lines.length,
		sections: sections,
		tool_sections: sections.filter((s) => s.type === "tool_definition"),
		header_sections: sections.filter((s) => s.type === "section_header"),
	}
}

function analyzeCaretStructure(prompt: string, jsonSections: any) {
	return {
		json_sections_loaded: Object.keys(jsonSections).length,
		json_sections_success: Object.values(jsonSections).filter((s) => s !== null).length,
		generated_prompt_lines: prompt.split("\n").length,
		tool_count: jsonSections.TOOL_DEFINITIONS?.tools ? Object.keys(jsonSections.TOOL_DEFINITIONS.tools).length : 0,
	}
}

function compareStructuralSections(clinePrompt: string, caretSections: any) {
	const clineHasAgentMode = clinePrompt.includes("AGENT MODE")
	const clineHasChatbotMode = clinePrompt.includes("CHATBOT MODE")
	const clineHasToolDefinitions = clinePrompt.includes("## execute_command")

	const caretHasAgentMode = caretSections.CHATBOT_AGENT_MODES !== null
	const caretHasToolDefinitions = caretSections.TOOL_DEFINITIONS !== null

	return {
		mode_definitions: {
			cline_has_agent_mode: clineHasAgentMode,
			cline_has_chatbot_mode: clineHasChatbotMode,
			caret_has_mode_section: caretHasAgentMode,
			modes_equivalent: clineHasAgentMode && clineHasChatbotMode && caretHasAgentMode,
		},
		tool_definitions: {
			cline_has_tool_definitions: clineHasToolDefinitions,
			caret_has_tool_definitions: caretHasToolDefinitions,
			both_have_tools: clineHasToolDefinitions && caretHasToolDefinitions,
		},
	}
}
