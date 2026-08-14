/**
 * Construit le panneau de réglages de la feature « Chat Image Zoom ».
 *
 * @module src/features/chat-image-zoom/settings
 */
export function renderChatImageZoomSettings(container) {
    const text = document.createElement('p');
    text.style.cssText = 'margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;';
    text.textContent = 'Survolez une image dans un message pour afficher un aperçu, puis cliquez pour l’ouvrir en grand format.';
    container.append(text);
}
