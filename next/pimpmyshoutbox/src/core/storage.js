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
