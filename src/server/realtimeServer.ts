import { createServer } from "node:http"
import { isIP } from "node:net"
import { getConnInfo } from "@hono/node-server/conninfo"
import { createHash } from "node:crypto"
import { getRequestListener } from "@hono/node-server"
import { Hono } from "hono"
import { WebSocketServer, WebSocket } from "ws"
import { realtimeRequest, type ServerMsg } from "../shared/protocol.js"
import { createFeedbackRoutes } from "./feedback.js"
import { distributedLobby } from "./distributedLobby.js"
import type { Redis } from "./redis.js"

const admitScript = `
local a = redis.call('INCR', KEYS[1])
if a == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return a <= tonumber(ARGV[2]) and 1 or 0
`
export function createRealtimeServer(redis: Redis | null) {
	const app = new Hono()
	app.get("/health", (c) => c.json({ ok: Boolean(redis), rooms: redis ? "shared" : "unconfigured" }))
	app.route(
		"/",
		createFeedbackRoutes({
			...(redis ? { redis } : {}),
			getClientIP: (c) => (process.env.VERCEL ? c.req.header("x-forwarded-for") : getConnInfo(c).remote.address),
		}),
	)
	const server = createServer(getRequestListener(app.fetch))
	const sockets = new WebSocketServer({ noServer: true, maxPayload: 8192 })
	const lobby = redis ? distributedLobby(redis) : null
	server.on("upgrade", (request, socket, head) => {
		const origin = request.headers.origin
		const host = request.headers.host
		const expected = process.env.PUBLIC_ORIGIN ?? `${process.env.VERCEL ? "https" : "http"}://${host}`
		if (request.url !== "/ws" || !origin || origin !== expected || !redis || sockets.clients.size >= 200) {
			socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n")
			return
		}
		const address = process.env.VERCEL ? request.headers["x-forwarded-for"] : request.socket.remoteAddress
		const hash = createHash("sha256")
			.update(typeof address === "string" && isIP(address) ? address : "unavailable")
			.digest("hex")
		void redis
			.eval<number>(admitScript, [`coven:socket-connect:${hash}:${Math.floor(Date.now() / 60000)}`], [60, 30])
			.then((allowed) => {
				if (allowed !== 1 || socket.destroyed) {
					socket.destroy()
					return
				}
				sockets.handleUpgrade(request, socket, head, (ws) => sockets.emit("connection", ws, request))
			})
			.catch(() => socket.destroy())
	})
	sockets.on("connection", (socket, request) => {
		let token: string | null = null
		let last = ""
		let working = false
		let queued = 0
		let chain = Promise.resolve()
		let closed = false
		const ip = process.env.VERCEL ? request.headers["x-forwarded-for"] : request.socket.remoteAddress
		const address = createHash("sha256")
			.update(typeof ip === "string" && isIP(ip) ? ip : "unavailable")
			.digest("hex")
		const send = (msg: ServerMsg) => {
			if (socket.readyState !== WebSocket.OPEN) return
			const payload = JSON.stringify(msg)
			if (msg.t === "state") {
				// serverNow changes on every read; only send actual table changes.
				const stable = JSON.stringify({ ...msg, serverNow: 0 })
				if (stable === last) return
				last = stable
			}
			socket.send(payload)
		}
		const poll = async () => {
			if (working || queued || closed || !token || !lobby) return
			working = true
			try {
				const state = await lobby.poll(token)
				if (state) send(state)
				else {
					send({ t: "error", code: "ROOM_NOT_FOUND", message: "This table has expired. Join a new table." })
					socket.close(1000)
				}
			} catch {
				socket.close(1013, "Storage unavailable")
			} finally {
				working = false
			}
		}
		const timer = setInterval(() => {
			if (!working && !queued) chain = chain.then(poll)
		}, 1500)
		const handshake = setTimeout(() => {
			if (!token) socket.close(1008, "Join a table first")
		}, 10000)
		const receive = async (data: string) => {
			if (closed) return
			working = true
			try {
				let raw: unknown
				try {
					raw = JSON.parse(data)
				} catch {
					socket.close(1008, "Expected JSON")
					return
				}
				const parsed = realtimeRequest.safeParse(raw)
				if (!parsed.success || (token && token !== parsed.data.token)) {
					socket.close(1008, "Invalid session message")
					return
				}
				const msg = parsed.data
				const allowed = await redis!.eval<number>(
					admitScript,
					[`coven:socket-rate:${address}:${Math.floor(Date.now() / 60000)}`],
					[60, 300],
				)
				if (allowed !== 1) {
					socket.close(1008, "Too many actions")
					return
				}
				token = msg.token
				clearTimeout(handshake)
				if (msg.msg.t === "leave") {
					await lobby!.leave(token, msg.id)
					socket.close(1000, "Left table")
					return
				}
				if (msg.msg.t === "resume") {
					const state = await lobby!.poll(token)
					if (state) {
						last = ""
						send(state)
					} else send({ t: "error", code: "ROOM_NOT_FOUND", message: "This table has expired. Join a new table." })
					return
				}
				last = ""
				for (const response of await lobby!.receive(token, JSON.stringify(msg.msg), msg.id)) send(response)
			} catch {
				socket.close(1013, "Storage unavailable")
			} finally {
				working = false
			}
		}
		socket.on("message", (data) => {
			if (queued >= 8) {
				socket.close(1008, "Too many pending actions")
				return
			}
			queued++
			chain = chain
				.then(() => receive(data.toString()))
				.finally(() => {
					queued--
				})
		})
		socket.on("close", () => {
			closed = true
			clearInterval(timer)
			clearTimeout(handshake)
		})
		socket.on("error", () => socket.terminate())
	})
	return { server, sockets }
}
