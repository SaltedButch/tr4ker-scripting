import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { CHANNEL_IDS_STORAGE_KEY, createChannelCatalog } from './channel-catalog.js';
import { renderChannelUnreadBadgesSettings } from './settings.js';

const MARKER = 'data-tm-t4-hide-channel-unread';
const STYLE_ID = 'tm-t4-next-channel-unread-badges-style';

function comparable(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');
}

function channelRows(platform) {
    const sidebar = platform.getChatSidebarLayout()?.sidebar;
    if (!(sidebar instanceof HTMLElement)) return [];
    const section = [...sidebar.querySelectorAll('section')].find((candidate) => comparable(candidate.querySelector('[class*="sectionLabelText"]')?.textContent) === 'canaux');
    if (!(section instanceof HTMLElement)) return [];
    return [...section.querySelectorAll('[role="button"]')].map((row) => ({ row, name: String(row.querySelector('[class*="navName"]')?.textContent || '').trim() })).filter((entry) => entry.name);
}

export default defineFeature({
    id: 'channel-unread-badges',
    label: 'Masquer les compteurs de canaux',
    defaultEnabled: false,
    pages: ['chat'],
    storageKeys: [CHANNEL_IDS_STORAGE_KEY],
    settings: { area: 'shoutbox', category: 'shoutbox-appearance', order: 25, render: renderChannelUnreadBadgesSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Masque les bulles indiquant le nombre de nouveaux messages, uniquement pour les canaux que vous choisissez.', kind: 'info', order: 10 }],
    setup(context) {
        const catalog = createChannelCatalog({ storage: context.storage });
        context.ensureStyle(STYLE_ID, `[${MARKER}="1"] [class*="unreadBadge"]{display:none!important;}`);
        const sync = async () => {
            const channels = await catalog.refresh();
            const idsByName = new Map([...channels.values()].map((channel) => [comparable(channel.name), channel.id]));
            for (const { row, name } of channelRows(context.platform)) {
                const id = idsByName.get(comparable(name));
                if (id && catalog.isSelected(id)) row.setAttribute(MARKER, '1');
                else row.removeAttribute(MARKER);
            }
        };
        const runtime = {
            async getChannels() { await catalog.refresh(); return catalog.getAll(); },
            isChannelSelected: catalog.isSelected,
            setChannelSelected(id, enabled) { catalog.setSelected(id, enabled); void sync(); },
            selectAllChannels() { catalog.selectAll(); void sync(); },
            toast: (message, error = false) => context.ui.toast.show(message, { error })
        };
        context.channelUnreadBadges = runtime;
        context.on(window, 'storage', (event) => { if (event.key === CHANNEL_IDS_STORAGE_KEY) void sync(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => void sync());
        context.every(850, () => void sync());
        void sync();
        return () => { delete context.channelUnreadBadges; document.querySelectorAll(`[${MARKER}="1"]`).forEach((row) => row.removeAttribute(MARKER)); };
    }
});
