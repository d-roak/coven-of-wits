import { execFile, spawn, spawnSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import type { Redis } from "./redis"

const execute = promisify(execFile)
export const hasTestRedis =
	spawnSync("redis-server", ["--version"], { stdio: "ignore" }).status === 0 &&
	spawnSync("redis-cli", ["--version"], { stdio: "ignore" }).status === 0

/** Real isolated Redis over a private Unix socket; no production endpoint or credentials are used. */
export async function startTestRedis() {
	if (!hasTestRedis) throw new Error("Install redis-server and redis-cli to run Redis integration tests")
	const directory = await mkdtemp(join(tmpdir(), "coven-redis-"))
	const socket = join(directory, "redis.sock")
	const process = spawn(
		"redis-server",
		["--port", "0", "--unixsocket", socket, "--unixsocketperm", "700", "--save", "", "--appendonly", "no"],
		{ stdio: "ignore" },
	)
	const close = async () => {
		if (process.exitCode === null) {
			const stopped = new Promise<void>((resolve) => process.once("exit", () => resolve()))
			process.kill("SIGTERM")
			await stopped
		}
		await rm(directory, { recursive: true, force: true })
	}
	async function command<T>(args: (string | number)[]): Promise<T> {
		const { stdout } = await execute("redis-cli", ["-s", socket, "--json", ...args.map(String)], {
			timeout: 5000,
			maxBuffer: 5_000_000,
		})
		return JSON.parse(stdout) as T
	}
	const redis: Redis = {
		command,
		eval: <T>(script: string, keys: string[], args: (string | number)[]) =>
			command<T>(["EVAL", script, keys.length, ...keys, ...args]),
	}
	const deadline = Date.now() + 3000
	for (;;) {
		try {
			if ((await command<string>(["PING"])) === "PONG") break
		} catch (error) {
			if (Date.now() >= deadline) {
				await close()
				throw error
			}
		}
		await new Promise((resolve) => setTimeout(resolve, 10))
	}
	return { redis, close }
}
