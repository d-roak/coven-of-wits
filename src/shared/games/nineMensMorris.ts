import { z } from "zod"
import { type GameDef, type Outcome, illegal, parseWith, pick } from "../game.js"

export const MORRIS_POINTS: readonly (readonly [number, number])[] = [0, 1, 2].flatMap(
	(inset) =>
		[
			[inset, inset],
			[3, inset],
			[6 - inset, inset],
			[6 - inset, 3],
			[6 - inset, 6 - inset],
			[3, 6 - inset],
			[inset, 6 - inset],
			[inset, 3],
		] as const,
)

export const MORRIS_MILLS: readonly (readonly number[])[] = [
	...[0, 8, 16].flatMap((base) =>
		[
			[0, 1, 2],
			[2, 3, 4],
			[4, 5, 6],
			[6, 7, 0],
		].map((line) => line.map((n) => n + base)),
	),
	...[1, 3, 5, 7].map((n) => [n, n + 8, n + 16]),
]
export const MORRIS_EDGES: readonly (readonly [number, number])[] = [
	...[0, 8, 16].flatMap((base) => Array.from({ length: 8 }, (_, n) => [base + n, base + ((n + 1) % 8)] as const)),
	...[1, 3, 5, 7].flatMap(
		(n) =>
			[
				[n, n + 8],
				[n + 8, n + 16],
			] as const,
	),
]

export interface NineMensMorrisState {
	cells: (number | null)[]
	reserve: number[]
	turn: number
	capture: boolean
	quietTurns: number
	positions: string[]
	result: Outcome | null
}

const point = z.number().int().min(0).max(23)
const schema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("place"), to: point }).strict(),
	z.object({ type: z.literal("slide"), from: point, to: point }).strict(),
	z.object({ type: z.literal("capture"), at: point }).strict(),
])
export type NineMensMorrisMove = z.infer<typeof schema>

const count = (cells: (number | null)[], seat: number) => cells.filter((owner) => owner === seat).length
const inMill = (cells: (number | null)[], at: number, seat: number) =>
	MORRIS_MILLS.some((line) => line.includes(at) && line.every((cell) => cells[cell] === seat))

export function morrisMoves(s: NineMensMorrisState): NineMensMorrisMove[] {
	if (s.result) return []
	if (s.capture) {
		const rival = s.cells.flatMap((owner, at) => (owner === 1 - s.turn ? [at] : []))
		const exposed = rival.filter((at) => !inMill(s.cells, at, 1 - s.turn))
		return (exposed.length ? exposed : rival).map((at) => ({ type: "capture", at }))
	}
	const empty = s.cells.flatMap((owner, at) => (owner === null ? [at] : []))
	if (s.reserve[s.turn] > 0) return empty.map((to) => ({ type: "place", to }))
	const flying = count(s.cells, s.turn) === 3
	return s.cells.flatMap((owner, from) =>
		owner !== s.turn
			? []
			: empty
					.filter((to) => flying || MORRIS_EDGES.some(([a, b]) => (a === from && b === to) || (b === from && a === to)))
					.map((to) => ({ type: "slide" as const, from, to })),
	)
}

function finishTurn(s: NineMensMorrisState, reset: boolean): NineMensMorrisState {
	const next = { ...s, turn: 1 - s.turn, capture: false, quietTurns: reset ? 0 : s.quietTurns + 1 }
	if (s.reserve[s.turn] === 0 && count(s.cells, s.turn) < 3) {
		return { ...next, result: { winners: [next.turn] } }
	}
	if (next.reserve[next.turn] === 0 && (count(next.cells, next.turn) < 3 || morrisMoves(next).length === 0)) {
		return { ...next, result: { winners: [s.turn] } }
	}
	const signature = `${next.cells.map((owner) => (owner === null ? "-" : owner)).join("")}:${next.turn}:${next.reserve.join(",")}`
	const positions = [...(reset ? [] : s.positions), signature]
	const drawn = next.quietTurns >= 80 || positions.filter((p) => p === signature).length >= 3
	return { ...next, positions, result: drawn ? { winners: [] } : null }
}

export const nineMensMorris: GameDef<NineMensMorrisState, NineMensMorrisMove> = {
	id: "nine-mens-morris",
	name: "Nine Men's Morris",
	blurb: "Weave three stones into a mill. Break your rival’s circle.",
	rules: [
		"A two-player adaptation of the board game featured in The Devil’s Plan. Each mage begins with 9 stones.",
		"Take turns placing a stone on an empty point. A line of 3 connected stones is a mill: remove one rival stone.",
		"Stones in a mill are protected unless every rival stone belongs to a mill. One new mill grants one capture, even when two lines form at once.",
		"After placing your 9 stones, move a stone along a line to a neighbouring empty point. With only 3 stones, you may fly to any empty point.",
		"A mage loses when they have placed all stones and have fewer than 3 left, or cannot move.",
		"This version draws after the same position occurs 3 times or after 80 turns without a capture or placement. It has no show tournament or clock.",
	],
	players: { min: 2, max: 2 },
	setup: () => ({
		cells: Array<number | null>(24).fill(null),
		reserve: [9, 9],
		turn: 0,
		capture: false,
		quietTurns: 0,
		positions: [],
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (s.result) illegal("The game is over. Start another game.")
		if (seat !== s.turn) illegal("Wait for your turn.")
		const legal = morrisMoves(s).some((candidate) => {
			switch (move.type) {
				case "place":
					return candidate.type === "place" && candidate.to === move.to
				case "capture":
					return candidate.type === "capture" && candidate.at === move.at
				case "slide":
					return candidate.type === "slide" && candidate.from === move.from && candidate.to === move.to
				default: {
					const unknown: never = move
					return unknown
				}
			}
		})
		if (!legal)
			illegal(
				s.capture
					? "Choose an exposed rival stone, or a stone in a mill if none are exposed."
					: "Choose a legal empty point for this phase.",
			)
		const cells = [...s.cells]
		const reserve = [...s.reserve]
		if (move.type === "capture") {
			cells[move.at] = null
			return finishTurn({ ...s, cells }, true)
		}
		if (move.type === "place") reserve[seat]--
		else cells[move.from] = null
		cells[move.to] = seat
		const next = { ...s, cells, reserve }
		if (inMill(cells, move.to, seat) && count(cells, 1 - seat) > 0) return { ...next, capture: true }
		return finishTurn(next, move.type === "place")
	},
	outcome: (s) => s.result,
	historyEntry(before, after, actor) {
		const removed = before.cells.findIndex((owner, at) => owner !== null && after.cells[at] === null)
		if (before.capture) return [`Mage ${actor + 1} captured the stone at point ${removed + 1}.`]
		const placed = after.cells.findIndex((owner, at) => owner === actor && before.cells[at] !== actor)
		return [
			removed < 0
				? `Mage ${actor + 1} placed a stone at point ${placed + 1}.`
				: `Mage ${actor + 1} moved from point ${removed + 1} to ${placed + 1}.`,
			...(after.capture ? [`Mage ${actor + 1} formed a mill and may capture.`] : []),
		]
	},
	view: (s) => s,
	// ponytail: one-move tactics; add search if stronger opponents are needed.
	bot(s, seat, rng) {
		const scored = morrisMoves(s).map((move) => {
			if (move.type === "capture") {
				const value = MORRIS_MILLS.filter(
					(line) => line.includes(move.at) && line.filter((at) => s.cells[at] === 1 - seat).length === 2,
				).length
				return { move, value }
			}
			const cells = [...s.cells]
			if (move.type === "slide") cells[move.from] = null
			cells[move.to] = seat
			let value = inMill(cells, move.to, seat) ? 100 : 0
			cells[move.to] = 1 - seat
			if (inMill(cells, move.to, 1 - seat)) value += 30
			value += MORRIS_EDGES.filter(([a, b]) => a === move.to || b === move.to).length
			return { move, value }
		})
		const best = Math.max(...scored.map(({ value }) => value))
		return pick(
			scored.filter(({ value }) => value === best),
			rng,
		).move
	},
}
