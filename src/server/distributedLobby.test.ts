import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { distributedLobby } from "./distributedLobby"
import { hasTestRedis, startTestRedis } from "./redisTest"
import type { ServerMsg, StateMsg } from "../shared/protocol"
import type { Redis } from "./redis"

const state = (messages: ServerMsg[]): StateMsg => {
	const result = messages.findLast((msg): msg is StateMsg => msg.t === "state")
	if (!result) throw new Error("Expected state")
	return result
}
const say = (t: unknown) => JSON.stringify(t)
describe.skipIf(!hasTestRedis)("distributed rooms with real Redis", () => {
	let fixture: Awaited<ReturnType<typeof startTestRedis>>
	beforeEach(async () => {
		fixture = await startTestRedis()
	})
	afterEach(async () => {
		await fixture.close()
	})
	it("joins across instances, resumes private views and does not repeat a lost-response move", async () => {
		const one = distributedLobby(fixture.redis),
			two = distributedLobby(fixture.redis)
		const host = randomUUID(),
			guest = randomUUID(),
			stranger = randomUUID()
		const created = state(await one.receive(host, say({ t: "create", game: "mind-auction", name: "Ash" })))
		await two.receive(guest, say({ t: "join", code: created.code, name: "Bo" }))
		await one.receive(host, say({ t: "start" }))
		const requestId = randomUUID(),
			move = say({ t: "move", move: { card: 8 } })
		const uncertain: Redis = {
			command: fixture.redis.command,
			eval: async (script, keys, args) => {
				await fixture.redis.eval(script, keys, args)
				throw new Error("Lost response after commit")
			},
		}
		await expect(distributedLobby(uncertain).receive(host, move, requestId)).rejects.toThrow()
		const recovered = state(await two.receive(host, move, requestId))
		expect(recovered.activity).toHaveLength(1)
		expect(recovered.view).toMatchObject({ myBid: 8 })
		expect((await two.poll(guest))?.view).toMatchObject({ myBid: null, sealed: [true, false] })
		expect(await two.poll(stranger)).toBeNull()
		expect((await one.receive(host, say({ t: "move", move: { card: 7 } }), requestId))[0]).toMatchObject({
			t: "error",
			code: "BAD_MESSAGE",
		})
		const resumed = state(await distributedLobby(fixture.redis).receive(host, say({ t: "resume" })))
		expect(resumed.view).toEqual(recovered.view)
	})
	it("atomically matches simultaneous requests and deduplicates simultaneous moves", async () => {
		const host = randomUUID(),
			guest = randomUUID()
		const one = distributedLobby(fixture.redis),
			two = distributedLobby(fixture.redis)
		await Promise.all([
			one.receive(host, say({ t: "quick", game: "rune-drop", name: "Ash" })),
			two.receive(guest, say({ t: "quick", game: "rune-drop", name: "Bo" })),
		])
		const a = (await one.poll(host))!,
			b = (await two.poll(guest))!
		expect(a.code).toBe(b.code)
		expect(a.names).toHaveLength(2)
		const actor = a.seat === 0 ? host : guest,
			id = randomUUID(),
			raw = say({ t: "move", move: { col: 0 } })
		await Promise.all([one.receive(actor, raw, id), two.receive(actor, raw, id)])
		expect((await one.poll(actor))?.activity).toHaveLength(1)
	})
	it("preserves abandonment for opponents on explicit leave and expires idle sessions", async () => {
		let now = 1000
		const one = distributedLobby(fixture.redis, () => now),
			host = randomUUID(),
			guest = randomUUID()
		const created = state(await one.receive(host, say({ t: "create", game: "rune-drop", name: "Ash" })))
		await one.receive(guest, say({ t: "join", code: created.code, name: "Bo" }))
		const leaveId = randomUUID()
		await one.leave(guest, leaveId)
		expect((await one.poll(host))?.abandoned).toBe(true)
		expect(await one.poll(guest)).toBeNull()
		expect((await one.receive(guest, say({ t: "create", game: "rune-drop", name: "Bo" })))[0]).toMatchObject({
			t: "error",
			code: "ROOM_NOT_FOUND",
		})
		await one.leave(guest, leaveId)
		expect((await one.poll(host))?.abandoned).toBe(true)
		now += 2 * 60 * 60 * 1000
		expect(await one.poll(host)).toBeNull()
		expect((await one.receive(host, say({ t: "resume" })))[0]).toMatchObject({ t: "error", code: "ROOM_NOT_FOUND" })
	})
	it("rejects malformed sessions and invalid wire input without creating a room", async () => {
		const one = distributedLobby(fixture.redis)
		expect((await one.receive("short", "{}"))[0]).toMatchObject({ t: "error", code: "BAD_MESSAGE" })
		expect((await one.receive(randomUUID(), "notjson"))[0]).toMatchObject({ t: "error", code: "BAD_MESSAGE" })
		expect(
			(await one.receive(randomUUID(), say({ t: "create", game: "rune-drop", name: "Ash", sneaky: 1 })))[0],
		).toMatchObject({ t: "error", code: "BAD_MESSAGE" })
		await expect(one.poll("short")).rejects.toThrow()
	})
})
