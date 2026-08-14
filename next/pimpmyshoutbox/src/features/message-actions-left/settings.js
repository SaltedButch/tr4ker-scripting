/**
 * Construit le panneau de réglages de la feature « Message Actions Left ».
 *
 * @module src/features/message-actions-left/settings
 */
export function renderMessageActionsLeftSettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Les boutons de réponse et de réaction suivent les informations du message au lieu de rester à droite.';
    container.append(text);
}
