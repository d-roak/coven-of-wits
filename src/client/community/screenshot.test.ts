import { describe, expect, it } from "vitest"
import { FEEDBACK_SCREENSHOT_MAX } from "../../shared/community"
import { SCREENSHOT_BYTES_MAX, screenshotDataUrl, screenshotImageAllowed } from "./screenshot"

describe("feedback screenshot boundary", () => {
	it("allows only same-origin images and inert raster data URLs", () => {
		const origin = "https://example.test"
		expect(screenshotImageAllowed("/assets/garden.png", origin)).toBe(true)
		expect(screenshotImageAllowed("data:image/png;base64,YQ==", origin)).toBe(true)
		for (const value of [
			"https://elsewhere.test/player.png",
			"//elsewhere.test/player.png",
			"data:image/svg+xml;base64,YQ==",
			"blob:https://example.test/private",
			"javascript:alert(1)",
			"https://name:secret@example.test/picture.png",
		])
			expect(screenshotImageAllowed(value, origin)).toBe(false)
	})
	it("rejects empty, oversized, mislabeled and non-JPEG screenshot blobs", async () => {
		for (const blob of [
			new Blob([], { type: "image/jpeg" }),
			new Blob([new Uint8Array(SCREENSHOT_BYTES_MAX + 1)], { type: "image/jpeg" }),
			new Blob(["private"], { type: "text/plain" }),
			new Blob(["not an image"], { type: "image/jpeg" }),
		])
			await expect(screenshotDataUrl(blob)).rejects.toThrow()
	})
	it("encodes the allowed maximum without exceeding the report parser cap", async () => {
		const bytes = new Uint8Array(SCREENSHOT_BYTES_MAX)
		bytes.set([0xff, 0xd8, 0xff])
		const dataUrl = await screenshotDataUrl(new Blob([bytes], { type: "image/jpeg" }))
		expect(dataUrl.length).toBeLessThanOrEqual(FEEDBACK_SCREENSHOT_MAX)
		expect(dataUrl).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/)
		expect(atob(dataUrl.split(",")[1]).length).toBe(SCREENSHOT_BYTES_MAX)
	})
})
