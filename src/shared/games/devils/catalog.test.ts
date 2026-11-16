import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../../game"
import { games } from "../index"
import { devilCatalog } from "./catalog"
import type { TrialView } from "./trial"

const existingBoards = new Set(["nine-mens-morris", "hexagon", "equation-hi-lo", "knights-tour"])
const expectedCatalog = {
	1: [
		"virus-game",
		"cooperative-puzzle",
		"rules-race",
		"fragments-of-memory",
		"secret-number",
		"word-tower",
		"zoo",
		"scale-game",
		"laying-grass",
		"montage",
		"equation-hi-lo",
		"four-player-three-in-a-row",
		"nine-mens-morris",
		"hexagon",
		"dice-poker",
		"blind-gomoku",
	],
	2: [
		"crooked-cops",
		"remove-one",
		"unknown",
		"time-auction",
		"halloween-monster",
		"sniper-holdem",
		"treasure-island",
		"triple-dice",
		"balance-mancala",
		"wall-go",
		"doubt-and-bet",
		"equation-pyramid",
		"big-or-small",
		"bagh-chal",
		"question-and-truth",
		"knights-tour",
		"find-the-key",
	],
	3: [
		"count-the-cubes",
		"count-the-rectangles",
		"lay-the-grass",
		"memory-poker",
		"heavy-13",
		"mystery-stock-market",
		"russian-roulette",
		"wall-go-ii",
	],
} as const
const trials = () =>
	games.filter((game) => devilCatalog.some((entry) => entry.id === game.id) && !existingBoards.has(game.id))

describe("complete Devil’s Plan catalog", () => {
	it("covers the named games in seasons 1 and 2 and the released season 3 games", () => {
		expect([1, 2, 3].map((season) => devilCatalog.filter((entry) => entry.season === season).length)).toEqual([
			16, 17, 8,
		])
		for (const season of [1, 2, 3] as const)
			expect(
				devilCatalog
					.filter((entry) => entry.season === season)
					.map((entry) => entry.id)
					.sort(),
			).toEqual([...expectedCatalog[season]].sort())
		expect(new Set(devilCatalog.map((entry) => entry.id)).size).toBe(devilCatalog.length)
		for (const entry of devilCatalog) {
			expect(
				games.find((game) => game.id === entry.id),
				entry.id,
			).toBeDefined()
			expect(entry.sources.length, entry.id).toBeGreaterThan(0)
		}
	})
	it("rejects malformed and unknown commands at every new game boundary", () => {
		for (const game of trials()) {
			const state = game.setup(seededRng(42), game.players.min)
			const seat = game.toAct(state)[0]
			expect(() => game.parseMove({ action: "anything", value: "", extra: true }), game.id).toThrow(IllegalMove)
			expect(
				() => game.apply(state, seat, game.parseMove({ action: "not-a-game-action", value: "" })),
				game.id,
			).toThrow(IllegalMove)
		}
	})
	it("offers only executable board moves and choices, without changing the old state", () => {
		for (const game of trials()) {
			const rng = seededRng(73)
			let state = game.setup(rng, game.players.min)
			for (let step = 0; step < 6 && game.toAct(state).length; step++) {
				const seat = game.toAct(state)[0]
				const view = game.view(state, seat) as TrialView
				const moves = [
					...view.choices.map((choice) => choice.move),
					...(view.board?.cells.flatMap((cell) => (cell.move ? [cell.move] : [])) ?? []),
				]
				const before = JSON.stringify(state)
				for (const move of moves) {
					expect(
						() => game.apply(state, seat, game.parseMove(move)),
						`${game.id}: ${move.action} ${move.value}`,
					).not.toThrow()
					expect(JSON.stringify(state), `${game.id} mutated its old state`).toBe(before)
				}
				if (!game.bot && moves.length === 0) break
				const move = game.bot ? game.bot(view, seat, rng) : moves[0]
				state = game.apply(state, seat, game.parseMove(move))
			}
		}
	})
	it("reports rounds in the round field, in range, never as text in the title or prompt", () => {
		for (const game of trials()) {
			const rng = seededRng(11)
			let state = game.setup(rng, game.players.min)
			for (let step = 0; step < 40 && game.toAct(state).length && game.bot; step++) {
				const seat = game.toAct(state)[0]
				const view = game.view(state, seat) as TrialView
				expect(`${view.phase} ${view.prompt}`, game.id).not.toMatch(/\d+ of \d+/)
				if (view.round) {
					expect(view.round.current, game.id).toBeGreaterThanOrEqual(1)
					if (view.round.total !== undefined) expect(view.round.current, game.id).toBeLessThanOrEqual(view.round.total)
				}
				state = game.apply(state, seat, game.parseMove(game.bot(view, seat, rng)))
			}
		}
	})
})
