import type { AnyGame } from "../game"
import { seasonOneGames } from "./devils/seasonOne"
import { seasonThreeGames } from "./devils/seasonThree"
import { seasonTwoGames } from "./devils/seasonTwo"
import { equationHiLo } from "./equationHiLo"
import { hexagon } from "./hexagon"
import { nineMensMorris } from "./nineMensMorris"
import { knightsTour } from "./knightsTour"
import { lastCandle } from "./lastCandle"
import { liarsBones } from "./liarsBones"
import { loneSpark } from "./loneSpark"
import { mindAuction } from "./mindAuction"
import { runeCipher } from "./runeCipher"
import { runeDrop } from "./runeDrop"
import { turncoat } from "./turncoat"

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
