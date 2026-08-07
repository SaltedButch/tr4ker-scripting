import { createChatInputService } from './chat-input.js';
import { createFeatureRegistry } from './feature-registry.js';
import { createHttpClient } from './http.js';
import { createMessageStream } from './message-stream.js';
import { createRouteWatcher } from './route-watcher.js';
import { createStorage } from './storage.js';
import * as text from './text.js';
import { createToastService } from './toast.js';
import { createTr4kerPlatform } from './tr4ker-platform.js';

export function createApplication({ appId, logger = console }) {
    const platform = createTr4kerPlatform();
    const storage = createStorage();
    const messages = createMessageStream({ platform, logger });
    const services = Object.freeze({
        platform,
        storage,
        messages,
        http: createHttpClient(),
        input: createChatInputService(platform),
        text,
        toast: createToastService()
    });
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
    const routeWatcher = createRouteWatcher({
        getRouteKey,
        onRouteChange: () => {
            messages.refresh();
            registry.refresh();
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
            routeWatcher.start();
        },
        stop() {
            routeWatcher.stop();
            registry.stop();
            messages.stop();
            services.toast.destroy();
        }
    };
}
