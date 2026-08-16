/**
 * Construit l'interface de réglages des notifications de messages privés.
 *
 * @module src/features/private-messages/settings
 */
/**
 * Crée une ligne de réglage à case à cocher.
 *
 * @function makeLabel
 * @param {string} text Libellé affiché.
 * @returns {{label: HTMLLabelElement, input: HTMLInputElement}} Ligne et contrôle associés.
 */
function makeLabel(text) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;color:#d4d4d8;cursor:pointer;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    label.append(input, document.createTextNode(text));
    return { label, input };
}

/**
 * Rend le panneau de configuration des MP.
 *
 * @param {HTMLElement} container Conteneur fourni par la modale de réglages.
 * @param {{isEnabled: function, setEnabled: function, refresh: function, toast: function}} runtime API de la feature.
 * @returns {void}
 */
export function renderPrivateMessageSettings(container, runtime) {
    if (!runtime) {
        container.textContent = 'Active la feature pour configurer les notifications de MP.';
        return;
    }

    const toggle = makeLabel('Notifier les nouveaux messages privés');
    toggle.input.checked = runtime.isEnabled();
    toggle.input.addEventListener('change', () => {
        runtime.setEnabled(toggle.input.checked);
    });
    container.append(toggle.label);

    const explanation = document.createElement('p');
    explanation.textContent = 'La liste des conversations privées est rafraîchie dès qu’un MP arrive, même lorsque Tr4ker ne le fait pas nativement. Une notification permet aussi d’ouvrir directement la conversation.';
    explanation.style.cssText = 'margin:4px 0 10px;color:#a1a1aa;font-size:11px;line-height:1.45;';
    container.append(explanation);

    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = 'Actualiser la messagerie maintenant';
    refresh.style.cssText = 'border:0;border-radius:7px;background:#1d4ed8;color:#fff;padding:7px 10px;cursor:pointer;font-weight:700;font-size:11px;';
    refresh.addEventListener('click', async () => {
        refresh.disabled = true;
        try {
            await runtime.refresh();
            runtime.toast('La liste des messages privés a été actualisée.');
        } finally {
            refresh.disabled = false;
        }
    });
    container.append(refresh);
}
