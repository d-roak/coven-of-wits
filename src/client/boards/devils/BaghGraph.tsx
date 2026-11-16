/** Alternating diagonal intersections are part of the board, not legal-move hints. */
export function BaghGraph() {
	const lines: [number, number, number, number][] = []
	for (let row = 0; row < 5; row++)
		for (let col = 0; col < 5; col++) {
			if (col < 4) lines.push([col, row, col + 1, row])
			if (row < 4) lines.push([col, row, col, row + 1])
			if (row < 4 && col % 2 === row % 2) {
				if (col < 4) lines.push([col, row, col + 1, row + 1])
				if (col > 0) lines.push([col, row, col - 1, row + 1])
			}
		}
	return (
		<svg className="bagh-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
			{lines.map(([x1, y1, x2, y2], i) => (
				<line key={i} x1={10 + x1 * 20} y1={10 + y1 * 20} x2={10 + x2 * 20} y2={10 + y2 * 20} />
			))}
		</svg>
	)
}
