const STORAGE_KEY = 'tm_highlighted_shout_users_t4';
const DEFAULT_COLOR = '#f59e0b';
const DEFAULT_OPACITY = 14;

function normalizeColor(value) {
    const color = String(value || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(color)) return `#${color.slice(1).split('').map((part) => part + part).join('')}`.toLowerCase();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_COLOR;
}

function normalizeOpacity(value) {
    const parsed = Number(value);
    return Math.min(100, Math.max(0, Number.isFinite(parsed) ? Math.round(parsed) : DEFAULT_OPACITY));
}

function normalizeConfig(value) {
    if (typeof value === 'string') return { color: normalizeColor(value), opacityPercent: DEFAULT_OPACITY };
    return { color: normalizeColor(value?.color), opacityPercent: normalizeOpacity(value?.opacityPercent) };
}

export function createHighlightState({ storage, normalizeName }) {
    let users = {};
    const listeners = new Set();

    function list() {
        return Object.entries(users).sort(([left], [right]) => left.localeCompare(right, 'fr')).map(([username, config]) => ({ username, ...config }));
    }
    function emit() { for (const listener of listeners) listener(list()); }
    function save() { storage.writeJson(STORAGE_KEY, users); emit(); }
    function load() {
        const source = storage.readJson(STORAGE_KEY, {});
        users = Object.fromEntries(Object.entries(source && typeof source === 'object' && !Array.isArray(source) ? source : {})
            .map(([username, config]) => [normalizeName(username), normalizeConfig(config)])
            .filter(([username]) => Boolean(username)));
        emit();
        return list();
    }
    function get(username) { return users[normalizeName(username)] || null; }
    function upsert(rawUsername, color, opacityPercent) {
        const username = normalizeName(rawUsername);
        if (!username) return { ok: false, message: 'Pseudo vide.' };
        const existed = Boolean(users[username]);
        users[username] = { color: normalizeColor(color), opacityPercent: normalizeOpacity(opacityPercent) };
        save();
        return { ok: true, message: existed ? `Couleur mise à jour pour ${rawUsername}` : `Utilisateur mis en avant : ${rawUsername}` };
    }
    function remove(rawUsername) {
        const username = normalizeName(rawUsername);
        if (!username) return { ok: false, message: 'Pseudo vide.' };
        if (!users[username]) return { ok: false, message: 'Pseudo non mis en avant.' };
        delete users[username]; save();
        return { ok: true, message: `Mise en avant retirée : ${rawUsername}` };
    }
    load();
    return Object.freeze({ storageKey: STORAGE_KEY, list, get, load, upsert, remove, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } });
}
