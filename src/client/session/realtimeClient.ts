import { realtimeRequest, serverMsg, type ClientMsg, type RealtimeMsg, type ServerMsg } from "../../shared/protocol"

const CONNECT_TIMEOUT = 10_000
const MAX_RECONNECTS = 8

interface Socket {
	readyState: number
	onopen: ((event: Event) => void) | null
	onmessage: ((event: MessageEvent) => void) | null
	onclose: ((event: CloseEvent) => void) | null
	onerror: ((event: Event) => void) | null
	send(data: string): void
	close(): void
}
interface RealtimeOptions {
	url: string
	initial: ClientMsg
	onMessage: (message: ServerMsg) => void
	onConnection: (connected: boolean) => void
	onFatal: () => void
	createSocket?: (url: string) => Socket
	uuid?: () => string
}

/** One bearer session survives socket rotation; tokens stay out of URLs and browser storage. */
export function connectRealtime(options: RealtimeOptions) {
	const uuid = options.uuid ?? (() => crypto.randomUUID())
	const token = uuid()
	const initial = { token, id: uuid(), msg: options.initial }
	const createSocket = options.createSocket ?? ((url: string) => new WebSocket(url))
	let socket: Socket | null = null
	let stopped = false
	let synchronized = false
	let receivedState = false
	let attempts = 0
	let reconnect: ReturnType<typeof setTimeout> | undefined
	let deadline: ReturnType<typeof setTimeout> | undefined

	const envelope = (msg: RealtimeMsg) => realtimeRequest.parse({ token, id: uuid(), msg })
	const fail = () => {
		stopped = true
		clearTimeout(reconnect)
		clearTimeout(deadline)
		options.onConnection(false)
		options.onFatal()
		socket?.close()
	}
	function open() {
		if (stopped) return
		const current = createSocket(options.url)
		socket = current
		deadline = setTimeout(() => current.close(), CONNECT_TIMEOUT)
		current.onopen = () => {
			if (stopped || current !== socket) return
			current.send(JSON.stringify(receivedState ? envelope({ t: "resume" }) : initial))
		}
		current.onmessage = (event) => {
			if (stopped || current !== socket) return
			let raw: unknown
			try {
				raw = JSON.parse(String(event.data))
			} catch {
				return fail()
			}
			const parsed = serverMsg.safeParse(raw)
			if (!parsed.success) return fail()
			const message = parsed.data
			if (message.t === "state") {
				clearTimeout(deadline)
				attempts = 0
				receivedState = true
				synchronized = true
				options.onConnection(true)
			}
			options.onMessage(message)
			if (
				message.t === "error" &&
				!["ILLEGAL_MOVE", "NOT_YOUR_TURN", "NOT_IN_GAME", "CANNOT_START"].includes(message.code)
			) {
				stopped = true
				clearTimeout(deadline)
				current.close()
			}
		}
		current.onerror = () => current.close()
		current.onclose = () => {
			if (current !== socket) return
			socket = null
			clearTimeout(deadline)
			synchronized = false
			if (stopped) return
			options.onConnection(false)
			if (attempts >= MAX_RECONNECTS) return fail()
			reconnect = setTimeout(open, Math.min(1000 * 2 ** attempts++, 10_000))
		}
	}
	open()
	return {
		send(msg: ClientMsg) {
			if (stopped || !synchronized || socket?.readyState !== 1) return false
			socket.send(JSON.stringify(envelope(msg)))
			return true
		},
		close() {
			stopped = true
			clearTimeout(reconnect)
			clearTimeout(deadline)
			if (socket) {
				if (socket.readyState === 1) socket.send(JSON.stringify(envelope({ t: "leave" })))
				socket.onopen = null
				socket.onmessage = null
				socket.onclose = null
				socket.onerror = null
				socket.close()
			}
		},
	}
}
