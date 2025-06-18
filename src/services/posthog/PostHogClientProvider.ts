// CARET MODIFICATION: PostHog 완전 비활성화 (백업: PostHogClientProvider-ts.cline)
// Caret에서는 PostHog를 사용하지 않으므로 더미 클라이언트로 교체
import { posthogConfig } from "@/shared/services/config/posthog-config"

// PostHog 인터페이스를 모방하는 더미 클라이언트
class DummyPostHogClient {
	capture() {
		/* no-op */
	}
	identify() {
		/* no-op */
	}
	alias() {
		/* no-op */
	}
	optIn() {
		/* no-op */
	}
	optOut() {
		/* no-op */
	}
	async shutdown() {
		/* no-op */
	}
}

class PostHogClientProvider {
	private static instance: PostHogClientProvider
	private client: DummyPostHogClient

	private constructor() {
		// Caret에서는 PostHog를 비활성화하고 더미 클라이언트 사용
		console.log("[Caret] PostHog disabled - using dummy client")
		this.client = new DummyPostHogClient()
	}

	public static getInstance(): PostHogClientProvider {
		if (!PostHogClientProvider.instance) {
			PostHogClientProvider.instance = new PostHogClientProvider()
		}
		return PostHogClientProvider.instance
	}

	public getClient(): DummyPostHogClient {
		return this.client
	}

	public async shutdown(): Promise<void> {
		await this.client.shutdown()
	}
}

export const posthogClientProvider = PostHogClientProvider.getInstance()
