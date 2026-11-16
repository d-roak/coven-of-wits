import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../../game"
import { seasonThreeCatalog, seasonThreeGames } from "./seasonThree"
import {
	countTheCubes,
	countTheRectangles,
	layTheGrass,
	memoryPoker,
	pokerRank,
	rectangleCount,
} from "./seasonThreePuzzles"
import { heavy13, mysteryStockMarket, russianRoulette } from "./seasonThreeStrategy"

const rng = () => seededRng(19)

describe("season 3 game contracts", () => {
	it.each(
		seasonThreeGames
			.filter((g) => g.players.max > 1)
			.flatMap((g) => [...new Set([g.players.min, g.players.max])].map((n) => [g.id, n, g] as const)),
	)("%s has legal, finite bots at %i seats", (_id, players, game) => {
		for (let seed = 1; seed <= 5; seed++) {
			const random = seededRng(seed)
			let state = game.setup(random, players)
			let moves = 0
			while (game.toAct(state).length) {
				expect(++moves).toBeLessThan(1000)
				const seat = game.toAct(state)[0]!
				const before = JSON.stringify(state)
				const move = game.parseMove(game.bot!(game.view(state, seat), seat, random))
				const next = game.apply(state, seat, move)
				const priorLog = (game.view(state, seat) as { log: string[] }).log
				const nextLog = (game.view(next, seat) as { log: string[] }).log
				expect(nextLog.slice(0, priorLog.length)).toEqual(priorLog)
				expect(JSON.stringify(state)).toBe(before)
				state = next
			}
			expect(game.outcome(state)).not.toBeNull()
			expect(game.outcome(state)!.winners.every((w) => w >= 0 && w < players)).toBe(true)
			expect(() => game.apply(state, 0, { action: "not-a-move", value: "" })).toThrow(IllegalMove)
		}
	})
	it.each(seasonThreeGames)("$id rejects extra protocol fields", (game) => {
		expect(() => game.parseMove({ action: "answer", value: "1", extra: true })).toThrow(IllegalMove)
	})
	it("catalog entries resolve to exactly the 8 playable engines", () => {
		expect(seasonThreeCatalog.map((c) => c.id).sort()).toEqual(seasonThreeGames.map((g) => g.id).sort())
		expect(new Set(seasonThreeGames.map((g) => g.id)).size).toBe(8)
	})
})

describe("counting trials", () => {
	it("rotation preserves a cube pile and 3 correct answers solve it", () => {
		let s = countTheCubes.setup(rng(), 1)
		const original = s.puzzles[0]!.cells
		for (let i = 0; i < 4; i++) s = countTheCubes.apply(s, 0, { action: "turn", value: "" })
		expect(s.puzzles[0]!.cells).toEqual(original)
		for (let i = 0; i < 3; i++)
			s = countTheCubes.apply(s, 0, {
				action: "answer",
				value: String(s.puzzles[s.round]!.cells.reduce((a, b) => a + b, 0)),
			})
		expect(countTheCubes.outcome(s)).toEqual({ winners: [0] })
		expect(() => countTheCubes.apply(s, 0, { action: "answer", value: "1" })).toThrow(IllegalMove)
	})
	it("includes overlapping, single-cell and all-blank rectangles", () => {
		expect(rectangleCount(Array<number>(16).fill(0), 0)).toBe(100)
		expect(rectangleCount(Array<number>(16).fill(1), 1)).toBe(16)
		expect(rectangleCount(Array<number>(16).fill(1), 2)).toBe(24)
	})
	it("accepts a calculated solution through all 3 generated rectangle boards", () => {
		let s = countTheRectangles.setup(rng(), 1)
		for (let i = 0; i < 3; i++) {
			const { cells, target } = s.puzzles[s.round]!
			s = countTheRectangles.apply(s, 0, { action: "answer", value: String(rectangleCount(cells, target)) })
		}
		expect(countTheRectangles.outcome(s)).toEqual({ winners: [0] })
	})
	it("wrong answers exhaust the trial without revealing future puzzles", () => {
		let s = countTheRectangles.setup(rng(), 1)
		const before = countTheRectangles.view(s, 0)
		const changed = { ...s, puzzles: s.puzzles.map((p, i) => (i ? { ...p, cells: Array<number>(16).fill(999) } : p)) }
		expect(countTheRectangles.view(changed, 0)).toEqual(before)
		for (let i = 0; i < 3; i++) s = countTheRectangles.apply(s, 0, { action: "answer", value: "9999" })
		expect(countTheRectangles.outcome(s)).toEqual({ winners: [] })
	})
	it("rejects a malformed count", () => {
		expect(() => countTheCubes.apply(countTheCubes.setup(rng(), 1), 0, { action: "answer", value: "2.5" })).toThrow(
			IllegalMove,
		)
	})
	it("rejects another seat and rotating a rectangle board", () => {
		const s = countTheRectangles.setup(rng(), 1)
		expect(() => countTheRectangles.apply(s, 1, { action: "answer", value: "1" })).toThrow(IllegalMove)
		expect(() => countTheRectangles.apply(s, 0, { action: "turn", value: "" })).toThrow(IllegalMove)
	})
})

describe("Memory Poker", () => {
	const choosing = () => {
		let s = memoryPoker.setup(rng(), 2)
		for (const seat of [0, 1]) s = memoryPoker.apply(s, seat, { action: "hide", value: "" })
		return s
	}
	it("keeps hidden cards, future boards, and other players' picks out of views", () => {
		let s = choosing()
		const before = memoryPoker.view(s, 1)
		const altered = { ...s, deals: s.deals.map((deal) => ({ ...deal, cards: [...deal.cards].reverse() })) }
		expect(memoryPoker.view(altered, 1)).toEqual(before)
		s = memoryPoker.apply(s, 0, { action: "pick", value: '["0","1"]' })
		expect(memoryPoker.view(s, 1)).toEqual(before)
	})
	it("seals cards only after everyone is ready, once per player", () => {
		const s = memoryPoker.setup(rng(), 2)
		expect(() => memoryPoker.apply(s, 0, { action: "pick", value: '["0","1"]' })).toThrow(IllegalMove)
		const hidden = memoryPoker.apply(s, 0, { action: "hide", value: "" })
		expect(() => memoryPoker.apply(hidden, 0, { action: "hide", value: "" })).toThrow(IllegalMove)
	})
	it.each(['["0","0"]', '["0","16"]', '["0"]', "not json", "[0,1]"])("rejects malformed card selection %s", (value) => {
		expect(() => memoryPoker.apply(choosing(), 0, { action: "pick", value })).toThrow(IllegalMove)
	})
	it("awards a tied hand to both players and rejects a second seal", () => {
		let s = memoryPoker.apply(choosing(), 0, { action: "pick", value: '["0","1"]' })
		expect(() => memoryPoker.apply(s, 0, { action: "pick", value: '["2","3"]' })).toThrow(IllegalMove)
		s = memoryPoker.apply(s, 1, { action: "pick", value: '["0","1"]' })
		expect(s.scores).toEqual([1, 1])
		expect(s.round).toBe(1)
	})
	it("ranks all poker categories and handles ace-low straights and kickers", () => {
		const hands = [
			[12, 24, 35, 43, 0],
			[12, 25, 35, 43, 0],
			[12, 25, 11, 24, 0],
			[12, 25, 38, 43, 0],
			[0, 14, 28, 42, 4],
			[0, 2, 4, 6, 9],
			[12, 25, 38, 0, 13],
			[12, 25, 38, 51, 0],
			[8, 9, 10, 11, 12],
		]
		const ranks = hands.map(pokerRank)
		expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
		expect(new Set(ranks).size).toBe(9)
		expect(pokerRank([12, 13, 27, 41, 3])).toBeLessThan(pokerRank([0, 14, 28, 42, 4]))
		expect(pokerRank([12, 25, 11, 23, 7])).toBeGreaterThan(pokerRank([12, 25, 10, 22, 7]))
	})
})

describe("Lay the Grass", () => {
	const placing = () => {
		let s = layTheGrass.setup(rng(), 2)
		s = layTheGrass.apply(s, 0, { action: "draft", value: "0:a" })
		return layTheGrass.apply(s, 1, { action: "draft", value: "2:d" })
	}
	it("places lower values first, doubles aggressive scores and keeps occupied cells", () => {
		let s = placing()
		expect(layTheGrass.toAct(s)).toEqual([0])
		s = layTheGrass.apply(s, 0, { action: "place", value: "0" })
		expect(s.scores).toEqual([2, 0])
		expect(s.cells.filter((c) => c === 0)).toHaveLength(3)
		expect(() => layTheGrass.apply(s, 1, { action: "place", value: "0" })).toThrow(IllegalMove)
	})
	it("rejects wrong turns, unavailable passes, off-board placement and aggressive trimming", () => {
		const s = placing()
		expect(() => layTheGrass.apply(s, 1, { action: "place", value: "10" })).toThrow(IllegalMove)
		expect(() => layTheGrass.apply(s, 0, { action: "pass", value: "" })).toThrow(IllegalMove)
		expect(() => layTheGrass.apply(s, 0, { action: "place", value: "5" })).toThrow(IllegalMove)
		expect(() => layTheGrass.apply(s, 0, { action: "trim", value: "1" })).toThrow(IllegalMove)
	})
	it("allows defensive trimming and penalizes a blocked aggressive patch", () => {
		let s = placing()
		s = layTheGrass.apply({ ...s, cells: Array<number>(36).fill(1) }, 0, { action: "pass", value: "" })
		expect(s.scores[0]).toBe(-4)
		s = layTheGrass.apply(s, 1, { action: "trim", value: "2" })
		expect(s.trim).toBe(2)
		expect(() => layTheGrass.apply(s, 1, { action: "trim", value: "3" })).toThrow(IllegalMove)
	})
})

describe("Heavy 13", () => {
	it("hides sealed weights and rejects spent cards or chips", () => {
		let s = heavy13.setup(rng(), 3)
		const left = heavy13.apply(s, 0, { action: "seal", value: "6:3" })
		const right = heavy13.apply(s, 0, { action: "seal", value: "1:2" })
		expect(heavy13.view(left, 1)).toEqual(heavy13.view(right, 1))
		expect(() => heavy13.apply(left, 0, { action: "seal", value: "2:1" })).toThrow(IllegalMove)
		s = { ...s, hands: [[1], ...s.hands.slice(1)], chips: [[0, 2, 2, 1], ...s.chips.slice(1)] }
		expect(() => heavy13.apply(s, 0, { action: "seal", value: "6:1" })).toThrow(IllegalMove)
		expect(() => heavy13.apply(s, 0, { action: "seal", value: "1:0" })).toThrow(IllegalMove)
	})
	it("prioritizes rainbow and high weights, then counts zero stones in threshold penalties", () => {
		let s = { ...heavy13.setup(rng(), 3), stacks: [[6, 0, 5], [], []] }
		for (const [seat, value] of [
			[0, "2:0"],
			[1, "1:3"],
			[2, "6:1"],
		] as const)
			s = heavy13.apply(s, seat, { action: "seal", value })
		expect(s.queue).toEqual([1, 2, 0])
		s = heavy13.apply(s, 1, { action: "place", value: "2" })
		s = heavy13.apply(s, 2, { action: "place", value: "1" })
		s = heavy13.apply(s, 0, { action: "place", value: "0" })
		expect(s.scores).toEqual([-3, 0, 0])
		expect(s.stacks[0]).toEqual([2])
		expect(s.first).toBe(0)
	})
	it("places passed stones in reverse order and forbids a second pass", () => {
		let s = heavy13.setup(rng(), 3)
		for (const [seat, value] of [
			[0, "6:0"],
			[1, "5:1"],
			[2, "4:2"],
		] as const)
			s = heavy13.apply(s, seat, { action: "seal", value })
		s = heavy13.apply(s, 0, { action: "pass", value: "" })
		s = heavy13.apply(s, 1, { action: "pass", value: "" })
		expect(() => heavy13.apply(s, 2, { action: "pass", value: "" })).toThrow(IllegalMove)
		s = heavy13.apply(s, 2, { action: "place", value: "2" })
		expect(s.queue).toEqual([1, 0])
		expect(() => heavy13.apply(s, 1, { action: "pass", value: "" })).toThrow(IllegalMove)
		expect(() => heavy13.apply(s, 1, { action: "place", value: "0" })).toThrow(IllegalMove)
	})
})

describe("Mystery Stock Market", () => {
	it("settles orders together, values shares and never spends unavailable coins", () => {
		let s = mysteryStockMarket.setup(rng(), 2)
		expect(() => mysteryStockMarket.apply(s, 0, { action: "buy", value: "0:11" })).toThrow(IllegalMove)
		expect(() => mysteryStockMarket.apply(s, 0, { action: "sell", value: "0:1" })).toThrow(IllegalMove)
		s = mysteryStockMarket.apply(s, 0, { action: "buy", value: "0:10" })
		expect(s.cash[0]).toBe(10000)
		expect(() => mysteryStockMarket.apply(s, 0, { action: "hold", value: "" })).toThrow(IllegalMove)
		s = mysteryStockMarket.apply(s, 1, { action: "hold", value: "" })
		expect(s.cash[0]).toBe(0)
		expect(mysteryStockMarket.view(s, 0).scores[0]).toBe(11200)
		expect(() => mysteryStockMarket.apply(s, 0, { action: "study", value: "1" })).toThrow(IllegalMove)
	})
	it("reveals purchased rules privately and hides unfilled orders", () => {
		let s = mysteryStockMarket.setup(rng(), 2)
		const a = mysteryStockMarket.apply(s, 0, { action: "buy", value: "0:1" })
		const b = mysteryStockMarket.apply(s, 0, { action: "study", value: "0" })
		expect(mysteryStockMarket.view(a, 1)).toEqual(mysteryStockMarket.view(b, 1))
		s = mysteryStockMarket.apply(b, 1, { action: "hold", value: "" })
		expect(s.known).toEqual([
			[true, false, false, false, false, false, false],
			[false, false, false, false, false, false, false],
		])
		expect(mysteryStockMarket.view(s, 0).facts).not.toEqual(mysteryStockMarket.view(s, 1).facts)
		expect(() => mysteryStockMarket.apply(s, 0, { action: "study", value: "0" })).toThrow(IllegalMove)
	})
	it("rejects a negative share quantity", () => {
		expect(() =>
			mysteryStockMarket.apply(mysteryStockMarket.setup(rng(), 2), 0, { action: "buy", value: "0:-1" }),
		).toThrow(IllegalMove)
	})
})

describe("Russian Roulette", () => {
	it("keeps curses and private investigations hidden from other seats", () => {
		const s = russianRoulette.setup(rng(), 3)
		const changed = { ...s, chambers: [...s.chambers].reverse() }
		expect(russianRoulette.view(s, 1)).toEqual(russianRoulette.view(changed, 1))
		const after = russianRoulette.apply(s, 0, { action: "peek", value: "0" })
		expect(russianRoulette.view(after, 1).board).toEqual(russianRoulette.view(s, 1).board)
		expect(russianRoulette.view(after, 0).board).not.toEqual(russianRoulette.view(s, 0).board)
	})
	it("rotates curses and known positions, then completes exact-six tampering", () => {
		let s = { ...russianRoulette.setup(rng(), 3), chambers: [true, false, true] }
		s = russianRoulette.apply(s, 0, { action: "open", value: "0" })
		s = russianRoulette.apply(s, 1, { action: "rotate", value: "1" })
		expect(s.chambers).toEqual([true, true, false])
		expect(s.knowledge[0]).toEqual([null, true, false])
		s = russianRoulette.apply(s, 2, { action: "tamper", value: "3:1" })
		s = russianRoulette.apply(s, s.turn, { action: "tamper", value: "3:1" })
		expect(s.chambers).toEqual([true, false, true])
		expect(s.tamper).toBe(0)
	})
	it("excess tamper contributions reset without changing chambers", () => {
		const s = { ...russianRoulette.setup(rng(), 3), tamper: 5 }
		const after = russianRoulette.apply(s, 0, { action: "tamper", value: "2:0" })
		expect(after.chambers).toEqual(s.chambers)
		expect(after.tamper).toBe(0)
	})
	it("rejects unaffordable actions, invalid pairs and out-of-turn moves", () => {
		const s = { ...russianRoulette.setup(rng(), 3), credits: [1, 16, 16] }
		expect(() => russianRoulette.apply(s, 0, { action: "rotate", value: "1" })).toThrow(IllegalMove)
		expect(() => russianRoulette.apply(s, 0, { action: "peek", value: "3" })).toThrow(IllegalMove)
		expect(() => russianRoulette.apply(s, 0, { action: "tamper", value: "3:4" })).toThrow(IllegalMove)
		expect(() => russianRoulette.apply(s, 1, { action: "open", value: "0" })).toThrow(IllegalMove)
	})
	it("ends when half the purses empty and awards only safe seats", () => {
		let s = { ...russianRoulette.setup(rng(), 3), credits: [1, 0, 16], chambers: [true, true, false] }
		s = russianRoulette.apply(s, 0, { action: "open", value: "0" })
		expect(russianRoulette.outcome(s)).toEqual({ winners: [2] })
	})
})

describe("season 3 visual move contracts", () => {
	it("shows poker faces only during study and selects the same hidden board indices", () => {
		let state = memoryPoker.setup(rng(), 2)
		expect(memoryPoker.view(state, 0).board!.cells.every((c) => c.piece?.kind === "card")).toBe(true)
		state = memoryPoker.apply(state, 0, { action: "hide", value: "" })
		const hidden = memoryPoker.view(state, 0)
		expect(hidden.board!.cells.every((c) => c.piece?.kind === "back")).toBe(true)
		expect(hidden.displays).toEqual([])
		state = memoryPoker.apply(state, 1, { action: "hide", value: "" })
		const view = memoryPoker.view(state, 0)
		expect(view.selection!.onBoard).toBe(true)
		expect(view.selection!.options.map((o) => Number(o.value))).toEqual(Array.from({ length: 16 }, (_, i) => i))
		expect(view.displays![0]!.items).toHaveLength(3)
	})
	it("patch previews exactly match the cells committed by the placement", () => {
		let state = layTheGrass.setup(rng(), 2)
		while (state.phase === "draft") {
			const seat = layTheGrass.toAct(state)[0]!
			const choice = layTheGrass.view(state, seat).choices.find((c) => c.move.value === "6:d")!
			expect(choice.steps?.[0]?.piece?.kind).toBe("shape")
			state = layTheGrass.apply(state, seat, choice.move)
		}
		const seat = layTheGrass.toAct(state)[0]!
		const cell = layTheGrass.view(state, seat).board!.cells.find((c) => c.move)!
		const next = layTheGrass.apply(state, seat, cell.move!)
		expect(next.cells.flatMap((owner, i) => (owner === seat ? [i] : []))).toEqual(cell.preview)
	})
	it("staged heavy and chamber choices retain unique legal leaf moves", () => {
		for (const game of [heavy13, russianRoulette]) {
			const state = game.setup(rng(), 3) as never
			const seat = game.toAct(state)[0]!
			const choices = game.view(state, seat).choices
			expect(new Set(choices.map((c) => c.steps!.map((step) => step.key).join("/"))).size).toBe(choices.length)
			for (const choice of choices) expect(() => game.apply(state, seat, choice.move)).not.toThrow()
		}
	})
	it("market form bounds commit an affordable exact order and reject one beyond the bound", () => {
		const state = mysteryStockMarket.setup(rng(), 2)
		const form = mysteryStockMarket.view(state, 0).forms!.find((f) => f.action === "buy")!
		const max = form.fields[0]!.max!
		const move = (quantity: number) => ({ action: form.action, value: form.format.replace("{0}", String(quantity)) })
		expect(() => mysteryStockMarket.apply(state, 0, move(max))).not.toThrow()
		expect(() => mysteryStockMarket.apply(state, 0, move(max + 1))).toThrow(IllegalMove)
	})
})
