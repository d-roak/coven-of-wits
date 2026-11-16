import { useState, type FormEvent } from "react"
import { CHAT_MAX } from "../../shared/protocol"
import { useLang } from "../i18n"
import type { GameSession } from "../session/types"

export function TableChat({ chat }: { chat: NonNullable<GameSession["chat"]> }) {
	const [draft, setDraft] = useState("")
	const { tx } = useLang()
	const send = (event: FormEvent) => {
		event.preventDefault()
		if (!draft.trim()) return
		chat.send(draft.trim())
		setDraft("")
	}
	return (
		<details className="table-chat" open>
			<summary>{tx("Table talk")}</summary>
			<p>{tx("Everyone at this table can read these messages.")}</p>
			<ol aria-live="polite" aria-label={tx("Table messages")}>
				{chat.entries.map((entry, index) => (
					<li key={index}>
						<strong>{entry.name}</strong> {entry.text}
					</li>
				))}
			</ol>
			<form onSubmit={send}>
				<label>
					{tx("Message the table")}
					<input
						value={draft}
						maxLength={CHAT_MAX}
						onChange={(event) => setDraft(event.target.value)}
						autoComplete="off"
					/>
				</label>
				<button className="btn" disabled={!draft.trim()}>
					{tx("Send message")}
				</button>
			</form>
		</details>
	)
}
