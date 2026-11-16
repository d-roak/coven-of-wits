import type { DevilEntry } from "./trial"
import { seasonOneCatalog } from "./seasonOne"
import { seasonThreeCatalog } from "./seasonThree"
import { seasonTwoCatalog } from "./seasonTwo"

export const devilCatalog: readonly DevilEntry[] = [
	...seasonOneCatalog,
	...seasonTwoCatalog,
	...seasonThreeCatalog,
	{
		id: "nine-mens-morris",
		season: 1,
		kind: "Final",
		adaptation: "One classic duel, including flying at 3 stones and repetition draws.",
		sources: ["https://raft.net/wp-content/uploads/2019/03/244-Nine-Mens-Morris.pdf"],
	},
	{
		id: "hexagon",
		season: 1,
		kind: "Final",
		adaptation: "Solo recall puzzle with a manual study phase, contiguous straight triples, and 3 mistakes allowed.",
		sources: ["https://www.heeyeonlee.com/playground/hexagon"],
	},
	{
		id: "equation-hi-lo",
		season: 1,
		kind: "Main",
		adaptation: "Five simultaneous rounds. Uses +, − and ÷; no wagering or special operators.",
		sources: [
			"https://www.springfieldspringfield.co.uk/view_episode_scripts.php?episode=s01e10&tv-show=the-devils-plan-2023",
		],
	},
	{
		id: "knights-tour",
		season: 2,
		kind: "Secret",
		adaptation: "A 6×6 solo board with undo. The show also used larger boards and a timer.",
		sources: ["https://www.dexerto.com/tv-movies/the-devils-plan-season-2-winners-eliminations-match-results-3190302/"],
	},
]

export const devilIds = new Set(devilCatalog.map((entry) => entry.id))
