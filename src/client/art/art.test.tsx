import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { games } from "../../shared/games"
import { LangProvider } from "../i18n"
import { Piece } from "../boards/devils/Piece"
import { BESPOKE, gamePieces } from "../screens/kitInventory"
import { GLYPH_NAMES, Glyph } from "./Glyph"
import { PIPS } from "./PlayingCard"

it("draws a different picture for every glyph name", () => {
	const drawings = GLYPH_NAMES.map((name) => renderToStaticMarkup(<Glyph name={name} />))
	expect(new Set(drawings).size).toBe(GLYPH_NAMES.length)
})

it("lays out as many pips as the rank says", () => {
	for (const [rank, pips] of Object.entries(PIPS)) expect(pips.length, rank).toBe(Number(rank))
})

it("renders every piece the engines put on the table", () => {
	const drawn = games.filter((game) => !BESPOKE[game.id]).flatMap((game) => gamePieces(game))
	expect(new Set(drawn.map((piece) => piece.kind))).toEqual(
		new Set(["card", "back", "die", "tile", "token", "shape", "stack", "portrait"]),
	)
	for (const piece of drawn)
		expect(
			() =>
				renderToStaticMarkup(
					<LangProvider>
						<Piece piece={piece} />
					</LangProvider>,
				),
			JSON.stringify(piece),
		).not.toThrow()
})
