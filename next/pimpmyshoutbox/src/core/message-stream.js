export function createMessageStream({ platform, logger = console }) {
    const subscribers = new Set();
    let observer = null;
    let observedRoot = null;

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
        const candidates = platform.isMessage(node)
            ? [node, ...node.querySelectorAll(platform.messageSelector)]
            : [...node.querySelectorAll(platform.messageSelector)];
        return candidates.filter(platform.isMessage);
    }

    function scan() {
        for (const messageElement of platform.getMessages(observedRoot)) notify(messageElement, 'scan');
    }

    function refresh({ scan: shouldScan = true } = {}) {
        const nextRoot = platform.getChatMessagesRoot();
        if (nextRoot === observedRoot) {
            if (nextRoot && shouldScan) scan();
            return;
        }

        observer?.disconnect();
        observer = null;
        observedRoot = nextRoot;
        if (!observedRoot) return;

        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    for (const messageElement of collect(node)) notify(messageElement, 'mutation');
                }
            }
        });
        observer.observe(observedRoot, { childList: true, subtree: true });
        if (shouldScan) scan();
    }

    return Object.freeze({
        subscribe(callback, { replay = true } = {}) {
            if (typeof callback !== 'function') throw new Error('A message subscriber must be a function.');
            subscribers.add(callback);
            if (replay && observedRoot) {
                for (const messageElement of platform.getMessages(observedRoot)) {
                    try {
                        callback(platform.getMessageDetails(messageElement), { source: 'replay' });
                    } catch (error) {
                        logger.error('[PimpMyShoutbox Next] Message subscriber failed.', error);
                    }
                }
            }
            return () => subscribers.delete(callback);
        },
        refresh,
        stop() {
            observer?.disconnect();
            observer = null;
            observedRoot = null;
            subscribers.clear();
        }
    });
}
