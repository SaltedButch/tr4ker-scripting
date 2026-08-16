/**
 * Construit le panneau de réglages de la feature « T9 Emoj ».
 *
 * @module src/features/t9-emoj/settings
 */
export function renderT9EmojSettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Ajoute un picker d’émoticônes au-dessus du champ de message.';
    container.append(text);
}
