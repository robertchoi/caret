import { describe, it, expect } from 'vitest'
import { chatbotModeRespondToolName, chatbotModeRespondToolDefinition } from '../../src/core/tools/chatbotModeRespondTool'

describe('ChatbotModeRespond Tool', () => {
	describe('Tool Definition', () => {
		it('should have correct tool name', () => {
			expect(chatbotModeRespondToolName).toBe('ChatbotModeRespond')
		})

		it('should have proper tool definition structure', () => {
			expect(chatbotModeRespondToolDefinition).toBeDefined()
			expect(chatbotModeRespondToolDefinition.name).toBe(chatbotModeRespondToolName)
			expect(chatbotModeRespondToolDefinition.descriptionForAgent).toContain('CHATBOT MODE')
			expect(chatbotModeRespondToolDefinition.inputSchema).toBeDefined()
		})

		it('should have required response parameter', () => {
			expect(chatbotModeRespondToolDefinition.inputSchema.properties).toBeDefined()
			expect(chatbotModeRespondToolDefinition.inputSchema.properties.response).toBeDefined()
			expect(chatbotModeRespondToolDefinition.inputSchema.properties.response.type).toBe('string')
			expect(chatbotModeRespondToolDefinition.inputSchema.required).toContain('response')
		})

		it('should mention chatbot mode in description', () => {
			expect(chatbotModeRespondToolDefinition.descriptionForAgent).toContain('CHATBOT MODE')
			expect(chatbotModeRespondToolDefinition.descriptionForAgent).toContain('expert consultation')
		})

		it('should clarify no codebase changes', () => {
			expect(chatbotModeRespondToolDefinition.descriptionForAgent).toContain('without making changes')
		})
	})

	describe('Tool Name Export', () => {
		it('should export chatbotModeRespondToolName as string', () => {
			expect(typeof chatbotModeRespondToolName).toBe('string')
			expect(chatbotModeRespondToolName.length).toBeGreaterThan(0)
		})
	})

	describe('Tool Schema Validation', () => {
		it('should have object type input schema', () => {
			expect(chatbotModeRespondToolDefinition.inputSchema.type).toBe('object')
		})

		it('should have response parameter with proper description', () => {
			const responseParam = chatbotModeRespondToolDefinition.inputSchema.properties.response
			expect(responseParam.description).toContain('consultation response')
			expect(responseParam.description).toContain('expert analysis')
		})
	})
}) 