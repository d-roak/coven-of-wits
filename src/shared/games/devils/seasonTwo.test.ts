import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../../game"
import { seasonTwoGames } from "./seasonTwo"
import { balanceMancala, crookedCops, halloweenMonster, treasureIsland } from "./seasonTwoAdventures"
import { bigOrSmall, doubtAndBet, removeOne, timeAuction } from "./seasonTwoBids"
import { pokerRank, sniperHoldem, tripleDice, tripleRank } from "./seasonTwoCards"
import { questionAndTruth } from "./seasonTwoDeduction"
import { equationPyramid, findTheKey, unknown } from "./seasonTwoPuzzles"
import { baghChal, wallGo } from "./seasonTwoTerritory"
import type { TrialView } from "./trial"

const freeze = (value: unknown): void => {
	if (value === null || typeof value !== "object" || Object.isFrozen(value)) return
	Object.freeze(value)
	for (const nested of Object.values(value)) freeze(nested)
}

describe("season two shared contract", () => {
	const tables = seasonTwoGames.flatMap((game) =>
		[...new Set([game.players.min, game.players.max])].map((players) => ({ game, players })),
	)
	it.each(tables)("$game.id at $players seats finishes with view-only legal bots", ({ game, players }) => {
		for (let seed = 1; seed <= 3; seed++) {
			const rng = seededRng(seed)
			let state = game.setup(rng, players)
			for (let turns = 0; !game.outcome(state); turns++) {
				expect(turns, game.id).toBeLessThan(1000)
				const acting = game.toAct(state)
				expect(acting.length, game.id).toBeGreaterThan(0)
				const seat = acting[0],
					v = game.view(state, seat) as TrialView
				expect(v.scores.every(Number.isFinite), game.id).toBe(true)
				const move = game.parseMove(game.bot!(v, seat, rng))
				freeze(state)
				state = game.apply(state, seat, move)
			}
			expect(game.toAct(state)).toEqual([])
			expect(game.outcome(state)!.winners.every((n) => n >= 0 && n < players)).toBe(true)
			expect(() => game.apply(state, 0, { action: "anything", value: "" })).toThrow(IllegalMove)
		}
	})
	it.each(seasonTwoGames)("$id rejects unknown actions and protocol extras", (game) => {
		const state = game.setup(seededRng(3), game.players.min)
		expect(() => game.apply(state, 0, { action: "unsupported", value: "" })).toThrow(IllegalMove)
		expect(() => game.parseMove({ action: "move", value: "0", extra: true })).toThrow(IllegalMove)
		if (game.players.min > 1 && !game.toAct(state).includes(1))
			expect(() => game.apply(state, 1, game.bot!(game.view(state, 0), 0, seededRng(1)))).toThrow(IllegalMove)
	})
})

it("Unknown offers a bounded pass when a cube is boxed in", () => {
	const s = { ...unknown.setup(seededRng(1), 5), positions: [0, 1, 2, 5, 10] }
	const v = unknown.view(s, 0)
	expect(v.choices.length).toBeGreaterThan(0)
	const next = unknown.apply(s, 0, unknown.bot!(v, 0, seededRng(1)))
	expect(next.turn).toBe(1)
})

it("Remove One reveals pairs but keeps the retained card private", () => {
	let s = removeOne.setup(seededRng(1), 3)
	for (let seat = 0; seat < 3; seat++) s = removeOne.apply(s, seat, { action: "pair", value: "1,2" })
	const left = removeOne.apply(s, 1, { action: "keep", value: "1" }),
		right = removeOne.apply(s, 1, { action: "keep", value: "2" })
	expect(removeOne.view(left, 0)).toEqual(removeOne.view(right, 0))
	s = removeOne.apply(removeOne.apply(left, 0, { action: "keep", value: "1" }), 2, { action: "keep", value: "2" })
	expect(s.scores).toEqual([0, 0, 1])
	expect(() => removeOne.apply(s, 2, { action: "pair", value: "1,2" })).toThrow(IllegalMove)
})

it("Time Auction charges all bids, scores only an untied maximum, and hides bids", () => {
	const s = timeAuction.setup(seededRng(1), 3),
		a = timeAuction.apply(s, 1, { action: "bid", value: "3" }),
		b = timeAuction.apply(s, 1, { action: "bid", value: "9" })
	expect(timeAuction.view(a, 0)).toEqual(timeAuction.view(b, 0))
	const end = timeAuction.apply(timeAuction.apply(a, 0, { action: "bid", value: "3" }), 2, {
		action: "bid",
		value: "1",
	})
	expect(end.scores).toEqual([0, 0, 0])
	expect(end.budgets).toEqual([57, 57, 59])
	expect(() => timeAuction.apply(end, 0, { action: "bid", value: "58" })).toThrow(IllegalMove)
})

it("Big or Small hides the selected card and settles a correct higher wager", () => {
	const s = { ...bigOrSmall.setup(seededRng(1), 2), dealer: Array(18).fill(5) }
	const a = bigOrSmall.apply(s, 0, { action: "card", value: "7" }),
		b = bigOrSmall.apply(s, 0, { action: "card", value: "9" })
	expect(bigOrSmall.view(a, 1)).toEqual(bigOrSmall.view(b, 1))
	const end = bigOrSmall.apply(a, 1, { action: "bet", value: "big:2" })
	expect(end.chips).toEqual([12, 12])
	expect(end.hands[0]).not.toContain(7)
})

it("Doubt and Bet counts wilds and reduces the losing player's slots", () => {
	const s = {
		...doubtAndBet.setup(seededRng(1), 2),
		hands: [
			[0, 5, 1, 1, 1],
			[0, 2, 2, 2, 2],
		],
	}
	const changed = { ...s, hands: [s.hands[0], [4, 4, 4, 4, 4]] }
	expect(doubtAndBet.view(s, 0)).toEqual(doubtAndBet.view(changed, 0))
	const end = doubtAndBet.apply(doubtAndBet.apply(s, 0, { action: "claim", value: "3:0" }), 1, {
		action: "doubt",
		value: "",
	})
	expect(end.chips).toEqual([9, 7])
	expect(end.slots).toEqual([5, 4])
})

it("Crooked Cops masks the thief and credits honest arrests only", () => {
	const s = { ...crookedCops.setup(seededRng(1), 4), turn: 1, crooked: 3, positions: [1, 0, 20, 24] }
	const changed = { ...s, positions: [18, 0, 20, 24] }
	expect(crookedCops.view(s, 1)).toEqual(crookedCops.view(changed, 1))
	expect(crookedCops.outcome(crookedCops.apply(s, 1, { action: "arrest", value: "1" }))).toEqual({ winners: [1, 2] })
	expect(
		crookedCops.outcome(
			crookedCops.apply({ ...s, turn: 3, positions: [23, 0, 20, 24] }, 3, { action: "arrest", value: "23" }),
		),
	).toBeNull()
})

it("Halloween Monster spends special weapons and awards a kill to the fixed coven", () => {
	const s = halloweenMonster.setup(seededRng(1), 3)
	const next = halloweenMonster.apply(s, 0, { action: "attack", value: "0:grenade" })
	expect(next.monsters[0].dead).toBe(true)
	expect(next.points).toEqual([5, 0, 0])
	expect(halloweenMonster.view(next, 0).scores).toEqual([2.5, 2.5, 0])
	expect(() => halloweenMonster.apply({ ...next, turn: 0 }, 0, { action: "attack", value: "1:grenade" })).toThrow(
		IllegalMove,
	)
})

it("Treasure Island hides treasure until private exploration and rejects walking through rock", () => {
	const s = treasureIsland.setup(seededRng(1), 2)
	expect(treasureIsland.view({ ...s, treasure: 4 }, 0)).toEqual(treasureIsland.view({ ...s, treasure: 24 }, 0))
	const explore = { ...s, phase: "explore" as const, positions: [6, 0], arrows: [4, 4] }
	expect(() => treasureIsland.apply(explore, 0, { action: "move", value: "7" })).toThrow(IllegalMove)
	const found = treasureIsland.apply({ ...explore, treasure: 4, positions: [3, 0] }, 0, { action: "move", value: "4" })
	expect(found.done).toBe(true)
	expect(found.scores).toEqual([13, 0])
})

it("Mancala gives the last counter owner points and uses twice-minimum-minus-maximum", () => {
	const s = balanceMancala.setup(seededRng(1), 2)
	const pits = Array.from({ length: 14 }, () => [] as number[])
	pits[0] = [0, 1]
	const next = balanceMancala.apply({ ...s, pits }, 0, { action: "sow", value: "0:1:2" })
	expect(next.points).toEqual([
		[0, 0, 0],
		[0, 0, 1],
	])
	expect(
		balanceMancala.view(
			{
				...next,
				points: [
					[19, 10, 15],
					[4, 4, 4],
				],
			},
			0,
		).scores,
	).toEqual([1, 4])
})

it("Wall Go builds after moving, blocks crossing, and spends a break once", () => {
	const s = wallGo.setup(seededRng(1), 2)
	const moved = wallGo.apply(s, 0, { action: "move", value: "0:1" })
	const built = wallGo.apply(moved, 0, { action: "wall", value: "1:2" })
	expect(built.walls).toContain("1:2")
	const own = { ...built, turn: 0 }
	expect(() => wallGo.apply(own, 0, { action: "move", value: "0:2" })).toThrow(IllegalMove)
	const broken = wallGo.apply(own, 0, { action: "break", value: "1:2" })
	expect(broken.breaks[0]).toBe(0)
	expect(broken.walls).not.toContain("1:2")
})

it("Bagh Chal captures one adjacent goat and ends at five captures", () => {
	const s = { ...baghChal.setup(seededRng(1), 2), goats: [1], tigers: [0, 4, 20, 24], turn: 1, captured: 4 }
	const end = baghChal.apply(s, 1, { action: "capture", value: "0:1:2" })
	expect(end.goats).toEqual([])
	expect(baghChal.outcome(end)).toEqual({ winners: [1] })
	expect(() => baghChal.apply(s, 1, { action: "capture", value: "0:1:3" })).toThrow(IllegalMove)
})

it("Poker ranks ace-low straights and two pair above one pair", () => {
	expect(pokerRank([12, 0, 14, 28, 42])[0]).toBe(4)
	expect(pokerRank([0, 13, 1, 14, 5])[0]).toBe(2)
	expect(pokerRank([0, 13, 2, 4, 6])[0]).toBe(1)
})

it("Sniper Holdem hides rival hole cards and bans the named rival hand", () => {
	const s = sniperHoldem.setup(seededRng(1), 2)
	const changed = { ...s, deals: s.deals.map((d, i) => (i === 0 ? { ...d, hands: [d.hands[0], [50, 51]] } : d)) }
	expect(sniperHoldem.view(s, 0)).toEqual(sniperHoldem.view(changed, 0))
	const ownRank = pokerRank([...s.deals[0].community, ...s.deals[0].hands[0]])[0]
	let next = sniperHoldem.apply(sniperHoldem.apply(s, 0, { action: "stake", value: "3" }), 1, {
		action: "stake",
		value: "3",
	})
	const rivalRank = pokerRank([...s.deals[0].community, ...s.deals[0].hands[1]])[0]
	next = sniperHoldem.apply(sniperHoldem.apply(next, 0, { action: "snipe", value: String((rivalRank + 1) % 9) }), 1, {
		action: "snipe",
		value: String(ownRank),
	})
	expect(next.chips).toEqual([57, 63])
})

it("Triple Dice ranks triples, straights and pairs and keeps coloured dice private", () => {
	expect(tripleRank([2, 2, 2])[0]).toBe(3)
	expect(tripleRank([1, 2, 3])[0]).toBe(2)
	expect(tripleRank([6, 1, 2])[0]).toBe(0)
	const s = tripleDice.setup(seededRng(1), 2),
		changed = {
			...s,
			deals: s.deals.map((d, i) => (i === 0 ? d.map((hand, j) => (j === 1 ? [...hand.slice(0, 9), 6, 6] : hand)) : d)),
		}
	expect(tripleDice.view(s, 0)).toEqual(tripleDice.view(changed, 0))
	let next = tripleDice.apply(tripleDice.apply(s, 0, { action: "forecast", value: "zero" }), 1, {
		action: "forecast",
		value: "more",
	})
	expect(() => tripleDice.apply(next, 0, { action: "dice", value: '["0","0","1"]' })).toThrow(IllegalMove)
})

it("Equation Pyramid rejects reused tiles and applies standard precedence", () => {
	const s = equationPyramid.setup(seededRng(1), 1)
	const tiles = s.rounds[0].tiles.map((t, i) =>
		i === 0
			? { number: 8, op: "+" as const }
			: i === 1
				? { number: 6, op: "+" as const }
				: i === 2
					? { number: 2, op: "/" as const }
					: t,
	)
	const custom = { ...s, rounds: [{ tiles, target: 11 }, ...s.rounds.slice(1)] }
	const next = equationPyramid.apply(custom, 0, { action: "equation", value: '["0","1","2"]' })
	expect(next.scores).toEqual([1])
	expect(() => equationPyramid.apply(custom, 0, { action: "equation", value: '["0","0","2"]' })).toThrow(IllegalMove)
})

it("Question and Truth hides the rival sequence, answers truthfully and accepts a complete guess", () => {
	const s = questionAndTruth.setup(seededRng(1), 2),
		changed = { ...s, cards: [s.cards[0], questionAndTruth.setup(seededRng(99), 2).cards[1]] }
	expect(questionAndTruth.view(s, 0)).toEqual(questionAndTruth.view(changed, 0))
	const ask = questionAndTruth.apply(questionAndTruth.apply(s, 0, { action: "bid", value: "2" }), 1, {
		action: "bid",
		value: "1",
	})
	const clue = questionAndTruth.apply(ask, 0, { action: "sum", value: "0,1,2" })
	expect(clue.queries[0].answer).toBe(String(s.cards[1].slice(0, 3).reduce((n, c) => n + c.rank, 0)))
	expect(
		questionAndTruth.outcome(
			questionAndTruth.apply(ask, 0, { action: "truth", value: s.cards[1].map((c) => c.rank).join(",") }),
		),
	).toEqual({ winners: [0] })
	expect(() => questionAndTruth.apply(ask, 0, { action: "truth", value: "1,2,3" })).toThrow(IllegalMove)
})

it("Find the Key costs a chance for a wrong riddle and locks after three mistakes", () => {
	let s = findTheKey.setup(seededRng(1), 1)
	for (let i = 0; i < 3; i++) s = findTheKey.apply(s, 0, { action: "answer", value: "yesterday" })
	expect(findTheKey.outcome(s)).toEqual({ winners: [] })
	expect(() => findTheKey.apply(s, 0, { action: "answer", value: "tomorrow" })).toThrow(IllegalMove)
})

it("Unknown exiles a cube recoloured to ivory and gives the central gate priority", () => {
	const s = unknown.setup(seededRng(1), 2)
	const tiles = Array<number>(25).fill(5)
	tiles[7] = 0
	const changed = { ...s, positions: [6, 24], tiles, cubes: [[0, 1, 2, 3, 5, 4], s.cubes[1]] }
	const next = unknown.apply(changed, 0, { action: "roll", value: "7" })
	expect(next.exiles[0]).toBe(1)
	expect(next.positions[0]).toBe(0)
	const won = unknown.apply({ ...s, positions: [11, 24] }, 0, { action: "roll", value: "12" })
	expect(unknown.outcome(won)).toEqual({ winners: [0] })
})

it("Mancala angel scores the lowest colour and devil scores the highest", () => {
	const s = {
		...balanceMancala.setup(seededRng(1), 2),
		points: [
			[1, 5, 8],
			[0, 0, 0],
		],
	}
	const pits = Array.from({ length: 14 }, () => [] as number[])
	pits[5] = [0]
	expect(balanceMancala.apply({ ...s, pits }, 0, { action: "sow", value: "5:0:0" }).points[0]).toEqual([2, 5, 8])
	pits[5] = []
	pits[12] = [0]
	expect(balanceMancala.apply({ ...s, pits }, 0, { action: "sow", value: "12:0:2" }).points[0]).toEqual([1, 5, 9])
	expect(() => balanceMancala.apply({ ...s, pits }, 0, { action: "sow", value: "12:0:0" })).toThrow(IllegalMove)
})

it("Triple Dice pays 40 for a successful zero forecast", () => {
	const s = tripleDice.setup(seededRng(1), 4)
	const custom = {
		...s,
		deals: [
			[
				[6, 6, 6],
				[5, 5, 5],
				[4, 4, 4],
				[1, 1, 1],
			],
			...s.deals.slice(1),
		],
		predictions: ["maximum", "minimum", "more", "zero"],
		submissions: [[0, 1, 2], [0, 1, 2], [0, 1, 2], null],
		roundScores: [12, 6, 2, 0],
		throw: 2,
	}
	const next = tripleDice.apply(custom, 3, { action: "dice", value: '["0","1","2"]' })
	expect(next.scores).toEqual([36, 9, 3, 40])
	expect(next.round).toBe(1)
})

it("Find the Key accepts repeated initials, rejects wrong pictures, and validates the safe sequence", () => {
	let s = findTheKey.apply(findTheKey.setup(seededRng(1), 1), 0, { action: "answer", value: "tomorrow" })
	const bad = s.pictures.findIndex((p) => p[0] !== "F")
	s = findTheKey.apply(s, 0, { action: "picture", value: String(bad) })
	expect(s.mistakes).toBe(1)
	for (const initial of "FINDTHEKEY")
		s = findTheKey.apply(s, 0, { action: "picture", value: String(s.pictures.findIndex((p) => p[0] === initial)) })
	expect(s.phase).toBe("lock")
	expect(findTheKey.apply(s, 0, { action: "unlock", value: "bad" }).mistakes).toBe(2)
	expect(
		findTheKey.outcome(findTheKey.apply(s, 0, { action: "unlock", value: s.path.map((n) => n + 1).join("-") })),
	).toEqual({ winners: [0] })
})
