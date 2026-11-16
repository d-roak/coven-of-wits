import { useLang } from "../i18n"

// A bone die. Pips are laid out on a 3x3 grid inside a 32-unit square.
const PIPS: Record<number, readonly (readonly [number, number])[]> = {
	1: [[16, 16]],
	2: [
		[9, 9],
		[23, 23],
	],
	3: [
		[9, 9],
		[16, 16],
		[23, 23],
	],
	4: [
		[9, 9],
		[23, 9],
		[9, 23],
		[23, 23],
	],
	5: [
		[9, 9],
		[23, 9],
		[16, 16],
		[9, 23],
		[23, 23],
	],
	6: [
		[9, 8],
		[23, 8],
		[9, 16],
		[23, 16],
		[9, 24],
		[23, 24],
	],
}

/** Pass `face` to show it, leave it out for a bone lying face down. */
export function Die({ face, size = 38, className = "" }: { face?: number; size?: number; className?: string }) {
	const { tx } = useLang()
	const pips = face === undefined ? [] : PIPS[face]
	if (!pips) throw new Error(`Die: expected face 1 to 6, got ${face}`)
	return (
		<svg
			className={`die ${face === undefined ? "is-hidden" : ""} ${className}`}
			viewBox="0 0 32 32"
			width={size}
			height={size}
			role="img"
			aria-label={tx(face === undefined ? "Hidden bone" : `Bone showing ${face}`)}
		>
			<rect className="die-body" x="2.5" y="2.5" width="27" height="27" rx="7" />
			{face === undefined ? (
				<path className="die-swirl" d="M11 20 q5 4 9 -1 q3 -5 -2 -7 q-5 -1 -5 3 q1 3 4 1" />
			) : (
				pips.map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="die-pip" cx={cx} cy={cy} r="2.6" />)
			)}
		</svg>
	)
}
