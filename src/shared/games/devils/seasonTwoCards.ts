import { type GameDef, pick, shuffle } from "../../game"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial"
import { allowed, at, choice, randomAction, result, selected, view, cardPiece, numberControl } from "./seasonTwoCommon"

const HANDS = [
	"high card",
	"pair",
	"two pairs",
	"three of a kind",
	"straight",
	"flush",
	"full house",
	"four of a kind",
	"straight flush",
]
const cardLabel = (card: number) =>
	`${["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][card % 13]} ${["moons", "leaves", "flames", "stars"][Math.floor(card / 13)]}`
const compare = (a: number[], b: number[]) => {
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const diff = (a[i] ?? 0) - (b[i] ?? 0)
		if (diff) return diff
	}
	return 0
}
function five(cards: number[]): number[] {
	const ranks = cards.map((c) => (c % 13) + 2).sort((a, b) => b - a),
		groups = [...new Set(ranks)]
			.map((rank) => ({ rank, count: ranks.filter((r) => r === rank).length }))
			.sort((a, b) => b.count - a.count || b.rank - a.rank)
	const flush = cards.every((c) => Math.floor(c / 13) === Math.floor(cards[0] / 13))
	const distinct = [...new Set(ranks)],
		straight =
			distinct.length === 5 && (distinct[0] - distinct[4] === 4 || distinct.join(",") === "14,5,4,3,2")
				? distinct[0] === 14 && distinct[1] === 5
					? 5
					: distinct[0]
				: 0
	if (flush && straight) return [8, straight]
	if (groups[0].count === 4) return [7, ...groups.map((g) => g.rank)]
	if (groups[0].count === 3 && groups[1].count === 2) return [6, ...groups.map((g) => g.rank)]
	if (flush) return [5, ...ranks]
	if (straight) return [4, straight]
	if (groups[0].count === 3) return [3, ...groups.map((g) => g.rank)]
	if (groups[0].count === 2 && groups[1].count === 2) return [2, ...groups.map((g) => g.rank)]
	if (groups[0].count === 2) return [1, ...groups.map((g) => g.rank)]
	return [0, ...ranks]
}
export const pokerRank = (cards: number[]) =>
	cards.length === 5
		? five(cards)
		: cards.map((_, omit) => five(cards.filter((_, i) => i !== omit))).sort((a, b) => compare(b, a))[0]
interface PokerDeal {
	community: number[]
	hands: number[][]
}
interface SniperState {
	deals: PokerDeal[]
	stakes: (number | null)[]
	snipes: (number | null)[]
	chips: number[]
	round: number
	log: string[]
}
const pokerChoices = (s: SniperState, seat: number) => {
	if (s.round >= 5 || !s.chips[seat]) return []
	if (s.stakes.some((n) => n === null))
		return s.stakes[seat] === null
			? Array.from({ length: Math.min(5, Math.floor(s.chips[seat])) }, (_, i) =>
					choice(`Stake ${i + 1} chips`, "stake", i + 1),
				)
			: []
	return s.snipes[seat] === null ? HANDS.map((hand, i) => choice(`Snipe ${hand}`, "snipe", i)) : []
}
export const sniperHoldem: GameDef<SniperState, TrialMove, TrialView> = {
	id: "sniper-holdem",
	name: "Sniper Hold’em",
	blurb: "Read your cards, then ban the hand that could beat you.",
	players: { min: 2, max: 5 },
	rules: [
		"A five-hand adaptation with 60 chips per mage. Each hand deals 2 private cards and 4 community cards; use the best 5 of those 6.",
		"Secretly stake 1–5 chips, then secretly name a hand category to snipe. A category named by any rival disqualifies your hand.",
		"The highest surviving poker hand wins the pooled stakes. Equal winning hands share the pot; if all are sniped, stakes return.",
		"Most chips after 5 hands wins. This edition replaces the show’s 75-chip escape ladder, sequential betting and fold options with sealed stakes.",
	],
	setup: (rng, n) => ({
		deals: Array.from({ length: 5 }, () => {
			const deck = shuffle(
				Array.from({ length: 52 }, (_, i) => i),
				rng,
			)
			return {
				community: deck.slice(0, 4),
				hands: Array.from({ length: n }, (_, i) => deck.slice(4 + i * 2, 6 + i * 2)),
			}
		}),
		stakes: Array(n).fill(null),
		snipes: Array(n).fill(null),
		chips: Array(n).fill(60),
		round: 0,
		log: [],
	}),
	toAct: (s) =>
		s.round >= 5
			? []
			: (s.stakes.some((n) => n === null) ? s.stakes : s.snipes).flatMap((n, i) => (n === null ? [i] : [])),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, pokerChoices(s, seat))
		if (m.action === "stake") return { ...s, stakes: s.stakes.map((n, i) => (i === seat ? Number(m.value) : n)) }
		const snipes = s.snipes.map((n, i) => (i === seat ? Number(m.value) : n))
		if (snipes.some((n) => n === null)) return { ...s, snipes }
		const deal = s.deals[s.round],
			ranks = deal.hands.map((hand) => pokerRank([...deal.community, ...hand]))
		const survivors = ranks.flatMap((rank, i) => (snipes.some((snipe, j) => j !== i && snipe === rank[0]) ? [] : [i]))
		const best = survivors.map((i) => ranks[i]).sort((a, b) => compare(b, a))[0]
		const winners = survivors.filter((i) => compare(ranks[i], best) === 0)
		const pot = (s.stakes as number[]).reduce((a, b) => a + b, 0)
		return {
			...s,
			chips: s.chips.map((n, i) =>
				// Keep split pots exact in sixtieths; every supported winner count divides 60.
				winners.length
					? (Math.round(n * 60) - s.stakes[i]! * 60 + (winners.includes(i) ? (pot * 60) / winners.length : 0)) / 60
					: n,
			),
			stakes: s.stakes.map(() => null),
			snipes: s.snipes.map(() => null),
			round: s.round + 1,
			log: [
				...s.log,
				`Hand ${s.round + 1}: ${ranks.map((r, i) => `Mage ${i + 1} ${HANDS[r[0]]}${survivors.includes(i) ? "" : " (sniped)"}`).join("; ")}. ${winners.length ? `Pot to ${winners.map((i) => i + 1).join(", ")}.` : "All stakes returned."}`,
			],
		}
	},
	outcome: (s) => (s.round >= 5 ? result(s.chips) : null),
	view(s, seat) {
		const d = s.deals[Math.min(s.round, 4)],
			rank = pokerRank([...d.community, ...d.hands[seat]])
		const v = view(
			s.stakes.some((n) => n === null) ? "Seal a stake" : "Snipe a category",
			at("Hand", Math.min(s.round + 1, 5), 5),
			s.chips,
			pokerChoices(s, seat),
			[
				`Community: ${d.community.map(cardLabel).join(" / ")}`,
				`Your cards: ${d.hands[seat].map(cardLabel).join(" / ")}`,
				`Your hand: ${HANDS[rank[0]]}`,
				...s.stakes.map(
					(stake, i) =>
						`Mage ${i + 1}: ${stake === null ? "choosing stake" : s.snipes[i] === null ? "stake sealed" : "snipe sealed"}`,
				),
			],
			s.log,
		)
		const item = (card: number) => ({
			label: cardLabel(card),
			piece: cardPiece(
				["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][card % 13],
				Math.floor(card / 13),
			),
		})
		v.displays = [
			{ label: "Community cards", items: d.community.map(item) },
			{ label: "Your private cards", items: d.hands[seat].map(item) },
		]
		v.facts = v.facts.slice(2)
		v.scoreLabel = "Chips"
		numberControl(v, "stake", "Chips to stake", "Seal stake")
		v.choices = v.choices.map((c) =>
			c.move.action === "snipe" ? { ...c, piece: { kind: "tile", text: HANDS[Number(c.move.value)] } } : c,
		)
		return v
	},
	round: (s) => Math.min(s.round + 1, 5),
	bot(v, _seat, rng) {
		const own = v.facts.find((f) => f.startsWith("Your hand: "))!.slice(11)
		const choices = v.choices.filter((c) => c.move.action !== "snipe" || HANDS[Number(c.move.value)] !== own)
		return pick(choices, rng).move
	},
}

interface DiceState {
	deals: number[][][]
	remaining: number[][]
	predictions: (string | null)[]
	submissions: (number[] | null)[]
	roundScores: number[]
	scores: number[]
	round: number
	throw: number
	log: string[]
}
const FORECASTS = ["zero", "minimum", "more", "maximum"]
export function tripleRank(dice: number[]): number[] {
	const sorted = [...dice].sort((a, b) => b - a)
	if (sorted[0] === sorted[2]) return [3, sorted[0]]
	if (new Set(sorted).size === 3 && sorted[0] - sorted[2] === 2) return [2, sorted[0]]
	const pair = sorted.find((n) => sorted.filter((v) => v === n).length === 2)
	return pair === undefined ? [0, ...sorted] : [1, pair, sorted.find((n) => n !== pair)!]
}
const diceOver = (s: DiceState) => s.round >= 4
export const tripleDice: GameDef<DiceState, TrialMove, TrialView> = {
	id: "triple-dice",
	name: "Triple Dice",
	blurb: "Choose three bones, hide two secrets, and predict your own fortune.",
	players: { min: 2, max: 5 },
	rules: [
		"A four-round adaptation. Each mage receives 9 public white dice and 2 private coloured dice. Before playing, predict your total for the round.",
		"Submit 3 unused dice at a time. A triple beats a straight, then a pair, then high dice; higher faces break category ties. No wraparound straights.",
		"Each round has 3 submissions. Place scores are 6, 3, 1, then 0. Equal hands receive the same place score. The 2 unused dice are discarded.",
		"Predictions: zero = 0; minimum = 1–6; more = 7–10; maximum = 11+. Correct zero earns 40; any other correct prediction doubles your round score.",
		"Most total points wins. This edition supports 2–5 players, seals submissions simultaneously and refreshes predictions each round.",
	],
	setup: (rng, n) => ({
		deals: Array.from({ length: 4 }, () =>
			Array.from({ length: n }, () => Array.from({ length: 11 }, () => 1 + Math.floor(rng() * 6))),
		),
		remaining: Array.from({ length: n }, () => Array.from({ length: 11 }, (_, i) => i)),
		predictions: Array(n).fill(null),
		submissions: Array(n).fill(null),
		roundScores: Array(n).fill(0),
		scores: Array(n).fill(0),
		round: 0,
		throw: 0,
		log: [],
	}),
	toAct: (s) =>
		diceOver(s)
			? []
			: (s.predictions.some((p) => p === null) ? s.predictions : s.submissions).flatMap((v, i) =>
					v === null ? [i] : [],
				),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		const acting = tripleDice.toAct(s)
		if (!acting.includes(seat)) allowed(m, [])
		if (s.predictions.some((p) => p === null)) {
			allowed(
				m,
				FORECASTS.map((p) => choice(p, "forecast", p)),
			)
			return { ...s, predictions: s.predictions.map((p, i) => (i === seat ? m.value : p)) }
		}
		if (m.action !== "dice") allowed(m, [])
		const dice = selected(m.value, s.remaining[seat].map(String), 3).map(Number)
		const submissions = s.submissions.map((v, i) => (i === seat ? dice : v))
		if (submissions.some((v) => v === null)) return { ...s, submissions }
		const ranks = submissions.map((v, i) => tripleRank(v!.map((at) => s.deals[s.round][i][at])))
		const scored = ranks.map((rank) => [6, 3, 1, 0, 0][ranks.filter((other) => compare(other, rank) > 0).length])
		const roundScores = s.roundScores.map((n, i) => n + scored[i])
		const end = s.throw === 2
		const payouts = roundScores.map((n, i) =>
			s.predictions[i] === "zero" && n === 0
				? 40
				: (s.predictions[i] === "minimum" && n >= 1 && n <= 6) ||
					  (s.predictions[i] === "more" && n >= 7 && n <= 10) ||
					  (s.predictions[i] === "maximum" && n >= 11)
					? n * 2
					: n,
		)
		return {
			...s,
			remaining: s.remaining.map((r, i) =>
				end ? Array.from({ length: 11 }, (_, j) => j) : r.filter((at) => !submissions[i]!.includes(at)),
			),
			predictions: end ? s.predictions.map(() => null) : s.predictions,
			submissions: submissions.map(() => null),
			roundScores: end ? roundScores.map(() => 0) : roundScores,
			scores: end ? s.scores.map((n, i) => n + payouts[i]) : s.scores,
			round: s.round + (end ? 1 : 0),
			throw: end ? 0 : s.throw + 1,
			log: [
				...s.log,
				`Round ${s.round + 1}, cast ${s.throw + 1}: ${submissions.map((v, i) => `${v!.map((at) => s.deals[s.round][i][at]).join("–")} (+${scored[i]})`).join(" / ")}${end ? `. Forecast payouts: ${payouts.join(" / ")}` : ""}`,
			],
		}
	},
	outcome: (s) => (diceOver(s) ? result(s.scores) : null),
	view(s, seat) {
		const forecasting = s.predictions.some((p) => p === null)
		const v = view(
			forecasting ? "Forecast your round" : "Select three dice",
			at("Round", Math.min(s.round + 1, 4), 4, `Cast ${s.throw + 1}`),
			s.scores,
			!diceOver(s) && forecasting && s.predictions[seat] === null
				? FORECASTS.map((p) => choice(`Predict ${p}`, "forecast", p))
				: [],
			[
				`Round points: ${s.roundScores.join(" / ")}`,
				`Your forecast: ${s.predictions[seat] ?? "not sealed"}`,
				...s.deals[Math.min(s.round, 3)].map(
					(dice, i) =>
						`Mage ${i + 1} white dice: ${s.remaining[i]
							.filter((at) => at < 9)
							.map((at) => dice[at])
							.join(", ")}`,
				),
			],
			s.log,
		)
		v.facts = v.facts.slice(0, 2)
		v.displays = s.deals[Math.min(s.round, 3)].map((dice, i) => ({
			label: `Mage ${i + 1} · public white dice`,
			items: s.remaining[i]
				.filter((at) => at < 9)
				.map((at) => ({ label: `Die ${at + 1}: ${dice[at]}`, piece: { kind: "die", value: dice[at] } })),
		}))
		v.displays.push({
			label: "Your private dice",
			items: s.remaining[seat]
				.filter((at) => at >= 9)
				.map((at) => ({
					label: at === 9 ? "Private red die" : "Private blue die",
					piece: { kind: "die", value: s.deals[Math.min(s.round, 3)][seat][at], tone: at === 9 ? 0 : 1 },
				})),
		})
		const forecasts = ["0 points · earn 40", "1–6 points · double", "7–10 points · double", "11+ points · double"]
		v.choices = v.choices.map((c) => ({
			...c,
			label: forecasts[FORECASTS.indexOf(c.move.value)],
			piece: { kind: "tile", text: forecasts[FORECASTS.indexOf(c.move.value)] },
		}))
		if (!diceOver(s) && !forecasting && s.submissions[seat] === null)
			v.selection = {
				label: "Choose 3 unused dice",
				action: "dice",
				min: 3,
				max: 3,
				submit: "Seal three dice",
				options: s.remaining[seat].map((at) => ({
					value: String(at),
					piece: { kind: "die", value: s.deals[s.round][seat][at], tone: at < 9 ? undefined : at === 9 ? 0 : 1 },
					label: `${at + 1}: ${s.deals[s.round][seat][at]} (${at < 9 ? "white" : at === 9 ? "red, private" : "blue, private"})`,
				})),
			}
		return v
	},
	round: (s) => Math.min(s.round + 1, 4),
	bot: randomAction,
}
