export const STORAGE_KEYS = Object.freeze({
    usage: 'tm_t4_emoji_usage_counts',
    limit: 'tm_t4_emoji_quick_access_limit',
    mode: 'tm_t4_quick_access_mode',
    manual: 'tm_t4_manual_emoji_favorites'
});

const MAX_FAVORITES = 24;
const MODES = new Set(['auto', 'manual']);

function isUnicodeEmoji(value) {
    return /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/u.test(String(value || ''));
}

function normalizeImageUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try { const url = new URL(raw, location.origin); return `${url.pathname}${url.search}`; } catch { return raw; }
}

export function insertionText(record) {
    const direct = String(record?.insertText || '').trim();
    if (direct) return direct;
    for (const candidate of [record?.title, record?.alt]) {
        const value = String(candidate || '').trim();
        if (isUnicodeEmoji(value) || /^:[^:\s][^:]*:$/.test(value)) return value;
        if (value && !/\s/.test(value)) return `:${value.replace(/^:+|:+$/g, '')}:`;
    }
    const match = normalizeImageUrl(record?.src).match(/\/([^/?#]+)\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:\?.*)?$/i);
    return match?.[1] ? `:${match[1]}:` : '';
}

export function normalizeRecord(value, { manual = false } = {}) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const raw = String(value).trim();
        if (!raw) return null;
        const insertText = isUnicodeEmoji(raw) || /^:[^:\s][^:]*:$/.test(raw) ? raw : `:${raw.replace(/^:+|:+$/g, '')}:`;
        return { key: `manual:${insertText.toLocaleLowerCase('fr')}`, title: insertText, alt: insertText, src: '', insertText, count: 0, lastUsedAt: 0, isManual: true };
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const title = String(value.title || value.insertText || '').trim();
    const alt = String(value.alt || value.insertText || '').trim();
    const src = normalizeImageUrl(value.src);
    const insertText = insertionText({ ...value, title, alt, src });
    const key = String(value.key || `${(title || alt || insertText).toLocaleLowerCase('fr')}|${src}`).trim();
    if (!key || !insertText) return null;
    return {
        key,
        title: title || insertText,
        alt: alt || insertText,
        src,
        insertText,
        count: Math.max(0, Number.parseInt(String(value.count || 0), 10) || 0),
        lastUsedAt: Math.max(0, Number(value.lastUsedAt) || 0),
        isManual: manual || value.isManual === true
    };
}

function unique(records) {
    const seen = new Set();
    return records.filter((record) => record && !seen.has(record.key) && seen.add(record.key));
}

export function createEmojiFavoritesStore({ storage }) {
    let usage = {};
    let manualFavorites = [];

    function mode() { const raw = storage.get(STORAGE_KEYS.mode); return MODES.has(raw) ? raw : 'auto'; }
    function limit() { return Math.min(9, Math.max(0, Number.parseInt(storage.get(STORAGE_KEYS.limit) || '5', 10) || 0)); }
    function reload() {
        const rawUsage = storage.readJson(STORAGE_KEYS.usage, {});
        usage = Object.fromEntries(Object.entries(rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage) ? rawUsage : {})
            .map(([, record]) => normalizeRecord(record))
            .filter(Boolean)
            .map((record) => [record.key, record]));
        manualFavorites = unique((Array.isArray(storage.readJson(STORAGE_KEYS.manual, [])) ? storage.readJson(STORAGE_KEYS.manual, []) : [])
            .map((record) => normalizeRecord(record, { manual: true })).filter(Boolean)).slice(0, MAX_FAVORITES);
    }
    function saveUsage() { storage.writeJson(STORAGE_KEYS.usage, usage); }
    function saveManual() { storage.writeJson(STORAGE_KEYS.manual, manualFavorites); }
    function getUsage() { return Object.values(usage).map((record) => ({ ...record })); }
    function getManual() { return manualFavorites.map((record) => ({ ...record })); }
    function favorites() {
        const safeLimit = limit(); if (!safeLimit) return [];
        if (mode() === 'manual') return getManual().slice(0, safeLimit);
        return getUsage().sort((left, right) => right.count - left.count || right.lastUsedAt - left.lastUsedAt).slice(0, safeLimit);
    }
    function record(value) {
        const record = normalizeRecord(value); if (!record) return null;
        const previous = usage[record.key];
        usage[record.key] = { ...record, count: (previous?.count || 0) + 1, lastUsedAt: Date.now() };
        saveUsage(); return { ...usage[record.key] };
    }
    function toggleManual(value) {
        const record = normalizeRecord(value, { manual: true }); if (!record) return { ok: false, message: 'Emoji favori introuvable.' };
        const index = manualFavorites.findIndex((favorite) => favorite.key === record.key);
        if (index >= 0) { manualFavorites.splice(index, 1); saveManual(); return { ok: true, added: false, message: 'Emoji retiré des favoris.' }; }
        if (manualFavorites.length >= MAX_FAVORITES) return { ok: false, message: `Maximum de ${MAX_FAVORITES} favoris atteint.` };
        manualFavorites.push(record); saveManual(); return { ok: true, added: true, message: 'Emoji ajouté aux favoris.' };
    }
    function removeManual(index) { if (!Number.isInteger(index) || index < 0 || index >= manualFavorites.length) return false; manualFavorites.splice(index, 1); saveManual(); return true; }
    function moveManual(index, delta) { const target = index + delta; if (!Number.isInteger(index) || target < 0 || index < 0 || target >= manualFavorites.length || index >= manualFavorites.length) return false; const [record] = manualFavorites.splice(index, 1); manualFavorites.splice(target, 0, record); saveManual(); return true; }
    function clearUsage() { usage = {}; storage.remove(STORAGE_KEYS.usage); }
    function setMode(value) { storage.set(STORAGE_KEYS.mode, MODES.has(value) ? value : 'auto'); }
    function setLimit(value) { storage.set(STORAGE_KEYS.limit, String(Math.min(9, Math.max(0, Number.parseInt(value, 10) || 0)))); }
    reload();
    return Object.freeze({ reload, mode, limit, setMode, setLimit, getUsage, getManual, favorites, record, toggleManual, removeManual, moveManual, clearUsage });
}
