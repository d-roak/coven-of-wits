import { describe, expect, it } from "vitest"
import { type AnyGame, seededRng } from "../game"
import { lastCandle } from "./lastCandle"
import { liarsBones } from "./liarsBones"
import { loneSpark } from "./loneSpark"
import { mindAuction } from "./mindAuction"
import { runeCipher } from "./runeCipher"
import { runeDrop } from "./runeDrop"
import { turncoat } from "./turncoat"

describe("classic action history", () => {
	it.each([
		[runeDrop, { col: 0 }, { col: 3 }],
		[turncoat, { cell: 19 }, { cell: 26 }],
		[lastCandle, { row: 0, take: 1 }, { row: 0, take: 2 }],
	] as [AnyGame, unknown, unknown][])(
		"$0.id describes distinct public placements equally to both seats",
		(game, left, right) => {
			const before = game.setup(seededRng(31), 2)
			const a = game.apply(before, 0, game.parseMove(left))
			const b = game.apply(before, 0, game.parseMove(right))
			const event = game.historyEntry!(before, a, 0, 0)
			expect(event).not.toEqual(game.historyEntry!(before, b, 0, 0))
			expect(event).toEqual(game.historyEntry!(before, a, 0, 1))
		},
	)
	it("auction entries conceal sealed bid values and reveal completed rounds", () => {
		const before = mindAuction.setup(seededRng(9), 2)
		const low = mindAuction.apply(before, 0, { card: 1 })
		const high = mindAuction.apply(before, 0, { card: 8 })
		for (const receiver of [0, 1])
			expect(mindAuction.historyEntry!(before, low, 0, receiver)).toEqual(
				mindAuction.historyEntry!(before, high, 0, receiver),
			)
		const tied = mindAuction.apply(low, 1, { card: 1 })
		const won = mindAuction.apply(high, 1, { card: 1 })
		expect(mindAuction.historyEntry!(low, tied, 1, 0)).not.toEqual(mindAuction.historyEntry!(high, won, 1, 0))
		expect(mindAuction.historyEntry!(high, won, 1, 0)).toEqual(mindAuction.historyEntry!(high, won, 1, 1))
	})
	it("spark entries conceal locked values until every seat has picked", () => {
		const before = loneSpark.setup(seededRng(9), 3)
		const low = loneSpark.apply(before, 0, { spark: 1 })
		const high = loneSpark.apply(before, 0, { spark: 5 })
		for (const receiver of [0, 1, 2])
			expect(loneSpark.historyEntry!(before, low, 0, receiver)).toEqual(
				loneSpark.historyEntry!(before, high, 0, receiver),
			)
		const lowTwo = loneSpark.apply(low, 1, { spark: 2 })
		const highTwo = loneSpark.apply(high, 1, { spark: 2 })
		const a = loneSpark.apply(lowTwo, 2, { spark: 2 })
		const b = loneSpark.apply(highTwo, 2, { spark: 2 })
		expect(loneSpark.historyEntry!(lowTwo, a, 2, 1)).not.toEqual(loneSpark.historyEntry!(highTwo, b, 2, 1))
	})
	it("bones history records the public bid and prior reveal without exposing newly rolled bones", () => {
		const before = liarsBones.setup(seededRng(9), 2)
		const a = liarsBones.apply(before, 0, { type: "bid", count: 1, face: 2 })
		const b = liarsBones.apply(before, 0, { type: "bid", count: 2, face: 3 })
		expect(liarsBones.historyEntry!(before, a, 0, 1)).not.toEqual(liarsBones.historyEntry!(before, b, 0, 1))
		const otherRoll = {
			...before,
			seed: before.seed + 1,
			bones: before.bones.map((bones) => bones.map((face) => 7 - face)),
		}
		const sameBid = liarsBones.apply(otherRoll, 0, { type: "bid", count: 1, face: 2 })
		expect(liarsBones.historyEntry!(otherRoll, sameBid, 0, 1)).toEqual(liarsBones.historyEntry!(before, a, 0, 1))
		const called = liarsBones.apply(a, 1, { type: "call" })
		const hiddenReroll = {
			...called,
			seed: called.seed + 1,
			bones: called.bones.map((bones) => bones.map((face) => 7 - face)),
		}
		expect(liarsBones.historyEntry!(a, called, 1, 0)).toEqual(liarsBones.historyEntry!(a, hiddenReroll, 1, 0))
		expect(liarsBones.historyEntry!(a, called, 1, 0)).not.toEqual(liarsBones.historyEntry!(before, a, 0, 0))
	})
	it("cipher entries contain feedback without encoding guesses or the secret", () => {
		const a = { ...runeCipher.setup(seededRng(9), 1), secret: [0, 0, 0, 0] }
		const b = { ...a, secret: [2, 2, 2, 2] }
		const missA = runeCipher.apply(a, 0, { code: [1, 1, 1, 1] })
		const missB = runeCipher.apply(b, 0, { code: [3, 3, 3, 3] })
		expect(runeCipher.historyEntry!(a, missA, 0, 0)).toEqual(runeCipher.historyEntry!(b, missB, 0, 0))
		const hitA = runeCipher.apply(a, 0, { code: a.secret })
		const hitB = runeCipher.apply(b, 0, { code: b.secret })
		expect(runeCipher.historyEntry!(a, hitA, 0, 0)).toEqual(runeCipher.historyEntry!(b, hitB, 0, 0))
		expect(runeCipher.historyEntry!(a, missA, 0, 0)).not.toEqual(runeCipher.historyEntry!(a, hitA, 0, 0))
	})
})
