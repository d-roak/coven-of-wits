import { expect, it } from "vitest"
import { redisRest } from "./redis"

it("sends authenticated Redis commands and Lua arguments through the fixed REST boundary", async () => {
	const calls: unknown[] = []
	const redis = redisRest("https://example.upstash.io", "server-token", async (url, init) => {
		expect(String(url)).toBe("https://example.upstash.io/")
		expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer server-token")
		calls.push(JSON.parse(String(init?.body)))
		return Response.json({ result: 1 })
	})
	expect(await redis.eval("return 1", ["room"], [7])).toBe(1)
	expect(calls).toEqual([["EVAL", "return 1", 1, "room", 7]])
})
it("rejects untrusted endpoints and malformed upstream responses", async () => {
	for (const url of [
		"http://example.upstash.io",
		"https://example.com",
		"https://secret@example.upstash.io",
		"https://example.upstash.io/path",
	])
		expect(() => redisRest(url, "token")).toThrow()
	const redis = redisRest("https://example.upstash.io", "token", async () => Response.json({ unexpected: "payload" }))
	await expect(redis.command(["GET", "room"])).rejects.toThrow()
})
it("surfaces command errors without exposing upstream text or credentials", async () => {
	const redis = redisRest("https://example.upstash.io", "token", async () =>
		Response.json({ error: "secret upstream payload" }),
	)
	await expect(redis.command(["GET", "room"])).rejects.toThrow("Redis rejected the command")
	await expect(redis.command([])).rejects.toThrow()
})
