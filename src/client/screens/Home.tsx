import {
	ArrowDownIcon,
	ArrowLeftIcon,
	LightningIcon,
	LockKeyIcon,
	MoonStarsIcon,
	PlayIcon,
	RobotIcon,
	SparkleIcon,
} from "@phosphor-icons/react"
import { type CSSProperties, type FormEvent, useState } from "react"
import type { ReactNode } from "react"
import { useLang, type TextKey } from "../i18n"
import type { AnyGame } from "../../shared/game"
import { games } from "../../shared/games"
import { devilCatalog, devilIds } from "../../shared/games/devils/catalog"
import { NAME_MAX, roomCode } from "../../shared/protocol"
import { Coven } from "../art/Coven"
import { Die } from "../art/Die"
import { Imp } from "../art/Imp"
import { Poff } from "../art/Poff"
import { Rune } from "../art/Rune"
import { Sigil } from "./Sigil"
import { ShareButton } from "../community/ShareButton"
import { GitHubButton } from "../community/Community"

/** Home fills in everything about an online intent except the name, which App owns. */
type Ask = { kind: "quick" | "create"; game: string } | { kind: "join"; code: string }

interface HomeProps {
	name: string
	onName(name: string): void
	/** Room code from an invite link, or empty. */
	invite: string
	/** The open shelf, or null for the front page with one card per shelf. */
	shelf: ShelfId | null
	onShelf(shelf: ShelfId | null): void
	onLocal(game: AnyGame, players: number): void
	onOnline(ask: Ask): void
}

const devilsGames = games
	.filter((g) => devilIds.has(g.id))
	.sort(
		(a, b) =>
			devilCatalog.find((entry) => entry.id === a.id)!.season - devilCatalog.find((entry) => entry.id === b.id)!.season,
	)
// Every game sits on the shelf for its table size. The show's trials are also gathered on their own shelf.
const duels = games.filter((g) => g.players.max === 2)
const circles = games.filter((g) => g.players.max > 2)
const puzzles = games.filter((g) => g.players.max === 1)

const SHELVES = {
	devils: {
		title: "shelf.devils",
		note: "shelf.devils.note",
		games: devilsGames,
		art: (
			<>
				<SparkleIcon size={30} weight="fill" />
				<Imp size={104} />
				<SparkleIcon size={30} weight="fill" />
			</>
		),
	},
	circles: {
		title: "shelf.circles",
		note: "shelf.circles.note",
		games: circles,
		art: (
			<>
				<Poff look="ember" size={64} />
				<span className="card is-back seat1" />
				<Die face={5} size={40} />
				<Poff look="moss" size={64} flip />
			</>
		),
	},
	duels: {
		title: "shelf.duels",
		note: "shelf.duels.note",
		games: duels,
		art: (
			<>
				<Poff look="ember" size={70} mood="think" />
				<i className="orb seat0" />
				<i className="orb seat1" />
				<Poff look="moon" size={70} mood="think" flip />
			</>
		),
	},
	solo: {
		title: "shelf.solo",
		note: "shelf.solo.note",
		games: puzzles,
		art: (
			<>
				<Rune kind={0} />
				<Poff look="grape" size={76} mood="happy" />
				<Rune kind={3} />
			</>
		),
	},
} as const satisfies Record<string, { title: TextKey; note: TextKey; games: readonly AnyGame[]; art: ReactNode }>
export type ShelfId = keyof typeof SHELVES
const SHELF_IDS = Object.keys(SHELVES) as ShelfId[]

export function Home({ name, onName, invite, shelf, onShelf, onLocal, onOnline }: HomeProps) {
	const [code, setCode] = useState(invite)
	const codeOk = roomCode.safeParse(code).success
	const join = (e: FormEvent) => {
		e.preventDefault()
		if (codeOk) onOnline({ kind: "join", code })
	}
	const open = shelf && SHELVES[shelf]
	const { t, tx } = useLang()

	return (
		<main className="home">
			<nav className="masthead" aria-label={tx("The grove")}>
				<a
					className="wordmark"
					href="#"
					onClick={(e) => {
						e.preventDefault()
						onShelf(null)
					}}
				>
					<MoonStarsIcon size={25} weight="fill" /> Coven of Wits
				</a>
				<div className="masthead-actions">
					<GitHubButton />
					<ShareButton target={{ kind: "home" }} />
				</div>
			</nav>
			{open ? (
				// Keyed so each shelf replays the entrance instead of swapping cards in place.
				<section key={shelf} className="shelf is-open">
					<button className="btn is-ghost" onClick={() => onShelf(null)}>
						<ArrowLeftIcon weight="bold" /> {t("home.allShelves")}
					</button>
					<h2>{t(open.title)}</h2>
					<p className="shelf-note">{t(open.note, { n: open.games.length })}</p>
					{shelf === "devils" ? (
						<DevilsShelf onLocal={onLocal} onOnline={onOnline} />
					) : (
						<div className="games">
							{open.games.map((game, i) => (
								<GameCard key={game.id} game={game} index={i} onLocal={onLocal} onOnline={onOnline} />
							))}
						</div>
					)}
				</section>
			) : (
				<>
					<header className="hero">
						<div>
							<p className="hero-kicker">{t("home.kicker")}</p>
							<h1 className="title">
								Coven of <em>Wits</em>
							</h1>
							<p className="tagline">{t("home.tagline")}</p>
							<a className="btn hero-link" href="#shelves">
								{t("home.choose")} <ArrowDownIcon weight="bold" />
							</a>
						</div>
						<div className="hero-cast">
							<Coven />
						</div>
					</header>

					<div className="ticket">
						<div className="ticket-intro">
							<MoonStarsIcon size={28} />
							<span>
								{t("home.seat")}
								<small>{t("home.seatNote")}</small>
							</span>
						</div>
						<label className="field">
							{t("home.name")}
							<input
								value={name}
								maxLength={NAME_MAX}
								autoComplete="nickname"
								onChange={(e) => onName(e.target.value)}
							/>
						</label>
						<form className="join" onSubmit={join}>
							<label className="field">
								{t("home.code")}
								<input
									className="code-input"
									value={code}
									maxLength={4}
									placeholder="ABCD"
									autoComplete="off"
									autoCapitalize="characters"
									autoFocus={invite !== ""}
									onChange={(e) => setCode(e.target.value.toUpperCase())}
								/>
							</label>
							<button className="btn is-moon" disabled={!codeOk} title={codeOk ? undefined : t("home.codeHint")}>
								{t("home.join")}
							</button>
						</form>
					</div>

					<div className="doors" id="shelves">
						{SHELF_IDS.map((id, i) => (
							<button
								key={id}
								className={`door seat${i}`}
								style={{ "--i": i } as CSSProperties}
								onClick={() => onShelf(id)}
							>
								<span className="door-art">{SHELVES[id].art}</span>
								<span className="door-title">{t(SHELVES[id].title)}</span>
								<span className="door-note">{t(SHELVES[id].note, { n: SHELVES[id].games.length })}</span>
								<span className="door-count">
									{SHELVES[id].games.length === 1 ? t("home.game") : t("home.games", { n: SHELVES[id].games.length })}
								</span>
							</button>
						))}
					</div>
				</>
			)}
			<footer className="grove-footer">
				<MoonStarsIcon size={22} /> {t("home.footer")}
			</footer>
		</main>
	)
}

function DevilsShelf({ onLocal, onOnline }: Pick<HomeProps, "onLocal" | "onOnline">) {
	const [season, setSeason] = useState(0)
	const [search, setSearch] = useState("")
	const { t, game: local } = useLang()
	const filteredGames = devilsGames.filter((game) => {
		const entry = devilCatalog.find((item) => item.id === game.id)!
		return (
			(season === 0 || entry.season === season) &&
			`${game.name} ${game.blurb} ${local(game).name} ${local(game).blurb} ${entry.kind}`
				.toLowerCase()
				.includes(search.trim().toLowerCase())
		)
	})
	return (
		<section className="devils-collection">
			<div className="catalog-controls">
				<div className="season-tabs" role="group" aria-label={t("catalog.filter")}>
					{[0, 1, 2, 3].map((value) => (
						<button
							key={value}
							className={`btn ${season === value ? "is-moon" : "is-ghost"}`}
							aria-pressed={season === value}
							onClick={() => setSeason(value)}
						>
							{value === 0 ? t("catalog.all") : t("catalog.season", { n: value })}{" "}
							<span>
								{value === 0 ? devilCatalog.length : devilCatalog.filter((entry) => entry.season === value).length}
							</span>
						</button>
					))}
				</div>
				<label className="catalog-search">
					{t("catalog.find")}
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t("catalog.search")}
					/>
				</label>
			</div>
			<p className="catalog-count" role="status">
				{t("catalog.showing", { n: filteredGames.length, total: devilsGames.length })}
			</p>
			<div className="games catalog-games">
				{filteredGames.map((game, i) => (
					<GameCard key={game.id} game={game} index={i} onLocal={onLocal} onOnline={onOnline} />
				))}
			</div>
			{filteredGames.length === 0 && (
				<div className="catalog-empty">
					<p>{t("catalog.none")}</p>
					<button
						className="btn is-ghost"
						onClick={() => {
							setSearch("")
							setSeason(0)
						}}
					>
						{t("catalog.reset")}
					</button>
				</div>
			)}
			<p className="adaptation-note">{t("catalog.note")}</p>
		</section>
	)
}

function GameCard({
	game,
	index,
	onLocal,
	onOnline,
}: { game: AnyGame; index: number } & Pick<HomeProps, "onLocal" | "onOnline">) {
	const { min, max } = game.players
	// Three is the smallest table where a hidden-information game stops being a duel.
	const [players, setPlayers] = useState(Math.min(max, Math.max(min, 3)))
	const solo = max === 1
	const edition = devilCatalog.find((entry) => entry.id === game.id)
	const { t, tx, game: local } = useLang()

	return (
		<article id={`game-${game.id}`} className="game-card" style={{ "--i": index } as CSSProperties}>
			<div className="game-head">
				<Sigil gameId={game.id} />
				<div>
					<h3>{local(game).name}</h3>
					<span className="game-size">
						{solo ? t("card.solo") : min === max ? t("card.mages", { n: min }) : t("card.magesRange", { min, max })}
						{edition?.adaptation.toLowerCase().includes("house") && ` · ${t("card.house")}`}
					</span>
				</div>
				<ShareButton compact target={{ kind: "game", game: { id: game.id, name: local(game).name } }} />
			</div>
			<p>{local(game).blurb}</p>
			{edition && (
				<details className="edition-notes">
					<summary>{t("card.edition", { n: edition.season, kind: t(`kind.${edition.kind}`) })}</summary>
					<p>{tx(edition.adaptation)}</p>
					<a href={edition.sources[0]} target="_blank" rel="noreferrer">
						{t("card.reference")}
					</a>
				</details>
			)}

			{solo ? (
				<div className="btn-row">
					<button className="btn" onClick={() => onLocal(game, 1)}>
						<PlayIcon weight="fill" /> {t("card.start")}
					</button>
				</div>
			) : (
				<>
					<div className="btn-row">
						<button className="btn" onClick={() => onLocal(game, min === max ? min : players)}>
							<RobotIcon weight="fill" /> {t("card.bots")}
						</button>
						{min < max && (
							<fieldset className="seats-pick">
								<legend>{t("card.tableOf")}</legend>
								{Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
									<label key={n} className={n === players ? "is-on" : ""}>
										<input
											type="radio"
											name={`seats-${game.id}`}
											checked={n === players}
											onChange={() => setPlayers(n)}
										/>
										{n}
									</label>
								))}
							</fieldset>
						)}
					</div>
					<div className="btn-row">
						<button className="btn is-ghost" onClick={() => onOnline({ kind: "quick", game: game.id })}>
							<LightningIcon weight="fill" /> {t("card.quick")}
						</button>
						<button className="btn is-ghost" onClick={() => onOnline({ kind: "create", game: game.id })}>
							<LockKeyIcon weight="fill" /> {t("card.private")}
						</button>
					</div>
				</>
			)}
		</article>
	)
}
