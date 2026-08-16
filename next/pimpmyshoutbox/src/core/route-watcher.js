/**
 * Détecte les changements de route dans l'application monopage.
 *
 * @module src/core/route-watcher
 */
export function createRouteWatcher({ onRouteChange, onTick = () => {}, getRouteKey = () => location.href }) {
    let running = false;
    let lastRouteKey = '';
    let originalPushState = null;
    let originalReplaceState = null;
    let pollId = null;

    const check = () => {
        const routeKey = getRouteKey();
        if (routeKey !== lastRouteKey) {
            lastRouteKey = routeKey;
            onRouteChange();
        }
        onTick();
    };

    const onPopState = () => check();

    return {
        start() {
            if (running) return;
            running = true;
            lastRouteKey = getRouteKey();
            originalPushState = history.pushState;
            originalReplaceState = history.replaceState;
            history.pushState = function (...args) {
                const result = originalPushState.apply(this, args);
                queueMicrotask(check);
                return result;
            };
            history.replaceState = function (...args) {
                const result = originalReplaceState.apply(this, args);
                queueMicrotask(check);
                return result;
            };
            window.addEventListener('popstate', onPopState);
            pollId = window.setInterval(check, 500);
        },
        stop() {
            if (!running) return;
            running = false;
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            window.removeEventListener('popstate', onPopState);
            window.clearInterval(pollId);
            pollId = null;
        }
    };
}
