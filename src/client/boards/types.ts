import { useEffect, useState } from "react"

/** Every board gets the view for its own seat and reports moves. It holds no game state of its own. */
export interface BoardProps<V, M> {
	view: V
	seat: number
	/** Indexed by seat. */
	names: string[]
	/** False when it is not this player's move or the game is over. */
	canAct: boolean
	onMove(move: M): void
}

/**
 * True for `ms` after `key` changes. Boards use it to hold a reveal on screen (the bids just turned over,
 * the bones just shown) instead of jumping straight to the next round. Presentation only: the game has moved on.
 */
export function useLinger(key: string | number, ms: number): boolean {
	const [seen, setSeen] = useState(key)
	useEffect(() => {
		if (seen === key) return
		const timer = setTimeout(() => setSeen(key), ms)
		return () => clearTimeout(timer)
	}, [key, seen, ms])
	return seen !== key
}

/** "You" for the viewer's own seat, the name otherwise. */
export const who = (names: string[], seat: number, me: number) => (seat === me ? "You" : names[seat]!)
