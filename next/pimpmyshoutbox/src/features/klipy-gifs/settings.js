/**
 * Construit le panneau de réglages de la feature « Klipy Gifs ».
 *
 * @module src/features/klipy-gifs/settings
 */
export function renderKlipySettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Ajoute un bouton GIF dans la barre de saisie pour rechercher et insérer des animations.';
    container.append(text);
}
