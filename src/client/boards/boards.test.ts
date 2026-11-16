import { expect, it } from "vitest"
import { games } from "../../shared/games"
import { boards } from "./index"

it("has a board for every game, and no board without a game", () => {
	expect(Object.keys(boards).sort()).toEqual(games.map((g) => g.id).sort())
})
