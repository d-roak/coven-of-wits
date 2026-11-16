import { type GameDef, type Outcome, illegal, pick, shuffle, topSeats } from "../../game.js"
import { roundOf, type TrialMove, type TrialView } from "./trial.js"
import {
	blank,
	choice,
	integer,
	liveSeat,
	neighbours,
	parseActions,
	rotateShape,
	shapeCells,
	view,
} from "./seasonOneSupport.js"

export const GRASS_SIZE = 10
export const GRASS_SHAPES: readonly (readonly (readonly [number, number])[])[] = [
	[
		[0, 0],
		[1, 0],
		[2, 0],
	],
	[
		[0, 0],
		[0, 1],
		[1, 1],
	],
	[
		[0, 0],
		[1, 0],
		[0, 1],
		[1, 1],
	],
	[
		[0, 0],
		[1, 0],
		[2, 0],
		[1, 1],
	],
	[
		[0, 0],
		[0, 1],
		[0, 2],
		[1, 2],
	],
	[
		[0, 0],
		[1, 0],
		[1, 1],
		[2, 1],
	],
]
const GRASS_NAMES = ["Branch", "Corner", "Square", "T-rune", "Crook", "Stair"]
export interface LayingGrassState {
	cells: (number | null)[]
	deck: number[]
	turn: number
	rotation: number
	exchanges: number[]
	swapped: boolean
	boons: number[]
	scores: number[]
	log: string[]
	result: Outcome | null
}
export function grassSquare(cells: (number | null)[], seat: number): number {
	const sizes = Array<number>(cells.length).fill(0)
	let best = 0
	for (let cell = 0; cell < cells.length; cell++) {
		if (cells[cell] !== seat) continue
		const x = cell % GRASS_SIZE,
			y = Math.floor(cell / GRASS_SIZE)
		sizes[cell] =
			x === 0 || y === 0 ? 1 : 1 + Math.min(sizes[cell - 1], sizes[cell - GRASS_SIZE], sizes[cell - GRASS_SIZE - 1])
		best = Math.max(best, sizes[cell])
	}
	return best
}
export function grassPlacements(s: LayingGrassState, rotation = s.rotation): number[] {
	if (s.result || s.deck.length === 0) return []
	const shape = rotateShape(GRASS_SHAPES[s.deck[0]], rotation)
	return s.cells.flatMap((_, anchor) => {
		const cells = shapeCells(shape, anchor, GRASS_SIZE)
		if (!cells || cells.some((cell) => s.cells[cell] !== null || s.boons.includes(cell))) return []
		const adjacent = cells.flatMap((cell) => neighbours(cell, GRASS_SIZE))
		if (adjacent.some((cell) => s.cells[cell] !== null && s.cells[cell] !== s.turn)) return []
		return adjacent.some((cell) => s.cells[cell] === s.turn) ? [anchor] : []
	})
}
function advanceGrass(s: LayingGrassState): LayingGrassState {
	const deck = s.deck.slice(1)
	const scores = s.scores.map((_, seat) => grassSquare(s.cells, seat))
	return {
		...s,
		deck,
		scores,
		rotation: 0,
		swapped: false,
		turn: (s.turn + 1) % scores.length,
		result: deck.length === 0 ? { winners: topSeats(scores) } : null,
	}
}
export const layingGrass: GameDef<LayingGrassState, TrialMove, TrialView> = {
	id: "laying-grass",
	round: (s) => Math.min(8, Math.floor((s.scores.length * 8 - s.deck.length) / s.scores.length) + 1),
	name: "Laying Grass",
	blurb: "Grow a square garden with strange-shaped patches of moss.",
	rules: [
		"A compact adaptation of the show’s polyomino territory match on a shared 10 × 10 garden.",
		"Place the next patch beside your territory. Rotate it as needed. Patches may not overlap, leave the garden, or touch a rival along an edge.",
		"Spend an exchange ticket to swap the next patch with one of the four following patches. One swap is allowed per turn.",
		"Surround a well on all four sides to claim it and earn an exchange ticket. Well squares cannot be covered directly.",
		"After eight patches per mage, the largest completely filled square wins. Pass only when the current patch cannot fit in any rotation.",
		"This edition reduces the board and tile deck, scores square side length, and replaces robbery/stone powers with exchange wells.",
	],
	players: { min: 2, max: 5 },
	setup(rng, players) {
		const starts = [0, 99, 9, 90, 44],
			cells = Array<number | null>(100).fill(null)
		for (let seat = 0; seat < players; seat++) cells[starts[seat]] = seat
		return {
			cells,
			deck: shuffle(
				Array.from({ length: players * 8 }, (_, i) => i % GRASS_SHAPES.length),
				rng,
			),
			turn: 0,
			rotation: 0,
			exchanges: Array(players).fill(1),
			swapped: false,
			boons: [22, 27, 72, 77],
			scores: Array(players).fill(1),
			log: [],
			result: null,
		}
	},
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseActions("rotate", "exchange", "place", "pass"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, s.scores.length, s.turn)
		if (move.action === "rotate") {
			blank(move.value)
			return { ...s, rotation: (s.rotation + 1) % 4 }
		}
		if (move.action === "exchange") {
			if (s.exchanges[seat] < 1 || s.swapped) return illegal("No exchange is available this turn.")
			const index = integer(move.value, 1, Math.min(4, s.deck.length - 1)),
				deck = [...s.deck]
			;[deck[0], deck[index]] = [deck[index], deck[0]]
			return { ...s, deck, rotation: 0, swapped: true, exchanges: s.exchanges.map((n, i) => (i === seat ? n - 1 : n)) }
		}
		if (move.action === "pass") {
			blank(move.value)
			if ([0, 1, 2, 3].some((rotation) => grassPlacements(s, rotation).length > 0))
				return illegal("The current patch still fits. Rotate it or place it.")
			return advanceGrass({ ...s, log: [...s.log, `Mage ${seat + 1} passed an unplaceable patch.`].slice(-200) })
		}
		if (move.action !== "place") return illegal("Choose rotate, exchange, place or pass.")
		const anchor = integer(move.value, 0, 99)
		if (!grassPlacements(s).includes(anchor))
			return illegal("Place beside your garden without touching a rival or covering a well.")
		const patch = shapeCells(rotateShape(GRASS_SHAPES[s.deck[0]], s.rotation), anchor, GRASS_SIZE)!
		const cells = s.cells.map((owner, cell) => (patch.includes(cell) ? seat : owner))
		const claimed = s.boons.filter((cell) => neighbours(cell, GRASS_SIZE).every((near) => cells[near] === seat))
		for (const cell of claimed) cells[cell] = seat
		return advanceGrass({
			...s,
			cells,
			boons: s.boons.filter((cell) => !claimed.includes(cell)),
			exchanges: s.exchanges.map((count, i) => (i === seat ? count + claimed.length : count)),
			log: [
				...s.log,
				`Mage ${seat + 1} planted ${GRASS_NAMES[s.deck[0]]}${claimed.length ? " and claimed a well" : ""}.`,
			].slice(-200),
		})
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const acting = !s.result && seat === s.turn
		const legal = acting ? grassPlacements(s) : []
		const shape = s.deck.length ? rotateShape(GRASS_SHAPES[s.deck[0]], s.rotation) : []
		return view(
			"Grow your garden",
			s.result
				? "The gardens are measured by their largest filled square."
				: `Mage ${s.turn + 1} places ${GRASS_NAMES[s.deck[0]]}.`,
			s.scores,
			{
				scoreLabel: "Largest square",
				displays: [
					{
						label: "Current patch",
						items: s.deck.length
							? [{ label: GRASS_NAMES[s.deck[0]], piece: { kind: "shape", cells: shape, tone: s.turn } }]
							: [],
					},
					{
						label: "Next patches",
						items: s.deck.slice(1, 5).map((id, i) => ({
							label: `${i + 1}. ${GRASS_NAMES[id]}`,
							piece: { kind: "shape", cells: GRASS_SHAPES[id] },
						})),
					},
				],
				facts: [`${s.deck.length} patches remain. Your exchange tickets: ${s.exchanges[seat]}.`],
				board: {
					columns: GRASS_SIZE,
					confirm: "Plant patch",
					cells: s.cells.map((owner, cell) => ({
						label: owner !== null ? String(owner + 1) : s.boons.includes(cell) ? "Well" : "·",
						tone: owner ?? undefined,
						piece:
							owner !== null
								? { kind: "tile", text: "", tone: owner }
								: s.boons.includes(cell)
									? { kind: "token", icon: "water" }
									: undefined,
						preview: legal.includes(cell) ? (shapeCells(shape, cell, GRASS_SIZE) ?? undefined) : undefined,
						move: legal.includes(cell) ? { action: "place", value: String(cell) } : undefined,
					})),
				},
				choices: acting
					? [
							choice("Rotate patch", "rotate"),
							...(!s.swapped && s.exchanges[seat] > 0
								? s.deck.slice(1, 5).map((id, i) =>
										choice(`Swap for ${GRASS_NAMES[id]}`, "exchange", String(i + 1), {
											piece: { kind: "shape", cells: GRASS_SHAPES[id] },
										}),
									)
								: []),
							...([0, 1, 2, 3].every((r) => grassPlacements(s, r).length === 0) ? [choice("Pass patch", "pass")] : []),
						]
					: [],
				log: s.log,
			},
		)
	},
	bot(v, _seat, rng) {
		const placements = v.board!.cells.flatMap((cell) => (cell.move ? [cell.move] : []))
		if (placements.length) return pick(placements, rng)
		return (
			v.choices.find((c) => c.move.action === "pass")?.move ?? v.choices.find((c) => c.move.action === "rotate")!.move
		)
	},
}

interface StackState {
	stacks: number[][]
	reserve: number[]
	turn: number
	pending: { kind: "reserve"; count: number } | { kind: "slide"; from: number } | null
	turns: number
	log: string[]
	result: Outcome | null
}
function stackLines(stacks: number[][]): number[] {
	const winners = new Set<number>()
	for (let cell = 0; cell < 16; cell++) {
		const owner = stacks[cell].at(-1)
		if (owner === undefined) continue
		for (const [dx, dy] of [
			[1, 0],
			[0, 1],
			[1, 1],
			[-1, 1],
		]) {
			const x = cell % 4,
				y = Math.floor(cell / 4)
			if (x + 2 * dx < 0 || x + 2 * dx >= 4 || y + 2 * dy >= 4) continue
			if ([1, 2].every((n) => stacks[(y + n * dy) * 4 + x + n * dx].at(-1) === owner)) winners.add(owner)
		}
	}
	return [...winners]
}
function stackDestinations(s: StackState): number[] {
	if (!s.pending) return []
	if (s.pending.kind === "reserve") {
		const count = s.pending.count
		return s.stacks.flatMap((stack, cell) => (stack.length + count <= 3 ? [cell] : []))
	}
	return neighbours(s.pending.from, 4).filter((cell) => s.stacks[cell].length < 3)
}
function stackSources(s: StackState): number[] {
	return s.stacks.flatMap((stack, cell) =>
		stack.at(-1) === s.turn && neighbours(cell, 4).some((near) => s.stacks[near].length < 3) ? [cell] : [],
	)
}
export const fourPlayerThree: GameDef<StackState, TrialMove, TrialView> = {
	id: "four-player-three-in-a-row",
	name: "Four-Player Three in a Row",
	blurb: "Stack stones over your rivals. Make three visible crests align.",
	rules: [
		"Four mages each have five stones on a shared 4 × 4 board.",
		"Place a stack of one, two or three reserve stones, or move one exposed stone to an orthogonally adjacent square. A stack may never exceed three stones.",
		"Only the top stone counts. Three visible stones of your color in a horizontal, vertical or diagonal line win.",
		"This edition is a four-way contest. It removes the show’s hidden fourth-player identity and four-game cooperative mission. A simultaneous line shares victory; 160 turns without a winner draw.",
	],
	players: { min: 4, max: 4 },
	setup: () => ({
		stacks: Array.from({ length: 16 }, () => []),
		reserve: [5, 5, 5, 5],
		turn: 0,
		pending: null,
		turns: 0,
		log: [],
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseActions("reserve", "select", "place", "cancel", "pass"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 4, s.turn)
		if (move.action === "cancel") {
			blank(move.value)
			if (!s.pending) return illegal("Select stones before cancelling.")
			return { ...s, pending: null }
		}
		if (move.action === "reserve") {
			if (s.pending) return illegal("Place or cancel the selected stones first.")
			const count = integer(move.value, 1, 3)
			if (count > s.reserve[seat]) return illegal("You do not have that many reserve stones.")
			if (s.stacks.every((stack) => stack.length + count > 3)) return illegal("No stack has room for that many stones.")
			return { ...s, pending: { kind: "reserve", count } }
		}
		if (move.action === "select") {
			if (s.pending) return illegal("Place or cancel the selected stones first.")
			const from = integer(move.value, 0, 15)
			if (!stackSources(s).includes(from))
				return illegal("Select an exposed stone of your color with an open neighbour.")
			return { ...s, pending: { kind: "slide", from } }
		}
		if (move.action === "pass") {
			blank(move.value)
			if (s.pending || stackSources(s).length || (s.reserve[seat] > 0 && s.stacks.some((stack) => stack.length < 3)))
				return illegal("You still have a legal move.")
			return {
				...s,
				log: [...s.log, `Mage ${seat + 1} passed.`].slice(-200),
				turn: (seat + 1) % 4,
				turns: s.turns + 1,
				result: s.turns + 1 >= 160 ? { winners: [] } : null,
			}
		}
		if (move.action !== "place" || !s.pending) return illegal("Choose reserve stones or an exposed stone first.")
		const to = integer(move.value, 0, 15)
		if (!stackDestinations(s).includes(to))
			return illegal("Choose an adjacent destination with space, or a valid reserve placement.")
		const stacks = s.stacks.map((stack) => [...stack]),
			reserve = [...s.reserve]
		if (s.pending.kind === "reserve") {
			stacks[to].push(...Array<number>(s.pending.count).fill(seat))
			reserve[seat] -= s.pending.count
		} else {
			stacks[s.pending.from].pop()
			stacks[to].push(seat)
		}
		const winners = stackLines(stacks),
			turns = s.turns + 1
		return {
			stacks,
			reserve,
			turn: (seat + 1) % 4,
			pending: null,
			turns,
			log: [
				...s.log,
				s.pending.kind === "reserve"
					? `Mage ${seat + 1} placed ${s.pending.count} stone(s) on square ${to + 1}.`
					: `Mage ${seat + 1} moved a stone from square ${s.pending.from + 1} to ${to + 1}.`,
			].slice(-200),
			result: winners.length ? { winners } : turns >= 160 ? { winners: [] } : null,
		}
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const acting = !s.result && seat === s.turn,
			sources = stackSources(s),
			destinations = stackDestinations(s)
		const reserveChoices = [1, 2, 3].filter(
			(n) => n <= s.reserve[seat] && s.stacks.some((stack) => stack.length + n <= 3),
		)
		return view(
			"Stack the crests",
			s.pending
				? "Choose the destination for the selected stones."
				: `Mage ${s.turn + 1} chooses reserve stones or an exposed stone.`,
			s.reserve,
			{
				scoreLabel: "Reserve stones",
				displays: [
					{
						label: "Your reserve",
						items: [
							{
								label: `${s.reserve[seat]} stones`,
								piece: { kind: "stack", owners: Array<number>(s.reserve[seat]).fill(seat) },
							},
						],
					},
				],
				log: s.log,
				facts: ["Only the top stone counts toward a line.", `Your reserve: ${s.reserve[seat]}.`],
				round: roundOf("Turn", Math.min(s.turns + 1, 160), 160),
				board: {
					columns: 4,
					confirm: s.pending ? "Place stones" : undefined,
					cells: s.stacks.map((stack, cell) => ({
						label: stack.length ? stack.map((owner) => owner + 1).join("/") : "·",
						tone: stack.at(-1),
						piece: stack.length ? { kind: "stack", owners: stack } : undefined,
						move:
							acting && (s.pending ? destinations.includes(cell) : sources.includes(cell))
								? { action: s.pending ? "place" : "select", value: String(cell) }
								: undefined,
					})),
				},
				choices: !acting
					? []
					: s.pending
						? [choice("Cancel selection", "cancel")]
						: [
								...reserveChoices.map((count) =>
									choice(`Place ${count} stone${count === 1 ? "" : "s"}`, "reserve", String(count), {
										piece: { kind: "stack", owners: Array<number>(count).fill(seat) },
									}),
								),
								...(!reserveChoices.length && !sources.length ? [choice("Pass turn", "pass")] : []),
							],
			},
		)
	},
	bot(v, _seat, rng) {
		const reserve = v.choices.filter((c) => c.move.action === "reserve")
		if (reserve.length) return pick(reserve, rng).move
		const cells = v.board!.cells.flatMap((cell) => (cell.move ? [cell.move] : []))
		return cells.length ? pick(cells, rng) : v.choices.find((c) => c.move.action === "pass")!.move
	},
}

export interface BlindGomokuState {
	cells: (number | null)[]
	turn: number
	last: number | null
	result: Outcome | null
}
export const BLIND_SIZE = 9
function fiveAt(cells: (number | null)[], at: number, seat: number): boolean {
	return [
		[1, 0],
		[0, 1],
		[1, 1],
		[1, -1],
	].some(([dx, dy]) => {
		let count = 1
		for (const sign of [-1, 1]) {
			let x = (at % BLIND_SIZE) + dx * sign,
				y = Math.floor(at / BLIND_SIZE) + dy * sign
			while (x >= 0 && y >= 0 && x < BLIND_SIZE && y < BLIND_SIZE && cells[y * BLIND_SIZE + x] === seat) {
				count++
				x += dx * sign
				y += dy * sign
			}
		}
		return count >= 5
	})
}
export const blindGomoku: GameDef<BlindGomokuState, TrialMove, TrialView> = {
	id: "blind-gomoku",
	name: "Blind Gomoku",
	blurb: "Five stones win. Remember which sealed stones belong to you.",
	rules: [
		"A memory duel based on the show’s secret-chamber challenge.",
		"Take turns placing one stone on an empty point. Make five or more of your stones in a straight line.",
		"Only the latest stone shows its owner. Older stones are sealed, so remember who placed them. All stones reveal when the duel ends.",
		"This edition uses a 9 × 9 board, automatic line checking and a casual bot that sees the same sealed board. It has no secret-room entry puzzle or Piece wager.",
	],
	players: { min: 2, max: 2 },
	setup: () => ({ cells: Array<number | null>(81).fill(null), turn: 0, last: null, result: null }),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseActions("place"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 2, s.turn)
		if (move.action !== "place") return illegal("Place a stone on an empty point.")
		const at = integer(move.value, 0, 80)
		if (s.cells[at] !== null) return illegal("That point already holds a stone.")
		const cells = s.cells.map((owner, cell) => (cell === at ? seat : owner))
		return {
			cells,
			turn: 1 - seat,
			last: at,
			result: fiveAt(cells, at, seat)
				? { winners: [seat] }
				: cells.every((owner) => owner !== null)
					? { winners: [] }
					: null,
		}
	},
	outcome: (s) => s.result,
	view: (s, seat) =>
		view(
			"Remember the stones",
			s.result ? "The seals open." : `Mage ${s.turn + 1} places a stone.`,
			s.cells.reduce(
				(scores, owner) => {
					if (owner !== null) scores[owner]++
					return scores
				},
				[0, 0],
			),
			{
				scoreLabel: "Stones placed",
				facts: ["Only the latest stone reveals its owner during play."],
				// Recording coordinates with actors would defeat the sealed-stone memory challenge.
				log: s.cells.some((owner) => owner !== null)
					? [
							`${s.cells.filter((owner) => owner !== null).length} stones placed.${s.result ? " All owners revealed." : " Earlier owners remain sealed."}`,
						]
					: [],
				board: {
					columns: BLIND_SIZE,
					confirm: "Place stone",
					cells: s.cells.map((owner, cell) => ({
						label: owner === null ? "·" : s.result || cell === s.last ? `Mage ${owner + 1}` : "Sealed",
						tone: owner !== null && (s.result || cell === s.last) ? owner : undefined,
						piece:
							owner === null
								? undefined
								: s.result || cell === s.last
									? { kind: "token", icon: "pawn", tone: owner }
									: { kind: "back" },
						move: !s.result && seat === s.turn && owner === null ? { action: "place", value: String(cell) } : undefined,
					})),
				},
			},
		),
	bot(v, _seat, rng) {
		const options = v.board!.cells.flatMap((cell, at) =>
			cell.move
				? [
						{
							move: cell.move,
							value: neighbours(at, BLIND_SIZE).filter((near) => !v.board!.cells[near].move).length + rng(),
						},
					]
				: [],
		)
		return options.reduce((best, option) => (option.value > best.value ? option : best)).move
	},
}
