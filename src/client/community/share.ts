import type { Lang } from "../i18n"
import { communityText } from "./communityText"

type ShareGame = { id: string; name: string }
export type ShareTarget =
	| { kind: "home" }
	| { kind: "game"; game: ShareGame }
	| { kind: "invite"; game: ShareGame; code: string }
	| { kind: "result"; game: ShareGame; result: "win" | "draw" | "finished" | "solved" | "unsolved" }
export interface SharePayload {
	title: string
	text: string
	url: string
}
export type ShareDestination = "x" | "bluesky" | "whatsapp" | "facebook"

function shareBase(current: string): URL {
	const source = new URL(current)
	if (source.protocol !== "https:" && source.protocol !== "http:")
		throw new Error("Sharing requires an HTTP or HTTPS site URL.")
	// Rebuild from public location parts: query strings, fragments and credentials may contain private information.
	const url = new URL(source.origin)
	url.pathname = source.pathname
	return url
}
export function publicShareUrl(current: string, gameId?: string): string {
	const url = shareBase(current)
	if (gameId !== undefined) {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameId) || gameId.length > 80) throw new Error("Expected a public game ID.")
		url.searchParams.set("game", gameId)
	}
	return url.href
}
export function inviteShareUrl(current: string, code: string): string {
	if (!/^[A-Z]{4}$/.test(code)) throw new Error("Expected a four-letter room code.")
	const url = shareBase(current)
	url.hash = code
	return url.href
}
export function sharePayload(current: string, target: ShareTarget, lang: Lang): SharePayload {
	const game = target.kind === "home" ? undefined : target.game
	const textKey =
		target.kind === "home"
			? "homeMessage"
			: target.kind === "invite"
				? "inviteMessage"
				: target.kind === "result"
					? target.result
					: "gameMessage"
	return {
		title: game ? `${game.name} · Coven of Wits` : "Coven of Wits",
		text: communityText(lang, textKey, game?.name),
		url: target.kind === "invite" ? inviteShareUrl(current, target.code) : publicShareUrl(current, game?.id),
	}
}
export function socialShareLinks(payload: SharePayload): Record<ShareDestination, string> {
	const make = (base: string, fields: Record<string, string>) => {
		const url = new URL(base)
		for (const [key, value] of Object.entries(fields)) url.searchParams.set(key, value)
		return url.href
	}
	return {
		x: make("https://twitter.com/intent/tweet", { text: payload.text, url: payload.url }),
		bluesky: make("https://bsky.app/intent/compose", { text: `${payload.text}\n${payload.url}` }),
		whatsapp: make("https://wa.me/", { text: `${payload.text}\n${payload.url}` }),
		facebook: make("https://www.facebook.com/sharer/sharer.php", { u: payload.url }),
	}
}
export async function nativeShare(
	payload: SharePayload,
	share: ((data: ShareData) => Promise<void>) | undefined,
): Promise<"shared" | "cancelled" | "unavailable"> {
	if (!share) return "unavailable"
	try {
		await share(payload)
		return "shared"
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") return "cancelled"
		return "unavailable"
	}
}
