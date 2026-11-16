import { z } from "zod"

export const GITHUB_REPOSITORY = "d-roak/coven-of-wits"

export const feedbackKinds = ["bug", "idea", "other"] as const
export const feedbackContext = z
	.object({
		screen: z.enum(["home", "kit", "local", "online"]),
		game: z.string().max(80).optional(),
		mode: z.enum(["solo", "bots", "online"]).optional(),
		round: z.string().max(80).optional(),
		moves: z.number().int().min(0).max(10000).optional(),
	})
	.strict()
export type FeedbackContext = z.infer<typeof feedbackContext>
export const feedbackDebug = z
	.object({
		context: feedbackContext,
		path: z
			.string()
			.max(200)
			.regex(/^\/[^?#\s]*$/),
		version: z.string().max(80),
		language: z.string().max(30),
		viewport: z.string().max(30),
		pixelRatio: z.number().min(0).max(10),
		userAgent: z.string().max(400),
		online: z.boolean(),
		elapsedSeconds: z.number().int().min(0).max(10000000),
		errors: z
			.array(
				z
					.object({
						kind: z.enum(["error", "rejection"]),
						name: z.string().max(80),
						source: z.string().max(200),
						line: z.number().int().min(0),
					})
					.strict(),
			)
			.max(10),
	})
	.strict()
export type FeedbackDebug = z.infer<typeof feedbackDebug>
export const FEEDBACK_SCREENSHOT_MAX = 1_500_000
export const feedbackReport = z
	.object({
		id: z.string().uuid(),
		kind: z.enum(feedbackKinds),
		message: z.string().trim().min(1).max(4000),
		context: feedbackContext,
		debug: feedbackDebug.optional(),
		screenshot: z
			.string()
			.max(FEEDBACK_SCREENSHOT_MAX)
			.regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/)
			.optional(),
	})
	.strict()
export type FeedbackReport = z.infer<typeof feedbackReport>
export const communityConfig = z
	.object({
		githubUrl: z.string().url().nullable(),
		feedbackEnabled: z.boolean(),
	})
	.strict()
export const feedbackResponse = z.object({ ok: z.literal(true), issueUrl: z.string().url() }).strict()
export const feedbackFailure = z.object({ ok: z.literal(false), code: z.string(), message: z.string() }).strict()
