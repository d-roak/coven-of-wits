import { pathToFileURL } from "node:url"
import WebSocket from "ws"
import { seededRng } from "../src/shared/game"
import { games } from "../src/shared/games"
import { devilIds } from "../src/shared/games/devils/catalog"
import { serverMsg, type ClientMsg, type StateMsg } from "../src/shared/protocol"

const multiplayer = () => games.filter((game) => devilIds.has(game.id) && game.players.max > 1)
export function selectGames(args: string[]) {
	if (args.length === 0) return multiplayer()
	if (args.length !== 2 || args[0] !== "--game")
		throw new Error("Expected no arguments or --game <multiplayer-game-id>.")
	const game = multiplayer().find((candidate) => candidate.id === args[1])
	if (!game)
		throw new Error(
			`Expected one of: ${multiplayer()
				.map((candidate) => candidate.id)
				.join(", ")}.`,
		)
	return [game]
}

function connection() {
	// Deliberately local-only: verification must never create rooms on a deployed service.
	const socket = new WebSocket("ws://localhost:8787/ws")
	let state: StateMsg | null = null
	let failure: Error | null = null
	const watchers = new Set<() => void>()
	const notify = () => watchers.forEach((watcher) => watcher())
	socket.on("message", (raw) => {
		try {
			const message = serverMsg.parse(JSON.parse(String(raw)))
			if (message.t === "error") failure = new Error(`Server rejected verification: ${message.code}`)
			else state = message
		} catch (error) {
			failure = error instanceof Error ? error : new Error(String(error))
		}
		notify()
	})
	socket.on("error", (error) => {
		failure = error
		notify()
	})
	socket.on("close", () => {
		failure = new Error("The local socket closed before verification finished.")
		notify()
	})
	const opened = new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("Local server did not open a socket within 5 seconds.")), 5000)
		socket.once("open", () => {
			clearTimeout(timer)
			resolve()
		})
		socket.once("error", (error) => {
			clearTimeout(timer)
			reject(error)
		})
	})
	return {
		opened,
		close: () => socket.close(),
		send: (message: ClientMsg) => socket.send(JSON.stringify(message)),
		wait(predicate: (snapshot: StateMsg) => boolean): Promise<StateMsg> {
			return new Promise((resolve, reject) => {
				const finish = (error?: Error) => {
					clearTimeout(timer)
					watchers.delete(check)
					if (error) reject(error)
					else resolve(state!)
				}
				const check = () => {
					if (failure) finish(failure)
					else if (state && predicate(state)) finish()
				}
				const timer = setTimeout(() => finish(new Error("No matching local-server state within 5 seconds.")), 5000)
				watchers.add(check)
				check()
			})
		},
	}
}

export async function verifyOnline(args: string[]) {
	const results: { game: string; players: number; moves: number; winners: number[] }[] = []
	for (const game of selectGames(args)) {
		const players = Math.max(2, game.players.min)
		const clients: ReturnType<typeof connection>[] = []
		try {
			for (let seat = 0; seat < players; seat++) {
				const client = connection()
				clients.push(client)
				await client.opened
				if (seat === 0) client.send({ t: "create", game: game.id, name: "Verifier 1" })
				else {
					const host = await clients[0].wait(() => true)
					client.send({ t: "join", code: host.code, name: `Verifier ${seat + 1}` })
				}
				await client.wait(() => true)
			}
			let snapshot = await clients[0].wait((state) => state.names.length === players)
			if (snapshot.view === null) clients[0].send({ t: "start" })
			snapshot = await clients[0].wait((state) => state.view !== null)
			clients[0].send({ t: "chat", text: "Verification handshake" })
			let snapshots = await Promise.all(clients.map((client) => client.wait((state) => state.chat.length === 1)))
			snapshot = snapshots[0]
			const rng = seededRng(116)
			let moves = 0
			while (!snapshot.outcome) {
				if (moves++ >= 1000) throw new Error(`${game.id} did not finish in 1000 moves.`)
				const seat = snapshot.toAct[0]
				if (seat === undefined || !game.bot) throw new Error(`${game.id} has no playable turn or bot.`)
				const previous = snapshots
				clients[seat].send({ t: "move", move: game.bot(snapshots[seat].view, seat, rng) })
				// Synchronize every seat, including when a hidden move leaves the host's view unchanged.
				snapshots = await Promise.all(clients.map((client, index) => client.wait((state) => state !== previous[index])))
				snapshot = snapshots[0]
			}
			await Promise.all(clients.map((client) => client.wait((state) => state.outcome !== null)))
			results.push({ game: game.id, players, moves, winners: snapshot.outcome.winners })
		} finally {
			clients.forEach((client) => client.close())
		}
	}
	return results
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	if (process.argv.slice(2).length === 1 && process.argv[2] === "--help") {
		process.stdout.write(
			"pnpm verify:online [--game <id>]\nPlays local multiplayer trials at ws://localhost:8787/ws and emits JSON. Start pnpm dev first.\n",
		)
	} else {
		verifyOnline(process.argv.slice(2)).then(
			(results) => process.stdout.write(`${JSON.stringify({ ok: true, results }, null, 2)}\n`),
			(error: unknown) => {
				process.stderr.write(
					`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })}\n`,
				)
				process.exitCode = 1
			},
		)
	}
}
