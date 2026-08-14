/**
 * Normalise et persiste l'état de la feature « Blacklist ».
 *
 * @module src/features/blacklist/state
 */
const STORAGE_KEY = 'tm_hidden_shout_users_t4';

/**
 * Crée l'API publique « createBlacklistState ».
 *
 * @function createBlacklistState
 */
export function createBlacklistState({ storage, normalizeName }) {
    const listeners = new Set();
    let users = new Set();

    function load() {
        const storedUsers = storage.readJson(STORAGE_KEY, []);
        users = new Set(
            (Array.isArray(storedUsers) ? storedUsers : [])
                .map(normalizeName)
                .filter(Boolean)
        );
        notify();
    }

    function save() {
        storage.writeJson(STORAGE_KEY, [...users]);
    }

    function notify() {
        for (const listener of listeners) listener(api);
    }

    function add(usernameRaw) {
        const username = normalizeName(usernameRaw);
        if (!username) return { ok: false, message: 'Pseudo vide.' };
        if (users.has(username)) return { ok: false, message: `${usernameRaw} est déjà masqué.` };
        users.add(username);
        save();
        notify();
        return { ok: true, message: `Utilisateur masqué : ${usernameRaw}` };
    }

    function remove(usernameRaw) {
        const username = normalizeName(usernameRaw);
        if (!users.delete(username)) return { ok: false, message: `${usernameRaw} n’est pas dans la blacklist.` };
        save();
        notify();
        return { ok: true, message: `Utilisateur réaffiché : ${usernameRaw}` };
    }

    function toggle(usernameRaw) {
        const username = normalizeName(usernameRaw);
        return users.has(username) ? remove(usernameRaw) : add(usernameRaw);
    }

    const api = Object.freeze({
        storageKey: STORAGE_KEY,
        load,
        add,
        remove,
        toggle,
        has(usernameRaw) {
            return users.has(normalizeName(usernameRaw));
        },
        list() {
            return [...users].sort((left, right) => left.localeCompare(right, 'fr'));
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    });

    load();
    return api;
}
