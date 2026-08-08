const SETTINGS_BUBBLE_STORAGE_KEY = 'tm_t4_settings_bubble_enabled';
const DEBUG_MODE_STORAGE_KEY = 'tm_t4_debug_mode';
const SETTINGS_BUBBLE_ID = 'tm-t4-next-settings-bubble';
const STYLE_ID = 'tm-t4-next-settings-bubble-style';

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${SETTINGS_BUBBLE_ID} { position:fixed; top:50%; right:0; z-index:99980; width:42px; height:48px; transform:translateY(-50%); border:1px solid rgba(255,255,255,.16); border-right:0; border-radius:14px 0 0 14px; background:rgba(24,24,27,.96); box-shadow:0 8px 24px rgba(0,0,0,.4); color:#f4f4f5; font:22px/1 system-ui,sans-serif; cursor:pointer; transition:width 140ms ease,background 140ms ease; }
        #${SETTINGS_BUBBLE_ID}:hover, #${SETTINGS_BUBBLE_ID}:focus-visible { width:50px; background:rgba(63,63,70,.98); }
    `;
    document.head.append(style);
}

export function createGeneralSettings({ storage, platform, configuration, toast, openSettings }) {
    let started = false;
    const debugListeners = new Set();

    function isSettingsBubbleEnabled() {
        return storage.readBoolean(SETTINGS_BUBBLE_STORAGE_KEY, false);
    }

    function syncSettingsBubble() {
        const existing = document.getElementById(SETTINGS_BUBBLE_ID);
        const shouldDisplay = platform.isTr4kerPage() && isSettingsBubbleEnabled();
        if (!shouldDisplay) {
            existing?.remove();
            return;
        }
        if (!document.body) return;
        if (existing instanceof HTMLButtonElement) return;

        ensureStyle();
        const bubble = document.createElement('button');
        bubble.id = SETTINGS_BUBBLE_ID;
        bubble.type = 'button';
        bubble.textContent = '⚙';
        bubble.title = 'Ouvrir la configuration PimpMyShoutbox';
        bubble.setAttribute('aria-label', bubble.title);
        bubble.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openSettings();
        });
        document.body.append(bubble);
    }

    function setSettingsBubbleEnabled(enabled) {
        storage.writeBoolean(SETTINGS_BUBBLE_STORAGE_KEY, enabled);
        syncSettingsBubble();
    }

    function isDebugModeEnabled() {
        return storage.readBoolean(DEBUG_MODE_STORAGE_KEY, false);
    }

    function notifyDebugMode() {
        const enabled = isDebugModeEnabled();
        for (const listener of debugListeners) listener(enabled);
    }

    function setDebugModeEnabled(enabled) {
        storage.writeBoolean(DEBUG_MODE_STORAGE_KEY, enabled);
        notifyDebugMode();
    }

    function render(content) {
        content.replaceChildren();
        const title = document.createElement('h2');
        title.textContent = 'Général';
        content.append(title);

        const card = document.createElement('section');
        card.className = 'tm-t4-next-settings-card';
        const cardTitle = document.createElement('div');
        cardTitle.className = 'tm-t4-next-settings-card-title';
        cardTitle.textContent = 'Accès à la configuration';
        const toggleRow = document.createElement('label');
        toggleRow.className = 'tm-t4-next-settings-card-toggle';
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = isSettingsBubbleEnabled();
        toggle.addEventListener('change', () => setSettingsBubbleEnabled(toggle.checked));
        toggleRow.append(toggle, document.createTextNode('Garder une bulle ⚙ d’accès aux réglages'));
        const description = document.createElement('div');
        description.style.cssText = 'color:#a1a1aa;font-size:12px;line-height:1.5;';
        description.textContent = 'Une bulle sur le bord droit de l\'écran vous permet d\'acceder à la configuration.';
        card.append(cardTitle, toggleRow, description);
        content.append(card);

        const debugCard = document.createElement('section');
        debugCard.className = 'tm-t4-next-settings-card';
        const debugTitle = document.createElement('div');
        debugTitle.className = 'tm-t4-next-settings-card-title';
        debugTitle.textContent = 'Debug';
        const debugToggleRow = document.createElement('label');
        debugToggleRow.className = 'tm-t4-next-settings-card-toggle';
        const debugToggle = document.createElement('input');
        debugToggle.type = 'checkbox';
        debugToggle.checked = isDebugModeEnabled();
        debugToggle.style.accentColor = '#ef4444';
        debugToggle.addEventListener('change', () => setDebugModeEnabled(debugToggle.checked));
        debugToggleRow.append(debugToggle, document.createTextNode('Activer le mode debug'));
        const debugDescription = document.createElement('div');
        debugDescription.style.cssText = 'color:#a1a1aa;font-size:12px;line-height:1.5;';
        debugDescription.textContent = 'Les messages blacklistés restent visibles en rouge et des informations techniques sont affichées dans la console du navigateur.';
        debugCard.append(debugTitle, debugToggleRow, debugDescription);
        content.append(debugCard);

        const backupCard = document.createElement('section');
        backupCard.className = 'tm-t4-next-settings-card';
        const backupTitle = document.createElement('div');
        backupTitle.className = 'tm-t4-next-settings-card-title';
        backupTitle.textContent = 'Sauvegarde de configuration';
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.textContent = 'Exporter la config';
        exportButton.style.cssText = 'border:0;border-radius:8px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font-weight:650;';
        exportButton.addEventListener('click', () => {
            const result = configuration.download();
            toast.show(result.message, { error: !result.ok });
        });
        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.textContent = 'Importer une config';
        importButton.style.cssText = 'border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#3f3f46;color:#fff;padding:8px 10px;cursor:pointer;font-weight:650;';
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = 'application/json,.json';
        importInput.hidden = true;
        importButton.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async () => {
            const file = importInput.files?.[0];
            if (!file) return;
            try {
                const payload = JSON.parse(await file.text());
                if (!window.confirm('Importer cette sauvegarde remplacera les réglages actuels du script. Continuer ?')) return;
                const result = configuration.importPayload(payload);
                toast.show(result.message, { error: !result.ok });
            } catch {
                toast.show('Import impossible : fichier JSON invalide.', { error: true });
            } finally {
                importInput.value = '';
            }
        });
        actions.append(exportButton, importButton, importInput);
        const backupDescription = document.createElement('div');
        backupDescription.style.cssText = 'margin-top:8px;color:#a1a1aa;font-size:12px;line-height:1.5;';
        backupDescription.textContent = 'Sauvegarde les réglages, la blacklist et les positions mémorisées. Les clés API et les données de session ne sont jamais exportées.';
        backupCard.append(backupTitle, actions, backupDescription);
        content.append(backupCard);
    }

    function onStorage(event) {
        if (event.key === SETTINGS_BUBBLE_STORAGE_KEY) syncSettingsBubble();
        if (event.key === DEBUG_MODE_STORAGE_KEY) notifyDebugMode();
    }

    function onConfigurationImported() {
        syncSettingsBubble();
        notifyDebugMode();
    }

    return Object.freeze({
        tab: Object.freeze({ id: 'general', label: 'Général', type: 'general' }),
        render,
        isSettingsBubbleEnabled,
        setSettingsBubbleEnabled,
        isDebugModeEnabled,
        setDebugModeEnabled,
        subscribeToDebugMode(listener) {
            debugListeners.add(listener);
            return () => debugListeners.delete(listener);
        },
        refresh: syncSettingsBubble,
        start() {
            if (started) return;
            started = true;
            window.addEventListener('storage', onStorage);
            window.addEventListener(CONFIGURATION_IMPORTED_EVENT, onConfigurationImported);
            syncSettingsBubble();
        },
        stop() {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(CONFIGURATION_IMPORTED_EVENT, onConfigurationImported);
            started = false;
            document.getElementById(SETTINGS_BUBBLE_ID)?.remove();
        }
    });
}
import { CONFIGURATION_IMPORTED_EVENT } from './config-backup.js';
