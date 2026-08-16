/**
 * Implémente la feature « Message Editing » et son cycle de vie.
 *
 * @module src/features/message-editing/feature
 */
import { defineFeature } from '../../core/feature-registry.js';

const DELETE_BUTTON_ATTRIBUTE = 'data-tm-t4-delete-message';
const DELETE_BUTTON_SELECTOR = `button[${DELETE_BUTTON_ATTRIBUTE}="1"]`;
const STYLE_ID = 'tm-t4-next-message-editing-style';

function normalizedLabel(button) {
    return [button.getAttribute('aria-label'), button.getAttribute('title'), button.textContent]
        .filter(Boolean)
        .join(' ')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function isNativeEditButton(button) {
    if (!(button instanceof HTMLButtonElement) || button.matches(DELETE_BUTTON_SELECTOR)) return false;
    const label = normalizedLabel(button);
    if (/\b(modifier|editer|edit)\b/.test(label)) return true;

    const icon = String(button.querySelector('.material-symbols-outlined')?.textContent || '')
        .trim()
        .toLowerCase();
    return icon === 'edit' || icon === 'edit_note';
}

function getNativeEditButton(message) {
    const actions = message.querySelector('[data-msg-actions]');
    const candidates = [...(actions || message).querySelectorAll('button')];
    return candidates.find(isNativeEditButton) || null;
}

function getMessageId(message) {
    return String(message.getAttribute('data-msg-id') || '').trim();
}

function createDeleteButton(editButton) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = editButton.className;
    button.setAttribute(DELETE_BUTTON_ATTRIBUTE, '1');
    button.title = 'Supprimer ce message';
    button.setAttribute('aria-label', button.title);
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg>';
    return button;
}

function focusNativeEditor(message) {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            const editor = message.querySelector('input:not([type="hidden"]), textarea');
            if (!(editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement)) return;
            editor.focus();
            const length = editor.value.length;
            editor.setSelectionRange(length, length);
        });
    });
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'message-editing',
    label: 'Édition de vos messages',
    defaultEnabled: true,
    pages: ['chat'],
    settings: { area: 'shoutbox', category: 'chat', order: 25 },
    hints: [
        { id: 'delete', title: 'Suppression', text: 'Une corbeille apparaît à côté du crayon sur vos messages pour les supprimer.', kind: 'info', order: 10 },
        { id: 'edit-last', title: 'Raccourci', text: 'Dans le champ de discussion vide, appuyez sur ↑ pour modifier votre dernier message.', kind: 'tip', order: 20 }
    ],
    setup(context) {
        let openingLastEdit = false;

        const syncMessage = (message) => {
            if (!(message instanceof HTMLElement)) return;
            const editButton = getNativeEditButton(message);
            const deleteButton = message.querySelector(DELETE_BUTTON_SELECTOR);

            if (!(editButton instanceof HTMLButtonElement) || !getMessageId(message)) {
                deleteButton?.remove();
                return;
            }

            if (deleteButton instanceof HTMLButtonElement) {
                if (deleteButton.previousElementSibling !== editButton) {
                    editButton.insertAdjacentElement('afterend', deleteButton);
                }
                return;
            }
            editButton.insertAdjacentElement('afterend', createDeleteButton(editButton));
        };

        const syncAll = () => {
            if (!context.platform.isChatPage()) return;
            for (const message of context.platform.getMessages()) syncMessage(message);
        };

        const findLastEditableMessage = () => {
            const messages = context.platform.getMessages();
            for (let index = messages.length - 1; index >= 0; index -= 1) {
                const message = messages[index];
                const editButton = getNativeEditButton(message);
                if (editButton instanceof HTMLButtonElement && !editButton.disabled) {
                    return { message, editButton };
                }
            }
            return null;
        };

        context.ensureStyle(STYLE_ID, `
            ${DELETE_BUTTON_SELECTOR} { color:#fca5a5!important; }
            ${DELETE_BUTTON_SELECTOR}:hover { color:#fecaca!important; background:rgba(127,29,29,.45)!important; }
            ${DELETE_BUTTON_SELECTOR}:disabled { cursor:wait!important; opacity:.55!important; }
            ${DELETE_BUTTON_SELECTOR} svg { width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round; }
        `);

        context.messages.subscribe((message) => {
            syncMessage(message.element);
            window.requestAnimationFrame(() => syncMessage(message.element));
        });
        context.every(700, syncAll);

        context.on(document, 'click', async (event) => {
            const target = event.target instanceof Element ? event.target.closest(DELETE_BUTTON_SELECTOR) : null;
            if (!(target instanceof HTMLButtonElement)) return;
            const message = target.closest(context.platform.messageSelector);
            if (!(message instanceof HTMLElement) || !context.platform.isMessage(message)) return;
            const editButton = getNativeEditButton(message);
            const messageId = getMessageId(message);
            if (!(editButton instanceof HTMLButtonElement) || !messageId || target.disabled) return;

            event.preventDefault();
            event.stopPropagation();
            if (!window.confirm('Supprimer ce message ?')) return;

            target.disabled = true;
            try {
                const response = await fetch(`/api/messages/${encodeURIComponent(messageId)}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                context.ui.toast.show('Message supprimé.');
            } catch (error) {
                context.logger.warn('[PimpMyShoutbox Next] Unable to delete message.', error);
                context.ui.toast.show('Impossible de supprimer ce message.', { error: true });
                target.disabled = false;
            }
        }, true);

        context.on(document, 'keydown', (event) => {
            if (openingLastEdit || event.defaultPrevented || event.isComposing || event.key !== 'ArrowUp') return;
            const input = context.platform.getChatInput();
            if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || event.target !== input) return;
            if (input.value.trim() || input.selectionStart !== 0 || input.selectionEnd !== 0) return;

            const editable = findLastEditableMessage();
            if (!editable) {
                context.ui.toast.show('Aucun de vos messages modifiables n’est disponible.');
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            openingLastEdit = true;
            editable.editButton.click();
            focusNativeEditor(editable.message);
            window.setTimeout(() => { openingLastEdit = false; }, 350);
        }, true);

        syncAll();
        return () => document.querySelectorAll(DELETE_BUTTON_SELECTOR).forEach((button) => button.remove());
    },
    onRoute(context) {
        if (context.platform.isChatPage()) {
            for (const message of context.platform.getMessages()) {
                const editButton = getNativeEditButton(message);
                if (editButton instanceof HTMLButtonElement && !message.querySelector(DELETE_BUTTON_SELECTOR)) {
                    editButton.insertAdjacentElement('afterend', createDeleteButton(editButton));
                }
            }
        }
    }
});
