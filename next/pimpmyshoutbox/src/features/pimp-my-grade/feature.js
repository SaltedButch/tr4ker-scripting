import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderPimpMyGradeSettings } from './settings.js';

const COLORS_STORAGE_KEY = 'tm_t4_grade_pseudonym_colors';
const EFFECTS_STORAGE_KEY = 'tm_t4_grade_pseudonym_effects';

let activeRuntime = null;

function getTargets(messageElement, sender) {
    const titles = [...messageElement.querySelectorAll('[class*="msgMeta"] [class*="msgTitle"]')]
        .filter((element) => element instanceof HTMLElement);
    return [sender, ...titles].filter((element, index, elements) => (
        element instanceof HTMLElement && elements.indexOf(element) === index
    ));
}

export default defineFeature({
    id: 'pimp-my-grade',
    label: 'Pimp My Grade',
    pages: ['chat'],
    storageKeys: [COLORS_STORAGE_KEY, EFFECTS_STORAGE_KEY],
    settings: {
        area: 'shoutbox',
        category: 'shoutbox-appearance',
        order: 20,
        render: renderPimpMyGradeSettings
    },
    hints: [{
        id: 'purpose',
        title: 'Fonctionnement',
        text: 'Personnalisez la couleur et l’animation des pseudonymes selon leur grade.',
        kind: 'info',
        order: 10
    }],
    setup(context) {
        const appliedElements = new Set();

        function apply(message) {
            const messageElement = message?.element;
            const sender = messageElement?.querySelector('[class*="msgSender"]');
            if (!(messageElement instanceof HTMLElement) || !(sender instanceof HTMLElement)) return;

            const grade = context.grades.findNativeGrade(sender);
            for (const element of getTargets(messageElement, sender)) {
                context.grades.applyElement(element, grade);
                appliedElements.add(element);
            }
        }

        function refresh() {
            for (const messageElement of context.platform.getMessages()) {
                apply(context.platform.getMessageDetails(messageElement));
            }
        }

        const runtime = { context, refresh };
        activeRuntime = runtime;
        context.pimpMyGrade = runtime;
        context.messages.subscribe((message) => apply(message));
        context.on(window, 'storage', (event) => {
            if (event.key === COLORS_STORAGE_KEY || event.key === EFFECTS_STORAGE_KEY) refresh();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, refresh);
        refresh();

        return () => {
            if (activeRuntime === runtime) activeRuntime = null;
            delete context.pimpMyGrade;
            for (const element of appliedElements) context.grades.restoreElement(element);
        };
    },
    onRoute(context) {
        const runtime = activeRuntime?.context === context ? activeRuntime : null;
        runtime?.refresh();
    }
});
