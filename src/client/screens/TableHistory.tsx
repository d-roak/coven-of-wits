import { useState } from "react"
import { useLang } from "../i18n"
import type { GameSession } from "../session/types"
import { formatTime } from "./TableClock"

export function TableHistory({ session }: { session: GameSession }) {
	const { t, tx } = useLang()
	const [round, setRound] = useState("")
	const rounds = [...new Set(session.activity.map((event) => event.round))]
	const entries = session.activity.filter((event) => !round || event.round === round)
	return (
		<details className="table-history">
			<summary>
				{session.activity.length === 1 ? t("history.titleOne") : t("history.title", { n: session.activity.length })}
			</summary>
			<p>{t("history.note")}</p>
			{rounds.length > 1 && (
				<label>
					{t("history.show")}
					<select value={round} onChange={(event) => setRound(event.target.value)}>
						<option value="">{t("history.all")}</option>
						{rounds.map((value) => (
							<option key={value} value={value}>
								{t("clock.round", { n: value })}
							</option>
						))}
					</select>
				</label>
			)}
			{entries.length === 0 ? (
				<p>{t("history.empty")}</p>
			) : (
				<ol>
					{entries.map((event) => (
						<li key={event.number}>
							<div>
								<strong>
									{event.number}. {session.names[event.seat]}
								</strong>
								<time>{formatTime(Math.floor((event.at - session.clock.startedAt) / 1000))}</time>
							</div>
							<small>{t("clock.round", { n: event.round })}</small>
							{event.details.length ? (
								event.details.map((detail, i) => <p key={i}>{tx(detail)}</p>)
							) : (
								<p>{tx("Completed a move.")}</p>
							)}
						</li>
					))}
				</ol>
			)}
		</details>
	)
}
