import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../game"
import { HEX_LINES, hexagon, hexagonCandidates } from "./hexagon"

describe("hexagon", () => {
	const fresh = () => hexagon.setup(seededRng(14), 1)
	it("guides every draft into a straight line using public geometry only", () => {
		for (const first of hexagonCandidates([])) {
			for (const second of hexagonCandidates([first])) {
				for (const third of hexagonCandidates([first, second])) {
					expect(HEX_LINES.some((line) => [first, second, third].every((cell) => line.includes(cell)))).toBe(true)
				}
			}
		}
		expect(hexagonCandidates([0, 18])).toEqual([])
		expect(hexagonCandidates([0, 0])).toEqual([])
		expect(hexagonCandidates([0, 1, 2])).toEqual([])
	})
	it("requires memorization to finish before guesses and hides the numbers", () => {
		const s = fresh()
		expect(() => hexagon.apply(s, 0, { type: "guess", cells: [0, 1, 2] })).toThrow(IllegalMove)
		const hidden = hexagon.apply(s, 0, { type: "hide" })
		expect(hexagon.view(hidden, 0).numbers).toBeNull()
		expect(() => hexagon.apply(hidden, 0, { type: "hide" })).toThrow(IllegalMove)
	})
	it("always generates a solvable puzzle and wins only after every line is found", () => {
		for (let seed = 0; seed < 30; seed++) {
			let s = hexagon.apply(hexagon.setup(seededRng(seed), 1), 0, { type: "hide" })
			const lines = HEX_LINES.filter((line) => line.reduce((sum, c) => sum + s.numbers[c]!, 0) === s.target)
			expect(lines.length).toBeGreaterThan(0)
			for (const cells of lines) {
				expect(hexagon.outcome(s)).toBeNull()
				s = hexagon.apply(s, 0, { type: "guess", cells: [...cells].reverse() })
			}
			expect(hexagon.outcome(s)).toEqual({ winners: [0] })
			expect(hexagon.view(s, 0).numbers).toEqual(s.numbers)
		}
	})
	it("penalizes repeated lines regardless of order", () => {
		let s = hexagon.apply({ ...fresh(), numbers: Array<number>(19).fill(1), target: 3 }, 0, { type: "hide" })
		s = hexagon.apply(s, 0, { type: "guess", cells: [0, 1, 2] })
		s = hexagon.apply(s, 0, { type: "guess", cells: [2, 1, 0] })
		expect(hexagon.view(s, 0)).toMatchObject({ mistakes: 1, score: 0 })
	})
	it("rejects non-lines as guesses and ends at three mistakes", () => {
		let s = hexagon.apply(fresh(), 0, { type: "hide" })
		for (let i = 0; i < 3; i++) s = hexagon.apply(s, 0, { type: "guess", cells: [0, 1, 18] })
		expect(hexagon.outcome(s)).toEqual({ winners: [] })
		expect(() => hexagon.apply(s, 0, { type: "guess", cells: [0, 1, 2] })).toThrow(IllegalMove)
	})
	it("keeps hidden numbers out of action history until the puzzle ends", () => {
		const first = hexagon.apply({ ...fresh(), numbers: Array<number>(19).fill(1), target: 3 }, 0, { type: "hide" })
		const second = { ...first, numbers: first.numbers.map((number, cell) => (cell === 18 ? 2 : number)) }
		const left = hexagon.apply(first, 0, { type: "guess", cells: [0, 1, 18] })
		const right = hexagon.apply(second, 0, { type: "guess", cells: [0, 1, 18] })
		expect(hexagon.historyEntry!(first, left, 0, 0)).toEqual(hexagon.historyEntry!(second, right, 0, 0))
		const beforeEnd = hexagon.apply(left, 0, { type: "guess", cells: [0, 1, 18] })
		const ended = hexagon.apply(beforeEnd, 0, { type: "guess", cells: [0, 1, 18] })
		expect(hexagon.historyEntry!(beforeEnd, ended, 0, 0)).toHaveLength(2)
	})
	it("rejects the wrong seat and malformed selections", () => {
		expect(() => hexagon.apply(fresh(), 1, { type: "hide" })).toThrow(IllegalMove)
		for (const raw of [
			{ type: "guess", cells: [0, 0, 1] },
			{ type: "guess", cells: [0, 1, 19] },
			{ type: "guess", cells: [0, 1] },
			{ type: "hide", extra: true },
		]) {
			expect(() => hexagon.parseMove(raw)).toThrow(IllegalMove)
		}
	})
})
