import { createHash, randomUUID } from "node:crypto"
import { z } from "zod"
import { createLobby, type LobbySnapshot } from "./lobby.js"
import type { Redis } from "./redis.js"
import { serverMsg, type ServerMsg, type StateMsg } from "../shared/protocol.js"

const ID = z.uuid()
const EXPIRES_MS = 2 * 60 * 60 * 1000
const WORLD_KEY = "coven:rooms:v1"
const MAX_BYTES = 4_000_000
const MAX_REQUESTS = 4096
const CAS = `
local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
return 1
`
const roomSchema = z
	.object({
		chat: z.array(z.object({ name: z.string(), text: z.string() }).strict()).max(30),
		code: z.string().regex(/^[A-Z]{4}$/),
		game: z.string(),
		open: z.boolean(),
		seats: z
			.array(z.object({ id: z.string().regex(/^[a-f0-9]{64}$/), name: z.string(), active: z.boolean() }).strict())
			.max(5),
		live: z
			.object({
				state: z.unknown(),
				clock: z
					.object({
						startedAt: z.number(),
						roundStartedAt: z.number(),
						turnStartedAt: z.number(),
						round: z.string(),
						endedAt: z.number().nullable(),
					})
					.strict(),
				activity: z.array(
					z.array(
						z
							.object({
								number: z.number(),
								seat: z.number(),
								round: z.string(),
								at: z.number(),
								details: z.array(z.string()),
							})
							.strict(),
					),
				),
				moves: z.number(),
			})
			.strict()
			.nullable(),
		rematch: z.array(z.number().int().min(0).max(4)).max(5),
		abandoned: z.boolean(),
		touchedAt: z.number(),
	})
	.strict()
const receipt = z.object({ id: ID, hash: z.string(), error: serverMsg.optional() }).strict()
const stored = z
	.object({
		rooms: z.array(roomSchema).max(500),
		requests: z.record(z.string(), z.array(receipt).max(MAX_REQUESTS)),
		closed: z.record(z.string(), z.number()).refine((entries) => Object.keys(entries).length <= 10000),
	})
	.strict()
type World = z.infer<typeof stored>
const digest = (value: string) => createHash("sha256").update(value).digest("hex")
const failure = (code: "SERVER_FULL" | "BAD_MESSAGE" | "ROOM_NOT_FOUND", message: string): ServerMsg => ({
	t: "error",
	code,
	message,
})

/** One atomic world keeps matchmaking and moves ordered. Split by room if the 100-table ceiling becomes restrictive. */
export function distributedLobby(redis: Redis, now: () => number = Date.now) {
	function decode(raw: string | null): World {
		const world = raw === null ? { rooms: [], requests: {}, closed: {} } : stored.parse(JSON.parse(raw))
		for (const id of Object.keys(world.closed)) if (now() - world.closed[id] >= EXPIRES_MS) delete world.closed[id]
		world.rooms = world.rooms.filter((room) => now() - room.touchedAt < EXPIRES_MS)
		const active = new Set(
			world.rooms.flatMap((room) => room.seats.filter((seat) => seat.active).map((seat) => seat.id)),
		)
		for (const id of Object.keys(world.requests)) if (!active.has(id)) delete world.requests[id]
		return world
	}
	async function read() {
		const raw = await redis.command<string | null>(["GET", WORLD_KEY])
		if (raw !== null && (typeof raw !== "string" || Buffer.byteLength(raw) > MAX_BYTES))
			throw new Error("Stored lobby exceeds its supported size")
		return { raw, world: decode(raw) }
	}
	async function receive(token: string, rawMessage: string, requestId: string = randomUUID()): Promise<ServerMsg[]> {
		if (!ID.safeParse(token).success || !ID.safeParse(requestId).success || Buffer.byteLength(rawMessage) > 2048)
			return [failure("BAD_MESSAGE", "Expected session and request UUIDs and a message within 2048 bytes.")]
		const player = digest(token.toLowerCase()),
			hash = digest(rawMessage)
		for (let attempt = 0; attempt < 12; attempt++) {
			const { raw, world } = await read()
			const lobby = createLobby(Math.random, now, world as LobbySnapshot)
			const existing = world.requests[player]?.find((request) => request.id === requestId)
			if (existing) {
				if (existing.hash !== hash)
					return [failure("BAD_MESSAGE", "This request ID was already used for a different action.")]
				const state = lobby.state(player)
				return existing.error ? [existing.error] : state ? [state] : []
			}
			let message: unknown
			try {
				message = JSON.parse(rawMessage)
			} catch {
				return [failure("BAD_MESSAGE", "Message is not JSON.")]
			}
			const control = z
				.object({ t: z.enum(["resume", "leave"]) })
				.strict()
				.safeParse(message)
			const leaving = control.success && control.data.t === "leave"
			if (player in world.closed)
				return leaving ? [] : [failure("ROOM_NOT_FOUND", "This session has left its table. Create a new session.")]
			if (!leaving && (world.requests[player]?.length ?? 0) >= MAX_REQUESTS)
				return [
					failure("SERVER_FULL", "This session reached its action limit. Leave the table and create a new session."),
				]
			const inbox: ServerMsg[] = []
			const connection = lobby.connect((msg) => inbox.push(msg), player)
			if (control.success) {
				if (control.data.t === "leave") {
					if (!lobby.state(player)) return []
					connection.close()
					world.closed[player] = now()
				} else {
					const state = lobby.state(player)
					if (state) inbox.push(state)
					else inbox.push(failure("ROOM_NOT_FOUND", "This session no longer has a room. Join a new table."))
				}
			} else {
				if (
					typeof message === "object" &&
					message &&
					"t" in message &&
					((lobby.roomCount() >= 100 && ["create", "quick"].includes(String(message.t))) ||
						(Object.keys(world.closed).length >= 9000 && ["create", "quick", "join"].includes(String(message.t))))
				)
					return [failure("SERVER_FULL", "The grove is full. Try again later.")]
				connection.receive(rawMessage)
			}
			const snapshot = lobby.snapshot()
			const error = inbox.find((msg) => msg.t === "error")
			const requests = {
				...world.requests,
				[player]: [...(world.requests[player] ?? []), { id: requestId, hash, ...(error ? { error } : {}) }],
			}
			// Failed joins must not fill storage with unseated anonymous session records.
			if (!snapshot.rooms.some((room) => room.seats.some((seat) => seat.id === player && seat.active)))
				delete requests[player]
			const next = JSON.stringify({ ...snapshot, requests, closed: world.closed })
			if (snapshot.rooms.length > 500 || Buffer.byteLength(next) > MAX_BYTES - (leaving ? 0 : 100_000))
				return [failure("SERVER_FULL", "The grove reached its storage limit. Try again later.")]
			if ((await redis.eval<number>(CAS, [WORLD_KEY], [raw ?? "", next, EXPIRES_MS])) === 1) return inbox
		}
		return [failure("SERVER_FULL", "The table is busy. Try the action again.")]
	}
	return {
		receive,
		poll: async (token: string): Promise<StateMsg | null> => {
			if (!ID.safeParse(token).success) throw new Error("Expected a session UUID")
			const { world } = await read()
			const msg = createLobby(Math.random, now, world as LobbySnapshot).state(digest(token.toLowerCase()))
			return msg?.t === "state" ? msg : null
		},
		leave: async (token: string, requestId: string = randomUUID()): Promise<void> => {
			await receive(token, JSON.stringify({ t: "leave" }), requestId)
		},
	}
}
