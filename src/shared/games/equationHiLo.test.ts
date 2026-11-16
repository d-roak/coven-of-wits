import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../game"
import { EQUATION_ROUNDS, type EquationHiLoMove, equationHiLo, equationValue } from "./equationHiLo"

const move: EquationHiLoMove = { order: [0, 1, 2, 3], operators: ["+", "-", "/"], lane: "low" }
const table = (hands: number[][]) => {
	const state = equationHiLo.setup(seededRng(7), hands.length)
	return { ...state, deals: [hands, ...state.deals.slice(1)] }
}

it("applies division before addition and subtraction", () => {
	expect(equationValue([8, 6, 2, 4], ["+", "/", "-"])).toBe(7)
})

it("keeps a divided subtraction term negative", () => {
	expect(equationValue([8, 6, 2, 4], ["-", "/", "+"])).toBe(9)
})

it("has no preview for an unfinished equation", () => {
	expect(equationValue([8, 6], ["+"])).toBeNull()
})

describe("equation hi-lo", () => {
	it("rejects duplicate cards, reused operators, unknown fields and lanes", () => {
		expect(() => equationHiLo.parseMove({ ...move, order: [0, 1, 1, 3] })).toThrow(IllegalMove)
		expect(() => equationHiLo.parseMove({ ...move, operators: ["+", "+", "/"] })).toThrow(IllegalMove)
		expect(() => equationHiLo.parseMove({ ...move, extra: true })).toThrow(IllegalMove)
		expect(() => equationHiLo.parseMove({ ...move, lane: "middle" })).toThrow(IllegalMove)
	})

	it("rejects division by zero before sealing", () => {
		const state = table([
			[1, 2, 3, 0],
			[1, 2, 3, 4],
		])
		expect(() => equationHiLo.apply(state, 0, move)).toThrow(IllegalMove)
		expect(equationHiLo.toAct(state)).toContain(0)
	})

	it("rejects missing seats and second submissions", () => {
		const state = table([
			[1, 2, 3, 4],
			[1, 2, 3, 4],
		])
		expect(() => equationHiLo.apply(state, 4, move)).toThrow(IllegalMove)
		const sealed = equationHiLo.apply(state, 0, move)
		expect(() => equationHiLo.apply(sealed, 0, move)).toThrow(IllegalMove)
	})

	it("validates card indices even when apply is called directly", () => {
		const state = table([
			[1, 2, 3, 4],
			[1, 2, 3, 4],
		])
		expect(() => equationHiLo.apply(state, 0, { ...move, order: [0, 1, 2, 4] })).toThrow(IllegalMove)
	})

	it("does not expose rival hands, choices or future deals before reveal", () => {
		const state = table([
			[1, 2, 3, 4],
			[5, 6, 7, 8],
		])
		const changedSecrets = {
			...state,
			deals: [
				[
					[1, 2, 3, 4],
					[9, 9, 9, 9],
				],
				...equationHiLo.setup(seededRng(99), 2).deals.slice(1),
			],
		}
		const left = equationHiLo.apply(state, 1, move)
		const right = equationHiLo.apply(changedSecrets, 1, { ...move, lane: "high", order: [3, 2, 1, 0] })
		expect(equationHiLo.view(left, 0)).toEqual(equationHiLo.view(right, 0))
		expect(equationHiLo.view(left, 1).myMove).toEqual(move)
		expect(equationHiLo.historyEntry!(state, left, 1, 0)).toEqual(
			equationHiLo.historyEntry!(changedSecrets, right, 1, 0),
		)
		const revealed = equationHiLo.apply(left, 0, move)
		expect(equationHiLo.historyEntry!(left, revealed, 0, 0)).toHaveLength(2)
		expect(equationHiLo.historyEntry!(left, revealed, 0, 0)).toEqual(equationHiLo.historyEntry!(left, revealed, 0, 1))
	})

	it("awards each closest lane entry, including shared ties, after everyone seals", () => {
		let state = table([
			[0, 2, 4, 4],
			[0, 4, 6, 2],
			[10, 10, 0, 1],
			[10, 10, 1, 1],
			[0, 3, 4, 4],
		])
		for (let seat = 0; seat < 4; seat++) {
			state = equationHiLo.apply(state, seat, { ...move, lane: seat >= 2 ? "high" : "low" })
			expect(state.scores).toEqual([0, 0, 0, 0, 0])
		}
		state = equationHiLo.apply(state, 4, move)
		expect(state.scores).toEqual([1, 1, 1, 0, 0])
		expect(equationHiLo.view(state, 0).history[0].map((entry) => entry.value)).toEqual([1, 1, 20, 19, 2])
	})

	it("ends after five rounds, reports a draw for equal scores and rejects later moves", () => {
		let state = equationHiLo.setup(() => 0, 2)
		for (let round = 0; round < EQUATION_ROUNDS; round++) {
			for (const seat of [0, 1]) {
				const choice = equationHiLo.bot!(equationHiLo.view(state, seat), seat, () => 0)
				state = equationHiLo.apply(state, seat, choice)
			}
		}
		expect(equationHiLo.outcome(state)).toEqual({ winners: [] })
		expect(equationHiLo.toAct(state)).toEqual([])
		expect(() => equationHiLo.apply(state, 0, move)).toThrow(IllegalMove)
	})

	it.each([2, 5])("bots finish a %i-seat table using only their view", (players) => {
		for (let seed = 1; seed <= 5; seed++) {
			const rng = seededRng(seed)
			let state = equationHiLo.setup(rng, players)
			let moves = 0
			while (equationHiLo.outcome(state) === null) {
				expect(moves++).toBeLessThan(players * EQUATION_ROUNDS)
				const seat = equationHiLo.toAct(state)[0]
				const choice = equationHiLo.bot!(equationHiLo.view(state, seat), seat, rng)
				state = equationHiLo.apply(state, seat, equationHiLo.parseMove(choice))
			}
			expect(state.history).toHaveLength(EQUATION_ROUNDS)
		}
	})
})
