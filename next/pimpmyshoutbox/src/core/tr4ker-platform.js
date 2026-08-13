import { normalizeComparableText, normalizeName } from './text.js';

const HOSTNAME = 'tr4ker.net';
const CHAT_INPUT_SELECTOR = 'textarea[placeholder^="Message dans"]';
const MESSAGE_SELECTOR = '[data-msg-id]';
const SECONDARY_MESSAGE_SELECTOR = '[data-tm-t4-multi-channel-message-id]';
const SECONDARY_PANE_SELECTOR = '[data-tm-t4-multi-channel-pane]';
const SECONDARY_INPUT_SELECTOR = 'textarea[data-tm-t4-multi-channel-input][data-tm-t4-multi-channel-input-active="1"]';
const MESSAGE_ROOT_SELECTOR = '[class*="messageList"]';

function isHtmlElement(value) {
    return value instanceof HTMLElement;
}

function isChatInputCandidate(element) {
    if (!isHtmlElement(element) || element.getAttribute('aria-hidden') === 'true') return false;
    if (element instanceof HTMLInputElement && (element.type !== 'text' || element.disabled)) return false;
    return !(element instanceof HTMLTextAreaElement && element.disabled);
}

export function createTr4kerPlatform() {
    const isTr4kerPage = () => location.hostname === HOSTNAME || location.hostname.endsWith(`.${HOSTNAME}`);
    const isChatPage = () => isTr4kerPage() && (location.pathname === '/communication' || location.pathname.startsWith('/communication/'));
    const isWikiPath = () => isTr4kerPage() && (location.pathname === '/wiki' || location.pathname.startsWith('/wiki/'));

    function getWikiEditorInput() {
        if (!isWikiPath()) return null;
        return [...document.querySelectorAll('textarea[placeholder]')].find((textarea) => (
            textarea instanceof HTMLTextAreaElement
            && /contenu\s+de\s+l[’']article/i.test(textarea.placeholder)
            && isChatInputCandidate(textarea)
        )) || null;
    }

    function getPage() {
        if (isChatPage()) return 'chat';
        if (getWikiEditorInput()) return 'wiki';
        return 'other';
    }

    function getChatInput() {
        const wikiEditor = getWikiEditorInput();
        if (wikiEditor) return wikiEditor;
        const activeSecondaryInput = document.querySelector(SECONDARY_INPUT_SELECTOR);
        if (isChatInputCandidate(activeSecondaryInput)) return activeSecondaryInput;
        const input = document.querySelector(CHAT_INPUT_SELECTOR);
        return isChatInputCandidate(input) ? input : null;
    }

    function isMessage(element) {
        return isHtmlElement(element)
            && element.matches(`${MESSAGE_SELECTOR}, ${SECONDARY_MESSAGE_SELECTOR}`)
            && Boolean(element.querySelector('[class*="msgBubble"]'));
    }

    function getChatMessagesRoot() {
        if (!isChatPage()) return null;
        const stableRoot = [...document.querySelectorAll(MESSAGE_ROOT_SELECTOR)]
            .find((candidate) => !candidate.closest(SECONDARY_PANE_SELECTOR));
        if (isHtmlElement(stableRoot)) return stableRoot;

        const firstMessage = document.querySelector(MESSAGE_SELECTOR);
        if (!isHtmlElement(firstMessage)) return null;
        let ancestor = firstMessage.parentElement;
        while (ancestor && ancestor !== document.body) {
            if (ancestor.querySelectorAll(MESSAGE_SELECTOR).length > 1) return ancestor;
            ancestor = ancestor.parentElement;
        }
        return firstMessage.parentElement;
    }

    function getChatSidebarLayout() {
        if (!isChatPage()) return null;

        const sidebar = [...document.querySelectorAll('aside')].find((candidate) => {
            const parent = candidate.parentElement;
            if (!isHtmlElement(parent) || !candidate.querySelector('button[aria-label="Retour"]')) return false;
            return [...parent.children].some((child) => (
                isHtmlElement(child) && [...child.classList].some((className) => className.includes('chatArea'))
            ));
        });
        if (!isHtmlElement(sidebar) || !isHtmlElement(sidebar.parentElement)) return null;

        const chatArea = [...sidebar.parentElement.children].find((child) => (
            isHtmlElement(child) && [...child.classList].some((className) => className.includes('chatArea'))
        ));
        return isHtmlElement(chatArea) ? { sidebar, chatArea } : null;
    }

    function getMessages(root) {
        const roots = isHtmlElement(root)
            ? [root]
            : [getChatMessagesRoot(), ...document.querySelectorAll(`${SECONDARY_PANE_SELECTOR} [class*="messageList"]`)];
        const candidates = new Set();
        for (const candidateRoot of roots) {
            if (!isHtmlElement(candidateRoot)) continue;
            if (candidateRoot.matches(`${MESSAGE_SELECTOR}, ${SECONDARY_MESSAGE_SELECTOR}`)) candidates.add(candidateRoot);
            candidateRoot.querySelectorAll(`${MESSAGE_SELECTOR}, ${SECONDARY_MESSAGE_SELECTOR}`).forEach((message) => candidates.add(message));
        }
        return [...candidates].filter(isMessage);
    }

    function getDirectUsername(messageElement) {
        if (!isMessage(messageElement)) return '';
        return String(messageElement.querySelector('[class*="msgSender"]')?.textContent || '').trim();
    }

    function isGroupedMessage(messageElement) {
        return isMessage(messageElement) && (
            messageElement.classList.contains('tm-t4-mcv-grouped')
            ||
            /(?:^|\s)[^\s]*grouped[^\s]*(?:\s|$)/i.test(messageElement.className)
            || isHtmlElement(messageElement.querySelector(':scope > [class*="msgAvatarSpacer"]'))
        );
    }

    function getMessageUsername(messageElement) {
        const directUsername = getDirectUsername(messageElement);
        if (directUsername) return directUsername;
        if (!isGroupedMessage(messageElement)) return '';

        let previous = messageElement.previousElementSibling;
        while (isMessage(previous)) {
            const previousUsername = getDirectUsername(previous);
            if (previousUsername) return previousUsername;
            if (!isGroupedMessage(previous)) return '';
            previous = previous.previousElementSibling;
        }
        return '';
    }

    function getCurrentChatContext() {
        if (!isChatPage()) return null;
        const header = document.querySelector('[class*="convTitleGroup"] [class*="convTitleRow"], [class*="convTitleRow"]');
        const title = String(header?.textContent || '').trim();
        const conversationId = new URLSearchParams(location.search).get('conv');
        const activeSection = document.querySelector('[class*="navItem"][class*="active"]')?.closest('section');
        const sectionLabel = normalizeComparableText(activeSection?.querySelector('[class*="sectionLabelText"]')?.textContent || '');
        const type = sectionLabel === 'messages prives' ? 'private' : 'channel';
        const name = title || (conversationId ? `conversation-${conversationId}` : 'conversation');
        return { type, name, key: `${type}:${normalizeComparableText(name)}` };
    }

    function getMessageDetails(messageElement) {
        if (!isMessage(messageElement)) return null;
        const text = String(messageElement.querySelector('[class*="msgBubble"]')?.textContent || '').trim();
        const timestamp = String(messageElement.querySelector('[class*="msgTime"]')?.textContent || '').trim();
        const replyAuthor = String(messageElement.querySelector('[class*="quoteAuthor"]')?.textContent || '').trim();
        const replyText = String(messageElement.querySelector('[class*="quoteBody"]')?.textContent || '').trim();
        return {
            element: messageElement,
            id: messageElement.getAttribute('data-msg-id') || messageElement.getAttribute('data-tm-t4-multi-channel-message-id') || '',
            username: getMessageUsername(messageElement),
            normalizedUsername: normalizeName(getMessageUsername(messageElement)),
            text,
            timestamp,
            conversationId: messageElement.closest(SECONDARY_PANE_SELECTOR)?.getAttribute('data-tm-t4-multi-channel-pane') || '',
            isSecondary: Boolean(messageElement.closest(SECONDARY_PANE_SELECTOR)),
            replyText: [replyAuthor, replyText].filter(Boolean).join(' : ')
        };
    }

    function findMessageElement(target) {
        let current = target instanceof HTMLElement ? target : null;
        while (current && current !== document.body) {
            if (isMessage(current)) return current;
            current = current.parentElement;
        }
        return null;
    }

    return Object.freeze({
        hostname: HOSTNAME,
        messageSelector: MESSAGE_SELECTOR,
        isTr4kerPage,
        isChatPage,
        isWikiPath,
        isToolbarSupportedPage: () => isChatPage() || Boolean(getWikiEditorInput()),
        getPage,
        getWikiEditorInput,
        getChatInput,
        isChatInputCandidate,
        isMessage,
        isGroupedMessage,
        getChatMessagesRoot,
        getChatSidebarLayout,
        getMessages,
        findMessageElement,
        getCurrentChatContext,
        getMessageDetails
    });
}
