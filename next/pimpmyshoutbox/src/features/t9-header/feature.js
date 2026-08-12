import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderT9HeaderSettings } from './settings.js';

const EXTRAS_ID = 'tm-t4-topbar-t9-extras';
const STYLE_ID = 'tm-t4-topbar-t9-style';
const STATS_BLOCK_ID = 'tm-t4-topbar-stats-t9-block';
const ALL_SITE_STORAGE_KEY = 'tm_t4_topbar_stats_all_site';
const STATS_CACHE_MS = 90_000;
const NATIVE_ATTRIBUTES = [
    'data-tm-t9-compatible',
    'data-tm-t9-native-left',
    'data-tm-t9-native-search',
    'data-tm-t9-native-right',
    'data-tm-t9-native-nav',
    'data-tm-t9-native-hamburger',
    'data-tm-t9-native-theme'
];

const BURGER_LINKS = [
    { label: 'Chat', href: '/communication' },
    { label: 'Wiki', href: '/wiki' },
    { label: 'Mon compte', href: '/mon-compte' },
    { label: 'Mes uploads', href: '/my-uploads' },
    { label: 'Succès', href: '/achievements' },
    { label: 'Paramètres', href: '/settings' },
    { label: 'Teams', href: '/communaute/teams' },
    { label: 'Demandes', href: '/communaute/demandes' },
    { label: 'Boutique', href: '/communaute/boutique' },
    { label: 'Forum', href: '/communaute/forum' },
    { label: 'Migrations', href: '/migrations' }
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

function normalizeComparableText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr-FR')
        .trim();
}

function formatBytes(value) {
    const bytes = Math.max(0, Number(value) || 0);
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    let amount = bytes;
    while (amount >= 1024 && unitIndex < units.length - 1) {
        amount /= 1024;
        unitIndex += 1;
    }
    if (unitIndex === 0) return `${Math.round(amount)} ${units[unitIndex]}`;
    return `${amount < 10 ? amount.toFixed(1) : amount.toFixed(0)} ${units[unitIndex]}`;
}

function getRatio(uploaded, downloaded) {
    const up = Math.max(0, Number(uploaded) || 0);
    const down = Math.max(0, Number(downloaded) || 0);
    if (down === 0) return up > 0 ? Infinity : null;
    return up / down;
}

function formatRatio(value) {
    if (value === null || Number.isNaN(value)) return '—';
    if (value === Infinity) return '∞';
    return Number(value).toFixed(2);
}

function getNotificationButton() {
    return [...document.querySelectorAll('header[role="banner"] button[aria-label]')].find((button) => (
        button instanceof HTMLButtonElement
        && normalizeComparableText(button.getAttribute('aria-label')).startsWith('notifications')
    )) || null;
}

function getNativeRoot(header) {
    return [...header.children].find((element) => element instanceof HTMLElement && element.id !== EXTRAS_ID) || null;
}

function getNativeContext(header) {
    const root = getNativeRoot(header) || header;
    const searchForm = header.querySelector('form');
    const userCard = document.querySelector('aside[aria-label="Navigation"] a[aria-label="Mon compte"]');
    const avatar = userCard?.querySelector('img');
    const profileName = userCard?.querySelector('[class*="username"]')?.textContent?.trim()
        || userCard?.querySelector('span')?.textContent?.trim()
        || avatar?.getAttribute('alt')
        || 'Utilisateur';
    const nativeLogout = [...document.querySelectorAll('aside[aria-label="Navigation"] button')].find((button) => {
        const label = normalizeComparableText(button.textContent || button.getAttribute('aria-label'));
        return label.includes('deconnexion') || label.includes('logout');
    }) || null;
    const getHref = (selector, fallback) => {
        const link = root.querySelector(selector);
        return link instanceof HTMLAnchorElement ? link.getAttribute('href') || fallback : fallback;
    };
    return {
        searchAction: searchForm?.getAttribute('action') || '',
        searchMethod: searchForm?.getAttribute('method') || 'get',
        searchName: searchForm?.querySelector('input')?.getAttribute('name') || 'search',
        chatHref: '/communication',
        notificationsHref: getHref('a[title="Notifications"]', '/notifications'),
        profileName,
        avatarSrc: avatar?.getAttribute('src') || '',
        nativeLogout
    };
}

function renderMenuLinks() {
    const groups = [
        ['Navigation', BURGER_LINKS.slice(0, 3)],
        ['Téléchargements', [
            { label: 'Torrents', href: 'https://tr4ker.net/torrents' },
            { label: 'Exclusivités', href: 'https://tr4ker.net/exclusivite' }
        ]],
        ['Compte', BURGER_LINKS.slice(3, 6)],
        ['Communauté', BURGER_LINKS.slice(6, 9)],
        ['Liens', BURGER_LINKS.slice(9)]
    ];
    return groups.map(([title, links]) => `
        <div><h3>${title}</h3>${links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}</div>
    `).join('');
}

function renderProfileLinks(context) {
    return `
        <a href="/mon-compte/profil">Profil</a>
        <a href="/my-uploads">Mes torrents</a>
        <a href="/mon-compte/stats">Statistiques</a>
        <a href="${escapeHtml(context.notificationsHref)}">Notifications</a>
    `;
}

function renderExtras(context) {
    const avatar = context.avatarSrc
        ? `<img src="${escapeHtml(context.avatarSrc)}" alt="${escapeHtml(context.profileName)}">`
        : `<span class="tm-t4-t9-avatar-fallback">${escapeHtml(context.profileName.slice(0, 1).toUpperCase())}</span>`;
    return `
        <div id="${EXTRAS_ID}" data-tm-topbar-template="t9">
            <div class="tm-t4-t9-menu-zone" data-tm-t9-menu>
                <button class="tm-t4-t9-menu-button" type="button" data-tm-t9-menu-toggle aria-expanded="false">
                    <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path></svg>
                    <span>Menu</span>
                </button>
                <div class="tm-t4-t9-menu-panel" data-tm-t9-menu-panel hidden>${renderMenuLinks()}</div>
            </div>
            <section id="${STATS_BLOCK_ID}" aria-label="Statistiques Tr4ker" aria-busy="true" data-tm-t9-stats>
                <span data-tm-topbar-stats-state="1">Chargement des statistiques…</span>
            </section>
            <a class="tm-t4-t9-chat" data-tm-t9-chat href="/communication" title="Messagerie" aria-label="Messagerie">
                <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M216,80H184V48a16,16,0,0,0-16-16H40A16,16,0,0,0,24,48V176a8,8,0,0,0,13,6.22L72,154V184a16,16,0,0,0,16,16h93.59L219,230.22a8,8,0,0,0,5,1.78,8,8,0,0,0,8-8V96A16,16,0,0,0,216,80ZM66.55,137.78,40,159.25V48H168v88H71.58A8,8,0,0,0,66.55,137.78ZM216,207.25l-26.55-21.47a8,8,0,0,0-5-1.78H88V152h80a16,16,0,0,0,16-16V96h32Z"></path></svg>
            </a>
            <div class="tm-t4-t9-profile" data-tm-t9-profile>
                <button type="button" data-tm-t9-profile-toggle aria-expanded="false">
                    <span>Bienvenue <strong>${escapeHtml(context.profileName)}</strong></span>
                    <span class="tm-t4-t9-avatar">${avatar}</span>
                </button>
                <div class="tm-t4-t9-profile-panel" data-tm-t9-profile-panel hidden>${renderProfileLinks(context)}<button type="button" data-tm-t9-logout>Déconnexion</button></div>
            </div>
            <button class="tm-t4-t9-logout" type="button" data-tm-t9-logout>Déconnexion</button>
        </div>
    `;
}

function getDirectHeaderChild(element, header) {
    let current = element instanceof Element ? element : null;
    while (current && current.parentElement !== header) current = current.parentElement;
    return current instanceof HTMLElement ? current : null;
}

function prepareNativeParts(header, notificationButton) {
    header.setAttribute('data-tm-t9-compatible', '1');
    const searchInput = header.querySelector('input[aria-label="Rechercher des torrents"]');
    const nativeSearch = getDirectHeaderChild(searchInput, header);
    const nativeRight = getDirectHeaderChild(notificationButton, header);
    const nativeLeft = [...header.children].find((child) => (
        child !== nativeSearch && child !== nativeRight && child.id !== EXTRAS_ID
    ));
    nativeLeft?.setAttribute('data-tm-t9-native-left', '1');
    nativeSearch?.setAttribute('data-tm-t9-native-search', '1');
    nativeRight?.setAttribute('data-tm-t9-native-right', '1');
    header.querySelector('nav[aria-label="Navigation principale"]')?.setAttribute('data-tm-t9-native-nav', '1');
    header.querySelector('button[aria-label="Menu"]')?.setAttribute('data-tm-t9-native-hamburger', '1');
    header.querySelector('button[aria-label^="Passer en mode"]')?.setAttribute('data-tm-t9-native-theme', '1');
}

function closeMenus(scope = document) {
    scope.querySelectorAll('[data-tm-t9-menu-panel], [data-tm-t9-profile-panel]').forEach((panel) => panel.setAttribute('hidden', ''));
    scope.querySelectorAll('[data-tm-t9-menu-toggle], [data-tm-t9-profile-toggle]').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
}

function installHandlers(context, extras, getLogout) {
    if (extras.dataset.tmHandlers === '1') return;
    extras.dataset.tmHandlers = '1';
    const installToggle = (toggleSelector, panelSelector) => {
        const toggle = extras.querySelector(toggleSelector);
        const panel = extras.querySelector(panelSelector);
        context.on(toggle, 'click', (event) => {
            event.preventDefault();
            const open = panel?.hasAttribute('hidden') === true;
            closeMenus(extras);
            panel?.toggleAttribute('hidden', !open);
            toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    };
    installToggle('[data-tm-t9-menu-toggle]', '[data-tm-t9-menu-panel]');
    installToggle('[data-tm-t9-profile-toggle]', '[data-tm-t9-profile-panel]');
    extras.querySelectorAll('[data-tm-t9-logout]').forEach((button) => {
        context.on(button, 'click', (event) => {
            event.preventDefault();
            const logout = getLogout();
            if (logout instanceof HTMLButtonElement) logout.click();
        });
    });
}

function renderStats(payload) {
    const block = document.getElementById(STATS_BLOCK_ID);
    if (!(block instanceof HTMLElement)) return;
    const summary = payload?.summary && typeof payload.summary === 'object' ? payload.summary : {};
    const totalUploaded = (Number(summary.uploaded) || 0) + (Number(summary.bonus_upload) || 0);
    const totalDownloaded = (Number(summary.downloaded) || 0) + (Number(summary.bonus_download) || 0);
    const ratioLabel = formatRatio(getRatio(totalUploaded, totalDownloaded));
    block.setAttribute('aria-busy', 'false');
    block.setAttribute('aria-label', `Upload ${formatBytes(totalUploaded)}, Download ${formatBytes(totalDownloaded)}, Ratio ${ratioLabel}`);
    block.setAttribute('title', `Upload ${formatBytes(totalUploaded)} · Download ${formatBytes(totalDownloaded)} · Ratio ${ratioLabel}`);
    block.innerHTML = `
        <div data-tm-topbar-t9-item="upload" title="Upload"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"></path></svg><span>${formatBytes(totalUploaded)}</span></div>
        <div class="tm-topbar-t9-separator" aria-hidden="true"></div>
        <div data-tm-topbar-t9-item="download" title="Download"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path></svg><span>${formatBytes(totalDownloaded)}</span></div>
        <div class="tm-topbar-t9-separator" aria-hidden="true"></div>
        <div data-tm-topbar-t9-item="ratio" title="Ratio"><span class="tm-topbar-t9-ratio-label">Ratio</span><span class="tm-topbar-t9-ratio-value">${ratioLabel}</span></div>
    `;
}

const T9_CSS = `
header[data-tm-t9-compatible="1"] { box-sizing:border-box;display:flex;width:100%;min-height:58px;padding:6px 16px;gap:12px;align-items:center;background:#050607;border-bottom:1px solid rgba(161,161,170,.18); }
header[data-tm-t9-compatible="1"] > [data-tm-t9-native-left] { order:1;flex:0 0 auto; }
header[data-tm-t9-compatible="1"] > [data-tm-t9-native-search] { order:3;flex:1 1 auto;min-width:120px; }
header[data-tm-t9-compatible="1"] > [data-tm-t9-native-right] { order:6;flex:0 0 auto; }
header[data-tm-t9-compatible="1"] [data-tm-t9-native-nav],header[data-tm-t9-compatible="1"] [data-tm-t9-native-hamburger],header[data-tm-t9-compatible="1"] [data-tm-t9-native-theme] { display:none !important; }
#${EXTRAS_ID} { display:contents; } #${EXTRAS_ID} > * { box-sizing:border-box;flex:0 0 auto; }
#${EXTRAS_ID} [data-tm-t9-menu] { order:2;position:relative; } #${EXTRAS_ID} [data-tm-t9-stats] { order:4; } #${EXTRAS_ID} [data-tm-t9-chat] { order:5; } #${EXTRAS_ID} [data-tm-t9-profile] { order:7; } #${EXTRAS_ID} > .tm-t4-t9-logout { order:8; }
#${EXTRAS_ID} .tm-t4-t9-menu-button { height:34px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;border:1px solid #27272a;border-radius:9px;background:#18181b;color:#fff;cursor:pointer;font:inherit; }
#${EXTRAS_ID} .tm-t4-t9-menu-button:hover { background:#27272a;border-color:#3f3f46; }
#${EXTRAS_ID} .tm-t4-t9-menu-button svg { width:16px;height:16px;fill:currentColor; }
#${EXTRAS_ID} .tm-t4-t9-menu-panel { position:absolute;top:calc(100% + 4px);left:0;z-index:2200;width:800px;padding:18px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;border:1px solid rgba(161,161,170,.24);border-radius:9px;background:rgba(0,0,0,.98);box-shadow:0 18px 40px rgba(0,0,0,.52); }
#${EXTRAS_ID} .tm-t4-t9-menu-panel h3 { margin:0 0 8px;color:#71717a;font-size:10px;letter-spacing:.12em;text-transform:uppercase; }
#${EXTRAS_ID} .tm-t4-t9-menu-panel a { display:block;padding:6px 8px;border-radius:5px;color:#d4d4d8;font-size:12px;text-decoration:none; } #${EXTRAS_ID} .tm-t4-t9-menu-panel a:hover { background:#18181b;color:#fff; }
#${EXTRAS_ID} .tm-t4-t9-chat { width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;color:#a1a1aa;text-decoration:none; } #${EXTRAS_ID} .tm-t4-t9-chat:hover { color:#fff; } #${EXTRAS_ID} .tm-t4-t9-chat svg { width:20px;height:20px;fill:currentColor; }
#${EXTRAS_ID} .tm-t4-t9-profile { position:relative; } #${EXTRAS_ID} .tm-t4-t9-profile > button { min-height:34px;padding:3px 8px;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:transparent;color:#e4e4e7;cursor:pointer;font:inherit;font-size:12px; } #${EXTRAS_ID} .tm-t4-t9-profile > button:hover { border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.05); }
#${EXTRAS_ID} .tm-t4-t9-avatar,#${EXTRAS_ID} .tm-t4-t9-avatar img,#${EXTRAS_ID} .tm-t4-t9-avatar-fallback { width:27px;height:27px;border-radius:50%; } #${EXTRAS_ID} .tm-t4-t9-avatar img { display:block;object-fit:cover; } #${EXTRAS_ID} .tm-t4-t9-avatar-fallback { display:inline-flex;align-items:center;justify-content:center;background:#27272a;color:#d4d4d8;font-weight:700; }
#${EXTRAS_ID} .tm-t4-t9-profile-panel { position:absolute;top:calc(100% + 4px);right:0;z-index:2200;width:190px;padding:6px;border:1px solid rgba(161,161,170,.24);background:rgba(0,0,0,.98);box-shadow:0 16px 36px rgba(0,0,0,.5); }
#${EXTRAS_ID} .tm-t4-t9-profile-panel a,#${EXTRAS_ID} .tm-t4-t9-profile-panel button { width:100%;padding:8px;display:block;border:0;border-top:1px solid rgba(255,255,255,.06);background:transparent;color:#d4d4d8;text-align:left;cursor:pointer;font-size:12px;text-decoration:none; } #${EXTRAS_ID} .tm-t4-t9-profile-panel a:first-child { border-top:0; } #${EXTRAS_ID} .tm-t4-t9-profile-panel a:hover,#${EXTRAS_ID} .tm-t4-t9-profile-panel button:hover { background:#18181b;color:#fff; } #${EXTRAS_ID} .tm-t4-t9-profile-panel button { color:#fca5a5; }
#${EXTRAS_ID} .tm-t4-t9-logout { min-height:32px;padding:0 12px;border:1px solid rgba(248,113,113,.28);border-radius:7px;background:rgba(127,29,29,.12);color:#fca5a5;cursor:pointer;font:inherit;font-size:12px;font-weight:700; } #${EXTRAS_ID} .tm-t4-t9-logout:hover { border-color:rgba(248,113,113,.52);background:rgba(127,29,29,.26); } #${EXTRAS_ID} [hidden] { display:none !important; }
#${STATS_BLOCK_ID} { box-sizing:border-box;width:max-content;min-width:0;max-width:calc(100vw - 290px);height:32px;padding:4px 12px;display:flex;align-items:center;gap:12px;overflow:hidden;flex:0 0 auto;border:0;border-radius:0;background:transparent;color:#e5e7eb;font-family:Inter,Arial,sans-serif;font-size:14px;white-space:nowrap; }
#${STATS_BLOCK_ID} [data-tm-topbar-t9-item] { display:inline-flex;align-items:center;gap:4px;min-width:0;white-space:nowrap; } #${STATS_BLOCK_ID} [data-tm-topbar-t9-item] svg { width:16px;height:16px;flex:0 0 16px; } #${STATS_BLOCK_ID} [data-tm-topbar-t9-item="upload"] svg { color:#4ade80; } #${STATS_BLOCK_ID} [data-tm-topbar-t9-item="download"] svg { color:#60a5fa; } #${STATS_BLOCK_ID} [data-tm-topbar-t9-item="upload"] span,#${STATS_BLOCK_ID} [data-tm-topbar-t9-item="download"] span { color:#e5e7eb;font-weight:600; } #${STATS_BLOCK_ID} .tm-topbar-t9-separator { width:1px;height:16px;flex:0 0 1px;background:#3f3f46; } #${STATS_BLOCK_ID} .tm-topbar-t9-ratio-label { color:#9ca3af;font-size:12px;text-transform:uppercase; } #${STATS_BLOCK_ID} .tm-topbar-t9-ratio-value { color:#4ade80;font-weight:700; } #${STATS_BLOCK_ID}[data-tm-topbar-stats-state="1"] { color:#9ca3af;font-size:10px; }
@media (max-width:1250px) { #${EXTRAS_ID} .tm-t4-t9-profile > button > span:first-child,#${EXTRAS_ID} .tm-t4-t9-logout { display:none; } }
@media (max-width:1023px) { #${EXTRAS_ID},#${STATS_BLOCK_ID} { display:none; } }
@media (max-width:640px) { #${STATS_BLOCK_ID} { max-width:calc(100vw - 110px); } }
`;

export default defineFeature({
    id: 't9-header',
    label: 'Barre de menu — Hommage à T9',
    defaultEnabled: true,
    legacyEnabledStorageKey: 'tm_t4_topbar_stats_enabled',
    pages: [],
    storageKeys: ['tm_t4_topbar_stats_enabled', ALL_SITE_STORAGE_KEY],
    settings: { area: 'site', category: 'appearance', order: 10, render: renderT9HeaderSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Remplace la barre supérieure du site par l’affichage Hommage à T9.', kind: 'info', order: 10 }],
    setup(context) {
        let statsPayload = null;
        let statsFetchedAt = 0;
        let statsRequest = null;
        let activeHeader = null;

        function destroy() {
            document.getElementById(EXTRAS_ID)?.remove();
            document.querySelectorAll(`[${NATIVE_ATTRIBUTES.join('],[')}]`).forEach((element) => {
                NATIVE_ATTRIBUTES.forEach((attribute) => element.removeAttribute(attribute));
            });
            activeHeader = null;
        }

        async function fetchStats() {
            if (statsFetchedAt && Date.now() - statsFetchedAt < STATS_CACHE_MS) return statsPayload;
            if (statsRequest) return statsRequest;
            statsRequest = fetch('/api/me/stats', { credentials: 'include' })
                .then((response) => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then((payload) => {
                    statsPayload = payload && typeof payload === 'object' ? payload : null;
                    statsFetchedAt = Date.now();
                    return statsPayload;
                })
                .finally(() => { statsRequest = null; });
            return statsRequest;
        }

        function sync() {
            const notificationButton = getNotificationButton();
            const header = notificationButton?.closest('header[role="banner"]');
            const allSite = context.storage.readBoolean(ALL_SITE_STORAGE_KEY, true);
            if (!context.platform.isTr4kerPage() || (!allSite && !context.platform.isChatPage()) || !(header instanceof HTMLElement)) {
                destroy();
                return;
            }
            context.ensureStyle(STYLE_ID, T9_CSS);
            prepareNativeParts(header, notificationButton);
            activeHeader = header;
            const nativeContext = getNativeContext(header);
            let extras = document.getElementById(EXTRAS_ID);
            if (!(extras instanceof HTMLElement)) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = renderExtras(nativeContext);
                extras = wrapper.firstElementChild;
            }
            if (!(extras instanceof HTMLElement)) return;
            if (extras.parentElement !== header) header.append(extras);
            installHandlers(context, extras, () => getNativeContext(activeHeader || header).nativeLogout);
            if (statsPayload) renderStats(statsPayload);
            void fetchStats().then((payload) => { if (payload) renderStats(payload); }).catch(() => {});
        }

        context.t9Header = { sync };
        context.on(document, 'click', (event) => {
            const target = event.target instanceof Element ? event.target : event.target?.parentElement;
            if (!target?.closest('[data-tm-topbar-template="t9"]')) closeMenus();
        }, true);
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') closeMenus(); }, true);
        context.on(window, CONFIGURATION_IMPORTED_EVENT, sync);
        context.every(800, sync);
        sync();
        return () => { delete context.t9Header; destroy(); };
    },
    onRoute(context) { context.t9Header?.sync(); }
});
