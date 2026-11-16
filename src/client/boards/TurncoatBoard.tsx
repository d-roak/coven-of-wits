import { type CSSProperties, useState } from "react"
import { type TurncoatMove, type TurncoatState, legalMoves, flips } from "../../shared/games/turncoat"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"
import "./classicUx.css"

/** Squares between a cell and the last move, counting diagonals as one. Drives the flip ripple. */
function distance(cell: number, last: number | null): number {
	if (last === null) return 0
	return Math.max(Math.abs(Math.floor(cell / 8) - Math.floor(last / 8)), Math.abs((cell % 8) - (last % 8)))
}

export function TurncoatBoard({ view, seat, canAct, onMove }: BoardProps<TurncoatState, TurncoatMove>) {
	const { tx } = useLang()
	const position = view.cells.join(",")
	const [draft, setDraft] = useState<{ position: string; cell: number } | null>(null)
	const selected = canAct && draft?.position === position ? draft.cell : null
	const preview = selected === null ? [] : flips(view.cells, seat, selected)
	const legal = canAct ? legalMoves(view.cells, seat) : []
	const count = (who: number) => view.cells.filter((c) => c === who).length
	return (
		<div className="tc">
			<p className="tally">
				<span className="orb seat0 tally-orb" /> {count(0)}
				<span className="orb seat1 tally-orb" /> {count(1)}
			</p>
			<div className={`tc-grid seat${seat}`}>
				{view.cells.map((owner, cell) => (
					<button
						key={cell}
						className={`tc-cell ${cell === view.last ? "is-last" : ""} ${preview.includes(cell) || selected === cell ? "classic-preview" : ""}`}
						disabled={!legal.includes(cell)}
						onClick={() => setDraft({ position, cell })}
						aria-pressed={selected === cell}
						aria-label={tx(
							`Row ${Math.floor(cell / 8) + 1}, column ${(cell % 8) + 1}${owner == null ? "" : owner === seat ? ", yours" : ", rival"}`,
						)}
					>
						{/* Keyed by owner so a flipped disc remounts and replays its flip, later the further it is from the move. */}
						{owner != null && (
							<span
								key={owner}
								className={`orb seat${owner} tc-disc`}
								style={{ "--d": distance(cell, view.last) } as CSSProperties}
							/>
						)}
						{selected === cell ? (
							<span className={`orb seat${seat} classic-ghost`} />
						) : (
							legal.includes(cell) && <span className="tc-hint" />
						)}
					</button>
				))}
			</div>
			{canAct && (
				<div className="classic-confirm">
					<p aria-live="polite">
						{tx(
							selected === null
								? "Choose a square to preview the flips."
								: `${preview.length} ${preview.length === 1 ? "disc" : "discs"} will turn.`,
						)}
					</p>
					<button
						className="btn"
						disabled={selected === null}
						onClick={() => {
							if (selected !== null) {
								onMove({ cell: selected })
								setDraft(null)
							}
						}}
					>
						{tx("Place disc")}
					</button>
				</div>
			)}
		</div>
	)
}
