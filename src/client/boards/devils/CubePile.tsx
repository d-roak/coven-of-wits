import { useLang } from "../../i18n"

/** Isometric stacks are drawn from back to front; each stack is solid down to the floor. */
export function CubePile({ columns, heights }: { columns: number; heights: number[] }) {
	const { tx } = useLang()
	const stacks = heights
		.map((height, i) => ({ height, row: Math.floor(i / columns), col: i % columns }))
		.sort((a, b) => a.row + a.col - b.row - b.col || a.row - b.row)
	const highest = Math.max(...heights)
	const top = -highest * 20 - 16
	const bottom = columns * 24 + 28
	return (
		<svg
			viewBox={`${-columns * 21} ${top} ${columns * 42} ${bottom - top}`}
			role="img"
			aria-label={tx(
				"A solid pile of cubes. Count each cube, including hidden cubes. Use Turn pile to see another side.",
			)}
			style={{ display: "block", width: "min(100%, 30rem)", height: "auto", margin: "0 auto" }}
		>
			<path
				d={`M0 -10 L${columns * 20} ${columns * 11} L0 ${columns * 24} L${-columns * 20} ${columns * 11} Z`}
				fill="var(--hill-1)"
				stroke="var(--ink)"
				strokeWidth="2"
			/>
			{stacks.flatMap(({ height, row, col }) =>
				Array.from({ length: height }, (_, z) => {
					const x = (col - row) * 20
					const y = (col + row) * 11 - z * 20
					return (
						<g key={`${row}-${col}-${z}`} stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round">
							<path d={`M${x - 20} ${y} L${x} ${y + 11} V${y + 31} L${x - 20} ${y + 20} Z`} fill="var(--panel-deep)" />
							<path d={`M${x} ${y + 11} L${x + 20} ${y} V${y + 20} L${x} ${y + 31} Z`} fill="var(--moss)" />
							<path d={`M${x} ${y - 11} L${x + 20} ${y} L${x} ${y + 11} L${x - 20} ${y} Z`} fill="var(--paper-dim)" />
						</g>
					)
				}),
			)}
		</svg>
	)
}
