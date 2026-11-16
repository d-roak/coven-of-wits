import { BackspaceIcon } from "@phosphor-icons/react"
import { type CSSProperties, useState } from "react"
import { RUNES, type RuneCipherMove, type RuneCipherView, SLOTS, TRIES } from "../../shared/games/runeCipher"
import { RUNE_NAMES, Rune } from "../art/Rune"
import { useLang } from "../i18n"
import type { BoardProps } from "./types"
import "./classicUx.css"

function Slots({ code }: { code: number[] }) {
	return (
		<span className="rc-slots">
			{Array.from({ length: SLOTS }, (_, i) =>
				code[i] === undefined ? <span key={i} className="rc-blank" /> : <Rune key={i} kind={code[i]} />,
			)}
		</span>
	)
}

export function RuneCipherBoard({ view, canAct, onMove }: BoardProps<RuneCipherView, RuneCipherMove>) {
	const { tx } = useLang()
	// The half-typed guess is the only state a board keeps: it is not a move until it is cast.
	const [draft, setDraft] = useState<number[]>([])
	const [editing, setEditing] = useState<number | null>(null)
	const cast = () => {
		onMove({ code: draft })
		setDraft([])
		setEditing(null)
	}
	return (
		<div className="rc">
			<div className="rc-seal">
				{view.secret ? (
					<Slots code={view.secret} />
				) : (
					<span className="rc-sealed">{tx(`The seal holds ${SLOTS} runes`)}</span>
				)}
			</div>
			<p className="classic-help">
				{tx("Filled mark: right rune and place. Hollow mark: right rune, different place.")}
			</p>
			<ol className="rc-rows">
				{Array.from({ length: TRIES }, (_, row) => {
					const guess = view.guesses[row]
					const current = row === view.guesses.length && canAct
					return (
						<li key={row} className={`rc-row ${current ? "is-current" : ""}`}>
							{current ? (
								<span className="rc-slots">
									{Array.from({ length: SLOTS }, (_, slot) => (
										<button
											key={slot}
											className={`rc-edit-slot ${editing === slot ? "is-selected" : ""}`}
											disabled={slot > draft.length}
											aria-label={tx(
												`Edit rune ${slot + 1}${draft[slot] === undefined ? ", empty" : `, ${RUNE_NAMES[draft[slot]!]}`}`,
											)}
											aria-pressed={editing === slot}
											onClick={() => setEditing(slot)}
										>
											{draft[slot] === undefined ? <span className="rc-blank" /> : <Rune kind={draft[slot]!} />}
										</button>
									))}
								</span>
							) : (
								<Slots code={guess ? guess.code : []} />
							)}
							<span
								className="rc-pips"
								aria-label={guess ? tx(`${guess.exact} in place, ${guess.near} misplaced`) : undefined}
							>
								{Array.from({ length: SLOTS }, (_, i) => (
									<i
										key={i}
										style={{ "--i": i } as CSSProperties}
										className={
											!guess ? "" : i < guess.exact ? "is-exact" : i < guess.exact + guess.near ? "is-near" : ""
										}
									/>
								))}
							</span>
						</li>
					)
				})}
			</ol>
			{canAct && (
				<div className="rc-input">
					<p className="classic-help">
						{tx(
							editing === null
								? "Choose runes in order. Tap a filled slot to change it."
								: `Choose a replacement for slot ${editing + 1}.`,
						)}
					</p>
					<div className="rc-palette">
						{Array.from({ length: RUNES }, (_, kind) => (
							<button
								key={kind}
								className="rc-key"
								disabled={draft.length >= SLOTS && editing === null}
								onClick={() => {
									const next = [...draft]
									next[editing ?? draft.length] = kind
									setDraft(next)
									setEditing(null)
								}}
								aria-label={tx(`${editing === null ? "Add" : "Set"} ${RUNE_NAMES[kind]}`)}
							>
								<Rune kind={kind} />
							</button>
						))}
					</div>
					<div className="rc-actions">
						<button
							className="btn is-ghost"
							disabled={draft.length === 0}
							onClick={() => {
								setDraft(draft.slice(0, -1))
								setEditing(null)
							}}
							aria-label={tx("Remove last rune")}
						>
							<BackspaceIcon weight="bold" />
						</button>
						<button className="btn" disabled={draft.length < SLOTS} onClick={cast}>
							{tx("Cast")}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
