import { type CSSProperties, useState } from "react"
import { SealCheckIcon } from "@phosphor-icons/react"
import type { AuctionRound, MindAuctionMove, MindAuctionView } from "../../shared/games/mindAuction"
import { useLang } from "../i18n"
import { type BoardProps, useLinger, who } from "./types"

// How long the turned-over bids stay on the table before the next prize comes up.
const REVEAL_MS = 2400

function roundLine(round: AuctionRound, names: string[], me: number): string {
	if (round.winner === null) return `The top bids tied. ${round.prize} points roll over.`
	const name = who(names, round.winner, me)
	return `${name} took ${round.prize} with a ${round.bids[round.winner]}.`
}

export function MindAuctionBoard({ view, seat, names, canAct, onMove }: BoardProps<MindAuctionView, MindAuctionMove>) {
	const { tx } = useLang()
	const last = view.history.at(-1)
	// While this is true the table still shows the round that just ended, bids face up.
	const revealing = useLinger(view.history.length, REVEAL_MS) && last !== undefined
	const shown = revealing ? last : undefined
	// A sealed bid cannot be taken back, so a tap only lifts the card. Tagged with its round so it clears itself.
	const [lifted, setLifted] = useState<{ round: number; card: number } | null>(null)
	const draft = lifted?.round === view.history.length && view.myBid === null ? lifted.card : null
	const rivals = names.map((_, i) => i).filter((i) => i !== seat)

	return (
		<div className="ma">
			<div className="ma-rivals">
				{rivals.map((r) => (
					<div key={r} className={`ma-rival seat${r}`}>
						<span className="ma-score">
							{names[r]} <b key={view.scores[r]}>{view.scores[r]}</b>
						</span>
						<div className="ma-hand is-small" aria-label={tx(`Cards ${names[r]} still holds`)}>
							{view.hands[r]!.map((card) => (
								<span key={card} className="card">
									{card}
								</span>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="ma-table">
				<div className="ma-slot">
					{shown ? (
						<span className="card is-prize is-spent">{shown.prize}</span>
					) : view.prize === null ? (
						<span className="card is-empty" />
					) : (
						<span
							key={view.roundsLeft}
							className="card is-prize"
							aria-label={tx(`Prize: ${view.prize + view.pot} points`)}
						>
							{view.prize + view.pot}
						</span>
					)}
					<small>
						{tx(
							shown
								? "Last prize"
								: view.prize === null
									? "No prizes left"
									: view.pot > 0
										? `${view.prize} prize + ${view.pot} rolled over`
										: `Prize, ${view.roundsLeft} left`,
						)}
					</small>
				</div>
				{names.map((_, i) => (
					<div key={i} className={`ma-slot seat${i}`}>
						{shown ? (
							<span className={`card is-flipping ${shown.winner === i ? "is-winning" : ""}`}>{shown.bids[i]}</span>
						) : i === seat && view.myBid !== null ? (
							<span className="card is-placed">{view.myBid}</span>
						) : i === seat && draft !== null ? (
							<span key={draft} className="card is-ghost is-placed">
								{draft}
							</span>
						) : view.sealed[i] ? (
							<span className="card is-back is-placed" aria-label={tx(`${names[i]} has bid`)} />
						) : (
							<span className="card is-empty" />
						)}
						<small>{i === seat ? tx("You") : names[i]}</small>
					</div>
				))}
			</div>

			<p key={view.history.length} className="ma-last">
				{tx(last ? roundLine(last, names, seat) : "Lift a card, then seal it. Nobody sees it until everyone has bid.")}
			</p>

			<div className={`ma-rival seat${seat}`}>
				<span className="ma-score">
					{tx("You")} <b key={view.scores[seat]}>{view.scores[seat]}</b>
				</span>
				<div className="ma-hand">
					{view.hands[seat]!.map((card, i) => (
						<button
							key={card}
							className={`card ${card === (view.myBid ?? draft) && !revealing ? "is-chosen" : ""}`}
							style={{ "--i": i } as CSSProperties}
							disabled={!canAct || revealing}
							onClick={() => setLifted({ round: view.history.length, card })}
							aria-pressed={card === draft}
							aria-label={tx(`Card ${card}`)}
						>
							{card}
						</button>
					))}
				</div>
				{view.myBid !== null && !revealing && (
					<p role="status">{tx(`Your ${view.myBid} is sealed. Waiting for the other bids.`)}</p>
				)}
				{canAct && !revealing && (
					<button className="btn" disabled={draft === null} onClick={() => draft !== null && onMove({ card: draft })}>
						<SealCheckIcon weight="fill" /> {tx(draft === null ? "Lift a card to bid" : `Seal the ${draft}`)}
					</button>
				)}
			</div>
		</div>
	)
}
