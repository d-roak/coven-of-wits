import { MinusIcon, PlusIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { type Bid, type LiarsBonesMove, type LiarsBonesView, outbids } from "../../shared/games/liarsBones"
import { Die } from "../art/Die"
import { useLang } from "../i18n"
import { type BoardProps, useLinger, who } from "./types"
import "./classicUx.css"

// How long the turned-over bones stay readable after a call, even if the next bid has already come in.
const REVEAL_MS = 3400

/** The lowest bid that beats `prev`. Where the controls start each turn. */
function minimalRaise(prev: Bid | null): { count: number; face: number } {
	if (!prev) return { count: 1, face: 2 }
	return prev.face < 6 ? { count: prev.count, face: prev.face + 1 } : { count: prev.count + 1, face: 1 }
}

function BidControls({ prev, total, onMove }: { prev: Bid | null; total: number; onMove(move: LiarsBonesMove): void }) {
	const { tx } = useLang()
	const start = minimalRaise(prev)
	const [count, setCount] = useState(Math.min(start.count, total))
	const [face, setFace] = useState(start.face)
	const legal = count <= total && outbids({ count, face }, prev)
	const [step, setStep] = useState<"action" | "count" | "face" | "review" | "call">(prev ? "action" : "count")
	return (
		<div className="lb-controls">
			{step === "action" && (
				<>
					<p>{tx("Raise the claim or challenge it.")}</p>
					<div className="btn-row">
						<button
							className="btn"
							disabled={prev?.count === total && prev.face === 6}
							onClick={() => setStep("count")}
						>
							{tx("Raise bid")}
						</button>
						<button className="btn is-moon" onClick={() => setStep("call")}>
							{tx("Challenge bid")}
						</button>
					</div>
				</>
			)}
			{step === "count" && (
				<>
					<span className="lb-step">{tx("How many bones")}</span>
					<div className="lb-stepper">
						<button
							className="btn is-ghost"
							disabled={count <= 1}
							onClick={() => setCount(count - 1)}
							aria-label={tx("Fewer bones")}
						>
							<MinusIcon weight="bold" />
						</button>
						<output className="lb-count" aria-label={tx("Bones in your bid")}>
							{count}
						</output>
						<button
							className="btn is-ghost"
							disabled={count >= total}
							onClick={() => setCount(count + 1)}
							aria-label={tx("More bones")}
						>
							<PlusIcon weight="bold" />
						</button>
					</div>
					<div className="btn-row">
						{prev && (
							<button className="btn is-ghost" onClick={() => setStep("action")}>
								{tx("Back")}
							</button>
						)}
						<button className="btn" onClick={() => setStep("face")}>
							{tx("Choose face")}
						</button>
					</div>
				</>
			)}
			{step === "face" && (
				<>
					<span className="lb-step">{tx("Showing which face")}</span>
					<div className="lb-faces" role="radiogroup" aria-label={tx("Face in your bid")}>
						{[1, 2, 3, 4, 5, 6].map((f) => (
							<button
								key={f}
								className={`lb-face ${f === face ? "is-chosen" : ""}`}
								role="radio"
								aria-checked={f === face}
								onClick={() => setFace(f)}
							>
								<Die face={f} size={34} />
							</button>
						))}
					</div>
					{!legal && <p role="status">{tx("Raise the count, or keep it and choose a higher face.")}</p>}
					<div className="btn-row">
						<button className="btn is-ghost" onClick={() => setStep("count")}>
							{tx("Back")}
						</button>
						<button className="btn" disabled={!legal} onClick={() => setStep("review")}>
							{tx("Review bid")}
						</button>
					</div>
				</>
			)}
			{step === "review" && (
				<>
					<p className="classic-claim">
						{tx("Bid")} {count} × <Die face={face} size={34} />
					</p>
					<div className="btn-row">
						<button className="btn is-ghost" onClick={() => setStep("face")}>
							{tx("Back")}
						</button>
						<button className="btn" onClick={() => onMove({ type: "bid", count, face })}>
							{tx("Place bid")}
						</button>
					</div>
				</>
			)}
			{step === "call" && prev && (
				<>
					<p className="classic-claim">
						{tx("Challenge")} {prev.count} × <Die face={prev.face} size={34} />
					</p>
					<p>{tx("All bones will be revealed. The wrong mage loses one bone.")}</p>
					<div className="btn-row">
						<button className="btn is-ghost" onClick={() => setStep("action")}>
							{tx("Back")}
						</button>
						<button className="btn is-moon" onClick={() => onMove({ type: "call" })}>
							{tx("Call the lie")}
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export function LiarsBonesBoard({ view, seat, names, canAct, onMove }: BoardProps<LiarsBonesView, LiarsBonesMove>) {
	const { tx } = useLang()
	const label = (i: number) => (i === seat ? tx("You") : names[i]!)
	const total = view.counts.reduce((a, b) => a + b, 0)
	// The table loses exactly one bone per call, so the total is a round counter.
	const lingering = useLinger(total, REVEAL_MS)
	const reveal = view.reveal && (lingering || !view.bid) ? view.reveal : null
	const bid = view.bid

	return (
		<div className="lb">
			<div className="lb-seats">
				{names.map((_, i) => {
					const shown = reveal ? reveal.bones[i]! : null
					return (
						<div
							key={i}
							className={`lb-seat seat${i} ${view.turn === i && !reveal ? "is-up" : ""} ${reveal?.loser === i ? "is-loser" : ""}`}
						>
							<span className="lb-name">{label(i)}</span>
							{/* Keyed by the round so every reroll replays the tumble. */}
							<div key={reveal ? "reveal" : total} className="lb-bones">
								{shown
									? shown.map((face, n) => (
											<Die key={n} face={face} className={face === reveal!.bid.face ? "is-hit" : "is-miss"} />
										))
									: i === seat
										? view.myBones.map((face, n) => <Die key={n} face={face} />)
										: Array.from({ length: view.counts[i]! }, (_, n) => <Die key={n} />)}
								{(shown ? shown.length : view.counts[i]) === 0 && <span className="lb-out">{tx("Out")}</span>}
							</div>
						</div>
					)
				})}
			</div>

			<div key={reveal ? "reveal" : `${bid?.count}-${bid?.face}`} className="lb-bid">
				{reveal ? (
					<>
						<p>
							<b>{label(reveal.caller)}</b> {tx("called the bid of")} {reveal.bid.count} ×{" "}
							<Die face={reveal.bid.face} size={26} /> {tx("by")} <b>{label(reveal.bid.by)}</b>.
						</p>
						<p>
							{tx(`The table held ${reveal.actual}. Bone lost:`)} <b>{label(reveal.loser)}</b>.
						</p>
					</>
				) : bid ? (
					<p className="lb-claim">
						<b>{label(bid.by)}</b>
						{/* The claim drawn as the bones it names. Past six it would wrap, so it falls back to a count. */}
						<span aria-label={tx(`${bid.count} bones showing ${bid.face}`)}>
							{bid.count <= 6 ? (
								Array.from({ length: bid.count }, (_, n) => <Die key={n} face={bid.face} size={40} />)
							) : (
								<>
									{bid.count} × <Die face={bid.face} size={40} />
								</>
							)}
						</span>
					</p>
				) : (
					<p>{tx(`No bid yet. ${who(names, view.turn, seat)} to open.`)}</p>
				)}
			</div>

			{canAct && !lingering ? (
				<BidControls key={`${bid?.count}-${bid?.face}-${total}`} prev={bid} total={total} onMove={onMove} />
			) : (
				<p className="lb-hint">{tx(`${total} bones on the table.`)}</p>
			)}
		</div>
	)
}
