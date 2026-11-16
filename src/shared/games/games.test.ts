import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../game"
import { games } from "./index"
import { SIZE, knightsTour, openTargets } from "./knightsTour"
import { lastCandle } from "./lastCandle"
import { type LiarsBonesState, liarsBones } from "./liarsBones"
import { ROUNDS, loneSpark } from "./loneSpark"
import { CARDS, mindAuction } from "./mindAuction"
import { TRIES, grade, runeCipher } from "./runeCipher"
import { ROWS, runeDrop } from "./runeDrop"
import { turncoat } from "./turncoat"

const seeded = seededRng

describe("every game with rivals", () => {
	const tables = games
		.filter((g) => g.players.max >= 2)
		.flatMap((g) => [...new Set([g.players.min, g.players.max])].map((n) => [g.id, n, g] as const))

	it.each(tables)("%s with %i: bots play legal moves to a finish", (_, players, game) => {
		for (let seed = 1; seed <= 5; seed++) {
			const rng = seeded(seed)
			let state = game.setup(rng, players)
			for (let moves = 0; game.toAct(state).length > 0; moves++) {
				expect(moves).toBeLessThan(1000)
				const seat = game.toAct(state)[0]!
				// Round-trips through parseMove so a bot cannot emit something a client could not send.
				state = game.apply(state, seat, game.parseMove(game.bot!(game.view(state, seat), seat, rng)))
			}
			const outcome = game.outcome(state)!
			expect(outcome.winners.every((w) => w >= 0 && w < players)).toBe(true)
		}
	})
})

describe("rune drop", () => {
	const drop = (cols: number[]) =>
		cols.reduce((s, col) => runeDrop.apply(s, s.turn, { col }), runeDrop.setup(Math.random, 2))

	it("gives the game to four in a column", () => {
		expect(runeDrop.outcome(drop([0, 1, 0, 1, 0, 1, 0]))).toEqual({ winners: [0] })
	})
	it("rejects a full column", () => {
		const full = drop(Array<number>(ROWS).fill(3))
		expect(() => runeDrop.apply(full, full.turn, { col: 3 })).toThrow(IllegalMove)
	})
	it("rejects a move out of turn", () => {
		expect(() => runeDrop.apply(runeDrop.setup(Math.random, 2), 1, { col: 0 })).toThrow(IllegalMove)
	})
	it("rejects a move after the game is won", () => {
		expect(() => runeDrop.apply(drop([0, 1, 0, 1, 0, 1, 0]), 1, { col: 5 })).toThrow(IllegalMove)
	})
	it("rejects malformed moves", () => {
		expect(() => runeDrop.parseMove({ col: 7 })).toThrow(IllegalMove)
		expect(() => runeDrop.parseMove({ col: 1, extra: true })).toThrow(IllegalMove)
	})
})

describe("turncoat", () => {
	it("flips the trapped disc", () => {
		const s = turncoat.apply(turncoat.setup(Math.random, 2), 0, { cell: 26 })
		expect(s.cells[27]).toBe(0)
		expect(s.turn).toBe(1)
	})
	it("rejects a disc that traps nothing", () => {
		expect(() => turncoat.apply(turncoat.setup(Math.random, 2), 0, { cell: 0 })).toThrow(IllegalMove)
	})
	it("skips a side with no move and ends when neither has one", () => {
		// Seat 0 takes the only rival disc: seat 1 has nothing left to play, and neither does seat 0.
		const cells = Array<number | null>(64).fill(null)
		cells[0] = 0
		cells[1] = 1
		const s = turncoat.apply({ cells, turn: 0, last: null }, 0, { cell: 2 })
		expect(s.turn).toBeNull()
		expect(turncoat.outcome(s)).toEqual({ winners: [0] })
	})
})

describe("mind auction", () => {
	const fresh = () => ({ ...mindAuction.setup(seeded(7), 2), deck: [5, 3, 1, 2, 4, 6, 7, 8] })

	it("hides the rival's sealed bid and the deck order", () => {
		const s = mindAuction.apply(fresh(), 0, { card: 8 })
		const rival = mindAuction.view(s, 1)
		expect(rival.sealed).toEqual([true, false])
		expect(JSON.stringify(rival)).not.toContain('"deck"')
		expect(JSON.stringify(rival)).not.toContain('"bids":[8')
		expect(rival.myBid).toBeNull()
	})
	it("pays the prize to the higher card", () => {
		const s = mindAuction.apply(mindAuction.apply(fresh(), 0, { card: 8 }), 1, { card: 2 })
		expect(s.scores).toEqual([5, 0])
		expect(s.hands[0]).not.toContain(8)
	})
	it("rolls a tied prize into the next round", () => {
		let s = mindAuction.apply(mindAuction.apply(fresh(), 0, { card: 4 }), 1, { card: 4 })
		expect(s.scores).toEqual([0, 0])
		s = mindAuction.apply(mindAuction.apply(s, 1, { card: 7 }), 0, { card: 1 })
		expect(s.scores).toEqual([0, 5 + 3])
	})
	it("rolls the prize over when the top bids tie at a bigger table", () => {
		let s = { ...mindAuction.setup(seeded(7), 3), deck: [5, 3, 1, 2, 4, 6, 7, 8] }
		for (const [seat, card] of [
			[0, 8],
			[1, 8],
			[2, 2],
		] as const)
			s = mindAuction.apply(s, seat, { card })
		expect(s.scores).toEqual([0, 0, 0])
		expect(s.pot).toBe(5)
	})
	it("rejects a second bid and a spent card", () => {
		const s = mindAuction.apply(fresh(), 0, { card: 8 })
		expect(() => mindAuction.apply(s, 0, { card: 7 })).toThrow(IllegalMove)
		const next = mindAuction.apply(s, 1, { card: 1 })
		expect(() => mindAuction.apply(next, 0, { card: 8 })).toThrow(IllegalMove)
		expect(() => mindAuction.parseMove({ card: CARDS + 1 })).toThrow(IllegalMove)
	})
})

describe("last candle", () => {
	const s = { players: 2, start: [2, 1], rows: [2, 1], turn: 0 }

	it("never deals a start the opener cannot win", () => {
		for (let seed = 1; seed <= 50; seed++) {
			expect(lastCandle.setup(seeded(seed), 2).rows.reduce((a, b) => a ^ b, 0)).not.toBe(0)
		}
	})
	it("gives the game to whoever snuffs the last candle", () => {
		const end = lastCandle.apply(lastCandle.apply(s, 0, { row: 0, take: 2 }), 1, { row: 1, take: 1 })
		expect(lastCandle.outcome(end)).toEqual({ winners: [1] })
	})
	it("passes the turn around a bigger table and credits the right seat", () => {
		const three = { players: 3, start: [1, 1, 1], rows: [1, 1, 1], turn: 0 }
		const end = [0, 1, 2].reduce((t, row) => lastCandle.apply(t, t.turn, { row, take: 1 }), three)
		expect(lastCandle.outcome(end)).toEqual({ winners: [2] })
	})
	it("rejects taking more than the row holds, and a row that does not exist", () => {
		expect(() => lastCandle.apply(s, 0, { row: 1, take: 2 })).toThrow(IllegalMove)
		expect(() => lastCandle.apply(s, 0, { row: 9, take: 1 })).toThrow(IllegalMove)
		expect(() => lastCandle.parseMove({ row: 0, take: 0 })).toThrow(IllegalMove)
	})
})

describe("liar's bones", () => {
	const table = (bones: number[][]): LiarsBonesState => ({ seed: 1, bones, turn: 0, bid: null, reveal: null })

	it("takes a bone from the bidder when the call is right", () => {
		let s = liarsBones.apply(
			table([
				[2, 3],
				[4, 5],
			]),
			0,
			{ type: "bid", count: 2, face: 6 },
		)
		s = liarsBones.apply(s, 1, { type: "call" })
		expect(s.bones.map((b) => b.length)).toEqual([1, 2])
		expect(s.reveal).toMatchObject({
			loser: 0,
			actual: 0,
			bones: [
				[2, 3],
				[4, 5],
			],
		})
		expect(s.turn).toBe(0)
	})
	it("takes a bone from the caller when the bid holds, and ends on the last bone", () => {
		let s = liarsBones.apply(table([[6, 6], [6]]), 0, { type: "bid", count: 3, face: 6 })
		s = liarsBones.apply(s, 1, { type: "call" })
		expect(liarsBones.outcome(s)).toEqual({ winners: [0] })
	})
	it("shows a mage their own bones only, and never the seed", () => {
		const view = liarsBones.view(
			table([
				[1, 2],
				[3, 4],
				[5, 6],
			]),
			1,
		)
		expect(view.myBones).toEqual([3, 4])
		expect(JSON.stringify(view)).not.toContain("seed")
		expect(JSON.stringify(view)).not.toContain("[1,2]")
	})
	it("rejects a bid that does not raise, an impossible count, and a call with no bid", () => {
		const s = liarsBones.apply(
			table([
				[1, 2],
				[3, 4],
			]),
			0,
			{ type: "bid", count: 2, face: 3 },
		)
		expect(() => liarsBones.apply(s, 1, { type: "bid", count: 2, face: 3 })).toThrow(IllegalMove)
		expect(() => liarsBones.apply(s, 1, { type: "bid", count: 5, face: 1 })).toThrow(IllegalMove)
		expect(() => liarsBones.apply(table([[1], [2]]), 0, { type: "call" })).toThrow(IllegalMove)
		expect(() => liarsBones.parseMove({ type: "bid", count: 1, face: 7 })).toThrow(IllegalMove)
	})
})

describe("lone spark", () => {
	const round = (picks: number[]) =>
		picks.reduce((s, spark, seat) => loneSpark.apply(s, seat, { spark }), loneSpark.setup(Math.random, picks.length))

	it("scores the lowest spark nobody else picked", () => {
		expect(round([1, 1, 3, 2]).scores).toEqual([0, 0, 0, 2])
	})
	it("scores nobody when every spark fizzles", () => {
		const s = round([2, 2, 2])
		expect(s.scores).toEqual([0, 0, 0])
		expect(s.history[0]!.winner).toBeNull()
	})
	it("hides picks until the round is complete", () => {
		const s = loneSpark.apply(loneSpark.setup(Math.random, 3), 0, { spark: 4 })
		expect(loneSpark.view(s, 1)).toMatchObject({ myPick: null, picked: [true, false, false] })
		expect(JSON.stringify(loneSpark.view(s, 1))).not.toContain("4")
	})
	it("ends after the last round and rejects a second pick", () => {
		let s = loneSpark.setup(Math.random, 3)
		expect(() => loneSpark.apply(loneSpark.apply(s, 0, { spark: 1 }), 0, { spark: 2 })).toThrow(IllegalMove)
		for (let i = 0; i < ROUNDS; i++) for (const seat of [0, 1, 2]) s = loneSpark.apply(s, seat, { spark: seat + 1 })
		expect(loneSpark.outcome(s)).toEqual({ winners: [0] })
		expect(() => loneSpark.apply(s, 0, { spark: 1 })).toThrow(IllegalMove)
	})
})

describe("knight's tour", () => {
	it("rejects a square the knight cannot reach, and a revisit", () => {
		const s = knightsTour.apply(knightsTour.setup(Math.random, 1), 0, { type: "go", cell: 0 })
		expect(() => knightsTour.apply(s, 0, { type: "go", cell: 1 })).toThrow(IllegalMove)
		const there = knightsTour.apply(s, 0, { type: "go", cell: 8 })
		expect(openTargets(there.path)).not.toContain(0)
	})
	it("undoes a step and rejects undo on an empty board", () => {
		const s = knightsTour.apply(knightsTour.setup(Math.random, 1), 0, { type: "go", cell: 0 })
		expect(knightsTour.apply(s, 0, { type: "undo" }).path).toEqual([])
		expect(() => knightsTour.apply(knightsTour.setup(Math.random, 1), 0, { type: "undo" })).toThrow(IllegalMove)
	})
	it("is won by a full tour, so the puzzle is solvable", () => {
		// Depth-first with Warnsdorff ordering: try the square with the fewest onward moves first.
		const solve = (path: number[]): number[] | null => {
			if (path.length === SIZE * SIZE) return path
			const next = openTargets(path).sort((a, b) => openTargets([...path, a]).length - openTargets([...path, b]).length)
			for (const cell of next) {
				const found = solve([...path, cell])
				if (found) return found
			}
			return null
		}
		const tour = solve([0])!
		const end = tour.reduce(
			(s, cell) => knightsTour.apply(s, 0, { type: "go", cell }),
			knightsTour.setup(Math.random, 1),
		)
		expect(knightsTour.outcome(end)).toEqual({ winners: [0] })
	})
})

describe("rune cipher", () => {
	it("grades repeated runes without double counting", () => {
		expect(grade([0, 0, 1, 2], [0, 1, 0, 3])).toEqual({ exact: 1, near: 2 })
		expect(grade([0, 0, 1, 2], [0, 0, 0, 0])).toEqual({ exact: 2, near: 0 })
	})
	it("keeps the secret out of the view until the puzzle ends", () => {
		const s = { secret: [1, 2, 3, 4], guesses: [] }
		expect(runeCipher.view(s, 0).secret).toBeNull()
		const solved = runeCipher.apply(s, 0, { code: [1, 2, 3, 4] })
		expect(runeCipher.outcome(solved)).toEqual({ winners: [0] })
		expect(runeCipher.view(solved, 0).secret).toEqual([1, 2, 3, 4])
	})
	it("is lost after the last wrong cast, and takes no more", () => {
		let s = { secret: [1, 2, 3, 4], guesses: [] } as ReturnType<typeof runeCipher.setup>
		for (let i = 0; i < TRIES; i++) s = runeCipher.apply(s, 0, { code: [0, 0, 0, 0] })
		expect(runeCipher.outcome(s)).toEqual({ winners: [] })
		expect(() => runeCipher.apply(s, 0, { code: [1, 2, 3, 4] })).toThrow(IllegalMove)
	})
	it("rejects a code of the wrong length or an unknown rune", () => {
		expect(() => runeCipher.parseMove({ code: [1, 2, 3] })).toThrow(IllegalMove)
		expect(() => runeCipher.parseMove({ code: [1, 2, 3, 6] })).toThrow(IllegalMove)
	})
})
