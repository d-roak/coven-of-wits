import { useEffect, useRef, useState } from "react"
import { findGame } from "../../shared/games"
import type { AnyGame } from "../../shared/game"
import { type ClientMsg, type ErrorCode, type StateMsg, serverMsg } from "../../shared/protocol"
import type { GameSession } from "./types"

export type Intent =
	{ kind: "quick" | "create"; game: string; name: string } | { kind: "join"; code: string; name: string }

export interface WaitingRoom {
	code: string
	game: AnyGame
	/** Everyone gathered so far. Index 0 is the host. */
	names: string[]
	seat: number
	/** Host only, and only once enough mages are in. Null otherwise. */
	start: (() => void) | null
}

export interface OnlineGame {
	/** Set while gathering players. Null before the server answers and once the game is on. */
	room: WaitingRoom | null
	/** Null until the game starts. */
	session: GameSession | null
	/** Set when the attempt is over: bad code, full room, dead server. */
	fatal: string | null
}

// Errors that only mean "that click did nothing". Everything else ends the attempt.
const SOFT: readonly ErrorCode[] = ["ILLEGAL_MOVE", "NOT_YOUR_TURN", "NOT_IN_GAME", "CANNOT_START"]

/** One socket, one room, for as long as the component is mounted. Unmounting leaves the room. */
export function useOnlineGame(intent: Intent): OnlineGame {
	const [snap, setSnap] = useState<StateMsg | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [fatal, setFatal] = useState<string | null>(null)
	const [lost, setLost] = useState(false)
	const clockOffset = useRef(0)
	const socketRef = useRef<WebSocket | null>(null)

	useEffect(() => {
		const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`)
		socketRef.current = socket
		const send = (msg: ClientMsg) => socket.send(JSON.stringify(msg))

		socket.onopen = () =>
			send(
				intent.kind === "join"
					? { t: "join", code: intent.code, name: intent.name }
					: { t: intent.kind, game: intent.game, name: intent.name },
			)
		socket.onmessage = (event) => {
			// A message that fails the schema means client and server are out of step. Let it throw.
			const msg = serverMsg.parse(JSON.parse(String(event.data)))
			if (msg.t === "state") {
				clockOffset.current = msg.serverNow - Date.now()
				setSnap(msg)
				setNotice(null)
			} else if (SOFT.includes(msg.code)) setNotice(msg.message)
			else setFatal(msg.message)
		}
		socket.onclose = () => setLost(true)

		return () => {
			socket.onclose = null
			socket.onmessage = null
			socket.close()
		}
		// The intent is fixed for the life of the screen that mounts this hook.
	}, [])

	const send = (msg: ClientMsg) => socketRef.current?.send(JSON.stringify(msg))

	if (!snap) return { room: null, session: null, fatal: fatal ?? (lost ? "Could not reach the server." : null) }

	const game = findGame(snap.game)
	if (!game) throw new Error(`Server sent a game this client does not have: ${snap.game}`)

	if (snap.view === null) {
		const canStart = snap.seat === 0 && snap.names.length >= game.players.min
		return {
			room: {
				code: snap.code,
				game,
				names: snap.names,
				seat: snap.seat,
				start: canStart ? () => send({ t: "start" }) : null,
			},
			session: null,
			fatal: lost ? "Lost the connection to the server." : fatal,
		}
	}

	const dead = snap.abandoned || lost
	const duel = snap.names.length === 2
	// Walking out of an unfinished duel forfeits it. At a bigger table there is no fair winner, so it is called off.
	const outcome = snap.outcome ?? (snap.abandoned ? { winners: duel ? [snap.seat] : [] } : null)
	const asked = snap.rematch.includes(snap.seat)

	return {
		room: null,
		fatal: null,
		session: {
			chat: dead ? null : { entries: snap.chat, send: (text) => send({ t: "chat", text }) },
			game,
			clock: snap.clock!,
			clockOffset: clockOffset.current,
			activity: snap.activity,
			view: snap.view,
			seat: snap.seat,
			names: snap.names,
			toAct: dead || outcome ? [] : snap.toAct,
			outcome,
			move: (move) => send({ t: "move", move }),
			again: dead
				? null
				: {
						label: asked
							? `Waiting for the others (${snap.rematch.length} of ${snap.names.length})`
							: snap.rematch.length > 0
								? "Accept rematch"
								: "Ask for a rematch",
						run: () => send({ t: "rematch" }),
					},
			canRestart: false,
			notice: snap.abandoned
				? duel
					? "Your rival left the circle."
					: "A mage left the circle. The game is called off."
				: lost
					? "Lost the connection to the server."
					: notice,
		},
	}
}
