import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react"
import { type KnightsTourMove, type KnightsTourState, SIZE, openTargets } from "../../shared/games/knightsTour"
import { Poff } from "../art/Poff"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"

export function KnightsTourBoard({ view, canAct, onMove }: BoardProps<KnightsTourState, KnightsTourMove>) {
	const { tx } = useLang()
	const targets = canAct ? openTargets(view.path) : []
	const here = view.path.at(-1)
	const stuck = canAct && targets.length === 0
	return (
		<div className="kt">
			<div className="kt-grid">
				{Array.from({ length: SIZE * SIZE }, (_, cell) => {
					const step = view.path.indexOf(cell)
					const dark = (Math.floor(cell / SIZE) + (cell % SIZE)) % 2 === 1
					return (
						<button
							key={cell}
							className={`kt-cell ${dark ? "is-dark" : ""} ${step >= 0 ? "is-visited" : ""} ${targets.includes(cell) && here !== undefined ? "is-target" : ""}`}
							disabled={!targets.includes(cell)}
							onClick={() => onMove({ type: "go", cell })}
							aria-label={tx(
								`Row ${Math.floor(cell / SIZE) + 1}, column ${(cell % SIZE) + 1}${step >= 0 ? `, step ${step + 1}` : ""}`,
							)}
						>
							{cell === here ? (
								<span className="kt-knight">
									<Poff look="ember" size={46} mood={stuck ? "sad" : "idle"} />
								</span>
							) : step >= 0 ? (
								<span className="kt-step">{step + 1}</span>
							) : null}
						</button>
					)
				})}
			</div>
			<div className="kt-foot">
				<span className="tally">{tx(`${view.path.length} of ${SIZE * SIZE}`)}</span>
				<button
					className="btn is-ghost"
					disabled={!canAct || view.path.length === 0}
					onClick={() => onMove({ type: "undo" })}
				>
					<ArrowCounterClockwiseIcon weight="bold" /> {tx("Undo")}
				</button>
			</div>
			<p className="kt-hint">
				{tx(
					here === undefined
						? "Tap any square to set the knight down."
						: stuck
							? "Dead end. Undo a step or two."
							: "Move two squares one way, then one sideways. Glowing squares are reachable.",
				)}
			</p>
		</div>
	)
}
