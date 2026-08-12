import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderMessageActionsLeftSettings } from './settings.js';

const LEGACY_ENABLED_STORAGE_KEY = 'tm_t4_message_actions_left_enabled';
const ROOT_ATTRIBUTE = 'data-tm-message-actions-left';
const STYLE_ID = 'tm-t4-next-message-actions-left-style';
const VERTICAL_OFFSET_PX = 10;

let activeRuntime = null;

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function getMetaRow(message) {
    return message.querySelector('[class*="msgMeta"]');
}

function getMetaAnchor(message) {
    const meta = getMetaRow(message);
    if (!(meta instanceof HTMLElement)) return null;
    const children = [...meta.children].filter((child) => child instanceof HTMLElement);
    if (!children.length) return meta;
    const timestamp = children.find((child) => /\b\d{1,2}:\d{2}\b/.test(String(child.textContent || '')));
    if (timestamp instanceof HTMLElement) return timestamp;
    return children.slice().reverse().find((child) => String(child.textContent || '').trim() && child.getClientRects().length > 0) || meta;
}

function getTextAnchorRect(message) {
    const bubble = message.querySelector('[class*="msgBubble"]');
    if (!(bubble instanceof HTMLElement)) return null;
    try {
        const range = document.createRange();
        range.selectNodeContents(bubble);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
        if (rects.length) return rects.at(-1);
    } catch { /* fallback below */ }
    const rect = bubble.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
}

function clearMessagePosition(message) {
    message.style.removeProperty('--tm-message-actions-inline-left');
    message.style.removeProperty('--tm-message-actions-inline-top');
    message.removeAttribute('data-tm-message-actions-text-anchored');
}

function clearAllPositions(platform) {
    for (const message of platform.getMessages()) clearMessagePosition(message);
}

export default defineFeature({
    id: 'message-actions-left',
    label: 'Actions des messages à gauche',
    defaultEnabled: false,
    legacyEnabledStorageKey: LEGACY_ENABLED_STORAGE_KEY,
    pages: ['chat'],
    storageKeys: [LEGACY_ENABLED_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 40, render: renderMessageActionsLeftSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Place les actions natives d’un message à côté de ses informations, sur la gauche.', kind: 'info', order: 10 }],
    setup(context) {
        const syncMessage = (message) => {
            if (!(message instanceof HTMLElement)) return;
            const actions = message.querySelector('[data-msg-actions]');
            if (!(actions instanceof HTMLElement)) { clearMessagePosition(message); return; }
            const messageRect = message.getBoundingClientRect();
            if (messageRect.width <= 0) return;
            const actionRect = actions.getBoundingClientRect();
            const meta = getMetaRow(message);
            const anchor = getMetaAnchor(message);
            if (meta instanceof HTMLElement && anchor instanceof HTMLElement && meta.getClientRects().length && anchor.getClientRects().length) {
                const metaRect = meta.getBoundingClientRect();
                const anchorRect = anchor.getBoundingClientRect();
                const maxLeft = Math.max(8, messageRect.width - Math.max(actionRect.width, 76) - 8);
                message.style.setProperty('--tm-message-actions-inline-left', `${clamp(Math.round(anchorRect.right - messageRect.left + 8), 8, maxLeft)}px`);
                message.style.setProperty('--tm-message-actions-inline-top', `${Math.max(0, Math.round(metaRect.top - messageRect.top))}px`);
                message.removeAttribute('data-tm-message-actions-text-anchored');
                return;
            }
            const textRect = getTextAnchorRect(message);
            if (!textRect) { clearMessagePosition(message); return; }
            const maxLeft = Math.max(8, messageRect.width - Math.max(actionRect.width, 76) - 8);
            const textLeft = Math.max(8, Math.round(textRect.left - messageRect.left));
            const left = clamp(Math.round(textRect.right - messageRect.left + 8), textLeft, maxLeft);
            const top = Math.max(0, Math.round(textRect.top - messageRect.top + (textRect.height - actionRect.height) / 2));
            message.style.setProperty('--tm-message-actions-inline-left', `${left}px`);
            message.style.setProperty('--tm-message-actions-inline-top', `${top}px`);
            message.setAttribute('data-tm-message-actions-text-anchored', '1');
        };
        const sync = () => {
            if (!context.platform.isChatPage()) return;
            document.documentElement.setAttribute(ROOT_ATTRIBUTE, '1');
            for (const message of context.platform.getMessages()) syncMessage(message);
        };
        const deferredSync = () => window.requestAnimationFrame(sync);
        context.ensureStyle(STYLE_ID, `
            html[${ROOT_ATTRIBUTE}="1"] .group.relative.flex.items-start > .absolute.right-2.-top-3.flex.items-center.gap-0\\.5.bg-zinc-900.border.border-zinc-700.rounded-lg.shadow-lg.px-1.py-0\\.5.z-10 { right:auto!important; left:min(var(--tm-message-actions-inline-left,calc(.5rem + 2.4rem)),calc(100% - 4.75rem))!important; top:var(--tm-message-actions-inline-top,0px)!important; transform:translateY(-${VERTICAL_OFFSET_PX}px)!important; }
            html[${ROOT_ATTRIBUTE}="1"] [data-msg-id] [data-msg-actions] { position:absolute!important; left:min(var(--tm-message-actions-inline-left,2.4rem),calc(100% - 5rem))!important; right:auto!important; top:var(--tm-message-actions-inline-top,0px)!important; transform:translateY(-${VERTICAL_OFFSET_PX}px)!important; width:max-content!important; background:transparent!important; border-color:transparent!important; box-shadow:none!important; }
            html[${ROOT_ATTRIBUTE}="1"] [data-msg-id][data-tm-message-actions-text-anchored="1"] [data-msg-actions] { transform:none!important; }
        `);
        const runtime = { context, sync: deferredSync };
        activeRuntime = runtime;
        context.messages.subscribe((message) => { syncMessage(message.element); window.requestAnimationFrame(() => syncMessage(message.element)); });
        context.on(window, 'resize', deferredSync, { passive: true });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, deferredSync);
        context.every(650, sync);
        sync();
        return () => {
            document.documentElement.removeAttribute(ROOT_ATTRIBUTE);
            clearAllPositions(context.platform);
            if (activeRuntime === runtime) activeRuntime = null;
        };
    },
    onRoute(context) { activeRuntime?.context === context && activeRuntime.sync(); }
});
