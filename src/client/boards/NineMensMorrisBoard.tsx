import { type CSSProperties, useState } from "react"
import {
	MORRIS_EDGES,
	MORRIS_POINTS,
	type NineMensMorrisMove,
	type NineMensMorrisState,
	morrisMoves,
} from "../../shared/games/nineMensMorris"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"

export function NineMensMorrisBoard({
	view,
	seat,
	names,
	canAct,
	onMove,
}: BoardProps<NineMensMorrisState, NineMensMorrisMove>) {
	const { tx } = useLang()
	const [selection, setSelection] = useState<{ state: NineMensMorrisState; from: number } | null>(null)
	const selected = selection?.state === view ? selection.from : null
	const moves = canAct ? morrisMoves(view) : []
	const phase = view.capture
		? "Capture a rival stone"
		: view.reserve[view.turn] > 0
			? "Place a stone"
			: view.cells.filter((owner) => owner === view.turn).length === 3
				? "Fly to any empty point"
				: "Slide along a line"
	const click = (at: number) => {
		const target = moves.find((move) =>
			move.type === "capture"
				? move.at === at
				: move.type === "place"
					? move.to === at
					: move.to === at && move.from === selected,
		)
		if (target) {
			setSelection(null)
			onMove(target)
			return
		}
		setSelection({ state: view, from: at })
	}
	return (
		<div className="morris">
			<p className="morris-phase">{tx(view.result ? "Circle closed" : phase)}</p>
			<div className="morris-reserves">
				{names.map((name, who) => (
					<span
						key={who}
						className={`seat${who}`}
						aria-label={`${name}: ${tx(`${view.reserve[who]} to place, ${view.cells.filter((owner) => owner === who).length} on board`)}`}
					>
						{name}
						{/* The stones still in hand, drawn as a pile that shrinks as they go down. */}
						<span className="morris-pile">
							{Array.from({ length: view.reserve[who]! }, (_, n) => (
								<i key={n} className="orb" />
							))}
							{view.reserve[who] === 0 && <small>{tx("all placed")}</small>}
						</span>
					</span>
				))}
			</div>
			<div className="morris-board" role="group" aria-label={tx("Nine Men's Morris board")}>
				<svg className="morris-lines" viewBox="-0.55 -0.55 7.1 7.1" aria-hidden="true">
					{MORRIS_EDGES.map(([a, b]) => (
						<line
							key={`${a}-${b}`}
							x1={MORRIS_POINTS[a][0]}
							y1={MORRIS_POINTS[a][1]}
							x2={MORRIS_POINTS[b][0]}
							y2={MORRIS_POINTS[b][1]}
						/>
					))}
				</svg>
				{MORRIS_POINTS.map(([x, y], at) => {
					const owner = view.cells[at]
					const actionable = moves.some((move) =>
						move.type === "capture"
							? move.at === at
							: move.type === "place"
								? move.to === at
								: move.from === at || (move.from === selected && move.to === at),
					)
					return (
						<button
							key={at}
							className={`morris-point ${owner === null ? "is-empty" : `seat${owner}`} ${selected === at ? "is-selected" : ""} ${actionable ? "is-legal" : ""}`}
							style={{ left: `${((x + 0.55) / 7.1) * 100}%`, top: `${((y + 0.55) / 7.1) * 100}%` } as CSSProperties}
							disabled={!actionable}
							onClick={() => click(at)}
							aria-pressed={selected === at}
							aria-label={tx(
								`Point ${at + 1}, ${owner === null ? "empty" : owner === seat ? "your stone" : `${names[owner]}’s stone`}`,
							)}
						>
							{owner !== null && <span className="orb" />}
						</button>
					)
				})}
			</div>
			<p className="morris-hint">
				{tx(
					selected !== null
						? "Choose a marked destination, or select another stone."
						: view.capture
							? "A mill grants one capture. Protected stones stay unless all are protected."
							: "Three stones on a connected line form a mill.",
				)}
			</p>
		</div>
	)
}
