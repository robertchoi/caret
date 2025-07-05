// CARET MODIFICATION: Caret 전용 PostHog 설정으로 변경
// 원본 백업: posthog-config-ts.cline
// Caret은 자체 텔레메트리 시스템을 사용하므로 PostHog 비활성화
export const posthogConfig = {
	apiKey: process.env.POSTHOG_API_KEY || "",
	host: process.env.POSTHOG_HOST || "", // self-hosted PostHog (e.g., https://posthog.caret.team)
	uiHost: process.env.POSTHOG_UIHOST || "", // optional UI host
}
