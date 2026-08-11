function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function createMediaButton({ label, title, colors = {} }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.style.cssText = `border:1px solid ${colors.border || 'rgba(255,255,255,.18)'};background:${colors.background || '#27272a'};color:${colors.text || '#f4f4f5'};font-size:12px;font-weight:700;padding:6px 11px;border-radius:999px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.28);`;
    return button;
}

export function createMediaMenu({ width = 420, maxHeight = '70vh' } = {}) {
    const menu = document.createElement('section');
    menu.setAttribute('role', 'dialog');
    menu.style.cssText = `position:fixed!important;right:auto!important;bottom:auto!important;display:none;width:min(${width}px,calc(100vw - 28px));max-height:min(${maxHeight},620px);padding:10px;overflow:auto;z-index:1000010;background:rgba(17,24,39,.96);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.10);border-radius:16px;box-shadow:0 18px 45px rgba(0,0,0,.5);color:#f8fafc;font:13px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;`;
    document.body.append(menu);
    return menu;
}

export function positionMediaMenu(menu, anchor) {
    if (!(menu instanceof HTMLElement) || !(anchor instanceof HTMLElement)) return;
    menu.style.setProperty('position', 'fixed', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('left', '-9999px', 'important');
    menu.style.setProperty('top', '-9999px', 'important');
    menu.style.setProperty('z-index', '1000010', 'important');
    menu.style.visibility = 'hidden';
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    const left = clamp(anchorRect.left, margin, Math.max(margin, window.innerWidth - menuRect.width - margin));
    const preferredTop = anchorRect.top - menuRect.height - margin;
    const top = preferredTop >= margin
        ? preferredTop
        : clamp(anchorRect.bottom + margin, margin, Math.max(margin, window.innerHeight - menuRect.height - margin));
    menu.style.setProperty('left', `${Math.round(left)}px`, 'important');
    menu.style.setProperty('top', `${Math.round(top)}px`, 'important');
    menu.style.visibility = 'visible';
}

export function showMediaMenu(menu, anchor) {
    if (!(menu instanceof HTMLElement) || !(anchor instanceof HTMLElement)) return;
    menu.style.display = 'block';
    positionMediaMenu(menu, anchor);
    menu.dataset.tmOpen = '1';
}

export function hideMediaMenu(menu) {
    if (!(menu instanceof HTMLElement)) return;
    menu.dataset.tmOpen = '0';
    menu.style.display = 'none';
}

export function insertImageMarkup(input, imageUrl, inputService, successMessage = 'Image insérée.') {
    const rawUrl = String(imageUrl || '').trim();
    try {
        const url = new URL(rawUrl);
        if (!/^https?:$/.test(url.protocol)) throw new Error('invalid');
        return inputService.insert(input, `[img]${url.href}[/img]`, { successMessage });
    } catch {
        return { ok: false, message: 'Lien image invalide.' };
    }
}
