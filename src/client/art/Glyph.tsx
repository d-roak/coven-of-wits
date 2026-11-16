import type { ReactNode, SVGProps } from "react"
import type { TrialIcon } from "../../shared/games/devils/trial"

// Every piece icon in the app, drawn here on a 32-unit square. One name, one drawing: games tell
// pieces apart by glyph (Zoo animals, Montage portraits, Find the Key pictures), so two names must
// never share a picture. Glyph.test.ts holds that line.
//
// Three paint roles, styled in styles.css: default is an outline, `t` adds the tinted body,
// `s` is solid ink (eyes, noses).

const dot = (cx: number, cy: number, r = 1.4) => <circle key={`${cx}-${cy}`} className="s" cx={cx} cy={cy} r={r} />
const eyes = (x: number, y: number, r?: number) => [dot(x, y, r), dot(32 - x, y, r)]
const round = (n: number) => Math.round(n * 100) / 100

/** A closed ring of outward bumps: wax seals and manes. */
function scallop(bumps: number, radius: number, bump: number, cx = 16, cy = 16): string {
	const point = (i: number) => {
		const angle = (i / bumps) * 2 * Math.PI - Math.PI / 2
		return `${round(cx + radius * Math.cos(angle))} ${round(cy + radius * Math.sin(angle))}`
	}
	let d = `M${point(0)}`
	for (let i = 1; i <= bumps; i++) d += ` A${bump} ${bump} 0 0 1 ${point(i)}`
	return `${d} Z`
}

/** Alternating long and short spokes around a centre: stars. */
function spikes(points: number, outer: number, inner: number, cx = 16, cy = 16): string {
	return (
		Array.from({ length: points * 2 }, (_, i) => {
			const angle = (i / (points * 2)) * 2 * Math.PI - Math.PI / 2
			const r = i % 2 ? inner : outer
			return `${i ? "L" : "M"}${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`
		}).join(" ") + " Z"
	)
}

const rays = Array.from({ length: 8 }, (_, i) => {
	const angle = (i / 8) * 2 * Math.PI
	const at = (r: number) => `${round(16 + r * Math.cos(angle))} ${round(16 + r * Math.sin(angle))}`
	return `M${at(9)} L${at(13)}`
}).join(" ")

const GLYPHS = {
	// Familiars and beasts, all face on unless the animal only reads in profile.
	cat: (
		<>
			<path className="t" d="M6 5 L12 9.5 Q16 8.5 20 9.5 L26 5 V17 Q26 27 16 27 Q6 27 6 17 Z" />
			<path d="M3 18.5 L8.5 19.5 M3.5 23 L8.5 21.5 M29 18.5 L23.5 19.5 M28.5 23 L23.5 21.5" />
			{eyes(12, 16)}
			<path className="s" d="M14.8 20 h2.4 l-1.2 1.6 Z" />
		</>
	),
	lynx: (
		<>
			<path
				className="t"
				d="M8 12 L7 5 L13 8.5 Q16 7.5 19 8.5 L25 5 L24 12 Q27 16 25 20 L28.5 24.5 L23 24 Q20 28 16 28 Q12 28 9 24 L3.5 24.5 L7 20 Q5 16 8 12 Z"
			/>
			<path d="M7 5 L5 1.5 M25 5 L27 1.5" />
			{eyes(12.5, 16)}
			<path className="s" d="M14.8 20 h2.4 l-1.2 1.6 Z" />
		</>
	),
	tiger: (
		<>
			<path d="M7.5 11.5 A3.6 3.6 0 1 1 12.2 7.5 M24.5 11.5 A3.6 3.6 0 1 0 19.8 7.5" />
			<circle className="t" cx="16" cy="17" r="10" />
			<path d="M16 7.5 V11.5 M12.5 8.5 L13.5 11.5 M19.5 8.5 L18.5 11.5 M6.5 15.5 H10 M7 19.5 H10 M25.5 15.5 H22 M25 19.5 H22" />
			{eyes(12.8, 16.5)}
			<path className="s" d="M14.5 20 h3 l-1.5 2 Z" />
			<path d="M13.5 24 Q14.8 25.5 16 23.5 Q17.2 25.5 18.5 24" />
		</>
	),
	lion: (
		<>
			<path d="M8.2 8.5 A3 3 0 1 1 12.5 5.6 M23.8 8.5 A3 3 0 1 0 19.5 5.6" />
			<path
				className="t"
				fillRule="evenodd"
				d={`${scallop(9, 11, 4.4, 16, 17)} M9 17.5 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z`}
			/>
			{eyes(13, 16)}
			<path className="s" d="M14.4 19 h3.2 l-1.6 2 Z" />
			<path d="M13.8 22.6 Q15 23.6 16 21.5 Q17 23.6 18.2 22.6" />
		</>
	),
	fox: (
		<>
			<path className="t" d="M5 4 L12 9 Q16 7.5 20 9 L27 4 L26 15 L16 28 L6 15 Z" />
			<path d="M10.5 19.5 L16 22 L21.5 19.5" />
			{eyes(12, 15)}
			<path className="s" d="M14 25 L18 25 L16 28 Z" />
		</>
	),
	wolf: (
		<>
			<path
				className="t"
				d="M8 3 L12 10 Q16 8.5 20 10 L24 3 L26 13 L29 19 L24 20 L21 26 L16 29 L11 26 L8 20 L3 19 L6 13 Z"
			/>
			<path d="M10.5 14.5 L14 16.5 M21.5 14.5 L18 16.5" />
			<path className="s" d="M14.3 23.5 h3.4 l-1.7 2.3 Z" />
		</>
	),
	bear: (
		<>
			<path d="M6.8 10.5 A4.2 4.2 0 1 1 12.5 7.3 M25.2 10.5 A4.2 4.2 0 1 0 19.5 7.3" />
			<circle className="t" cx="16" cy="17" r="10" />
			<ellipse cx="16" cy="20.5" rx="4.6" ry="3.6" />
			{eyes(12, 14.5)}
			<ellipse className="s" cx="16" cy="19.2" rx="1.8" ry="1.2" />
		</>
	),
	monkey: (
		<>
			<path d="M7 12.5 A3.8 3.8 0 1 0 7 19.5 M25 12.5 A3.8 3.8 0 1 1 25 19.5" />
			<circle className="t" cx="16" cy="16" r="9.5" />
			<path d="M16 11.5 Q10.5 8.5 10 14.5 Q10 17.5 12 19 Q10.5 24.5 16 25 Q21.5 24.5 20 19 Q22 17.5 22 14.5 Q21.5 8.5 16 11.5 Z" />
			{eyes(13.5, 15.5, 1.2)}
			<path d="M13.8 21 Q16 22.8 18.2 21" />
		</>
	),
	elephant: (
		<>
			<path className="t" d="M10 9 Q4 5.5 3 12 Q2.5 19 10 19 Z" />
			<path className="t" d="M22 9 Q28 5.5 29 12 Q29.5 19 22 19 Z" />
			<path
				className="t"
				d="M10 11 Q10 5 16 5 Q22 5 22 11 V17 Q22 20 19 21 V24 Q19 25.5 21 25.5 H23 V29 H18 Q13 29 13 24 V21 Q10 20 10 17 Z"
			/>
			{eyes(13.5, 14, 1.2)}
		</>
	),
	rabbit: (
		<>
			<path className="t" d="M11.5 14 Q7 4 10.5 2.5 Q14 3 14.8 13 Z" />
			<path className="t" d="M20.5 14 Q25 4 21.5 2.5 Q18 3 17.2 13 Z" />
			<ellipse className="t" cx="16" cy="20.5" rx="8.5" ry="8" />
			{eyes(12.8, 19.5)}
			<path className="s" d="M15 23 h2 l-1 1.3 Z" />
		</>
	),
	lamb: (
		<>
			<path d="M9.5 14 Q4 13 3.5 17 Q7 18.5 9.8 16.5 M22.5 14 Q28 13 28.5 17 Q25 18.5 22.2 16.5" />
			<path className="t" d="M9 13 A3.5 3.5 0 0 1 11 7 A4 4 0 0 1 16 5 A4 4 0 0 1 21 7 A3.5 3.5 0 0 1 23 13 Z" />
			<path d="M9.5 13 Q9 24 16 27 Q23 24 22.5 13" />
			{eyes(13, 17)}
			<path d="M14.5 21.5 L16 23 L17.5 21.5 M16 23 V24.5" />
		</>
	),
	goat: (
		<>
			<path className="t" d="M12 9 Q9 3 4 4 Q8 5.5 9 10.5 Z" />
			<path className="t" d="M20 9 Q23 3 28 4 Q24 5.5 23 10.5 Z" />
			<path d="M10 11.5 L4 14 L10.5 15 M22 11.5 L28 14 L21.5 15" />
			<path className="t" d="M10 10 Q16 7 22 10 L20 22 Q16 26 12 22 Z" />
			<path d="M12.5 14.5 H14.5 M17.5 14.5 H19.5 M14 24.5 L16 30 L18 24.5" />
			{eyes(14.8, 20.5, 0.8)}
		</>
	),
	yak: (
		<>
			<path d="M9 12 Q2 12 3 4 M23 12 Q30 12 29 4" />
			<path className="t" d="M9 11 Q16 6 23 11 V20 Q23 28 16 28 Q9 28 9 20 Z" />
			<path d="M9 15 L11.5 18 L14 15 L16 18 L18 15 L20.5 18 L23 15" />
			{eyes(13, 20.8, 1.1)}
			<ellipse cx="16" cy="24.6" rx="2.4" ry="1.4" />
		</>
	),
	deer: (
		<>
			<path d="M12.5 11 Q11 7 8 3 M11.2 7.5 L7 8 M10 5.5 L12.5 2.5 M19.5 11 Q21 7 24 3 M20.8 7.5 L25 8 M22 5.5 L19.5 2.5" />
			<path d="M11 13 L5 12 Q6 17 11.2 16 M21 13 L27 12 Q26 17 20.8 16" />
			<path className="t" d="M11 12 Q16 10 21 12 Q21.5 19 19 25 Q16 29 13 25 Q10.5 19 11 12 Z" />
			{eyes(13.5, 17, 1.2)}
			<ellipse className="s" cx="16" cy="25.3" rx="1.6" ry="1.1" />
		</>
	),
	owl: (
		<>
			<path className="t" d="M7 6 L11 8 Q16 6 21 8 L25 6 Q27 12 26 18 Q25 28 16 28 Q7 28 6 18 Q5 12 7 6 Z" />
			<circle cx="12" cy="15" r="4" />
			<circle cx="20" cy="15" r="4" />
			{eyes(12, 15, 1.5)}
			<path className="s" d="M14.8 19.5 L16 22.5 L17.2 19.5 Z" />
		</>
	),
	parrot: (
		<>
			<path
				className="t"
				d="M8 28 V16 Q8 6 17 6 Q23 6 24 12 Q29 13 28 19 Q27.5 22 25 23 Q26 19.5 22 19 Q22 23 19 24 V28 Z"
			/>
			<path d="M24 12 Q20.5 14 22 19 M13 6.5 Q11 3 8 2.5 M16 6 Q15.5 3 13.5 1.5" />
			{dot(17, 12.5, 1.5)}
		</>
	),
	ibis: (
		<>
			<path className="t" d="M8.5 12 Q5 18 10 22 Q14 25 13 29 H17.5 Q18.5 24 14 20.5 Q10.5 17.5 12.5 12.8 Z" />
			<circle className="t" cx="11" cy="9" r="4" />
			<path d="M14.5 7.5 Q25 8 28.5 18 Q22 11.5 14.5 11" />
			{dot(11.5, 8.5, 1.1)}
		</>
	),
	snake: (
		<>
			<path strokeWidth="3" d="M6 26 H22 Q27 26 27 22 Q27 18 22 18 H12 Q7 18 7 13.5 Q7 9 12 9 H19" />
			<ellipse className="t" cx="22" cy="9" rx="3.8" ry="2.8" />
			<path d="M25.8 9 H28 L29.5 7.5 M28 9 L29.5 10.5" />
			{dot(22.6, 8.3, 0.9)}
		</>
	),
	toad: (
		<>
			<path
				className="t"
				d="M4 20 Q4 14 7.2 12.3 A3.8 3.8 0 1 1 14 11.5 H18 A3.8 3.8 0 1 1 24.8 12.3 Q28 14 28 20 Q28 26 16 26 Q4 26 4 20 Z"
			/>
			{eyes(10.6, 9.6)}
			<path d="M8 19.5 Q16 23.5 24 19.5" />
			{eyes(14.5, 15.5, 0.7)}
		</>
	),
	bat: (
		<>
			<path
				className="t"
				d="M16 12 L14 8 L13.5 12 Q11 10 9 6 Q5 8 2 14 Q5 13 7 16 Q9 14 11.5 17 Q13 16 16 21 Q19 16 20.5 17 Q23 14 25 16 Q27 13 30 14 Q27 8 23 6 Q21 10 18.5 12 L18 8 Z"
			/>
			{eyes(15, 14.8, 0.8)}
		</>
	),
	moth: (
		<>
			<path className="t" d="M14.5 12 Q8 4 3.5 8 Q3 14 14.5 16 Z" />
			<path className="t" d="M17.5 12 Q24 4 28.5 8 Q29 14 17.5 16 Z" />
			<path className="t" d="M14.5 17 Q7 17 6.5 23 Q10 27 14.8 20.5 Z" />
			<path className="t" d="M17.5 17 Q25 17 25.5 23 Q22 27 17.2 20.5 Z" />
			<ellipse cx="16" cy="16" rx="1.6" ry="6" />
			<path d="M15.3 10 Q14 6 11.5 5 M16.7 10 Q18 6 20.5 5" />
			<circle cx="8.5" cy="10.5" r="1.4" />
			<circle cx="23.5" cy="10.5" r="1.4" />
		</>
	),

	// Things found in a coven.
	vial: (
		<>
			<path className="t" stroke="none" d="M10.5 19 H21.5 L24.5 24 Q26 28 22 28 H10 Q6 28 7.5 24 Z" />
			<path d="M12.5 4 H19.5 M14 4 V12 L7.5 24 Q6 28 10 28 H22 Q26 28 24.5 24 L18 12 V4 M10.5 19 H21.5" />
			{dot(14, 23.5, 1)}
			{dot(18.5, 22, 0.8)}
		</>
	),
	candle: (
		<>
			<path className="t" d="M16 3 Q19.5 7 16 11 Q12.5 7 16 3 Z" />
			<path className="t" d="M11 14 H21 V28 H11 Z" />
			<path d="M16 14 V11 M11 18 Q13 18 13 20.5 M7 28 H25" />
		</>
	),
	torch: (
		<>
			<path
				className="t"
				d="M16 2.5 Q21 7 20 11 Q19.6 13 18.5 14 H13.5 Q11.5 12 12.5 8.5 Q13.5 9.8 14.5 9.5 Q13.8 5.5 16 2.5 Z"
			/>
			<path d="M11.5 14 H20.5 V17 H11.5 Z" />
			<path className="t" d="M13 17 H19 L17.5 29 H14.5 Z" />
		</>
	),
	fire: (
		<>
			<path
				className="t"
				d="M16 3 Q25.5 11 25.5 19 A9.5 9.5 0 0 1 6.5 19 Q6.5 15 10 11.5 Q11 15 13.5 15.5 Q12.5 8.5 16 3 Z"
			/>
			<path d="M16 27.5 Q12 26 13 21.5 Q15 22.5 16.5 18.5 Q20.5 23 16 27.5 Z" />
		</>
	),
	feather: (
		<>
			<path className="t" d="M26 4 Q12 5 9 16 L7.5 24.5 Q19 23 23.5 15 Q26.5 10 26 4 Z" />
			<path d="M5 28 L20.5 10.5 M12.5 19.5 H18 M15.5 16 H21" />
		</>
	),
	key: (
		<>
			<circle className="t" cx="10.5" cy="10.5" r="5.5" />
			<circle cx="10.5" cy="10.5" r="1.5" />
			<path d="M14.5 14.5 L27 27 M23 23 L26 20 M19.5 19.5 L22 17" />
		</>
	),
	lock: (
		<>
			<path d="M10.5 14 V10 A5.5 5.5 0 0 1 21.5 10 V14" />
			<path className="t" d="M9 14 H23 Q25 14 25 16 V25.5 Q25 27.5 23 27.5 H9 Q7 27.5 7 25.5 V16 Q7 14 9 14 Z" />
			{dot(16, 19.5, 1.6)}
			<path d="M16 20.5 V23.5" />
		</>
	),
	cup: (
		<>
			<path className="t" d="M8 5 H24 Q24 16 16 16 Q8 16 8 5 Z" />
			<path d="M16 16 V24" />
			<path className="t" d="M9.5 27.5 Q11 24 16 24 Q21 24 22.5 27.5 Z" />
		</>
	),
	gem: (
		<>
			<path className="t" d="M10 5 H22 L28 12.5 L16 28 L4 12.5 Z" />
			<path d="M4 12.5 H28 M10 5 L13 12.5 L16 28 L19 12.5 L22 5" />
		</>
	),
	wand: (
		<>
			<path d="M5 27 L19 13" />
			<path className="t" d="M22.5 3.5 L24 8 L28.5 9.5 L24 11 L22.5 15.5 L21 11 L16.5 9.5 L21 8 Z" />
			<path d="M9 6 V10 M7 8 H11 M27 20 V23 M25.5 21.5 H28.5" />
		</>
	),
	seal: (
		<>
			<path className="t" d={scallop(12, 11.5, 3.3)} />
			<circle cx="16" cy="16" r="6.5" />
			<path d="M16 12.5 V19.5 M13.3 15 L16 12.5 L18.7 15" />
		</>
	),
	book: (
		<>
			<path className="t" d="M16 9 Q11 5.5 4 6.5 V24 Q11 23 16 26.5 Q21 23 28 24 V6.5 Q21 5.5 16 9 Z" />
			<path d="M16 9 V26.5 M7.5 11.5 Q10.5 11 13 12 M7.5 15.5 Q10.5 15 13 16 M19 12 Q21.5 11 24.5 11.5 M19 16 Q21.5 15 24.5 15.5" />
		</>
	),
	ink: (
		<>
			<path d="M13 4 H19 V8 H13 Z" />
			<path className="t" d="M13 8 H19 L24 13 V26 Q24 28 22 28 H10 Q8 28 8 26 V13 Z" />
			<path d="M11.5 17 H20.5 V23 H11.5 Z" />
		</>
	),
	bell: (
		<>
			<path className="t" d="M16 5 Q23.5 5 23.5 14 Q23.5 20 26.5 23 H5.5 Q8.5 20 8.5 14 Q8.5 5 16 5 Z" />
			<path d="M16 5 V3 M13.5 26 A2.5 2.5 0 0 0 18.5 26" />
		</>
	),
	hat: (
		<>
			<path className="t" d="M10 21 L15 6 Q16 2.5 20 3.5 Q17.5 5 18.5 8 L22 21 Z" />
			<path className="t" d="M3 23.5 Q16 18 29 23.5 Q16 29.5 3 23.5 Z" />
			<path d="M11.5 16.5 H20.5" />
		</>
	),
	skull: (
		<>
			<path className="t" d="M16 4 Q27 4 27 14 Q27 19 23.5 21 V26 H8.5 V21 Q5 19 5 14 Q5 4 16 4 Z" />
			{eyes(11.5, 14.5, 2.6)}
			<path className="s" d="M16 17.5 l-1.3 2.4 h2.6 Z" />
			<path d="M13 22.5 V26 M16 22.5 V26 M19 22.5 V26" />
		</>
	),
	sword: (
		<>
			<path className="t" d="M27 5 L20 6.5 L9.5 17 L15 22.5 L25.5 12 Z" />
			<path d="M7 14.5 L17.5 25 M10.5 21.5 L6.5 25.5 M24 8 L14 18" />
			<circle cx="5.2" cy="26.8" r="1.6" />
		</>
	),
	shield: (
		<>
			<path className="t" d="M16 4 L27 7.5 V15 Q27 24 16 28.5 Q5 24 5 15 V7.5 Z" />
			<path d="M16 4 V28.5 M5 13.5 H27" />
		</>
	),
	coin: (
		<>
			<circle className="t" cx="16" cy="16" r="12" />
			<circle cx="16" cy="16" r="8" />
			<path className="s" d={spikes(5, 4.6, 1.9)} />
		</>
	),
	pawn: (
		<>
			<circle className="t" cx="16" cy="8.5" r="4" />
			<path d="M11 14.5 H21 M13 14.5 Q13.5 21 10 25 M19 14.5 Q18.5 21 22 25" />
			<path className="t" d="M8 25 H24 V28.5 H8 Z" />
		</>
	),
	arrow: (
		<>
			<path className="t" d="M16 3 L22 11 H10 Z" />
			<path d="M16 11 V28 M16 22 L12 26 M16 22 L20 26 M16 25.5 L12 29.5 M16 25.5 L20 29.5" />
		</>
	),
	eye: (
		<>
			<path className="t" d="M3 16 Q9.5 7 16 7 Q22.5 7 29 16 Q22.5 25 16 25 Q9.5 25 3 16 Z" />
			<circle cx="16" cy="16" r="4.5" />
			{dot(16, 16, 1.8)}
			<path d="M16 2.5 V4.5 M7.5 5.5 L8.8 7.5 M24.5 5.5 L23.2 7.5" />
		</>
	),

	// Sky and grove.
	moon: <path className="t" d="M22 4.5 A12 12 0 1 0 27.5 20 A9.5 9.5 0 0 1 22 4.5 Z" />,
	star: <path className="t" d={spikes(5, 12.5, 5.2, 16, 16.8)} />,
	sun: (
		<>
			<circle className="t" cx="16" cy="16" r="5.5" />
			<path d={rays} />
		</>
	),
	water: (
		<>
			<path className="t" d="M16 3.5 Q25.5 14 25.5 19.5 A9.5 9.5 0 0 1 6.5 19.5 Q6.5 14 16 3.5 Z" />
			<path d="M11 20 Q11 24 15 24.5" />
		</>
	),
	leaf: (
		<>
			<path className="t" d="M5.5 26.5 Q3 9 26.5 5.5 Q29 24 9 27 Z" />
			<path d="M5.5 26.5 L21 11 M12 20 V14 M12 20 H18.5" />
		</>
	),
	elm: (
		<>
			<path
				className="t"
				d="M16 3.5 A6 6 0 0 1 22.5 8 A5.5 5.5 0 0 1 24 18.5 H8 A5.5 5.5 0 0 1 9.5 8 A6 6 0 0 1 16 3.5 Z"
			/>
			<path d="M16 12 V28.5 M16 20 L20 16 M16 17 L12.5 13.5 M11.5 28.5 H20.5" />
		</>
	),
	acorn: (
		<>
			<path className="t" d="M7 13 Q7 6.5 16 6.5 Q25 6.5 25 13 Z" />
			<path d="M8.5 13 Q8.5 23 16 28 Q23.5 23 23.5 13 M16 6.5 Q16 4 18.5 3 M11 9 L12.5 10.5 M15.5 8.5 L17 10 M20 9 L21.5 10.5" />
		</>
	),
	mushroom: (
		<>
			<path className="t" d="M4 16 Q4 5 16 5 Q28 5 28 16 Q28 18 26 18 H6 Q4 18 4 16 Z" />
			<path d="M12.5 18 Q13 24 11.5 27 Q11 28.5 13 28.5 H19 Q21 28.5 20.5 27 Q19 24 19.5 18" />
			<circle cx="11" cy="11.5" r="2" />
			<circle cx="19" cy="9.5" r="1.6" />
			<circle cx="22.5" cy="14" r="1.2" />
		</>
	),
	nest: (
		<>
			<path d="M7.5 16 C7.5 11 9.5 9 11 9 C12.5 9 13.6 10.5 14 12.5 M12.5 16 C12.5 10 14.5 7.5 16 7.5 C17.5 7.5 19.5 10 19.5 16 M18 12.5 C18.4 10.5 19.5 9 21 9 C22.5 9 24.5 11 24.5 16" />
			<path className="t" d="M3 16 H29 Q28 26 16 26 Q4 26 3 16 Z" />
			<path d="M8 19 L12 22 M14 19 L18 22.5 M20 20.5 L24 18.5 M11 23.5 L16 21.5" />
		</>
	),
} satisfies Record<TrialIcon, ReactNode>

export const GLYPH_NAMES = Object.keys(GLYPHS) as TrialIcon[]

/** Decorative by default: the piece around it carries the label. Sized by CSS or the svg props. */
export function Glyph({ name, className = "", ...svg }: { name: TrialIcon } & SVGProps<SVGSVGElement>) {
	return (
		<svg className={`glyph ${className}`} viewBox="0 0 32 32" aria-hidden="true" {...svg}>
			{GLYPHS[name]}
		</svg>
	)
}
