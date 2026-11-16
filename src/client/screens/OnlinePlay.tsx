import { ArrowLeftIcon, PlayIcon } from "@phosphor-icons/react"
import { Poff, seatLook } from "../art/Poff"
import { useLang } from "../i18n"
import { type Intent, useOnlineGame } from "../session/useOnlineGame"
import { Table } from "./Table"
import { ShareButton } from "../community/ShareButton"

/** Everything between clicking an online button and sitting at the table: connect, gather, fail. */
export function OnlinePlay({ intent, onExit }: { intent: Intent; onExit(): void }) {
	const { room, session, fatal } = useOnlineGame(intent)
	const { t, tx, game: local } = useLang()

	if (session) return <Table session={session} onExit={onExit} />

	const leave = (
		<button className="btn is-ghost" onClick={onExit}>
			<ArrowLeftIcon weight="bold" /> {t("table.back")}
		</button>
	)

	if (fatal) {
		return (
			<main className="waiting">
				<Poff look="ember" mood="sad" size={110} />
				<h1>{tx("That did not work")}</h1>
				<p role="alert">{tx(fatal)}</p>
				{leave}
			</main>
		)
	}

	if (!room) {
		return (
			<main className="waiting">
				<Poff look="moon" mood="think" size={110} />
				<h1>{tx("Opening the circle")}</h1>
				{leave}
			</main>
		)
	}

	const { min, max } = room.game.players
	const missing = min - room.names.length
	return (
		<main className="waiting">
			<h1>{local(room.game).name}</h1>
			<ul className="roster">
				{room.names.map((name, who) => (
					<li key={who}>
						<Poff look={seatLook(who)} size={64} mood={who === room.seat ? "happy" : "idle"} />
						{name}
						{who === 0 && <small>{tx("host")}</small>}
					</li>
				))}
				{Array.from({ length: max - room.names.length }, (_, i) => (
					<li key={`empty-${i}`} className="is-empty">
						<span className="roster-gap" />
						{tx("Open seat")}
					</li>
				))}
			</ul>
			<p>
				{missing > 0
					? tx(`Needs ${missing} more ${missing === 1 ? "mage" : "mages"} to begin.`)
					: room.start
						? tx("Enough mages are here. Start now, or wait for a full table.")
						: tx(`Waiting for ${room.names[0]} to start, or for the table to fill.`)}
			</p>
			<p className="code" aria-label={`${t("home.code")} ${room.code.split("").join(" ")}`}>
				{room.code}
			</p>
			<div className="btn-row">
				{room.start && (
					<button className="btn" onClick={room.start}>
						<PlayIcon weight="fill" /> {tx("Start game")}
					</button>
				)}
				<ShareButton
					target={{ kind: "invite", game: { id: room.game.id, name: local(room.game).name }, code: room.code }}
				/>
			</div>
			{leave}
		</main>
	)
}
