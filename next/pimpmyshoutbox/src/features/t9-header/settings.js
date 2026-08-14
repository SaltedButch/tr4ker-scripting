/**
 * Construit le panneau de réglages de la feature « T9 Header ».
 *
 * @module src/features/t9-header/settings
 */
const ALL_SITE_STORAGE_KEY = 'tm_t4_topbar_stats_all_site';

function makeToggle(label, checked) {
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;color:#e4e4e7;cursor:pointer;font-size:13px;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.style.accentColor = '#22c55e';
    const text = document.createElement('span');
    text.textContent = label;
    row.append(input, text);
    return { row, input };
}

/**
 * Rend l'interface produite par « renderT9HeaderSettings ».
 *
 * @function renderT9HeaderSettings
 */
export function renderT9HeaderSettings(container, { context }) {
    const description = document.createElement('p');
    description.style.cssText = 'margin:0 0 12px;color:#a1a1aa;font-size:12px;line-height:1.5;';
    description.textContent = 'Affiche la barre sombre avec navigation, statistiques, messagerie et accès au compte.';

    const allSite = makeToggle(
        'Afficher cette barre sur toutes les pages du site',
        context.storage.readBoolean(ALL_SITE_STORAGE_KEY, true)
    );
    allSite.input.addEventListener('change', () => {
        context.storage.writeBoolean(ALL_SITE_STORAGE_KEY, allSite.input.checked);
        context.t9Header?.sync();
    });

    container.append(description, allSite.row);
}
