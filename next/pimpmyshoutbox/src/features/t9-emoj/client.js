/**
 * Encapsule les échanges distants utilisés par « T9 Emoj ».
 *
 * @module src/features/t9-emoj/client
 */
const GATEWAY = 'https://klipy-api-gateway.tr4ker-klipy-emoj-gateway-customer593.workers.dev';
const CACHE_KEY = 'tm_t4_t9_emoj_manifest_cache';
const CLIENT_ID_KEY = 'tm_t4_klipy_gateway_client_id';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function clientId(storage) {
    const saved = String(storage.get(CLIENT_ID_KEY) || '').trim();
    if (/^[A-Za-z0-9_-]{8,128}$/.test(saved)) return saved;
    const next = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `tm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 16)}`;
    storage.set(CLIENT_ID_KEY, next);
    return next;
}

function normalizeItem(value) {
    const id = String(value?.id || '').trim();
    const filename = String(value?.filename || '').trim();
    const format = String(value?.format || '').toLowerCase();
    const url = String(value?.url || '').trim();
    if (!id || !filename || !['png', 'gif'].includes(format) || !/^[^/\\\u0000-\u001f]+\.(png|gif)$/i.test(filename)) return null;
    try {
        const parsed = new URL(url); const gateway = new URL(GATEWAY);
        if (parsed.origin !== gateway.origin || !parsed.pathname.startsWith('/emochat/') || decodeURIComponent(parsed.pathname.slice('/emochat/'.length)) !== filename) return null;
        return { id, filename, format, url: parsed.href };
    } catch { return null; }
}

function normalizeItems(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map(normalizeItem).filter((item) => item && !seen.has(item.id) && seen.add(item.id)).sort((left, right) => left.filename.localeCompare(right.filename, 'fr'));
}

/**
 * Crée l'API publique « createT9EmojClient ».
 *
 * @function createT9EmojClient
 */
export function createT9EmojClient({ storage, http }) {
    let pending = null;
    function getCached() {
        const cached = storage.readJson(CACHE_KEY);
        return cached && Number(cached.expiresAt) > Date.now() ? normalizeItems(cached.items) : [];
    }
    async function load() {
        const cached = getCached();
        if (cached.length) return cached;
        if (pending) return pending;
        pending = (async () => {
            const response = await http.external(`${GATEWAY}/emochat`, { headers: { Accept: 'application/json', 'X-Client-ID': clientId(storage) }, credentials: 'omit', timeout: 20000 });
            let payload = null;
            try { payload = await response.json(); } catch { /* handled below */ }
            if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
            const items = normalizeItems(payload?.items);
            if (!items.length) throw new Error('Aucune émoticône disponible.');
            storage.writeJson(CACHE_KEY, { expiresAt: Date.now() + CACHE_TTL_MS, items });
            return items;
        })();
        try { return await pending; } finally { pending = null; }
    }
    return Object.freeze({ getCached, load });
}
