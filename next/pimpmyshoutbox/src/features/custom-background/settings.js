/**
 * Construit le panneau de réglages de la feature « Custom Background ».
 *
 * @module src/features/custom-background/settings
 */
function createButton(label, background) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = `border:0;border-radius:8px;background:${background};color:#fff;padding:8px 10px;cursor:pointer;font-weight:650;`;
    return button;
}

/**
 * Rend l'interface produite par « renderCustomBackgroundSettings ».
 *
 * @function renderCustomBackgroundSettings
 */
export function renderCustomBackgroundSettings(container, { context, refresh }) {
    const runtime = context?.customBackground;
    if (!runtime) { container.textContent = 'Active la feature pour choisir une couleur de fond.'; return; }

    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'La couleur est appliquée à l’arrière-plan de toutes les pages Tr4ker.';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px;';
    const color = document.createElement('input');
    color.type = 'color'; color.value = runtime.getColor(); color.setAttribute('aria-label', 'Couleur de fond');
    color.style.cssText = 'width:48px;height:38px;padding:3px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#18181b;cursor:pointer;';
    const value = document.createElement('code');
    value.style.cssText = 'min-width:72px;color:#d4d4d8;font-size:12px;';
    const reset = createButton('Réinitialiser', '#3f3f46');
    row.append(color, value, reset);

    const preview = document.createElement('div');
    preview.style.cssText = 'margin-top:11px;padding:11px 12px;border:1px solid rgba(255,255,255,.13);border-radius:10px;color:#f4f4f5;font-size:12px;transition:background .12s;';
    const updatePreview = () => { value.textContent = color.value; preview.style.background = color.value; };
    color.addEventListener('input', () => { updatePreview(); runtime.preview(color.value); });
    color.addEventListener('change', () => { runtime.setColor(color.value); refresh(); });
    reset.addEventListener('click', () => { color.value = '#131313'; runtime.setColor(color.value); updatePreview(); refresh(); });
    updatePreview();
    preview.textContent = 'Aperçu de la couleur de fond.';
    container.append(description, row, preview);
}
