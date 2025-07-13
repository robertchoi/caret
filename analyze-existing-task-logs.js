const fs = require("fs")
const path = require("path")

/**
 * 기존 Task 로그 분석 스크립트
 * VSCode 글로벌 스토리지의 task 로그를 역추적해서 시스템 프롬프트 토큰 측정
 */

const TASK_LOG_PATH = path.join(process.env.APPDATA, "Code", "User", "globalStorage", "caretive.caret", "tasks")

// 토큰 추정 함수
function estimateTokens(text) {
    const wordCount = text.split(/\s+/).length
    const charCount = text.length
    
    return {
        wordCount,
        charCount,
        conservative: Math.ceil(wordCount * 0.75),
        standard: Math.ceil(wordCount * 1.0),
        aggressive: Math.ceil(wordCount * 1.33),
        charBased: Math.ceil(charCount / 4),
        average: Math.ceil(wordCount * 1.0) // 표준 추정 사용
    }
}

// 시스템 프롬프트 분석 함수
function analyzeSystemPrompt(content) {
    return {
        isCaretJson: content.includes('BASE_PROMPT_INTRO') || content.includes('COLLABORATIVE_PRINCIPLES'),
        isTrueCline: content.includes('# Cline') && content.includes('a highly skilled software engineer'),
        hasYouAreClice: content.includes('You are Cline'),
        hasCaretModification: content.includes('CARET MODIFICATION'),
        toolCount: (content.match(/^##\s+\w+/gm) || []).length,
        modeInfo: content.includes('[MODE-CHECK-') ? 'Mode check detected' : 'No mode check',
        preview: content.substring(0, 300) + '...'
    }
}

// Task 로그 분석 함수
function analyzeTaskLog(taskDir) {
    const taskPath = path.join(TASK_LOG_PATH, taskDir)
    
    // 파일 존재 확인
    const apiHistoryPath = path.join(taskPath, "api_conversation_history.json")
    const metadataPath = path.join(taskPath, "task_metadata.json")
    
    if (!fs.existsSync(apiHistoryPath)) {
        return { error: "api_conversation_history.json not found" }
    }
    
    try {
        const apiHistory = JSON.parse(fs.readFileSync(apiHistoryPath, "utf-8"))
        const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, "utf-8")) : {}
        
        // API 호출 기록에서 시스템 프롬프트 추출
        let systemPromptData = []
        let totalTokensIn = 0
        let totalTokensOut = 0
        let apiCallCount = 0
        
        // API 히스토리 구조 분석
        if (Array.isArray(apiHistory)) {
            apiHistory.forEach((entry, index) => {
                if (entry.request && entry.request.messages) {
                    const systemMessage = entry.request.messages.find(m => m.role === 'system')
                    if (systemMessage && systemMessage.content) {
                        const content = systemMessage.content
                        const analysis = analyzeSystemPrompt(content)
                        const tokens = estimateTokens(content)
                        
                        systemPromptData.push({
                            callIndex: index,
                            timestamp: entry.timestamp || 'unknown',
                            analysis,
                            tokens,
                            inputTokens: entry.tokensIn || 0,
                            outputTokens: entry.tokensOut || 0,
                            cost: entry.cost || 0
                        })
                        
                        totalTokensIn += entry.tokensIn || 0
                        totalTokensOut += entry.tokensOut || 0
                        apiCallCount++
                    }
                }
            })
        }
        
        return {
            taskDir,
            metadata,
            systemPromptData,
            totalTokensIn,
            totalTokensOut,
            apiCallCount,
            taskStart: metadata.task_start_time || 'unknown',
            taskEnd: metadata.task_end_time || 'unknown'
        }
        
    } catch (error) {
        return { error: `Failed to parse task log: ${error.message}` }
    }
}

// 최근 task 로그들 분석
function analyzeRecentTasks(limit = 5) {
    console.log('🔍 최근 Task 로그 분석 시작...\n')
    
    if (!fs.existsSync(TASK_LOG_PATH)) {
        console.error(`❌ Task 로그 경로를 찾을 수 없습니다: ${TASK_LOG_PATH}`)
        return
    }
    
    // 최근 task 디렉토리들 가져오기
    const taskDirs = fs.readdirSync(TASK_LOG_PATH)
        .filter(dir => fs.statSync(path.join(TASK_LOG_PATH, dir)).isDirectory())
        .sort((a, b) => parseInt(b) - parseInt(a)) // 최신순 정렬
        .slice(0, limit)
    
    console.log(`📁 분석 대상 Task 로그 (최근 ${limit}개):`)
    taskDirs.forEach(dir => {
        const timestamp = new Date(parseInt(dir)).toLocaleString()
        console.log(`   - ${dir} (${timestamp})`)
    })
    console.log()
    
    const results = []
    
    // 각 task 로그 분석
    taskDirs.forEach(taskDir => {
        console.log(`📊 분석 중: ${taskDir}`)
        const result = analyzeTaskLog(taskDir)
        
        if (result.error) {
            console.log(`   ❌ 오류: ${result.error}`)
        } else {
            console.log(`   ✅ API 호출: ${result.apiCallCount}회`)
            console.log(`   📈 총 입력 토큰: ${result.totalTokensIn.toLocaleString()}`)
            console.log(`   📉 총 출력 토큰: ${result.totalTokensOut.toLocaleString()}`)
            console.log(`   🔧 시스템 프롬프트: ${result.systemPromptData.length}개`)
            
            // 첫 번째 시스템 프롬프트 분석
            if (result.systemPromptData.length > 0) {
                const firstPrompt = result.systemPromptData[0]
                console.log(`   📋 첫 번째 시스템 프롬프트:`)
                console.log(`      - 타입: ${firstPrompt.analysis.isCaretJson ? 'Caret JSON' : firstPrompt.analysis.isTrueCline ? 'True Cline' : 'Unknown'}`)
                console.log(`      - 토큰 추정: ${firstPrompt.tokens.average.toLocaleString()}`)
                console.log(`      - 도구 수: ${firstPrompt.analysis.toolCount}개`)
                console.log(`      - "You are Cline": ${firstPrompt.analysis.hasYouAreClice ? '✅' : '❌'}`)
            }
        }
        
        results.push(result)
        console.log()
    })
    
    // 종합 분석
    const validResults = results.filter(r => !r.error)
    if (validResults.length > 0) {
        console.log('📊 종합 분석 결과:')
        console.log('=' .repeat(60))
        
        // 시스템 프롬프트 타입별 분류
        const caretJsonCount = validResults.filter(r => 
            r.systemPromptData.length > 0 && r.systemPromptData[0].analysis.isCaretJson
        ).length
        
        const trueClineCount = validResults.filter(r => 
            r.systemPromptData.length > 0 && r.systemPromptData[0].analysis.isTrueCline
        ).length
        
        console.log(`🔹 Caret JSON 시스템: ${caretJsonCount}개 task`)
        console.log(`🔹 True Cline 시스템: ${trueClineCount}개 task`)
        console.log(`🔹 기타/불명: ${validResults.length - caretJsonCount - trueClineCount}개 task`)
        
        // 평균 토큰 계산
        const systemPrompts = validResults.flatMap(r => r.systemPromptData)
        if (systemPrompts.length > 0) {
            const avgTokens = systemPrompts.reduce((sum, p) => sum + p.tokens.average, 0) / systemPrompts.length
            console.log(`📈 평균 시스템 프롬프트 토큰: ${avgTokens.toFixed(0)}`)
        }
        
        // 결과 JSON 저장
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
        const reportFilename = `task-log-analysis-${timestamp}.json`
        fs.writeFileSync(reportFilename, JSON.stringify({
            timestamp: new Date().toISOString(),
            analyzedTasks: validResults.length,
            caretJsonCount,
            trueClineCount,
            results: validResults
        }, null, 2))
        
        console.log(`📄 분석 결과 저장: ${reportFilename}`)
    }
}

// 실행
analyzeRecentTasks(10) 