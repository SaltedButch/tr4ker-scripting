/**
 * Construit le panneau de réglages de la feature « Adult Mode ».
 *
 * @module src/features/adult-mode/settings
 */
function createButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'border:0;border-radius:8px;background:#991b1b;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700;';
    return button;
}

/**
 * Rend l'interface produite par « renderAdultModeSettings ».
 *
 * @function renderAdultModeSettings
 */
export function renderAdultModeSettings(container, { context, refresh }) {
    const runtime = context?.adultMode;
    if (!runtime) {
        container.textContent = 'Active la feature pour gérer ce réglage.';
        return;
    }

    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Choisissez si le contenu adulte peut être affiché sur votre compte.';
    const status = document.createElement('div');
    status.style.cssText = 'margin-top:10px;font-size:12px;color:#d4d4d8;';
    const action = createButton('Chargement…');
    action.disabled = true;
    action.style.marginTop = '10px';
    container.append(description, status, action);

    async function sync() {
        action.disabled = true;
        status.textContent = 'Lecture du réglage…';
        try {
            const enabled = await runtime.getEnabled();
            status.textContent = enabled ? 'Mode adulte actuellement activé.' : 'Mode adulte actuellement désactivé.';
            action.textContent = enabled ? 'Désactiver le mode adulte' : 'Activer le mode adulte';
            action.style.background = enabled ? '#3f3f46' : '#991b1b';
            action.disabled = false;
        } catch (error) {
            status.textContent = `Impossible de lire le réglage : ${error.message || 'erreur inconnue.'}`;
            status.style.color = '#fca5a5';
            action.textContent = 'Réessayer';
            action.disabled = false;
        }
    }

    action.addEventListener('click', async () => {
        action.disabled = true;
        status.style.color = '#d4d4d8';
        status.textContent = 'Mise à jour du réglage…';
        try {
            const enabled = await runtime.toggle();
            status.textContent = enabled ? 'Mode adulte activé. Rechargement…' : 'Mode adulte désactivé. Rechargement…';
            refresh();
        } catch (error) {
            status.textContent = `Impossible de modifier le réglage : ${error.message || 'erreur inconnue.'}`;
            status.style.color = '#fca5a5';
            action.disabled = false;
        }
    });
    void sync();
}
