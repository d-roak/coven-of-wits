import { merge } from "../engineText"
import { chrome } from "./chrome"
import { classics } from "./classics"
import { common } from "./common"
import { seasonOneTables } from "./seasonOneTables"
import { seasonOnePuzzles } from "./seasonOnePuzzles"
import { seasonTwoBoards } from "./seasonTwoBoards"
import { seasonTwoBids } from "./seasonTwoBids"
import { seasonThree } from "./seasonThree"

/** Every Korean dictionary, one file per group of games. Earlier files win a clash; `conflicts` lists them. */
export const { all: ko, conflicts } = merge(
	common,
	chrome,
	classics,
	seasonOneTables,
	seasonOnePuzzles,
	seasonTwoBoards,
	seasonTwoBids,
	seasonThree,
)
