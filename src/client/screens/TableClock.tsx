import { useEffect, useState } from "react"
import { useLang } from "../i18n"
import { HourglassMediumIcon } from "@phosphor-icons/react"
import { clockSeconds } from "../../shared/tableSession"
import type { GameSession } from "../session/types"

export const formatTime = (seconds: number) =>
	`${Math.floor(Math.abs(seconds) / 60)}:${String(Math.abs(seconds) % 60).padStart(2, "0")}`
export function TableClock({ session }: { session: GameSession }) {
	const [now, setNow] = useState(Date.now)
	const [limits, setLimits] = useState({ turn: 60, round: 300, game: 1800 })
	const running = !session.outcome && session.toAct.length > 0
	useEffect(() => {
		setNow(Date.now())
		if (!running) return
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(timer)
	}, [running, session.clock.startedAt])
	const elapsed = clockSeconds(session.clock, now + session.clockOffset)
	const keys = ["turn", "round", "game"] as const
	const { t, tx } = useLang()
	return (
		<section className="table-clock" aria-label={tx("Game clocks")}>
			<div className="clock-readings">
				{keys.map((key) => {
					const remaining = limits[key] - elapsed[key]
					const overtime = limits[key] > 0 && remaining < 0
					return (
						<div key={key} className={overtime ? "is-overtime" : ""}>
							<span>{key === "round" ? t("clock.round", { n: session.clock.round }) : t(`clock.${key}`)}</span>
							<strong
								role="timer"
								aria-label={tx(`${key} ${limits[key] ? (overtime ? "overtime" : "remaining") : "elapsed"}`)}
								aria-live="off"
							>
								{overtime ? "+" : ""}
								{formatTime(limits[key] ? remaining : elapsed[key])}
							</strong>
							<small>{t(limits[key] ? (overtime ? "clock.overtime" : "clock.remaining") : "clock.elapsed")}</small>
						</div>
					)
				})}
			</div>
			<details>
				<summary>
					<HourglassMediumIcon /> {t("clock.pace")}
				</summary>
				<p>{tx("Targets show overtime. Play continues when a clock reaches zero.")}</p>
				<div className="clock-settings">
					{keys.map((key) => (
						<label key={key}>
							{tx(key === "turn" ? "Turn target" : key === "round" ? "Round target" : "Game target")}
							<select
								value={limits[key]}
								onChange={(event) => setLimits({ ...limits, [key]: Number(event.target.value) })}
							>
								<option value={0}>{tx("Elapsed only")}</option>
								{(key === "turn"
									? [30, 60, 120, 300]
									: key === "round"
										? [60, 180, 300, 600]
										: [300, 900, 1800, 3600]
								).map((seconds) => (
									<option key={seconds} value={seconds}>
										{tx(seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minutes`)}
									</option>
								))}
							</select>
						</label>
					))}
				</div>
				<p>
					{tx(
						"Game and round clocks continue between turns. Online clocks share the server’s start times; pace targets are personal.",
					)}
				</p>
			</details>
		</section>
	)
}
