/**
 * Implémente la feature « Emoji Favorites » et son cycle de vie.
 *
 * @module src/features/emoji-favorites/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createEmojiFavoritesManager } from './manager.js';
import { createReactionFavoritesStore, normalizeReactionRecord, reactionLabel, REACTION_STORAGE_KEYS } from './reaction-store.js';
import { renderEmojiFavoritesSettings } from './settings.js';
import { createEmojiFavoritesStore, insertionText, normalizeRecord, STORAGE_KEYS } from './store.js';

const TOOLBAR_ID = 'emoji-favorites';
const TOOLBAR_ATTR = 'data-tm-t4-emoji-favorites';
const FAVORITE_ATTR = 'data-tm-t4-emoji-favorite';
const REACTION_FAVORITE_ATTR = 'data-tm-t4-reaction-favorite';
const REACTION_GROUP_ATTR = 'data-tm-t4-reaction-favorites';
const REACTION_HOST_ATTR = 'data-tm-t4-reaction-favorites-host';
const REACTION_STYLE_ID = 'tm-t4-next-reaction-favorites-style';
const PICKER_TIMEOUT_MS = 12000;

function isUnicodeEmoji(value) {
    return /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/u.test(String(value || ''));
}

function buttonLabel(button) {
    return [button.getAttribute('data-emoji'), button.getAttribute('data-value'), button.getAttribute('data-name'), button.getAttribute('title'), button.getAttribute('aria-label'), button.textContent]
        .filter(Boolean).join(' ').trim();
}

function recordFromButton(button) {
    if (!(button instanceof HTMLButtonElement)) return null;
    const image = button.querySelector('img');
    const raw = buttonLabel(button);
    const title = String(button.getAttribute('data-emoji') || button.getAttribute('data-value') || button.getAttribute('data-name') || button.getAttribute('title') || button.getAttribute('aria-label') || button.textContent || '').trim();
    const alt = String(image?.getAttribute('alt') || title || raw).trim();
    const src = image instanceof HTMLImageElement ? image.currentSrc || image.src : '';
    return normalizeRecord({ title, alt, src });
}

function isEmojiCandidate(button) {
    if (!(button instanceof HTMLButtonElement)) return false;
    if (button.closest(`[${TOOLBAR_ATTR}="1"]`)) return false;
    const hasAsset = button.querySelector('img') instanceof HTMLImageElement;
    const metadata = ['data-emoji', 'data-value', 'data-name'].some((name) => Boolean(button.getAttribute(name)));
    return hasAsset || metadata || isUnicodeEmoji(button.textContent);
}

function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function nativeEmojiTrigger(target, input) {
    const button = target instanceof Element ? target.closest('button') : null;
    if (!(button instanceof HTMLButtonElement) || !(input instanceof HTMLElement)) return null;
    const inputArea = input.closest('[class*="inputField"],[class*="inputArea"]');
    if (!(inputArea instanceof HTMLElement) || !inputArea.contains(button)) return null;
    const icon = String(button.querySelector('.material-symbols-outlined')?.textContent || '').trim().toLowerCase();
    const label = buttonLabel(button).toLocaleLowerCase('fr');
    return icon.includes('emoji') || /emoji|emoticone|emoticon/.test(label) ? button : null;
}

function findNativeEmojiTrigger(input) {
    if (!(input instanceof HTMLElement)) return null;
    const inputArea = input.closest('[class*="inputField"],[class*="inputArea"]');
    if (!(inputArea instanceof HTMLElement)) return null;
    return [...inputArea.querySelectorAll('button')].find((button) => nativeEmojiTrigger(button, input) === button) || null;
}

function pickerRootFor(button) {
    if (!(button instanceof HTMLButtonElement)) return null;
    let current = button.parentElement;
    while (current && current !== document.body) {
        if (current instanceof HTMLElement && isVisible(current)) {
            const candidates = [...current.querySelectorAll('button')].filter(isEmojiCandidate);
            const className = String(current.className || '').toLowerCase();
            if (candidates.length >= 3 && (/emoji|picker/.test(className) || candidates.length >= 8)) return current;
        }
        current = current.parentElement;
    }
    return null;
}

function reactionButtonLabel(button) {
    return [button.getAttribute('aria-label'), button.getAttribute('title'), button.getAttribute('data-emoji'), button.getAttribute('data-value'), button.getAttribute('data-name'), button.textContent]
        .filter(Boolean).join(' ').trim();
}

function normalizeReactionComparable(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u200b-\u200d\ufeff]/g, '').trim().toLocaleLowerCase('fr');
}

function reactionHash(value) {
    let hash = 5381;
    for (const character of String(value || '')) hash = ((hash << 5) + hash) ^ character.charCodeAt(0);
    return (hash >>> 0).toString(36);
}

function reactionRecordFromButton(button) {
    if (!(button instanceof HTMLButtonElement)) return null;
    const image = button.querySelector('img');
    const candidates = [button.getAttribute('data-emoji'), button.getAttribute('data-value'), button.getAttribute('data-name'), button.textContent, image?.getAttribute('alt')]
        .map((value) => String(value || '').trim());
    const emojiValue = candidates.find((value) => value && /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(value)) || '';
    const src = image instanceof HTMLImageElement ? image.currentSrc || image.src : '';
    const svg = button.querySelector('svg');
    const svgSignature = svg instanceof SVGElement ? svg.outerHTML.replace(/\s+/g, ' ').slice(0, 400) : '';
    const label = reactionButtonLabel(button);
    const keySource = String(label || button.getAttribute('data-key') || button.getAttribute('data-emoji') || button.getAttribute('data-value') || button.getAttribute('data-name') || src || svgSignature).trim();
    return normalizeReactionRecord({
        key: keySource ? `${normalizeReactionComparable(keySource)}|${src || `svg:${reactionHash(svgSignature || keySource)}`}` : '',
        label: emojiValue || label,
        title: String(button.getAttribute('title') || '').trim(),
        alt: String(image?.getAttribute('alt') || '').trim(),
        emojiValue,
        src,
        svgSignature
    });
}

function getMessageActions(message) {
    return message instanceof HTMLElement ? message.querySelector('[data-msg-actions]') : null;
}

function getReactionTrigger(message) {
    const actions = getMessageActions(message);
    if (!(actions instanceof HTMLElement)) return null;
    const direct = actions.querySelector('button[title="Réagir"],button[title="Reagir"],button[aria-label*="Réagir" i],button[aria-label*="Reagir" i],button[aria-label*="React" i]');
    if (direct instanceof HTMLButtonElement) return direct;
    return [...actions.querySelectorAll('button')].find((button) => /\b(reagir|reaction|react|emoji|emote)\b/.test(normalizeReactionComparable(reactionButtonLabel(button)))) || null;
}

function isReactionCandidate(button) {
    if (!(button instanceof HTMLButtonElement) || button.closest(`[${REACTION_GROUP_ATTR}="1"]`)) return false;
    const record = reactionRecordFromButton(button);
    return Boolean(record && (record.emojiValue || record.src || record.svgSignature || button.hasAttribute('data-emoji') || button.hasAttribute('data-value') || button.hasAttribute('data-name')));
}

function reactionPickerRootFor(button, message) {
    if (!(button instanceof HTMLButtonElement)) return null;
    let current = button.parentElement;
    while (current && current !== document.body) {
        if (current instanceof HTMLElement && isVisible(current) && !current.closest(`[${REACTION_GROUP_ATTR}="1"]`)) {
            const className = String(current.className || '').toLowerCase();
            if (/reaction|picker|emoji/.test(className) && [...current.querySelectorAll('button')].filter(isReactionCandidate).length >= 3) {
                const pickerMessage = current.closest('[data-msg-id]');
                if (!(pickerMessage instanceof HTMLElement) || pickerMessage === message) return current;
            }
        }
        current = current.parentElement;
    }
    return null;
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'emoji-favorites',
    label: 'Emojis et réactions favoris',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [...Object.values(STORAGE_KEYS), ...Object.values(REACTION_STORAGE_KEYS)],
    settings: { area: 'shoutbox', category: 'media', order: 15, render: renderEmojiFavoritesSettings },
    hints: [
        { id: 'purpose', title: 'Fonctionnement', text: 'Ajoute vos emojis favoris au-dessus du champ de discussion et vos réactions favorites près des messages.', kind: 'info', order: 10 },
        { id: 'manual', title: 'Favoris manuels', text: 'En mode manuel, utilisez Maj+clic ou Alt/⌘+clic dans un picker pour ajouter ou retirer un emoji ou une réaction.', kind: 'tip', order: 20 }
    ],
    setup(context) {
        const store = createEmojiFavoritesStore({ storage: context.storage });
        const reactions = createReactionFavoritesStore({ storage: context.storage });
        context.ensureStyle(REACTION_STYLE_ID, `
            [data-msg-actions][${REACTION_HOST_ATTR}="1"] {
                display: inline-flex !important;
                align-items: center !important;
                flex-wrap: nowrap !important;
                white-space: nowrap !important;
                overflow: visible !important;
                width: max-content !important;
                max-width: none !important;
                min-width: 0 !important;
                gap: 2px !important;
            }
            [data-msg-actions][${REACTION_HOST_ATTR}="1"] [${REACTION_GROUP_ATTR}="1"] {
                display: inline-flex !important;
                align-items: center !important;
                flex: 0 0 auto !important;
                flex-wrap: nowrap !important;
                white-space: nowrap !important;
                gap: 1px !important;
            }
            [data-msg-actions][${REACTION_HOST_ATTR}="1"] [${REACTION_GROUP_ATTR}="1"] button {
                flex: 0 0 20px !important;
                width: 20px !important;
                min-width: 20px !important;
                height: 20px !important;
            }
        `);
        const toolbar = document.createElement('div');
        toolbar.setAttribute(TOOLBAR_ATTR, '1');
        toolbar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;min-height:28px;pointer-events:auto;';
        let pickerOpenedAt = 0;
        let activePicker = null;
        let toolbarMounted = false;
        let manager = null;
        let reactionPickerOpenedAt = 0;
        let activeReactionPicker = null;
        let activeReactionMessage = null;

        const pickerIsActive = () => Date.now() - pickerOpenedAt <= PICKER_TIMEOUT_MS;
        const findOpenPicker = () => [...document.querySelectorAll('div')].find((candidate) => {
            if (!isVisible(candidate)) return false;
            const className = String(candidate.className || '').toLowerCase();
            if (!/emoji|picker/.test(className)) return false;
            return [...candidate.querySelectorAll('button')].filter(isEmojiCandidate).length >= 3;
        }) || null;
        const clearMarkers = () => document.querySelectorAll(`[${FAVORITE_ATTR}="1"]`).forEach((button) => {
            button.removeAttribute(FAVORITE_ATTR);
            button.style.removeProperty('outline');
            button.style.removeProperty('outline-offset');
        });
        const markPicker = (root = activePicker) => {
            if (!(root instanceof HTMLElement) || store.mode() !== 'manual') { clearMarkers(); return; }
            root.querySelectorAll('button').forEach((button) => {
                if (!isEmojiCandidate(button)) return;
                const record = recordFromButton(button);
                const favorite = store.getManual().some((entry) => entry.key === record?.key);
                if (!favorite) { button.removeAttribute(FAVORITE_ATTR); button.style.removeProperty('outline'); button.style.removeProperty('outline-offset'); return; }
                button.setAttribute(FAVORITE_ATTR, '1');
                button.style.outline = '2px solid rgba(251,191,36,.9)';
                button.style.outlineOffset = '2px';
            });
        };
        const reactionPickerIsActive = () => Date.now() - reactionPickerOpenedAt <= PICKER_TIMEOUT_MS;
        const findOpenReactionPicker = () => [...document.querySelectorAll('div')].find((candidate) => {
            if (!isVisible(candidate) || candidate.closest(`[${REACTION_GROUP_ATTR}="1"]`)) return false;
            const className = String(candidate.className || '').toLowerCase();
            if (!/reaction|picker|emoji/.test(className)) return false;
            const pickerMessage = candidate.closest('[data-msg-id]');
            if (activeReactionMessage && pickerMessage instanceof HTMLElement && pickerMessage !== activeReactionMessage) return false;
            return [...candidate.querySelectorAll('button')].filter(isReactionCandidate).length >= 3;
        }) || null;
        const clearReactionMarkers = () => document.querySelectorAll(`[${REACTION_FAVORITE_ATTR}="1"]`).forEach((button) => {
            button.removeAttribute(REACTION_FAVORITE_ATTR);
            button.style.removeProperty('outline');
            button.style.removeProperty('outline-offset');
        });
        const markReactionPicker = (root = activeReactionPicker) => {
            if (!(root instanceof HTMLElement) || store.mode() !== 'manual') { clearReactionMarkers(); return; }
            root.querySelectorAll('button').forEach((button) => {
                if (!isReactionCandidate(button)) return;
                const record = reactionRecordFromButton(button);
                const favorite = reactions.getManual().some((entry) => entry.key === record?.key);
                if (!favorite) { button.removeAttribute(REACTION_FAVORITE_ATTR); button.style.removeProperty('outline'); button.style.removeProperty('outline-offset'); return; }
                button.setAttribute(REACTION_FAVORITE_ATTR, '1');
                button.style.outline = '2px solid rgba(251,191,36,.9)';
                button.style.outlineOffset = '2px';
            });
        };
        const removeReactionButtons = (root = document) => root.querySelectorAll?.(`[${REACTION_GROUP_ATTR}="1"]`).forEach((element) => {
            element.parentElement?.removeAttribute(REACTION_HOST_ATTR);
            element.remove();
        });
        const armReactionPicker = (message) => {
            activeReactionMessage = message instanceof HTMLElement ? message : null;
            activeReactionPicker = null;
            reactionPickerOpenedAt = Date.now();
            context.later(100, () => { activeReactionPicker = findOpenReactionPicker(); markReactionPicker(); });
            context.later(350, () => { activeReactionPicker = findOpenReactionPicker() || activeReactionPicker; markReactionPicker(); });
        };
        const findPickerReactionButton = (picker, favorite) => {
            if (!(picker instanceof HTMLElement)) return null;
            const target = normalizeReactionRecord(favorite);
            const score = (record) => Number(record?.key === target?.key) * 10 + Number(record?.emojiValue && record.emojiValue === target?.emojiValue) * 8 + Number(record?.label && record.label === target?.label) * 4;
            const best = [...picker.querySelectorAll('button')].filter(isReactionCandidate).map((button) => ({ button, score: score(reactionRecordFromButton(button)) }))
                .sort((left, right) => right.score - left.score)[0];
            return best?.score > 0 ? best.button : null;
        };
        const sendFavoriteReaction = (message, favorite) => new Promise((resolve) => {
            const trigger = getReactionTrigger(message);
            if (!(trigger instanceof HTMLButtonElement) || trigger.disabled) { resolve({ ok: false, message: 'Bouton de réaction introuvable.' }); return; }
            armReactionPicker(message); trigger.click();
            let attempts = 0;
            const select = () => {
                const picker = findOpenReactionPicker();
                const button = findPickerReactionButton(picker, favorite);
                if (button instanceof HTMLButtonElement) { button.click(); resolve({ ok: true, message: 'Réaction envoyée.' }); return; }
                attempts += 1;
                if (attempts >= 12) { resolve({ ok: false, message: 'Réaction introuvable dans le picker.' }); return; }
                context.later(35, select);
            };
            context.later(35, select);
        });
        const renderReactionButtons = (root = context.platform.getChatMessagesRoot()) => {
            if (!(root instanceof HTMLElement)) return;
            const favorites = reactions.favorites(store.mode());
            for (const message of context.platform.getMessages(root)) {
                const actions = getMessageActions(message);
                const trigger = getReactionTrigger(message);
                const old = actions?.querySelector(`[${REACTION_GROUP_ATTR}="1"]`);
                if (!(actions instanceof HTMLElement) || !(trigger instanceof HTMLButtonElement) || !favorites.length) { old?.remove(); actions?.removeAttribute(REACTION_HOST_ATTR); continue; }
                // Le bouton de réaction est généralement enveloppé dans un pickerWrap
                // étroit : le groupe doit être frère de ce wrapper pour rester sur la ligne d'actions.
                const triggerHost = trigger.parentElement instanceof HTMLElement
                    && trigger.parentElement.parentElement === actions
                    ? trigger.parentElement
                    : trigger;
                const signature = favorites.map((entry) => `${entry.key}:${entry.count}`).join('|');
                if (old instanceof HTMLElement && old.dataset.signature === signature && old.previousElementSibling === triggerHost) continue;
                const group = old instanceof HTMLElement ? old : document.createElement('span');
                group.setAttribute(REACTION_GROUP_ATTR, '1'); group.dataset.signature = signature;
                group.replaceChildren(); group.style.cssText = 'display:inline-flex;align-items:center;flex-wrap:nowrap;gap:1px;margin-left:2px;padding-left:2px;border-left:1px solid rgba(251,191,36,.16);white-space:nowrap;';
                actions.style.setProperty('display', 'inline-flex', 'important');
                actions.style.setProperty('align-items', 'center', 'important');
                actions.style.setProperty('flex-wrap', 'nowrap', 'important');
                actions.style.setProperty('white-space', 'nowrap', 'important');
                actions.style.setProperty('overflow', 'visible', 'important');
                actions.style.setProperty('width', 'max-content', 'important');
                favorites.forEach((favorite) => {
                    const label = reactionLabel(favorite);
                    const button = document.createElement('button'); button.type = 'button';
                    button.title = favorite.isManual && !favorite.count ? `${label || 'Réaction'} · favori manuel` : `${label || 'Réaction'} · ${favorite.count} utilisation${favorite.count > 1 ? 's' : ''}`;
                    button.setAttribute('aria-label', `Envoyer ${label || 'cette réaction'}`);
                    button.style.cssText = 'display:inline-grid;place-items:center;width:20px;height:20px;min-width:20px;padding:0;border:1px solid rgba(251,191,36,.22);border-radius:6px;background:rgba(113,63,18,.28);color:#fef3c7;cursor:pointer;overflow:hidden;';
                    if (favorite.src) { const image = document.createElement('img'); image.src = favorite.src; image.alt = label; image.style.cssText = 'width:15px;height:15px;object-fit:contain;pointer-events:none;'; button.append(image); }
                    else { const text = document.createElement('span'); text.textContent = label || '•'; text.style.cssText = `font-size:${isUnicodeEmoji(label) ? '13px' : '9px'};font-weight:700;line-height:1;pointer-events:none;`; button.append(text); }
                    button.addEventListener('click', async (event) => {
                        event.preventDefault(); event.stopPropagation(); if (button.disabled) return;
                        button.disabled = true; button.style.opacity = '.55';
                        const result = await sendFavoriteReaction(message, favorite);
                        context.ui.toast.show(result.message, { error: !result.ok });
                        button.disabled = false; button.style.opacity = '1';
                    });
                    group.append(button);
                });
                actions.setAttribute(REACTION_HOST_ATTR, '1');
                triggerHost.insertAdjacentElement('afterend', group);
            }
        };
        const renderToolbar = () => {
            const favorites = store.favorites();
            toolbar.replaceChildren();
            if (!favorites.length) {
                if (toolbarMounted) context.mediaToolbar.unmount(TOOLBAR_ID);
                toolbarMounted = false;
                return;
            }
            for (const favorite of favorites) {
                const insertText = insertionText(favorite);
                const button = document.createElement('button'); button.type = 'button';
                button.title = favorite.isManual ? `${insertText} · favori manuel` : `${insertText} · ${favorite.count} utilisation${favorite.count > 1 ? 's' : ''}`;
                button.setAttribute('aria-label', `Insérer ${insertText || 'cet emoji'}`);
                button.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;min-width:28px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:rgba(39,39,42,.92);color:#f4f4f5;cursor:pointer;overflow:hidden;line-height:1;text-align:center;';
                if (favorite.src) {
                    const image = document.createElement('img'); image.src = favorite.src; image.alt = insertText; image.style.cssText = 'display:block;width:21px;height:21px;margin:auto;object-fit:contain;pointer-events:none;'; button.append(image);
                } else {
                    const label = document.createElement('span'); label.textContent = insertText; label.style.cssText = `display:block;font-size:${isUnicodeEmoji(insertText) ? '17px' : '9px'};line-height:1;font-weight:700;transform:translateY(.5px);`; button.append(label);
                }
                button.addEventListener('click', () => {
                    const result = context.input.insert(context.input.get(), insertText, { successMessage: 'Emoji inséré.' });
                    context.ui.toast.show(result.message, { error: !result.ok });
                    if (result.ok) { store.record(favorite); renderToolbar(); }
                });
                toolbar.append(button);
            }
            context.mediaToolbar.mount(TOOLBAR_ID, toolbar);
            toolbarMounted = true;
        };
        const refresh = () => { renderToolbar(); markPicker(); markReactionPicker(); renderReactionButtons(); context.mediaToolbar.refresh(); };
        const armNativePicker = () => {
            pickerOpenedAt = Date.now(); activePicker = null;
            context.later(100, () => { activePicker = findOpenPicker(); markPicker(); });
            context.later(350, () => { activePicker = findOpenPicker() || activePicker; markPicker(); });
        };
        const openNativePicker = () => {
            const trigger = findNativeEmojiTrigger(context.input.get());
            if (!(trigger instanceof HTMLButtonElement)) {
                context.ui.toast.show('Le picker emoji est introuvable sur cette page.', { error: true });
                return false;
            }
            armNativePicker();
            trigger.click();
            return true;
        };
        const openManager = () => {
            context.ui.settings.close();
            manager?.open();
        };
        const runtime = {
            getMode: store.mode,
            setMode: (value) => { store.setMode(value); refresh(); },
            getLimit: store.limit,
            setLimit: (value) => { store.setLimit(value); refresh(); },
            getUsage: store.getUsage,
            getManual: store.getManual,
            toggleManual: (value) => { const result = store.toggleManual(value); refresh(); return result; },
            removeManual: (index) => { const result = store.removeManual(index); refresh(); return result; },
            moveManual: (index, delta) => { const result = store.moveManual(index, delta); refresh(); return result; },
            clearUsage: () => { store.clearUsage(); refresh(); },
            reactions: {
                getLimit: reactions.limit,
                setLimit: (value) => { reactions.setLimit(value); refresh(); },
                getUsage: reactions.getUsage,
                getManual: reactions.getManual,
                toggleManual: (value) => { const result = reactions.toggleManual(value); refresh(); return result; },
                removeManual: (index) => { const result = reactions.removeManual(index); refresh(); return result; },
                moveManual: (index, delta) => { const result = reactions.moveManual(index, delta); refresh(); return result; },
                clearUsage: () => { reactions.clearUsage(); refresh(); }
            },
            openNativePicker,
            openManager,
            toast: (message, error = false) => context.ui.toast.show(message, { error })
        };
        manager = createEmojiFavoritesManager({ runtime });
        context.emojiFavorites = runtime;

        context.on(document, 'click', (event) => {
            const trigger = nativeEmojiTrigger(event.target, context.input.get());
            if (trigger) {
                armNativePicker();
                return;
            }
            if (!pickerIsActive()) return;
            const button = event.target instanceof Element ? event.target.closest('button') : null;
            if (!(button instanceof HTMLButtonElement) || !isEmojiCandidate(button)) return;
            const root = pickerRootFor(button);
            if (!(root instanceof HTMLElement)) return;
            activePicker = root;
            const record = recordFromButton(button);
            if (!record) return;
            if (store.mode() === 'manual' && (event.shiftKey || context.shortcuts.hasPlatformModifier(event))) {
                event.preventDefault(); event.stopImmediatePropagation();
                const result = store.toggleManual(record); context.ui.toast.show(result.message, { error: !result.ok }); markPicker(root); return;
            }
            store.record(record); renderToolbar();
        }, true);
        context.on(document, 'pointerdown', (event) => {
            if (!pickerIsActive() || !(event.target instanceof Element)) return;
            const button = event.target.closest('button'); const root = pickerRootFor(button);
            if (root) { activePicker = root; markPicker(root); }
        }, true);
        context.on(document, 'click', (event) => {
            if (!(event.target instanceof Element)) return;
            const clicked = event.target.closest('button');
            const message = context.platform.findMessageElement(clicked);
            const trigger = getReactionTrigger(message);
            if (clicked instanceof HTMLButtonElement && trigger instanceof HTMLButtonElement && (clicked === trigger || trigger.contains(clicked))) {
                armReactionPicker(message);
                return;
            }
            if (!reactionPickerIsActive() || !(clicked instanceof HTMLButtonElement) || !isReactionCandidate(clicked)) return;
            const root = reactionPickerRootFor(clicked, activeReactionMessage);
            if (!(root instanceof HTMLElement)) return;
            activeReactionPicker = root;
            const record = reactionRecordFromButton(clicked);
            if (!record) return;
            if (store.mode() === 'manual' && (event.shiftKey || context.shortcuts.hasPlatformModifier(event))) {
                event.preventDefault(); event.stopImmediatePropagation();
                const result = reactions.toggleManual(record); context.ui.toast.show(result.message, { error: !result.ok }); markReactionPicker(root); return;
            }
            reactions.record(record); renderReactionButtons();
        }, true);
        context.on(document, 'pointerdown', (event) => {
            if (!reactionPickerIsActive() || !(event.target instanceof Element)) return;
            const button = event.target.closest('button'); const root = reactionPickerRootFor(button, activeReactionMessage);
            if (root) { activeReactionPicker = root; markReactionPicker(root); }
        }, true);
        context.messages.subscribe((message) => renderReactionButtons(message.element));
        const reload = () => { store.reload(); reactions.reload(); refresh(); };
        context.on(window, 'storage', (event) => { if ([...Object.values(STORAGE_KEYS), ...Object.values(REACTION_STORAGE_KEYS)].includes(event.key)) reload(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, reload);
        context.every(900, () => { if (pickerIsActive()) markPicker(); if (reactionPickerIsActive()) markReactionPicker(); });
        renderToolbar(); renderReactionButtons();
        return () => {
            delete context.emojiFavorites;
            manager?.destroy();
            clearMarkers();
            clearReactionMarkers();
            removeReactionButtons();
            context.mediaToolbar.unmount(TOOLBAR_ID);
        };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
