function toRgba(hexColor, alpha) {
    const hex = String(hexColor || '').replace('#', '');
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

function saveStyle(element, property) {
    return {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
    };
}

function restoreStyle(element, property, previous) {
    if (previous?.value) element.style.setProperty(property, previous.value, previous.priority);
    else element.style.removeProperty(property);
}

export function createMentionHighlighter({ platform }) {
    const states = new Map();

    function restore(element) {
        const state = states.get(element);
        if (!state) return;
        window.clearTimeout(state.timeoutId);
        for (const [property, previous] of Object.entries(state.styles)) restoreStyle(element, property, previous);
        if (state.title === null) element.removeAttribute('title');
        else element.setAttribute('title', state.title);
        element.removeAttribute('data-tm-t4-mention-highlight');
        states.delete(element);
    }

    function apply(message, settings) {
        const element = message?.element;
        if (!(element instanceof HTMLElement)) return;
        restore(element);

        const opacity = settings.opacityPercent / 100;
        const accent = toRgba(settings.color, Math.min(1, opacity * 4.55));
        const styles = Object.fromEntries(['background', 'outline', 'box-shadow', 'animation'].map((property) => [property, saveStyle(element, property)]));
        const state = { styles, title: element.getAttribute('title'), timeoutId: null };
        states.set(element, state);
        element.style.setProperty('background', toRgba(settings.color, opacity));
        element.style.setProperty('outline', `1px solid ${accent}`);
        element.style.setProperty('box-shadow', `inset 3px 0 0 ${accent}`);
        element.setAttribute('data-tm-t4-mention-highlight', settings.username);
        element.title = `Mention @${settings.username}`;

        if (settings.blinkSeconds <= 0) return;
        element.style.setProperty('animation', 'tm-t4-next-mention-pulse .9s ease-in-out infinite', 'important');
        state.timeoutId = window.setTimeout(() => {
            if (states.get(element) !== state) return;
            restoreStyle(element, 'animation', state.styles.animation);
            if (!settings.keepHighlightAfterBlink) restore(element);
            else state.timeoutId = null;
        }, settings.blinkSeconds * 1000);
    }

    function refresh(settings, isMention) {
        for (const element of platform.getMessages()) {
            const message = platform.getMessageDetails(element);
            if (isMention(message)) apply(message, settings);
            else restore(element);
        }
    }

    return Object.freeze({
        apply,
        refresh,
        destroy() {
            for (const element of [...states.keys()]) restore(element);
        }
    });
}
