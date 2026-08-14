/**
 * Construit le catalogue de données utilisé par « Imgbb Upload ».
 *
 * @module src/features/imgbb-upload/catalog
 */
const CATALOG_STORAGE_KEY = 'tm_t4_image_catalog';
const MAX_RECORDS = 120;
const VALIDATION_TIMEOUT_MS = 9000;
const DELETE_ATTEMPTS = 6;

function safeUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch { return ''; }
}

function recordId(value) {
    return String(value || '').trim() || (typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
}

function normalizeRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const url = safeUrl(value.url || value.displayUrl);
    if (!url) return null;
    const createdAt = Math.max(0, Number(value.createdAt) || Date.now());
    return {
        id: recordId(value.id), url,
        displayUrl: safeUrl(value.displayUrl) || url,
        thumbUrl: safeUrl(value.thumbUrl) || url,
        viewerUrl: safeUrl(value.viewerUrl),
        deleteUrl: safeUrl(value.deleteUrl),
        title: String(value.title || 'Image').trim().slice(0, 180) || 'Image',
        source: value.source === 'imgbb' ? 'imgbb' : 'manual',
        mime: String(value.mime || '').trim(),
        width: Math.max(0, Number(value.width) || 0), height: Math.max(0, Number(value.height) || 0), size: Math.max(0, Number(value.size) || 0),
        createdAt, expiresAt: Math.max(0, Number(value.expiresAt) || 0), lastCheckedAt: Math.max(0, Number(value.lastCheckedAt) || createdAt)
    };
}

function buildUploadedRecord(payload, file, lifetime) {
    const data = payload?.data || {}; const image = data.image || {}; const thumb = data.thumb || {}; const medium = data.medium || {};
    const uploadedAt = Date.now();
    const expiration = data.expiration === undefined || data.expiration === null || data.expiration === ''
        ? lifetime : Math.max(0, Number.parseInt(String(data.expiration), 10) || 0);
    return normalizeRecord({
        id: data.id, url: data.url || image.url || data.display_url, displayUrl: data.display_url || medium.url || data.url || image.url,
        thumbUrl: thumb.url || medium.url || data.display_url || data.url || image.url, viewerUrl: data.url_viewer, deleteUrl: data.delete_url,
        title: data.title || image.name || file?.name || 'Image ImgBB', source: 'imgbb', mime: image.mime || file?.type,
        width: data.width, height: data.height, size: data.size || file?.size, createdAt: uploadedAt, expiresAt: expiration ? uploadedAt + expiration * 1000 : 0, lastCheckedAt: uploadedAt
    });
}

function cacheBuster(url) {
    try { const value = new URL(url); value.searchParams.set('tm_check', `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`); return value.href; } catch { return url; }
}

function wait(delay) { return new Promise((resolve) => window.setTimeout(resolve, delay)); }

/**
 * Crée l'API publique « createImageCatalog ».
 *
 * @function createImageCatalog
 */
export function createImageCatalog({ storage, http }) {
    const listeners = new Set();
    let records = [];

    function notify() { for (const listener of listeners) listener(list()); }
    function save(nextRecords) {
        records = nextRecords.map(normalizeRecord).filter(Boolean)
            .filter((record) => !record.expiresAt || record.expiresAt > Date.now())
            .sort((left, right) => right.createdAt - left.createdAt).slice(0, MAX_RECORDS);
        storage.writeJson(CATALOG_STORAGE_KEY, records); notify(); return list();
    }
    function load() { records = (storage.readJson(CATALOG_STORAGE_KEY, []) || []).map(normalizeRecord).filter(Boolean); save(records); return list(); }
    function list() { return records.map((record) => ({ ...record })); }
    function add(record) { const normalized = normalizeRecord(record); if (!normalized) return { ok: false, message: 'Lien image invalide.' }; save([normalized, ...records.filter((entry) => entry.url !== normalized.url)]); return { ok: true, record: normalized, message: 'Image ajoutée au catalogue.' }; }
    function remove(id) { const before = records.length; save(records.filter((record) => record.id !== id)); return before === records.length ? { ok: false, message: 'Image introuvable.' } : { ok: true, message: 'Image retirée du catalogue.' }; }
    function clear() { save([]); return { ok: true, message: 'Catalogue local vidé.' }; }

    function validate(url, timeout = VALIDATION_TIMEOUT_MS) {
        const imageUrl = safeUrl(url); if (!imageUrl) return Promise.resolve({ ok: false, message: 'Lien image invalide.' });
        return new Promise((resolve) => {
            const image = new Image(); let done = false;
            const finish = (result) => { if (done) return; done = true; window.clearTimeout(timer); image.onload = null; image.onerror = null; resolve(result); };
            const timer = window.setTimeout(() => finish({ ok: false, message: 'Validation de l’image expirée.' }), timeout);
            image.onload = () => finish({ ok: true, url: imageUrl, width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
            image.onerror = () => finish({ ok: false, message: 'Le lien ne charge pas une image valide.' });
            image.referrerPolicy = 'no-referrer'; image.src = imageUrl;
        });
    }

    async function addDirect(url, title = '') {
        const validation = await validate(url);
        if (!validation.ok) return validation;
        const result = add({ url: validation.url, thumbUrl: validation.url, title: String(title || '').trim() || 'Lien direct', source: 'manual', width: validation.width, height: validation.height, createdAt: Date.now(), lastCheckedAt: Date.now() });
        return result.ok ? { ...result, message: 'Lien image ajouté au catalogue.' } : result;
    }

    async function upload(file, apiKey, lifetime) {
        if (!(file instanceof File) || !/^image\//i.test(file.type || '')) throw new Error('Fichier image invalide.');
        const url = new URL('https://api.imgbb.com/1/upload'); url.searchParams.set('key', apiKey); if (lifetime > 0) url.searchParams.set('expiration', String(lifetime));
        const body = new FormData(); body.append('image', file, file.name || `image-${Date.now()}`);
        const response = await http.external(url.href, { method: 'POST', body, credentials: 'omit', timeout: 60000 });
        let payload = null; try { payload = await response.json(); } catch { /* handled below */ }
        const record = buildUploadedRecord(payload, file, lifetime);
        if (!response.ok || payload?.success !== true || !record) throw new Error(payload?.error?.message || payload?.message || `Upload ImgBB impossible (HTTP ${response.status}).`);
        add(record); return record;
    }

    function getDeleteDetails(deleteUrl) {
        try {
            const url = new URL(deleteUrl); if (!/^(?:www\.)?ibb\.co$/i.test(url.hostname)) return null;
            const [id, hash, ...rest] = url.pathname.split('/').filter(Boolean);
            return !rest.length && /^[\w-]+$/.test(id || '') && /^[\w-]+$/.test(hash || '') ? { id, hash, pathname: `/${id}/${hash}` } : null;
        } catch { return null; }
    }

    async function deleteRemote(record) {
        const details = getDeleteDetails(record.deleteUrl);
        if (!details) return { ok: false, message: 'URL de suppression ImgBB invalide.' };
        try {
            const body = new FormData(); body.append('pathname', details.pathname); body.append('action', 'delete'); body.append('delete', 'image'); body.append('from', 'resource'); body.append('deleting[id]', details.id); body.append('deleting[hash]', details.hash);
            await http.external('https://ibb.co/json', { method: 'POST', body, credentials: 'omit', timeout: 15000 });
        } catch { return { ok: false, message: 'Suppression ImgBB inaccessible.' }; }
        for (let attempt = 0; attempt < DELETE_ATTEMPTS; attempt += 1) {
            await wait(attempt === 0 ? 650 : 1200);
            const validation = await validate(cacheBuster(record.url), 3500);
            if (!validation.ok) return { ok: true, message: 'Image supprimée sur ImgBB.' };
        }
        return { ok: false, message: 'ImgBB a répondu, mais l’image est encore accessible.' };
    }

    async function deleteRecord(record) {
        const current = records.find((entry) => entry.id === record?.id); if (!current) return { ok: false, message: 'Image introuvable.' };
        if (current.deleteUrl) { const result = await deleteRemote(current); if (!result.ok) return result; }
        remove(current.id); return { ok: true, message: current.deleteUrl ? 'Image supprimée à distance et retirée du catalogue.' : 'Image retirée du catalogue.' };
    }

    async function purge() {
        const next = []; let removed = 0;
        for (const record of records) {
            if (record.expiresAt && record.expiresAt <= Date.now()) { removed += 1; continue; }
            const validation = await validate(cacheBuster(record.url));
            if (!validation.ok) { removed += 1; continue; }
            next.push({ ...record, width: validation.width || record.width, height: validation.height || record.height, lastCheckedAt: Date.now() });
        }
        save(next); return { ok: true, message: removed ? `${removed} image${removed > 1 ? 's' : ''} retirée${removed > 1 ? 's' : ''} du catalogue.` : 'Catalogue vérifié, aucun lien mort.' };
    }

    load();
    return Object.freeze({ list, add, remove, clear, addDirect, upload, deleteRecord, purge, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } });
}
