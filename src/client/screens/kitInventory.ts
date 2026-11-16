import { pick, seededRng, type AnyGame } from "../../shared/game"
import type { TrialPiece, TrialView } from "../../shared/games/devils/trial"

// Boards drawn by hand list their parts here. Every other game is read from its engine.
export const BESPOKE: Record<string, string> = {
	"nine-mens-morris": "24-point mill board, 9 stones a seat",
	hexagon: "19 numbered hex tiles",
	"equation-hi-lo": "Number cards, operator tiles, high and low lanes",
	"knights-tour": "6×6 board, knight familiar, step numbers",
	"rune-drop": "7-column rack, seat orbs",
	turncoat: "8×8 grid, two-sided orbs",
	"mind-auction": "Bid cards 1 to 9, prize cards, face-down bids",
	"liars-bones": "Bone dice, face-down bones, bid stepper",
	"lone-spark": "Numbered sparks, sealed sparks",
	"last-candle": "Rows of candles, lit and snuffed",
	"rune-cipher": "6 rune stones, filled and hollow marks",
}

const PIECE_KINDS = new Set(["card", "back", "die", "tile", "token", "shape", "stack", "portrait"])

/** Variants of one piece (every die face, every stack height) count once on the component sheet. */
function family(piece: TrialPiece): string {
	switch (piece.kind) {
		case "token":
			return `token:${piece.icon}`
		case "portrait":
			return `portrait:${piece.animal}`
		case "card":
			return `card:${piece.suit ?? (/^-?\d+$/.test(piece.rank) || piece.rank.length < 3 ? "plain" : piece.rank)}`
		case "tile":
			return `tile:${/^-?\d+$/.test(piece.text) ? "number" : piece.text.length > 3 ? "word" : "mark"}`
		case "back":
		case "die":
		case "shape":
		case "stack":
			return piece.kind
		default: {
			const unexpected: never = piece
			return unexpected
		}
	}
}

/**
 * Plays a game through with its own bots and returns one example of every piece it puts on the table.
 * The sheet in Kit.tsx is built from this, so it lists what the engines draw, not what someone remembered.
 */
export function gamePieces(game: AnyGame, plays = 3): TrialPiece[] {
	const found = new Map<string, TrialPiece>()
	const walk = (value: unknown) => {
		if (!value || typeof value !== "object") return
		if (Array.isArray(value)) return value.forEach(walk)
		const node = value as Record<string, unknown>
		// Only a `piece` key holds a piece; form fields also have a `kind`.
		const piece = node.piece as TrialPiece | undefined
		if (piece && PIECE_KINDS.has(piece.kind) && !found.has(family(piece))) found.set(family(piece), piece)
		Object.values(node).forEach(walk)
	}
	for (let play = 1; play <= plays; play++) {
		const rng = seededRng(play * 7919)
		let state = game.setup(rng, play % 2 ? game.players.min : game.players.max)
		for (let turn = 0; turn < 400 && !game.outcome(state); turn++) {
			const seat = game.toAct(state)[0]
			if (seat === undefined) break
			const view = game.view(state, seat) as TrialView
			walk(view)
			const open = [...view.choices, ...(view.board?.cells.filter((cell) => cell.move) ?? [])]
			const move = game.bot ? game.bot(view, seat, rng) : open.length ? pick(open, rng).move : undefined
			// Solo puzzles that need a typed answer stop here; their pieces are already on the table.
			if (move === undefined) break
			state = game.apply(state, seat, move)
		}
		walk(game.view(state, 0))
	}
	return [...found.values()]
}
