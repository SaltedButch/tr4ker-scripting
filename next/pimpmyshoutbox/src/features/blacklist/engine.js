const HIDDEN_ATTRIBUTE = 'data-tm-t4-blacklist-hidden';
const DEBUG_ATTRIBUTE = 'data-tm-t4-blacklist-debug';

export function createBlacklistEngine({ platform, state, isDebugModeEnabled = () => false, onUpdate = () => {} }) {
    const originalDisplayByElement = new Map();
    const originalDebugStyleByElement = new Map();
    const processedElements = new Set();
    const countedElements = new WeakSet();
    const blockedCounts = new Map();

    function restore(messageElement) {
        if (!messageElement.hasAttribute(HIDDEN_ATTRIBUTE)) return;
        const originalDisplay = originalDisplayByElement.get(messageElement);
        if (originalDisplay) {
            messageElement.style.setProperty('display', originalDisplay.value, originalDisplay.priority);
        } else {
            messageElement.style.removeProperty('display');
        }
        originalDisplayByElement.delete(messageElement);
        messageElement.removeAttribute(HIDDEN_ATTRIBUTE);
    }

    function hide(messageElement) {
        if (!messageElement.hasAttribute(HIDDEN_ATTRIBUTE)) {
            originalDisplayByElement.set(messageElement, {
                value: messageElement.style.getPropertyValue('display'),
                priority: messageElement.style.getPropertyPriority('display')
            });
            messageElement.setAttribute(HIDDEN_ATTRIBUTE, 'true');
        }
        messageElement.style.setProperty('display', 'none', 'important');
    }

    function clearDebugStyle(messageElement) {
        if (!messageElement.hasAttribute(DEBUG_ATTRIBUTE)) return;
        const original = originalDebugStyleByElement.get(messageElement);
        for (const [property, value] of Object.entries(original?.styles || {})) {
            if (value.value) messageElement.style.setProperty(property, value.value, value.priority);
            else messageElement.style.removeProperty(property);
        }
        if (original?.title === null) messageElement.removeAttribute('title');
        else if (original) messageElement.setAttribute('title', original.title);
        originalDebugStyleByElement.delete(messageElement);
        messageElement.removeAttribute(DEBUG_ATTRIBUTE);
    }

    function showDebugStyle(messageElement, username) {
        if (!messageElement.hasAttribute(DEBUG_ATTRIBUTE)) {
            originalDebugStyleByElement.set(messageElement, {
                styles: Object.fromEntries(['background', 'outline'].map((property) => [property, {
                    value: messageElement.style.getPropertyValue(property),
                    priority: messageElement.style.getPropertyPriority(property)
                }])),
                title: messageElement.getAttribute('title')
            });
            messageElement.setAttribute(DEBUG_ATTRIBUTE, 'true');
        }
        messageElement.style.setProperty('background', 'rgba(255, 0, 0, .14)');
        messageElement.style.setProperty('outline', '1px solid rgba(255, 80, 80, .65)');
        messageElement.title = `Bloqué détecté : ${username}`;
    }

    function apply(message) {
        if (!message?.element) return false;
        processedElements.add(message.element);
        if (!message.normalizedUsername || !state.has(message.normalizedUsername)) {
            restore(message.element);
            clearDebugStyle(message.element);
            return false;
        }

        if (isDebugModeEnabled()) {
            restore(message.element);
            showDebugStyle(message.element, message.normalizedUsername);
        } else {
            clearDebugStyle(message.element);
            hide(message.element);
        }
        if (countedElements.has(message.element)) return false;
        countedElements.add(message.element);
        blockedCounts.set(
            message.normalizedUsername,
            (blockedCounts.get(message.normalizedUsername) || 0) + 1
        );
        onUpdate();
        return true;
    }

    function refresh() {
        for (const messageElement of platform.getMessages()) {
            apply(platform.getMessageDetails(messageElement));
        }
    }

    return Object.freeze({
        apply,
        refresh,
        getCounts() {
            return [...blockedCounts.entries()]
                .map(([username, count]) => ({ username, count }))
                .sort((left, right) => right.count - left.count || left.username.localeCompare(right.username, 'fr'));
        },
        getTotal() {
            return [...blockedCounts.values()].reduce((total, count) => total + count, 0);
        },
        resetCounts() {
            blockedCounts.clear();
            onUpdate();
        },
        destroy() {
            for (const messageElement of processedElements) {
                restore(messageElement);
                clearDebugStyle(messageElement);
            }
            processedElements.clear();
            originalDisplayByElement.clear();
            originalDebugStyleByElement.clear();
        }
    });
}
