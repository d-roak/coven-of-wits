import { useState, type CSSProperties, type FormEvent } from "react"
import type { TrialMove, TrialRound, TrialView } from "../../../shared/games/devils/trial"
import { useLang } from "../../i18n"
import { localise } from "../../lang/engineText"
import type { BoardProps } from "../types"
import { BaghGraph } from "./BaghGraph"
import { CubePile } from "./CubePile"
import { Piece } from "./Piece"
import { ChoiceDraft } from "./ChoiceDraft"
import { MoveForm, FormDraft } from "./MoveForm"
import { BalanceDraft } from "./BalanceDraft"
import "./trial.css"

function TrialControls({ view, canAct, onMove }: Pick<BoardProps<TrialView, TrialMove>, "view" | "canAct" | "onMove">) {
	const [answer, setAnswer] = useState("")
	const [selected, setSelected] = useState<string[]>([])
	const [letters, setLetters] = useState<number[]>([])
	const [anchor, setAnchor] = useState<number | null>(null)
	const { tx } = useLang()
	const send = (move: TrialMove) => {
		onMove(move)
	}
	const toggle = (value: string) =>
		setSelected(
			selected.includes(value)
				? selected.filter((item) => item !== value)
				: selected.length < (view.selection?.max ?? 0)
					? [...selected, value]
					: selected,
		)
	const submit = (event: FormEvent) => {
		event.preventDefault()
		if (view.input && canAct && answer.trim()) send({ action: view.input.action, value: answer.trim() })
	}
	const suppliedActions = new Set([
		...(view.forms?.map((form) => form.action) ?? []),
		...(view.balance ? [view.balance.action] : []),
		...(view.selection ? [view.selection.action] : []),
	])
	const choices = view.choices.filter((choice) => !suppliedActions.has(choice.move.action))
	const staged = choices.filter((choice) => choice.steps?.length)
	const immediate = choices.filter((choice) => !choice.steps?.length)
	const footprint = anchor === null ? [] : (view.board?.cells[anchor]?.preview ?? [anchor])
	return (
		<>
			{view.cubes && <CubePile columns={view.cubes.columns} heights={view.cubes.heights} />}
			{view.board && (
				<div className="board-workspace">
					<div
						className={`trial-grid ${view.board.layout ? `layout-${view.board.layout}` : ""}`}
						role="group"
						aria-label={tx("Game board")}
						style={{ "--columns": view.board.columns } as CSSProperties}
					>
						{view.board.layout === "bagh" && <BaghGraph />}
						{view.board.cells.map((cell, index) => {
							const value = String(index)
							const option = view.selection?.onBoard
								? view.selection.options.find((option) => option.value === value)
								: undefined
							const active = selected.includes(value) || anchor === index
							const className = `trial-cell ${cell.tone === undefined ? "" : `seat${cell.tone}`} ${cell.walls?.map((wall) => `wall-${wall}`).join(" ") ?? ""} ${active ? "is-selected" : ""} ${footprint.includes(index) ? "is-preview" : ""}`
							const row = view.board?.layout === "pyramid" ? Math.floor((Math.sqrt(8 * index + 1) - 1) / 2) : 0
							const column = index - (row * (row + 1)) / 2
							const position: CSSProperties | undefined =
								view.board?.layout === "pyramid"
									? { gridRow: row + 1, gridColumn: `${4 - row + column * 2} / span 2` }
									: view.board?.layout === "mancala"
										? { gridRow: index < 7 ? 1 : 2, gridColumn: index < 7 ? index + 1 : 14 - index }
										: undefined
							const content = (
								<>
									{cell.piece ? <Piece piece={cell.piece} /> : cell.label || "·"}
									{view.selection?.onBoard && selected.includes(value) && (
										<span className="selection-order">{selected.indexOf(value) + 1}</span>
									)}
								</>
							)
							return option || cell.move ? (
								<button
									key={index}
									style={position}
									className={className}
									disabled={
										!canAct || (!!option && !selected.includes(value) && selected.length >= view.selection!.max)
									}
									aria-label={tx(`${cell.label || "Empty"}, position ${index + 1}`)}
									aria-pressed={option || view.board?.confirm ? active : undefined}
									onClick={() => {
										if (option) toggle(value)
										else if (view.board?.confirm) setAnchor(index)
										else if (cell.move) send(cell.move)
									}}
								>
									{content}
								</button>
							) : (
								<span
									key={index}
									style={position}
									className={`${className} is-static`}
									role={cell.piece ? "img" : undefined}
									aria-label={tx(`${cell.label || "Empty"}, position ${index + 1}`)}
								>
									{content}
								</span>
							)
						})}
					</div>
					{view.board.confirm && view.board.cells.some((cell) => cell.move) && (
						<div className="board-confirm">
							<p>
								{anchor === null
									? tx("Select a highlighted position to preview your move.")
									: tx(`Position ${anchor + 1} selected. You can choose another before confirming.`)}
							</p>
							<button
								className="btn"
								disabled={!canAct || anchor === null || !view.board.cells[anchor]?.move}
								onClick={() => {
									if (anchor !== null && view.board?.cells[anchor]?.move) send(view.board.cells[anchor].move!)
								}}
							>
								{view.board.confirm}
							</button>
							{anchor !== null && (
								<button className="btn is-ghost" onClick={() => setAnchor(null)}>
									{tx("Clear preview")}
								</button>
							)}
						</div>
					)}
				</div>
			)}
			{view.selection && (
				<fieldset className="trial-selection" disabled={!canAct}>
					<legend>{view.selection.label}</legend>
					<p>
						{tx(
							`Choose ${
								view.selection.min === view.selection.max
									? view.selection.min
									: `${view.selection.min}–${view.selection.max}`
							}. Selected: ${selected.length}.`,
						)}
						{view.selection.ordered ? ` ${tx("Selection order matters.")}` : ""}
					</p>
					{selected.length > 0 && (
						<ol className="selection-tray" aria-label={tx("Selected pieces")}>
							{selected.map((value, index) => {
								const option = view.selection!.options.find((option) => option.value === value)!
								return (
									<li key={value}>
										<button
											className="piece-option"
											aria-label={tx(`Remove ${option.label}, selection ${index + 1}`)}
											onClick={() => toggle(value)}
										>
											{option.piece && <Piece piece={option.piece} />}
											<span>
												{index + 1}. {option.label}
											</span>
										</button>
									</li>
								)
							})}
						</ol>
					)}
					{!view.selection.onBoard && (
						<div className="piece-options">
							{view.selection.options.map((option) => (
								<button
									key={option.value}
									className={`piece-option ${selected.includes(option.value) ? "is-selected" : ""}`}
									aria-pressed={selected.includes(option.value)}
									disabled={!selected.includes(option.value) && selected.length >= view.selection!.max}
									onClick={() => toggle(option.value)}
								>
									{option.piece && <Piece piece={option.piece} />}
									<span>{option.label}</span>
									{selected.includes(option.value) && (
										<span className="selection-order">{selected.indexOf(option.value) + 1}</span>
									)}
								</button>
							))}
						</div>
					)}
					<button
						className="btn"
						disabled={selected.length < view.selection.min || selected.length > view.selection.max}
						onClick={() => send({ action: view.selection!.action, value: JSON.stringify(selected) })}
					>
						{view.selection.submit ?? tx("Confirm selection")}
					</button>
					{selected.length > 0 && (
						<button className="btn is-ghost" onClick={() => setSelected([])}>
							{tx("Clear selection")}
						</button>
					)}
				</fieldset>
			)}
			{view.input && (
				<form className="trial-input" onSubmit={submit}>
					{view.input.tiles && (
						<div className="letter-builder">
							<p>{tx("Tap letters to build your word.")}</p>
							<div className="piece-options">
								{view.input.tiles.map((letter, index) => (
									<button
										type="button"
										className="piece-option"
										key={index}
										disabled={!canAct || letters.includes(index)}
										aria-label={tx(`Add ${letter}, tile ${index + 1}`)}
										onClick={() => {
											const next = [...letters, index]
											setLetters(next)
											setAnswer(next.map((i) => view.input!.tiles![i]).join(""))
										}}
									>
										<Piece piece={{ kind: "tile", text: letter }} />
									</button>
								))}
							</div>
							<button
								type="button"
								className="btn is-ghost"
								disabled={!canAct || !letters.length}
								onClick={() => {
									const next = letters.slice(0, -1)
									setLetters(next)
									setAnswer(next.map((i) => view.input!.tiles![i]).join(""))
								}}
							>
								{tx("Remove last letter")}
							</button>
						</div>
					)}
					<label>
						{view.input.label}
						<input
							type={view.input.kind}
							value={answer}
							maxLength={500}
							placeholder={view.input.placeholder}
							disabled={!canAct}
							onChange={(event) => {
								setAnswer(event.target.value)
								setLetters([])
							}}
							autoComplete="off"
						/>
					</label>
					<button className="btn" disabled={!canAct || !answer.trim()}>
						{tx("Send answer")}
					</button>
				</form>
			)}
			{view.balance && <BalanceDraft balance={view.balance} canAct={canAct} onMove={send} />}
			{view.forms
				?.filter((form) => !form.steps?.length)
				.map((form) => (
					<MoveForm key={JSON.stringify(form)} form={form} canAct={canAct} onMove={send} />
				))}
			{view.forms?.some((form) => form.steps?.length) && (
				<FormDraft
					key={JSON.stringify(view.forms)}
					forms={view.forms.filter((form) => form.steps?.length)}
					canAct={canAct}
					onMove={send}
				/>
			)}
			{staged.length > 0 && <ChoiceDraft key={JSON.stringify(staged)} choices={staged} canAct={canAct} onMove={send} />}
			{immediate.length > 0 && (
				<div className="trial-actions">
					{immediate.map((choice, index) => (
						<button
							key={`${choice.move.action}-${choice.move.value}-${index}`}
							className={choice.piece ? "piece-option" : "btn is-ghost"}
							disabled={!canAct}
							onClick={() => send(choice.move)}
						>
							{choice.piece && <Piece piece={choice.piece} />}
							<span>{choice.label}</span>
						</button>
					))}
				</div>
			)}
		</>
	)
}

/** Pips up to a dozen rounds, a bar beyond that: sixty pips is a ruler, not a count. */
function RoundTrack({ round: { label: name, current, total } }: { round: TrialRound }) {
	const { t } = useLang()
	const label = t(`round.${name}`)
	return (
		<p className="round-track">
			<span>
				{total === undefined ? t("trial.round", { label, current }) : t("trial.of", { label, current, total })}
			</span>
			{total !== undefined &&
				(total <= 12 ? (
					<span className="round-pips" aria-hidden="true">
						{Array.from({ length: total }, (_, i) => (
							<i key={i} className={i + 1 < current ? "is-done" : i + 1 === current ? "is-now" : ""} />
						))}
					</span>
				) : (
					<progress max={total} value={current} aria-hidden="true" />
				))}
		</p>
	)
}

export function TrialBoard({ view: english, canAct, names, seat, onMove }: BoardProps<TrialView, TrialMove>) {
	const { t, tx } = useLang()
	// One seam for every game: the words are translated here, the moves inside the view are not.
	const view = localise(english, tx)
	// Changes to available pieces/phase invalidate drafts; unrelated rival actions do not.
	const context = JSON.stringify([view.phase, view.board, view.selection, view.input, view.balance])
	const hasBoard = !!view.board || !!view.cubes
	// An empty tray (no runes collected yet) is a heading over nothing.
	const displays = view.displays
		?.filter((display) => display.items.length > 0)
		.map((display, index) => (
			<section className="piece-display" key={index}>
				<h3>{display.label}</h3>
				<div className="piece-row">
					{display.items.map((item, i) => (
						<figure key={i}>
							<Piece piece={item.piece} />
							<figcaption>{item.label}</figcaption>
						</figure>
					))}
				</div>
			</section>
		))
	const info = view.facts.length > 0 || (hasBoard && !!displays?.length)
	return (
		<div className={`trial ${info || view.log.length > 0 ? "has-side" : ""}`}>
			<header className="trial-heading" aria-live="polite">
				{view.round && <RoundTrack round={view.round} />}
				<h2>{view.phase}</h2>
				{view.prompt && <p>{view.prompt}</p>}
			</header>
			{view.scores.length > 0 && (
				<div className="trial-scores" aria-label={view.scoreLabel ?? t("trial.scores")}>
					{view.scores.map((score, index) => (
						<span key={index} className={`seat${index}`}>
							<span>{index === seat ? t("trial.you") : (names[index] ?? t("trial.seat", { n: index + 1 }))}</span>
							<strong>{score}</strong>
						</span>
					))}
				</div>
			)}
			{/* The table itself comes first in a wide layout; with no board, the displayed pieces are the table. */}
			{info && (
				<div className="trial-info">
					{hasBoard && displays}
					{view.facts.length > 0 && (
						<details className="trial-facts-panel" open>
							<summary>{t("trial.facts")}</summary>
							<ul className="trial-facts">
								{view.facts.map((fact, index) => (
									<li key={index}>{fact}</li>
								))}
							</ul>
						</details>
					)}
				</div>
			)}
			<div className="trial-play">
				{!hasBoard && displays}
				<TrialControls key={context} view={view} canAct={canAct} onMove={onMove} />
			</div>
			{view.log.length > 0 && (
				<section className="trial-log" aria-label={tx("Game history")}>
					<h3>{t("trial.recent")}</h3>
					<ol aria-live="polite">
						{view.log.slice(-3).map((line, index) => (
							<li key={index}>{line}</li>
						))}
					</ol>
					{view.log.length > 3 && (
						<details>
							<summary>{t("trial.allEvents", { n: view.log.length })}</summary>
							<ol>
								{view.log.map((line, index) => (
									<li key={index}>{line}</li>
								))}
							</ol>
						</details>
					)}
				</section>
			)}
		</div>
	)
}
