import { t } from 'elysia'

export const ApiKeysModel = {
	createBody: t.Object({
		name: t.String({ minLength: 1 }),
		scopes: t.Optional(t.Array(t.String())),
		rateLimit: t.Optional(t.Number({ minimum: 1, maximum: 10000 })),
		expiresAt: t.Optional(t.String({ format: 'date-time' })),
		createdBy: t.Optional(t.Number()),
	}),

	updateBody: t.Object({
		name: t.Optional(t.String({ minLength: 1 })),
		scopes: t.Optional(t.Array(t.String())),
		rateLimit: t.Optional(t.Number({ minimum: 1, maximum: 10000 })),
		expiresAt: t.Optional(t.String({ format: 'date-time' })),
		isActive: t.Optional(t.String({ enum: ['active', 'inactive', 'revoked'] })),
	}),

	apiKeyResponse: t.Object({
		id: t.Number(),
		name: t.String(),
		scopes: t.Union([t.Array(t.String()), t.Null()]),
		rateLimit: t.Number(),
		expiresAt: t.Union([t.String(), t.Null()]),
		createdBy: t.Union([t.Number(), t.Null()]),
		createdAt: t.String(),
		lastUsedAt: t.Union([t.String(), t.Null()]),
		isActive: t.String(),
	}),

	apiKeyWithKey: t.Object({
		key: t.String(),
		apiKey: t.Object({
			id: t.Number(),
			name: t.String(),
			scopes: t.Union([t.Array(t.String()), t.Null()]),
			rateLimit: t.Number(),
			expiresAt: t.Union([t.String(), t.Null()]),
			createdBy: t.Union([t.Number(), t.Null()]),
			createdAt: t.String(),
			isActive: t.String(),
		}),
	}),

	apiKeysList: t.Array(t.Object({
		id: t.Number(),
		name: t.String(),
		scopes: t.Union([t.Array(t.String()), t.Null()]),
		rateLimit: t.Number(),
		expiresAt: t.Union([t.String(), t.Null()]),
		createdBy: t.Union([t.Number(), t.Null()]),
		createdAt: t.String(),
		lastUsedAt: t.Union([t.String(), t.Null()]),
		isActive: t.String(),
	})),
}


