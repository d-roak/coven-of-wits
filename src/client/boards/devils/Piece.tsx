import type { TrialPiece } from "../../../shared/games/devils/trial"
import { Die } from "../../art/Die"
import { Glyph } from "../../art/Glyph"
import { PlayingCard } from "../../art/PlayingCard"

export function Piece({ piece }: { piece: TrialPiece }) {
	const tone = "tone" in piece && piece.tone !== undefined ? `seat${piece.tone}` : ""
	switch (piece.kind) {
		case "card":
			return <PlayingCard face={piece} />
		case "back":
			return <PlayingCard />
		case "die":
			return (
				<span className={`piece-die ${tone}`} aria-hidden="true">
					<Die face={piece.value} size={54} />
				</span>
			)
		case "tile":
			return (
				<span className={`piece-tile ${tone} ${piece.text.length > 3 ? "is-word" : ""}`} aria-hidden="true">
					{piece.text}
				</span>
			)
		case "token":
			return (
				<span className={`piece-token ${tone}`} aria-hidden="true">
					<Glyph name={piece.icon} />
					{piece.text && <small>{piece.text}</small>}
				</span>
			)
		case "shape": {
			const xs = piece.cells.map(([x]) => x),
				ys = piece.cells.map(([, y]) => y)
			const left = Math.min(0, ...xs),
				top = Math.min(0, ...ys)
			const width = Math.max(0, ...xs) - left + 1,
				height = Math.max(0, ...ys) - top + 1
			return (
				<svg
					aria-hidden="true"
					className={`piece-shape ${tone}`}
					viewBox={`${left * 20 - 2} ${top * 20 - 2} ${width * 20 + 4} ${height * 20 + 4}`}
				>
					{piece.cells.map(([x, y], i) => (
						<rect key={i} x={x * 20} y={y * 20} width="19" height="19" rx="3" />
					))}
				</svg>
			)
		}
		case "stack":
			return (
				<span className="piece-stack" aria-hidden="true">
					{piece.owners.map((owner, i) => (
						<i className={`seat${owner}`} key={i} style={{ bottom: i * 5 }}>
							{owner + 1}
						</i>
					))}
				</span>
			)
		case "portrait":
			return (
				<span className={`piece-portrait seat${piece.cloak}`} aria-hidden="true">
					<Glyph name={piece.animal} className="portrait-face" />
					<span className="portrait-cloak">
						<Glyph name={piece.sigil} />
					</span>
				</span>
			)
		default: {
			const unexpected: never = piece
			return unexpected
		}
	}
}
