/**
 * Encapsule les échanges distants utilisés par « Klipy Gifs ».
 *
 * @module src/features/klipy-gifs/client
 */
const GATEWAY = 'https://klipy-api-gateway.tr4ker-klipy-emoj-gateway-customer593.workers.dev';
const CLIENT_ID_KEY = 'tm_t4_klipy_gateway_client_id';
const MAX_CACHE_ENTRIES = 24;
const ALLOWED_GIF_HOSTS = new Set(['static.klipy.com', new URL(GATEWAY).host]);

function safeGifUrl(value) {
    try {
        const url = new URL(String(value || ''));
        return url.protocol === 'https:' && ALLOWED_GIF_HOSTS.has(url.host) ? url.href : '';
    } catch { return ''; }
}

function normalizeResult(value) {
    const gifUrl = safeGifUrl(value?.media_formats?.gif?.url || value?.url);
    const previewUrl = safeGifUrl(value?.media_formats?.tinygif?.url || gifUrl);
    if (!gifUrl || !previewUrl) return null;
    const dimensions = value?.media_formats?.tinygif?.dims || value?.media_formats?.gif?.dims || [];
    return {
        id: String(value?.id || gifUrl),
        title: String(value?.title || value?.content_description || value?.tags?.[0] || 'GIF KLIPY').trim(),
        gifUrl,
        previewUrl,
        width: Number(dimensions[0]) || 0,
        height: Number(dimensions[1]) || 0,
        tags: Array.isArray(value?.tags) ? value.tags.filter((tag) => typeof tag === 'string').slice(0, 3) : []
    };
}

/**
 * Crée l'API publique « createKlipyClient ».
 *
 * @function createKlipyClient
 */
export function createKlipyClient({ storage, http }) {
    const cache = new Map();
    function clientId() {
        const saved = String(storage.get(CLIENT_ID_KEY) || '').trim();
        if (/^[A-Za-z0-9_-]{8,128}$/.test(saved)) return saved;
        const next = typeof crypto?.randomUUID === 'function'
            ? crypto.randomUUID()
            : `tm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 16)}`;
        storage.set(CLIENT_ID_KEY, next);
        return next;
    }
    async function fetchFeed({ query = '', cursor = '' } = {}) {
        const normalizedQuery = String(query).trim();
        const endpoint = normalizedQuery ? 'search' : 'trending';
        const cacheKey = JSON.stringify([endpoint, normalizedQuery.toLocaleLowerCase('fr'), cursor]);
        if (cache.has(cacheKey)) return cache.get(cacheKey);
        const url = new URL(`${GATEWAY}/${endpoint}`);
        if (normalizedQuery) url.searchParams.set('q', normalizedQuery);
        if (cursor) url.searchParams.set('pos', cursor);
        url.searchParams.set('limit', '10');
        url.searchParams.set('media_filter', 'gif');
        url.searchParams.set('locale', 'fr_FR');
        const response = await http.external(url.href, {
            headers: { Accept: 'application/json', 'X-Client-ID': clientId() },
            credentials: 'omit', timeout: 20000
        });
        let payload = null;
        try { payload = await response.json(); } catch { /* handled below */ }
        if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
        const result = {
            results: Array.isArray(payload?.results) ? payload.results.map(normalizeResult).filter(Boolean) : [],
            next: typeof payload?.next === 'string' ? payload.next : ''
        };
        cache.set(cacheKey, result);
        while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
        return result;
    }
    return Object.freeze({ fetchFeed });
}
