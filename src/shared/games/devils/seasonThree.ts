import type { AnyGame } from "../../game.js"
import type { DevilEntry } from "./trial.js"
import { seasonThreePuzzleCatalog, seasonThreePuzzleGames } from "./seasonThreePuzzles.js"
import { seasonThreeStrategyCatalog, seasonThreeStrategyGames } from "./seasonThreeStrategy.js"
import { createWallGo } from "./seasonTwoTerritory.js"

export const wallGoII = createWallGo({
	id: "wall-go-ii",
	name: "Wall Go II",
	size: 5,
	maxSteps: 3,
	wallBreaks: 2,
	blurb: "Move farther, break barriers, and enclose a smaller arcane garden.",
	rules: [
		"HOUSE VARIANT: Wall Go II has been named in Season 3, but its complete rules have not been verified. This is an original playable variant, not the show's confirmed rules.",
		"This edition uses a 5×5 board, movement up to 3 spaces, and 2 wall breaks per mage. The smaller board and longer movement create earlier territorial contests.",
	],
})

export const seasonThreeGames: AnyGame[] = [...seasonThreePuzzleGames, ...seasonThreeStrategyGames, wallGoII]
export const seasonThreeCatalog: DevilEntry[] = [
	...seasonThreePuzzleCatalog,
	...seasonThreeStrategyCatalog,
	{
		id: wallGoII.id,
		season: 3,
		kind: "Secret",
		adaptation:
			"HOUSE VARIANT. Full show rules remain unverified. Original 5×5 arena with movement 3 and 2 wall breaks; shares Wall Go's territory engine.",
		sources: [
			"https://quoridorgame.com/en/season/3/",
			"https://www.reddit.com/r/TheDevilsPlan/comments/1xt4gxh/wall_go_ii/",
		],
	},
]
