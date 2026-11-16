import { type GameDef, type Outcome, illegal, pick, shuffle } from "../../game.js"
import { roundOf, type TrialMove, type TrialView, type TrialPiece, type TrialIcon } from "./trial.js"
import {
	blank,
	choice,
	csv,
	integer,
	liveSeat,
	parseActions,
	rotateShape,
	shapeCells,
	view,
} from "./seasonOneSupport.js"

interface PuzzleState {
	cells: (number | null)[]
	placements: number[][]
	rotation: number
	result: Outcome | null
}
const TETROMINO = [
	[0, 0],
	[1, 0],
	[2, 0],
	[1, 1],
] as const
export const cooperativePuzzle: GameDef<PuzzleState, TrialMove, TrialView> = {
	id: "cooperative-puzzle",
	name: "Cooperative Puzzle",
	blurb: "Fit four branching runes into one square seal.",
	rules: [
		"A solo adaptation of the rotating cooperative silhouette puzzle from The Devil’s Plan.",
		"Cover the 4 × 4 seal with four T-shaped pieces. Rotate a piece, then select its top-left bounding corner.",
		"Pieces must stay inside the seal and cannot overlap. Undo a placement when you need space.",
		"This edition uses one complete tiling puzzle, with no carousel or timer.",
	],
	players: { min: 1, max: 1 },
	setup: () => ({ cells: Array<number | null>(16).fill(null), placements: [], rotation: 0, result: null }),
	toAct: (s) => (s.result ? [] : [0]),
	parseMove: parseActions("rotate", "place", "undo", "give-up"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 1, 0)
		if (move.action === "give-up") {
			blank(move.value)
			return { ...s, result: { winners: [] } }
		}
		if (move.action === "rotate") {
			blank(move.value)
			return { ...s, rotation: (s.rotation + 1) % 4 }
		}
		if (move.action === "undo") {
			blank(move.value)
			const last = s.placements.at(-1)
			if (!last) return illegal("Place a piece before undoing.")
			return {
				...s,
				cells: s.cells.map((owner, cell) => (last.includes(cell) ? null : owner)),
				placements: s.placements.slice(0, -1),
			}
		}
		if (move.action !== "place") return illegal("Choose rotate, place, undo or give-up.")
		const cells = shapeCells(rotateShape(TETROMINO, s.rotation), integer(move.value, 0, 15), 4)
		if (!cells || cells.some((cell) => s.cells[cell] !== null))
			return illegal("That rune overlaps a piece or leaves the seal.")
		const placements = [...s.placements, cells]
		return {
			...s,
			cells: s.cells.map((owner, cell) => (cells.includes(cell) ? s.placements.length : owner)),
			placements,
			result: placements.length === 4 ? { winners: [0] } : null,
		}
	},
	outcome: (s) => s.result,
	view: (s) =>
		view(
			s.result ? "Seal complete" : "Fit the runes",
			"Cover every square with the four T-shaped pieces.",
			[s.placements.length],
			{
				scoreLabel: "Runes placed",
				displays: [
					{
						label: "Current rune",
						items: s.result
							? []
							: [
									{
										label: `${s.rotation * 90}°`,
										piece: { kind: "shape", cells: rotateShape(TETROMINO, s.rotation), tone: s.placements.length },
									},
								],
					},
				],
				facts: [`${4 - s.placements.length} pieces remain. Rotation: ${s.rotation * 90}°.`],
				board: {
					columns: 4,
					confirm: "Place rune",
					cells: s.cells.map((owner, cell) => ({
						label: owner === null ? String(cell + 1) : `Rune ${owner + 1}`,
						tone: owner ?? undefined,
						piece: owner === null ? undefined : { kind: "tile", text: "", tone: owner },
						preview: shapeCells(rotateShape(TETROMINO, s.rotation), cell, 4) ?? undefined,
						move:
							!s.result &&
							(() => {
								const patch = shapeCells(rotateShape(TETROMINO, s.rotation), cell, 4)
								return patch && patch.every((at) => s.cells[at] === null)
							})()
								? { action: "place", value: String(cell) }
								: undefined,
					})),
				},
				choices: s.result
					? []
					: [
							choice("Rotate rune", "rotate"),
							...(s.placements.length ? [choice("Undo placement", "undo")] : []),
							choice("End attempt", "give-up"),
						],
				log: [
					...s.placements.map(
						(cells, i) => `Rune ${i + 1} covers squares ${cells.map((cell) => cell + 1).join(", ")}.`,
					),
					...(s.result ? [s.result.winners.length ? "All four runes fit." : "Attempt ended."] : []),
				],
			},
		),
}

export const MEMORY_OBJECTS = [
	"Silver moth",
	"Green vial",
	"Red candle",
	"Black cat",
	"Blue feather",
	"Copper key",
	"White teacup",
	"Rose quartz",
	"Oak wand",
	"Wax seal",
	"Moon pendant",
	"Open book",
	"Acorn",
	"Star chart",
	"Bell",
	"Purple mushroom",
] as const
const MEMORY_ICONS: TrialIcon[] = [
	"moth",
	"vial",
	"candle",
	"cat",
	"feather",
	"key",
	"cup",
	"gem",
	"wand",
	"seal",
	"moon",
	"book",
	"acorn",
	"star",
	"bell",
	"mushroom",
]
function memoryPiece(name: string): TrialPiece {
	const index = MEMORY_OBJECTS.findIndex((item) => item === name)
	const tones = [1, 2, 0, undefined, 4, 0, 1, 3, 2, 0, 1, undefined, 2, 1, 1, 3]
	return { kind: "token", icon: MEMORY_ICONS[index], tone: tones[index] }
}
interface MemoryState {
	scene: string[]
	questions: number[]
	step: number
	phase: "study" | "recall"
	result: Outcome | null
}
export const fragmentsOfMemory: GameDef<MemoryState, TrialMove, TrialView> = {
	id: "fragments-of-memory",
	round: (s) => (s.phase === "study" ? 1 : Math.min(s.step + 1, 5)),
	name: "Fragments of Memory",
	blurb: "Study the apothecary shelves. Recall what stood where.",
	rules: [
		"A solo version of the show’s scene-memory prize match.",
		"Study the 4 × 4 apothecary shelf, then hide it. Answer five questions about item positions.",
		"One wrong answer ends the trial. This edition uses an arcana shelf, five questions, and a manual study phase instead of the hospital photograph and team relay.",
	],
	players: { min: 1, max: 1 },
	setup: (rng) => ({
		scene: shuffle(MEMORY_OBJECTS, rng),
		questions: shuffle(
			Array.from({ length: 16 }, (_, i) => i),
			rng,
		).slice(0, 5),
		step: 0,
		phase: "study",
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [0]),
	parseMove: parseActions("hide", "answer"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 1, 0)
		if (move.action === "hide" && s.phase === "study") {
			blank(move.value)
			return { ...s, phase: "recall" }
		}
		if (move.action !== "answer" || s.phase !== "recall") return illegal("Hide the shelf before answering.")
		const answer = integer(move.value, 0, MEMORY_OBJECTS.length - 1)
		const correct = MEMORY_OBJECTS[answer] === s.scene[s.questions[s.step]]
		return {
			...s,
			step: s.step + (correct ? 1 : 0),
			result: !correct ? { winners: [] } : s.step === 4 ? { winners: [0] } : null,
		}
	},
	outcome: (s) => s.result,
	view: (s) => {
		const cell = s.questions[Math.min(s.step, 4)]
		const visible = s.phase === "study" || s.result !== null
		return view(
			s.phase === "study" ? "Study the shelves" : "Answer from memory",
			visible
				? "Remember each object’s position."
				: `What was in row ${Math.floor(cell / 4) + 1}, column ${(cell % 4) + 1}?`,
			[s.step],
			{
				...(s.phase === "study" ? {} : { round: roundOf("Question", Math.min(s.step + 1, 5), 5) }),
				scoreLabel: "Answers remembered",
				board: visible
					? { columns: 4, cells: s.scene.map((label) => ({ label, piece: memoryPiece(label) })) }
					: undefined,
				choices: s.result
					? []
					: s.phase === "study"
						? [choice("Hide shelves", "hide")]
						: MEMORY_OBJECTS.map((name, index) => choice(name, "answer", String(index), { piece: memoryPiece(name) })),
				log: [
					...s.questions
						.slice(0, s.step)
						.map(
							(at, index) =>
								`Question ${index + 1}: row ${Math.floor(at / 4) + 1}, column ${(at % 4) + 1} held ${s.scene[at]}.`,
						),
					...(s.result
						? [s.result.winners.length ? "Every detail remembered." : `The answer was ${s.scene[cell]}.`]
						: []),
				],
			},
		)
	},
}

export const TOWER_WORDS = ["CROW", "WOLF", "TOAD", "MOTH", "LAMB", "BEAR", "HARE", "DEER", "IBIS", "LYNX"] as const
interface TowerState {
	solution: string[]
	letters: string[]
	words: string[]
	result: Outcome | null
}
export const wordTower: GameDef<TowerState, TrialMove, TrialView> = {
	id: "word-tower",
	name: "Word Tower",
	blurb: "Build three animal names from one shared pile of letters.",
	rules: [
		"A solo adaptation of the cooperative Word Tower prize match.",
		"Make exactly three animal names using every letter once. Each word must be in the displayed animal list.",
		"Letters are physical tiles: a word cannot use more copies of a letter than remain. You may undo the last word.",
		"The original relay and timer are replaced by a three-word letter puzzle.",
	],
	players: { min: 1, max: 1 },
	setup(rng) {
		const solution = shuffle(TOWER_WORDS, rng).slice(0, 3)
		return { solution, letters: shuffle(solution.join("").split(""), rng), words: [], result: null }
	},
	toAct: (s) => (s.result ? [] : [0]),
	parseMove: parseActions("word", "undo", "give-up"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 1, 0)
		if (move.action === "give-up") {
			blank(move.value)
			return { ...s, result: { winners: [] } }
		}
		if (move.action === "undo") {
			blank(move.value)
			const word = s.words.at(-1)
			if (!word) return illegal("Build a word before undoing.")
			return { ...s, letters: [...s.letters, ...word], words: s.words.slice(0, -1) }
		}
		if (move.action !== "word") return illegal("Choose word, undo or give-up.")
		const word = move.value.trim().toUpperCase()
		if (!TOWER_WORDS.some((allowed) => allowed === word)) return illegal("Choose an animal from the displayed list.")
		if (s.words.includes(word)) return illegal("Each animal name may be used once.")
		const letters = [...s.letters]
		for (const letter of word) {
			const index = letters.indexOf(letter)
			if (index < 0) return illegal(`No ${letter} tile remains.`)
			letters.splice(index, 1)
		}
		const words = [...s.words, word]
		return { ...s, letters, words, result: words.length === 3 ? { winners: letters.length === 0 ? [0] : [] } : null }
	},
	outcome: (s) => s.result,
	view: (s) =>
		view("Build the towers", "Use every letter in exactly three animal names.", [s.words.length], {
			facts: [`Allowed animals: ${TOWER_WORDS.join(", ")}.`, `Built: ${s.words.join(", ") || "none"}.`],
			scoreLabel: "Words built",
			displays: s.words.map((word, index) => ({
				label: `Tower ${index + 1}`,
				items: [...word].map((letter) => ({ label: letter, piece: { kind: "tile", text: letter } })),
			})),
			input: s.result ? undefined : { label: "Build an animal name", action: "word", kind: "text", tiles: s.letters },
			choices: s.result
				? []
				: [...(s.words.length ? [choice("Undo word", "undo")] : []), choice("End attempt", "give-up")],
			log: [
				...s.words.map((word, index) => `Tower ${index + 1}: ${word}.`),
				...(s.result
					? [s.result.winners.length ? "Every letter placed." : `One solution: ${s.solution.join(", ")}.`]
					: []),
			],
		}),
}

interface ScaleState {
	weights: number[]
	comparisons: string[]
	balanced: boolean
	mode: "weigh" | "guess"
	result: Outcome | null
}
export const scaleGame: GameDef<ScaleState, TrialMove, TrialView> = {
	id: "scale-game",
	name: "Scale Game",
	blurb: "Balance arcane weights and deduce what each stone weighs.",
	rules: [
		"A solo deduction bench based on the show’s cooperative scales.",
		"Five stone types A–E weigh distinct whole numbers from 1 to 20 grams. A weighs 1 gram.",
		"Place stones on the two pans to compare their weight. Each pan may hold up to 20 stones; identical stacks cannot be compared.",
		"You have 20 comparisons. Find a genuine balance, then guess all five weights in A–E order.",
		"This edition supplies unlimited calibration stones and one scale instead of the show’s separate rooms and limited cubes.",
	],
	players: { min: 1, max: 1 },
	setup: (rng) => ({
		weights: [
			1,
			...shuffle(
				Array.from({ length: 19 }, (_, i) => i + 2),
				rng,
			).slice(0, 4),
		],
		comparisons: [],
		balanced: false,
		mode: "weigh",
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [0]),
	parseMove: parseActions("weigh", "guess", "mode"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 1, 0)
		if (move.action === "mode") {
			if (move.value !== "weigh" && move.value !== "guess") return illegal("Choose weigh or guess.")
			if (move.value === "weigh" && s.comparisons.length >= 20) return illegal("All 20 comparisons have been used.")
			return { ...s, mode: move.value }
		}
		if (move.action === "guess") {
			if (s.mode !== "guess") return illegal("Choose Guess weights first.")
			const guesses = csv(move.value, 5, 1, 20)
			return {
				...s,
				result: { winners: s.balanced && guesses.every((weight, index) => weight === s.weights[index]) ? [0] : [] },
			}
		}
		if (move.action !== "weigh" || s.mode !== "weigh") return illegal("Choose Weigh stones first.")
		if (s.comparisons.length >= 20) return illegal("All 20 comparisons have been used.")
		const value = move.value.trim().toUpperCase()
		if (!/^[A-E]{1,20}=[A-E]{1,20}$/.test(value)) return illegal("Use A–E on each side of =, with 1–20 stones per pan.")
		const [left, right] = value.split("=")
		if ([...left].sort().join("") === [...right].sort().join("")) return illegal("Compare different stacks.")
		const weight = (stack: string) => [...stack].reduce((sum, letter) => sum + s.weights[letter.charCodeAt(0) - 65], 0)
		const difference = weight(left) - weight(right)
		const comparisons = [...s.comparisons, `${left} ${difference === 0 ? "=" : difference > 0 ? ">" : "<"} ${right}`]
		return {
			...s,
			comparisons,
			balanced: s.balanced || difference === 0,
			mode: comparisons.length === 20 ? "guess" : s.mode,
		}
	},
	outcome: (s) => s.result,
	view: (s) =>
		view(
			s.mode === "weigh" ? "Compare the stones" : "Name the weights",
			"A weighs 1 g. Deduce B, C, D and E.",
			[s.comparisons.length],
			{
				facts: [
					`${20 - s.comparisons.length} comparisons remain.`,
					s.balanced ? "A genuine balance has been found." : "Find a balance before the final answer.",
				],
				scoreLabel: "Comparisons",
				balance:
					!s.result && s.mode === "weigh"
						? {
								action: "weigh",
								maxPerPan: 20,
								stones: ["A", "B", "C", "D", "E"].map((letter, index) => ({
									value: letter,
									label: letter === "A" ? "A · 1 g" : `${letter} · unknown`,
									piece: { kind: "token", icon: "gem", text: letter, tone: index },
								})),
							}
						: undefined,
				forms:
					!s.result && s.mode === "guess"
						? [
								{
									label: "Stone weights in grams",
									action: "guess",
									submit: "Seal weights",
									format: "{0},{1},{2},{3},{4}",
									fields: ["A", "B", "C", "D", "E"].map((letter) => ({
										label: `${letter} weight`,
										kind: "number",
										min: 1,
										max: 20,
										initial: letter === "A" ? "1" : undefined,
									})),
								},
							]
						: undefined,
				choices: s.result
					? []
					: s.mode === "weigh"
						? [choice("Guess weights", "mode", "guess")]
						: s.comparisons.length < 20
							? [choice("Weigh stones", "mode", "weigh")]
							: [],
				log: [
					...s.comparisons,
					...(s.result
						? [
								`Weights: ${s.weights.map((weight, index) => `${String.fromCharCode(65 + index)}=${weight} g`).join(", ")}.`,
							]
						: []),
				],
			},
		),
}

const PORTRAITS = [
	"Fox / green hood / crescent",
	"Fox / red hood / star",
	"Owl / green hood / star",
	"Owl / red hood / crescent",
	"Moth / green hood / eye",
	"Moth / blue hood / crescent",
	"Cat / blue hood / star",
	"Cat / red hood / eye",
	"Hare / green hood / eye",
	"Hare / blue hood / star",
	"Lamb / red hood / crescent",
	"Lamb / blue hood / eye",
]
const PORTRAIT_PIECES: TrialPiece[] = [
	...["fox", "owl"].flatMap((animal) => [
		{
			kind: "portrait" as const,
			animal: animal as TrialIcon,
			cloak: 2,
			sigil: (animal === "fox" ? "moon" : "star") as TrialIcon,
		},
		{
			kind: "portrait" as const,
			animal: animal as TrialIcon,
			cloak: 0,
			sigil: (animal === "fox" ? "star" : "moon") as TrialIcon,
		},
	]),
	{ kind: "portrait", animal: "moth", cloak: 2, sigil: "eye" },
	{ kind: "portrait", animal: "moth", cloak: 4, sigil: "moon" },
	{ kind: "portrait", animal: "cat", cloak: 4, sigil: "star" },
	{ kind: "portrait", animal: "cat", cloak: 0, sigil: "eye" },
	{ kind: "portrait", animal: "rabbit", cloak: 2, sigil: "eye" },
	{ kind: "portrait", animal: "rabbit", cloak: 4, sigil: "star" },
	{ kind: "portrait", animal: "lamb", cloak: 0, sigil: "moon" },
	{ kind: "portrait", animal: "lamb", cloak: 4, sigil: "eye" },
]
interface MontageState {
	rounds: string[][]
	seen: string[]
	position: number
	cleared: number
	errors: number
	result: Outcome | null
}
export const montage: GameDef<MontageState, TrialMove, TrialView> = {
	id: "montage",
	round: (s) => Math.min(s.cleared + 1, 5),
	name: "Montage",
	blurb: "Remember each familiar. Ring the bell when a face returns.",
	rules: [
		"A solo adaptation of the face-recognition prize match.",
		"Each portrait shows a familiar, cloak color and sigil. All three details must match for a repeat.",
		"Choose New face to advance, or Seen before when the portrait repeats. Missing a repeat ends the trial.",
		"A false repeat costs 1 error. The 11th error ends the trial. Find the repeat in all five rounds to win.",
		"This edition uses illustrated arcana portraits and manual advance instead of photographs shown for three seconds.",
	],
	players: { min: 1, max: 1 },
	setup: (rng) => ({
		rounds: Array.from({ length: 5 }, () => {
			const faces = shuffle(PORTRAITS, rng).slice(0, 6 + Math.floor(rng() * 5))
			return [...faces, pick(faces, rng)]
		}),
		seen: [],
		position: 0,
		cleared: 0,
		errors: 0,
		result: null,
	}),
	toAct: (s) => (s.result ? [] : [0]),
	parseMove: parseActions("new", "seen"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 1, 0)
		blank(move.value)
		if (move.action !== "new" && move.action !== "seen") return illegal("Choose new or seen.")
		const face = s.rounds[0][s.position],
			repeated = s.seen.includes(face)
		if (repeated) {
			if (move.action === "new") return { ...s, result: { winners: [] } }
			const cleared = s.cleared + 1
			return {
				...s,
				rounds: s.rounds.slice(1),
				seen: [],
				position: 0,
				cleared,
				result: cleared === 5 ? { winners: [0] } : null,
			}
		}
		const errors = s.errors + (move.action === "seen" ? 1 : 0)
		return {
			...s,
			errors,
			seen: [...s.seen, face],
			position: s.position + 1,
			result: errors > 10 ? { winners: [] } : null,
		}
	},
	outcome: (s) => s.result,
	view: (s) =>
		view("Spot the portrait", "Does every detail match a portrait from this round?", [s.cleared], {
			round: roundOf("Round", Math.min(s.cleared + 1, 5), 5),
			scoreLabel: "Rounds cleared",
			facts: [`False alarms: ${s.errors} of 10 allowed.`],
			board: !s.result
				? {
						columns: 1,
						cells: [
							{ label: s.rounds[0][s.position], piece: PORTRAIT_PIECES[PORTRAITS.indexOf(s.rounds[0][s.position])] },
						],
					}
				: undefined,
			choices: s.result ? [] : [choice("New face", "new"), choice("Seen before", "seen")],
			log: [
				...Array.from({ length: s.cleared }, (_, index) => `Round ${index + 1}: repeat found.`),
				...(s.result ? [s.result.winners.length ? "Five repeats found." : "The memory trial ended."] : []),
			],
		}),
}
