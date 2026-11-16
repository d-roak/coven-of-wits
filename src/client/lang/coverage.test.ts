import { describe, expect, it } from "vitest"
import { games } from "../../shared/games"
import { BESPOKE } from "../screens/kitInventory"
import { gameText } from "./collect"
import { localise, translator } from "./engineText"
import { conflicts, ko } from "./ko"
import { KEEP } from "./ko/keep"

const translate = translator(ko)
/** What is still English after translation, with the allowed English taken out. */
const leftover = (text: string) =>
	KEEP.reduce((rest, keep) => rest.replace(keep, ""), translate(text)).match(/[A-Za-z]{2,}/g)

it("translates each template one way only", () => {
	expect(conflicts).toEqual([])
})

describe("Korean covers everything the games say", () => {
	it.each(games.map((game) => [game.id, game] as const))("%s", (_, game) => {
		const missing = gameText(game, !BESPOKE[game.id]).filter((text) => leftover(text))
		expect(missing, `${missing.length} untranslated`).toEqual([])
	})
})

it("translates the words in a view and leaves its moves and round label for the engine and tracker", () => {
	const view = {
		prompt: "Skip",
		round: { label: "Round", current: 1 },
		choices: [{ label: "Skip", move: { action: "Skip", value: "Skip" } }],
	}
	const out = localise(view, translate)
	expect(out.prompt).not.toBe("Skip")
	expect(out.choices[0]!.label).not.toBe("Skip")
	expect(out.round).toEqual(view.round)
	expect(out.choices[0]!.move).toEqual(view.choices[0]!.move)
})
