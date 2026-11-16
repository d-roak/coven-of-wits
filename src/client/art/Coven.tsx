import { Poff } from "./Poff"

function Candle({ x, y, height }: { x: number; y: number; height: number }) {
	return (
		<g transform={`translate(${x} ${y})`} stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
			<ellipse cy="4" rx="16" ry="5" fill="var(--gold)" />
			<path d={`M-7 0 v-${height} h14 v${height} z`} fill="var(--paper)" />
			<path d={`M-7 -${height} q4 6 7 0 q4 9 7 0`} fill="none" />
			<path
				d={`M0 -${height + 2} C-11 -${height + 10} 1 -${height + 16} 0 -${height + 22} C12 -${height + 11} 8 -${height + 6} 0 -${height + 2} Z`}
				fill="var(--gold)"
			/>
		</g>
	)
}

/** One decorative scene keeps the cast, ritual table and props in the same coordinate space. */
export function Coven() {
	return (
		<svg className="coven-art" viewBox="0 0 480 340" aria-hidden="true">
			<path d="M63 272 V145 A177 130 0 0 1 417 145 V272 Z" fill="var(--hill-2)" stroke="var(--ink)" strokeWidth="4" />
			<path
				d="M76 264 V146 A164 118 0 0 1 404 146 V264"
				fill="none"
				stroke="var(--moss)"
				strokeWidth="2"
				opacity="0.45"
			/>
			<g fill="none" stroke="var(--moss)" strokeWidth="2" opacity="0.35">
				<circle cx="240" cy="147" r="100" />
				<circle cx="240" cy="147" r="88" />
				<path d="M240 47 L327 197 H153 Z M240 247 L153 97 H327 Z" />
			</g>
			<path d="M246 25 a20 20 0 1 0 15 32 a19 19 0 0 1 -15 -32" fill="var(--paper-dim)" transform="translate(0 -12)" />
			<g fill="var(--paper-dim)">
				<path d="M136 87 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" />
				<path d="M351 79 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" />
				<circle cx="311" cy="55" r="2" />
				<circle cx="168" cy="58" r="2" />
				<circle cx="365" cy="123" r="2" />
			</g>
			<g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
				<path d="M38 267 Q27 192 51 118 Q49 190 69 227 L81 180 Q92 241 78 271 Z" fill="var(--hill-1)" />
				<path d="M402 275 Q386 222 403 165 L414 210 Q426 157 444 145 Q425 231 446 280 Z" fill="var(--hill-1)" />
			</g>
			<g transform="translate(67 86) rotate(-10 55 80)">
				<Poff look="moon" size={111} mood="think" />
			</g>
			<g transform="translate(297 91) rotate(9 55 80)">
				<g transform="translate(111 0) scale(-1 1)">
					<Poff look="moss" size={111} mood="happy" />
				</g>
			</g>
			<g transform="translate(158 35)">
				<Poff look="ember" size={164} mood="idle" />
			</g>
			<ellipse cx="240" cy="315" rx="182" ry="16" fill="var(--ink)" opacity="0.22" />
			<g stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round">
				<path
					d="M99 246 L91 302 Q111 311 127 303 L139 257 M343 256 L355 304 Q370 310 387 301 L381 244"
					fill="var(--panel-deep)"
				/>
				<path d="M67 235 Q240 195 413 235 L409 263 Q240 314 71 263 Z" fill="var(--panel-deep)" />
				<ellipse cx="240" cy="235" rx="174" ry="47" fill="var(--panel)" />
				<path d="M179 194 Q240 186 300 194 L295 272 L241 311 L185 272 Z" fill="var(--ember)" />
				<path d="M192 201 L197 265 L241 296 L283 265 L287 201" fill="none" stroke="var(--paper-dim)" strokeWidth="2" />
			</g>
			<g fill="none" stroke="var(--paper-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M241 253 l15 21 l-15 13 l-15 -13 Z M226 274 h30 M241 253 v34" />
				<path d="M209 258 l-3 8 M272 258 l3 8" />
			</g>
			<g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
				<path d="M194 222 L240 212 L286 222 L280 246 L241 239 L200 247 Z" fill="var(--ember-deep)" />
				<path
					d="M193 215 Q218 202 240 215 Q261 202 287 215 L281 238 Q260 227 241 235 Q220 227 199 239 Z"
					fill="var(--paper)"
				/>
				<path d="M240 215 l1 20" fill="none" />
				<path
					d="M205 218 l21 -2 M207 224 l15 -2 M254 217 l9 -3 l9 4 l-8 7 Z M258 230 l14 2"
					fill="none"
					strokeWidth="2"
				/>
			</g>
			<Candle x={95} y={235} height={34} />
			<Candle x={146} y={247} height={22} />
			<Candle x={385} y={235} height={38} />
			<g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
				<path d="M319 242 l-13 -18 l8 -19 l15 1 l10 19 l-9 17 Z" fill="var(--moon)" />
				<path d="M314 205 l8 21 l7 -20 M322 226 l-3 16 M322 226 l17 -1" fill="none" />
				<path d="M55 288 h10 l2 23 h-14 Z" fill="var(--paper-dim)" />
				<path d="M38 288 Q60 251 82 288 Q60 300 38 288 Z" fill="var(--ember)" />
				<path d="M406 301 h9 l1 17 h-13 Z" fill="var(--paper-dim)" />
				<path d="M395 300 Q409 273 427 300 Q411 309 395 300 Z" fill="var(--ember)" />
			</g>
			<g fill="var(--paper-dim)">
				<circle cx="55" cy="281" r="4" />
				<circle cx="68" cy="287" r="3" />
				<circle cx="409" cy="295" r="3" />
			</g>
			<g fill="none" stroke="var(--moss)" strokeWidth="3" strokeLinecap="round">
				<path d="M31 307 l8 -13 M39 310 l13 -3 M440 306 l-2 -18 M445 308 l10 -9" />
			</g>
		</svg>
	)
}
