import { type CSSProperties, useState } from "react"
import { COLS, ROWS, type RuneDropMove, type RuneDropState, landing } from "../../shared/games/runeDrop"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"
import "./classicUx.css"

export function RuneDropBoard({ view, seat, canAct, onMove }: BoardProps<RuneDropState, RuneDropMove>) {
	const { tx } = useLang()
	const position = view.cells.join(",")
	const [draft, setDraft] = useState<{ position: string; col: number } | null>(null)
	const selected = canAct && draft?.position === position ? draft.col : null
	return (
		<div className="classic-flow">
			<div className={`rd seat${seat}`}>
				{Array.from({ length: COLS }, (_, col) => (
					<button
						key={col}
						className="rd-col"
						disabled={!canAct || landing(view.cells, col) === null}
						onClick={() => setDraft({ position, col })}
						aria-pressed={selected === col}
						aria-label={tx(`Drop an orb in column ${col + 1}`)}
					>
						{Array.from({ length: ROWS }, (_, row) => {
							const at = row * COLS + col
							const owner = view.cells[at]
							return (
								<span
									key={row}
									className={`rd-hole ${selected === col && at === landing(view.cells, col) ? "is-landing" : ""}`}
								>
									{owner == null && selected === col && at === landing(view.cells, col) && (
										<span className={`orb seat${seat} classic-ghost`} />
									)}
									{owner != null && (
										<span
											className={`orb seat${owner} ${at === view.last ? "rd-fall" : ""} ${view.line?.includes(at) ? "is-winning" : ""}`}
											style={{ "--row": row } as CSSProperties}
										/>
									)}
								</span>
							)
						})}
					</button>
				))}
			</div>
			{canAct && (
				<div className="classic-confirm">
					<p aria-live="polite">
						{tx(selected === null ? "Choose a column to preview your orb." : `Column ${selected + 1} selected.`)}
					</p>
					<button
						className="btn"
						disabled={selected === null}
						onClick={() => {
							if (selected !== null) {
								onMove({ col: selected })
								setDraft(null)
							}
						}}
					>
						{tx("Drop orb")}
					</button>
				</div>
			)}
		</div>
	)
}
