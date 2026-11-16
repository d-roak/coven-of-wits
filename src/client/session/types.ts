import type { TableClock, ActionEntry } from "../../shared/tableSession"
import type { AnyGame, Outcome } from "../../shared/game"
import type { ChatEntry } from "../../shared/protocol"

/**
 * What the table needs to run a game, wherever it lives.
 * useLocalGame and useOnlineGame both produce this, so screens and boards never know the difference.
 */
export interface GameSession {
	clock: TableClock
	clockOffset: number
	activity: ActionEntry[]
	chat: { entries: ChatEntry[]; send(text: string): void } | null
	game: AnyGame
	/** Already filtered for `seat`. Typed per game by the board that receives it. */
	view: unknown
	/** The seat this browser plays. */
	seat: number
	/** Indexed by seat. Its length is the number of players. */
	names: string[]
	/** Seats that may move now. Empty when the game is over or the room is dead. */
	toAct: number[]
	outcome: Outcome | null
	move(move: unknown): void
	/** Start over or ask for a rematch. Null when that is not possible, e.g. someone left. */
	again: { label: string; run(): void } | null
	/** True when `again` may be used mid-game without asking anyone. */
	canRestart: boolean
	/** One line for the player: a rejected move, a dropped rival. */
	notice: string | null
}
