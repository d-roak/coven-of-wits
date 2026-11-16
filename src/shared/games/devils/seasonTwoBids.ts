import { type GameDef, pick } from "../../game"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial"
import { allowed, at, choice, randomAction, result, view, cardPiece, step, numberControl } from "./seasonTwoCommon"

interface RemoveState {
	hands: number[][]
	pairs: (number[] | null)[]
	bids: (number | null)[]
	scores: number[]
	round: number
	log: string[]
}
const removeChoices = (s: RemoveState, seat: number) => {
	const hand = s.hands[seat]
	if (s.round >= 6 || !hand) return []
	if (s.pairs.some((p) => p === null))
		return s.pairs[seat] === null
			? hand.flatMap((a, i) => hand.slice(i + 1).map((b) => choice(`Reveal ${a} and ${b}`, "pair", `${a},${b}`)))
			: []
	return s.bids[seat] === null ? s.pairs[seat]!.map((n) => choice(`Keep ${n}`, "keep", n)) : []
}
export const removeOne: GameDef<RemoveState, TrialMove, TrialView> = {
	id: "remove-one",
	name: "Remove One",
	blurb: "Show two cards. Keep one in secret. The lowest lone number wins.",
	players: { min: 3, max: 5 },
	rules: [
		"A six-round, 3–5 mage adaptation of the prison game. Everyone starts with cards 1–8.",
		"Choose two cards to reveal. Once all pairs are visible, secretly keep one. The lowest number chosen by exactly one mage wins a point.",
		"Only the kept card is spent. Tied numbers cancel; if none is unique, nobody scores. Most points wins; all tied is a draw.",
		"The show’s 18-round elimination ladder and deck resets are omitted.",
	],
	setup: (_rng, n) => ({
		hands: Array.from({ length: n }, () => [1, 2, 3, 4, 5, 6, 7, 8]),
		pairs: Array(n).fill(null),
		bids: Array(n).fill(null),
		scores: Array(n).fill(0),
		round: 0,
		log: [],
	}),
	toAct: (s) =>
		s.round >= 6 ? [] : (s.pairs.some((p) => p === null) ? s.pairs : s.bids).flatMap((p, i) => (p === null ? [i] : [])),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, removeChoices(s, seat))
		if (m.action === "pair")
			return { ...s, pairs: s.pairs.map((p, i) => (i === seat ? m.value.split(",").map(Number) : p)) }
		const bids = s.bids.map((b, i) => (i === seat ? Number(m.value) : b))
		if (bids.some((b) => b === null)) return { ...s, bids }
		const unique = bids.filter((b) => bids.filter((x) => x === b).length === 1) as number[]
		const winning = unique.length ? Math.min(...unique) : null
		const winner = winning === null ? -1 : bids.indexOf(winning)
		return {
			...s,
			hands: s.hands.map((h, i) => h.filter((n) => n !== bids[i])),
			pairs: s.pairs.map(() => null),
			bids: bids.map(() => null),
			scores: s.scores.map((n, i) => n + (i === winner ? 1 : 0)),
			round: s.round + 1,
			log: [
				...s.log,
				`Round ${s.round + 1}: ${bids.join(" / ")}. ${winner < 0 ? "No unique card." : `Mage ${winner + 1} wins.`}`,
			],
		}
	},
	outcome: (s) => (s.round >= 6 ? result(s.scores) : null),
	view(s, seat) {
		const v = view(
			s.pairs.some((p) => p === null) ? "Reveal two" : "Keep one",
			at("Round", Math.min(s.round + 1, 6), 6),
			s.scores,
			removeChoices(s, seat),
			[
				`Your cards: ${s.hands[seat].join(", ")}`,
				...s.pairs.map((pair, i) => `Mage ${i + 1}: ${pair?.join(" or ") ?? "choosing"}`),
			],
			s.log,
		)
		v.facts = []
		v.displays = [
			{ label: "Your hand", items: s.hands[seat].map((n) => ({ label: String(n), piece: cardPiece(n) })) },
			...s.pairs.map((pair, i) => ({
				label: `Mage ${i + 1} revealed`,
				items: pair
					? pair.map((n) => ({ label: String(n), piece: cardPiece(n) }))
					: [{ label: "Choosing", piece: { kind: "back" as const } }],
			})),
		]
		v.choices = v.choices.map((c) => {
			const ranks = c.move.value.split(",").map(Number)
			return {
				...c,
				piece: cardPiece(ranks[0]),
				...(c.move.action === "pair"
					? {
							steps: ranks.map((n, i) =>
								step(i ? "Choose the second card" : "Choose the first card", n, String(n), cardPiece(n)),
							),
						}
					: {}),
			}
		})
		return v
	},
	round: (s) => Math.min(s.round + 1, 6),
	bot: randomAction,
}

interface AuctionState {
	budgets: number[]
	bids: (number | null)[]
	scores: number[]
	round: number
	log: string[]
}
const auctionChoices = (s: AuctionState, seat: number) =>
	s.round >= 9 || s.bids[seat] !== null
		? []
		: Array.from({ length: s.budgets[seat] + 1 }, (_, n) => choice(`Spend ${n} seconds`, "bid", n))
export const timeAuction: GameDef<AuctionState, TrialMove, TrialView> = {
	id: "time-auction",
	name: "Time Auction",
	blurb: "Spend your seconds wisely. Only the longest secret bid scores.",
	players: { min: 2, max: 5 },
	rules: [
		"A turn-based adaptation: 60 seconds per mage across 9 auctions, entered as whole numbers rather than holding a timer.",
		"Every bid spends that many seconds. The sole highest bidder earns a point; a tie for highest scores nothing.",
		"Only the winner is announced. Opponents cannot see your bid or remaining time.",
		"Most points wins. Remaining seconds break score ties; identical final records share a win, or draw if everyone ties.",
	],
	setup: (_rng, n) => ({
		budgets: Array(n).fill(60),
		bids: Array(n).fill(null),
		scores: Array(n).fill(0),
		round: 0,
		log: [],
	}),
	toAct: (s) => (s.round >= 9 ? [] : s.bids.flatMap((b, i) => (b === null ? [i] : []))),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, auctionChoices(s, seat))
		const bids = s.bids.map((b, i) => (i === seat ? Number(m.value) : b))
		if (bids.some((b) => b === null)) return { ...s, bids }
		const numbers = bids as number[]
		const high = Math.max(...numbers)
		const winner = high > 0 && numbers.filter((b) => b === high).length === 1 ? numbers.indexOf(high) : -1
		return {
			...s,
			budgets: s.budgets.map((b, i) => b - numbers[i]),
			bids: bids.map(() => null),
			scores: s.scores.map((n, i) => n + (i === winner ? 1 : 0)),
			round: s.round + 1,
			log: [...s.log, `Auction ${s.round + 1}: ${winner < 0 ? "no winner" : `Mage ${winner + 1} wins`}.`],
		}
	},
	outcome: (s) => (s.round >= 9 ? result(s.scores.map((n, i) => n * 61 + s.budgets[i])) : null),
	view(s, seat) {
		const v = view(
			"Secret auction",
			at("Auction", Math.min(s.round + 1, 9), 9),
			s.scores,
			auctionChoices(s, seat),
			[
				`Your time: ${s.budgets[seat]} seconds`,
				...s.bids.map((b, i) => `Mage ${i + 1}: ${b === null ? "thinking" : "sealed"}`),
			],
			s.log,
		)
		numberControl(v, "bid", "Seconds to spend")
		v.displays = [
			{
				label: "Your time reserve",
				items: [
					{
						label: `${s.budgets[seat]} seconds`,
						piece: { kind: "token", icon: "moon", text: String(s.budgets[seat]) },
					},
				],
			},
		]
		v.facts = v.facts.slice(1)
		return v
	},
	round: (s) => Math.min(s.round + 1, 9),
	bot(v, _seat, rng) {
		const legal = v.choices.filter((c) => Number(c.move.value) <= 12)
		return pick(legal, rng).move
	},
}

interface BigState {
	hands: number[][]
	dealer: number[]
	chips: number[]
	round: number
	card: number | null
	log: string[]
}
const bigChoices = (s: BigState, seat: number) => {
	if (s.round >= 18 || s.chips.some((n) => n <= 0)) return []
	const contest = s.round % 2
	if (s.card === null) return seat === contest ? s.hands[seat].map((n) => choice(`Conceal ${n}`, "card", n)) : []
	return seat !== contest
		? ["big", "small"].flatMap((side) =>
				Array.from({ length: Math.min(5, Math.floor(s.chips[seat])) + 1 }, (_, n) =>
					choice(`Bet ${n} on ${side}`, "bet", `${side}:${n}`),
				),
			)
		: []
}
export const bigOrSmall: GameDef<BigState, TrialMove, TrialView> = {
	id: "big-or-small",
	name: "Big or Small",
	blurb: "Hide a number. Read your rival. Bet above or below the dealer.",
	players: { min: 2, max: 2 },
	rules: [
		"Alternate contestant and bettor for 18 rounds. Each mage has cards 0–10 and starts with 10 chips.",
		"The contestant hides an unused card against the visible dealer card. The bettor wagers 0–5 chips on higher or lower.",
		"The contestant gains the positive card difference, or loses the negative difference. A correct bet gains its stake; a wrong bet loses it; equal cards return the stake.",
		"At 0 chips a mage loses immediately. Otherwise most chips after 18 rounds wins. This edition caps bets at 5 and omits show timing.",
	],
	setup: (rng) => ({
		hands: [
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		],
		dealer: Array.from({ length: 18 }, () => 1 + Math.floor(rng() * 9)),
		chips: [10, 10],
		round: 0,
		card: null,
		log: [],
	}),
	toAct: (s) =>
		s.round >= 18 || s.chips.some((n) => n <= 0) ? [] : [s.card === null ? s.round % 2 : 1 - (s.round % 2)],
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, bigChoices(s, seat))
		if (m.action === "card") return { ...s, card: Number(m.value) }
		const [side, raw] = m.value.split(":")
		const stake = Number(raw),
			contest = 1 - seat,
			diff = s.card! - s.dealer[s.round]
		const chips = s.chips.map((n, i) =>
			Math.max(0, n + (i === contest ? diff : diff === 0 ? 0 : diff > 0 === (side === "big") ? stake : -stake)),
		)
		return {
			...s,
			hands: s.hands.map((h, i) => (i === contest ? h.filter((n) => n !== s.card) : h)),
			chips,
			round: s.round + 1,
			card: null,
			log: [...s.log, `Dealer ${s.dealer[s.round]}, hidden ${s.card}; ${side} wager ${stake}.`],
		}
	},
	outcome: (s) => (s.round >= 18 || s.chips.some((n) => n <= 0) ? result(s.chips) : null),
	view(s, seat) {
		const v = view(
			s.card === null ? "Conceal a card" : "Place a wager",
			at("Round", Math.min(s.round + 1, 18), 18),
			s.chips,
			bigChoices(s, seat),
			[
				`Dealer: ${s.dealer[Math.min(s.round, 17)]}`,
				`Your cards: ${s.hands[seat].join(", ")}`,
				`Contestant: Mage ${(s.round % 2) + 1}`,
				s.card === null ? "No card sealed" : seat === s.round % 2 ? `You sealed ${s.card}` : "Rival card sealed",
			],
			s.log,
		)
		v.facts = [`Contestant: Mage ${(s.round % 2) + 1}`]
		v.displays = [
			{ label: "Dealer", items: [{ label: "Dealer card", piece: cardPiece(s.dealer[Math.min(s.round, 17)]) }] },
			{ label: "Your hand", items: s.hands[seat].map((n) => ({ label: String(n), piece: cardPiece(n) })) },
			{
				label: "Concealed card",
				items:
					s.card === null
						? []
						: [
								{
									label: seat === s.round % 2 ? "Your sealed card" : "Rival sealed card",
									piece: seat === s.round % 2 ? cardPiece(s.card) : { kind: "back" },
								},
							],
			},
		]
		v.choices = v.choices.map((c) => {
			if (c.move.action === "card") return { ...c, piece: cardPiece(c.move.value) }
			const [side, stake] = c.move.value.split(":")
			return {
				...c,
				steps: [
					step("Predict the hidden card", side, side === "big" ? "Higher" : "Lower"),
					step("Choose your wager", stake, `${stake} chips`, { kind: "token", icon: "coin", text: stake }),
				],
			}
		})
		v.scoreLabel = "Chips"
		return v
	},
	round: (s) => Math.min(s.round + 1, 18),
	bot: randomAction,
}

interface DoubtState {
	seed: number
	hands: number[][]
	slots: number[]
	chips: number[]
	turn: number
	claim: { count: number; color: number; by: number } | null
	round: number
	log: string[]
}
const COLORS = ["red", "gold", "green", "blue", "violet", "wild"]
function doubtChoices(s: DoubtState, seat: number) {
	if (seat !== s.turn || s.round >= 12 || s.chips.filter((c) => c > 0).length < 2) return []
	const total = s.slots.reduce((n, v, i) => n + (s.chips[i] > 0 ? v : 0), 0)
	const choices = s.claim ? [choice("Doubt the claim", "doubt", "")] : []
	for (let n = (s.claim?.count ?? 0) + 1; n <= total; n++)
		for (let color = 0; color < 5; color++)
			choices.push(choice(`Claim ${n} ${COLORS[color]}`, "claim", `${n}:${color}`))
	return choices
}
const redeal = (s: DoubtState) => {
	let seed = s.seed
	const hands = s.slots.map((n, i) =>
		Array.from({ length: s.chips[i] > 0 ? n : 0 }, () => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
			return seed % 6
		}),
	)
	return { ...s, seed, hands }
}
export const doubtAndBet: GameDef<DoubtState, TrialMove, TrialView> = {
	id: "doubt-and-bet",
	name: "Doubt and Bet",
	blurb: "Raise a colour claim, or risk a chip to expose a bluff.",
	players: { min: 2, max: 5 },
	rules: [
		"A compact 12-showdown adaptation. Each mage starts with 8 chips and 5 hidden colour cards; wild cards match any colour.",
		"Raise the claimed number of one colour across the table, or doubt the previous claim. Claims must increase in quantity.",
		"A showdown reveals all cards. A true claim pays its maker; a false claim pays the doubter. The loser transfers 1 chip and loses a card slot, down to a minimum of 1.",
		"Hands refresh after each showdown. A mage at 0 chips leaves the game. Last mage standing or most chips after 12 showdowns wins.",
		"This edition fixes wagers at 1 chip and omits raising, folding and slot repurchases.",
	],
	setup: (rng, n) =>
		redeal({
			seed: Math.floor(rng() * 0xffffffff),
			hands: [],
			slots: Array(n).fill(5),
			chips: Array(n).fill(8),
			turn: 0,
			claim: null,
			round: 0,
			log: [],
		}),
	toAct: (s) => (s.round >= 12 || s.chips.filter((n) => n > 0).length < 2 ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, doubtChoices(s, seat))
		if (m.action === "claim") {
			const [count, color] = m.value.split(":").map(Number)
			let turn = (seat + 1) % s.chips.length
			while (s.chips[turn] <= 0) turn = (turn + 1) % s.chips.length
			return {
				...s,
				claim: { count, color, by: seat },
				turn,
				log: [...s.log, `Mage ${seat + 1} claimed ${count} ${COLORS[color]}.`],
			}
		}
		const claim = s.claim!,
			actual = s.hands.flat().filter((c) => c === claim.color || c === 5).length,
			winner = actual >= claim.count ? claim.by : seat,
			loser = winner === seat ? claim.by : seat
		const chips = s.chips.map((n, i) => n + (i === winner ? 1 : i === loser ? -1 : 0))
		const slots = s.slots.map((n, i) => (i === loser ? Math.max(1, n - 1) : n))
		let turn = loser
		while (chips[turn] <= 0) turn = (turn + 1) % chips.length
		return redeal({
			...s,
			chips,
			slots,
			turn,
			claim: null,
			round: s.round + 1,
			log: [
				...s.log,
				`${claim.count} ${COLORS[claim.color]} claimed; ${actual} found. Mage ${winner + 1} takes 1 chip.`,
			],
		})
	},
	outcome: (s) => (s.round >= 12 || s.chips.filter((n) => n > 0).length < 2 ? result(s.chips) : null),
	view(s, seat) {
		const v = view(
			"Claim or doubt",
			at("Showdown", Math.min(s.round + 1, 12), 12),
			s.chips,
			doubtChoices(s, seat),
			[
				`Your cards: ${s.hands[seat].map((n) => COLORS[n]).join(", ")}`,
				`Card slots: ${s.slots.join(" / ")}`,
				s.claim ? `Mage ${s.claim.by + 1} claims ${s.claim.count} ${COLORS[s.claim.color]}` : "Make the opening claim",
			],
			s.log,
		)
		v.facts = v.facts.slice(1)
		v.displays = [
			{
				label: "Your hidden hand",
				items: s.hands[seat].map((color) => ({
					label: COLORS[color],
					piece: { kind: "card", rank: COLORS[color], tone: color },
				})),
			},
		]
		v.choices = v.choices.map((c) => {
			if (c.move.action === "doubt")
				return { ...c, steps: [step("Claim or challenge", "doubt", "Doubt the claim", { kind: "token", icon: "eye" })] }
			const [count, color] = c.move.value.split(":").map(Number)
			return {
				...c,
				steps: [
					step("Claim or challenge", "claim", "Raise the claim"),
					step("Choose a colour", color, COLORS[color], { kind: "card", rank: COLORS[color], tone: color }),
					step("Choose the quantity", count, String(count)),
				],
			}
		})
		v.scoreLabel = "Chips"
		return v
	},
	round: (s) => Math.min(s.round + 1, 12),
	bot(v, _seat, rng) {
		const doubt = v.choices.find((c) => c.move.action === "doubt")
		return doubt && rng() < 0.65
			? doubt.move
			: pick(
					v.choices.filter((c) => c.move.action === "claim").slice(0, 10).length
						? v.choices.filter((c) => c.move.action === "claim").slice(0, 10)
						: v.choices,
					rng,
				).move
	},
}
