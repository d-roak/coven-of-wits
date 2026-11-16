import { feedbackFailure, feedbackReport, feedbackResponse, type FeedbackReport } from "../../shared/community"

// These responses establish that no issue was created; unknown delivery must retain its original ID.
export function feedbackCanBeEdited(code: string, priorDeliveryUncertain = false): boolean {
	if (priorDeliveryUncertain) return false
	return [
		"NOT_CONFIGURED",
		"ORIGIN_REJECTED",
		"CLIENT_UNAVAILABLE",
		"RATE_LIMITED",
		"CONTENT_TYPE",
		"BODY_TOO_LARGE",
		"INVALID_REPORT",
		"INVALID_SCREENSHOT",
		"INVALID_ENCODING",
		"TIMEOUT",
		"UPSTREAM_REJECTED",
	].includes(code)
}

export class FeedbackDeliveryError extends Error {
	constructor(
		public code: string,
		message: string,
	) {
		super(message)
	}
}
export async function sendFeedback(report: FeedbackReport, request: typeof fetch = fetch) {
	const payload = feedbackReport.parse(report)
	let response: Response
	try {
		response = await request("/api/feedback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(40000),
			credentials: "same-origin",
		})
	} catch {
		throw new FeedbackDeliveryError("DELIVERY_UNKNOWN", "Delivery status is unknown. Retry this same report.")
	}
	if (!response.ok) {
		const failure = feedbackFailure.safeParse(await response.json().catch(() => null))
		throw new FeedbackDeliveryError(
			failure.success ? failure.data.code : "DELIVERY_FAILED",
			"The report could not be delivered.",
		)
	}
	const result = feedbackResponse.safeParse(await response.json().catch(() => null))
	if (!result.success || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/.test(result.data.issueUrl))
		throw new FeedbackDeliveryError("DELIVERY_UNKNOWN", "The issue response was invalid. Retry this same report.")
	return result.data.issueUrl
}
