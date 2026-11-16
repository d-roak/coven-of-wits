import { z } from "zod"
import { type GameDef, illegal, parseWith, pick, topSeats } from "../game.js"

export const ROUNDS = 7
export const SPARKS = 5

export interface SparkRound {
	/** Indexed by seat. */
	picks: number[]
	/** Null when no spark was picked by exactly one mage. */
	winner: number | null
}

export interface LoneSparkState {
	/** This round's picks. Secret until every seat has one in. */
	picks: (number | null)[]
	scores: number[]
	history: SparkRound[]
}

export interface LoneSparkView {
	myPick: number | null
	/** Which seats have picked. Never what. */
	picked: boolean[]
	scores: number[]
	history: SparkRound[]
}

export interface LoneSparkMove {
	spark: number
}

const schema = z.object({ spark: z.number().int().min(1).max(SPARKS) }).strict()

export const loneSpark: GameDef<LoneSparkState, LoneSparkMove, LoneSparkView> = {
	id: "lone-spark",
	name: "Lone Spark",
	blurb: "Everyone picks a number in secret. The lowest one nobody else picked scores.",
	rules: [
		`Each round every mage secretly picks a spark from 1 to ${SPARKS}.`,
		"Sparks picked by more than one mage fizzle.",
		"The lowest spark left standing wins the round and scores its own number.",
		"So a 1 wins most often but pays least. If every spark fizzles, nobody scores.",
		`Most points after ${ROUNDS} rounds wins.`,
	],
	players: { min: 3, max: 5 },
	setup: (_rng, players) => ({
		picks: Array<number | null>(players).fill(null),
		scores: Array<number>(players).fill(0),
		history: [],
	}),
	toAct: (s) => (loneSpark.outcome(s) ? [] : s.picks.flatMap((p, seat) => (p === null ? [seat] : []))),
	parseMove: parseWith(schema),
	apply(s, seat, move) {
		if (loneSpark.outcome(s)) illegal("The game is over.")
		if (seat < 0 || seat >= s.picks.length) illegal("There is no such seat.")
		if (s.picks[seat] !== null) illegal("Your pick is already sealed.")

		const sealed = s.picks.map((p, i) => (i === seat ? move.spark : p))
		if (sealed.some((p) => p === null)) return { ...s, picks: sealed }
		const picks = sealed as number[]

		const lone = picks.filter((p) => picks.indexOf(p) === picks.lastIndexOf(p))
		const winner = lone.length > 0 ? picks.indexOf(Math.min(...lone)) : null
		return {
			picks: picks.map(() => null),
			scores: s.scores.map((score, i) => (i === winner ? score + picks[i]! : score)),
			history: [...s.history, { picks, winner }],
		}
	},
	round: (s) => s.history.length + 1,
	outcome: (s) => (s.history.length >= ROUNDS ? { winners: topSeats(s.scores) } : null),
	historyEntry(before, after) {
		if (after.history.length === before.history.length) return ["Locked a spark."]
		const result = after.history.at(-1)!
		return [
			`Sparks revealed: ${result.picks.map((spark, i) => `Mage ${i + 1}: ${spark}`).join("; ")}.`,
			result.winner === null
				? "Every spark fizzled; nobody scored."
				: `Mage ${result.winner + 1} held the lowest lone spark and scored ${result.picks[result.winner]} points.`,
		]
	},
	view: (s, seat) => ({
		myPick: s.picks[seat] ?? null,
		picked: s.picks.map((p) => p !== null),
		scores: s.scores,
		history: s.history,
	}),
	// ponytail: a fixed lean toward low sparks. No memory of what the table tends to pick.
	bot: (_view, _seat, rng) => ({ spark: pick([1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5], rng) }),
}
