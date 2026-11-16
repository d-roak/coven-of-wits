import { createHash } from "node:crypto"
import { isIP } from "node:net"
import { resolve } from "node:path"
import { getConnInfo } from "@hono/node-server/conninfo"
import { Hono, type Context } from "hono"
import { feedbackReport, FEEDBACK_SCREENSHOT_MAX, GITHUB_REPOSITORY, type FeedbackReport } from "../shared/community.js"
import { boundedText, FeedbackError, githubFeedback } from "./feedbackGithub.js"
import { jpegBytes } from "./feedbackImage.js"
import { receiptStore, redisReceiptStore, type FeedbackReceipt } from "./feedbackStore.js"
import { createRedis, type Redis } from "./redis.js"

export interface FeedbackOptions {
	redis?: Redis | null
	vercel?: boolean
	repo?: string
	token?: string
	publicOrigin?: string
	dataDir?: string
	fetch?: typeof fetch
	now?: () => number
	getClientIP?: (context: Context) => string | undefined
	timeoutMs?: number
}
const BODY_MAX = FEEDBACK_SCREENSHOT_MAX + 50_000
const digest = (value: string) => createHash("sha256").update(value).digest("hex")

/** Single-process admission limits. Keep one API replica, or move receipts/limits to shared storage. */
function admission(now: () => number, window: number, perAddress: number, globalMax: number) {
	const addresses = new Map<string, { at: number; count: number }>()
	let global = { at: now(), count: 0 }
	return (ip: string) => {
		const at = now()
		for (const [key, bucket] of addresses) if (at - bucket.at >= window) addresses.delete(key)
		if (at - global.at >= window) global = { at, count: 0 }
		const key = digest(ip)
		const bucket = addresses.get(key) ?? { at, count: 0 }
		if ((!addresses.has(key) && addresses.size >= 1024) || bucket.count >= perAddress || global.count >= globalMax)
			throw new FeedbackError("RATE_LIMITED", 429, "Too many reports. Wait before trying again.")
		bucket.count++
		global.count++
		addresses.set(key, bucket)
	}
}
const LIMIT_ADMISSION = `
local address = tonumber(redis.call('GET', KEYS[1]) or '0')
local total = tonumber(redis.call('GET', KEYS[2]) or '0')
if address >= tonumber(ARGV[2]) or total >= tonumber(ARGV[3]) then return 0 end
if redis.call('INCR', KEYS[1]) == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if redis.call('INCR', KEYS[2]) == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[1]) end
return 1
`
function redisAdmission(redis: Redis, prefix: string, window: number, perAddress: number, globalMax: number) {
	return async (ip: string) => {
		const allowed = await redis.eval<number>(
			LIMIT_ADMISSION,
			[`${prefix}:${digest(ip)}`, `${prefix}:global`],
			[window, perAddress, globalMax],
		)
		if (allowed !== 1) throw new FeedbackError("RATE_LIMITED", 429, "Too many reports. Wait before trying again.")
	}
}
export function createFeedbackRoutes(options: FeedbackOptions = {}) {
	const repo = (options.repo ?? process.env.GITHUB_FEEDBACK_REPO ?? GITHUB_REPOSITORY).trim()
	const token = (options.token ?? process.env.GITHUB_FEEDBACK_TOKEN ?? "").trim()
	if (
		!repo ||
		!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
		[".", ".."].includes(repo.split("/")[1])
	)
		throw new Error("GITHUB_FEEDBACK_REPO must be owner/name")
	const configuredOrigin = options.publicOrigin ?? process.env.PUBLIC_ORIGIN
	let publicOrigin: string | undefined
	if (configuredOrigin) {
		const parsed = new URL(configuredOrigin)
		if (
			!["http:", "https:"].includes(parsed.protocol) ||
			parsed.username ||
			parsed.password ||
			parsed.pathname !== "/" ||
			parsed.search ||
			parsed.hash
		)
			throw new Error("PUBLIC_ORIGIN must be an HTTP(S) origin without a path")
		publicOrigin = parsed.origin
	}
	const redis = options.redis === undefined ? createRedis() : options.redis
	const vercel = options.vercel ?? Boolean(process.env.VERCEL)
	const enabled = Boolean(repo && token && (!vercel || redis))
	const timeoutMs = options.timeoutMs ?? 8000
	if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000)
		throw new Error("Feedback timeout must be 1–10000 ms")
	const now = options.now ?? Date.now
	const prefix = `coven:feedback:${digest(repo)}`
	const attempts = redis
		? redisAdmission(redis, `${prefix}:attempts`, 60_000, 20, 100)
		: admission(now, 60_000, 20, 100)
	const reports = redis
		? redisAdmission(redis, `${prefix}:reports`, 3_600_000, 5, 30)
		: admission(now, 3_600_000, 5, 30)
	const disk =
		!redis && !vercel
			? receiptStore(resolve(options.dataDir ?? process.env.FEEDBACK_DATA_DIR ?? ".feedback-data"))
			: null
	const shared = redis ? redisReceiptStore(redis, prefix) : null
	const github = githubFeedback({ repo, token, fetch: options.fetch ?? fetch, timeoutMs })
	const clientIP = options.getClientIP ?? ((c: Context) => getConnInfo(c).remote.address)
	const flights = new Map<string, { hash: string; promise: Promise<string> }>()
	let activeRequests = 0
	const app = new Hono()
	app.get("/api/community", (c) => {
		c.header("Cache-Control", "no-store")
		return c.json({ githubUrl: repo ? `https://github.com/${repo}` : null, feedbackEnabled: enabled })
	})
	async function deliver(report: FeedbackReport, hash: string, ip: string, image?: Buffer): Promise<string> {
		const lease = shared ? await shared.acquire(report.id) : null
		try {
			const store =
				lease ??
				(disk
					? {
							read: () => disk.read(report.id),
							save: (receipt: FeedbackReceipt) => disk.save(receipt),
						}
					: null)
			if (!store) throw new Error("Feedback storage is not configured")
			let receipt = await store.read()
			if (receipt && (receipt.hash !== hash || receipt.repo !== repo || receipt.id !== report.id))
				throw new FeedbackError("ID_CONFLICT", 409, "This report ID belongs to different feedback. Start a new report.")
			if (receipt?.status === "complete") {
				if (!receipt.issueUrl?.startsWith(`https://github.com/${repo}/issues/`))
					throw new Error("Invalid stored issue URL")
				return receipt.issueUrl
			}
			if (receipt?.status === "uncertain") {
				const issueUrl = await github.reconcile(receipt)
				if (!issueUrl)
					throw new FeedbackError(
						"DELIVERY_PENDING",
						503,
						"GitHub has not confirmed this report yet. Retry the same report later.",
					)
				await store.save({ ...receipt, status: "complete", issueUrl })
				return issueUrl
			}
			if (!receipt) {
				await reports(ip)
				receipt = { id: report.id, repo, hash, createdAt: now(), status: "prepared" } satisfies FeedbackReceipt
				await store.save(receipt)
			}
			const imageUrl = image ? await github.screenshot(report.id, image) : undefined
			// Persist before POST: a crash or lost response must reconcile, never issue a blind second POST.
			await store.save({ ...receipt, status: "uncertain" })
			try {
				const issueUrl = await github.create(report, imageUrl)
				await store.save({ ...receipt, status: "complete", issueUrl })
				return issueUrl
			} catch (error) {
				if (error instanceof FeedbackError && error.retrySafe) {
					await store.save(receipt)
					throw error
				}
				throw new FeedbackError(
					"DELIVERY_UNCERTAIN",
					503,
					"GitHub may have received this report. Retry the same report to check its receipt.",
				)
			}
		} finally {
			await lease?.release()
		}
	}
	app.post("/api/feedback", async (c) => {
		c.header("Cache-Control", "no-store")
		let admitted = false
		try {
			if (!enabled) throw new FeedbackError("NOT_CONFIGURED", 503, "Feedback is not configured yet.")
			const origin = c.req.header("Origin")
			if (!origin || origin !== (publicOrigin ?? new URL(c.req.url).origin))
				throw new FeedbackError("ORIGIN_REJECTED", 403, "Send feedback from this site.")
			const ip = clientIP(c)
			if (!ip || !isIP(ip))
				throw new FeedbackError("CLIENT_UNAVAILABLE", 503, "Feedback could not verify the connection. Try again later.")
			await attempts(ip)
			if (activeRequests >= 4) throw new FeedbackError("BUSY", 429, "Feedback is busy. Retry this report in a moment.")
			activeRequests++
			admitted = true
			if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(c.req.header("Content-Type") ?? ""))
				throw new FeedbackError("CONTENT_TYPE", 415, "Send the report as JSON.")
			const length = c.req.header("Content-Length")
			if (length && (!/^\d+$/.test(length) || Number(length) > BODY_MAX))
				throw new FeedbackError("BODY_TOO_LARGE", 413, "The report is too large. Remove the screenshot and try again.")
			const text = await boundedText(c.req.raw.body, BODY_MAX, timeoutMs)
			let raw: unknown
			try {
				raw = JSON.parse(text)
			} catch {
				throw new FeedbackError("INVALID_REPORT", 400, "The report is malformed. Check it and try again.")
			}
			const parsed = feedbackReport.safeParse(raw)
			if (!parsed.success)
				throw new FeedbackError("INVALID_REPORT", 400, "The report contains invalid or unexpected fields.")
			const report = { ...parsed.data, id: parsed.data.id.toLowerCase() }
			let image: Buffer | undefined
			if (report.screenshot) {
				try {
					image = jpegBytes(report.screenshot)
				} catch {
					throw new FeedbackError(
						"INVALID_SCREENSHOT",
						400,
						"The screenshot is not a supported JPEG. Remove it and try again.",
					)
				}
			}
			const hash = digest(JSON.stringify(report))
			let flight = flights.get(report.id)
			if (flight && flight.hash !== hash)
				throw new FeedbackError("ID_CONFLICT", 409, "This report ID belongs to different feedback. Start a new report.")
			if (!flight) {
				const promise = deliver(report, hash, ip, image)
				flight = { hash, promise }
				flights.set(report.id, flight)
			}
			try {
				return c.json({ ok: true as const, issueUrl: await flight.promise })
			} finally {
				if (flights.get(report.id) === flight) flights.delete(report.id)
			}
		} catch (error) {
			if (error instanceof FeedbackError)
				return c.json({ ok: false as const, code: error.code, message: error.message }, error.status)
			return c.json(
				{
					ok: false as const,
					code: "STORAGE_UNAVAILABLE",
					message: "Feedback could not save its receipt. Retry this report later.",
				},
				503,
			)
		} finally {
			if (admitted) activeRequests--
		}
	})
	return app
}
