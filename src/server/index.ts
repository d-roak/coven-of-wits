import type { Server } from "node:http"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { WebSocketServer } from "ws"
import { createLobby } from "./lobby"
import { createFeedbackRoutes } from "./feedback"

// Thin glue: static files for the built client, one websocket endpoint handing sockets to the lobby.

const port = Number(process.env.PORT ?? 8787)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error(`PORT must be an integer from 1 to 65535, got "${process.env.PORT}"`)
}

const app = new Hono()
app.get("/health", (c) => c.text("ok"))
app.route("/", createFeedbackRoutes())
// In dev Vite serves the client and proxies /ws here, so dist may not exist. That is fine.
app.use("*", serveStatic({ root: "./dist" }))

const server = serve({ fetch: app.fetch, port }, () => console.log(`coven-of-wits listening on :${port}`))

const lobby = createLobby()
// maxPayload: the largest legal message is a move of a few dozen bytes.
const sockets = new WebSocketServer({ server: server as Server, path: "/ws", maxPayload: 2048 })

sockets.on("connection", (socket) => {
	const connection = lobby.connect((msg) => socket.send(JSON.stringify(msg)))
	socket.on("message", (data) => connection.receive(data.toString()))
	socket.on("close", () => connection.close())
	socket.on("error", () => socket.terminate())
})
