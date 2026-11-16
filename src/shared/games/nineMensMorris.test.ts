import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../game"
import { nineMensMorris as game, type NineMensMorrisState } from "./nineMensMorris"

const fresh = () => game.setup(seededRng(1), 2)
const position = (ours: number[], theirs: number[], extra: Partial<NineMensMorrisState> = {}): NineMensMorrisState => ({
	...fresh(),
	reserve: [0, 0],
	cells: Array.from({ length: 24 }, (_, at) => (ours.includes(at) ? 0 : theirs.includes(at) ? 1 : null)),
	...extra,
})

describe("Nine Men's Morris", () => {
	it("accepts a move regardless of object property order", () => {
		expect(game.apply(fresh(), 0, { to: 0, type: "place" }).cells[0]).toBe(0)
	})
	it("rejects unknown fields and point indices outside the board", () => {
		expect(() => game.parseMove({ type: "place", to: 0, extra: true })).toThrow(IllegalMove)
		expect(() => game.parseMove({ type: "place", to: 24 })).toThrow(IllegalMove)
	})
	it("rejects an occupied point and an out-of-turn move", () => {
		const s = game.apply(fresh(), 0, { type: "place", to: 0 })
		expect(() => game.apply(s, 1, { type: "place", to: 0 })).toThrow(IllegalMove)
		expect(() => game.apply(s, 0, { type: "place", to: 1 })).toThrow(IllegalMove)
	})
	it("forms a mill, requires capture, and keeps the source state unchanged", () => {
		const s = position([0, 1], [8, 9], { reserve: [7, 7] })
		const mill = game.apply(s, 0, { type: "place", to: 2 })
		expect(game.toAct(mill)).toEqual([0])
		expect(() => game.apply(mill, 0, { type: "place", to: 3 })).toThrow(IllegalMove)
		const taken = game.apply(mill, 0, { type: "capture", at: 8 })
		expect(taken.cells[8]).toBeNull()
		expect(game.toAct(taken)).toEqual([1])
		expect(s.cells[2]).toBeNull()
		expect(game.historyEntry!(s, mill, 0, 0)).toHaveLength(2)
		expect(game.historyEntry!(mill, taken, 0, 0)).toHaveLength(1)
		expect(game.historyEntry!(mill, taken, 0, 0)).toEqual(game.historyEntry!(mill, taken, 0, 1))
	})
	it("protects a rival mill when an exposed stone remains", () => {
		const s = position([0, 1, 2], [8, 9, 10, 12], { capture: true })
		expect(() => game.apply(s, 0, { type: "capture", at: 8 })).toThrow(IllegalMove)
		expect(game.apply(s, 0, { type: "capture", at: 12 }).cells[12]).toBeNull()
	})
	it("allows capture from a mill when every rival stone is protected, ending below three", () => {
		const s = position([0, 1, 2], [8, 9, 10], { capture: true })
		expect(game.outcome(game.apply(s, 0, { type: "capture", at: 8 }))).toEqual({ winners: [0] })
	})
	it("requires an adjacent destination before flying is available", () => {
		const s = position([0, 2, 4, 6], [8, 10, 12, 14])
		expect(() => game.apply(s, 0, { type: "slide", from: 0, to: 3 })).toThrow(IllegalMove)
		expect(game.apply(s, 0, { type: "slide", from: 0, to: 1 }).cells[1]).toBe(0)
		expect(() => game.apply(s, 0, { type: "place", to: 1 })).toThrow(IllegalMove)
	})
	it("lets three stones fly to a disconnected empty point", () => {
		const s = position([0, 2, 4], [8, 10, 12, 14])
		expect(game.apply(s, 0, { type: "slide", from: 0, to: 16 }).cells[16]).toBe(0)
	})
	it("ends when the next player is blocked", () => {
		const s = position([1, 3, 5, 7, 8], [0, 2, 4, 6])
		expect(game.outcome(game.apply(s, 0, { type: "slide", from: 8, to: 9 }))).toEqual({ winners: [0] })
	})
	it("loses immediately when the last placement leaves fewer than three stones", () => {
		const s = position([0, 2, 4, 6], [8], { turn: 1, reserve: [0, 1] })
		const end = game.apply(s, 1, { type: "place", to: 9 })
		expect(game.outcome(end)).toEqual({ winners: [0] })
		expect(game.toAct(end)).toEqual([])
	})
	it("draws after eighty quiet turns and rejects further moves", () => {
		const s = position([0, 2, 4, 6], [8, 10, 12, 14], { quietTurns: 79 })
		const end = game.apply(s, 0, { type: "slide", from: 0, to: 1 })
		expect(game.outcome(end)).toEqual({ winners: [] })
		expect(() => game.apply(end, 1, { type: "slide", from: 8, to: 9 })).toThrow(IllegalMove)
	})
	it("draws on the third repeated position", () => {
		let s = position([0, 2, 4, 6], [8, 10, 12, 14])
		for (let i = 0; i < 9; i++) {
			const [from, to] = [
				[0, 1],
				[8, 9],
				[1, 0],
				[9, 8],
			][i % 4]
			s = game.apply(s, s.turn, { type: "slide", from, to })
		}
		expect(game.outcome(s)).toEqual({ winners: [] })
	})
	it("bots finish with legal moves using only the public view", () => {
		for (let seed = 1; seed <= 12; seed++) {
			const rng = seededRng(seed)
			let s = game.setup(rng, 2)
			for (let moves = 0; !game.outcome(s); moves++) {
				expect(moves).toBeLessThan(1000)
				s = game.apply(s, s.turn, game.parseMove(game.bot!(game.view(s, s.turn), s.turn, rng)))
			}
			expect(game.toAct(s)).toEqual([])
		}
	})
})
