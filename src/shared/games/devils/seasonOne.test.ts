import { describe, expect, it } from "vitest"
import { IllegalMove, seededRng } from "../../game"
import { seasonOneCatalog, seasonOneGames } from "./seasonOne"
import { cooperativePuzzle, fragmentsOfMemory, MEMORY_OBJECTS, montage, scaleGame, wordTower } from "./seasonOnePuzzles"
import { blindGomoku, fourPlayerThree, grassPlacements, grassSquare, layingGrass } from "./seasonOneSpatial"
import { blank, csv, integer, selection } from "./seasonOneSupport"
import { dicePoker, diceRank, numberClue, rulesRace, secretNumber, zoo, zooScore } from "./seasonOneTables"
import { virusGame } from "./seasonOneVirus"
import type { TrialView } from "./trial"

const rng = () => seededRng(27)

describe("Season 1 catalog and contracts", () => {
	it("accounts for all thirteen additions with explicit adaptation metadata", () => {
		expect(new Set(seasonOneGames.map((game) => game.id)).size).toBe(13)
		expect(seasonOneCatalog.map((entry) => entry.id).sort()).toEqual(seasonOneGames.map((game) => game.id).sort())
	})
	it.each(seasonOneGames)("$id rejects unknown actions and extra fields", (game) => {
		expect(() => game.parseMove({ action: "unknown", value: "" })).toThrow(IllegalMove)
		expect(() => game.parseMove({ action: "wait", value: "", extra: true })).toThrow(IllegalMove)
	})
	it.each(seasonOneGames.filter((game) => game.players.max > 1))(
		"$id bots finish from their own views at both table sizes",
		(game) => {
			for (const players of new Set([game.players.min, game.players.max]))
				for (let seed = 1; seed <= 5; seed++) {
					const random = seededRng(seed)
					let state = game.setup(random, players)
					for (let moves = 0; game.outcome(state) === null; moves++) {
						expect(moves).toBeLessThan(1000)
						const seat = game.toAct(state)[0]
						expect(seat).toBeDefined()
						const before = structuredClone(state)
						const next = game.apply(state, seat, game.parseMove(game.bot!(game.view(state, seat), seat, random)))
						expect(state).toEqual(before)
						state = next
					}
					expect(game.toAct(state)).toEqual([])
				}
		},
	)
	it.each(seasonOneGames)("$id only advertises legal choice and board moves", (game) => {
		let state = game.setup(rng(), game.players.min)
		for (let step = 0; step < 6 && game.outcome(state) === null; step++) {
			const seat = game.toAct(state)[0],
				v = game.view(state, seat) as TrialView
			const moves = [
				...v.choices.map((choice) => choice.move),
				...(v.board?.cells.flatMap((cell) => (cell.move ? [cell.move] : [])) ?? []),
			]
			for (const move of moves) expect(() => game.apply(state, seat, game.parseMove(move))).not.toThrow()
			if (!moves.length) break
			state = game.apply(state, seat, moves[0])
		}
	})
})

describe("shared trial input boundaries", () => {
	it("rejects noncanonical numbers, wrong tuple lengths and extra values", () => {
		expect(() => integer("01", 0, 10)).toThrow(IllegalMove)
		expect(() => integer("11", 0, 10)).toThrow(IllegalMove)
		expect(() => csv("1,2", 3, 0, 10)).toThrow(IllegalMove)
		expect(() => blank("extra")).toThrow(IllegalMove)
	})
	it("rejects malformed JSON, repeated selections and whitespace aliases", () => {
		expect(() => selection("not json", 1, 5)).toThrow(IllegalMove)
		expect(() => selection('["1"," 1"]', 1, 5)).toThrow(IllegalMove)
		expect(() => selection("[0]", 1, 5)).toThrow(IllegalMove)
	})
})

describe("solo prize trials", () => {
	it("tiles the cooperative silhouette using four rotated T pieces", () => {
		let state = cooperativePuzzle.setup(rng(), 1)
		for (const [index, anchor] of [0, 2, 9, 4].entries()) {
			if (index) state = cooperativePuzzle.apply(state, 0, { action: "rotate", value: "" })
			state = cooperativePuzzle.apply(state, 0, { action: "place", value: String(anchor) })
		}
		expect(cooperativePuzzle.outcome(state)).toEqual({ winners: [0] })
		expect(() => cooperativePuzzle.apply(state, 0, { action: "undo", value: "" })).toThrow(IllegalMove)
	})
	it("rejects an overlapping or out-of-bounds piece and allows undo/end", () => {
		const fresh = cooperativePuzzle.setup(rng(), 1)
		expect(() => cooperativePuzzle.apply(fresh, 0, { action: "place", value: "15" })).toThrow(IllegalMove)
		expect(() => cooperativePuzzle.apply(fresh, 0, { action: "undo", value: "" })).toThrow(IllegalMove)
		const placed = cooperativePuzzle.apply(fresh, 0, { action: "place", value: "0" })
		expect(() => cooperativePuzzle.apply(placed, 0, { action: "place", value: "0" })).toThrow(IllegalMove)
		expect(cooperativePuzzle.apply(placed, 0, { action: "undo", value: "" }).cells).toEqual(fresh.cells)
		expect(cooperativePuzzle.outcome(cooperativePuzzle.apply(fresh, 0, { action: "give-up", value: "" }))).toEqual({
			winners: [],
		})
	})
	it("hides shelf contents during recall and completes five correct answers", () => {
		let state = fragmentsOfMemory.apply(fragmentsOfMemory.setup(rng(), 1), 0, { action: "hide", value: "" })
		const changed = { ...state, scene: [...state.scene].reverse() }
		expect(fragmentsOfMemory.view(state, 0)).toEqual(fragmentsOfMemory.view(changed, 0))
		for (let question = 0; question < 5; question++)
			state = fragmentsOfMemory.apply(state, 0, {
				action: "answer",
				value: String(
					MEMORY_OBJECTS.indexOf(state.scene[state.questions[state.step]] as (typeof MEMORY_OBJECTS)[number]),
				),
			})
		expect(fragmentsOfMemory.outcome(state)).toEqual({ winners: [0] })
	})
	it("requires the study phase to end and fails a wrong memory answer", () => {
		const fresh = fragmentsOfMemory.setup(rng(), 1)
		expect(() => fragmentsOfMemory.apply(fresh, 0, { action: "answer", value: "0" })).toThrow(IllegalMove)
		const hidden = fragmentsOfMemory.apply(fresh, 0, { action: "hide", value: "" })
		const wrong = MEMORY_OBJECTS.findIndex((name) => name !== hidden.scene[hidden.questions[0]])
		expect(
			fragmentsOfMemory.outcome(fragmentsOfMemory.apply(hidden, 0, { action: "answer", value: String(wrong) })),
		).toEqual({ winners: [] })
	})
	it("uses a finite letter bank to solve Word Tower and rejects unavailable letters", () => {
		let state = wordTower.setup(rng(), 1)
		const solution = [...state.solution]
		for (const word of solution) state = wordTower.apply(state, 0, { action: "word", value: word })
		expect(wordTower.outcome(state)).toEqual({ winners: [0] })
		const fresh = wordTower.setup(rng(), 1)
		expect(() => wordTower.apply(fresh, 0, { action: "word", value: "ABRACADABRA" })).toThrow(IllegalMove)
		expect(() => wordTower.apply({ ...fresh, letters: ["C"] }, 0, { action: "word", value: "CROW" })).toThrow(
			IllegalMove,
		)
		expect(wordTower.outcome(wordTower.apply(fresh, 0, { action: "give-up", value: "" }))).toEqual({ winners: [] })
	})
	it("requires a real balance and exact weights to solve Scale Game", () => {
		let state = scaleGame.setup(rng(), 1)
		expect(() => scaleGame.apply(state, 0, { action: "weigh", value: "AB=BA" })).toThrow(IllegalMove)
		expect(() => scaleGame.apply(state, 0, { action: "weigh", value: "Z=A" })).toThrow(IllegalMove)
		state = scaleGame.apply(state, 0, { action: "weigh", value: `${"A".repeat(state.weights[1])}=B` })
		state = scaleGame.apply(state, 0, { action: "mode", value: "guess" })
		expect(scaleGame.outcome(scaleGame.apply(state, 0, { action: "guess", value: state.weights.join(",") }))).toEqual({
			winners: [0],
		})
		expect(scaleGame.outcome(scaleGame.apply(state, 0, { action: "guess", value: "1,1,1,1,1" }))).toEqual({
			winners: [],
		})
	})
	it("recognizes five repeats in Montage and fails a missed repeat", () => {
		let state = montage.setup(rng(), 1)
		while (!montage.outcome(state))
			state = montage.apply(state, 0, {
				action: state.seen.includes(state.rounds[0][state.position]) ? "seen" : "new",
				value: "",
			})
		expect(montage.outcome(state)).toEqual({ winners: [0] })
		const fresh = montage.setup(rng(), 1)
		const repeat = { ...fresh, rounds: [["same", "same"]], seen: ["same"], position: 1 }
		expect(montage.outcome(montage.apply(repeat, 0, { action: "new", value: "" }))).toEqual({ winners: [] })
		const errors = { ...fresh, errors: 10 }
		expect(montage.outcome(montage.apply(errors, 0, { action: "seen", value: "" }))).toEqual({ winners: [] })
	})
})

describe("spatial matches", () => {
	it("rejects grass touching rivals and scores the largest complete square", () => {
		let state = layingGrass.setup(rng(), 2)
		state = { ...state, deck: [2], rotation: 0 }
		expect(() => layingGrass.apply(state, 0, { action: "place", value: "99" })).toThrow(IllegalMove)
		expect(() => layingGrass.apply(state, 0, { action: "pass", value: "" })).toThrow(IllegalMove)
		const placed = layingGrass.apply(state, 0, { action: "place", value: String(grassPlacements(state)[0]) })
		expect(grassSquare(placed.cells, 0)).toBe(2)
		expect(layingGrass.outcome(placed)).toEqual({ winners: [0] })
	})
	it("limits grass exchanges to the available ticket and one per turn", () => {
		const state = layingGrass.setup(rng(), 2)
		const exchanged = layingGrass.apply(state, 0, { action: "exchange", value: "1" })
		expect(() => layingGrass.apply(exchanged, 0, { action: "exchange", value: "1" })).toThrow(IllegalMove)
	})
	it("wins a visible line above covered stones in Four-Player Three", () => {
		const fresh = fourPlayerThree.setup(rng(), 4)
		const stacks = fresh.stacks.map((stack) => [...stack])
		stacks[0] = [1, 0]
		stacks[1] = [2, 0]
		const selected = fourPlayerThree.apply({ ...fresh, stacks }, 0, { action: "reserve", value: "1" })
		const won = fourPlayerThree.apply(selected, 0, { action: "place", value: "2" })
		expect(fourPlayerThree.outcome(won)).toEqual({ winners: [0] })
	})
	it("rejects a stack over three stones and moving a covered stone", () => {
		const fresh = fourPlayerThree.setup(rng(), 4),
			stacks = fresh.stacks.map((stack) => [...stack])
		stacks[0] = [0, 1, 2]
		expect(() => fourPlayerThree.apply({ ...fresh, stacks }, 0, { action: "select", value: "0" })).toThrow(IllegalMove)
		const selected = fourPlayerThree.apply({ ...fresh, stacks }, 0, { action: "reserve", value: "1" })
		expect(() => fourPlayerThree.apply(selected, 0, { action: "place", value: "0" })).toThrow(IllegalMove)
	})
	it("seals older Gomoku ownership and reveals the winning line", () => {
		let state = blindGomoku.setup(rng(), 2)
		for (const cell of [0, 9, 1, 10, 2, 11, 3, 12])
			state = blindGomoku.apply(state, state.turn, { action: "place", value: String(cell) })
		expect(blindGomoku.view(state, 0).board!.cells[0].tone).toBeUndefined()
		expect(() => blindGomoku.apply(state, 0, { action: "place", value: "0" })).toThrow(IllegalMove)
		state = blindGomoku.apply(state, 0, { action: "place", value: "4" })
		expect(blindGomoku.outcome(state)).toEqual({ winners: [0] })
		expect(blindGomoku.view(state, 0).board!.cells[0].tone).toBe(0)
	})
})

describe("social, auction and dice matches", () => {
	it("requires a race rule and gives office benefits only after reaching an office", () => {
		let state = rulesRace.setup(rng(), 2)
		expect(() => rulesRace.apply(state, 0, { action: "roll", value: "" })).toThrow(IllegalMove)
		state = rulesRace.apply(state, 0, { action: "rule", value: "0" })
		state = rulesRace.apply(state, 1, { action: "rule", value: "1" })
		expect(() => rulesRace.apply(state, 0, { action: "office", value: "ticket" })).toThrow(IllegalMove)
		const office = rulesRace.apply({ ...state, phase: "office" }, 0, { action: "office", value: "ticket" })
		expect(office.tickets).toEqual([1, 0])
		expect(office.turn).toBe(1)
	})
	it("calculates Secret Number clues and keeps other players' results private", () => {
		expect(numberClue(6, 40, "zeros")).toBe("3")
		expect(numberClue(10, 20, "zeros")).toBe("0")
		expect(numberClue(6, 40, "quotient")).toBe("6")
		expect(numberClue(6, 40, "product")).toBe("0")
		const fresh = secretNumber.setup(rng(), 3)
		const state = secretNumber.apply(fresh, 0, { action: "clue", value: "1:sum" })
		expect(secretNumber.view(state, 0).log).toHaveLength(1)
		expect(secretNumber.view(state, 1).log).toHaveLength(0)
		expect(() => secretNumber.apply(fresh, 0, { action: "clue", value: "0:sum" })).toThrow(IllegalMove)
		expect(() => secretNumber.apply({ ...state, turn: 0 }, 0, { action: "clue", value: "1:sum" })).toThrow(IllegalMove)
	})
	it("scores sealed Secret Number guesses after all players answer", () => {
		const fresh = secretNumber.setup(rng(), 2),
			numbers = [6, 40]
		let state: ReturnType<typeof secretNumber.setup> = { ...fresh, numbers, phase: "guesses" }
		state = secretNumber.apply(state, 0, { action: "guess", value: "6,40" })
		expect(state.scores).toEqual([0, 0])
		state = secretNumber.apply(state, 1, { action: "guess", value: "?,40" })
		expect(state.scores).toEqual([11, 4])
		expect(secretNumber.outcome(state)).toEqual({ winners: [0] })
	})
	it("awards the lower-total Zoo pack to its top bidder and rejects index aliases", () => {
		let state = zoo.setup(rng(), 2)
		state = zoo.apply(state, 0, { action: "bid", value: "A:1" })
		expect(zoo.view(state, 1).facts.join(" ")).not.toContain("A:1")
		state = zoo.apply(state, 1, { action: "bid", value: "B:4" })
		expect(state.placer).toBe(0)
		expect(state.box).toBe(0)
		expect(() => zoo.apply(state, 0, { action: "arrange", value: '["0","00","1","2"]' })).toThrow(IllegalMove)
		const placed = zoo.apply(state, 0, { action: "arrange", value: '["3","2","1","0"]' })
		expect(placed.cells.filter((cell) => cell !== null)).toHaveLength(5)
		const cells = Array<number | null>(25).fill(null)
		cells[0] = 0
		cells[1] = 1
		cells[2] = 2
		expect(zooScore(cells, [2, 1, 0], [0, 4])).toBe(2)
	})
	it("ranks dice hands and limits rerolls without revealing rival dice", () => {
		expect(diceRank([3, 3, 3, 3, 3])).toBeGreaterThan(diceRank([6, 6, 6, 6, 5]))
		expect(diceRank([2, 2, 2, 1, 1])).toBeGreaterThan(diceRank([2, 3, 4, 5, 6]))
		expect(diceRank([2, 3, 4, 5, 6])).toBeGreaterThan(diceRank([1, 2, 3, 4, 5]))
		let state = dicePoker.setup(rng(), 2)
		const changed = { ...state, dice: [state.dice[0], [6, 6, 6, 6, 6]], seed: state.seed + 1 }
		expect(dicePoker.view(state, 0)).toEqual(dicePoker.view(changed, 0))
		expect(() => dicePoker.apply(state, 0, { action: "reroll", value: '["0","00"]' })).toThrow(IllegalMove)
		for (let i = 0; i < 2; i++) state = dicePoker.apply(state, 0, { action: "reroll", value: '["0"]' })
		expect(() => dicePoker.apply(state, 0, { action: "reroll", value: '["0"]' })).toThrow(IllegalMove)
	})
	it("rejects role-incompatible virus actions and resolves a two-stage cure", () => {
		let state = virusGame.setup(rng(), 5)
		const researcher = state.roles.indexOf("Researcher"),
			citizen = state.roles.indexOf("Citizen")
		expect(() => virusGame.apply(state, researcher, { action: "infect", value: String(citizen) })).toThrow(IllegalMove)
		const otherRoles = [...state.roles]
		const swappable = [0, 1, 2, 3, 4].filter((seat) => seat !== researcher)
		;[otherRoles[swappable[0]], otherRoles[swappable[1]]] = [otherRoles[swappable[1]], otherRoles[swappable[0]]]
		expect(virusGame.view(state, researcher)).toEqual(virusGame.view({ ...state, roles: otherRoles }, researcher))
		for (let round = 0; round < 2; round++)
			for (let seat = 0; seat < 5; seat++)
				state = virusGame.apply(state, seat, {
					action: seat === researcher ? "research" : "wait",
					value: seat === researcher ? String(citizen) : "",
				})
		expect(virusGame.outcome(state)?.winners).toContain(researcher)
		expect(virusGame.outcome(state)?.winners).not.toContain(state.roles.indexOf("Hexer"))
	})
	it("keeps virus tests private and forbids reusing one", () => {
		const fresh = virusGame.setup(rng(), 5),
			state = virusGame.apply(fresh, 0, { action: "test", value: "" })
		expect(virusGame.view(state, 1)).toEqual(virusGame.view(fresh, 1))
		expect(() => virusGame.apply(state, 0, { action: "test", value: "" })).toThrow(IllegalMove)
	})
	it("resolves infection deaths before spreading past the fallen seat", () => {
		let state = virusGame.setup(rng(), 5)
		state = {
			...state,
			roles: ["Researcher", "Officer", "Journalist", "Hexer", "Citizen"],
			infected: [0, 1, null, null, null],
		}
		for (let seat = 0; seat < 5; seat++) state = virusGame.apply(state, seat, { action: "wait", value: "" })
		expect(state.alive[1]).toBe(false)
		expect(state.infected[2]).toBe(0)
	})
})
