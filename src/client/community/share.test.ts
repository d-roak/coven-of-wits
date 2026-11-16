import { describe, expect, it, vi } from "vitest"
import { inviteShareUrl, nativeShare, publicShareUrl, sharePayload, socialShareLinks } from "./share"

const current = "https://mage:secret@example.test/coven/?name=Private+Mage&state=hidden&game=old-game#ABCD"
const game = { id: "memory-poker", name: "메모리 포커 & 기억" }

describe("public sharing boundary", () => {
	it("rebuilds public links with only an explicitly chosen game", () => {
		const home = new URL(publicShareUrl(current))
		expect(home.origin + home.pathname).toBe("https://example.test/coven/")
		expect(home.search).toBe("")
		expect(home.hash).toBe("")
		expect(home.username).toBe("")
		expect(home.password).toBe("")
		const chosen = new URL(publicShareUrl(current, game.id))
		expect([...chosen.searchParams]).toEqual([["game", game.id]])
		expect(chosen.hash).toBe("")
	})
	it("preserves a nested deployment path without allowing a double-slash path to replace the origin", () => {
		const url = new URL(publicShareUrl("https://example.test//elsewhere.test/play?name=secret#ABCD", game.id))
		expect(url.origin).toBe("https://example.test")
		expect(url.pathname).toBe("//elsewhere.test/play")
	})
	it("adds a room code only through the explicit invitation builder", () => {
		const url = new URL(inviteShareUrl(current, "WXYZ"))
		expect(url.hash).toBe("#WXYZ")
		expect(url.search).toBe("")
		expect(url.pathname).toBe("/coven/")
		expect(() => inviteShareUrl(current, "ABCD?name=secret")).toThrow()
	})
	it("rejects non-web URLs and malformed game IDs", () => {
		expect(() => publicShareUrl("javascript:alert(1)")).toThrow()
		expect(() => publicShareUrl(current, "memory-poker&name=private")).toThrow()
	})
	it("uses explicit result copy without carrying private session fields", () => {
		const payload = sharePayload(current, { kind: "result", game, result: "win" }, "ko")
		const serialized = JSON.stringify(payload)
		for (const hidden of ["Private", "ABCD", "hidden", "secret", "old-game"]) expect(serialized).not.toContain(hidden)
		expect(payload.text).toContain(game.name)
		expect(new URL(payload.url).searchParams.get("game")).toBe(game.id)
		const invite = sharePayload(current, { kind: "invite", game, code: "WXYZ" }, "en")
		expect(new URL(invite.url).hash).toBe("#WXYZ")
	})
	it("URL-encodes Unicode, punctuation and nested URLs for each composer", () => {
		const payload = sharePayload(current, { kind: "game", game }, "ko")
		const links = socialShareLinks(payload)
		const x = new URL(links.x)
		expect(x.origin + x.pathname).toBe("https://twitter.com/intent/tweet")
		expect(x.searchParams.get("text")).toBe(payload.text)
		expect(x.searchParams.get("url")).toBe(payload.url)
		for (const destination of ["bluesky", "whatsapp"] as const)
			expect(new URL(links[destination]).searchParams.get("text")).toBe(`${payload.text}\n${payload.url}`)
		expect(new URL(links.facebook).searchParams.get("u")).toBe(payload.url)
		for (const value of Object.values(links)) expect(new URL(value).hash).toBe("")
	})
})

describe("native sharing fallback", () => {
	const payload = sharePayload(current, { kind: "game", game }, "en")
	it("passes only the prepared public payload to the device share sheet", async () => {
		const share = vi.fn(async (_data: ShareData) => {})
		expect(await nativeShare(payload, share)).toBe("shared")
		expect(share).toHaveBeenCalledExactlyOnceWith(payload)
	})
	it("treats cancellation separately from unavailable or rejected device sharing", async () => {
		const aborted = new Error("Cancelled")
		aborted.name = "AbortError"
		expect(
			await nativeShare(payload, async () => {
				throw aborted
			}),
		).toBe("cancelled")
		expect(
			await nativeShare(payload, async () => {
				throw new Error("Permission denied")
			}),
		).toBe("unavailable")
		expect(await nativeShare(payload, undefined)).toBe("unavailable")
	})
})
