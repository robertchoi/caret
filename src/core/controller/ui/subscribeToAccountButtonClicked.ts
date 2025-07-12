import { Controller } from "../index"
import { Empty, EmptyRequest } from "@shared/proto/common"
import { StreamingResponseHandler, getRequestRegistry } from "../grpc-handler"

// Track subscriptions by controller ID
const activeSubscriptions = new Map<string, StreamingResponseHandler>()

/**
 * Subscribe to account button clicked events
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The request ID for cleanup
 */
export async function subscribeToAccountButtonClicked(
	controller: Controller,
	_request: EmptyRequest,
	responseStream: StreamingResponseHandler,
	requestId?: string,
): Promise<void> {
	const controllerId = controller.id

	// Store subscription with controller ID
	activeSubscriptions.set(controllerId, responseStream)

	// Register cleanup
	const cleanup = () => {
		activeSubscriptions.delete(controllerId)
	}

	if (requestId) {
		getRequestRegistry().registerRequest(requestId, cleanup, { type: "account_button_subscription" }, responseStream)
	}
}

/**
 * Send account button clicked event to a specific controller
 * @param controllerId The ID of the controller to send the event to
 */
export async function sendAccountButtonClickedEvent(controllerId: string): Promise<void> {
	console.log(`[AUTH] sendAccountButtonClickedEvent called for controller: ${controllerId}`)
	const responseStream = activeSubscriptions.get(controllerId)

	if (!responseStream) {
		console.warn(`[AUTH] No active subscription found for controller ${controllerId}. Cannot navigate to account view.`)
		return
	}

	try {
		const event: Empty = Empty.create({})
		await responseStream(event, false)
		console.log(`[AUTH] Successfully sent accountButtonClicked event to controller ${controllerId}`)
	} catch (error) {
		console.error(`Error sending account button clicked event to controller ${controllerId}:`, error)
		activeSubscriptions.delete(controllerId)
	}
}
