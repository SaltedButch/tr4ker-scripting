/**
 * Configure le chargement direct par défaut des images de torrents.
 *
 * @module src/features/torrent-image-fallback/settings
 */
import { createStorage } from '../../core/storage.js';

export const DIRECT_IMAGES_STORAGE_KEY = 'tm-t4-next:torrent-image-fallback:direct-by-default';

export function renderImageFallbackSettings(container, { context }) {
    // Les réglages restent accessibles lorsque la feature est inactive hors des torrents.
    const storage = context?.storage || createStorage(window.localStorage);
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;color:#e4e4e7;font-size:13px;cursor:pointer;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = storage.readBoolean(DIRECT_IMAGES_STORAGE_KEY, false);
    input.addEventListener('change', () => {
        storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, input.checked);
        context?.torrentImageFallback?.sync();
    });
    row.append(input, document.createTextNode('Toujours charger les images depuis leur source'));
    const help = document.createElement('p');
    help.style.cssText = 'margin:4px 0;color:#a1a1aa;font-size:12px;line-height:1.5;';
    help.textContent = 'Sur les pages de torrents, les images sont chargées directement auprès de leurs hébergeurs, sans attendre une panne du proxy. Ce choix est conservé pour les prochaines visites. Le bouton « Revenir au proxy » le suspend pour la page courante.';
    container.append(row, help);
}
