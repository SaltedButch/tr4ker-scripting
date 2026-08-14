/**
 * Implémente la feature « Sober Header » et son cycle de vie.
 *
 * @module src/features/sober-header/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderSoberHeaderSettings } from './settings.js';

const WIDGET_ID = 'tm-t4-topbar-stats-widget';
const STYLE_ID = 'tm-t4-sober-header-style';
const HOST_ATTRIBUTE = 'data-tm-sober-header-host';
const BURGER_BUTTON_ID = 'tm-t4-topbar-burger';
const BURGER_MENU_ID = 'tm-t4-topbar-burger-menu';
const BURGER_STYLE_ID = 'tm-t4-topbar-burger-style';
const CACHE_MS = 90_000;
const PERIOD_CYCLE_MS = 4_000;
const MINIMUM_RATIO = .5;
const KEYS = Object.freeze({
    allSite: 'tm_t4_topbar_stats_all_site', burger: 'tm_t4_topbar_burger_enabled', upload: 'tm_t4_topbar_stats_show_total_upload', download: 'tm_t4_topbar_stats_show_total_download',
    credits: 'tm_t4_topbar_stats_show_credits', buffer: 'tm_t4_topbar_stats_show_buffer', period24h: 'tm_t4_topbar_stats_show_24h',
    period7d: 'tm_t4_topbar_stats_show_7d', period30d: 'tm_t4_topbar_stats_show_30d', pauseOnHover: 'tm_t4_matrix_carousel_pause_hover'
});
const PERIODS = Object.freeze([{ id: '24h', label: '24 h', key: 'period24h' }, { id: '7d', label: '7 j', key: 'period7d' }, { id: '30d', label: '30 j', key: 'period30d' }]);
const BURGER_LINKS = Object.freeze([
    { icon: 'forum', label: 'Chat', href: '/communication' },
    { icon: 'menu_book', label: 'Wiki', href: '/wiki' },
    { icon: 'person', label: 'Mon compte', href: '/mon-compte' },
    { icon: 'upload', label: 'Mes uploads', href: '/my-uploads' },
    { icon: 'emoji_events', label: 'Succès', href: '/achievements' },
    { icon: 'settings', label: 'Paramètres', href: '/settings' },
    { icon: 'groups', label: 'Teams', href: '/communaute/teams' },
    { icon: 'redeem', label: 'Demandes', href: '/communaute/demandes' },
    { icon: 'storefront', label: 'Boutique', href: '/communaute/boutique' },
    { icon: 'forum', label: 'Forum', href: '/communaute/forum' },
    { icon: 'swap_horiz', label: 'Migrations', href: '/migrations' }
]);

function numeric(value) { const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : null; }
function formatBytes(value) { const bytes = Math.max(0, Number(value) || 0); const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let amount = bytes; let index = 0; while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; } return index === 0 ? `${Math.round(amount)} ${units[index]}` : `${amount < 10 ? amount.toFixed(1) : amount.toFixed(0)} ${units[index]}`; }
function getRatio(upload, download) { const up = Math.max(0, Number(upload) || 0); const down = Math.max(0, Number(download) || 0); return down === 0 ? (up > 0 ? Infinity : null) : up / down; }
function formatRatio(value) { return value === null || Number.isNaN(value) ? '—' : value === Infinity ? '∞' : Number(value).toFixed(2); }
function formatCredits(value) { const credits = numeric(value); if (credits === null) return '—'; if (credits < 1000) return Math.round(credits).toLocaleString('fr-FR'); const thousands = credits / 1000; return `${thousands.toLocaleString('fr-FR', { maximumFractionDigits: thousands >= 100 ? 0 : thousands >= 10 ? 1 : 2, useGrouping: false })}k`; }
function formatBuffer(value) { const amount = Number(value) || 0; return amount > 0 ? `+${formatBytes(amount)} DL` : amount < 0 ? `Manque ${formatBytes(Math.abs(amount))}` : 'Seuil atteint'; }
function notificationButton() { return [...document.querySelectorAll('header[role="banner"] button[aria-label]')].find((button) => button instanceof HTMLButtonElement && String(button.getAttribute('aria-label') || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').startsWith('notifications')) || null; }

function readSettings(storage) {
    const enabled = (key, fallback) => storage.readBoolean(KEYS[key], fallback);
    return { allSite: enabled('allSite', true), burger: enabled('burger', false), upload: enabled('upload', false), download: enabled('download', false), credits: enabled('credits', false), buffer: enabled('buffer', false), period24h: enabled('period24h', true), period7d: enabled('period7d', true), period30d: enabled('period30d', true), pauseOnHover: enabled('pauseOnHover', true) };
}

function buildWidgetContent(payload, user, settings, periodIndex) {
    const summary = payload?.summary && typeof payload.summary === 'object' ? payload.summary : {};
    const statistics = payload?.statistics && typeof payload.statistics === 'object' ? payload.statistics : {};
    const totalUploaded = (Number(summary.uploaded) || 0) + (Number(summary.bonus_upload) || 0);
    const totalDownloaded = (Number(summary.downloaded) || 0) + (Number(summary.bonus_download) || 0);
    const globalRatio = getRatio(totalUploaded, totalDownloaded);
    const activePeriods = PERIODS.filter((period) => settings[period.key]);
    const activePeriod = activePeriods.length ? activePeriods[periodIndex % activePeriods.length] : null;
    const uploaded = activePeriod ? Math.max(0, Number(statistics[`uploaded_last_${activePeriod.id}`]) || 0) : 0;
    const downloaded = activePeriod ? Math.max(0, Number(statistics[`downloaded_last_${activePeriod.id}`]) || 0) : 0;
    const periodRatio = getRatio(uploaded, downloaded);
    const buffer = (totalUploaded / MINIMUM_RATIO) - totalDownloaded;
    const bufferTitle = buffer >= 0 ? `Encore ${formatBytes(buffer)} téléchargeables avant de passer sous le ratio 0,50.` : `Il manque ${formatBytes(Math.abs(buffer))} d’upload pour revenir au ratio minimum de 0,50.`;
    const content = `
        <div data-tm-topbar-stats-sober-item="ratio" title="Ratio global"><span class="tm-topbar-stats-sober-label">RATIO</span><strong style="color:${globalRatio === null ? '#fafafa' : globalRatio >= 1 ? '#86efac' : '#fcd34d'}">${formatRatio(globalRatio)}</strong></div>
        ${settings.upload ? `<div data-tm-topbar-stats-sober-item="upload" title="Upload total"><strong class="tm-topbar-stats-sober-upload">↑ ${formatBytes(totalUploaded)}</strong></div>` : ''}
        ${settings.download ? `<div data-tm-topbar-stats-sober-item="download" title="Download total"><strong class="tm-topbar-stats-sober-download">↓ ${formatBytes(totalDownloaded)}</strong></div>` : ''}
        ${settings.credits ? `<div data-tm-topbar-stats-sober-item="credits" title="Solde disponible"><span class="tm-topbar-stats-sober-label">CREDIT</span><strong class="tm-topbar-stats-sober-credit">${formatCredits(user?.money)}</strong></div>` : ''}
        ${settings.buffer ? `<div data-tm-topbar-stats-sober-item="buffer" title="${bufferTitle}"><span class="tm-topbar-stats-sober-label">BUFFER</span><strong class="tm-topbar-stats-sober-buffer">${formatBuffer(buffer)}</strong></div>` : ''}
        ${activePeriod ? `<div data-tm-topbar-stats-sober-item="period" title="Statistiques sur ${activePeriod.label}"><span class="tm-topbar-stats-sober-period-label">${activePeriod.label.toUpperCase()}</span><span class="tm-topbar-stats-sober-period-metric tm-topbar-stats-sober-ratio">RATIO <strong>${formatRatio(periodRatio)}</strong></span><span class="tm-topbar-stats-sober-period-metric tm-topbar-stats-sober-upload">↑ <strong>${formatBytes(uploaded)}</strong></span><span class="tm-topbar-stats-sober-period-metric tm-topbar-stats-sober-download">↓ <strong>${formatBytes(downloaded)}</strong></span></div>` : ''}
    `;
    const title = [activePeriod ? `${activePeriod.label} · ↑ ${formatBytes(uploaded)} · ↓ ${formatBytes(downloaded)} · ratio ${formatRatio(periodRatio)}` : null, settings.upload ? `upload total ${formatBytes(totalUploaded)}` : null, settings.download ? `download total ${formatBytes(totalDownloaded)}` : null, `ratio ${formatRatio(globalRatio)}`].filter(Boolean).join(' · ');
    return { content, title, activePeriods };
}

const CSS = `
header[role="banner"][${HOST_ATTRIBUTE}="1"]{height:auto!important;min-height:4rem;padding-top:4px;padding-bottom:4px}header[role="banner"][${HOST_ATTRIBUTE}="1"]>*{min-width:0}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{--tm-sober-upload:#20d67b;--tm-sober-download:#4da3ff;--tm-sober-credit:#d6b85a;--tm-sober-buffer:#45c7c7;width:max-content;min-width:0;max-width:min(760px,calc(100vw - 290px));height:36px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:4px;background:#08090a;color:#e6e6e6;display:flex;align-items:stretch;overflow:hidden;flex:0 0 auto;font-family:Inter,Arial,sans-serif;text-shadow:none;box-shadow:none}header[role="banner"][${HOST_ATTRIBUTE}="1"]>#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{flex:0 1 auto;min-width:0;max-width:min(760px,calc(100% - 290px))}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]>[data-tm-topbar-stats-sober-item]{display:inline-flex;flex:0 0 auto;align-items:center;gap:6px;min-width:0;padding:0 12px;border-left:1px solid rgba(255,255,255,.14);color:#e6e6e6;font-size:11px;font-weight:600;line-height:1;white-space:nowrap}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]>[data-tm-topbar-stats-sober-item]:first-child{border-left:0}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] [data-tm-topbar-stats-sober-item="ratio"] strong{color:#20d67b;font-size:14px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-label{color:#9aa0a6;font-size:9px;letter-spacing:.04em}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-upload{color:var(--tm-sober-upload)}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-download{color:var(--tm-sober-download)}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-credit{color:var(--tm-sober-credit)}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-buffer{color:var(--tm-sober-buffer)}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] [data-tm-topbar-stats-sober-item="period"]{flex:1 1 auto;overflow:hidden;gap:8px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-period-label{color:#9aa0a6;font-size:9px;letter-spacing:.04em}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-period-metric{display:inline-flex;align-items:center;gap:3px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-period-metric strong{font-size:10px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-ratio{color:#9aa0a6}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] .tm-topbar-stats-sober-ratio strong{color:#20d67b}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] [data-tm-topbar-stats-state="1"]{padding:0 12px;align-self:center;color:#9aa0a6;font-size:10px}@media(max-width:900px){header[role="banner"][${HOST_ATTRIBUTE}="1"]>#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{max-width:32vw}}@media(max-width:640px){header[role="banner"][${HOST_ATTRIBUTE}="1"]>#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{max-width:24vw}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{max-width:calc(100vw - 110px);height:34px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]>[data-tm-topbar-stats-sober-item]{gap:4px;padding:0 7px;font-size:10px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] [data-tm-topbar-stats-sober-item="period"]{gap:5px}}
#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{--tm-sober-period-width:200px}#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"] [data-tm-topbar-stats-sober-item="period"]{flex:0 0 var(--tm-sober-period-width);width:var(--tm-sober-period-width)}@media(max-width:640px){#${WIDGET_ID}[data-tm-topbar-stats-mode="sober"]{--tm-sober-period-width:120px}}
`;

const BURGER_CSS = `
#${BURGER_BUTTON_ID}{width:34px;height:34px;padding:0;border:1px solid rgba(74,222,128,.24);border-radius:8px;background:rgba(6,30,17,.76);color:#bbf7d0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;transition:background 120ms ease,border-color 120ms ease,transform 120ms ease}
#${BURGER_BUTTON_ID}:hover,#${BURGER_BUTTON_ID}[aria-expanded="true"]{border-color:rgba(74,222,128,.55);background:rgba(22,101,52,.42);transform:translateY(-1px)}
#${BURGER_BUTTON_ID} .material-symbols-outlined{font-size:20px;line-height:1}
#${BURGER_BUTTON_ID}[data-tm-topbar-stats-mode="sober"]{border-color:rgba(255,255,255,.12);background:var(--surface-container,rgba(39,39,42,.92));color:var(--on-surface,#f4f4f5)}
#${BURGER_BUTTON_ID}[data-tm-topbar-stats-mode="sober"]:hover,#${BURGER_BUTTON_ID}[data-tm-topbar-stats-mode="sober"][aria-expanded="true"]{border-color:rgba(255,255,255,.26);background:var(--surface-container-high,rgba(63,63,70,.96))}
#${BURGER_MENU_ID}{position:fixed;z-index:2000;width:min(242px,calc(100vw - 16px));padding:7px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:var(--surface,rgba(24,24,27,.98));box-shadow:0 16px 38px rgba(0,0,0,.48);backdrop-filter:blur(14px)}
#${BURGER_MENU_ID} [data-tm-topbar-burger-title="1"]{display:block;padding:5px 7px 7px;color:var(--on-surface-variant,#a1a1aa);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
#${BURGER_MENU_ID} a{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:7px;color:#e4e4e7;font-size:12px;font-weight:600;text-decoration:none;transition:background 100ms ease,color 100ms ease}
#${BURGER_MENU_ID} a:hover{background:rgba(255,255,255,.08);color:var(--on-surface,#f4f4f5)}
#${BURGER_MENU_ID} a .material-symbols-outlined{color:var(--on-surface-variant,#a1a1aa);font-size:17px;line-height:1}
`;

/** Ferme le panneau burger du mode sobre. */
function closeSoberBurgerMenu() {
    document.getElementById(BURGER_MENU_ID)?.remove();
    const button = document.getElementById(BURGER_BUTTON_ID);
    if (button instanceof HTMLButtonElement) button.setAttribute('aria-expanded', 'false');
}

/** Positionne le panneau burger dans les limites de la fenêtre. */
function positionSoberBurgerMenu(button, menu) {
    if (!(button instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;
    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    menu.style.left = `${Math.round(Math.min(Math.max(margin, window.innerWidth - menuRect.width - margin), Math.max(margin, buttonRect.left)))}px`;
    menu.style.top = `${Math.round(Math.min(Math.max(margin, window.innerHeight - menuRect.height - margin), Math.max(margin, buttonRect.bottom + 8)))}px`;
}

/** Construit et ouvre le menu de navigation du mode sobre. */
function openSoberBurgerMenu() {
    const button = document.getElementById(BURGER_BUTTON_ID);
    if (!(button instanceof HTMLButtonElement) || !document.body) return;
    closeSoberBurgerMenu();
    const menu = document.createElement('nav');
    menu.id = BURGER_MENU_ID;
    menu.setAttribute('aria-label', 'Navigation Tr4ker');
    const title = document.createElement('span');
    title.dataset.tmTopbarBurgerTitle = '1';
    title.textContent = 'Navigation Tr4ker';
    menu.append(title);
    for (const link of BURGER_LINKS) {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = link.icon;
        const label = document.createElement('span');
        label.textContent = link.label;
        anchor.append(icon, label);
        menu.append(anchor);
    }
    document.body.append(menu);
    button.setAttribute('aria-expanded', 'true');
    positionSoberBurgerMenu(button, menu);
}

/** Synchronise le bouton burger avec les réglages et le widget sobre. */
function syncSoberBurgerMenu(context, notification, widget, settings) {
    const header = notification?.closest('header[role="banner"]');
    const insertionTarget = widget?.parentElement === header ? widget : notification;
    const parent = insertionTarget?.parentElement;
    if (!settings.burger || !(notification instanceof HTMLButtonElement) || !(insertionTarget instanceof HTMLElement) || !(parent instanceof HTMLElement)) {
        closeSoberBurgerMenu();
        document.getElementById(BURGER_BUTTON_ID)?.remove();
        return;
    }
    context.ensureStyle(BURGER_STYLE_ID, BURGER_CSS);
    let button = document.getElementById(BURGER_BUTTON_ID);
    if (!(button instanceof HTMLButtonElement)) {
        button = document.createElement('button');
        button.id = BURGER_BUTTON_ID;
        button.type = 'button';
        button.setAttribute('aria-label', 'Ouvrir la navigation Tr4ker');
        button.setAttribute('aria-expanded', 'false');
        button.title = 'Navigation Tr4ker';
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = 'menu';
        button.append(icon);
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (document.getElementById(BURGER_MENU_ID)) closeSoberBurgerMenu();
            else openSoberBurgerMenu();
        });
    }
    button.setAttribute('data-tm-topbar-stats-mode', 'sober');
    if (button.parentElement !== parent || button.nextElementSibling !== insertionTarget) {
        insertionTarget.insertAdjacentElement('beforebegin', button);
    }
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'sober-header',
    label: 'Barre de menu — Sobre',
    defaultEnabled: false,
    exclusiveWith: ['t9-header', 'matrix-header'],
    pages: [],
    storageKeys: Object.values(KEYS),
    settings: { area: 'site', category: 'appearance', order: 30, render: renderSoberHeaderSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Affiche un widget compact de statistiques dans la barre supérieure.', kind: 'info', order: 10 }],
    setup(context) {
        let stats = null; let user = null; let statsAt = 0; let userAt = 0; let statsRequest = null; let userRequest = null; let periodIndex = 0; let cycle = null; let renderedSignature = '';
        const getSettings = () => readSettings(context.storage);
        const stopCycle = () => { if (cycle !== null) window.clearInterval(cycle); cycle = null; };
        const destroy = () => { stopCycle(); renderedSignature = ''; closeSoberBurgerMenu(); document.getElementById(BURGER_BUTTON_ID)?.remove(); document.getElementById(WIDGET_ID)?.remove(); document.querySelectorAll(`header[${HOST_ATTRIBUTE}]`).forEach((header) => header.removeAttribute(HOST_ATTRIBUTE)); };
        const fetchJson = (endpoint, kind) => { const isStats = kind === 'stats'; const cached = isStats ? stats : user; const fetchedAt = isStats ? statsAt : userAt; const ongoing = isStats ? statsRequest : userRequest; if (cached && Date.now() - fetchedAt < CACHE_MS) return Promise.resolve(cached); if (ongoing) return ongoing; const request = fetch(endpoint, { credentials: 'include' }).then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((payload) => { if (isStats) { stats = payload; statsAt = Date.now(); } else { user = payload; userAt = Date.now(); } return payload; }).finally(() => { if (isStats) statsRequest = null; else userRequest = null; }); if (isStats) statsRequest = request; else userRequest = request; return request; };
        const render = () => { const widget = document.getElementById(WIDGET_ID); if (!(widget instanceof HTMLElement) || !stats) return; const rendered = buildWidgetContent(stats, user, getSettings(), periodIndex); widget.setAttribute('aria-busy', 'false'); widget.setAttribute('data-tm-topbar-stats-mode', 'sober'); widget.setAttribute('title', rendered.title); widget.setAttribute('aria-label', `Statistiques Tr4ker, ${rendered.title}`); widget.innerHTML = rendered.content; renderedSignature = `${JSON.stringify(getSettings())}|${statsAt}|${userAt}`; stopCycle(); if (rendered.activePeriods.length > 1) cycle = window.setInterval(() => { const liveWidget = document.getElementById(WIDGET_ID); if (liveWidget instanceof HTMLElement && (!getSettings().pauseOnHover || !liveWidget.matches(':hover'))) { periodIndex = (periodIndex + 1) % rendered.activePeriods.length; render(); } }, PERIOD_CYCLE_MS); };
        function sync() {
            const button = notificationButton(); const header = button?.closest('header[role="banner"]'); const settings = getSettings();
            if (!context.platform.isTr4kerPage() || (!settings.allSite && !context.platform.isChatPage()) || !(header instanceof HTMLElement)) { destroy(); return; }
            context.ensureStyle(STYLE_ID, CSS); header.setAttribute(HOST_ATTRIBUTE, '1'); let widget = document.getElementById(WIDGET_ID); const created = !(widget instanceof HTMLElement);
            if (!(widget instanceof HTMLElement)) { widget = document.createElement('section'); widget.id = WIDGET_ID; widget.setAttribute('aria-label', 'Statistiques Tr4ker'); widget.setAttribute('aria-busy', 'true'); widget.setAttribute('data-tm-topbar-stats-mode', 'sober'); widget.innerHTML = '<span data-tm-topbar-stats-state="1">Chargement des statistiques…</span>'; }
            const controls = button.parentElement; if (widget.parentElement !== header) { if (controls instanceof HTMLElement && controls.parentElement === header) header.insertBefore(widget, controls); else header.append(widget); }
            syncSoberBurgerMenu(context, button, widget, settings);
            const signature = `${JSON.stringify(settings)}|${statsAt}|${userAt}`; if (stats && signature !== renderedSignature) render();
            void Promise.all([fetchJson('/api/me/stats', 'stats'), settings.credits ? fetchJson('/api/me', 'user').catch(() => null) : Promise.resolve(user)]).then(() => { if (created || `${JSON.stringify(getSettings())}|${statsAt}|${userAt}` !== renderedSignature) render(); }).catch(() => { if (widget instanceof HTMLElement) { widget.setAttribute('aria-busy', 'false'); widget.innerHTML = '<span data-tm-topbar-stats-state="1">Statistiques indisponibles.</span>'; } });
        }
        context.soberHeader = { getSettings, sync, set(key, value) { context.storage.writeBoolean(key, Boolean(value)); sync(); } };
        context.on(document, 'click', (event) => {
            const target = event.target instanceof Node ? event.target : null;
            const menu = document.getElementById(BURGER_MENU_ID);
            const button = document.getElementById(BURGER_BUTTON_ID);
            if (target && (menu?.contains(target) || button?.contains(target))) return;
            closeSoberBurgerMenu();
        }, true);
        context.on(document, 'keydown', (event) => { if (event.key === 'Escape') closeSoberBurgerMenu(); }, true);
        context.on(window, 'resize', () => {
            const button = document.getElementById(BURGER_BUTTON_ID);
            const menu = document.getElementById(BURGER_MENU_ID);
            if (button instanceof HTMLElement && menu instanceof HTMLElement) positionSoberBurgerMenu(button, menu);
        }, { passive: true });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, sync); context.every(800, sync); sync();
        return () => { delete context.soberHeader; destroy(); };
    },
    onRoute(context) { context.soberHeader?.sync(); }
});
