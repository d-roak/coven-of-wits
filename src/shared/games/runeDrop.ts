import { z } from "zod"
import { type GameDef, type Rng, illegal, parseWith, pick } from "../game.js"

export const COLS = 7
export const ROWS = 6

export interface RuneDropState {
	/** Row-major, row 0 is the top. Holds the seat that owns the orb. */
	cells: (number | null)[]
	turn: number
	last: number | null
	/** The four winning cells, once someone has them. */
	line: number[] | null
}

export interface RuneDropMove {
	col: number
}

const schema = z
	.object({
		col: z
			.number()
			.int()
			.min(0)
			.max(COLS - 1),
	})
	.strict()

const LINES: number[][] = []
for (let r = 0; r < ROWS; r++) {
	for (let c = 0; c < COLS; c++) {
		for (const [dr, dc] of [
			[0, 1],
			[1, 0],
			[1, 1],
			[1, -1],
		] as const) {
			const endR = r + 3 * dr
			const endC = c + 3 * dc
			if (endR >= ROWS || endC < 0 || endC >= COLS) continue
			LINES.push([0, 1, 2, 3].map((i) => (r + i * dr) * COLS + c + i * dc))
		}
	}
}

/** Where an orb dropped in `col` comes to rest, or null when the column is full. */
export function landing(cells: (number | null)[], col: number): number | null {
	for (let r = ROWS - 1; r >= 0; r--) {
		if (cells[r * COLS + col] === null) return r * COLS + col
	}
	return null
}

function winLine(cells: (number | null)[]): number[] | null {
	return LINES.find((l) => cells[l[0]!] !== null && l.every((i) => cells[i] === cells[l[0]!])) ?? null
}

// Bot: negamax with alpha-beta. Open lines score by how many orbs they already hold.
const DEPTH = 5
const WEIGHT = [0, 1, 4, 16, 0]
const CENTRE_FIRST = [3, 2, 4, 1, 5, 0, 6]

function evaluate(cells: (number | null)[], seat: number): number {
	let score = 0
	for (const line of LINES) {
		let mine = 0
		let theirs = 0
		for (const i of line) {
			if (cells[i] === seat) mine++
			else if (cells[i] !== null) theirs++
		}
		if (mine === 0) score -= WEIGHT[theirs]!
		else if (theirs === 0) score += WEIGHT[mine]!
	}
	return score
}

function negamax(cells: (number | null)[], seat: number, depth: number, alpha: number, beta: number): number {
	// The previous mover just completed a line, so this is a loss for `seat`. Sooner is worse.
	if (winLine(cells)) return -1000 - depth
	if (depth === 0) return evaluate(cells, seat)
	let best = -Infinity
	for (const col of CENTRE_FIRST) {
		const at = landing(cells, col)
		if (at === null) continue
		cells[at] = seat
		const value = -negamax(cells, 1 - seat, depth - 1, -beta, -alpha)
		cells[at] = null
		best = Math.max(best, value)
		alpha = Math.max(alpha, value)
		if (alpha >= beta) break
	}
	// No column left: the board is full and nobody won.
	return best === -Infinity ? 0 : best
}

export const runeDrop: GameDef<RuneDropState, RuneDropMove> = {
	id: "rune-drop",
	name: "Rune Drop",
	blurb: "Drop orbs into the slab. Four in a line wins.",
	rules: [
		"Take turns dropping one orb into any column that has room.",
		"An orb falls to the lowest empty hole.",
		"Line up four of your orbs across, down or diagonally to win.",
		"A full slab with no line is a draw.",
	],
	players: { min: 2, max: 2 },
	setup: () => ({ cells: Array<number | null>(COLS * ROWS).fill(null), turn: 0, last: null, line: null }),
	toAct: (s) => (runeDrop.outcome(s) ? [] : [s.turn]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (runeDrop.outcome(s)) illegal("The game is over.")
		if (seat !== s.turn) illegal("It is not your turn.")
		const at = landing(s.cells, move.col)
		if (at === null) return illegal("That column is full.")
		const cells = [...s.cells]
		cells[at] = seat
		return { cells, turn: 1 - seat, last: at, line: winLine(cells) }
	},
	outcome(s) {
		if (s.line) return { winners: [s.cells[s.line[0]!]!] }
		return s.cells.every((c) => c !== null) ? { winners: [] } : null
	},
	historyEntry(_before, after) {
		const cell = after.last!
		return [`Dropped an orb in column ${(cell % COLS) + 1}, row ${Math.floor(cell / COLS) + 1}.`]
	},
	view: (s) => s,
	bot(view, seat, rng: Rng) {
		const cells = [...view.cells]
		let best = -Infinity
		let cols: number[] = []
		for (const col of CENTRE_FIRST) {
			const at = landing(cells, col)
			if (at === null) continue
			cells[at] = seat
			const value = -negamax(cells, 1 - seat, DEPTH - 1, -Infinity, Infinity)
			cells[at] = null
			if (value > best) [best, cols] = [value, [col]]
			else if (value === best) cols.push(col)
		}
		return { col: pick(cols, rng) }
	},
}
