/**
 * Construit le panneau de réglages de la feature « Imgbb Upload ».
 *
 * @module src/features/imgbb-upload/settings
 */
import { renderImageCatalog } from './catalog-ui.js';
import { API_KEY_STORAGE } from './storage-keys.js';

const EXPIRATION_STORAGE = 'tm_t4_image_hosting_expiration_seconds';
const EXPIRATIONS = [[0, 'Permanent'], [600, '10 min'], [3600, '1 h'], [86400, '1 jour'], [604800, '7 jours'], [2592000, '30 jours'], [15552000, '180 jours']];

const CONTROL = 'border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:7px 8px;';

/**
 * Rend l'interface produite par « renderImgBbSettings ».
 *
 * @function renderImgBbSettings
 */
export function renderImgBbSettings(container, { context, refresh }) {
    if (!context) { container.textContent = 'Active la feature pour configurer ImgBB.'; return; }
    context.secrets.migrateFrom(context.storage, API_KEY_STORAGE);
    const note = document.createElement('div'); note.style.cssText = 'margin-bottom:10px;font-size:12px;line-height:1.45;color:#a1a1aa;'; note.textContent = 'Configurez votre clé ImgBB puis utilisez le bouton Up-Img au-dessus du champ de message. La clé est stockée uniquement dans le coffre-fort du gestionnaire de userscripts.';
    const keyRow = document.createElement('div'); keyRow.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;';
    const key = document.createElement('input'); key.type = 'password'; key.autocomplete = 'off'; key.placeholder = 'Clé API ImgBB'; key.value = context.secrets.get(API_KEY_STORAGE) || ''; key.style.cssText = `${CONTROL}flex:1 1 190px;min-width:0;`;
    const save = document.createElement('button'); save.type = 'button'; save.textContent = 'Enregistrer'; save.style.cssText = 'border:0;border-radius:7px;background:#2563eb;color:#fff;padding:7px 10px;cursor:pointer;font-weight:650;';
    const getKey = document.createElement('button'); getKey.type = 'button'; getKey.textContent = 'Obtenir une clé'; getKey.style.cssText = 'border:0;border-radius:7px;background:#3f3f46;color:#fff;padding:7px 10px;cursor:pointer;';
    save.addEventListener('click', () => { const value = key.value.trim().replace(/\s+/g, ''); const saved = value ? context.secrets.set(API_KEY_STORAGE, value) : context.secrets.remove(API_KEY_STORAGE); context.ui.toast.show(saved ? (value ? 'Clé API ImgBB enregistrée.' : 'Clé API ImgBB retirée.') : 'Stockage sécurisé ImgBB indisponible.', { error: !saved }); });
    getKey.addEventListener('click', () => window.open('https://api.imgbb.com/', '_blank', 'noopener,noreferrer'));
    keyRow.append(key, save, getKey);
    const expirationRow = document.createElement('label'); expirationRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;font-size:12px;color:#d4d4d8;'; expirationRow.append(document.createTextNode('Durée de vie par défaut'));
    const expiration = document.createElement('select'); expiration.style.cssText = CONTROL;
    const savedExpiration = String(context.storage.get(EXPIRATION_STORAGE) || '0');
    for (const [value, label] of EXPIRATIONS) { const option = document.createElement('option'); option.value = String(value); option.textContent = label; option.selected = option.value === savedExpiration; expiration.append(option); }
    expiration.addEventListener('change', () => { context.storage.set(EXPIRATION_STORAGE, expiration.value); context.ui.toast.show(`Durée de vie définie sur ${expiration.selectedOptions[0]?.textContent || 'Permanent'}.`); refresh(); });
    expirationRow.append(expiration);
    container.append(note, keyRow, expirationRow);

    const runtime = context.imgbbUpload;
    if (!runtime) return;
    const directRow = document.createElement('div'); directRow.style.cssText = 'display:flex;gap:7px;margin-top:14px;';
    const directUrl = document.createElement('input'); directUrl.type = 'url'; directUrl.placeholder = 'Ajouter un lien direct image'; directUrl.style.cssText = `${CONTROL}flex:1;min-width:0;`;
    const addDirect = document.createElement('button'); addDirect.type = 'button'; addDirect.textContent = 'Ajouter lien'; addDirect.style.cssText = 'border:0;border-radius:7px;background:#0f766e;color:#fff;padding:7px 9px;cursor:pointer;font-weight:650;'; directRow.append(directUrl, addDirect);
    const catalogHeader = document.createElement('div'); catalogHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;';
    const catalogTitle = document.createElement('strong'); catalogTitle.textContent = 'Catalogue'; catalogTitle.style.fontSize = '13px';
    const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
    const purge = document.createElement('button'); purge.type = 'button'; purge.textContent = 'Vérifier / purger'; purge.style.cssText = 'border:0;border-radius:7px;background:#3f3f46;color:#fff;padding:6px 8px;cursor:pointer;font-size:11px;';
    const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Vider local'; clear.style.cssText = 'border:0;border-radius:7px;background:#3f3f46;color:#fca5a5;padding:6px 8px;cursor:pointer;font-size:11px;';
    actions.append(purge, clear); catalogHeader.append(catalogTitle, actions);
    const list = document.createElement('div'); list.style.cssText = 'display:grid;gap:8px;margin-top:9px;';
    const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:17px;margin-top:7px;font-size:11px;color:#a1a1aa;';
    let rerender = () => {};
    rerender = renderImageCatalog(list, runtime, { onChange(message, error = false) { feedback.textContent = message; feedback.style.color = error ? '#fca5a5' : '#93c5fd'; rerender(); } });
    purge.addEventListener('click', async () => { feedback.textContent = 'Vérification des liens images…'; const result = await runtime.catalog.purge(); feedback.textContent = result.message; feedback.style.color = result.ok ? '#93c5fd' : '#fca5a5'; rerender(); });
    clear.addEventListener('click', () => { if (!window.confirm('Vider le catalogue local ?')) return; const result = runtime.catalog.clear(); feedback.textContent = result.message; feedback.style.color = result.ok ? '#93c5fd' : '#fca5a5'; rerender(); });
    addDirect.addEventListener('click', async () => { feedback.textContent = 'Validation du lien image…'; const result = await runtime.catalog.addDirect(directUrl.value); feedback.textContent = result.message; feedback.style.color = result.ok ? '#93c5fd' : '#fca5a5'; if (result.ok) directUrl.value = ''; rerender(); });
    directUrl.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addDirect.click(); } });
    container.append(directRow, catalogHeader, list, feedback);
}
