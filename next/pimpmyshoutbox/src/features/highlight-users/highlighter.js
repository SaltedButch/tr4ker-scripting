/**
 * Applique et retire la mise en évidence propre à « Highlight Users ».
 *
 * @module src/features/highlight-users/highlighter
 */
function hexToRgba(color, alpha) {
    const hex = String(color || '#f59e0b').replace('#', '');
    const values = [0, 2, 4].map((position) => Number.parseInt(hex.slice(position, position + 2), 16));
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${Math.min(1, Math.max(0, alpha))})`;
}

function frameFor(platform, messageElement, username) {
    const isSameAuthor = (candidate) => platform.isMessage(candidate) && platform.getMessageDetails(candidate)?.normalizedUsername === username;
    const grouped = platform.isGroupedMessage(messageElement);
    const previous = messageElement.previousElementSibling;
    const next = messageElement.nextElementSibling;
    const hasPrevious = grouped && isSameAuthor(previous);
    const hasNext = isSameAuthor(next) && platform.isGroupedMessage(next);
    if (!grouped && !hasNext) return 'single';
    if (!hasPrevious && !hasNext) return 'single';
    if (!hasPrevious) return 'first';
    return hasNext ? 'middle' : 'last';
}

/**
 * Crée l'API publique « createHighlightHighlighter ».
 *
 * @function createHighlightHighlighter
 */
export function createHighlightHighlighter({ platform, ensureStyle }) {
    ensureStyle('tm-t4-next-highlight-users-style', `
        [data-tm-t4-highlight-user]:not([data-tm-t4-mention-highlight]) { background:var(--tm-t4-highlight-background)!important;box-shadow:inset 3px 0 0 var(--tm-t4-highlight-edge)!important; }
        [data-tm-t4-highlight-frame="single"]:not([data-tm-t4-mention-highlight]) { outline:1px solid var(--tm-t4-highlight-accent)!important; }
        [data-tm-t4-highlight-frame="first"]:not([data-tm-t4-mention-highlight]) { outline:none!important;border-top:1px solid var(--tm-t4-highlight-accent)!important;border-bottom:0!important;border-radius:6px 6px 0 0!important; }
        [data-tm-t4-highlight-frame="middle"]:not([data-tm-t4-mention-highlight]) { outline:none!important;border-top:0!important;border-bottom:0!important;border-radius:0!important; }
        [data-tm-t4-highlight-frame="last"]:not([data-tm-t4-mention-highlight]) { outline:none!important;border-top:0!important;border-bottom:1px solid var(--tm-t4-highlight-accent)!important;border-radius:0 0 6px 6px!important; }
    `);

    function clear(element) {
        if (!(element instanceof HTMLElement)) return;
        element.removeAttribute('data-tm-t4-highlight-user');
        element.removeAttribute('data-tm-t4-highlight-frame');
        element.style.removeProperty('--tm-t4-highlight-background');
        element.style.removeProperty('--tm-t4-highlight-accent');
        element.style.removeProperty('--tm-t4-highlight-edge');
    }

    function apply(message, config) {
        const element = message?.element;
        const username = message?.normalizedUsername;
        if (!(element instanceof HTMLElement) || !username || !config) { clear(element); return; }
        const opacity = config.opacityPercent / 100;
        element.dataset.tmT4HighlightUser = username;
        element.dataset.tmT4HighlightFrame = frameFor(platform, element, username);
        element.style.setProperty('--tm-t4-highlight-background', hexToRgba(config.color, opacity));
        element.style.setProperty('--tm-t4-highlight-accent', hexToRgba(config.color, Math.min(1, opacity * 5.15)));
        element.style.setProperty('--tm-t4-highlight-edge', hexToRgba(config.color, Math.min(1, opacity * 7)));
    }

    function refresh(getConfig) {
        for (const element of platform.getMessages()) {
            const message = platform.getMessageDetails(element);
            apply(message, getConfig(message?.normalizedUsername));
        }
    }

    return Object.freeze({ apply, refresh, clear, destroy() { for (const element of platform.getMessages()) clear(element); } });
}
