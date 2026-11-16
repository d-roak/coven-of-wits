import { constants } from "node:fs"
import { chmod, lstat, mkdir, open, readdir, rename, unlink } from "node:fs/promises"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import type { Redis } from "./redis.js"
import { FeedbackError } from "./feedbackGithub.js"

const receiptSchema = z
	.object({
		id: z.string().uuid(),
		repo: z.string(),
		hash: z.string().regex(/^[a-f0-9]{64}$/),
		createdAt: z.number().finite(),
		status: z.enum(["prepared", "uncertain", "complete"]),
		issueUrl: z.string().url().optional(),
	})
	.strict()
export type FeedbackReceipt = z.infer<typeof receiptSchema>
const missing = (error: unknown) => error instanceof Error && "code" in error && error.code === "ENOENT"

/** One server process owns this directory. Receipts deliberately contain no report text or image bytes. */
export function receiptStore(directory: string) {
	async function prepare() {
		await mkdir(directory, { recursive: true, mode: 0o700 })
		const info = await lstat(directory)
		if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Feedback storage must be a real directory")
		await chmod(directory, 0o700)
	}
	return {
		async read(id: string): Promise<FeedbackReceipt | null> {
			await prepare()
			try {
				const file = await open(join(directory, `${id}.json`), constants.O_RDONLY | constants.O_NOFOLLOW)
				try {
					if ((await file.stat()).size > 4096) throw new Error("Feedback receipt exceeded its bound")
					return receiptSchema.parse(JSON.parse(await file.readFile("utf8")))
				} finally {
					await file.close()
				}
			} catch (error) {
				if (missing(error)) return null
				throw error
			}
		},
		async save(receipt: FeedbackReceipt) {
			await prepare()
			const target = join(directory, `${receipt.id}.json`)
			if ((await readdir(directory)).length >= 10000) {
				try {
					await lstat(target)
				} catch (error) {
					if (missing(error)) throw new Error("Feedback receipt capacity reached")
					throw error
				}
			}
			const temporary = join(directory, `.${receipt.id}-${randomUUID()}.tmp`)
			const file = await open(temporary, "wx", 0o600)
			try {
				await file.writeFile(JSON.stringify(receipt))
				await file.sync()
			} finally {
				await file.close()
			}
			try {
				await rename(temporary, target)
			} catch (error) {
				await unlink(temporary)
				throw error
			}
			const dir = await open(directory, "r")
			try {
				await dir.sync()
			} finally {
				await dir.close()
			}
		},
	}
}

const SAVE_RECEIPT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2])
return 1
`
const RELEASE_LEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0
`

/** Receipts never expire: forgetting an uncertain result would make a later retry duplicate the issue. */
export function redisReceiptStore(redis: Redis, prefix: string) {
	return {
		async acquire(id: string) {
			const owner = randomUUID()
			const lease = `${prefix}:lease:${id}`
			const key = `${prefix}:receipt:${id}`
			const acquired = await redis.command<string | null>(["SET", lease, owner, "NX", "PX", 90_000])
			if (acquired !== "OK")
				throw new FeedbackError("DELIVERY_PENDING", 503, "This report is already being delivered. Retry it shortly.")
			return {
				async read(): Promise<FeedbackReceipt | null> {
					const value = await redis.command<string | null>(["GET", key])
					if (value === null) return null
					if (typeof value !== "string" || value.length > 4096) throw new Error("Invalid feedback receipt")
					return receiptSchema.parse(JSON.parse(value))
				},
				async save(receipt: FeedbackReceipt) {
					if (receipt.id !== id) throw new Error("Feedback receipt ID must match its lease")
					const saved = await redis.eval<number>(
						SAVE_RECEIPT,
						[lease, key],
						[owner, JSON.stringify(receiptSchema.parse(receipt))],
					)
					if (saved !== 1) throw new Error("Feedback receipt lease expired")
				},
				async release() {
					await redis.eval<number>(RELEASE_LEASE, [lease], [owner])
				},
			}
		},
	}
}
