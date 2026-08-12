import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderChatToolbarLayoutSettings } from './settings.js';

const INLINE_STORAGE_KEY = 'tm_t4_chat_input_toolbar_inline';
const ALIGN_RIGHT_STORAGE_KEY = 'tm_t4_chat_input_toolbar_align_right';

let activeRuntime = null;

export default defineFeature({
    id: 'chat-toolbar-layout',
    label: 'Disposition de la barre d’outils',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [INLINE_STORAGE_KEY, ALIGN_RIGHT_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 50, render: renderChatToolbarLayoutSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Place la barre d’outils au-dessus ou à côté du champ de message et permet de l’aligner à droite.', kind: 'info', order: 10 }],
    setup(context) {
        const getInline = () => context.storage.readBoolean(INLINE_STORAGE_KEY, false);
        const getAlignedRight = () => context.storage.readBoolean(ALIGN_RIGHT_STORAGE_KEY, false);
        const refresh = () => context.mediaToolbar.refresh();
        const setInline = (enabled) => { context.storage.writeBoolean(INLINE_STORAGE_KEY, enabled); refresh(); };
        const setAlignedRight = (enabled) => { context.storage.writeBoolean(ALIGN_RIGHT_STORAGE_KEY, enabled); refresh(); };
        const runtime = { context, getInline, getAlignedRight, setInline, setAlignedRight, refresh };
        context.chatToolbarLayout = runtime;
        activeRuntime = runtime;
        context.on(window, 'storage', (event) => { if ([INLINE_STORAGE_KEY, ALIGN_RIGHT_STORAGE_KEY].includes(event.key)) refresh(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, refresh);
        refresh();
        return () => { delete context.chatToolbarLayout; refresh(); if (activeRuntime === runtime) activeRuntime = null; };
    },
    onRoute(context) { activeRuntime?.context === context && activeRuntime.refresh(); }
});
