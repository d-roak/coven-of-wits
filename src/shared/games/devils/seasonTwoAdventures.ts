import { type GameDef, type Outcome, pick } from "../../game.js"
import { parseTrialMove, type TrialMove, type TrialView } from "./trial.js"
import { allowed, at, choice, randomAction, result, view, numberControl, step } from "./seasonTwoCommon.js"

const near = (at: number) =>
	[at % 5 > 0 ? at - 1 : -1, at % 5 < 4 ? at + 1 : -1, at >= 5 ? at - 5 : -1, at < 20 ? at + 5 : -1].filter(
		(n) => n >= 0,
	)
interface CopsState {
	positions: number[]
	crooked: number | null
	treasure: number[]
	stolen: number
	turn: number
	turns: number
	reports: string[]
	result: Outcome | null
	log: string[]
}
const copsChoices = (s: CopsState, seat: number) => {
	if (s.result || seat !== s.turn) return []
	const moves = near(s.positions[seat]).map((to) => choice(`Move to ${to + 1}`, "move", to))
	if (seat !== 0)
		for (const at of [s.positions[seat], ...near(s.positions[seat])]) {
			moves.push(choice(`Investigate ${at + 1}`, "investigate", at))
			moves.push(choice(`Arrest at ${at + 1}`, "arrest", at))
		}
	return moves
}
export const crookedCops: GameDef<CopsState, TrialMove, TrialView> = {
	id: "crooked-cops",
	name: "Crooked Cops",
	blurb: "Follow a hidden thief’s trail. One of your fellow wardens may be lying.",
	players: { min: 3, max: 5 },
	rules: [
		"A compact pursuit adaptation on a 5×5 grove. Mage 1 is the thief; at tables of 4 or 5, one other mage is secretly crooked. Honest wardens win together.",
		"The thief’s position is hidden and they collect relics by landing on marked squares. Steal 3 relics or evade capture for 12 table cycles to win.",
		"On your turn, move one square, investigate your square or a neighbour, or attempt an arrest there. Investigations are private. Honest arrest on the thief’s square wins immediately; a crooked arrest fails.",
		"The thief knows the crooked warden. The crooked warden shares the thief’s win. This edition has one thief, one action per turn, a new map, and no accusation phase or team radio.",
	],
	setup: (rng, n) => ({
		positions: [12, ...[0, 4, 20, 24].slice(0, n - 1)],
		crooked: n >= 4 ? 1 + Math.floor(rng() * (n - 1)) : null,
		treasure: [6, 8, 16, 18],
		stolen: 0,
		turn: 0,
		turns: 0,
		reports: Array(n).fill("No investigation yet."),
		result: null,
		log: [],
	}),
	toAct: (s) => (s.result ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, copsChoices(s, seat))
		const at = Number(m.value),
			next = {
				...s,
				positions: [...s.positions],
				reports: [...s.reports],
				turn: (seat + 1) % s.positions.length,
				turns: s.turns + 1,
				log: [...s.log],
			}
		if (m.action === "move") {
			next.positions[seat] = at
			if (seat === 0 && s.treasure.includes(at)) {
				next.stolen++
				next.treasure = s.treasure.filter((n) => n !== at)
				next.log.push(`A relic vanished at ${at + 1}.`)
			} else next.log.push(seat === 0 ? "The thief moved unseen." : `Mage ${seat + 1} moved to ${at + 1}.`)
		} else if (m.action === "investigate") {
			next.reports[seat] = s.positions[0] === at ? `Fresh trail at ${at + 1}.` : `No thief at ${at + 1}.`
			next.log.push(`Mage ${seat + 1} investigated privately.`)
		} else if (seat !== s.crooked && s.positions[0] === at) {
			next.result = { winners: s.positions.flatMap((_, i) => (i !== 0 && i !== s.crooked ? [i] : [])) }
			next.log.push("The thief was caught.")
		} else next.log.push(`Mage ${seat + 1} made an unsuccessful arrest.`)
		if (!next.result && (next.stolen >= 3 || next.turns >= s.positions.length * 12))
			next.result = { winners: s.crooked === null ? [0] : [0, s.crooked] }
		return next
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const role = seat === 0 ? "Thief" : seat === s.crooked ? "Crooked warden" : "Honest warden"
		const v = view(
			"Hidden pursuit",
			at("Cycle", Math.min(Math.floor(s.turns / s.positions.length) + 1, 12), 12),
			s.positions.map((_, i) => (i === 0 ? s.stolen : 0)),
			copsChoices(s, seat),
			[
				`Your role: ${role}`,
				`Your square: ${s.positions[seat] + 1}`,
				`Relics stolen: ${s.stolen} / 3`,
				s.reports[seat],
				...(seat === 0 ? [s.crooked === null ? "No crooked warden" : `Crooked ally: Mage ${s.crooked + 1}`] : []),
			],
			s.log,
		)
		v.choices = v.choices.map((c) => ({
			...c,
			steps: [
				step(
					"Choose an action",
					c.move.action,
					c.move.action === "move" ? "Move" : c.move.action === "investigate" ? "Investigate" : "Arrest",
				),
				step("Choose a square", c.move.value, `Square ${Number(c.move.value) + 1}`),
			],
		}))
		v.board = {
			confirm: "Confirm move",
			columns: 5,
			cells: Array.from({ length: 25 }, (_, at) => ({
				label: `${at + 1}${s.treasure.includes(at) ? " Relic" : ""}${s.positions.flatMap((p, i) => (p === at && (i !== 0 || seat === 0) ? [` M${i + 1}`] : [])).join("")}`,
				piece: s.positions.some((p, i) => p === at && (i !== 0 || seat === 0))
					? { kind: "stack", owners: s.positions.flatMap((p, i) => (p === at && (i !== 0 || seat === 0) ? [i] : [])) }
					: s.treasure.includes(at)
						? { kind: "token", icon: "gem" }
						: undefined,
				preview: [s.positions[seat], at],
				move: v.choices.find((c) => c.move.action === "move" && Number(c.move.value) === at)?.move,
			})),
		}
		return v
	},
	round: (s) => Math.min(Math.floor(s.turns / s.positions.length) + 1, 12),
	bot(v, _seat, rng) {
		const report = v.facts.find((f) => f.startsWith("Fresh trail at "))
		if (report) {
			const square = Number(report.match(/\d+/)![0]) - 1
			const arrest = v.choices.find((c) => c.move.action === "arrest" && Number(c.move.value) === square)
			if (arrest) return arrest.move
		}
		if (v.facts[0] === "Your role: Thief") {
			const targets = v.board!.cells.flatMap((c, i) => (c.label.includes("Relic") ? [i] : []))
			const moves = v.choices.map((c) => ({
				c,
				d: Math.min(
					...targets.map(
						(t) =>
							Math.abs((t % 5) - (Number(c.move.value) % 5)) +
							Math.abs(Math.floor(t / 5) - Math.floor(Number(c.move.value) / 5)),
					),
				),
			}))
			const best = Math.min(...moves.map((x) => x.d))
			return pick(
				moves.filter((x) => x.d === best),
				rng,
			).c.move
		}
		return randomAction(v, _seat, rng)
	},
}

interface Monster {
	hp: number
	max: number
	poison: number | null
	dead: boolean
}
interface MonsterState {
	monsters: Monster[]
	weapons: string[][]
	points: number[]
	turn: number
	turns: number
	log: string[]
}
const monsterChoices = (s: MonsterState, seat: number) =>
	s.turns >= 60 || s.monsters.every((m) => m.dead) || seat !== s.turn
		? []
		: s.monsters.flatMap((monster, target) =>
				monster.dead
					? []
					: s.weapons[seat].map((w) => choice(`${w} against monster ${target + 1}`, "attack", `${target}:${w}`)),
			)
const allianceScores = (s: MonsterState) =>
	s.points.map((_, seat) => {
		const start = Math.floor(seat / 2) * 2
		const members = s.points.slice(start, start + 2)
		return members.reduce((a, b) => a + b, 0) / members.length
	})
export const halloweenMonster: GameDef<MonsterState, TrialMove, TrialView> = {
	id: "halloween-monster",
	name: "Halloween Monster",
	blurb: "Choose your weapon and time the last strike. Your coven shares the spoils.",
	players: { min: 3, max: 5 },
	rules: [
		"A compact combat adaptation with 5 monsters and fixed pairs: mages 1–2 and 3–4 are covens; an unpaired mage plays alone.",
		"Choose a living monster and weapon. Dagger deals 3 and is reusable; grenade deals 6 once; poison deals 1 now and 1 at the end of every table cycle. A newer poison replaces its owner.",
		"The killing blow earns the monster’s starting health in points. Poison kills credit the poison’s owner. Covens share the average of their members’ points.",
		"The highest coven average wins after every monster dies or 60 turns. This edition reveals health, auto-assigns alliances, and omits weapon trading, delayed explosives and player attacks.",
	],
	setup: (_rng, n) => ({
		monsters: [5, 7, 9, 11, 13].map((hp) => ({ hp, max: hp, poison: null, dead: false })),
		weapons: Array.from({ length: n }, () => ["dagger", "grenade", "poison"]),
		points: Array(n).fill(0),
		turn: 0,
		turns: 0,
		log: [],
	}),
	toAct: (s) => (s.turns >= 60 || s.monsters.every((m) => m.dead) ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, monsterChoices(s, seat))
		const [targetRaw, weapon] = m.value.split(":"),
			target = Number(targetRaw)
		const monsters = s.monsters.map((m) => ({ ...m })),
			points = [...s.points]
		const monster = monsters[target]
		monster.hp = Math.max(0, monster.hp - (weapon === "grenade" ? 6 : weapon === "poison" ? 1 : 3))
		if (weapon === "poison") monster.poison = seat
		if (monster.hp === 0) {
			monster.dead = true
			points[seat] += monster.max
		}
		const log = [
			...s.log,
			`Mage ${seat + 1} used ${weapon} on monster ${target + 1}: ${monster.hp}/${monster.max} health${monster.dead ? `; Mage ${seat + 1} gained ${monster.max} points` : ""}.`,
		]
		if (seat === s.points.length - 1)
			for (const current of monsters)
				if (!current.dead && current.poison !== null) {
					current.hp = Math.max(0, current.hp - 1)
					log.push(
						`Poison from Mage ${current.poison + 1} reduced monster ${monsters.indexOf(current) + 1} to ${current.hp}/${current.max}${current.hp === 0 ? `; Mage ${current.poison + 1} gained ${current.max} points` : ""}.`,
					)
					if (current.hp === 0) {
						current.dead = true
						points[current.poison] += current.max
					}
				}
		return {
			...s,
			monsters,
			points,
			weapons: s.weapons.map((weapons, i) =>
				i === seat && weapon !== "dagger" ? weapons.filter((w) => w !== weapon) : weapons,
			),
			turn: (seat + 1) % s.points.length,
			turns: s.turns + 1,
			log,
		}
	},
	outcome: (s) => (s.turns >= 60 || s.monsters.every((m) => m.dead) ? result(allianceScores(s)) : null),
	view(s, seat) {
		const v = view(
			"Choose an attack",
			`Mage ${s.turn + 1} acts`,
			allianceScores(s),
			monsterChoices(s, seat),
			[
				`Your weapons: ${s.weapons[seat].join(", ")}`,
				`Individual points: ${s.points.join(" / ")}`,
				...s.monsters.map(
					(m, i) =>
						`Monster ${i + 1}: ${m.dead ? "defeated" : `${m.hp}/${m.max} health${m.poison === null ? "" : ", poisoned"}`}`,
				),
			],
			s.log,
		)
		const weaponPiece = (weapon: string): import("./trial.js").TrialPiece => ({
			kind: "token",
			icon: weapon === "dagger" ? "sword" : weapon === "grenade" ? "fire" : "vial",
		})
		v.facts = [
			`Individual points: ${s.points.join(" / ")}`,
			"Covens: mages 1–2 and 3–4 share their average; mage 5 plays alone.",
		]
		v.scoreLabel = "Coven average"
		v.displays = [
			{
				label: "Monsters",
				items: s.monsters.map((m, i) => ({
					label: `Monster ${i + 1}: ${m.dead ? "defeated" : `${m.hp}/${m.max} health${m.poison === null ? "" : ` · poison from Mage ${m.poison + 1}`}`}`,
					piece: { kind: "token", icon: "skull", text: `${m.hp}/${m.max}`, tone: i },
				})),
			},
			{ label: "Your weapons", items: s.weapons[seat].map((w) => ({ label: w, piece: weaponPiece(w) })) },
		]
		v.choices = v.choices.map((c) => {
			const [target, weapon] = c.move.value.split(":")
			const monster = s.monsters[Number(target)]
			return {
				...c,
				steps: [
					step("Choose a weapon", weapon, weapon, weaponPiece(weapon)),
					step("Choose a monster", target, `Monster ${Number(target) + 1} · ${monster.hp}/${monster.max}`, {
						kind: "token",
						icon: "skull",
						tone: Number(target),
						text: String(monster.hp),
					}),
				],
			}
		})
		return v
	},
	round: (s) =>
		Math.floor(Math.max(0, s.turns - (s.monsters.every((m) => m.dead) || s.turns >= 60 ? 1 : 0)) / s.points.length) + 1,
	bot: randomAction,
}

// The bot tells the two phases apart by this title, so both read it from here.
const TREASURE_PHASES = { auction: "Bid for arrows", explore: "Explore the island" } as const
interface TreasureState {
	treasure: number
	positions: number[]
	budgets: number[]
	bids: (number | null)[]
	arrows: number[]
	opened: number[][]
	globalOpened: number[]
	scores: number[]
	round: number
	phase: "auction" | "explore"
	turn: number
	done: boolean
	log: string[]
}
const BOXES = [4, 12, 20, 24],
	ROCKS = [7, 17]
const treasureChoices = (s: TreasureState, seat: number) => {
	if (s.done) return []
	if (s.phase === "auction")
		return s.bids[seat] === null
			? Array.from({ length: Math.min(10, s.budgets[seat]) + 1 }, (_, n) =>
					choice(`Bid ${n} chips for arrows`, "bid", n),
				)
			: []
	if (seat !== s.turn) return []
	return [
		choice("End exploration", "pass", ""),
		...near(s.positions[seat])
			.filter((at) => !ROCKS.includes(at))
			.map((at) => choice(`Follow arrow to ${at + 1}`, "move", at)),
	]
}
export const treasureIsland: GameDef<TreasureState, TrialMove, TrialView> = {
	id: "treasure-island",
	name: "Treasure Island",
	blurb: "Bid for arrows, follow the paths, and read clues to a buried relic.",
	players: { min: 2, max: 5 },
	rules: [
		"A 5×5 adaptation with 4 clue boxes and 4 auction/exploration cycles. Each mage has 20 auction chips; bids spend chips even when they lose.",
		"The highest bidders receive 8 arrows each; everyone else receives 4. Spend one arrow per orthogonal step. Rock squares cannot be entered.",
		"Reaching a new box reveals a clue privately. Its first visitor gains 3 points, later visitors 1; revisiting your own box scores nothing.",
		"The treasure box adds 10 points and ends the game. Otherwise most points after 4 explorations wins.",
		"This edition keeps routes between cycles and uses single-step arrows. It omits the show’s 3D placements, borrowing and piece purchases.",
	],
	setup: (rng, n) => ({
		treasure: pick(BOXES, rng),
		positions: Array(n).fill(0),
		budgets: Array(n).fill(20),
		bids: Array(n).fill(null),
		arrows: Array(n).fill(0),
		opened: Array.from({ length: n }, () => []),
		globalOpened: [],
		scores: Array(n).fill(0),
		round: 0,
		phase: "auction",
		turn: 0,
		done: false,
		log: [],
	}),
	toAct: (s) => (s.done ? [] : s.phase === "auction" ? s.bids.flatMap((n, i) => (n === null ? [i] : [])) : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, treasureChoices(s, seat))
		if (m.action === "bid") {
			const bids = s.bids.map((n, i) => (i === seat ? Number(m.value) : n))
			if (bids.some((n) => n === null)) return { ...s, bids }
			const high = Math.max(...(bids as number[]))
			return {
				...s,
				bids,
				budgets: s.budgets.map((n, i) => n - bids[i]!),
				arrows: bids.map((n) => (n === high ? 8 : 4)),
				phase: "explore",
				turn: 0,
				log: [
					...s.log,
					`Cycle ${s.round + 1}: arrow awards ${bids.map((n, i) => `Mage ${i + 1}: ${n === high ? 8 : 4}`).join("; ")}.`,
				],
			}
		}
		const next = {
			...s,
			positions: [...s.positions],
			arrows: [...s.arrows],
			opened: s.opened.map((v) => [...v]),
			globalOpened: [...s.globalOpened],
			scores: [...s.scores],
			log: [...s.log],
		}
		if (m.action === "pass") {
			next.arrows[seat] = 0
			next.log.push(`Mage ${seat + 1} ended exploration.`)
		} else {
			const at = Number(m.value)
			next.positions[seat] = at
			next.arrows[seat]--
			next.log.push(`Mage ${seat + 1} followed an arrow to ${at + 1}.`)
			if (BOXES.includes(at) && !next.opened[seat].includes(at)) {
				next.opened[seat].push(at)
				next.scores[seat] += next.globalOpened.includes(at) ? 1 : 3
				next.globalOpened.push(at)
				next.log.push(`Mage ${seat + 1} opened box ${at + 1}.`)
				if (at === s.treasure) {
					next.scores[seat] += 10
					next.done = true
					next.log.push("The treasure was found.")
				}
			}
		}
		if (next.arrows[seat] === 0) {
			if (next.arrows.every((n) => n === 0)) {
				next.phase = "auction"
				next.round++
				next.done = next.round >= 4 || next.done
				next.bids = next.bids.map(() => null)
			} else {
				do {
					next.turn = (next.turn + 1) % next.arrows.length
				} while (next.arrows[next.turn] === 0)
			}
		}
		return next
	},
	outcome: (s) => (s.done ? result(s.scores) : null),
	view(s, seat) {
		const clues = s.opened[seat].map((at, i) =>
			i % 2 === 0
				? `Box ${at + 1}: treasure row ${Math.floor(s.treasure / 5) + 1}.`
				: `Box ${at + 1}: treasure column ${(s.treasure % 5) + 1}.`,
		)
		const v = view(
			TREASURE_PHASES[s.phase],
			at("Cycle", Math.min(s.round + 1, 4), 4),
			s.scores,
			treasureChoices(s, seat),
			[
				`Your chips: ${s.budgets[seat]}`,
				`Your arrows: ${s.arrows[seat]}`,
				`Your square: ${s.positions[seat] + 1}`,
				`Your opened boxes: ${s.opened[seat].map((n) => n + 1).join(", ")}`,
				...clues,
			],
			s.log,
		)
		numberControl(v, "bid", "Chips to spend for arrows")
		v.displays = [
			{
				label: "Your supplies",
				items: [
					{ label: `${s.budgets[seat]} chips`, piece: { kind: "token", icon: "coin", text: String(s.budgets[seat]) } },
					{ label: `${s.arrows[seat]} arrows`, piece: { kind: "token", icon: "arrow", text: String(s.arrows[seat]) } },
				],
			},
		]
		v.board = {
			confirm: "Follow arrow",
			columns: 5,
			cells: Array.from({ length: 25 }, (_, at) => ({
				preview: [s.positions[seat], at],
				piece: s.positions.includes(at)
					? { kind: "stack", owners: s.positions.flatMap((p, i) => (p === at ? [i] : [])) }
					: ROCKS.includes(at)
						? { kind: "token", icon: "seal" }
						: BOXES.includes(at)
							? { kind: "token", icon: "lock" }
							: undefined,
				label: `${at + 1}${ROCKS.includes(at) ? " Rock" : BOXES.includes(at) ? " Box" : ""}${s.positions.flatMap((p, i) => (p === at ? [` M${i + 1}`] : [])).join("")}`,
				move: v.choices.find((c) => c.move.action === "move" && Number(c.move.value) === at)?.move,
			})),
		}
		return v
	},
	round: (s) => Math.min(s.round + 1, 4),
	bot(v, _seat, rng) {
		if (v.phase === TREASURE_PHASES.auction)
			return pick(
				v.choices.filter((c) => Number(c.move.value) <= 5),
				rng,
			).move
		const opened = v.facts[3].match(/\d+/g)?.map((n) => Number(n) - 1) ?? []
		const targets = BOXES.filter((n) => !opened.includes(n))
		const moves = v.choices
			.filter((c) => c.move.action === "move")
			.map((c) => ({
				c,
				d: Math.min(
					...targets.map(
						(t) =>
							Math.abs((t % 5) - (Number(c.move.value) % 5)) +
							Math.abs(Math.floor(t / 5) - Math.floor(Number(c.move.value) / 5)),
					),
				),
			}))
		return pick(
			moves.filter((x) => x.d === Math.min(...moves.map((x) => x.d))),
			rng,
		).c.move
	},
}

interface MancalaState {
	pits: number[][]
	points: number[][]
	turn: number
	turns: number
	done: boolean
	log: string[]
}
const PIT_COLORS = [0, 1, 2, 0, 1, 2, -1, 0, 1, 2, 0, 1, 2, -2],
	COLOR_NAMES = ["ember", "brook", "moss"]
const mancalaScores = (s: MancalaState) => s.points.map((p) => 2 * Math.min(...p) - Math.max(...p))
function mancalaChoices(s: MancalaState, seat: number) {
	if (s.done || seat !== s.turn) return []
	return s.pits.flatMap((tokens, pit) =>
		!tokens.includes(seat)
			? []
			: [...new Set(tokens)].flatMap((last) => {
					const end = (pit + tokens.length) % 14,
						color = PIT_COLORS[end],
						extreme = color === -1 ? Math.min(...s.points[last]) : Math.max(...s.points[last]),
						colors = color >= 0 ? [color] : [0, 1, 2].filter((c) => s.points[last][c] === extreme)
					return colors.map((c) =>
						choice(`Sow pit ${pit + 1}; Mage ${last + 1} scores ${COLOR_NAMES[c]}`, "sow", `${pit}:${last}:${c}`),
					)
				}),
	)
}
export const balanceMancala: GameDef<MancalaState, TrialMove, TrialView> = {
	id: "balance-mancala",
	name: "Balance Mancala",
	blurb: "Sow the stones clockwise. A balanced score is worth more than a tall one.",
	players: { min: 2, max: 5 },
	rules: [
		"A 2–5 mage adaptation with 14 pits: 4 each in 3 colours, an angel pit and a devil pit. Each mage has 4 counters placed automatically.",
		"Choose a pit containing your counter. Pick which owner’s counter lands last; all other counters are sown in their current order, one per pit clockwise.",
		"The last counter’s owner gains points equal to the destination’s counter count. Coloured pits score their colour; angel scores their lowest colour, devil their highest. The mover chooses among tied colours.",
		"The game ends when any colour reaches 30, or after 100 turns. Final score = twice your lowest colour minus your highest colour.",
		"This edition automates initial placement, fixes the order before the last counter, and omits the show’s piece penalties.",
	],
	setup: (_rng, n) => ({
		pits: Array.from({ length: 14 }, (_, pit) =>
			Array.from({ length: n * 4 }, (_, i) => i)
				.filter((i) => i % 14 === pit)
				.map((i) => i % n),
		),
		points: Array.from({ length: n }, () => [0, 0, 0]),
		turn: 0,
		turns: 0,
		done: false,
		log: [],
	}),
	toAct: (s) => (s.done ? [] : [s.turn]),
	parseMove: parseTrialMove,
	apply(s, seat, m) {
		allowed(m, mancalaChoices(s, seat))
		const [pit, last, color] = m.value.split(":").map(Number),
			pits = s.pits.map((p) => [...p]),
			tokens = [...pits[pit]]
		tokens.splice(tokens.indexOf(last), 1)
		tokens.push(last)
		pits[pit] = []
		let at = pit
		for (const owner of tokens) {
			at = (at + 1) % 14
			pits[at].push(owner)
		}
		const points = s.points.map((p) => [...p])
		points[last][color] += pits[at].length
		return {
			...s,
			pits,
			points,
			turn: (seat + 1) % s.points.length,
			turns: s.turns + 1,
			done: points.some((p) => p.some((n) => n >= 30)) || s.turns + 1 >= 100,
			log: [...s.log, `Mage ${last + 1} gained ${pits[at].length} ${COLOR_NAMES[color]} points.`],
		}
	},
	outcome: (s) => (s.done ? result(mancalaScores(s)) : null),
	view(s, seat) {
		const v = view(
			"Sow clockwise",
			at("Turn", Math.min(s.turns + 1, 100), 100),
			mancalaScores(s),
			mancalaChoices(s, seat),
			s.points.map((p, i) => `Mage ${i + 1}: ${p.map((n, c) => `${COLOR_NAMES[c]} ${n}`).join(", ")}`),
			s.log,
		)
		v.facts = []
		v.scoreLabel = "Balance score"
		v.displays = s.points.map((points, i) => ({
			label: `Mage ${i + 1} colours`,
			items: points.map((n, color) => ({
				label: `${COLOR_NAMES[color]}: ${n}`,
				piece: {
					kind: "token",
					icon: color === 0 ? "fire" : color === 1 ? "water" : "leaf",
					text: String(n),
					tone: color,
				},
			})),
		}))
		v.choices = v.choices.map((c) => {
			const [pit, last, color] = c.move.value.split(":").map(Number)
			return {
				...c,
				steps: [
					step("Choose a pit", pit, `Pit ${pit + 1}`, { kind: "stack", owners: s.pits[pit] }),
					step("Choose the last counter", last, `Mage ${last + 1}`, { kind: "stack", owners: [last] }),
					step("Choose the scoring colour", color, COLOR_NAMES[color], {
						kind: "tile",
						text: COLOR_NAMES[color],
						tone: color,
					}),
				],
			}
		})
		v.board = {
			columns: 7,
			layout: "mancala",
			cells: s.pits.map((p, i) => ({
				piece: { kind: "stack", owners: p },
				tone: PIT_COLORS[i] >= 0 ? PIT_COLORS[i] : undefined,
				preview: Array.from({ length: p.length }, (_, offset) => (i + offset + 1) % 14),
				label: `${i + 1} ${PIT_COLORS[i] === -1 ? "Angel" : PIT_COLORS[i] === -2 ? "Devil" : COLOR_NAMES[PIT_COLORS[i]]}: ${p.map((n) => `M${n + 1}`).join(" ") || "empty"}`,
			})),
		}
		return v
	},
	bot: randomAction,
}
