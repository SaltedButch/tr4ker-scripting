/**
 * Encapsule les requêtes HTTP internes et externes avec gestion d'erreurs.
 *
 * @module src/core/http
 */
function createRequestError(message, response) {
    return new Error(`${message}${response?.status ? ` (HTTP ${response.status})` : ''}`);
}

/**
 * Crée l'API publique « createHttpClient ».
 *
 * @function createHttpClient
 */
export function createHttpClient({ gmRequest = globalThis.GM_xmlhttpRequest } = {}) {
    function external(url, options = {}) {
        if (typeof gmRequest !== 'function') {
            return Promise.reject(new Error('GM_xmlhttpRequest est indisponible. La feature doit déclarer ce grant Tampermonkey.'));
        }

        return new Promise((resolve, reject) => {
            gmRequest({
                method: String(options.method || 'GET').toUpperCase(),
                url: String(url || ''),
                headers: options.headers && typeof options.headers === 'object' ? options.headers : {},
                data: options.body,
                timeout: Math.max(0, Number(options.timeout) || 30000),
                responseType: options.responseType || 'text',
                anonymous: options.credentials === 'omit',
                onload(response) {
                    const rawResponse = response?.responseText ?? response?.response ?? '';
                    const responseText = typeof rawResponse === 'string' ? rawResponse : '';
                    const normalized = {
                        status: Number(response?.status) || 0,
                        ok: Number(response?.status) >= 200 && Number(response?.status) < 300,
                        response: response?.response,
                        responseText,
                        text: async () => responseText,
                        json: async () => JSON.parse(responseText)
                    };
                    resolve(normalized);
                },
                onerror: (response) => reject(createRequestError('Requête externe impossible', response)),
                ontimeout: () => reject(new Error('Requête externe expirée.')),
                onabort: () => reject(new Error('Requête externe annulée.'))
            });
        });
    }

    return Object.freeze({
        external,
        async externalJson(url, options) {
            const response = await external(url, options);
            if (!response.ok) throw createRequestError('Requête externe refusée', response);
            return response.json();
        },
        async externalArrayBuffer(url, options = {}) {
            const response = await external(url, { ...options, responseType: 'arraybuffer' });
            if (!response.ok || !(response.response instanceof ArrayBuffer)) {
                throw createRequestError('Téléchargement binaire impossible', response);
            }
            return response.response;
        }
    });
}
