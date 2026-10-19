/**
 * Fodavin Partner Program referral tracking.
 *
 * Partner links look like https://fodavin.in/ref/FOD-7K2QX, which
 * _redirects turns into /?ref=FOD-7K2QX. This script:
 *   1. sends the code to partner.fodavin.in, which records the visit and
 *      returns a signed token (the token can't be edited to change the
 *      partner or extend the time limit);
 *   2. keeps that token in this browser (cookie + localStorage) until it
 *      expires, so a later enquiry still credits the partner;
 *   3. removes ?ref= from the address bar;
 *   4. on contact forms, shows that a referral is applied, or offers an
 *      optional "referral code" field.
 *
 * fodavin-forms.js reads window.FODAVIN_REF.get() when a form is sent.
 * Nothing here runs unless a ref is present or a contact form exists.
 */
(function () {
  'use strict';

  var cfg = window.FODAVIN_CONFIG || {};
  var KEY = 'fdv_ref';
  var VISITOR_KEY = 'fdv_vid';
  var CODE_RE = /^FOD-?[0-9A-HJKMNP-TV-Z]{5}$/i;

  function readStore(key) {
    try {
      var v = window.localStorage.getItem(key);
      if (v) return v;
    } catch (e) { /* storage blocked */ }
    var m = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function writeStore(key, value, maxAgeSeconds) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
    document.cookie = key + '=' + encodeURIComponent(value) +
      '; Max-Age=' + Math.max(0, Math.floor(maxAgeSeconds)) +
      '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function clearStore(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* storage blocked */ }
    document.cookie = key + '=; Max-Age=0; Path=/; SameSite=Lax';
  }

  /** The stored referral, or null if none / expired. */
  function get() {
    var raw = readStore(KEY);
    if (!raw) return null;
    try {
      var rec = JSON.parse(raw);
      if (rec && rec.token && rec.code && rec.exp > Date.now()) return rec;
    } catch (e) { /* corrupt value */ }
    clearStore(KEY);
    return null;
  }

  function visitorId() {
    var id = readStore(VISITOR_KEY);
    if (id && /^[0-9a-f]{32}$/.test(id)) return id;
    var bytes = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    id = Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    writeStore(VISITOR_KEY, id, 365 * 24 * 3600);
    return id;
  }

  /** Take ?ref= off the address bar, keeping everything else. */
  function stripRefParam() {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }

  function track(code) {
    var existing = get();
    var url = new URL(window.location.href);
    return fetch(cfg.partnerApi.replace(/\/+$/, '') + '/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        existingToken: existing ? existing.token : null,
        visitorId: visitorId(),
        landingUrl: url.pathname,
        referrer: document.referrer || null,
        utmSource: url.searchParams.get('utm_source'),
        utmMedium: url.searchParams.get('utm_medium'),
        utmCampaign: url.searchParams.get('utm_campaign')
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok && data.token) {
          var exp = Date.parse(data.expiresAt);
          writeStore(KEY, JSON.stringify({ token: data.token, code: data.code, exp: exp }), (exp - Date.now()) / 1000);
        }
      })
      .catch(function () { /* tracking must never break the page */ });
  }

  // --- Contact forms ---------------------------------------------------------

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  function decorate(form) {
    var old = form.querySelector('.fodavin-ref-box');
    if (old) old.remove();
    var anchor = form.querySelector('.fodavin-hp') || form.querySelector('[type="submit"]');
    if (!anchor) return;

    var box = el('div', 'fodavin-ref-box col-12');
    var ref = get();
    if (ref) {
      box.appendChild(el('p', 'mb-0 fs-3 text-dark text-opacity-70',
        'Referral code ' + ref.code + ' applied. Thank you for coming through a Fodavin partner.'));
    } else {
      var id = 'referralCode-' + Math.random().toString(36).slice(2, 8);
      var nameInput = form.querySelector('[name="name"]');
      var label = el('label', nameInput && nameInput.placeholder ? 'visually-hidden' : 'form-label', 'Referral code (optional)');
      label.setAttribute('for', id);
      var input = el('input', nameInput ? nameInput.className : 'form-control');
      input.type = 'text';
      input.name = 'referral_code';
      input.id = id;
      input.autocomplete = 'off';
      input.maxLength = 12;
      input.placeholder = nameInput && nameInput.placeholder ? 'Referral code (optional)' : 'FOD-XXXXX';
      box.appendChild(label);
      box.appendChild(input);
    }
    // Forms without a privacy line get one, because a referral is shared with the partner program.
    if (!form.querySelector('a[href*="privacy-policy"]')) {
      var note = el('p', 'mb-0 mt-2 fs-3 text-dark text-opacity-70', 'By sending this form you agree to our ');
      var a = el('a', null, 'privacy policy');
      a.href = '/privacy-policy/';
      note.appendChild(a);
      note.appendChild(document.createTextNode('.'));
      box.appendChild(note);
    }
    anchor.parentNode.insertBefore(box, anchor);
  }

  function decorateAll() {
    var forms = document.querySelectorAll('[data-fodavin-form="contact"]');
    Array.prototype.forEach.call(forms, decorate);
  }

  // --- Start -----------------------------------------------------------------

  var params = new URLSearchParams(window.location.search);
  var raw = (params.get('ref') || '').trim();
  var ready = Promise.resolve();
  if (raw) {
    stripRefParam();
    if (CODE_RE.test(raw) && cfg.partnerApi) ready = track(raw.toUpperCase());
  }

  window.FODAVIN_REF = { get: get, ready: ready, codePattern: CODE_RE };

  function start() {
    decorateAll();
    ready.then(function () { if (get()) decorateAll(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
