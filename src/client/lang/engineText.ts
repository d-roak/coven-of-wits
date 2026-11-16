// Game engines write finished English sentences: prompts, clues, logs, rules. This turns them into
// another language on the client, by pattern. The server and the bots keep reading the English.
//
// A dictionary maps an English template to its translation:
//   "Mage {#n}: alive."     →  "마법사 {n}: 생존."
//   "Your role: {role}."    →  "내 역할: {role}."
// {#name} matches a number. {name} matches any text, and what it catches is translated in turn,
// so "Officer" inside "Your role: Officer." needs its own entry.

export type Dictionary = Record<string, string>

interface Rule {
	pattern: RegExp
	out: string
	/** Literal characters in the template. More of them means a more specific rule, tried first. */
	weight: number
}

/** Lists the engines join inline. With no rule for the whole, each part is translated on its own. */
const SEPARATORS = [" → ", " · ", "; ", ", "] as const

function compile(template: string, out: string): Rule {
	let weight = 0
	const source = template
		.split(/(\{#?\w+\})/)
		.map((part) => {
			const hole = /^\{(#?)(\w+)\}$/.exec(part)
			if (!hole) {
				weight += part.length
				return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
			}
			return hole[1] ? `(?<${hole[2]}>-?\\d+(?:\\.\\d+)?)` : `(?<${hole[2]}>.+?)`
		})
		.join("")
	return { pattern: new RegExp(`^${source}$`, "s"), out, weight }
}

/**
 * Merges dictionaries, first file wins. The same template with two different translations is a
 * mistake, but not one worth a blank screen: it lands in `conflicts`, and coverage.test.ts fails on it.
 */
export function merge(...dictionaries: Dictionary[]): { all: Dictionary; conflicts: string[] } {
	const all: Dictionary = {}
	const conflicts: string[] = []
	for (const dictionary of dictionaries)
		for (const [template, out] of Object.entries(dictionary)) {
			if (!(template in all)) all[template] = out
			else if (all[template] !== out) conflicts.push(`"${template}": "${all[template]}" and "${out}"`)
		}
	return { all, conflicts }
}

export function translator(dictionary: Dictionary): (text: string) => string {
	const exact = new Map<string, string>()
	const rules: Rule[] = []
	for (const [template, out] of Object.entries(dictionary))
		if (/\{#?\w+\}/.test(template)) rules.push(compile(template, out))
		else exact.set(template, out)
	rules.sort((a, b) => b.weight - a.weight)
	const cache = new Map<string, string>()

	function translate(text: string): string {
		if (!/[A-Za-z]/.test(text)) return text
		const known = cache.get(text) ?? exact.get(text)
		if (known !== undefined) return known
		let result = text
		const rule = rules.find((candidate) => candidate.pattern.test(text))
		if (rule) {
			const groups = rule.pattern.exec(text)!.groups ?? {}
			result = rule.out.replace(/\{(\w+)\}/g, (_, name: string) => {
				if (!(name in groups))
					throw new Error(`translate: "${rule.out}" uses {${name}}, which its template never catches`)
				return translate(groups[name]!)
			})
		} else {
			const separator = SEPARATORS.find((candidate) => text.includes(candidate))
			if (separator) result = text.split(separator).map(translate).join(separator)
		}
		cache.set(text, result)
		return result
	}
	return translate
}

// Keys whose string values are words on the table. Everything else in a view (move values, step
// keys, actions, letter tiles) is data the engine reads back and must reach it untouched.
const TEXT_KEYS = new Set([
	"phase",
	"prompt",
	"label",
	"text",
	"rank",
	"scoreLabel",
	"submit",
	"confirm",
	"placeholder",
])
const LIST_KEYS = new Set(["facts", "log"])

/** A copy of a view with every display string translated and every piece of game data left alone. */
export function localise<T>(value: T, translate: (text: string) => string): T {
	if (Array.isArray(value)) return value.map((item) => localise(item, translate)) as T
	if (!value || typeof value !== "object") return value
	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => {
			// Moves go back to the engine. A round label is a closed key the tracker translates itself.
			if (key === "move" || key === "round") return [key, item]
			if (TEXT_KEYS.has(key) && typeof item === "string") return [key, translate(item)]
			if (LIST_KEYS.has(key) && Array.isArray(item))
				return [key, item.map((line) => (typeof line === "string" ? translate(line) : line))]
			return [key, localise(item, translate)]
		}),
	) as T
}
