const fs = require("fs")
const path = require("path")

// --- 설정 ---
// 로그 파일이 저장된 기본 경로
const LOG_BASE_PATH = path.join(process.env.APPDATA, "Code", "User", "globalStorage", "caretive.caret", "tasks")
// 보고서를 저장할 현재 경로
const REPORT_PATH = __dirname

// --- 함수 ---

/**
 * 지정된 디렉토리에서 가장 최근의 태스크 폴더를 찾습니다.
 * 실험은 일반적으로 하나의 태스크 폴더에서 수행되므로, 가장 최근 것을 사용합니다.
 * @param {string} experimentPath - 실험 관련 파일이 있는 경로 (스크립트 실행 위치 기준)
 * @returns {string | null} 가장 최근 태스크 폴더의 전체 경로 또는 null
 */
function getLatestTaskDir(experimentPath) {
	if (!fs.existsSync(LOG_BASE_PATH)) {
		console.error(`로그 디렉토리를 찾을 수 없습니다: ${LOG_BASE_PATH}`)
		return null
	}
	const allTaskDirs = fs
		.readdirSync(LOG_BASE_PATH, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name)
		.sort((a, b) => b.localeCompare(a)) // 최신순으로 정렬

	if (allTaskDirs.length === 0) {
		console.error("처리할 태스크 로그 폴더가 없습니다.")
		return null
	}
	// 가장 최근 태스크 폴더를 반환
	return path.join(LOG_BASE_PATH, allTaskDirs[0])
}

/**
 * 태스크 로그 파일을 읽고 성능 데이터를 추출합니다.
 * @param {string} taskDir - 분석할 태스크 폴더의 전체 경로
 * @returns {object | null} 추출된 성능 데이터 또는 null
 */
function parseLogFiles(taskDir) {
	const uiMessagesPath = path.join(taskDir, "ui_messages.json")
	const metadataPath = path.join(taskDir, "task_metadata.json")

	if (!fs.existsSync(uiMessagesPath) || !fs.existsSync(metadataPath)) {
		console.error(`필요한 로그 파일이 없습니다: ${taskDir}`)
		return null
	}

	try {
		const uiMessages = JSON.parse(fs.readFileSync(uiMessagesPath, "utf-8"))
		const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"))

		let totalTokensIn = 0
		let totalTokensOut = 0
		let totalCost = 0
		let apiCallCount = 0

		uiMessages.forEach((msg) => {
			if (msg.type === "say" && msg.say === "api_req_started") {
				try {
					const apiData = JSON.parse(msg.text)
					totalTokensIn += apiData.tokensIn || 0
					totalTokensOut += apiData.tokensOut || 0
					totalCost += apiData.cost || 0
					apiCallCount++
				} catch (e) {
					// text에 JSON이 아닌 다른 내용이 있을 수 있으므로 오류는 무시
				}
			}
		})

		const timestamps = metadata.files_in_context.map((f) => f.cline_read_date).filter(Boolean)
		let startTime = 0,
			endTime = 0,
			totalLatency = 0
		if (timestamps.length > 0) {
			startTime = Math.min(...timestamps)
			endTime = Math.max(...timestamps)
			totalLatency = endTime - startTime
		}

		return {
			totalTokensIn,
			totalTokensOut,
			totalCost,
			apiCallCount,
			startTime,
			endTime,
			totalLatency,
		}
	} catch (error) {
		console.error(`로그 파일 파싱 중 오류 발생: ${taskDir}`, error)
		return null
	}
}

/**
 * 추출된 데이터를 마크다운 보고서 형식으로 만듭니다.
 * @param {string} experimentName - 실험 주제 이름
 * @param {string} agentName - AI 에이전트 이름
 * @param {object} data - parseLogFiles에서 반환된 데이터
 * @returns {string} 마크다운 형식의 보고서 문자열
 */
function createMarkdownReport(experimentName, agentName, data) {
	const executionPeriod =
		data.startTime && data.endTime
			? `${new Date(data.startTime).toLocaleString("ko-KR")} ~ ${new Date(data.endTime).toLocaleString("ko-KR")}`
			: "N/A"

	return `
# [${experimentName}] ${agentName} 성능 테스트 보고서

## 요약

| 측정 지표 | 결과 |
|---|---|
| **총 입력 토큰** | ${data.totalTokensIn.toLocaleString()} |
| **총 출력 토큰** | ${data.totalTokensOut.toLocaleString()} |
| **총 API 비용** | $${data.totalCost.toFixed(6)} |
| **API 호출 횟수** | ${data.apiCallCount}회 |
| **총 실행 시간** | ${Math.round(data.totalLatency / 1000)}초 (${data.totalLatency}ms) |
| **실행 기간** | ${executionPeriod} |

## 세부 정보

- **로그 폴더:** ${path.basename(getLatestTaskDir(REPORT_PATH))}
- **보고서 생성 시간:** ${new Date().toISOString()}
`
}

// --- 메인 로직 ---

function main() {
	const args = process.argv.slice(2)
	if (args.length !== 2) {
		console.error("사용법: node generate-report.js <실험주제> <AI에이전트명>")
		console.error("예시: node generate-report.js calculator alpha")
		process.exit(1)
	}

	const [experimentName, agentName] = args
	console.log(`'${experimentName}' 실험에 대한 '${agentName}' 에이전트의 보고서를 생성합니다...`)

	// 가장 최근 태스크 폴더를 가져와서 분석
	const latestTaskDir = getLatestTaskDir(path.join(REPORT_PATH, experimentName, agentName))
	if (!latestTaskDir) {
		return
	}

	console.log(`분석할 로그 폴더: ${latestTaskDir}`)
	const performanceData = parseLogFiles(latestTaskDir)

	if (performanceData) {
		const reportContent = createMarkdownReport(experimentName, agentName, performanceData)

		const date = new Date()
		const yyyymmdd = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`

		const reportDir = path.join(REPORT_PATH, experimentName)
		const reportFilePath = path.join(reportDir, `${agentName}-${yyyymmdd}-report.md`)

		// 보고서 파일이 저장될 디렉토리가 없으면 생성
		fs.mkdirSync(reportDir, { recursive: true })
		fs.writeFileSync(reportFilePath, reportContent.trim())

		console.log(`✅ 보고서가 성공적으로 생성되었습니다: ${reportFilePath}`)
	} else {
		console.error("❌ 보고서 생성에 실패했습니다.")
	}
}

main()
