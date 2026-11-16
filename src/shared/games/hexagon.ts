import { z } from "zod"
import { type GameDef, illegal, parseWith, pick } from "../game.js"

export const HEX_CELLS = Array.from({ length: 5 }, (_, row) => row - 2).flatMap((r) =>
	Array.from({ length: 5 - Math.abs(r) }, (_, col) => ({ q: Math.max(-2, -r - 2) + col, r })),
)
export const HEX_LINES = HEX_CELLS.flatMap(({ q, r }, start) =>
	[
		[1, 0],
		[0, 1],
		[1, -1],
	].flatMap(([dq, dr]) => {
		const line = [
			start,
			...[1, 2].map((step) => HEX_CELLS.findIndex((p) => p.q === q + dq! * step && p.r === r + dr! * step)),
		]
		return line.every((cell) => cell >= 0) ? [line] : []
	}),
)
export const HEX_MISTAKES = 3
/** Public board geometry only; the draft must never consult hidden numbers. */
export function hexagonCandidates(selected: readonly number[]): number[] {
	if (selected.length >= 3 || new Set(selected).size !== selected.length) return []
	return [...new Set(HEX_LINES.filter((line) => selected.every((cell) => line.includes(cell))).flat())].filter(
		(cell) => !selected.includes(cell),
	)
}
export interface HexagonState {
	numbers: number[]
	target: number
	phase: "study" | "recall"
	guesses: { cells: number[]; correct: boolean }[]
}
export interface HexagonView {
	numbers: number[] | null
	target: number | null
	phase: "study" | "recall"
	guesses: HexagonState["guesses"]
	remaining: number
	mistakes: number
	score: number
}
const schema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("hide") }).strict(),
	z
		.object({
			type: z.literal("guess"),
			cells: z
				.array(z.number().int().min(0).max(18))
				.length(3)
				.refine((cells) => new Set(cells).size === 3),
		})
		.strict(),
])
export type HexagonMove = z.infer<typeof schema>
const key = (cells: number[]) => [...cells].sort((a, b) => a - b).join(",")
const solutions = (s: HexagonState) =>
	HEX_LINES.filter((line) => line.reduce((sum, cell) => sum + s.numbers[cell]!, 0) === s.target)
const mistakes = (s: HexagonState) => s.guesses.filter((g) => !g.correct).length

export const hexagon: GameDef<HexagonState, HexagonMove, HexagonView> = {
	id: "hexagon",
	name: "Hexagon",
	blurb: "Remember the numbers. Trace a hidden sum through the hexes.",
	rules: [
		"A solo adaptation of the memory game from The Devil’s Plan. Study the 19 numbers, then hide them when ready. The pace clocks do not enforce a deadline.",
		"Select 3 neighbouring hexes in a straight line whose hidden numbers add to the target. Order does not matter.",
		"Find every matching line. A new correct line earns 1 point. A wrong or repeated line costs 1 point and 1 of your 3 chances.",
		"Find all the lines before your third mistake to solve the puzzle. The numbers return when the puzzle ends.",
	],
	players: { min: 1, max: 1 },
	setup(rng) {
		const numbers = HEX_CELLS.map(() => 1 + Math.floor(rng() * 9))
		const target = pick(HEX_LINES, rng).reduce((sum, cell) => sum + numbers[cell]!, 0)
		return { numbers, target, phase: "study", guesses: [] }
	},
	toAct: (s) => (hexagon.outcome(s) ? [] : [0]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (seat !== 0) illegal("This is a solo puzzle.")
		if (hexagon.outcome(s)) illegal("The puzzle is over. Start another to play again.")
		if (move.type === "hide") {
			if (s.phase !== "study") illegal("The numbers are already hidden.")
			return { ...s, phase: "recall" }
		}
		if (s.phase !== "recall") illegal("Hide the numbers before tracing a sum.")
		const cells = key(move.cells)
		const correct = solutions(s).some((line) => key(line) === cells) && !s.guesses.some((g) => key(g.cells) === cells)
		return { ...s, guesses: [...s.guesses, { cells: [...move.cells], correct }] }
	},
	outcome(s) {
		if (s.guesses.filter((g) => g.correct).length === solutions(s).length) return { winners: [0] }
		return mistakes(s) >= HEX_MISTAKES ? { winners: [] } : null
	},
	view: (s) => ({
		numbers: s.phase === "study" || hexagon.outcome(s) ? [...s.numbers] : null,
		target: s.phase === "study" ? null : s.target,
		phase: s.phase,
		guesses: s.guesses,
		remaining: solutions(s).length - s.guesses.filter((g) => g.correct).length,
		mistakes: mistakes(s),
		score: s.guesses.reduce((sum, g) => sum + (g.correct ? 1 : -1), 0),
	}),
	historyEntry(before, after) {
		if (before.phase !== after.phase) return ["The numbers were hidden. The recall phase began."]
		const guess = after.guesses.at(-1)
		if (!guess || before.guesses.length === after.guesses.length) return []
		return [
			`Traced ${guess.cells.map((cell) => String.fromCharCode(65 + cell)).join(" · ")}: ${guess.correct ? "+1" : "−1"} point.`,
			...(hexagon.outcome(after)
				? [
						`Numbers revealed: ${after.numbers.map((number, cell) => `${String.fromCharCode(65 + cell)}=${number}`).join(", ")}.`,
					]
				: []),
		]
	},
}
