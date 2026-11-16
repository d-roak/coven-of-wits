import { createHash } from "node:crypto"
import type { FeedbackReport } from "../shared/community.js"
import type { FeedbackReceipt } from "./feedbackStore.js"

export class FeedbackError extends Error {
	constructor(
		readonly code: string,
		readonly status: 400 | 403 | 409 | 413 | 415 | 429 | 503,
		message: string,
		readonly retrySafe = false,
	) {
		super(message)
	}
}
export async function boundedText(
	body: ReadableStream<Uint8Array> | null,
	limit: number,
	timeoutMs: number,
): Promise<string> {
	if (!body) return ""
	const reader = body.getReader()
	let timer: ReturnType<typeof setTimeout> | undefined
	let length = 0
	const chunks: Uint8Array[] = []
	try {
		return await Promise.race([
			(async () => {
				for (;;) {
					const { done, value } = await reader.read()
					if (done) break
					length += value.byteLength
					if (length > limit)
						throw new FeedbackError(
							"BODY_TOO_LARGE",
							413,
							"The report is too large. Remove the screenshot and try again.",
						)
					chunks.push(value)
				}
				try {
					return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
				} catch {
					throw new FeedbackError("INVALID_ENCODING", 400, "The report must use UTF-8 text.")
				}
			})(),
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new FeedbackError("TIMEOUT", 503, "The request timed out. Retry this report.")),
					timeoutMs,
				)
			}),
		])
	} finally {
		clearTimeout(timer)
		// An already-errored stream can reject cancellation; release its reader in either case.
		void reader.cancel().then(
			() => reader.releaseLock(),
			() => reader.releaseLock(),
		)
	}
}
export const reportMarker = (id: string) => `<!-- coven-feedback:${id} -->`
function fenced(text: string) {
	const fence = "`".repeat(Math.max(3, ...[...(text.match(/`+/g) ?? [])].map((run) => run.length + 1)))
	return `${fence}\n${text}\n${fence}`
}
export function issueBody(report: FeedbackReport, imageUrl?: string) {
	return `${reportMarker(report.id)}\n\n${fenced(report.message)}\n\n### Context\n\n${fenced(JSON.stringify(report.context, null, 2))}${report.debug ? `\n\n### Debug information\n\n${fenced(JSON.stringify(report.debug, null, 2))}` : ""}${imageUrl ? `\n\n### Screenshot\n\n![Submitted screenshot](${imageUrl})` : ""}`
}
interface GithubOptions {
	repo: string
	token: string
	fetch: typeof fetch
	timeoutMs: number
}
export function githubFeedback(options: GithubOptions) {
	const base = `https://api.github.com/repos/${options.repo}`
	const issueUrl = (raw: unknown): string => {
		if (
			!raw ||
			typeof raw !== "object" ||
			!("number" in raw) ||
			!Number.isSafeInteger(raw.number) ||
			Number(raw.number) <= 0
		)
			throw new FeedbackError("UPSTREAM_INVALID", 503, "GitHub returned an incomplete receipt. Retry this report.")
		return `https://github.com/${options.repo}/issues/${raw.number}`
	}
	async function call(method: string, path: string, payload?: unknown): Promise<{ status: number; data: unknown }> {
		const controller = new AbortController()
		let timer: ReturnType<typeof setTimeout> | undefined
		try {
			return await Promise.race([
				(async () => {
					const res = await options.fetch(`${base}${path}`, {
						method,
						redirect: "error",
						signal: controller.signal,
						headers: {
							Authorization: `Bearer ${options.token}`,
							Accept: "application/vnd.github+json",
							"X-GitHub-Api-Version": "2026-03-10",
							"Content-Type": "application/json",
							"User-Agent": "Coven-of-Wits-feedback",
						},
						...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
					})
					if (res.status >= 400) {
						controller.abort()
						return { status: res.status, data: null }
					}
					const text = await boundedText(res.body, 2_000_000, options.timeoutMs)
					let data: unknown = null
					if (text) {
						try {
							data = JSON.parse(text)
						} catch {
							throw new FeedbackError(
								"UPSTREAM_INVALID",
								503,
								"GitHub returned an incomplete receipt. Retry this report.",
							)
						}
					}
					return { status: res.status, data }
				})(),
				new Promise<never>((_, reject) => {
					timer = setTimeout(() => {
						controller.abort()
						reject(
							new FeedbackError(
								"UPSTREAM_TIMEOUT",
								503,
								"GitHub did not answer. Retry this report to check its receipt.",
							),
						)
					}, options.timeoutMs)
				}),
			])
		} catch (error) {
			if (error instanceof FeedbackError) {
				if (error.status >= 500) throw error
				throw new FeedbackError("UPSTREAM_INVALID", 503, "GitHub returned an invalid response. Retry this report.")
			}
			throw new FeedbackError("UPSTREAM_UNAVAILABLE", 503, "GitHub could not be reached. Retry this report.")
		} finally {
			clearTimeout(timer)
		}
	}
	const rejected = () => new FeedbackError("UPSTREAM_REJECTED", 503, "GitHub could not accept feedback. Retry later.")
	return {
		async screenshot(id: string, bytes: Buffer): Promise<string> {
			const path = `/contents/screenshots/feedback-${id}.jpg`
			const existing = await call("GET", path)
			const check = (data: unknown) => {
				if (
					!data ||
					typeof data !== "object" ||
					!("sha" in data) ||
					!("html_url" in data) ||
					typeof data.html_url !== "string"
				)
					throw rejected()
				const sha = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex")
				if (data.sha !== sha)
					throw new FeedbackError("SCREENSHOT_CONFLICT", 409, "This report ID already has a different screenshot.")
				const url = new URL(data.html_url)
				if (
					url.origin !== "https://github.com" ||
					url.username ||
					url.password ||
					url.search ||
					url.hash ||
					!url.pathname.toLowerCase().startsWith(`/${options.repo.toLowerCase()}/blob/`) ||
					!url.pathname.endsWith(`/screenshots/feedback-${id}.jpg`)
				)
					throw rejected()
				return `${url.href}?raw=true`
			}
			if (existing.status === 200) return check(existing.data)
			if (existing.status !== 404) throw rejected()
			const created = await call("PUT", path, {
				message: "chore: add feedback screenshot",
				content: bytes.toString("base64"),
			})
			if (created.status !== 201 || !created.data || typeof created.data !== "object" || !("content" in created.data))
				throw rejected()
			return check(created.data.content)
		},
		async reconcile(receipt: FeedbackReceipt): Promise<string | null> {
			const since = new Date(receipt.createdAt - 60000).toISOString()
			for (let page = 1; page <= 5; page++) {
				const res = await call(
					"GET",
					`/issues?state=all&sort=created&direction=desc&per_page=50&page=${page}&since=${encodeURIComponent(since)}`,
				)
				if (res.status !== 200 || !Array.isArray(res.data)) throw rejected()
				for (const issue of res.data) {
					if (
						issue &&
						typeof issue === "object" &&
						!issue.pull_request &&
						typeof issue.body === "string" &&
						issue.body.startsWith(`${reportMarker(receipt.id)}\n`)
					)
						return issueUrl(issue)
				}
				if (res.data.length < 50) return null
			}
			return null
		},
		async create(report: FeedbackReport, imageUrl?: string): Promise<string> {
			const response = await call("POST", "/issues", {
				title: `[${report.kind}] ${report.message.replace(/\s+/g, " ").replace(/@/g, "＠").slice(0, 80)}`,
				body: issueBody(report, imageUrl),
			})
			if (response.status !== 201)
				throw new FeedbackError(
					"UPSTREAM_REJECTED",
					503,
					"GitHub could not accept feedback. Retry later.",
					response.status >= 400 && response.status < 500 && response.status !== 408,
				)
			return issueUrl(response.data)
		},
	}
}
