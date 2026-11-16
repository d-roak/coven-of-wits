import { illegal, pick, topSeats, type Outcome, type Rng } from "../../game.js"
import { type TrialChoice, roundOf, type TrialMove, type RoundLabel, type TrialView } from "./trial.js"

export const choice = (label: string, action: string, value: string | number): TrialChoice => ({
	label,
	move: { action, value: String(value) },
})
export function active(turn: number, seat: number, over: boolean): void {
	if (over) illegal("This trial has ended. Start another game.")
	if (seat !== turn) illegal("Wait for your turn.")
}
export function allowed(move: TrialMove, choices: TrialChoice[]): void {
	if (!choices.some(({ move: candidate }) => candidate.action === move.action && candidate.value === move.value))
		illegal("Choose one of the available actions.")
}
export function selected(value: string, options: readonly string[], amount: number): string[] {
	let raw: unknown
	try {
		raw = JSON.parse(value)
	} catch {
		return illegal("Select the required cards before playing.")
	}
	if (
		!Array.isArray(raw) ||
		raw.length !== amount ||
		raw.some((v) => typeof v !== "string" || !options.includes(v)) ||
		new Set(raw).size !== amount
	)
		illegal(`Choose ${amount} different available cards.`)
	return raw as string[]
}
export const result = (scores: number[]): Outcome => ({ winners: topSeats(scores) })
/** A prompt that also says which round it is. */
export const at = (label: RoundLabel, current: number, total?: number, prompt = "") => ({
	prompt,
	round: roundOf(label, current, total),
})
export const view = (
	phase: string,
	prompt: string | ReturnType<typeof at>,
	scores: number[],
	choices: TrialChoice[],
	facts: string[] = [],
	log: string[] = [],
): TrialView => ({ phase, ...(typeof prompt === "string" ? { prompt } : prompt), scores, choices, facts, log })
export function randomAction(v: TrialView, _seat: number, rng: Rng): TrialMove {
	if (v.selection) {
		const pool = [...v.selection.options]
		const values: string[] = []
		while (values.length < v.selection.min) {
			const option = pick(pool, rng)
			values.push(option.value)
			pool.splice(pool.indexOf(option), 1)
		}
		return { action: v.selection.action, value: JSON.stringify(values) }
	}
	return pick(v.choices, rng).move
}
export const source =
	"https://www.dexerto.com/tv-movies/the-devils-plan-season-2-winners-eliminations-match-results-3190302/"

export function numberControl(v: TrialView, action: string, label: string, submit = "Seal bid"): void {
	const values = v.choices.filter((c) => c.move.action === action).map((c) => Number(c.move.value))
	if (!values.length) return
	v.forms = [
		...(v.forms ?? []),
		{
			label,
			action,
			submit,
			fields: [
				{
					label,
					kind: "number",
					min: Math.min(...values),
					max: Math.max(...values),
					initial: String(Math.min(...values)),
				},
			],
			format: "{0}",
		},
	]
}
export const cardPiece = (rank: number | string, suit?: number): import("./trial.js").TrialPiece => ({
	kind: "card",
	rank: String(rank),
	...(suit === undefined ? {} : { suit: (["spades", "clubs", "hearts", "diamonds"] as const)[suit] }),
})
export const step = (
	prompt: string,
	key: string | number,
	label: string,
	piece?: import("./trial.js").TrialPiece,
): import("./trial.js").TrialStep => ({ prompt, key: String(key), label, ...(piece ? { piece } : {}) })
