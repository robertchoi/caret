// CARET MODIFICATION: JSON Template Loader for 003-03 overlay system
// Purpose: Load and validate JSON templates for prompt customization
// Following existing Controller pattern for consistency

import { promises as fs } from "fs"
import * as path from "path"
import { caretLogger } from "../../utils/caret-logger"
import { PromptTemplate, TemplateValidationResult } from "./types"

/**
 * JSON Template Loader
 *
 * Loads and validates JSON templates for prompt overlay system.
 * Based on existing Controller pattern for JSON loading.
 *
 * Design Principles:
 * - Reuse existing patterns from Controller
 * - Safety first: Strict validation prevents invalid templates
 * - Performance: Template caching reduces file I/O
 * - Simplicity: Clean API for template loading
 */
export class JsonTemplateLoader {
	private templateCache: Map<string, PromptTemplate>
	private templateDir: string
	private isTestEnvironment: boolean

	constructor(extensionPath: string, useTestTemplates: boolean = false) {
		this.templateCache = new Map()
		this.isTestEnvironment = useTestTemplates

		// CARET MODIFICATION: Use test-templates directory for tests
		if (useTestTemplates) {
			this.templateDir = path.join(extensionPath, "caret-assets", "test-templates")
			caretLogger.info(`[JsonTemplateLoader] Initialized with TEST template directory: ${this.templateDir}`, "JSON_LOADER")
		} else {
			// CARET MODIFICATION: Use sections directory for system prompt JSON files
			this.templateDir = path.join(extensionPath, "caret-src", "core", "prompts", "sections")
			caretLogger.info(`[JsonTemplateLoader] Initialized with sections directory: ${this.templateDir}`, "JSON_LOADER")
		}
	}

	/**
	 * Load a JSON template by name
	 * Following Controller pattern for JSON loading exactly
	 *
	 * @param templateName Name of the template (without .json extension)
	 * @returns Promise<PromptTemplate> Validated template
	 * @throws Error if template not found or invalid
	 */
	async loadTemplate(templateName: string): Promise<PromptTemplate> {
		// Check cache first (performance optimization)
		if (this.templateCache.has(templateName)) {
			caretLogger.info(`[JsonTemplateLoader] Using cached template: ${templateName}`, "JSON_LOADER")
			return this.templateCache.get(templateName)!
		}

		try {
			caretLogger.info(`[JsonTemplateLoader] Loading template: ${templateName}`, "JSON_LOADER")

			// EXACTLY following Controller pattern: path.join + fs.readFile + JSON.parse
			const templatePath = path.join(this.templateDir, `${templateName}.json`)
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const rawTemplate = JSON.parse(templateContent)

			// CARET MODIFICATION: Support legacy JSON format alongside PromptTemplate format
			let template: PromptTemplate
			if (rawTemplate.metadata && rawTemplate.add) {
				// Already in PromptTemplate format
				template = rawTemplate as PromptTemplate
			} else {
				// Legacy format - convert to PromptTemplate
				template = this.adaptLegacyFormat(rawTemplate, templateName)
			}

			// Validate template structure
			const validationResult = await this.validateTemplate(template)
			if (!validationResult.isValid) {
				throw new Error(`Invalid template ${templateName}: ${validationResult.errors.join(", ")}`)
			}

			// Cache the validated template
			this.templateCache.set(templateName, template)

			const sections = template.add.sections?.length ?? 0
			const behaviors = template.add.behaviors?.length ?? 0
			const modifications = template.modify.targetSections?.length ?? 0
			caretLogger.info(
				`[JsonTemplateLoader] Template loaded successfully: ${templateName} (v${template.metadata.version}, ${sections} sections, ${behaviors} behaviors, ${modifications} modifications)`,
				"JSON_LOADER",
			)

			return template
		} catch (error) {
			caretLogger.error(`[JsonTemplateLoader] Failed to load template: ${templateName} - ${error}`, "JSON_LOADER")
			throw new Error(`Failed to load template ${templateName}: ${error}`)
		}
	}

	/**
	 * Validate template structure
	 * Safety first approach with comprehensive validation
	 *
	 * @param template Template to validate
	 * @returns Promise<TemplateValidationResult> Validation result
	 */
	async validateTemplate(template: PromptTemplate): Promise<TemplateValidationResult> {
		const errors: string[] = []
		const warnings: string[] = []

		try {
			// Basic structure validation
			if (!template.metadata) {
				errors.push("Missing metadata section")
			} else {
				if (!template.metadata.name) {
					errors.push("Missing metadata.name")
				}
				if (!template.metadata.version) {
					errors.push("Missing metadata.version")
				}
				if (!template.metadata.description) {
					errors.push("Missing metadata.description")
				}
				if (!template.metadata.compatibleWith || !Array.isArray(template.metadata.compatibleWith)) {
					errors.push("Missing or invalid metadata.compatibleWith")
				}
			}

			// Validate add section
			if (template.add) {
				if (template.add.sections) {
					if (!Array.isArray(template.add.sections)) {
						errors.push("add.sections must be an array")
					} else {
						template.add.sections.forEach((section, index) => {
							if (!section.id) {
								errors.push(`add.sections[${index}] missing id`)
							}
							if (!section.content) {
								errors.push(`add.sections[${index}] missing content`)
							}
							if (
								!["before_tools", "after_tools", "before_objective", "after_objective"].includes(section.position)
							) {
								errors.push(`add.sections[${index}] has invalid position: ${section.position}`)
							}
						})
					}
				}

				if (template.add.behaviors) {
					if (!Array.isArray(template.add.behaviors)) {
						errors.push("add.behaviors must be an array")
					} else {
						template.add.behaviors.forEach((behavior, index) => {
							if (!behavior || typeof behavior !== "string") {
								errors.push(`add.behaviors[${index}] must be a non-empty string`)
							}
						})
					}
				}
			}

			// Validate modify section
			if (template.modify) {
				if (template.modify.targetSections) {
					if (!Array.isArray(template.modify.targetSections)) {
						errors.push("modify.targetSections must be an array")
					} else {
						template.modify.targetSections.forEach((mod, index) => {
							if (!mod.target) {
								errors.push(`modify.targetSections[${index}] missing target`)
							}
							if (!mod.replacement) {
								errors.push(`modify.targetSections[${index}] missing replacement`)
							}
							if (typeof mod.preserveFormat !== "boolean") {
								errors.push(`modify.targetSections[${index}] preserveFormat must be boolean`)
							}
						})
					}
				}
			}

			// Safety validation - ensure no remove operations in this phase
			if ((template as any).remove) {
				errors.push("Remove operations are not allowed in this phase (003-03)")
			}

			// Validate JSON structure integrity
			if (typeof template !== "object") {
				errors.push("Template must be a valid JSON object")
			}
		} catch (error) {
			errors.push(`Template validation error: ${error}`)
		}

		const isValid = errors.length === 0

		if (!isValid) {
			const errorPreview = errors.slice(0, 5).join(", ")
			caretLogger.warn(
				`[JsonTemplateLoader] Template validation failed: ${errors.length} errors - ${errorPreview}`,
				"JSON_LOADER",
			)
		}

		return {
			isValid,
			errors,
			warnings,
		}
	}

	// CARET MODIFICATION: Add legacy format adaptation
	/**
	 * Convert legacy JSON format to PromptTemplate format
	 * Safely preserves existing content while adapting structure
	 *
	 * @param content Legacy JSON content
	 * @param templateName Template filename for metadata
	 * @returns PromptTemplate Converted template
	 */
	private adaptLegacyFormat(content: any, templateName: string): PromptTemplate {
		caretLogger.info(`[JsonTemplateLoader] Converting legacy format for template: ${templateName}`, "JSON_LOADER")

		// Generate metadata from legacy content
		const metadata = {
			name: templateName,
			version: "1.0.0",
			description: content.title || content.introduction || `Legacy template: ${templateName}`,
			compatibleWith: ["caret-1.0", "cline-compatible"],
			author: "Caret Team",
			tags: ["legacy-converted"],
		}

		// Convert legacy content to sections
		const sections: any[] = []

		// Handle different legacy structures
		if (content.introduction) {
			// BASE_PROMPT_INTRO style
			sections.push({
				id: "base_introduction",
				content: content.introduction,
				position: "before_tools",
				priority: 10,
			})

			// Add collaboration principles
			if (content.collaboration_principles) {
				sections.push({
					id: "collaboration_principles",
					title: content.collaboration_principles.title,
					content: content.collaboration_principles.content,
					position: "before_tools",
					priority: 20,
				})
			}

			// Add verification principles
			if (content.verification_principles) {
				sections.push({
					id: "verification_principles",
					title: content.verification_principles.title,
					content: content.verification_principles.content,
					position: "before_tools",
					priority: 30,
				})
			}

			// Add tool awareness
			if (content.tool_awareness) {
				sections.push({
					id: "tool_awareness",
					title: content.tool_awareness.title,
					content: content.tool_awareness.content,
					position: "before_tools",
					priority: 40,
				})
			}

			// Add tool use formatting
			if (content.tool_use_header) {
				const formattingContent = [
					content.tool_use_description,
					`## ${content.formatting_header}`,
					content.formatting_description,
					content.formatting_structure_example,
					content.formatting_example_header,
					`\`\`\`\n${content.formatting_example_code}\n\`\`\``,
					content.formatting_note,
				]
					.filter(Boolean)
					.join("\n\n")

				sections.push({
					id: "tool_use_formatting",
					title: content.tool_use_header,
					content: formattingContent,
					position: "before_tools",
					priority: 50,
				})
			}
		} else {
			// Generic legacy content conversion
			const combinedContent = Object.entries(content)
				.filter(([key, value]) => typeof value === "string")
				.map(([key, value]) => `${key}: ${value}`)
				.join("\n\n")

			sections.push({
				id: "legacy_content",
				content: combinedContent,
				position: "after_tools",
				priority: 100,
			})
		}

		return {
			metadata,
			add: {
				sections: sections.length > 0 ? sections : undefined,
				behaviors: [], // Legacy templates don't typically have behaviors
			},
			modify: {}, // Legacy templates don't have modifications
		}
	}

	/**
	 * Clear template cache
	 * Useful for testing or when templates are updated
	 */
	clearCache(): void {
		const cacheSize = this.templateCache.size
		this.templateCache.clear()
		caretLogger.info(`[JsonTemplateLoader] Template cache cleared: ${cacheSize} templates removed`, "JSON_LOADER")
	}

	/**
	 * Get list of cached template names
	 *
	 * @returns string[] Array of cached template names
	 */
	getCachedTemplates(): string[] {
		return Array.from(this.templateCache.keys())
	}

	/**
	 * Get template directory path
	 *
	 * @returns string Template directory path
	 */
	getTemplateDirectory(): string {
		return this.templateDir
	}

	/**
	 * Check if template exists in cache
	 *
	 * @param templateName Name of template
	 * @returns boolean True if template is cached
	 */
	isTemplateCached(templateName: string): boolean {
		return this.templateCache.has(templateName)
	}

	/**
	 * Preload multiple templates into cache
	 *
	 * @param templateNames Array of template names to preload
	 * @returns Promise<string[]> Array of successfully loaded template names
	 */
	async preloadTemplates(templateNames: string[]): Promise<string[]> {
		const loaded: string[] = []

		for (const templateName of templateNames) {
			try {
				await this.loadTemplate(templateName)
				loaded.push(templateName)
			} catch (error) {
				caretLogger.warn(`[JsonTemplateLoader] Failed to preload template: ${templateName} - ${error}`, "JSON_LOADER")
			}
		}

		caretLogger.info(
			`[JsonTemplateLoader] Templates preloaded: ${loaded.length}/${templateNames.length} successful (${loaded.join(", ")})`,
			"JSON_LOADER",
		)

		return loaded
	}
}
