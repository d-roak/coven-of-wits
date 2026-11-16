import { expect, it } from "vitest"
import { selectGames } from "./verify-online"

it("selects a registered multiplayer trial and rejects unsupported command arguments", () => {
	expect(selectGames(["--game", "nine-mens-morris"]).map((game) => game.id)).toEqual(["nine-mens-morris"])
	for (const args of [["--game", "hexagon"], ["--game", "missing"], ["--url", "https://example.com"], ["--game"]]) {
		expect(() => selectGames(args)).toThrow()
	}
})
