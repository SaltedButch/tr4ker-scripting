import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { createCrossTabSoundCoordinator } from '../../core/cross-tab-sound-coordinator.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createMentionChannelCatalog } from './channel-catalog.js';
import { createMentionHighlighter } from './highlighter.js';
import { createMentionInbox, MENTION_INBOX_ENABLED_STORAGE_KEY, MENTION_INBOX_STORAGE_KEY } from './inbox.js';
import { createMentionInboxPanel } from './inbox-panel.js';
import { renderMentionSettings } from './settings.js';
import { createMentionSoundPlayer } from './sound-player.js';
import { createMentionSocketMonitor } from './socket-monitor.js';
import { createMentionState, MENTION_SETTINGS_STORAGE_KEY } from './state.js';

let activeRuntime = null;

function renderFeatureSettings(container) {
    renderMentionSettings(container, activeRuntime);
}

function getSoundEventKey(mention) {
    return `message:${mention.id}`;
}

export default defineFeature({
    id: 'mentions',
    label: 'Mentions @moi',
    defaultEnabled: true,
    pages: [],
    storageKeys: [
        MENTION_SETTINGS_STORAGE_KEY,
        'tm_t4_last_mention_sound_notification',
        'tm_t4_recent_mention_sound_notifications',
        'tm_t4_cross_channel_mention_enabled',
        'tm_t4_cross_channel_mention_channels',
        MENTION_INBOX_STORAGE_KEY,
        MENTION_INBOX_ENABLED_STORAGE_KEY
    ],
    settings: {
        area: 'shoutbox',
        category: 'mentions',
        order: 10,
        render: renderFeatureSettings
    },
    hints: [
        {
            id: 'purpose',
            title: 'Fonctionnement',
            text: 'Met en évidence les nouveaux messages qui contiennent @votre pseudo. Le pseudo est comparé sans tenir compte des majuscules ni des accents.',
            kind: 'info',
            order: 10
        },
        {
            id: 'sound',
            title: 'Notifications sonores',
            text: 'Chaque nouvelle mention déclenche une seule alerte sonore.',
            kind: 'warning',
            order: 20
        }
    ],
    setup(context) {
        context.ensureStyle('tm-t4-next-mention-style', `
            @keyframes tm-t4-next-mention-pulse {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.33); }
            }
        `);
        const state = createMentionState({ storage: context.storage });
        const channels = createMentionChannelCatalog({ storage: context.storage });
        const highlighter = createMentionHighlighter({ platform: context.platform });
        const player = createMentionSoundPlayer({ http: context.http });
        const coordinator = createCrossTabSoundCoordinator({
            storage: context.storage,
            namespace: 'tm-t4-next:mention-sound',
            logger: context.logger
        });
        const mentionIds = new Set();
        let inboxPanel = null;
        const inbox = createMentionInbox({
            storage: context.storage,
            onUpdate: () => inboxPanel?.sync()
        });
        inboxPanel = createMentionInboxPanel({
            inbox,
            toast: (message) => context.ui.toast.show(message)
        });

        function rememberMentionId(messageId) {
            const id = String(messageId || '').trim();
            if (!id) return false;
            mentionIds.add(id);
            if (mentionIds.size > 500) mentionIds.delete(mentionIds.values().next().value);
            return true;
        }

        function isTrackedMention(message) {
            return mentionIds.has(String(message?.id || '').trim());
        }

        let socketMonitor = null;
        const runtime = {
            getSettings: () => state.get(),
            toast(message, error = false) {
                context.ui.toast.show(message, { error });
            },
            update(patch) {
                const settings = state.save(patch);
                highlighter.refresh(settings, isTrackedMention);
                socketMonitor?.sync();
                return settings;
            },
            refresh() {
                highlighter.refresh(state.get(), isTrackedMention);
            },
            getCrossChannelEnabled: () => channels.isEnabled(),
            setCrossChannelEnabled(enabled) {
                channels.setEnabled(enabled);
            },
            async getChannels() {
                await channels.refresh();
                return channels.getAll();
            },
            isChannelSelected: (channelId) => channels.isChannelSelected(channelId),
            setChannelSelected(channelId, enabled) {
                channels.setChannelSelected(channelId, enabled);
            },
            selectAllChannels() {
                channels.selectAll();
            },
            isInboxEnabled: () => inbox.isEnabled(),
            setInboxEnabled(enabled) {
                inbox.setEnabled(enabled);
                inboxPanel.sync();
            },
            getInboxUnreadCount: () => inbox.unreadCount(),
            openInbox() {
                inboxPanel.open();
            },
            playTest() {
                return player.play(state.get());
            }
        };
        activeRuntime = runtime;

        async function notifyMention(mention) {
            const settings = state.get();
            if (settings.soundScope !== 'chat') return;
            const reservation = await coordinator.reserve(getSoundEventKey(mention), {
                cooldownSeconds: settings.soundCooldownSeconds
            });
            if (!reservation.allowed) {
                if (context.globals.isDebugModeEnabled()) context.logger.debug('[Mentions] sound skipped:', reservation.reason);
                return;
            }
            const played = await player.play(settings);
            if (!played && context.globals.isDebugModeEnabled()) context.logger.debug('[Mentions] audio playback unavailable.');
        }

        async function handleSocketMention(mention) {
            const catalog = await channels.refresh();
            const channel = catalog.get(mention.conversationId);
            const isCurrent = channels.isCurrent(channel, mention.conversationId);
            // Sans catalogue de canaux, on ne devine pas qu’un événement est
            // inter-canaux : on ne le traite que s’il s’agit explicitement de
            // la conversation ouverte (cas des MP via ?conv=…).
            if (!channel && !isCurrent) return;
            // Le canal ouvert est toujours suivi. Pour les autres, la liste de
            // checkboxes V3 décide si l’événement doit être conservé.
            if (channel && !isCurrent && (!channels.isEnabled() || !channels.isChannelSelected(channel.id))) return;

            rememberMentionId(mention.id);
            runtime.refresh();
            if (channel && !isCurrent) {
                if (inbox.isEnabled()) {
                    inbox.add({
                        id: mention.id,
                        messageId: mention.id,
                        channelId: channel.id,
                        channelName: `#${channel.name}`,
                        sender: mention.sender,
                        body: mention.body,
                        replyContextText: mention.replyContextText,
                        at: mention.receivedAt,
                        capturedAt: Date.parse(mention.receivedAt) || Date.now(),
                        reason: mention.reason
                    });
                }
                const excerpt = String(mention.body || '').replace(/\s+/g, ' ').trim().slice(0, 100);
                context.ui.toast.show(`${mention.sender || 'Un utilisateur'} vous a mentionné dans #${channel.name}${excerpt ? ` : ${excerpt}` : ''}`, { duration: 10000 });
            }
            void notifyMention(mention);
        }

        socketMonitor = createMentionSocketMonitor({
            getSettings: () => state.get(),
            text: context.text,
            logger: context.logger,
            onMention(mention) { void handleSocketMention(mention); }
        });
        context.addCleanup(() => socketMonitor.stop());
        context.messages.subscribe((message) => {
            if (isTrackedMention(message)) highlighter.apply(message, state.get());
        });
        context.on(window, 'storage', (event) => {
            if (event.key === MENTION_SETTINGS_STORAGE_KEY) {
                state.reload();
                highlighter.refresh(state.get(), isTrackedMention);
                socketMonitor.sync();
            }
            if (event.key === MENTION_INBOX_STORAGE_KEY || event.key === MENTION_INBOX_ENABLED_STORAGE_KEY) {
                inbox.reload();
                inboxPanel.sync();
            }
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            state.reload();
            inbox.reload();
            highlighter.refresh(state.get(), isTrackedMention);
            socketMonitor.sync();
            inboxPanel.sync();
        });
        highlighter.refresh(state.get(), isTrackedMention);
        inboxPanel.sync();
        socketMonitor.sync();

        return () => {
            highlighter.destroy();
            inboxPanel.destroy();
            if (activeRuntime === runtime) activeRuntime = null;
        };
    }
});
