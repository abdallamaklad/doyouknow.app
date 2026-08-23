const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(require('node:path').join(__dirname, 'assets/js/site.js'), 'utf8');
const themeSource = source.slice(source.indexOf('    const STORAGE_KEY'), source.indexOf('    // --- Mobile Menu ---'));

function createHarness({ stored = null, prefersDark = false } = {}) {
  const events = [];
  const storage = new Map(stored ? [['dyk-theme', stored]] : []);
  const html = {
    attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name] || null; }
  };
  const toggle = {
    listeners: {},
    innerHTML: '',
    addEventListener(name, fn) { this.listeners[name] = fn; }
  };
  const media = {
    matches: prefersDark,
    listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; }
  };
  const context = {
    window: {
      matchMedia: () => media,
      __DYK_THEME_RUNTIME__: undefined
    },
    document: {
      documentElement: html,
      querySelector(selector) { return selector === '.theme-toggle' ? toggle : null; }
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, value); }
    },
    gtag(name, eventName, params) {
      events.push({ name, eventName, params });
    },
    sendGA4Event(eventName, params) {
      events.push({ name: 'event', eventName, params });
    },
    console
  };
  vm.createContext(context);

  function evaluate() {
    vm.runInContext(`(function() {\n${themeSource}\n})();`, context);
  }
  evaluate();
  return { events, html, toggle, media, evaluate };
}

test('initial theme setup emits no dark mode event', () => {
  const harness = createHarness({ stored: 'dark', prefersDark: true });
  assert.equal(harness.html.getAttribute('data-theme'), 'dark');
  assert.equal(harness.events.length, 0);
});

test('a user theme toggle emits exactly one event', () => {
  const harness = createHarness();
  harness.toggle.listeners.click();
  assert.equal(harness.events.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(harness.events[0].params)), { theme: 'dark', method: 'user_toggle' });
});

test('a post-initialization system change emits exactly one event', () => {
  const harness = createHarness();
  harness.media.listeners.change({ matches: true });
  assert.equal(harness.events.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(harness.events[0].params)), { theme: 'dark', method: 'system_preference' });
});

test('re-evaluating during hydration does not duplicate handlers or events', () => {
  const harness = createHarness();
  harness.evaluate();
  harness.toggle.listeners.click();
  assert.equal(harness.events.length, 1);
});

test('system changes are ignored after a persisted user preference exists', () => {
  const harness = createHarness({ stored: 'light' });
  harness.media.listeners.change({ matches: true });
  assert.equal(harness.events.length, 0);
});
