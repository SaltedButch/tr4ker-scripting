import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderEmojiFavoritesSettings } from './settings.js';
import { createEmojiFavoritesStore, insertionText, normalizeRecord, STORAGE_KEYS } from './store.js';

const TOOLBAR_ID = 'emoji-favorites';
const TOOLBAR_ATTR = 'data-tm-t4-emoji-favorites';
const FAVORITE_ATTR = 'data-tm-t4-emoji-favorite';
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

export default defineFeature({
    id: 'emoji-favorites',
    label: 'Emojis favoris',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: Object.values(STORAGE_KEYS),
    settings: { area: 'shoutbox', category: 'media', order: 15, render: renderEmojiFavoritesSettings },
    hints: [
        { id: 'purpose', title: 'Fonctionnement', text: 'Ajoute vos emojis favoris au-dessus du champ de discussion.', kind: 'info', order: 10 },
        { id: 'manual', title: 'Favoris manuels', text: 'En mode manuel, utilisez Maj+clic ou Alt/⌘+clic sur un emoji du picker natif pour l’ajouter ou le retirer des favoris.', kind: 'tip', order: 20 }
    ],
    setup(context) {
        const store = createEmojiFavoritesStore({ storage: context.storage });
        const toolbar = document.createElement('div');
        toolbar.setAttribute(TOOLBAR_ATTR, '1');
        toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;pointer-events:auto;';
        let pickerOpenedAt = 0;
        let activePicker = null;
        let toolbarMounted = false;

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
                button.style.cssText = 'display:inline-grid;place-items:center;width:28px;height:28px;padding:2px;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:rgba(39,39,42,.92);color:#f4f4f5;cursor:pointer;overflow:hidden;';
                if (favorite.src) {
                    const image = document.createElement('img'); image.src = favorite.src; image.alt = insertText; image.style.cssText = 'width:21px;height:21px;object-fit:contain;pointer-events:none;'; button.append(image);
                } else {
                    const label = document.createElement('span'); label.textContent = insertText; label.style.cssText = `font-size:${isUnicodeEmoji(insertText) ? '17px' : '9px'};line-height:1;font-weight:700;`; button.append(label);
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
        const refresh = () => { renderToolbar(); markPicker(); context.mediaToolbar.refresh(); };
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
            toast: (message, error = false) => context.ui.toast.show(message, { error })
        };
        context.emojiFavorites = runtime;

        context.on(document, 'click', (event) => {
            const trigger = nativeEmojiTrigger(event.target, context.input.get());
            if (trigger) {
                pickerOpenedAt = Date.now(); activePicker = null;
                context.later(100, () => { activePicker = findOpenPicker(); markPicker(); });
                context.later(350, () => { activePicker = findOpenPicker() || activePicker; markPicker(); });
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
        const reload = () => { store.reload(); refresh(); };
        context.on(window, 'storage', (event) => { if (Object.values(STORAGE_KEYS).includes(event.key)) reload(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, reload);
        context.every(900, () => { if (pickerIsActive()) markPicker(); });
        renderToolbar();
        return () => {
            delete context.emojiFavorites;
            clearMarkers();
            context.mediaToolbar.unmount(TOOLBAR_ID);
        };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
