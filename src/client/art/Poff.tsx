import type { CSSProperties } from "react"

export type PoffMood = "idle" | "happy" | "sad" | "think"

/** Fur and robes share their seat's colours everywhere in the game. */
export const POFF_LOOKS = {
	ember: { fur: "var(--fur-cream)", hat: "var(--ember)" },
	moon: { fur: "var(--fur-mint)", hat: "var(--moon)" },
	moss: { fur: "var(--fur-butter)", hat: "var(--moss)" },
	grape: { fur: "var(--fur-rose)", hat: "var(--grape)" },
	brook: { fur: "var(--fur-lilac)", hat: "var(--brook)" },
} as const
export type PoffLook = keyof typeof POFF_LOOKS

const SEAT_LOOKS: readonly PoffLook[] = ["ember", "moon", "moss", "grape", "brook"]

/** Each seat has one colour everywhere: its mage, its pieces, its name tag (.seat0 to .seat4 in CSS). */
export function seatLook(seat: number): PoffLook {
	const look = SEAT_LOOKS[seat]
	if (!look) throw new Error(`seatLook: expected seat 0 to ${SEAT_LOOKS.length - 1}, got ${seat}`)
	return look
}

// The fluff is a cluster of circles drawn twice: once fat and dark, once in fur colour on top.
// That gives one clean outline around the whole silhouette with no seams inside it.
const FLUFF = [
	[60, 88, 31],
	[35, 80, 14],
	[31, 97, 13],
	[43, 111, 13],
	[60, 115, 13],
	[77, 111, 13],
	[89, 97, 13],
	[85, 80, 14],
	[47, 67, 13],
	[73, 67, 13],
] as const

const EYES = (
	<g className="poff-eyes">
		<ellipse className="poff-ink" cx="47.500" cy="87" rx="6.500" ry="8.500" />
		<ellipse className="poff-ink" cx="72.500" cy="87" rx="6.500" ry="8.500" />
		<circle className="poff-glint" cx="49.500" cy="83.500" r="2.800" />
		<circle className="poff-glint" cx="74.500" cy="83.500" r="2.800" />
		<circle className="poff-glint" cx="45.500" cy="90.500" r="1.300" />
		<circle className="poff-glint" cx="70.500" cy="90.500" r="1.300" />
	</g>
)

function Face({ mood }: { mood: PoffMood }) {
	switch (mood) {
		case "happy":
			return (
				<>
					<path className="poff-line" d="M41 89 q6.500 -10 13 0 M66 89 q6.500 -10 13 0" />
					<path className="poff-ink" d="M53 95 q7 10 14 0 z" />
				</>
			)
		case "sad":
			return (
				<>
					{EYES}
					<path className="poff-line" d="M40 77 l11 -3 M80 77 l-11 -3 M55 100 q5 -4 10 0" />
					<path className="poff-tear" d="M82 94 q4 6 0 9 q-4 -3 0 -9 z" />
				</>
			)
		case "think":
			return (
				<>
					{EYES}
					<path className="poff-line" d="M41 76 q6 -4 12 -1 M57 99 h6" />
				</>
			)
		case "idle":
			return (
				<>
					{EYES}
					<path className="poff-line" d="M54.500 97 q2.750 4 5.500 0 q2.750 4 5.500 0" />
				</>
			)
		default: {
			const unknown: never = mood
			return unknown
		}
	}
}

interface PoffProps {
	look?: PoffLook
	mood?: PoffMood
	size?: number
	/** Mirror it, so poffs can face each other. */
	flip?: boolean
	/** Decorative unless a label is given. */
	label?: string
}

/** A woodland familiar in a witch hat and a moon-fastened cloak. */
export function Poff({ look = "ember", mood = "idle", size = 96, flip = false, label }: PoffProps) {
	const { fur, hat } = POFF_LOOKS[look]
	return (
		<svg
			className={`poff is-${mood}`}
			viewBox="0 0 120 134"
			width={size}
			height={size * 1.117}
			style={{ "--fur": fur, "--hat": hat, transform: flip ? "scaleX(-1)" : undefined } as CSSProperties}
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
		>
			<ellipse className="poff-shadow" cx="60" cy="128" rx="34" ry="5" />
			<g className="poff-body">
				<ellipse className="poff-ink" cx="46" cy="125" rx="10" ry="6" />
				<ellipse className="poff-ink" cx="74" cy="125" rx="10" ry="6" />
				<path className="poff-hat" d="M35 97 Q60 86 85 97 L99 123 Q80 130 60 123 Q40 130 21 123 Z" />
				<path className="poff-line" d="M38 106 l-5 15 M82 106 l5 15" />
				{FLUFF.map(([cx, cy, r], i) => (
					<circle key={i} className="poff-outline" cx={cx} cy={cy} r={r} />
				))}
				{FLUFF.map(([cx, cy, r], i) => (
					<circle key={i} className="poff-fur" cx={cx} cy={cy} r={r} />
				))}
				<path
					d={
						look === "moon" || look === "brook"
							? "M31 80 Q12 55 18 46 Q36 50 40 74 M80 74 Q88 48 104 46 Q108 65 89 82"
							: "M31 80 Q11 79 13 65 Q29 61 40 75 M80 75 Q94 61 108 65 Q109 80 89 82"
					}
					fill="var(--fur)"
					stroke="var(--ink)"
					strokeWidth="3.5"
					strokeLinejoin="round"
				/>
				<path className="poff-tuft" d="M27 92 q-1 5 3 8 M93 92 q1 5 -3 8 M52 121 q4 3 8 0 M64 121 q4 3 8 0" />
				<ellipse className="poff-blush" cx="36.500" cy="97" rx="6.500" ry="4" />
				<ellipse className="poff-blush" cx="83.500" cy="97" rx="6.500" ry="4" />
				<Face mood={mood} />
				<path className="poff-scarf" d="M31 102 Q60 116 89 102 L91 115 L72 112 L60 126 L48 112 L29 115 Z" />
				<circle className="poff-band" cx="60" cy="113" r="7" />
				<path d="M62 108 a5 5 0 1 0 2 8 a5 5 0 0 1 -2 -8" fill="var(--ink)" />
				<g className="poff-hat-group">
					<ellipse className="poff-hat" cx="60" cy="63" rx="41" ry="10.500" />
					<path
						className="poff-hat"
						d="M35 60 C40 40 50 20 72 7 C79 3 89 8 92 18 C86 13 79 15 77 22 C82 35 85 48 85 60 Q60 71 35 60 Z"
					/>
					<path className="poff-band" d="M36.500 55 Q60 66 85 55 L85 60 Q60 71 35 60 Z" />
					<path
						className="poff-band"
						d="M61 30 l2.500 5.500 l5.500 2.500 l-5.500 2.500 l-2.500 5.500 l-2.500 -5.500 l-5.500 -2.500 l5.500 -2.500 z"
					/>
					<circle className="poff-band" cx="92" cy="22" r="5" />
				</g>
			</g>
		</svg>
	)
}
