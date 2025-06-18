// CARET MODIFICATION: Caret 전용 PostHog 설정으로 변경
// 원본 백업: posthog-config-ts.cline
// Caret은 자체 텔레메트리 시스템을 사용하므로 PostHog 비활성화
export const posthogConfig = {
	apiKey: "", // Caret에서는 PostHog 사용하지 않음
	host: "", // data.cline.bot 대신 빈 값으로 설정하여 CSP 에러 방지
	uiHost: "",
}
