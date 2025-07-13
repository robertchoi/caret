const fs = require("fs")
const path = require("path")

/**
 * 시스템 프롬프트 토큰 측정 스크립트
 * 기존 generate-report.js의 시스템 프롬프트 분석 로직을 활용
 */

// 토큰 추정 함수 (기존 스크립트와 동일)
function estimateTokens(text) {
    const wordCount = text.split(/\s+/).length
    const charCount = text.length
    
    // 다양한 토큰 추정 방법
    const estimates = {
        conservative: Math.ceil(wordCount * 0.75),  // 보수적 추정
        standard: Math.ceil(wordCount * 1.0),       // 표준 추정
        aggressive: Math.ceil(wordCount * 1.33),    // 적극적 추정
        charBased: Math.ceil(charCount / 4),        // 글자 기반 추정
    }
    
    return {
        wordCount,
        charCount,
        ...estimates,
        average: Math.ceil((estimates.conservative + estimates.standard + estimates.aggressive + estimates.charBased) / 4)
    }
}

// 시스템 프롬프트 분석 함수 (기존 스크립트 로직 활용)
function analyzeSystemPrompt(content) {
    return {
        isCaretJson: content.includes('BASE_PROMPT_INTRO') || content.includes('COLLABORATIVE_PRINCIPLES'),
        isTrueCline: content.includes('# Cline') && content.includes('a highly skilled software engineer'),
        hasYouAreClice: content.includes('You are Cline'),
        hasCaretModification: content.includes('CARET MODIFICATION'),
        toolCount: (content.match(/^##\s+\w+/gm) || []).length,
        preview: content.substring(0, 300) + '...'
    }
}

// 시스템 프롬프트 생성 및 측정
async function measureSystemPrompts() {
    console.log('🔍 시스템 프롬프트 토큰 측정 시작...\n')
    
    const extensionPath = __dirname
    const mockParams = {
        cwd: process.cwd(),
        supportsBrowserUse: false,
        mcpHub: { getServers: () => [] },
        browserSettings: {},
        isClaude4ModelFamily: false
    }
    
    const results = []
    
    try {
        // 1. Cline 모드 (TRUE_CLINE_SYSTEM_PROMPT)
        console.log('📄 Cline 모드 (TRUE_CLINE_SYSTEM_PROMPT) 측정 중...')
        const { TRUE_CLINE_SYSTEM_PROMPT } = require('./src/core/prompts/true-cline-system')
        const clinePrompt = await TRUE_CLINE_SYSTEM_PROMPT(
            mockParams.cwd,
            mockParams.supportsBrowserUse,
            mockParams.mcpHub,
            mockParams.browserSettings,
            mockParams.isClaude4ModelFamily,
            "act"
        )
        
        const clineAnalysis = analyzeSystemPrompt(clinePrompt)
        const clineTokens = estimateTokens(clinePrompt)
        
        results.push({
            name: 'Cline (TRUE_CLINE_SYSTEM_PROMPT)',
            mode: 'cline',
            prompt: clinePrompt,
            analysis: clineAnalysis,
            tokens: clineTokens
        })
        
        // 2. Caret Agent 모드 (JSON 시스템)
        console.log('📄 Caret Agent 모드 (JSON 시스템) 측정 중...')
        const { SYSTEM_PROMPT } = require('./caret-src/core/prompts/system')
        const caretAgentPrompt = await SYSTEM_PROMPT(
            mockParams.cwd,
            mockParams.supportsBrowserUse,
            mockParams.mcpHub,
            mockParams.browserSettings,
            mockParams.isClaude4ModelFamily,
            extensionPath,
            "agent"
        )
        
        const caretAgentAnalysis = analyzeSystemPrompt(caretAgentPrompt)
        const caretAgentTokens = estimateTokens(caretAgentPrompt)
        
        results.push({
            name: 'Caret Agent (JSON)',
            mode: 'agent',
            prompt: caretAgentPrompt,
            analysis: caretAgentAnalysis,
            tokens: caretAgentTokens
        })
        
        // 3. Caret Chatbot 모드 (JSON 시스템)
        console.log('📄 Caret Chatbot 모드 (JSON 시스템) 측정 중...')
        const caretChatbotPrompt = await SYSTEM_PROMPT(
            mockParams.cwd,
            mockParams.supportsBrowserUse,
            mockParams.mcpHub,
            mockParams.browserSettings,
            mockParams.isClaude4ModelFamily,
            extensionPath,
            "chatbot"
        )
        
        const caretChatbotAnalysis = analyzeSystemPrompt(caretChatbotPrompt)
        const caretChatbotTokens = estimateTokens(caretChatbotPrompt)
        
        results.push({
            name: 'Caret Chatbot (JSON)',
            mode: 'chatbot',
            prompt: caretChatbotPrompt,
            analysis: caretChatbotAnalysis,
            tokens: caretChatbotTokens
        })
        
        // 4. 결과 출력
        console.log('\n📊 시스템 프롬프트 토큰 측정 결과:')
        console.log('=' .repeat(80))
        
        results.forEach((result, index) => {
            console.log(`\n🔹 ${result.name}:`)
            console.log(`   글자 수: ${result.tokens.charCount.toLocaleString()}`)
            console.log(`   단어 수: ${result.tokens.wordCount.toLocaleString()}`)
            console.log(`   도구 수: ${result.analysis.toolCount}개`)
            console.log(`   토큰 추정:`)
            console.log(`     - 보수적: ${result.tokens.conservative.toLocaleString()}`)
            console.log(`     - 표준: ${result.tokens.standard.toLocaleString()}`)
            console.log(`     - 적극적: ${result.tokens.aggressive.toLocaleString()}`)
            console.log(`     - 글자기반: ${result.tokens.charBased.toLocaleString()}`)
            console.log(`     - 평균: ${result.tokens.average.toLocaleString()}`)
            console.log(`   분석:`)
            console.log(`     - Caret JSON: ${result.analysis.isCaretJson ? '✅' : '❌'}`)
            console.log(`     - True Cline: ${result.analysis.isTrueCline ? '✅' : '❌'}`)
            console.log(`     - "You are Cline": ${result.analysis.hasYouAreClice ? '✅' : '❌'}`)
        })
        
        // 5. 절약 효과 계산
        const clineResult = results[0]
        const agentResult = results[1]
        const chatbotResult = results[2]
        
        const agentSavings = ((clineResult.tokens.average - agentResult.tokens.average) / clineResult.tokens.average * 100).toFixed(1)
        const chatbotSavings = ((clineResult.tokens.average - chatbotResult.tokens.average) / clineResult.tokens.average * 100).toFixed(1)
        
        console.log(`\n💰 토큰 절약 효과:`)
        console.log(`   - Caret Agent vs Cline: ${agentSavings}% 절약 (${(clineResult.tokens.average - agentResult.tokens.average).toLocaleString()} 토큰)`)
        console.log(`   - Caret Chatbot vs Cline: ${chatbotSavings}% 절약 (${(clineResult.tokens.average - chatbotResult.tokens.average).toLocaleString()} 토큰)`)
        
        // 6. 프롬프트 파일 저장
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
        results.forEach(result => {
            const filename = `system-prompt-${result.mode}-${timestamp}.txt`
            fs.writeFileSync(filename, result.prompt)
            console.log(`📁 저장: ${filename}`)
        })
        
        // 7. 측정 결과 JSON 저장
        const reportData = {
            timestamp: new Date().toISOString(),
            environment: {
                extensionPath,
                cwd: mockParams.cwd,
                supportsBrowserUse: mockParams.supportsBrowserUse,
                mcpServerCount: mockParams.mcpHub.getServers().length,
            },
            results: results.map(r => ({
                name: r.name,
                mode: r.mode,
                analysis: r.analysis,
                tokens: r.tokens,
                savings: r.mode === 'cline' ? '0%' : 
                         r.mode === 'agent' ? `${agentSavings}%` : 
                         `${chatbotSavings}%`
            }))
        }
        
        const reportFilename = `system-prompt-measurement-${timestamp}.json`
        fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2))
        console.log(`📄 측정 보고서 저장: ${reportFilename}`)
        
    } catch (error) {
        console.error('❌ 측정 중 오류 발생:', error)
    }
}

// 실행
measureSystemPrompts() 