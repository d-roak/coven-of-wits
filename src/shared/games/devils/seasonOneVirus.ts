import { type GameDef, type Outcome, illegal, pick, shuffle } from "../../game"
import { roundOf, type TrialMove, type TrialView, type TrialIcon } from "./trial"
import { blank, choice, integer, liveSeat, parseActions, view } from "./seasonOneSupport"

export const VIRUS_ROLES = ["Hexer", "Researcher", "Officer", "Journalist", "Citizen"] as const
type VirusRole = (typeof VIRUS_ROLES)[number]
interface VirusAction {
	action: string
	target: number | null
}
export interface VirusState {
	roles: VirusRole[]
	alive: boolean[]
	infected: (number | null)[]
	submitted: (VirusAction | null)[]
	tests: boolean[]
	testResults: (boolean | null)[]
	knowledge: Record<number, VirusRole>[]
	virusUsed: boolean
	bulletUsed: boolean
	antidoteUsed: boolean
	cure: number
	round: number
	log: string[]
	result: Outcome | null
}
function virusActions(s: VirusState, seat: number): string[] {
	switch (s.roles[seat]) {
		case "Hexer":
			return [
				...(!s.virusUsed ? ["infect"] : []),
				...(!s.bulletUsed ? ["shoot"] : []),
				...(!s.antidoteUsed ? ["antidote"] : []),
				"wait",
			]
		case "Researcher":
			return ["research", "wait"]
		case "Officer":
			return ["shoot", "wait"]
		case "Journalist":
			return ["investigate", "wait"]
		case "Citizen":
			return ["wait"]
	}
}
const labels: Record<string, string> = {
	infect: "Infect",
	shoot: "Shoot",
	antidote: "Treat",
	research: "Research",
	investigate: "Investigate",
}
const ABILITY_ICONS: Record<string, TrialIcon> = {
	infect: "vial",
	shoot: "sword",
	antidote: "shield",
	research: "book",
	investigate: "eye",
	wait: "moon",
	test: "vial",
}
const ROLE_ICONS: Record<VirusRole, TrialIcon> = {
	Hexer: "skull",
	Researcher: "book",
	Officer: "sword",
	Journalist: "eye",
	Citizen: "pawn",
}
export const virusGame: GameDef<VirusState, TrialMove, TrialView> = {
	id: "virus-game",
	round: (s) => Math.min(s.round, 8),
	name: "The Virus Game",
	blurb: "A hidden hex spreads through the circle. Find its author or finish the cure.",
	rules: [
		"A five-seat adaptation of the show’s hidden-role Virus Game: one Hexer, Researcher, Officer, Journalist and Citizen.",
		"The Hexer has one infection, one shot and one antidote. The Officer may shoot once each round. The Journalist privately learns one target’s role.",
		"The Citizen carries antibodies. The Researcher must study that living mage in two rounds to finish the cure. Antibodies clear infection after each round.",
		"An untreated infection spreads to adjacent living seats around the circle and kills after two following round resolutions. Everyone may privately test themselves once.",
		"Each living mage seals one action per round; actions resolve together. Citizens win when the Hexer dies or the cure completes. The Hexer wins when only they and the immune Citizen remain, or after eight rounds.",
		"This edition reduces the original 12 roles to five, omits the Fanatic and individual Piece payouts, and replaces live timed actions with simultaneous rounds. Use room chat to share claims.",
	],
	players: { min: 5, max: 5 },
	setup: (rng) => ({
		roles: shuffle(VIRUS_ROLES, rng),
		alive: Array(5).fill(true),
		infected: Array(5).fill(null),
		submitted: Array(5).fill(null),
		tests: Array(5).fill(false),
		testResults: Array(5).fill(null),
		knowledge: Array.from({ length: 5 }, () => ({})),
		virusUsed: false,
		bulletUsed: false,
		antidoteUsed: false,
		cure: 0,
		round: 1,
		log: [],
		result: null,
	}),
	toAct: (s) => (s.result ? [] : s.alive.flatMap((alive, seat) => (alive && s.submitted[seat] === null ? [seat] : []))),
	parseMove: parseActions("infect", "shoot", "antidote", "research", "investigate", "wait", "test"),
	apply(s, seat, move) {
		liveSeat(s.result !== null, seat, 5)
		if (!s.alive[seat]) return illegal("A fallen mage cannot act.")
		if (s.submitted[seat] !== null) return illegal("Your action is already sealed.")
		if (move.action === "test") {
			blank(move.value)
			if (s.tests[seat]) return illegal("Your private test has been used.")
			return {
				...s,
				tests: s.tests.map((used, index) => (index === seat ? true : used)),
				testResults: s.testResults.map((result, index) => (index === seat ? s.infected[seat] !== null : result)),
			}
		}
		if (!virusActions(s, seat).includes(move.action)) return illegal("That ability is unavailable to your role.")
		let target: number | null = null
		if (move.action === "wait") blank(move.value)
		else {
			target = integer(move.value, 0, 4)
			if (!s.alive[target]) return illegal("Choose a living mage.")
			if (target === seat && move.action !== "antidote") return illegal("Choose another mage for that ability.")
		}
		const submitted = s.submitted.map((action, index) => (index === seat ? { action: move.action, target } : action))
		const next = {
			...s,
			submitted,
			virusUsed: s.virusUsed || move.action === "infect",
			bulletUsed: s.bulletUsed || (s.roles[seat] === "Hexer" && move.action === "shoot"),
			antidoteUsed: s.antidoteUsed || move.action === "antidote",
		}
		if (s.alive.some((alive, index) => alive && submitted[index] === null)) return next
		const alive = [...s.alive],
			infected = [...s.infected],
			knowledge = s.knowledge.map((known) => ({ ...known })),
			protectedSeats = new Set<number>()
		let cure = s.cure
		for (const action of submitted) {
			if (action?.action === "shoot") alive[action.target!] = false
			if (action?.action === "antidote") {
				protectedSeats.add(action.target!)
				infected[action.target!] = null
			}
		}
		for (let source = 0; source < 5; source++) {
			if (s.infected[source] === null || !alive[source] || protectedSeats.has(source)) continue
			if (s.infected[source]! >= 1) {
				alive[source] = false
				infected[source] = null
				continue
			}
			infected[source] = s.infected[source]! + 1
		}
		// Resolve every death before finding neighbours so seat order cannot change the spread.
		for (let source = 0; source < 5; source++) {
			if (s.infected[source] === null || !alive[source] || protectedSeats.has(source)) continue
			for (const direction of [-1, 1]) {
				for (let step = 1; step < 5; step++) {
					const target = (source + direction * step + 10) % 5
					if (!alive[target]) continue
					if (!protectedSeats.has(target) && infected[target] === null) infected[target] = 0
					break
				}
			}
		}
		for (let actor = 0; actor < 5; actor++) {
			const action = submitted[actor]
			if (!action) continue
			const target = action.target!
			if (action.action === "infect" && alive[target] && !protectedSeats.has(target)) infected[target] = 0
			if (action.action === "research" && alive[target] && s.roles[target] === "Citizen") cure++
			if (action.action === "investigate") knowledge[actor][target] = s.roles[target]
		}
		const immune = s.roles.indexOf("Citizen"),
			hexer = s.roles.indexOf("Hexer")
		infected[immune] = null
		for (let index = 0; index < 5; index++) if (!alive[index]) infected[index] = null
		const citizens = s.roles.flatMap((role, index) => (role !== "Hexer" ? [index] : []))
		const citizensWin = !alive[hexer] || cure >= 2
		const hexerWins = alive.every((living, index) => !living || index === hexer || index === immune) || s.round >= 8
		const deaths = s.alive.flatMap((living, index) =>
			living && !alive[index] ? [`Mage ${index + 1} fell: ${s.roles[index]}.`] : [],
		)
		return {
			...next,
			alive,
			infected,
			knowledge,
			cure,
			round: s.round + 1,
			submitted: submitted.map(() => null),
			log: [...s.log, `Round ${s.round} resolved.`, ...deaths].slice(-200),
			result: citizensWin ? { winners: citizens } : hexerWins ? { winners: [hexer] } : null,
		}
	},
	outcome: (s) => s.result,
	view(s, seat) {
		const acting = !s.result && s.alive[seat] && s.submitted[seat] === null
		const choices = acting
			? virusActions(s, seat).flatMap((action) =>
					action === "wait"
						? [
								choice("Wait this round", "wait", "", {
									steps: [
										{
											prompt: "Choose an ability",
											key: "wait",
											label: "Wait this round",
											piece: { kind: "token", icon: "moon" },
										},
									],
								}),
							]
						: s.alive.flatMap((alive, target) =>
								alive && (target !== seat || action === "antidote")
									? [
											choice(`${labels[action]} mage ${target + 1}`, action, String(target), {
												steps: [
													{
														prompt: "Choose an ability",
														key: action,
														label: labels[action],
														piece: { kind: "token", icon: ABILITY_ICONS[action] },
													},
													{
														prompt: "Choose a living mage",
														key: String(target),
														label: `Mage ${target + 1}`,
														piece: { kind: "token", icon: "pawn", tone: target },
													},
												],
											}),
										]
									: [],
							),
				)
			: []
		if (acting && !s.tests[seat])
			choices.push(
				choice("Take private test", "test", "", {
					steps: [
						{
							prompt: "Choose an ability",
							key: "test",
							label: "Take private test",
							piece: { kind: "token", icon: "vial" },
						},
					],
				}),
			)
		return view(
			"Seal an action",
			"Share claims in chat, then seal your role’s action.",
			s.alive.map((alive) => (alive ? 1 : 0)),
			{
				round: roundOf("Round", Math.min(s.round, 8), 8),
				scoreLabel: "Alive",
				displays: [
					{
						label: "Your secret role",
						items: [
							{
								label: s.roles[seat],
								piece: { kind: "card", rank: s.roles[seat], icon: ROLE_ICONS[s.roles[seat]], tone: seat },
							},
						],
					},
					{
						label: "The circle",
						items: s.alive.map((alive, index) => ({
							label: `Mage ${index + 1}${alive ? (s.submitted[index] ? " · sealed" : " · choosing") : " · fallen"}`,
							piece: { kind: "token", icon: alive ? (s.submitted[index] ? "seal" : "pawn") : "skull", tone: index },
						})),
					},
				],
				facts: [
					`Your role: ${s.roles[seat]}.`,
					`Cure progress: ${s.cure} of 2. Infected mages: ${s.infected.filter((age) => age !== null).length}.`,
					...s.alive.map(
						(alive, index) =>
							`Mage ${index + 1}: ${alive ? "alive" : `fallen (${s.roles[index]})`}${s.submitted[index] ? ", action sealed" : ""}.`,
					),
					...(s.submitted[seat]
						? [
								`Your sealed action: ${s.submitted[seat]!.action}${s.submitted[seat]!.target === null ? "" : ` mage ${s.submitted[seat]!.target! + 1}`}.`,
							]
						: []),
					...(s.testResults[seat] !== null
						? [`Your one-time test result: ${s.testResults[seat] ? "infected" : "clear at test time"}.`]
						: []),
					...Object.entries(s.knowledge[seat]).map(
						([target, role]) => `Private investigation: mage ${Number(target) + 1} is ${role}.`,
					),
					...(s.result ? s.roles.map((role, index) => `Mage ${index + 1}: ${role}.`) : []),
				],
				choices,
				log: [
					...s.log,
					...Object.entries(s.knowledge[seat]).map(
						([target, role]) => `Private investigation: mage ${Number(target) + 1} is ${role}.`,
					),
				],
			},
		)
	},
	bot(v, _seat, rng) {
		const choices = v.choices.filter((choice) => choice.move.action !== "test")
		const abilities = choices.filter((choice) => choice.move.action !== "wait")
		return pick(abilities.length ? abilities : choices, rng).move
	},
}
