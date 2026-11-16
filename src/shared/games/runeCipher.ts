import { z } from "zod"
import { type GameDef, illegal, parseWith } from "../game"

export const SLOTS = 4
export const RUNES = 6
export const TRIES = 8

export interface CipherGuess {
	code: number[]
	/** Right rune, right slot. */
	exact: number
	/** Right rune, wrong slot. */
	near: number
}

export interface RuneCipherState {
	secret: number[]
	guesses: CipherGuess[]
}

export interface RuneCipherView {
	/** Revealed only once the puzzle is over. */
	secret: number[] | null
	guesses: CipherGuess[]
}

export interface RuneCipherMove {
	code: number[]
}

const schema = z
	.object({
		code: z
			.array(
				z
					.number()
					.int()
					.min(0)
					.max(RUNES - 1),
			)
			.length(SLOTS),
	})
	.strict()

export function grade(secret: number[], code: number[]): Pick<CipherGuess, "exact" | "near"> {
	const exact = code.filter((rune, i) => rune === secret[i]).length
	let shared = 0
	for (let rune = 0; rune < RUNES; rune++) {
		const count = (list: number[]) => list.filter((r) => r === rune).length
		shared += Math.min(count(secret), count(code))
	}
	return { exact, near: shared - exact }
}

export const runeCipher: GameDef<RuneCipherState, RuneCipherMove, RuneCipherView> = {
	id: "rune-cipher",
	name: "Rune Cipher",
	blurb: `A sealed code of ${SLOTS} runes. Break it in ${TRIES} casts.`,
	rules: [
		`The seal hides ${SLOTS} runes drawn from ${RUNES} kinds. A rune can repeat.`,
		"Cast a guess. A gold pip means a rune is right and in the right slot.",
		"A pale pip means a rune is in the code but in a different slot.",
		`Find the full code within ${TRIES} casts.`,
	],
	players: { min: 1, max: 1 },
	setup: (rng) => ({ secret: Array.from({ length: SLOTS }, () => Math.floor(rng() * RUNES)), guesses: [] }),
	toAct: (s) => (runeCipher.outcome(s) ? [] : [0]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (seat !== 0) illegal("This is a solo puzzle.")
		if (runeCipher.outcome(s)) illegal("The cipher is settled.")
		return { ...s, guesses: [...s.guesses, { code: move.code, ...grade(s.secret, move.code) }] }
	},
	outcome(s) {
		if (s.guesses.at(-1)?.exact === SLOTS) return { winners: [0] }
		return s.guesses.length >= TRIES ? { winners: [] } : null
	},
	historyEntry(_before, after) {
		const guess = after.guesses.at(-1)!
		return [
			`Cast ${after.guesses.length}: ${guess.exact} runes in the right place, ${guess.near} in a different place.`,
		]
	},
	view: (s) => ({ secret: runeCipher.outcome(s) ? s.secret : null, guesses: s.guesses }),
}
