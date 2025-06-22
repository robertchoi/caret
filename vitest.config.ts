import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: [
			"caret-src/**/*.test.ts",
			"!src/**/*", // Cline 원본 테스트 제외
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
