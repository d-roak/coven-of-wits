/**
 * English that stays English in Korean, each with its reason. The coverage test strips these
 * before it looks for untranslated words, so keep the list short and specific.
 */
export const KEEP: RegExp[] = [
	// Card ranks printed on the cards.
	/\b[AJQK]\b/g,
	// Word Tower: the English animal names players spell from letter tiles.
	/\b(?:CROW|WOLF|TOAD|MOTH|LAMB|BEAR|HARE|DEER|IBIS|LYNX)\b/g,
	// Scale Game: comparison log lines are stacks of the stone letters A–E, such as "AAB > CD".
	/\b[A-E]{1,20} [=<>] [A-E]{1,20}\b/g,
	// Wall Go II: the Roman numeral in the Korean game name, "벽 바둑 II", as the catalogue spells it.
	/(?<=벽 바둑 )II\b/g,
	// Find the Key: the player spells this phrase from the first letters of the English picture names.
	/FIND THE KEY/g,
	// Find the Key: the picture names, alone on a label or leading the log line "Fox 그림으로 룬 3 추가."
	/\b(?:Fox|Ink|Nest|Deer|Torch|Hat|Elm|Key|Yak|Moon|Owl|Bat)(?=$| 그림으로)/g,
]
