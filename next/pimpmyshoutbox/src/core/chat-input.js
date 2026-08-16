/**
 * Abstrait la lecture, l'écriture et la validation du champ de discussion.
 *
 * @module src/core/chat-input
 */
const DEFAULT_MAX_MESSAGE_LENGTH = 4000;

function getInputValue(input) {
    if (!(input instanceof HTMLElement)) return '';
    if (input.isContentEditable) return String(input.textContent || '');
    return 'value' in input ? String(input.value || '') : '';
}

function setInputValue(input, value) {
    if (!(input instanceof HTMLElement)) return false;

    if (input.isContentEditable) {
        input.textContent = value;
    } else if ('value' in input) {
        const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(input, value);
        else input.value = value;
    } else {
        return false;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function findSendButton(input) {
    if (!(input instanceof HTMLElement)) return null;
    const root = input.closest('[class*="inputWrapper"], [data-tm-t4-multi-channel-pane]') || input.parentElement?.parentElement;
    if (!(root instanceof HTMLElement)) return null;
    const candidates = [...root.querySelectorAll('button, [role="button"]')];
    return candidates.find((element) => {
        if (!(element instanceof HTMLElement)) return false;
        const label = `${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''} ${element.className || ''}`;
        return /envoyer|sendbtn/i.test(label);
    }) || null;
}

function scheduleDraftRestore(input, previousValue, temporaryValue) {
    const originalDraft = String(previousValue || '');
    if (!(input instanceof HTMLElement) || !originalDraft.trim()) return;
    const temporaryDraft = String(temporaryValue || '');
    const startedAt = Date.now();

    function attemptRestore() {
        if (!document.contains(input)) return;
        const currentValue = getInputValue(input);
        if (!currentValue.trim()) {
            setInputValue(input, originalDraft);
            return;
        }
        if (Date.now() - startedAt >= 4000) {
            if (currentValue.trim() === temporaryDraft.trim()) setInputValue(input, originalDraft);
            return;
        }
        window.setTimeout(attemptRestore, 140);
    }

    window.setTimeout(attemptRestore, 140);
}

/**
 * Crée l'API publique « createChatInputService ».
 *
 * @function createChatInputService
 */
export function createChatInputService(platform, { maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH } = {}) {
    function getMaxLength(input) {
        return input && input === platform.getWikiEditorInput() ? 0 : maxMessageLength;
    }

    function write(input, value) {
        if (!(input instanceof HTMLElement)) return { ok: false, message: 'Champ de texte non trouvé.' };
        const nextValue = String(value || '');
        const limit = getMaxLength(input);
        if (limit > 0 && nextValue.length > limit) {
            return { ok: false, message: `Le message dépasserait la limite du chat (${nextValue.length}/${limit}).` };
        }
        input.focus();
        return setInputValue(input, nextValue)
            ? { ok: true, message: 'Champ mis à jour.' }
            : { ok: false, message: 'Champ de texte non compatible.' };
    }

    return Object.freeze({
        maxMessageLength,
        get: () => platform.getChatInput(),
        getValue: getInputValue,
        getMaxLength,
        enforceLimit(input = platform.getChatInput()) {
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                if (getMaxLength(input) > 0) input.maxLength = getMaxLength(input);
            }
        },
        write,
        send(input = platform.getChatInput(), text, { preserveDraft = true, allowExistingDraft = false } = {}) {
            if (!(input instanceof HTMLElement)) return { ok: false, code: 'input-unavailable', message: 'Champ de texte non trouvé.' };
            const message = String(text || '').trim();
            if (!message) return { ok: false, code: 'empty-message', message: 'Message vide.' };
            const previousValue = getInputValue(input);
            if (previousValue.trim() && !allowExistingDraft) {
                return { ok: false, code: 'draft-present', message: 'Un brouillon est déjà présent dans le chat.' };
            }

            const result = write(input, message);
            if (!result.ok) return { ...result, code: 'input-write-failed' };

            const sendButton = findSendButton(input);
            if (sendButton instanceof HTMLButtonElement && sendButton.disabled) {
                setInputValue(input, previousValue);
                if (preserveDraft) scheduleDraftRestore(input, previousValue, message);
                return { ok: false, code: 'send-disabled', message: 'Le bouton d’envoi est indisponible.' };
            }
            if (sendButton instanceof HTMLElement) {
                sendButton.click();
            } else {
                const form = input.closest('form');
                if (!(form instanceof HTMLFormElement)) {
                    setInputValue(input, previousValue);
                    if (preserveDraft) scheduleDraftRestore(input, previousValue, message);
                    return { ok: false, code: 'send-unavailable', message: 'Bouton d’envoi introuvable.' };
                }
                if (typeof form.requestSubmit === 'function') form.requestSubmit();
                else form.submit();
            }
            if (preserveDraft) scheduleDraftRestore(input, previousValue, message);
            return { ok: true, code: 'send-requested', message: 'Message envoyé.' };
        },
        insert(input, textToInsert, { replace = false, successMessage = 'Texte inséré.' } = {}) {
            if (!(input instanceof HTMLElement)) return { ok: false, message: 'Champ de texte non trouvé.' };
            const text = String(textToInsert || '').trim();
            if (!text) return { ok: false, message: 'Texte vide.' };
            const currentValue = getInputValue(input);
            const separator = !replace && currentValue && !/\s$/.test(currentValue) ? ' ' : '';
            const result = write(input, replace ? text : `${currentValue}${separator}${text}`);
            return result.ok ? { ...result, message: successMessage } : result;
        }
    });
}
