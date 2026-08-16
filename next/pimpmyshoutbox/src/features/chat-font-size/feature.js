/**
 * Implémente la feature « Chat Font Size » et son cycle de vie.
 *
 * @module src/features/chat-font-size/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderChatFontSizeSettings } from './settings.js';

const STORAGE_KEY = 'tm_t4_chat_font_scale';
const DEFAULT_SCALE = 1;
const MIN_SCALE = .85;
const MAX_SCALE = 1.7;

let activeRuntime = null;

function clampScale(value, fallback = DEFAULT_SCALE) {
    const parsed = Number(String(value ?? '').trim().replace(',', '.'));
    return Number.isFinite(parsed) ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed)) : fallback;
}

function pixels(value, scale) {
    return `${Math.round(value * scale * 10) / 10}px`;
}

function clearMessageTypography(message) {
    const sender = message.querySelector('[class*="msgSender"]');
    const bubble = message.querySelector('[class*="msgBubble"]');
    if (sender instanceof HTMLElement) {
        sender.style.removeProperty('font-size');
        sender.style.removeProperty('line-height');
    }
    for (const meta of message.querySelectorAll('[class*="msgMeta"] > *')) {
        if (meta instanceof HTMLElement) meta.style.removeProperty('font-size');
    }
    if (bubble instanceof HTMLElement) {
        bubble.style.removeProperty('font-size');
        bubble.style.removeProperty('line-height');
    }
}

function applyMessageTypography(message, scale) {
    const sender = message.querySelector('[class*="msgSender"]');
    const bubble = message.querySelector('[class*="msgBubble"]');
    if (sender instanceof HTMLElement) {
        sender.style.fontSize = pixels(14, scale);
        sender.style.lineHeight = '1.35';
    }
    for (const meta of message.querySelectorAll('[class*="msgMeta"] > *')) {
        if (meta instanceof HTMLElement) meta.style.fontSize = pixels(12, scale);
    }
    if (bubble instanceof HTMLElement) {
        bubble.style.fontSize = pixels(14, scale);
        bubble.style.lineHeight = scale >= 1.2 ? '1.6' : '1.5';
    }
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'chat-font-size',
    label: 'Taille de police du chat',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 10, render: renderChatFontSizeSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Agrandit ou réduit les pseudos, informations et messages de la shoutbox.', kind: 'info', order: 10 }],
    setup(context) {
        let scale = clampScale(context.storage.get(STORAGE_KEY));
        const apply = (nextScale = scale) => {
            scale = clampScale(nextScale, scale);
            if (!context.platform.isChatPage()) return scale;
            for (const message of context.platform.getMessages()) applyMessageTypography(message, scale);
            return scale;
        };
        const save = (nextScale) => {
            scale = clampScale(nextScale, scale);
            context.storage.set(STORAGE_KEY, String(scale));
            return apply(scale);
        };
        const reset = () => save(DEFAULT_SCALE);
        const runtime = { context, getScale: () => scale, preview: apply, save, reset, apply };
        activeRuntime = runtime;
        context.chatFontSize = runtime;
        context.messages.subscribe((message) => applyMessageTypography(message.element, scale));
        context.on(window, 'storage', (event) => { if (event.key === STORAGE_KEY) { scale = clampScale(context.storage.get(STORAGE_KEY)); apply(); } });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => { scale = clampScale(context.storage.get(STORAGE_KEY)); apply(); });
        apply();
        return () => {
            for (const message of context.platform.getMessages()) clearMessageTypography(message);
            delete context.chatFontSize;
            if (activeRuntime === runtime) activeRuntime = null;
        };
    },
    onRoute(context) { activeRuntime?.context === context && activeRuntime.apply(); }
});
