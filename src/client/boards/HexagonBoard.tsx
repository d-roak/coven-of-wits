import { useState } from "react"
import {
	HEX_CELLS,
	HEX_MISTAKES,
	hexagonCandidates,
	type HexagonMove,
	type HexagonView,
} from "../../shared/games/hexagon"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"

const letter = (cell: number) => String.fromCharCode(65 + cell)

export function HexagonBoard({ view, canAct, onMove }: BoardProps<HexagonView, HexagonMove>) {
	const { tx } = useLang()
	const [selected, setSelected] = useState<number[]>([])
	const studying = view.phase === "study"
	const candidates = hexagonCandidates(selected)
	const repeated =
		selected.length === 3 && view.guesses.some((guess) => selected.every((cell) => guess.cells.includes(cell)))
	const choose = (cell: number) =>
		setSelected(selected.includes(cell) ? selected.filter((n) => n !== cell) : [...selected, cell])
	return (
		<div className="hexagon-board arcana-board">
			<div className="arcana-summary">
				<strong>{tx(studying ? "Commit the numbers to memory" : `Trace a sum of ${view.target}`)}</strong>
				<p>
					{tx(
						studying
							? "The target appears once you hide the numbers."
							: `${view.remaining} lines left · ${HEX_MISTAKES - view.mistakes} chances left`,
					)}
				</p>
			</div>
			<div className="hexagon-grid" aria-label={tx("Memory hexagon")}>
				{[-2, -1, 0, 1, 2].map((row) => (
					<div className="hexagon-row" key={row}>
						{HEX_CELLS.flatMap((cell, i) =>
							cell.r !== row
								? []
								: [
										<button
											key={i}
											className={`hexagon-cell ${selected.includes(i) ? "is-selected" : ""}`}
											disabled={!canAct || studying || (!selected.includes(i) && !candidates.includes(i))}
											aria-pressed={selected.includes(i)}
											aria-label={`${letter(i)}${view.numbers ? `: ${view.numbers[i]}` : ""}`}
											onClick={() => choose(i)}
										>
											<span>{view.numbers ? view.numbers[i] : letter(i)}</span>
											{view.numbers && <small>{letter(i)}</small>}
										</button>,
									],
						)}
					</div>
				))}
			</div>
			{canAct &&
				(studying ? (
					<button className="btn" onClick={() => onMove({ type: "hide" })}>
						{tx("Hide numbers")}
					</button>
				) : (
					<div className="hexagon-controls">
						<p aria-live="polite">
							{tx(
								repeated
									? "You already traced this line. Choose another."
									: selected.length
										? `${selected.map(letter).join(" + ")} · ${selected.length} of 3 chosen`
										: "Choose the first hex. The next choices will follow a straight line.",
							)}
						</p>
						<button
							className="btn is-ghost"
							disabled={selected.length === 0}
							onClick={() => setSelected(selected.slice(0, -1))}
						>
							{tx("Undo hex")}
						</button>
						<button
							className="btn"
							disabled={selected.length !== 3 || repeated}
							onClick={() => {
								onMove({ type: "guess", cells: selected })
								setSelected([])
							}}
						>
							{tx("Trace sum")}
						</button>
					</div>
				))}
			{view.guesses.length > 0 && (
				<div className="hexagon-history" aria-live="polite">
					<p>{tx(`Score: ${view.score}`)}</p>
					<ol>
						{view.guesses.map((guess, i) => (
							<li key={i}>
								{guess.cells.map(letter).join(" · ")} <strong>{guess.correct ? "+1" : "−1"}</strong>
							</li>
						))}
					</ol>
				</div>
			)}
		</div>
	)
}
