import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createYouTubePlayer, getTextYouTubeDescriptors, getYouTubeDescriptor } from './youtube.js';

const BUTTON_SELECTOR = 'button[data-tm-t4-youtube-play-link]';
const INLINE_STORAGE_KEY = 'tm_t4_youtube_inline_enabled';
let activeRuntime = null;

function renderSettings(container, { context }) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Ajoute un lecteur pour les liens YouTube.';
    const inlineToggle = document.createElement('label');
    inlineToggle.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer;';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = context?.youtubePlayer?.isInlineEnabled() || false;
    checkbox.addEventListener('change', () => context?.youtubePlayer?.setInlineEnabled(checkbox.checked));
    inlineToggle.append(checkbox, document.createTextNode('Afficher la vidéo directement dans le message'));
    const help = document.createElement('div'); help.style.cssText = 'margin-top:6px;font-size:12px;line-height:1.5;color:#a1a1aa;'; help.textContent = 'Sinon, un bouton play ouvre le lecteur flottant déplaçable et redimensionnable.';
    container.append(text, inlineToggle, help);
}

function createPlayButton(descriptor) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'play'; button.title = 'Lire dans le player'; button.setAttribute('aria-label', button.title);
    button.dataset.tmT4YoutubePlayLink = ''; button.dataset.tmT4YoutubeId = descriptor.id; button.dataset.tmT4YoutubeEmbedUrl = descriptor.embedUrl; button.dataset.tmT4YoutubeWatchUrl = descriptor.watchUrl;
    return button;
}

export default defineFeature({
    id: 'youtube-player',
    label: 'Mini lecteur YouTube',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [INLINE_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'media', order: 40, render: renderSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Un bouton play apparaît à côté des liens YouTube. La vidéo peut aussi être intégrée automatiquement dans le message.', kind: 'info', order: 10 }],
    setup(context) {
        const player = createYouTubePlayer({ http: context.http });
        let inlineEnabled = context.storage.readBoolean(INLINE_STORAGE_KEY, false);
        context.ensureStyle('tm-t4-next-youtube-player-style', `
            ${BUTTON_SELECTOR} { display:inline-flex;align-items:center;justify-content:center;margin-left:6px;padding:1px 7px;border:1px solid rgba(239,68,68,.28);border-radius:999px;background:rgba(127,29,29,.72);color:#fee2e2;font:700 11px/1.6 Inter,Arial,sans-serif;cursor:pointer;vertical-align:middle; }
            ${BUTTON_SELECTOR}:hover { background:rgba(153,27,27,.88);border-color:rgba(248,113,113,.4); }
            #tm-t4-next-youtube-player svg { width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
        `);
        const syncMessage = (message) => {
            const bubble = message?.element?.querySelector('[class*="msgBubble"]');
            if (!(bubble instanceof HTMLElement)) return;
            bubble.querySelectorAll(BUTTON_SELECTOR).forEach((button) => button.remove());
            const descriptors = [];
            const seen = new Set();
            const addDescriptor = (descriptor) => {
                if (!descriptor || seen.has(descriptor.id)) return;
                seen.add(descriptor.id);
                descriptors.push(descriptor);
            };
            bubble.querySelectorAll('a[href]').forEach((link) => {
                if (!(link instanceof HTMLAnchorElement)) return;
                const descriptor = getYouTubeDescriptor(link.href); if (!descriptor) return;
                addDescriptor(descriptor);
                if (!inlineEnabled) link.insertAdjacentElement('afterend', createPlayButton(descriptor));
            });
            const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT); let node;
            while ((node = walker.nextNode())) {
                if (node.parentElement?.closest('a, button')) continue;
                for (const descriptor of getTextYouTubeDescriptors(node.nodeValue)) {
                    if (seen.has(descriptor.id)) continue;
                    addDescriptor(descriptor);
                    if (!inlineEnabled) bubble.append(document.createTextNode(' '), createPlayButton(descriptor));
                }
            }
            if (inlineEnabled) descriptors.forEach((descriptor) => player.openInline(bubble, descriptor));
        };
        const syncAll = () => { for (const element of context.platform.getMessages()) syncMessage(context.platform.getMessageDetails(element)); };
        const runtime = {
            context,
            syncAll,
            isInlineEnabled: () => inlineEnabled,
            setInlineEnabled(enabled) {
                inlineEnabled = Boolean(enabled);
                context.storage.writeBoolean(INLINE_STORAGE_KEY, inlineEnabled);
                player.clearInline();
                syncAll();
            }
        };
        context.youtubePlayer = runtime;
        context.messages.subscribe(syncMessage);
        context.on(document, 'click', (event) => {
            const target = event.target instanceof Element ? event.target.closest(BUTTON_SELECTOR) : null;
            if (!(target instanceof HTMLButtonElement)) return;
            const descriptor = { id: target.dataset.tmT4YoutubeId || '', embedUrl: target.dataset.tmT4YoutubeEmbedUrl || '', watchUrl: target.dataset.tmT4YoutubeWatchUrl || '' };
            if (!descriptor.embedUrl) return;
            event.preventDefault(); event.stopPropagation();
            if (inlineEnabled) player.openInline(target, descriptor);
            else player.open(descriptor);
        }, true);
        context.on(window, 'storage', (event) => {
            if (event.key !== INLINE_STORAGE_KEY) return;
            inlineEnabled = context.storage.readBoolean(INLINE_STORAGE_KEY, false);
            player.clearInline();
            syncAll();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            inlineEnabled = context.storage.readBoolean(INLINE_STORAGE_KEY, false);
            player.clearInline();
            syncAll();
        });
        context.every(900, syncAll);
        activeRuntime = runtime;
        syncAll();
        return () => {
            if (activeRuntime === runtime) activeRuntime = null;
            delete context.youtubePlayer;
            player.destroy();
            document.querySelectorAll(BUTTON_SELECTOR).forEach((button) => button.remove());
        };
    },
    onRoute(context) {
        if (activeRuntime?.context === context) activeRuntime.syncAll();
    }
});
