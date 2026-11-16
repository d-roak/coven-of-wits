import { z } from "zod"
import { type GameDef, illegal, parseWith } from "../game.js"

export const SIZE = 6

export interface KnightsTourState {
	/** Squares in the order the knight visited them. */
	path: number[]
}

export type KnightsTourMove = { type: "go"; cell: number } | { type: "undo" }

const schema = z.discriminatedUnion("type", [
	z
		.object({
			type: z.literal("go"),
			cell: z
				.number()
				.int()
				.min(0)
				.max(SIZE * SIZE - 1),
		})
		.strict(),
	z.object({ type: z.literal("undo") }).strict(),
])

const JUMPS = [
	[1, 2],
	[2, 1],
	[2, -1],
	[1, -2],
	[-1, -2],
	[-2, -1],
	[-2, 1],
	[-1, 2],
] as const

/** Unvisited squares the knight can reach next. Any square when the tour has not started. */
export function openTargets(path: number[]): number[] {
	const from = path.at(-1)
	if (from === undefined) return Array.from({ length: SIZE * SIZE }, (_, i) => i)
	const r = Math.floor(from / SIZE)
	const c = from % SIZE
	return JUMPS.map(([dr, dc]) => [r + dr, c + dc] as const)
		.filter(([nr, nc]) => nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE)
		.map(([nr, nc]) => nr * SIZE + nc)
		.filter((cell) => !path.includes(cell))
}

export const knightsTour: GameDef<KnightsTourState, KnightsTourMove> = {
	id: "knights-tour",
	name: "Knight's Tour",
	blurb: "Hop a knight across the board and land on every square exactly once.",
	rules: [
		"Tap any square to place the knight.",
		"It moves like a chess knight: two squares one way, one square sideways.",
		"A square can be visited only once.",
		`Visit all ${SIZE * SIZE} squares to finish the tour. Undo as often as you need.`,
	],
	players: { min: 1, max: 1 },
	setup: () => ({ path: [] }),
	toAct: (s) => (knightsTour.outcome(s) ? [] : [0]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (seat !== 0) illegal("This is a solo puzzle.")
		if (knightsTour.outcome(s)) illegal("The tour is complete.")
		switch (move.type) {
			case "undo":
				if (s.path.length === 0) illegal("There is nothing to undo.")
				return { path: s.path.slice(0, -1) }
			case "go":
				if (!openTargets(s.path).includes(move.cell)) illegal("The knight cannot reach that square.")
				return { path: [...s.path, move.cell] }
			default: {
				const unknown: never = move
				return unknown
			}
		}
	},
	// A dead end is not a loss: the player can always undo.
	outcome: (s) => (s.path.length === SIZE * SIZE ? { winners: [0] } : null),
	view: (s) => s,
}
