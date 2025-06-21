#!/usr/bin/env node

const { execSync } = require("child_process")

// 변수 선언 제거 - 더 이상 파싱하지 않음

console.log("================================================================================")
console.log("                         📊 Caret 전체 테스트 결과")
console.log("================================================================================")

// TDD 원칙 알림
console.log("🔴🟢🔄 TDD 원칙 (Test-Driven Development)")
console.log("1. RED: 실패하는 테스트 작성")
console.log("2. GREEN: 테스트를 통과하는 최소한의 코드 작성")
console.log("3. REFACTOR: 코드 품질 개선")
console.log("⚠️  모든 새로운 기능은 테스트 먼저 작성해야 합니다!")
console.log("🎯 Caret 목표: 100% 테스트 커버리지 (신규 코드)")
console.log("================================================================================\n")

// 프론트엔드 테스트 실행
console.log("🎨 프론트엔드 테스트 실행 중...")
try {
	const frontendStart = Date.now()
	execSync("npm run test:webview", { stdio: "inherit" })
	const frontendDuration = Date.now() - frontendStart

	console.log(`✅ 프론트엔드 테스트 완료 (${frontendDuration}ms)\n`)
} catch (error) {
	console.log("❌ 프론트엔드 테스트 실패")
	process.exit(1)
}

// 백엔드 단위 테스트 실행
console.log("🔧 백엔드 단위 테스트 실행 중...")
try {
	const unitTestStart = Date.now()
	execSync("npm run test:backend -- --exclude=**/integration.test.ts", { stdio: "inherit" })
	const unitTestDuration = Date.now() - unitTestStart

	console.log(`✅ 백엔드 단위 테스트 완료 (${unitTestDuration}ms)\n`)
} catch (error) {
	console.log("❌ 백엔드 단위 테스트 실패")
	process.exit(1)
}

// 통합 테스트 실행
console.log("🔗 통합 테스트 실행 중...")
try {
	const integrationStart = Date.now()
	execSync("npm run test:backend -- integration.test.ts", { stdio: "inherit" })
	const integrationDuration = Date.now() - integrationStart

	console.log(`✅ 통합 테스트 완료 (${integrationDuration}ms)\n`)
} catch (error) {
	console.log("❌ 통합 테스트 실패")
	process.exit(1)
}

console.log("================================================================================")
console.log("🎉 모든 테스트 실행 완료!")
console.log("📊 테스트 구성:")
console.log("   🎨 프론트엔드 테스트 (React 컴포넌트, UI 로직)")
console.log("   🔧 백엔드 단위 테스트 (개별 모듈, 함수 테스트)")
console.log("   🔗 통합 테스트 (실제 빌드, 시스템 전체 동작)")
console.log("================================================================================")
