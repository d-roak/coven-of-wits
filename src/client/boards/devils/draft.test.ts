import { describe, expect, it } from "vitest"
import { seededRng } from "../../../shared/game"
import { seasonOneGames } from "../../../shared/games/devils/seasonOne"
import { seasonTwoGames } from "../../../shared/games/devils/seasonTwo"
import { seasonThreeGames } from "../../../shared/games/devils/seasonThree"
import type { TrialChoice, TrialForm, TrialView } from "../../../shared/games/devils/trial"
import { draftMove, draftOptions, formMove } from "./draft"

const form: TrialForm = {
	label: "Trade",
	action: "buy",
	submit: "Seal",
	format: "{0}:{1}",
	fields: [
		{ label: "Stock", kind: "select", options: [{ value: "2", label: "Thornsteel" }] },
		{ label: "Shares", kind: "number", min: 1, max: 5 },
	],
}

describe("staged move boundaries", () => {
	it("rejects missing fields, blank values, unknown selections, fractions and quantities outside bounds", () => {
		for (const values of [
			["2"],
			["", "1"],
			["3", "1"],
			["2", "1.5"],
			["2", "0"],
			["2", "6"],
			["2", "9007199254740993"],
		])
			expect(formMove(form, values)).toBeNull()
	})
	it("builds exact bounded moves and normalizes numeric browser values", () => {
		expect(formMove(form, ["2", " 5 "])).toEqual({ action: "buy", value: "2:5" })
		expect(formMove(form, ["2", "01"])).toEqual({ action: "buy", value: "2:1" })
	})
	it("rejects a malformed template rather than crashing the board", () => {
		expect(formMove({ ...form, format: "{0}:{2}" }, ["2", "1"])).toBeNull()
	})
	it("requires a complete, unambiguous allowlisted choice", () => {
		const choice: TrialChoice = {
			label: "Commit",
			move: { action: "seal", value: "3:1" },
			steps: [
				{ prompt: "Weight", key: "3", label: "3" },
				{ prompt: "Chip", key: "1", label: "Moss" },
			],
		}
		expect(draftMove([choice], ["3"])).toBeNull()
		expect(draftMove([choice], ["3", "9"])).toBeNull()
		expect(draftMove([choice, { ...choice, move: { action: "seal", value: "3:2" } }], ["3", "1"])).toBeNull()
		expect(draftMove([choice], ["3", "1"])?.move).toEqual(choice.move)
		expect(draftOptions([choice], ["3"]).map((step) => step.key)).toEqual(["1"])
	})
	it.each([...seasonOneGames, ...seasonTwoGames, ...seasonThreeGames].filter((game) => game.bot))(
		"$id rendered stage paths resolve to legal leaves throughout a game",
		(game) => {
			const random = seededRng(17)
			let state = game.setup(random, game.players.min)
			let turns = 0
			while (game.toAct(state).length) {
				expect(++turns).toBeLessThan(1000)
				const seat = game.toAct(state)[0]!
				const view = game.view(state, seat) as TrialView
				const supplied = new Set([
					...(view.forms?.map((f) => f.action) ?? []),
					...(view.selection ? [view.selection.action] : []),
					...(view.balance ? [view.balance.action] : []),
				])
				const formChoices = (view.forms ?? [])
					.filter((form) => form.steps?.length)
					.map((form, index) => ({
						label: form.label,
						steps: form.steps,
						move: { action: "choose-form", value: String(index) },
					}))
				for (const form of formChoices)
					expect(
						draftMove(
							formChoices,
							form.steps!.map((step) => step.key),
						)?.move,
					).toEqual(form.move)
				const choices = view.choices.filter((c) => c.steps?.length && !supplied.has(c.move.action))
				for (const choice of choices) {
					const path = choice.steps!.map((step) => step.key)
					const leaf = draftMove(choices, path)
					expect(leaf, `${game.id} ambiguous path ${path.join("/")}`).not.toBeNull()
					expect(leaf!.move).toEqual(choice.move)
					expect(() => game.apply(state, seat, game.parseMove(leaf!.move))).not.toThrow()
				}
				state = game.apply(state, seat, game.parseMove(game.bot!(view, seat, random)))
			}
		},
	)
})
