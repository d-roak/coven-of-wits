import { z } from "zod"
import { type GameDef, illegal, parseWith, shuffle, topSeats } from "../game"

export const CARDS = 8

export interface AuctionRound {
	/** Points at stake that round, carry-over included. */
	prize: number
	/** Indexed by seat. */
	bids: number[]
	/** Null when the top bids tied and the prize rolled over. */
	winner: number | null
}

export interface MindAuctionState {
	/** Prize cards still to come. deck[0] is the one on the table. Order is secret. */
	deck: number[]
	/** Points carried over from tied rounds. */
	pot: number
	hands: number[][]
	/** This round's sealed bids. Secret until every seat has one in. */
	bids: (number | null)[]
	scores: number[]
	history: AuctionRound[]
}

export interface MindAuctionView {
	prize: number | null
	pot: number
	roundsLeft: number
	/** All hands are public: every spent card shows up in the history anyway. */
	hands: number[][]
	myBid: number | null
	/** Which seats have a bid in. Never what it is. */
	sealed: boolean[]
	scores: number[]
	history: AuctionRound[]
}

export interface MindAuctionMove {
	card: number
}

const schema = z.object({ card: z.number().int().min(1).max(CARDS) }).strict()
const fullHand = () => Array.from({ length: CARDS }, (_, i) => i + 1)

export const mindAuction: GameDef<MindAuctionState, MindAuctionMove, MindAuctionView> = {
	id: "mind-auction",
	name: "Mind Auction",
	blurb: "Bid in secret for each prize. Spend your high cards at the right moment.",
	rules: [
		`Every mage holds cards 1 to ${CARDS}. Prize cards 1 to ${CARDS} come up in random order.`,
		"Each round everyone picks a card in secret. The single highest card takes the prize as points.",
		"A played card is gone for good.",
		"If the highest cards tie, nobody scores and the prize rolls into the next round.",
		"Most points after the last prize wins.",
	],
	players: { min: 2, max: 5 },
	setup: (rng, players) => ({
		deck: shuffle(fullHand(), rng),
		pot: 0,
		hands: Array.from({ length: players }, fullHand),
		bids: Array<number | null>(players).fill(null),
		scores: Array<number>(players).fill(0),
		history: [],
	}),
	toAct: (s) => (s.deck.length === 0 ? [] : s.bids.flatMap((bid, seat) => (bid === null ? [seat] : []))),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (s.deck.length === 0) illegal("The auction is over.")
		const hand = s.hands[seat]
		if (!hand) return illegal("There is no such seat.")
		if (s.bids[seat] !== null) illegal("Your bid is already sealed.")
		if (!hand.includes(move.card)) illegal("You no longer hold that card.")

		const sealed = s.bids.map((b, i) => (i === seat ? move.card : b))
		if (sealed.some((b) => b === null)) return { ...s, bids: sealed }
		const bids = sealed as number[]

		const prize = s.deck[0]! + s.pot
		const top = Math.max(...bids)
		const winner = bids.filter((b) => b === top).length === 1 ? bids.indexOf(top) : null
		return {
			deck: s.deck.slice(1),
			pot: winner === null ? prize : 0,
			hands: s.hands.map((cards, i) => cards.filter((card) => card !== bids[i])),
			bids: bids.map(() => null),
			scores: s.scores.map((score, i) => (i === winner ? score + prize : score)),
			history: [...s.history, { prize, bids, winner }],
		}
	},
	round: (s) => s.history.length + 1,
	outcome: (s) => (s.deck.length > 0 ? null : { winners: topSeats(s.scores) }),
	historyEntry(before, after) {
		if (after.history.length === before.history.length) return ["Sealed a bid."]
		const result = after.history.at(-1)!
		return [
			`Bids revealed: ${result.bids.map((bid, i) => `Mage ${i + 1}: ${bid}`).join("; ")}.`,
			result.winner === null
				? `The highest bids tied; ${result.prize} points rolled over.`
				: `Mage ${result.winner + 1} won ${result.prize} points.`,
		]
	},
	view: (s, seat) => ({
		prize: s.deck[0] ?? null,
		pot: s.pot,
		roundsLeft: s.deck.length,
		hands: s.hands,
		myBid: s.bids[seat] ?? null,
		sealed: s.bids.map((b) => b !== null),
		scores: s.scores,
		history: s.history,
	}),
	// ponytail: bids near the prize value with noise, sometimes throws its lowest card. No opponent modelling.
	bot(view, seat, rng) {
		const hand = view.hands[seat]!
		if (rng() < 0.15) return { card: Math.min(...hand) }
		// A wide spread on purpose: at a full table, bots that all aim at the prize value tie every round.
		const target = (view.prize ?? 0) + view.pot + Math.floor(rng() * 7) - 3
		return { card: hand.reduce((best, card) => (Math.abs(card - target) < Math.abs(best - target) ? card : best)) }
	},
}
