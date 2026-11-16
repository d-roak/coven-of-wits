const TREES = [35, 118, 215, 305, 420, 545, 675, 810, 915, 1040, 1155]
const STARS = [
	[60, 45],
	[185, 125],
	[312, 36],
	[475, 110],
	[630, 52],
	[780, 140],
	[930, 42],
	[1130, 140],
]

export function Scene() {
	return (
		<div className="scene" aria-hidden="true">
			<svg className="scene-clouds" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMin slice">
				<path d="M1070 23 A54 54 0 1 0 1113 106 A51 51 0 0 1 1070 23" fill="var(--paper-dim)" />
				<g fill="var(--paper-dim)" opacity="0.5">
					{STARS.map(([x, y]) => (
						<path key={x} d={`M${x} ${y! - 6} l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z`} />
					))}
				</g>
				<g fill="none" stroke="var(--tree)" strokeWidth="3">
					<path d="M0 10 Q140 75 272 0 M958 0 Q1085 70 1200 8" />
					<path d="M50 29 v53 M1150 27 v55" />
				</g>
				{[50, 1150].map((x) => (
					<g key={x} transform={`translate(${x} 82)`} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
						<path d="M-13 3 L0 -5 L13 3 L17 32 Q0 42 -17 32 Z" fill="var(--gold)" />
						<path d="M-13 3 H13 M-17 32 H17 M-5 6 v25 M5 6 v25" fill="none" />
					</g>
				))}
			</svg>
			<svg className="scene-land" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice">
				<path className="scene-hill-1" d="M0 140 Q150 60 330 125 T650 105 T950 130 T1200 90 V260 H0 Z" />
				{TREES.map((x, i) => {
					const base = 200 - ((i * 13) % 16)
					const h = 90 + ((i * 37) % 65)
					return (
						<g key={x} className="scene-tree">
							<path
								d={`M${x} ${base - h} l${h * 0.23} ${h * 0.35} h-${h * 0.09} l${h * 0.22} ${h * 0.32} h-${h * 0.11} l${h * 0.26} ${h * 0.33} h-${h * 1.02} l${h * 0.26} -${h * 0.33} h-${h * 0.11} l${h * 0.22} -${h * 0.32} h-${h * 0.09} z`}
							/>
							<path d={`M${x - 4} ${base - 10} h8 v35 h-8 z`} />
						</g>
					)
				})}
				<path className="scene-hill-2" d="M0 207 Q210 150 430 192 T830 182 T1200 170 V260 H0 Z" />
				{[110, 165, 865, 1090].map((x, i) => (
					<g key={x} transform={`translate(${x} ${224 - (i % 2) * 8})`} stroke="var(--ink)" strokeWidth="2">
						<path className="scene-stalk" d="M-4 -2 h8 l3 20 h-14 z" />
						<path className="scene-cap" d="M-18 2 Q-14 -18 0 -17 Q14 -18 18 2 Q0 9 -18 2 Z" />
						<g className="scene-dot" stroke="none">
							<circle cx="-7" cy="-4" r="3" />
							<circle cx="4" cy="-10" r="2" />
							<circle cx="10" cy="0" r="2" />
						</g>
					</g>
				))}
				<path className="scene-hill-3" d="M0 248 Q260 214 520 240 T1000 234 T1200 242 V260 H0 Z" />
			</svg>
		</div>
	)
}
