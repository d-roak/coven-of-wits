import { type GameDef, illegal, pick, shuffle } from "../../game"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial"
import { allowed, at, choice, view, cardPiece, step, numberControl } from "./seasonTwoCommon"

interface Card {
	rank: number
	suit: number
}
interface Query {
	by: number
	kind: string
	value: string
	answer: string
}
interface TruthState {
	cards: Card[][]
	tokens: number[]
	bids: (number | null)[]
	asker: number | null
	queries: Query[]
	round: number
	winner: number | null
	log: string[]
}
const SUITS = ["moons", "leaves", "flames", "stars"]
const sumTriples = Array.from({ length: 8 }, (_, a) =>
	Array.from({ length: 8 - a - 1 }, (_, j) => a + j + 1).flatMap((b) =>
		Array.from({ length: 8 - b - 1 }, (_, j) => [a, b, b + j + 1]),
	),
).flat()
const questions = [
	...sumTriples.map((t) => choice(`Sum at ${t.map((n) => n + 1).join(", ")}`, "sum", t.join(","))),
	...SUITS.flatMap((s, i) => [choice(`Sum of ${s}`, "suit-sum", i), choice(`Positions of ${s}`, "suit-positions", i)]),
	choice("Sum of face cards", "face-sum", ""),
	choice("Sum of number cards", "number-sum", ""),
	choice("Count face cards", "face-count", ""),
	choice("Count number cards", "number-count", ""),
	...Array.from({ length: 13 }, (_, i) => choice(`Count rank ${i + 1}`, "rank-count", i + 1)),
	choice("Positions of equal ranks", "equal", ""),
	choice("Positions of consecutive ranks", "consecutive", ""),
	choice("Positions of lowest rank", "extreme", "low"),
	choice("Positions of highest rank", "extreme", "high"),
]
function answer(cards: Card[], m: TrialMove): string {
	const sum = (list: Card[]) => String(list.reduce((n, c) => n + c.rank, 0))
	const positions = (predicate: (c: Card) => boolean) =>
		cards.flatMap((c, i) => (predicate(c) ? [i + 1] : [])).join(", ") || "none"
	switch (m.action) {
		case "sum":
			return sum(m.value.split(",").map((n) => cards[Number(n)]))
		case "suit-sum":
			return sum(cards.filter((c) => c.suit === Number(m.value)))
		case "suit-positions":
			return positions((c) => c.suit === Number(m.value))
		case "face-sum":
			return sum(cards.filter((c) => c.rank === 1 || c.rank >= 11))
		case "number-sum":
			return sum(cards.filter((c) => c.rank > 1 && c.rank < 11))
		case "face-count":
			return String(cards.filter((c) => c.rank === 1 || c.rank >= 11).length)
		case "number-count":
			return String(cards.filter((c) => c.rank > 1 && c.rank < 11).length)
		case "rank-count":
			return String(cards.filter((c) => c.rank === Number(m.value)).length)
		case "equal":
			return positions((c) => cards.filter((other) => other.rank === c.rank).length > 1)
		case "consecutive":
			return positions((c) => cards.some((other) => Math.abs(other.rank - c.rank) === 1))
		case "extreme": {
			const wanted = m.value === "low" ? Math.min(...cards.map((c) => c.rank)) : Math.max(...cards.map((c) => c.rank))
			return positions((c) => c.rank === wanted)
		}
		default:
			return illegal("Choose one of the listed questions.")
	}
}
const truthChoices = (s: TruthState, seat: number) =>
	s.winner !== null || s.round >= 60
		? []
		: s.asker === null
			? s.bids[seat] === null
				? Array.from({ length: s.tokens[seat] + 1 }, (_, n) => choice(`Bid ${n} tokens`, "bid", n))
				: []
			: s.asker === seat
				? questions
				: []
const cardsFor = (rng: () => number) => {
	const cards = shuffle(
		Array.from({ length: 52 }, (_, i) => ({ rank: (i % 13) + 1, suit: Math.floor(i / 13) })),
		rng,
	).slice(0, 8)
	for (let suit = 0; suit < 4; suit++) {
		const ranks = cards
			.filter((c) => c.suit === suit)
			.map((c) => c.rank)
			.sort((a, b) => a - b)
		let index = 0
		for (const card of cards) if (card.suit === suit) card.rank = ranks[index++]
	}
	return cards
}
export const questionAndTruth: GameDef<TruthState, TrialMove, TrialView> = {
	id: "question-and-truth",
	name: "Question and Truth",
	blurb: "Buy a question. Gather truthful clues. Name eight hidden ranks.",
	players: { min: 2, max: 2 },
	rules: [
		"A two-player deduction adaptation. Each mage receives 8 hidden cards from a 52-card deck, arranged with each suit’s ranks ascending. Ace = 1, Jack = 11, Queen = 12, King = 13.",
		"Secretly bid tokens for a question or a full guess. Higher bid acts; both bids are spent. Ties return bids, give both mages 2 tokens and repeat. Both gain 2 tokens after a question or failed guess.",
		"Questions reveal truthful sums, counts or positions. Face-card questions include Ace, Jack, Queen and King. Consecutive-rank questions include every rank with a neighbour one away.",
		"To declare truth, choose all 8 ranks in order. Suits do not need guessing. The first correct full sequence wins.",
		"This edition deals the secrets, answers automatically, and draws after 60 auctions. It omits setup card selection and the show’s clock.",
	],
	setup: (rng) => ({
		cards: [cardsFor(rng), cardsFor(rng)],
		tokens: [10, 10],
		bids: [null, null],
		asker: null,
		queries: [],
		round: 0,
		winner: null,
		log: [],
	}),
	toAct: (s) =>
		s.winner !== null || s.round >= 60
			? []
			: s.asker === null
				? s.bids.flatMap((b, i) => (b === null ? [i] : []))
				: [s.asker],
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		if (m.action === "truth") {
			if (s.winner !== null || s.round >= 60 || s.asker !== seat) illegal("Win the auction before declaring truth.")
			if (!/^\s*\d+(\s*,\s*\d+){7}\s*$/.test(m.value))
				illegal("Enter exactly 8 ranks from 1 to 13, separated by commas.")
			const ranks = m.value.split(",").map(Number)
			if (ranks.some((n) => n < 1 || n > 13)) illegal("Every rank must be from 1 to 13.")
			const correct = ranks.every((n, i) => n === s.cards[1 - seat][i].rank)
			return {
				...s,
				winner: correct ? seat : null,
				asker: null,
				bids: [null, null],
				tokens: s.tokens.map((n) => n + 2),
				round: s.round + 1,
				log: [...s.log, `Mage ${seat + 1} ${correct ? "named every rank" : "made an incorrect truth attempt"}.`],
			}
		}
		allowed(m, truthChoices(s, seat))
		if (m.action === "bid") {
			const bids = s.bids.map((n, i) => (i === seat ? Number(m.value) : n))
			if (bids.some((n) => n === null)) return { ...s, bids }
			if (bids[0] === bids[1])
				return {
					...s,
					bids: [null, null],
					tokens: s.tokens.map((n) => n + 2),
					round: s.round + 1,
					log: [...s.log, "Tied auction. Both mages received 2 tokens."],
				}
			return { ...s, bids, asker: bids[0]! > bids[1]! ? 0 : 1, tokens: s.tokens.map((n, i) => n - bids[i]!) }
		}
		const response = answer(s.cards[1 - seat], m),
			query = { by: seat, kind: m.action, value: m.value, answer: response }
		return {
			...s,
			queries: [...s.queries, query],
			asker: null,
			bids: [null, null],
			tokens: s.tokens.map((n) => n + 2),
			round: s.round + 1,
			log: [
				...s.log,
				`Mage ${seat + 1}: ${questions.find((q) => q.move.action === m.action && q.move.value === m.value)!.label} = ${response}`,
			],
		}
	},
	outcome: (s) => (s.winner !== null ? { winners: [s.winner] } : s.round >= 60 ? { winners: [] } : null),
	view(s, seat) {
		const v = view(
			s.asker === null ? "Bid for a question" : "Question or truth",
			at("Auction", Math.min(s.round + 1, 60), 60),
			s.cards.map((_, i) => s.queries.filter((q) => q.by === i).length),
			truthChoices(s, seat),
			[
				`Your tokens: ${s.tokens[seat]}`,
				`Rival reserve: ${s.tokens[1 - seat] <= 5 ? "5 or fewer" : "more than 5"}`,
				`Your cards: ${s.cards[seat].map((c) => `${c.rank} ${SUITS[c.suit]}`).join(" / ")}`,
				...s.queries.filter((q) => q.by === seat).map((q) => `Clue: ${q.kind} ${q.value} = ${q.answer}`),
			],
			s.log,
		)
		v.facts = v.facts.filter((f) => !f.startsWith("Your cards:"))
		v.displays = [
			{
				label: "Your private cards",
				items: s.cards[seat].map((c, i) => ({
					label: `Position ${i + 1}: ${c.rank} ${SUITS[c.suit]}`,
					piece: cardPiece(
						c.rank === 1 ? "A" : c.rank === 11 ? "J" : c.rank === 12 ? "Q" : c.rank === 13 ? "K" : c.rank,
						c.suit,
					),
				})),
			},
			{
				label: "Rival positions",
				items: Array.from({ length: 8 }, (_, i) => ({ label: `Position ${i + 1}`, piece: { kind: "back" } })),
			},
		]
		v.scoreLabel = "Questions asked"
		numberControl(v, "bid", "Tokens to bid")
		v.choices = v.choices.map((c) => {
			if (c.move.action === "bid") return c
			const { action, value } = c.move
			const category =
				action === "sum"
					? "Sum of three positions"
					: action === "suit-sum"
						? "Sum of a suit"
						: action === "suit-positions"
							? "Positions of a suit"
							: action === "rank-count"
								? "Count a rank"
								: action === "extreme"
									? "Extreme ranks"
									: c.label
			const parameters =
				action === "sum"
					? value.split(",").map((at, i) =>
							step(`Choose position ${i + 1} of 3`, at, `Position ${Number(at) + 1}`, {
								kind: "tile",
								text: String(Number(at) + 1),
							}),
						)
					: value
						? [
								step(
									"Choose the question parameter",
									value,
									action.startsWith("suit-")
										? SUITS[Number(value)]
										: value === "low"
											? "Lowest"
											: value === "high"
												? "Highest"
												: value,
									action === "rank-count" ? cardPiece(value) : undefined,
								),
							]
						: []
			return { ...c, steps: [step("Choose a question", action, category), ...parameters] }
		})
		if (s.asker === seat && s.winner === null && s.round < 60)
			v.forms = [
				{
					label: "Declare all 8 ranks",
					action: "truth",
					submit: "Declare truth",
					fields: Array.from({ length: 8 }, (_, i) => ({
						label: `Position ${i + 1}`,
						kind: "number",
						min: 1,
						max: 13,
					})),
					format: Array.from({ length: 8 }, (_, i) => `{${i}}`).join(","),
				},
			]
		return v
	},
	round: (s) => Math.min(s.round + 1, 60),
	bot(v, _seat, rng) {
		if (v.phase === "Bid for a question")
			return pick(
				v.choices.filter((c) => Number(c.move.value) >= 1 && Number(c.move.value) <= 4).length
					? v.choices.filter((c) => Number(c.move.value) >= 1 && Number(c.move.value) <= 4)
					: v.choices,
				rng,
			).move
		const clues = v.facts
			.filter((f) => f.startsWith("Clue: sum "))
			.map((f) => {
				const match = f.match(/^Clue: sum ([\d,]+) = (\d+)$/)!
				const at = match[1].split(",").map(Number)
				return [...Array.from({ length: 8 }, (_, i) => (at.includes(i) ? 1 : 0)), Number(match[2])]
			})
		const matrix = clues.map((row) => [...row])
		let rank = 0
		const pivots: number[] = []
		for (let col = 0; col < 8; col++) {
			const row = matrix.findIndex((r, i) => i >= rank && Math.abs(r[col]) > 1e-8)
			if (row < 0) continue
			;[matrix[rank], matrix[row]] = [matrix[row], matrix[rank]]
			const divisor = matrix[rank][col]
			matrix[rank] = matrix[rank].map((n) => n / divisor)
			for (let i = 0; i < matrix.length; i++)
				if (i !== rank) {
					const factor = matrix[i][col]
					matrix[i] = matrix[i].map((n, j) => n - factor * matrix[rank][j])
				}
			pivots.push(col)
			rank++
		}
		if (rank === 8) {
			const solved = Array<number>(8).fill(0)
			pivots.forEach((col, i) => (solved[col] = Math.round(matrix[i][8])))
			return { action: "truth", value: solved.join(",") }
		}
		const unused = v.choices.filter(
			(c) => c.move.action === "sum" && !v.facts.some((f) => f.startsWith(`Clue: sum ${c.move.value} =`)),
		)
		return pick(unused.length ? unused : v.choices, rng).move
	},
}
