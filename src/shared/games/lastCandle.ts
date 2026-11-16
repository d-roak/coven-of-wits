import { z } from "zod"
import { type GameDef, illegal, parseWith, pick } from "../game.js"

export interface LastCandleState {
	players: number
	/** Candles each row began with, so the board can draw the snuffed ones. */
	start: number[]
	rows: number[]
	turn: number
}

export interface LastCandleMove {
	row: number
	take: number
}

const schema = z.object({ row: z.number().int().min(0), take: z.number().int().min(1) }).strict()

const nimSum = (rows: number[]) => rows.reduce((a, b) => a ^ b, 0)

export const lastCandle: GameDef<LastCandleState, LastCandleMove> = {
	id: "last-candle",
	name: "Last Candle",
	blurb: "Snuff candles from one row at a time. Take the last flame to win.",
	rules: [
		"On your turn pick one row and snuff as many of its candles as you like, at least one.",
		"Tap a candle to snuff it and every candle to its right.",
		"Whoever snuffs the very last candle wins.",
	],
	players: { min: 2, max: 5 },
	setup(rng, players) {
		// With two players a zero nim-sum start is a forced loss for the opener. Reroll so the opener has a winning line.
		for (;;) {
			const rows = Array.from({ length: players + 1 + Math.floor(rng() * 2) }, () => 2 + Math.floor(rng() * 6))
			if (nimSum(rows) !== 0) return { players, start: rows, rows, turn: 0 }
		}
	},
	toAct: (s) => (lastCandle.outcome(s) ? [] : [s.turn]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (lastCandle.outcome(s)) illegal("The game is over.")
		if (seat !== s.turn) illegal("It is not your turn.")
		const lit = s.rows[move.row]
		if (lit === undefined) return illegal("There is no such row.")
		if (move.take > lit) illegal("That row does not have that many candles left.")
		return { ...s, rows: s.rows.map((n, i) => (i === move.row ? n - move.take : n)), turn: (seat + 1) % s.players }
	},
	// The turn has already passed on, so the winner is the seat before the one that is up.
	outcome: (s) => (s.rows.every((n) => n === 0) ? { winners: [(s.turn + s.players - 1) % s.players] } : null),
	historyEntry(before, after) {
		const row = before.rows.findIndex((count, i) => count !== after.rows[i])
		return [
			`Snuffed ${before.rows[row]! - after.rows[row]!} candles in row ${row + 1}; ${after.rows[row]} remain in that row.`,
		]
	},
	view: (s) => s,
	// ponytail: nim-sum play (exact for two, a decent habit for more) with a flat 25% blunder rate so it can be beaten.
	bot(view, _seat, rng) {
		const x = nimSum(view.rows)
		const row = view.rows.findIndex((n) => (n ^ x) < n)
		if (row >= 0 && rng() >= 0.25) return { row, take: view.rows[row]! - (view.rows[row]! ^ x) }
		const lit = view.rows.flatMap((n, i) => (n > 0 ? [i] : []))
		return { row: pick(lit, rng), take: 1 }
	},
}
