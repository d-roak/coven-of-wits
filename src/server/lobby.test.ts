import { describe, expect, it } from "vitest"
import { seededRng } from "../shared/game"
import { findGame, games } from "../shared/games"
import { type EquationHiLoView, equationHiLo } from "../shared/games/equationHiLo"
import type { ClientMsg, ErrorCode, ServerMsg, StateMsg } from "../shared/protocol"
import { createLobby } from "./lobby"
import { CHAT_HISTORY, CHAT_MAX, serverMsg } from "../shared/protocol"

function join(lobby: ReturnType<typeof createLobby>, first: ClientMsg) {
	const inbox: ServerMsg[] = []
	const connection = lobby.connect((msg) => inbox.push(msg))
	const say = (msg: ClientMsg) => connection.receive(JSON.stringify(msg))
	say(first)
	return {
		say,
		raw: connection.receive,
		close: connection.close,
		last: () => inbox.at(-1)!,
		state: () => inbox.findLast((m): m is StateMsg => m.t === "state")!,
		error: (): ErrorCode | null => {
			const m = inbox.at(-1)!
			return m.t === "error" ? m.code : null
		},
	}
}

const quick = (name: string, game = "rune-drop"): ClientMsg => ({ t: "quick", game, name })

describe("lobby", () => {
	it("delivers attributed chat only to its active room and bounds history", () => {
		const lobby = createLobby()
		const a = join(lobby, { t: "create", game: "rune-drop", name: "Ash" })
		const b = join(lobby, { t: "join", code: a.state().code, name: "Bo" })
		const other = join(lobby, { t: "create", game: "rune-drop", name: "Cy" })
		for (let i = 0; i <= CHAT_HISTORY; i++) a.say({ t: "chat", text: String(i) })
		expect(b.state().chat).toHaveLength(CHAT_HISTORY)
		expect(b.state().chat[0]).toEqual({ name: "Ash", text: "1" })
		expect(other.state().chat).toEqual([])
		expect(serverMsg.safeParse(b.state()).success).toBe(true)
	})
	it("rejects chat outside an active room and malformed or forged messages", () => {
		const lobby = createLobby()
		const a = join(lobby, { t: "create", game: "rune-drop", name: "Ash" })
		a.say({ t: "chat", text: "Hello" })
		expect(a.error()).toBe("NOT_IN_GAME")
		const b = join(lobby, { t: "join", code: a.state().code, name: "Bo" })
		for (const msg of [
			{ t: "chat", text: " " },
			{ t: "chat", text: "x".repeat(CHAT_MAX + 1) },
			{ t: "chat", text: "Hi", name: "Bo" },
		]) {
			a.raw(JSON.stringify(msg))
			expect(a.error()).toBe("BAD_MESSAGE")
		}
		expect(b.state().chat).toEqual([])
		b.close()
		a.say({ t: "chat", text: "Hello" })
		expect(a.error()).toBe("NOT_IN_GAME")
	})
	it.each([
		{ id: "nine-mens-morris", fresh: { cells: Array(24).fill(null), reserve: [9, 9], capture: false } },
		{ id: "equation-hi-lo", fresh: { round: 1, history: [], scores: [0, 0], myMove: null, sealed: [false, false] } },
	])("plays and rematches a private $id table through the protocol", ({ id, fresh }) => {
		const rng = seededRng(41)
		const lobby = createLobby(rng)
		const host = join(lobby, { t: "create", game: id, name: "Ash" })
		expect(host.state()).toMatchObject({ game: id, names: ["Ash"], view: null })
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		const players = [host, guest]
		const game = findGame(id)!
		if (host.state().view === null) host.say({ t: "start" })
		expect(host.state().view).toMatchObject(fresh)
		expect(guest.state()).toMatchObject({ game: id, names: ["Ash", "Bo"], seat: 1 })

		const beforeIllegal = players.map((player) => player.state())
		host.say({ t: "move", move: {} })
		expect(host.error()).toBe("ILLEGAL_MOVE")
		expect(players.map((player) => player.state())).toEqual(beforeIllegal)

		const firstMove = game.bot!(host.state().view, 0, rng)
		host.say({ t: "move", move: firstMove })
		expect(host.error()).toBeNull()
		const beforeRepeat = players.map((player) => player.state())
		host.say({ t: "move", move: firstMove })
		expect(host.error()).toBe("NOT_YOUR_TURN")
		expect(players.map((player) => player.state())).toEqual(beforeRepeat)

		for (let moves = 1; host.state().outcome === null; moves++) {
			expect(moves).toBeLessThan(1000)
			const seat = host.state().toAct[0]!
			const player = players[seat]!
			player.say({ t: "move", move: game.bot!(player.state().view, seat, rng) })
			expect(player.error()).toBeNull()
		}
		expect(guest.state().outcome).toEqual(host.state().outcome)
		host.say({ t: "rematch" })
		expect(guest.state().rematch).toEqual([0])
		guest.say({ t: "rematch" })
		expect(host.state()).toMatchObject({ seat: 1, names: ["Bo", "Ash"], outcome: null, rematch: [] })
		expect(guest.state()).toMatchObject({ seat: 0, outcome: null, rematch: [] })
		expect(host.state().view).toMatchObject(fresh)
	})

	it("sends only each mage's equation hand and reveals sealed choices together", () => {
		const rng = seededRng(77)
		const lobby = createLobby(rng)
		const host = join(lobby, { t: "create", game: equationHiLo.id, name: "Ash" })
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		host.say({ t: "start" })
		const hostView = host.state().view as EquationHiLoView
		const guestView = guest.state().view as EquationHiLoView
		for (const view of [hostView, guestView]) {
			// Exact wire fields make a newly exposed server-only field fail this check.
			expect(view).toEqual({
				hand: view.hand,
				round: 1,
				sealed: [false, false],
				myMove: null,
				scores: [0, 0],
				history: [],
			})
			expect(view.hand).toHaveLength(4)
		}
		const hostMove = equationHiLo.bot!(hostView, 0, rng)
		host.say({ t: "move", move: hostMove })
		expect(host.state().view).toEqual({ ...hostView, sealed: [true, false], myMove: hostMove })
		expect(guest.state().view).toEqual({ ...guestView, sealed: [true, false] })
		const guestMove = equationHiLo.bot!(guestView, 1, rng)
		guest.say({ t: "move", move: guestMove })
		const revealed = (guest.state().view as EquationHiLoView).history[0]!
		expect(revealed[0]).toMatchObject({
			numbers: hostMove.order.map((index) => hostView.hand[index]),
			operators: hostMove.operators,
			lane: hostMove.lane,
		})
		expect(revealed[1]).toMatchObject({
			numbers: guestMove.order.map((index) => guestView.hand[index]),
			operators: guestMove.operators,
			lane: guestMove.lane,
		})
		expect((host.state().view as EquationHiLoView).history).toEqual([revealed])
	})

	it("gathers a table, lets the host start it, and plays a whole game through the protocol", () => {
		const lobby = createLobby()
		const players = ["Ash", "Bo", "Cy"].map((name) => join(lobby, quick(name, "mind-auction")))
		const game = findGame("mind-auction")!

		expect(players[2]!.state()).toMatchObject({ names: ["Ash", "Bo", "Cy"], view: null })
		players[1]!.say({ t: "start" })
		expect(players[1]!.error()).toBe("CANNOT_START")
		players[0]!.say({ t: "start" })
		expect(players.map((p) => p.state().seat)).toEqual([0, 1, 2])
		expect(join(lobby, { t: "join", code: players[0]!.state().code, name: "Di" }).error()).toBe("ROOM_FULL")

		for (let moves = 0; players[0]!.state().outcome === null; moves++) {
			expect(moves).toBeLessThan(100)
			const seat = players[0]!.state().toAct[0]!
			// Each side moves from its own view only, exactly as a browser would.
			players[seat]!.say({ t: "move", move: game.bot!(players[seat]!.state().view, seat, Math.random) })
			expect(players[seat]!.error()).toBeNull()
		}
		expect(players[1]!.state().outcome).toEqual(players[0]!.state().outcome)
	})

	it("never sends a sealed bid to the rival", () => {
		const lobby = createLobby()
		const [a, b] = [join(lobby, quick("Ash", "mind-auction")), join(lobby, quick("Bo", "mind-auction"))]
		a.say({ t: "start" })
		a.say({ t: "move", move: { card: 8 } })
		expect(a.state().view).toMatchObject({ myBid: 8 })
		expect(b.state().view).toMatchObject({ myBid: null, sealed: [true, false] })
	})

	it("keeps private rooms out of quick match and lets the code holder in", () => {
		const lobby = createLobby()
		const host = join(lobby, { t: "create", game: "rune-drop", name: "Ash" })
		const stranger = join(lobby, quick("Cy"))
		expect(stranger.state().code).not.toBe(host.state().code)
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		expect(guest.state().names).toEqual(["Ash", "Bo"])
		expect(join(lobby, { t: "join", code: host.state().code, name: "Di" }).error()).toBe("ROOM_FULL")
	})

	it("starts by itself when the table is full, and refuses to start short", () => {
		const lobby = createLobby()
		const host = join(lobby, quick("Ash", "lone-spark"))
		join(lobby, quick("Bo", "lone-spark"))
		host.say({ t: "start" })
		expect(host.error()).toBe("CANNOT_START")
		for (const name of ["Cy", "Di", "Ed"]) join(lobby, quick(name, "lone-spark"))
		expect(host.state().view).not.toBeNull()
	})

	it("closes up the seats when someone leaves before the start", () => {
		const lobby = createLobby()
		const [a, b] = [join(lobby, quick("Ash", "lone-spark")), join(lobby, quick("Bo", "lone-spark"))]
		a.close()
		expect(b.state()).toMatchObject({ names: ["Bo"], seat: 0, abandoned: false })
		expect(lobby.roomCount()).toBe(1)
	})

	it("swaps seats when both ask for a rematch", () => {
		const lobby = createLobby()
		const [a, b] = [join(lobby, quick("Ash", "last-candle")), join(lobby, quick("Bo", "last-candle"))]
		a.say({ t: "start" })
		a.say({ t: "rematch" })
		expect(a.error()).toBe("NOT_IN_GAME")

		const game = findGame("last-candle")!
		const players = [a, b]
		while (a.state().outcome === null) {
			const seat = a.state().toAct[0]!
			players[seat]!.say({ t: "move", move: game.bot!(players[seat]!.state().view, seat, Math.random) })
		}
		a.say({ t: "rematch" })
		expect(b.state().rematch).toEqual([0])
		b.say({ t: "rematch" })
		expect(a.state()).toMatchObject({ seat: 1, outcome: null, rematch: [] })
	})

	it("tells the remaining player when the rival drops, and frees the room", () => {
		const lobby = createLobby()
		const [a, b] = [join(lobby, quick("Ash")), join(lobby, quick("Bo"))]
		b.close()
		expect(a.state()).toMatchObject({ abandoned: true, seat: 0, toAct: [] })
		expect(lobby.roomCount()).toBe(0)
		a.say({ t: "move", move: { col: 0 } })
		expect(a.error()).toBe("NOT_IN_GAME")
	})

	it("rejects what it should", () => {
		const lobby = createLobby()
		expect(join(lobby, { t: "join", code: "ZZZZ", name: "Ash" }).error()).toBe("ROOM_NOT_FOUND")
		// Solo puzzles have no rooms.
		expect(join(lobby, quick("Ash", "knights-tour")).error()).toBe("UNKNOWN_GAME")

		const [a, b] = [join(lobby, quick("Ash")), join(lobby, quick("Bo"))]
		b.say({ t: "move", move: { col: 0 } })
		expect(b.error()).toBe("NOT_YOUR_TURN")
		a.say({ t: "move", move: { col: 99 } })
		expect(a.error()).toBe("ILLEGAL_MOVE")
		a.say(quick("Ash"))
		expect(a.error()).toBe("ALREADY_IN_ROOM")
		a.raw("not json")
		expect(a.error()).toBe("BAD_MESSAGE")
		a.raw(JSON.stringify({ t: "rematch", sneaky: 1 }))
		expect(a.error()).toBe("BAD_MESSAGE")
		a.raw(JSON.stringify({ t: "quick", game: "rune-drop", name: "x".repeat(17) }))
		expect(a.error()).toBe("BAD_MESSAGE")
	})
})

describe("room clocks and private action history", () => {
	it("records accepted moves, preserves sealed-bid privacy, and resets only at the next auction", () => {
		let now = 1000
		const lobby = createLobby(seededRng(61), () => now)
		const host = join(lobby, { t: "create", game: "time-auction", name: "Ash" })
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		expect(host.state()).toMatchObject({ clock: null, activity: [] })
		host.say({ t: "start" })
		const initialClock = host.state().clock
		now = 2000
		host.say({ t: "move", move: { action: "bid", value: "61" } })
		expect(host.error()).toBe("ILLEGAL_MOVE")
		expect(guest.state().activity).toEqual([])
		expect(guest.state().clock).toEqual(initialClock)
		now = 3000
		host.say({ t: "move", move: { action: "bid", value: "47" } })
		expect(guest.state().activity).toEqual([{ number: 1, seat: 0, round: "1", at: 3000, details: [] }])
		expect(guest.state().clock).toEqual(initialClock)
		const sealed = guest.state()
		host.say({ t: "move", move: { action: "bid", value: "1" } })
		expect(host.error()).toBe("NOT_YOUR_TURN")
		expect(guest.state()).toEqual(sealed)
		now = 9000
		guest.say({ t: "move", move: { action: "bid", value: "0" } })
		expect(host.state().clock).toMatchObject({
			startedAt: 1000,
			roundStartedAt: 9000,
			turnStartedAt: 9000,
			round: "2",
			endedAt: null,
		})
		expect(host.state().activity).toHaveLength(2)
		expect(host.state().activity).toEqual(guest.state().activity)
		expect(host.state().activity[1].details.length).toBeGreaterThan(0)
		expect(serverMsg.safeParse(guest.state()).success).toBe(true)
	})

	it("freezes completed games, rejects postgame moves, and clears activity on unanimous rematch", () => {
		let now = 1000
		const rng = seededRng(62)
		const lobby = createLobby(rng, () => now)
		const host = join(lobby, { t: "create", game: "last-candle", name: "Ash" })
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		if (host.state().view === null) host.say({ t: "start" })
		const players = [host, guest]
		const game = findGame("last-candle")!
		while (!host.state().outcome) {
			now += 1000
			const seat = host.state().toAct[0]
			players[seat].say({ t: "move", move: game.bot!(players[seat].state().view, seat, rng) })
		}
		const finishedClock = host.state().clock
		const finishedHistory = host.state().activity
		expect(finishedClock?.endedAt).toBe(now)
		expect(finishedHistory.length).toBeGreaterThan(0)
		now += 60000
		host.say({ t: "move", move: {} })
		expect(host.error()).toBe("NOT_YOUR_TURN")
		host.say({ t: "chat", text: "Finished" })
		expect(guest.state().clock).toEqual(finishedClock)
		expect(guest.state().activity).toEqual(finishedHistory)
		host.say({ t: "rematch" })
		expect(guest.state().clock).toEqual(finishedClock)
		guest.say({ t: "rematch" })
		expect(host.state()).toMatchObject({
			activity: [],
			seat: 1,
			clock: { startedAt: now, roundStartedAt: now, turnStartedAt: now, endedAt: null },
		})
		expect(guest.state()).toMatchObject({ activity: [], seat: 0 })
	})

	it("freezes an abandoned room without adding a fabricated game action", () => {
		let now = 1000
		const lobby = createLobby(seededRng(63), () => now)
		const host = join(lobby, { t: "create", game: "rune-drop", name: "Ash" })
		const guest = join(lobby, { t: "join", code: host.state().code, name: "Bo" })
		now = 5000
		guest.close()
		expect(host.state()).toMatchObject({ abandoned: true, activity: [], clock: { startedAt: 1000, endedAt: 5000 } })
	})
})

it("round-trips every multiplayer engine through persistent snapshots while playing", () => {
	const rng = seededRng(914)
	for (const game of games.filter((game) => game.players.max >= 2)) {
		const count = game.players.min
		let lobby = createLobby(rng, () => 1000, { rooms: [] })
		const messages = new Map<string, StateMsg>()
		const ids = Array.from({ length: count }, (_, seat) => `seat-${seat}`)
		const reconnect = () =>
			ids.map((id) =>
				lobby.connect((msg) => {
					if (msg.t === "state") messages.set(id, msg)
				}, id),
			)
		let connections = reconnect()
		connections[0].receive(JSON.stringify({ t: "create", game: game.id, name: "Host" }))
		const code = messages.get(ids[0])!.code
		for (let seat = 1; seat < count; seat++)
			connections[seat].receive(JSON.stringify({ t: "join", code, name: `Player ${seat}` }))
		if (!messages.get(ids[0])!.view) connections[0].receive(JSON.stringify({ t: "start" }))
		for (let moves = 0; ; moves++) {
			const before = ids.map((id) => lobby.state(id))
			lobby = createLobby(rng, () => 1000, JSON.parse(JSON.stringify(lobby.snapshot())))
			expect(
				ids.map((id) => lobby.state(id)),
				game.id,
			).toEqual(before)
			connections = reconnect()
			const current = before[0]!
			if (current.t !== "state") throw new Error("Expected a table")
			if (current.outcome) break
			expect(moves, game.id).toBeLessThan(1800)
			const seat = current.toAct[0]
			const own = before[seat]!
			if (own.t !== "state") throw new Error("Expected player view")
			connections[seat].receive(JSON.stringify({ t: "move", move: game.bot!(own.view, seat, rng) }))
		}
	}
})
