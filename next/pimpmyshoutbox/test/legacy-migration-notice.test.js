import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const legacy = readFileSync(new URL('../../../src/userscripts/pimpmyshoutbox.user.js', import.meta.url), 'utf8');
const nextMetadata = readFileSync(new URL('../metadata.user.js', import.meta.url), 'utf8');
const NOTICE_ID = 'tm-t4-legacy-migration-notice';
const SNOOZE_KEY = 'tm_t4_legacy_migration_snoozed_date';
const noticeCode = legacy.slice(legacy.indexOf('    function showLegacyMigrationNotice()'), legacy.indexOf('    function init()'));
const storageCode = legacy.slice(legacy.indexOf('    function readStorageItem('), legacy.indexOf('    function removeStorageItem('));
const platformCode = legacy.slice(legacy.indexOf('    function isTr4kerPage()'), legacy.indexOf('    function isChatPage()'));
const constants = ['TR4KER_HOSTNAME', 'NEXT_SCRIPT_INSTALL_URL', 'LEGACY_MIGRATION_NOTICE_ID', 'STORAGE_KEY_LEGACY_MIGRATION_SNOOZED_DATE']
    .map((name) => legacy.match(new RegExp(`^    const ${name} = .+;$`, 'm'))?.[0]).join('\n');

function harness(t, url = 'https://tr4ker.net/communication') {
    const dom = new JSDOM('<button id="previous">Page</button>', { url, runScripts: 'outside-only' });
    t.after(() => dom.window.close());
    const { window } = dom;
    const RealDate = window.Date;
    let now = new RealDate(2026, 9, 31, 15);
    window.Date = class extends RealDate {
        constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
    };
    window.eval(`${constants}\n${storageCode}\n${platformCode}\n${noticeCode}`);
    return {
        window,
        document: window.document,
        show: () => window.showLegacyMigrationNotice(),
        notice: () => window.document.getElementById(NOTICE_ID),
        later: () => window.document.querySelector(`#${NOTICE_ID} button`),
        date(...args) { now = new RealDate(...args); }
    };
}

test('legacy is marked deprecated and its install link matches the stable Next update channel', (t) => {
    const h = harness(t);
    assert.match(legacy, /^\/\/ @name\s+Tr4ker - PimpMyShoutbox \(DEPRECATED\)$/m);
    h.show();
    const install = h.notice().querySelector('a');
    assert.equal(install.href, nextMetadata.match(/^\/\/ @downloadURL\s+(\S+)/m)[1]);
    const base = 'https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/';
    assert.equal(install.href, `${base}pimpmyshoutbox-next.user.js`);
    assert.equal(nextMetadata.match(/^\/\/ @updateURL\s+(\S+)/m)[1], `${base}pimpmyshoutbox-next.meta.js`);
    assert.equal(install.target, '_blank');
    assert.equal(install.rel, 'noopener noreferrer');
});

test('shows two actions and the configuration and manager migration instructions', (t) => {
    const h = harness(t);
    h.show();
    const notice = h.notice();
    assert.equal(notice.querySelectorAll('a, button').length, 2);
    assert.equal(notice.querySelector('a').textContent, 'Installer maintenant');
    assert.equal(h.later().textContent, 'Me rappeler plus tard');
    for (const instruction of ['Exporter la config', 'Importer une config', 'Tampermonkey', 'Greasemonkey', 'Violentmonkey', 'désactivez', '(DEPRECATED)', 'Rechargez Tr4ker']) {
        assert.ok(notice.textContent.includes(instruction), instruction);
    }
    h.show();
    assert.equal(h.document.querySelectorAll(`#${NOTICE_ID}`).length, 1);
});

test('later suppresses the notice for the local calendar day and returns the next day', (t) => {
    const h = harness(t);
    h.date(2026, 9, 31, 23, 59);
    h.show();
    h.later().click();
    assert.equal(h.window.localStorage.getItem(SNOOZE_KEY), '2026-10-31');
    h.show();
    assert.equal(h.notice(), null);
    h.date(2026, 10, 1, 0, 1);
    h.show();
    assert.ok(h.notice());
});

test('snooze uses the dismissal day if the dialog stays open past midnight', (t) => {
    const h = harness(t);
    h.date(2026, 9, 31, 23, 59);
    h.show();
    h.date(2026, 10, 1, 0, 1);
    h.later().click();
    assert.equal(h.window.localStorage.getItem(SNOOZE_KEY), '2026-11-01');
    h.show();
    assert.equal(h.notice(), null);
});

test('preserves configuration and restores focus and scrolling after snoozing', (t) => {
    const h = harness(t);
    h.window.localStorage.setItem('tm_hidden_shout_users_t4', '["User"]');
    const previous = h.document.getElementById('previous');
    previous.focus();
    h.document.body.style.overflow = 'auto';
    h.show();
    assert.equal(h.document.activeElement.getAttribute('role'), 'dialog');
    assert.equal(h.document.body.style.overflow, 'hidden');
    h.later().click();
    assert.equal(h.document.activeElement, previous);
    assert.equal(h.document.body.style.overflow, 'auto');
    assert.equal(h.window.localStorage.getItem('tm_hidden_shout_users_t4'), '["User"]');
});

test('install closes the notice while leaving the native installation link usable', (t) => {
    const h = harness(t);
    h.show();
    const install = h.notice().querySelector('a');
    const event = new h.window.MouseEvent('click', { bubbles: true, cancelable: true });
    install.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(h.notice(), null);
    assert.equal(h.document.body.style.overflow, '');
    assert.equal(h.window.localStorage.getItem(SNOOZE_KEY), null);
});

test('keyboard focus stays in the dialog and Escape snoozes the notice', (t) => {
    const h = harness(t);
    h.show();
    const key = (name, shiftKey = false) => h.window.dispatchEvent(new h.window.KeyboardEvent('keydown', { key: name, shiftKey, bubbles: true, cancelable: true }));
    key('Tab');
    assert.equal(h.document.activeElement, h.notice().querySelector('a'));
    key('Tab', true);
    assert.equal(h.document.activeElement, h.later());
    key('Tab');
    assert.equal(h.document.activeElement, h.notice().querySelector('a'));
    key('Escape');
    assert.equal(h.notice(), null);
    assert.equal(h.window.localStorage.getItem(SNOOZE_KEY), '2026-10-31');
});

test('a dismissal in another tab closes an already visible notice', (t) => {
    const h = harness(t);
    h.show();
    h.window.dispatchEvent(new h.window.StorageEvent('storage', { key: SNOOZE_KEY, newValue: '2026-10-31' }));
    assert.equal(h.notice(), null);
});

test('storage failures do not prevent dismissing the notice', (t) => {
    const h = harness(t);
    h.window.Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    h.window.Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
    h.show();
    h.later().click();
    assert.equal(h.notice(), null);
});

test('does not display outside Tr4ker', (t) => {
    const h = harness(t, 'https://other.example/');
    h.show();
    assert.equal(h.notice(), null);
});
