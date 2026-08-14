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
    primaryConversationId: '',
    primaryConversationName: '',
    activatedAt: 0
});

let activeRuntime = null;

function normalizeState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_STATE };
    return {
        enabled: value.enabled === true,
        primaryConversationId: String(value.primaryConversationId || '').trim(),
        primaryConversationName: String(value.primaryConversationName || '').trim().slice(0, 160),
        activatedAt: Math.max(0, Number(value.activatedAt) || 0)
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
            text: 'Enregistre les mentions et les réponses reçues pendant votre absence pour les relire plus tard. Aucun message automatique n’est envoyé.',
            kind: 'info',
            order: 10
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
            await channels.refresh();
            const channel = channels.get(event.conversationId);
            const current = isCurrentRecord({ conversationId: event.conversationId });
            if (!current && !isTrackedConversation(event.conversationId)) return;

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
                source: current ? 'current-channel' : 'cross-channel'
            });
            if (record && !current) {
                context.ui.toast.show(`${event.sender} vous a mentionné pendant votre absence.`, { duration: 7000 });
            }
        }

        async function setEnabled(enabled) {
            if (!enabled) {
                saveState({ ...state, enabled: false, primaryConversationId: '', primaryConversationName: '', activatedAt: 0 });
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
                activatedAt: Date.now()
            });
            context.ui.toast.show('Suivi AFK activé. Les nouvelles mentions seront conservées pour relecture.');
            return state;
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
            isCurrentRecord,
            reply: replyToRecord,
            toast: (message) => context.ui.toast.show(message)
        });
        eventHub = acquireMentionEventHub({
            getSettings: () => mentionState.get(),
            logger: context.logger,
            onMention: (event) => { void handleMention(event); }
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
        panel.sync();
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
