import { ArrowCounterClockwiseIcon, ArrowLeftIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { Poff, type PoffMood, seatLook } from "../art/Poff"
import { boards } from "../boards"
import { useLang } from "../i18n"
import type { GameSession } from "../session/types"
import { TableChat } from "./TableChat"
import { TableClock } from "./TableClock"
import { TableHistory } from "./TableHistory"
import "./tableTools.css"
import { ShareButton } from "../community/ShareButton"

/** Null when there is nothing worth saying: a solo puzzle in progress. */
function statusLine(
	{ game, outcome, seat, names, toAct }: GameSession,
	t: ReturnType<typeof useLang>["t"],
): string | null {
	const solo = game.players.max === 1
	if (outcome) {
		const { winners } = outcome
		if (solo) return winners.includes(0) ? t("status.solved") : t("status.failed")
		if (winners.length === 0) return names.length > 2 ? t("status.nobody") : t("status.draw")
		if (winners.includes(seat)) return winners.length > 1 ? t("status.youShare") : t("status.youWin")
		return t(winners.length > 1 ? "status.win" : "status.wins", {
			names: winners.map((w) => names[w]).join(t("status.and")),
		})
	}
	if (solo) return null
	if (toAct.includes(seat)) return t("status.yourMove")
	return toAct.length === 1 ? t("status.waitingFor", { name: names[toAct[0]!]! }) : t("status.waiting")
}

/** The play screen for any game and any kind of session. */
export function Table({ session, onExit }: { session: GameSession; onExit(): void }) {
	const [boardRevision, setBoardRevision] = useState(0)
	const { game, seat, names, outcome, toAct, again } = session
	const playAgain = () => {
		again?.run()
		// A fresh local game must discard drafts even if its opening phase matches the previous game.
		if (session.canRestart) setBoardRevision((revision) => revision + 1)
	}
	const Board = boards[game.id]
	if (!Board) throw new Error(`No board registered for game "${game.id}". Add one in src/client/boards/index.ts.`)

	const mood = (who: number): PoffMood => {
		if (outcome) return outcome.winners.includes(who) ? "happy" : outcome.winners.length === 0 ? "idle" : "sad"
		return toAct.includes(who) ? "think" : "idle"
	}
	const { t, tx, game: local } = useLang()
	const status = statusLine(session, t)

	return (
		<main
			className="table"
			data-game-id={game.id}
			data-game-round={session.clock.round}
			data-game-moves={session.activity.at(-1)?.number ?? 0}
		>
			<header className="bar">
				<button className="btn is-ghost" onClick={onExit}>
					<ArrowLeftIcon weight="bold" /> {t("table.leave")}
				</button>
				<h1>{local(game).name}</h1>
				<div className="table-share-actions">
					<ShareButton compact target={{ kind: "game", game: { id: game.id, name: local(game).name } }} />
					{/* Kept in the layout when hidden so the title stays centred. */}
					<button
						className="btn is-ghost"
						onClick={playAgain}
						style={{ visibility: session.canRestart && again && !outcome ? "visible" : "hidden" }}
					>
						<ArrowCounterClockwiseIcon weight="bold" /> {t("table.restart")}
					</button>
				</div>
			</header>

			{/* Three groups so a wide screen can set them side by side: who is playing, the game, the notes. */}
			<div className="table-rail">
				<div className="seats">
					{names.map((name, who) => (
						<div
							key={who}
							className={`seat seat${who} ${toAct.includes(who) ? "is-active" : ""} ${outcome?.winners.includes(who) ? "is-winner" : ""}`}
						>
							<Poff look={seatLook(who)} mood={mood(who)} size={names.length > 3 ? 62 : 84} flip={who % 2 === 1} />
							<span className="seat-name">
								{name}
								{who === seat && names.length > 1 ? ` ${t("table.you")}` : ""}
							</span>
						</div>
					))}
				</div>

				{/* Keyed by its text so each new line slides in instead of swapping in place. */}
				<p key={status} className="status" role="status">
					{status}
				</p>
				<TableClock session={session} />
			</div>

			<div className="table-main">
				<Board
					key={`${boardRevision}-${session.activity.findLast((event) => event.seat === seat)?.number ?? 0}`}
					view={session.view}
					seat={seat}
					names={names}
					canAct={toAct.includes(seat)}
					onMove={session.move}
				/>

				<p className="notice" role="alert">
					{session.notice && tx(session.notice)}
				</p>

				{outcome && (
					<div className="result">
						<ShareButton
							target={{
								kind: "result",
								game: { id: game.id, name: local(game).name },
								result:
									game.players.max === 1
										? outcome.winners.includes(seat)
											? "solved"
											: "unsolved"
										: outcome.winners.includes(seat)
											? "win"
											: outcome.winners.length === 0
												? "draw"
												: "finished",
							}}
						/>
						{again && (
							<button className="btn" onClick={playAgain}>
								{tx(again.label)}
							</button>
						)}
						<button className="btn is-ghost" onClick={onExit}>
							{t("table.back")}
						</button>
					</div>
				)}
			</div>

			<div className="table-notes">
				<TableHistory key={session.clock.startedAt} session={session} />

				<details className="rules">
					<summary>{t("table.rules")}</summary>
					<ul>
						{game.rules.map((rule) => (
							<li key={rule}>{tx(rule)}</li>
						))}
					</ul>
				</details>
				{session.chat && <TableChat chat={session.chat} />}
			</div>
		</main>
	)
}
