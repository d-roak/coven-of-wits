import {
	ButterflyIcon,
	CheckIcon,
	CopyIcon,
	FacebookLogoIcon,
	ShareNetworkIcon,
	UploadSimpleIcon,
	UsersThreeIcon,
	WhatsappLogoIcon,
	XIcon,
	XLogoIcon,
} from "@phosphor-icons/react"
import { useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLang } from "../i18n"
import { communityText, type CommunityTextKey } from "./communityText"
import { nativeShare, sharePayload, socialShareLinks, type ShareTarget } from "./share"
import "./share.css"

const destinations = [
	{ key: "x", name: "X", Icon: XLogoIcon },
	{ key: "bluesky", name: "Bluesky", Icon: ButterflyIcon },
	{ key: "whatsapp", name: "WhatsApp", Icon: WhatsappLogoIcon },
	{ key: "facebook", name: "Facebook", Icon: FacebookLogoIcon },
] as const

export function ShareButton({ target, compact = false }: { target: ShareTarget; compact?: boolean }) {
	const { lang } = useLang()
	const text = (key: CommunityTextKey) => communityText(lang, key)
	const dialog = useRef<HTMLDialogElement>(null)
	const link = useRef<HTMLInputElement>(null)
	const titleId = useId()
	const [message, setMessage] = useState<CommunityTextKey | null>(null)
	const [pending, setPending] = useState(false)
	const [supportsNative, setSupportsNative] = useState(false)
	const payload = sharePayload(location.href, target, lang)
	const social = socialShareLinks(payload)
	const label = text(
		target.kind === "invite"
			? "invite"
			: target.kind === "result"
				? "shareResult"
				: target.kind === "game"
					? "shareGame"
					: "share",
	)
	const open = () => {
		setMessage(null)
		setSupportsNative(typeof navigator.share === "function")
		dialog.current?.showModal()
	}
	const copy = async () => {
		setPending(true)
		try {
			if (!navigator.clipboard) throw new Error("Clipboard unavailable")
			await navigator.clipboard.writeText(payload.url)
			setMessage("copied")
		} catch {
			setMessage("copyFailed")
			link.current?.focus()
			link.current?.select()
		} finally {
			setPending(false)
		}
	}
	const deviceShare = async () => {
		setPending(true)
		const result = await nativeShare(payload, navigator.share?.bind(navigator))
		setMessage(result === "cancelled" ? null : result === "shared" ? "shared" : "nativeFailed")
		setPending(false)
	}
	return (
		<>
			<button
				type="button"
				className={`btn is-ghost share-trigger ${compact ? "is-compact" : ""}`}
				aria-label={label}
				title={compact ? label : undefined}
				aria-haspopup="dialog"
				onClick={open}
			>
				{target.kind === "invite" ? <UsersThreeIcon weight="bold" /> : <ShareNetworkIcon weight="bold" />}
				{!compact && <span>{label}</span>}
			</button>
			{createPortal(
				<dialog
					ref={dialog}
					className="share-dialog"
					aria-labelledby={titleId}
					onClick={(event) => {
						if (event.target !== event.currentTarget) return
						const box = event.currentTarget.getBoundingClientRect()
						if (
							event.clientX < box.left ||
							event.clientX > box.right ||
							event.clientY < box.top ||
							event.clientY > box.bottom
						)
							dialog.current?.close()
					}}
				>
					<header>
						<h2 id={titleId}>{text(target.kind === "invite" ? "inviteTitle" : "panelTitle")}</h2>
						<button
							type="button"
							className="btn is-ghost share-close"
							aria-label={text("close")}
							onClick={() => dialog.current?.close()}
						>
							<XIcon weight="bold" />
						</button>
					</header>
					<p className="share-context">{text(target.kind === "invite" ? "inviteNote" : "publicNote")}</p>
					<p className="share-preview" aria-label={text("preview")}>
						{payload.text}
					</p>
					<p className="share-instruction">{text("composerNote")}</p>
					<div className="share-destinations">
						{destinations.map(({ key, name, Icon }) => (
							<a key={key} href={social[key]} target="_blank" rel="noopener noreferrer">
								<Icon size={25} weight="bold" />
								<span>{name}</span>
							</a>
						))}
					</div>
					{supportsNative && (
						<button type="button" className="btn is-moon share-native" disabled={pending} onClick={deviceShare}>
							<UploadSimpleIcon weight="bold" />
							{text("native")}
						</button>
					)}
					<div className="share-copy">
						<label>
							{text("link")}
							<input ref={link} readOnly value={payload.url} onFocus={(event) => event.currentTarget.select()} />
						</label>
						<button type="button" className="btn" disabled={pending} onClick={copy}>
							{message === "copied" ? <CheckIcon weight="bold" /> : <CopyIcon weight="bold" />}
							{text("copyLink")}
						</button>
					</div>
					<p className="share-message" role="status" aria-live="polite">
						{message && text(message)}
					</p>
				</dialog>,
				document.body,
			)}
		</>
	)
}
