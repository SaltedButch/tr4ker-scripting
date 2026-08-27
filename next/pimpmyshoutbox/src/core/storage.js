/**
 * Fournit une façade sûre pour la persistance locale.
 *
 * @module src/core/storage
 */
function safeCall(callback, fallback) {
    try {
        return callback();
    } catch {
        return fallback;
    }
}

/**
 * Crée l'API publique « createStorage ».
 *
 * @function createStorage
 */
export function createStorage(storage = localStorage) {
    return {
        get(key, fallback = null) {
            const value = safeCall(() => storage.getItem(key), null);
            return value === null ? fallback : value;
        },
        set(key, value) {
            return safeCall(() => {
                storage.setItem(key, String(value));
                return true;
            }, false);
        },
        remove(key) {
            return safeCall(() => {
                storage.removeItem(key);
                return true;
            }, false);
        },
        readJson(key, fallback = null) {
            const value = this.get(key);
            if (value === null) return fallback;
            return safeCall(() => JSON.parse(value), fallback);
        },
        writeJson(key, value) {
            return safeCall(() => this.set(key, JSON.stringify(value)), false);
        },
        readBoolean(key, fallback = false) {
            const value = this.get(key);
            if (value === null) return Boolean(fallback);
            return value === '1' || value === 'true';
        },
        writeBoolean(key, value) {
            return this.set(key, value ? '1' : '0');
        }
    };
}

/**
 * Crée un stockage réservé au gestionnaire de userscripts pour les données
 * sensibles. Il ne revient volontairement jamais sur localStorage : celui-ci
 * est partagé avec tous les scripts exécutés par la page.
 *
 * @function createSecretStorage
 */
export function createSecretStorage({ getValue = globalThis.GM_getValue, setValue = globalThis.GM_setValue, deleteValue = globalThis.GM_deleteValue } = {}) {
    const available = typeof getValue === 'function' && typeof setValue === 'function' && typeof deleteValue === 'function';
    return Object.freeze({
        isAvailable() { return available; },
        get(key, fallback = null) {
            return available ? safeCall(() => getValue(key, fallback), fallback) : fallback;
        },
        set(key, value) {
            return available ? safeCall(() => { setValue(key, value); return true; }, false) : false;
        },
        remove(key) {
            return available ? safeCall(() => { deleteValue(key); return true; }, false) : false;
        },
        readJson(key, fallback = null) {
            const value = this.get(key);
            return typeof value === 'string' ? safeCall(() => JSON.parse(value), fallback) : fallback;
        },
        writeJson(key, value) {
            return this.set(key, JSON.stringify(value));
        },
        migrateFrom(storage, key) {
            if (!available || this.get(key) !== null) return false;
            const value = storage.get(key);
            if (value === null || !this.set(key, value)) return false;
            storage.remove(key);
            return true;
        }
    });
}
