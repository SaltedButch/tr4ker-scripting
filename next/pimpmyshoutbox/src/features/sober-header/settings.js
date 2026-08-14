/**
 * Construit le panneau de réglages de la feature « Sober Header ».
 *
 * @module src/features/sober-header/settings
 */
const KEYS = Object.freeze({
    allSite: 'tm_t4_topbar_stats_all_site',
    upload: 'tm_t4_topbar_stats_show_total_upload',
    download: 'tm_t4_topbar_stats_show_total_download',
    credits: 'tm_t4_topbar_stats_show_credits',
    buffer: 'tm_t4_topbar_stats_show_buffer',
    period24h: 'tm_t4_topbar_stats_show_24h',
    period7d: 'tm_t4_topbar_stats_show_7d',
    period30d: 'tm_t4_topbar_stats_show_30d',
    pauseOnHover: 'tm_t4_matrix_carousel_pause_hover'
});

function heading(text) {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = 'margin-top:14px;color:#c4c4c8;font-size:12px;font-weight:700;';
    return element;
}

function toggle(label, checked, color = '#20d67b') {
    const element = document.createElement('label');
    element.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:9px;color:#e4e4e7;cursor:pointer;font-size:12px;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.style.accentColor = color;
    const text = document.createElement('span');
    text.textContent = label;
    element.append(input, text);
    return { element, input };
}

/**
 * Rend l'interface produite par « renderSoberHeaderSettings ».
 *
 * @function renderSoberHeaderSettings
 */
export function renderSoberHeaderSettings(container, { context }) {
    const runtime = context?.soberHeader;
    if (!runtime) { container.textContent = 'Active la feature pour configurer l’affichage Sobre.'; return; }
    const settings = runtime.getSettings();
    const description = document.createElement('p');
    description.style.cssText = 'margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;';
    description.textContent = 'Widget compact de statistiques, directement intégré à la barre supérieure.';
    container.append(description);
    const bind = (control, key) => control.addEventListener('change', () => runtime.set(key, control.checked));
    const appendToggle = (label, key, color) => {
        const control = toggle(label, settings[key], color);
        bind(control.input, KEYS[key]);
        container.append(control.element);
    };

    appendToggle('Afficher sur toutes les pages du site Tr4ker', 'allSite', '#45c7c7');
    container.append(heading('Informations globales'));
    appendToggle('Upload total', 'upload', '#20d67b');
    appendToggle('Download total', 'download', '#4da3ff');
    appendToggle('Crédits', 'credits', '#d6b85a');
    appendToggle('Buffer', 'buffer', '#45c7c7');
    container.append(heading('Périodes affichées'));
    appendToggle('24 heures', 'period24h');
    appendToggle('7 jours', 'period7d');
    appendToggle('30 jours', 'period30d');
    container.append(heading('Défilement des périodes'));
    appendToggle('Pause au survol', 'pauseOnHover');
}
