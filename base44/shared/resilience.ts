// ═══════════════════════════════════════════════════════════════════════════
// resilience.ts — Resilience patterns for the autonomous dominance engine.
// Provides retry, circuit breaker, bulkhead, timeout, and fallback strategies
// that keep the system running when external dependencies fail.
// ═══════════════════════════════════════════════════════════════════════════

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [],
};

/** Exponential backoff retry with jitter. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      // Check if error is retryable
      if (opts.retryableErrors.length > 0) {
        const isRetryable = opts.retryableErrors.some(
          (pattern) => err.message?.includes(pattern)
        );
        if (!isRetryable) throw err;
      }

      if (attempt === opts.maxAttempts - 1) break;

      // Exponential backoff with jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelayMs
      );
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, jitter));
    }
  }

  throw lastError;
}

// ── Circuit Breaker ──────────────────────────────────────────────────────
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private resetTimeoutMs: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open — service unavailable');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.failures = 0;
        this.state = 'closed';
      }
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
      }

      throw err;
    }
  }

  getState() {
    return { state: this.state, failures: this.failures };
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}

// ── Timeout ──────────────────────────────────────────────────────────────
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`Operation timed out after ${timeoutMs}ms`))
        );
      }),
    ]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Fallback Chain ────────────────────────────────────────────────────────
export async function withFallback<T>(
  providers: Array<() => Promise<T>>
): Promise<T> {
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      return await provider();
    } catch (err) {
      lastError = err;
      console.warn(`[resilience] provider failed: ${err.message}, trying next...`);
    }
  }

  throw lastError || new Error('All providers failed');
}

// ── Bulkhead (concurrency limiter) ────────────────────────────────────────
export class Bulkhead {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number = 5) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getStats() {
    return { active: this.active, queued: this.queue.length, max: this.maxConcurrent };
  }
}

// ── Health Check ─────────────────────────────────────────────────────────
export interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export async function healthCheck(
  url: string,
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    return {
      healthy: res.ok,
      latencyMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

// ── Graceful Degradation ─────────────────────────────────────────────────
export function gracefulDegradation<T>(
  primary: T,
  fallback: T,
  condition: boolean
): T {
  return condition ? primary : fallback;
}