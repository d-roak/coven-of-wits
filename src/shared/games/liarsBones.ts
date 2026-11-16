import { z } from "zod"
import { type GameDef, type Rng, illegal, parseWith, seededRng } from "../game"

export const START_BONES = 3
const MAX_PLAYERS = 5

export interface Bid {
	count: number
	face: number
	by: number
}

/** What a call exposed. Public from the call until the next bid. */
export interface Reveal {
	bones: number[][]
	bid: Bid
	caller: number
	loser: number
	/** How many bones actually showed the bid's face. */
	actual: number
}

export interface LiarsBonesState {
	/** Feeds the reroll after each call. Secret: whoever knows it knows every future roll. */
	seed: number
	/** Indexed by seat. An empty list means that mage is out. */
	bones: number[][]
	turn: number
	bid: Bid | null
	reveal: Reveal | null
}

export interface LiarsBonesView {
	myBones: number[]
	/** How many bones each seat still has. */
	counts: number[]
	turn: number
	bid: Bid | null
	reveal: Reveal | null
}

export type LiarsBonesMove = { type: "bid"; count: number; face: number } | { type: "call" }

const schema = z.discriminatedUnion("type", [
	z
		.object({
			type: z.literal("bid"),
			count: z
				.number()
				.int()
				.min(1)
				.max(START_BONES * MAX_PLAYERS),
			face: z.number().int().min(1).max(6),
		})
		.strict(),
	z.object({ type: z.literal("call") }).strict(),
])

const roll = (n: number, rng: Rng) => Array.from({ length: n }, () => 1 + Math.floor(rng() * 6)).sort()
const newSeed = (rng: Rng) => Math.floor(rng() * 2 ** 32)

function nextWithBones(bones: number[][], from: number): number {
	for (let i = 1; i <= bones.length; i++) {
		const seat = (from + i) % bones.length
		if (bones[seat]!.length > 0) return seat
	}
	throw new Error("liars-bones: expected at least one mage with bones left")
}

/** A bid must raise the count, or keep the count and raise the face. */
export function outbids(bid: { count: number; face: number }, prev: Bid | null): boolean {
	return !prev || bid.count > prev.count || (bid.count === prev.count && bid.face > prev.face)
}

export const liarsBones: GameDef<LiarsBonesState, LiarsBonesMove, LiarsBonesView> = {
	id: "liars-bones",
	name: "Liar's Bones",
	blurb: "Everyone rolls in secret. Bid on what the whole table holds, or call the last bid a lie.",
	rules: [
		`Each mage rolls ${START_BONES} bones and keeps them hidden.`,
		"On your turn, bid how many bones of one face lie on the whole table, yours and everyone else's.",
		"Each bid must be higher: more bones, or the same number with a higher face.",
		"Or call the last bid a lie. All bones are shown.",
		"If the bid holds, the caller loses a bone. If not, the bidder does. Everyone rerolls.",
		"The last mage with a bone wins.",
	],
	players: { min: 2, max: MAX_PLAYERS },
	setup: (rng, players) => ({
		bones: Array.from({ length: players }, () => roll(START_BONES, rng)),
		seed: newSeed(rng),
		turn: 0,
		bid: null,
		reveal: null,
	}),
	toAct: (s) => (liarsBones.outcome(s) ? [] : [s.turn]),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (liarsBones.outcome(s)) illegal("The game is over.")
		if (seat !== s.turn) illegal("It is not your turn.")
		switch (move.type) {
			case "bid": {
				if (move.count > s.bones.flat().length) illegal("There are not that many bones on the table.")
				if (!outbids(move, s.bid)) illegal("A bid must beat the one before it.")
				const bid = { count: move.count, face: move.face, by: seat }
				return { ...s, bid, turn: nextWithBones(s.bones, seat), reveal: null }
			}
			case "call": {
				const bid = s.bid
				if (!bid) return illegal("There is no bid to call yet.")
				const actual = s.bones.flat().filter((b) => b === bid.face).length
				const loser = actual >= bid.count ? seat : bid.by
				const rng = seededRng(s.seed)
				const bones = s.bones.map((mine, i) => roll(mine.length - (i === loser ? 1 : 0), rng))
				return {
					seed: newSeed(rng),
					bones,
					// The loser opens the next round, unless that was their last bone.
					turn: bones[loser]!.length > 0 ? loser : nextWithBones(bones, loser),
					bid: null,
					reveal: { bones: s.bones, bid, caller: seat, loser, actual },
				}
			}
			default: {
				const unknown: never = move
				return unknown
			}
		}
	},
	round: (s) => s.bones.length * START_BONES - s.bones.reduce((total, bones) => total + bones.length, 0) + 1,
	outcome(s) {
		const alive = s.bones.flatMap((mine, seat) => (mine.length > 0 ? [seat] : []))
		return alive.length === 1 ? { winners: alive } : null
	},
	historyEntry(_before, after) {
		if (after.bid) return [`Bid ${after.bid.count} bones showing ${after.bid.face}.`]
		const reveal = after.reveal!
		return [
			`Called Mage ${reveal.bid.by + 1}'s bid of ${reveal.bid.count} bones showing ${reveal.bid.face}.`,
			`Revealed bones: ${reveal.bones.map((bones, i) => `Mage ${i + 1}: ${bones.length ? bones.join(", ") : "out"}`).join("; ")}.`,
			`The table held ${reveal.actual} matching bones; Mage ${reveal.loser + 1} lost a bone.`,
		]
	},
	view: (s, seat) => ({
		myBones: s.bones[seat] ?? [],
		counts: s.bones.map((mine) => mine.length),
		turn: s.turn,
		bid: s.bid,
		reveal: s.reveal,
	}),
	// ponytail: plays the odds. Expects a sixth of unseen bones per face, never reads other bidders.
	bot(view, _seat, rng) {
		const total = view.counts.reduce((a, b) => a + b, 0)
		const unseen = total - view.myBones.length
		const expected = (face: number) => view.myBones.filter((b) => b === face).length + unseen / 6
		const prev = view.bid
		if (prev && prev.count - expected(prev.face) > 0.4 + rng() * 0.9) return { type: "call" }

		let best: { count: number; face: number } | null = null
		let bestScore = -Infinity
		const from = prev ? prev.count : Math.max(1, Math.floor(Math.max(...[1, 2, 3, 4, 5, 6].map(expected))))
		for (let count = from; count <= Math.min(total, from + 1); count++) {
			for (let face = 1; face <= 6; face++) {
				if (!outbids({ count, face }, prev)) continue
				const score = expected(face) - count + rng() * 0.8
				if (score > bestScore) [best, bestScore] = [{ count, face }, score]
			}
		}
		// Nothing left to raise to (the bid is already every bone on the table showing six).
		return best ? { type: "bid", ...best } : { type: "call" }
	},
}
