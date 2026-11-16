import { z } from "zod"

export interface Redis {
	command<T>(args: (string | number)[]): Promise<T>
	eval<T>(script: string, keys: string[], args: (string | number)[]): Promise<T>
}
const responseSchema = z.union([z.object({ result: z.unknown() }).strict(), z.object({ error: z.string() }).strict()])

/** Server-only REST boundary. No implicit retry: callers must reconcile an uncertain write. */
export function redisRest(url: string, token: string, request: typeof fetch = fetch): Redis {
	const endpoint = new URL(url)
	if (
		endpoint.protocol !== "https:" ||
		!endpoint.hostname.endsWith(".upstash.io") ||
		endpoint.username ||
		endpoint.password ||
		endpoint.pathname !== "/" ||
		endpoint.search ||
		endpoint.hash ||
		!token.trim()
	)
		throw new Error("Redis requires an Upstash HTTPS origin and a server-side token")
	async function command<T>(args: (string | number)[]): Promise<T> {
		if (!args.length || args.some((value) => typeof value === "number" && !Number.isFinite(value)))
			throw new Error("Redis expects a nonempty command with finite arguments")
		const response = await request(endpoint, {
			method: "POST",
			redirect: "error",
			signal: AbortSignal.timeout(8000),
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify(args),
		})
		if (!response.ok) throw new Error("Redis request failed")
		const reader = response.body?.getReader()
		if (!reader) throw new Error("Redis response was empty")
		const chunks: Uint8Array[] = []
		let size = 0
		try {
			for (;;) {
				const part = await reader.read()
				if (part.done) break
				size += part.value.byteLength
				if (size > 12_000_000) throw new Error("Redis response exceeded its limit")
				chunks.push(part.value)
			}
		} finally {
			void reader.cancel().catch(() => undefined)
		}
		const parsed = responseSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")))
		if ("error" in parsed) throw new Error("Redis rejected the command")
		// Callers validate the command-specific result at their storage boundary.
		return parsed.result as T
	}
	return { command, eval: (script, keys, args) => command(["EVAL", script, keys.length, ...keys, ...args]) }
}
export function createRedis(): Redis | null {
	const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
	const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
	if (!url && !token) return null
	if (!url || !token) throw new Error("Configure both Redis REST URL and token")
	return redisRest(url, token)
}
