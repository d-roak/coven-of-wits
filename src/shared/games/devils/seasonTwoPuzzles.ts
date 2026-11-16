import { type GameDef, illegal, pick, shuffle } from "../../game.js"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial.js"
import { active, allowed, at, choice, result, selected, view } from "./seasonTwoCommon.js"

const HUES = ["ember", "gold", "brook", "moss", "violet", "ivory"]
interface UnknownState {
	positions: number[]
	cubes: number[][]
	tiles: number[]
	exiles: number[]
	turn: number
	turns: number
	extra: number
	winner: number | null
	log: string[]
}
const starts = [0, 4, 20, 24, 2]
const adjacent = (at: number) =>
	[at % 5 > 0 ? at - 1 : -1, at % 5 < 4 ? at + 1 : -1, at >= 5 ? at - 5 : -1, at < 20 ? at + 5 : -1].filter(
		(n) => n >= 0,
	)
const unknownChoices = (s: UnknownState, seat: number) => {
	if (s.winner !== null || s.turns >= 60 || seat !== s.turn) return []
	const choices = adjacent(s.positions[seat])
		.filter((to) => {
			const occupied = s.positions.indexOf(to)
			if (occupied < 0) return true
			const beyond = to + (to - s.positions[seat])
			return adjacent(to).includes(beyond) && !s.positions.includes(beyond)
		})
		.map((to) => choice(`Roll to ${to + 1} (${to === 12 ? "gate" : HUES[s.tiles[to]]})`, "roll", to))
	return choices.length ? choices : [choice("Pass blocked cube", "pass", "")]
}
function rolled(c: number[], delta: number): number[] {
	const [t, b, n, s, e, w] = c
	switch (delta) {
		case 1:
			return [w, e, n, s, t, b]
		case -1:
			return [e, w, n, s, b, t]
		case -5:
			return [s, n, t, b, e, w]
		case 5:
			return [n, s, b, t, e, w]
		default:
			return illegal("Roll one neighbouring square.")
	}
}
export const unknown: GameDef<UnknownState, TrialMove, TrialView> = {
	id: "unknown",
	name: "Unknown",
	blurb: "Roll a coloured cube. Learn the grove’s hidden laws from what changes.",
	players: { min: 2, max: 5 },
	rules: [
		"A compact 5×5 adaptation of the cube race. Roll one orthogonal square toward the centre gate; the cube’s top colour changes with the roll.",
		"The grove applies hidden colour rules. Observe exile, recolouring and extra turns; rules are revealed after each full table cycle.",
		"Pushing rolls the other cube one square; you cannot push a chain or off the board. An ivory top or tile exiles a cube to its home corner.",
		"This edition uses a new board, automatic recolouring and no remote-control rule. Exile sends a cube to the nearest free home square. Extra turns are capped at 2 in a row.",
		"Reach the gate to win before colour effects apply. A completely blocked cube passes. After 60 turns, closest to the gate wins, with fewer exiles breaking ties.",
	],
	setup: (rng, n) => ({
		positions: starts.slice(0, n),
		cubes: Array.from({ length: n }, () => [0, 1, 2, 3, 4, 5]),
		tiles: Array.from({ length: 25 }, (_, at) => (starts.includes(at) || at === 12 ? 0 : Math.floor(rng() * 6))),
		exiles: Array(n).fill(0),
		turn: 0,
		turns: 0,
		extra: 0,
		winner: null,
		log: [],
	}),
	toAct: (s) => (s.winner !== null || s.turns >= 60 ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, unknownChoices(s, seat))
		if (m.action === "pass")
			return {
				...s,
				turn: (seat + 1) % s.positions.length,
				turns: s.turns + 1,
				extra: 0,
				log: [...s.log, `Mage ${seat + 1} passed a blocked cube.`],
			}
		const to = Number(m.value),
			delta = to - s.positions[seat],
			positions = [...s.positions],
			cubes = s.cubes.map((c) => [...c]),
			exiles = [...s.exiles]
		const pushed = positions.indexOf(to)
		if (pushed >= 0) {
			positions[pushed] += delta
			cubes[pushed] = rolled(cubes[pushed], delta)
		}
		positions[seat] = to
		cubes[seat] = rolled(cubes[seat], delta)
		const log = [...s.log, `Mage ${seat + 1} rolled from ${s.positions[seat] + 1} to ${to + 1}.`]
		const exile = (who: number) => {
			const homes = [starts[who], ...starts, ...Array.from({ length: 25 }, (_, i) => i)]
			positions[who] = homes.find((home) => home !== 12 && !positions.some((p, i) => i !== who && p === home))!
			cubes[who] = [0, 1, 2, 3, 4, 5]
			exiles[who]++
			log.push(`Mage ${who + 1} was exiled after showing ivory.`)
		}
		let winner = s.winner
		let extra = false
		for (const who of [pushed, seat].filter((n) => n >= 0)) {
			const at = positions[who]
			if (at === 12 && who === seat) {
				winner = seat
				continue
			}
			if (cubes[who][0] === 5 || s.tiles[at] === 5) {
				exile(who)
				continue
			}
			if (who !== seat) continue
			const around = Array.from({ length: 25 }, (_, i) => i).filter(
				(i) => i !== at && Math.abs((i % 5) - (at % 5)) <= 1 && Math.abs(Math.floor(i / 5) - Math.floor(at / 5)) <= 1,
			)
			if (!around.some((i) => s.tiles[i] === cubes[who][0])) {
				const color = s.tiles[around[0]],
					index = cubes[who].indexOf(color)
				;[cubes[who][0], cubes[who][index]] = [cubes[who][index], cubes[who][0]]
				log.push(`Mage ${who + 1} changed top colour to ${HUES[color]}.`)
			}
			if (cubes[who][0] === 5) {
				exile(who)
				continue
			}
			const x = at % 5,
				y = Math.floor(at / 5)
			extra = [
				[1, 0],
				[0, 1],
				[1, 1],
				[1, -1],
			].some(([dx, dy]) =>
				[-1, 0, 1].every((step) => {
					const nx = x + dx * step,
						ny = y + dy * step
					return nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && s.tiles[ny * 5 + nx] === cubes[who][0]
				}),
			)
			if (extra && s.extra < 2) log.push(`Mage ${who + 1} received another roll.`)
		}
		const repeat = extra && s.extra < 2
		return {
			...s,
			positions,
			cubes,
			exiles,
			winner,
			turn: repeat ? seat : (seat + 1) % s.positions.length,
			turns: s.turns + 1,
			extra: repeat ? s.extra + 1 : 0,
			log: log,
		}
	},
	outcome: (s) =>
		s.winner !== null
			? { winners: [s.winner] }
			: s.turns >= 60
				? result(
						s.positions.map(
							(p, i) => (4 - Math.abs((p % 5) - 2) - Math.abs(Math.floor(p / 5) - 2)) * 100 - s.exiles[i],
						),
					)
				: null,
	view(s, seat) {
		const rules = [
			"Ivory top or tile sends a cube home.",
			"If its top colour is missing from surrounding tiles, the cube changes colour.",
			"A straight line of 3 matching tiles grants another roll.",
		]
		const v = view(
			"Discover the rules",
			at("Roll", Math.min(s.turns + 1, 60), 60, "Reach square 13."),
			s.exiles.map((n) => -n),
			unknownChoices(s, seat),
			[
				`Your top: ${HUES[s.cubes[seat][0]]}`,
				`Your cube: top ${HUES[s.cubes[seat][0]]}, north ${HUES[s.cubes[seat][2]]}, east ${HUES[s.cubes[seat][4]]}`,
				...rules.slice(0, Math.floor(s.turns / s.positions.length)),
			],
			s.log,
		)
		v.displays = [
			{
				label: "Your cube orientation",
				items: [0, 2, 4].map((face, i) => ({
					label: ["Top", "North", "East"][i],
					piece: { kind: "tile", text: HUES[s.cubes[seat][face]], tone: s.cubes[seat][face] },
				})),
			},
		]
		v.facts = v.facts.slice(2)
		v.scoreLabel = "Exile penalty"
		v.board = {
			confirm: "Roll cube",
			columns: 5,
			cells: s.tiles.map((color, at) => ({
				label: `${at + 1} ${at === 12 ? "Gate" : HUES[color]}${s.positions.includes(at) ? ` M${s.positions.indexOf(at) + 1}` : ""}`,
				tone: color,
				piece:
					at === 12
						? { kind: "token", icon: "key" }
						: s.positions.includes(at)
							? { kind: "token", icon: "pawn", text: `M${s.positions.indexOf(at) + 1}`, tone: s.positions.indexOf(at) }
							: { kind: "tile", text: HUES[color], tone: color },
				preview: [s.positions[seat], at],
				move: v.choices.find((c) => Number(c.move.value) === at)?.move,
			})),
		}
		return v
	},
	bot(v, _seat, rng) {
		if (v.choices[0]?.move.action === "pass") return v.choices[0].move
		const near = v.choices.map((c) => ({
			c,
			d: Math.abs((Number(c.move.value) % 5) - 2) + Math.abs(Math.floor(Number(c.move.value) / 5) - 2),
		}))
		const best = Math.min(...near.map((c) => c.d))
		return pick(
			near.filter((c) => c.d === best),
			rng,
		).c.move
	},
}

type Op = "+" | "-" | "*" | "/"
interface Tile {
	number: number
	op: Op
}
interface PyramidRound {
	tiles: Tile[]
	target: number
}
interface PyramidState {
	rounds: PyramidRound[]
	scores: number[]
	turn: number
	claims: string[]
	attempts: number
	round: number
	log: string[]
}
const OPS: Op[] = ["+", "-", "*", "/"]
const calc = (tiles: Tile[], cells: number[]) => {
	let sum = 0,
		term = tiles[cells[0]].number,
		sign = 1
	for (const at of cells.slice(1)) {
		const { number, op } = tiles[at]
		if (op === "*") term *= number
		else if (op === "/") {
			if (number === 0) return null
			term /= number
		} else {
			sum += sign * term
			term = number
			sign = op === "+" ? 1 : -1
		}
	}
	return sum + sign * term
}
const triples = Array.from({ length: 10 }, (_, a) =>
	Array.from({ length: 10 }, (_, b) => Array.from({ length: 10 }, (_, c) => [a, b, c])).flat(),
)
	.flat()
	.filter((t) => new Set(t).size === 3)
const pyramidRound = (rng: () => number): PyramidRound => {
	const tiles = Array.from({ length: 10 }, () => ({ number: 1 + Math.floor(rng() * 9), op: pick(OPS, rng) }))
	const answers = triples.map((t) => calc(tiles, t)!).filter((n) => Number.isInteger(n) && Math.abs(n) <= 99)
	return { tiles, target: pick(answers.length ? answers : triples.map((t) => calc(tiles, t)!), rng) }
}
export const equationPyramid: GameDef<PyramidState, TrialMove, TrialView> = {
	id: "equation-pyramid",
	name: "Equation Pyramid",
	blurb: "Read three arcane tiles in order. Make the target before your rival.",
	players: { min: 1, max: 2 },
	rules: [
		"A five-board, turn-based adaptation of the timed duel. Select 3 distinct tiles in order to form the target number.",
		"Ignore the first tile’s operator; use the operators on the second and third tiles. Multiplication and division happen first.",
		"A new correct ordered equation scores +1. Wrong or repeated answers score −1. Each board ends after 6 answers or after every solution is found.",
		"Most points after 5 boards wins. Solo play is solved with a positive score. This edition replaces buzzers and clocks with alternating turns.",
	],
	setup: (rng, n) => ({
		rounds: Array.from({ length: 5 }, () => pyramidRound(rng)),
		scores: Array(n).fill(0),
		turn: 0,
		claims: [],
		attempts: 0,
		round: 0,
		log: [],
	}),
	toAct: (s) => (s.round >= 5 ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		active(s.turn, seat, s.round >= 5)
		if (m.action !== "equation") illegal("Select three tiles to form an equation.")
		const cells = selected(
				m.value,
				Array.from({ length: 10 }, (_, i) => String(i)),
				3,
			).map(Number),
			p = s.rounds[s.round],
			key = cells.join(","),
			value = calc(p.tiles, cells),
			correct = value !== null && Math.abs(value - p.target) < 1e-9 && !s.claims.includes(key)
		const claims = correct ? [...s.claims, key] : s.claims
		const done =
			s.attempts + 1 >= 6 ||
			triples.filter((t) => Math.abs(calc(p.tiles, t)! - p.target) < 1e-9).every((t) => claims.includes(t.join(",")))
		return {
			...s,
			scores: s.scores.map((n, i) => n + (i === seat ? (correct ? 1 : -1) : 0)),
			turn: (seat + 1) % s.scores.length,
			claims: done ? [] : claims,
			attempts: done ? 0 : s.attempts + 1,
			round: s.round + (done ? 1 : 0),
			log: [
				...s.log,
				`Mage ${seat + 1}: tiles ${cells.map((n) => n + 1).join(" → ")} = ${value}; ${correct ? "+1" : "−1"}.`,
			],
		}
	},
	outcome: (s) =>
		s.round >= 5 ? (s.scores.length === 1 ? { winners: s.scores[0] > 0 ? [0] : [] } : result(s.scores)) : null,
	view(s, seat) {
		const p = s.rounds[Math.min(s.round, 4)]
		const v = view(
			"Arrange three tiles",
			at("Board", Math.min(s.round + 1, 5), 5, `Target: ${p.target}`),
			s.scores,
			[],
			[`Used: ${s.claims.join(";")}`],
			s.log,
		)
		if (s.round < 5 && seat === s.turn)
			v.selection = {
				label: "Choose 3 tiles in equation order",
				action: "equation",
				min: 3,
				max: 3,
				ordered: true,
				onBoard: true,
				submit: "Offer equation",
				options: p.tiles.map((t, i) => ({
					value: String(i),
					label: `${i + 1}: ${t.number} (${t.op})`,
					piece: { kind: "tile", text: `${t.op} ${t.number}` },
				})),
			}
		v.board = {
			columns: 4,
			layout: "pyramid",
			cells: p.tiles.map((t, i) => ({
				label: `${i + 1}: ${t.op} ${t.number}`,
				piece: { kind: "tile", text: `${t.op} ${t.number}` },
			})),
		}
		v.displays = [
			{ label: "Target", items: [{ label: `Make ${p.target}`, piece: { kind: "tile", text: String(p.target) } }] },
			{
				label: "Accepted equations on this board",
				items: s.claims.map((claim) => ({
					label: claim
						.split(",")
						.map((at, i) => `${i ? p.tiles[Number(at)].op : ""}${p.tiles[Number(at)].number}`)
						.join(" "),
					piece: { kind: "token", icon: "seal" },
				})),
			},
		]
		v.facts.push("Choose three tiles in order. Ignore the first tile’s operator; multiplication and division go first.")
		return v
	},
	round: (s) => Math.min(s.round + 1, 5),
	bot(v, _seat, rng) {
		const tiles = v.selection!.options.map((o) => {
				const match = o.label.match(/: (\d+) \(([+*/-])\)/)!
				return { number: Number(match[1]), op: match[2] as Op }
			}),
			target = Number(v.prompt.slice(8)),
			used = v.facts
				.find((f) => f.startsWith("Used: "))!
				.slice(6)
				.split(";")
		const solutions = triples.filter((t) => Math.abs(calc(tiles, t)! - target) < 1e-9 && !used.includes(t.join(",")))
		return { action: "equation", value: JSON.stringify(pick(solutions.length ? solutions : triples, rng).map(String)) }
	},
}

interface KeyState {
	pictures: string[]
	phase: "riddle" | "pictures" | "lock" | "done"
	path: number[]
	mistakes: number
	won: boolean
	log: string[]
}
const PHRASE = "FINDTHEKEY"
const PICTURES = ["Fox", "Ink", "Nest", "Deer", "Torch", "Hat", "Elm", "Key", "Yak", "Moon", "Owl", "Bat"]
const keyOver = (s: KeyState) => s.phase === "done" || s.mistakes >= 3
export const findTheKey: GameDef<KeyState, TrialMove, TrialView> = {
	id: "find-the-key",
	name: "Find the Key",
	blurb: "A locked well, a ring of pictures, and a message hidden in their initials.",
	players: { min: 1, max: 1 },
	rules: [
		"A text-and-symbol adaptation of the prison well challenge, without water or an enforced deadline. You have 3 mistakes across the whole puzzle.",
		"Solve the entrance riddle. Then choose pictures whose initials spell FIND THE KEY, in order; a picture may be used more than once.",
		"Each picture has a rune number. Read the chosen rune numbers in sequence and enter that sequence to open the safe.",
		"This edition randomizes the picture arrangement and uses a typed rune sequence instead of the physical well mechanism.",
	],
	setup: (rng) => ({ pictures: shuffle(PICTURES, rng), phase: "riddle", path: [], mistakes: 0, won: false, log: [] }),
	toAct: (s) => (keyOver(s) ? [] : [0]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		active(0, seat, keyOver(s))
		if (s.phase === "riddle") {
			if (m.action !== "answer") illegal("Answer the entrance riddle.")
			return m.value.trim().toLowerCase() === "tomorrow"
				? { ...s, phase: "pictures", log: [...s.log, "The entrance opened."] }
				: { ...s, mistakes: s.mistakes + 1, log: [...s.log, "The entrance stayed closed."] }
		}
		if (s.phase === "pictures") {
			allowed(
				m,
				s.pictures.map((p, i) => choice(p, "picture", i)),
			)
			const at = Number(m.value)
			if (s.pictures[at][0] !== PHRASE[s.path.length])
				return { ...s, mistakes: s.mistakes + 1, log: [...s.log, "That initial does not fit the message."] }
			const path = [...s.path, at]
			return {
				...s,
				path,
				phase: path.length === PHRASE.length ? "lock" : "pictures",
				log: [...s.log, `${s.pictures[at]} added rune ${at + 1}.`],
			}
		}
		if (m.action !== "unlock") illegal("Enter the rune sequence to open the safe.")
		const wanted = s.path.map((n) => n + 1).join("-")
		return m.value.trim() === wanted
			? { ...s, phase: "done", won: true, log: [...s.log, "The safe opened."] }
			: { ...s, mistakes: s.mistakes + 1, log: [...s.log, "The rune sequence did not fit."] }
	},
	outcome: (s) => (keyOver(s) ? { winners: s.won ? [0] : [] } : null),
	view(s) {
		const prompt =
			s.phase === "riddle"
				? "What is always coming, but never arrives?"
				: s.phase === "pictures"
					? at("Initial", Math.min(s.path.length + 1, 10), 10, "Spell FIND THE KEY with the pictures’ initials.")
					: "Open the safe with your rune sequence"
		const v = view(
			s.phase,
			prompt,
			[s.path.length],
			s.phase === "pictures" && !keyOver(s) ? s.pictures.map((p, i) => choice(`${i + 1} · ${p}`, "picture", i)) : [],
			[`Chances: ${3 - s.mistakes}`, `Rune sequence: ${s.path.map((n) => n + 1).join("-")}`],
			s.log,
		)
		if (!keyOver(s) && s.phase !== "pictures")
			v.input = {
				label: s.phase === "riddle" ? "Riddle answer" : "Rune numbers joined with hyphens",
				action: s.phase === "riddle" ? "answer" : "unlock",
				kind: "text",
			}
		const icons: import("./trial.js").TrialIcon[] = [
			"fox",
			"ink",
			"nest",
			"deer",
			"torch",
			"hat",
			"elm",
			"key",
			"yak",
			"moon",
			"owl",
			"bat",
		]
		v.choices = v.choices.map((c) => ({
			...c,
			piece: {
				kind: "token",
				icon: icons[PICTURES.indexOf(s.pictures[Number(c.move.value)])],
				text: s.pictures[Number(c.move.value)],
			},
		}))
		v.displays = [
			{
				label: "Collected runes",
				items: s.path.map((at) => ({ label: s.pictures[at], piece: { kind: "tile", text: String(at + 1) } })),
			},
		]
		if (s.phase === "lock" && !keyOver(s)) {
			delete v.input
			v.forms = [
				{
					label: "Set the safe’s runes",
					action: "unlock",
					submit: "Open safe",
					fields: s.path.map((_, i) => ({ label: `Rune ${i + 1}`, kind: "number", min: 1, max: s.pictures.length })),
					format: s.path.map((_, i) => `{${i}}`).join("-"),
				},
			]
		}
		return v
	},
	bot(v) {
		if (v.phase === "riddle") return { action: "answer", value: "tomorrow" }
		if (v.phase === "lock") return { action: "unlock", value: v.facts[1].slice("Rune sequence: ".length) }
		const index = v.scores[0]
		return v.choices.find((c) => c.label.split(" · ")[1][0] === PHRASE[index])!.move
	},
}
