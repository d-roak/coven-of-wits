import type { CSSProperties } from "react"
import { games } from "../../shared/games"
import type { TrialPiece } from "../../shared/games/devils/trial"
import { GLYPH_NAMES } from "../art/Glyph"
import { RUNE_NAMES, Rune } from "../art/Rune"
import { Piece } from "../boards/devils/Piece"
import { BESPOKE, gamePieces } from "./kitInventory"
import "../boards/devils/trial.css"
import "./kit.css"

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
const SUITS = ["spades", "hearts", "clubs", "diamonds"] as const
const sheets: { title: string; note: string; pieces: TrialPiece[] }[] = [
	{
		title: "Suited cards",
		note: "Sniper Hold’em, Memory Poker, Question and Truth.",
		pieces: [...RANKS.map((rank, i) => ({ kind: "card" as const, rank, suit: SUITS[i % 4]! })), { kind: "back" }],
	},
	{
		title: "Plain, role and colour cards",
		note: "A short rank gets corners and a numeral. A word gets a title card, with a glyph when the game names one.",
		pieces: [
			{ kind: "card", rank: "0" },
			{ kind: "card", rank: "7" },
			{ kind: "card", rank: "13" },
			{ kind: "card", rank: "A" },
			{ kind: "card", rank: "Hexer", icon: "skull", tone: 0 },
			{ kind: "card", rank: "Researcher", icon: "book", tone: 1 },
			{ kind: "card", rank: "quotient" },
			{ kind: "card", rank: "violet", tone: 3 },
			{ kind: "card", rank: "Skip" },
		],
	},
	{
		title: "Dice, tiles, stacks and shapes",
		note: "Seat tone comes from the seat colour tokens.",
		pieces: [
			...[1, 2, 3, 4, 5, 6].map((value) => ({ kind: "die" as const, value })),
			{ kind: "die", value: 5, tone: 1 },
			{ kind: "tile", text: "7" },
			{ kind: "tile", text: "W", tone: 2 },
			{ kind: "tile", text: "+ 3" },
			{ kind: "stack", owners: [0, 1, 0] },
			{
				kind: "shape",
				cells: [
					[0, 0],
					[1, 0],
					[1, 1],
					[2, 1],
				],
				tone: 2,
			},
			{ kind: "portrait", animal: "fox", cloak: 3, sigil: "moon" },
			{ kind: "portrait", animal: "owl", cloak: 0, sigil: "star" },
		],
	},
]

const cells: TrialPiece[] = [
	{ kind: "card", rank: "10", suit: "hearts" },
	{ kind: "card", rank: "K", suit: "spades" },
	{ kind: "back" },
	{ kind: "token", icon: "tiger", tone: 0 },
	{ kind: "token", icon: "coin", text: "30" },
	{ kind: "tile", text: "-2" },
	{ kind: "die", value: 4 },
	{ kind: "stack", owners: [1, 0] },
	{ kind: "token", icon: "goat", tone: 1 },
	{ kind: "card", rank: "7" },
	{ kind: "token", icon: "owl", tone: 3 },
	{ kind: "tile", text: "W", tone: 2 },
]

function Row({ pieces }: { pieces: { label?: string; piece: TrialPiece }[] }) {
	return (
		<div className="piece-row">
			{pieces.map(({ label, piece }, i) => (
				<figure key={i}>
					<Piece piece={piece} />
					{label && <figcaption>{label}</figcaption>}
				</figure>
			))}
		</div>
	)
}

/** The component sheet: every shared graphic, then what each game puts on the table. Open with ?kit. */
export function Kit() {
	return (
		<main className="kit">
			<h1>Component sheet</h1>
			<section>
				<h2>Glyphs</h2>
				<p>{GLYPH_NAMES.length} original drawings. One name, one picture.</p>
				<Row pieces={GLYPH_NAMES.map((icon, i) => ({ label: icon, piece: { kind: "token", icon, tone: i % 5 } }))} />
			</section>
			{sheets.map((sheet) => (
				<section key={sheet.title}>
					<h2>{sheet.title}</h2>
					<p>{sheet.note}</p>
					<Row pieces={sheet.pieces.map((piece) => ({ piece }))} />
				</section>
			))}
			<section>
				<h2>In a board cell</h2>
				<p>The same pieces at the size a six-column board gives them.</p>
				<div className="trial-grid" style={{ "--columns": 6 } as CSSProperties}>
					{cells.map((piece, i) => (
						<span key={i} className="trial-cell is-static">
							<Piece piece={piece} />
						</span>
					))}
				</div>
			</section>
			<section>
				<h2>Rune stones</h2>
				<div className="piece-row">
					{RUNE_NAMES.map((name, kind) => (
						<figure key={name}>
							<Rune kind={kind} />
							<figcaption>{name}</figcaption>
						</figure>
					))}
				</div>
			</section>
			<section>
				<h2>Components by game</h2>
				<p>{games.length} games. One example of each piece a game draws.</p>
				<div className="kit-games">
					{games.map((game) => {
						const pieces = BESPOKE[game.id] ? [] : gamePieces(game)
						return (
							<article key={game.id}>
								<h3>{game.name}</h3>
								{BESPOKE[game.id] && <p>{BESPOKE[game.id]}</p>}
								{pieces.length > 0 && <Row pieces={pieces.map((piece) => ({ piece }))} />}
								{!BESPOKE[game.id] && pieces.length === 0 && <p>Text and typed answers only.</p>}
							</article>
						)
					})}
				</div>
			</section>
		</main>
	)
}
