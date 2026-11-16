import { type AnyGame, IllegalMove, type Rng } from "../shared/game"
import { games } from "../shared/games"
import { CHAT_HISTORY, type ChatEntry, type ErrorCode, type ServerMsg, clientMsg } from "../shared/protocol"

import {
	ACTION_HISTORY,
	actionEntry,
	advanceClock,
	startClock,
	type TableClock,
	type ActionEntry,
} from "../shared/tableSession"

// Rooms and matchmaking. Knows nothing about sockets: a connection is a `send` callback going out
// and raw strings coming in, so the whole thing can be driven from a test.

const MAX_ROOMS = 500
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ" // no I or O, they read as 1 and 0
const online = games.filter((g) => g.players.max >= 2)

interface Player {
	send: (msg: ServerMsg) => void
	name: string
	room: Room | null
}

interface Room {
	chat: ChatEntry[]
	code: string
	game: AnyGame
	/** Open rooms are filled by quick match. Private ones need the code. */
	open: boolean
	/**
	 * Index is the seat, seat 0 is the host. Before the game starts a leaver is removed and seats close up.
	 * After it starts a leaver stays listed, so everyone else keeps their seat number.
	 */
	seats: Player[]
	/** Null until the game starts. */
	live: { state: unknown; clock: TableClock; activity: ActionEntry[][]; moves: number } | null
	rematch: Set<Player>
	abandoned: boolean
}

export interface Connection {
	receive(raw: string): void
	close(): void
}

export function createLobby(rng: Rng = Math.random, now: () => number = Date.now) {
	const rooms = new Map<string, Room>()

	function newCode(): string {
		for (;;) {
			const code = Array.from({ length: 4 }, () => CODE_LETTERS[Math.floor(rng() * CODE_LETTERS.length)]).join("")
			if (!rooms.has(code)) return code
		}
	}

	function broadcast(room: Room) {
		room.seats.forEach((player, seat) => {
			// A player who left has room set to null and no socket worth writing to.
			if (player.room !== room) return
			const state = room.live?.state
			player.send({
				t: "state",
				code: room.code,
				game: room.game.id,
				seat,
				names: room.seats.map((p) => p.name),
				view: room.live ? room.game.view(state, seat) : null,
				toAct: room.live && !room.abandoned ? room.game.toAct(state) : [],
				outcome: room.live ? room.game.outcome(state) : null,
				rematch: room.seats.flatMap((p, i) => (room.rematch.has(p) ? [i] : [])),
				abandoned: room.abandoned,
				chat: room.chat,
				clock: room.live?.clock ?? null,
				serverNow: now(),
				activity: room.live?.activity[seat] ?? [],
			})
		})
	}

	function start(room: Room) {
		const state = room.game.setup(rng, room.seats.length)
		room.live = { state, clock: startClock(room.game, state, now()), activity: room.seats.map(() => []), moves: 0 }
		broadcast(room)
	}

	function seat(player: Player, room: Room) {
		player.room = room
		room.seats.push(player)
		// A full table starts by itself. A partial one waits for the host.
		if (room.seats.length === room.game.players.max) start(room)
		else broadcast(room)
	}

	function connect(send: Player["send"]): Connection {
		const player: Player = { send, name: "", room: null }
		const fail = (code: ErrorCode, message: string) => send({ t: "error", code, message })

		function open(gameId: string, isOpen: boolean) {
			const game = online.find((g) => g.id === gameId)
			if (!game) return fail("UNKNOWN_GAME", `No such online game. Known: ${online.map((g) => g.id).join(", ")}.`)
			if (rooms.size >= MAX_ROOMS) return fail("SERVER_FULL", "The grove is full. Try again in a minute.")
			const room: Room = {
				chat: [],
				code: newCode(),
				game,
				open: isOpen,
				seats: [],
				live: null,
				rematch: new Set(),
				abandoned: false,
			}
			rooms.set(room.code, room)
			seat(player, room)
		}

		function receive(raw: string) {
			let json: unknown
			try {
				json = JSON.parse(raw)
			} catch {
				return fail("BAD_MESSAGE", "Message is not JSON.")
			}
			const parsed = clientMsg.safeParse(json)
			if (!parsed.success) return fail("BAD_MESSAGE", "Message does not match the protocol.")
			const msg = parsed.data
			const room = player.room

			switch (msg.t) {
				case "chat": {
					if (!room?.live || room.abandoned)
						return fail("NOT_IN_GAME", "Join an active table before sending a message.")
					room.chat = [...room.chat, { name: player.name, text: msg.text }].slice(-CHAT_HISTORY)
					return broadcast(room)
				}
				case "quick":
				case "create":
				case "join": {
					if (room) return fail("ALREADY_IN_ROOM", "You are already in a room.")
					player.name = msg.name
					if (msg.t === "create") return open(msg.game, false)
					if (msg.t === "quick") {
						const waiting = [...rooms.values()].find((r) => r.open && r.game.id === msg.game && !r.live)
						return waiting ? seat(player, waiting) : open(msg.game, true)
					}
					const target = rooms.get(msg.code)
					if (!target) return fail("ROOM_NOT_FOUND", `No room with code ${msg.code}.`)
					if (target.live) return fail("ROOM_FULL", "That game has already started.")
					return seat(player, target)
				}
				case "start": {
					if (!room || room.live) return fail("CANNOT_START", "There is no table waiting to start.")
					if (room.seats[0] !== player) return fail("CANNOT_START", "Only the host can start the game.")
					const { min } = room.game.players
					if (room.seats.length < min) return fail("CANNOT_START", `${room.game.name} needs at least ${min} mages.`)
					return start(room)
				}
				case "move": {
					if (!room?.live || room.abandoned) return fail("NOT_IN_GAME", "There is no game in progress.")
					const me = room.seats.indexOf(player)
					if (!room.game.toAct(room.live.state).includes(me)) return fail("NOT_YOUR_TURN", "It is not your turn.")
					try {
						const before = room.live.state
						const state = room.game.apply(before, me, room.game.parseMove(msg.move))
						const at = now()
						const moves = room.live.moves + 1
						room.live = {
							state,
							moves,
							clock: advanceClock(room.game, before, state, room.live.clock, at),
							activity: room.live.activity.map((entries, receiver) =>
								[...entries, actionEntry(room.game, before, state, me, receiver, moves, at)].slice(-ACTION_HISTORY),
							),
						}
					} catch (e) {
						// Anything else is a bug in a game and should crash loudly, not reach a player as a string.
						if (!(e instanceof IllegalMove)) throw e
						return fail("ILLEGAL_MOVE", e.message)
					}
					return broadcast(room)
				}
				case "rematch": {
					if (!room?.live || room.abandoned || !room.game.outcome(room.live.state)) {
						return fail("NOT_IN_GAME", "There is no finished game to replay.")
					}
					room.rematch.add(player)
					if (room.rematch.size < room.seats.length) return broadcast(room)
					// Everyone shifts down a seat so a different mage opens this time.
					room.seats.push(room.seats.shift()!)
					room.rematch.clear()
					return start(room)
				}
				default: {
					const unknown: never = msg
					return unknown
				}
			}
		}

		function close() {
			const room = player.room
			if (!room) return
			player.room = null
			if (!room.live) {
				// Still gathering: the others keep waiting, and the next mage in line becomes host.
				room.seats.splice(room.seats.indexOf(player), 1)
				if (room.seats.length === 0) rooms.delete(room.code)
				return broadcast(room)
			}
			// ponytail: no reconnect. A socket dropped mid-game ends the room for everyone.
			// Add session tokens and a grace period when it hurts.
			rooms.delete(room.code)
			room.abandoned = true
			if (room.live) room.live.clock = { ...room.live.clock, endedAt: room.live.clock.endedAt ?? now() }
			broadcast(room)
		}

		return { receive, close }
	}

	return { connect, roomCount: () => rooms.size }
}
