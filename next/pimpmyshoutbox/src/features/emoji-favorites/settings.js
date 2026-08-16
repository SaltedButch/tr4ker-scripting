/**
 * Construit le panneau de réglages de la feature « Emoji Favorites ».
 *
 * @module src/features/emoji-favorites/settings
 */
export function renderEmojiFavoritesSettings(container, { context }) {
    const runtime = context?.emojiFavorites;
    if (!runtime) { container.textContent = 'Active la feature pour gérer les emojis et réactions favoris.'; return; }
    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Retrouvez vos emojis favoris dans la barre rapide, vos réactions favorites près des messages et leurs historiques d’utilisation depuis une page dédiée.';
    const count = document.createElement('div');
    const emojiManual = runtime.getManual().length; const emojiUsage = runtime.getUsage().length;
    const reactionManual = runtime.reactions.getManual().length; const reactionUsage = runtime.reactions.getUsage().length;
    count.textContent = `${emojiManual} emoji${emojiManual > 1 ? 's' : ''} et ${reactionManual} réaction${reactionManual > 1 ? 's' : ''} en favoris manuels · ${emojiUsage} emoji${emojiUsage > 1 ? 's' : ''} et ${reactionUsage} réaction${reactionUsage > 1 ? 's' : ''} dans l’historique.`;
    count.style.cssText = 'margin:10px 0;color:#c4b5fd;font-size:12px;';
    const open = document.createElement('button'); open.type = 'button'; open.textContent = 'Ouvrir le gestionnaire des favoris';
    open.style.cssText = 'border:0;border-radius:8px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:700;';
    open.addEventListener('click', () => runtime.openManager());
    container.append(description, count, open);
}
