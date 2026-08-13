export function createMessageStream({ platform, logger = console }) {
    const subscribers = new Set();
    let observers = [];
    let observedRoots = [];

    function notify(messageElement, source) {
        const message = platform.getMessageDetails(messageElement);
        if (!message) return;
        for (const subscriber of subscribers) {
            try {
                subscriber(message, { source });
            } catch (error) {
                logger.error('[PimpMyShoutbox Next] Message subscriber failed.', error);
            }
        }
    }

    function collect(node) {
        if (!(node instanceof HTMLElement)) return [];
        const selector = `${platform.messageSelector}, [data-tm-t4-multi-channel-message-id]`;
        const candidates = platform.isMessage(node)
            ? [node, ...node.querySelectorAll(selector)]
            : [...node.querySelectorAll(selector)];
        return candidates.filter(platform.isMessage);
    }

    function scan() {
        for (const root of observedRoots) {
            for (const messageElement of platform.getMessages(root)) notify(messageElement, 'scan');
        }
    }

    function refresh({ scan: shouldScan = true } = {}) {
        const nextRoots = [platform.getChatMessagesRoot(), ...document.querySelectorAll('[data-tm-t4-multi-channel-pane] [class*="messageList"]')]
            .filter((root) => root instanceof HTMLElement);
        if (nextRoots.length === observedRoots.length && nextRoots.every((root, index) => root === observedRoots[index])) {
            if (nextRoots.length && shouldScan) scan();
            return;
        }

        observers.forEach((observer) => observer.disconnect());
        observers = [];
        observedRoots = nextRoots;
        for (const root of observedRoots) {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        for (const messageElement of collect(node)) notify(messageElement, 'mutation');
                    }
                }
            });
            observer.observe(root, { childList: true, subtree: true });
            observers.push(observer);
        }
        if (shouldScan) scan();
    }

    return Object.freeze({
        subscribe(callback, { replay = true } = {}) {
            if (typeof callback !== 'function') throw new Error('A message subscriber must be a function.');
            subscribers.add(callback);
            if (replay && observedRoots.length) {
                for (const root of observedRoots) for (const messageElement of platform.getMessages(root)) {
                    try { callback(platform.getMessageDetails(messageElement), { source: 'replay' }); }
                    catch (error) { logger.error('[PimpMyShoutbox Next] Message subscriber failed.', error); }
                }
            }
            return () => subscribers.delete(callback);
        },
        refresh,
        stop() {
            observers.forEach((observer) => observer.disconnect());
            observers = [];
            observedRoots = [];
            subscribers.clear();
        }
    });
}
