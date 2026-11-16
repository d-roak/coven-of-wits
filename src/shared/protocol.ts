import { z } from "zod"
import { ACTION_HISTORY } from "./tableSession"

// Every message on the socket, both directions. Strict: a typo'd field is rejected, not dropped.

export const NAME_MAX = 16
export const CHAT_MAX = 240
export const CHAT_HISTORY = 30
const name = z.string().trim().min(1).max(NAME_MAX)
const chatText = z.string().trim().min(1).max(CHAT_MAX)
const chatEntry = z.object({ name, text: chatText }).strict()
export type ChatEntry = z.infer<typeof chatEntry>
export const roomCode = z.string().regex(/^[A-Z]{4}$/)

export const clientMsg = z.discriminatedUnion("t", [
	/** Join any open room for this game, or open one and wait. */
	z.object({ t: z.literal("quick"), game: z.string(), name }).strict(),
	/** Open a private room. Only someone with the code can join. */
	z.object({ t: z.literal("create"), game: z.string(), name }).strict(),
	z.object({ t: z.literal("join"), code: roomCode, name }).strict(),
	/** Checked by the game's own parseMove on the server. */
	z.object({ t: z.literal("move"), move: z.unknown() }).strict(),
	/** Host only: begin with the mages present instead of waiting for a full table. */
	z.object({ t: z.literal("start") }).strict(),
	z.object({ t: z.literal("rematch") }).strict(),
	z.object({ t: z.literal("chat"), text: chatText }).strict(),
])
export type ClientMsg = z.infer<typeof clientMsg>

export const ERROR_CODES = [
	"BAD_MESSAGE",
	"UNKNOWN_GAME",
	"ROOM_NOT_FOUND",
	"ROOM_FULL",
	"ALREADY_IN_ROOM",
	"NOT_IN_GAME",
	"CANNOT_START",
	"NOT_YOUR_TURN",
	"ILLEGAL_MOVE",
	"SERVER_FULL",
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

const stateMsg = z
	.object({
		t: z.literal("state"),
		code: roomCode,
		game: z.string(),
		/** The receiver's seat. */
		seat: z.number().int(),
		/** Indexed by seat. Seat 0 is the host. Grows as mages join, until the game starts. */
		names: z.array(z.string()),
		/** The receiver's view of the game. Null until the game starts. */
		view: z.unknown(),
		toAct: z.array(z.number().int()),
		outcome: z
			.object({ winners: z.array(z.number().int()) })
			.strict()
			.nullable(),
		/** Seats that asked for a rematch. */
		rematch: z.array(z.number().int()),
		/** Someone disconnected mid-game. The room is dead. */
		abandoned: z.boolean(),
		chat: z.array(chatEntry).max(CHAT_HISTORY),
		clock: z
			.object({
				startedAt: z.number(),
				roundStartedAt: z.number(),
				turnStartedAt: z.number(),
				round: z.string(),
				endedAt: z.number().nullable(),
			})
			.strict()
			.nullable(),
		serverNow: z.number(),
		activity: z
			.array(
				z
					.object({
						number: z.number().int(),
						seat: z.number().int(),
						round: z.string(),
						at: z.number(),
						details: z.array(z.string()),
					})
					.strict(),
			)
			.max(ACTION_HISTORY),
	})
	.strict()
export type StateMsg = z.infer<typeof stateMsg>

const errorMsg = z.object({ t: z.literal("error"), code: z.enum(ERROR_CODES), message: z.string() }).strict()

/** The server sends a full snapshot on every change. Clients render the latest one and keep no history. */
export const serverMsg = z.discriminatedUnion("t", [stateMsg, errorMsg])
export type ServerMsg = z.infer<typeof serverMsg>
