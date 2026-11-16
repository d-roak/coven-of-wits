import { type AnyGame, type GameDef, illegal, parseWith, shuffle, topSeats } from "../../game.js"
import { z } from "zod"
import { type DevilEntry, roundOf, type TrialMove, type TrialView, type TrialPiece } from "./trial.js"

const parsePuzzle = parseWith(z.object({ action: z.enum(["answer", "turn"]), value: z.string().max(40) }).strict())
interface CountState {
	puzzles: { cells: number[]; target: number }[]
	round: number
	scores: number[]
	log: string[]
}
const numberAnswer = (value: string) => {
	if (!/^(0|[1-9]\d{0,3})$/.test(value)) illegal("Enter a whole number from 0 to 9999.")
	return Number(value)
}

export function rectangleCount(cells: number[], target: number): number {
	let count = 0
	for (let top = 0; top < 4; top++)
		for (let bottom = top; bottom < 4; bottom++)
			for (let left = 0; left < 4; left++)
				for (let right = left; right < 4; right++) {
					let sum = 0
					for (let row = top; row <= bottom; row++)
						for (let col = left; col <= right; col++) sum += cells[row * 4 + col]!
					if (sum === target) count++
				}
	return count
}

function countingGame(cubes: boolean): GameDef<CountState, TrialMove, TrialView> {
	return {
		id: cubes ? "count-the-cubes" : "count-the-rectangles",
		name: cubes ? "Count the Cubes" : "Count the Rectangles",
		blurb: cubes
			? "Count every cube, including the ones hidden underneath."
			: "How many rectangles add up to the target?",
		players: { min: 1, max: 1 },
		rules: cubes
			? [
					"Count every solid cube in the pile. Stacks have no gaps or floating cubes.",
					"Turn the pile to inspect all four sides. Cubes hidden underneath still count.",
					"Coven adaptation: 3 untimed piles, one answer per pile. Solve at least 2 to win; no live buzzer race.",
				]
			: [
					"Count all axis-aligned rectangles whose cells sum to the target, including single cells.",
					"Blank cells count as 0. Rectangles may overlap, and negative numbers count normally.",
					"Coven adaptation: 3 untimed 4×4 puzzles, one answer per puzzle. Solve at least 2 to win; no team buzzer or threshold rounds.",
				],
		setup(rng) {
			return {
				puzzles: Array.from({ length: 3 }, () => {
					const cells = Array.from({ length: 16 }, () =>
						cubes ? Math.floor(rng() * 5) + 1 : Math.floor(rng() * 6) - 2,
					)
					return { cells, target: cells[Math.floor(rng() * 16)]! }
				}),
				round: 0,
				scores: [0],
				log: [],
			}
		},
		toAct: (s) => (s.round < 3 ? [0] : []),
		parseMove: parsePuzzle,
		apply(s, seat, move) {
			if (s.round >= 3) illegal("This trial is over.")
			if (seat !== 0) illegal("This is a solo trial.")
			const puzzle = s.puzzles[s.round]!
			if (move.action === "turn" && cubes && move.value === "") {
				const cells = puzzle.cells.map((_, i) => puzzle.cells[(3 - (i % 4)) * 4 + Math.floor(i / 4)]!)
				return { ...s, puzzles: s.puzzles.map((p, i) => (i === s.round ? { ...p, cells } : p)) }
			}
			if (move.action !== "answer") illegal("Choose Answer, or turn a cube pile.")
			const answer = numberAnswer(move.value)
			const expected = cubes ? puzzle.cells.reduce((a, b) => a + b, 0) : rectangleCount(puzzle.cells, puzzle.target)
			const correct = answer === expected
			return {
				...s,
				round: s.round + 1,
				scores: [s.scores[0]! + Number(correct)],
				log: [...s.log, `Trial ${s.round + 1}: ${answer}. ${correct ? "Correct" : `The answer was ${expected}`}.`],
			}
		},
		round: (s) => s.round + 1,
		outcome: (s) => (s.round < 3 ? null : { winners: s.scores[0]! >= 2 ? [0] : [] }),
		view(s) {
			const puzzle = s.puzzles[s.round]
			return {
				...(puzzle ? { round: roundOf("Trial", s.round + 1, 3) } : {}),
				phase: puzzle ? (cubes ? "Count the cubes" : "Count the rectangles") : "Trials complete",
				prompt: puzzle
					? cubes
						? "How many cubes are in this pile?"
						: `How many rectangles sum to ${puzzle.target}?`
					: "Your answers are recorded below.",
				scores: s.scores,
				facts: ["Solve at least 2 of 3 to win."],
				displays: [
					{
						label: "Trial progress",
						items: Array.from({ length: 3 }, (_, i) => ({
							label: `Trial ${i + 1}${i < s.round ? ", answered" : ""}`,
							piece: {
								kind: "token" as const,
								icon: "candle" as const,
								text: String(i + 1),
								tone: i < s.round ? 1 : 3,
							},
						})),
					},
					...(!cubes && puzzle
						? [
								{
									label: "Target sum",
									items: [
										{ label: String(puzzle.target), piece: { kind: "tile" as const, text: String(puzzle.target) } },
									],
								},
							]
						: []),
				],
				log: s.log,
				choices: puzzle && cubes ? [{ label: "Turn pile", move: { action: "turn", value: "" } }] : [],
				...(puzzle
					? { input: { label: "Your count", action: "answer", kind: "number" as const, placeholder: "0" } }
					: {}),
				...(puzzle && cubes ? { cubes: { columns: 4, heights: puzzle.cells } } : {}),
				...(puzzle && !cubes
					? {
							board: {
								columns: 4,
								cells: puzzle.cells.map((n) => ({
									label: n === 0 ? "Blank, zero" : String(n),
									piece: { kind: "tile" as const, text: n === 0 ? "·" : String(n) },
								})),
							},
						}
					: {}),
			}
		},
	}
}
export const countTheCubes = countingGame(true)
export const countTheRectangles = countingGame(false)

interface PokerState {
	deals: { cards: number[]; community: number[] }[]
	round: number
	ready: boolean[]
	picks: (number[] | null)[]
	scores: number[]
	log: string[]
}
const pokerSchema = z.object({ action: z.enum(["hide", "pick"]), value: z.string().max(80) }).strict()
const selectedPair = parseWith(
	z
		.array(z.string().regex(/^(?:[0-9]|1[0-5])$/))
		.length(2)
		.refine((a) => a[0] !== a[1]),
)
const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
// The cards are drawn with the coven's suits, so they are named that way too.
const SUIT_NAMES = ["leaves", "stars", "flames", "moons"] as const
const cardName = (id: number) => `${RANKS[id % 13]} ${SUIT_NAMES[Math.floor(id / 13)]}`

const cardPiece = (id: number): TrialPiece => ({
	kind: "card",
	rank: RANKS[id % 13]!,
	suit: SUITS[Math.floor(id / 13)]!,
})

/** Lexicographic poker strength encoded in base 15, with room for five kickers. */
export function pokerRank(cards: number[]): number {
	const ranks = cards.map((c) => (c % 13) + 2).sort((a, b) => b - a)
	const groups = [...new Set(ranks)]
		.map((n) => [ranks.filter((r) => r === n).length, n] as const)
		.sort((a, b) => b[0] - a[0] || b[1] - a[1])
	const flush = cards.every((c) => Math.floor(c / 13) === Math.floor(cards[0]! / 13))
	const straight =
		groups.length === 5 ? (ranks[0]! - ranks[4]! === 4 ? ranks[0]! : ranks.join() === "14,5,4,3,2" ? 5 : 0) : 0
	let category = 0
	let kickers = ranks
	if (flush && straight) {
		category = 8
		kickers = [straight]
	} else if (groups[0]![0] === 4) {
		category = 7
		kickers = groups.map((g) => g[1])
	} else if (groups[0]![0] === 3 && groups[1]![0] === 2) {
		category = 6
		kickers = groups.map((g) => g[1])
	} else if (flush) category = 5
	else if (straight) {
		category = 4
		kickers = [straight]
	} else if (groups[0]![0] === 3) {
		category = 3
		kickers = groups.map((g) => g[1])
	} else if (groups[0]![0] === 2 && groups[1]![0] === 2) {
		category = 2
		kickers = groups.map((g) => g[1])
	} else if (groups[0]![0] === 2) {
		category = 1
		kickers = groups.map((g) => g[1])
	}
	return Array.from({ length: 5 }, (_, i) => kickers[i] ?? 0).reduce((n, k) => n * 15 + k, category)
}

export const memoryPoker: GameDef<PokerState, TrialMove, TrialView> = {
	id: "memory-poker",
	name: "Memory Poker",
	blurb: "Remember 16 cards. Choose 2 to complete the strongest hand.",
	players: { min: 2, max: 5 },
	rules: [
		"Memorize the 4×4 array of 16 cards, then choose Hide cards. The 3 community cards appear when everyone is ready.",
		"Select 2 different hidden positions. Those cards and the community cards form your 5-card poker hand. Players may choose the same positions.",
		"Poker order: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card. Ties compare ranks, then kickers. Aces may be low in A–2–3–4–5.",
		"Coven adaptation: 5 untimed rounds for 2–5 players. The strongest hand earns 1 point; tied strongest hands all score. Bots choose from concealed positions without seeing the cards.",
	],
	setup(rng, players) {
		return {
			deals: Array.from({ length: 5 }, () => {
				const deck = shuffle(
					Array.from({ length: 52 }, (_, i) => i),
					rng,
				)
				return { cards: deck.slice(0, 16), community: deck.slice(16, 19) }
			}),
			round: 0,
			ready: Array<boolean>(players).fill(false),
			picks: Array<null>(players).fill(null),
			scores: Array<number>(players).fill(0),
			log: [],
		}
	},
	toAct: (s) =>
		s.round >= 5
			? []
			: s.ready.every(Boolean)
				? s.picks.flatMap((p, i) => (p === null ? [i] : []))
				: s.ready.flatMap((r, i) => (r ? [] : [i])),
	parseMove: parseWith(pokerSchema),
	apply(s, seat, move) {
		if (!memoryPoker.toAct(s).includes(seat)) illegal("Wait for your next memory turn.")
		if (!s.ready.every(Boolean)) {
			if (move.action !== "hide" || move.value !== "") illegal("Memorize the cards, then hide them.")
			return { ...s, ready: s.ready.map((r, i) => (i === seat ? true : r)) }
		}
		if (move.action !== "pick") illegal("Pick 2 hidden cards.")
		let raw: unknown
		try {
			raw = JSON.parse(move.value)
		} catch {
			illegal("Choose exactly 2 different card positions.")
		}
		const pair = selectedPair(raw).map(Number)
		const picks = s.picks.map((p, i) => (i === seat ? pair : p))
		if (picks.some((p) => p === null)) return { ...s, picks }
		const deal = s.deals[s.round]!
		const strengths = picks.map((p) => pokerRank([...deal.community, ...p!.map((i) => deal.cards[i]!)]))
		const best = Math.max(...strengths)
		return {
			...s,
			round: s.round + 1,
			ready: s.ready.map(() => false),
			picks: picks.map(() => null),
			scores: s.scores.map((n, i) => n + Number(strengths[i] === best)),
			log: [
				...s.log,
				`Round ${s.round + 1}. Community: ${deal.community.map(cardName).join(", ")}.`,
				...picks.map(
					(p, i) =>
						`Mage ${i + 1}: ${p!.map((c) => cardName(deal.cards[c]!)).join(" + ")}${strengths[i] === best ? " · scored 1" : ""}.`,
				),
			],
		}
	},
	round: (s) => s.round + 1,
	outcome: (s) => (s.round < 5 ? null : { winners: topSeats(s.scores) }),
	view(s, seat) {
		const deal = s.deals[s.round]
		const choosing = s.ready.every(Boolean)
		const reveal = Boolean(deal) && !s.ready[seat]
		const canPick = Boolean(deal) && choosing && s.picks[seat] === null
		return {
			...(deal ? { round: roundOf("Round", s.round + 1, s.deals.length) } : {}),
			phase: deal ? (choosing ? "Choose from memory" : "Memorize") : "Game complete",
			prompt: deal
				? choosing
					? "Pick 2 positions to complete your hand."
					: s.ready[seat]
						? "Waiting for the other mages to hide their cards."
						: "Remember the ranks and suits before hiding the cards."
				: "Compare your scores.",
			scores: s.scores,
			facts:
				deal && choosing
					? [
							`Community: ${deal.community.map(cardName).join(" / ")}`,
							s.picks[seat] ? "Your picks are sealed." : "The same positions can be selected by multiple players.",
						]
					: [],
			log: s.log,
			displays:
				deal && choosing
					? [
							{
								label: "Community cards",
								items: deal.community.map((c) => ({ label: cardName(c), piece: cardPiece(c) })),
							},
						]
					: [],
			choices: reveal ? [{ label: "Hide cards", move: { action: "hide", value: "" } }] : [],
			...(deal
				? {
						board: {
							columns: 4,
							cells: deal.cards.map((c, i) => ({
								label: reveal ? `${i + 1}: ${cardName(c)}` : `Card ${i + 1}`,
								piece: reveal ? cardPiece(c) : { kind: "back" as const },
							})),
						},
					}
				: {}),
			...(canPick
				? {
						selection: {
							label: "Choose 2 card positions",
							onBoard: true,
							submit: "Seal pair",
							action: "pick",
							min: 2,
							max: 2,
							options: deal.cards.map((_, i) => ({
								value: String(i),
								label: `Card ${i + 1}`,
								piece: { kind: "back" as const },
							})),
						},
					}
				: {}),
		}
	},
	bot(view, _seat, rng) {
		if (view.choices.length) return view.choices[0]!.move
		const options = shuffle(view.selection!.options, rng).slice(0, 2)
		return { action: "pick", value: JSON.stringify(options.map((o) => o.value)) }
	},
}

const GRASS_SHAPES: readonly (readonly (readonly [number, number])[])[] = [
	[
		[0, 0],
		[1, 0],
		[2, 0],
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
		[0, 1],
		[1, 1],
		[0, 2],
	],
	[
		[0, 0],
		[1, 0],
		[2, 0],
		[0, 1],
		[2, 1],
		[1, 2],
		[2, 2],
	],
	[
		[0, 0],
		[1, 0],
		[2, 0],
		[3, 0],
		[0, 1],
		[2, 1],
		[3, 1],
	],
	[
		[0, 0],
		[1, 0],
		[2, 0],
		[0, 1],
		[2, 1],
		[0, 2],
		[1, 2],
	],
	[
		[0, 0],
		[1, 0],
		[2, 0],
		[0, 1],
		[2, 1],
		[0, 2],
		[1, 2],
		[2, 2],
		[3, 2],
	],
]
interface GrassPick {
	shape: number
	aggressive: boolean
}
interface GrassState {
	cells: (number | null)[]
	picks: (GrassPick | null)[]
	scores: number[]
	round: number
	phase: "draft" | "place" | "over"
	queue: number[]
	rotation: number
	trim: number
	log: string[]
}
const grassParse = parseWith(
	z.object({ action: z.enum(["draft", "rotate", "trim", "place", "pass"]), value: z.string().max(20) }).strict(),
)
function grassShape(shape: number, rotation: number, trim: number): [number, number][] {
	let cells: [number, number][] = GRASS_SHAPES[shape]!.slice(0, GRASS_SHAPES[shape]!.length - trim).map(([x, y]) => [
		x,
		y,
	])
	for (let r = 0; r < rotation; r++) cells = cells.map(([x, y]) => [-y, x])
	const minX = Math.min(...cells.map(([x]) => x))
	const minY = Math.min(...cells.map(([, y]) => y))
	return cells.map(([x, y]) => [x - minX, y - minY])
}
function grassTargets(s: GrassState, seat: number, rotation = s.rotation, trim = s.trim): number[] {
	const shape = s.picks[seat]
	if (!shape) return []
	const offsets = grassShape(shape.shape, rotation, trim)
	return s.cells.flatMap((_, i) =>
		offsets.every(([x, y]) => (i % 6) + x < 6 && Math.floor(i / 6) + y < 6 && s.cells[i + y * 6 + x] === null)
			? [i]
			: [],
	)
}
function grassCanPlace(s: GrassState, seat: number): boolean {
	return [0, 1, 2, 3].some((r) =>
		Array.from({ length: s.picks[seat]!.aggressive ? 1 : 3 }, (_, t) => t).some(
			(t) => grassTargets(s, seat, r, t).length > 0,
		),
	)
}
export const layTheGrass: GameDef<GrassState, TrialMove, TrialView> = {
	id: "lay-the-grass",
	name: "Lay the Grass",
	blurb: "Draft a valuable patch, then find room before the garden fills.",
	players: { min: 2, max: 5 },
	rules: [
		"Draft a patch publicly, lowest score first. Patch values are 1, 3, 5, 7, 9, 11 and 13. Different players may draft the same patch.",
		"Choose aggressive for double points if placed and −4 if blocked, or defensive to trim up to 2 squares from the patch's end before placing.",
		"Smaller-value patches place first. Rotate freely; patches cannot overlap or leave the garden. If no orientation fits, pass.",
		"Coven adaptation: 3 drafts on one 6×6 garden with original patch shapes. No flipping. The show's 114-square park, pairing, containment and terrain selections are omitted.",
	],
	setup(_rng, players) {
		return {
			cells: Array<null>(36).fill(null),
			picks: Array<null>(players).fill(null),
			scores: Array<number>(players).fill(0),
			round: 0,
			phase: "draft",
			queue: Array.from({ length: players }, (_, i) => i),
			rotation: 0,
			trim: 0,
			log: [],
		}
	},
	toAct: (s) => (s.phase === "over" ? [] : [s.queue[0]!]),
	parseMove: grassParse,
	apply(s, seat, move) {
		if (!layTheGrass.toAct(s).includes(seat)) illegal("Wait for your garden turn.")
		if (s.phase === "draft") {
			if (move.action !== "draft" || !/^[0-6]:[ad]$/.test(move.value))
				illegal("Choose a patch and aggressive or defensive play.")
			const [shape, stance] = move.value.split(":")
			const picks = s.picks.map((p, i) => (i === seat ? { shape: Number(shape), aggressive: stance === "a" } : p))
			return s.queue.length > 1
				? { ...s, picks, queue: s.queue.slice(1) }
				: {
						...s,
						picks,
						phase: "place",
						queue: picks.map((_, i) => i).sort((a, b) => picks[a]!.shape - picks[b]!.shape || a - b),
					}
		}
		const patch = s.picks[seat]!
		if (move.action === "rotate" && move.value === "") return { ...s, rotation: (s.rotation + 1) % 4 }
		if (move.action === "trim") {
			if (patch.aggressive || !/^[0-2]$/.test(move.value)) illegal("Only defensive patches may trim 0 to 2 squares.")
			return { ...s, trim: Number(move.value) }
		}
		let cells = [...s.cells]
		let gain = 0
		if (move.action === "pass" && move.value === "") {
			if (grassCanPlace(s, seat)) illegal("Your patch still fits. Rotate or trim it first.")
			gain = patch.aggressive ? -4 : 0
		} else {
			if (
				move.action !== "place" ||
				!/^(?:[0-9]|[12][0-9]|3[0-5])$/.test(move.value) ||
				!grassTargets(s, seat).includes(Number(move.value))
			)
				illegal("Place the patch inside empty garden squares.")
			const at = Number(move.value)
			for (const [x, y] of grassShape(patch.shape, s.rotation, s.trim)) cells[at + y * 6 + x] = seat
			gain = (patch.shape * 2 + 1) * (patch.aggressive ? 2 : 1)
		}
		const scores = s.scores.map((n, i) => n + (i === seat ? gain : 0))
		const log = [
			...s.log,
			`Mage ${seat + 1}: ${move.action === "pass" ? "passed" : "planted"} patch ${patch.shape * 2 + 1}, ${gain >= 0 ? "+" : ""}${gain} points.`,
		]
		if (s.queue.length > 1) return { ...s, cells, scores, log, queue: s.queue.slice(1), rotation: 0, trim: 0 }
		const round = s.round + 1
		return {
			...s,
			cells,
			scores,
			log,
			round,
			phase: round === 3 ? "over" : "draft",
			picks: s.picks.map(() => null),
			queue: scores.map((_, i) => i).sort((a, b) => scores[a]! - scores[b]! || a - b),
			rotation: 0,
			trim: 0,
		}
	},
	round: (s) => s.round + 1,
	outcome: (s) => (s.phase === "over" ? { winners: topSeats(s.scores) } : null),
	view(s, seat) {
		const active = s.queue[0] === seat && s.phase !== "over"
		const patch = s.picks[seat]
		const placing = active && s.phase === "place"
		const targets = placing ? grassTargets(s, seat) : []
		return {
			round: roundOf("Draft", Math.min(s.round + 1, 3), 3),
			phase: { draft: "Draft a patch", place: "Place your patch", over: "Garden complete" }[s.phase],
			prompt:
				s.phase === "draft"
					? "Choose your patch and stance."
					: s.phase === "over"
						? "The garden is full of plans."
						: "Rotate or trim your patch, then choose its top-left corner.",
			scores: s.scores,
			log: s.log,
			facts: [
				"Patch values: 1 / 3 / 5 / 7 / 9 / 11 / 13.",
				...(s.phase === "draft"
					? GRASS_SHAPES.map(
							(_, i) => `Patch ${i * 2 + 1}: ${shapeRows(grassShape(i, 0, 0))}. Rows run left to right; dots are gaps.`,
						)
					: []),
				...s.picks.flatMap((p, i) =>
					p ? [`Mage ${i + 1}: patch ${p.shape * 2 + 1}, ${p.aggressive ? "aggressive" : "defensive"}.`] : [],
				),
				...(placing
					? [
							`Rotation ${s.rotation * 90}°, trimmed ${s.trim}. Shape rows: ${shapeRows(grassShape(patch!.shape, s.rotation, s.trim))}`,
						]
					: []),
			],
			choices:
				active && s.phase === "draft"
					? GRASS_SHAPES.flatMap((_, i) =>
							[false, true].map((aggressive) => ({
								label: `Patch ${i * 2 + 1} · ${aggressive ? "aggressive" : "defensive"}`,
								move: { action: "draft", value: `${i}:${aggressive ? "a" : "d"}` },
								steps: [
									{
										prompt: "Choose a patch",
										key: String(i),
										label: `Patch ${i * 2 + 1}`,
										piece: { kind: "shape" as const, cells: GRASS_SHAPES[i]!, tone: seat },
									},
									{
										prompt: "Choose a stance",
										key: aggressive ? "a" : "d",
										label: aggressive ? "Aggressive · double or −4" : "Defensive · may trim",
										piece: { kind: "token" as const, icon: aggressive ? ("sword" as const) : ("shield" as const) },
									},
								],
							})),
						)
					: placing
						? [
								{ label: "Rotate patch", move: { action: "rotate", value: "" } },
								...(!patch!.aggressive
									? [0, 1, 2]
											.filter((n) => n !== s.trim)
											.map((n) => ({ label: `Trim ${n}`, move: { action: "trim", value: String(n) } }))
									: []),
								...(!grassCanPlace(s, seat) ? [{ label: "Pass patch", move: { action: "pass", value: "" } }] : []),
							]
						: [],
			displays: placing
				? [
						{
							label: "Your patch",
							items: [
								{
									label: `Patch ${patch!.shape * 2 + 1}`,
									piece: { kind: "shape", cells: grassShape(patch!.shape, s.rotation, s.trim), tone: seat },
								},
							],
						},
					]
				: [],
			board: {
				confirm: "Plant patch",
				columns: 6,
				cells: s.cells.map((c, i) => ({
					label: c === null ? String(i + 1) : `Mage ${c + 1}`,
					...(c !== null ? { tone: c, piece: { kind: "token" as const, icon: "leaf" as const, tone: c } } : {}),
					...(targets.includes(i)
						? {
								move: { action: "place", value: String(i) },
								preview: grassShape(patch!.shape, s.rotation, s.trim).map(([x, y]) => i + y * 6 + x),
							}
						: {}),
				})),
			},
		}
	},
	bot(view) {
		const target = view.board?.cells.find((c) => c.move)?.move
		if (target) return target
		const pass = view.choices.find((c) => c.move.action === "pass")
		if (pass) return pass.move
		const draft = view.choices.find((c) => c.move.action === "draft")
		if (draft) return draft.move
		const trim = view.choices.find((c) => c.move.action === "trim" && c.move.value === "2")
		if (trim) return trim.move
		return view.choices.find((c) => c.move.action === "rotate")!.move
	},
}
function shapeRows(cells: [number, number][]): string {
	return Array.from({ length: Math.max(...cells.map(([, y]) => y)) + 1 }, (_, y) =>
		Array.from({ length: Math.max(...cells.map(([x]) => x)) + 1 }, (_, x) =>
			cells.some(([a, b]) => a === x && b === y) ? "■" : "·",
		).join(""),
	).join(" / ")
}

export const seasonThreePuzzleGames: AnyGame[] = [countTheCubes, countTheRectangles, layTheGrass, memoryPoker]
export const seasonThreePuzzleCatalog: DevilEntry[] = [
	{
		id: countTheCubes.id,
		season: 3,
		kind: "Main",
		adaptation: "Solo, 3 untimed piles; rotate the solid stacks to inspect them.",
		sources: ["https://quoridorgame.com/en/count-the-cubes/rules/"],
	},
	{
		id: countTheRectangles.id,
		season: 3,
		kind: "Main",
		adaptation: "Solo, 3 untimed 4×4 exact-sum puzzles; no buzzer or team scoring.",
		sources: ["https://playdevilplan.com/en/games/count-the-rectangles"],
	},
	{
		id: layTheGrass.id,
		season: 3,
		kind: "Main",
		adaptation:
			"Compact 6×6 garden, original patches, 3 drafts. Retains ascending placement and aggressive/defensive choices; omits terrain and alliance selections.",
		sources: ["https://playdevilplan.com/en/games/lay-the-grass"],
	},
	{
		id: memoryPoker.id,
		season: 3,
		kind: "Main",
		adaptation: "Untimed memory and 5 scored rounds for 2–5 players; tied best hands share a point.",
		sources: ["https://quoridorgame.com/en/memory-poker/rules/"],
	},
]
