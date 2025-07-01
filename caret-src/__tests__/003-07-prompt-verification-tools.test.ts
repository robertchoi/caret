/**
 * Task #003-07: AI 핵심 프롬프트 파일 검증 도구 테스트
 *
 * 모든 검증 도구가 정상적으로 동작하는지 확인하는 통합 테스트
 */

import { describe, it, expect, beforeEach } from "vitest"
import * as path from "path"
import { ExtendedPromptValidator, Claude4PromptAnalyzer, CommandsAnalyzer, McpDocumentationAnalyzer } from "../core/verification"

describe("003-07: AI 핵심 프롬프트 파일 검증 도구", () => {
	const projectRoot = process.cwd()
	let extendedValidator: ExtendedPromptValidator
	let claude4Analyzer: Claude4PromptAnalyzer
	let commandsAnalyzer: CommandsAnalyzer
	let mcpDocAnalyzer: McpDocumentationAnalyzer

	beforeEach(() => {
		extendedValidator = new ExtendedPromptValidator(projectRoot)
		claude4Analyzer = new Claude4PromptAnalyzer(projectRoot)
		commandsAnalyzer = new CommandsAnalyzer(projectRoot)
		mcpDocAnalyzer = new McpDocumentationAnalyzer(projectRoot)
	})

	describe("ExtendedPromptValidator - 통합 검증 시스템", () => {
		it("should create instance without errors", () => {
			expect(extendedValidator).toBeDefined()
			expect(extendedValidator).toBeInstanceOf(ExtendedPromptValidator)
		})

		it("should validate all prompt files in Cline mode", async () => {
			const result = await extendedValidator.validateAllPromptFiles(true, [
				"claude4.ts",
				"claude4-experimental.ts",
				"commands.ts",
				"loadMcpDocumentation.ts",
			])

			expect(result).toBeDefined()
			expect(result.clineMode).toBe(true)
			expect(result.targetFiles).toHaveLength(4)
			expect(result.timestamp).toBeGreaterThan(0)
			expect(result.systemValidationPattern).toBeDefined()
			expect(result.promptFilesAnalysis).toBeDefined()
			expect(result.conversionPlan).toBeDefined()
			expect(result.riskAssessment).toBeDefined()
			expect(result.recommendedNext).toBeDefined()

			console.log("✅ [ExtendedPromptValidator] Cline 모드 검증 완료")
		}, 30000)

		it("should validate all prompt files in Caret mode", async () => {
			const result = await extendedValidator.validateAllPromptFiles(false, [
				"claude4.ts",
				"commands.ts", // 더 빠른 테스트를 위해 2개만
			])

			expect(result).toBeDefined()
			expect(result.clineMode).toBe(false)
			expect(result.targetFiles).toHaveLength(2)
			expect(result.isValid).toBeDefined()

			console.log("✅ [ExtendedPromptValidator] Caret 모드 검증 완료")
		}, 20000)

		it("should provide meaningful conversion plan", async () => {
			const result = await extendedValidator.validateAllPromptFiles(true, ["commands.ts"])

			expect(result.conversionPlan).toBeDefined()
			expect(result.conversionPlan.conversionOrder).toBeDefined()
			expect(result.conversionPlan.estimatedTokenSavings).toBeDefined()

			// commands.ts는 가장 우선순위가 높아야 함
			const commandsPhase = result.conversionPlan.conversionOrder.find((phase) => phase.file === "commands.ts")
			expect(commandsPhase).toBeDefined()
			expect(commandsPhase?.priority).toBe(1)
			expect(commandsPhase?.expectedEffort).toBe("low")

			console.log("✅ [ExtendedPromptValidator] 변환 계획 생성 완료")
		}, 15000)
	})

	describe("Claude4PromptAnalyzer - Claude4 프롬프트 분석", () => {
		it("should analyze main Claude4 prompt", async () => {
			const analysis = await claude4Analyzer.analyzeMainPrompt(true)

			expect(analysis).toBeDefined()
			expect(analysis.modelOptimizations).toBeDefined()
			expect(analysis.performanceCriticalSections).toBeDefined()
			expect(analysis.toolDefinitions).toBeDefined()
			expect(analysis.conditionalLogic).toBeDefined()
			expect(analysis.templateStructures).toBeDefined()
			expect(analysis.jsonConversionCandidates).toBeDefined()

			// 715줄의 큰 파일이므로 의미있는 분석 결과가 있어야 함
			expect(analysis.toolDefinitions.length).toBeGreaterThan(0)
			expect(analysis.jsonConversionCandidates.length).toBeGreaterThan(0)

			console.log(
				`✅ [Claude4PromptAnalyzer] 메인 프롬프트 분석 완료 - 도구 ${analysis.toolDefinitions.length}개, JSON 후보 ${analysis.jsonConversionCandidates.length}개 발견`,
			)
		}, 20000)

		it("should analyze experimental Claude4 prompt", async () => {
			const analysis = await claude4Analyzer.analyzeExperimentalPrompt(true)

			expect(analysis).toBeDefined()
			expect(analysis.experimentalFeatures).toBeDefined()
			expect(analysis.stabilityIndicators).toBeDefined()
			expect(analysis.changeFrequency).toBeDefined()
			expect(analysis.riskFactors).toBeDefined()
			expect(analysis.conversionStrategy).toBeDefined()

			// 실험적 파일이므로 안정성 지표가 있어야 함
			expect(analysis.stabilityIndicators.length).toBeGreaterThan(0)

			console.log(
				`✅ [Claude4PromptAnalyzer] 실험 프롬프트 분석 완료 - 실험 기능 ${analysis.experimentalFeatures.length}개, 안정성 지표 ${analysis.stabilityIndicators.length}개`,
			)
		}, 15000)

		it("should provide comprehensive Claude4 analysis", async () => {
			const analysis = await claude4Analyzer.analyzeModelSpecificPrompts(true)

			expect(analysis).toBeDefined()
			expect(analysis.mainPrompt).toBeDefined()
			expect(analysis.experimental).toBeDefined()
			expect(analysis.compatibility).toBeDefined()
			expect(analysis.conversionReadiness).toBeDefined()
			expect(analysis.tokenOptimization).toBeDefined()
			expect(analysis.modeSpecificAnalysis).toBeDefined()

			// 토큰 최적화 분석이 의미있어야 함
			expect(analysis.tokenOptimization.currentTokenCount).toBeGreaterThan(1000)
			expect(analysis.tokenOptimization.optimizationPotential).toBeGreaterThan(0)

			console.log(
				`✅ [Claude4PromptAnalyzer] 종합 분석 완료 - 현재 토큰 ${analysis.tokenOptimization.currentTokenCount}, 최적화 잠재력 ${Math.round(analysis.tokenOptimization.optimizationPotential * 100)}%`,
			)
		}, 25000)
	})

	describe("CommandsAnalyzer - 명령어 구조 분석", () => {
		it("should analyze command structures", async () => {
			const analysis = await commandsAnalyzer.analyzeCommandStructures()

			expect(analysis).toBeDefined()
			expect(analysis.commandDefinitions).toBeDefined()
			expect(analysis.responsePatterns).toBeDefined()
			expect(analysis.parameterSchemas).toBeDefined()
			expect(analysis.usagePatterns).toBeDefined()
			expect(analysis.jsonConversionReadiness).toBeDefined()
			expect(analysis.conversionRecommendations).toBeDefined()

			// commands.ts는 구조화되어 있어 여러 명령어 정의가 있어야 함
			expect(analysis.commandDefinitions.length).toBeGreaterThan(0)

			// JSON 변환 준비도가 높아야 함
			expect(analysis.jsonConversionReadiness.structureScore).toBeGreaterThan(0.7)
			expect(analysis.jsonConversionReadiness.conversionEffort).toBe("low")
			expect(analysis.jsonConversionReadiness.recommendedPriority).toBe("high")

			console.log(
				`✅ [CommandsAnalyzer] 명령어 분석 완료 - 명령어 ${analysis.commandDefinitions.length}개, JSON 준비도 ${Math.round(analysis.jsonConversionReadiness.structureScore * 100)}%`,
			)
		}, 15000)

		it("should provide high-quality conversion recommendations", async () => {
			const analysis = await commandsAnalyzer.analyzeCommandStructures()

			expect(analysis.conversionRecommendations.length).toBeGreaterThan(0)

			// 첫 번째 추천은 직접 JSON 변환이어야 함
			const primaryRecommendation = analysis.conversionRecommendations[0]
			expect(primaryRecommendation.recommendation).toContain("JSON")
			expect(primaryRecommendation.priority).toBe("high")
			expect(primaryRecommendation.effort).toBe("low")

			console.log(`✅ [CommandsAnalyzer] 변환 추천 ${analysis.conversionRecommendations.length}개 생성 완료`)
		}, 10000)
	})

	describe("McpDocumentationAnalyzer - MCP 문서 분석", () => {
		it("should analyze MCP documentation generation", async () => {
			const analysis = await mcpDocAnalyzer.analyzeMcpDocGeneration()

			expect(analysis).toBeDefined()
			expect(analysis.dynamicContentSections).toBeDefined()
			expect(analysis.externalDependencies).toBeDefined()
			expect(analysis.templateGeneration).toBeDefined()
			expect(analysis.complexConversionAreas).toBeDefined()
			expect(analysis.conversionStrategy).toBeDefined()
			expect(analysis.riskAssessment).toBeDefined()

			// MCP 파일은 복잡해서 동적 섹션과 외부 의존성이 있어야 함
			expect(analysis.dynamicContentSections.length).toBeGreaterThan(0)
			expect(analysis.externalDependencies.length).toBeGreaterThan(0)

			// McpHub 의존성이 발견되어야 함
			const mcpHubDependency = analysis.externalDependencies.find((dep) => dep.dependency === "McpHub")
			expect(mcpHubDependency).toBeDefined()
			expect(mcpHubDependency?.impact).toBe("high")

			console.log(
				`✅ [McpDocumentationAnalyzer] MCP 분석 완료 - 동적 섹션 ${analysis.dynamicContentSections.length}개, 외부 의존성 ${analysis.externalDependencies.length}개`,
			)
		}, 20000)

		it("should assess conversion risk appropriately", async () => {
			const analysis = await mcpDocAnalyzer.analyzeMcpDocGeneration()

			// MCP는 복잡하므로 위험도가 medium 이상이어야 함
			expect(["medium", "high"]).toContain(analysis.riskAssessment.overallRisk)
			expect(analysis.riskAssessment.specificRisks.length).toBeGreaterThan(0)
			expect(analysis.riskAssessment.mitigationStrategies.length).toBeGreaterThan(0)

			// 변환 전략이 hybrid 또는 gradual이어야 함
			expect(["hybrid", "gradual"]).toContain(analysis.conversionStrategy.approach)
			expect(analysis.conversionStrategy.estimatedEffort).toBe("high")

			console.log(
				`✅ [McpDocumentationAnalyzer] 위험 평가 완료 - 전체 위험도 ${analysis.riskAssessment.overallRisk}, 변환 전략 ${analysis.conversionStrategy.approach}`,
			)
		}, 15000)
	})

	describe("Integration Test - 전체 시스템 통합", () => {
		it("should complete full validation workflow", async () => {
			console.log("🚀 [Integration] 전체 검증 워크플로우 시작...")

			// 1단계: 전체 파일 분석
			const fullValidation = await extendedValidator.validateAllPromptFiles(true)
			expect(fullValidation.isValid).toBeDefined()

			// 2단계: 개별 도구 검증
			const claude4Analysis = await claude4Analyzer.analyzeModelSpecificPrompts(true)
			const commandsAnalysis = await commandsAnalyzer.analyzeCommandStructures()
			const mcpAnalysis = await mcpDocAnalyzer.analyzeMcpDocGeneration()

			// 3단계: 결과 일관성 검증
			expect(claude4Analysis).toBeDefined()
			expect(commandsAnalysis).toBeDefined()
			expect(mcpAnalysis).toBeDefined()

			// 4단계: 변환 우선순위 검증
			const conversionOrder = fullValidation.conversionPlan.conversionOrder
			expect(conversionOrder).toBeDefined()
			expect(conversionOrder.length).toBe(4)

			// commands.ts가 최우선, loadMcpDocumentation.ts가 최후순위여야 함
			const commandsPriority = conversionOrder.find((p) => p.file === "commands.ts")?.priority
			const mcpPriority = conversionOrder.find((p) => p.file === "loadMcpDocumentation.ts")?.priority

			expect(commandsPriority).toBe(1) // 가장 높은 우선순위
			expect(mcpPriority).toBe(4) // 가장 낮은 우선순위

			console.log("✅ [Integration] 전체 검증 워크플로우 완료")
			console.log(`📊 [Integration] 변환 계획: ${conversionOrder.map((p) => `${p.file}(${p.priority})`).join(" → ")}`)
		}, 45000)

		it("should provide actionable next steps for 003-08", async () => {
			const validation = await extendedValidator.validateAllPromptFiles(true)

			expect(validation.recommendedNext).toBeDefined()
			expect(validation.recommendedNext.length).toBeGreaterThan(0)

			// 첫 번째 추천이 commands.ts 변환이어야 함
			const firstRecommendation = validation.recommendedNext[0]
			expect(firstRecommendation).toContain("commands.ts")
			expect(firstRecommendation).toContain("안전")

			console.log("✅ [Integration] 003-08 다음 단계 준비 완료")
			console.log(`🎯 [Integration] 다음 단계: ${validation.recommendedNext.join(", ")}`)
		}, 20000)
	})
})

// 성능 및 안정성 검증
describe("성능 및 안정성 검증", () => {
	it("should handle file reading errors gracefully", async () => {
		const invalidValidator = new ExtendedPromptValidator("/nonexistent/path")

		// 존재하지 않는 파일은 graceful하게 처리됨 (warning만 로그)
		const result = await invalidValidator.validateAllPromptFiles(true, ["invalid.ts"])

		// 시스템이 graceful하게 처리했는지 확인
		expect(result).toBeDefined()
		expect(result.promptFilesAnalysis).toBeDefined()
		expect(result.promptFilesAnalysis.analysisMetadata).toBeDefined()
		
		// 존재하지 않는 파일은 분석되지 않으므로 successfulAnalyses와 failedAnalyses 모두 0
		expect(result.promptFilesAnalysis.analysisMetadata.successfulAnalyses).toBe(0)
		expect(result.promptFilesAnalysis.analysisMetadata.failedAnalyses).toBe(0)
		expect(result.isValid).toBe(false) // 분석된 파일이 없으므로 유효하지 않음

		console.log("✅ [Stability] 파일 오류 처리 검증 완료")
	})

	it("should complete analysis within reasonable time", async () => {
		const startTime = Date.now()
		const validator = new ExtendedPromptValidator(process.cwd())

		await validator.validateAllPromptFiles(true, ["commands.ts"])

		const elapsedTime = Date.now() - startTime
		expect(elapsedTime).toBeLessThan(30000) // 30초 이내

		console.log(`✅ [Performance] 분석 시간: ${elapsedTime}ms (30초 이내 목표 달성)`)
	})
})
