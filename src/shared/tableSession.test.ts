import { describe, expect, it } from "vitest"
import { seededRng } from "./game"
import { timeAuction } from "./games/devils/seasonTwoBids"
import { knightsTour } from "./games/knightsTour"
import { baghChal } from "./games/devils/seasonTwoTerritory"
import { actionEntry, advanceClock, clockSeconds, newLogLines, startClock } from "./tableSession"

describe("table clocks and action records", () => {
	it("keeps simultaneous sealing on one clock and resets when the next round begins", () => {
		const initial = timeAuction.setup(seededRng(5), 2)
		const first = timeAuction.apply(initial, 0, { action: "bid", value: "1" })
		const clock = startClock(timeAuction, initial, 1000)
		const sealed = advanceClock(timeAuction, initial, first, clock, 4000)
		expect(sealed).toEqual(clock)
		const next = timeAuction.apply(first, 1, { action: "bid", value: "2" })
		const advanced = advanceClock(timeAuction, first, next, sealed, 9000)
		expect(advanced).toMatchObject({
			startedAt: 1000,
			roundStartedAt: 9000,
			turnStartedAt: 9000,
			round: "2",
			endedAt: null,
		})
		expect(clockSeconds(advanced, 12000)).toEqual({ game: 11, round: 3, turn: 3 })
	})

	it("resets only the turn clock when a board turn passes to the opponent", () => {
		const initial = baghChal.setup(seededRng(1), 2)
		const move = baghChal.view(initial, 0).choices[0].move
		const next = baghChal.apply(initial, 0, move)
		const clock = advanceClock(baghChal, initial, next, startClock(baghChal, initial, 1000), 5000)
		expect(clockSeconds(clock, 7000)).toEqual({ game: 6, round: 6, turn: 2 })
	})

	it("starts a new action timer when the same solo seat moves again", () => {
		const initial = knightsTour.setup(seededRng(1), 1)
		const first = knightsTour.apply(initial, 0, { type: "go", cell: 0 })
		const clock = advanceClock(knightsTour, initial, first, startClock(knightsTour, initial, 1000), 5000)
		expect(clockSeconds(clock, 7000)).toEqual({ game: 6, round: 6, turn: 2 })
		const second = knightsTour.apply(first, 0, { type: "go", cell: 8 })
		const nextClock = advanceClock(knightsTour, first, second, clock, 8000)
		expect(clockSeconds(nextClock, 9000)).toEqual({ game: 8, round: 8, turn: 1 })
	})

	it("freezes all elapsed times at completion and starts fresh on replay", () => {
		let state = timeAuction.setup(seededRng(1), 2)
		let clock = startClock(timeAuction, state, 1000)
		let now = 1000
		while (!timeAuction.outcome(state)) {
			const next = timeAuction.apply(state, timeAuction.toAct(state)[0], { action: "bid", value: "0" })
			now += 1000
			const previous = clock
			clock = advanceClock(timeAuction, state, next, clock, now)
			if (timeAuction.outcome(next)) expect(clock).toEqual({ ...previous, endedAt: now })
			state = next
		}
		expect(clock.endedAt).toBe(now)
		expect(clock.round).toBe("9")
		expect(clockSeconds(clock, now + 60000)).toEqual(clockSeconds(clock, now))
		const fresh = startClock(timeAuction, timeAuction.setup(seededRng(2), 2), now + 60000)
		expect(fresh.endedAt).toBeNull()
		expect(fresh.round).toBe("1")
		expect(clockSeconds(fresh, now + 60000)).toEqual({ game: 0, round: 0, turn: 0 })
	})

	it("records only the receiver's visible log, never a sealed bid or reserve", () => {
		const before = timeAuction.setup(seededRng(2), 2)
		const low = timeAuction.apply(before, 0, { action: "bid", value: "3" })
		const high = timeAuction.apply(before, 0, { action: "bid", value: "49" })
		const entry = actionEntry(timeAuction, before, low, 0, 1, 1, 2000)
		expect(entry).toEqual({ number: 1, seat: 0, round: "1", at: 2000, details: [] })
		expect(actionEntry(timeAuction, before, high, 0, 1, 1, 2000)).toEqual(entry)
		const after = timeAuction.apply(low, 1, { action: "bid", value: "0" })
		expect(actionEntry(timeAuction, low, after, 1, 0, 2, 3000).details).toEqual(timeAuction.view(after, 0).log)
	})

	it("finds appended and rotated event logs without repeating prior entries", () => {
		expect(newLogLines(["a", "b"], ["a", "b", "c"])).toEqual(["c"])
		expect(newLogLines(["a", "b"], ["b", "c"])).toEqual(["c"])
		expect(newLogLines(["a"], ["b"])).toEqual(["b"])
		expect(newLogLines(["a"], ["a"])).toEqual([])
	})
})
