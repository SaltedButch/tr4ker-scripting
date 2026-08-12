import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createHighlightHighlighter } from './highlighter.js';
import { renderHighlightSettings } from './settings.js';
import { createHighlightState } from './state.js';

export default defineFeature({
    id: 'highlight-users',
    label: 'Mettre en avant',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: ['tm_highlighted_shout_users_t4'],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 30, render: renderHighlightSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Choisissez des utilisateurs dont les messages doivent ressortir visuellement dans la shoutbox.', kind: 'info', order: 10 }],
    setup(context) {
        const state = createHighlightState({ storage: context.storage, normalizeName: context.text.normalizeName });
        const highlighter = createHighlightHighlighter({ platform: context.platform, ensureStyle: context.ensureStyle });
        const runtime = {
            list: () => state.list(),
            upsert: (...args) => state.upsert(...args),
            remove: (...args) => state.remove(...args),
            refresh: () => highlighter.refresh((username) => state.get(username))
        };
        context.highlightUsers = runtime;
        context.messages.subscribe((message) => {
            highlighter.apply(message, state.get(message?.normalizedUsername));
            const previous = message?.element?.previousElementSibling;
            if (context.platform.isMessage(previous)) {
                const previousMessage = context.platform.getMessageDetails(previous);
                highlighter.apply(previousMessage, state.get(previousMessage?.normalizedUsername));
            }
        });
        context.addCleanup(state.subscribe(() => runtime.refresh()));
        context.on(window, 'storage', (event) => { if (event.key === state.storageKey) state.load(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => state.load());
        runtime.refresh();
        return () => { delete context.highlightUsers; highlighter.destroy(); };
    },
    onRoute(context) { context.highlightUsers?.refresh(); }
});
