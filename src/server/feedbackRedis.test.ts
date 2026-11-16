import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { createFeedbackRoutes } from "./feedback"
import { redisReceiptStore, type FeedbackReceipt } from "./feedbackStore"
import { hasTestRedis, startTestRedis } from "./redisTest"

const report = {
	id: "9cc317a7-77e3-43fb-a2d5-699eb7461815",
	kind: "bug",
	message: "A tile is missing",
	context: { screen: "home" },
}
const post = (app: ReturnType<typeof createFeedbackRoutes>, body: unknown = report) =>
	app.request("https://coven.test/api/feedback", {
		method: "POST",
		headers: { "Content-Type": "application/json", Origin: "https://coven.test" },
		body: JSON.stringify(body),
	})

it("disables delivery on Vercel without Redis rather than writing ephemeral receipts", async () => {
	const app = createFeedbackRoutes({ vercel: true, redis: null, token: "test-only" })
	expect(await (await app.request("https://coven.test/api/community")).json()).toMatchObject({ feedbackEnabled: false })
	expect(await (await post(app)).json()).toMatchObject({ code: "NOT_CONFIGURED" })
})

describe.skipIf(!hasTestRedis)("shared Redis feedback", () => {
	let fixture: Awaited<ReturnType<typeof startTestRedis>>
	beforeAll(async () => {
		fixture = await startTestRedis()
	})
	beforeEach(async () => {
		await fixture.redis.command(["FLUSHDB"])
	})
	afterAll(async () => {
		await fixture?.close()
	})
	const options = (fetcher: typeof fetch) => ({
		vercel: true,
		redis: fixture.redis,
		repo: "test/project",
		token: "test-only",
		getClientIP: () => "127.0.0.1",
		fetch: fetcher,
	})

	it("coordinates two instances and returns the durable issue without a second POST", async () => {
		let complete!: (response: Response) => void
		const fetcher = vi.fn<typeof fetch>(
			() =>
				new Promise((resolve) => {
					complete = resolve
				}),
		)
		const a = createFeedbackRoutes(options(fetcher)),
			b = createFeedbackRoutes(options(fetcher))
		const first = post(a)
		await vi.waitFor(() => expect(complete).toBeTypeOf("function"))
		expect(await (await post(b)).json()).toMatchObject({ code: "DELIVERY_PENDING" })
		complete(Response.json({ number: 42 }, { status: 201 }))
		expect((await first).status).toBe(200)
		expect(await (await post(b)).json()).toEqual({ ok: true, issueUrl: "https://github.com/test/project/issues/42" })
		expect(fetcher).toHaveBeenCalledTimes(1)
		expect((await post(b, { ...report, message: "Changed report" })).status).toBe(409)
	})

	it("reconciles an uncertain POST from another instance and never reposts it", async () => {
		const fetcher = vi.fn<typeof fetch>()
		fetcher.mockRejectedValueOnce(new Error("Lost response"))
		fetcher.mockResolvedValueOnce(Response.json([{ number: 9, body: `<!-- coven-feedback:${report.id} -->\n` }]))
		expect((await post(createFeedbackRoutes(options(fetcher)))).status).toBe(503)
		expect(await (await post(createFeedbackRoutes(options(fetcher)))).json()).toEqual({
			ok: true,
			issueUrl: "https://github.com/test/project/issues/9",
		})
		expect(fetcher.mock.calls.map((call) => call[1]?.method)).toEqual(["POST", "GET"])
	})

	it("shares per-address report limits across fresh instances", async () => {
		const fetcher = vi.fn<typeof fetch>(async () => Response.json({ number: 1 }, { status: 201 }))
		for (let i = 0; i < 5; i++)
			expect((await post(createFeedbackRoutes(options(fetcher)), { ...report, id: randomUUID() })).status).toBe(200)
		expect((await post(createFeedbackRoutes(options(fetcher)))).status).toBe(429)
		expect(fetcher).toHaveBeenCalledTimes(5)
	})

	it("shares attempt limits before malformed requests can reach GitHub", async () => {
		const fetcher = vi.fn<typeof fetch>()
		for (let i = 0; i < 20; i++) expect((await post(createFeedbackRoutes(options(fetcher)), {})).status).toBe(400)
		expect((await post(createFeedbackRoutes(options(fetcher)), {})).status).toBe(429)
		expect(fetcher).not.toHaveBeenCalled()
	})

	it("shares the global new-report limit across distinct clients and instances", async () => {
		const fetcher = vi.fn<typeof fetch>(async () => Response.json({ number: 1 }, { status: 201 }))
		for (let i = 0; i < 30; i++) {
			const app = createFeedbackRoutes({ ...options(fetcher), getClientIP: () => `10.0.0.${i + 1}` })
			expect((await post(app, { ...report, id: randomUUID() })).status).toBe(200)
		}
		const next = createFeedbackRoutes({ ...options(fetcher), getClientIP: () => "10.0.0.40" })
		expect((await post(next)).status).toBe(429)
		expect(fetcher).toHaveBeenCalledTimes(30)
	})

	it("fails closed when shared storage is unavailable", async () => {
		const fetcher = vi.fn<typeof fetch>()
		const redis = {
			...fixture.redis,
			eval: async <T>(): Promise<T> => {
				throw new Error("Unavailable")
			},
		}
		const app = createFeedbackRoutes({ ...options(fetcher), redis })
		expect(await (await post(app)).json()).toMatchObject({ code: "STORAGE_UNAVAILABLE" })
		expect(fetcher).not.toHaveBeenCalled()
	})

	it("fences expired owners and preserves receipts after lease expiry", async () => {
		const store = redisReceiptStore(fixture.redis, "test-feedback")
		const receipt: FeedbackReceipt = {
			id: report.id,
			repo: "test/project",
			hash: "a".repeat(64),
			createdAt: Date.now(),
			status: "uncertain",
		}
		const old = await store.acquire(report.id)
		await old.save(receipt)
		await fixture.redis.command(["DEL", `test-feedback:lease:${report.id}`])
		const next = await store.acquire(report.id)
		await expect(old.save({ ...receipt, status: "prepared" })).rejects.toThrow()
		await old.release()
		await expect(store.acquire(report.id)).rejects.toMatchObject({ code: "DELIVERY_PENDING" })
		expect(await next.read()).toEqual(receipt)
		expect(await fixture.redis.command(["TTL", `test-feedback:receipt:${report.id}`])).toBe(-1)
		await next.release()
	})
})
