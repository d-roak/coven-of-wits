import { type GameDef, type Outcome } from "../../game.js"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial.js"
import { allowed, choice, randomAction, result, view, step } from "./seasonTwoCommon.js"

const neighbours = (cell: number, size: number) =>
	[
		cell % size > 0 ? cell - 1 : -1,
		cell % size < size - 1 ? cell + 1 : -1,
		cell >= size ? cell - size : -1,
		cell < size * (size - 1) ? cell + size : -1,
	].filter((n) => n >= 0)
const edge = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`)
export interface WallState {
	tokens: number[][]
	walls: string[]
	breaks: number[]
	turn: number
	building: number | null
	turns: number
	done: boolean
	log: string[]
}
export interface WallOptions {
	id: string
	name: string
	size: number
	maxSteps?: number
	wallBreaks: number
	blurb: string
	rules: string[]
}
export function createWallGo(options: WallOptions): GameDef<WallState, TrialMove, TrialView> {
	const { size } = options,
		maxSteps = options.maxSteps ?? 2
	const areas = (s: WallState) => {
		const found = new Set<number>()
		const scores = s.tokens.map(() => 0)
		let separated = true
		for (let start = 0; start < size * size; start++) {
			if (found.has(start)) continue
			const region = [start]
			found.add(start)
			for (let i = 0; i < region.length; i++)
				for (const next of neighbours(region[i], size))
					if (!found.has(next) && !s.walls.includes(edge(region[i], next))) {
						found.add(next)
						region.push(next)
					}
			const owners = s.tokens.flatMap((tokens, seat) => (tokens.some((t) => region.includes(t)) ? [seat] : []))
			if (owners.length > 1) separated = false
			// Sixtieths divide evenly across every supported table size, so tied areas stay tied.
			for (const owner of owners) scores[owner] += (region.length * 60) / owners.length
		}
		return { scores: scores.map((score) => score / 60), separated }
	}
	const choices = (s: WallState, seat: number) => {
		if (s.done || seat !== s.turn) return []
		if (s.building !== null)
			return neighbours(s.building, size)
				.filter((n) => !s.walls.includes(edge(s.building!, n)))
				.map((n) => choice(`Build wall toward square ${n + 1}`, "wall", edge(s.building!, n)))
		const moves = s.tokens[seat].flatMap((start, index) => {
			const open = [start]
			const distance = new Map([[start, 0]])
			for (let i = 0; i < open.length; i++) {
				const at = open[i]
				if (distance.get(at)! >= maxSteps) continue
				for (const to of neighbours(at, size))
					if (!distance.has(to) && !s.walls.includes(edge(at, to)) && !s.tokens.flat().includes(to)) {
						distance.set(to, distance.get(at)! + 1)
						open.push(to)
					}
			}
			return open
				.filter((to) => neighbours(to, size).some((n) => !s.walls.includes(edge(to, n))))
				.map((to) =>
					choice(`${to === start ? "Stay with" : "Move"} familiar ${index + 1} to ${to + 1}`, "move", `${index}:${to}`),
				)
		})
		if (s.breaks[seat] > 0) {
			const adjacent = new Set(s.tokens[seat].flatMap((at) => neighbours(at, size).map((n) => edge(at, n))))
			for (const wall of s.walls.filter((w) => adjacent.has(w)))
				moves.push(
					choice(
						`Break wall ${wall
							.split(":")
							.map((n) => Number(n) + 1)
							.join("–")}`,
						"break",
						wall,
					),
				)
		}
		return moves
	}
	const finish = (s: WallState): WallState => {
		const state = { ...s, building: null, turns: s.turns + 1, turn: (s.turn + 1) % s.tokens.length }
		if (state.turns >= 80 || areas(state).separated) return { ...state, done: true }
		for (let i = 0; i < state.tokens.length; i++) {
			if (choices(state, state.turn).length) return state
			state.turn = (state.turn + 1) % state.tokens.length
		}
		return { ...state, done: true }
	}
	return {
		id: options.id,
		name: options.name,
		blurb: options.blurb,
		players: { min: 2, max: 5 },
		rules: [
			...options.rules,
			`Each mage controls 2 familiars on a ${size}×${size} board. Move up to ${maxSteps} orthogonal steps without crossing walls or occupied squares, then build a wall beside that familiar. Staying is allowed.`,
			`Instead, spend one of ${options.wallBreaks} wall-break charges to remove a wall beside either familiar. Breaking ends your turn.`,
			"The game ends when every occupied territory contains only one mage, or after 80 turns. Unclaimed land scores nothing; contested land at the limit splits evenly between its occupants. Most territory wins.",
			"This edition assigns starting positions, permits staying, uses a turn limit, and omits the show’s rematch ladder and clock.",
		],
		setup: (_rng, n) => ({
			tokens: Array.from({ length: n }, (_, seat) => [
				Math.floor((seat * size * size) / (n * 2)),
				Math.floor(((seat + n) * size * size) / (n * 2)),
			]),
			walls: [],
			breaks: Array(n).fill(options.wallBreaks),
			turn: 0,
			building: null,
			turns: 0,
			done: false,
			log: [],
		}),
		toAct: (s) => (s.done ? [] : [s.turn]),
		parseMove: parseTrialMove,
		apply(s, seat, m) {
			allowed(m, choices(s, seat))
			if (m.action === "move") {
				const [index, to] = m.value.split(":").map(Number)
				return {
					...s,
					tokens: s.tokens.map((tokens, i) => (i === seat ? tokens.map((at, j) => (j === index ? to : at)) : tokens)),
					building: to,
					log: [
						...s.log,
						`Mage ${seat + 1} moved familiar ${index + 1} from ${s.tokens[seat][index] + 1} to ${to + 1}.`,
					],
				}
			}
			if (m.action === "wall")
				return finish({
					...s,
					walls: [...s.walls, m.value],
					log: [
						...s.log,
						`Mage ${seat + 1} built a wall between ${m.value
							.split(":")
							.map((n) => Number(n) + 1)
							.join(" and ")}.`,
					],
				})
			return finish({
				...s,
				walls: s.walls.filter((w) => w !== m.value),
				breaks: s.breaks.map((n, i) => (i === seat ? n - 1 : n)),
				log: [
					...s.log,
					`Mage ${seat + 1} broke the wall between ${m.value
						.split(":")
						.map((n) => Number(n) + 1)
						.join(" and ")}.`,
				],
			})
		},
		outcome: (s) => (s.done ? result(areas(s).scores) : null),
		view(s, seat) {
			const legal = choices(s, seat)
			const v = view(
				s.building === null ? "Move or break" : "Build a wall",
				`Turn ${s.turns + 1} · Mage ${s.turn + 1}`,
				areas(s).scores,
				legal,
				[`Your wall breaks: ${s.breaks[seat]}`, `Walls: ${s.walls.length}`],
				s.log,
			)
			v.choices = legal.map((c) => {
				const [first, last] = c.move.value.split(":").map(Number)
				return {
					...c,
					steps:
						c.move.action === "move"
							? [
									step("Choose an action", "move", "Move a familiar"),
									step("Choose your familiar", first, `Familiar ${first + 1} · square ${s.tokens[seat][first] + 1}`, {
										kind: "token",
										icon: first ? "owl" : "cat",
										tone: seat,
									}),
									step("Choose a destination", last, `Square ${last + 1}`),
								]
							: [
									step("Choose an action", c.move.action, c.move.action === "wall" ? "Build a wall" : "Break a wall"),
									step("Choose an edge", c.move.value, `Between ${first + 1} and ${last + 1}`),
								],
				}
			})
			v.scoreLabel = "Territory"
			v.board = {
				confirm: "Move familiar",
				columns: size,
				cells: Array.from({ length: size * size }, (_, at) => {
					const owner = s.tokens.findIndex((tokens) => tokens.includes(at))
					const walls = neighbours(at, size)
						.filter((n) => s.walls.includes(edge(at, n)))
						.map((n): "n" | "e" | "s" | "w" => (n === at - 1 ? "w" : n === at + 1 ? "e" : n < at ? "n" : "s"))
					return {
						label: `${at + 1}${owner >= 0 ? ` M${owner + 1}` : ""}`,
						walls,
						piece:
							owner >= 0
								? { kind: "token", icon: s.tokens[owner].indexOf(at) === 0 ? "cat" : "owl", tone: owner }
								: undefined,
						preview: legal
							.filter((c) => c.move.action === "move" && c.move.value.endsWith(`:${at}`))
							.flatMap((c) => [s.tokens[seat][Number(c.move.value.split(":")[0])], at]),
						tone: owner >= 0 ? owner : undefined,
						move:
							legal.filter((c) => c.move.action === "move" && c.move.value.endsWith(`:${at}`)).length === 1
								? legal.find((c) => c.move.action === "move" && c.move.value.endsWith(`:${at}`))?.move
								: undefined,
					}
				}),
			}
			return v
		},
		bot: randomAction,
	}
}
export const wallGo = createWallGo({
	id: "wall-go",
	name: "Wall Go",
	size: 7,
	wallBreaks: 1,
	blurb: "Walk your familiars through the grove. Raise walls to claim their territory.",
	rules: ["A 2–5 mage adaptation of the Season 2 territory game."],
})

interface BaghState {
	goats: number[]
	tigers: number[]
	reserve: number
	captured: number
	turn: number
	moves: number
	result: Outcome | null
	log: string[]
}
const baghEdges = (cell: number) => {
	const x = cell % 5,
		y = Math.floor(cell / 5)
	const dirs = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
		...(x % 2 === y % 2
			? [
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1],
				]
			: []),
	]
	return dirs.flatMap(([dx, dy]) => {
		const nx = x + dx,
			ny = y + dy
		return nx >= 0 && nx < 5 && ny >= 0 && ny < 5 ? [ny * 5 + nx] : []
	})
}
function baghChoices(s: BaghState, seat: number) {
	if (s.result || seat !== s.turn) return []
	const occupied = [...s.goats, ...s.tigers]
	if (seat === 0 && s.reserve > 0)
		return Array.from({ length: 25 }, (_, n) => n)
			.filter((n) => !occupied.includes(n))
			.map((n) => choice(`Place goat on ${n + 1}`, "goat", n))
	const pieces = seat === 0 ? s.goats : s.tigers
	return pieces.flatMap((from) =>
		baghEdges(from).flatMap((to) => {
			if (!occupied.includes(to))
				return [choice(`Move ${seat === 0 ? "goat" : "tiger"} ${from + 1} to ${to + 1}`, "walk", `${from}:${to}`)]
			if (seat !== 1 || !s.goats.includes(to)) return []
			const x = (to % 5) + ((to % 5) - (from % 5)),
				y = Math.floor(to / 5) + (Math.floor(to / 5) - Math.floor(from / 5)),
				land = y * 5 + x
			return x >= 0 && x < 5 && y >= 0 && y < 5 && baghEdges(to).includes(land) && !occupied.includes(land)
				? [choice(`Leap ${from + 1} over ${to + 1} to ${land + 1}`, "capture", `${from}:${to}:${land}`)]
				: []
		}),
	)
}
export const baghChal: GameDef<BaghState, TrialMove, TrialView> = {
	id: "bagh-chal",
	name: "Bagh Chal",
	blurb: "Four tigers hunt. Twenty goats close the circle.",
	players: { min: 2, max: 2 },
	rules: [
		"A single-board adaptation of the final. Mage 1 controls goats, Mage 2 tigers; local rematches rotate your seat.",
		"Goats place 20 pieces one at a time, then slide along the board’s lines. Tigers begin in the corners and move along the same lines.",
		"A tiger captures by leaping one adjacent goat into an empty point beyond. Diagonal lines exist only at alternating intersections.",
		"Tigers win after capturing 5 goats. Goats win when all tigers are blocked. After 120 moves, the game draws.",
		"The show used two mirrored boards at once; this edition uses one and has no enforced deadline.",
	],
	setup: () => ({
		goats: [],
		tigers: [0, 4, 20, 24],
		reserve: 20,
		captured: 0,
		turn: 0,
		moves: 0,
		result: null,
		log: [],
	}),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, baghChoices(s, seat))
		let next = { ...s, goats: [...s.goats], tigers: [...s.tigers], turn: 1 - seat, moves: s.moves + 1 }
		if (m.action === "goat") {
			next.goats.push(Number(m.value))
			next.reserve--
		} else if (m.action === "walk") {
			const [from, to] = m.value.split(":").map(Number)
			if (seat === 0) next.goats = next.goats.map((n) => (n === from ? to : n))
			else next.tigers = next.tigers.map((n) => (n === from ? to : n))
		} else {
			const [from, over, to] = m.value.split(":").map(Number)
			next.tigers = next.tigers.map((n) => (n === from ? to : n))
			next.goats = next.goats.filter((n) => n !== over)
			next.captured++
		}
		if (next.captured >= 5) next.result = { winners: [1] }
		else if (baghChoices({ ...next, turn: 1 }, 1).length === 0) next.result = { winners: [0] }
		else if (next.moves >= 120) next.result = { winners: [] }
		else if (baghChoices(next, next.turn).length === 0) next.turn = seat
		next.log = [
			...s.log,
			`Mage ${seat + 1}: ${baghChoices(s, seat).find((c) => c.move.action === m.action && c.move.value === m.value)!.label}.`,
		]
		return next
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const choices = baghChoices(s, seat)
		const v = view(
			s.reserve > 0 ? "Place goats; move tigers" : "Move along the lines",
			"Goats surround; tigers capture",
			[s.goats.length, s.captured],
			choices,
			[
				`Goats waiting: ${s.reserve}`,
				`Goats captured: ${s.captured} / 5`,
				"Mage 1: goats · Mage 2: tigers",
				"Diagonals connect alternating intersections.",
			],
			s.log,
		)
		v.choices = choices.map((c) => {
			const at = c.move.value.split(":").map(Number)
			if (c.move.action === "goat") return { ...c, piece: { kind: "token", icon: "goat", tone: 0 } }
			return {
				...c,
				steps: [
					step("Choose a piece", at[0], `Square ${at[0] + 1}`, {
						kind: "token",
						icon: seat === 0 ? "goat" : "tiger",
						tone: seat,
					}),
					step(
						"Choose a destination",
						c.move.value,
						`${c.move.action === "capture" ? "Capture at" : "Move to"} ${at.at(-1)! + 1}`,
					),
				],
			}
		})
		v.displays = [
			{
				label: "Goat reserve",
				items: Array.from({ length: s.reserve }, () => ({
					label: "Unplaced goat",
					piece: { kind: "token", icon: "goat", tone: 0 },
				})),
			},
		]
		v.board = {
			confirm: "Place goat",
			columns: 5,
			layout: "bagh",
			cells: Array.from({ length: 25 }, (_, n) => ({
				label: `${n + 1} ${s.tigers.includes(n) ? "Tiger" : s.goats.includes(n) ? "Goat" : (n % 5) % 2 === Math.floor(n / 5) % 2 ? "✣" : "+"}`,
				piece: s.tigers.includes(n)
					? { kind: "token", icon: "tiger", tone: 1 }
					: s.goats.includes(n)
						? { kind: "token", icon: "goat", tone: 0 }
						: undefined,
				preview: choices
					.filter((c) => c.move.action !== "goat" && Number(c.move.value.split(":")[0]) === n)
					.flatMap((c) => c.move.value.split(":").map(Number)),
				tone: s.tigers.includes(n) ? 1 : s.goats.includes(n) ? 0 : undefined,
				move: choices.find((c) => c.move.action === "goat" && Number(c.move.value) === n)?.move,
			})),
		}
		return v
	},
	bot(v, seat, rng) {
		const captures = v.choices.filter((c) => c.move.action === "capture")
		return randomAction({ ...v, choices: captures.length ? captures : v.choices }, seat, rng)
	},
}
