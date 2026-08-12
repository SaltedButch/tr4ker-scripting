const RAIL_ID = 'tm-t4-next-media-toolbar';
const RAIL_ATTR = 'data-tm-t4-media-toolbar';
const INLINE_ATTR = 'data-tm-t4-media-toolbar-inline';
const SPACE_ATTR = 'data-tm-t4-media-toolbar-space';
const STYLE_ID = 'tm-t4-next-media-toolbar-style';
const INLINE_STORAGE_KEY = 'tm_t4_chat_input_toolbar_inline';
const ALIGN_RIGHT_STORAGE_KEY = 'tm_t4_chat_input_toolbar_align_right';
const LAYOUT_FEATURE_ENABLED_STORAGE_KEY = 'tm-t4-next:feature:chat-toolbar-layout:enabled';
const RESERVED_HEIGHT_PX = 46;
const DOCKED_GAP_PX = 6;

function isElement(value) {
    return value instanceof HTMLElement;
}

function ensureStyle() {
    if (document.getElementById(STYLE_ID) || !document.head) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        [${RAIL_ATTR}="1"] { box-sizing:border-box;min-height:42px;height:42px;padding:7px 8px;gap:4px!important;border:1px solid color-mix(in srgb,var(--outline-variant,#474747) 78%,transparent);border-radius:9px;background:color-mix(in srgb,var(--surface-container-high,#2a2a2a) 92%,transparent);box-shadow:0 5px 14px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035);scrollbar-width:none; }
        [${RAIL_ATTR}="1"]::-webkit-scrollbar { display:none; }
        [${RAIL_ATTR}="1"] > div { min-width:0;height:28px;gap:4px!important; }
        [${RAIL_ATTR}="1"][${INLINE_ATTR}="1"] { min-height:var(--tm-t4-media-toolbar-inline-height,32px);height:var(--tm-t4-media-toolbar-inline-height,32px); }
        [${RAIL_ATTR}="1"] button { box-sizing:border-box;min-width:26px;height:28px!important;padding:0 8px!important;border-radius:6px!important;font-family:Geist Variable,Inter,Arial,sans-serif!important;font-size:10px!important;font-weight:700!important;line-height:1!important;box-shadow:none!important;transition:background 120ms ease,border-color 120ms ease,transform 120ms ease!important; }
        [${RAIL_ATTR}="1"] button:hover { filter:none!important;transform:translateY(-1px)!important; }
        [${SPACE_ATTR}="1"] [class*="imgTriggerWrap"] { z-index:4!important; }
        [${SPACE_ATTR}="1"] [class*="imgPopover"] { z-index:5!important; }
        @media (max-width:700px) { [${RAIL_ATTR}="1"] { max-width:calc(100% - 16px);overflow-x:auto!important;overscroll-behavior-inline:contain; } [${RAIL_ATTR}="1"] > div { flex:0 0 auto; } }
    `;
    document.head.append(style);
}

export function createMediaToolbar({ platform, storage }) {
    const mounts = new Map();
    let lastRailHost = null;

    const isLayoutEnabled = () => storage.get(LAYOUT_FEATURE_ENABLED_STORAGE_KEY) !== 'false';
    const isInline = () => isLayoutEnabled() && storage.readBoolean(INLINE_STORAGE_KEY, false);
    const isAlignedRight = () => isLayoutEnabled() && storage.readBoolean(ALIGN_RIGHT_STORAGE_KEY, false);

    function getContext() {
        const input = platform.getChatInput();
        if (!isElement(input)) return { input: null, controlsRow: null, mountParent: null, inputWrapper: null, directWrapper: null };
        const controlsRow = input.closest('[class*="inputArea"]');
        const inputWrapper = input.closest('.relative.flex-1');
        const directWrapper = input.parentElement;
        return {
            input,
            controlsRow: isElement(controlsRow) ? controlsRow : null,
            mountParent: isElement(inputWrapper) ? inputWrapper : isElement(directWrapper) ? directWrapper : input.closest('form'),
            inputWrapper: isElement(inputWrapper) ? inputWrapper : null,
            directWrapper: isElement(directWrapper) ? directWrapper : null
        };
    }

    function getRailHost(context) {
        if (isInline() && isElement(context.controlsRow)) return context.controlsRow;
        return isElement(context.controlsRow) ? context.controlsRow : context.mountParent;
    }

    function getExistingRail(context) {
        const hosts = [context.controlsRow, context.mountParent].filter(isElement);
        for (const host of hosts) {
            const rail = [...host.children].find((child) => isElement(child) && child.getAttribute(RAIL_ATTR) === '1');
            if (isElement(rail)) return rail;
        }
        const global = document.getElementById(RAIL_ID);
        return isElement(global) ? global : null;
    }

    function setMountVisibility() {
        for (const entry of mounts.values()) entry.mount.style.display = '';
    }

    function configureHost(context) {
        const host = getRailHost(context);
        if (!isElement(host)) return null;
        ensureStyle();
        if (window.getComputedStyle(host).position === 'static') host.style.position = 'relative';
        host.style.overflow = 'visible';
        if (isElement(context.mountParent)) {
            if (isInline()) {
                context.mountParent.style.flex = '1 1 auto';
                context.mountParent.style.minWidth = '0';
            } else if (window.getComputedStyle(context.mountParent).position === 'static') {
                context.mountParent.style.position = 'relative';
            }
            context.mountParent.style.overflow = 'visible';
        }
        const overflowParent = host.parentElement || context.mountParent?.parentElement;
        if (isElement(overflowParent) && ['hidden', 'clip'].includes(window.getComputedStyle(overflowParent).overflowY)) overflowParent.style.overflow = 'visible';
        return host;
    }

    function positionRail(context, rail) {
        const host = configureHost(context);
        if (!isElement(host) || !isElement(rail)) return null;
        rail.style.display = 'flex';
        rail.style.alignItems = 'center';
        rail.style.pointerEvents = 'none';
        rail.style.zIndex = '1';
        rail.style.overflow = 'visible';
        const inlineHost = context.inputWrapper || context.directWrapper || context.mountParent;
        if (isInline() && isElement(context.controlsRow) && isElement(inlineHost) && inlineHost.parentElement === context.controlsRow) {
            const height = Math.max(32, Math.round(inlineHost.getBoundingClientRect().height));
            rail.setAttribute(INLINE_ATTR, '1');
            rail.style.cssText = `display:flex;align-items:center;gap:8px;pointer-events:none;z-index:1;overflow:visible;position:relative;top:auto;bottom:0;left:auto;right:auto;justify-content:flex-start;flex-wrap:nowrap;flex-shrink:0;min-width:0;align-self:flex-end;--tm-t4-media-toolbar-inline-height:${height}px;transform:translateY(0);`;
            inlineHost.style.flex = '1 1 0%'; inlineHost.style.minWidth = '0'; inlineHost.style.width = '0'; inlineHost.style.maxWidth = 'none';
            if (rail.parentElement !== context.controlsRow) context.controlsRow.append(rail);
            if (isAlignedRight()) {
                if (inlineHost.nextElementSibling !== rail) context.controlsRow.insertBefore(rail, inlineHost.nextElementSibling);
            } else if (rail.nextElementSibling !== inlineHost) context.controlsRow.insertBefore(rail, inlineHost);
            lastRailHost = context.controlsRow;
            return rail;
        }
        rail.removeAttribute(INLINE_ATTR);
        if (isElement(inlineHost)) { inlineHost.style.removeProperty('width'); inlineHost.style.removeProperty('max-width'); }
        const dockedHeight = Math.max(32, RESERVED_HEIGHT_PX - DOCKED_GAP_PX);
        rail.style.cssText = `display:flex;align-items:center;gap:8px;pointer-events:none;z-index:1;overflow:visible;position:absolute;height:${dockedHeight}px;min-height:${dockedHeight}px;top:${Math.max(0, RESERVED_HEIGHT_PX - dockedHeight - DOCKED_GAP_PX)}px;bottom:auto;left:16px;right:16px;justify-content:${isAlignedRight() ? 'flex-end' : 'flex-start'};flex-wrap:nowrap;flex-shrink:0;min-width:0;align-self:auto;transform:translateY(0);`;
        if (rail.parentElement !== host) host.append(rail);
        lastRailHost = host;
        return rail;
    }

    function syncReservedSpace(context, rail) {
        document.querySelectorAll(`[${SPACE_ATTR}="1"]`).forEach((host) => {
            if (!isElement(host)) return;
            if (!isInline() && host === lastRailHost && mounts.size) { host.style.paddingTop = `${RESERVED_HEIGHT_PX}px`; return; }
            host.style.removeProperty('padding-top'); host.removeAttribute(SPACE_ATTR);
        });
        const host = getRailHost(context);
        if (!isElement(host) || !isElement(rail)) return;
        if (!isInline() && mounts.size) { host.style.paddingTop = `${RESERVED_HEIGHT_PX}px`; host.setAttribute(SPACE_ATTR, '1'); }
        else { host.style.removeProperty('padding-top'); host.removeAttribute(SPACE_ATTR); }
    }

    function refresh() {
        const context = getContext();
        if (!context.input || mounts.size === 0) return null;
        const host = configureHost(context);
        if (!host) return null;
        let rail = getExistingRail(context);
        if (!isElement(rail)) { rail = document.createElement('div'); rail.id = RAIL_ID; rail.setAttribute(RAIL_ATTR, '1'); }
        for (const [id, entry] of mounts) {
            if (!isElement(entry.mount)) { entry.mount = document.createElement('div'); entry.mount.dataset.tmT4MediaOwner = id; entry.mount.style.cssText = 'position:relative;display:flex;align-items:center;pointer-events:auto;'; }
            if (entry.content.parentElement !== entry.mount) entry.mount.replaceChildren(entry.content);
            if (entry.mount.parentElement !== rail) rail.append(entry.mount);
        }
        setMountVisibility();
        positionRail(context, rail);
        syncReservedSpace(context, rail);
        return rail;
    }

    function mount(id, content) {
        const ownerId = String(id || '').trim();
        if (!ownerId || !isElement(content)) return null;
        const entry = mounts.get(ownerId) || { mount: null, content };
        entry.content = content;
        mounts.set(ownerId, entry);
        return refresh();
    }

    function unmount(id) {
        const entry = mounts.get(id); entry?.mount?.remove(); mounts.delete(id);
        if (mounts.size) { refresh(); return; }
        document.getElementById(RAIL_ID)?.remove();
        if (isElement(lastRailHost)) { lastRailHost.style.removeProperty('padding-top'); lastRailHost.removeAttribute(SPACE_ATTR); }
        lastRailHost = null;
    }

    function destroy() { for (const id of [...mounts.keys()]) unmount(id); }

    return Object.freeze({ mount, unmount, refresh, destroy });
}
