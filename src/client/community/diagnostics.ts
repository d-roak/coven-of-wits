import { feedbackContext, feedbackDebug, type FeedbackContext, type FeedbackDebug } from "../../shared/community"

type DiagnosticError = FeedbackDebug["errors"][number]
const errors: DiagnosticError[] = []
const installations = new WeakMap<EventTarget, { count: number; remove: () => void }>()

/** URL credentials, queries and fragments never enter a diagnostic payload. */
export function pathOnly(value: string): string {
	try {
		const url = new URL(value, "https://feedback.invalid")
		return url.protocol === "http:" || url.protocol === "https:" ? url.pathname.slice(0, 200) : "/"
	} catch {
		return "/"
	}
}

function sourcePath(value: string): string {
	const path = pathOnly(value)
	return /^\/(?:assets|src|node_modules)\/[^\s]*\.(?:js|mjs|ts|tsx)$/.test(path) ? path : ""
}

function errorName(value: unknown): string {
	// Error.name and rejection text can contain player input; identify built-in classes instead.
	if (value instanceof TypeError) return "TypeError"
	if (value instanceof RangeError) return "RangeError"
	if (value instanceof ReferenceError) return "ReferenceError"
	if (value instanceof SyntaxError) return "SyntaxError"
	if (value instanceof URIError) return "URIError"
	if (value instanceof EvalError) return "EvalError"
	if (value instanceof AggregateError) return "AggregateError"
	if (value instanceof Error) return "Error"
	if (value instanceof DOMException) return "DOMException"
	return "UnknownError"
}

/** Install once at application startup. Repeated mounts share listeners and clean up independently. */
export function installDiagnostics(target: EventTarget = window): () => void {
	let installation = installations.get(target)
	if (!installation) {
		const record = (error: DiagnosticError) => {
			errors.push(error)
			if (errors.length > 10) errors.splice(0, errors.length - 10)
		}
		const onError = (event: Event) => {
			const error = event as ErrorEvent
			record({
				kind: "error",
				name: errorName(error.error),
				source: typeof error.filename === "string" ? sourcePath(error.filename) : "",
				line: Number.isSafeInteger(error.lineno) && error.lineno >= 0 ? error.lineno : 0,
			})
		}
		const onRejection = (event: Event) =>
			record({ kind: "rejection", name: errorName((event as PromiseRejectionEvent).reason), source: "", line: 0 })
		target.addEventListener("error", onError)
		target.addEventListener("unhandledrejection", onRejection)
		installation = {
			count: 0,
			remove: () => {
				target.removeEventListener("error", onError)
				target.removeEventListener("unhandledrejection", onRejection)
			},
		}
		installations.set(target, installation)
	}
	installation.count++
	let removed = false
	return () => {
		if (removed) return
		removed = true
		installation.count--
		if (installation.count === 0) {
			installation.remove()
			installations.delete(target)
		}
	}
}

/** Call when the feedback form opens; the returned snapshot does not change with later events. */
export function collectDebug(context: FeedbackContext, language: string): FeedbackDebug {
	return feedbackDebug.parse({
		context: feedbackContext.parse(context),
		path: pathOnly(window.location.href),
		version: String(import.meta.env.VITE_APP_VERSION ?? "development").slice(0, 80),
		language: language.slice(0, 30),
		viewport: `${window.innerWidth}×${window.innerHeight}`.slice(0, 30),
		pixelRatio: Math.max(0, Math.min(10, window.devicePixelRatio)),
		userAgent: navigator.userAgent.slice(0, 400),
		online: navigator.onLine,
		elapsedSeconds: Math.max(0, Math.min(10_000_000, Math.floor(performance.now() / 1000))),
		errors: errors.map((error) => ({ ...error })),
	})
}
