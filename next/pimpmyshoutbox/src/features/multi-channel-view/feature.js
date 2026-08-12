import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderMultiChannelViewSettings } from './settings.js';

const OPEN_IDS_STORAGE_KEY = 'tm_t4_multi_channel_view_open_ids';
const ROOT_ID = 'tm-t4-next-multi-channel-view';
const EXIT_ID = 'tm-t4-next-multi-channel-view-exit';
const PLUS_ATTR = 'data-tm-t4-multi-channel-plus';
const STYLE_ID = 'tm-t4-next-multi-channel-view-style';
const MAX_CHANNELS = 4;

function comparable(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');
}

function safeOpenedIds(storage) {
    const raw = storage.readJson(OPEN_IDS_STORAGE_KEY, []);
    return Array.isArray(raw) ? [...new Set(raw.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, MAX_CHANNELS) : [];
}

function saveOpenedIds(storage, ids) {
    storage.writeJson(OPEN_IDS_STORAGE_KEY, [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, MAX_CHANNELS));
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
        isMember: channel?.is_member === true
    })).filter((channel) => channel.id && channel.slug && channel.name);
}

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function messageAuthor(message) {
    return String(message?.sender ?? message?.author?.username ?? message?.username ?? 'Utilisateur').trim() || 'Utilisateur';
}

function messageBody(message) {
    return String(message?.body ?? message?.content ?? '').trim();
}

async function fetchMessages(channelId) {
    const response = await fetch(`/api/conversations/${encodeURIComponent(channelId)}/messages`, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return (Array.isArray(payload?.messages) ? payload.messages : []).reverse();
}

export default defineFeature({
    id: 'multi-channel-view',
    label: 'Mosaïque de canaux · Alpha',
    defaultEnabled: false,
    pages: ['chat'],
    storageKeys: [OPEN_IDS_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 30, render: renderMultiChannelViewSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnalité alpha', text: 'Utilisez le bouton + d’un canal pour l’ajouter à une mosaïque. Cette fonctionnalité est encore en cours de développement et certaines interactions du chat ne sont pas encore disponibles.', kind: 'warning', order: 10 }],
    setup(context) {
        let channels = [];
        let openedIds = safeOpenedIds(context.storage);
        let socket = null;
        const queuedPackets = [];

        const sendPacket = (packet) => {
            const encoded = JSON.stringify(packet);
            if (socket?.readyState === WebSocket.OPEN) { socket.send(encoded); return; }
            queuedPackets.push(encoded);
            if (socket?.readyState === WebSocket.CONNECTING) return;
            const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(`${protocol}//${location.host}/api/ws`);
            socket.addEventListener('open', () => {
                while (queuedPackets.length) socket?.send(queuedPackets.shift());
            }, { once: true });
            socket.addEventListener('message', (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload?.type === 'ping') socket?.send(JSON.stringify({ type: 'pong' }));
                } catch { /* paquet non exploitable : le rafraîchissement reste la source de vérité */ }
            });
        };

        context.ensureStyle(STYLE_ID, `
            #${ROOT_ID}{position:absolute;inset:0;z-index:12;display:grid;gap:8px;padding:8px;background:#111113;color:#f4f4f5;overflow:hidden}
            #${ROOT_ID}[data-count="2"]{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
            #${ROOT_ID}[data-count="3"]{grid-template-columns:minmax(0,1.32fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr)}
            #${ROOT_ID}[data-count="3"] .tm-t4-mcv-pane:first-of-type{grid-row:1 / span 2}
            #${ROOT_ID}[data-count="4"]{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
            #${ROOT_ID} .tm-t4-mcv-pane{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:#18181b;box-shadow:0 8px 20px rgba(0,0,0,.24)}
            #${ROOT_ID} .tm-t4-mcv-header{display:flex;align-items:center;min-height:42px;padding:0 45px 0 14px;border-bottom:1px solid rgba(255,255,255,.1);background:#202025;color:#f4f4f5;font:700 14px/1.2 system-ui}
            #${ROOT_ID} .tm-t4-mcv-messages{flex:1;min-height:0;overflow:auto;padding:10px;background:#111113}
            #${ROOT_ID} .tm-t4-mcv-message{padding:7px 9px;border-radius:7px;color:#e4e4e7;font:13px/1.45 system-ui;word-break:break-word}
            #${ROOT_ID} .tm-t4-mcv-message:hover{background:rgba(255,255,255,.045)}
            #${ROOT_ID} .tm-t4-mcv-message-author{margin-right:7px;color:#f472b6;font-weight:700}
            #${ROOT_ID} .tm-t4-mcv-message-time{margin-right:8px;color:#71717a;font-size:11px}
            #${ROOT_ID} .tm-t4-mcv-empty{padding:18px 10px;color:#a1a1aa;font:13px/1.45 system-ui;text-align:center}
            #${ROOT_ID} .tm-t4-mcv-compose{display:flex;gap:7px;padding:8px;border-top:1px solid rgba(255,255,255,.1);background:#202025}
            #${ROOT_ID} .tm-t4-mcv-compose textarea{flex:1;min-width:0;min-height:34px;max-height:86px;resize:vertical;border:1px solid rgba(255,255,255,.17);border-radius:7px;background:#111113;color:#f4f4f5;padding:7px 8px;font:13px/1.3 system-ui}
            #${ROOT_ID} .tm-t4-mcv-send{align-self:flex-end;border:0;border-radius:7px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font:700 12px/1 system-ui}
            #${ROOT_ID} .tm-t4-mcv-send:disabled{opacity:.55;cursor:wait}
            #${ROOT_ID} .tm-t4-mcv-pane-close,#${ROOT_ID} .tm-t4-mcv-exit{position:absolute;z-index:2;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:7px;background:rgba(24,24,27,.9);color:#fff;cursor:pointer;font:700 17px/1 system-ui}
            #${ROOT_ID} .tm-t4-mcv-pane-close{top:8px;right:8px;width:28px;height:28px}
            #${ROOT_ID} .tm-t4-mcv-exit{top:14px;right:14px;width:32px;height:32px;background:#7f1d1d;box-shadow:0 3px 13px rgba(0,0,0,.42)}
            [${PLUS_ATTR}="1"]{display:inline-grid!important;place-items:center!important;flex:0 0 auto!important;width:22px!important;height:22px!important;margin-left:auto!important;padding:0!important;border:1px solid rgba(96,165,250,.34)!important;border-radius:6px!important;background:rgba(30,58,138,.42)!important;color:#bfdbfe!important;cursor:pointer!important;font:700 17px/1 system-ui!important}
            @media(max-width:760px){#${ROOT_ID}{position:fixed;inset:8px;z-index:1000100;grid-template-columns:1fr!important;grid-template-rows:repeat(var(--tm-mcv-count),minmax(0,1fr))!important}#${ROOT_ID}[data-count="3"] .tm-t4-mcv-pane:first-of-type{grid-row:auto}}
        `);

        const getChannel = (id) => channels.find((channel) => channel.id === String(id)) || null;
        const root = () => document.getElementById(ROOT_ID);
        const exitButton = () => document.getElementById(EXIT_ID);
        const closeAll = () => { openedIds = []; saveOpenedIds(context.storage, openedIds); root()?.remove(); exitButton()?.remove(); };
        const ensureExitButton = () => {
            if (exitButton() instanceof HTMLButtonElement) return;
            const exit = document.createElement('button'); exit.type = 'button'; exit.id = EXIT_ID; exit.textContent = '×'; exit.title = 'Fermer la mosaïque et revenir au chat'; exit.setAttribute('aria-label', exit.title);
            exit.style.cssText = 'position:fixed!important;top:14px!important;right:14px!important;z-index:2147483647!important;display:grid!important;place-items:center!important;width:38px!important;height:38px!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:9px!important;background:#991b1b!important;color:#fff!important;box-shadow:0 5px 18px rgba(0,0,0,.55)!important;cursor:pointer!important;font:700 24px/1 system-ui!important;';
            exit.addEventListener('click', closeAll); document.body.append(exit);
        };
        const removeChannel = (id) => {
            openedIds = openedIds.filter((entry) => entry !== String(id)); saveOpenedIds(context.storage, openedIds);
            if (openedIds.length < 2) { closeAll(); return; }
            render();
        };
        const render = () => {
            const active = openedIds.map(getChannel).filter(Boolean);
            if (active.length < 2) { closeAll(); return; }
            let overlay = root();
            if (!(overlay instanceof HTMLElement)) {
                overlay = document.createElement('section'); overlay.id = ROOT_ID; overlay.setAttribute('aria-label', 'Mosaïque de canaux');
                const chatArea = context.platform.getChatSidebarLayout()?.chatArea;
                if (!(chatArea instanceof HTMLElement)) return;
                chatArea.append(overlay);
            }
            overlay.dataset.count = String(active.length); overlay.style.setProperty('--tm-mcv-count', String(active.length)); overlay.replaceChildren();
            ensureExitButton();
            for (const channel of active) {
                const pane = document.createElement('section'); pane.className = 'tm-t4-mcv-pane'; pane.setAttribute('aria-label', `Canal #${channel.name}`);
                const close = document.createElement('button'); close.type = 'button'; close.className = 'tm-t4-mcv-pane-close'; close.textContent = '×'; close.title = `Fermer #${channel.name}`; close.setAttribute('aria-label', close.title); close.addEventListener('click', () => removeChannel(channel.id));
                const header = document.createElement('div'); header.className = 'tm-t4-mcv-header'; header.textContent = `# ${channel.name}`;
                const messages = document.createElement('div'); messages.className = 'tm-t4-mcv-messages';
                const compose = document.createElement('form'); compose.className = 'tm-t4-mcv-compose';
                const input = document.createElement('textarea'); input.placeholder = `Écrire dans #${channel.name}`; input.setAttribute('aria-label', input.placeholder);
                const send = document.createElement('button'); send.type = 'submit'; send.className = 'tm-t4-mcv-send'; send.textContent = 'Envoyer';
                const renderMessages = async () => {
                    try {
                        const items = await fetchMessages(channel.id);
                        messages.replaceChildren();
                        if (!items.length) {
                            const empty = document.createElement('div'); empty.className = 'tm-t4-mcv-empty'; empty.textContent = 'Aucun message.'; messages.append(empty);
                        }
                        for (const item of items) {
                            const row = document.createElement('div'); row.className = 'tm-t4-mcv-message';
                            const author = document.createElement('span'); author.className = 'tm-t4-mcv-message-author'; author.textContent = messageAuthor(item);
                            const time = document.createElement('span'); time.className = 'tm-t4-mcv-message-time'; time.textContent = formatTime(item?.created_at);
                            const body = document.createElement('span'); body.textContent = messageBody(item) || 'Message supprimé';
                            row.append(author, time, body); messages.append(row);
                        }
                        messages.scrollTop = messages.scrollHeight;
                    } catch {
                        messages.replaceChildren(); const error = document.createElement('div'); error.className = 'tm-t4-mcv-empty'; error.textContent = 'Impossible de charger les messages.'; messages.append(error);
                    }
                };
                compose.addEventListener('submit', (event) => {
                    event.preventDefault(); const body = input.value.trim(); if (!body) return;
                    send.disabled = true; sendPacket({ type: 'msg.send', conv_id: channel.id, body }); input.value = '';
                    window.setTimeout(() => { send.disabled = false; void renderMessages(); }, 500);
                });
                compose.append(input, send); pane.append(header, close, messages, compose); overlay.append(pane); void renderMessages();
            }
        };
        const currentChannelId = () => {
            const queryId = String(new URLSearchParams(location.search).get('conv') || '').trim();
            if (queryId && getChannel(queryId)) return queryId;
            const currentSlug = location.pathname.match(/^\/communication\/channels\/([^/]+)/)?.[1] || '';
            if (currentSlug) return channels.find((channel) => channel.slug === currentSlug)?.id || '';
            const currentName = comparable(context.platform.getCurrentChatContext()?.name);
            return channels.find((channel) => comparable(channel.name) === currentName)?.id || '';
        };
        const open = (id) => {
            const safeId = String(id || '').trim(); if (!getChannel(safeId)) return;
            if (!openedIds.length) { const current = currentChannelId(); if (current) openedIds.push(current); }
            if (!openedIds.includes(safeId) && openedIds.length >= MAX_CHANNELS) { context.ui.toast.show(`La mosaïque est limitée à ${MAX_CHANNELS} canaux.`, { error: true }); return; }
            if (!openedIds.includes(safeId)) openedIds.push(safeId);
            openedIds = [...new Set(openedIds)]; saveOpenedIds(context.storage, openedIds);
            if (openedIds.length < 2) { context.ui.toast.show('Choisissez un second canal avec le bouton +.'); return; }
            render();
        };
        const syncPlusButtons = () => {
            const idsByName = new Map(channels.map((channel) => [comparable(channel.name), channel.id]));
            for (const { row, name, joined } of getChannelRows(context.platform)) {
                row.querySelector(`[${PLUS_ATTR}="1"]`)?.remove();
                const id = idsByName.get(comparable(name)); if (!id || !joined) continue;
                const add = document.createElement('button'); add.type = 'button'; add.setAttribute(PLUS_ATTR, '1'); add.textContent = '+'; add.title = `Ajouter #${name} à la mosaïque`; add.setAttribute('aria-label', add.title);
                add.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); open(id); }); row.append(add);
            }
        };
        const refresh = async () => {
            try {
                channels = await fetchChannels(); openedIds = openedIds.filter((id) => getChannel(id)); saveOpenedIds(context.storage, openedIds); syncPlusButtons();
                if (openedIds.length >= 2) render();
            } catch { /* le menu natif reste utilisable si la liste est temporairement indisponible */ }
        };
        const runtime = { count: () => openedIds.length, closeAll };
        context.multiChannelView = runtime;
        context.on(document, 'keydown', (event) => {
            if (event.key !== 'Escape' || !(root() instanceof HTMLElement)) return;
            event.preventDefault(); event.stopPropagation(); closeAll();
        }, true);
        context.on(window, 'storage', (event) => { if (event.key === OPEN_IDS_STORAGE_KEY) { openedIds = safeOpenedIds(context.storage); render(); } });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => { openedIds = safeOpenedIds(context.storage); void refresh(); });
        context.every(800, syncPlusButtons);
        void refresh();
        return () => { delete context.multiChannelView; socket?.close(); root()?.remove(); exitButton()?.remove(); document.querySelectorAll(`[${PLUS_ATTR}="1"]`).forEach((button) => button.remove()); };
    }
});
