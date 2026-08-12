import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderMatrixHeaderSettings } from './settings.js';

const DASHBOARD_ID = 'tm-t4-matrix-dashboard';
const STYLE_ID = 'tm-t4-matrix-dashboard-style';
const HOST_ATTRIBUTE = 'data-tm-matrix-dashboard-host';
const CACHE_MS = 90_000;
const MINIMUM_RATIO = .5;
const PERIODS = Object.freeze([
    { id: '24h', label: '24 heures' },
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' }
]);
const KEYS = Object.freeze({
    allSite: 'tm_t4_topbar_stats_all_site', upload: 'tm_t4_matrix_global_upload', download: 'tm_t4_matrix_global_download',
    ticker: 'tm_t4_matrix_ticker_enabled', tickerSpeed: 'tm_t4_matrix_ticker_speed', tickerPause: 'tm_t4_matrix_ticker_pause_hover',
    carouselInterval: 'tm_t4_matrix_carousel_interval', carouselPause: 'tm_t4_matrix_carousel_pause_hover',
    credits: 'tm_t4_topbar_stats_show_credits', buffer: 'tm_t4_topbar_stats_show_buffer',
    period24h: 'tm_t4_topbar_stats_show_24h', period7d: 'tm_t4_topbar_stats_show_7d', period30d: 'tm_t4_topbar_stats_show_30d'
});

function number(value) { if (value === null || value === undefined || value === '') return null; const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : null; }
function ratio(upload, download) { if (upload === null || download === null) return null; return download === 0 ? (upload > 0 ? Infinity : null) : upload / download; }
function clamp(value, fallback, min, max) { const parsed = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback; }
function bytes(value) { const valueInBytes = Math.max(0, Number(value) || 0); const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let amount = valueInBytes; let index = 0; while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; } return index === 0 ? `${Math.round(amount)} ${units[index]}` : `${amount < 10 ? amount.toFixed(1) : amount.toFixed(0)} ${units[index]}`; }
function ratioLabel(value) { return value === null || Number.isNaN(value) ? '—' : value === Infinity ? '∞' : Number(value).toFixed(2); }
function creditsLabel(value) { const credits = number(value); if (credits === null) return '—'; if (credits < 1000) return Math.round(credits).toLocaleString('fr-FR'); const thousands = credits / 1000; return `${thousands.toLocaleString('fr-FR', { maximumFractionDigits: thousands >= 100 ? 0 : thousands >= 10 ? 1 : 2, useGrouping: false })}k`; }
function bufferLabel(value) { const amount = Number(value) || 0; return amount > 0 ? `+${bytes(amount)} DL` : amount < 0 ? `Manque ${bytes(Math.abs(amount))}` : 'Seuil atteint'; }
function notificationButton() { return [...document.querySelectorAll('header[role="banner"] button[aria-label]')].find((button) => button instanceof HTMLButtonElement && String(button.getAttribute('aria-label') || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().startsWith('notifications')) || null; }

function buildSettings(storage) {
    const boolean = (key, fallback) => storage.readBoolean(key, fallback);
    return {
        allSite: boolean(KEYS.allSite, true), upload: boolean(KEYS.upload, boolean('tm_t4_topbar_stats_show_total_upload', false)), download: boolean(KEYS.download, boolean('tm_t4_topbar_stats_show_total_download', false)),
        ticker: boolean(KEYS.ticker, true), tickerSpeed: Math.round(clamp(storage.get(KEYS.tickerSpeed), 42, 10, 160)), tickerPause: boolean(KEYS.tickerPause, true),
        carouselInterval: Math.round(clamp(storage.get(KEYS.carouselInterval), 5000, 1500, 60000)), carouselPause: boolean(KEYS.carouselPause, true),
        credits: boolean(KEYS.credits, false), buffer: boolean(KEYS.buffer, false), period24h: boolean(KEYS.period24h, true), period7d: boolean(KEYS.period7d, true), period30d: boolean(KEYS.period30d, true)
    };
}

function periodMetrics(statistics, id) {
    const suffix = id;
    const upload = number(statistics[`uploaded_last_${suffix}`] ?? statistics[`upload_last_${suffix}`]);
    const download = number(statistics[`downloaded_last_${suffix}`] ?? statistics[`download_last_${suffix}`]);
    const explicitRatio = number(statistics[`ratio_last_${suffix}`]);
    return { ratio: explicitRatio === null ? ratio(upload, download) : explicitRatio, upload, download };
}

function buildData(statsPayload, userPayload) {
    const summary = statsPayload?.summary && typeof statsPayload.summary === 'object' ? statsPayload.summary : {};
    const statistics = statsPayload?.statistics && typeof statsPayload.statistics === 'object' ? statsPayload.statistics : {};
    const upload = number(summary.uploaded) === null ? null : number(summary.uploaded) + (number(summary.bonus_upload) || 0);
    const download = number(summary.downloaded) === null ? null : number(summary.downloaded) + (number(summary.bonus_download) || 0);
    return {
        global: { ratio: ratio(upload, download), upload, download },
        periods: Object.fromEntries(PERIODS.map((period) => [period.id, periodMetrics(statistics, period.id)])),
        extras: { credits: number(userPayload?.money), buffer: upload === null || download === null ? null : (upload / MINIMUM_RATIO) - download },
        snapshots: Array.isArray(statsPayload?.snapshots) ? statsPayload.snapshots : []
    };
}

function metric(item, extraClass = '') {
    const format = item.metric === 'ratio' ? ratioLabel : item.metric === 'credits' ? creditsLabel : item.metric === 'buffer' ? bufferLabel : bytes;
    const color = ({ ratio: '#c7ffd4', upload: '#63ff91', download: '#39ff88', credits: '#9dffb5', buffer: '#74ffad' })[item.metric] || '#d9f99d';
    return `<span class="tm-matrix-metric ${extraClass}" data-tm-matrix-metric="${item.metric}"><span class="tm-matrix-metric-label">${item.label}</span><strong style="color:${color}">${format(item.value)}</strong></span>`;
}

function background() {
    const glyphs = '01アイウエオカキクケコ<>[]{}#$%&/\\';
    return `<div class="tm-matrix-background" aria-hidden="true">${Array.from({ length: 8 }, (_, index) => { const text = Array.from({ length: 52 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(''); return `<span class="tm-matrix-code-line" style="top:${8 + index * 12}%;animation-delay:${(Math.random() * -12).toFixed(2)}s;animation-duration:${(15 + Math.random() * 15).toFixed(2)}s;">${text}</span>`; }).join('')}</div>`;
}

function chart(data, settings) {
    const enabled = (id) => settings[`period${id === '24h' ? '24h' : id === '7d' ? '7d' : '30d'}`];
    const series = [
        ...(settings.upload ? [{ id: 'upload', label: 'Upload', color: '#63ff91' }] : []),
        ...(settings.download ? [{ id: 'download', label: 'Download', color: '#fbbf24' }] : [])
    ];
    const periods = PERIODS.map((period) => ({ ...period, values: data.periods[period.id] })).filter((period) => enabled(period.id) && series.some((item) => period.values[item.id] !== null));
    if (!periods.length || !series.length) return '<div class="tm-matrix-chart-empty">Aucune donnée disponible pour les périodes sélectionnées.</div>';
    const pointX = (index) => periods.length === 1 ? 454 : 82 + (index / (periods.length - 1)) * 744;
    const grid = [0, .25, .5, .75, 1].map((step) => `<line x1="54" y1="${190 - step * 148}" x2="854" y2="${190 - step * 148}" class="tm-matrix-chart-grid"></line>`).join('');
    const paths = series.map((item) => {
        const max = Math.max(1, ...periods.map((period) => Math.max(0, period.values[item.id] ?? 0)));
        const pointY = (value) => 190 - (value === null ? 0 : Math.log10(1 + value) / Math.log10(1 + max)) * 148;
        const points = periods.map((period, index) => `${pointX(index).toFixed(1)},${pointY(period.values[item.id]).toFixed(1)}`).join(' ');
        const markers = periods.map((period, index) => period.values[item.id] === null ? '' : `<circle cx="${pointX(index).toFixed(1)}" cy="${pointY(period.values[item.id]).toFixed(1)}" r="5" fill="${item.color}" stroke="#071422" stroke-width="2"><title>${period.label} — ${item.label} : ${bytes(period.values[item.id])}</title></circle>`).join('');
        return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>${markers}`;
    }).join('');
    const labels = periods.map((period, index) => `<text x="${pointX(index).toFixed(1)}" y="222" text-anchor="middle" class="tm-matrix-chart-date">${period.label.toUpperCase()}</text>`).join('');
    return `<div class="tm-matrix-chart-wrap"><div class="tm-matrix-chart-legend">${series.map((item) => `<span style="--tm-matrix-series-color:${item.color}">${item.label}</span>`).join('')}</div><svg class="tm-matrix-chart-svg" viewBox="0 0 900 238" role="img" aria-label="Évolution de l’upload et du download sur 24 heures, 7 jours et 30 jours">${grid}<line x1="54" y1="190" x2="854" y2="190" class="tm-matrix-chart-axis"></line>${paths}${labels}</svg></div>`;
}

function render(data, settings) {
    const globalItems = [{ metric: 'ratio', label: 'Ratio', value: data.global.ratio }, ...(settings.upload && data.global.upload !== null ? [{ metric: 'upload', label: 'Upload', value: data.global.upload }] : []), ...(settings.download && data.global.download !== null ? [{ metric: 'download', label: 'Download', value: data.global.download }] : [])];
    const activePeriods = PERIODS.map((definition) => { const values = data.periods[definition.id]; const enabled = settings[`period${definition.id === '24h' ? '24h' : definition.id === '7d' ? '7d' : '30d'}`]; const metrics = enabled ? ['ratio', 'upload', 'download'].filter((key) => values[key] !== null) : []; return { ...definition, values, metrics }; }).filter((period) => period.metrics.length);
    const extraItems = [...(settings.credits ? [{ metric: 'credits', label: 'Crédits', value: data.extras.credits }] : []), ...(settings.buffer ? [{ metric: 'buffer', label: 'Buffer', value: data.extras.buffer }] : [])];
    const layout = `${activePeriods.length ? 'has-zone-2' : ''} ${extraItems.length ? 'has-zone-4' : ''}`.trim();
    const periodZone = activePeriods.length ? `<section class="tm-matrix-zone tm-matrix-zone-periods"><div class="tm-matrix-zone-heading"><span>PERIODS</span></div><div class="tm-matrix-period-viewport">${activePeriods.map((period) => `<article class="tm-matrix-period-slide" data-tm-matrix-period-slide="${period.id}" aria-label="Statistiques ${period.label}"><div class="tm-matrix-period-title">${period.label.toUpperCase()}</div><div class="tm-matrix-period-metrics">${period.metrics.map((kind) => metric({ metric: kind, label: kind === 'ratio' ? 'Ratio' : kind === 'upload' ? 'Upload' : 'Download', value: period.values[kind] })).join('')}</div></article>`).join('')}</div></section>` : '';
    const extrasZone = extraItems.length ? `<section class="tm-matrix-zone tm-matrix-zone-extras"><div class="tm-matrix-zone-heading"><span>EXTRAS</span></div><div class="tm-matrix-extra-list" style="--tm-matrix-extra-count:${extraItems.length}">${extraItems.map((item) => metric(item, 'tm-matrix-extra')).join('')}</div></section>` : '';
    return `${background()}<section class="tm-matrix-zone tm-matrix-zone-global" data-tm-matrix-zone="1"><div class="tm-matrix-zone-heading"><span>GLOBAL</span><span class="tm-matrix-status">LIVE</span></div><div class="tm-matrix-ticker ${settings.ticker ? '' : 'tm-matrix-ticker-static'}" data-tm-matrix-ticker="1" data-tm-matrix-pause-hover="${settings.tickerPause ? '1' : '0'}"><div class="tm-matrix-ticker-track" data-tm-matrix-ticker-track="1"><span class="tm-matrix-ticker-copy">${globalItems.map((item) => `${metric(item)}<span class="tm-matrix-separator" aria-hidden="true">•</span>`).join('')}</span></div></div></section><div class="tm-matrix-body ${layout}">${periodZone}<section class="tm-matrix-zone tm-matrix-zone-chart"><div class="tm-matrix-zone-heading"><span>ACTIVITÉ</span><span class="tm-matrix-status">UP / DL</span></div>${chart(data, settings)}</section>${extrasZone}</div>`;
}

const CHART_CSS = `
#${DASHBOARD_ID} .tm-matrix-chart-legend{display:flex;justify-content:flex-end;gap:12px;margin:-2px 4px 2px;color:var(--tm-matrix-muted);font-size:9px;letter-spacing:.04em}
#${DASHBOARD_ID} .tm-matrix-chart-legend span{display:inline-flex;align-items:center;gap:4px}
#${DASHBOARD_ID} .tm-matrix-chart-legend span::before{content:'';width:7px;height:2px;background:var(--tm-matrix-series-color);box-shadow:0 0 6px var(--tm-matrix-series-color)}
header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-chart-legend{gap:7px;margin:-2px 1px 1px;font-size:7px}
header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-chart-legend span::before{width:5px}
`;

const CSS = `
#${DASHBOARD_ID}{--tm-matrix-bg:rgba(2,8,18,.97);--tm-matrix-panel:rgba(7,20,34,.9);--tm-matrix-border:rgba(45,212,191,.36);--tm-matrix-primary:#a7f3d0;--tm-matrix-text:#e0f2fe;--tm-matrix-muted:#86a6b8;width:100%;margin:0 0 18px;color:var(--tm-matrix-text);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;box-sizing:border-box;position:relative;isolation:isolate;overflow:hidden;contain:layout paint style}#${DASHBOARD_ID} *,#${DASHBOARD_ID} *::before,#${DASHBOARD_ID} *::after{box-sizing:border-box}header[${HOST_ATTRIBUTE}]{flex-wrap:nowrap!important;align-content:center!important;column-gap:4px!important;min-height:72px!important;height:auto!important;padding-bottom:5px!important}header[${HOST_ATTRIBUTE}]>#${DASHBOARD_ID}{order:3;flex:0 1 clamp(300px,34vw,500px)!important;width:clamp(300px,34vw,500px)!important;max-width:none!important;margin:0 5px!important}#${DASHBOARD_ID}::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.24;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(125,211,252,.045) 4px);mix-blend-mode:screen}#${DASHBOARD_ID} .tm-matrix-background{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;opacity:.16;color:#2dd4bf;font-size:10px;line-height:1;text-shadow:0 0 8px rgba(45,212,191,.7)}#${DASHBOARD_ID} .tm-matrix-code-line{position:absolute;left:-40%;white-space:nowrap;letter-spacing:.3em;animation:tm-matrix-code-drift linear infinite}#${DASHBOARD_ID} .tm-matrix-zone-global,#${DASHBOARD_ID} .tm-matrix-body{position:relative;z-index:2}#${DASHBOARD_ID} .tm-matrix-body{display:grid;gap:10px;grid-template-columns:1fr;align-items:stretch}#${DASHBOARD_ID} .tm-matrix-body.has-zone-2.has-zone-4{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(0,1.15fr)}#${DASHBOARD_ID} .tm-matrix-body.has-zone-2:not(.has-zone-4){grid-template-columns:minmax(0,1fr) minmax(0,1fr)}#${DASHBOARD_ID} .tm-matrix-body:not(.has-zone-2).has-zone-4{grid-template-columns:minmax(0,1fr) minmax(0,.9fr)}#${DASHBOARD_ID} .tm-matrix-zone{min-width:0;min-height:120px;padding:10px;border:1px solid var(--tm-matrix-border);border-radius:5px;background:linear-gradient(145deg,var(--tm-matrix-panel),rgba(3,10,24,.88));box-shadow:inset 0 0 22px rgba(45,212,191,.055),0 0 16px rgba(14,165,233,.06);overflow:hidden}#${DASHBOARD_ID} .tm-matrix-zone-global{min-height:58px;margin-bottom:6px;padding:8px 12px}#${DASHBOARD_ID} .tm-matrix-zone-periods{border-color:rgba(99,255,145,.38)}#${DASHBOARD_ID} .tm-matrix-zone-chart{border-color:rgba(57,255,136,.42)}#${DASHBOARD_ID} .tm-matrix-zone-extras{border-color:rgba(157,255,181,.34)}#${DASHBOARD_ID} .tm-matrix-zone-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:var(--tm-matrix-muted);font-size:10px;letter-spacing:.12em;text-transform:uppercase}#${DASHBOARD_ID} .tm-matrix-status{color:#63ff91;font-size:9px;letter-spacing:.08em;animation:tm-matrix-status-glitch 7s steps(2,end) infinite}#${DASHBOARD_ID} .tm-matrix-ticker{min-width:0;overflow:hidden;white-space:nowrap}#${DASHBOARD_ID} .tm-matrix-ticker-track{display:inline-flex;min-width:max-content;align-items:center}#${DASHBOARD_ID} .tm-matrix-ticker-copy{display:inline-flex;align-items:center;min-width:max-content}#${DASHBOARD_ID} [data-tm-matrix-overflow="1"] .tm-matrix-ticker-track{animation:tm-matrix-ticker-scroll var(--tm-matrix-ticker-duration,24s) linear infinite}#${DASHBOARD_ID} [data-tm-matrix-ticker-pause-hover="1"][data-tm-matrix-overflow="1"]:hover .tm-matrix-ticker-track{animation-play-state:paused}#${DASHBOARD_ID} .tm-matrix-ticker-static .tm-matrix-ticker-track{width:100%}#${DASHBOARD_ID} .tm-matrix-metric{display:inline-flex;align-items:baseline;gap:8px;min-width:0}#${DASHBOARD_ID} .tm-matrix-metric-label{color:var(--tm-matrix-muted);font-size:10px}#${DASHBOARD_ID} .tm-matrix-metric strong{font-size:15px;font-weight:700;letter-spacing:.02em}#${DASHBOARD_ID} .tm-matrix-zone-global .tm-matrix-metric-label{font-size:12px}#${DASHBOARD_ID} .tm-matrix-zone-global .tm-matrix-metric strong{font-size:17px}#${DASHBOARD_ID} .tm-matrix-separator{margin:0 12px;color:rgba(125,211,252,.52)}#${DASHBOARD_ID} .tm-matrix-zone-periods,#${DASHBOARD_ID} .tm-matrix-zone-chart,#${DASHBOARD_ID} .tm-matrix-zone-extras{min-height:150px}#${DASHBOARD_ID} .tm-matrix-period-viewport{min-height:80px;display:grid;align-items:center}#${DASHBOARD_ID} .tm-matrix-period-slide[hidden]{display:none}#${DASHBOARD_ID} .tm-matrix-period-title{margin-bottom:10px;color:var(--tm-matrix-primary);font-size:12px;letter-spacing:.14em}#${DASHBOARD_ID} .tm-matrix-period-metrics{display:grid;gap:8px}#${DASHBOARD_ID} .tm-matrix-period-metrics .tm-matrix-metric{justify-content:space-between;border-bottom:1px solid rgba(134,239,172,.1);padding-bottom:6px}#${DASHBOARD_ID} .tm-matrix-period-metrics .tm-matrix-metric strong{font-size:17px}#${DASHBOARD_ID} .tm-matrix-extra-list{display:grid;height:calc(100% - 22px);gap:10px;grid-template-rows:repeat(var(--tm-matrix-extra-count,1),minmax(0,1fr))}#${DASHBOARD_ID} .tm-matrix-extra{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid rgba(134,239,172,.16);background:rgba(0,0,0,.16)}#${DASHBOARD_ID} .tm-matrix-extra .tm-matrix-metric-label{font-size:11px}#${DASHBOARD_ID} .tm-matrix-extra strong{font-size:18px}#${DASHBOARD_ID} .tm-matrix-chart-wrap{display:grid;gap:4px;align-content:center;min-height:115px}#${DASHBOARD_ID} .tm-matrix-chart-svg{display:block;width:100%;height:auto;min-height:90px;overflow:visible}#${DASHBOARD_ID} .tm-matrix-chart-grid{stroke:rgba(99,255,145,.16);stroke-width:1;stroke-dasharray:3 5}#${DASHBOARD_ID} .tm-matrix-chart-axis{stroke:rgba(99,255,145,.52);stroke-width:1}#${DASHBOARD_ID} .tm-matrix-chart-axis-label,#${DASHBOARD_ID} .tm-matrix-chart-date{fill:var(--tm-matrix-muted);font:10px ui-monospace,monospace}#${DASHBOARD_ID} .tm-matrix-chart-empty,#${DASHBOARD_ID} .tm-matrix-loading{min-height:120px;display:grid;place-items:center;color:var(--tm-matrix-muted);font-size:11px;text-align:center}#${DASHBOARD_ID} .tm-matrix-loading{min-height:90px;border:1px solid var(--tm-matrix-border);border-radius:5px;background:var(--tm-matrix-bg);letter-spacing:.08em}@keyframes tm-matrix-ticker-scroll{from{transform:translateX(-50%)}to{transform:translateX(0)}}@keyframes tm-matrix-code-drift{from{transform:translateX(0)}to{transform:translateX(180%)}}@keyframes tm-matrix-status-glitch{0%,92%,100%{transform:translateX(0);opacity:1}93%{transform:translateX(-2px);color:#f0abfc}95%{transform:translateX(2px);color:#67e8f9}97%{transform:translateX(0);opacity:.72}}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone{min-height:54px;padding:4px;border-radius:3px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-global{min-height:32px;padding:4px 6px;margin-bottom:3px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-periods,header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-chart,header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-extras{min-height:72px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-period-viewport{min-height:35px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-chart-wrap{min-height:44px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-chart-svg{min-height:38px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-period-metrics{gap:2px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-period-metrics .tm-matrix-metric{padding-bottom:1px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-extra strong{font-size:12px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-heading{margin-bottom:3px;font-size:7px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-metric{gap:3px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-metric-label{font-size:7px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-metric strong{font-size:10px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-global .tm-matrix-metric-label{font-size:13px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-zone-global .tm-matrix-metric strong{font-size:19px}header[${HOST_ATTRIBUTE}] #${DASHBOARD_ID} .tm-matrix-period-title{margin-bottom:4px;font-size:8px}@media(max-width:1050px){#${DASHBOARD_ID} .tm-matrix-body.has-zone-2.has-zone-4{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}#${DASHBOARD_ID} .tm-matrix-body.has-zone-2.has-zone-4 .tm-matrix-zone-extras{grid-column:1/-1;min-height:180px}#${DASHBOARD_ID} .tm-matrix-body:not(.has-zone-2).has-zone-4{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}@media(max-width:680px){#${DASHBOARD_ID} .tm-matrix-body,#${DASHBOARD_ID} .tm-matrix-body.has-zone-2.has-zone-4,#${DASHBOARD_ID} .tm-matrix-body.has-zone-2:not(.has-zone-4),#${DASHBOARD_ID} .tm-matrix-body:not(.has-zone-2).has-zone-4{grid-template-columns:1fr}#${DASHBOARD_ID} .tm-matrix-body.has-zone-2.has-zone-4 .tm-matrix-zone-extras{grid-column:auto}#${DASHBOARD_ID} .tm-matrix-zone{min-height:210px}#${DASHBOARD_ID} .tm-matrix-zone-global{min-height:92px}#${DASHBOARD_ID} .tm-matrix-metric strong{font-size:14px}}@media(prefers-reduced-motion:reduce){#${DASHBOARD_ID} [data-tm-matrix-overflow="1"] .tm-matrix-ticker-track,#${DASHBOARD_ID} .tm-matrix-code-line,#${DASHBOARD_ID} .tm-matrix-status{animation:none}}
`;

export default defineFeature({
    id: 'matrix-header', label: 'Barre de menu — Matrix', defaultEnabled: false, exclusiveWith: ['t9-header', 'sober-header'], pages: [],
    storageKeys: Object.values(KEYS), settings: { area: 'site', category: 'appearance', order: 20, render: renderMatrixHeaderSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Affiche un tableau de statistiques Matrix dans la barre supérieure.', kind: 'info', order: 10 }],
    setup(context) {
        let stats = null; let user = null; let statsAt = 0; let userAt = 0; let statsRequest = null; let userRequest = null; let data = null; let carousel = null; let carouselIndex = 0; let renderedSignature = '';
        const getSettings = () => buildSettings(context.storage);
        const stopCarousel = () => { if (carousel !== null) window.clearInterval(carousel); carousel = null; };
        const destroy = () => { stopCarousel(); renderedSignature = ''; document.getElementById(DASHBOARD_ID)?.remove(); document.querySelectorAll(`header[${HOST_ATTRIBUTE}]`).forEach((header) => header.removeAttribute(HOST_ATTRIBUTE)); };
        const fetchJson = (endpoint, type) => {
            const isStats = type === 'stats'; const cached = isStats ? stats : user; const fetchedAt = isStats ? statsAt : userAt; const request = isStats ? statsRequest : userRequest;
            if (cached && Date.now() - fetchedAt < CACHE_MS) return Promise.resolve(cached); if (request) return request;
            const next = fetch(endpoint, { credentials: 'include' }).then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then((payload) => { if (isStats) { stats = payload; statsAt = Date.now(); } else { user = payload; userAt = Date.now(); } return payload; }).finally(() => { if (isStats) statsRequest = null; else userRequest = null; });
            if (isStats) statsRequest = next; else userRequest = next; return next;
        };
        const updateTicker = () => { const ticker = document.querySelector(`#${DASHBOARD_ID} [data-tm-matrix-ticker]`); const track = ticker?.querySelector('[data-tm-matrix-ticker-track]'); const copy = track?.querySelector('.tm-matrix-ticker-copy'); const settings = getSettings(); if (!(ticker instanceof HTMLElement) || !(track instanceof HTMLElement) || !(copy instanceof HTMLElement)) return; track.replaceChildren(copy); ticker.removeAttribute('data-tm-matrix-overflow'); if (!settings.ticker || copy.scrollWidth <= 0) return; track.append(copy.cloneNode(true)); ticker.setAttribute('data-tm-matrix-overflow', '1'); track.style.setProperty('--tm-matrix-ticker-duration', `${Math.max(8, (copy.scrollWidth / settings.tickerSpeed) * 2).toFixed(1)}s`); };
        const setSlide = (index) => { const dashboard = document.getElementById(DASHBOARD_ID); const visible = [...dashboard?.querySelectorAll('[data-tm-matrix-period-slide]') || []]; if (!visible.length) return; carouselIndex = ((index % visible.length) + visible.length) % visible.length; visible.forEach((slide, slideIndex) => { const active = slideIndex === carouselIndex; slide.toggleAttribute('hidden', !active); slide.setAttribute('aria-hidden', active ? 'false' : 'true'); }); };
        const currentSignature = () => `${JSON.stringify(getSettings())}|${statsAt}|${userAt}`;
        const renderDashboard = () => { const dashboard = document.getElementById(DASHBOARD_ID); if (!(dashboard instanceof HTMLElement) || !data) return; stopCarousel(); dashboard.className = 'tm-matrix-dashboard'; dashboard.innerHTML = render(data, getSettings()); renderedSignature = currentSignature(); setSlide(0); updateTicker(); const slides = dashboard.querySelectorAll('[data-tm-matrix-period-slide]'); const settings = getSettings(); if (slides.length > 1) carousel = window.setInterval(() => { if (!settings.carouselPause || !dashboard.matches(':hover')) setSlide(carouselIndex + 1); }, settings.carouselInterval); };
        function sync() {
            const button = notificationButton(); const header = button?.closest('header[role="banner"]'); const settings = getSettings();
            if (!context.platform.isTr4kerPage() || (!settings.allSite && !context.platform.isChatPage()) || !(header instanceof HTMLElement)) { destroy(); return; }
            context.ensureStyle(STYLE_ID, CSS + CHART_CSS); header.setAttribute(HOST_ATTRIBUTE, '1'); let dashboard = document.getElementById(DASHBOARD_ID);
            if (!(dashboard instanceof HTMLElement)) { dashboard = document.createElement('section'); dashboard.id = DASHBOARD_ID; dashboard.setAttribute('aria-label', 'Matrix Dashboard'); dashboard.innerHTML = '<div class="tm-matrix-loading">CHARGEMENT DES STATISTIQUES…</div>'; }
            const controls = button.parentElement; if (dashboard.parentElement !== header) { if (controls instanceof HTMLElement && controls.parentElement === header) header.insertBefore(dashboard, controls); else header.append(dashboard); }
            if (data && currentSignature() !== renderedSignature) renderDashboard();
            void Promise.all([fetchJson('/api/me/stats', 'stats'), settings.credits ? fetchJson('/api/me', 'user').catch(() => null) : Promise.resolve(user)]).then(([statsPayload, userPayload]) => { data = buildData(statsPayload, userPayload); if (currentSignature() !== renderedSignature) renderDashboard(); }).catch(() => { data = buildData(null, null); if (currentSignature() !== renderedSignature) renderDashboard(); });
        }
        context.matrixHeader = { getSettings, sync, set(key, value) { if (typeof value === 'boolean') context.storage.writeBoolean(key, value); else context.storage.set(key, String(value)); sync(); } };
        context.on(window, 'resize', updateTicker, { passive: true }); context.on(window, CONFIGURATION_IMPORTED_EVENT, sync); context.every(800, sync); sync();
        return () => { delete context.matrixHeader; destroy(); };
    },
    onRoute(context) { context.matrixHeader?.sync(); }
});
