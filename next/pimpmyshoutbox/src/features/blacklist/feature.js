/**
 * Implémente la feature « Blacklist » et son cycle de vie.
 *
 * @module src/features/blacklist/feature
 */
import { createFloatingPanel } from '../../core/floating-panel.js';
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { createBlacklistEngine } from './engine.js';
import { renderBlacklistSettings } from './settings.js';
import { createBlacklistState } from './state.js';

const STATS_HIDDEN_STORAGE_KEY = 'tm_t4_stats_box_hidden_chat';
const STATS_DISPLAY_MODE_STORAGE_KEY = 'tm_t4_stats_box_collapsed_chat';
const STATS_POSITION_STORAGE_KEY = 'tm_t4_stats_box_position_chat';
const STATS_SIZE_STORAGE_KEY = 'tm_t4_stats_box_size_chat';
const STATS_PANEL_ID = 'tm-t4-next-blacklist-stats';
const DISPLAY_MODE_EXPANDED = 'expanded';
const DISPLAY_MODE_COMPACT = 'compact';
const DISPLAY_MODE_MINI = 'mini';

let activeRuntime = null;

function normalizeDisplayMode(value) {
    const mode = String(value || '').trim().toLowerCase();
    if (mode === '1' || mode === 'true' || mode === DISPLAY_MODE_COMPACT) return DISPLAY_MODE_COMPACT;
    if (mode === DISPLAY_MODE_MINI) return DISPLAY_MODE_MINI;
    return DISPLAY_MODE_EXPANDED;
}

function createHeaderButton(label, title, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.style.cssText = 'border:0;border-radius:7px;background:#27272a;color:#d4d4d8;min-width:24px;height:24px;padding:0 6px;cursor:pointer;font-size:14px;font-weight:700;line-height:1;';
    button.addEventListener('click', onClick);
    return button;
}

function applyStatsPresentation(runtime) {
    const panelElement = runtime.panel.getElement();
    if (!(panelElement instanceof HTMLElement)) return;
    const body = panelElement.querySelector('.tm-t4-next-floating-panel-body');
    const resizeHandle = panelElement.querySelector('.tm-t4-next-floating-panel-resize');
    const isMini = runtime.getDisplayMode() === DISPLAY_MODE_MINI;

    if (isMini) {
        if (!runtime.expandedBounds) runtime.expandedBounds = runtime.panel.getBounds();
        panelElement.style.width = 'auto';
        panelElement.style.height = 'auto';
        panelElement.style.minWidth = '0';
        panelElement.style.minHeight = '0';
        panelElement.style.borderRadius = '999px';
        if (body instanceof HTMLElement) body.style.display = 'none';
        if (resizeHandle instanceof HTMLElement) resizeHandle.style.display = 'none';
        return;
    }

    panelElement.style.borderRadius = '13px';
    panelElement.style.minWidth = '220px';
    panelElement.style.minHeight = '110px';
    if (body instanceof HTMLElement) body.style.display = '';
    if (resizeHandle instanceof HTMLElement) resizeHandle.style.display = '';
    if (runtime.restoreExpandedBounds && runtime.expandedBounds) {
        runtime.panel.setBounds(runtime.expandedBounds);
        runtime.restoreExpandedBounds = false;
    }
}

function renderStatsPanel(runtime) {
    if (!runtime.isStatsVisible()) {
        runtime.panel.destroy();
        return;
    }

    const displayMode = runtime.getDisplayMode();
    const isCompact = displayMode === DISPLAY_MODE_COMPACT;
    const isMini = displayMode === DISPLAY_MODE_MINI;
    const total = runtime.engine.getTotal();

    runtime.panel.render((container) => {
        if (isMini) return;
        const total = runtime.engine.getTotal();
        const summary = document.createElement('div');
        summary.style.cssText = 'margin-bottom:8px;color:#d4d4d8;';
        summary.innerHTML = `Total session : <strong style="color:#fff;">${total}</strong><span style="display:block;margin-top:4px;color:#a1a1aa;">Blacklist : ${runtime.list().length} pseudo${runtime.list().length > 1 ? 's' : ''}</span>`;
        container.append(summary);

        const counts = runtime.engine.getCounts();
        if (!isCompact && counts.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#9ca3af;font-size:12px;';
            empty.textContent = 'Aucun message bloqué pour l’instant';
            container.append(empty);
        } else if (!isCompact && counts.length > 0) {
            const list = document.createElement('div');
            list.style.cssText = 'display:grid;gap:5px;';
            for (const { username, count } of counts) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;justify-content:space-between;gap:10px;padding:5px 7px;border-radius:6px;background:rgba(255,255,255,.06);';
                const name = document.createElement('span');
                name.textContent = username;
                const amount = document.createElement('strong');
                amount.textContent = String(count);
                row.append(name, amount);
                list.append(row);
            }
            container.append(list);
        }

        if (!isCompact && runtime.list().length > 0) {
            const blacklist = document.createElement('div');
            blacklist.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#a1a1aa;';
            blacklist.textContent = `Utilisateurs masqués : ${runtime.list().join(', ')}`;
            container.append(blacklist);
        }

        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#9ca3af;line-height:1.45;';
        footer.textContent = 'Alt/⌘ + clic pseudo : pour blacklister';
        container.append(footer);
    }, {
        renderHeader(header) {
            header.style.cssText = 'display:flex;align-items:center;gap:6px;min-height:36px;padding:6px 8px;';
            const label = document.createElement('div');
            label.style.flex = '1';
            label.textContent = isMini ? `Total : ${total}` : 'Messages bloqués';
            header.append(label);
            header.append(createHeaderButton('⚙', 'Ouvrir les paramètres', () => runtime.context.ui.settings.open()));
            if (isMini) {
                header.append(createHeaderButton('+', 'Développer la stats box', () => runtime.setDisplayMode(DISPLAY_MODE_EXPANDED)));
            } else if (isCompact) {
                header.append(createHeaderButton('--', 'Passer la stats box en pastille', () => runtime.setDisplayMode(DISPLAY_MODE_MINI)));
                header.append(createHeaderButton('+', 'Développer la stats box', () => runtime.setDisplayMode(DISPLAY_MODE_EXPANDED)));
            } else {
                header.append(createHeaderButton('−', 'Réduire la stats box', () => runtime.setDisplayMode(DISPLAY_MODE_COMPACT)));
            }
        }
    });
    applyStatsPresentation(runtime);
}

function renderFeatureSettings(container, { refresh }) {
    renderBlacklistSettings(container, activeRuntime, { refresh });
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'blacklist',
    label: 'Blacklist',
    defaultEnabled: true,
    pages: ['chat'],
    settings: {
        area: 'shoutbox',
        category: 'filtering',
        order: 10,
        render: renderFeatureSettings
    },
    hints: [
        {
            id: 'purpose',
            title: 'Fonctionnement',
            text: 'Les messages des utilisateurs masqués sont retirés du chat localement. Aucun réglage Tr4ker n’est modifié.',
            kind: 'info',
            order: 10
        },
        {
            id: 'quick-toggle',
            title: 'Raccourci souris',
            text: 'Utilise Alt + clic sur un pseudo sous Windows/Linux, ou ⌘ + clic sur Mac, pour masquer ou réafficher rapidement cet utilisateur.',
            kind: 'tip',
            order: 20
        }
    ],
    setup(context) {
        const state = createBlacklistState({
            storage: context.storage,
            normalizeName: context.text.normalizeName
        });
        const panel = createFloatingPanel({
            id: STATS_PANEL_ID,
            title: 'Messages filtrés',
            storage: context.storage,
            positionStorageKey: STATS_POSITION_STORAGE_KEY,
            sizeStorageKey: STATS_SIZE_STORAGE_KEY,
            defaultBounds: { right: 22, bottom: 22, width: 260, height: 170 },
            minWidth: 220,
            minHeight: 110
        });
        let statsVisible = !context.storage.readBoolean(STATS_HIDDEN_STORAGE_KEY, false);
        let displayMode = normalizeDisplayMode(context.storage.get(STATS_DISPLAY_MODE_STORAGE_KEY));
        let runtime = null;
        const engine = createBlacklistEngine({
            platform: context.platform,
            state,
            isDebugModeEnabled: () => context.globals.isDebugModeEnabled(),
            onUpdate: () => runtime && renderStatsPanel(runtime)
        });

        runtime = {
            context,
            state,
            engine,
            panel,
            toast(message, isError = false) {
                context.ui.toast.show(message, { error: isError });
            },
            list: () => state.list(),
            add(username) {
                const result = state.add(username);
                if (result.ok) engine.refresh();
                return result;
            },
            toggle(username) {
                const result = state.toggle(username);
                if (result.ok) engine.refresh();
                return result;
            },
            remove(username) {
                const result = state.remove(username);
                if (result.ok) engine.refresh();
                return result;
            },
            isStatsVisible: () => statsVisible,
            setStatsVisible(visible) {
                statsVisible = Boolean(visible);
                context.storage.writeBoolean(STATS_HIDDEN_STORAGE_KEY, !statsVisible);
                renderStatsPanel(runtime);
            },
            getDisplayMode: () => displayMode,
            setDisplayMode(nextDisplayMode) {
                const nextMode = normalizeDisplayMode(nextDisplayMode);
                if (displayMode === DISPLAY_MODE_MINI && nextMode !== DISPLAY_MODE_MINI) {
                    runtime.restoreExpandedBounds = true;
                }
                if (displayMode !== DISPLAY_MODE_MINI && nextMode === DISPLAY_MODE_MINI) {
                    runtime.expandedBounds = panel.getBounds();
                }
                displayMode = nextMode;
                context.storage.set(STATS_DISPLAY_MODE_STORAGE_KEY, displayMode);
                renderStatsPanel(runtime);
                const message = displayMode === DISPLAY_MODE_MINI
                    ? 'Stats box minimisée.'
                    : displayMode === DISPLAY_MODE_COMPACT
                    ? 'Stats box réduite.'
                    : 'Stats box développée.';
                runtime.toast(message);
            }
        };
        activeRuntime = runtime;

        const unsubscribeState = state.subscribe(() => {
            engine.refresh();
            renderStatsPanel(runtime);
        });
        context.addCleanup(unsubscribeState);
        context.addCleanup(context.globals.subscribeToDebugMode(() => engine.refresh()));

        context.messages.subscribe((message) => {
            engine.apply(message);
        });
        context.on(document, 'click', (event) => {
            if (!context.platform.isChatPage() || event.button !== 0 || !context.shortcuts.hasPlatformModifier(event)) return;
            const target = event.target instanceof Element ? event.target : null;
            const sender = target?.closest('button[class*="msgSender"], [class*="msgSender"]');
            const messageElement = sender ? context.platform.findMessageElement(sender) : null;
            const message = messageElement ? context.platform.getMessageDetails(messageElement) : null;
            if (!message?.username) return;

            event.preventDefault();
            event.stopPropagation();
            const result = runtime.state.toggle(message.username);
            runtime.toast(result.message, !result.ok);
        }, true);
        context.on(window, 'storage', (event) => {
            if (event.key === state.storageKey) state.load();
            if (event.key === STATS_HIDDEN_STORAGE_KEY) {
                statsVisible = !context.storage.readBoolean(STATS_HIDDEN_STORAGE_KEY, false);
                renderStatsPanel(runtime);
            }
            if (event.key === STATS_DISPLAY_MODE_STORAGE_KEY) {
                displayMode = normalizeDisplayMode(context.storage.get(STATS_DISPLAY_MODE_STORAGE_KEY));
                renderStatsPanel(runtime);
            }
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            state.load();
            statsVisible = !context.storage.readBoolean(STATS_HIDDEN_STORAGE_KEY, false);
            displayMode = normalizeDisplayMode(context.storage.get(STATS_DISPLAY_MODE_STORAGE_KEY));
            engine.refresh();
            renderStatsPanel(runtime);
        });

        engine.refresh();
        renderStatsPanel(runtime);

        return () => {
            if (activeRuntime === runtime) activeRuntime = null;
            panel.destroy();
            engine.destroy();
        };
    },
    onRoute(context) {
        const runtime = activeRuntime?.context === context ? activeRuntime : null;
        runtime?.engine.refresh();
    }
});
