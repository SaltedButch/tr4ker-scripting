import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';

const WIDTH_STORAGE_KEY = 'tm_t4_chat_sidebar_width';
const COLLAPSED_STORAGE_KEY = 'tm_t4_chat_sidebar_collapsed';
const RESIZER_ID = 'tm-t4-next-chat-sidebar-resizer';
const TOGGLE_ID = 'tm-t4-next-chat-sidebar-toggle';
const MANAGED_ATTRIBUTE = 'data-tm-t4-next-chat-sidebar-managed';
const DEFAULT_WIDTH = 336;
const MIN_WIDTH = 220;
const MAX_WIDTH = 560;
const MIN_VIEWPORT_WIDTH = 768;

let activeRuntime = null;

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function normalizeWidth(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return clamp(Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);
}

function removeManagedLayout() {
    document.getElementById(RESIZER_ID)?.remove();
    document.getElementById(TOGGLE_ID)?.remove();
    document.querySelectorAll(`[${MANAGED_ATTRIBUTE}="1"]`).forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        for (const property of ['width', 'min-width', 'flex', 'overflow-x', 'overflow-y', 'transition', 'border-right-width']) {
            element.style.removeProperty(property);
        }
        element.removeAttribute(MANAGED_ATTRIBUTE);
    });
}

function renderSidebarSettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Utilisez le bouton placé à droite du panneau pour le masquer ou l’afficher. Glissez sa bordure pour ajuster sa largeur.';
    container.append(text);
}

export default defineFeature({
    id: 'chat-sidebar',
    label: 'Panneau latéral du chat',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [WIDTH_STORAGE_KEY, COLLAPSED_STORAGE_KEY],
    settings: {
        area: 'shoutbox',
        category: 'shoutbox-appearance',
        order: 20,
        render: renderSidebarSettings
    },
    hints: [{
        id: 'purpose',
        title: 'Fonctionnement',
        text: 'Le panneau des canaux et messages privés peut être redimensionné, masqué puis réaffiché sans perdre sa largeur.',
        kind: 'info',
        order: 10
    }],
    setup(context) {
        let width = normalizeWidth(context.storage.get(WIDTH_STORAGE_KEY));
        let collapsed = context.storage.readBoolean(COLLAPSED_STORAGE_KEY, false);
        let resizeState = null;

        const saveWidth = (nextWidth) => {
            width = normalizeWidth(nextWidth);
            context.storage.set(WIDTH_STORAGE_KEY, String(width));
        };
        const saveCollapsed = (nextCollapsed) => {
            collapsed = Boolean(nextCollapsed);
            context.storage.writeBoolean(COLLAPSED_STORAGE_KEY, collapsed);
        };
        const clearResizeCursor = () => {
            document.body?.style.removeProperty('user-select');
            document.body?.style.removeProperty('cursor');
        };
        const finishResize = () => {
            if (!resizeState) return;
            document.removeEventListener('pointermove', resizeState.onPointerMove, true);
            document.removeEventListener('pointerup', resizeState.onPointerUp, true);
            document.removeEventListener('pointercancel', resizeState.onPointerUp, true);
            clearResizeCursor();
            resizeState = null;
            saveWidth(width);
        };
        const positionControls = (layout) => {
            const resizer = document.getElementById(RESIZER_ID);
            const toggle = document.getElementById(TOGGLE_ID);
            if (!(resizer instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement) || !layout) return;

            const sidebarRect = layout.sidebar.getBoundingClientRect();
            const controlTop = clamp(sidebarRect.top + sidebarRect.height / 2 - 13, 8, Math.max(8, window.innerHeight - 34));
            resizer.style.display = collapsed ? 'none' : 'block';
            resizer.style.left = `${sidebarRect.right}px`;
            resizer.style.top = `${sidebarRect.top}px`;
            resizer.style.height = `${Math.max(0, sidebarRect.height)}px`;
            toggle.style.left = `${collapsed ? Math.max(6, sidebarRect.left + 6) : sidebarRect.right + 8}px`;
            toggle.style.top = `${controlTop}px`;
            toggle.title = collapsed ? 'Afficher les canaux et messages privés' : 'Masquer les canaux et messages privés';
            toggle.setAttribute('aria-label', toggle.title);
            toggle.innerHTML = collapsed
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
        };
        const sync = () => {
            const layout = context.platform.getChatSidebarLayout();
            if (!layout || window.innerWidth < MIN_VIEWPORT_WIDTH) {
                finishResize();
                removeManagedLayout();
                return;
            }

            const currentWidth = collapsed ? 0 : width;
            layout.sidebar.setAttribute(MANAGED_ATTRIBUTE, '1');
            layout.chatArea.setAttribute(MANAGED_ATTRIBUTE, '1');
            layout.sidebar.style.setProperty('width', `${currentWidth}px`, 'important');
            layout.sidebar.style.setProperty('min-width', `${currentWidth}px`, 'important');
            layout.sidebar.style.setProperty('flex', `0 0 ${currentWidth}px`, 'important');
            layout.sidebar.style.setProperty('overflow-x', 'hidden', 'important');
            layout.sidebar.style.setProperty('overflow-y', collapsed ? 'hidden' : 'auto', 'important');
            layout.sidebar.style.setProperty('transition', 'width 160ms ease, min-width 160ms ease, flex-basis 160ms ease', 'important');
            layout.chatArea.style.setProperty('min-width', '0', 'important');
            if (collapsed) layout.sidebar.style.setProperty('border-right-width', '0', 'important');
            else layout.sidebar.style.removeProperty('border-right-width');
            ensureControls(layout);
            positionControls(layout);
        };
        const startResize = (event) => {
            if (event.button !== 0 || collapsed) return;
            const layout = context.platform.getChatSidebarLayout();
            if (!layout) return;
            event.preventDefault();
            finishResize();
            const onPointerMove = (moveEvent) => {
                width = Math.round(clamp(widthAtStart + (moveEvent.clientX - startX), MIN_WIDTH, MAX_WIDTH));
                sync();
            };
            const onPointerUp = () => finishResize();
            const startX = event.clientX;
            const widthAtStart = width;
            resizeState = { onPointerMove, onPointerUp };
            document.body?.style.setProperty('user-select', 'none', 'important');
            document.body?.style.setProperty('cursor', 'col-resize', 'important');
            document.addEventListener('pointermove', onPointerMove, true);
            document.addEventListener('pointerup', onPointerUp, true);
            document.addEventListener('pointercancel', onPointerUp, true);
        };
        const toggleCollapsed = () => {
            finishResize();
            saveCollapsed(!collapsed);
            sync();
        };
        const ensureControls = (layout) => {
            if (!document.body) return;
            let resizer = document.getElementById(RESIZER_ID);
            if (!(resizer instanceof HTMLElement)) {
                resizer = document.createElement('div');
                resizer.id = RESIZER_ID;
                resizer.title = 'Glisser pour redimensionner les canaux et messages privés';
                resizer.setAttribute('role', 'separator');
                resizer.setAttribute('aria-orientation', 'vertical');
                resizer.addEventListener('pointerdown', startResize);
                document.body.append(resizer);
            }
            let toggle = document.getElementById(TOGGLE_ID);
            if (!(toggle instanceof HTMLButtonElement)) {
                toggle = document.createElement('button');
                toggle.id = TOGGLE_ID;
                toggle.type = 'button';
                toggle.addEventListener('click', toggleCollapsed);
                document.body.append(toggle);
            }
            positionControls(layout);
        };

        context.ensureStyle('tm-t4-next-chat-sidebar-style', `
            #${RESIZER_ID} { position:fixed;width:6px;z-index:2100;background:transparent;border-left:1px solid rgba(255,255,255,.10);cursor:col-resize;touch-action:none; }
            #${RESIZER_ID}:hover { background:rgba(255,255,255,.06);border-left-color:rgba(255,255,255,.42); }
            #${TOGGLE_ID} { position:fixed;display:inline-flex;align-items:center;justify-content:center;width:22px;height:26px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:4px;background:rgba(24,24,27,.76);color:#d4d4d8;box-shadow:none;cursor:pointer;z-index:2101;line-height:0;transition:background 120ms ease,color 120ms ease; }
            #${TOGGLE_ID} svg { display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round; }
            #${TOGGLE_ID}:hover { background:rgba(63,63,70,.94);color:#fff; }
        `);

        const runtime = { context, sync };
        activeRuntime = runtime;
        context.on(window, 'resize', sync);
        context.on(window, 'storage', (event) => {
            if (event.key === WIDTH_STORAGE_KEY) width = normalizeWidth(context.storage.get(WIDTH_STORAGE_KEY));
            if (event.key === COLLAPSED_STORAGE_KEY) collapsed = context.storage.readBoolean(COLLAPSED_STORAGE_KEY, false);
            if (event.key === WIDTH_STORAGE_KEY || event.key === COLLAPSED_STORAGE_KEY) sync();
        });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, () => {
            width = normalizeWidth(context.storage.get(WIDTH_STORAGE_KEY));
            collapsed = context.storage.readBoolean(COLLAPSED_STORAGE_KEY, false);
            sync();
        });
        context.every(600, sync);
        context.addCleanup(() => {
            finishResize();
            removeManagedLayout();
            if (activeRuntime === runtime) activeRuntime = null;
        });
        sync();
    },
    onRoute(context) {
        if (activeRuntime?.context === context) activeRuntime.sync();
    }
});
