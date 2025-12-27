/**
 * Rate Limiting in-memory
 * 
 * NOTA: Esta implementación funciona bien para:
 * - Desarrollo
 * - Producción con una sola instancia
 * 
 * Para producción con múltiples instancias, considerar usar:
 * - @upstash/ratelimit (Redis-based)
 * - Vercel Edge Config
 * - Otra solución distribuida
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store in-memory (se resetea al reiniciar el servidor)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo de requests en la ventana
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Limpia entradas expiradas del store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}


/**
 * Limpia entradas expiradas cada 5 minutos
 */
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Verifica si un identificador excede el límite de rate
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Si no hay entrada o la ventana expiró, crear nueva
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      reset: newEntry.resetAt,
    };
  }

  // Si ya alcanzó el límite
  if (entry.count >= options.maxRequests) {
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  // Incrementar contador
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Rate limiter pre-configurado para diferentes tipos de requests
 */
export const rateLimit = {
  /**
   * Rate limit para GET requests (más permisivo)
   */
  get: (identifier: string) =>
    checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 100, // 100 requests por minuto
    }),

  /**
   * Rate limit para POST/PUT/DELETE requests (más restrictivo)
   */
  mutation: (identifier: string) =>
    checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 20, // 20 requests por minuto
    }),
};

