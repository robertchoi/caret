// CARET MODIFICATION: Prompt Overlay Engine for 003-03 overlay system
// Purpose: Apply JSON templates to system prompts while preserving Cline functionality

import { caretLogger } from "../../utils/caret-logger"
import { PromptTemplate, OverlayResult } from "./types"

/**
 * Prompt Overlay Engine
 *
 * Applies JSON templates to system prompts.
 * Ensures all Cline tools and functionality are preserved.
 *
 * Design Principles:
 * - Safety first: Preserve all Cline functionality
 * - Fallback ready: Always return original prompt on failure
 * - Minimal modification: Small, targeted changes only
 * - Clear logging: Track all applied changes
 */
export class PromptOverlayEngine {
	constructor() {
		caretLogger.info("[PromptOverlayEngine] Initialized", "OVERLAY_ENGINE")
	}

	/**
	 * Apply template overlay to system prompt
	 *
	 * @param originalPrompt Original Cline system prompt
	 * @param template Template to apply
	 * @returns Promise<OverlayResult> Result with modified prompt
	 */
	async applyOverlay(originalPrompt: string, template: PromptTemplate): Promise<OverlayResult> {
		const startTime = Date.now()
		const appliedChanges: string[] = []
		const warnings: string[] = []

		try {
			caretLogger.info(`[PromptOverlayEngine] Applying template: ${template.metadata.name}`, "OVERLAY_ENGINE")

			let modifiedPrompt = originalPrompt

			// Apply personality modifications first
			if (template.modify && template.modify.personality) {
				const result = this.applyPersonalityModification(modifiedPrompt, template.modify.personality)
				modifiedPrompt = result.prompt
				appliedChanges.push("Modified personality")
				caretLogger.debug(`[PromptOverlayEngine] Applied personality modification`, "OVERLAY_ENGINE")
			}

			// Apply section additions
			if (template.add && template.add.sections) {
				for (const section of template.add.sections) {
					const result = this.applySectionAddition(modifiedPrompt, section)
					modifiedPrompt = result.prompt
					appliedChanges.push(`Added section: ${section.id}`)
					caretLogger.debug(`[PromptOverlayEngine] Added section: ${section.id}`, "OVERLAY_ENGINE")
				}
			}

			// Apply behavior guidelines
			if (template.add && template.add.behaviors) {
				const result = this.applyBehaviorGuidelines(modifiedPrompt, template.add.behaviors)
				modifiedPrompt = result.prompt
				appliedChanges.push(`Added ${template.add.behaviors.length} behavior guidelines`)
				caretLogger.debug(
					`[PromptOverlayEngine] Added ${template.add.behaviors.length} behavior guidelines`,
					"OVERLAY_ENGINE",
				)
			}

			// Apply target section modifications
			if (template.modify && template.modify.targetSections) {
				for (const modification of template.modify.targetSections) {
					const result = this.applyTargetSectionModification(modifiedPrompt, modification)
					modifiedPrompt = result.prompt
					appliedChanges.push(`Modified section: ${modification.target}`)
					caretLogger.debug(`[PromptOverlayEngine] Modified section: ${modification.target}`, "OVERLAY_ENGINE")
				}
			}

			// Validate that all Cline tools are preserved
			const toolsPreserved = this.validateClineToolsPreserved(originalPrompt, modifiedPrompt)
			if (!toolsPreserved) {
				warnings.push("Some Cline tools may have been affected during overlay")
				caretLogger.warn("[PromptOverlayEngine] Tool preservation validation failed", "OVERLAY_ENGINE")
			}

			const processingTime = Date.now() - startTime
			const metrics = {
				processingTime,
				originalLength: originalPrompt.length,
				finalLength: modifiedPrompt.length,
				sectionsAdded: template.add?.sections?.length ?? 0,
				modificationsApplied: (template.modify?.targetSections?.length ?? 0) + (template.modify?.personality ? 1 : 0),
			}

			caretLogger.info(
				`[PromptOverlayEngine] Template applied successfully: ${appliedChanges.length} changes (${processingTime}ms)`,
				"OVERLAY_ENGINE",
			)

			return {
				success: true,
				prompt: modifiedPrompt,
				appliedChanges,
				warnings,
				metrics,
			}
		} catch (error) {
			caretLogger.error(`[PromptOverlayEngine] Overlay application failed: ${error}`, "OVERLAY_ENGINE")

			// Fallback to original prompt
			return {
				success: false,
				prompt: originalPrompt,
				appliedChanges: [],
				warnings: [`Overlay failed, using original prompt: ${error}`],
			}
		}
	}

	/**
	 * Apply personality modification to prompt
	 *
	 * @param prompt Current prompt
	 * @param personalityText New personality text
	 * @returns Modified prompt result
	 */
	private applyPersonalityModification(prompt: string, personalityText: string): { prompt: string } {
		// Find and replace the first line that defines the AI personality
		// Common patterns: "You are Cline, a highly skilled..." or "You are a..."
		const personalityPattern = /^You are [^,\n]+[,.]?[^\n]*/m

		if (personalityPattern.test(prompt)) {
			const modifiedPrompt = prompt.replace(personalityPattern, personalityText)
			return { prompt: modifiedPrompt }
		}

		// If no personality pattern found, add at the beginning
		return { prompt: `${personalityText}\n\n${prompt}` }
	}

	/**
	 * Apply section addition to prompt
	 *
	 * @param prompt Current prompt
	 * @param section Section to add
	 * @returns Modified prompt result
	 */
	private applySectionAddition(prompt: string, section: any): { prompt: string } {
		const sectionContent = section.title ? `${section.title}\n\n${section.content}` : section.content

		switch (section.position) {
			case "before_tools":
				// Insert before "TOOL USE" or similar sections
				const beforeToolsPattern = /(====\s*\n\s*TOOL USE|## Tools Available|You have access to)/i
				if (beforeToolsPattern.test(prompt)) {
					return { prompt: prompt.replace(beforeToolsPattern, `${sectionContent}\n\n$1`) }
				}
				break

			case "after_tools":
				// Insert after tools section but before objective
				const afterToolsPattern = /(====\s*\n\s*OBJECTIVE)/i
				if (afterToolsPattern.test(prompt)) {
					return { prompt: prompt.replace(afterToolsPattern, `${sectionContent}\n\n$1`) }
				}
				break

			case "before_objective":
				// Insert before objective section
				const beforeObjectivePattern = /(====\s*\n\s*OBJECTIVE|OBJECTIVE|Your task is|You accomplish)/i
				if (beforeObjectivePattern.test(prompt)) {
					return { prompt: prompt.replace(beforeObjectivePattern, `${sectionContent}\n\n$1`) }
				}
				break

			case "after_objective":
				// Insert at the end
				return { prompt: `${prompt}\n\n${sectionContent}` }
		}

		// Default: add at the end
		return { prompt: `${prompt}\n\n${sectionContent}` }
	}

	/**
	 * Apply behavior guidelines to prompt
	 *
	 * @param prompt Current prompt
	 * @param behaviors Array of behavior guidelines
	 * @returns Modified prompt result
	 */
	private applyBehaviorGuidelines(prompt: string, behaviors: string[]): { prompt: string } {
		const behaviorSection = ["BEHAVIORAL GUIDELINES", "", ...behaviors.map((behavior) => `- ${behavior}`), ""].join("\n")

		// Try to insert before objective, otherwise at the end
		const beforeObjectivePattern = /(====\s*\n\s*OBJECTIVE|OBJECTIVE)/i
		if (beforeObjectivePattern.test(prompt)) {
			return { prompt: prompt.replace(beforeObjectivePattern, `${behaviorSection}\n$1`) }
		}

		return { prompt: `${prompt}\n\n${behaviorSection}` }
	}

	/**
	 * Apply target section modification
	 *
	 * @param prompt Current prompt
	 * @param modification Section modification
	 * @returns Modified prompt result
	 */
	private applyTargetSectionModification(prompt: string, modification: any): { prompt: string } {
		// Handle exact string matches and section headers
		if (modification.target === "## Objective") {
			// Look for "## Objective" followed by content
			const objectivePattern = /(## Objective\s*\n[^\n]*)/i
			if (objectivePattern.test(prompt)) {
				return { prompt: prompt.replace(objectivePattern, modification.replacement) }
			}
		}

		// Try exact string replacement
		if (prompt.includes(modification.target)) {
			return { prompt: prompt.replace(modification.target, modification.replacement) }
		}

		// Try regex pattern replacement
		try {
			const targetPattern = new RegExp(modification.target, "gi")
			if (targetPattern.test(prompt)) {
				return { prompt: prompt.replace(targetPattern, modification.replacement) }
			}
		} catch (error) {
			caretLogger.warn(`[PromptOverlayEngine] Invalid regex pattern: ${modification.target}`, "OVERLAY_ENGINE")
		}

		// If target not found, log warning but continue
		caretLogger.warn(`[PromptOverlayEngine] Target section not found: ${modification.target}`, "OVERLAY_ENGINE")
		return { prompt }
	}

	/**
	 * Validate that all Cline tools are preserved in the modified prompt
	 *
	 * @param originalPrompt Original prompt
	 * @param modifiedPrompt Modified prompt
	 * @returns boolean True if tools are preserved
	 */
	private validateClineToolsPreserved(originalPrompt: string, modifiedPrompt: string): boolean {
		// Check for common Cline tool patterns
		const toolPatterns = [
			/## execute_command/i,
			/## read_file/i,
			/## write_file/i,
			/## create_file/i,
			/TOOL USE/i,
			/You have access to/i,
		]

		for (const pattern of toolPatterns) {
			const originalHas = pattern.test(originalPrompt)
			const modifiedHas = pattern.test(modifiedPrompt)

			if (originalHas && !modifiedHas) {
				return false // Tool was removed
			}
		}

		return true
	}
}
