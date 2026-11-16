import { BirdIcon, BugIcon, ChatCircleDotsIcon, CheckCircleIcon, LightbulbIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { feedbackReport, type FeedbackContext, type FeedbackDebug, type FeedbackReport } from "../../shared/community"
import { findGame } from "../../shared/games"
import { useLang } from "../i18n"
import { useCommunity } from "./Community"
import { collectDebug } from "./diagnostics"
import { captureScreenshot } from "./screenshot"
import { feedbackCanBeEdited, FeedbackDeliveryError, sendFeedback } from "./feedbackClient"
import { feedbackText } from "./feedbackText"
import "./feedback.css"

type Shot = { state: "empty" | "pending" | "failed" } | { state: "ready"; url: string }
const kinds = [
	{ id: "bug", Icon: BugIcon },
	{ id: "idea", Icon: LightbulbIcon },
	{ id: "other", Icon: ChatCircleDotsIcon },
] as const

export function FeedbackReporter({ context }: { context: FeedbackContext }) {
	const { lang } = useLang(),
		text = feedbackText[lang]
	const config = useCommunity()
	const dialog = useRef<HTMLDialogElement>(null)
	const heading = useRef<HTMLHeadingElement>(null)
	const messageField = useRef<HTMLTextAreaElement>(null)
	const deliveryUncertain = useRef(false)
	const sequence = useRef(0),
		busy = useRef(false)
	const [open, setOpen] = useState(false)
	const [step, setStep] = useState<"kind" | "write" | "review" | "done">("kind")
	const [kind, setKind] = useState<FeedbackReport["kind"]>("bug")
	const [message, setMessage] = useState("")
	const [debug, setDebug] = useState<FeedbackDebug | null>(null)
	const [includeDebug, setIncludeDebug] = useState(true)
	const [includeShot, setIncludeShot] = useState(true)
	const [shot, setShot] = useState<Shot>({ state: "empty" })
	const [zoom, setZoom] = useState(false)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [issue, setIssue] = useState("")
	const [frozen, setFrozen] = useState<FeedbackReport | null>(null)

	useEffect(() => {
		if (open && !dialog.current?.open) dialog.current?.showModal()
		else if (!open && dialog.current?.open) dialog.current?.close()
	}, [open])
	useEffect(() => {
		if (open) (step === "write" ? messageField.current : heading.current)?.focus()
	}, [open, step])
	useEffect(
		() => () => {
			sequence.current++
		},
		[],
	)
	const readContext = (): FeedbackContext => {
		const table = document.querySelector<HTMLElement>("[data-game-id]")
		if (!table) return context
		const game = table.dataset.gameId
		if (!game || !findGame(game)) return context
		return {
			...context,
			game,
			round: table.dataset.gameRound?.slice(0, 80),
			moves: Math.min(10000, Math.max(0, Number(table.dataset.gameMoves) || 0)),
		}
	}
	const capture = () => {
		setDebug(collectDebug(readContext(), lang))
		const current = ++sequence.current
		setShot({ state: "pending" })
		setIncludeShot(true)
		captureScreenshot().then(
			(url) => {
				if (current === sequence.current) setShot({ state: "ready", url })
			},
			() => {
				if (current === sequence.current) {
					setShot({ state: "failed" })
					setIncludeShot(false)
				}
			},
		)
	}
	const choose = (next: FeedbackReport["kind"]) => {
		setKind(next)
		setIncludeDebug(true)
		setDebug(collectDebug(readContext(), lang))
		setStep("write")
		setError(null)
		if (shot.state === "empty") capture()
	}
	const reset = () => {
		deliveryUncertain.current = false
		sequence.current++
		setStep("kind")
		setMessage("")
		setDebug(null)
		setShot({ state: "empty" })
		setIncludeDebug(true)
		setIncludeShot(true)
		setFrozen(null)
		setError(null)
		setIssue("")
		setZoom(false)
	}
	const submit = async () => {
		if (busy.current || !debug || !config.feedbackEnabled) return
		const report =
			frozen ??
			feedbackReport.parse({
				id: crypto.randomUUID(),
				kind,
				message,
				context: debug.context,
				...(includeDebug ? { debug } : {}),
				...(includeShot && shot.state === "ready" ? { screenshot: shot.url } : {}),
			})
		busy.current = true
		setPending(true)
		setFrozen(report)
		setError(null)
		try {
			setIssue(await sendFeedback(report))
			setStep("done")
		} catch (cause) {
			if (cause instanceof FeedbackDeliveryError && feedbackCanBeEdited(cause.code, deliveryUncertain.current))
				setFrozen(null)
			else deliveryUncertain.current = true
			setError(cause instanceof FeedbackDeliveryError ? cause.code : "DELIVERY_FAILED")
		} finally {
			busy.current = false
			setPending(false)
		}
	}
	const close = () => {
		setOpen(false)
	}
	const canReview = message.trim().length > 0 && !(includeShot && shot.state === "pending")
	const problem = error && /UNKNOWN|PENDING|UNCERTAIN/.test(error) ? text.ambiguous : text.error
	return (
		<>
			<button
				className="feedback-trigger btn"
				data-feedback-ignore
				aria-label={text.open}
				onClick={() => {
					if (step === "done") reset()
					setOpen(true)
				}}
			>
				<BirdIcon weight="duotone" />
				<span>{text.open}</span>
			</button>
			<dialog
				className="feedback-dialog"
				ref={dialog}
				data-feedback-ignore
				aria-labelledby="feedback-title"
				onCancel={close}
				onClose={() => setOpen(false)}
			>
				<header>
					<div>
						<BirdIcon weight="duotone" />
						<h2 id="feedback-title" tabIndex={-1} ref={heading}>
							{step === "done" ? text.sent : step === "review" ? text.review : text.title}
						</h2>
					</div>
					<button type="button" className="btn is-ghost" aria-label={text.dismiss} onClick={close}>
						<XIcon />
					</button>
				</header>
				{step === "kind" && (
					<>
						<p>{text.intro}</p>
						<div className="feedback-kinds">
							{kinds.map(({ id, Icon }) => (
								<button className="btn is-ghost" key={id} onClick={() => choose(id)}>
									<Icon weight="duotone" />
									{text[id]}
								</button>
							))}
						</div>
					</>
				)}
				{step === "write" && (
					<>
						<label className="feedback-message">
							{kind === "bug" ? text.write : kind === "idea" ? text.ideaWrite : text.noteWrite}
							<textarea
								ref={messageField}
								value={message}
								onChange={(event) => setMessage(event.target.value)}
								rows={5}
								maxLength={4000}
								placeholder={text.placeholder}
							/>
							<small>
								{message.length} / 4000 {text.count}
							</small>
						</label>
						<div className="feedback-options">
							<label>
								<input
									type="checkbox"
									checked={includeDebug}
									onChange={(event) => setIncludeDebug(event.target.checked)}
								/>
								{text.debug}
							</label>
							{debug && (
								<details>
									<summary>{text.debugView}</summary>
									<pre>{JSON.stringify(debug, null, 2)}</pre>
								</details>
							)}
							<label>
								<input
									type="checkbox"
									checked={includeShot}
									disabled={shot.state === "failed"}
									onChange={(event) => setIncludeShot(event.target.checked)}
								/>
								{text.shot}
							</label>
							{shot.state === "pending" && <p role="status">{text.capture}</p>}
							{shot.state === "failed" && <p role="alert">{text.failedShot}</p>}
							{shot.state === "ready" && (
								<button
									type="button"
									className={`feedback-shot ${zoom ? "is-expanded" : ""}`}
									aria-label={text.shotPreview}
									aria-expanded={zoom}
									onClick={() => setZoom(!zoom)}
								>
									<img src={shot.url} alt={text.screenshotAlt} />
								</button>
							)}
							<button
								type="button"
								className="btn is-ghost"
								disabled={shot.state === "pending"}
								onClick={() => capture()}
							>
								{text.retryShot}
							</button>
						</div>
						<div className="feedback-actions">
							<button className="btn is-ghost" onClick={() => setStep("kind")}>
								{text.back}
							</button>
							<button className="btn" disabled={!canReview} onClick={() => setStep("review")}>
								{text.next}
							</button>
						</div>
					</>
				)}
				{step === "review" && (
					<>
						<p>{text.destination}</p>
						{config.githubUrl && (
							<a href={config.githubUrl} target="_blank" rel="noopener noreferrer">
								{config.githubUrl.replace("https://github.com/", "")}
							</a>
						)}
						<blockquote className="feedback-review">{message}</blockquote>
						{includeDebug && debug ? (
							<details>
								<summary>{text.debugView}</summary>
								<pre>{JSON.stringify(debug, null, 2)}</pre>
							</details>
						) : (
							<p>{text.detailsNone}</p>
						)}
						{includeShot && shot.state === "ready" ? (
							<img className="feedback-review-shot" src={shot.url} alt={text.screenshotAlt} />
						) : (
							<p>{text.shotNone}</p>
						)}
						{!config.feedbackEnabled && <p role="status">{config.loading ? text.loading : text.unavailable}</p>}
						{error && (
							<p className="feedback-error" role="alert">
								{problem}
							</p>
						)}
						<div className="feedback-actions">
							{!frozen && (
								<button className="btn is-ghost" onClick={() => setStep("write")}>
									{text.edit}
								</button>
							)}
							<button className="btn" disabled={pending || !config.feedbackEnabled} onClick={submit}>
								{pending ? text.sending : error ? text.retry : text.send}
							</button>
						</div>
					</>
				)}
				{step === "done" && (
					<div className="feedback-done">
						<CheckCircleIcon weight="duotone" />
						<p role="status">{text.sent}</p>
						<a className="btn" href={issue} target="_blank" rel="noopener noreferrer">
							{text.issue}
						</a>
						<button className="btn is-ghost" onClick={close}>
							{text.close}
						</button>
					</div>
				)}
			</dialog>
		</>
	)
}
