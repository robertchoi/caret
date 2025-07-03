import { describe, it, expect, vi } from "vitest"
import { JsonTemplateLoader } from "../core/prompts/JsonTemplateLoader"
import path from "path"

/**
 * Unit test for COLLABORATIVE_PRINCIPLES template loading and validation.
 * This test ensures the template loads without the "missing content" error.
 */
describe("COLLABORATIVE_PRINCIPLES Template Loading", () => {
	it("should load COLLABORATIVE_PRINCIPLES template without validation errors", async () => {
		// Use actual extension path to find real template files
		const mockExtensionPath = path.resolve(__dirname, "../../")
		
		// Create loader instance
		const loader = new JsonTemplateLoader(mockExtensionPath, false) // Use production templates
		
		try {
			// Attempt to load the template
			const template = await loader.loadTemplate("COLLABORATIVE_PRINCIPLES")
			
			// Verify basic structure
			expect(template).toBeDefined()
			expect(template.metadata).toBeDefined()
			expect(template.metadata.name).toBe("COLLABORATIVE_PRINCIPLES")
			expect(template.add).toBeDefined()
			expect(template.add.sections).toBeDefined()
			expect(Array.isArray(template.add.sections)).toBe(true)
			
			// Verify sections have content (this was the original error)
			if (template.add.sections) {
				for (const section of template.add.sections) {
					expect(section.content).toBeDefined()
					expect(section.content.length).toBeGreaterThan(0)
					expect(section.id).toBeDefined()
				}
			}
			
			// Simplified validation - just check template loaded successfully
			expect(template.add.sections?.length ?? 0).toBeGreaterThan(0)
			
		} catch (error) {
			// If template loading fails, provide helpful error message
			console.error("Template loading failed:", error)
			throw new Error(`COLLABORATIVE_PRINCIPLES template should load without errors, but got: ${error}`)
		}
	})
	
	it("should convert COLLABORATIVE_PRINCIPLES legacy format correctly", async () => {
		const mockExtensionPath = path.resolve(__dirname, "../../")
		const loader = new JsonTemplateLoader(mockExtensionPath, false)
		
		try {
			const template = await loader.loadTemplate("COLLABORATIVE_PRINCIPLES")
			
			// Verify expected sections are created
			expect(template.add.sections).toBeDefined()
			if (template.add.sections) {
				const sectionIds = template.add.sections.map(s => s.id)
				
				// Should include the main principle sections
				expect(sectionIds).toContain("core_mindset")
				expect(sectionIds).toContain("analysis_approach")
				expect(sectionIds).toContain("efficiency_patterns")
				expect(sectionIds).toContain("developer_colleague")
				expect(sectionIds).toContain("continuous_improvement")
				
				// Each section should have meaningful content
				const coreMindsetSection = template.add.sections.find(s => s.id === "core_mindset")
				expect(coreMindsetSection).toBeDefined()
				expect(coreMindsetSection!.content).toContain("Quality-First Collaboration")
				expect(coreMindsetSection!.content).toContain("Behaviors:")
			}
			
		} catch (error) {
			console.error("Legacy format conversion failed:", error)
			throw new Error(`COLLABORATIVE_PRINCIPLES legacy format conversion should work, but got: ${error}`)
		}
	})
}) 