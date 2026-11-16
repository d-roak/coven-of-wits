import type { ComponentType } from "react"
import { seasonOneGames } from "../../shared/games/devils/seasonOne"
import { seasonThreeGames } from "../../shared/games/devils/seasonThree"
import { seasonTwoGames } from "../../shared/games/devils/seasonTwo"
import { TrialBoard } from "./devils/TrialBoard"
import { equationHiLo } from "../../shared/games/equationHiLo"
import { hexagon } from "../../shared/games/hexagon"
import { nineMensMorris } from "../../shared/games/nineMensMorris"
import { EquationHiLoBoard } from "./EquationHiLoBoard"
import { HexagonBoard } from "./HexagonBoard"
import { NineMensMorrisBoard } from "./NineMensMorrisBoard"
import { knightsTour } from "../../shared/games/knightsTour"
import { lastCandle } from "../../shared/games/lastCandle"
import { liarsBones } from "../../shared/games/liarsBones"
import { loneSpark } from "../../shared/games/loneSpark"
import { mindAuction } from "../../shared/games/mindAuction"
import { runeCipher } from "../../shared/games/runeCipher"
import { runeDrop } from "../../shared/games/runeDrop"
import { turncoat } from "../../shared/games/turncoat"
import { KnightsTourBoard } from "./KnightsTourBoard"
import { LastCandleBoard } from "./LastCandleBoard"
import { LiarsBonesBoard } from "./LiarsBonesBoard"
import { LoneSparkBoard } from "./LoneSparkBoard"
import { MindAuctionBoard } from "./MindAuctionBoard"
import { RuneCipherBoard } from "./RuneCipherBoard"
import { RuneDropBoard } from "./RuneDropBoard"
import { TurncoatBoard } from "./TurncoatBoard"
import type { BoardProps } from "./types"

type AnyBoard = ComponentType<BoardProps<unknown, unknown>>

// The one place view types are erased. The key is what ties a board to the game whose views it gets,
// so each entry is keyed by that game's own id rather than a string typed twice.
export const boards: Record<string, AnyBoard> = {
	...Object.fromEntries(seasonOneGames.map((game) => [game.id, TrialBoard as AnyBoard])),
	...Object.fromEntries(seasonTwoGames.map((game) => [game.id, TrialBoard as AnyBoard])),
	...Object.fromEntries(seasonThreeGames.map((game) => [game.id, TrialBoard as AnyBoard])),
	[equationHiLo.id]: EquationHiLoBoard as AnyBoard,
	[hexagon.id]: HexagonBoard as AnyBoard,
	[nineMensMorris.id]: NineMensMorrisBoard as AnyBoard,
	[runeDrop.id]: RuneDropBoard as AnyBoard,
	[turncoat.id]: TurncoatBoard as AnyBoard,
	[mindAuction.id]: MindAuctionBoard as AnyBoard,
	[liarsBones.id]: LiarsBonesBoard as AnyBoard,
	[loneSpark.id]: LoneSparkBoard as AnyBoard,
	[lastCandle.id]: LastCandleBoard as AnyBoard,
	[knightsTour.id]: KnightsTourBoard as AnyBoard,
	[runeCipher.id]: RuneCipherBoard as AnyBoard,
}
