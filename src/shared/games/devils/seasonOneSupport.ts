import { z } from "zod"
import { illegal, pick, type Rng } from "../../game"
import { parseTrialMove, type TrialChoice, type TrialMove, type TrialView } from "./trial"

export function parseActions(...actions: string[]): (raw: unknown) => TrialMove {
	return (raw) => {
		const move = parseTrialMove(raw)
		if (!actions.includes(move.action)) illegal(`Choose one of: ${actions.join(", ")}.`)
		return move
	}
}

export function integer(value: string, min: number, max: number): number {
	if (!/^(0|[1-9]\d*)$/.test(value.trim())) return illegal("Enter a whole number.")
	const number = Number(value)
	if (!Number.isSafeInteger(number) || number < min || number > max)
		return illegal(`Enter a number from ${min} to ${max}.`)
	return number
}

export function csv(value: string, length: number, min: number, max: number): number[] {
	const parts = value.split(",")
	if (parts.length !== length) return illegal(`Enter ${length} comma-separated numbers.`)
	return parts.map((part) => integer(part, min, max))
}

export function selection(value: string, min: number, max: number): string[] {
	let raw: unknown
	try {
		raw = JSON.parse(value)
	} catch {
		return illegal("Choose items from the selection.")
	}
	const parsed = z
		.array(z.string().trim())
		.min(min)
		.max(max)
		.refine((items) => new Set(items).size === items.length)
		.safeParse(raw)
	if (!parsed.success) return illegal("Choose the required number of distinct items.")
	return parsed.data
}

export function blank(value: string): void {
	if (value !== "") illegal("This action does not take a value.")
}

export function liveSeat(done: boolean, seat: number, players: number, turn?: number): void {
	if (done) illegal("This trial has ended. Start another game.")
	if (!Number.isInteger(seat) || seat < 0 || seat >= players) illegal("There is no such seat.")
	if (turn !== undefined && seat !== turn) illegal("Wait for your turn.")
}

export function view(phase: string, prompt: string, scores: number[], extra: Partial<TrialView> = {}): TrialView {
	return { phase, prompt, scores, facts: [], choices: [], log: [], ...extra }
}

export function choice(
	label: string,
	action: string,
	value = "",
	display: Pick<TrialChoice, "piece" | "steps"> = {},
): TrialChoice {
	return { label, move: { action, value }, ...display }
}

export function choiceBot(v: TrialView, _seat: number, rng: Rng): TrialMove {
	return pick(v.choices, rng).move
}

export function rotateShape(shape: readonly (readonly [number, number])[], turns: number): [number, number][] {
	let result = shape.map(([x, y]): [number, number] => [x, y])
	for (let i = 0; i < turns; i++) result = result.map(([x, y]) => [-y, x])
	const minX = Math.min(...result.map(([x]) => x)),
		minY = Math.min(...result.map(([, y]) => y))
	return result.map(([x, y]) => [x - minX, y - minY])
}

export function shapeCells(
	shape: readonly (readonly [number, number])[],
	anchor: number,
	size: number,
): number[] | null {
	const x = anchor % size,
		y = Math.floor(anchor / size)
	if (!Number.isInteger(anchor) || anchor < 0 || anchor >= size * size) return null
	if (shape.some(([dx, dy]) => x + dx >= size || y + dy >= size)) return null
	return shape.map(([dx, dy]) => (y + dy) * size + x + dx)
}

export function neighbours(cell: number, size: number): number[] {
	const x = cell % size,
		y = Math.floor(cell / size)
	return [
		[x - 1, y],
		[x + 1, y],
		[x, y - 1],
		[x, y + 1],
	]
		.filter(([a, b]) => a >= 0 && b >= 0 && a < size && b < size)
		.map(([a, b]) => b * size + a)
}
