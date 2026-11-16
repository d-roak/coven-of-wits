import { z } from "zod"
import { type GameDef, illegal, parseWith, pick } from "../game"

export const N = 8

export interface TurncoatState {
	cells: (number | null)[]
	/** Null once neither side can move. */
	turn: number | null
	last: number | null
}

export interface TurncoatMove {
	cell: number
}

const schema = z
	.object({
		cell: z
			.number()
			.int()
			.min(0)
			.max(N * N - 1),
	})
	.strict()

const DIRS = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
] as const

const inside = (r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N

/** Enemy discs that turn if `seat` plays `cell`. Empty means the move is not legal. */
export function flips(cells: (number | null)[], seat: number, cell: number): number[] {
	if (cells[cell] !== null) return []
	const out: number[] = []
	for (const [dr, dc] of DIRS) {
		const run: number[] = []
		let r = Math.floor(cell / N) + dr
		let c = (cell % N) + dc
		while (inside(r, c) && cells[r * N + c] === 1 - seat) {
			run.push(r * N + c)
			r += dr
			c += dc
		}
		if (run.length > 0 && inside(r, c) && cells[r * N + c] === seat) out.push(...run)
	}
	return out
}

export function legalMoves(cells: (number | null)[], seat: number): number[] {
	return cells.flatMap((_, i) => (flips(cells, seat, i).length > 0 ? [i] : []))
}

function place(cells: (number | null)[], seat: number, cell: number, turned: number[]): (number | null)[] {
	const next = [...cells]
	for (const i of [cell, ...turned]) next[i] = seat
	return next
}

// Corners are permanent, the squares next to them hand the corner over.
const QUARTER = [
	[100, -20, 10, 5],
	[-20, -50, -2, -2],
	[10, -2, 1, 1],
	[5, -2, 1, 0],
]
const squareValue = (cell: number) => {
	const r = Math.floor(cell / N)
	const c = cell % N
	return QUARTER[Math.min(r, N - 1 - r)]![Math.min(c, N - 1 - c)]!
}

export const turncoat: GameDef<TurncoatState, TurncoatMove> = {
	id: "turncoat",
	name: "Turncoat",
	blurb: "Trap rival discs between yours and they switch sides.",
	rules: [
		"Place a disc so that a straight run of rival discs sits between it and another of yours.",
		"Every trapped disc flips to your colour.",
		"If you have no such move your turn is skipped.",
		"When nobody can move, the side with more discs wins.",
	],
	players: { min: 2, max: 2 },
	setup() {
		const cells = Array<number | null>(N * N).fill(null)
		cells[27] = cells[36] = 1
		cells[28] = cells[35] = 0
		return { cells, turn: 0, last: null }
	},
	toAct: (s) => (s.turn === null ? [] : [s.turn]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (s.turn === null) illegal("The game is over.")
		if (seat !== s.turn) illegal("It is not your turn.")
		const turned = flips(s.cells, seat, move.cell)
		if (turned.length === 0) illegal("That disc would not trap anything.")
		const cells = place(s.cells, seat, move.cell, turned)
		const canMove = (who: number) => legalMoves(cells, who).length > 0
		const turn = canMove(1 - seat) ? 1 - seat : canMove(seat) ? seat : null
		return { cells, turn, last: move.cell }
	},
	outcome(s) {
		if (s.turn !== null) return null
		const count = (seat: number) => s.cells.filter((c) => c === seat).length
		const diff = count(0) - count(1)
		return { winners: diff === 0 ? [] : [diff > 0 ? 0 : 1] }
	},
	historyEntry(before, after, actor) {
		const cell = after.last!
		return [
			`Placed a disc at row ${Math.floor(cell / N) + 1}, column ${(cell % N) + 1}; turned ${flips(before.cells, actor, cell).length} rival discs.`,
			...(after.turn === actor ? ["The rival has no legal move; this mage plays again."] : []),
		]
	},
	view: (s) => s,
	// ponytail: 1-ply heuristic (square value, discs won, rival mobility). Swap in alpha-beta for a stronger bot.
	bot(view, seat, rng) {
		let best = -Infinity
		let moves: number[] = []
		for (const cell of legalMoves(view.cells, seat)) {
			const turned = flips(view.cells, seat, cell)
			const after = place(view.cells, seat, cell, turned)
			const value = squareValue(cell) + turned.length - 2 * legalMoves(after, 1 - seat).length
			if (value > best) [best, moves] = [value, [cell]]
			else if (value === best) moves.push(cell)
		}
		return { cell: pick(moves, rng) }
	},
}
