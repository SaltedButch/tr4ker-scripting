/**
 * Construit le panneau de réglages de la feature « Matrix Header ».
 *
 * @module src/features/matrix-header/settings
 */
const KEYS = Object.freeze({
    allSite: 'tm_t4_topbar_stats_all_site',
    upload: 'tm_t4_matrix_global_upload',
    download: 'tm_t4_matrix_global_download',
    ticker: 'tm_t4_matrix_ticker_enabled',
    tickerSpeed: 'tm_t4_matrix_ticker_speed',
    tickerPause: 'tm_t4_matrix_ticker_pause_hover',
    carouselInterval: 'tm_t4_matrix_carousel_interval',
    carouselPause: 'tm_t4_matrix_carousel_pause_hover',
    credits: 'tm_t4_topbar_stats_show_credits',
    buffer: 'tm_t4_topbar_stats_show_buffer',
    period24h: 'tm_t4_topbar_stats_show_24h',
    period7d: 'tm_t4_topbar_stats_show_7d',
    period30d: 'tm_t4_topbar_stats_show_30d'
});

function row(label, checked, color = '#4ade80') {
    const element = document.createElement('label');
    element.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:9px;color:#e4e4e7;cursor:pointer;font-size:12px;';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.checked = checked; input.style.accentColor = color;
    const text = document.createElement('span'); text.textContent = label;
    element.append(input, text);
    return { element, input };
}

function heading(text) {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = 'margin-top:14px;color:#c4c4c8;font-size:12px;font-weight:700;';
    return element;
}

function numberRow(label, value, min, max, step, suffix = '') {
    const element = document.createElement('label');
    element.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;color:#d4d4d8;font-size:12px;';
    const text = document.createElement('span'); text.textContent = label;
    const controls = document.createElement('span'); controls.style.cssText = 'display:inline-flex;align-items:center;gap:5px;';
    const input = document.createElement('input');
    input.type = 'number'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(value);
    input.style.cssText = 'width:74px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#18181b;color:#fff;padding:7px;text-align:center;';
    const unit = document.createElement('span'); unit.textContent = suffix;
    controls.append(input, unit); element.append(text, controls);
    return { element, input };
}

/**
 * Rend l'interface produite par « renderMatrixHeaderSettings ».
 *
 * @function renderMatrixHeaderSettings
 */
export function renderMatrixHeaderSettings(container, { context }) {
    const runtime = context?.matrixHeader;
    if (!runtime) { container.textContent = 'Active la feature pour configurer l’affichage Matrix.'; return; }
    const settings = runtime.getSettings();
    const description = document.createElement('p');
    description.style.cssText = 'margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;';
    description.textContent = 'Tableau de statistiques Matrix intégré à la barre supérieure du site.';
    container.append(description);

    const bind = (control, key, transform = (value) => value) => {
        control.addEventListener('change', () => { runtime.set(key, transform(control)); });
    };
    const allSite = row('Afficher sur toutes les pages du site Tr4ker', settings.allSite, '#45c7c7'); bind(allSite.input, KEYS.allSite, (input) => input.checked);
    container.append(allSite.element, heading('Données globales'));
    const upload = row('Upload global', settings.upload, '#67e8f9'); bind(upload.input, KEYS.upload, (input) => input.checked);
    const download = row('Download global', settings.download, '#fda4af'); bind(download.input, KEYS.download, (input) => input.checked);
    container.append(upload.element, download.element, heading('Bandeau supérieur'));
    const ticker = row('Défilement si le contenu dépasse', settings.ticker); bind(ticker.input, KEYS.ticker, (input) => input.checked);
    const tickerSpeed = numberRow('Vitesse', settings.tickerSpeed, 10, 160, 1); bind(tickerSpeed.input, KEYS.tickerSpeed, (input) => Number(input.value));
    const tickerPause = row('Pause au survol', settings.tickerPause); bind(tickerPause.input, KEYS.tickerPause, (input) => input.checked);
    container.append(ticker.element, tickerSpeed.element, tickerPause.element, heading('Périodes du carrousel'));
    for (const [key, label, value] of [[KEYS.period24h, '24 heures — Ratio, Upload et Download', settings.period24h], [KEYS.period7d, '7 jours — Ratio, Upload et Download', settings.period7d], [KEYS.period30d, '30 jours — Ratio, Upload et Download', settings.period30d]]) {
        const control = row(label, value); bind(control.input, key, (input) => input.checked); container.append(control.element);
    }
    container.append(heading('Carrousel'));
    const interval = numberRow('Intervalle', settings.carouselInterval / 1000, 1.5, 60, .5, 's'); bind(interval.input, KEYS.carouselInterval, (input) => Number(input.value) * 1000);
    const carouselPause = row('Pause au survol', settings.carouselPause); bind(carouselPause.input, KEYS.carouselPause, (input) => input.checked);
    container.append(interval.element, carouselPause.element, heading('Informations supplémentaires'));
    const credits = row('Crédits', settings.credits, '#fde68a'); bind(credits.input, KEYS.credits, (input) => input.checked);
    const buffer = row('Buffer', settings.buffer, '#c4b5fd'); bind(buffer.input, KEYS.buffer, (input) => input.checked);
    container.append(credits.element, buffer.element);
}
