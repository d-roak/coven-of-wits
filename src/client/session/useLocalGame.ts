import { useEffect, useState } from "react"
import { type AnyGame, IllegalMove } from "../../shared/game"
import { ACTION_HISTORY, actionEntry, advanceClock, startClock, type ActionEntry } from "../../shared/tableSession"
import type { GameSession } from "./types"

const BOT_NAMES = ["Mordwick", "Grizzel", "Thimble", "Quillon"]
// Long enough to read as thinking and to let the last move's animation land, varied so bots do not tick like a clock.
const BOT_DELAY_MS = { min: 950, spread: 800 }

/** Runs a game entirely in the browser: a solo puzzle, or the player against bots in every other seat. */
export function useLocalGame(game: AnyGame, playerName: string, players: number): GameSession {
	const { min, max } = game.players
	if (players < min || players > max) throw new Error(`${game.id}: expected ${min} to ${max} players, got ${players}`)

	const [round, setRound] = useState(0)
	const [state, setState] = useState(() => game.setup(Math.random, players))
	const [clock, setClock] = useState(() => startClock(game, state, Date.now()))
	const [activity, setActivity] = useState<ActionEntry[]>([])
	const [notice, setNotice] = useState<string | null>(null)

	// Move the human one seat along each round so a different seat opens.
	const seat = round % players
	const toAct = game.toAct(state)
	const botUp = toAct.find((who) => who !== seat)

	function play(who: number, raw: unknown) {
		try {
			const next = game.apply(state, who, game.parseMove(raw))
			const now = Date.now()
			setState(next)
			setClock(advanceClock(game, state, next, clock, now))
			setActivity(
				[...activity, actionEntry(game, state, next, who, seat, (activity.at(-1)?.number ?? 0) + 1, now)].slice(
					-ACTION_HISTORY,
				),
			)
			setNotice(null)
		} catch (e) {
			if (!(e instanceof IllegalMove)) throw e
			setNotice(e.message)
		}
	}

	useEffect(() => {
		if (botUp === undefined) return
		const bot = game.bot
		if (!bot) throw new Error(`${game.id}: a game with rivals needs a bot to be played locally`)
		const delay = BOT_DELAY_MS.min + Math.random() * BOT_DELAY_MS.spread
		const timer = setTimeout(() => play(botUp, bot(game.view(state, botUp), botUp, Math.random)), delay)
		return () => clearTimeout(timer)
		// Keyed on state alone: every other input is derived from it or fixed for the round.
	}, [state])

	// Bots keep their names from round to round even though the seats rotate.
	const names = Array.from({ length: players }, (_, who) =>
		who === seat ? playerName : BOT_NAMES[((who - seat + players) % players) - 1]!,
	)

	return {
		chat: null,
		clock,
		clockOffset: 0,
		activity,
		game,
		view: game.view(state, seat),
		seat,
		names,
		toAct,
		outcome: game.outcome(state),
		move: (raw) => play(seat, raw),
		again: {
			label: players > 1 ? "Play again" : "New puzzle",
			run() {
				setRound(round + 1)
				const fresh = game.setup(Math.random, players)
				setState(fresh)
				setClock(startClock(game, fresh, Date.now()))
				setActivity([])
				setNotice(null)
			},
		},
		canRestart: true,
		notice,
	}
}
