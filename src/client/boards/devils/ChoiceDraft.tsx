import { useState, useRef, type ReactNode } from "react"
import type { TrialChoice, TrialMove } from "../../../shared/games/devils/trial"
import { useLang } from "../../i18n"
import { draftMove, draftOptions, matchingChoices } from "./draft"
import { Piece } from "./Piece"

export function ChoiceDraft({
	choices,
	canAct,
	onMove,
	renderChoice,
}: {
	choices: TrialChoice[]
	canAct: boolean
	onMove(move: TrialMove): void
	renderChoice?(choice: TrialChoice): ReactNode
}) {
	const { tx } = useLang()
	const heading = useRef<HTMLHeadingElement>(null)
	const [path, setPath] = useState<string[]>([])
	const changePath = (next: string[]) => {
		setPath(next)
		requestAnimationFrame(() => heading.current?.focus())
	}
	const options = draftOptions(choices, path)
	const picked = draftMove(choices, path)
	const branch = matchingChoices(choices, path)[0]
	return (
		<section className="choice-draft" aria-label={tx("Build your move")}>
			<ol className="draft-trail" aria-label={tx("Selected steps")}>
				{path.map((key, i) => (
					<li key={`${i}-${key}`}>
						<button className="btn is-ghost" disabled={!canAct} onClick={() => changePath(path.slice(0, i))}>
							<small>{i + 1}</small>
							{branch?.steps?.[i]?.label}
						</button>
					</li>
				))}
			</ol>
			<h3 ref={heading} tabIndex={-1}>
				{picked ? tx("Review your move") : options[0]?.prompt}
			</h3>
			{options.length > 0 && (
				<div className="piece-options">
					{options.map((option) => (
						<button
							key={option.key}
							className={`piece-option ${option.piece ? "has-piece" : ""}`}
							disabled={!canAct}
							onClick={() => changePath([...path, option.key])}
						>
							{option.piece && <Piece piece={option.piece} />}
							<span>{option.label}</span>
						</button>
					))}
				</div>
			)}
			{picked &&
				(renderChoice ? (
					renderChoice(picked)
				) : (
					<div className="draft-confirm">
						<p>{picked.label}</p>
						<button
							className="btn"
							disabled={!canAct}
							onClick={() => {
								onMove(picked.move)
							}}
						>
							{tx("Confirm move")}
						</button>
					</div>
				))}
			{path.length > 0 && (
				<button className="btn is-ghost" disabled={!canAct} onClick={() => changePath(path.slice(0, -1))}>
					{tx("Back one step")}
				</button>
			)}
		</section>
	)
}
