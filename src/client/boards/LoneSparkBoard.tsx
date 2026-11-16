import { SealCheckIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { type LoneSparkMove, type LoneSparkView, ROUNDS, SPARKS, type SparkRound } from "../../shared/games/loneSpark"
import { useLang } from "../i18n"
import { type BoardProps, useLinger, who } from "./types"

// How long the revealed picks stay up before the next round opens.
const REVEAL_MS = 2600

function roundLine(round: SparkRound, names: string[], me: number): string {
	if (round.winner === null) return "Every spark fizzled. Nobody scores."
	return `${who(names, round.winner, me)} held the lone ${round.picks[round.winner]} and scored it.`
}

export function LoneSparkBoard({ view, seat, names, canAct, onMove }: BoardProps<LoneSparkView, LoneSparkMove>) {
	const { tx } = useLang()
	const last = view.history.at(-1)
	const revealing = useLinger(view.history.length, REVEAL_MS) && last !== undefined
	const shown = revealing ? last : undefined
	const round = Math.min(view.history.length + (revealing ? 0 : 1), ROUNDS)
	// A pick is final once sent, so a tap only lifts the spark. Tagged with its round so it clears itself.
	const [lifted, setLifted] = useState<{ round: number; spark: number } | null>(null)
	const draft = lifted?.round === view.history.length && view.myPick === null ? lifted.spark : null
	const fizzled = (pick: number) => shown !== undefined && shown.picks.filter((p) => p === pick).length > 1

	return (
		<div className="ls">
			<p className="tally">{tx(`Round ${round} of ${ROUNDS}`)}</p>
			<div className="ls-seats">
				{names.map((_, i) => (
					<div key={i} className={`ls-seat seat${i}`}>
						{shown ? (
							<span
								className={`spark is-flipping ${shown.winner === i ? "is-winning" : ""} ${fizzled(shown.picks[i]!) ? "is-fizzled" : ""}`}
							>
								{shown.picks[i]}
							</span>
						) : i === seat && view.myPick !== null ? (
							<span className="spark is-placed">{view.myPick}</span>
						) : i === seat && draft !== null ? (
							<span key={draft} className="spark is-ghost is-placed">
								{draft}
							</span>
						) : view.picked[i] ? (
							<span className="spark is-sealed is-placed" aria-label={tx(`${names[i]} has picked`)} />
						) : (
							<span className="spark is-empty" />
						)}
						<span className="ls-name">{i === seat ? tx("You") : names[i]}</span>
						<b key={view.scores[i]} className="ls-score">
							{view.scores[i]}
						</b>
					</div>
				))}
			</div>

			<p key={view.history.length} className="ma-last">
				{tx(
					last
						? roundLine(last, names, seat)
						: "Lift a spark, then lock it in. The lowest one nobody else picked scores.",
				)}
			</p>

			<div className="ls-picks">
				{Array.from({ length: SPARKS }, (_, i) => i + 1).map((spark) => (
					<button
						key={spark}
						className={`spark is-key ${spark === (view.myPick ?? draft) && !revealing ? "is-chosen" : ""}`}
						disabled={!canAct || revealing}
						onClick={() => setLifted({ round: view.history.length, spark })}
						aria-pressed={spark === draft}
						aria-label={tx(`Spark ${spark}`)}
					>
						{spark}
					</button>
				))}
			</div>
			{view.myPick !== null && !revealing && (
				<p role="status">{tx(`Your ${view.myPick} is locked. Waiting for the other sparks.`)}</p>
			)}
			{canAct && !revealing && (
				<button className="btn" disabled={draft === null} onClick={() => draft !== null && onMove({ spark: draft })}>
					<SealCheckIcon weight="fill" /> {tx(draft === null ? "Lift a spark to pick" : `Lock in the ${draft}`)}
				</button>
			)}

			{view.history.length > 0 && (
				<ol className="ls-history" aria-label={tx("Past rounds")}>
					{view.history.map((past, i) => (
						<li key={i} className={past.winner === null ? "" : `seat${past.winner}`}>
							{past.winner === null ? "–" : past.picks[past.winner]}
						</li>
					))}
				</ol>
			)}
		</div>
	)
}
