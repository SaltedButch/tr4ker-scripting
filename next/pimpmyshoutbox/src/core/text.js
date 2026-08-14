/**
 * Regroupe les fonctions de normalisation, formatage et manipulation de texte.
 *
 * @module src/core/text
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Normalise les données reçues par « normalizeName ».
 *
 * @function normalizeName
 */
export function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
}

/**
 * Normalise les données reçues par « normalizeComparableText ».
 *
 * @function normalizeComparableText
 */
export function normalizeComparableText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        .trim()
        .toLowerCase();
}

/**
 * Calcule une empreinte stable avec « hashString ».
 *
 * @function hashString
 */
export function hashString(value) {
    let hash = 5381;
    const input = String(value || '');

    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
    }

    return (hash >>> 0).toString(36);
}

/**
 * Échappe la valeur reçue par « escapeHtml ».
 *
 * @function escapeHtml
 */
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

/**
 * Formate la valeur reçue par « formatFileSize ».
 *
 * @function formatFileSize
 */
export function formatFileSize(value) {
    const bytes = Math.max(0, Number(value) || 0);
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} Mo`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${bytes} o`;
}

/**
 * Copie la valeur reçue par « copyTextToClipboard » vers le presse-papiers.
 *
 * @function copyTextToClipboard
 */
export async function copyTextToClipboard(value) {
    const text = String(value || '');
    if (!text) return false;

    try {
        await navigator.clipboard?.writeText(text);
        return true;
    } catch {
        // Fallback for browsers without the asynchronous Clipboard API.
    }

    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body?.append(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        return copied;
    } catch {
        return false;
    }
}
