import { db } from '../db.js'
import { apiKeys } from './schema.js'
import { eq } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'

export interface CreateApiKeyInput {
	name: string
	scopes?: string[]
	rateLimit?: number
	expiresAt?: Date
	createdBy?: number
}

export interface UpdateApiKeyInput {
	name?: string
	scopes?: string[]
	rateLimit?: number
	expiresAt?: Date
	isActive?: string
}

export class ApiKeysService {
	static generateApiKey(): string {
		const key = randomBytes(32).toString('hex')
		return `prk_${key}`
	}

	static hashApiKey(key: string): string {
		return createHash('sha256').update(key).digest('hex')
	}

	static async createApiKey(data: CreateApiKeyInput): Promise<{ key: string; apiKey: any }> {
		const key = this.generateApiKey()
		const keyHash = this.hashApiKey(key)

		const result = await db.insert(apiKeys).values({
			keyHash,
			name: data.name,
			scopes: data.scopes || [],
			rateLimit: data.rateLimit || 100,
			expiresAt: data.expiresAt,
			createdBy: data.createdBy,
			isActive: 'active',
		}).returning()

		return { key, apiKey: this.transformApiKeyData(result[0]!) }
	}

	static async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: any; error?: string }> {
		try {
			const keyHash = this.hashApiKey(key)
			const result = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash))

			if (result.length === 0) return { valid: false, error: 'API key no encontrada' }
			const apiKey = result[0]!

			if (apiKey.isActive !== 'active') return { valid: false, error: 'API key inactiva o revocada' }
			if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return { valid: false, error: 'API key expirada' }

			await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id))
			return { valid: true, apiKey }
		} catch (error: any) {
			return { valid: false, error: `Error al validar API key: ${error.message}` }
		}
	}

	static async getAllApiKeys() {
		const allKeys = await db.select().from(apiKeys)
		return allKeys.map(k => this.transformApiKeyData(k))
	}

	static async updateApiKey(id: number, data: UpdateApiKeyInput) {
		const updateData: any = {}
		if (data.name !== undefined) updateData.name = data.name
		if (data.scopes !== undefined) updateData.scopes = data.scopes
		if (data.rateLimit !== undefined) updateData.rateLimit = data.rateLimit
		if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt
		if (data.isActive !== undefined) updateData.isActive = data.isActive

		const result = await db.update(apiKeys).set(updateData).where(eq(apiKeys.id, id)).returning()
		if (result.length === 0) throw new Error('API key no encontrada')
		return this.transformApiKeyData(result[0]!)
	}

	static async revokeApiKey(id: number) {
		const result = await db.update(apiKeys).set({ isActive: 'revoked' }).where(eq(apiKeys.id, id)).returning()
		return this.transformApiKeyData(result[0]!)
	}

	private static transformApiKeyData(key: any): any {
		return {
			id: key.id,
			name: key.name,
			scopes: key.scopes || null,
			rateLimit: key.rateLimit ?? 100,
			expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString() : null,
			createdBy: key.createdBy || null,
			createdAt: key.createdAt ? new Date(key.createdAt).toISOString() : new Date().toISOString(),
			lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt).toISOString() : null,
			isActive: key.isActive || 'active',
		}
	}
}


