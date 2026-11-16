import { useLang } from "../i18n"

// Six rune stones. Each has its own glyph and its own colour, so they never rely on colour alone.
// Drawn here instead of using Unicode runes, which fall back to tofu on machines without a runic font.
const GLYPHS = [
	"M11 5 V27 M11 9 L22 15 L11 21",
	"M8 6 L24 26 M24 6 L8 26",
	"M16 5 V27 M7 14 L16 5 L25 14",
	"M9 27 V5 L23 27 V5",
	"M16 5 L26 16 L16 27 L6 16 Z",
	"M16 27 V5 M6 8 L16 17 L26 8",
] as const

export const RUNE_NAMES = ["Thorn", "Gift", "Arrow", "Need", "Seed", "Elk"] as const

export function Rune({ kind, size = 44 }: { kind: number; size?: number }) {
	const { tx } = useLang()
	const glyph = GLYPHS[kind]
	if (glyph === undefined) throw new Error(`Rune: expected kind 0 to ${GLYPHS.length - 1}, got ${kind}`)
	return (
		<svg
			className={`rune rune-${kind}`}
			viewBox="0 0 32 32"
			width={size}
			height={size}
			role="img"
			aria-label={tx(RUNE_NAMES[kind]!)}
		>
			<path
				className="rune-stone"
				d="M6 3 H25 Q30 4 29.500 9 L29 25 Q28 30 23 29.500 L7 29 Q2 28 2.500 23 L3 7 Q3 3 6 3 Z"
			/>
			<path className="rune-glyph" d={glyph} />
		</svg>
	)
}
