import { type AnyGame, type GameDef, illegal, parseWith, pick, shuffle, topSeats } from "../../game"
import { z } from "zod"
import { type DevilEntry, roundOf, type TrialMove, type TrialView, type TrialChoice, type TrialForm } from "./trial"

interface RockBid {
	weight: number
	chip: number
}
interface HeavyState {
	hands: number[][]
	chips: number[][]
	bids: (RockBid | null)[]
	stacks: number[][]
	scores: number[]
	lastPenalty: number[]
	round: number
	first: number
	queue: number[]
	deferred: number[]
	passed: number[]
	clock: number
	log: string[]
}
const COLORS = ["Ember", "Moss", "Moon", "Rainbow"]
const heavyParser = parseWith(
	z.object({ action: z.enum(["seal", "place", "pass"]), value: z.string().max(12) }).strict(),
)
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
export const heavy13: GameDef<HeavyState, TrialMove, TrialView> = {
	id: "heavy-13",
	name: "Heavy 13",
	blurb: "Stack secret weights. Avoid the stone that brings a stand to 13.",
	players: { min: 3, max: 5 },
	rules: [
		"You have cards 0–6, 2 chips of each of 3 colors, and 1 rainbow chip. Seal one unused card and chip each round.",
		"Rainbow chips place first, then higher cards. Ties follow clockwise order from the first mage. A colored chip fixes your stand; rainbow chooses a stand on placement.",
		"You may pass once if another unpassed mage remains. Passed mages place after the others, in reverse pass order.",
		"A stand reaching 13 or more loses every old stone. You lose 1 point per removed stone, including zeros; your new stone stays. The last penalized mage starts the next round.",
		"Coven adaptation: 7 rounds for 3–5 mages, no enforced deadline. Highest score wins; equal scores favor the mage whose most recent penalty occurred earlier.",
	],
	setup(_rng, players) {
		return {
			hands: Array.from({ length: players }, () => [0, 1, 2, 3, 4, 5, 6]),
			chips: Array.from({ length: players }, () => [2, 2, 2, 1]),
			bids: Array<null>(players).fill(null),
			stacks: [[], [], []],
			scores: Array<number>(players).fill(0),
			lastPenalty: Array<number>(players).fill(-1),
			round: 0,
			first: 0,
			queue: [],
			deferred: [],
			passed: [],
			clock: 0,
			log: [],
		}
	},
	toAct(s) {
		if (s.round === 7) return []
		return s.queue.length ? [s.queue[0]!] : s.bids.flatMap((b, i) => (b === null ? [i] : []))
	},
	parseMove: heavyParser,
	apply(s, seat, move) {
		if (!heavy13.toAct(s).includes(seat)) illegal("Wait for your stone turn.")
		if (!s.queue.length) {
			if (move.action !== "seal" || !/^[0-6]:[0-3]$/.test(move.value)) illegal("Choose an available weight and chip.")
			const [weight, chip] = move.value.split(":").map(Number) as [number, number]
			if (!s.hands[seat]!.includes(weight) || s.chips[seat]![chip]! <= 0)
				illegal("That card or chip was already spent.")
			const bids = s.bids.map((b, i) => (i === seat ? { weight, chip } : b))
			const hands = s.hands.map((h, i) => (i === seat ? h.filter((w) => w !== weight) : h))
			const chips = s.chips.map((h, i) => (i === seat ? h.map((n, c) => n - Number(c === chip)) : h))
			if (bids.some((b) => b === null)) return { ...s, bids, hands, chips }
			const queue = bids
				.map((_, i) => i)
				.sort(
					(a, b) =>
						Number(bids[b]!.chip === 3) - Number(bids[a]!.chip === 3) ||
						bids[b]!.weight - bids[a]!.weight ||
						((a - s.first + bids.length) % bids.length) - ((b - s.first + bids.length) % bids.length),
				)
			return {
				...s,
				bids,
				hands,
				chips,
				queue,
				deferred: [],
				passed: [],
				log: [
					...s.log,
					`Round ${s.round + 1}: ${bids.map((bid, i) => `Mage ${i + 1} ${bid!.weight} / ${COLORS[bid!.chip]}`).join("; ")}.`,
				],
			}
		}
		if (move.action === "pass") {
			if (move.value !== "" || s.queue.length < 2 || s.passed.includes(seat))
				illegal("You may pass once before the last unpassed mage.")
			return {
				...s,
				queue: s.queue.slice(1),
				deferred: [seat, ...s.deferred],
				passed: [...s.passed, seat],
				log: [...s.log, `Mage ${seat + 1} passed.`],
			}
		}
		const bid = s.bids[seat]!
		if (move.action !== "place" || !/^[0-2]$/.test(move.value)) illegal("Choose one of the 3 stands.")
		const stand = Number(move.value)
		if (bid.chip !== 3 && stand !== bid.chip) illegal("Your colored chip fixes the stand.")
		const overflow = sum(s.stacks[stand]!) + bid.weight >= 13
		const penalty = overflow ? s.stacks[stand]!.length : 0
		const stacks = s.stacks.map((stack, i) => (i === stand ? [...(overflow ? [] : stack), bid.weight] : stack))
		const clock = s.clock + 1
		const scores = s.scores.map((score, i) => score - (i === seat ? penalty : 0))
		const lastPenalty = s.lastPenalty.map((time, i) => (i === seat && penalty ? clock : time))
		const first = penalty ? seat : s.first
		const log = [
			...s.log,
			`Mage ${seat + 1}: ${bid.weight} on ${COLORS[stand]}${penalty ? `, −${penalty} points` : ""}.`,
		]
		const queue = s.queue.slice(1)
		if (queue.length) return { ...s, stacks, scores, lastPenalty, first, clock, log, queue }
		if (s.deferred.length)
			return { ...s, stacks, scores, lastPenalty, first, clock, log, queue: s.deferred, deferred: [] }
		return {
			...s,
			stacks,
			scores,
			lastPenalty,
			first,
			clock,
			log,
			queue: [],
			deferred: [],
			passed: [],
			bids: s.bids.map(() => null),
			round: s.round + 1,
		}
	},
	round: (s) => s.round + 1,
	outcome(s) {
		if (s.round < 7) return null
		const best = Math.max(...s.scores)
		const tied = s.scores.flatMap((n, i) => (n === best ? [i] : []))
		const earliest = Math.min(...tied.map((i) => s.lastPenalty[i]!))
		const winners = tied.filter((i) => s.lastPenalty[i] === earliest)
		return { winners: winners.length === s.scores.length ? [] : winners }
	},
	view(s, seat) {
		const active = heavy13.toAct(s).includes(seat)
		const placing = s.queue.length > 0
		const bid = s.bids[seat]
		const choices: TrialChoice[] = active
			? placing
				? [
						...s.stacks.flatMap((stack, i) =>
							bid!.chip === 3 || bid!.chip === i
								? [
										{
											label: `Place on ${COLORS[i]} (${sum(stack)} + ${bid!.weight})`,
											move: { action: "place", value: String(i) },
										},
									]
								: [],
						),
						...(s.queue.length > 1 && !s.passed.includes(seat)
							? [{ label: "Pass once", move: { action: "pass", value: "" } }]
							: []),
					]
				: s.hands[seat]!.flatMap((weight) =>
						s.chips[seat]!.flatMap((n, chip) =>
							n > 0
								? [
										{
											label: `${weight} · ${COLORS[chip]}`,
											move: { action: "seal", value: `${weight}:${chip}` },
											steps: [
												{
													prompt: "Choose a weight",
													key: String(weight),
													label: `Weight ${weight}`,
													piece: { kind: "card", rank: String(weight) },
												},
												{
													prompt: "Choose a chip",
													key: String(chip),
													label: COLORS[chip]!,
													piece: { kind: "token", icon: chip === 3 ? "star" : "gem", tone: chip, text: String(n) },
												},
											],
										},
									]
								: [],
						),
					)
			: []
		return {
			...(s.round === 7 ? {} : { round: roundOf("Round", s.round + 1, 7) }),
			phase: s.round === 7 ? "Game complete" : placing ? "Place stones" : "Seal stones",
			prompt:
				s.round === 7
					? "The lightest burden wins."
					: placing
						? "Place your revealed stone, or pass once if allowed."
						: bid
							? "Your stone and chip are sealed."
							: "Choose a weight and a chip together.",
			scores: s.scores,
			choices,
			displays: s.stacks.map((stack, i) => ({
				label: `${COLORS[i]} · ${sum(stack)} / 13`,
				items: stack.map((weight) => ({
					label: `Weight ${weight}`,
					piece: { kind: "tile" as const, text: String(weight), tone: i },
				})),
			})),
			log: s.log,
			facts: [
				...s.stacks.map((stack, i) => `${COLORS[i]}: [${stack.join(", ")}] = ${sum(stack)} / 13.`),
				`Your chips: ${s.chips[seat]!.map((n, i) => `${COLORS[i]} ${n}`).join(", ")}.`,
				...(placing
					? s.bids.map((b, i) => `Mage ${i + 1}: ${b!.weight}, ${COLORS[b!.chip]}.`)
					: s.bids.map((b, i) => `Mage ${i + 1}: ${b ? "sealed" : "choosing"}.`)),
				...(placing ? [`Order: ${[...s.queue, ...s.deferred].map((i) => `Mage ${i + 1}`).join(" → ")}.`] : []),
			],
		}
	},
	bot(view, _seat, rng) {
		const placements = view.choices.filter((c) => c.move.action === "place")
		if (placements.length) {
			const safe = placements.filter((c) => {
				const match = c.label.match(/\((\d+) \+ (\d+)\)/)!
				return Number(match[1]) + Number(match[2]) < 13
			})
			if (safe.length) return pick(safe, rng).move
			return view.choices.find((c) => c.move.action === "pass")?.move ?? placements[0]!.move
		}
		return pick(view.choices, rng).move
	},
}

const STOCKS = ["Candlewick", "Moonleaf", "Thornsteel", "Mossworks", "Foxglove", "Nightjar", "Bramble"]
const RULES = [
	"Alternates +120 and −80 each round.",
	"Rises 30 for each share bought this round; falls 60 if none are bought.",
	"Falls 40 per net share bought; rises 40 per net share sold.",
	"Rises 90 if Candlewick rose last round; otherwise falls 50.",
	"Rises 160 every third round; otherwise falls 40.",
	"Rises 70 when fewer than 4 shares are held; otherwise falls 35.",
	"Moves opposite to Moonleaf's last change, with a limit of 150.",
]
interface Order {
	kind: "buy" | "sell" | "hold" | "study"
	stock: number
	quantity: number
}
interface StockState {
	round: number
	prices: number[]
	history: number[][]
	cash: number[]
	holdings: number[][]
	orders: (Order | null)[]
	known: boolean[][]
	log: string[]
}
const stockParser = parseWith(
	z.object({ action: z.enum(["buy", "sell", "hold", "study"]), value: z.string().max(30) }).strict(),
)
function stockAssets(s: StockState): number[] {
	return s.cash.map((cash, i) => cash + s.holdings[i]!.reduce((n, q, j) => n + q * s.prices[j]!, 0))
}
export const mysteryStockMarket: GameDef<StockState, TrialMove, TrialView> = {
	id: "mystery-stock-market",
	name: "Mystery Stock Market",
	blurb: "Read the price patterns. Trade before the hidden rules are revealed.",
	players: { min: 2, max: 5 },
	rules: [
		"Trade 7 fictional stocks over 8 rounds. Start with 10,000 game coins; each stock starts at 1,000 and cannot fall below 100.",
		"Each round, seal one buy, sell, hold or study order. Orders use the current price and settle together. Study costs 100 and reveals one price rule privately.",
		"Price histories are public. Rule fragments appear after round 2; all rules are disclosed after round 4. Total cash plus shares at the last price determines the winner.",
		"HOUSE VARIANT: the show's market deduction concept is retained, but these company names, price formulas, 8-round schedule and one-order limit are original. No Pieces, secrets or real money.",
	],
	setup(_rng, players) {
		return {
			round: 0,
			prices: Array<number>(7).fill(1000),
			history: [Array<number>(7).fill(1000)],
			cash: Array<number>(players).fill(10000),
			holdings: Array.from({ length: players }, () => Array<number>(7).fill(0)),
			orders: Array<null>(players).fill(null),
			known: Array.from({ length: players }, () => Array<boolean>(7).fill(false)),
			log: [],
		}
	},
	toAct: (s) => (s.round === 8 ? [] : s.orders.flatMap((o, i) => (o === null ? [i] : []))),
	parseMove: stockParser,
	apply(s, seat, move) {
		if (!mysteryStockMarket.toAct(s).includes(seat)) illegal("You already sealed an order, or the market is closed.")
		let order: Order
		if (move.action === "hold" && move.value === "") order = { kind: "hold", stock: 0, quantity: 0 }
		else if (move.action === "study" && /^[0-6]$/.test(move.value)) {
			const stock = Number(move.value)
			if (s.cash[seat]! < 100 || s.known[seat]![stock] || s.round >= 4)
				illegal("Study an unknown rule before round 5, with 100 coins available.")
			order = { kind: "study", stock, quantity: 0 }
		} else {
			if ((move.action !== "buy" && move.action !== "sell") || !/^([0-6]):([1-9]\d{0,3})$/.test(move.value))
				illegal("Choose a stock and a positive whole share quantity.")
			const [stock, quantity] = move.value.split(":").map(Number) as [number, number]
			if (move.action === "buy" && quantity * s.prices[stock]! > s.cash[seat]!)
				illegal("You do not have enough coins for those shares.")
			if (move.action === "sell" && quantity > s.holdings[seat]![stock]!)
				illegal("You cannot sell more shares than you own.")
			order = { kind: move.action, stock, quantity }
		}
		const orders = s.orders.map((o, i) => (i === seat ? order : o))
		if (orders.some((o) => o === null)) return { ...s, orders }
		const cash = [...s.cash]
		const holdings = s.holdings.map((h) => [...h])
		const known = s.known.map((k) => [...k])
		const buys = Array<number>(7).fill(0)
		const sells = Array<number>(7).fill(0)
		for (let i = 0; i < orders.length; i++) {
			const o = orders[i]!
			if (o.kind === "buy") {
				cash[i]! -= o.quantity * s.prices[o.stock]!
				holdings[i]![o.stock]! += o.quantity
				buys[o.stock]! += o.quantity
			}
			if (o.kind === "sell") {
				cash[i]! += o.quantity * s.prices[o.stock]!
				holdings[i]![o.stock]! -= o.quantity
				sells[o.stock]! += o.quantity
			}
			if (o.kind === "study") {
				cash[i]! -= 100
				known[i]![o.stock] = true
			}
		}
		const prev = s.history.length > 1 ? s.history[s.history.length - 2]! : s.prices
		const changes = [
			s.round % 2 === 0 ? 120 : -80,
			buys[1]! > 0 ? 30 * buys[1]! : -60,
			40 * (sells[2]! - buys[2]!),
			s.prices[0]! > prev[0]! ? 90 : -50,
			(s.round + 1) % 3 === 0 ? 160 : -40,
			holdings.reduce((n, h) => n + h[5]!, 0) < 4 ? 70 : -35,
			Math.max(-150, Math.min(150, prev[1]! - s.prices[1]!)),
		]
		const prices = s.prices.map((price, i) => Math.max(100, price + changes[i]!))
		return {
			...s,
			round: s.round + 1,
			prices,
			history: [...s.history, prices],
			cash,
			holdings,
			known,
			orders: orders.map(() => null),
			log: [
				...s.log,
				`Round ${s.round + 1} settled.`,
				...STOCKS.map(
					(name, i) =>
						`${name}: ${prices[i]} (${prices[i]! - s.prices[i]! >= 0 ? "+" : ""}${prices[i]! - s.prices[i]!}).`,
				),
			],
		}
	},
	round: (s) => s.round + 1,
	outcome: (s) => (s.round === 8 ? { winners: topSeats(stockAssets(s)) } : null),
	view(s, seat) {
		const active = mysteryStockMarket.toAct(s).includes(seat)
		const choices: TrialChoice[] = active
			? [
					{ label: "Hold coins", move: { action: "hold", value: "" } },
					...STOCKS.flatMap((name, i) => [
						...(s.cash[seat]! >= s.prices[i]!
							? [
									{ label: `Buy 1 ${name}`, move: { action: "buy", value: `${i}:1` } },
									{
										label: `Buy max ${name}`,
										move: { action: "buy", value: `${i}:${Math.floor(s.cash[seat]! / s.prices[i]!)}` },
									},
								]
							: []),
						...(s.holdings[seat]![i]! > 0
							? [{ label: `Sell all ${name}`, move: { action: "sell", value: `${i}:${s.holdings[seat]![i]}` } }]
							: []),
						...(s.round < 4 && !s.known[seat]![i] && s.cash[seat]! >= 100
							? [{ label: `Study ${name} · 100`, move: { action: "study", value: String(i) } }]
							: []),
					]),
				]
			: []
		for (const choice of choices) {
			if (choice.move.action === "hold") {
				choice.steps = [
					{
						prompt: "Choose a stock or hold",
						key: "hold",
						label: "Hold coins",
						piece: { kind: "token", icon: "coin" },
					},
				]
				continue
			}
			const [stock, quantity] = choice.move.value.split(":").map(Number)
			choice.steps = [
				{
					prompt: "Choose a stock or hold",
					key: String(stock),
					label: STOCKS[stock!]!,
					piece: { kind: "tile", text: String(s.prices[stock!]) },
				},
				{
					prompt: "Choose an action",
					key: choice.move.action,
					label:
						choice.move.action === "buy"
							? "Buy shares"
							: choice.move.action === "sell"
								? "Sell shares"
								: "Study rule · 100 coins",
				},
				...(quantity === undefined
					? []
					: [
							{
								prompt: "Choose a quantity",
								key: String(quantity),
								label: `${quantity} shares · ${quantity * s.prices[stock!]!} coins`,
							},
						]),
			]
		}
		const forms: TrialForm[] = active
			? STOCKS.flatMap((name, stock) =>
					(["buy", "sell"] as const).flatMap((action) => {
						const max = Math.min(
							9999,
							action === "buy" ? Math.floor(s.cash[seat]! / s.prices[stock]!) : s.holdings[seat]![stock]!,
						)
						return max > 0
							? [
									{
										label: `${action === "buy" ? "Buy" : "Sell"} ${name} · ${s.prices[stock]} coins each`,
										action,
										steps: [
											{
												prompt: "Choose a stock",
												key: String(stock),
												label: name,
												piece: { kind: "tile" as const, text: String(s.prices[stock]) },
											},
											{
												prompt: "Choose an action",
												key: action,
												label: action === "buy" ? "Buy shares" : "Sell shares",
											},
										],
										submit: "Seal order",
										fields: [{ label: "Shares", kind: "number" as const, min: 1, max, initial: "1" }],
										format: `${stock}:{0}`,
									},
								]
							: []
					}),
				)
			: []
		return {
			forms,
			displays: [
				{
					label: "Your purse",
					items: [
						{ label: `${s.cash[seat]} game coins`, piece: { kind: "token", icon: "coin", text: String(s.cash[seat]) } },
					],
				},
			],
			...(s.round === 8 ? {} : { round: roundOf("Round", s.round + 1, 8) }),
			phase: s.round === 8 ? "Market closed" : "Trading floor",
			prompt: active
				? "Seal one trade, hold your coins, or study a price rule."
				: s.round === 8
					? "Your shares have been valued at the closing prices."
					: "Your order is sealed.",
			scores: stockAssets(s),
			choices,
			log: s.log,
			facts: [
				`Your coins: ${s.cash[seat]}. These are game coins.`,
				...STOCKS.map(
					(name, i) =>
						`${name}: ${s.prices[i]} coins, you hold ${s.holdings[seat]![i]}. History ${s.history.map((h) => h[i]).join(" → ")}.`,
				),
				...STOCKS.map(
					(name, i) =>
						`${name} rule: ${s.round >= 4 || s.known[seat]![i] ? RULES[i] : s.round >= 2 ? ["Round parity matters.", "Buying matters.", "Buying can hurt.", "Watch Candlewick.", "A 3-round rhythm.", "Total holdings matter.", "Watch Moonleaf."][i] : "hidden"}.`,
				),
			],
		}
	},
	bot: (view, _seat, rng) => pick(view.choices, rng).move,
}

interface RouletteState {
	chambers: boolean[]
	knowledge: (boolean | null)[][]
	credits: number[]
	tamper: number
	turn: number
	round: number
	step: number
	first: number
	done: boolean
	log: string[]
}
const rouletteParser = parseWith(
	z.object({ action: z.enum(["open", "peek", "rotate", "tamper"]), value: z.string().max(10) }).strict(),
)
export const russianRoulette: GameDef<RouletteState, TrialMove, TrialView> = {
	id: "russian-roulette",
	name: "Russian Roulette",
	blurb: "Track cursed chambers, spend credits, and move danger away from your seat.",
	players: { min: 3, max: 5 },
	rules: [
		"Each seat faces a chamber. Two chambers are cursed. Start with 16 game credits. Survive when half the players, rounded up, spend all credits.",
		"Open investigation costs 1: reveal 2 adjacent chambers publicly. Hidden investigation costs 2: only you see them. Rotate clockwise by 1 for 3 credits, or by 2 for 4.",
		"Tamper contributes 1–3 credits to a shared pool. Landing exactly on 6 secretly swaps two adjacent chambers and clears the pool; exceeding 6 clears it without a swap. Old observations may be stale after hidden actions.",
		"The first mage shifts clockwise each round. Empty purses are skipped. All actions use game tokens; cursed seats lose and safe seats share victory.",
		"Coven adaptation: 3–5 chambers instead of 6, no enforced deadline, persistent private notes, and curse markers instead of weapons. The investigation, rotation and pooled tampering mechanics follow the show.",
	],
	setup(rng, players) {
		const cursed = shuffle(
			Array.from({ length: players }, (_, i) => i),
			rng,
		).slice(0, 2)
		return {
			chambers: Array.from({ length: players }, (_, i) => cursed.includes(i)),
			knowledge: Array.from({ length: players }, () => Array<null>(players).fill(null)),
			credits: Array<number>(players).fill(16),
			tamper: 0,
			turn: 0,
			round: 0,
			step: 0,
			first: 0,
			done: false,
			log: [],
		}
	},
	toAct: (s) => (s.done ? [] : [s.turn]),
	parseMove: rouletteParser,
	apply(s, seat, move) {
		if (s.done || s.turn !== seat) illegal("Wait for your chamber turn.")
		const n = s.chambers.length
		let chambers = [...s.chambers]
		let knowledge = s.knowledge.map((k) => [...k])
		let tamper = s.tamper
		let cost = 0
		let message = ""
		if (move.action === "open" || move.action === "peek") {
			if (!/^[0-4]$/.test(move.value) || Number(move.value) >= n)
				illegal("Choose a chamber and its clockwise neighbor.")
			cost = move.action === "open" ? 1 : 2
			const a = Number(move.value),
				b = (a + 1) % n
			knowledge = knowledge.map((notes, i) =>
				i === seat || move.action === "open" ? notes.map((v, j) => (j === a || j === b ? chambers[j]! : v)) : notes,
			)
			message =
				move.action === "open"
					? `Mage ${seat + 1} revealed ${a + 1}: ${chambers[a] ? "curse" : "safe"}, ${b + 1}: ${chambers[b] ? "curse" : "safe"}.`
					: `Mage ${seat + 1} made a hidden action.`
		} else if (move.action === "rotate") {
			if (!/^[12]$/.test(move.value)) illegal("Rotate by 1 or 2 chambers.")
			const steps = Number(move.value)
			cost = steps + 2
			chambers = chambers.map((_, i) => s.chambers[(i - steps + n) % n]!)
			// Each player's notes rotate with the chambers, even when an earlier secret swap made them stale.
			knowledge = s.knowledge.map((notes) => notes.map((_, i) => notes[(i - steps + n) % n]!))
			message = `Mage ${seat + 1} rotated ${steps} clockwise.`
		} else if (move.action === "tamper") {
			if (!/^[1-3]:[0-4]$/.test(move.value)) illegal("Contribute 1–3 credits and choose an adjacent chamber pair.")
			const [amount, a] = move.value.split(":").map(Number) as [number, number]
			if (a >= n) illegal("Choose an existing chamber pair.")
			cost = amount
			tamper += amount
			if (tamper === 6) {
				const b = (a + 1) % n
				;[chambers[a], chambers[b]] = [chambers[b]!, chambers[a]!]
				knowledge[seat] = knowledge[seat]!.map((v, i) => (i === a || i === b ? chambers[i]! : v))
				tamper = 0
			} else if (tamper > 6) tamper = 0
			message = `Mage ${seat + 1} made a hidden action.`
		} else illegal("Choose investigation, rotation or tampering.")
		if (cost > s.credits[seat]!) illegal("You do not have enough credits for that action.")
		const credits = s.credits.map((c, i) => c - (i === seat ? cost : 0))
		const done = credits.filter((c) => c === 0).length >= Math.ceil(n / 2)
		let step = s.step + 1,
			first = s.first,
			round = s.round
		if (step >= n) {
			step = 0
			round++
			first = (first + 1) % n
		}
		let turn = (first + step) % n
		if (!done) {
			while (credits[turn] === 0) {
				step++
				if (step >= n) {
					step = 0
					round++
					first = (first + 1) % n
				}
				turn = (first + step) % n
			}
		}
		return {
			...s,
			chambers,
			knowledge,
			credits,
			tamper,
			turn,
			step,
			first,
			round,
			done,
			log: [...s.log, message],
		}
	},
	round: (s) => s.round + 1,
	outcome: (s) => (s.done ? { winners: s.chambers.flatMap((curse, i) => (curse ? [] : [i])) } : null),
	view(s, seat) {
		const active = !s.done && s.turn === seat
		const credit = s.credits[seat]!
		const choices: TrialChoice[] = active
			? [
					...s.chambers.flatMap((_, i) => [
						{
							label: `Open ${i + 1}–${((i + 1) % s.chambers.length) + 1} · 1`,
							move: { action: "open", value: String(i) },
						},
						...(credit >= 2
							? [
									{
										label: `Peek ${i + 1}–${((i + 1) % s.chambers.length) + 1} · 2`,
										move: { action: "peek", value: String(i) },
									},
								]
							: []),
					]),
					...[1, 2].flatMap((n) =>
						credit >= n + 2 ? [{ label: `Rotate ${n} · ${n + 2}`, move: { action: "rotate", value: String(n) } }] : [],
					),
					...[1, 2, 3].flatMap((amount) =>
						credit >= amount
							? s.chambers.map((_, i) => ({
									label: `Tamper ${amount} · pair ${i + 1}–${((i + 1) % s.chambers.length) + 1}`,
									move: { action: "tamper", value: `${amount}:${i}` },
								}))
							: [],
					),
				]
			: []
		for (const choice of choices) {
			const action = choice.move.action
			const [amount, pair] = choice.move.value.split(":").map(Number)
			choice.steps = [
				{
					prompt: "Choose an action",
					key: action,
					label:
						action === "open"
							? "Open pair · 1 credit"
							: action === "peek"
								? "Peek pair · 2 credits"
								: action === "rotate"
									? "Rotate chambers"
									: "Tamper",
					piece: {
						kind: "token",
						icon: action === "open" ? "eye" : action === "peek" ? "key" : action === "rotate" ? "arrow" : "wand",
					},
				},
			]
			if (action === "tamper")
				choice.steps.push({ prompt: "Choose a contribution", key: String(amount), label: `${amount} credits` })
			choice.steps.push(
				action === "rotate"
					? { prompt: "Choose a rotation", key: String(amount), label: `${amount} clockwise · ${amount! + 2} credits` }
					: {
							prompt: "Choose adjacent chambers",
							key: String(pair ?? amount),
							label: `Chambers ${(pair ?? amount)! + 1} and ${(((pair ?? amount)! + 1) % s.chambers.length) + 1}`,
						},
			)
		}
		return {
			...(s.done ? {} : { round: roundOf("Round", s.round + 1) }),
			phase: s.done ? "Chambers revealed" : "Chambers in play",
			prompt: s.done
				? s.chambers[seat]
					? "Your chamber was cursed."
					: "Your chamber was safe."
				: "Track the chambers and protect your seat.",
			scores: s.chambers.map((curse) => (s.done ? Number(!curse) : 0)),
			facts: [
				`You face chamber ${seat + 1}. Your credits: ${credit}.`,
				`Shared tamper pool: ${s.tamper} / 6.`,
				"Your notes follow public rotations. A hidden action may have changed a remembered chamber.",
			],
			choices,
			log: s.log,
			board: {
				columns: s.chambers.length,
				cells: s.chambers.map((curse, i) => ({
					piece: {
						kind: "token" as const,
						icon:
							(s.done ? curse : s.knowledge[seat]![i]) === null
								? ("lock" as const)
								: (s.done ? curse : s.knowledge[seat]![i])
									? ("skull" as const)
									: ("shield" as const),
						text: String(i + 1),
					},
					label: `${i + 1}: ${s.done ? (curse ? "curse" : "safe") : s.knowledge[seat]![i] === null ? "?" : s.knowledge[seat]![i] ? "last seen curse" : "last seen safe"}`,
				})),
			},
		}
	},
	bot: (view, _seat, rng) => pick(view.choices, rng).move,
}

export const seasonThreeStrategyGames: AnyGame[] = [heavy13, mysteryStockMarket, russianRoulette]
export const seasonThreeStrategyCatalog: DevilEntry[] = [
	{
		id: heavy13.id,
		season: 3,
		kind: "Prison",
		adaptation:
			"7 untimed rounds for 3–5 players. Colored chips, rainbow priority, deferred placement and threshold penalties retained.",
		sources: ["https://quoridorgame.com/en/heavy-13/rules/"],
	},
	{
		id: mysteryStockMarket.id,
		season: 3,
		kind: "Main",
		adaptation:
			"HOUSE VARIANT: original 7 stocks and price formulas, 8 rounds and one sealed order per round. Retains hidden-rule deduction and portfolio valuation.",
		sources: ["https://www.subtitlecat.com/subs/1789/The.Devil%27s.Plan.S03E04.en.html"],
	},
	{
		id: russianRoulette.id,
		season: 3,
		kind: "Prison",
		adaptation:
			"3–5 curse chambers, 16 credits and private notes. Public/private investigation, clockwise rotation and pooled tampering; no weapons.",
		sources: ["https://transcripts.foreverdreaming.org/viewtopic.php?t=268917"],
	},
]
