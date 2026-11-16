import type { AnyGame } from "../../game.js"
import type { DevilEntry } from "./trial.js"
import { balanceMancala, crookedCops, halloweenMonster, treasureIsland } from "./seasonTwoAdventures.js"
import { bigOrSmall, doubtAndBet, removeOne, timeAuction } from "./seasonTwoBids.js"
import { sniperHoldem, tripleDice } from "./seasonTwoCards.js"
import { questionAndTruth } from "./seasonTwoDeduction.js"
import { equationPyramid, findTheKey, unknown } from "./seasonTwoPuzzles.js"
import { baghChal, wallGo } from "./seasonTwoTerritory.js"
import { source } from "./seasonTwoCommon.js"

export const seasonTwoGames: readonly AnyGame[] = [
	crookedCops,
	removeOne,
	unknown,
	timeAuction,
	halloweenMonster,
	sniperHoldem,
	treasureIsland,
	tripleDice,
	balanceMancala,
	wallGo,
	doubtAndBet,
	equationPyramid,
	bigOrSmall,
	baghChal,
	questionAndTruth,
	findTheKey,
]
const entry = (game: AnyGame, kind: DevilEntry["kind"], adaptation: string, sources = [source]): DevilEntry => ({
	id: game.id,
	season: 2,
	kind,
	adaptation,
	sources,
})
export const seasonTwoCatalog: DevilEntry[] = [
	entry(
		crookedCops,
		"Main",
		"3–5 mages, one thief, up to one crooked warden, a 5×5 map and one action per turn; no team radios or accusations.",
	),
	entry(
		removeOne,
		"Prison",
		"Six rounds at 3–5 seats; retains the two-card reveal and lowest-unique choice, without the show’s elimination ladder.",
	),
	entry(
		unknown,
		"Main",
		"New 5×5 cube board, automatic recolouring, capped extra turns and 60-turn finish; no remote-control rule.",
		[source, "https://note.com/yoshiki_o/n/n1e6e9bcbb4f6?hl=en"],
	),
	entry(
		timeAuction,
		"Prison",
		"Nine sealed auctions using 60 whole-second units; replaces the 19-round, 600-second live timer.",
	),
	entry(
		halloweenMonster,
		"Main",
		"Five monsters, three weapon types, visible health and fixed two-mage covens; no trading or player attacks.",
	),
	entry(
		sniperHoldem,
		"Prison",
		"Five poker hands with sealed 1–5 chip stakes and rival-category sniping; no sequential betting or escape ladder.",
	),
	entry(
		treasureIsland,
		"Main",
		"Four auction/exploration cycles on a 5×5 map with single-step arrows, four clue boxes and persistent routes.",
	),
	entry(
		tripleDice,
		"Prison",
		"Four rounds at 2–5 seats with simultaneous three-die submissions and refreshed forecasts; retains public/private dice and score predictions.",
	),
	entry(
		balanceMancala,
		"Main",
		"2–5 seats, automatic counter placement and a 100-turn cap. Retains angel/minimum, devil/maximum and twice-minimum-minus-maximum scoring.",
		[
			"https://www.subtitlecat.com/subs/1740/The.Devil%27s.Plan.S02E09.en.html",
			"https://note.com/yoshiki_o/n/n82b392022990?hl=en",
		],
	),
	entry(
		wallGo,
		"Prison",
		"7×7 arena at 2–5 seats, fixed starting positions, optional staying and an 80-turn limit; contested land splits at the limit.",
	),
	entry(
		doubtAndBet,
		"Main",
		"Twelve showdowns with fixed 1-chip wagers, wild colours and shrinking card slots; no raise, fold or slot repurchase.",
	),
	entry(
		equationPyramid,
		"Prison",
		"Five tile boards with alternating turns and six claims per board; replaces the show’s buzzers and timers.",
	),
	entry(
		bigOrSmall,
		"Final",
		"Eighteen alternating card/wager rounds, bets capped at five chips, randomly drawn dealer cards and no enforced deadline.",
	),
	entry(baghChal, "Final", "One 5×5 tiger-and-goat board rather than two mirrored boards; draws after 120 moves."),
	entry(
		questionAndTruth,
		"Final",
		"Randomly dealt ordered secrets, automatic truthful answers, refunded tied bids and a 60-auction draw limit.",
		[source, "https://note.com/yoshiki_o/n/n0d78db52640a?hl=en"],
	),
	entry(
		findTheKey,
		"Secret",
		"Text riddle and illustrated-word initials with a typed rune lock; randomized pictures and three mistakes replace the physical well and timer.",
	),
]
