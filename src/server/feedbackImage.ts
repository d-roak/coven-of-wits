/** Validate a bounded baseline/progressive JPEG envelope, including dimensions and the entropy terminator. */
export function jpegBytes(dataUrl: string): Buffer {
	const base64 = dataUrl.slice("data:image/jpeg;base64,".length)
	const bytes = Buffer.from(base64, "base64")
	if (bytes.toString("base64") !== base64 || bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
		throw new Error("Invalid JPEG envelope")
	let offset = 2
	let frame = false
	let scan = false
	while (offset < bytes.length) {
		if (bytes[offset++] !== 0xff) throw new Error("Invalid JPEG marker")
		while (bytes[offset] === 0xff) offset++
		const marker = bytes[offset++]
		if (marker === 0xd9) {
			if (!frame || !scan || offset !== bytes.length) throw new Error("Invalid JPEG end")
			return bytes
		}
		if (![0xc0, 0xc2, 0xc4, 0xdb, 0xdd, 0xda, 0xfe].includes(marker) && !(marker >= 0xe0 && marker <= 0xef))
			throw new Error("Unsupported JPEG marker")
		if (offset + 2 > bytes.length) throw new Error("Truncated JPEG segment")
		const length = bytes.readUInt16BE(offset)
		if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG segment")
		if (marker === 0xc0 || marker === 0xc2) {
			if (length < 11 || bytes[offset + 2] !== 8) throw new Error("Invalid JPEG frame")
			const height = bytes.readUInt16BE(offset + 3),
				width = bytes.readUInt16BE(offset + 5),
				components = bytes[offset + 7]
			if (
				!width ||
				!height ||
				width > 4096 ||
				height > 4096 ||
				![1, 3].includes(components) ||
				length !== 8 + components * 3
			)
				throw new Error("JPEG dimensions or components are unsupported")
			frame = true
		}
		offset += length
		if (marker === 0xda) {
			if (!frame || length < 6) throw new Error("JPEG scan has no frame")
			scan = true
			while (offset < bytes.length) {
				if (bytes[offset] !== 0xff) {
					offset++
					continue
				}
				const next = bytes[offset + 1]
				if (next === 0 || (next >= 0xd0 && next <= 0xd7)) {
					offset += 2
					continue
				}
				break
			}
		}
	}
	throw new Error("JPEG has no end marker")
}
