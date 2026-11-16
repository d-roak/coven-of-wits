import { useEffect, useState } from "react"
import type { AnyGame } from "../shared/game"
import { findGame } from "../shared/games"
import { devilIds } from "../shared/games/devils/catalog"
import { CommunityProvider } from "./community/Community"
import { FeedbackReporter } from "./community/FeedbackReporter"
import { NAME_MAX, roomCode } from "../shared/protocol"
import { Scene } from "./art/Scene"
import { LanguageSwitch } from "./i18n"
import { Home, type ShelfId } from "./screens/Home"
import { Kit } from "./screens/Kit"
import { OnlinePlay } from "./screens/OnlinePlay"
import { Table } from "./screens/Table"
import { useLocalGame } from "./session/useLocalGame"
import type { Intent } from "./session/useOnlineGame"

type Screen =
	{ at: "home" } | { at: "kit" } | { at: "local"; game: AnyGame; players: number } | { at: "online"; intent: Intent }

const NAME_KEY = "coven.name"
const FALLBACK_NAMES = ["Fizzle", "Mothwick", "Bramble", "Nettle", "Soot", "Pip"]

function storedName(): string | null {
	try {
		return localStorage.getItem(NAME_KEY)
	} catch {
		// Storage can be blocked (private mode, embedded frames). The name just will not persist.
		return null
	}
}

/** An invite link is the site URL with the room code as its hash: /#ABCD */
function invitedCode(): string {
	const parsed = roomCode.safeParse(location.hash.slice(1).toUpperCase())
	return parsed.success ? parsed.data : ""
}

function LocalPlay({ game, players, name, onExit }: { game: AnyGame; players: number; name: string; onExit(): void }) {
	return <Table session={useLocalGame(game, name, players)} onExit={onExit} />
}

export function App() {
	const [screen, setScreen] = useState<Screen>(() =>
		// The component sheet has no link in the app; it is a reference page for whoever draws the pieces.
		new URLSearchParams(location.search).has("kit") ? { at: "kit" } : { at: "home" },
	)
	const [name, setName] = useState(
		() => storedName() ?? FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)]!,
	)
	const [invite] = useState(invitedCode)
	// Lives here, not in Home, so leaving a game lands back on the shelf it was started from.
	const [linkedGame] = useState(() => findGame(new URLSearchParams(location.search).get("game") ?? ""))
	const [shelf, setShelf] = useState<ShelfId | null>(() =>
		linkedGame
			? devilIds.has(linkedGame.id)
				? "devils"
				: linkedGame.players.max === 1
					? "solo"
					: linkedGame.players.max === 2
						? "duels"
						: "circles"
			: null,
	)
	useEffect(() => {
		if (!linkedGame || screen.at !== "home") return
		const frame = requestAnimationFrame(() =>
			document.getElementById(`game-${linkedGame.id}`)?.scrollIntoView({ block: "center" }),
		)
		return () => cancelAnimationFrame(frame)
	}, [linkedGame, screen, shelf])
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" })
	}, [screen, shelf])

	// The server rejects an empty or overlong name, so settle it here before any screen uses it.
	const playerName = name.trim().slice(0, NAME_MAX) || "Nameless"
	const rename = (next: string) => {
		setName(next)
		try {
			localStorage.setItem(NAME_KEY, next)
		} catch {
			// Same as storedName: nothing to do if storage is blocked.
		}
	}
	const goHome = () => {
		// Drop a used invite code so leaving a room does not offer to rejoin it.
		history.replaceState(null, "", location.pathname)
		setScreen({ at: "home" })
	}

	return (
		<CommunityProvider>
			<Scene />
			<div className="app">
				<LanguageSwitch />
				{screen.at === "kit" && <Kit />}
				{screen.at === "home" && (
					<Home
						name={name}
						onName={rename}
						invite={invite}
						shelf={shelf}
						onShelf={setShelf}
						onLocal={(game, players) => setScreen({ at: "local", game, players })}
						onOnline={(ask) => setScreen({ at: "online", intent: { ...ask, name: playerName } })}
					/>
				)}
				{screen.at === "local" && (
					<LocalPlay
						key={`${screen.game.id}-${screen.players}`}
						game={screen.game}
						players={screen.players}
						name={playerName}
						onExit={goHome}
					/>
				)}
				{screen.at === "online" && <OnlinePlay intent={screen.intent} onExit={goHome} />}
			</div>
			<FeedbackReporter
				context={
					screen.at === "local"
						? { screen: "local", game: screen.game.id, mode: screen.game.players.max === 1 ? "solo" : "bots" }
						: screen.at === "online"
							? {
									screen: "online",
									mode: "online",
									...(screen.intent.kind !== "join" ? { game: screen.intent.game } : {}),
								}
							: { screen: screen.at }
				}
			/>
		</CommunityProvider>
	)
}
