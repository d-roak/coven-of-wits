import { afterEach, expect, it, vi } from "vitest"
import { realtimeRequest, type ServerMsg } from "../../shared/protocol"
import { connectRealtime } from "./realtimeClient"

class FakeSocket {
	readyState = 0
	onopen: ((event: Event) => void) | null = null
	onmessage: ((event: MessageEvent) => void) | null = null
	onclose: ((event: CloseEvent) => void) | null = null
	onerror: ((event: Event) => void) | null = null
	sent: string[] = []
	open() {
		this.readyState = 1
		this.onopen?.(new Event("open"))
	}
	send(data: string) {
		this.sent.push(data)
	}
	message(data: unknown) {
		this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }))
	}
	close() {
		this.readyState = 3
		this.onclose?.(new Event("close") as CloseEvent)
	}
}
const snapshot: ServerMsg = {
	t: "state",
	code: "ABCD",
	game: "last-candle",
	seat: 0,
	names: ["A", "B"],
	view: {},
	toAct: [0],
	outcome: null,
	rematch: [],
	abandoned: false,
	chat: [],
	clock: null,
	serverNow: 100,
	activity: [],
}
function setup() {
	vi.useFakeTimers()
	const sockets: FakeSocket[] = []
	const onMessage = vi.fn(),
		onConnection = vi.fn(),
		onFatal = vi.fn()
	const client = connectRealtime({
		url: "wss://example.test/ws",
		initial: { t: "create", game: "last-candle", name: "A" },
		onMessage,
		onConnection,
		onFatal,
		createSocket: () => {
			const socket = new FakeSocket()
			sockets.push(socket)
			return socket
		},
	})
	return { client, sockets, onMessage, onConnection, onFatal }
}
afterEach(() => vi.useRealTimers())

it("replays the initial request identity, then resumes the same player without replaying moves", async () => {
	const { client, sockets, onConnection } = setup()
	sockets[0].open()
	const initial = realtimeRequest.parse(JSON.parse(sockets[0].sent[0]))
	sockets[0].close()
	await vi.advanceTimersByTimeAsync(1000)
	sockets[1].open()
	expect(sockets[1].sent[0]).toBe(sockets[0].sent[0])
	sockets[1].message(snapshot)
	expect(client.send({ t: "move", move: 1 })).toBe(true)
	const move = realtimeRequest.parse(JSON.parse(sockets[1].sent[1]))
	sockets[1].close()
	expect(client.send({ t: "move", move: 1 })).toBe(false)
	await vi.advanceTimersByTimeAsync(1000)
	sockets[2].open()
	const resume = realtimeRequest.parse(JSON.parse(sockets[2].sent[0]))
	expect(resume.token).toBe(initial.token)
	expect(resume.msg).toEqual({ t: "resume" })
	expect(resume.id).not.toBe(move.id)
	expect(sockets[2].sent).toHaveLength(1)
	expect(onConnection).toHaveBeenLastCalledWith(false)
	sockets[2].message(snapshot)
	expect(onConnection).toHaveBeenLastCalledWith(true)
	client.close()
	expect(realtimeRequest.parse(JSON.parse(sockets[2].sent.at(-1)!)).msg).toEqual({ t: "leave" })
	await vi.advanceTimersByTimeAsync(120_000)
	expect(sockets).toHaveLength(3)
})

it("bounds reconnect attempts when the server never confirms a session", async () => {
	const { sockets, onFatal } = setup()
	for (let i = 0; i < 9; i++) {
		sockets[i].close()
		await vi.advanceTimersByTimeAsync(10_000)
	}
	expect(sockets).toHaveLength(9)
	expect(onFatal).toHaveBeenCalledOnce()
})

it("rejects malformed server payloads and stops retrying definitive join errors", async () => {
	const malformed = setup()
	malformed.sockets[0].open()
	malformed.sockets[0].message({ t: "state", secret: true })
	expect(malformed.onFatal).toHaveBeenCalledOnce()
	expect(malformed.onMessage).not.toHaveBeenCalled()
	await vi.advanceTimersByTimeAsync(120_000)
	expect(malformed.sockets).toHaveLength(1)
	const rejected = setup()
	rejected.sockets[0].open()
	rejected.sockets[0].message({ t: "error", code: "ROOM_NOT_FOUND", message: "Missing" })
	await vi.advanceTimersByTimeAsync(120_000)
	expect(rejected.sockets).toHaveLength(1)
	expect(rejected.onMessage).toHaveBeenCalledOnce()
})

it("rejects unknown envelope fields and malformed bearer tokens", () => {
	const base = { token: crypto.randomUUID(), id: crypto.randomUUID(), msg: { t: "resume" } }
	expect(realtimeRequest.safeParse({ ...base, seat: 1 }).success).toBe(false)
	expect(realtimeRequest.safeParse({ ...base, token: "ABCD" }).success).toBe(false)
})
