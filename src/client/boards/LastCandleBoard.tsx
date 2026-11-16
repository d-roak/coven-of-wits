import { useState } from "react"
import "./classicUx.css"
import type { LastCandleMove, LastCandleState } from "../../shared/games/lastCandle"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"

export function Candle({ lit }: { lit: boolean }) {
	return (
		<svg viewBox="0 0 40 80" className="candle" aria-hidden="true">
			{lit ? (
				<path className="candle-flame" d="M20 4 C28 14 29 22 20 28 C11 22 12 14 20 4 Z" />
			) : (
				<path className="candle-smoke" d="M20 26 q-5 -6 0 -11 q5 -5 0 -11" />
			)}
			<path className="candle-wick" d="M20 27 v8" />
			<path className="candle-wax" d={lit ? "M9 36 H31 V74 H9 Z" : "M9 52 H31 V74 H9 Z"} />
			<path
				className="candle-drip"
				d={lit ? "M9 36 H31 V42 q-4 6 -7 0 q-4 9 -8 0 q-3 5 -7 0 Z" : "M9 52 H31 V56 q-6 5 -11 0 q-5 4 -11 0 Z"}
			/>
		</svg>
	)
}

export function LastCandleBoard({ view, canAct, onMove }: BoardProps<LastCandleState, LastCandleMove>) {
	const { tx } = useLang()
	const position = view.rows.join(",")
	const [draft, setDraft] = useState<{ position: string; row: number; take: number } | null>(null)
	const selected = canAct && draft?.position === position ? draft : null
	return (
		<div className="lc">
			{view.start.map((total, row) => (
				<div key={row} className="lc-row">
					{Array.from({ length: total }, (_, i) => {
						const lit = i < view.rows[row]!
						const take = view.rows[row]! - i
						return (
							<button
								key={i}
								className={`lc-candle ${lit ? "is-lit" : ""} ${lit && selected?.row === row && take <= selected.take ? "classic-snuff" : ""}`}
								disabled={!canAct || !lit}
								onClick={() => setDraft({ position, row, take })}
								aria-pressed={selected?.row === row && selected.take === take}
								aria-label={tx(lit ? `Row ${row + 1}: snuff ${take}` : `Row ${row + 1}: snuffed candle`)}
							>
								<Candle lit={lit} />
							</button>
						)
					})}
				</div>
			))}
			{canAct && (
				<div className="classic-confirm">
					<p aria-live="polite">
						{tx(
							selected
								? `Snuff ${selected.take} in row ${selected.row + 1}.`
								: "Choose a candle to mark it and every lit one to its right.",
						)}
					</p>
					<button
						className="btn"
						disabled={!selected}
						onClick={() => {
							if (selected) {
								onMove({ row: selected.row, take: selected.take })
								setDraft(null)
							}
						}}
					>
						{tx("Snuff candles")}
					</button>
				</div>
			)}
		</div>
	)
}
