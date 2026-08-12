const PLAYER_ID = 'tm-t4-next-youtube-player';
const DEFAULT_TITLE = 'Player YouTube';
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 260;
const COLLAPSED_WIDTH = 260;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function parseTime(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 0;
    if (/^\d+$/.test(raw)) return Number(raw) || 0;
    let total = 0;
    for (const match of raw.matchAll(/(\d+)(h|m|s)/g)) {
        const amount = Number(match[1]) || 0;
        if (match[2] === 'h') total += amount * 3600;
        if (match[2] === 'm') total += amount * 60;
        if (match[2] === 's') total += amount;
    }
    return total;
}

export function getYouTubeDescriptor(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw) return null;
    const fragment = /^(?:watch\?v=|shorts\/|embed\/|live\/)/i.test(raw);
    let url;
    try { url = new URL(fragment ? `https://www.youtube.com/${raw}` : raw, location.origin); } catch { return null; }
    if (!/^https?:$/i.test(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const parts = url.pathname.split('/').filter(Boolean);
    let videoId = '';
    let playlistId = '';
    if (host === 'youtu.be') videoId = parts[0] || '';
    else if (['youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
        if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
        else if (url.pathname === '/playlist') playlistId = url.searchParams.get('list') || '';
        else if (['shorts', 'embed', 'live'].includes(parts[0])) videoId = parts[1] || '';
    }
    if (playlistId) {
        const embed = new URL('https://www.youtube-nocookie.com/embed/videoseries');
        embed.searchParams.set('list', playlistId);
        for (const [key, value] of Object.entries({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', enablejsapi: '1', origin: location.origin })) embed.searchParams.set(key, value);
        return { id: `playlist:${playlistId}`, embedUrl: embed.href, watchUrl: url.href };
    }
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    for (const [key, value] of Object.entries({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', enablejsapi: '1', origin: location.origin })) embed.searchParams.set(key, value);
    const start = Math.max(parseTime(url.searchParams.get('t')), parseTime(url.searchParams.get('start')), parseTime(url.searchParams.get('time_continue')));
    if (start > 0) embed.searchParams.set('start', String(start));
    const watch = new URL('https://www.youtube.com/watch'); watch.searchParams.set('v', videoId);
    return { id: videoId, embedUrl: embed.href, watchUrl: watch.href };
}

export function getTextYouTubeDescriptors(text) {
    const descriptors = [];
    const seen = new Set();
    const regex = /(?:^|[\s([{"'/])((?:watch\?v=|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})(?:&[a-zA-Z0-9_.~-]+=[a-zA-Z0-9_.~%+-]*)*)(?=$|[\s)\]}>,.!?;:'"])/gi;
    for (const match of String(text || '').matchAll(regex)) {
        const descriptor = getYouTubeDescriptor(match[1]);
        if (descriptor && !seen.has(descriptor.id)) { seen.add(descriptor.id); descriptors.push(descriptor); }
    }
    return descriptors;
}

export function createYouTubePlayer({ http }) {
    const titles = new Map();
    let resizeObserver = null;
    let resizeHandler = null;
    let escapeHandler = null;
    let requestSerial = 0;

    function player() { return document.getElementById(PLAYER_ID); }
    function appendFrame(container, descriptor, style) {
        const attributes = {
            src: descriptor.embedUrl,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: '',
            referrerpolicy: 'strict-origin-when-cross-origin',
            style
        };
        let frame = typeof GM_addElement === 'function' ? GM_addElement(container, 'iframe', attributes) : null;
        if (frame instanceof HTMLIFrameElement) return frame;
        frame = document.createElement('iframe');
        frame.src = attributes.src;
        frame.allow = attributes.allow;
        frame.allowFullscreen = true;
        frame.referrerPolicy = attributes.referrerpolicy;
        frame.style.cssText = attributes.style;
        container.append(frame);
        return frame;
    }
    function sendPlayerCommand(frame, command, args = []) {
        if (!(frame instanceof HTMLIFrameElement) || !frame.contentWindow) return;
        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args }), 'https://www.youtube-nocookie.com');
    }
    function createVolumeControl(getFrame, { width = 72 } = {}) {
        const control = document.createElement('label');
        control.title = 'Volume de la vidéo';
        control.style.cssText = 'display:flex;align-items:center;gap:5px;height:29px;padding:0 7px;border-radius:8px;background:rgba(24,24,27,.88);color:#fff;font-size:13px;';
        const icon = document.createElement('span'); icon.textContent = '🔊'; icon.setAttribute('aria-hidden', 'true');
        const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.value = '100'; input.setAttribute('aria-label', 'Volume de la vidéo'); input.style.cssText = `width:${width}px;margin:0;accent-color:#ef4444;cursor:pointer;`;
        input.addEventListener('input', () => {
            const nextVolume = Number(input.value);
            const frame = getFrame();
            sendPlayerCommand(frame, 'setVolume', [nextVolume]);
            if (nextVolume === 0) sendPlayerCommand(frame, 'mute');
            else sendPlayerCommand(frame, 'unMute');
        });
        control.append(icon, input);
        return control;
    }
    function setTitle(value) {
        const title = player()?.querySelector('[data-tm-t4-youtube-title]');
        if (!(title instanceof HTMLElement)) return;
        const text = String(value || DEFAULT_TITLE).replace(/\s+/g, ' ').trim() || DEFAULT_TITLE;
        title.textContent = text; title.title = text;
    }
    function constrain(element) {
        if (!(element instanceof HTMLElement)) return;
        const margin = 12;
        const maxWidth = Math.max(260, window.innerWidth - margin * 2);
        const maxHeight = Math.max(180, window.innerHeight - margin * 2);
        if (element.offsetWidth > maxWidth) element.style.width = `${maxWidth}px`;
        if (element.offsetHeight > maxHeight) element.style.height = `${maxHeight}px`;
        const rect = element.getBoundingClientRect();
        const left = element.style.left && element.style.left !== 'auto' ? Number.parseFloat(element.style.left) || rect.left : rect.left;
        const top = element.style.top && element.style.top !== 'auto' ? Number.parseFloat(element.style.top) || rect.top : rect.top;
        element.style.left = `${clamp(left, margin, Math.max(margin, window.innerWidth - rect.width - margin))}px`;
        element.style.top = `${clamp(top, margin, Math.max(margin, window.innerHeight - rect.height - margin))}px`;
        element.style.right = 'auto'; element.style.bottom = 'auto';
    }
    function collapsed(element) { return element?.dataset.tmT4YoutubeCollapsed === '1'; }
    function updateCollapseButton(button, isCollapsed) {
        button.title = isCollapsed ? 'Réafficher la vidéo' : 'Masquer la vidéo sans couper le son';
        button.setAttribute('aria-label', button.title);
        button.innerHTML = isCollapsed
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.3A11.5 11.5 0 0 1 12 5.2c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.3 4.1M6.6 6.7C3.8 8.4 2 11.2 2 11.2s3.5 6 10 6c1.2 0 2.4-.2 3.4-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    }
    function setCollapsed(next, element = player()) {
        if (!(element instanceof HTMLElement)) return;
        const header = element.querySelector('[data-tm-t4-youtube-header]');
        const body = element.querySelector('[data-tm-t4-youtube-body]');
        const button = element.querySelector('[data-tm-t4-youtube-collapse]');
        if (!(header instanceof HTMLElement) || !(body instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) return;
        if (next) {
            if (!collapsed(element)) { element.dataset.tmT4YoutubeWidth = String(Math.round(element.offsetWidth || DEFAULT_WIDTH)); element.dataset.tmT4YoutubeHeight = String(Math.round(element.offsetHeight || DEFAULT_HEIGHT)); }
            element.dataset.tmT4YoutubeCollapsed = '1'; body.style.display = 'none'; header.style.borderBottom = 'none';
            element.style.width = `${COLLAPSED_WIDTH}px`; element.style.height = 'auto'; element.style.minWidth = '220px'; element.style.minHeight = '0'; element.style.resize = 'none';
        } else {
            element.dataset.tmT4YoutubeCollapsed = '0'; body.style.display = 'block'; header.style.borderBottom = '1px solid rgba(255,255,255,.06)';
            element.style.width = `${Math.max(320, Number(element.dataset.tmT4YoutubeWidth) || DEFAULT_WIDTH)}px`; element.style.height = `${Math.max(220, Number(element.dataset.tmT4YoutubeHeight) || DEFAULT_HEIGHT)}px`; element.style.minWidth = '320px'; element.style.minHeight = '220px'; element.style.resize = 'both';
        }
        updateCollapseButton(button, next); constrain(element);
    }
    function close() {
        const element = player();
        const frame = element?.querySelector('iframe'); if (frame instanceof HTMLIFrameElement) frame.src = 'about:blank';
        element?.remove(); resizeObserver?.disconnect(); resizeObserver = null;
        if (resizeHandler) window.removeEventListener('resize', resizeHandler, true); resizeHandler = null;
        if (escapeHandler) document.removeEventListener('keydown', escapeHandler, true); escapeHandler = null;
    }
    function ensure() {
        const existing = player(); if (existing instanceof HTMLElement) return existing;
        if (!document.body) return null;
        const element = document.createElement('div'); element.id = PLAYER_ID;
        element.style.cssText = `position:fixed;right:18px;bottom:18px;z-index:1000001;display:flex;flex-direction:column;width:${DEFAULT_WIDTH}px;height:${DEFAULT_HEIGHT}px;min-width:320px;min-height:220px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);background:rgba(24,24,27,.98);border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.45);backdrop-filter:blur(8px);overflow:hidden;resize:both;`;
        const header = document.createElement('div'); header.dataset.tmT4YoutubeHeader = '';
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.06);cursor:move;user-select:none;';
        const title = document.createElement('div'); title.dataset.tmT4YoutubeTitle = ''; title.textContent = DEFAULT_TITLE; title.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700;color:#f4f4f5;';
        const actions = document.createElement('div'); actions.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';
        const collapseButton = document.createElement('button'); collapseButton.type = 'button'; collapseButton.dataset.tmT4YoutubeCollapse = ''; collapseButton.style.cssText = 'border:0;background:#27272a;color:#fff;width:30px;height:30px;border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;'; updateCollapseButton(collapseButton, false);
        const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.textContent = '×'; closeButton.title = 'Fermer le player'; closeButton.setAttribute('aria-label', closeButton.title); closeButton.style.cssText = 'border:0;background:#27272a;color:#fff;width:30px;height:30px;border-radius:9px;cursor:pointer;font-size:18px;line-height:1;';
        const body = document.createElement('div'); body.dataset.tmT4YoutubeBody = ''; body.style.cssText = 'flex:1;min-height:0;background:#09090b;';
        const volume = createVolumeControl(() => body.querySelector('iframe'), { width: 64 });
        actions.append(volume, collapseButton, closeButton); header.append(title, actions); element.append(header, body); document.body.append(element);
        collapseButton.addEventListener('click', () => setCollapsed(!collapsed(element), element)); closeButton.addEventListener('click', close);
        let drag = null;
        const move = (event) => { if (!drag) return; element.style.left = `${clamp(drag.left + event.clientX - drag.x, 0, Math.max(0, window.innerWidth - element.offsetWidth))}px`; element.style.top = `${clamp(drag.top + event.clientY - drag.y, 0, Math.max(0, window.innerHeight - element.offsetHeight))}px`; element.style.right = 'auto'; element.style.bottom = 'auto'; };
        const end = () => { drag = null; document.removeEventListener('mousemove', move, true); document.removeEventListener('mouseup', end, true); };
        header.addEventListener('mousedown', (event) => { if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button, input, label'))) return; const rect = element.getBoundingClientRect(); drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top }; document.addEventListener('mousemove', move, true); document.addEventListener('mouseup', end, true); event.preventDefault(); });
        resizeHandler = () => constrain(element); window.addEventListener('resize', resizeHandler, true);
        if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(() => constrain(element)); resizeObserver.observe(element); }
        constrain(element); return element;
    }
    async function resolveTitle(id, watchUrl) {
        if (!id || !watchUrl || titles.has(id)) return titles.get(id) || '';
        try { const endpoint = new URL('https://www.youtube.com/oembed'); endpoint.searchParams.set('url', watchUrl); endpoint.searchParams.set('format', 'json'); const payload = await http.externalJson(endpoint.href, { headers: { Accept: 'application/json' }, credentials: 'omit', timeout: 15000 }); const title = String(payload?.title || '').replace(/\s+/g, ' ').trim(); if (title) titles.set(id, title); return title; } catch { return ''; }
    }
    function open(descriptor) {
        if (!descriptor?.embedUrl) return;
        const element = ensure(); const body = element?.querySelector('[data-tm-t4-youtube-body]'); if (!(body instanceof HTMLElement)) return;
        body.querySelector('iframe')?.remove();
        appendFrame(body, descriptor, 'display:block;width:100%;height:100%;border:0;background:#000;');
        if (collapsed(element)) setCollapsed(false, element);
        element.dataset.tmT4YoutubeId = descriptor.id; setTitle(titles.get(descriptor.id) || `YouTube · ${descriptor.id}`);
        const serial = ++requestSerial; void resolveTitle(descriptor.id, descriptor.watchUrl).then((title) => { if (title && serial === requestSerial && player()?.dataset.tmT4YoutubeId === descriptor.id) setTitle(title); });
        if (!escapeHandler) { escapeHandler = (event) => { if (event.key === 'Escape' && player() instanceof HTMLElement) { event.preventDefault(); close(); } }; document.addEventListener('keydown', escapeHandler, true); }
    }
    function openInline(bubble, descriptor) {
        if (!(bubble instanceof HTMLElement) || !descriptor?.embedUrl) return;
        const existing = [...bubble.querySelectorAll('[data-tm-t4-youtube-inline]')]
            .find((element) => element instanceof HTMLElement && element.dataset.tmT4YoutubeInline === descriptor.id);
        if (existing instanceof HTMLElement) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.dataset.tmT4YoutubeInline = descriptor.id;
        wrapper.style.cssText = 'position:relative;display:block;width:min(100%,320px);aspect-ratio:16/9;margin:10px 0 2px;border:1px solid rgba(239,68,68,.28);border-radius:10px;overflow:hidden;background:#000;box-shadow:0 8px 22px rgba(0,0,0,.28);';
        const popoutButton = document.createElement('button');
        popoutButton.type = 'button'; popoutButton.textContent = '↗'; popoutButton.title = 'Ouvrir dans le lecteur flottant'; popoutButton.setAttribute('aria-label', popoutButton.title);
        popoutButton.style.cssText = 'position:absolute;top:7px;right:7px;z-index:1;width:29px;height:29px;padding:0;border:0;border-radius:8px;background:rgba(24,24,27,.88);color:#fff;font:18px/1 system-ui,sans-serif;cursor:pointer;';
        popoutButton.addEventListener('click', () => {
            sendPlayerCommand(wrapper.querySelector('iframe'), 'pauseVideo');
            open(descriptor);
        });
        wrapper.append(popoutButton);
        bubble.append(wrapper);
        // GM_addElement ne contourne la CSP que si son parent est déjà dans
        // le document. C'est le même ordre que celui du lecteur flottant.
        const inlineUrl = new URL(descriptor.embedUrl);
        inlineUrl.searchParams.set('autoplay', '0');
        const frame = appendFrame(wrapper, { ...descriptor, embedUrl: inlineUrl.href }, 'display:block;width:100%;height:100%;border:0;background:#000;');
        const volume = createVolumeControl(() => frame, { width: 82 });
        volume.style.cssText += 'position:absolute;top:7px;left:7px;z-index:1;';
        wrapper.append(volume);
    }
    function clearInline() {
        document.querySelectorAll('[data-tm-t4-youtube-inline]').forEach((wrapper) => {
            const frame = wrapper.querySelector('iframe'); if (frame instanceof HTMLIFrameElement) frame.src = 'about:blank';
            wrapper.remove();
        });
    }
    function destroy() {
        close();
        clearInline();
    }
    return Object.freeze({ open, openInline, clearInline, close, destroy });
}
