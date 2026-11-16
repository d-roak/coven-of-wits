import { type GameDef, type Outcome, illegal, pick, seededRng, shuffle, topSeats } from "../../game"
import { roundOf, type TrialMove, type TrialView, type TrialIcon, type TrialPiece } from "./trial"
import { blank, choice, choiceBot, integer, liveSeat, parseActions, selection, view } from "./seasonOneSupport"

const PERSONAL_RULES = [
	"Whenever anyone is imprisoned, gain an escape ticket.",
	"When you escape prison, advance one space.",
	"When you roll three, advance one extra space.",
]
const GROUP_RULES = [
	"A roll of one moves two spaces.",
	"A prison roll moves one space instead.",
	"A roll of three moves four spaces.",
]
interface RaceState {
	positions: number[]
	tickets: number[]
	jailed: boolean[]
	rules: (number | null)[]
	group: number | null
	phase: "rules" | "roll" | "office"
	turn: number
	turns: number
	seed: number
	log: string[]
	result: Outcome | null
}
function raceNext(s: RaceState): RaceState {
	const winners = s.positions.flatMap((position, seat) => (position >= 20 ? [seat] : []))
	const turns = s.turns + 1
	return {
		...s,
		phase: "roll",
		turn: (s.turn + 1) % s.positions.length,
		turns,
		result: winners.length ? { winners } : turns >= 160 ? { winners: topSeats(s.positions) } : null,
	}
}
export const rulesRace: GameDef<RaceState, TrialMove, TrialView> = {
	id: "rules-race",
	round: (s) => (s.phase === "rules" ? 1 : Math.floor(s.turns / s.positions.length) + 1),
	name: "Rules Race",
	blurb: "Write your advantage into the rules, then race out of the woods.",
	rules: [
		"A 20-space adaptation of the show’s rule-building race for 2–5 mages.",
		"Choose one personal rule. The die has faces 1, 2, 2, 3, Prison and Escape. Prison freezes movement until Escape is rolled or a ticket is spent.",
		"Land on office spaces 4, 8, 12 or 16 by rolling to gain a ticket, roll again, or rewrite the shared rule.",
		"The first mage to reach space 20 wins. After 160 turns, the furthest mages win.",
		"This edition offers three personal and three shared rules instead of free-form rule blocks. It has no special die, ticket trading, or season Piece penalties.",
	],
	players: { min: 2, max: 5 },
	setup: (rng, players) => ({
		positions: Array(players).fill(0),
		tickets: Array(players).fill(0),
		jailed: Array(players).fill(false),
		rules: Array(players).fill(null),
		group: null,
		phase: "rules",
		turn: 0,
		turns: 0,
		seed: Math.floor(rng() * 4294967296),
		log: [],
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseActions("rule", "roll", "escape", "office", "group"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, s.positions.length, s.turn)
		if (s.phase === "rules") {
			if (move.action !== "rule") return illegal("Choose a personal rule first.")
			const rule = integer(move.value, 0, 2),
				rules = s.rules.map((entry, index) => (index === seat ? rule : entry))
			return {
				...s,
				rules,
				turn: (seat + 1) % rules.length,
				phase: rules.every((entry) => entry !== null) ? "roll" : "rules",
				log: [...s.log, `Mage ${seat + 1} chose: ${PERSONAL_RULES[rule]}`].slice(-200),
			}
		}
		if (s.phase === "office") {
			if (move.action === "group") {
				const group = integer(move.value, 0, 2)
				return raceNext({
					...s,
					group,
					log: [...s.log, `Mage ${seat + 1} changed the shared rule: ${GROUP_RULES[group]}`].slice(-200),
				})
			}
			if (move.action !== "office" || !["ticket", "reroll"].includes(move.value))
				return illegal("Choose an office benefit.")
			if (move.value === "reroll")
				return { ...s, phase: "roll", log: [...s.log, `Mage ${seat + 1} chose another roll.`].slice(-200) }
			return raceNext({
				...s,
				log: [...s.log, `Mage ${seat + 1} took an escape ticket.`].slice(-200),
				tickets: s.tickets.map((count, index) => (index === seat ? count + 1 : count)),
			})
		}
		if (move.action === "escape") {
			blank(move.value)
			if (!s.jailed[seat] || s.tickets[seat] < 1) return illegal("An imprisoned mage needs an escape ticket.")
			const positions = s.positions.map((position, index) =>
				index === seat && s.rules[seat] === 1 ? position + 1 : position,
			)
			return raceNext({
				...s,
				positions,
				tickets: s.tickets.map((count, index) => (index === seat ? count - 1 : count)),
				jailed: s.jailed.map((jailed, index) => (index === seat ? false : jailed)),
				log: [...s.log, `Mage ${seat + 1} spent an escape ticket.`].slice(-200),
			})
		}
		if (move.action !== "roll") return illegal("Roll the die or use an escape ticket.")
		blank(move.value)
		const rng = seededRng(s.seed),
			face = pick([1, 2, 2, 3, "Prison", "Escape"] as const, rng)
		const next = {
			...s,
			positions: [...s.positions],
			tickets: [...s.tickets],
			jailed: [...s.jailed],
			seed: Math.floor(rng() * 4294967296),
			log: [...s.log, `Mage ${seat + 1} rolled ${face}.`].slice(-200),
		}
		if (s.jailed[seat]) {
			if (face === "Escape") {
				next.jailed[seat] = false
				if (s.rules[seat] === 1) next.positions[seat]++
			}
			return raceNext(next)
		}
		if (face === "Prison" && s.group !== 1) {
			next.jailed[seat] = true
			next.tickets = next.tickets.map((count, index) => (s.rules[index] === 0 ? count + 1 : count))
			return raceNext(next)
		}
		if (face === "Escape") return raceNext(next)
		let distance: number = face === "Prison" ? 1 : face
		if (s.group === 0 && distance === 1) distance = 2
		if (s.group === 2 && distance === 3) distance = 4
		if (face === 3 && s.rules[seat] === 2) distance++
		next.positions[seat] += distance
		if (next.positions[seat] >= 20) return raceNext(next)
		if ([4, 8, 12, 16].includes(next.positions[seat])) return { ...next, phase: "office" }
		return raceNext(next)
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const acting = !s.result && s.turn === seat
		const choices = !acting
			? []
			: s.phase === "rules"
				? PERSONAL_RULES.map((label, index) =>
						choice(label, "rule", String(index), { piece: { kind: "card", rank: String(index + 1) } }),
					)
				: s.phase === "office"
					? [
							choice("Take escape ticket", "office", "ticket", {
								piece: { kind: "token", icon: "key" },
								steps: [
									{
										prompt: "Choose office benefit",
										key: "ticket",
										label: "Take escape ticket",
										piece: { kind: "token", icon: "key" },
									},
								],
							}),
							choice("Roll again", "office", "reroll", {
								piece: { kind: "die", value: 3 },
								steps: [
									{
										prompt: "Choose office benefit",
										key: "reroll",
										label: "Roll again",
										piece: { kind: "die", value: 3 },
									},
								],
							}),
							...GROUP_RULES.map((label, index) =>
								choice(label, "group", String(index), {
									piece: { kind: "card", rank: String(index + 1) },
									steps: [
										{
											prompt: "Choose office benefit",
											key: "rewrite",
											label: "Rewrite shared rule",
											piece: { kind: "token", icon: "book" },
										},
										{
											prompt: "Choose shared rule",
											key: String(index),
											label,
											piece: { kind: "card", rank: String(index + 1) },
										},
									],
								}),
							),
						]
					: [
							choice("Roll die", "roll", "", { piece: { kind: "die", value: 3 } }),
							...(s.jailed[seat] && s.tickets[seat]
								? [choice("Spend escape ticket", "escape", "", { piece: { kind: "token", icon: "key" } })]
								: []),
						]
		return view(
			s.phase === "rules"
				? "Write a personal rule"
				: s.phase === "office"
					? "Choose an office benefit"
					: "Race through the woods",
			`Mage ${s.turn + 1} acts. First to space 20 wins.`,
			s.positions,
			{
				scoreLabel: "Track position",
				displays: [
					{
						label: "Escape tickets",
						items: s.tickets.map((count, index) => ({
							label: `Mage ${index + 1}: ${count}${s.jailed[index] ? " · imprisoned" : ""}`,
							piece: { kind: "token", icon: s.jailed[index] ? "lock" : "key", text: String(count), tone: index },
						})),
					},
				],
				facts: [
					`Your rule: ${s.rules[seat] === null ? "not chosen" : PERSONAL_RULES[s.rules[seat]]}`,
					`Shared rule: ${s.group === null ? "none" : GROUP_RULES[s.group]}`,
					...s.positions.map(
						(position, index) =>
							`Mage ${index + 1}: space ${position}, ${s.tickets[index]} tickets${s.jailed[index] ? ", imprisoned" : ""}.`,
					),
				],
				board: {
					columns: 7,
					cells: Array.from({ length: 21 }, (_, cell) => ({
						piece: s.positions.some((position) => Math.min(position, 20) === cell)
							? {
									kind: "stack",
									owners: s.positions.flatMap((position, seat) => (Math.min(position, 20) === cell ? [seat] : [])),
								}
							: [4, 8, 12, 16].includes(cell)
								? { kind: "token", icon: "book" }
								: undefined,
						label: `${cell}${[4, 8, 12, 16].includes(cell) ? " Office" : ""}${s.positions.some((p) => p === cell) ? ` · ${s.positions.flatMap((p, index) => (p === cell ? [index + 1] : [])).join("/")}` : ""}`,
					})),
				},
				choices,
				log: s.log,
			},
		)
	},
	bot: choiceBot,
}

const CLUE_TYPES = ["sum", "product", "quotient", "zeros"] as const
type ClueType = (typeof CLUE_TYPES)[number]
interface NumberClue {
	partner: number
	type: ClueType
	result: string
}
interface SecretState {
	numbers: number[]
	clues: NumberClue[][]
	tickets: ClueType[][]
	guesses: ((number | null)[] | null)[]
	turn: number
	phase: "clues" | "guesses"
	scores: number[]
	result: Outcome | null
}
export function numberClue(a: number, b: number, type: ClueType): string {
	switch (type) {
		case "sum": {
			const sum = a + b
			return sum > 180 ? "180–199" : sum < 20 ? "3–20" : String(sum)
		}
		case "product":
			return String((a * b) % 10)
		case "quotient":
			return String(Math.floor(Math.max(a, b) / Math.min(a, b)))
		case "zeros":
			return String(Math.floor((Math.max(a, b) - 1) / 10) - Math.floor(Math.min(a, b) / 10))
		default: {
			const neverType: never = type
			throw new Error(`Unknown clue ${neverType}`)
		}
	}
}
export const secretNumber: GameDef<SecretState, TrialMove, TrialView> = {
	id: "secret-number",
	round: (s) =>
		s.phase === "guesses"
			? 5
			: Math.floor(s.clues.reduce((total, clues) => total + clues.length, 0) / s.numbers.length) + 1,
	name: "Secret Number",
	blurb: "Trade mathematical clues. Discover the number even you cannot see.",
	rules: [
		"Every mage has a different secret number from 1 to 100. Nobody sees their own number.",
		"Spend each of four tickets once to compare your number with another mage: sum, product’s last digit, integer quotient of larger/smaller, or multiples of ten strictly between them.",
		"Sums below 20 show 3–20; sums above 180 show 180–199. Your clue results are private.",
		"After all tickets are spent, guess numbers in mage order. Your own guess is required; use ? to skip another mage. Own guess scores +5/−5; other guesses score +1/−1. Lose 1 for each rival who guesses you. All correct adds 5.",
		"This edition uses four turns each instead of a 120-minute negotiation window. It omits mutual ticket consent, extra-ticket purchases and prison bets.",
	],
	players: { min: 2, max: 5 },
	setup: (rng, players) => ({
		numbers: shuffle(
			Array.from({ length: 100 }, (_, i) => i + 1),
			rng,
		).slice(0, players),
		clues: Array.from({ length: players }, () => []),
		tickets: Array.from({ length: players }, () => [...CLUE_TYPES]),
		guesses: Array(players).fill(null),
		turn: 0,
		phase: "clues",
		scores: Array(players).fill(0),
		result: null,
	}),
	toAct: (s) =>
		s.result ? [] : s.phase === "clues" ? [s.turn] : s.guesses.flatMap((guess, seat) => (guess === null ? [seat] : [])),
	parseMove: parseActions("clue", "guess"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, s.numbers.length, s.phase === "clues" ? s.turn : undefined)
		if (s.phase === "clues") {
			if (move.action !== "clue") return illegal("Spend your clue tickets before guessing.")
			const [partnerText, typeText, extra] = move.value.split(":")
			if (extra !== undefined || !CLUE_TYPES.some((type) => type === typeText))
				return illegal("Choose a partner and a valid clue ticket.")
			const partner = integer(partnerText, 0, s.numbers.length - 1),
				type = typeText as ClueType
			if (partner === seat) return illegal("Choose another mage for the comparison.")
			if (!s.tickets[seat].includes(type)) return illegal("That ticket has already been spent.")
			const tickets = s.tickets.map((items, index) => (index === seat ? items.filter((item) => item !== type) : items))
			return {
				...s,
				tickets,
				clues: s.clues.map((items, index) =>
					index === seat
						? [...items, { partner, type, result: numberClue(s.numbers[seat], s.numbers[partner], type) }]
						: items,
				),
				turn: (seat + 1) % s.numbers.length,
				phase: tickets.every((items) => items.length === 0) ? "guesses" : "clues",
			}
		}
		if (move.action !== "guess") return illegal("Submit your number guesses.")
		if (s.guesses[seat] !== null) return illegal("Your guesses are already sealed.")
		const parts = move.value.split(",")
		if (parts.length !== s.numbers.length) return illegal("Give one number or ? for every mage, in seat order.")
		const answer = parts.map((part, index) => (part.trim() === "?" && index !== seat ? null : integer(part, 1, 100)))
		const guesses = s.guesses.map((entry, index) => (index === seat ? answer : entry))
		if (guesses.some((entry) => entry === null)) return { ...s, guesses }
		const scores = guesses.map((entry, index) => {
			let score = entry!.reduce<number>(
				(sum, guess, target) =>
					sum + (guess === null ? 0 : (guess === s.numbers[target] ? 1 : -1) * (target === index ? 5 : 1)),
				0,
			)
			if (entry!.every((guess, target) => guess === s.numbers[target])) score += 5
			for (let other = 0; other < guesses.length; other++)
				if (other !== index && guesses[other]![index] === s.numbers[index]) score--
			return score
		})
		return { ...s, guesses, scores, result: { winners: topSeats(scores) } }
	},
	outcome: (s) => s.result,
	view: (s, seat) =>
		view(
			s.phase === "clues" ? "Ask for a clue" : "Seal your guesses",
			s.phase === "clues"
				? `Mage ${s.turn + 1} spends a clue ticket.`
				: "Name your number, then choose which rivals to guess.",
			s.scores,
			{
				facts: [
					`You are mage ${seat + 1}. Your own number is hidden.`,
					...s.tickets.map(
						(tickets, index) =>
							`Mage ${index + 1}: ${tickets.length} tickets left${s.guesses[index] ? ", guesses sealed" : ""}.`,
					),
				],
				choices:
					!s.result && s.phase === "clues" && seat === s.turn
						? s.tickets[seat].flatMap((type) =>
								s.numbers.flatMap((_, partner) =>
									partner === seat
										? []
										: [
												choice(`${type} with mage ${partner + 1}`, "clue", `${partner}:${type}`, {
													steps: [
														{
															prompt: "Choose clue ticket",
															key: type,
															label: type,
															piece: { kind: "card", rank: type },
														},
														{
															prompt: "Choose comparison partner",
															key: String(partner),
															label: `Mage ${partner + 1}`,
															piece: { kind: "token", icon: "pawn", tone: partner },
														},
													],
												}),
											],
								),
							)
						: [],
				scoreLabel: "Points",
				displays: [
					{
						label: s.result ? "Revealed numbers" : "Your sealed guesses",
						items: s.result
							? s.numbers.map((number, index) => ({
									label: `Mage ${index + 1}`,
									piece: { kind: "card", rank: String(number), tone: index },
								}))
							: (s.guesses[seat]?.map((number, index) => ({
									label: `Mage ${index + 1}`,
									piece: { kind: "card", rank: number === null ? "Skip" : String(number), tone: index },
								})) ?? []),
					},
				],
				forms:
					!s.result && s.phase === "guesses" && s.guesses[seat] === null
						? [
								{
									label: "Your number guesses",
									action: "guess",
									submit: "Seal guesses",
									format: s.numbers.map((_, index) => `{${index}}`).join(","),
									fields: s.numbers.map((_, index) => ({
										label: index === seat ? `Your number · Mage ${index + 1}` : `Mage ${index + 1}`,
										kind: "number",
										min: 1,
										max: 100,
										initial: index === seat ? undefined : "?",
										skip: index === seat ? undefined : { value: "?", label: "Skip this mage" },
									})),
								},
							]
						: undefined,
				log: [
					...s.clues[seat].map((clue) => `With mage ${clue.partner + 1}: ${clue.type} → ${clue.result}.`),
					...(s.result ? [`Numbers: ${s.numbers.join(", ")}.`] : []),
				],
			},
		),
	bot(v, seat, rng) {
		if (v.choices.length) return pick(v.choices, rng).move
		return {
			action: "guess",
			value: v.scores.map((_, index) => (index === seat ? String(1 + Math.floor(rng() * 100)) : "?")).join(","),
		}
	},
}

export const ZOO_ANIMALS = ["Snake", "Lion", "Parrot", "Monkey", "Elephant"] as const
const ZOO_ICONS: TrialIcon[] = ["snake", "lion", "parrot", "monkey", "elephant"]
function animalPiece(animal: number): TrialPiece {
	return { kind: "token", icon: ZOO_ICONS[animal], tone: animal }
}
interface ZooState {
	cells: (number | null)[]
	packs: number[][][]
	patterns: number[][]
	conditions: number[][]
	budgets: number[]
	bids: ({ box: number; amount: number } | null)[]
	placer: number | null
	box: number | null
	round: number
	scores: number[]
	log: string[]
	result: Outcome | null
}
export function zooScore(cells: (number | null)[], pattern: number[], condition: number[]): number {
	let score = 0
	for (let cell = 0; cell < 25; cell++)
		for (const [dx, dy] of [
			[1, 0],
			[0, 1],
			[1, 1],
			[-1, 1],
		]) {
			const x = cell % 5,
				y = Math.floor(cell / 5)
			if (x + 2 * dx < 0 || x + 2 * dx >= 5 || y + 2 * dy >= 5) continue
			const line = [0, 1, 2].map((n) => cells[(y + n * dy) * 5 + x + n * dx])
			if (pattern.every((animal, i) => animal === line[i]) || pattern.every((animal, i) => animal === line[2 - i]))
				score++
		}
	return cells.filter((animal) => animal === condition[0]).length >
		cells.filter((animal) => animal === condition[1]).length
		? score * 2
		: score
}
export const zoo: GameDef<ZooState, TrialMove, TrialView> = {
	id: "zoo",
	round: (s) => Math.min(s.round + 1, 6),
	name: "Zoo",
	blurb: "Bid for creatures and arrange the pattern only you know.",
	rules: [
		"Each mage has a secret three-animal pattern and a condition: one animal must outnumber another. Your first pattern animal is public.",
		"Bid coins on pack A or B. The pack with the lower total bid wins; its highest bidder arranges its four animals into the next empty board spaces.",
		"Both packs need a bidder to compete. Equal totals alternate A/B by round; tied top bidders use rotating seat priority. All bids are spent.",
		"Every matching run of three, forward or backward along a row, column or diagonal, scores 1. Your condition doubles that score.",
		"This edition keeps the 5 × 5 grid and 30-coin budget, starts with a center animal, and uses six auctions. It simplifies the show’s card-drawing and tie procedures.",
	],
	players: { min: 2, max: 5 },
	setup(rng, players) {
		const cells = Array<number | null>(25).fill(null)
		cells[12] = Math.floor(rng() * 5)
		return {
			cells,
			packs: Array.from({ length: 6 }, () =>
				Array.from({ length: 2 }, () => Array.from({ length: 4 }, () => Math.floor(rng() * 5))),
			),
			patterns: Array.from({ length: players }, () => Array.from({ length: 3 }, () => Math.floor(rng() * 5))),
			conditions: Array.from({ length: players }, () => shuffle([0, 1, 2, 3, 4], rng).slice(0, 2)),
			budgets: Array(players).fill(30),
			bids: Array(players).fill(null),
			placer: null,
			box: null,
			round: 0,
			scores: Array(players).fill(0),
			log: [],
			result: null,
		}
	},
	toAct: (s) =>
		s.result ? [] : s.placer !== null ? [s.placer] : s.bids.flatMap((bid, seat) => (bid === null ? [seat] : [])),
	parseMove: parseActions("bid", "arrange"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, s.scores.length, s.placer ?? undefined)
		if (s.placer !== null) {
			if (move.action !== "arrange") return illegal("Arrange the winning pack.")
			const order = selection(move.value, 4, 4).map((item) => integer(item, 0, 3))
			const cells = [...s.cells],
				pack = s.packs[s.round][s.box!]
			for (const index of order) cells[cells.indexOf(null)] = pack[index]
			const round = s.round + 1,
				scores = round === 6 ? s.patterns.map((pattern, i) => zooScore(cells, pattern, s.conditions[i])) : s.scores
			return {
				...s,
				cells,
				round,
				scores,
				bids: s.bids.map(() => null),
				placer: null,
				box: null,
				result: round === 6 ? { winners: topSeats(scores) } : null,
				log: [...s.log, `Mage ${seat + 1} placed ${order.map((index) => ZOO_ANIMALS[pack[index]]).join(" → ")}.`].slice(
					-200,
				),
			}
		}
		if (move.action !== "bid") return illegal("Bid on pack A or B.")
		if (s.bids[seat] !== null) return illegal("Your bid is already sealed.")
		if (!/^[AB]:\d+$/.test(move.value)) return illegal("Enter a pack and bid, such as A:3.")
		const [letter, amountText] = move.value.split(":"),
			box = letter === "A" ? 0 : 1,
			amount = integer(amountText, 0, s.budgets[seat])
		const bids = s.bids.map((bid, i) => (i === seat ? { box, amount } : bid))
		if (bids.some((bid) => bid === null)) return { ...s, bids }
		const totals = [0, 1].map((box) => bids.reduce((sum, bid) => sum + (bid!.box === box ? bid!.amount : 0), 0))
		const chosen = !bids.some((bid) => bid!.box === 0)
			? 1
			: !bids.some((bid) => bid!.box === 1)
				? 0
				: totals[0] === totals[1]
					? s.round % 2
					: totals[0] < totals[1]
						? 0
						: 1
		const candidates = bids.flatMap((bid, index) => (bid!.box === chosen ? [index] : []))
		candidates.sort(
			(a, b) =>
				bids[b]!.amount - bids[a]!.amount ||
				((a - s.round + bids.length * 6) % bids.length) - ((b - s.round + bids.length * 6) % bids.length),
		)
		return {
			...s,
			bids,
			box: chosen,
			placer: candidates[0],
			budgets: s.budgets.map((budget, index) => budget - bids[index]!.amount),
			log: [
				...s.log,
				`Round ${s.round + 1}: A ${totals[0]}, B ${totals[1]}. Mage ${candidates[0] + 1} arranges pack ${chosen === 0 ? "A" : "B"}.`,
			].slice(-200),
		}
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const bid = !s.result && s.placer === null && s.bids[seat] === null,
			arrange = !s.result && s.placer === seat
		return view(
			arrange ? "Arrange the pack" : "Bid for a pack",
			arrange ? "Choose the order for the winning pack." : "The lower-total pack wins. Its highest bidder places it.",
			s.scores,
			{
				round: roundOf("Auction", Math.min(s.round + 1, 6), 6),
				scoreLabel: "Pattern points",
				displays: [
					{
						label: "Your secret pattern",
						items: s.patterns[seat].map((animal) => ({ label: ZOO_ANIMALS[animal], piece: animalPiece(animal) })),
					},
					{
						label: "Double points when the first outnumbers the second",
						items: s.conditions[seat].map((animal) => ({ label: ZOO_ANIMALS[animal], piece: animalPiece(animal) })),
					},
					...(!s.result
						? s.packs[s.round].map((pack, index) => ({
								label: `Pack ${index === 0 ? "A" : "B"}`,
								items: pack.map((animal) => ({ label: ZOO_ANIMALS[animal], piece: animalPiece(animal) })),
							}))
						: []),
					{
						label: "Your coins",
						items: [
							{
								label: `${s.budgets[seat]} available`,
								piece: { kind: "token", icon: "coin", text: String(s.budgets[seat]) },
							},
						],
					},
				],
				facts: [
					`Your pattern: ${s.patterns[seat].map((animal) => ZOO_ANIMALS[animal]).join(" → ")}.`,
					`Double points if ${ZOO_ANIMALS[s.conditions[seat][0]]} outnumber ${ZOO_ANIMALS[s.conditions[seat][1]]}.`,
					`Coins: ${s.budgets.join(", ")}.`,
					...s.patterns.map(
						(pattern, i) => `Mage ${i + 1}: ${ZOO_ANIMALS[pattern[0]]} first${s.bids[i] ? ", bid sealed" : ""}.`,
					),
					...(!s.result
						? s.packs[s.round].map(
								(pack, i) => `Pack ${i === 0 ? "A" : "B"}: ${pack.map((animal) => ZOO_ANIMALS[animal]).join(", ")}.`,
							)
						: []),
				],
				board: {
					columns: 5,
					cells: s.cells.map((animal) => ({
						label: animal === null ? "·" : ZOO_ANIMALS[animal],
						tone: animal ?? undefined,
						piece: animal === null ? undefined : animalPiece(animal),
					})),
				},
				choices: bid
					? ["A", "B"].flatMap((box) =>
							[0, 1, 3, 5, 10]
								.filter((amount) => amount <= s.budgets[seat])
								.map((amount) => choice(`${box}: bid ${amount}`, "bid", `${box}:${amount}`)),
						)
					: arrange
						? [choice("Place in shown order", "arrange", JSON.stringify(["0", "1", "2", "3"]))]
						: [],
				forms: bid
					? [
							{
								label: "Choose a pack and bid",
								action: "bid",
								submit: "Seal bid",
								format: "{0}:{1}",
								fields: [
									{
										label: "Pack",
										kind: "select",
										initial: "A",
										options: ["A", "B"].map((box) => ({
											value: box,
											label: `Pack ${box}`,
											piece: { kind: "card", rank: box },
										})),
									},
									{ label: "Coins", kind: "number", min: 0, max: s.budgets[seat], initial: "0" },
								],
							},
						]
					: undefined,
				selection: arrange
					? {
							label: "Choose all four animals in placement order",
							action: "arrange",
							ordered: true,
							submit: "Place animals",
							min: 4,
							max: 4,
							options: s.packs[s.round][s.box!].map((animal, index) => ({
								value: String(index),
								label: `${index + 1}. ${ZOO_ANIMALS[animal]}`,
								piece: animalPiece(animal),
							})),
						}
					: undefined,
				log: s.log,
			},
		)
	},
	bot: choiceBot,
}

interface DiceRound {
	hands: number[][]
	winners: number[]
}
interface DiceState {
	dice: number[][]
	rerolls: number[]
	held: boolean[]
	seed: number
	scores: number[]
	history: DiceRound[]
	result: Outcome | null
}
function diceDeal(seed: number, players: number): { dice: number[][]; seed: number } {
	const rng = seededRng(seed)
	return {
		dice: Array.from({ length: players }, () => Array.from({ length: 5 }, () => 1 + Math.floor(rng() * 6))),
		seed: Math.floor(rng() * 4294967296),
	}
}
export function diceRank(dice: number[]): number {
	const groups = Array.from({ length: 6 }, (_, i) => ({
		face: i + 1,
		count: dice.filter((face) => face === i + 1).length,
	}))
		.filter((group) => group.count)
		.sort((a, b) => b.count - a.count || b.face - a.face)
	const straight = groups.length === 5 && Math.max(...dice) - Math.min(...dice) === 4
	const category =
		groups[0].count === 5
			? 8
			: groups[0].count === 4
				? 7
				: groups[0].count === 3 && groups[1].count === 2
					? 6
					: straight
						? 5
						: groups[0].count === 3
							? 4
							: groups[0].count === 2 && groups[1].count === 2
								? 3
								: groups[0].count === 2
									? 2
									: 1
	const faces = straight ? [Math.max(...dice)] : groups.map((group) => group.face)
	return Array.from({ length: 5 }, (_, index) => faces[index] ?? 0).reduce((rank, face) => rank * 7 + face, category)
}
export const dicePoker: GameDef<DiceState, TrialMove, TrialView> = {
	id: "dice-poker",
	round: (s) => Math.min(s.history.length + 1, 5),
	name: "Dice Poker",
	blurb: "Keep your lucky bones. Reroll the rest to form a stronger hand.",
	rules: [
		"House rules: Dice Poker was announced for the Season 1 final but never played, so the show’s exact rules are unavailable.",
		"Each mage rolls five six-sided dice and may reroll any chosen dice up to two times. Hold when ready; everyone reveals together.",
		"Hands rank: five of a kind, four of a kind, full house, straight, three of a kind, two pairs, pair, high dice. Higher grouped faces break ties; a 2–6 straight beats 1–5.",
		"The best hand earns 1 point; tied best hands each score. Most points after five rounds wins. This edition has no betting.",
	],
	players: { min: 2, max: 5 },
	setup: (rng, players) => ({
		...diceDeal(Math.floor(rng() * 4294967296), players),
		rerolls: Array(players).fill(2),
		held: Array(players).fill(false),
		scores: Array(players).fill(0),
		history: [],
		result: null,
	}),
	toAct: (s) => (s.result ? [] : s.held.flatMap((held, seat) => (held ? [] : [seat]))),
	parseMove: parseActions("reroll", "hold"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, s.scores.length)
		if (s.held[seat]) return illegal("Your hand is already held.")
		if (move.action === "reroll") {
			if (s.rerolls[seat] === 0) return illegal("Both rerolls have been used. Hold your hand.")
			const indices = selection(move.value, 1, 5).map((item) => integer(item, 0, 4)),
				rng = seededRng(s.seed)
			const hand = s.dice[seat].map((face, index) => (indices.includes(index) ? 1 + Math.floor(rng() * 6) : face))
			return {
				...s,
				dice: s.dice.map((dice, index) => (index === seat ? hand : dice)),
				rerolls: s.rerolls.map((count, index) => (index === seat ? count - 1 : count)),
				seed: Math.floor(rng() * 4294967296),
			}
		}
		if (move.action !== "hold") return illegal("Reroll dice or hold your hand.")
		blank(move.value)
		const held = s.held.map((value, index) => (index === seat ? true : value))
		if (held.some((value) => !value)) return { ...s, held }
		const ranks = s.dice.map(diceRank),
			best = Math.max(...ranks),
			winners = ranks.flatMap((rank, index) => (rank === best ? [index] : []))
		const scores = s.scores.map((score, index) => score + (winners.includes(index) ? 1 : 0)),
			history = [...s.history, { hands: s.dice, winners }]
		if (history.length === 5) return { ...s, held, scores, history, result: { winners: topSeats(scores) } }
		return {
			...s,
			...diceDeal(s.seed, scores.length),
			held: held.map(() => false),
			rerolls: held.map(() => 2),
			scores,
			history,
		}
	},
	outcome: (s) => s.result,
	view: (s, seat) =>
		view("Roll and keep", "Keep matching faces or chase a straight.", s.scores, {
			round: roundOf("Round", Math.min(s.history.length + 1, 5), 5),
			facts: [
				"Unplayed show final: this is a standard dice-poker house variant.",
				`Your rerolls: ${s.rerolls[seat]}.`,
				...s.held.map((held, index) => `Mage ${index + 1}: ${held ? "held" : "rolling"}.`),
			],
			scoreLabel: "Points",
			displays: s.history.flatMap((round, index) =>
				round.hands.map((hand, mage) => ({
					label: `Round ${index + 1} · Mage ${mage + 1}${round.winners.includes(mage) ? " · +1 point" : ""}`,
					items: hand.map((value) => ({ label: String(value), piece: { kind: "die", value } })),
				})),
			),
			board: {
				columns: 5,
				cells: s.dice[seat].map((face) => ({ label: String(face), piece: { kind: "die", value: face } })),
			},
			choices: !s.result && !s.held[seat] ? [choice("Hold hand", "hold")] : [],
			selection:
				!s.result && !s.held[seat] && s.rerolls[seat] > 0
					? {
							label: "Choose dice to reroll",
							action: "reroll",
							onBoard: true,
							submit: "Reroll selected dice",
							min: 1,
							max: 5,
							options: s.dice[seat].map((face, index) => ({
								value: String(index),
								label: `Die ${index + 1}: ${face}`,
								piece: { kind: "die", value: face },
							})),
						}
					: undefined,
			log: s.history.flatMap((round, index) => [
				`Round ${index + 1}: ${round.hands.map((hand, seat) => `mage ${seat + 1} [${hand.join(",")}]${round.winners.includes(seat) ? " +1" : ""}`).join("; ")}.`,
			]),
		}),
	bot(v) {
		if (!v.selection) return { action: "hold", value: "" }
		const dice = v.board!.cells.map((cell) => Number(cell.label))
		const counts = [1, 2, 3, 4, 5, 6].map((face) => dice.filter((value) => value === face).length)
		const keep = counts.lastIndexOf(Math.max(...counts)) + 1
		const reroll = dice.flatMap((face, index) => (face === keep ? [] : [String(index)]))
		return reroll.length ? { action: "reroll", value: JSON.stringify(reroll) } : { action: "hold", value: "" }
	},
}
