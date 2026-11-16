import { expect, it } from "vitest"
import { games } from "../shared/games"
import { GAMES_KO, translate } from "./i18n"

it("has a Korean name and blurb for every game, and none for a game that is gone", () => {
	expect(Object.keys(GAMES_KO).sort()).toEqual(games.map((game) => game.id).sort())
})

it("fills placeholders and refuses a missing value", () => {
	expect(translate("ko", "catalog.season", { n: 2 })).toContain("2")
	expect(() => translate("en", "catalog.season")).toThrow()
})
