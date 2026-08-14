/**
 * Suit les mentions reçues pendant une absence et facilite leur relecture.
 *
 * @module src/features/afk/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createMentionChannelCatalog } from '../mentions/channel-catalog.js';
import { acquireMentionEventHub } from '../mentions/event-hub.js';
import { createMentionState } from '../mentions/state.js';
import { createAfkPanel } from './panel.js';
import { createAfkRecords, AFK_RECORDS_STORAGE_KEY } from './records.js';
import { renderAfkSettings } from './settings.js';

export const AFK_STATE_STORAGE_KEY = 'tm_t4_afk_state_v4';
export const AFK_CHANNELS_STORAGE_KEY = 'tm_t4_afk_channels_v4';

const DEFAULT_STATE = Object.freeze({
    enabled: false,
    autoReplyEnabled: true,
    autoReplyMessage: 'Je suis AFK quelques minutes, je reviens rapidement.',
    primaryConversationId: '',
    primaryConversationName: '',
    activatedAt: 0,
    lastAutoReplyAt: 0,
    perSenderReplyAt: {}
});
const AUTO_REPLY_GLOBAL_COOLDOWN_MS = 60 * 1000;
const AUTO_REPLY_PER_SENDER_COOLDOWN_MS = 5 * 60 * 1000;
const AUTO_REPLY_MAX_MESSAGE_LENGTH = 300;
const AUTO_REPLY_CONFIRMATION_TIMEOUT_MS = 10 * 1000;

let activeRuntime = null;

function normalizeState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_STATE };
    return {
        enabled: value.enabled === true,
        autoReplyEnabled: value.autoReplyEnabled !== false,
        autoReplyMessage: String(value.autoReplyMessage || DEFAULT_STATE.autoReplyMessage).trim().slice(0, AUTO_REPLY_MAX_MESSAGE_LENGTH) || DEFAULT_STATE.autoReplyMessage,
        primaryConversationId: String(value.primaryConversationId || '').trim(),
        primaryConversationName: String(value.primaryConversationName || '').trim().slice(0, 160),
        activatedAt: Math.max(0, Number(value.activatedAt) || 0),
        lastAutoReplyAt: Math.max(0, Number(value.lastAutoReplyAt) || 0),
        perSenderReplyAt: Object.fromEntries(Object.entries(value.perSenderReplyAt || {})
            .map(([sender, timestamp]) => [String(sender || '').trim().toLowerCase(), Math.max(0, Number(timestamp) || 0)])
            .filter(([sender, timestamp]) => sender && timestamp > 0))
    };
}

function renderFeatureSettings(container) {
    renderAfkSettings(container, activeRuntime);
}

/**
 * Déclare la feature AFK et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'afk',
    label: 'Suivi AFK',
    defaultEnabled: true,
    pages: [],
    storageKeys: [AFK_STATE_STORAGE_KEY, AFK_CHANNELS_STORAGE_KEY, AFK_RECORDS_STORAGE_KEY],
    shortcuts: [{ id: 'toggle', key: 'A', modifiers: ['ctrl', 'platform'], allowInEditable: true }],
    settings: {
        area: 'shoutbox',
        category: 'mentions',
        order: 20,
        render: renderFeatureSettings
    },
    hints: [
        {
            id: 'purpose',
            title: 'Suivi pendant l’absence',
            text: 'Enregistre les mentions et les réponses reçues pendant votre absence et peut envoyer une réponse automatique dans le canal principal.',
            kind: 'info',
            order: 10
        },
        {
            id: 'shortcut',
            title: 'Raccourci',
            text: 'Utilisez {{shortcut:toggle}} pour activer ou désactiver rapidement le suivi AFK.',
            kind: 'tip',
            order: 20
        }
    ],
    setup(context) {
        const mentionState = createMentionState({ storage: context.storage });
        const channels = createMentionChannelCatalog({ storage: context.storage });
        let panel = null;
        let eventHub = null;
        const records = createAfkRecords({
            storage: context.storage,
            onUpdate: () => panel?.sync()
        });
        let state = normalizeState(context.storage.readJson(AFK_STATE_STORAGE_KEY, null));
        let selectedChannelIds = loadSelectedChannelIds(context.storage);
        let replyInFlight = false;
        const pendingReplies = new Map();

        function saveState(nextState) {
            state = normalizeState(nextState);
            context.storage.writeJson(AFK_STATE_STORAGE_KEY, state);
            panel?.sync();
            return state;
        }

        function reload() {
            state = normalizeState(context.storage.readJson(AFK_STATE_STORAGE_KEY, null));
            selectedChannelIds = loadSelectedChannelIds(context.storage);
            panel?.sync();
            eventHub?.sync();
        }

        function getCurrentConversationId() {
            const queryConversationId = String(new URLSearchParams(location.search).get('conv') || '').trim();
            if (queryConversationId) return queryConversationId;
            return channels.getAll().find((channel) => channels.isCurrent(channel, channel.id))?.id || '';
        }

        function isCurrentRecord(record) {
            const conversationId = String(record?.conversationId || '').trim();
            if (!conversationId) return false;
            const queryConversationId = String(new URLSearchParams(location.search).get('conv') || '').trim();
            if (queryConversationId) return queryConversationId === conversationId;
            const channel = channels.get(conversationId);
            return Boolean(channel && channels.isCurrent(channel, conversationId));
        }

        function isTrackedConversation(conversationId) {
            const id = String(conversationId || '').trim();
            return !!id && (id === state.primaryConversationId || selectedChannelIds.includes(id));
        }

        async function handleMention(event) {
            if (!state.enabled || !mentionState.get().username) return;
            const eventTimestamp = Date.parse(event.receivedAt) || 0;
            if (eventTimestamp > 0 && state.activatedAt > 0 && eventTimestamp < state.activatedAt - 5000) return;
            await channels.refresh();
            const channel = channels.get(event.conversationId);
            const current = isCurrentRecord({ conversationId: event.conversationId });
            const primary = event.conversationId === state.primaryConversationId;
            if (!primary && !selectedChannelIds.includes(event.conversationId)) return;

            const record = records.add({
                id: `afk:${event.id}`,
                messageId: event.id,
                conversationId: event.conversationId,
                conversationName: channel ? `#${channel.name}` : (state.primaryConversationName || 'Conversation inconnue'),
                sender: event.sender,
                body: event.body,
                replyContextText: event.replyContextText,
                reason: event.reason,
                receivedAt: event.receivedAt,
                capturedAt: Date.parse(event.receivedAt) || Date.now(),
                source: current ? 'current-channel' : 'cross-channel',
                autoReplyStatus: primary ? (state.autoReplyEnabled ? 'pending' : 'disabled') : 'cross-channel'
            });
            if (record && primary) {
                void sendAutoReply(record, event, channel);
            } else if (record && !current) {
                context.ui.toast.show(`${event.sender} vous a mentionné pendant votre absence.`, { duration: 7000 });
            }
        }

        function buildAutoReply(event, channel) {
            const template = state.autoReplyMessage
                .replace(/\{\{\s*sender\s*\}\}/gi, event.sender)
                .replace(/\{\{\s*channel\s*\}\}/gi, channel ? `#${channel.name}` : state.primaryConversationName);
            return `@${event.sender} ${template}`.trim().slice(0, 4000);
        }

        async function sendAutoReply(record, event, channel) {
            if (!state.autoReplyEnabled) return;
            if (replyInFlight) {
                records.update(record.id, { autoReplyStatus: 'busy' });
                return;
            }

            const now = Date.now();
            const senderKey = String(event.sender || '').trim().toLowerCase();
            const senderLastReplyAt = Math.max(0, Number(state.perSenderReplyAt[senderKey]) || 0);
            if (state.lastAutoReplyAt > 0 && now - state.lastAutoReplyAt < AUTO_REPLY_GLOBAL_COOLDOWN_MS) {
                records.update(record.id, { autoReplyStatus: 'cooldown-global' });
                return;
            }
            if (senderLastReplyAt > 0 && now - senderLastReplyAt < AUTO_REPLY_PER_SENDER_COOLDOWN_MS) {
                records.update(record.id, { autoReplyStatus: 'cooldown-sender' });
                return;
            }

            const replyText = buildAutoReply(event, channel);
            replyInFlight = true;
            const result = context.input.send(context.input.get(), replyText, { preserveDraft: false });
            replyInFlight = false;
            if (!result.ok) {
                records.update(record.id, { autoReplyStatus: result.code || 'send-failed', autoReplyText: replyText });
                return;
            }

            saveState({
                ...state,
                lastAutoReplyAt: now,
                perSenderReplyAt: { ...state.perSenderReplyAt, [senderKey]: now }
            });
            records.update(record.id, {
                autoReplyStatus: 'requested',
                autoReplyText: replyText,
                autoReplyRequestedAt: now
            });
            pendingReplies.set(record.id, { body: replyText, requestedAt: now });
            context.later(AUTO_REPLY_CONFIRMATION_TIMEOUT_MS, () => {
                if (!pendingReplies.has(record.id)) return;
                pendingReplies.delete(record.id);
                records.update(record.id, { autoReplyStatus: 'unconfirmed' });
            });
        }

        function confirmAutoReply(message) {
            if (!message || normalizeUsername(message.username) !== normalizeUsername(mentionState.get().username)) return;
            const messageText = normalizeMessage(message.text);
            if (!messageText) return;
            for (const [recordId, pending] of pendingReplies) {
                if (Date.now() - pending.requestedAt > AUTO_REPLY_CONFIRMATION_TIMEOUT_MS) continue;
                if (normalizeMessage(pending.body) !== messageText) continue;
                pendingReplies.delete(recordId);
                records.update(recordId, {
                    autoReplyStatus: 'confirmed',
                    autoReplyConfirmedAt: Date.now(),
                    autoReplyMessageId: message.id
                });
                break;
            }
        }

        function normalizeUsername(value) {
            return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        }

        function normalizeMessage(value) {
            return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
        }

        async function setEnabled(enabled) {
            if (enabled && !mentionState.get().username) {
                context.ui.toast.show('Configure d’abord ton pseudo dans les réglages de mentions.', { error: true });
                return state;
            }
            if (!enabled) {
                saveState({ ...state, enabled: false, primaryConversationId: '', primaryConversationName: '', activatedAt: 0, lastAutoReplyAt: 0, perSenderReplyAt: {} });
                context.ui.toast.show('Mode AFK désactivé. L’historique reste disponible pour relecture et réponse.');
                return state;
            }

            await channels.refresh();
            const primaryConversationId = getCurrentConversationId();
            const primaryChannel = channels.get(primaryConversationId);
            saveState({
                ...state,
                enabled: true,
                primaryConversationId,
                primaryConversationName: primaryChannel ? `#${primaryChannel.name}` : 'Conversation actuelle',
                activatedAt: Date.now(),
                lastAutoReplyAt: 0,
                perSenderReplyAt: {}
            });
            panel?.open({ config: true });
            context.ui.toast.show('Suivi AFK activé. Les nouvelles mentions seront conservées pour relecture.');
            return state;
        }

        function setAutoReplyEnabled(enabled) {
            saveState({ ...state, autoReplyEnabled: enabled === true });
        }

        function setAutoReplyMessage(message) {
            saveState({
                ...state,
                autoReplyMessage: String(message || '').trim().slice(0, AUTO_REPLY_MAX_MESSAGE_LENGTH) || DEFAULT_STATE.autoReplyMessage
            });
        }

        function setChannelSelected(channelId, enabled) {
            const id = String(channelId || '').trim();
            if (!id) return;
            const next = new Set(selectedChannelIds);
            if (enabled) next.add(id);
            else next.delete(id);
            selectedChannelIds = [...next];
            context.storage.writeJson(AFK_CHANNELS_STORAGE_KEY, selectedChannelIds);
            panel?.sync();
        }

        function selectAllChannels() {
            selectedChannelIds = channels.getAll().map((channel) => channel.id);
            context.storage.writeJson(AFK_CHANNELS_STORAGE_KEY, selectedChannelIds);
            panel?.sync();
        }

        function replyToRecord(record) {
            if (!isCurrentRecord(record)) {
                context.ui.toast.show('Ouvre d’abord la conversation concernée pour répondre.', { error: true });
                return;
            }
            const input = context.input.get();
            const result = context.input.insert(input, `@${record.sender}`, {
                successMessage: 'Mention insérée dans la réponse.'
            });
            if (!result.ok) {
                context.ui.toast.show(result.message, { error: true });
                return;
            }
            records.setRead(record.id, true);
            context.ui.toast.show('Réponse préparée dans le champ du chat.');
        }

        const runtime = {
            getState: () => ({ ...state }),
            getUsername: () => mentionState.get().username,
            setAutoReplyEnabled,
            setAutoReplyMessage,
            async setEnabled(enabled) { return setEnabled(enabled === true); },
            getChannels: async () => { await channels.refresh(); return channels.getAll(); },
            isChannelSelected: (channelId) => selectedChannelIds.includes(String(channelId || '').trim()),
            setChannelSelected,
            selectAllChannels,
            getUnreadCount: () => records.unreadCount(),
            openPanel: () => panel?.open(),
            toast: (message, error = false) => context.ui.toast.show(message, { error })
        };
        activeRuntime = runtime;
        panel = createAfkPanel({
            records,
            getState: () => ({ ...state }),
            setAutoReplyEnabled,
            setAutoReplyMessage,
            getChannels: async () => { await channels.refresh(); return channels.getAll(); },
            isChannelSelected: (channelId) => selectedChannelIds.includes(String(channelId || '').trim()),
            setChannelSelected,
            selectAllChannels,
            disable: () => { void setEnabled(false); },
            onClose: () => { void setEnabled(false); },
            isCurrentRecord,
            reply: replyToRecord,
            toast: (message) => context.ui.toast.show(message)
        });
        eventHub = acquireMentionEventHub({
            getSettings: () => mentionState.get(),
            logger: context.logger,
            onMention: (event) => { void handleMention(event); }
        });
        context.messages.subscribe((message, meta) => {
            if (meta?.source !== 'mutation') return;
            confirmAutoReply(message);
        }, { replay: false });
        context.shortcuts.bind('toggle', async () => {
            await runtime.setEnabled(!runtime.getState().enabled);
        });

        context.on(window, 'storage', (event) => {
            if ([AFK_STATE_STORAGE_KEY, AFK_CHANNELS_STORAGE_KEY, AFK_RECORDS_STORAGE_KEY].includes(event.key)) reload();
            if (event.key === 'tm_t4_mention_highlight_settings') eventHub?.sync();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            mentionState.reload();
            records.reload();
            reload();
        });
        context.addCleanup(() => eventHub.release());
        context.addCleanup(() => panel.destroy());
        if (state.enabled) panel.open({ config: true });
        else panel.sync();
        void channels.refresh().then(() => panel.sync());

        return () => {
            if (activeRuntime === runtime) activeRuntime = null;
        };
    }
});

function loadSelectedChannelIds(storage) {
    const value = storage.readJson(AFK_CHANNELS_STORAGE_KEY, null);
    if (Array.isArray(value)) return [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))];
    const legacy = storage.readJson('tm_t4_afk_channels', []);
    return Array.isArray(legacy) ? [...new Set(legacy.map((id) => String(id || '').trim()).filter(Boolean))] : [];
}
