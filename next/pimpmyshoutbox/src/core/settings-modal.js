import { SETTINGS_CATEGORIES } from './settings-categories.js';
import { createSettingsHelpTab } from './settings-help.js';
import { formatShortcut, matchesShortcut } from './shortcuts.js';

const MODAL_ID = 'tm-t4-next-settings-modal';
const OVERLAY_ID = 'tm-t4-next-settings-overlay';
const STYLE_ID = 'tm-t4-next-settings-style';
const ACTIVE_CATEGORY_STORAGE_KEY = 'tm-t4-next:settings:active-category';
const BOUNDS_STORAGE_KEY = 'tm-t4-next:settings:bounds';
const OPEN_SHORTCUT = Object.freeze({ key: 'C', modifiers: ['ctrl', 'platform'] });
const MIN_WIDTH_PX = 380;
const MIN_HEIGHT_PX = 260;
const VIEWPORT_MARGIN_PX = 8;

function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (style instanceof HTMLStyleElement) return;

    style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${OVERLAY_ID} { position:fixed; inset:0; z-index:99990; background:rgba(0,0,0,.62); backdrop-filter:blur(3px); }
        #${MODAL_ID} { position:fixed; inset:clamp(14px,5vh,60px) clamp(12px,7vw,120px); z-index:99991; display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,.13); border-radius:16px; background:#18181b; color:#f4f4f5; box-shadow:0 26px 90px rgba(0,0,0,.55); font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        #${MODAL_ID} * { box-sizing:border-box; }
        #${MODAL_ID} .tm-t4-next-settings-header { display:flex; align-items:center; gap:14px; min-height:58px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,.09); cursor:move; user-select:none; touch-action:none; }
        #${MODAL_ID} .tm-t4-next-settings-title { flex:1; font-size:16px; font-weight:750; }
        #${MODAL_ID} .tm-t4-next-settings-shortcut { color:#a1a1aa; font-size:12px; }
        #${MODAL_ID} button { font:inherit; }
        #${MODAL_ID} .tm-t4-next-settings-close { width:31px; height:31px; border:0; border-radius:8px; background:transparent; color:#d4d4d8; cursor:pointer; font-size:21px; line-height:1; }
        #${MODAL_ID} .tm-t4-next-settings-close:hover { background:#3f3f46; color:#fff; }
        #${MODAL_ID} .tm-t4-next-settings-layout { min-height:0; flex:1; display:flex; }
        #${MODAL_ID} .tm-t4-next-settings-tabs { width:210px; flex:0 0 210px; overflow:auto; padding:12px 8px; border-right:1px solid rgba(255,255,255,.09); background:#141416; }
        #${MODAL_ID} .tm-t4-next-settings-tab { display:block; width:100%; margin:2px 0; padding:9px 10px; border:0; border-radius:8px; background:transparent; color:#c4c4cc; text-align:left; cursor:pointer; }
        #${MODAL_ID} .tm-t4-next-settings-tab:hover, #${MODAL_ID} .tm-t4-next-settings-tab[data-active="true"] { background:#3f3f46; color:#fff; }
        #${MODAL_ID} .tm-t4-next-settings-content { flex:1; overflow:auto; padding:22px; }
        #${MODAL_ID} .tm-t4-next-settings-content h2 { margin:0 0 18px; font-size:17px; }
        #${MODAL_ID} .tm-t4-next-settings-empty { display:grid; min-height:180px; place-items:center; color:#a1a1aa; text-align:center; }
        #${MODAL_ID} .tm-t4-next-settings-card { margin:0 0 12px; padding:14px; border:1px solid rgba(255,255,255,.10); border-radius:11px; background:#222225; }
        #${MODAL_ID} .tm-t4-next-settings-card-title { display:flex; align-items:center; gap:10px; margin:0 0 12px; font-size:15px; font-weight:750; }
        #${MODAL_ID} .tm-t4-next-settings-card-toggle { display:flex; align-items:center; gap:8px; margin:0 0 13px; color:#e4e4e7; cursor:pointer; }
        #${MODAL_ID} .tm-t4-next-settings-hint-trigger { width:23px; height:23px; margin-left:auto; border:1px solid rgba(255,255,255,.16); border-radius:999px; background:#3f3f46; color:#d4d4d8; cursor:help; font-size:13px; font-weight:700; line-height:1; }
        #${MODAL_ID} .tm-t4-next-settings-hint-trigger:hover, #${MODAL_ID} .tm-t4-next-settings-hint-trigger:focus { color:#fff; border-color:rgba(147,197,253,.8); }
        #${MODAL_ID} .tm-t4-next-settings-card-toggle input { accent-color:#22c55e; }
        #${MODAL_ID} .tm-t4-next-settings-feature-content { padding-top:1px; }
        #${MODAL_ID} .tm-t4-next-settings-hint { margin:10px 0 0; padding:9px 10px; border-left:3px solid #60a5fa; border-radius:5px; background:rgba(96,165,250,.09); color:#d4d4d8; }
        #${MODAL_ID} .tm-t4-next-settings-hint[data-kind="tip"] { border-left-color:#4ade80; background:rgba(74,222,128,.09); }
        #${MODAL_ID} .tm-t4-next-settings-hint[data-kind="warning"] { border-left-color:#fbbf24; background:rgba(251,191,36,.09); }
        #${MODAL_ID} .tm-t4-next-settings-hint-title { display:block; margin-bottom:2px; color:#fff; font-weight:650; }
        #${MODAL_ID}[data-tabs-layout="top"] .tm-t4-next-settings-layout { flex-direction:column; }
        #${MODAL_ID}[data-tabs-layout="top"] .tm-t4-next-settings-tabs { display:flex; width:100%; max-height:58px; flex:0 0 auto; padding:8px; border-right:0; border-bottom:1px solid rgba(255,255,255,.09); }
        #${MODAL_ID}[data-tabs-layout="top"] .tm-t4-next-settings-tab { display:inline-block; width:auto; flex:0 0 auto; margin:0 2px; white-space:nowrap; }
        #${MODAL_ID} .tm-t4-next-settings-resize-handle { position:absolute; right:0; bottom:0; width:22px; height:22px; cursor:nwse-resize; touch-action:none; }
        #${MODAL_ID} .tm-t4-next-settings-resize-handle::after { content:''; position:absolute; right:6px; bottom:6px; width:8px; height:8px; border-right:2px solid rgba(255,255,255,.45); border-bottom:2px solid rgba(255,255,255,.45); }
        @media (max-width:680px) { #${MODAL_ID} .tm-t4-next-settings-content { padding:16px; } }
    `;
    document.head.append(style);
}

export function createSettingsModal({ registry, storage, globalSettings, logger = console }) {
    let isOpen = false;
    let lastFocusedElement = null;
    let shortcutInstalled = false;
    let resizeObserver = null;
    let activeInteraction = null;
    const helpTab = createSettingsHelpTab({ registry });

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function normalizeBounds(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const left = Number(value.left);
        const top = Number(value.top);
        const width = Number(value.width);
        const height = Number(value.height);
        if (![left, top, width, height].every(Number.isFinite)) return null;
        return { left, top, width, height };
    }

    function constrainBounds(bounds) {
        const viewportWidth = Math.max(1, window.innerWidth);
        const viewportHeight = Math.max(1, window.innerHeight);
        const maxWidth = Math.max(1, viewportWidth - VIEWPORT_MARGIN_PX * 2);
        const maxHeight = Math.max(1, viewportHeight - VIEWPORT_MARGIN_PX * 2);
        const minWidth = Math.min(MIN_WIDTH_PX, maxWidth);
        const minHeight = Math.min(MIN_HEIGHT_PX, maxHeight);
        const width = clamp(Math.round(bounds.width), minWidth, maxWidth);
        const height = clamp(Math.round(bounds.height), minHeight, maxHeight);
        return {
            left: clamp(Math.round(bounds.left), VIEWPORT_MARGIN_PX, viewportWidth - width - VIEWPORT_MARGIN_PX),
            top: clamp(Math.round(bounds.top), VIEWPORT_MARGIN_PX, viewportHeight - height - VIEWPORT_MARGIN_PX),
            width,
            height
        };
    }

    function getModalBounds(modal) {
        const rect = modal.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    function syncTabsLayout(modal) {
        const { width, height } = modal.getBoundingClientRect();
        modal.dataset.tabsLayout = width > height ? 'top' : 'side';
    }

    function applyBounds(modal, rawBounds, { persist = false } = {}) {
        const bounds = constrainBounds(rawBounds);
        modal.style.inset = 'auto';
        modal.style.left = `${bounds.left}px`;
        modal.style.top = `${bounds.top}px`;
        modal.style.width = `${bounds.width}px`;
        modal.style.height = `${bounds.height}px`;
        modal.dataset.customBounds = 'true';
        syncTabsLayout(modal);
        if (persist) storage.writeJson(BOUNDS_STORAGE_KEY, bounds);
        return bounds;
    }

    function finishInteraction() {
        if (!activeInteraction) return;
        const modal = document.getElementById(MODAL_ID);
        if (modal instanceof HTMLElement) {
            applyBounds(modal, getModalBounds(modal), { persist: true });
        }
        activeInteraction = null;
        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('pointerup', finishInteraction, true);
        document.removeEventListener('pointercancel', finishInteraction, true);
    }

    function onPointerMove(event) {
        if (!activeInteraction) return;
        const modal = document.getElementById(MODAL_ID);
        if (!(modal instanceof HTMLElement)) return;

        const deltaX = event.clientX - activeInteraction.startX;
        const deltaY = event.clientY - activeInteraction.startY;
        const nextBounds = activeInteraction.kind === 'move'
            ? {
                ...activeInteraction.bounds,
                left: activeInteraction.bounds.left + deltaX,
                top: activeInteraction.bounds.top + deltaY
            }
            : {
                ...activeInteraction.bounds,
                width: activeInteraction.bounds.width + deltaX,
                height: activeInteraction.bounds.height + deltaY
            };
        applyBounds(modal, nextBounds);
    }

    function startInteraction(event, kind) {
        if (event.button !== 0) return;
        const modal = document.getElementById(MODAL_ID);
        if (!(modal instanceof HTMLElement)) return;
        event.preventDefault();
        finishInteraction();
        activeInteraction = {
            kind,
            startX: event.clientX,
            startY: event.clientY,
            bounds: getModalBounds(modal)
        };
        applyBounds(modal, activeInteraction.bounds);
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerup', finishInteraction, true);
        document.addEventListener('pointercancel', finishInteraction, true);
    }

    function onViewportResize() {
        const modal = document.getElementById(MODAL_ID);
        if (!(modal instanceof HTMLElement)) return;
        if (modal.dataset.customBounds === 'true') {
            applyBounds(modal, getModalBounds(modal), { persist: true });
            return;
        }
        syncTabsLayout(modal);
    }

    function getVisibleCategories() {
        return SETTINGS_CATEGORIES.filter((category) => (
            category.id !== 'general'
            &&
            registry.getFeaturesForSettingsCategory(category.id).length > 0
        ));
    }

    function getActiveTab(tabs) {
        const storedId = storage.get(ACTIVE_CATEGORY_STORAGE_KEY);
        return tabs.find((tab) => tab.id === storedId) || tabs[0] || null;
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        finishInteraction();
        resizeObserver?.disconnect();
        resizeObserver = null;
        window.removeEventListener('resize', onViewportResize);
        document.getElementById(MODAL_ID)?.remove();
        document.getElementById(OVERLAY_ID)?.remove();
        if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus();
        }
        lastFocusedElement = null;
    }

    function renderFeatureCards(content, features, refresh) {
        for (const feature of features) {
            const card = document.createElement('section');
            card.className = 'tm-t4-next-settings-card';

            const titleRow = document.createElement('div');
            titleRow.className = 'tm-t4-next-settings-card-title';
            const featureTitle = document.createElement('h3');
            featureTitle.textContent = feature.label || feature.id;
            featureTitle.style.cssText = 'margin:0;flex:1;font:inherit;';
            titleRow.append(featureTitle);

            const hints = registry.getFeatureHints(feature.id);
            if (hints.length > 0) {
                const hintTrigger = document.createElement('button');
                hintTrigger.type = 'button';
                hintTrigger.className = 'tm-t4-next-settings-hint-trigger';
                hintTrigger.textContent = 'i';
                hintTrigger.setAttribute('aria-label', `Aide pour ${feature.label || feature.id}`);
                hintTrigger.title = hints.map((hint) => (
                    [hint.title, hint.text].filter(Boolean).join(' — ')
                )).join('\n\n');
                titleRow.append(hintTrigger);
            }
            card.append(titleRow);

            const toggleRow = document.createElement('label');
            toggleRow.className = 'tm-t4-next-settings-card-toggle';
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = storage.get(`tm-t4-next:feature:${feature.id}:enabled`) === null
                ? feature.defaultEnabled !== false
                : storage.get(`tm-t4-next:feature:${feature.id}:enabled`) === 'true';
            toggle.addEventListener('change', () => {
                registry.setEnabled(feature.id, toggle.checked);
                refresh();
            });
            toggleRow.append(toggle, document.createTextNode('Activer la feature'));
            card.append(toggleRow);

            if (toggle.checked && typeof feature.settings.render === 'function') {
                const customSettings = document.createElement('div');
                customSettings.className = 'tm-t4-next-settings-feature-content';
                try {
                    feature.settings.render(customSettings, {
                        context: registry.getActiveContext(feature.id),
                        refresh
                    });
                    card.append(customSettings);
                } catch (error) {
                    logger.error(`[PimpMyShoutbox Next] Settings render failed for '${feature.id}'.`, error);
                }
            }

            content.append(card);
        }
    }

    function renderCategory(content, category) {
        content.replaceChildren();
        if (!category) {
            const empty = document.createElement('div');
            empty.className = 'tm-t4-next-settings-empty';
            empty.textContent = 'Aucune feature n’est encore migrée vers PimpMyShoutbox Next.';
            content.append(empty);
            return;
        }
        renderFeatureCards(
            content,
            registry.getFeaturesForSettingsCategory(category.id),
            () => renderCategory(content, category)
        );
    }

    function renderGeneral(content) {
        globalSettings.render(content);
        const generalFeatures = registry.getFeaturesForSettingsCategory('general');
        if (generalFeatures.length === 0) return;

        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = 'Fonctionnalités générales';
        sectionTitle.style.marginTop = '26px';
        content.append(sectionTitle);
        renderFeatureCards(content, generalFeatures, () => renderGeneral(content));
    }

    function open() {
        if (isOpen) return;
        if (!document.body) return;
        isOpen = true;
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        ensureStyle();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) close();
        });

        const modal = document.createElement('section');
        modal.id = MODAL_ID;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Configuration PimpMyShoutbox Next');

        const header = document.createElement('header');
        header.className = 'tm-t4-next-settings-header';
        header.title = 'Glisser pour déplacer la configuration';
        header.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Element && event.target.closest('button, input, a, select, textarea')) return;
            startInteraction(event, 'move');
        });
        const title = document.createElement('div');
        title.className = 'tm-t4-next-settings-title';
        title.textContent = 'PimpMyShoutbox Next';
        const shortcut = document.createElement('div');
        shortcut.className = 'tm-t4-next-settings-shortcut';
        shortcut.textContent = formatShortcut(OPEN_SHORTCUT);
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'tm-t4-next-settings-close';
        closeButton.textContent = '×';
        closeButton.title = 'Fermer la configuration';
        closeButton.addEventListener('click', close);
        header.append(title, shortcut, closeButton);

        const layout = document.createElement('div');
        layout.className = 'tm-t4-next-settings-layout';
        const tabs = document.createElement('nav');
        tabs.className = 'tm-t4-next-settings-tabs';
        tabs.setAttribute('aria-label', 'Catégories de réglages');
        const content = document.createElement('main');
        content.className = 'tm-t4-next-settings-content';
        layout.append(tabs, content);
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'tm-t4-next-settings-resize-handle';
        resizeHandle.title = 'Redimensionner la configuration';
        resizeHandle.addEventListener('pointerdown', (event) => startInteraction(event, 'resize'));
        modal.append(header, layout, resizeHandle);

        const categories = getVisibleCategories();
        const tabsDefinition = [
            globalSettings.tab,
            ...categories.map((category) => ({ ...category, type: 'category' })),
            helpTab
        ];
        const activeTab = getActiveTab(tabsDefinition);
        for (const tabDefinition of tabsDefinition) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tm-t4-next-settings-tab';
            button.textContent = tabDefinition.label;
            button.dataset.active = String(tabDefinition.id === activeTab?.id);
            button.addEventListener('click', () => {
                storage.set(ACTIVE_CATEGORY_STORAGE_KEY, tabDefinition.id);
                for (const tab of tabs.querySelectorAll('button')) {
                    tab.dataset.active = String(tab === button);
                }
                if (tabDefinition.type === 'help') helpTab.render(content);
                else if (tabDefinition.type === 'general') renderGeneral(content);
                else renderCategory(content, tabDefinition);
            });
            tabs.append(button);
        }
        if (activeTab?.type === 'help') helpTab.render(content);
        else if (activeTab?.type === 'general') renderGeneral(content);
        else renderCategory(content, activeTab);

        document.body.append(overlay, modal);
        const savedBounds = normalizeBounds(storage.readJson(BOUNDS_STORAGE_KEY));
        if (savedBounds) applyBounds(modal, savedBounds);
        else syncTabsLayout(modal);
        resizeObserver = new ResizeObserver(() => syncTabsLayout(modal));
        resizeObserver.observe(modal);
        window.addEventListener('resize', onViewportResize);
        window.requestAnimationFrame(() => closeButton.focus());
    }

    function toggle() {
        if (isOpen) close();
        else open();
    }

    function onKeydown(event) {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            close();
            return;
        }
        if (!matchesShortcut(event, OPEN_SHORTCUT)) return;
        event.preventDefault();
        toggle();
    }

    return Object.freeze({
        open,
        close,
        toggle,
        isOpen: () => isOpen,
        shortcutLabel: () => formatShortcut(OPEN_SHORTCUT),
        start() {
            if (shortcutInstalled) return;
            shortcutInstalled = true;
            document.addEventListener('keydown', onKeydown, true);
        },
        stop() {
            document.removeEventListener('keydown', onKeydown, true);
            shortcutInstalled = false;
            close();
        }
    });
}
