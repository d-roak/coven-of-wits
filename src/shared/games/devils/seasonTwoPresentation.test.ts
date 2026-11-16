import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../../game"
import { seasonTwoGames } from "./seasonTwo"
import type { TrialView } from "./trial"

describe("Season 2 table controls", () => {
	for (const game of seasonTwoGames) {
		it(`${game.id} gives physical items and legal staged controls`, () => {
			const rng = seededRng(71)
			let state = game.setup(rng, game.players.min)
			let physical = false
			for (let turn = 0; turn < 1000 && !game.outcome(state); turn++) {
				const seat = game.toAct(state)[0]
				const v = game.view(state, seat) as TrialView
				physical ||=
					!!v.displays?.some((d) => d.items.length) ||
					!!v.board?.cells.some((c) => c.piece) ||
					!!v.choices.some((c) => c.piece) ||
					!!v.selection?.options.some((o) => o.piece)
				const paths = v.choices.filter((c) => c.steps).map((c) => c.steps!.map((step) => step.key).join("/"))
				expect(new Set(paths).size).toBe(paths.length)
				for (const choice of v.choices.filter((c) => c.steps)) {
					expect(choice.steps!.length).toBeGreaterThan(0)
					expect(() => game.apply(state, seat, choice.move)).not.toThrow()
				}
				for (const form of v.forms ?? []) {
					if (form.fields.length !== 1 || form.format !== "{0}") continue
					const field = form.fields[0]
					for (const value of [field.min, field.max]) {
						if (value === undefined) continue
						expect(() => game.apply(state, seat, { action: form.action, value: String(value) })).not.toThrow()
					}
					const maximum = field.max
					if (maximum !== undefined)
						expect(() => game.apply(state, seat, { action: form.action, value: String(maximum + 1) })).toThrow(
							IllegalMove,
						)
				}
				state = game.apply(state, seat, game.bot!(v, seat, rng))
				const history = (game.view(state, seat) as TrialView).log
				expect(history.slice(0, v.log.length)).toEqual(v.log)
			}
			expect(game.outcome(state)).not.toBeNull()
			expect(physical).toBe(true)
		})
	}
})
