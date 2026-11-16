import type { TrialChoice, TrialForm } from "../../../shared/games/devils/trial"

export function matchingChoices(choices: TrialChoice[], path: string[]) {
	return choices.filter((choice) => choice.steps && path.every((key, i) => choice.steps?.[i]?.key === key))
}
export function draftOptions(choices: TrialChoice[], path: string[]) {
	const steps = matchingChoices(choices, path).flatMap((choice) =>
		choice.steps?.[path.length] ? [choice.steps[path.length]] : [],
	)
	return [...new Map(steps.map((step) => [step.key, step])).values()]
}
export function draftMove(choices: TrialChoice[], path: string[]) {
	const matches = matchingChoices(choices, path).filter((choice) => choice.steps?.length === path.length)
	return matches.length === 1 ? matches[0] : null
}
export function formMove(form: TrialForm, values: string[]) {
	if (values.length !== form.fields.length) return null
	const normalized = values.map((value) => value.trim())
	for (const [i, field] of form.fields.entries()) {
		const value = values[i].trim()
		if (!value) return null
		if (field.skip && value === field.skip.value) continue
		if (
			field.kind === "number" &&
			(!/^-?\d+$/.test(value) ||
				!Number.isSafeInteger(Number(value)) ||
				(field.min !== undefined && Number(value) < field.min) ||
				(field.max !== undefined && Number(value) > field.max))
		)
			return null
		if (field.kind === "number") normalized[i] = String(Number(value))
		if (field.kind === "select" && !field.options?.some((option) => option.value === value)) return null
	}
	if ([...form.format.matchAll(/\{(\d+)\}/g)].some((match) => Number(match[1]) >= values.length)) return null
	return {
		action: form.action,
		value: form.format.replace(/\{(\d+)\}/g, (_, index: string) => normalized[Number(index)]),
	}
}
