import { pick, seededRng, type AnyGame } from "../../shared/game"
import { devilCatalog } from "../../shared/games/devils/catalog"
import type { TrialView } from "../../shared/games/devils/trial"
import { localise } from "./engineText"

/**
 * Every display string a game produces when its own bots play it: rules, edition notes, view text
 * for each seat, and history lines. The coverage test and `pnpm lang` both read from here.
 */
export function gameText(game: AnyGame, trial: boolean, plays = 4): string[] {
	const found = new Set<string>(game.rules)
	const edition = devilCatalog.find((entry) => entry.id === game.id)
	if (edition) found.add(edition.adaptation)
	const keep = (text: string) => {
		found.add(text)
		return text
	}
	for (let play = 1; play <= plays; play++) {
		const rng = seededRng(play * 7919)
		const seats = play % 2 ? game.players.min : game.players.max
		let state = game.setup(rng, seats)
		for (let turn = 0; turn < 400 && !game.outcome(state); turn++) {
			const seat = game.toAct(state)[0]
			if (seat === undefined) break
			if (trial) for (let viewer = 0; viewer < seats; viewer++) localise(game.view(state, viewer), keep)
			const view = game.view(state, seat) as TrialView
			const open = trial ? [...view.choices, ...(view.board?.cells.filter((cell) => cell.move) ?? [])] : []
			const move = game.bot ? game.bot(view, seat, rng) : open.length ? pick(open, rng).move : undefined
			if (move === undefined) break
			const next = game.apply(state, seat, move)
			for (let viewer = 0; viewer < seats; viewer++)
				game.historyEntry?.(state, next, seat, viewer).forEach((line) => found.add(line))
			state = next
		}
		if (trial) for (let viewer = 0; viewer < seats; viewer++) localise(game.view(state, viewer), keep)
	}
	return [...found]
}
