import type { AnyGame } from "./game.js"

export interface TableClock {
	startedAt: number
	roundStartedAt: number
	turnStartedAt: number
	round: string
	endedAt: number | null
}
export interface ActionEntry {
	number: number
	seat: number
	round: string
	at: number
	details: string[]
}
export const ACTION_HISTORY = 200
export function startClock(game: AnyGame, state: unknown, now: number): TableClock {
	return {
		startedAt: now,
		roundStartedAt: now,
		turnStartedAt: now,
		round: String(game.round?.(state) ?? 1),
		endedAt: null,
	}
}
export function advanceClock(
	game: AnyGame,
	before: unknown,
	after: unknown,
	clock: TableClock,
	now: number,
): TableClock {
	if (game.outcome(after)) return { ...clock, endedAt: clock.endedAt ?? now }
	const round = String(game.round?.(after) ?? 1)
	const priorActors = game.toAct(before)
	const nextActors = game.toAct(after)
	const newTurn =
		priorActors.length <= 1 || round !== clock.round || nextActors.some((seat) => !priorActors.includes(seat))
	return {
		...clock,
		round,
		roundStartedAt: round !== clock.round ? now : clock.roundStartedAt,
		turnStartedAt: newTurn ? now : clock.turnStartedAt,
		endedAt: game.outcome(after) ? now : null,
	}
}
function visibleLog(view: unknown): string[] {
	if (typeof view !== "object" || view === null || !("log" in view) || !Array.isArray(view.log)) return []
	return view.log.filter((line): line is string => typeof line === "string")
}
export function newLogLines(before: string[], after: string[]) {
	let overlap = Math.min(before.length, after.length)
	while (overlap > 0 && !before.slice(-overlap).every((line, index) => line === after[index])) overlap--
	return after.slice(overlap)
}
/** Only each receiver's already-filtered event log enters their history. No state or raw moves are copied. */
export function actionEntry(
	game: AnyGame,
	before: unknown,
	after: unknown,
	actor: number,
	receiver: number,
	number: number,
	now: number,
): ActionEntry {
	return {
		number,
		seat: actor,
		round: String(game.round?.(before) ?? 1),
		at: now,
		details:
			game.historyEntry?.(before, after, actor, receiver) ??
			newLogLines(visibleLog(game.view(before, receiver)), visibleLog(game.view(after, receiver))),
	}
}
export function clockSeconds(clock: TableClock, now: number) {
	const end = clock.endedAt ?? now
	const since = (start: number) => Math.max(0, Math.floor((end - start) / 1000))
	return { game: since(clock.startedAt), round: since(clock.roundStartedAt), turn: since(clock.turnStartedAt) }
}
