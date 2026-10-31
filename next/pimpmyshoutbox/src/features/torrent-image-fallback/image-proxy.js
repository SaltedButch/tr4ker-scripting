/**
 * Extrait l'URL d'origine d'une image servie par le proxy Tr4ker.
 *
 * @module src/features/torrent-image-fallback/image-proxy
 */
export function getOriginalImageUrl(source, pageUrl) {
    if (!source) return null;
    try {
        const page = new URL(pageUrl);
        const proxy = new URL(source, page);
        if (proxy.origin !== page.origin || proxy.pathname !== '/api/proxy/image') return null;
        const original = new URL(proxy.searchParams.get('url'));
        if (!['http:', 'https:'].includes(original.protocol) || original.username || original.password) return null;
        if (original.origin === page.origin && original.pathname === '/api/proxy/image') return null;
        return original.href;
    } catch {
        return null;
    }
}
