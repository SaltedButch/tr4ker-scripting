/**
 * Implémente la feature « Imgbb Upload » et son cycle de vie.
 *
 * @module src/features/imgbb-upload/feature
 */
import { createMediaButton, createMediaMenu, hideMediaMenu, positionMediaMenu, showMediaMenu } from '../../core/media-menu.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createImageCatalog } from './catalog.js';
import { renderImageCatalog } from './catalog-ui.js';
import { renderImgBbSettings } from './settings.js';

const API_KEY_STORAGE = 'tm_t4_imgbb_api_key';
const EXPIRATION_STORAGE = 'tm_t4_image_hosting_expiration_seconds';
const MAX_BYTES = 32 * 1024 * 1024;
const EXPIRATIONS = new Set([0, 600, 3600, 86400, 604800, 2592000, 15552000]);
const EXPIRATION_OPTIONS = Object.freeze([
    [0, 'Permanent'], [600, '10 min'], [3600, '1 h'], [86400, '1 jour'],
    [604800, '7 jours'], [2592000, '30 jours'], [15552000, '180 jours']
]);

function fileLabel(file) { return `${file.name || 'image'} (${(file.size / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo)`; }
function imageFiles(files) { return [...(files || [])].filter((file) => file instanceof File && /^image\//i.test(file.type || '') && file.size > 0 && file.size <= MAX_BYTES); }
function expiration(storage) { const value = Number.parseInt(storage.get(EXPIRATION_STORAGE) || '0', 10) || 0; return EXPIRATIONS.has(value) ? value : 0; }

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'imgbb-upload',
    label: 'Upload ImgBB',
    defaultEnabled: false,
    legacyEnabledStorageKey: 'tm_t4_image_hosting_enabled',
    pages: ['chat'],
    storageKeys: ['tm_t4_image_hosting_enabled', 'tm_t4_image_hosting_expiration_seconds'],
    settings: { area: 'shoutbox', category: 'media', order: 30, render: renderImgBbSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Ajoute un bouton Up-Img pour choisir, coller ou glisser une image puis l’insérer dans le message.', kind: 'info', order: 10 }],
    setup(context) {
        const catalog = createImageCatalog({ storage: context.storage, http: context.http });
        const runtime = { context, catalog };
        context.imgbbUpload = runtime;
        const button = createMediaButton({ label: '↑ Up-Img', title: 'Uploader ou insérer une image', colors: { background: 'linear-gradient(135deg,rgba(2,132,199,.84),rgba(14,116,144,.84))', border: 'rgba(125,211,252,.30)', text: '#ecfeff' } });
        const menu = createMediaMenu({ width: 520, maxHeight: '76vh' }); menu.setAttribute('aria-label', 'Upload d’image');
        const title = document.createElement('strong'); title.textContent = 'Upload d’image';
        const expirationRow = document.createElement('label'); expirationRow.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px;font-size:12px;color:#cbd5e1;';
        expirationRow.append(document.createTextNode('Durée de vie'));
        const expirationSelect = document.createElement('select'); expirationSelect.setAttribute('aria-label', 'Durée de vie des images'); expirationSelect.style.cssText = 'background:rgba(15,23,42,.75);color:#f8fafc;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 9px;outline:none;font-size:12px;cursor:pointer;';
        for (const [value, label] of EXPIRATION_OPTIONS) { const option = document.createElement('option'); option.value = String(value); option.textContent = label; expirationSelect.append(option); }
        expirationRow.append(expirationSelect);
        const drop = document.createElement('div'); drop.tabIndex = 0; drop.style.cssText = 'margin-top:10px;padding:14px;border:1px dashed rgba(56,189,248,.5);border-radius:13px;background:rgba(14,165,233,.08);color:#e0f2fe;';
        const dropTitle = document.createElement('div'); dropTitle.textContent = 'Collez, glissez ou choisissez une image'; dropTitle.style.fontWeight = '700';
        const pick = createMediaButton({ label: 'Choisir une image', title: 'Choisir une image', colors: { background: '#0284c7', text: '#fff' } }); pick.style.marginTop = '9px';
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = true; input.style.display = 'none'; drop.append(dropTitle, pick, input);
        const pending = document.createElement('div'); pending.style.cssText = 'display:grid;gap:5px;margin-top:10px;font-size:11px;color:#cbd5e1;';
        const insertAfter = document.createElement('label'); insertAfter.style.cssText = 'display:flex;align-items:center;gap:7px;margin-top:10px;font-size:12px;color:#d4d4d8;cursor:pointer;'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = true; insertAfter.append(checkbox, document.createTextNode('Insérer les images après l’upload'));
        const upload = createMediaButton({ label: 'Uploader', title: 'Uploader les images', colors: { background: '#0f766e', text: '#fff' } }); upload.style.cssText += 'margin-top:10px;';
        const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:18px;margin-top:8px;font-size:11px;line-height:1.45;color:#cbd5f5;';
        const directRow = document.createElement('div'); directRow.style.cssText = 'display:flex;gap:7px;margin-top:12px;';
        const directUrl = document.createElement('input'); directUrl.type = 'url'; directUrl.placeholder = 'Ajouter un lien direct image'; directUrl.style.cssText = 'flex:1;min-width:0;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#0f172a;color:#fff;padding:8px;';
        const addDirect = createMediaButton({ label: 'Ajouter', title: 'Ajouter le lien au catalogue', colors: { background: '#3f3f46', text: '#fff' } }); directRow.append(directUrl, addDirect);
        const catalogHeader = document.createElement('div'); catalogHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;';
        const catalogTitle = document.createElement('strong'); catalogTitle.textContent = 'Catalogue'; catalogTitle.style.fontSize = '12px';
        const catalogActions = document.createElement('div'); catalogActions.style.cssText = 'display:flex;gap:6px;';
        const purge = createMediaButton({ label: 'Vérifier / purger', title: 'Vérifier les liens du catalogue', colors: { background: '#3f3f46', text: '#fff' } });
        const clear = createMediaButton({ label: 'Vider local', title: 'Vider le catalogue local', colors: { background: '#3f3f46', text: '#fca5a5' } }); catalogActions.append(purge, clear); catalogHeader.append(catalogTitle, catalogActions);
        const catalogList = document.createElement('div'); catalogList.style.cssText = 'display:grid;gap:7px;margin-top:8px;max-height:250px;overflow:auto;padding-right:2px;';
        menu.append(title, expirationRow, drop, pending, insertAfter, upload, directRow, catalogHeader, catalogList, feedback);
        let files = [];
        const renderPending = () => { pending.replaceChildren(); if (!files.length) { pending.textContent = 'Aucune image sélectionnée.'; } else { for (const file of files) { const row = document.createElement('div'); row.textContent = fileLabel(file); pending.append(row); } } window.requestAnimationFrame(() => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); }); };
        const setFeedback = (message, error = false) => { feedback.textContent = message; feedback.style.color = error ? '#fca5a5' : '#cbd5f5'; };
        const syncExpiration = () => { expirationSelect.value = String(expiration(context.storage)); };
        const refreshCatalog = renderImageCatalog(catalogList, runtime, { limit: 8, compact: true, onChange: (message, error = false) => { setFeedback(message, error); refreshCatalog(); } });
        const addFiles = (nextFiles) => { const accepted = imageFiles(nextFiles); const rejected = [...(nextFiles || [])].length - accepted.length; files = [...files, ...accepted]; renderPending(); if (rejected) setFeedback(`Certaines images sont invalides ou dépassent 32 Mo.`, true); };
        async function uploadFiles() {
            if (!files.length) { setFeedback('Choisissez au moins une image.', true); return; }
            const key = String(context.storage.get(API_KEY_STORAGE) || '').trim().replace(/\s+/g, '');
            if (!key) { setFeedback('Renseignez votre clé API ImgBB dans les réglages.', true); return; }
            upload.disabled = true; const records = [];
            try {
                for (const file of files) {
                    setFeedback(`Upload en cours : ${file.name || 'image'}…`);
                    records.push(await catalog.upload(file, key, expiration(context.storage)));
                }
                if (checkbox.checked) { const result = context.input.insert(context.input.get(), records.map((record) => `[img]${record.url}[/img]`).join(' '), { successMessage: 'Images insérées.' }); if (!result.ok) throw new Error(result.message); }
                files = []; renderPending(); refreshCatalog(); setFeedback(`${records.length} image${records.length > 1 ? 's' : ''} uploadée${records.length > 1 ? 's' : ''}${checkbox.checked ? ' et insérée' : ''}.`); if (checkbox.checked) hideMediaMenu(menu);
            } catch (error) { setFeedback(error.message || 'Upload ImgBB impossible.', true); } finally { upload.disabled = false; }
        }
        pick.addEventListener('click', () => input.click()); input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
        expirationSelect.addEventListener('change', () => {
            const selected = expirationSelect.selectedOptions[0]?.textContent || 'Permanent';
            context.storage.set(EXPIRATION_STORAGE, expirationSelect.value);
            syncExpiration();
            setFeedback(`Durée de vie : ${selected}.`);
        });
        drop.addEventListener('dragover', (event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; });
        drop.addEventListener('drop', (event) => { event.preventDefault(); addFiles(event.dataTransfer?.files); });
        drop.addEventListener('paste', (event) => { const next = event.clipboardData?.files; if (next?.length) { event.preventDefault(); addFiles(next); } }); upload.addEventListener('click', () => void uploadFiles());
        addDirect.addEventListener('click', async () => { setFeedback('Validation du lien image…'); const result = await catalog.addDirect(directUrl.value); setFeedback(result.message, !result.ok); if (result.ok) directUrl.value = ''; refreshCatalog(); });
        directUrl.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addDirect.click(); } });
        purge.addEventListener('click', async () => { setFeedback('Vérification des liens images…'); const result = await catalog.purge(); setFeedback(result.message, !result.ok); refreshCatalog(); });
        clear.addEventListener('click', () => { if (!window.confirm('Vider le catalogue local ?')) return; const result = catalog.clear(); setFeedback(result.message, !result.ok); refreshCatalog(); });
        button.addEventListener('click', () => { if (menu.dataset.tmOpen === '1') hideMediaMenu(menu); else { syncExpiration(); showMediaMenu(menu, button); renderPending(); } });
        context.on(document, 'paste', (event) => { const target = event.target; if (!(target instanceof HTMLElement) || target !== context.input.get()) return; if (!event.clipboardData?.files?.length) return; event.preventDefault(); addFiles(event.clipboardData.files); showMediaMenu(menu, button); });
        context.on(document, 'click', (event) => { if (event.target instanceof Node && !menu.contains(event.target) && !button.contains(event.target)) hideMediaMenu(menu); });
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(menu); });
        context.on(window, 'resize', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); });
        context.on(window, 'scroll', () => { if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, button); }, true);
        context.mediaToolbar.mount('imgbb-upload', button); context.every(1000, () => context.mediaToolbar.refresh());
        return () => { delete context.imgbbUpload; context.mediaToolbar.unmount('imgbb-upload'); menu.remove(); };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
