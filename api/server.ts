import { createRedis } from "../src/server/redis.js"
import { createRealtimeServer } from "../src/server/realtimeServer.js"

// Vercel owns listening and upgrades on the exported Node HTTP server.
export default createRealtimeServer(createRedis()).server
