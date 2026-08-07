import { createFeatureShortcutApi } from './shortcuts.js';

function createCleanupBag() {
    const cleanups = new Set();

    return {
        add(cleanup) {
            if (typeof cleanup !== 'function') return () => {};
            cleanups.add(cleanup);
            return () => cleanups.delete(cleanup);
        },
        run() {
            for (const cleanup of [...cleanups].reverse()) {
                try {
                    cleanup();
                } catch (error) {
                    console.error('[PimpMyShoutbox Next] Cleanup failed.', error);
                }
            }
            cleanups.clear();
        }
    };
}

export function createFeatureContext({ appId, feature, getPage, logger, services = {} }) {
    const cleanupBag = createCleanupBag();
    const enabledStorageKey = `${appId}:feature:${feature.id}:enabled`;

    const context = {
        feature,
        get page() {
            return getPage();
        },
        logger,
        platform: services.platform,
        storage: services.storage,
        http: services.http,
        input: services.input,
        text: services.text,
        ui: { toast: services.toast },
        isEnabled() {
            const storedValue = services.storage.get(enabledStorageKey);
            return storedValue === null ? feature.defaultEnabled !== false : storedValue === 'true';
        },
        setEnabled(enabled) {
            services.storage.set(enabledStorageKey, String(Boolean(enabled)));
        },
        on(target, eventName, handler, options) {
            target.addEventListener(eventName, handler, options);
            cleanupBag.add(() => target.removeEventListener(eventName, handler, options));
        },
        observe(target, options, callback) {
            const observer = new MutationObserver(callback);
            observer.observe(target, options);
            cleanupBag.add(() => observer.disconnect());
            return observer;
        },
        every(delayMs, callback) {
            const intervalId = window.setInterval(callback, delayMs);
            cleanupBag.add(() => window.clearInterval(intervalId));
            return intervalId;
        },
        later(delayMs, callback) {
            const timeoutId = window.setTimeout(callback, delayMs);
            cleanupBag.add(() => window.clearTimeout(timeoutId));
            return timeoutId;
        },
        addCleanup(cleanup) {
            return cleanupBag.add(cleanup);
        },
        ensureStyle(styleId, cssText) {
            let style = document.getElementById(styleId);
            if (!(style instanceof HTMLStyleElement)) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.append(style);
                cleanupBag.add(() => style.remove());
            }
            style.textContent = cssText;
            return style;
        },
        cleanup() {
            cleanupBag.run();
        }
    };

    context.shortcuts = createFeatureShortcutApi({
        feature,
        addListener: (...args) => context.on(...args)
    });
    context.messages = {
        subscribe(callback, options) {
            const unsubscribe = services.messages.subscribe(callback, options);
            cleanupBag.add(unsubscribe);
            return unsubscribe;
        }
    };

    return context;
}
