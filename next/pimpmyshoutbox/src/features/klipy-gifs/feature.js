import { createMediaButton, createMediaMenu, hideMediaMenu, insertImageMarkup, positionMediaMenu, showMediaMenu } from '../../core/media-menu.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createKlipyClient } from './client.js';
import { createKlipyPoweredBy } from './powered-by.js';
import { renderKlipySettings } from './settings.js';

const MENU_ID = 'tm-t4-next-klipy-menu';

function setStatus(status, message, error = false) {
    status.textContent = message;
    status.style.color = error ? '#fca5a5' : '#cbd5f5';
}

export default defineFeature({
    id: 'klipy-gifs',
    label: 'GIF Klipy',
    defaultEnabled: true,
    legacyEnabledStorageKey: 'tm_t4_klipy_gifs_enabled',
    pages: ['chat'],
    storageKeys: ['tm_t4_klipy_gifs_enabled', 'tm_t4_klipy_gateway_client_id'],
    settings: { area: 'shoutbox', category: 'media', order: 10, render: renderKlipySettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Utilisez le bouton GIF au-dessus du champ de message pour rechercher une animation.', kind: 'info', order: 10 }],
    setup(context) {
        const client = createKlipyClient({ storage: context.storage, http: context.http });
        const button = createMediaButton({ label: '🎞 GIF', title: 'Ouvrir le picker GIF', colors: { background: 'linear-gradient(135deg,rgba(21,128,61,.82),rgba(5,150,105,.82))', border: 'rgba(74,222,128,.28)', text: '#ecfdf5' } });
        const menu = createMediaMenu({ width: 640, maxHeight: '76vh' });
        menu.id = MENU_ID;
        menu.setAttribute('aria-label', 'GIF Klipy');
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;';
        const title = document.createElement('strong'); title.textContent = 'GIF Klipy';
        const provider = document.createElement('a'); provider.href = 'https://klipy.com/'; provider.target = '_blank'; provider.rel = 'noopener noreferrer'; provider.textContent = 'KLIPY'; provider.style.cssText = 'font-size:11px;color:#86efac;text-decoration:none;font-weight:700;';
        header.append(title, provider);
        const search = document.createElement('input');
        search.type = 'search'; search.placeholder = 'Rechercher sur Klipy'; search.setAttribute('aria-label', 'Rechercher un GIF');
        search.style.cssText = 'width:100%;margin-top:10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#0f172a;color:#f8fafc;padding:9px 11px;';
        const status = document.createElement('div'); status.style.cssText = 'margin-top:8px;min-height:17px;font-size:11px;color:#cbd5f5;';
        const results = document.createElement('div'); results.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:420px;overflow:auto;margin-top:8px;';
        const more = createMediaButton({ label: 'Afficher plus', title: 'Afficher plus de GIF', colors: { background: 'rgba(22,163,74,.18)', border: 'rgba(74,222,128,.22)', text: '#dcfce7' } });
        more.style.cssText += 'display:none;margin:10px auto 0;';
        const searchRow = document.createElement('div');
        searchRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;min-width:0;';
        search.style.marginTop = '0';
        searchRow.append(search, createKlipyPoweredBy());
        menu.append(header, searchRow, status, results, more);
        let debounce = 0;
        let requestId = 0;
        function render(items, append) {
            if (!append) results.replaceChildren();
            if (!items.length && !append) { const empty = document.createElement('div'); empty.textContent = 'Aucun GIF disponible.'; empty.style.cssText = 'grid-column:1/-1;padding:12px;text-align:center;color:#94a3b8;'; results.append(empty); }
            for (const item of items) {
                const card = document.createElement('button'); card.type = 'button'; card.title = item.title; card.style.cssText = 'min-width:0;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px;background:rgba(255,255,255,.04);color:#e2e8f0;cursor:pointer;text-align:left;';
                const image = document.createElement('img'); image.src = item.previewUrl; image.alt = item.title; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.style.cssText = `display:block;width:100%;aspect-ratio:${item.width && item.height ? `${item.width}/${item.height}` : '1/1'};max-height:140px;object-fit:cover;border-radius:7px;background:#0f172a;`;
                const caption = document.createElement('div'); caption.textContent = item.title; caption.style.cssText = 'margin-top:5px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
                card.append(image, caption); card.addEventListener('click', () => { const result = insertImageMarkup(context.input.get(), item.gifUrl, context.input, 'GIF inséré.'); context.ui.toast.show(result.message, { error: !result.ok }); if (result.ok) hideMediaMenu(menu); }); results.append(card);
            }
        }
        async function load({ append = false } = {}) {
            const raw = search.value.trim(); const query = raw.length >= 2 ? raw : ''; const cursor = append ? menu.dataset.next || '' : '';
            if (append && !cursor) return;
            const id = ++requestId; setStatus(status, query ? `Recherche : ${query}` : raw ? 'Tapez au moins 2 caractères pour rechercher.' : 'Chargement des tendances…'); more.style.display = 'none';
            try { const payload = await client.fetchFeed({ query, cursor }); if (id !== requestId) return; render(payload.results, append); menu.dataset.next = payload.next; more.style.display = payload.next ? 'block' : 'none'; setStatus(status, payload.results.length ? (query ? `Résultats pour « ${query} »` : 'Tendances Klipy') : 'Aucun GIF trouvé.', !payload.results.length); window.requestAnimationFrame(() => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); }); }
            catch (error) { if (id === requestId) setStatus(status, `Impossible de charger les GIF : ${error.message || 'erreur inconnue.'}`, true); }
        }
        button.addEventListener('click', (event) => { event.preventDefault(); if (menu.dataset.tmOpen === '1') hideMediaMenu(menu); else { showMediaMenu(menu, button); if (!menu.dataset.loaded) { menu.dataset.loaded = '1'; void load(); } search.focus(); } });
        search.addEventListener('input', () => { window.clearTimeout(debounce); debounce = window.setTimeout(() => void load(), 280); });
        search.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(menu); if (event.key === 'Enter') { event.preventDefault(); void load(); } });
        more.addEventListener('click', () => void load({ append: true }));
        context.on(document, 'click', (event) => { if (event.target instanceof Node && !menu.contains(event.target) && !button.contains(event.target)) hideMediaMenu(menu); });
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(menu); });
        context.on(window, 'resize', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); });
        context.on(window, 'scroll', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); }, true);
        context.mediaToolbar.mount('klipy-gifs', button);
        context.every(1000, () => context.mediaToolbar.refresh());
        return () => { window.clearTimeout(debounce); context.mediaToolbar.unmount('klipy-gifs'); menu.remove(); };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
