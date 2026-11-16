import type { AnyGame } from "../../game.js"
import type { DevilEntry } from "./trial.js"
import { cooperativePuzzle, fragmentsOfMemory, montage, scaleGame, wordTower } from "./seasonOnePuzzles.js"
import { blindGomoku, fourPlayerThree, layingGrass } from "./seasonOneSpatial.js"
import { dicePoker, rulesRace, secretNumber, zoo } from "./seasonOneTables.js"
import { virusGame } from "./seasonOneVirus.js"

export const seasonOneGames: readonly AnyGame[] = [
	virusGame,
	cooperativePuzzle,
	rulesRace,
	fragmentsOfMemory,
	secretNumber,
	wordTower,
	zoo,
	scaleGame,
	layingGrass,
	montage,
	fourPlayerThree,
	blindGomoku,
	dicePoker,
]
const overview = "https://www.dexerto.com/tv-movies/the-devils-plan-games-explained-2310672/"
export const seasonOneCatalog: readonly DevilEntry[] = [
	{
		id: "virus-game",
		season: 1,
		kind: "Main",
		adaptation:
			"Five roles, simultaneous actions and eight rounds; omits the Fanatic, extra terrorists/researchers/citizens and individual Piece payouts.",
		sources: [
			"https://www.springfieldspringfield.co.uk/view_episode_scripts.php?episode=s01e01&tv-show=the-devils-plan-2023",
		],
	},
	{
		id: "cooperative-puzzle",
		season: 1,
		kind: "Prize",
		adaptation: "Solo T-tetromino silhouette puzzle with rotation and undo; one board, no carousel or timer.",
		sources: [overview],
	},
	{
		id: "rules-race",
		season: 1,
		kind: "Main",
		adaptation:
			"2–5 players on a 20-space track with three personal/shared rule choices; no free-form blocks, special die or ticket trading.",
		sources: ["https://www.subtitlecat.com/subs/966/The.Devils.Plan.S01E03.720p.WEB.h264-EDITH_track3_%5Beng%5D.html"],
	},
	{
		id: "fragments-of-memory",
		season: 1,
		kind: "Prize",
		adaptation:
			"Solo arcana-shelf memory with five spatial questions; replaces the photograph, ten questions and cooperative relay.",
		sources: [overview],
	},
	{
		id: "secret-number",
		season: 1,
		kind: "Main",
		adaptation:
			"2–5 players, private numeric clues and sealed scoring; four turns each, no mutual-ticket consent, extra purchases or prison bets.",
		sources: ["https://www.subtitlecat.com/subs/966/The.Devils.Plan.S01E05.720p.WEB.h264-EDITH_track3_%5Beng%5D.html"],
	},
	{
		id: "word-tower",
		season: 1,
		kind: "Prize",
		adaptation:
			"Solo three-word animal puzzle with a finite letter bank and listed dictionary; no timed relay or physical stacking.",
		sources: [overview],
	},
	{
		id: "zoo",
		season: 1,
		kind: "Main",
		adaptation:
			"Keeps secret patterns, lower-total pack auctions and placement order; six rounds with a seeded center and explicit house tie rules.",
		sources: [overview],
	},
	{
		id: "scale-game",
		season: 1,
		kind: "Prize",
		adaptation:
			"Solo scale with unlimited calibration cubes, one known 1 g weight and 20 comparisons; replaces separate rooms and cube limits.",
		sources: [overview],
	},
	{
		id: "laying-grass",
		season: 1,
		kind: "Main",
		adaptation:
			"Shared 10×10 polyomino territory, eight patches per mage, largest-square score; exchange wells replace robbery and stone powers.",
		sources: [overview],
	},
	{
		id: "montage",
		season: 1,
		kind: "Prize",
		adaptation:
			"Solo five-round portrait memory using familiar/cloak/sigil descriptions and manual advance, replacing timed photographs and buzzers.",
		sources: [
			"https://www.springfieldspringfield.co.uk/view_episode_scripts.php?episode=s01e09&tv-show=the-devils-plan-2023",
		],
	},
	{
		id: "four-player-three-in-a-row",
		season: 1,
		kind: "Prize",
		adaptation:
			"Four-way stacking contest with five stones per mage; omits hidden fourth-player identity and cooperative four-match mission; 160-turn draw cap.",
		sources: ["https://www.printables.com/model/866727-four-player-connect-3"],
	},
	{
		id: "blind-gomoku",
		season: 1,
		kind: "Secret",
		adaptation:
			"9×9 duel with sealed owners, latest-stone visibility and automatic five-in-a-row checks; no entry-code puzzle or Piece wager.",
		sources: [overview],
	},
	{
		id: "dice-poker",
		season: 1,
		kind: "Final",
		adaptation:
			"HOUSE RULES. Announced but never played on screen. Standard five-dice poker with two rerolls, five rounds and no betting; official show rules are unknown.",
		sources: [overview],
	},
]
