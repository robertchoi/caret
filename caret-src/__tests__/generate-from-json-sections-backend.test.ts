import { describe, it, expect, beforeEach } from 'vitest'
import path from 'path'

// Mock VSCode API for backend testing
const mockVSCode = {
  window: {
    createOutputChannel: () => ({
      appendLine: () => {},
      show: () => {},
      dispose: () => {},
    }),
  }
}

// Set up VSCode mock globally
global.vscode = mockVSCode

// Now import CaretSystemPrompt after mock is set up
import { CaretSystemPrompt } from '../core/prompts/CaretSystemPrompt'

type McpHub = {
  getServers: () => any[]
  isConnecting: boolean
}

type BrowserSettings = {
  viewport: { width: number; height: number }
}

describe('CaretSystemPrompt - generateFromJsonSections (Backend Implementation)', () => {
  let caretSystemPrompt: CaretSystemPrompt
  let mockMcpHub: McpHub
  let mockBrowserSettings: BrowserSettings
  
  beforeEach(() => {
    // Use actual extension path for testing
    const mockExtensionPath = path.resolve(__dirname, '../../')
    caretSystemPrompt = new CaretSystemPrompt(mockExtensionPath)
    
    // Create mock MCP Hub
    mockMcpHub = {
      getServers: () => [],
      isConnecting: false
    }
    
    // Create mock Browser Settings
    mockBrowserSettings = {
      viewport: { width: 1024, height: 768 }
    }
  })
  
  describe('generateFromJsonSections method - Backend Implementation', () => {
    it('should exist as a method on CaretSystemPrompt class', () => {
      expect(typeof caretSystemPrompt.generateFromJsonSections).toBe('function')
    })
    
    it('should return a string prompt when called with basic parameters', async () => {
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/test/cwd',
        false, // supportsBrowserUse
        mockMcpHub,
        mockBrowserSettings,
        false // isClaude4ModelFamily
      )
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(50) // Should have substantial content
    })
    
    it('should include working directory in system information', async () => {
      const testCwd = '/specific/test/directory'
      const result = await caretSystemPrompt.generateFromJsonSections(
        testCwd,
        false,
        mockMcpHub,
        mockBrowserSettings,
        false
      )
      
      expect(result).toContain(testCwd)
    })
    
    it('should handle empty MCP hub gracefully', async () => {
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/test/cwd',
        false,
        mockMcpHub, // Empty servers
        mockBrowserSettings,
        false
      )
      
      // Should not throw and should return valid prompt
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(50)
    })
    
    it('should include MCP servers when available', async () => {
      const mockMcpHubWithServers = {
        getServers: () => [
          {
            name: 'test-mcp-server',
            status: 'connected',
            tools: [{ name: 'test_tool', description: 'Test tool description' }],
            resources: [{ uri: 'test://resource', description: 'Test resource' }]
          }
        ]
      }
      
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/test/cwd',
        false,
        mockMcpHubWithServers,
        mockBrowserSettings,
        false
      )
      
      expect(result).toContain('test-mcp-server')
      expect(result).toContain('Connected MCP Servers')
    })
    
    it('should include browser section when browser support is enabled', async () => {
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/test/cwd',
        true, // supportsBrowserUse = true
        mockMcpHub,
        mockBrowserSettings,
        false
      )
      
      expect(result).toContain('BROWSER SUPPORT')
      expect(result).toContain('Puppeteer')
      expect(result).toContain('1024x768') // viewport size
    })
    
    it('should include Claude4 section when Claude4 model family is enabled', async () => {
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/test/cwd',
        false,
        mockMcpHub,
        mockBrowserSettings,
        true // isClaude4ModelFamily = true
      )
      
      expect(result).toContain('CLAUDE 4 FEATURES')
    })
    
    it('should handle all features enabled simultaneously', async () => {
      const fullMcpHub = {
        getServers: () => [
          {
            name: 'full-test-server',
            status: 'connected',
            tools: [{ name: 'multi_tool' }],
            resources: [{ uri: 'multi://resource' }]
          }
        ]
      }
      
      const result = await caretSystemPrompt.generateFromJsonSections(
        '/full/test/directory',
        true, // Browser support
        fullMcpHub, // MCP servers
        mockBrowserSettings,
        true // Claude4 features
      )
      
      // Should include all sections
      expect(result).toContain('/full/test/directory') // Working directory
      expect(result).toContain('full-test-server') // MCP server
      expect(result).toContain('BROWSER SUPPORT') // Browser section
      expect(result).toContain('CLAUDE 4 FEATURES') // Claude4 section
      
      // Should be a substantial prompt
      expect(result.length).toBeGreaterThan(200)
    })
  })
}) 