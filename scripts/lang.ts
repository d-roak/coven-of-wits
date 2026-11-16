// Lists what a game says that Korean does not cover yet: pnpm lang zoo sniper-holdem
import { gameText } from "../src/client/lang/collect"
import { translator } from "../src/client/lang/engineText"
import { ko } from "../src/client/lang/ko"
import { KEEP } from "../src/client/lang/ko/keep"
import { BESPOKE } from "../src/client/screens/kitInventory"
import { games } from "../src/shared/games"

const translate = translator(ko)
const ids = process.argv.slice(2)
const unknown = ids.filter((id) => !games.some((game) => game.id === id))
if (unknown.length)
	throw new Error(`Unknown game: ${unknown.join(", ")}. Known: ${games.map((game) => game.id).join(", ")}`)
let total = 0
for (const game of games.filter((game) => !ids.length || ids.includes(game.id))) {
	const all = gameText(game, !BESPOKE[game.id])
	const missing = all.filter((text) =>
		KEEP.reduce((rest, keep) => rest.replace(keep, ""), translate(text)).match(/[A-Za-z]{2,}/),
	)
	total += missing.length
	console.log(`\n## ${game.id}: ${missing.length} of ${all.length} untranslated`)
	if (ids.length)
		for (const text of missing) console.log(JSON.stringify(text), "\n   →", JSON.stringify(translate(text)))
}
console.log(`\n${total} untranslated in all`)
