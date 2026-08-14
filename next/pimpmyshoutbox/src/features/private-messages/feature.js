/**
 * Implémente les notifications de MP et le rafraîchissement de la messagerie.
 *
 * @module src/features/private-messages/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { normalizeComparableText, normalizeName } from '../../core/text.js';
import { acquireMentionEventHub } from '../mentions/event-hub.js';
import { renderPrivateMessageSettings } from './settings.js';

const ENABLED_STORAGE_KEY = 'tm_t4_private_message_notifications_enabled';
const NOTIFICATION_ID = 'tm-t4-next-private-message-notification';
const SIDEBAR_ENTRY_MARKER = 'data-tm-private-message-sidebar-entry';
const STALE_AFTER_MS = 5 * 60 * 1000;

let activeRuntime = null;

function renderFeatureSettings(container) {
    renderPrivateMessageSettings(container, activeRuntime);
}

/**
 * Retourne un identifiant stable pour dédupliquer un message reçu.
 *
 * @function getMessageId
 * @param {object} message Événement WebSocket brut.
 * @returns {string} Identifiant du message.
 */
function getMessageId(message) {
    return String(message?.id || [message?.conv_id, message?.at, message?.sender, message?.body]
        .map((value) => String(value || '').trim()).join(':')).trim();
}

/**
 * Lit le pseudo actuellement connecté dans la navigation Tr4ker.
 *
 * @function getCurrentUsername
 * @returns {string} Pseudo connecté, ou une chaîne vide si la navigation est absente.
 */
function getCurrentUsername() {
    const account = document.querySelector('aside[aria-label="Navigation"] a[aria-label="Mon compte"]');
    return String(
        account?.querySelector('[class*="username"]')?.textContent
        || account?.querySelector('span')?.textContent
        || ''
    ).trim();
}

/**
 * Trouve la section native consacrée aux messages privés.
 *
 * @function getPrivateSection
 * @param {object} platform Adaptateur de plateforme Tr4ker.
 * @returns {HTMLElement|null} Section native, si la page courante l'expose.
 */
function getPrivateSection(platform) {
    const sidebar = platform.getChatSidebarLayout()?.sidebar;
    if (!(sidebar instanceof HTMLElement)) return null;
    return [...sidebar.querySelectorAll('section')].find((section) => (
        normalizeComparableText(section.querySelector('[class*="sectionLabelText"]')?.textContent || '') === 'messages prives'
    )) || null;
}

/**
 * Trouve le conteneur des conversations dans la section des MP.
 *
 * @function getPrivateList
 * @param {object} platform Adaptateur de plateforme Tr4ker.
 * @returns {HTMLElement|null} Liste native des conversations.
 */
function getPrivateList(platform) {
    const section = getPrivateSection(platform);
    if (!(section instanceof HTMLElement)) return null;
    return [...section.children].find((child) => (
        child instanceof HTMLElement && [...child.classList].some((className) => className.includes('itemsWrap'))
    )) || null;
}

/**
 * Supprime les marqueurs d'unread ajoutés par les versions précédentes.
 *
 * @function removeNativeUnreadBadges
 * @param {ParentNode|null} root Racine de recherche.
 * @returns {void}
 */
function removeNativeUnreadBadges(root) {
    root?.querySelectorAll?.('[data-tm-private-message-unread="1"]').forEach((badge) => badge.remove());
}

/**
 * Ajoute l'avatar d'une conversation à une entrée clonée du menu natif.
 *
 * @function addAvatar
 * @param {HTMLElement} row Entrée en cours de construction.
 * @param {object} conversation Données de conversation.
 * @param {object|null} message Message reçu associé.
 * @param {HTMLElement|null} templateRow Entrée native servant de modèle visuel.
 * @returns {void}
 */
function addAvatar(row, conversation, message, templateRow) {
    const avatarUrl = String(message?.avatar_url || conversation?.avatarUrl || '').trim();
    if (!avatarUrl) return;
    const image = document.createElement('img');
    const templateImage = templateRow?.querySelector('img');
    image.className = templateImage instanceof HTMLImageElement ? templateImage.className : '';
    image.src = avatarUrl;
    image.alt = '';
    if (!image.className) image.style.cssText = 'width:30px;height:30px;border-radius:50%;object-fit:cover;';
    row.append(image);
}

/**
 * Construit une entrée de MP compatible avec les interactions natives.
 *
 * @function createSidebarEntry
 * @param {string} conversationId Identifiant de conversation.
 * @param {object} conversation Données de conversation.
 * @param {object|null} message Message reçu associé.
 * @param {HTMLElement|null} templateRow Entrée native servant de modèle visuel.
 * @returns {HTMLElement} Nouvelle entrée navigable.
 */
function createSidebarEntry(conversationId, conversation, message, templateRow) {
    const row = document.createElement('div');
    row.className = templateRow instanceof HTMLElement
        ? [...templateRow.classList].filter((className) => !className.includes('active')).join(' ')
        : '';
    row.dataset.tmPrivateMessageSidebarEntry = conversationId;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    if (!row.className) row.style.cssText = 'display:flex;align-items:center;gap:9px;padding:9px 10px;cursor:pointer;border-radius:8px;color:inherit;';
    addAvatar(row, conversation, message, templateRow);

    const info = document.createElement('div');
    const templateInfo = templateRow?.querySelector('[class*="dmInfo"]');
    info.className = templateInfo instanceof HTMLElement ? templateInfo.className : '';
    if (!info.className) info.style.cssText = 'min-width:0;flex:1;display:flex;flex-direction:column;gap:3px;';

    const name = document.createElement('span');
    const templateName = templateRow?.querySelector('[class*="navName"]');
    name.className = templateName instanceof HTMLElement ? templateName.className : '';
    name.textContent = conversation.name || String(message?.sender || 'Message privé');
    const preview = document.createElement('span');
    const templatePreview = templateRow?.querySelector('[class*="dmPreview"]');
    preview.className = templatePreview instanceof HTMLElement ? templatePreview.className : '';
    preview.textContent = conversation.lastMessage || String(message?.body || '').trim();
    if (!preview.className) preview.style.cssText = 'font-size:11px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    info.append(name, preview);
    row.append(info);

    const open = () => window.location.assign(`/communication?conv=${encodeURIComponent(conversationId)}`);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
    });
    return row;
}

/**
 * Met à jour ou insère une conversation dans la liste native des MP.
 *
 * @function refreshSidebarEntry
 * @param {object} platform Adaptateur de plateforme Tr4ker.
 * @param {Map<string, object>} conversations Cache des conversations.
 * @param {string} conversationId Identifiant de conversation.
 * @param {object|null} message Message reçu associé.
 * @returns {void}
 */
function refreshSidebarEntry(platform, conversations, conversationId, message = null) {
    const id = String(conversationId || '').trim();
    const conversation = conversations.get(id);
    const list = getPrivateList(platform);
    if (!id || !conversation || !(list instanceof HTMLElement)) return;
    removeNativeUnreadBadges(list);

    const rows = [...list.children].filter((child) => child instanceof HTMLElement);
    const templateRow = rows.find((row) => row.querySelector('[class*="navName"]')) || null;
    const existing = rows.find((row) => (
        row.getAttribute(SIDEBAR_ENTRY_MARKER) === id
        || normalizeComparableText(row.querySelector('[class*="navName"]')?.textContent || '') === normalizeComparableText(conversation.name)
    ));
    const nextPreview = conversation.lastMessage || String(message?.body || '').trim();

    if (existing instanceof HTMLElement) {
        let preview = existing.querySelector('[class*="dmPreview"]');
        if (!(preview instanceof HTMLElement) && nextPreview) {
            preview = document.createElement('span');
            const templatePreview = templateRow?.querySelector('[class*="dmPreview"]');
            preview.className = templatePreview instanceof HTMLElement ? templatePreview.className : '';
            if (!preview.className) preview.style.cssText = 'font-size:11px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            existing.querySelector('[class*="dmInfo"]')?.append(preview);
        }
        if (preview instanceof HTMLElement && nextPreview) preview.textContent = nextPreview;
        return;
    }
    list.insertBefore(createSidebarEntry(id, conversation, message, templateRow), list.firstChild);
}

/**
 * Masque la notification courante et annule son expiration automatique.
 *
 * @function hideNotification
 * @param {{value: number|null}} timer Référence du minuteur actif.
 * @returns {void}
 */
function hideNotification(timer) {
    if (timer.value) {
        window.clearTimeout(timer.value);
        timer.value = null;
    }
    document.getElementById(NOTIFICATION_ID)?.remove();
}

/**
 * Affiche une notification riche avec aperçu et lien direct vers le MP.
 *
 * @function showNotification
 * @param {{value: number|null}} timer Référence du minuteur actif.
 * @param {object} message Message reçu.
 * @param {object} conversation Conversation correspondante.
 * @returns {void}
 */
function showNotification(timer, message, conversation) {
    if (!document.body) return;
    hideNotification(timer);
    const conversationId = String(message?.conv_id || '').trim();
    const sender = String(message?.sender || conversation?.name || 'Expéditeur inconnu').trim();
    const body = String(message?.body || '').replace(/\s+/g, ' ').trim();
    const excerpt = body.length > 190 ? `${body.slice(0, 187)}…` : body;
    const avatarUrl = String(message?.avatar_url || conversation?.avatarUrl || '').trim();
    const panel = document.createElement('aside');
    panel.id = NOTIFICATION_ID;
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    panel.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:1000004;width:min(360px,calc(100vw - 36px));box-sizing:border-box;overflow:hidden;border:1px solid rgba(96,165,250,.55);border-radius:16px;background:linear-gradient(135deg,rgba(30,58,138,.98),rgba(24,24,27,.98));box-shadow:0 18px 44px rgba(0,0,0,.48);color:#f8fafc;font-family:Inter,Arial,sans-serif;';

    const content = document.createElement('div');
    content.style.cssText = 'display:flex;gap:10px;padding:12px 12px 10px;align-items:flex-start;';
    if (avatarUrl) {
        const avatar = document.createElement('img');
        avatar.src = avatarUrl; avatar.alt = '';
        avatar.style.cssText = 'width:38px;height:38px;object-fit:cover;border-radius:50%;border:1px solid rgba(255,255,255,.28);';
        content.append(avatar);
    } else {
        const icon = document.createElement('span');
        icon.textContent = '✉';
        icon.style.cssText = 'display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.14);font-size:18px;';
        content.append(icon);
    }
    const details = document.createElement('div');
    details.style.cssText = 'min-width:0;flex:1;';
    const title = document.createElement('div');
    title.textContent = 'Nouveau message privé';
    title.style.cssText = 'font-size:11px;font-weight:700;letter-spacing:.03em;color:#bfdbfe;text-transform:uppercase;';
    const senderElement = document.createElement('div');
    senderElement.textContent = sender;
    senderElement.style.cssText = 'margin-top:2px;font-size:14px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    const excerptElement = document.createElement('div');
    excerptElement.textContent = excerpt || 'Nouveau message';
    excerptElement.style.cssText = 'margin-top:4px;color:#dbeafe;font-size:12px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    details.append(title, senderElement, excerptElement);
    content.append(details);
    const close = document.createElement('button');
    close.type = 'button'; close.title = 'Fermer'; close.ariaLabel = 'Fermer'; close.textContent = '×';
    close.style.cssText = 'border:0;background:transparent;color:#dbeafe;font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;';
    close.addEventListener('click', () => hideNotification(timer));
    content.append(close);
    panel.append(content);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:0 12px 12px;';
    const later = document.createElement('button');
    later.type = 'button'; later.textContent = 'Plus tard';
    later.style.cssText = 'border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;padding:7px 9px;cursor:pointer;font-size:11px;font-weight:700;';
    later.addEventListener('click', () => hideNotification(timer));
    const open = document.createElement('a');
    open.href = `/communication?conv=${encodeURIComponent(conversationId)}`;
    open.textContent = 'Ouvrir le MP';
    open.style.cssText = 'border-radius:8px;background:#60a5fa;color:#172554;padding:7px 9px;text-decoration:none;font-size:11px;font-weight:800;';
    open.addEventListener('click', () => hideNotification(timer));
    actions.append(later, open);
    panel.append(actions);
    document.body.append(panel);
    timer.value = window.setTimeout(() => hideNotification(timer), 12000);
}

/**
 * Déclare la feature V4 de notification et de rafraîchissement des MP.
 *
 * @function feature
 */
export default defineFeature({
    id: 'private-messages',
    label: 'Notifications des messages privés',
    defaultEnabled: true,
    pages: [],
    storageKeys: [ENABLED_STORAGE_KEY],
    settings: {
        area: 'site',
        category: 'site',
        order: 20,
        render: renderFeatureSettings
    },
    hints: [{
        id: 'purpose',
        title: 'Messages privés',
        text: 'Rafraîchit la zone des messages privés lorsqu’un nouveau MP arrive et affiche une notification avec accès direct à la conversation.',
        kind: 'info',
        order: 10
    }],
    setup(context) {
        const conversations = new Map();
        const seenMessageIds = new Set();
        const notificationTimer = { value: null };
        let fetchedAt = 0;
        let request = null;
        let eventHub = null;

        async function refreshConversations(force = true) {
            if (!context.platform.isTr4kerPage()) return conversations;
            if (!force && conversations.size > 0 && Date.now() - fetchedAt < STALE_AFTER_MS) return conversations;
            if (request) return request;
            request = (async () => {
                const next = new Map();
                let offset = 0;
                for (let page = 0; page < 5; page += 1) {
                    let response;
                    try {
                        response = await fetch(`/api/conversations/dms?limit=10&offset=${offset}`, { credentials: 'include' });
                    } catch {
                        return conversations;
                    }
                    if (!response.ok) return conversations;
                    let payload;
                    try {
                        payload = await response.json();
                    } catch {
                        return conversations;
                    }
                    const dms = Array.isArray(payload?.dms) ? payload.dms : [];
                    for (const dm of dms) {
                        const id = String(dm?.id ?? '').trim();
                        if (!id) continue;
                        next.set(id, {
                            name: String(dm?.name || 'Message privé').trim(),
                            avatarUrl: String(dm?.avatar_url || '').trim(),
                            lastMessage: String(dm?.last_message || '').trim(),
                            lastAt: String(dm?.last_at || '').trim(),
                            unreadCount: Math.max(0, Number(dm?.unread_count) || 0)
                        });
                    }
                    if (!payload?.has_more || dms.length === 0) break;
                    offset += dms.length;
                }
                conversations.clear();
                next.forEach((conversation, id) => conversations.set(id, conversation));
                fetchedAt = Date.now();
                return conversations;
            })().finally(() => { request = null; });
            return request;
        }

        function isNotificationEnabled() {
            return context.storage.readBoolean(ENABLED_STORAGE_KEY, true);
        }

        async function handleSocketMessage(message) {
            if (!isNotificationEnabled()) return;
            if (message?.type === 'new_dm') {
                const next = await refreshConversations(true);
                refreshSidebarEntry(context.platform, next, next.keys().next().value);
                return;
            }
            if (message?.type !== 'msg.received') return;
            const conversationId = String(message.conv_id || '').trim();
            const messageId = getMessageId(message);
            const sender = String(message.sender || '').trim();
            if (!conversationId || !messageId || !sender) return;

            await refreshConversations(true);
            const conversation = conversations.get(conversationId);
            if (!conversation) return;
            refreshSidebarEntry(context.platform, conversations, conversationId, message);

            const currentContext = context.platform.getCurrentChatContext();
            const isCurrentConversation = currentContext?.type === 'private'
                && String(new URLSearchParams(location.search).get('conv') || '').trim() === conversationId;
            if (isCurrentConversation || normalizeName(sender) === normalizeName(getCurrentUsername())) return;
            if (seenMessageIds.has(messageId)) return;
            seenMessageIds.add(messageId);
            if (seenMessageIds.size > 500) seenMessageIds.delete(seenMessageIds.values().next().value);
            showNotification(notificationTimer, message, conversation);
        }

        const runtime = {
            isEnabled: isNotificationEnabled,
            setEnabled(enabled) {
                context.storage.writeBoolean(ENABLED_STORAGE_KEY, enabled);
                eventHub?.sync();
            },
            async refresh(force = true) {
                const next = await refreshConversations(force);
                for (const id of next.keys()) refreshSidebarEntry(context.platform, next, id);
                return next;
            },
            toast: (message, options) => context.ui.toast.show(message, options)
        };
        activeRuntime = runtime;
        eventHub = acquireMentionEventHub({
            shouldConnect: isNotificationEnabled,
            onMessage: (message) => { void handleSocketMessage(message); },
            logger: context.logger
        });
        context.addCleanup(() => {
            eventHub.release();
            hideNotification(notificationTimer);
            if (activeRuntime === runtime) activeRuntime = null;
        });
        context.on(window, 'storage', (event) => {
            if (event.key === ENABLED_STORAGE_KEY) eventHub.sync();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => eventHub.sync());
        void refreshConversations(false).then((next) => {
            for (const id of next.keys()) refreshSidebarEntry(context.platform, next, id);
        });
    },
    onRoute() {
        void activeRuntime?.refresh(false);
    }
});
