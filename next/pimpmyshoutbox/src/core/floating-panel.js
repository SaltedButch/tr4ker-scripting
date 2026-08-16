/**
 * Fournit le comportement commun des panneaux flottants déplaçables.
 *
 * @module src/core/floating-panel
 */
const STYLE_ID = 'tm-t4-next-floating-panel-style';
const VIEWPORT_MARGIN_PX = 10;

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .tm-t4-next-floating-panel { position:fixed; z-index:99980; display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,.11); border-radius:13px; background:rgba(24,24,27,.94); color:#f4f4f5; box-shadow:0 12px 32px rgba(0,0,0,.4); backdrop-filter:blur(8px); font:13px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .tm-t4-next-floating-panel-header { display:flex; align-items:center; min-height:36px; padding:7px 10px; border-bottom:1px solid rgba(255,255,255,.08); cursor:move; user-select:none; touch-action:none; font-weight:700; }
        .tm-t4-next-floating-panel-body { min-height:0; flex:1; overflow:auto; padding:10px; }
        .tm-t4-next-floating-panel-resize { position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:nwse-resize; touch-action:none; }
        .tm-t4-next-floating-panel-resize::after { content:''; position:absolute; right:5px; bottom:5px; width:7px; height:7px; border-right:2px solid rgba(255,255,255,.45); border-bottom:2px solid rgba(255,255,255,.45); }
    `;
    document.head.append(style);
}

function normalizePosition(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const left = Number(value.leftPx);
    const top = Number(value.topPx);
    if (Number.isFinite(left) && Number.isFinite(top)) return { left, top };

    const rightPercent = Number(value.rightPercent);
    const bottomPercent = Number(value.bottomPercent);
    if (Number.isFinite(rightPercent) && Number.isFinite(bottomPercent)) {
        return {
            rightPercent: clamp(rightPercent, 0, 100),
            bottomPercent: clamp(bottomPercent, 0, 95)
        };
    }

    return null;
}

function normalizeSize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const width = Number(value.widthPx);
    const height = Number(value.heightPx);
    return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
}

/**
 * Crée l'API publique « createFloatingPanel ».
 *
 * @function createFloatingPanel
 */
export function createFloatingPanel({
    id,
    title,
    storage,
    positionStorageKey,
    sizeStorageKey,
    defaultBounds = { right: 22, bottom: 22, width: 250, height: 150 },
    minWidth = 220,
    minHeight = 100
}) {
    let interaction = null;

    function getPanel() {
        const panel = document.getElementById(id);
        return panel instanceof HTMLElement ? panel : null;
    }

    function constrain(bounds) {
        const maxWidth = Math.max(1, window.innerWidth - VIEWPORT_MARGIN_PX * 2);
        const maxHeight = Math.max(1, window.innerHeight - VIEWPORT_MARGIN_PX * 2);
        const width = clamp(Math.round(bounds.width), Math.min(minWidth, maxWidth), maxWidth);
        const height = clamp(Math.round(bounds.height), Math.min(minHeight, maxHeight), maxHeight);
        return {
            left: clamp(Math.round(bounds.left), VIEWPORT_MARGIN_PX, window.innerWidth - width - VIEWPORT_MARGIN_PX),
            top: clamp(Math.round(bounds.top), VIEWPORT_MARGIN_PX, window.innerHeight - height - VIEWPORT_MARGIN_PX),
            width,
            height
        };
    }

    function getBounds(panel) {
        const rect = panel.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    function applyBounds(panel, rawBounds, { persist = false } = {}) {
        const bounds = constrain(rawBounds);
        panel.style.left = `${bounds.left}px`;
        panel.style.top = `${bounds.top}px`;
        panel.style.width = `${bounds.width}px`;
        panel.style.height = `${bounds.height}px`;
        if (persist) {
            storage.writeJson(positionStorageKey, { leftPx: bounds.left, topPx: bounds.top });
            storage.writeJson(sizeStorageKey, { widthPx: bounds.width, heightPx: bounds.height });
        }
        return bounds;
    }

    function finishInteraction() {
        if (!interaction) return;
        const panel = getPanel();
        if (panel) applyBounds(panel, getBounds(panel), { persist: true });
        interaction = null;
        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('pointerup', finishInteraction, true);
        document.removeEventListener('pointercancel', finishInteraction, true);
    }

    function onPointerMove(event) {
        const panel = getPanel();
        if (!interaction || !panel) return;
        const deltaX = event.clientX - interaction.startX;
        const deltaY = event.clientY - interaction.startY;
        applyBounds(panel, interaction.kind === 'move'
            ? { ...interaction.bounds, left: interaction.bounds.left + deltaX, top: interaction.bounds.top + deltaY }
            : { ...interaction.bounds, width: interaction.bounds.width + deltaX, height: interaction.bounds.height + deltaY });
    }

    function startInteraction(event, kind) {
        if (event.button !== 0) return;
        const panel = getPanel();
        if (!panel) return;
        event.preventDefault();
        finishInteraction();
        interaction = { kind, startX: event.clientX, startY: event.clientY, bounds: getBounds(panel) };
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerup', finishInteraction, true);
        document.addEventListener('pointercancel', finishInteraction, true);
    }

    function onViewportResize() {
        const panel = getPanel();
        if (panel) applyBounds(panel, getBounds(panel), { persist: true });
    }

    function mount() {
        const existing = getPanel();
        if (existing) return existing;
        ensureStyle();
        const panel = document.createElement('section');
        panel.id = id;
        panel.className = 'tm-t4-next-floating-panel';
        panel.setAttribute('aria-label', title);
        const header = document.createElement('header');
        header.className = 'tm-t4-next-floating-panel-header';
        header.textContent = title;
        header.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Element && event.target.closest('button, input, a, select, textarea')) return;
            startInteraction(event, 'move');
        });
        const body = document.createElement('div');
        body.className = 'tm-t4-next-floating-panel-body';
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'tm-t4-next-floating-panel-resize';
        resizeHandle.addEventListener('pointerdown', (event) => startInteraction(event, 'resize'));
        panel.append(header, body, resizeHandle);
        document.body.append(panel);

        const savedPosition = normalizePosition(storage.readJson(positionStorageKey));
        const savedSize = normalizeSize(storage.readJson(sizeStorageKey));
        const initialWidth = savedSize?.width ?? defaultBounds.width;
        const initialHeight = savedSize?.height ?? defaultBounds.height;
        const legacyLeft = savedPosition?.rightPercent === undefined
            ? null
            : window.innerWidth - initialWidth - (window.innerWidth * savedPosition.rightPercent / 100);
        const legacyTop = savedPosition?.bottomPercent === undefined
            ? null
            : window.innerHeight - initialHeight - (window.innerHeight * savedPosition.bottomPercent / 100);
        applyBounds(panel, {
            left: savedPosition?.left ?? legacyLeft ?? window.innerWidth - initialWidth - defaultBounds.right,
            top: savedPosition?.top ?? legacyTop ?? window.innerHeight - initialHeight - defaultBounds.bottom,
            width: initialWidth,
            height: initialHeight
        });
        window.addEventListener('resize', onViewportResize);
        return panel;
    }

    return Object.freeze({
        mount,
        render(renderContent, { renderHeader = null } = {}) {
            const panel = mount();
            const header = panel.querySelector('.tm-t4-next-floating-panel-header');
            const body = panel.querySelector('.tm-t4-next-floating-panel-body');
            if (!(body instanceof HTMLElement)) return;
            if (header instanceof HTMLElement) {
                header.replaceChildren();
                if (typeof renderHeader === 'function') renderHeader(header);
                else header.textContent = title;
            }
            body.replaceChildren();
            renderContent(body);
        },
        getElement: getPanel,
        getBounds() {
            const panel = getPanel();
            return panel ? getBounds(panel) : null;
        },
        setBounds(bounds, options) {
            const panel = mount();
            return applyBounds(panel, bounds, options);
        },
        destroy() {
            finishInteraction();
            window.removeEventListener('resize', onViewportResize);
            getPanel()?.remove();
        }
    });
}
