/**
 * Implémente la feature « Multi Channel View » et son cycle de vie.
 *
 * @module src/features/multi-channel-view/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderMultiChannelViewSettings } from './settings.js';

const OPEN_IDS_STORAGE_KEY = 'tm_t4_multi_channel_view_open_ids';
const PLUS_ATTR = 'data-tm-t4-multi-channel-plus';
const PANE_ATTR = 'data-tm-t4-multi-channel-pane';
const NATIVE_ATTR = 'data-tm-t4-multi-channel-native';
const STYLE_ID = 'tm-t4-next-multi-channel-view-style';
const MAX_CHANNELS = 4;
const NATIVE_ROLE_COLORS = Object.freeze({
    user: '#f472b6', membre: '#f472b6', helper: '#ffffff', uploader_herbe: '#7dd3fc',
    uploader: '#2563eb', team: '#f87171', contributeur: '#f4f4f5', moderator: '#16a34a', admin: '#16a34a'
});

function comparable(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');
}

function safeOpenedIds(storage) {
    const raw = storage.readJson(OPEN_IDS_STORAGE_KEY, []);
    return Array.isArray(raw) ? [...new Set(raw.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, MAX_CHANNELS - 1) : [];
}

function saveOpenedIds(storage, ids) {
    storage.writeJson(OPEN_IDS_STORAGE_KEY, [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, MAX_CHANNELS - 1));
}

function findChild(element, selector) {
    return element instanceof HTMLElement ? element.querySelector(selector) : null;
}

function cloneShell(element, fallbackTag = 'div') {
    if (element instanceof HTMLElement) return element.cloneNode(false);
    return document.createElement(fallbackTag);
}

function getChannelRows(platform) {
    const sidebar = platform.getChatSidebarLayout()?.sidebar;
    if (!(sidebar instanceof HTMLElement)) return [];
    const section = [...sidebar.querySelectorAll('section')].find((candidate) => comparable(candidate.querySelector('[class*="sectionLabelText"]')?.textContent) === 'canaux');
    if (!(section instanceof HTMLElement)) return [];
    return [...section.querySelectorAll('[role="button"]')].map((row) => ({
        row,
        name: String(row.querySelector('[class*="navName"]')?.textContent || '').trim(),
        joined: !row.querySelector('[class*="joinBadge"]')
    })).filter((entry) => entry.name);
}

async function fetchChannels() {
    const response = await fetch('/api/channels', { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return (Array.isArray(payload?.channels) ? payload.channels : []).map((channel) => ({
        id: String(channel?.id ?? '').trim(),
        slug: String(channel?.slug ?? '').trim(),
        name: String(channel?.name ?? channel?.slug ?? '').trim(),
        description: String(channel?.description ?? '').trim(),
        isMember: channel?.is_member === true
    })).filter((channel) => channel.id && channel.slug && channel.name);
}

async function fetchMessages(channelId) {
    const response = await fetch(`/api/conversations/${encodeURIComponent(channelId)}/messages`, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return (Array.isArray(payload?.messages) ? payload.messages : []).reverse();
}

async function fetchCurrentUserId() {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const user = await response.json();
    return user?.id === undefined || user?.id === null ? '' : String(user.id);
}

function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function senderName(message) {
    return String(message?.sender ?? message?.author?.username ?? message?.username ?? 'Utilisateur').trim() || 'Utilisateur';
}

function avatarInitial(name) {
    return String(name || '?').trim().slice(0, 1).toLocaleUpperCase('fr') || '?';
}

function appendMessageBody(container, body) {
    const source = String(body || '');
    const imagePattern = /\[img\](https?:\/\/[^\s\]]+)\[\/img\]/gi;
    let offset = 0;
    for (const match of source.matchAll(imagePattern)) {
        if (match.index > offset) container.append(document.createTextNode(source.slice(offset, match.index)));
        const image = document.createElement('img');
        image.src = match[1]; image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
        image.style.cssText = 'display:block;max-width:min(100%,420px);max-height:320px;border-radius:8px;object-fit:contain;';
        container.append(image); offset = match.index + match[0].length;
    }
    if (offset < source.length || !container.childNodes.length) container.append(document.createTextNode(source.slice(offset) || 'Message supprimé'));
}

function createSocket(onPacket) {
    let socket = null;
    let retryTimer = null;
    let stopped = false;
    const queue = [];
    const connect = () => {
        if (stopped || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${location.host}/api/ws`);
        socket.addEventListener('open', () => { while (queue.length) socket?.send(queue.shift()); });
        socket.addEventListener('message', (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload?.type === 'ping') { socket?.send(JSON.stringify({ type: 'pong' })); return; }
                onPacket(payload);
            } catch { /* paquet non exploitable */ }
        });
        socket.addEventListener('close', () => {
            if (!stopped) retryTimer = window.setTimeout(connect, 1500);
        }, { once: true });
    };
    return Object.freeze({
        connect,
        send(packet) { queue.push(JSON.stringify(packet)); connect(); if (socket?.readyState === WebSocket.OPEN) socket.send(queue.shift()); },
        close() { stopped = true; if (retryTimer) window.clearTimeout(retryTimer); socket?.close(); }
    });
}

function getNativeWindow(chatArea) {
    return [...(chatArea?.children || [])].find((element) => element instanceof HTMLElement
        && !element.hasAttribute(PANE_ATTR) && [...element.classList].some((name) => name.includes('window'))) || null;
}

function createTemplates(nativeWindow) {
    const header = findChild(nativeWindow, ':scope > [class*="header"]');
    const headerLeft = findChild(header, '[class*="headerLeft"]');
    const icon = findChild(header, '[class*="convIcon"]');
    const titleGroup = findChild(header, '[class*="convTitleGroup"]');
    const titleRow = findChild(header, '[class*="convTitleRow"]');
    const title = findChild(header, '[class*="convTitle"]');
    const description = findChild(header, '[class*="convDescription"]');
    const list = findChild(nativeWindow, ':scope > [class*="messageList"]');
    const message = findChild(list, '[data-msg-id]');
    const avatar = findChild(message, ':scope > [class*="msgAvatar"], :scope > [class*="msgAvatarSpacer"]');
    const avatarSpacer = findChild(list, '[class*="msgAvatarSpacer"]');
    const avatarImage = findChild(message, '[class*="msgAvatarImg"]');
    const content = findChild(message, '[class*="msgContent"]');
    const meta = findChild(message, '[class*="msgMeta"]');
    const sender = findChild(message, '[class*="msgSender"]');
    const time = findChild(message, '[class*="msgTime"]');
    const bubble = findChild(message, '[class*="msgBubble"]');
    const actions = findChild(message, '[data-msg-actions]');
    const actionButton = findChild(actions, 'button');
    const inputWrapper = findChild(nativeWindow, ':scope > [class*="inputWrapper"]');
    const inputArea = findChild(inputWrapper, '[class*="inputArea"]');
    const inputField = findChild(inputWrapper, '[class*="inputField"]');
    const input = findChild(inputWrapper, 'textarea');
    const sendButton = findChild(inputWrapper, '[class*="sendBtn"]');
    return { nativeWindow, header, headerLeft, icon, titleGroup, titleRow, title, description, list, message, avatar, avatarSpacer, avatarImage, content, meta, sender, time, bubble, actions, actionButton, inputWrapper, inputArea, inputField, input, sendButton };
}

function createIcon(name) {
    const icon = document.createElement('span'); icon.className = 'material-symbols-outlined'; icon.textContent = name; return icon;
}

function normalizedControlLabel(button) {
    return [button?.getAttribute('aria-label'), button?.getAttribute('title'), button?.textContent]
        .filter(Boolean).join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
}

function getNativeReactionTrigger(nativeWindow) {
    if (!(nativeWindow instanceof HTMLElement)) return null;
    const buttons = [...nativeWindow.querySelectorAll('[data-msg-id] [data-msg-actions] button, [data-msg-actions] button')]
        .filter((button) => !button.closest(`[${PANE_ATTR}]`));
    return buttons.find((button) => {
        const icon = String(button.querySelector('.material-symbols-outlined')?.textContent || '').trim().toLocaleLowerCase();
        return /\b(reagir|reaction|react|emoji)\b/.test(normalizedControlLabel(button)) || icon === 'add_reaction' || icon === 'sentiment_satisfied';
    }) || null;
}

function reactionEmojiFromButton(button) {
    if (!(button instanceof HTMLButtonElement)) return '';
    const image = button.querySelector('img');
    const values = [button.getAttribute('data-emoji'), button.getAttribute('data-value'), button.getAttribute('data-name'), image?.getAttribute('alt'), button.textContent];
    return values.map((value) => String(value || '').trim()).find((value) => /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(value)) || '';
}

function nativeReactionPickerFor(button) {
    if (!(button instanceof HTMLButtonElement)) return null;
    let current = button.parentElement;
    while (current && current !== document.body) {
        if (current instanceof HTMLElement) {
            const className = String(current.className || '').toLocaleLowerCase('fr');
            const choices = [...current.querySelectorAll('button')].filter((candidate) => reactionEmojiFromButton(candidate));
            if (/reaction|picker|emoji/.test(className) && choices.length >= 3) return current;
        }
        current = current.parentElement;
    }
    return null;
}

function nativeRoleColor(role) {
    return NATIVE_ROLE_COLORS[String(role || '').trim()] || '#f472b6';
}

function reactionEntries(message) {
    const source = message?.reactions ?? message?.reaction_counts ?? {};
    if (Array.isArray(source)) {
        const counts = new Map();
        for (const entry of source) {
            const emoji = typeof entry === 'string' ? entry : String(entry?.emoji ?? entry?.reaction ?? entry?.value ?? '').trim();
            if (!emoji) continue;
            const count = typeof entry === 'object' ? Number(entry?.count ?? entry?.total ?? entry?.users?.length ?? 1) : 1;
            counts.set(emoji, (counts.get(emoji) || 0) + Math.max(1, Number.isFinite(count) ? count : 1));
        }
        return [...counts.entries()];
    }
    if (!source || typeof source !== 'object') return [];
    return Object.entries(source).filter(([, count]) => Number(count) > 0);
}

function cloneHeader(templates, channel, onClose) {
    const header = cloneShell(templates.header); const left = cloneShell(templates.headerLeft); const icon = cloneShell(templates.icon, 'span');
    icon.textContent = 'tag';
    const group = cloneShell(templates.titleGroup); const row = cloneShell(templates.titleRow); const title = cloneShell(templates.title, 'span');
    title.textContent = channel.name; row.append(title); group.append(row);
    if (channel.description) { const description = cloneShell(templates.description, 'span'); description.textContent = channel.description; group.append(description); }
    left.append(icon, group);
    const close = document.createElement('button'); close.type = 'button'; close.className = 'tm-t4-mcv-pane-close'; close.title = `Fermer #${channel.name}`; close.setAttribute('aria-label', close.title); close.append(createIcon('close')); close.addEventListener('click', onClose);
    header.append(left, close); return header;
}

function createMessageElement(templates, message, previousMessage, { currentUserId, editing, onReply, onReaction, onOpenNativeReactionPicker, onEdit, onCancelEdit }) {
    const row = cloneShell(templates.message); row.setAttribute('data-msg-id', String(message?.id ?? '')); row.dataset.tmT4MultiChannelMessageId = String(message?.id ?? '');
    const name = senderName(message); const grouped = previousMessage && senderName(previousMessage) === name;
    if (grouped) row.className = `${row.className} tm-t4-mcv-grouped`;
    const avatar = cloneShell(grouped ? templates.avatarSpacer : templates.avatar, grouped ? 'div' : 'button'); avatar.replaceChildren();
    if (!grouped) {
        avatar.title = name; avatar.setAttribute('aria-label', `Profil de ${name}`);
        if (message?.avatar_url) { const image = cloneShell(templates.avatarImage, 'img'); image.src = message.avatar_url; image.alt = ''; avatar.append(image); } else avatar.textContent = avatarInitial(name);
    }
    const content = cloneShell(templates.content); const meta = cloneShell(templates.meta); const sender = cloneShell(templates.sender, 'button'); sender.type = 'button'; sender.textContent = name;
    // Un panneau est construit depuis un message natif arbitraire. Il ne doit jamais
    // conserver la couleur (ou l'état) Pimp My Grade de ce message modèle.
    sender.style.removeProperty('color'); sender.style.removeProperty('--tm-t4-grade-color');
    delete sender.dataset.tmT4GradeApplied; delete sender.dataset.tmT4GradeEffect;
    delete sender.dataset.tmT4GradeNativeColor; delete sender.dataset.tmT4GradeNativeInlineColor; delete sender.dataset.tmT4GradeNativeInlinePriority;
    sender.style.setProperty('color', nativeRoleColor(message?.sender_role));
    const time = cloneShell(templates.time, 'span'); time.textContent = formatTime(message?.created_at ?? message?.at);
    if (!grouped) meta.append(sender, time);
    if (message?.parent) {
        const quote = document.createElement('div'); quote.className = 'tm-t4-mcv-quote'; quote.textContent = `↪ réponse à @${message.parent.sender || 'utilisateur'} : ${message.parent.body || 'message supprimé'}`; content.append(quote);
    }
    const bubble = cloneShell(templates.bubble); bubble.replaceChildren();
    if (editing) {
        const input = document.createElement('input'); input.type = 'text'; input.className = 'tm-t4-mcv-edit-input'; input.value = String(message?.body || ''); input.maxLength = 500; input.setAttribute('aria-label', 'Modifier le message');
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); onEdit(message, input.value); }
            if (event.key === 'Escape') { event.preventDefault(); onCancelEdit(); }
        });
        bubble.append(input); window.requestAnimationFrame(() => input.focus());
    } else appendMessageBody(bubble, message?.body);
    // Cette insertion doit rester avant les réactions et les actions : c'est le
    // contenu principal du message, indépendamment de ses contrôles additionnels.
    content.append(meta, bubble);
    const reactions = reactionEntries(message);
    if (reactions.length) {
        const bar = document.createElement('div'); bar.className = 'tm-t4-mcv-reactions';
        for (const [emoji, count] of reactions) { const button = document.createElement('button'); button.type = 'button'; button.textContent = `${emoji} ${count}`; button.title = `Réagir avec ${emoji}`; button.addEventListener('click', () => onReaction(message, emoji)); bar.append(button); }
        content.append(bar);
    }
    const actions = cloneShell(templates.actions); const reply = cloneShell(templates.actionButton, 'button'); reply.type = 'button'; reply.title = 'Répondre'; reply.setAttribute('aria-label', reply.title); reply.replaceChildren(createIcon('reply')); reply.addEventListener('click', () => onReply(message)); actions.append(reply);
    const react = cloneShell(templates.actionButton, 'button'); react.type = 'button'; react.title = 'Réagir'; react.setAttribute('aria-label', react.title); react.setAttribute('data-tm-t4-multi-channel-reaction-trigger', '1'); react.replaceChildren(createIcon('add_reaction'));
    react.addEventListener('click', () => onOpenNativeReactionPicker(message, onReaction)); actions.append(react);
    const isOwnMessage = currentUserId && String(message?.sender_id ?? '') === currentUserId;
    if (isOwnMessage && !editing) {
        const edit = cloneShell(templates.actionButton, 'button'); edit.type = 'button'; edit.title = 'Modifier le message'; edit.setAttribute('aria-label', edit.title); edit.replaceChildren(createIcon('edit'));
        edit.addEventListener('click', () => onEdit(message)); actions.append(edit);
    }
    if (editing) {
        const cancel = cloneShell(templates.actionButton, 'button'); cancel.type = 'button'; cancel.title = 'Annuler la modification'; cancel.setAttribute('aria-label', cancel.title); cancel.replaceChildren(createIcon('close'));
        cancel.addEventListener('click', onCancelEdit); actions.append(cancel);
    }
    content.append(actions); row.append(avatar, content); return row;
}

function createPane(templates, channel, state, { onClose, onSend, onReaction, onOpenNativeReactionPicker, onEdit, getCurrentUserId }) {
    const pane = cloneShell(templates.nativeWindow); pane.setAttribute(PANE_ATTR, channel.id); pane.setAttribute('aria-label', `Canal #${channel.name}`);
    const list = cloneShell(templates.list); list.dataset.tmT4MultiChannelMessages = channel.id;
    const inputWrapper = cloneShell(templates.inputWrapper); const inputArea = cloneShell(templates.inputArea); const inputField = cloneShell(templates.inputField); const input = cloneShell(templates.input, 'textarea');
    input.value = ''; input.placeholder = `Message dans #${channel.name}…`; input.removeAttribute('data-tm-chat-input-toolbar-sync-bound'); input.dataset.tmT4MultiChannelInput = channel.id;
    const activateInput = () => {
        document.querySelectorAll('textarea[data-tm-t4-multi-channel-input-active="1"]').forEach((element) => element.removeAttribute('data-tm-t4-multi-channel-input-active'));
        input.setAttribute('data-tm-t4-multi-channel-input-active', '1');
    };
    input.addEventListener('focus', activateInput); pane.addEventListener('pointerdown', activateInput, true);
    const send = cloneShell(templates.sendButton, 'button'); send.type = 'button'; send.disabled = false; send.setAttribute('aria-label', 'Envoyer'); send.replaceChildren(createIcon('send'));
    const replyBanner = document.createElement('div'); replyBanner.className = 'tm-t4-mcv-reply-banner'; replyBanner.hidden = true;
    const sendCurrent = () => { const body = input.value.trim(); if (!body) return; onSend(channel, body, state.replyTo); state.replyTo = null; replyBanner.hidden = true; input.value = ''; };
    send.addEventListener('click', sendCurrent); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendCurrent(); } });
    inputField.append(input); inputArea.append(inputField, send); inputWrapper.append(replyBanner, inputArea);
    const renderMessages = () => {
        const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        list.replaceChildren(); let previous = null;
        for (const message of state.messages) {
            list.append(createMessageElement(templates, message, previous, {
                currentUserId: getCurrentUserId(),
                editing: state.editingMessageId === String(message.id),
                onReply: (replyTo) => { state.replyTo = replyTo; replyBanner.hidden = false; replyBanner.textContent = `Réponse à ${senderName(replyTo)} · cliquer pour annuler`; replyBanner.onclick = () => { state.replyTo = null; replyBanner.hidden = true; }; input.focus(); },
                onReaction,
                onOpenNativeReactionPicker,
                onEdit: (target, body) => {
                    if (body === undefined) { state.editingMessageId = String(target.id); renderMessages(); return; }
                    const nextBody = String(body || '').trim();
                    if (!nextBody) return;
                    state.editingMessageId = ''; onEdit(target, nextBody);
                },
                onCancelEdit: () => { state.editingMessageId = ''; renderMessages(); }
            }));
            previous = message;
        }
        if (nearBottom) list.scrollTop = list.scrollHeight;
    };
    pane.append(cloneHeader(templates, channel, onClose), list, inputWrapper); renderMessages();
    return { pane, list, input, renderMessages };
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'multi-channel-view',
    label: 'Mosaïque de canaux · Alpha',
    defaultEnabled: false,
    pages: ['chat'],
    storageKeys: [OPEN_IDS_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 30, render: renderMultiChannelViewSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnalité alpha', text: 'Le canal actif reste natif. Utilisez le bouton + d’un canal pour ouvrir jusqu’à trois panneaux supplémentaires.', kind: 'warning', order: 10 }],
    setup(context) {
        let channels = [];
        let openedIds = safeOpenedIds(context.storage);
        const panelStates = new Map();
        let socket = null;
        let currentUserId = '';
        let pendingNativeReaction = null;

        context.ensureStyle(STYLE_ID, `
            [data-tm-t4-multi-channel-layout="2"]{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;gap:8px!important;padding:8px!important;overflow:hidden!important}
            [data-tm-t4-multi-channel-layout="3"]{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;padding:8px!important;overflow:hidden!important}
            [data-tm-t4-multi-channel-layout="4"]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:8px!important;overflow:hidden!important}
            [data-tm-t4-multi-channel-layout] > [class*="mobileBar"]{display:none!important}
            [data-tm-t4-multi-channel-layout] > [${NATIVE_ATTR}], [data-tm-t4-multi-channel-layout] > [${PANE_ATTR}]{display:flex!important;width:auto!important;max-width:none!important;min-width:0!important;min-height:0!important;height:auto!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.12);border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.24)}
            [${PANE_ATTR}] [class*="messageList"]{min-height:0!important}
            [${PANE_ATTR}] [class*="inputWrapper"]{flex:0 0 auto!important}
            .tm-t4-mcv-pane-close{display:inline-grid;place-items:center;width:30px;height:30px;padding:0;margin-left:auto;flex:0 0 auto;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(39,39,42,.94);color:#fff;cursor:pointer;transition:background .16s ease,transform .16s ease}.tm-t4-mcv-pane-close:hover{background:#7f1d1d}.tm-t4-mcv-pane-close:active{transform:scale(.91)}
            [${PLUS_ATTR}="1"]{display:inline-grid!important;place-items:center!important;flex:0 0 auto!important;width:28px!important;height:28px!important;margin:0 2px 0 auto!important;padding:0!important;border:1px solid rgba(96,165,250,.4)!important;border-radius:8px!important;background:linear-gradient(145deg,rgba(30,64,175,.9),rgba(30,41,59,.96))!important;color:#dbeafe!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 3px 9px rgba(0,0,0,.2)!important;cursor:pointer!important;font:500 19px/1 system-ui!important;transition:transform .14s ease,background .14s ease,border-color .14s ease,box-shadow .14s ease!important}
            [${PLUS_ATTR}="1"]:hover{border-color:rgba(147,197,253,.82)!important;background:linear-gradient(145deg,rgba(37,99,235,1),rgba(30,64,175,.96))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 5px 13px rgba(30,64,175,.35)!important;transform:translateY(-1px)}
            [${PLUS_ATTR}="1"]:active,[${PLUS_ATTR}="1"][data-state="opening"]{transform:scale(.88)!important;background:linear-gradient(145deg,rgba(22,163,74,.95),rgba(21,128,61,.95))!important;border-color:rgba(134,239,172,.86)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 2px 7px rgba(20,83,45,.36)!important}
            [${PLUS_ATTR}="1"]:focus-visible{outline:2px solid #bfdbfe!important;outline-offset:2px}.tm-t4-mcv-quote{margin:5px 0;padding:5px 7px;border-left:2px solid rgba(96,165,250,.7);border-radius:4px;background:rgba(59,130,246,.08);color:#cbd5e1;font-size:11px;line-height:1.35}
            .tm-t4-mcv-reactions{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.tm-t4-mcv-reactions button{border:1px solid rgba(251,191,36,.2);border-radius:999px;background:rgba(113,63,18,.26);color:#fef3c7;padding:2px 6px;cursor:pointer;font-size:11px}.tm-t4-mcv-edit-input{box-sizing:border-box;width:100%;border:1px solid rgba(96,165,250,.8);border-radius:6px;background:rgba(24,24,27,.92);color:inherit;padding:5px 7px;font:inherit}.tm-t4-mcv-reply-banner{margin:0 8px 5px;padding:5px 8px;border-radius:6px;background:rgba(30,64,175,.28);color:#dbeafe;cursor:pointer;font-size:11px}
            @media(max-width:760px){[data-tm-t4-multi-channel-layout]{display:block!important;overflow:auto!important}[data-tm-t4-multi-channel-layout] > [${NATIVE_ATTR}],[data-tm-t4-multi-channel-layout] > [${PANE_ATTR}]{min-height:78vh!important;margin-bottom:8px}}
        `);

        const getChannel = (id) => channels.find((channel) => channel.id === String(id)) || null;
        const getNativeId = () => {
            const queryId = String(new URLSearchParams(location.search).get('conv') || '').trim();
            if (queryId && getChannel(queryId)) return queryId;
            const slug = location.pathname.match(/^\/communication\/channels\/([^/]+)/)?.[1];
            if (slug) return channels.find((channel) => channel.slug === slug)?.id || '';
            const name = comparable(context.platform.getCurrentChatContext()?.name);
            return channels.find((channel) => comparable(channel.name) === name)?.id || '';
        };
        const getLayout = () => context.platform.getChatSidebarLayout();
        const clearLayout = () => {
            const chatArea = getLayout()?.chatArea;
            if (chatArea) {
                delete chatArea.dataset.tmT4MultiChannelLayout;
                const nativeWindow = chatArea.querySelector(`[${NATIVE_ATTR}]`);
                nativeWindow?.removeAttribute(NATIVE_ATTR);
                nativeWindow?.style.removeProperty('grid-column'); nativeWindow?.style.removeProperty('grid-row'); nativeWindow?.style.removeProperty('align-self');
            }
            document.querySelectorAll(`[${PANE_ATTR}]`).forEach((pane) => pane.remove()); panelStates.clear();
            context.messages.refresh({ scan: false });
        };
        const placePanel = (element, count, index) => {
            if (!(element instanceof HTMLElement)) return;
            const slots = count === 2
                ? [['1', '1'], ['2', '1']]
                : count === 3
                ? [['1', '1 / span 2'], ['2', '1'], ['2', '2']]
                : [['1', '1'], ['2', '1'], ['1', '2'], ['2', '2']];
            const [column, row] = slots[index] || slots[0];
            element.style.setProperty('grid-column', column, 'important');
            element.style.setProperty('grid-row', row, 'important');
            element.style.setProperty('align-self', 'stretch', 'important');
        };
        const closeAll = () => { openedIds = []; saveOpenedIds(context.storage, openedIds); clearLayout(); };
        const removeChannel = (id) => { openedIds = openedIds.filter((entry) => entry !== String(id)); saveOpenedIds(context.storage, openedIds); render(); };
        const sendPacket = (packet) => { socket?.send(packet); };
        const openNativeReactionPicker = (message, onReaction, afterHover = false) => {
            const nativeWindow = getNativeWindow(getLayout()?.chatArea);
            const trigger = getNativeReactionTrigger(nativeWindow);
            if (!(trigger instanceof HTMLButtonElement) || trigger.disabled) {
                const nativeMessage = nativeWindow?.querySelector('[data-msg-id]');
                if (!afterHover && nativeMessage instanceof HTMLElement) {
                    // Les actions sont rendues par React au survol dans la shoutbox
                    // officielle. Elles peuvent donc ne pas être présentes avant ce
                    // signal, même si le message l'est bien.
                    nativeMessage.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                    nativeMessage.dispatchEvent(new MouseEvent('mouseenter'));
                    context.later(80, () => openNativeReactionPicker(message, onReaction, true));
                    return;
                }
                context.ui.toast.show('Le bouton de réaction natif est introuvable dans le canal officiel.', { error: true });
                return;
            }
            pendingNativeReaction = { message, onReaction, trigger, expiresAt: Date.now() + 12000 };
            trigger.click();
        };
        const updatePane = (id) => panelStates.get(String(id))?.renderMessages();
        const handlePacket = (packet) => {
            if (packet?.type === 'msg.received') {
                const state = panelStates.get(String(packet.conv_id)); if (!state) return;
                state.messages.push({ id: packet.id, sender_id: packet.sender_id, sender: packet.sender, sender_role: packet.sender_role, avatar_url: packet.avatar_url, featured_badges: packet.featured_badges, body: packet.body, created_at: packet.at, parent: packet.parent, reactions: {} }); updatePane(packet.conv_id); sendPacket({ type: 'read', conv_id: packet.conv_id }); return;
            }
            if (packet?.type === 'chan.cleared') { const state = panelStates.get(String(packet.conv_id)); if (state) { state.messages = []; updatePane(packet.conv_id); } return; }
            for (const [id, state] of panelStates) {
                const message = state.messages.find((entry) => String(entry.id) === String(packet.message_id)); if (!message) continue;
                if (packet.type === 'msg.edited') message.body = packet.body;
                if (packet.type === 'msg.deleted') message.body = '';
                if (packet.type === 'reaction.updated') { message.reactions = packet.counts || {}; message.reaction_users = packet.users || {}; }
                updatePane(id);
            }
        };
        socket = createSocket(handlePacket); socket.connect();
        const render = async () => {
            const layout = getLayout(); const chatArea = layout?.chatArea; if (!(chatArea instanceof HTMLElement)) return;
            const nativeWindow = getNativeWindow(chatArea); const nativeId = getNativeId();
            openedIds = openedIds.filter((id) => id !== nativeId && getChannel(id)); saveOpenedIds(context.storage, openedIds);
            if (!nativeWindow || !nativeId || !openedIds.length) { clearLayout(); return; }
            const templates = createTemplates(nativeWindow); if (!(templates.list instanceof HTMLElement)) return;
            const count = openedIds.length + 1;
            clearLayout(); nativeWindow.setAttribute(NATIVE_ATTR, '1'); chatArea.dataset.tmT4MultiChannelLayout = String(count); placePanel(nativeWindow, count, 0);
            for (const [index, id] of openedIds.entries()) {
                const channel = getChannel(id); if (!channel) continue;
                const state = { messages: [], replyTo: null, editingMessageId: '', renderMessages: () => {} }; panelStates.set(id, state);
                const panel = createPane(templates, channel, state, {
                    onClose: () => removeChannel(channel.id),
                    onSend: (target, body, parent) => sendPacket({ type: 'msg.send', conv_id: target.id, body, ...(parent?.id ? { parent_id: parent.id } : {}) }),
                    onReaction: (message, emoji) => sendPacket({ type: 'reaction.add', message_id: message.id, emoji }),
                    onOpenNativeReactionPicker: openNativeReactionPicker,
                    onEdit: (message, body) => {
                        message.body = body; state.renderMessages();
                        sendPacket({ type: 'msg.edit', message_id: message.id, body });
                    },
                    getCurrentUserId: () => currentUserId
                });
                chatArea.append(panel.pane); placePanel(panel.pane, count, index + 1); state.renderMessages = panel.renderMessages;
                context.messages.refresh();
                try { state.messages = await fetchMessages(channel.id); panel.renderMessages(); sendPacket({ type: 'read', conv_id: channel.id }); } catch { /* le panneau reste disponible pour l'envoi */ }
            }
        };
        const open = (id) => {
            const target = String(id || '').trim(); const nativeId = getNativeId();
            if (!getChannel(target) || target === nativeId) { if (target === nativeId) context.ui.toast.show('Ce canal est déjà affiché nativement.'); return; }
            if (openedIds.includes(target)) { context.ui.toast.show('Ce canal est déjà ouvert.'); return; }
            if (openedIds.length >= MAX_CHANNELS - 1) { context.ui.toast.show(`La mosaïque est limitée à ${MAX_CHANNELS} canaux.`, { error: true }); return; }
            openedIds.push(target); saveOpenedIds(context.storage, openedIds); void render();
        };
        const syncPlusButtons = () => {
            const idsByName = new Map(channels.map((channel) => [comparable(channel.name), channel.id]));
            const nativeId = getNativeId();
            for (const { row, name, joined } of getChannelRows(context.platform)) {
                const id = idsByName.get(comparable(name)); const current = row.querySelector(`[${PLUS_ATTR}="1"]`);
                if (!id || !joined || id === nativeId || openedIds.includes(id)) { current?.remove(); continue; }
                if (current instanceof HTMLButtonElement && current.dataset.channelId === id) continue;
                current?.remove();
                const add = document.createElement('button'); add.type = 'button'; add.setAttribute(PLUS_ATTR, '1'); add.dataset.channelId = id; add.title = `Ajouter #${name} à la mosaïque`; add.setAttribute('aria-label', add.title); add.append(createIcon('add'));
                add.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); add.dataset.state = 'opening'; open(id); }); row.append(add);
            }
        };
        const refresh = async () => {
            try { channels = await fetchChannels(); openedIds = openedIds.filter((id) => getChannel(id)); saveOpenedIds(context.storage, openedIds); syncPlusButtons(); await render(); } catch { syncPlusButtons(); }
        };
        void fetchCurrentUserId().then((id) => {
            currentUserId = id;
            for (const state of panelStates.values()) state.renderMessages();
        }).catch((error) => context.logger.warn('[PimpMyShoutbox Next] Unable to identify the current user for multi-channel editing.', error));
        context.multiChannelView = { count: () => openedIds.length + (openedIds.length ? 1 : 0), closeAll, refresh };
        context.on(document, 'focusin', (event) => {
            const target = event.target;
            if (target instanceof HTMLTextAreaElement && !target.matches('textarea[data-tm-t4-multi-channel-input]')) {
                document.querySelectorAll('textarea[data-tm-t4-multi-channel-input-active="1"]').forEach((element) => element.removeAttribute('data-tm-t4-multi-channel-input-active'));
            }
        }, true);
        context.on(document, 'click', (event) => {
            const pending = pendingNativeReaction;
            if (!pending || Date.now() > pending.expiresAt) { pendingNativeReaction = null; return; }
            const button = event.target instanceof Element ? event.target.closest('button') : null;
            const emoji = reactionEmojiFromButton(button);
            if (!(button instanceof HTMLButtonElement) || !emoji || !(nativeReactionPickerFor(button) instanceof HTMLElement)) return;

            // Le picker et ses options sont ceux de Tr4ker. On bloque seulement la
            // réaction du message natif qui a servi à l'ouvrir, puis on redirige le
            // même emoji vers le message affiché dans le panneau secondaire.
            event.preventDefault(); event.stopImmediatePropagation();
            pendingNativeReaction = null;
            pending.onReaction(pending.message, emoji);
            window.setTimeout(() => pending.trigger.click(), 0);
        }, true);
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape' && openedIds.length) { event.preventDefault(); closeAll(); } }, true);
        context.on(window, 'storage', (event) => { if (event.key === OPEN_IDS_STORAGE_KEY) { openedIds = safeOpenedIds(context.storage); void render(); } });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => { openedIds = safeOpenedIds(context.storage); void refresh(); });
        context.every(900, syncPlusButtons);
        void refresh();
        return () => { delete context.multiChannelView; socket?.close(); clearLayout(); document.querySelectorAll(`[${PLUS_ATTR}="1"]`).forEach((button) => button.remove()); };
    },
    onRoute(context) { if (context.multiChannelView?.count()) window.setTimeout(() => { void context.multiChannelView.refresh(); }, 0); }
});
