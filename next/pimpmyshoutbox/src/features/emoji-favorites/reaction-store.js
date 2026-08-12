export const REACTION_STORAGE_KEYS = Object.freeze({
    usage: 'tm_t4_reaction_usage_counts',
    limit: 'tm_t4_reaction_quick_access_limit',
    manual: 'tm_t4_manual_reaction_favorites'
});

const MAX_FAVORITES = 24;

function isUnicodeEmoji(value) {
    return /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/u.test(String(value || ''));
}

function normalizeImageUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try { const url = new URL(raw, location.origin); return `${url.pathname}${url.search}`; } catch { return raw; }
}

function hash(value) {
    let result = 5381;
    for (const character of String(value || '')) result = ((result << 5) + result) ^ character.charCodeAt(0);
    return (result >>> 0).toString(36);
}

export function reactionLabel(record) {
    const emoji = String(record?.emojiValue || '').trim();
    if (emoji) return emoji;
    const label = String(record?.label || record?.title || record?.alt || '').trim();
    return label ? Array.from(label).slice(0, 2).join('') : '';
}

export function normalizeReactionRecord(value, { manual = false } = {}) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const emojiValue = String(value).trim();
        if (!isUnicodeEmoji(emojiValue)) return null;
        return { key: `manual-reaction:${emojiValue}`, label: emojiValue, title: emojiValue, alt: emojiValue, emojiValue, src: '', svgSignature: '', count: 0, lastUsedAt: 0, isManual: true };
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const label = String(value.label || '').trim();
    const title = String(value.title || '').trim();
    const alt = String(value.alt || '').trim();
    const emojiValue = [value.emojiValue, label, title, alt].map((entry) => String(entry || '').trim()).find(isUnicodeEmoji) || '';
    const src = normalizeImageUrl(value.src);
    const svgSignature = String(value.svgSignature || '').trim();
    const key = String(value.key || `${(label || title || alt || emojiValue).toLocaleLowerCase('fr')}|${src || `svg:${hash(svgSignature)}`}`).trim();
    if (!key || (!emojiValue && !label && !title && !alt && !src && !svgSignature)) return null;
    return {
        key,
        label: label || emojiValue || title || alt,
        title: title || emojiValue || label || alt,
        alt: alt || emojiValue || label || title,
        emojiValue,
        src,
        svgSignature,
        count: Math.max(0, Number.parseInt(String(value.count || 0), 10) || 0),
        lastUsedAt: Math.max(0, Number(value.lastUsedAt) || 0),
        isManual: manual || value.isManual === true
    };
}

function unique(records) {
    const seen = new Set();
    return records.filter((record) => record && !seen.has(record.key) && seen.add(record.key));
}

export function createReactionFavoritesStore({ storage }) {
    let usage = {};
    let manualFavorites = [];
    const limit = () => Math.min(9, Math.max(0, Number.parseInt(storage.get(REACTION_STORAGE_KEYS.limit) || '5', 10) || 0));
    function reload() {
        const rawUsage = storage.readJson(REACTION_STORAGE_KEYS.usage, {});
        usage = Object.fromEntries(Object.entries(rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage) ? rawUsage : {})
            .map(([, record]) => normalizeReactionRecord(record)).filter(Boolean).map((record) => [record.key, record]));
        const rawManual = storage.readJson(REACTION_STORAGE_KEYS.manual, []);
        manualFavorites = unique((Array.isArray(rawManual) ? rawManual : []).map((record) => normalizeReactionRecord(record, { manual: true })).filter(Boolean)).slice(0, MAX_FAVORITES);
    }
    const getUsage = () => Object.values(usage).map((record) => ({ ...record }));
    const getManual = () => manualFavorites.map((record) => ({ ...record }));
    function favorites(mode) {
        if (!limit()) return [];
        if (mode === 'manual') return getManual().slice(0, limit());
        return getUsage().sort((left, right) => right.count - left.count || right.lastUsedAt - left.lastUsedAt).slice(0, limit());
    }
    function record(value) {
        const record = normalizeReactionRecord(value); if (!record) return null;
        const previous = usage[record.key];
        usage[record.key] = { ...record, count: (previous?.count || 0) + 1, lastUsedAt: Date.now() };
        storage.writeJson(REACTION_STORAGE_KEYS.usage, usage); return { ...usage[record.key] };
    }
    function toggleManual(value) {
        const record = normalizeReactionRecord(value, { manual: true }); if (!record) return { ok: false, message: 'Réaction favorite introuvable.' };
        const index = manualFavorites.findIndex((favorite) => favorite.key === record.key);
        if (index >= 0) { manualFavorites.splice(index, 1); storage.writeJson(REACTION_STORAGE_KEYS.manual, manualFavorites); return { ok: true, added: false, message: 'Réaction retirée des favoris.' }; }
        if (manualFavorites.length >= MAX_FAVORITES) return { ok: false, message: `Maximum de ${MAX_FAVORITES} favoris atteint.` };
        manualFavorites.push(record); storage.writeJson(REACTION_STORAGE_KEYS.manual, manualFavorites); return { ok: true, added: true, message: 'Réaction ajoutée aux favoris.' };
    }
    function removeManual(index) { if (!Number.isInteger(index) || index < 0 || index >= manualFavorites.length) return false; manualFavorites.splice(index, 1); storage.writeJson(REACTION_STORAGE_KEYS.manual, manualFavorites); return true; }
    function moveManual(index, delta) { const target = index + delta; if (!Number.isInteger(index) || index < 0 || target < 0 || index >= manualFavorites.length || target >= manualFavorites.length) return false; const [record] = manualFavorites.splice(index, 1); manualFavorites.splice(target, 0, record); storage.writeJson(REACTION_STORAGE_KEYS.manual, manualFavorites); return true; }
    function clearUsage() { usage = {}; storage.remove(REACTION_STORAGE_KEYS.usage); }
    function setLimit(value) { storage.set(REACTION_STORAGE_KEYS.limit, String(Math.min(9, Math.max(0, Number.parseInt(value, 10) || 0)))); }
    reload();
    return Object.freeze({ reload, limit, setLimit, getUsage, getManual, favorites, record, toggleManual, removeManual, moveManual, clearUsage });
}
