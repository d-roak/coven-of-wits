import { mkdtemp, rm, stat, readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GITHUB_REPOSITORY } from "../shared/community"
import { createFeedbackRoutes } from "./feedback"

const report = {
	id: "9cc317a7-77e3-43fb-a2d5-699eb7461815",
	kind: "bug",
	message: "A tile is missing",
	context: { screen: "home" },
}
const dirs: string[] = []
afterEach(async () => {
	vi.unstubAllEnvs()
	await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})
async function harness(
	fetcher: typeof fetch = vi.fn(async () =>
		Response.json({ number: 4, html_url: "https://github.com/test/project/issues/4" }, { status: 201 }),
	),
) {
	const dataDir = await mkdtemp(join(tmpdir(), "coven-feedback-"))
	dirs.push(dataDir)
	const options = {
		repo: "test/project",
		token: "test-only-token",
		dataDir,
		fetch: fetcher,
		getClientIP: () => "127.0.0.1",
		timeoutMs: 100,
	}
	return { options, app: createFeedbackRoutes(options), fetcher, dataDir }
}
const post = (app: ReturnType<typeof createFeedbackRoutes>, body: unknown = report, headers = {}) =>
	app.request("https://coven.test/api/feedback", {
		method: "POST",
		headers: { "Content-Type": "application/json", Origin: "https://coven.test", ...headers },
		body: JSON.stringify(body),
	})

describe("feedback endpoint", () => {
	it("links the canonical repository but disables delivery without a server token", async () => {
		vi.stubEnv("GITHUB_FEEDBACK_REPO", undefined)
		const app = createFeedbackRoutes({ token: "" })
		expect(await (await app.request("https://coven.test/api/community")).json()).toEqual({
			githubUrl: `https://github.com/${GITHUB_REPOSITORY}`,
			feedbackEnabled: false,
		})
		expect((await post(app)).status).toBe(503)
	})
	it("creates one issue, persists the receipt, and returns it across retries and restart", async () => {
		const { app, options, fetcher, dataDir } = await harness()
		const responses = await Promise.all([post(app), post(app)])
		for (const response of responses)
			expect(await response.json()).toEqual({ ok: true, issueUrl: "https://github.com/test/project/issues/4" })
		expect(fetcher).toHaveBeenCalledTimes(1)
		expect((await post(createFeedbackRoutes(options))).status).toBe(200)
		expect(fetcher).toHaveBeenCalledTimes(1)
		expect((await stat(dataDir)).mode & 0o777).toBe(0o700)
		expect((await post(app, { ...report, message: "Changed body" })).status).toBe(409)
	})
	it("rejects cross-origin, oversized and malformed payloads before any GitHub request", async () => {
		const { app, fetcher } = await harness()
		expect((await post(app, report, { Origin: "https://other.test", "X-Forwarded-Host": "other.test" })).status).toBe(
			403,
		)
		expect((await post(app, { ...report, extra: true })).status).toBe(400)
		expect(
			(
				await post(app, {
					...report,
					screenshot: `data:image/jpeg;base64,${Buffer.from("not a jpeg").toString("base64")}`,
				})
			).status,
		).toBe(400)
		expect((await post(app, { ...report, message: "x".repeat(1_600_000) })).status).toBe(413)
		expect(fetcher).not.toHaveBeenCalled()
	})
})

it("reconciles an issue after upstream success with a lost response, including process restart", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockRejectedValueOnce(new Error("connection lost after POST"))
	fetcher.mockResolvedValueOnce(
		Response.json([{ number: 17, body: `<!-- coven-feedback:${report.id} -->\n\nreceived` }]),
	)
	const { app, options } = await harness(fetcher)
	expect((await post(app)).status).toBe(503)
	const reply = await post(createFeedbackRoutes(options))
	expect(await reply.json()).toEqual({ ok: true, issueUrl: "https://github.com/test/project/issues/17" })
	expect(fetcher.mock.calls.map((call) => call[1]?.method)).toEqual(["POST", "GET"])
})

it("does not create another issue when an uncertain delivery has not appeared yet", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockRejectedValueOnce(new Error("network failure"))
	fetcher.mockResolvedValue(Response.json([]))
	const { app } = await harness(fetcher)
	await post(app)
	expect(await (await post(app)).json()).toMatchObject({ ok: false, code: "DELIVERY_PENDING" })
	expect(fetcher.mock.calls.filter((call) => call[1]?.method === "POST")).toHaveLength(1)
})

it("bounds an upstream that ignores cancellation and leaves a retryable uncertain receipt", async () => {
	let signal: AbortSignal | null | undefined
	const fetcher = vi.fn<typeof fetch>((_url, init) => {
		signal = init?.signal
		return new Promise(() => undefined)
	})
	const { options } = await harness(fetcher)
	const reply = await post(createFeedbackRoutes({ ...options, timeoutMs: 10 }))
	expect(reply.status).toBe(503)
	expect(await reply.json()).toMatchObject({ code: "DELIVERY_UNCERTAIN" })
	expect(signal?.aborted).toBe(true)
})

it("honors an explicit public origin and never accepts spoofed forwarded origin headers", async () => {
	const { options, fetcher } = await harness()
	const app = createFeedbackRoutes({ ...options, publicOrigin: "https://public.test" })
	expect((await post(app)).status).toBe(403)
	expect((await post(app, report, { Origin: "https://public.test", "X-Forwarded-Host": "evil.test" })).status).toBe(200)
	expect(fetcher).toHaveBeenCalledTimes(1)
})

it("enforces streamed request bounds even without Content-Length", async () => {
	const { app, fetcher } = await harness()
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(1_550_001))
			controller.close()
		},
	})
	const request = new Request("https://coven.test/api/feedback", {
		method: "POST",
		headers: { Origin: "https://coven.test", "Content-Type": "application/json" },
		body,
		duplex: "half",
	} as RequestInit)
	expect((await app.request(request)).status).toBe(413)
	expect(fetcher).not.toHaveBeenCalled()
})

it("rejects reused IDs with a different body during a concurrent submission", async () => {
	let complete!: (response: Response) => void
	const { app } = await harness(
		vi.fn<typeof fetch>(
			() =>
				new Promise((resolve) => {
					complete = resolve
				}),
		),
	)
	const first = post(app)
	await vi.waitFor(() => expect(complete).toBeTypeOf("function"))
	expect((await post(app, { ...report, message: "Different" })).status).toBe(409)
	complete(Response.json({ number: 4 }, { status: 201 }))
	expect((await first).status).toBe(200)
})

it("limits new reports per remote address without trusting forwarded IPs", async () => {
	const { app, fetcher } = await harness()
	for (let i = 0; i < 5; i++) {
		const id = `9cc317a7-77e3-43fb-a2d5-${String(i).padStart(12, "0")}`
		expect((await post(app, { ...report, id }, { "X-Forwarded-For": `10.0.0.${i}` })).status).toBe(200)
	}
	expect((await post(app, report, { "X-Forwarded-For": "192.168.0.99" })).status).toBe(429)
	expect(fetcher).toHaveBeenCalledTimes(5)
})

it("enforces a global new-report limit across distinct remote addresses", async () => {
	let ip = "10.0.0.1"
	const { options, fetcher } = await harness()
	const app = createFeedbackRoutes({ ...options, getClientIP: () => ip })
	for (let i = 0; i < 30; i++) {
		ip = `10.0.0.${i + 1}`
		const id = `9cc317a7-77e3-43fb-a2d5-${String(i).padStart(12, "0")}`
		expect((await post(app, { ...report, id })).status).toBe(200)
	}
	ip = "10.0.0.40"
	expect((await post(app)).status).toBe(429)
	expect(fetcher).toHaveBeenCalledTimes(30)
})

it("allows retry after a definitive auth rejection instead of leaving an uncertain issue", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
	fetcher.mockResolvedValueOnce(Response.json({ number: 4 }, { status: 201 }))
	const { app, options } = await harness(fetcher)
	expect(await (await post(app)).json()).toMatchObject({ code: "UPSTREAM_REJECTED" })
	expect((await post(createFeedbackRoutes(options))).status).toBe(200)
	expect(fetcher.mock.calls.map((call) => call[1]?.method)).toEqual(["POST", "POST"])
})

// Constant grey 1×1 baseline JPEG, with one-symbol DC/AC Huffman tables.
const jpeg = Buffer.from([
	0xff,
	0xd8,
	0xff,
	0xdb,
	0,
	67,
	0,
	...Array(64).fill(1),
	0xff,
	0xc0,
	0,
	11,
	8,
	0,
	1,
	0,
	1,
	1,
	1,
	0x11,
	0,
	0xff,
	0xc4,
	0,
	38,
	0,
	1,
	...Array(15).fill(0),
	0,
	0x10,
	1,
	...Array(15).fill(0),
	0,
	0xff,
	0xda,
	0,
	8,
	1,
	1,
	0,
	0,
	63,
	0,
	0x3f,
	0xff,
	0xd9,
])
const screenshot = `data:image/jpeg;base64,${jpeg.toString("base64")}`
const imageReceipt = {
	sha: createHash("sha1").update(`blob ${jpeg.length}\0`).update(jpeg).digest("hex"),
	html_url: `https://github.com/test/project/blob/main/screenshots/feedback-${report.id}.jpg`,
}

it("uploads a deterministic JPEG then creates an issue with an image link and no raw data URL", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockResolvedValueOnce(Response.json({}, { status: 404 }))
	fetcher.mockResolvedValueOnce(Response.json({ content: imageReceipt }, { status: 201 }))
	fetcher.mockResolvedValueOnce(Response.json({ number: 4 }, { status: 201 }))
	const { app, dataDir } = await harness(fetcher)
	expect((await post(app, { ...report, screenshot })).status).toBe(200)
	const calls = fetcher.mock.calls
	expect(calls.map((call) => call[1]?.method)).toEqual(["GET", "PUT", "POST"])
	expect(String(calls[1][0])).toBe(
		`https://api.github.com/repos/test/project/contents/screenshots/feedback-${report.id}.jpg`,
	)
	const upload = JSON.parse(String(calls[1][1]?.body))
	expect(Buffer.from(upload.content, "base64")).toEqual(jpeg)
	const issue = JSON.parse(String(calls[2][1]?.body))
	expect(issue.body).toContain(`${imageReceipt.html_url}?raw=true`)
	expect(issue.body).not.toContain(screenshot)
	const persisted = await readFile(join(dataDir, `${report.id}.json`), "utf8")
	expect(persisted).not.toContain(report.message)
	expect(persisted).not.toContain(screenshot)
	expect((await stat(join(dataDir, `${report.id}.json`))).mode & 0o777).toBe(0o600)
})

it("reuses an uploaded image after a lost PUT response instead of uploading it again", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockResolvedValueOnce(Response.json({}, { status: 404 }))
	fetcher.mockRejectedValueOnce(new Error("lost upload response"))
	fetcher.mockResolvedValueOnce(Response.json(imageReceipt))
	fetcher.mockResolvedValueOnce(Response.json({ number: 4 }, { status: 201 }))
	const { app, options } = await harness(fetcher)
	expect((await post(app, { ...report, screenshot })).status).toBe(503)
	expect((await post(createFeedbackRoutes(options), { ...report, screenshot })).status).toBe(200)
	expect(fetcher.mock.calls.map((call) => call[1]?.method)).toEqual(["GET", "PUT", "GET", "POST"])
})

it("rejects truncated JPEG data and mismatched existing screenshot contents", async () => {
	const { app, fetcher } = await harness(vi.fn(async () => Response.json({ ...imageReceipt, sha: "wrong" })))
	expect(
		(await post(app, { ...report, screenshot: `data:image/jpeg;base64,${jpeg.subarray(0, -2).toString("base64")}` }))
			.status,
	).toBe(400)
	expect(fetcher).not.toHaveBeenCalled()
	expect((await post(app, { ...report, screenshot })).status).toBe(409)
	expect(fetcher).toHaveBeenCalledTimes(1)
})

it("bounds slow incoming bodies before an issue can be created", async () => {
	const { options, fetcher } = await harness()
	const app = createFeedbackRoutes({ ...options, timeoutMs: 10 })
	const body = new ReadableStream<Uint8Array>()
	const request = new Request("https://coven.test/api/feedback", {
		method: "POST",
		headers: { Origin: "https://coven.test", "Content-Type": "application/json" },
		body,
		duplex: "half",
	} as RequestInit)
	expect((await app.request(request)).status).toBe(503)
	expect(fetcher).not.toHaveBeenCalled()
})

it("keeps message/debug markup inside fences and limits the GitHub token to fixed API endpoints", async () => {
	const { app, fetcher } = await harness()
	expect((await post(app, { ...report, message: "```\n@someone\n<!-- forged -->" })).status).toBe(200)
	const [url, init] = vi.mocked(fetcher).mock.calls[0]
	expect(String(url)).toBe("https://api.github.com/repos/test/project/issues")
	expect(init?.redirect).toBe("error")
	expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-only-token")
	const payload = JSON.parse(String(init?.body))
	expect(payload.title).not.toContain("@")
	expect(payload.body).toContain("````\n```\n@someone\n<!-- forged -->\n````")
})

it("fails closed for an explicitly empty or malformed repository and invalid public origin", () => {
	expect(() => createFeedbackRoutes({ repo: "" })).toThrow()
	expect(() => createFeedbackRoutes({ repo: "owner/../other" })).toThrow()
	expect(() => createFeedbackRoutes({ publicOrigin: "https://site.test/path" })).toThrow()
	expect(() => createFeedbackRoutes({ timeoutMs: 0 })).toThrow()
})

it("keeps a malformed success receipt uncertain rather than creating another issue", async () => {
	const fetcher = vi.fn<typeof fetch>()
	fetcher.mockResolvedValueOnce(Response.json({ number: "bad", html_url: "https://evil.test" }, { status: 201 }))
	fetcher.mockResolvedValueOnce(Response.json([]))
	const { app } = await harness(fetcher)
	expect(await (await post(app)).json()).toMatchObject({ code: "DELIVERY_UNCERTAIN" })
	expect(await (await post(app)).json()).toMatchObject({ code: "DELIVERY_PENDING" })
	expect(fetcher.mock.calls.filter((call) => call[1]?.method === "POST")).toHaveLength(1)
})

it("bounds concurrent body/upstream work independently of the rate window", async () => {
	const completions: ((response: Response) => void)[] = []
	const fetcher = vi.fn<typeof fetch>(() => new Promise((resolve) => completions.push(resolve)))
	const { options } = await harness(fetcher)
	const app = createFeedbackRoutes({ ...options, timeoutMs: 1000 })
	const pending = Array.from({ length: 4 }, (_, i) =>
		post(app, { ...report, id: `9cc317a7-77e3-43fb-a2d5-${String(i).padStart(12, "0")}` }),
	)
	await vi.waitFor(() => expect(completions).toHaveLength(4))
	expect(await (await post(app)).json()).toMatchObject({ code: "BUSY" })
	completions.forEach((complete, i) => complete(Response.json({ number: i + 1 }, { status: 201 })))
	for (const response of await Promise.all(pending)) expect(response.status).toBe(200)
})
