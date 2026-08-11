import { createMediaButton, createMediaMenu, hideMediaMenu, insertImageMarkup, positionMediaMenu, showMediaMenu } from '../../core/media-menu.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createT9EmojClient } from './client.js';
import { renderT9EmojSettings } from './settings.js';

function status(target, message, error = false) { target.textContent = message; target.style.color = error ? '#fca5a5' : '#cbd5f5'; }

export default defineFeature({
    id: 't9-emoj',
    label: 'T9 Emoj',
    defaultEnabled: false,
    legacyEnabledStorageKey: 'tm_t4_t9_emoj_enabled',
    pages: ['chat'],
    storageKeys: ['tm_t4_t9_emoj_enabled', 'tm_t4_t9_emoj_manifest_cache', 'tm_t4_klipy_gateway_client_id'],
    settings: { area: 'shoutbox', category: 'media', order: 20, render: renderT9EmojSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Utilisez le bouton T9 Emoj au-dessus du champ de message pour insérer une émoticône.', kind: 'info', order: 10 }],
    setup(context) {
        const client = createT9EmojClient({ storage: context.storage, http: context.http });
        const button = createMediaButton({ label: 'T9 Emoj', title: 'Ouvrir les émoticônes', colors: { background: 'linear-gradient(135deg,rgba(109,40,217,.82),rgba(79,70,229,.82))', border: 'rgba(196,181,253,.35)', text: '#f5f3ff' } });
        const menu = createMediaMenu({ width: 420, maxHeight: '70vh' });
        menu.setAttribute('aria-label', 'T9 Emoj');
        const title = document.createElement('strong'); title.textContent = 'T9 Emoj';
        const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Rechercher une émoticône'; search.setAttribute('aria-label', 'Rechercher une émoticône'); search.style.cssText = 'width:100%;margin-top:10px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#0f172a;color:#f8fafc;padding:9px 11px;';
        const feedback = document.createElement('div'); feedback.style.cssText = 'margin-top:8px;min-height:17px;font-size:11px;';
        const results = document.createElement('div'); results.style.cssText = 'display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;max-height:390px;overflow:auto;margin-top:8px;';
        menu.append(title, search, feedback, results);
        let items = [];
        function render() {
            const query = search.value.trim().toLocaleLowerCase('fr');
            const visible = items.filter((item) => !query || item.id.toLocaleLowerCase('fr').includes(query) || item.filename.toLocaleLowerCase('fr').includes(query));
            results.replaceChildren();
            if (!visible.length) { const empty = document.createElement('div'); empty.textContent = 'Aucune émoticône trouvée.'; empty.style.cssText = 'grid-column:1/-1;padding:12px;text-align:center;color:#94a3b8;font-size:11px;'; results.append(empty); }
            for (const item of visible) {
                const card = document.createElement('button'); card.type = 'button'; card.title = item.id; card.setAttribute('aria-label', `Insérer ${item.id}`); card.style.cssText = 'display:grid;place-items:center;aspect-ratio:1;padding:5px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#0f172a;cursor:pointer;';
                const image = document.createElement('img'); image.src = item.url; image.alt = item.id; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.style.cssText = 'width:100%;height:100%;max-height:42px;object-fit:contain;'; card.append(image);
                card.addEventListener('click', () => { const result = insertImageMarkup(context.input.get(), item.url, context.input, 'Émoticône insérée.'); context.ui.toast.show(result.message, { error: !result.ok }); if (result.ok) hideMediaMenu(menu); }); results.append(card);
            }
            status(feedback, `${visible.length} émoticône${visible.length > 1 ? 's' : ''}.`);
            window.requestAnimationFrame(() => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); });
        }
        async function load() {
            status(feedback, 'Chargement des émoticônes…');
            try { items = await client.load(); render(); } catch (error) { status(feedback, `Impossible de charger les émoticônes : ${error.message || 'erreur inconnue.'}`, true); }
        }
        search.addEventListener('input', render);
        search.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(menu); });
        button.addEventListener('click', () => { if (menu.dataset.tmOpen === '1') hideMediaMenu(menu); else { showMediaMenu(menu, button); if (!items.length) void load(); search.focus(); } });
        context.on(document, 'click', (event) => { if (event.target instanceof Node && !menu.contains(event.target) && !button.contains(event.target)) hideMediaMenu(menu); });
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(menu); });
        context.on(window, 'resize', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); });
        context.on(window, 'scroll', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); }, true);
        context.mediaToolbar.mount('t9-emoj', button);
        context.every(1000, () => context.mediaToolbar.refresh());
        return () => { context.mediaToolbar.unmount('t9-emoj'); menu.remove(); };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
