import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./assets/js/site.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('// --- Lead capture instrumentation ---'), source.indexOf('// --- Lazy Loading Images ---'));
const success = block.slice(block.indexOf('var success = function()'), block.indexOf('var fallback = function()', block.indexOf('var success = function()')));
const fallback = block.slice(block.indexOf('var fallback = function()'), block.indexOf('if (!captureLead(form, payload, success, fallback))'));

assert.match(block, /form\.addEventListener\('submit'/, 'forms are tracked on submit, not click');
assert.match(block, /response\.ok/, 'API capture requires a successful response');
assert.match(block, /emitLeadConversion\(form, 'contact_form_submit'/, 'contact conversion is in success callback');
assert.match(block, /emitLeadConversion\(form, 'newsletter_signup'/, 'newsletter conversion is in success callback');
assert.match(block, /emitLeadConversion\(form, 'generate_lead'/, 'lead conversion is in success callback');
assert.doesNotMatch(fallback, /sendGA4Event\('(contact_form_submit|newsletter_signup|generate_lead)'/, 'fallback has no conversion events');
assert.match(fallback, /mailtoIntent\(form, 'mailto'/, 'mailto fallback records intent');
assert.match(block, /new WeakSet\(\)/, 'duplicate submissions are guarded while capture is pending');
assert.match(block, /new WeakMap\(\)/, 'successful conversion events are deduplicated per form/event');
assert.match(block, /invalid_email/, 'validation rejection is tracked separately');
assert.match(block, /credentials: 'omit'/, 'capture does not send browser credentials');
console.log('lead event semantics tests: 11 passed');
