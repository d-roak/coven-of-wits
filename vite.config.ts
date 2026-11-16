import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react()],
	// The game server runs as its own process in dev; see src/server/index.ts for the port.
	server: {
		proxy: {
			"/ws": { target: "ws://localhost:8787", ws: true },
			"/api": { target: "http://localhost:8787", changeOrigin: false },
		},
	},
})
