import { defineFeature } from '../../core/feature-registry.js';
import { createProfileHoverCard } from './profile-card.js';
import { renderProfileHoverSettings } from './settings.js';

export default defineFeature({
    id: 'profile-hover',
    label: 'Carte profil au survol',
    defaultEnabled: false,
    legacyEnabledStorageKey: 'tm_t4_profile_hover_enabled',
    pages: ['chat'],
    storageKeys: ['tm_t4_profile_hover_enabled'],
    settings: {
        area: 'shoutbox',
        category: 'shoutbox-appearance',
        order: 10,
        render: renderProfileHoverSettings
    },
    hints: [{
        id: 'purpose',
        title: 'Fonctionnement',
        text: 'Survolez un pseudo ou son avatar pour consulter les informations publiques du profil.',
        kind: 'info',
        order: 10
    }],
    setup(context) {
        const card = createProfileHoverCard({ text: context.text, grades: context.grades });
        const bound = new WeakSet();

        function bind(target, username) {
            if (!(target instanceof HTMLElement) || !username || bound.has(target)) return;
            bound.add(target);
            context.on(target, 'mouseenter', () => card.show(target, username));
            context.on(target, 'mouseleave', () => card.scheduleHide());
            context.on(target, 'click', () => card.hide());
        }

        context.messages.subscribe((message) => {
            const sender = message?.element?.querySelector('[class*="msgSender"]');
            const username = String(message?.username || sender?.textContent || '').trim();
            bind(sender, username);
            const avatar = message?.element?.querySelector(':scope > [class*="msgAvatar"]');
            bind(avatar, username);
        });
        return () => card.destroy();
    }
});
