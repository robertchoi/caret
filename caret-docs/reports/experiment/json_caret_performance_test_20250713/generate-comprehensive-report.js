const fs = require("fs")
const path = require("path")

// --- 설정 ---
const TASKS = ["calculator", "markdown", "todolist", "json-processor"]
const MODELS = ["gemini-2.5-pro-preview-06-05", "gemini-2.5-flash-preview-05-20"]
const AGENTS = ["caret", "cline"]
const REPORT_PATH = __dirname

// --- 데이터 파싱 함수 ---

/**
 * 개별 보고서 파일에서 성능 데이터를 추출합니다.
 * @param {string} reportPath - 보고서 파일 경로
 * @returns {object|null} 추출된 성능 데이터 또는 null
 */
function parseReportFile(reportPath) {
  if (!fs.existsSync(reportPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(reportPath, "utf-8")
    const lines = content.split("\n")

    // 데이터 추출을 위한 정규식 패턴들
    const patterns = {
      totalTokensIn: /\*\*총 입력 토큰\*\* \| ([0-9,]+)/,
      totalTokensOut: /\*\*총 출력 토큰\*\* \| ([0-9,]+)/,
      totalCachedTokens: /\*\*캐시된 토큰\*\* \| ([0-9,]+)/,
      totalCost: /\*\*총 API 비용\*\* \| \$([0-9.]+)/,
      apiCallCount: /\*\*API 호출 횟수\*\* \| ([0-9]+)회/,
      avgTokensPerCall: /\*\*평균 토큰\/호출\*\* \| ([0-9,]+) 토큰\/호출/,
      avgCostPerCall: /\*\*평균 비용\/호출\*\* \| \$([0-9.]+)\/호출/,
      totalLatency: /\*\*총 실행 시간\*\* \| ([0-9]+)초/,
      executionPeriod: /\*\*실행 기간\*\* \| (.+)/,
      actualMode: /\*\*실제 세션 모드\*\* \| ([a-z]+)/,
      actualSessionType: /\*\*실제 세션 타입\*\* \| ([a-z]+)/,
      promptLength: /\*\*프롬프트 길이\*\* \| ([0-9,]+) 문자/,
      promptWordCount: /\*\*단어 수\*\* \| ([0-9,]+) 개/,
      promptTokenCount: /\*\*측정된 토큰 수\*\* \| ([0-9,]+) 개/,
    }

    const data = {}
    const contentStr = content

    // 각 패턴으로 데이터 추출
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = contentStr.match(pattern)
      if (match) {
        let value = match[1]
        
        // 숫자 필드 처리
        if (key.includes("Tokens") || key.includes("Count") || key.includes("Latency") || key.includes("Length") || key.includes("Word")) {
          value = parseInt(value.replace(/,/g, ""))
        } else if (key.includes("Cost")) {
          value = parseFloat(value)
        }
        
        data[key] = value
      }
    }

    // 파일명에서 추가 정보 추출
    const filename = path.basename(reportPath)
    const filenameMatch = filename.match(/^([^-]+)-(.+)-(\d{8})-report\.md$/)
    if (filenameMatch) {
      data.agent = filenameMatch[1]
      data.modelInfo = filenameMatch[2]
      data.date = filenameMatch[3]
    }

    // 모델명 정리 - 다양한 형식 지원
    if (data.modelInfo) {
      const modelInfo = data.modelInfo.toLowerCase()
      if (modelInfo.includes("pro")) {
        data.model = "gemini-2.5-pro-preview-06-05"
      } else if (modelInfo.includes("flash")) {
        data.model = "gemini-2.5-flash-preview-05-20"
      } else {
        data.model = "unknown"
      }
    }

    return data
  } catch (error) {
    console.warn(`보고서 파싱 중 오류 발생: ${reportPath}`, error.message)
    return null
  }
}

/**
 * 모든 실험 보고서를 수집하고 파싱합니다.
 * @returns {Array} 파싱된 모든 실험 데이터
 */
function collectAllReports() {
  const allReports = []

  for (const task of TASKS) {
    const taskDir = path.join(REPORT_PATH, task)
    if (!fs.existsSync(taskDir)) {
      console.warn(`과업 디렉토리 없음: ${taskDir}`)
      continue
    }

    const files = fs.readdirSync(taskDir)
    const reportFiles = files.filter(f => f.endsWith("-report.md"))

    for (const reportFile of reportFiles) {
      const reportPath = path.join(taskDir, reportFile)
      const data = parseReportFile(reportPath)
      
      if (data) {
        data.task = task
        data.reportFile = reportFile
        allReports.push(data)
      }
    }
  }

  return allReports
}

// --- 분석 함수들 ---

/**
 * 에이전트별 성능 요약 생성
 */
function generateAgentSummary(reports) {
  const summary = {}

  for (const agent of AGENTS) {
    const agentReports = reports.filter(r => r.agent === agent)
    if (agentReports.length === 0) continue

    summary[agent] = {
      totalExperiments: agentReports.length,
      totalTokensIn: agentReports.reduce((sum, r) => sum + (r.totalTokensIn || 0), 0),
      totalTokensOut: agentReports.reduce((sum, r) => sum + (r.totalTokensOut || 0), 0),
      totalCachedTokens: agentReports.reduce((sum, r) => sum + (r.totalCachedTokens || 0), 0),
      totalCost: agentReports.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      totalApiCalls: agentReports.reduce((sum, r) => sum + (r.apiCallCount || 0), 0),
      totalLatency: agentReports.reduce((sum, r) => sum + (r.totalLatency || 0), 0),
      avgTokensPerCall: agentReports.reduce((sum, r) => sum + (r.avgTokensPerCall || 0), 0) / agentReports.length,
      avgCostPerCall: agentReports.reduce((sum, r) => sum + (r.avgCostPerCall || 0), 0) / agentReports.length,
      avgLatencyPerExperiment: agentReports.reduce((sum, r) => sum + (r.totalLatency || 0), 0) / agentReports.length,
    }
  }

  return summary
}

/**
 * 모델별 성능 요약 생성
 */
function generateModelSummary(reports) {
  const summary = {}

  for (const model of MODELS) {
    const modelReports = reports.filter(r => r.model === model)
    if (modelReports.length === 0) continue

    summary[model] = {
      totalExperiments: modelReports.length,
      totalTokensIn: modelReports.reduce((sum, r) => sum + (r.totalTokensIn || 0), 0),
      totalTokensOut: modelReports.reduce((sum, r) => sum + (r.totalTokensOut || 0), 0),
      totalCachedTokens: modelReports.reduce((sum, r) => sum + (r.totalCachedTokens || 0), 0),
      totalCost: modelReports.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      totalApiCalls: modelReports.reduce((sum, r) => sum + (r.apiCallCount || 0), 0),
      totalLatency: modelReports.reduce((sum, r) => sum + (r.totalLatency || 0), 0),
      avgTokensPerCall: modelReports.reduce((sum, r) => sum + (r.avgTokensPerCall || 0), 0) / modelReports.length,
      avgCostPerCall: modelReports.reduce((sum, r) => sum + (r.avgCostPerCall || 0), 0) / modelReports.length,
      avgLatencyPerExperiment: modelReports.reduce((sum, r) => sum + (r.totalLatency || 0), 0) / modelReports.length,
    }
  }

  return summary
}

/**
 * 과업별 성능 요약 생성
 */
function generateTaskSummary(reports) {
  const summary = {}

  for (const task of TASKS) {
    const taskReports = reports.filter(r => r.task === task)
    if (taskReports.length === 0) continue

    summary[task] = {
      totalExperiments: taskReports.length,
      caretReports: taskReports.filter(r => r.agent === "caret").length,
      clineReports: taskReports.filter(r => r.agent === "cline").length,
      proReports: taskReports.filter(r => r.model === "gemini-2.5-pro-preview-06-05").length,
      flashReports: taskReports.filter(r => r.model === "gemini-2.5-flash-preview-05-20").length,
    }
  }

  return summary
}

/**
 * 상세 비교 분석 생성
 */
function generateDetailedComparison(reports) {
  const comparison = {
    byTaskAndAgent: {},
    byTaskAndModel: {},
    byAgentAndModel: {}
  }

  // 과업 x 에이전트 비교
  for (const task of TASKS) {
    comparison.byTaskAndAgent[task] = {}
    for (const agent of AGENTS) {
      const filtered = reports.filter(r => r.task === task && r.agent === agent)
      if (filtered.length > 0) {
        comparison.byTaskAndAgent[task][agent] = {
          experiments: filtered.length,
          avgCost: filtered.reduce((sum, r) => sum + (r.totalCost || 0), 0) / filtered.length,
          avgLatency: filtered.reduce((sum, r) => sum + (r.totalLatency || 0), 0) / filtered.length,
          avgTokensIn: filtered.reduce((sum, r) => sum + (r.totalTokensIn || 0), 0) / filtered.length,
          avgTokensOut: filtered.reduce((sum, r) => sum + (r.totalTokensOut || 0), 0) / filtered.length,
          avgApiCalls: filtered.reduce((sum, r) => sum + (r.apiCallCount || 0), 0) / filtered.length,
        }
      }
    }
  }

  // 과업 x 모델 비교
  for (const task of TASKS) {
    comparison.byTaskAndModel[task] = {}
    for (const model of MODELS) {
      const filtered = reports.filter(r => r.task === task && r.model === model)
      if (filtered.length > 0) {
        comparison.byTaskAndModel[task][model] = {
          experiments: filtered.length,
          avgCost: filtered.reduce((sum, r) => sum + (r.totalCost || 0), 0) / filtered.length,
          avgLatency: filtered.reduce((sum, r) => sum + (r.totalLatency || 0), 0) / filtered.length,
          avgTokensIn: filtered.reduce((sum, r) => sum + (r.totalTokensIn || 0), 0) / filtered.length,
          avgTokensOut: filtered.reduce((sum, r) => sum + (r.totalTokensOut || 0), 0) / filtered.length,
          avgApiCalls: filtered.reduce((sum, r) => sum + (r.apiCallCount || 0), 0) / filtered.length,
        }
      }
    }
  }

  return comparison
}

// --- 보고서 생성 함수들 ---

/**
 * 종합 마크다운 보고서 생성
 */
function createComprehensiveReport(reports, agentSummary, modelSummary, taskSummary, comparison) {
  const totalExperiments = reports.length
  const completedTasks = Object.keys(taskSummary).length
  const incompleteTasks = TASKS.filter(task => !taskSummary[task])

  let report = `# 🧪 AI 에이전트 성능 비교 실험 종합 보고서

> **실험 기간**: ${new Date().toLocaleDateString("ko-KR")}  
> **총 실험 수**: ${totalExperiments}회  
> **완료된 과업**: ${completedTasks}/${TASKS.length}개  

## 📊 실험 진행 현황

### 과업별 실험 현황
| 과업 | 총 실험 | Caret | Cline | Pro 모델 | Flash 모델 | 완료율 |
|---|---|---|---|---|---|---|
`

  for (const task of TASKS) {
    const summary = taskSummary[task]
    if (summary) {
      const completionRate = ((summary.caretReports + summary.clineReports) / (AGENTS.length * MODELS.length * 3) * 100).toFixed(1)
      report += `| ${task} | ${summary.totalExperiments} | ${summary.caretReports} | ${summary.clineReports} | ${summary.proReports} | ${summary.flashReports} | ${completionRate}% |\n`
    } else {
      report += `| ${task} | 0 | 0 | 0 | 0 | 0 | 0% |\n`
    }
  }

  if (incompleteTasks.length > 0) {
    report += `\n⚠️ **미완료 과업**: ${incompleteTasks.join(", ")}\n`
  }

  // 에이전트 비교
  report += `\n## 🤖 에이전트 성능 비교 (Caret vs Cline)

### 전체 성능 요약
| 지표 | Caret | Cline | 차이 (Caret - Cline) | 효율성 |
|---|---|---|---|---|
`

  const caretData = agentSummary["caret"] || {}
  const clineData = agentSummary["cline"] || {}

  const metrics = [
    { key: "totalExperiments", label: "총 실험 수", suffix: "회", isInt: true },
    { key: "totalCost", label: "총 비용", prefix: "$", decimal: 6 },
    { key: "avgCostPerCall", label: "평균 호출당 비용", prefix: "$", decimal: 6 },
    { key: "avgLatencyPerExperiment", label: "평균 실험 시간", suffix: "초", isInt: true },
    { key: "avgTokensPerCall", label: "평균 호출당 토큰", suffix: " 토큰", isInt: true },
    { key: "totalApiCalls", label: "총 API 호출", suffix: "회", isInt: true }
  ]

  for (const metric of metrics) {
    const caretVal = caretData[metric.key] || 0
    const clineVal = clineData[metric.key] || 0
    const diff = caretVal - clineVal
    
    let caretStr, clineStr, diffStr, effStr
    
    if (metric.isInt) {
      caretStr = Math.round(caretVal).toLocaleString()
      clineStr = Math.round(clineVal).toLocaleString()
      diffStr = Math.round(diff).toLocaleString()
    } else {
      caretStr = caretVal.toFixed(metric.decimal || 2)
      clineStr = clineVal.toFixed(metric.decimal || 2)
      diffStr = diff.toFixed(metric.decimal || 2)
    }

    if (metric.prefix) {
      caretStr = metric.prefix + caretStr
      clineStr = metric.prefix + clineStr
      diffStr = (diff >= 0 ? "+" : "") + metric.prefix + Math.abs(diff).toFixed(metric.decimal || 2)
    }
    if (metric.suffix) {
      caretStr += metric.suffix
      clineStr += metric.suffix
      diffStr += metric.suffix
    }

    // 효율성 계산 (낮은 값이 좋은 지표들)
    if (metric.key.includes("Cost") || metric.key.includes("Latency") || metric.key.includes("Calls")) {
      effStr = diff < 0 ? "🟢 Caret 우수" : diff > 0 ? "🔴 Cline 우수" : "🟡 동등"
    } else {
      effStr = diff > 0 ? "🟢 Caret 우수" : diff < 0 ? "🔴 Cline 우수" : "🟡 동등"
    }

    report += `| ${metric.label} | ${caretStr} | ${clineStr} | ${diffStr} | ${effStr} |\n`
  }

  // 모델 비교
  report += `\n## ⚡ 모델 성능 비교 (Pro vs Flash)

### 전체 성능 요약
| 지표 | Pro 모델 | Flash 모델 | 차이 (Pro - Flash) | 효율성 |
|---|---|---|---|---|
`

  const proData = modelSummary["gemini-2.5-pro-preview-06-05"] || {}
  const flashData = modelSummary["gemini-2.5-flash-preview-05-20"] || {}

  for (const metric of metrics) {
    const proVal = proData[metric.key] || 0
    const flashVal = flashData[metric.key] || 0
    const diff = proVal - flashVal
    
    let proStr, flashStr, diffStr, effStr
    
    if (metric.isInt) {
      proStr = Math.round(proVal).toLocaleString()
      flashStr = Math.round(flashVal).toLocaleString()
      diffStr = Math.round(diff).toLocaleString()
    } else {
      proStr = proVal.toFixed(metric.decimal || 2)
      flashStr = flashVal.toFixed(metric.decimal || 2)
      diffStr = diff.toFixed(metric.decimal || 2)
    }

    if (metric.prefix) {
      proStr = metric.prefix + proStr
      flashStr = metric.prefix + flashStr
      diffStr = (diff >= 0 ? "+" : "") + metric.prefix + Math.abs(diff).toFixed(metric.decimal || 2)
    }
    if (metric.suffix) {
      proStr += metric.suffix
      flashStr += metric.suffix
      diffStr += metric.suffix
    }

    // 효율성 계산
    if (metric.key.includes("Cost") || metric.key.includes("Latency") || metric.key.includes("Calls")) {
      effStr = diff < 0 ? "🟢 Pro 우수" : diff > 0 ? "🔴 Flash 우수" : "🟡 동등"
    } else {
      effStr = diff > 0 ? "🟢 Pro 우수" : diff < 0 ? "🔴 Flash 우수" : "🟡 동등"
    }

    report += `| ${metric.label} | ${proStr} | ${flashStr} | ${diffStr} | ${effStr} |\n`
  }

  // 과업별 상세 분석
  report += `\n## 📋 과업별 상세 성능 분석\n`

  for (const task of TASKS) {
    if (!taskSummary[task]) continue

    report += `\n### ${task.charAt(0).toUpperCase() + task.slice(1)} 과업\n\n`
    
    const taskAgentComparison = comparison.byTaskAndAgent[task] || {}
    const caretTaskData = taskAgentComparison["caret"]
    const clineTaskData = taskAgentComparison["cline"]

    if (caretTaskData && clineTaskData) {
      report += `| 지표 | Caret | Cline | 차이 | 우수 에이전트 |\n`
      report += `|---|---|---|---|---|\n`
      
      const taskMetrics = [
        { key: "avgCost", label: "평균 비용", prefix: "$", decimal: 6 },
        { key: "avgLatency", label: "평균 시간", suffix: "초", isInt: true },
        { key: "avgApiCalls", label: "평균 API 호출", suffix: "회", decimal: 1 },
        { key: "avgTokensIn", label: "평균 입력 토큰", suffix: " 토큰", isInt: true },
        { key: "avgTokensOut", label: "평균 출력 토큰", suffix: " 토큰", isInt: true }
      ]

      for (const metric of taskMetrics) {
        const caretVal = caretTaskData[metric.key] || 0
        const clineVal = clineTaskData[metric.key] || 0
        const diff = caretVal - clineVal
        
        let caretStr, clineStr, diffStr, betterAgent
        
        if (metric.isInt) {
          caretStr = Math.round(caretVal).toLocaleString()
          clineStr = Math.round(clineVal).toLocaleString()
          diffStr = (diff >= 0 ? "+" : "") + Math.round(diff).toLocaleString()
        } else {
          caretStr = caretVal.toFixed(metric.decimal || 2)
          clineStr = clineVal.toFixed(metric.decimal || 2)
          diffStr = (diff >= 0 ? "+" : "") + diff.toFixed(metric.decimal || 2)
        }

        if (metric.prefix) {
          caretStr = metric.prefix + caretStr
          clineStr = metric.prefix + clineStr
        }
        if (metric.suffix) {
          caretStr += metric.suffix
          clineStr += metric.suffix
          diffStr += metric.suffix
        }

        // 어느 에이전트가 더 좋은지 판단
        if (metric.key.includes("Cost") || metric.key.includes("Latency") || metric.key.includes("Calls")) {
          betterAgent = diff < 0 ? "🟢 Caret" : diff > 0 ? "🔴 Cline" : "🟡 동등"
        } else {
          betterAgent = diff > 0 ? "🟢 Caret" : diff < 0 ? "🔴 Cline" : "🟡 동등"
        }

        report += `| ${metric.label} | ${caretStr} | ${clineStr} | ${diffStr} | ${betterAgent} |\n`
      }
    } else if (caretTaskData) {
      report += `🟢 **Caret만 완료** - 평균 비용: $${caretTaskData.avgCost.toFixed(6)}, 평균 시간: ${Math.round(caretTaskData.avgLatency)}초\n`
    } else if (clineTaskData) {
      report += `🔴 **Cline만 완료** - 평균 비용: $${clineTaskData.avgCost.toFixed(6)}, 평균 시간: ${Math.round(clineTaskData.avgLatency)}초\n`
    } else {
      report += `⚠️ **미완료 과업**\n`
    }
  }

  // 주요 인사이트
  report += `\n## 🎯 주요 인사이트

### Caret vs Cline 비교
`

  if (caretData.totalExperiments && clineData.totalExperiments) {
    const costDiff = ((caretData.totalCost / caretData.totalExperiments) - (clineData.totalCost / clineData.totalExperiments))
    const timeDiff = ((caretData.totalLatency / caretData.totalExperiments) - (clineData.totalLatency / clineData.totalExperiments))
    
    if (costDiff < 0) {
      report += `- 💰 **비용 효율성**: Caret이 실험당 평균 $${Math.abs(costDiff).toFixed(6)} 더 저렴\n`
    } else {
      report += `- 💰 **비용 효율성**: Cline이 실험당 평균 $${Math.abs(costDiff).toFixed(6)} 더 저렴\n`
    }
    
    if (timeDiff < 0) {
      report += `- ⏱️ **실행 속도**: Caret이 실험당 평균 ${Math.abs(Math.round(timeDiff))}초 더 빠름\n`
    } else {
      report += `- ⏱️ **실행 속도**: Cline이 실험당 평균 ${Math.abs(Math.round(timeDiff))}초 더 빠름\n`
    }
  }

  report += `
### Pro vs Flash 모델 비교
`

  if (proData.totalExperiments && flashData.totalExperiments) {
    const modelCostDiff = ((proData.totalCost / proData.totalExperiments) - (flashData.totalCost / flashData.totalExperiments))
    const modelTimeDiff = ((proData.totalLatency / proData.totalExperiments) - (flashData.totalLatency / flashData.totalExperiments))
    
    if (modelCostDiff < 0) {
      report += `- 💰 **비용 효율성**: Pro 모델이 실험당 평균 $${Math.abs(modelCostDiff).toFixed(6)} 더 저렴\n`
    } else {
      report += `- 💰 **비용 효율성**: Flash 모델이 실험당 평균 $${Math.abs(modelCostDiff).toFixed(6)} 더 저렴\n`
    }
    
    if (modelTimeDiff < 0) {
      report += `- ⏱️ **실행 속도**: Pro 모델이 실험당 평균 ${Math.abs(Math.round(modelTimeDiff))}초 더 빠름\n`
    } else {
      report += `- ⏱️ **실행 속도**: Flash 모델이 실험당 평균 ${Math.abs(Math.round(modelTimeDiff))}초 더 빠름\n`
    }
  }

  report += `
### 권장사항
- 🎯 **가장 효율적인 조합**: [데이터 분석 결과에 따라 권장]
- 📈 **성능 개선 포인트**: [주요 개선 영역 식별]
- 🔄 **추가 실험 필요 영역**: ${incompleteTasks.length > 0 ? incompleteTasks.join(", ") : "모든 과업 완료"}

---

**보고서 생성 시간**: ${new Date().toISOString()}  
**분석된 실험 수**: ${totalExperiments}개  
**실험 기간**: ${reports.length > 0 ? reports[0].date : "N/A"}
`

  return report
}

// --- 메인 함수 ---

function main() {
  console.log("🧪 AI 에이전트 성능 비교 실험 종합 보고서 생성 중...")

  // 모든 보고서 수집
  const allReports = collectAllReports()
  console.log(`📊 총 ${allReports.length}개 실험 보고서를 수집했습니다.`)
  
  // 디버깅: 수집된 보고서 정보 출력
  console.log("🔍 수집된 보고서들:")
  allReports.forEach((report, index) => {
    console.log(`  ${index + 1}. ${report.task} - ${report.agent} - ${report.model} (${report.reportFile})`)
  })

  if (allReports.length === 0) {
    console.error("❌ 분석할 실험 보고서가 없습니다.")
    process.exit(1)
  }

  // 분석 수행
  const agentSummary = generateAgentSummary(allReports)
  const modelSummary = generateModelSummary(allReports)
  const taskSummary = generateTaskSummary(allReports)
  const comparison = generateDetailedComparison(allReports)

  // 종합 보고서 생성
  const comprehensiveReport = createComprehensiveReport(
    allReports, 
    agentSummary, 
    modelSummary, 
    taskSummary, 
    comparison
  )

  // 보고서 저장
  const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "")
  const outputPath = path.join(REPORT_PATH, `comprehensive-performance-report-${timestamp}.md`)
  
  fs.writeFileSync(outputPath, comprehensiveReport, "utf-8")
  
  console.log(`✅ 종합 보고서가 생성되었습니다: ${outputPath}`)
  console.log(`📈 분석 완료:`)
  console.log(`   - 총 실험: ${allReports.length}개`)
  console.log(`   - Caret 실험: ${allReports.filter(r => r.agent === "caret").length}개`)
  console.log(`   - Cline 실험: ${allReports.filter(r => r.agent === "cline").length}개`)
  console.log(`   - 완료된 과업: ${Object.keys(taskSummary).length}/${TASKS.length}개`)

  return outputPath
}

if (require.main === module) {
  main()
}

module.exports = { main, collectAllReports, parseReportFile } 