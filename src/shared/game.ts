import type { ZodType } from "zod"

/** Returns a float in [0, 1). Injected so setups and bots are reproducible in tests. */
export type Rng = () => number

/** Seats that won. Empty means a draw (duel) or a failed puzzle (solo). */
export interface Outcome {
	winners: number[]
}

/** Thrown by `apply` and `parseMove`. Callers show the message; any other error is a bug. */
export class IllegalMove extends Error {}

export function illegal(reason: string): never {
	throw new IllegalMove(reason)
}

/**
 * The whole contract a game has to meet. Pure: no DOM, no network, no clock.
 * The browser runs it for bots and solo play, the server runs it for online rooms.
 *
 * S is the full state (server side truth), M a move, V what one seat may see.
 * Methods use shorthand syntax on purpose: it lets a GameDef<Specific> sit in a list of AnyGame.
 */
export interface GameDef<S, M, V = S> {
	id: string
	name: string
	blurb: string
	rules: string[]
	/** How many seats the game can be played with. Solo puzzles are 1 to 1. */
	players: { min: number; max: number }
	/** `players` is always within the declared range; callers check before they get here. */
	setup(rng: Rng, players: number): S
	/** Seats allowed to move now. Two seats at once means a simultaneous round. Empty when over. */
	toAct(state: S): number[]
	/** Validates untrusted input into a move. Throws IllegalMove. */
	parseMove(raw: unknown): M
	/** Returns the next state, never mutates. Throws IllegalMove. */
	apply(state: S, seat: number, move: M): S
	outcome(state: S): Outcome | null
	/** Strips whatever `seat` must not know. The only thing that ever reaches a board or a bot. */
	view(state: S, seat: number): V
	/** Public round identifier for clocks. Omit for a single continuous game. */
	round?(state: S): string | number
	/** Human-readable event, filtered for its receiver. Never include concealed study material. */
	historyEntry?(before: S, after: S, actor: number, receiver: number): string[]
	/** Required for anything with more than one seat. Gets the same view a human in that seat would. */
	bot?(view: V, seat: number, rng: Rng): M
}

export type AnyGame = GameDef<unknown, unknown, unknown>

export function parseWith<M>(schema: ZodType<M>): (raw: unknown) => M {
	return (raw) => {
		const parsed = schema.safeParse(raw)
		return parsed.success ? parsed.data : illegal("That is not a move this game understands.")
	}
}

/** Seats holding the top score. Empty when every seat is level, which is a draw. */
export function topSeats(scores: number[]): number[] {
	const best = Math.max(...scores)
	const top = scores.flatMap((score, seat) => (score === best ? [seat] : []))
	return top.length === scores.length ? [] : top
}

/**
 * A small deterministic generator (mulberry32). Games that need fresh randomness mid-game keep a seed
 * in their state and draw from this, so `apply` stays pure. Such a seed must never appear in a view.
 */
export function seededRng(seed: number): Rng {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const out = [...items]
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1))
		;[out[i], out[j]] = [out[j]!, out[i]!]
	}
	return out
}

export function pick<T>(items: readonly T[], rng: Rng): T {
	if (items.length === 0) throw new Error("pick: expected at least one item")
	return items[Math.floor(rng() * items.length)]!
}
