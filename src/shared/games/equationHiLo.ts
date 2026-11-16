import { z } from "zod"
import { type GameDef, illegal, parseWith, pick, shuffle, topSeats } from "../game"

export const EQUATION_ROUNDS = 5
export const EQUATION_OPERATORS = ["+", "-", "/"] as const
export type EquationOperator = (typeof EQUATION_OPERATORS)[number]
export type EquationLane = "low" | "high"

export interface EquationHiLoMove {
	order: number[]
	operators: EquationOperator[]
	lane: EquationLane
}

export interface EquationResult {
	numbers: number[]
	operators: EquationOperator[]
	lane: EquationLane
	value: number
	won: boolean
}

export interface EquationHiLoState {
	deals: number[][][]
	submissions: (EquationHiLoMove | null)[]
	scores: number[]
	history: EquationResult[][]
}

export interface EquationHiLoView {
	hand: number[]
	round: number
	sealed: boolean[]
	myMove: EquationHiLoMove | null
	scores: number[]
	history: EquationResult[][]
}

const schema = z
	.object({
		order: z
			.array(z.number().int().min(0).max(3))
			.length(4)
			.refine((order) => new Set(order).size === 4),
		operators: z
			.array(z.enum(EQUATION_OPERATORS))
			.length(3)
			.refine((operators) => new Set(operators).size === 3),
		lane: z.enum(["low", "high"]),
	})
	.strict()

/** An unfinished draft or division by zero has no preview value. */
export function equationValue(numbers: readonly number[], operators: readonly EquationOperator[]): number | null {
	if (numbers.length !== 4 || operators.length !== 3) return null
	let total = 0
	let term = numbers[0]!
	let sign = 1
	for (let index = 0; index < operators.length; index++) {
		const next = numbers[index + 1]!
		const operator = operators[index]!
		switch (operator) {
			case "/":
				if (next === 0) return null
				term /= next
				break
			case "+":
			case "-":
				total += sign * term
				term = next
				sign = operator === "+" ? 1 : -1
				break
			default: {
				const unreachable: never = operator
				throw new Error(`Unknown equation operator: ${unreachable}`)
			}
		}
	}
	return total + sign * term
}

function permutations<T>(items: readonly T[]): T[][] {
	if (items.length === 0) return [[]]
	return items.flatMap((item, index) =>
		permutations(items.filter((_, position) => position !== index)).map((rest) => [item, ...rest]),
	)
}

const orders = permutations([0, 1, 2, 3])
const operatorOrders = permutations(EQUATION_OPERATORS)
const target = (lane: EquationLane) => (lane === "low" ? 1 : 20)
// With cards 0–10 and one division, this tolerance only absorbs floating-point roundoff.
const tied = (a: number, b: number) => Math.abs(a - b) < 1e-9

export const equationHiLo: GameDef<EquationHiLoState, EquationHiLoMove, EquationHiLoView> = {
	id: "equation-hi-lo",
	round: (s) => Math.min(s.history.length + 1, EQUATION_ROUNDS),
	name: "Equation Hi-Lo",
	blurb: "Weave four numbers into a spell. Aim for 1 or 20, then reveal together.",
	rules: [
		"A five-round adaptation of The Devil’s Plan. This version has no wagers or special operator cards.",
		"You receive four number cards from 0 to 10. Every hand includes a nonzero card.",
		"Arrange all four cards once, with +, − and ÷ each used once. Division happens first; division by zero is forbidden.",
		"Choose low (closest to 1) or high (closest to 20), then seal your equation. Other mages cannot see it yet.",
		"Everyone reveals together. The closest equation in each lane earns 1 point. Tied mages each earn 1 point.",
		"Most points after five rounds wins. Equal scores across the whole table are a draw.",
	],
	players: { min: 2, max: 5 },
	setup: (rng, players) => ({
		deals: Array.from({ length: EQUATION_ROUNDS }, () =>
			Array.from({ length: players }, () =>
				shuffle([1 + Math.floor(rng() * 10), ...Array.from({ length: 3 }, () => Math.floor(rng() * 11))], rng),
			),
		),
		submissions: Array<EquationHiLoMove | null>(players).fill(null),
		scores: Array<number>(players).fill(0),
		history: [],
	}),
	toAct: (s) => (s.deals.length === 0 ? [] : s.submissions.flatMap((move, seat) => (move === null ? [seat] : []))),
	parseMove: parseWith(schema),
	apply(s, seat, rawMove) {
		if (s.deals.length === 0) illegal("The fifth round has ended.")
		const hand = s.deals[0]![seat]
		if (!hand) return illegal("There is no such seat.")
		if (s.submissions[seat] !== null) illegal("Your equation is already sealed.")
		const move = parseWith(schema)(rawMove)
		if (
			equationValue(
				move.order.map((index) => hand[index]!),
				move.operators,
			) === null
		)
			illegal("Division by zero is forbidden. Move a nonzero card after ÷.")
		const submissions = s.submissions.map((entry, index) => (index === seat ? move : entry))
		if (submissions.some((entry) => entry === null)) return { ...s, submissions }

		const results = submissions.map((entry, index): EquationResult => {
			const sealed = entry!
			const numbers = sealed.order.map((card) => s.deals[0]![index]![card]!)
			return {
				numbers,
				operators: sealed.operators,
				lane: sealed.lane,
				value: equationValue(numbers, sealed.operators)!,
				won: false,
			}
		})
		for (const lane of ["low", "high"] as const) {
			const candidates = results.filter((result) => result.lane === lane)
			const closest = Math.min(...candidates.map((result) => Math.abs(result.value - target(lane))))
			for (const result of candidates) result.won = tied(Math.abs(result.value - target(lane)), closest)
		}
		return {
			deals: s.deals.slice(1),
			submissions: submissions.map(() => null),
			scores: s.scores.map((score, index) => score + (results[index]!.won ? 1 : 0)),
			history: [...s.history, results],
		}
	},
	outcome: (s) => (s.deals.length === 0 ? { winners: topSeats(s.scores) } : null),
	view: (s, seat) => ({
		hand: s.deals[0]?.[seat] ?? [],
		round: Math.min(s.history.length + 1, EQUATION_ROUNDS),
		sealed: s.submissions.map((entry) => entry !== null),
		myMove: s.submissions[seat] ?? null,
		scores: s.scores,
		history: s.history,
	}),
	historyEntry(before, after, actor) {
		if (after.history.length === before.history.length) return [`Mage ${actor + 1} sealed an equation.`]
		return after.history.at(-1)!.map((result, seat) => {
			const expression = result.numbers
				.map((number, index) => `${index ? `${result.operators[index - 1]} ` : ""}${number}`)
				.join(" ")
			return `Round ${after.history.length} · Mage ${seat + 1}: ${expression} = ${Number(result.value.toFixed(3))}, target ${target(result.lane)}, ${result.won ? "+1" : "+0"} point.`
		})
	},
	bot(view, _seat, rng) {
		let bestDistance = Infinity
		let choices: EquationHiLoMove[] = []
		for (const order of orders) {
			for (const operators of operatorOrders) {
				const value = equationValue(
					order.map((index) => view.hand[index]!),
					operators,
				)
				if (value === null) continue
				for (const lane of ["low", "high"] as const) {
					const distance = Math.abs(value - target(lane))
					if (distance < bestDistance && !tied(distance, bestDistance)) {
						bestDistance = distance
						choices = []
					}
					if (tied(distance, bestDistance)) choices.push({ order, operators, lane })
				}
			}
		}
		return pick(choices, rng)
	},
}
