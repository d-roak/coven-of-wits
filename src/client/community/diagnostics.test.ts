import { afterEach, describe, expect, it, vi } from "vitest"
import { feedbackDebug } from "../../shared/community"
import { collectDebug, installDiagnostics, pathOnly } from "./diagnostics"

function environment() {
	vi.stubGlobal("window", {
		location: { href: "https://example.test/table?room=PRIVATE#SECRET" },
		innerWidth: 1200,
		innerHeight: 800,
		devicePixelRatio: 2,
	})
	vi.stubGlobal("navigator", { userAgent: "Test Browser/1", onLine: true })
}
afterEach(() => vi.unstubAllGlobals())

describe("feedback diagnostic privacy", () => {
	it("drops URL credentials, query strings, fragments and non-HTTP payloads", () => {
		expect(pathOnly("https://name:secret@example.test/table?room=PRIVATE#SECRET")).toBe("/table")
		expect(pathOnly("/home?name=PRIVATE#SECRET")).toBe("/home")
		expect(pathOnly("javascript:PRIVATE")).toBe("/")
		expect(pathOnly("/" + "x".repeat(300))).toHaveLength(200)
	})
	it("bounds errors and snapshots only built-in names and script locations", () => {
		environment()
		const target = new EventTarget()
		const cleanup = installDiagnostics(target)
		for (let index = 0; index < 14; index++) {
			const error = new TypeError("PRIVATE player message")
			error.name = "PRIVATE room name"
			const event = new Event("error")
			Object.defineProperties(event, {
				error: { value: error },
				filename: { value: "https://example.test/assets/app.js?room=PRIVATE#SECRET" },
				lineno: { value: index },
			})
			target.dispatchEvent(event)
		}
		const snapshot = collectDebug({ screen: "online", game: "hexagon", mode: "online", round: "2", moves: 12 }, "en")
		expect(feedbackDebug.safeParse(snapshot).success).toBe(true)
		expect(snapshot.errors).toHaveLength(10)
		expect(snapshot.errors[0]).toEqual({ kind: "error", name: "TypeError", source: "/assets/app.js", line: 4 })
		expect(JSON.stringify(snapshot)).not.toMatch(/PRIVATE|SECRET/)
		const rejection = new Event("unhandledrejection")
		Object.defineProperty(rejection, "reason", { value: { message: "PRIVATE", name: "PRIVATE", stack: "PRIVATE" } })
		target.dispatchEvent(rejection)
		expect(snapshot.errors.at(-1)!.line).toBe(13)
		expect(collectDebug({ screen: "home" }, "en").errors.at(-1)).toEqual({
			kind: "rejection",
			name: "UnknownError",
			source: "",
			line: 0,
		})
		cleanup()
		const before = collectDebug({ screen: "home" }, "en")
		target.dispatchEvent(rejection)
		expect(collectDebug({ screen: "home" }, "en").errors).toEqual(before.errors)
	})
	it("rejects context additions instead of copying room state and names", () => {
		environment()
		expect(() => collectDebug({ screen: "home", ...{ room: "PRIVATE", names: ["PRIVATE"] } }, "en")).toThrow()
		expect(() => collectDebug({ screen: "online", moves: 10001 }, "en")).toThrow()
	})
	it("deduplicates listeners across mounts and keeps the remaining installation alive", () => {
		environment()
		const target = new EventTarget()
		const first = installDiagnostics(target)
		const second = installDiagnostics(target)
		first()
		first()
		const event = new Event("error")
		Object.defineProperties(event, { filename: { value: "https://example.test/PRIVATE" }, lineno: { value: -1 } })
		target.dispatchEvent(event)
		expect(collectDebug({ screen: "home" }, "en").errors.at(-1)).toEqual({
			kind: "error",
			name: "UnknownError",
			source: "",
			line: 0,
		})
		second()
	})
})
