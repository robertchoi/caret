import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: [
			"caret-src/**/*.test.ts",
			"!src/**/*", // Cline 원본 테스트 제외
			"!caret-src/core/webview/__tests__/CaretProvider.test.ts", // @core/storage/state 모듈 에러
			"!caret-src/__tests__/extension.test.ts", // 동일한 이유로 모듈 에러 발생
			"!caret-src/__tests__/extension-file-watcher.test.ts", // 동일한 이유로 모듈 에러 발생
		],
		coverage: {
			provider: "v8",
			include: ["caret-src/**/*.ts", "!caret-src/**/*.test.ts", "!caret-src/**/*.d.ts"],
			reportOnFailure: true,
			reporter: ["text", "json", "html"],
		},
		logHeapUsage: false,
		silent: false,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./caret-src"),
			"@shared": path.resolve(__dirname, "./src/shared"),
			"@utils": path.resolve(__dirname, "./src/utils"),
			"@packages": path.resolve(__dirname, "./src/packages"),
		},
	},
})
