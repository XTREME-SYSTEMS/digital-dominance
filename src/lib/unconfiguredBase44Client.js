/**
 * A public preview without a build-provided app binding must never contact
 * the Base44 SDK, send analytics to apps/null, or pretend a write succeeded.
 */
export function createUnconfiguredBase44Client() {
  const failure = () => Promise.reject(Object.assign(
    new Error('Backend not configured for this preview'),
    { code: 'BACKEND_NOT_CONFIGURED' },
  ));
  const blocked = new Proxy(failure, {
    get(_target, property) {
      if (property === 'then' || typeof property === 'symbol') return undefined;
      return blocked;
    },
  });
  return Object.freeze({
    auth: blocked,
    entities: blocked,
    functions: blocked,
    integrations: blocked,
    storage: blocked,
    analytics: blocked,
  });
}
