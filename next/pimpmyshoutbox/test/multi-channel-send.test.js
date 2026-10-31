import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createFeatureRegistry } from '../src/core/feature-registry.js';
import { createStorage } from '../src/core/storage.js';
import { createTr4kerPlatform } from '../src/core/tr4ker-platform.js';
import feature from '../src/features/multi-channel-view/feature.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
const nativeChat = `
<div><aside><button aria-label="Retour"></button></aside><div class="chatArea">
  <div class="window"><header class="header"><div class="headerLeft"><span class="convIcon"></span>
    <div class="convTitleGroup"><div class="convTitleRow"><span class="convTitle">General</span></div></div>
  </div></header><div class="messageList"><div data-msg-id="1" class="message">
    <button class="msgAvatar"></button><div class="msgContent"><div class="msgMeta"><button class="msgSender">Alice</button><span class="msgTime"></span></div>
    <div class="msgBubble">Hello</div><div data-msg-actions><button></button></div></div>
  </div><div class="inputWrapper"><div class="inputArea"><div class="inputField"><textarea placeholder="Message dans #General"></textarea></div><button class="sendBtn">Envoyer</button></div></div></div>
</div></div>`;

async function harness(t, { connected = true, channelId = 7 } = {}) {
    const dom = new JSDOM(nativeChat, { url: 'https://tr4ker.net/communication' });
    const descriptors = new Map();
    for (const name of ['window', 'document', 'location', 'HTMLElement', 'HTMLButtonElement', 'HTMLTextAreaElement', 'HTMLStyleElement', 'Element', 'Node', 'Event', 'MouseEvent']) {
        descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
        Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    }
    const sockets = [];
    const errors = [];
    class FakeWebSocket extends dom.window.EventTarget {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSED = 3;
        constructor() { super(); this.readyState = FakeWebSocket.CONNECTING; this.sent = []; sockets.push(this); }
        open() { this.readyState = FakeWebSocket.OPEN; this.dispatchEvent(new dom.window.Event('open')); }
        send(value) {
            if (this.readyState !== FakeWebSocket.OPEN) throw new Error('Socket closed');
            const packet = JSON.parse(value);
            this.sent.push(packet);
            // Simule le refus d'un identifiant numérique sérialisé en texte.
            if (packet.conv_id !== undefined && typeof packet.conv_id !== typeof channelId) {
                this.receive({ type: 'error', message: 'Invalid conversation ID type' });
            }
        }
        receive(packet) { this.dispatchEvent(new dom.window.MessageEvent('message', { data: JSON.stringify(packet) })); }
        close() { this.readyState = FakeWebSocket.CLOSED; this.dispatchEvent(new dom.window.Event('close')); }
    }
    for (const [name, value] of Object.entries({ WebSocket: FakeWebSocket, fetch: async (url) => {
        let payload;
        if (url === '/api/channels') payload = { channels: [{ id: 3, slug: 'general', name: 'General', is_member: true }, { id: channelId, slug: 'secondary', name: 'Secondary', is_member: true }] };
        else if (url === '/api/me') payload = { id: 1 };
        else if (url === `/api/conversations/${channelId}/messages`) payload = { messages: [{ id: 100, sender_id: 2, sender: 'Alice', body: 'Hello', created_at: '2026-10-31T12:00:00Z' }] };
        else throw new Error(`Unexpected request: ${url}`);
        return { ok: true, json: async () => payload };
    } })) {
        descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
        Object.defineProperty(globalThis, name, { configurable: true, value });
    }
    let now = 0;
    let timerId = 0;
    const timers = new Map();
    const intervals = new Map();
    dom.window.setTimeout = (callback, delay) => { timers.set(++timerId, { callback, at: now + delay }); return timerId; };
    dom.window.clearTimeout = (id) => timers.delete(id);
    dom.window.setInterval = (callback) => { intervals.set(++timerId, callback); return timerId; };
    dom.window.clearInterval = (id) => intervals.delete(id);
    const storage = createStorage(dom.window.localStorage);
    storage.set('tm-t4-next:feature:multi-channel-view:enabled', 'true');
    storage.writeJson('tm_t4_multi_channel_view_open_ids', [String(channelId)]);
    const platform = createTr4kerPlatform();
    const registry = createFeatureRegistry({
        appId: 'tm-t4-next', getPage: platform.getPage,
        logger: { warn() {}, error(...args) { throw args.at(-1); } },
        services: { storage, platform, messages: { refresh() {} }, toast: { show(message, options) { if (options?.error) errors.push(message); } } }
    });
    registry.register(feature);
    t.after(async () => {
        registry.stop();
        await flush();
        dom.window.close();
        for (const [name, descriptor] of descriptors) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    });
    registry.start();
    if (connected) sockets[0].open();
    await flush();
    const pane = dom.window.document.querySelector('[data-tm-t4-multi-channel-pane]');
    assert.ok(pane, 'secondary pane mounted through the actual feature lifecycle');
    return {
        pane, errors, sockets, registry,
        input: pane.querySelector('textarea'),
        button: pane.querySelector('button[aria-label="Envoyer"]'),
        sends: () => sockets.flatMap((socket) => socket.sent).filter((packet) => packet.type === 'msg.send'),
        ack(body, extra = {}) { sockets.at(-1).receive({ type: 'msg.received', conv_id: channelId, sender_id: 1, sender: 'Me', id: 101, body, ...extra }); },
        key(options = {}) { pane.querySelector('textarea').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options })); },
        advance(ms) { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); } },
        timers, intervals
    };
}

test('mosaic sends numeric conversation IDs and clears only after its own server echo', async (t) => {
    const h = await harness(t);
    h.input.value = 'Message mosaïque';
    h.button.click();
    await flush();
    assert.deepEqual(h.sends(), [{ type: 'msg.send', conv_id: 7, body: 'Message mosaïque' }]);
    assert.equal(h.input.value, 'Message mosaïque');
    assert.equal(h.button.disabled, true);
    assert.deepEqual(h.errors, []);
    h.ack('Message mosaïque', { sender_id: 2 });
    h.ack('Message mosaïque', { conv_id: 3 });
    await flush();
    assert.equal(h.input.value, 'Message mosaïque');
    h.ack('Message mosaïque');
    await flush();
    assert.equal(h.input.value, '');
    assert.equal(h.button.disabled, false);
    assert.equal(h.input.readOnly, false);
    assert.ok(h.pane.textContent.includes('Message mosaïque'));
});

test('Enter sends once, Shift+Enter and IME composition do not send', async (t) => {
    const h = await harness(t);
    h.input.value = 'Test clavier';
    h.key({ shiftKey: true }); h.key({ isComposing: true });
    await flush();
    assert.equal(h.sends().length, 0);
    h.key(); h.key();
    await flush();
    assert.equal(h.sends().length, 1);
    h.ack('Test clavier');
    await flush();
    assert.equal(h.input.value, '');
});

test('server rejections preserve the draft and reply context, allowing an explicit retry', async (t) => {
    const h = await harness(t);
    h.pane.querySelector('button[aria-label="Répondre"]').click();
    h.input.value = 'Réponse'; h.button.click();
    await flush();
    assert.equal(h.sends()[0].parent_id, 100);
    h.sockets[0].receive({ type: 'error', message: 'Vous ne pouvez pas écrire dans ce canal.' });
    await flush();
    assert.equal(h.input.value, 'Réponse');
    assert.equal(h.pane.querySelector('.tm-t4-mcv-reply-banner').hidden, false);
    assert.equal(h.button.disabled, false);
    assert.match(h.errors[0], /ne pouvez pas écrire/);
    h.button.click();
    await flush();
    assert.equal(h.sends()[1].parent_id, 100);
    h.ack('Réponse', { parent: { id: 100 } });
    await flush();
    assert.equal(h.input.value, '');
    assert.equal(h.pane.querySelector('.tm-t4-mcv-reply-banner').hidden, true);
});

test('unconfirmed sends retain drafts without replaying after a timeout', async (t) => {
    const h = await harness(t);
    h.input.value = 'Sans confirmation'; h.button.click();
    await flush();
    h.advance(10_000);
    await flush();
    assert.equal(h.input.value, 'Sans confirmation');
    assert.equal(h.button.disabled, false);
    assert.match(h.errors[0], /non confirmé/);
    assert.equal(h.sends().length, 1);
});

test('disconnected sockets retain drafts and do not queue a delayed message', async (t) => {
    const h = await harness(t, { connected: false });
    h.input.value = 'Connexion en attente'; h.button.click();
    await flush();
    assert.equal(h.input.value, 'Connexion en attente');
    assert.match(h.errors[0], /Connexion au chat indisponible/);
    h.sockets[0].open();
    assert.equal(h.sends().length, 0);
    h.button.click();
    await flush();
    assert.equal(h.sends().length, 1);
    h.sockets[0].close();
    await flush();
    assert.equal(h.input.value, 'Connexion en attente');
    assert.match(h.errors.at(-1), /interrompue/);
    h.advance(1500); h.sockets.at(-1).open();
    assert.equal(h.sends().length, 1);
});

test('preserves textual IDs when that is what the API supplies', async (t) => {
    const h = await harness(t, { channelId: 'channel-secondary' });
    h.input.value = 'Identifiant texte'; h.button.click();
    await flush();
    assert.equal(h.sends()[0].conv_id, 'channel-secondary');
    assert.deepEqual(h.errors, []);
    h.ack('Identifiant texte');
    await flush();
    assert.equal(h.input.value, '');
});

test('closing the feature cancels pending work and reconnect timers', async (t) => {
    const h = await harness(t);
    h.input.value = 'Fermeture'; h.button.click();
    await flush();
    h.registry.setEnabled(feature.id, false);
    await flush();
    assert.equal(h.timers.size, 0);
    assert.equal(h.intervals.size, 0);
    assert.equal(h.pane.isConnected, false);
    assert.deepEqual(h.errors, []);
});
