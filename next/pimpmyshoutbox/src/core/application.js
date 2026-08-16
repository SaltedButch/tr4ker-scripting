/**
 * Assemble les services partagés et contrôle le cycle de vie de l'application.
 *
 * @module src/core/application
 */
import { createChatInputService } from './chat-input.js';
import { createConfigurationBackup } from './config-backup.js';
import { createFeatureRegistry } from './feature-registry.js';
import { createGradeService } from './grades.js';
import { createHttpClient } from './http.js';
import { createMessageStream } from './message-stream.js';
import { createMediaToolbar } from './media-toolbar.js';
import { createRouteWatcher } from './route-watcher.js';
import { createGeneralSettings } from './settings-general.js';
import { createSettingsModal } from './settings-modal.js';
import { createStorage } from './storage.js';
import * as text from './text.js';
import { createToastService } from './toast.js';
import { createTr4kerPlatform } from './tr4ker-platform.js';

/**
 * Crée l'API publique « createApplication ».
 *
 * @function createApplication
 */
export function createApplication({ appId, logger = console }) {
    const platform = createTr4kerPlatform();
    const storage = createStorage();
    const messages = createMessageStream({ platform, logger });
    const services = {
        platform,
        storage,
        messages,
        http: createHttpClient(),
        input: createChatInputService(platform),
        mediaToolbar: createMediaToolbar({ platform, storage }),
        grades: createGradeService({ storage }),
        text,
        toast: createToastService()
    };
    const getRouteKey = () => [
        location.href,
        platform.getPage(),
        platform.getCurrentChatContext()?.key || ''
    ].join('|');
    const registry = createFeatureRegistry({
        appId,
        getPage: platform.getPage,
        logger,
        services
    });
    services.configuration = createConfigurationBackup({ storage });
    services.generalSettings = createGeneralSettings({
        storage,
        platform,
        configuration: services.configuration,
        toast: services.toast,
        openSettings: () => services.settings?.open()
    });
    services.settings = createSettingsModal({
        registry,
        storage,
        globalSettings: services.generalSettings,
        logger
    });
    Object.freeze(services);
    const routeWatcher = createRouteWatcher({
        getRouteKey,
        onRouteChange: () => {
            messages.refresh();
            registry.refresh();
            services.generalSettings.refresh();
        },
        onTick: () => messages.refresh({ scan: false })
    });

    return {
        features: registry,
        core: services,
        start() {
            messages.refresh();
            registry.start();
            registry.refresh();
            services.settings.start();
            services.generalSettings.start();
            routeWatcher.start();
        },
        stop() {
            routeWatcher.stop();
            services.generalSettings.stop();
            services.settings.stop();
            registry.stop();
            messages.stop();
            services.toast.destroy();
            services.mediaToolbar.destroy();
        }
    };
}
