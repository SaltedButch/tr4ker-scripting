import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { createCrossTabSoundCoordinator } from '../../core/cross-tab-sound-coordinator.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createMentionHighlighter } from './highlighter.js';
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
        'tm_t4_recent_mention_sound_notifications'
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
            title: 'Son multi-onglets',
            text: 'Pour une même mention, un seul onglet Tr4ker est autorisé à jouer le son. Si le stockage partagé du navigateur est indisponible, le son est volontairement ignoré pour éviter les doublons.',
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
        const highlighter = createMentionHighlighter({ platform: context.platform });
        const player = createMentionSoundPlayer({ http: context.http });
        const coordinator = createCrossTabSoundCoordinator({
            storage: context.storage,
            namespace: 'tm-t4-next:mention-sound',
            logger: context.logger
        });
        const mentionIds = new Set();

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

        socketMonitor = createMentionSocketMonitor({
            getSettings: () => state.get(),
            text: context.text,
            logger: context.logger,
            onMention(mention) {
                rememberMentionId(mention.id);
                // If the current conversation is open, this finds the DOM node
                // by id and paints it. It never reads text from that node.
                runtime.refresh();
                void notifyMention(mention);
            }
        });
        context.addCleanup(() => socketMonitor.stop());
        context.messages.subscribe((message) => {
            if (isTrackedMention(message)) highlighter.apply(message, state.get());
        });
        context.on(window, 'storage', (event) => {
            if (event.key !== MENTION_SETTINGS_STORAGE_KEY) return;
            state.reload();
            highlighter.refresh(state.get(), isTrackedMention);
            socketMonitor.sync();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            state.reload();
            highlighter.refresh(state.get(), isTrackedMention);
            socketMonitor.sync();
        });
        highlighter.refresh(state.get(), isTrackedMention);
        socketMonitor.sync();

        return () => {
            highlighter.destroy();
            if (activeRuntime === runtime) activeRuntime = null;
        };
    }
});
