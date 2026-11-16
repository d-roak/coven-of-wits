import { describe, expect, it } from "vitest"
import { seededRng } from "../../game"
import { cooperativePuzzle, fragmentsOfMemory, montage, scaleGame, wordTower } from "./seasonOnePuzzles"
import { blindGomoku, layingGrass } from "./seasonOneSpatial"
import { dicePoker, rulesRace, secretNumber, zoo } from "./seasonOneTables"
import { virusGame } from "./seasonOneVirus"
import type { TrialForm, TrialView } from "./trial"

const rng = () => seededRng(31)
const fill = (form: TrialForm, values: string[]) => ({
	action: form.action,
	value: form.format.replace(/\{(\d+)\}/g, (_, index: string) => values[Number(index)]),
})

describe("Season 1 visual controls", () => {
	it("previews the exact cooperative rune footprint before committing it", () => {
		let state = cooperativePuzzle.setup(rng(), 1)
		state = cooperativePuzzle.apply(state, 0, { action: "rotate", value: "" })
		const cell = cooperativePuzzle.view(state, 0).board!.cells.find((cell) => cell.move)!
		const placed = cooperativePuzzle.apply(state, 0, cell.move!)
		expect(placed.cells.flatMap((owner, index) => (owner === null ? [] : [index]))).toEqual(
			[...cell.preview!].sort((a, b) => a - b),
		)
	})
	it("previews legal garden patches after rotation without revealing illegal moves", () => {
		const state = layingGrass.apply(layingGrass.setup(rng(), 2), 0, { action: "rotate", value: "" })
		for (const cell of layingGrass.view(state, 0).board!.cells.filter((cell) => cell.move)) {
			const planted = layingGrass.apply(state, 0, cell.move!)
			const changed = planted.cells.flatMap((owner, index) => (owner !== state.cells[index] ? [index] : []))
			expect(changed).toEqual([...cell.preview!].sort((a, b) => a - b))
		}
	})
	it("keeps wizard paths unique and every leaf legal", () => {
		const games = [virusGame, secretNumber, rulesRace] as const
		for (const game of games) {
			// The exported heterogeneous game boundary uses unknown state, just like the catalog.
			const erased = game as import("../../game").AnyGame
			let state = erased.setup(rng(), game.players.min)
			for (let step = 0; step < 18 && !erased.outcome(state); step++) {
				const seat = erased.toAct(state)[0]
				const view = erased.view(state, seat) as TrialView
				const paths = view.choices.filter((choice) => choice.steps)
				expect(new Set(paths.map((choice) => choice.steps!.map((step) => step.key).join("/"))).size).toBe(paths.length)
				for (const choice of paths) expect(() => erased.apply(state, seat, choice.move)).not.toThrow()
				if (!view.choices.length) break
				state = erased.apply(state, seat, view.choices[0].move)
			}
		}
	})
	it("serializes separate secret guesses with a rival skip and retains only your sealed cards", () => {
		let state = secretNumber.setup(rng(), 3)
		while (state.phase === "clues") {
			const seat = secretNumber.toAct(state)[0]
			state = secretNumber.apply(state, seat, secretNumber.view(state, seat).choices[0].move)
		}
		const form = secretNumber.view(state, 0).forms![0]
		const sealed = secretNumber.apply(state, 0, fill(form, ["17", form.fields[1].skip!.value, "21"]))
		expect(sealed.guesses[0]).toEqual([17, null, 21])
		expect(secretNumber.view(sealed, 0).displays![0].items).toHaveLength(3)
		expect(secretNumber.view(sealed, 1).displays![0].items).toEqual([])
		expect(secretNumber.view(sealed, 1)).toEqual(
			secretNumber.view({ ...sealed, guesses: [[99, 88, 77], null, null] }, 1),
		)
	})
	it("composes Zoo bids and preserves animal card order through arrangement", () => {
		let state = zoo.setup(rng(), 2)
		state = zoo.apply(state, 0, fill(zoo.view(state, 0).forms![0], ["A", "0"]))
		state = zoo.apply(state, 1, fill(zoo.view(state, 1).forms![0], ["A", "0"]))
		const selection = zoo.view(state, state.placer!).selection!
		const order = [...selection.options].reverse().map((option) => option.value)
		const next = zoo.apply(state, state.placer!, { action: selection.action, value: JSON.stringify(order) })
		expect(next.cells.slice(0, 4)).toEqual([...state.packs[0][0]].reverse())
		expect(next.log.length).toBeGreaterThan(state.log.length)
	})
	it("keeps private Zoo pattern tails and future packs out of visual metadata", () => {
		const state = zoo.setup(rng(), 3)
		const hidden = {
			...state,
			patterns: state.patterns.map((pattern, seat) => (seat === 0 ? pattern : [pattern[0], 4, 4])),
			packs: [state.packs[0], ...state.packs.slice(1).reverse()],
		}
		expect(zoo.view(state, 0)).toEqual(zoo.view(hidden, 0))
	})
	it("uses the physical balance composer and separate weight fields", () => {
		let state = scaleGame.setup(rng(), 1)
		const balance = scaleGame.view(state, 0).balance!
		state = scaleGame.apply(state, 0, {
			action: balance.action,
			value: `${balance.stones[0].value.repeat(state.weights[1])}=${balance.stones[1].value}`,
		})
		state = scaleGame.apply(state, 0, { action: "mode", value: "guess" })
		expect(
			scaleGame.outcome(scaleGame.apply(state, 0, fill(scaleGame.view(state, 0).forms![0], state.weights.map(String)))),
		).toEqual({ winners: [0] })
	})
	it("does not put hidden shelf positions or future portraits in illustration metadata", () => {
		const shelf = fragmentsOfMemory.apply(fragmentsOfMemory.setup(rng(), 1), 0, { action: "hide", value: "" })
		expect(fragmentsOfMemory.view(shelf, 0)).toEqual(
			fragmentsOfMemory.view({ ...shelf, scene: [...shelf.scene].reverse() }, 0),
		)
		const faces = montage.setup(rng(), 1)
		expect(montage.view(faces, 0)).toEqual(
			montage.view(
				{
					...faces,
					seen: ["hidden"],
					rounds: [[faces.rounds[0][0], ...faces.rounds[0].slice(1).reverse()], ...faces.rounds.slice(1).reverse()],
				},
				0,
			),
		)
	})
	it("selects dice on the visible hand while keeping rival illustrations private", () => {
		const state = dicePoker.setup(rng(), 3)
		const view = dicePoker.view(state, 0)
		const choice = view.selection!.options[0]
		expect(() =>
			dicePoker.apply(state, 0, { action: view.selection!.action, value: JSON.stringify([choice.value]) }),
		).not.toThrow()
		expect(view).toEqual(dicePoker.view({ ...state, dice: [state.dice[0], [6, 6, 6, 6, 6], [1, 1, 1, 1, 1]] }, 0))
	})
	it("never reveals sealed Gomoku owners through pieces or history", () => {
		let state = blindGomoku.setup(rng(), 2)
		for (const at of [0, 1, 2]) state = blindGomoku.apply(state, state.turn, { action: "place", value: String(at) })
		const swapped = { ...state, cells: state.cells.map((owner, index) => (index < 2 ? 1 - owner! : owner)) }
		expect(blindGomoku.view(state, 0)).toEqual(blindGomoku.view(swapped, 0))
	})
	it("builds Word Tower from the same remaining tile bank used by the engine", () => {
		const state = wordTower.setup(rng(), 1)
		const view = wordTower.view(state, 0)
		const remaining = [...view.input!.tiles!]
		const word = state.solution[0]
		for (const letter of word) remaining.splice(remaining.indexOf(letter), 1)
		const next = wordTower.apply(state, 0, { action: view.input!.action, value: word })
		expect(wordTower.view(next, 0).input!.tiles).toEqual(remaining)
	})
})
