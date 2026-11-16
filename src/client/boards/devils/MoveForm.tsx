import { MinusIcon, PlusIcon } from "@phosphor-icons/react"
import { useState } from "react"
import type { TrialForm, TrialMove } from "../../../shared/games/devils/trial"
import { useLang } from "../../i18n"
import { formMove } from "./draft"
import { Piece } from "./Piece"
import { ChoiceDraft } from "./ChoiceDraft"

export function MoveForm({
	form,
	canAct,
	onMove,
}: {
	form: TrialForm
	canAct: boolean
	onMove(move: TrialMove): void
}) {
	const { tx } = useLang()
	const [values, setValues] = useState(() => form.fields.map((field) => field.initial ?? ""))
	const move = formMove(form, values)
	const locked = (index: number) => {
		const skip = form.fields[index]?.skip
		return !canAct || (!!skip && values[index] === skip.value)
	}
	// Clamped to the field's range, so the buttons can never build a bid the engine would refuse.
	const step = (index: number, by: number) => {
		const { min = -Infinity, max = Infinity } = form.fields[index]!
		set(index, String(Math.min(max, Math.max(min, (Number(values[index]) || 0) + by))))
	}
	const set = (index: number, next: string) => setValues(values.map((value, at) => (at === index ? next : value)))
	return (
		<form
			className="move-form"
			onSubmit={(event) => {
				event.preventDefault()
				if (canAct && move) onMove(move)
			}}
		>
			{/* A one-field form already says this on the field. */}
			{(form.fields.length > 1 || form.fields[0]?.label !== form.label) && <h3>{form.label}</h3>}
			<div className="move-fields">
				{form.fields.map((field, i) => (
					<div className="move-field" key={i}>
						{field.kind === "select" && field.options?.some((option) => option.piece) ? (
							<fieldset disabled={!canAct}>
								<legend>{field.label}</legend>
								<div className="piece-options">
									{field.options.map((option) => (
										<button
											type="button"
											key={option.value}
											className={`piece-option ${values[i] === option.value ? "is-selected" : ""}`}
											aria-pressed={values[i] === option.value}
											onClick={() => set(i, option.value)}
										>
											{option.piece && <Piece piece={option.piece} />}
											<span>{option.label}</span>
										</button>
									))}
								</div>
							</fieldset>
						) : (
							<label>
								{field.label}
								{field.kind === "select" ? (
									<select disabled={!canAct} value={values[i]} onChange={(event) => set(i, event.target.value)}>
										<option value="" disabled>
											{tx("Choose an option")}
										</option>
										{field.options?.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								) : field.kind === "number" ? (
									<span className="stepper">
										<button
											type="button"
											aria-label={tx(`Lower ${field.label}`)}
											disabled={locked(i) || Number(values[i]) <= (field.min ?? -Infinity)}
											onClick={() => step(i, -1)}
										>
											<MinusIcon weight="bold" />
										</button>
										<input
											disabled={!canAct || (!!field.skip && values[i] === field.skip.value)}
											type={field.kind}
											min={field.min}
											max={field.max}
											step={1}
											maxLength={100}
											value={field.skip && values[i] === field.skip.value ? "" : values[i]}
											autoComplete="off"
											onChange={(event) => set(i, event.target.value)}
										/>
										<button
											type="button"
											aria-label={tx(`Raise ${field.label}`)}
											disabled={locked(i) || Number(values[i]) >= (field.max ?? Infinity)}
											onClick={() => step(i, 1)}
										>
											<PlusIcon weight="bold" />
										</button>
									</span>
								) : (
									<input
										disabled={!canAct || (!!field.skip && values[i] === field.skip.value)}
										type={field.kind}
										min={field.min}
										max={field.max}
										maxLength={100}
										value={field.skip && values[i] === field.skip.value ? "" : values[i]}
										autoComplete="off"
										onChange={(event) => set(i, event.target.value)}
									/>
								)}
								{field.kind === "number" && field.min !== undefined && field.max !== undefined && (
									<small>
										{field.min}–{field.max}
									</small>
								)}
							</label>
						)}
						{field.skip && (
							<label className="skip-field">
								<input
									type="checkbox"
									disabled={!canAct}
									checked={values[i] === field.skip.value}
									onChange={(event) => set(i, event.target.checked ? field.skip!.value : "")}
								/>
								{field.skip.label}
							</label>
						)}
					</div>
				))}
			</div>
			<button className="btn" disabled={!canAct || !move}>
				{form.submit}
			</button>
		</form>
	)
}
export function FormDraft({
	forms,
	canAct,
	onMove,
}: {
	forms: TrialForm[]
	canAct: boolean
	onMove(move: TrialMove): void
}) {
	const choices = forms.map((form, index) => ({
		label: form.label,
		move: { action: "choose-form", value: String(index) },
		steps: form.steps,
	}))
	return (
		<ChoiceDraft
			choices={choices}
			canAct={canAct}
			onMove={() => {
				throw new Error("Form drafts must render their fields before sending a move.")
			}}
			renderChoice={(choice) => (
				<MoveForm key={choice.move.value} form={forms[Number(choice.move.value)]} canAct={canAct} onMove={onMove} />
			)}
		/>
	)
}
