import { FEEDBACK_SCREENSHOT_MAX } from "../../shared/community"

export const SCREENSHOT_BYTES_MAX = 1_000_000
export const SCREENSHOT_WIDTH_MAX = 1600
const CAPTURE_TIMEOUT = 12_000
/** Only local app assets and inert raster data images may be copied into the canvas. */
export function screenshotImageAllowed(value: string, origin: string): boolean {
	if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true
	try {
		const url = new URL(value, origin)
		return (
			(url.protocol === "http:" || url.protocol === "https:") &&
			url.origin === new URL(origin).origin &&
			!url.username &&
			!url.password
		)
	} catch {
		return false
	}
}

function unsafeImageCss(value: string, origin: string): boolean {
	return [...value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].some(
		(match) => !screenshotImageAllowed(match[1].trim(), origin),
	)
}

function ignoreScreenshotElement(element: Element, origin: string): boolean {
	if (
		element.hasAttribute("data-feedback-ignore") ||
		["IFRAME", "OBJECT", "EMBED", "VIDEO", "AUDIO"].includes(element.tagName)
	)
		return true
	if (element.tagName === "IMG")
		return !screenshotImageAllowed(
			(element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src,
			origin,
		)
	if (element.tagName === "LINK") return !screenshotImageAllowed((element as HTMLLinkElement).href, origin)
	if (element.tagName === "STYLE") return unsafeImageCss(element.textContent ?? "", origin)
	const href = element.getAttribute("href") ?? element.getAttribute("xlink:href")
	if (
		["image", "use", "feImage"].includes(element.localName) &&
		href &&
		!href.startsWith("#") &&
		!screenshotImageAllowed(href, origin)
	)
		return true
	const style = element.ownerDocument.defaultView?.getComputedStyle(element)
	return style
		? [style.backgroundImage, style.borderImageSource, style.listStyleImage, style.maskImage, style.content].some(
				(value) => unsafeImageCss(value, origin),
			)
		: false
}

export async function screenshotDataUrl(blob: Blob): Promise<string> {
	if (blob.type !== "image/jpeg" || blob.size === 0 || blob.size > SCREENSHOT_BYTES_MAX)
		throw new Error("The screenshot could not fit within 1 MB. Try capturing a smaller browser window.")
	const bytes = new Uint8Array(await blob.arrayBuffer())
	if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
		throw new Error("The screenshot was not a valid JPEG. Try capturing it again.")
	let binary = ""
	for (let start = 0; start < bytes.length; start += 8192)
		binary += String.fromCharCode(...bytes.subarray(start, start + 8192))
	const result = `data:image/jpeg;base64,${btoa(binary)}`
	if (result.length > FEEDBACK_SCREENSHOT_MAX)
		throw new Error("The screenshot is too large to attach. Try capturing a smaller browser window.")
	return result
}

/** Only call in response to the user's feedback/screenshot action. No upload occurs here. */
export async function captureScreenshot(): Promise<string> {
	const origin = window.location.origin
	const frame: { element: Element | null } = { element: null }
	let expired = false
	let timer: ReturnType<typeof setTimeout> | undefined
	const capture = async () => {
		const { default: html2canvas } = await import("html2canvas-pro")
		if (expired) throw new Error("Screenshot capture timed out. Try capturing it again.")
		const canvas = await html2canvas(document.body, {
			logging: false,
			allowTaint: false,
			useCORS: false,
			foreignObjectRendering: false,
			imageTimeout: 3000,
			scale: Math.min(1, SCREENSHOT_WIDTH_MAX / window.innerWidth),
			x: window.scrollX,
			y: window.scrollY,
			width: window.innerWidth,
			height: window.innerHeight,
			ignoreElements: (element) => ignoreScreenshotElement(element, origin),
			onclone: (doc) => {
				frame.element = doc.defaultView?.frameElement ?? null
				if (expired) {
					frame.element?.remove()
					throw new Error("Screenshot capture timed out. Try capturing it again.")
				}
			},
		})
		for (const quality of [0.75, 0.55, 0.35]) {
			if (expired) throw new Error("Screenshot capture timed out. Try capturing it again.")
			const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
			if (blob && blob.size <= SCREENSHOT_BYTES_MAX) return screenshotDataUrl(blob)
		}
		throw new Error("The screenshot could not fit within 1 MB. Try capturing a smaller browser window.")
	}
	try {
		return await Promise.race([
			capture(),
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => {
					expired = true
					frame.element?.remove()
					reject(new Error("Screenshot capture timed out. Try capturing it again."))
				}, CAPTURE_TIMEOUT)
			}),
		])
	} finally {
		clearTimeout(timer)
		frame.element?.remove()
	}
}
