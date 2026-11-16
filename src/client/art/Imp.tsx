/** A round little devil for the shelf door. Drawn in the same ink-and-flat-colour style as the poffs. */
export function Imp({ size = 96 }: { size?: number }) {
	return (
		<svg className="imp" viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
			<ellipse cx="60" cy="112" rx="30" ry="5" fill="var(--ink)" opacity="0.16" />
			<g stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
				{/* tail, ending in a spade */}
				<path d="M88 92 Q110 96 106 74" fill="none" />
				<path d="M106 62 L114 76 Q106 72 98 76 Z" fill="var(--ember)" />
				{/* wings */}
				<path d="M30 70 Q8 58 10 40 Q18 50 24 46 Q24 56 34 56 Z" fill="var(--grape)" />
				<path d="M90 70 Q112 58 110 40 Q102 50 96 46 Q96 56 86 56 Z" fill="var(--grape)" />
				{/* horns */}
				<path d="M38 40 Q30 22 40 12 Q44 26 52 32 Z" fill="var(--gold)" />
				<path d="M82 40 Q90 22 80 12 Q76 26 68 32 Z" fill="var(--gold)" />
				{/* feet and body */}
				<ellipse cx="47" cy="108" rx="10" ry="6" fill="var(--ember-deep)" />
				<ellipse cx="73" cy="108" rx="10" ry="6" fill="var(--ember-deep)" />
				<path
					d="M60 28 C88 28 96 52 94 74 C92 96 80 106 60 106 C40 106 28 96 26 74 C24 52 32 28 60 28 Z"
					fill="var(--ember)"
				/>
			</g>
			<ellipse cx="38" cy="78" rx="7" ry="4.500" fill="var(--pink)" />
			<ellipse cx="82" cy="78" rx="7" ry="4.500" fill="var(--pink)" />
			<ellipse cx="47" cy="66" rx="6.500" ry="8.500" fill="var(--ink)" />
			<ellipse cx="73" cy="66" rx="6.500" ry="8.500" fill="var(--ink)" />
			<circle cx="49.500" cy="62.500" r="2.800" fill="var(--glint)" />
			<circle cx="75.500" cy="62.500" r="2.800" fill="var(--glint)" />
			<g stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
				{/* cheeky brows, grin and one fang */}
				<path d="M39 53 l11 4 M81 53 l-11 4 M51 80 q9 9 18 0" fill="none" />
				<path d="M62 84 l3 6 l3 -7 z" fill="var(--glint)" strokeWidth="2" />
			</g>
		</svg>
	)
}
