import type { ReactNode } from "react"
import type { TrialIcon } from "../../shared/games/devils/trial"
import { Glyph } from "./Glyph"

// One card for every game, drawn on a 60 by 84 sheet so it scales cleanly into a board cell.
// Suits are drawn paths. Characters such as ♠ and ♥ fall back to colour emoji on phones.

export type Suit = "clubs" | "diamonds" | "hearts" | "spades"

/**
 * The coven's own suits, each in a 10-unit box centred on the origin. The engines still deal
 * clubs, hearts, spades and diamonds; they are drawn, and named in captions, as leaves, flames,
 * moons and stars.
 */
const SUITS: Record<Suit, ReactNode> = {
	clubs: (
		<>
			<path d="M-4.6 4.6 C-5.4 -1.6 -1.6 -5 5 -5 C5 1.6 1.6 5.4 -4.6 4.6 Z" />
			<path className="card-vein" d="M-3.4 3.4 L2.4 -2.4" />
		</>
	),
	hearts: (
		<path d="M0 -5.2 C1.2 -2.6 4.4 -0.6 4.4 2 C4.4 4 2.6 5.2 0 5.2 C-2.6 5.2 -4.4 4 -4.4 2 C-4.4 0.6 -3.6 -0.6 -2.6 -1.6 C-2.4 -0.4 -1.8 0.2 -1 0.4 C-1.8 -1.8 -1 -3.8 0 -5.2 Z" />
	),
	spades: <path d="M2 -5 A5.2 5.2 0 1 0 5 2.6 A4.2 4.2 0 0 1 2 -5 Z" />,
	diamonds: (
		<path d="M0 -5.2 L1.25 -1.72 L4.95 -1.61 L2.02 0.66 L3.06 4.21 L0 2.12 L-3.06 4.21 L-2.02 0.66 L-4.95 -1.61 L-1.25 -1.72 Z" />
	),
}

/** A four-point spark, the filler mark on cards with no suit. */
const SPARK = <path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" />

const L = 21,
	C = 30,
	R = 39
const four: [number, number][] = [
	[L, 22],
	[R, 22],
	[L, 62],
	[R, 62],
]
const six: [number, number][] = [...four, [L, 42], [R, 42]]
const eight: [number, number][] = [
	[L, 20],
	[R, 20],
	[L, 34.7],
	[R, 34.7],
	[L, 49.3],
	[R, 49.3],
	[L, 64],
	[R, 64],
]
/** Where the pips go for 2 to 10, as on a printed deck. */
export const PIPS: Record<number, [number, number][]> = {
	2: [
		[C, 22],
		[C, 62],
	],
	3: [
		[C, 22],
		[C, 42],
		[C, 62],
	],
	4: four,
	5: [...four, [C, 42]],
	6: six,
	7: [...six, [C, 32]],
	8: [...six, [C, 32], [C, 52]],
	9: [...eight, [C, 42]],
	10: [...eight, [C, 27.3], [C, 56.7]],
}

const COURT: Record<string, ReactNode> = {
	J: <Glyph name="hat" x="17" y="27" width="26" height="26" />,
	Q: <Glyph name="moon" x="17" y="27" width="26" height="26" />,
	K: (
		<svg className="glyph" viewBox="0 0 32 32" x="17" y="27" width="26" height="26">
			<path className="t" d="M4 24 L6 10 L11.5 16 L16 7 L20.5 16 L26 10 L28 24 Z" />
			<path d="M4 27.5 H28" />
		</svg>
	),
}

function at(x: number, y: number, scale: number, flip = false): string {
	return `translate(${x} ${y}) scale(${scale})${flip ? " rotate(180)" : ""}`
}

export interface CardFace {
	rank: string
	suit?: Suit
	icon?: TrialIcon
	/** Seat colour index. Tints the face of a card that belongs to a seat or names a colour. */
	tone?: number
}

function Face({ rank, suit, icon }: CardFace) {
	const mark = suit ? SUITS[suit] : SPARK
	const corner = (
		<>
			<text className="card-rank" x="9" y="14" fontSize={rank.length > 1 ? 9 : 11}>
				{rank}
			</text>
			<g transform={at(9, 21, 0.62)}>{mark}</g>
		</>
	)
	const corners = (
		<>
			{corner}
			<g transform="rotate(180 30 42)">{corner}</g>
		</>
	)
	// A word, not a rank: role, colour and operator cards. No corner could hold it.
	// Hangul words are short ("시민"), so length alone would send them to a corner.
	if (!suit && !/^-?\d+$/.test(rank) && (rank.length > 2 || /[^\x00-\x7F]/.test(rank))) {
		const size = Math.max(6, Math.min(11, 86 / rank.length))
		return (
			<>
				<rect className="card-frame" x="5" y="5" width="50" height="74" rx="4" />
				{icon ? <Glyph name={icon} x="13" y="13" width="34" height="34" /> : <g transform={at(C, 30, 2.2)}>{SPARK}</g>}
				<text className="card-title" x={C} y="66" fontSize={size}>
					{rank}
				</text>
			</>
		)
	}
	if (!suit)
		return (
			<>
				{corners}
				{icon ? (
					<Glyph name={icon} x="15" y="27" width="30" height="30" />
				) : (
					<text className="card-numeral" x={C} y="52" fontSize={rank.length > 2 ? 20 : 28}>
						{rank}
					</text>
				)}
			</>
		)
	const count = rank === "A" ? 1 : Number(rank)
	return (
		<>
			{corners}
			{COURT[rank] ? (
				<>
					<rect className="card-frame" x="15" y="15" width="30" height="54" rx="3" />
					{COURT[rank]}
				</>
			) : count === 1 ? (
				<g transform={at(C, 42, 2.4)}>{mark}</g>
			) : PIPS[count] ? (
				PIPS[count].map(([x, y]) => (
					<g key={`${x}-${y}`} transform={at(x, y, 0.95, y > 42)}>
						{mark}
					</g>
				))
			) : (
				<text className="card-numeral" x={C} y="52" fontSize="28">
					{rank}
				</text>
			)}
		</>
	)
}

/** Pass a face to show it, leave it out for a card lying face down. */
export function PlayingCard({ face, className = "" }: { face?: CardFace; className?: string }) {
	const red = face?.suit === "hearts" || face?.suit === "diamonds"
	const tone = face?.tone === undefined ? "" : `seat${face.tone} is-toned`
	return (
		<svg
			className={`playing-card ${face ? "" : "is-back"} ${red ? "is-red" : ""} ${tone} ${className}`}
			viewBox="0 0 60 84"
			aria-hidden="true"
		>
			<rect className="card-body" x="1.25" y="1.25" width="57.5" height="81.5" rx="6" />
			{face ? (
				<Face {...face} />
			) : (
				<>
					<rect className="card-frame" x="6" y="6" width="48" height="72" rx="3" />
					{[18, 30, 42].flatMap((x) =>
						[16, 29, 55, 68].map((y) => (
							<g key={`${x}-${y}`} className="card-lattice" transform={at(x, y, 0.7)}>
								{SPARK}
							</g>
						)),
					)}
					<Glyph name="moon" x="19" y="31" width="22" height="22" />
				</>
			)}
		</svg>
	)
}
