/**
 * Implémente la feature « Saved Phrases » et son cycle de vie.
 *
 * @module src/features/saved-phrases/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createMediaButton, createMediaMenu, hideMediaMenu, positionMediaMenu, showMediaMenu } from '../../core/media-menu.js';
import { createSavedPhrasesManager } from './manager.js';
import { renderSavedPhrasesSettings } from './settings.js';
import { createSavedPhrasesStore, downloadSavedPhrases, STORAGE_KEYS } from './store.js';

const MAX_VISIBLE_PHRASES = 5;

function label(button) {
    return [button.getAttribute('title'), button.getAttribute('aria-label'), button.textContent]
        .filter(Boolean)
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr');
}

function isReplyButton(button) {
    if (!(button instanceof HTMLButtonElement)) return false;
    if (/\b(repondre|reponse|reply)\b/.test(label(button))) return true;
    return String(button.querySelector('.material-symbols-outlined')?.textContent || '').trim().toLowerCase() === 'reply';
}

function truncate(value, maxLength = 120) {
    const text = String(value || '');
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function makeTextButton(labelText, background = '#3f3f46') {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = labelText;
    button.style.cssText = `border:0;border-radius:8px;background:${background};color:#fff;padding:7px 9px;cursor:pointer;font-size:11px;font-weight:700;`;
    return button;
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'saved-phrases',
    label: 'Réponses rapides',
    defaultEnabled: false,
    legacyEnabledStorageKey: STORAGE_KEYS.enabled,
    pages: ['chat'],
    storageKeys: Object.values(STORAGE_KEYS),
    settings: { area: 'shoutbox', category: 'chat', order: 30, render: renderSavedPhrasesSettings },
    shortcuts: [{ id: 'open-menu', key: 'R', modifiers: ['ctrl', 'platform'], allowInEditable: true }],
    hints: [
        { id: 'purpose', title: 'Fonctionnement', text: 'Enregistre des messages réutilisables et propose les plus pertinents selon le texte en cours ou le message auquel vous répondez.', kind: 'info', order: 10 },
        { id: 'shortcut', title: 'Raccourci', text: 'Utilisez {{shortcut:open-menu}} pour ouvrir les réponses rapides au clavier.', kind: 'tip', order: 20 }
    ],
    setup(context) {
        const store = createSavedPhrasesStore({ storage: context.storage, maxLength: context.input.maxMessageLength });
        let replyContext = null;
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;pointer-events:auto;';
        const toggle = createMediaButton({
            label: '✨ Réponses rapides', title: 'Ouvrir les réponses rapides',
            colors: { background: 'linear-gradient(135deg,rgba(88,28,135,.82),rgba(30,58,138,.82))', border: 'rgba(167,139,250,.38)', text: '#f5f3ff' }
        });
        const addButton = createMediaButton({
            label: '+', title: 'Ajouter une réponse rapide depuis le texte du chat',
            colors: { background: 'linear-gradient(135deg,rgba(30,64,175,.84),rgba(8,145,178,.84))', border: 'rgba(125,211,252,.34)', text: '#eff6ff' }
        });
        addButton.style.width = '28px'; addButton.style.padding = '0'; addButton.style.fontSize = '17px';
        toolbar.append(toggle, addButton);

        const menu = createMediaMenu({ width: 365, maxHeight: '70vh' });
        menu.setAttribute('aria-label', 'Réponses rapides');
        const picker = createMediaMenu({ width: 520, maxHeight: '76vh' });
        picker.setAttribute('aria-label', 'Toutes les réponses rapides');
        const addMenu = createMediaMenu({ width: 480, maxHeight: '70vh' });
        addMenu.setAttribute('aria-label', 'Ajouter une réponse rapide');

        const currentReplyText = () => {
            const activeContext = context.platform.getCurrentChatContext()?.key || '';
            return replyContext?.contextKey === activeContext ? replyContext.text : '';
        };
        const rank = () => store.rank({ inputText: context.input.getValue(context.input.get()), replyText: currentReplyText() });
        const closeMenus = () => { hideMediaMenu(menu); hideMediaMenu(picker); hideMediaMenu(addMenu); };
        const refreshToolbar = () => context.mediaToolbar.refresh();
        const insert = (phrase) => {
            const result = context.input.insert(context.input.get(), phrase.text, {
                replace: context.storage.readBoolean(STORAGE_KEYS.replaceInput, false),
                successMessage: 'Réponse rapide insérée.'
            });
            context.ui.toast.show(result.message, { error: !result.ok });
            if (result.ok) closeMenus();
        };
        let manager = null;
        const openManager = () => {
            closeMenus();
            context.ui.settings.close();
            manager?.open();
        };

        const renderMenu = ({ focusFirst = false } = {}) => {
            menu.replaceChildren();
            const header = document.createElement('div'); header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:9px;padding:2px 2px 8px;';
            const title = document.createElement('strong'); title.textContent = 'Réponses rapides'; title.style.fontSize = '13px';
            const replaceLabel = document.createElement('label'); replaceLabel.title = 'Remplacer le texte déjà présent avant insertion'; replaceLabel.style.cssText = 'display:flex;align-items:center;gap:5px;color:#c4b5fd;font-size:11px;cursor:pointer;';
            const replace = document.createElement('input'); replace.type = 'checkbox'; replace.checked = context.storage.readBoolean(STORAGE_KEYS.replaceInput, false); replace.style.accentColor = '#8b5cf6';
            replace.addEventListener('click', (event) => event.stopPropagation());
            replace.addEventListener('change', () => context.storage.writeBoolean(STORAGE_KEYS.replaceInput, replace.checked));
            replaceLabel.append(replace, document.createTextNode('Remplacer'));
            header.append(title, replaceLabel); menu.append(header);

            const entries = rank();
            const contextual = entries.some((entry) => entry.score > 0);
            if (contextual) {
                const note = document.createElement('div'); note.textContent = 'Suggestions contextuelles'; note.style.cssText = 'padding:0 3px 7px;color:#c4b5fd;font-size:11px;'; menu.append(note);
            }
            if (!entries.length) {
                const empty = document.createElement('div'); empty.textContent = 'Aucune réponse rapide enregistrée.'; empty.style.cssText = 'padding:12px 5px;color:#a1a1aa;font-size:12px;text-align:center;'; menu.append(empty);
            }
            entries.slice(0, MAX_VISIBLE_PHRASES).forEach((entry) => {
                const choice = document.createElement('button'); choice.type = 'button'; choice.dataset.tmSavedPhraseChoice = '1';
                choice.title = [entry.phrase.text, entry.phrase.keywords.length ? `Mots-clés : ${entry.phrase.keywords.join(', ')}` : '', entry.matchedKeywords.length ? `Correspondance : ${entry.matchedKeywords.join(', ')}` : ''].filter(Boolean).join('\n');
                choice.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;border:0;border-radius:8px;background:transparent;color:#e4e4e7;padding:8px 9px;cursor:pointer;text-align:left;font-size:12px;';
                choice.addEventListener('mouseenter', () => { choice.style.background = 'rgba(139,92,246,.18)'; });
                choice.addEventListener('mouseleave', () => { choice.style.background = 'transparent'; });
                if (contextual && entry.matchPercent > 0) {
                    const score = document.createElement('span'); score.textContent = `${entry.matchPercent}%`; score.style.cssText = 'flex:0 0 auto;border:1px solid rgba(74,222,128,.28);border-radius:999px;background:rgba(34,197,94,.17);color:#bbf7d0;padding:2px 5px;font-size:10px;font-weight:700;'; choice.append(score);
                }
                const phrase = document.createElement('span'); phrase.textContent = truncate(entry.phrase.text); phrase.style.cssText = 'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; choice.append(phrase);
                choice.addEventListener('click', () => insert(entry.phrase)); menu.append(choice);
            });
            if (entries.length > MAX_VISIBLE_PHRASES) {
                const all = makeTextButton(`Toutes les réponses (${entries.length})`, '#4c1d95'); all.style.cssText += 'width:100%;margin-top:7px;text-align:left;'; all.addEventListener('click', () => openPicker()); menu.append(all);
            }
            const manage = makeTextButton('Gérer les réponses rapides'); manage.style.cssText += 'width:100%;margin-top:7px;text-align:left;'; manage.addEventListener('click', openManager); menu.append(manage);
            if (menu.dataset.tmOpen === '1') positionMediaMenu(menu, toggle);
            if (focusFirst) window.requestAnimationFrame(() => menu.querySelector('[data-tm-saved-phrase-choice="1"]')?.focus());
        };

        const openMenu = ({ focusFirst = false } = {}) => {
            if (!store.list().length) { context.ui.toast.show('Aucune réponse rapide enregistrée.', { error: true }); return false; }
            hideMediaMenu(picker); hideMediaMenu(addMenu); renderMenu({ focusFirst }); showMediaMenu(menu, toggle); return true;
        };

        const openPicker = () => {
            hideMediaMenu(menu); hideMediaMenu(addMenu); picker.replaceChildren();
            const title = document.createElement('strong'); title.textContent = 'Toutes les réponses rapides';
            const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Filtrer par texte ou mot-clé'; search.setAttribute('aria-label', search.placeholder); search.style.cssText = 'width:100%;margin-top:9px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#18181b;color:#fff;padding:8px 9px;';
            const list = document.createElement('div'); list.style.cssText = 'display:grid;gap:7px;margin-top:10px;';
            const render = () => {
                const query = search.value.trim().toLocaleLowerCase('fr'); list.replaceChildren();
                const entries = rank().filter((entry) => !query || `${entry.phrase.text} ${entry.phrase.keywords.join(' ')}`.toLocaleLowerCase('fr').includes(query));
                if (!entries.length) { const empty = document.createElement('div'); empty.textContent = 'Aucune réponse trouvée.'; empty.style.cssText = 'padding:12px;text-align:center;color:#a1a1aa;'; list.append(empty); return; }
                for (const entry of entries) {
                    const choice = document.createElement('button'); choice.type = 'button'; choice.style.cssText = 'border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.03);color:#f4f4f5;padding:8px 9px;text-align:left;cursor:pointer;';
                    const phrase = document.createElement('div'); phrase.textContent = entry.phrase.text; phrase.style.cssText = 'white-space:pre-wrap;font-size:12px;line-height:1.4;';
                    const keywords = document.createElement('div'); keywords.textContent = entry.phrase.keywords.join(', '); keywords.style.cssText = 'margin-top:4px;color:#c4b5fd;font-size:10px;';
                    choice.append(phrase); if (entry.phrase.keywords.length) choice.append(keywords); choice.addEventListener('click', () => insert(entry.phrase)); list.append(choice);
                }
                if (picker.dataset.tmOpen === '1') positionMediaMenu(picker, toggle);
            };
            search.addEventListener('input', render); search.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideMediaMenu(picker); });
            const manage = makeTextButton('Gérer les réponses rapides'); manage.style.marginTop = '10px'; manage.addEventListener('click', openManager);
            picker.append(title, search, list, manage); render(); showMediaMenu(picker, toggle); window.requestAnimationFrame(() => search.focus());
        };

        const openAddMenu = () => {
            hideMediaMenu(menu); hideMediaMenu(picker); addMenu.replaceChildren();
            const title = document.createElement('strong'); title.textContent = 'Ajouter une réponse rapide';
            const text = document.createElement('textarea'); text.rows = 5; text.maxLength = store.maxLength; text.value = context.input.getValue(context.input.get()); text.placeholder = 'Texte de la réponse'; text.style.cssText = 'width:100%;min-height:105px;margin-top:9px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#18181b;color:#fff;padding:9px;font:12px/1.45 system-ui,sans-serif;resize:vertical;';
            const keywords = document.createElement('input'); keywords.type = 'text'; keywords.placeholder = 'Mots-clés (optionnels)'; keywords.style.cssText = 'width:100%;margin-top:8px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#18181b;color:#fff;padding:8px 9px;';
            const save = makeTextButton('Enregistrer', '#2563eb'); save.style.marginTop = '9px';
            save.addEventListener('click', () => { const result = store.add(text.value, keywords.value); context.ui.toast.show(result.message, { error: !result.ok }); if (result.ok) { hideMediaMenu(addMenu); renderMenu(); refreshToolbar(); } });
            text.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); save.click(); } });
            addMenu.append(title, text, keywords, save); showMediaMenu(addMenu, addButton); window.requestAnimationFrame(() => { text.focus(); text.setSelectionRange(text.value.length, text.value.length); });
        };

        const syncAfterChange = () => { renderMenu(); refreshToolbar(); };
        manager = createSavedPhrasesManager({
            store,
            getReplaceInput: () => context.storage.readBoolean(STORAGE_KEYS.replaceInput, false),
            setReplaceInput: (enabled) => context.storage.writeBoolean(STORAGE_KEYS.replaceInput, enabled),
            download: () => downloadSavedPhrases(store.exportPayload()),
            onChange: syncAfterChange,
            toast: (message) => context.ui.toast.show(message)
        });

        const runtime = {
            maxLength: store.maxLength,
            list: store.list,
            add: (...args) => { const result = store.add(...args); syncAfterChange(); return result; },
            update: (...args) => { const result = store.update(...args); syncAfterChange(); return result; },
            remove: (...args) => { const result = store.remove(...args); syncAfterChange(); return result; },
            getReplaceInput: () => context.storage.readBoolean(STORAGE_KEYS.replaceInput, false),
            setReplaceInput: (enabled) => context.storage.writeBoolean(STORAGE_KEYS.replaceInput, enabled),
            download: () => downloadSavedPhrases(store.exportPayload()),
            importPayload: (payload) => { const result = store.importPayload(payload); syncAfterChange(); return result; },
            openManager
        };
        context.savedPhrases = runtime;

        toggle.addEventListener('click', () => { if (menu.dataset.tmOpen === '1') hideMediaMenu(menu); else openMenu(); });
        addButton.addEventListener('click', openAddMenu);
        menu.addEventListener('keydown', (event) => {
            const choices = [...menu.querySelectorAll('[data-tm-saved-phrase-choice="1"]')];
            if (!choices.length) return;
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const current = choices.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
            choices[next].focus();
        });
        context.shortcuts.bind('open-menu', () => openMenu({ focusFirst: true }));
        context.on(document, 'click', (event) => {
            if (event.target instanceof Node && [menu, picker, addMenu, toggle, addButton].some((element) => element.contains(event.target))) return;
            closeMenus();
        });
        context.on(document, 'click', (event) => {
            const button = event.target instanceof Element ? event.target.closest('button') : null;
            if (!isReplyButton(button)) return;
            const message = button.closest(context.platform.messageSelector);
            const details = message instanceof HTMLElement ? context.platform.getMessageDetails(message) : null;
            if (!details) return;
            replyContext = { contextKey: context.platform.getCurrentChatContext()?.key || '', text: [details.username, details.replyText, details.text].filter(Boolean).join(' ') };
        }, true);
        context.on(document, 'input', (event) => {
            if (event.target === context.input.get() && menu.dataset.tmOpen === '1') renderMenu();
        }, true);
        const reload = () => { store.reload(); renderMenu(); refreshToolbar(); };
        context.on(window, 'storage', (event) => { if (Object.values(STORAGE_KEYS).includes(event.key)) reload(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, reload);
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') closeMenus(); });
        context.on(window, 'resize', () => { for (const [opened, anchor] of [[menu, toggle], [picker, toggle], [addMenu, addButton]]) if (opened.dataset.tmOpen === '1') positionMediaMenu(opened, anchor); });
        context.on(window, 'scroll', () => { for (const [opened, anchor] of [[menu, toggle], [picker, toggle], [addMenu, addButton]]) if (opened.dataset.tmOpen === '1') positionMediaMenu(opened, anchor); }, true);
        context.mediaToolbar.mount('saved-phrases', toolbar);
        context.every(1000, refreshToolbar);
        return () => {
            delete context.savedPhrases;
            context.mediaToolbar.unmount('saved-phrases');
            manager?.destroy();
            menu.remove(); picker.remove(); addMenu.remove();
        };
    },
    onRoute(context) { context.mediaToolbar.refresh(); }
});
