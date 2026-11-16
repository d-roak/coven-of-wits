import type { ReactNode } from "react"
import {
	CalculatorIcon,
	GraphIcon,
	HexagonIcon,
	CrownIcon,
	KeyIcon,
	PuzzlePieceIcon,
	ShieldIcon,
	StrategyIcon,
} from "@phosphor-icons/react"
import { devilCatalog } from "../../shared/games/devils/catalog"
import { knightsTour } from "../../shared/games/knightsTour"
import { lastCandle } from "../../shared/games/lastCandle"
import { liarsBones } from "../../shared/games/liarsBones"
import { loneSpark } from "../../shared/games/loneSpark"
import { mindAuction } from "../../shared/games/mindAuction"
import { runeCipher } from "../../shared/games/runeCipher"
import { runeDrop } from "../../shared/games/runeDrop"
import { turncoat } from "../../shared/games/turncoat"
import { Die } from "../art/Die"
import { Poff } from "../art/Poff"
import { Rune } from "../art/Rune"
import { Candle } from "../boards/LastCandleBoard"

// Small emblem for a game card, built from that game's own pieces.
const SIGILS: Record<string, ReactNode> = {
	"nine-mens-morris": <GraphIcon weight="duotone" />,
	hexagon: <HexagonIcon weight="duotone" />,
	"equation-hi-lo": <CalculatorIcon weight="duotone" />,
	[runeDrop.id]: (
		<>
			<i className="orb seat0" />
			<i className="orb seat1" />
			<i className="orb seat0" />
		</>
	),
	[turncoat.id]: (
		<>
			<i className="orb seat1 is-big" />
			<i className="orb seat0 is-big" />
		</>
	),
	[mindAuction.id]: <span className="card is-prize">?</span>,
	[liarsBones.id]: <Die face={5} size={38} />,
	[loneSpark.id]: <span className="spark">1</span>,
	[lastCandle.id]: <Candle lit />,
	[knightsTour.id]: <Poff look="ember" size={44} />,
	[runeCipher.id]: <Rune kind={4} size={40} />,
}

export function Sigil({ gameId }: { gameId: string }) {
	const entry = devilCatalog.find((item) => item.id === gameId)
	const categoryArt = entry
		? {
				Main: <StrategyIcon weight="duotone" />,
				Prize: <PuzzlePieceIcon weight="duotone" />,
				Prison: <ShieldIcon weight="duotone" />,
				Final: <CrownIcon weight="duotone" />,
				Secret: <KeyIcon weight="duotone" />,
			}[entry.kind]
		: null
	// A game added without an emblem still gets a mascot. This is decoration, not data.
	return <span className="sigil">{SIGILS[gameId] ?? categoryArt ?? <Poff look="moss" size={44} />}</span>
}
