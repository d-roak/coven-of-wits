import { expect, it } from "vitest"
import { feedbackReport, type FeedbackReport } from "../../shared/community"
import { feedbackCanBeEdited, FeedbackDeliveryError, sendFeedback } from "./feedbackClient"

const report: FeedbackReport = {
	id: "a41d8aaa-43ee-4ea1-8ef3-33c8c27cad47",
	kind: "bug",
	message: "The tile did not move.",
	context: { screen: "local", game: "hexagon", mode: "solo" },
}
it("posts the reviewed report and returns a GitHub issue link", async () => {
	let sent: unknown
	const request: typeof fetch = async (input, init) => {
		expect(input).toBe("/api/feedback")
		sent = JSON.parse(String(init?.body))
		return Response.json({ ok: true, issueUrl: "https://github.com/test/coven/issues/3" })
	}
	expect(await sendFeedback(report, request)).toBe("https://github.com/test/coven/issues/3")
	expect(sent).toEqual(report)
})
it("preserves request identity on explicit retries after an uncertain network result", async () => {
	const ids: string[] = []
	const request: typeof fetch = async (_input, init) => {
		ids.push(JSON.parse(String(init?.body)).id)
		throw new DOMException("Timeout", "TimeoutError")
	}
	for (let i = 0; i < 2; i++)
		await expect(sendFeedback(report, request)).rejects.toMatchObject({ code: "DELIVERY_UNKNOWN" })
	expect(ids).toEqual([report.id, report.id])
})
it("rejects errors and malformed or off-site delivery responses", async () => {
	await expect(
		sendFeedback(report, async () =>
			Response.json({ ok: false, code: "RATE_LIMITED", message: "Wait" }, { status: 429 }),
		),
	).rejects.toMatchObject({ code: "RATE_LIMITED" })
	await expect(
		sendFeedback(report, async () => Response.json({ ok: true, issueUrl: "https://evil.example/issue" })),
	).rejects.toBeInstanceOf(FeedbackDeliveryError)
	await expect(sendFeedback(report, async () => Response.json({ unexpected: true }))).rejects.toMatchObject({
		code: "DELIVERY_UNKNOWN",
	})
})
it("rejects unknown fields and oversized attachments before sending", () => {
	expect(feedbackReport.safeParse({ ...report, room: "ABCD" }).success).toBe(false)
	expect(
		feedbackReport.safeParse({ ...report, screenshot: "data:image/jpeg;base64," + "A".repeat(1500001) }).success,
	).toBe(false)
})

it("allows editing confirmed rejections but keeps unknown deliveries frozen", () => {
	expect(feedbackCanBeEdited("INVALID_SCREENSHOT")).toBe(true)
	expect(feedbackCanBeEdited("RATE_LIMITED", true)).toBe(false)
	expect(feedbackCanBeEdited("DELIVERY_UNCERTAIN")).toBe(false)
	expect(feedbackCanBeEdited("STORAGE_UNAVAILABLE")).toBe(false)
})
