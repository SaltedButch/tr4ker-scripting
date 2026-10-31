import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createConfigurationBackup } from '../src/core/config-backup.js';
import { createFeatureRegistry } from '../src/core/feature-registry.js';
import { createTr4kerPlatform } from '../src/core/tr4ker-platform.js';
import { createStorage } from '../src/core/storage.js';
import feature from '../src/features/torrent-image-fallback/feature.js';
import { getOriginalImageUrl } from '../src/features/torrent-image-fallback/image-proxy.js';
import { DIRECT_IMAGES_STORAGE_KEY } from '../src/features/torrent-image-fallback/settings.js';

const PAGE = 'https://tr4ker.net/torrent/example';
const ENABLED_KEY = 'tm-t4-next:feature:torrent-image-fallback:enabled';
const proxy = (url = 'https://images.example/screenshot.jpg') => `/api/proxy/image?url=${encodeURIComponent(url)}`;

function harness(t, path = '/torrent/example') {
    const dom = new JSDOM('<main></main><aside></aside>', { url: `https://tr4ker.net${path}` });
    const descriptors = new Map();
    let now = 0;
    for (const name of ['window', 'document', 'location', 'HTMLElement', 'HTMLImageElement', 'HTMLStyleElement', 'Element', 'MutationObserver', 'CustomEvent']) {
        descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
        Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    }
    descriptors.set('performance', Object.getOwnPropertyDescriptor(globalThis, 'performance'));
    Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => now } });
    const timers = new Map();
    let timerId = 0;
    dom.window.setInterval = (callback) => { timers.set(++timerId, callback); return timerId; };
    dom.window.clearInterval = (id) => timers.delete(id);
    const storage = createStorage(dom.window.localStorage);
    const platform = createTr4kerPlatform();
    const registry = createFeatureRegistry({ appId: 'tm-t4-next', getPage: platform.getPage, logger: console, services: { storage, platform } });
    registry.register(feature);
    t.after(() => {
        registry.stop();
        dom.window.close();
        for (const [name, descriptor] of descriptors) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    });
    return {
        registry, platform, storage, timers,
        start: () => registry.start(),
        advance(ms) { now += ms; for (const callback of timers.values()) callback(); },
        navigate(path) { dom.window.history.pushState(null, '', path); registry.refresh(); },
        panel: () => document.getElementById('tm-t4-next-torrent-image-fallback'),
        direct: () => document.querySelector('[data-tm-image-fallback-direct]'),
        restore: () => document.querySelector('[data-tm-image-fallback-restore]'),
        image({ source = proxy(), complete = false, width = 0, lazy = false, visible = true, parent = document.querySelector('main') } = {}) {
            const image = document.createElement('img');
            const state = { complete, width, visible };
            Object.defineProperties(image, { complete: { get: () => state.complete }, naturalWidth: { get: () => state.width } });
            image.loading = lazy ? 'lazy' : 'eager';
            image.getBoundingClientRect = () => ({ width: 100, height: 100, top: state.visible ? 10 : 10_000, bottom: state.visible ? 110 : 10_100, left: 10, right: 110 });
            image.src = source;
            parent.append(image);
            return { image, state, emit: (name) => image.dispatchEvent(new dom.window.Event(name)) };
        }
    };
}

test('extracts a same-origin proxy URL without corrupting encoded signatures', () => {
    const original = 'https://images.example/image.png?token=a%2Fb%2Bc&size=800';
    for (const source of [proxy(original), `https://tr4ker.net${proxy(original)}`]) {
        assert.equal(getOriginalImageUrl(source, PAGE), original);
    }
    assert.equal(getOriginalImageUrl(proxy('http://images.example/a.jpg'), PAGE), 'http://images.example/a.jpg');
    for (const source of ['', '/api/proxy/image', '/uploads/avatar.png', proxy('javascript:alert(1)'), proxy('data:image/png;base64,AA'), proxy('file:///etc/passwd'), proxy('/relative.png'), proxy('https://user:password@images.example/a.png'), proxy(`https://tr4ker.net${proxy()}`), `https://other.example${proxy()}`, '/api/proxy/image?url=%E0%A4%A']) {
        assert.equal(getOriginalImageUrl(source, PAGE), null, source);
    }
});

test('waits eight seconds and bypasses only affected images after a click', (t) => {
    const h = harness(t);
    const slow = h.image();
    const healthy = h.image({ complete: true, width: 400 });
    const ordinary = h.image({ source: '/uploads/avatar.jpg' });
    h.start();
    h.advance(7_999);
    assert.equal(h.panel(), null);
    assert.equal(slow.image.getAttribute('src'), proxy());
    h.advance(1);
    assert.equal(h.panel().hidden, false);
    assert.match(h.direct().textContent, /\(1\)/);
    h.direct().click();
    assert.equal(slow.image.src, 'https://images.example/screenshot.jpg');
    assert.equal(slow.image.getAttribute('referrerpolicy'), 'no-referrer');
    assert.equal(healthy.image.getAttribute('src'), proxy());
    assert.equal(ordinary.image.getAttribute('src'), '/uploads/avatar.jpg');
    const later = h.image();
    h.advance(1_000);
    h.advance(8_000);
    assert.equal(later.image.getAttribute('src'), proxy(), 'the click never enables automatic bypass');
    assert.match(h.direct().textContent, /\(1\)/);
});

test('offers immediate help on error and detects already broken images', (t) => {
    const h = harness(t);
    const pending = h.image();
    h.start();
    pending.emit('error');
    assert.equal(h.panel().hidden, false);
    h.image({ complete: true });
    h.advance(1_000);
    assert.match(h.direct().textContent, /\(2\)/);
    pending.state.complete = true;
    pending.state.width = 600;
    pending.emit('load');
    assert.match(h.direct().textContent, /\(1\)/);
});

test('does not report lazy images before they enter the viewport', (t) => {
    const h = harness(t);
    const lazy = h.image({ lazy: true, visible: false });
    h.start();
    h.advance(30_000);
    assert.equal(h.panel(), null);
    lazy.state.visible = true;
    h.advance(1_000);
    h.advance(7_999);
    assert.equal(h.panel(), null);
    h.advance(1);
    assert.equal(h.panel().hidden, false);
});

test('a recovery before the click prevents an unnecessary direct request', (t) => {
    const h = harness(t);
    const recovering = h.image();
    h.start();
    h.advance(8_000);
    recovering.state.complete = true;
    recovering.state.width = 500;
    h.direct().click();
    assert.equal(recovering.image.getAttribute('src'), proxy());
    assert.equal(h.panel().hidden, true);
});

test('restores responsive image attributes and the referrer policy', (t) => {
    const h = harness(t);
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute('srcset', `${proxy()} 2x`);
    picture.append(source);
    document.querySelector('main').append(picture);
    const broken = h.image({ complete: true, parent: picture });
    broken.image.setAttribute('srcset', `${proxy()} 1x`);
    broken.image.setAttribute('referrerpolicy', 'same-origin');
    broken.image.style.display = 'none';
    h.start();
    h.direct().click();
    assert.equal(source.hasAttribute('srcset'), false);
    assert.equal(broken.image.hasAttribute('srcset'), false);
    assert.equal(broken.image.style.display, '');
    h.restore().click();
    assert.equal(broken.image.getAttribute('src'), proxy());
    assert.equal(broken.image.getAttribute('srcset'), `${proxy()} 1x`);
    assert.equal(source.getAttribute('srcset'), `${proxy()} 2x`);
    assert.equal(broken.image.getAttribute('referrerpolicy'), 'same-origin');
    assert.equal(broken.image.style.display, 'none');
});

test('reused DOM images get a fresh delay when their URL changes', (t) => {
    const h = harness(t);
    const pending = h.image();
    h.start();
    h.advance(7_000);
    pending.image.src = proxy('https://images.example/new.png');
    h.advance(1_000);
    h.advance(7_999);
    assert.equal(h.panel(), null);
    h.advance(1);
    assert.equal(h.panel().hidden, false);
});

test('SPA navigation restores proxy URLs and never remembers the bypass', (t) => {
    const h = harness(t);
    const broken = h.image({ complete: true });
    h.start();
    h.direct().click();
    h.navigate('/torrent/another');
    assert.equal(broken.image.getAttribute('src'), proxy());
    h.navigate('/communication');
    assert.equal(broken.image.getAttribute('src'), proxy());
    assert.equal(h.timers.size, 1, 'feature remains active on chat pages');
    assert.ok(document.querySelector('[id$="torrent-image-fallback-style"]'));
    h.navigate('/torrents?q=test');
    assert.equal(h.platform.getPage(), 'torrent');
    assert.equal(broken.image.getAttribute('src'), proxy());
});

test('disabling cleans the UI, timers and listeners without overwriting site changes', (t) => {
    const h = harness(t);
    const changed = h.image({ complete: true });
    const untouched = h.image({ complete: true });
    h.start();
    h.direct().click();
    changed.image.src = '/uploads/replaced-by-site.jpg';
    h.registry.setEnabled(feature.id, false);
    assert.equal(changed.image.getAttribute('src'), '/uploads/replaced-by-site.jpg');
    assert.equal(untouched.image.getAttribute('src'), proxy());
    assert.equal(untouched.image.hasAttribute('referrerpolicy'), false);
    assert.equal(h.panel(), null);
    assert.equal(h.timers.size, 0);
    changed.emit('error');
    assert.equal(h.panel(), null);
    assert.equal(createConfigurationBackup({ storage: h.storage }).buildPayload().storage[ENABLED_KEY], 'false');
});

test('the saved preference bypasses images immediately, including lazy and late arrivals', async (t) => {
    const h = harness(t);
    h.storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, true);
    const healthy = h.image({ complete: true, width: 400 });
    const lazy = h.image({ lazy: true, visible: false });
    h.start();
    assert.equal(healthy.image.src, 'https://images.example/screenshot.jpg');
    assert.equal(lazy.image.src, 'https://images.example/screenshot.jpg');
    const late = h.image({ source: proxy('https://images.example/late.jpg') });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(late.image.src, 'https://images.example/late.jpg');
    h.registry.setEnabled(feature.id, false);
    assert.equal(healthy.image.getAttribute('src'), proxy());
    h.registry.setEnabled(feature.id, true);
    assert.equal(healthy.image.src, 'https://images.example/screenshot.jpg');
});

test('returning to the proxy suspends the automatic preference for this page only', async (t) => {
    const h = harness(t);
    h.storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, true);
    const pending = h.image();
    h.start();
    h.restore().click();
    await new Promise((resolve) => setImmediate(resolve));
    h.advance(9_000);
    assert.equal(pending.image.getAttribute('src'), proxy());
    assert.equal(h.storage.readBoolean(DIRECT_IMAGES_STORAGE_KEY), true);
    h.navigate('/torrent/next');
    assert.equal(pending.image.src, 'https://images.example/screenshot.jpg');
});

test('settings apply immediately and are included in configuration backups', (t) => {
    const h = harness(t);
    const pending = h.image();
    h.start();
    const container = document.createElement('div');
    document.body.append(container);
    feature.settings.render(container, { context: h.registry.getActiveContext(feature.id) });
    const input = container.querySelector('input');
    assert.equal(input.checked, false);
    input.click();
    assert.equal(pending.image.src, 'https://images.example/screenshot.jpg');
    const backup = createConfigurationBackup({ storage: h.storage });
    const payload = backup.buildPayload();
    assert.equal(payload.storage[DIRECT_IMAGES_STORAGE_KEY], '1');
    input.click();
    assert.equal(pending.image.getAttribute('src'), proxy());
    backup.importPayload(payload);
    assert.equal(pending.image.src, 'https://images.example/screenshot.jpg');
});

test('settings without an active context remain available and survive navigation', (t) => {
    const h = harness(t, '/communication');
    const pending = h.image();
    h.start();
    const container = document.createElement('div');
    document.body.append(container);
    feature.settings.render(container, { context: null });
    container.querySelector('input').click();
    assert.equal(h.storage.readBoolean(DIRECT_IMAGES_STORAGE_KEY), true);
    h.navigate('/torrents');
    assert.equal(pending.image.src, 'https://images.example/screenshot.jpg');
});

test('a native image fallback does not cause repeated automatic retries', async (t) => {
    const h = harness(t);
    h.storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, true);
    const pending = h.image();
    h.start();
    pending.image.src = proxy();
    pending.emit('error');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(pending.image.getAttribute('src'), proxy());
    assert.equal(h.panel().hidden, false);
});

test('runs across Tr4ker pages and detects proxy images outside the main content', (t) => {
    const h = harness(t, '/');
    document.querySelector('main').remove();
    const sidebar = h.image({ complete: true, parent: document.querySelector('aside') });
    h.start();
    assert.equal(h.panel().hidden, false);
    h.direct().click();
    assert.equal(sidebar.image.src, 'https://images.example/screenshot.jpg');
    for (const page of ['/communication', '/user/example', '/communaute/forum', '/torrents']) {
        h.navigate(page);
        assert.equal(sidebar.image.getAttribute('src'), proxy(), 'manual bypass resets between pages');
        assert.equal(h.panel().hidden, false);
        h.direct().click();
        assert.equal(sidebar.image.src, 'https://images.example/screenshot.jpg');
    }
});

test('automatic mode covers headers, chat messages and dynamically inserted modals', async (t) => {
    const h = harness(t, '/communication');
    h.storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, true);
    const header = document.createElement('header');
    document.body.prepend(header);
    const avatar = h.image({ parent: header });
    const ordinary = h.image({ source: '/uploads/avatar.jpg', parent: header });
    const chat = h.image({ parent: document.querySelector('aside') });
    h.start();
    assert.equal(avatar.image.src, 'https://images.example/screenshot.jpg');
    assert.equal(chat.image.src, 'https://images.example/screenshot.jpg');
    assert.equal(ordinary.image.getAttribute('src'), '/uploads/avatar.jpg');
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    document.body.append(modal);
    const preview = h.image({ source: proxy('https://images.example/preview.png'), parent: modal });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(preview.image.src, 'https://images.example/preview.png');
    h.registry.setEnabled(feature.id, false);
    assert.equal(avatar.image.getAttribute('src'), proxy());
    assert.equal(chat.image.getAttribute('src'), proxy());
    assert.equal(preview.image.getAttribute('src'), proxy('https://images.example/preview.png'));
    assert.equal(h.panel(), null);
    assert.equal(h.timers.size, 0);
});

test('automatic mode keeps shared header images direct across routes and restores page overrides', (t) => {
    const h = harness(t, '/');
    h.storage.writeBoolean(DIRECT_IMAGES_STORAGE_KEY, true);
    const header = document.createElement('header');
    document.body.prepend(header);
    const avatar = h.image({ parent: header });
    h.start();
    const originalPanel = h.panel();
    h.navigate('/user/example');
    assert.equal(avatar.image.src, 'https://images.example/screenshot.jpg');
    assert.equal(h.panel(), originalPanel, 'shared images are not restored and reloaded on every navigation');
    h.restore().click();
    assert.equal(avatar.image.getAttribute('src'), proxy());
    h.advance(1_000);
    assert.equal(avatar.image.getAttribute('src'), proxy());
    h.navigate('/communication');
    assert.equal(avatar.image.src, 'https://images.example/screenshot.jpg');
});
