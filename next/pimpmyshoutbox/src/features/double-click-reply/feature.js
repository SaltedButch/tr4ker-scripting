import { defineFeature } from '../../core/feature-registry.js';

function normalizedLabel(button) {
    return [button.getAttribute('aria-label'), button.getAttribute('title'), button.textContent]
        .filter(Boolean)
        .join(' ')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function replyButton(message) {
    const actions = message.querySelector('[data-msg-actions]');
    const direct = actions?.querySelector('button[title="Répondre"],button[title="Repondre"],button[aria-label*="Répondre"],button[aria-label*="Reply"]');
    if (direct instanceof HTMLButtonElement) return direct;

    const sender = message.querySelector('[class*="msgSender"]');
    const quotedAuthor = message.querySelector('[class*="quoteAuthor"]');
    const buttons = [...(actions || message).querySelectorAll('button')].filter((button) => (
        button instanceof HTMLButtonElement && button !== sender && button !== quotedAuthor
    ));
    const labeled = buttons.find((button) => /\b(repondre|reponse|reply)\b/.test(normalizedLabel(button)));
    if (labeled instanceof HTMLButtonElement) return labeled;
    const iconOnly = buttons.filter((button) => !normalizedLabel(button) && button.querySelector('svg'));
    return iconOnly.length === 1 ? iconOnly[0] : null;
}

function isExcludedTarget(target) {
    return Boolean(target.closest('button,a,textarea,input,select,option,label,img,[contenteditable="true"]'));
}

export default defineFeature({
    id: 'double-click-reply',
    label: 'Répondre par double-clic',
    defaultEnabled: true,
    pages: ['chat'],
    settings: { area: 'shoutbox', category: 'chat', order: 20 },
    hints: [{ id: 'gesture', title: 'Raccourci souris', text: 'Double-cliquez sur le contenu d’un message pour y répondre directement.', kind: 'tip', order: 10 }],
    setup(context) {
        context.on(document, 'dblclick', (event) => {
            if (event.button !== 0 || !(event.target instanceof Element) || isExcludedTarget(event.target)) return;
            const message = event.target.closest(context.platform.messageSelector);
            if (!(message instanceof HTMLElement) || !context.platform.isMessage(message)) return;
            const button = replyButton(message);
            if (!(button instanceof HTMLButtonElement) || button.disabled) return;
            event.preventDefault();
            event.stopPropagation();
            button.click();
        }, true);
    }
});
