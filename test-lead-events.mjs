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
assert.doesNotMatch(block, /return \{[^}]*\};\s*\n\s*if \(/, 'leadParams has no dead code after return');

// Runtime probe: execute the real leadParams from source and verify UTM attribution.
const leadParamsSrc = source.slice(source.indexOf('function leadParams'), source.indexOf('function emitLeadConversion'));
const runLeadParams = new Function('form', 'method', 'outcome', 'newsletterAttribution',
    'var document = { documentElement: { lang: "en" } };' + leadParamsSrc + 'return leadParams(form, method, outcome);');
const newsletterForm = { classList: { contains: () => false } };
const contactForm = { classList: { contains: (c) => c === 'contact-form' } };
const attributed = runLeadParams(newsletterForm, 'api', 'success',
    { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'launch' });
assert.equal(attributed.utm_source, 'twitter', 'newsletter success carries utm_source');
assert.equal(attributed.utm_medium, 'social', 'newsletter success carries utm_medium');
assert.equal(attributed.utm_campaign, 'launch', 'newsletter success carries utm_campaign');
assert.equal(attributed.form_type, 'newsletter', 'newsletter form_type preserved');
const direct = runLeadParams(newsletterForm, 'api', 'success', {});
assert.equal(direct.utm_source, '(direct)', 'missing attribution falls back to (direct)');
assert.equal(direct.utm_medium, '(none)', 'missing attribution falls back to (none)');
assert.equal(direct.utm_campaign, '(not set)', 'missing attribution falls back to (not set)');
const contact = runLeadParams(contactForm, 'api', 'success',
    { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'launch' });
assert.equal('utm_source' in contact, false, 'contact params exclude utm attribution');
assert.equal(contact.form_type, 'contact', 'contact form_type preserved');
console.log('lead event semantics tests: 21 passed');
