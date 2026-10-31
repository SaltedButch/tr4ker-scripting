/**
 * Gère le chargement direct des images, à la demande ou par défaut.
 *
 * @module src/features/torrent-image-fallback/feature
 */
import { defineFeature } from '../../core/feature-registry.js';
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { getOriginalImageUrl } from './image-proxy.js';
import { DIRECT_IMAGES_STORAGE_KEY, renderImageFallbackSettings } from './settings.js';

const PANEL_ID = 'tm-t4-next-torrent-image-fallback';
const STYLE_ID = `${PANEL_ID}-style`;
const SLOW_IMAGE_MS = 8_000;
const CSS = `
#${PANEL_ID}{position:fixed;right:18px;bottom:18px;z-index:99980;display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:calc(100vw - 36px);box-sizing:border-box;padding:10px 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(24,24,27,.97);color:#e4e4e7;box-shadow:0 8px 24px rgba(0,0,0,.35);font:12px/1.4 system-ui,sans-serif}
#${PANEL_ID}[hidden],#${PANEL_ID} [hidden]{display:none!important}
#${PANEL_ID} button{padding:6px 9px;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:#27272a;color:#fff;font:inherit;cursor:pointer}
#${PANEL_ID} button:hover{background:#3f3f46}
#${PANEL_ID} button:focus-visible{outline:2px solid #a3e635;outline-offset:2px}
`;

function hasStartedLoading(image) {
    if (image.loading !== 'lazy') return true;
    const bounds = image.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.right > 0
        && bounds.top < window.innerHeight && bounds.left < window.innerWidth;
}

function restoreImage(image, record) {
    const saved = record.saved;
    if (!saved || image.getAttribute('src') !== record.originalUrl) return;
    // Ne pas écraser un changement ultérieur effectué par le site.
    if (image.getAttribute('referrerpolicy') === 'no-referrer') {
        if (saved.referrerPolicy === null) image.removeAttribute('referrerpolicy');
        else image.setAttribute('referrerpolicy', saved.referrerPolicy);
    }
    if (!image.hasAttribute('srcset') && saved.srcset !== null) image.setAttribute('srcset', saved.srcset);
    if (!image.style.display && saved.display === 'none') image.style.display = saved.display;
    for (const { source, srcset } of saved.pictureSources) {
        if (!source.hasAttribute('srcset')) source.setAttribute('srcset', srcset);
    }
    image.setAttribute('src', record.proxySrc);
}

export default defineFeature({
    id: 'torrent-image-fallback',
    label: 'Bypass proxy tr4ker pour les images',
    defaultEnabled: true,
    pages: ['torrent'],
    storageKeys: [DIRECT_IMAGES_STORAGE_KEY],
    settings: { area: 'site', category: 'site', order: 20, render: renderImageFallbackSettings },
    hints: [
        { id: 'usage', title: 'Utilisation', text: 'En mode à la demande, sur une fiche ou le catalogue de torrents, un bouton apparaît si des images échouent ou attendent plus de 8 secondes. Cliquez pour charger uniquement ces images depuis leur URL d’origine.', kind: 'tip', order: 10 },
        { id: 'direct', title: 'Chargement direct', text: 'Activez « Toujours charger les images depuis leur source » pour éviter l’attente sur les prochaines pages. Les images sont demandées directement à leurs hébergeurs. « Revenir au proxy » suspend ce choix pour la page courante.', kind: 'info', order: 20 }
    ],
    setup(context) {
        const images = new Map();
        let route = location.pathname + location.search;
        let panel = null;
        let directByDefault = context.storage.readBoolean(DIRECT_IMAGES_STORAGE_KEY, false);
        let proxyForPage = false;
        let automaticAttempts = new WeakMap();

        function reset() {
            for (const [image, record] of images) restoreImage(image, record);
            images.clear();
            automaticAttempts = new WeakMap();
            panel?.remove();
            panel = null;
        }

        function pendingImages() {
            const now = performance.now();
            return [...images].filter(([image, record]) => !record.saved
                && !(image.complete && image.naturalWidth > 0)
                && (record.failed || (record.startedAt !== null && now - record.startedAt >= SLOW_IMAGE_MS)));
        }

        function loadOriginal(image, record) {
            record.saved = {
                referrerPolicy: image.getAttribute('referrerpolicy'),
                display: image.style.display,
                srcset: image.getAttribute('srcset'),
                pictureSources: [...(image.closest('picture')?.querySelectorAll('source[srcset]') || [])]
                    .map((source) => ({ source, srcset: source.getAttribute('srcset') }))
            };
            image.setAttribute('referrerpolicy', 'no-referrer');
            if (image.style.display === 'none') image.style.removeProperty('display');
            image.removeAttribute('srcset');
            record.saved.pictureSources.forEach(({ source }) => source.removeAttribute('srcset'));
            image.setAttribute('src', record.originalUrl);
        }

        function useOriginals() {
            sync();
            for (const [image, record] of pendingImages()) loadOriginal(image, record);
            sync();
        }

        function mountPanel() {
            if (panel?.isConnected) return;
            panel = document.createElement('div');
            panel.id = PANEL_ID;
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-label', 'Bypass proxy tr4ker pour les images');
            const status = document.createElement('span');
            status.setAttribute('data-tm-image-fallback-status', '');
            status.setAttribute('role', 'status');
            const direct = document.createElement('button');
            direct.type = 'button';
            direct.setAttribute('data-tm-image-fallback-direct', '');
            direct.title = 'Charger les images lentes ou indisponibles directement auprès de leurs hébergeurs';
            const restore = document.createElement('button');
            restore.type = 'button';
            restore.setAttribute('data-tm-image-fallback-restore', '');
            restore.textContent = 'Revenir au proxy';
            restore.title = 'Utiliser le proxy pour cette page';
            panel.append(status, direct, restore);
            document.body.append(panel);
        }

        function render() {
            const pending = pendingImages().length;
            const direct = [...images.values()].filter((record) => record.saved).length;
            if (!pending && !direct) {
                if (panel) panel.hidden = true;
                return;
            }
            if (!document.body) return;
            mountPanel();
            panel.hidden = false;
            const status = panel.querySelector('[data-tm-image-fallback-status]');
            const text = pending
                ? `${pending} image${pending > 1 ? 's' : ''} lente${pending > 1 ? 's' : ''} ou indisponible${pending > 1 ? 's' : ''}.`
                : `${direct} image${direct > 1 ? 's' : ''} via l’original.`;
            if (status.textContent !== text) status.textContent = text;
            const button = panel.querySelector('[data-tm-image-fallback-direct]');
            button.hidden = !pending;
            const label = `Afficher les images d’origine (${pending})`;
            if (button.textContent !== label) button.textContent = label;
            panel.querySelector('[data-tm-image-fallback-restore]').hidden = !direct;
        }

        function sync() {
            const nextDirectByDefault = context.storage.readBoolean(DIRECT_IMAGES_STORAGE_KEY, false);
            if (directByDefault !== nextDirectByDefault) {
                reset();
                directByDefault = nextDirectByDefault;
                proxyForPage = false;
            }
            const nextRoute = location.pathname + location.search;
            if (route !== nextRoute) {
                reset();
                route = nextRoute;
                proxyForPage = false;
            }
            if (!context.platform.isTorrentPage()) {
                reset();
                return;
            }
            const root = document.querySelector('main');
            for (const [image, record] of images) {
                const expected = record.saved ? record.originalUrl : record.proxySrc;
                if (!root?.contains(image) || image.getAttribute('src') !== expected) {
                    restoreImage(image, record);
                    images.delete(image);
                }
            }
            for (const image of root?.querySelectorAll('img[src]') || []) {
                if (images.get(image)?.saved) continue;
                const proxySrc = image.getAttribute('src');
                const originalUrl = getOriginalImageUrl(proxySrc, location.href);
                if (!originalUrl) continue;
                let record = images.get(image);
                if (!record) {
                    record = { proxySrc, originalUrl, startedAt: null, failed: false, saved: null };
                    images.set(image, record);
                }
                if (image.complete && image.naturalWidth > 0) record.failed = false;
                else if (image.complete) record.failed = true;
                if (record.startedAt === null && hasStartedLoading(image)) record.startedAt = performance.now();
                if (directByDefault && !proxyForPage) {
                    const attempted = automaticAttempts.get(image) || new Set();
                    // Un fallback natif ne doit pas relancer indéfiniment la même source en échec.
                    if (!attempted.has(originalUrl)) {
                        attempted.add(originalUrl);
                        automaticAttempts.set(image, attempted);
                        loadOriginal(image, record);
                    }
                }
            }
            render();
        }

        context.ensureStyle(STYLE_ID, CSS);
        context.on(document, 'error', (event) => {
            const image = event.target;
            if (!(image instanceof HTMLImageElement)) return;
            sync();
            const record = images.get(image);
            if (record && !record.saved) {
                record.failed = true;
                render();
            }
        }, true);
        context.on(document, 'load', (event) => {
            if (event.target instanceof HTMLImageElement) sync();
        }, true);
        context.on(document, 'click', (event) => {
            const button = event.target instanceof Element ? event.target.closest(`#${PANEL_ID} button`) : null;
            if (!button) return;
            if (button.hasAttribute('data-tm-image-fallback-direct')) useOriginals();
            else if (button.hasAttribute('data-tm-image-fallback-restore')) {
                proxyForPage = true;
                reset();
                sync();
            }
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, sync);
        context.on(window, 'storage', (event) => {
            if (event.key === DIRECT_IMAGES_STORAGE_KEY || event.key === null) sync();
        });
        context.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] }, sync);
        context.every(1_000, sync);
        context.torrentImageFallback = { sync };
        sync();
        return () => { delete context.torrentImageFallback; reset(); };
    },
    onRoute(context) { context.torrentImageFallback?.sync(); }
});
