import { randomUUID } from "node:crypto"
import type { AddressInfo } from "node:net"
import { once } from "node:events"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { WebSocket } from "ws"
import { createRealtimeServer } from "./realtimeServer"
import { hasTestRedis, startTestRedis } from "./redisTest"
import { serverMsg, type ServerMsg, type StateMsg } from "../shared/protocol"

const state = (message: ServerMsg): message is StateMsg => message.t === "state"
describe.skipIf(!hasTestRedis)("real WebSockets across two server instances", () => {
	let fixture: Awaited<ReturnType<typeof startTestRedis>>
	const servers: ReturnType<typeof createRealtimeServer>[] = []
	const clients: WebSocket[] = []
	beforeEach(async () => {
		fixture = await startTestRedis()
	})
	afterEach(async () => {
		for (const client of clients.splice(0)) client.terminate()
		for (const entry of servers.splice(0)) {
			for (const socket of entry.sockets.clients) socket.terminate()
			entry.sockets.close()
			await new Promise<void>((resolve) => entry.server.close(() => resolve()))
		}
		await fixture.close()
	})
	async function instance() {
		const entry = createRealtimeServer(fixture.redis)
		servers.push(entry)
		entry.server.listen(0, "127.0.0.1")
		await once(entry.server, "listening")
		return `http://127.0.0.1:${(entry.server.address() as AddressInfo).port}`
	}
	async function connect(origin: string, token: string) {
		const socket = new WebSocket(origin.replace("http", "ws") + "/ws", { origin })
		clients.push(socket)
		const messages: ServerMsg[] = []
		socket.on("message", (data) => messages.push(serverMsg.parse(JSON.parse(data.toString()))))
		await once(socket, "open")
		return {
			socket,
			messages,
			send(msg: unknown) {
				socket.send(JSON.stringify({ token, id: randomUUID(), msg }))
			},
			async snapshot(predicate: (value: StateMsg) => boolean = () => true) {
				await expect.poll(() => messages.filter(state).findLast(predicate), { timeout: 5000 }).toBeTruthy()
				return messages.filter(state).findLast(predicate)!
			},
		}
	}
	it("shares rooms, retains seats across socket loss, then honors explicit leave", async () => {
		const a = await instance(),
			b = await instance(),
			token = randomUUID()
		const host = await connect(a, token)
		host.send({ t: "create", game: "rune-drop", name: "Ash" })
		const created = await host.snapshot()
		const guest = await connect(b, randomUUID())
		guest.send({ t: "join", code: created.code, name: "Bo" })
		await host.snapshot((value) => value.view !== null)
		await guest.snapshot((value) => value.view !== null)
		host.socket.terminate()
		const resumed = await connect(b, token)
		resumed.send({ t: "resume" })
		const snapshot = await resumed.snapshot()
		expect(snapshot.seat).toBe(0)
		expect(snapshot.abandoned).toBe(false)
		expect(snapshot.names).toEqual(["Ash", "Bo"])
		resumed.send({ t: "leave" })
		expect((await guest.snapshot((value) => value.abandoned)).abandoned).toBe(true)
	})
	it("rejects cross-origin upgrades and invalid session messages", async () => {
		const origin = await instance()
		const rejected = new WebSocket(origin.replace("http", "ws") + "/ws", { origin: "https://elsewhere.test" })
		clients.push(rejected)
		const error = await new Promise<Error>((resolve) => rejected.once("error", resolve))
		expect(error.message).toContain("403")
		const client = await connect(origin, randomUUID())
		client.socket.send(JSON.stringify({ token: "not-a-session", msg: { t: "resume" } }))
		const [code] = await once(client.socket, "close")
		expect(code).toBe(1008)
	})
})
