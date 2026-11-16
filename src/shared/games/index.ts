import type { AnyGame } from "../game.js"
import { seasonOneGames } from "./devils/seasonOne.js"
import { seasonThreeGames } from "./devils/seasonThree.js"
import { seasonTwoGames } from "./devils/seasonTwo.js"
import { equationHiLo } from "./equationHiLo.js"
import { hexagon } from "./hexagon.js"
import { nineMensMorris } from "./nineMensMorris.js"
import { knightsTour } from "./knightsTour.js"
import { lastCandle } from "./lastCandle.js"
import { liarsBones } from "./liarsBones.js"
import { loneSpark } from "./loneSpark.js"
import { mindAuction } from "./mindAuction.js"
import { runeCipher } from "./runeCipher.js"
import { runeDrop } from "./runeDrop.js"
import { turncoat } from "./turncoat.js"

/** Add a game here and give it a board in src/client/boards/index.ts. Nothing else needs to know. */
export const games: readonly AnyGame[] = [
	...seasonOneGames,
	...seasonTwoGames,
	...seasonThreeGames,
	nineMensMorris,
	hexagon,
	equationHiLo,
	runeDrop,
	turncoat,
	mindAuction,
	liarsBones,
	loneSpark,
	lastCandle,
	knightsTour,
	runeCipher,
]

export function findGame(id: string): AnyGame | undefined {
	return games.find((g) => g.id === id)
}
