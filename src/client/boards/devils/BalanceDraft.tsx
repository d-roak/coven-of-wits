import { useState } from "react"
import { ScalesIcon } from "@phosphor-icons/react"
import type { TrialMove, TrialView } from "../../../shared/games/devils/trial"
import { useLang } from "../../i18n"
import { Piece } from "./Piece"

export function BalanceDraft({
	balance,
	canAct,
	onMove,
}: {
	balance: NonNullable<TrialView["balance"]>
	canAct: boolean
	onMove(move: TrialMove): void
}) {
	const [pans, setPans] = useState<[string[], string[]]>([[], []])
	const [side, setSide] = useState(0)
	const { tx } = useLang()
	return (
		<section className="balance-draft" aria-label={tx("Build a comparison")}>
			<h3>{tx("Choose a pan, then add weights")}</h3>
			<ScalesIcon className="scale-illustration" weight="duotone" />
			<div className="balance-pans">
				{pans.map((pan, i) => (
					<div className={`balance-pan ${side === i ? "is-selected" : ""}`} key={i}>
						<button className="btn is-ghost" aria-pressed={side === i} disabled={!canAct} onClick={() => setSide(i)}>
							{tx(i === 0 ? "Left pan" : "Right pan")}
						</button>
						<div className="pan-weights">
							{pan.map((value, at) => {
								const stone = balance.stones.find((item) => item.value === value)!
								return (
									<button
										className="piece-option"
										key={at}
										disabled={!canAct}
										aria-label={tx(`Remove ${stone.label} from ${i === 0 ? "left" : "right"} pan`)}
										onClick={() =>
											setPans(
												pans.map((items, index) =>
													index === i ? items.filter((_, index) => index !== at) : items,
												) as [string[], string[]],
											)
										}
									>
										<Piece piece={stone.piece} />
									</button>
								)
							})}
						</div>
						<small>{tx(`${pan.length} / ${balance.maxPerPan} weights`)}</small>
					</div>
				))}
			</div>
			<div className="piece-options">
				{balance.stones.map((stone) => (
					<button
						className="piece-option"
						key={stone.value}
						disabled={!canAct || pans[side].length >= balance.maxPerPan}
						onClick={() =>
							setPans(pans.map((pan, i) => (i === side ? [...pan, stone.value] : pan)) as [string[], string[]])
						}
					>
						<Piece piece={stone.piece} />
						<span>{tx(`Add ${stone.label}`)}</span>
					</button>
				))}
			</div>
			<button
				className="btn"
				disabled={!canAct || pans.some((pan) => !pan.length)}
				onClick={() => {
					onMove({ action: balance.action, value: `${pans[0].join("")}=${pans[1].join("")}` })
				}}
			>
				{tx("Weigh the pans")}
			</button>
		</section>
	)
}
