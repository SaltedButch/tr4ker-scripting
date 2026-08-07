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
