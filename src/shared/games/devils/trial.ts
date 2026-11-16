import { z } from "zod"
import { parseWith } from "../../game.js"

export interface TrialMove {
	action: string
	value: string
}
export const parseTrialMove = parseWith(
	z.object({ action: z.string().min(1).max(48), value: z.string().max(500) }).strict(),
)

export interface TrialChoice {
	label: string
	move: TrialMove
	piece?: TrialPiece
	/** Each path ends at one exact legal move. Drafts never reach the engine. */
	steps?: TrialStep[]
}
export type TrialIcon =
	| "cat"
	| "fox"
	| "owl"
	| "rabbit"
	| "moth"
	| "vial"
	| "candle"
	| "feather"
	| "key"
	| "cup"
	| "gem"
	| "wand"
	| "seal"
	| "moon"
	| "book"
	| "deer"
	| "wolf"
	| "bear"
	| "leaf"
	| "skull"
	| "sword"
	| "shield"
	| "coin"
	| "pawn"
	| "tiger"
	| "goat"
	| "star"
	| "sun"
	| "water"
	| "fire"
	| "eye"
	| "arrow"
	| "lock"
	| "snake"
	| "lion"
	| "parrot"
	| "monkey"
	| "elephant"
	| "lamb"
	| "toad"
	| "ibis"
	| "lynx"
	| "acorn"
	| "bell"
	| "mushroom"
	| "ink"
	| "nest"
	| "torch"
	| "hat"
	| "elm"
	| "yak"
	| "bat"
export type TrialPiece =
	| { kind: "card"; rank: string; suit?: "clubs" | "diamonds" | "hearts" | "spades"; icon?: TrialIcon; tone?: number }
	| { kind: "back" }
	| { kind: "die"; value: number; tone?: number }
	| { kind: "tile"; text: string; tone?: number }
	| { kind: "token"; icon: TrialIcon; text?: string; tone?: number }
	| { kind: "shape"; cells: readonly (readonly [number, number])[]; tone?: number }
	| { kind: "stack"; owners: number[] }
	| { kind: "portrait"; animal: TrialIcon; cloak: number; sigil: TrialIcon }
export interface TrialStep {
	prompt: string
	key: string
	label: string
	piece?: TrialPiece
}
export interface TrialField {
	label: string
	kind: "number" | "text" | "select"
	min?: number
	max?: number
	initial?: string
	skip?: { value: string; label: string }
	options?: { value: string; label: string; piece?: TrialPiece }[]
}
export interface TrialForm {
	steps?: TrialStep[]
	label: string
	action: string
	submit: string
	fields: TrialField[]
	/** Literal separators with indexed field placeholders, e.g. {0}:{1}. */
	format: string
}
export interface TrialCell {
	label: string
	walls?: ("n" | "e" | "s" | "w")[]
	tone?: number
	move?: TrialMove
	piece?: TrialPiece
	preview?: number[]
}
/** Where the game stands: "Auction 2 of 6". No total for games that run until someone falls. */
export type RoundLabel =
	| "Round"
	| "Auction"
	| "Hand"
	| "Cycle"
	| "Trial"
	| "Draft"
	| "Showdown"
	| "Roll"
	| "Turn"
	| "Board"
	| "Question"
	| "Initial"
export interface TrialRound {
	/** A closed list, so the table can translate it. */
	label: RoundLabel
	current: number
	total?: number
}
export const roundOf = (label: RoundLabel, current: number, total?: number): TrialRound => ({
	label,
	current,
	...(total === undefined ? {} : { total }),
})
export interface TrialView {
	/** Counts live here, never in `phase` or `prompt`, so every table shows them the same way. */
	round?: TrialRound
	phase: string
	prompt: string
	scores: number[]
	facts: string[]
	choices: TrialChoice[]
	log: string[]
	board?: { columns: number; cells: TrialCell[]; confirm?: string; layout?: "pyramid" | "mancala" | "bagh" }
	displays?: { label: string; items: { label: string; piece: TrialPiece }[] }[]
	forms?: TrialForm[]
	balance?: { action: string; maxPerPan: number; stones: { value: string; label: string; piece: TrialPiece }[] }
	scoreLabel?: string
	cubes?: { columns: number; heights: number[] }
	input?: { label: string; action: string; kind: "text" | "number"; placeholder?: string; tiles?: string[] }
	selection?: {
		label: string
		action: string
		min: number
		max: number
		ordered?: boolean
		onBoard?: boolean
		submit?: string
		options: { value: string; label: string; piece?: TrialPiece }[]
	}
}

export interface DevilEntry {
	id: string
	season: 1 | 2 | 3
	kind: "Main" | "Prize" | "Prison" | "Final" | "Secret"
	adaptation: string
	sources: string[]
}
