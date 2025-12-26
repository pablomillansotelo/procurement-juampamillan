/**
 * Middleware de Rate Limiting (in-memory)
 */

interface RateLimitEntry {
	count: number
	resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

setInterval(() => {
	const now = Date.now()
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now) rateLimitStore.delete(key)
	}
}, 60000)

export function checkRateLimit(apiKeyId: number, rateLimit: number): {
	allowed: boolean
	remaining: number
	resetAt: number
} {
	const key = `api_key_${apiKeyId}`
	const now = Date.now()
	const windowMs = 60000

	let entry = rateLimitStore.get(key)
	if (!entry || entry.resetAt < now) {
		entry = { count: 0, resetAt: now + windowMs }
		rateLimitStore.set(key, entry)
	}

	entry.count++
	const remaining = Math.max(0, rateLimit - entry.count)
	const allowed = entry.count <= rateLimit

	return { allowed, remaining, resetAt: entry.resetAt }
}

export function getRateLimitHeaders(apiKeyId: number, rateLimit: number): Record<string, string> {
	const result = checkRateLimit(apiKeyId, rateLimit)
	return {
		'X-RateLimit-Limit': rateLimit.toString(),
		'X-RateLimit-Remaining': result.remaining.toString(),
		'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
	}
}


