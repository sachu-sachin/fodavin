/**
 * Progressive enhancement for the contact and newsletter forms.
 *
 * Any <form data-fodavin-form="contact|newsletter"> on the page is handled here:
 * validation, honeypot, loading state, and inline success/error messaging.
 * Submissions POST to the Apps Script endpoint in fodavin-config.js.
 */
(function () {
  'use strict';

  var cfg = window.FODAVIN_CONFIG || {};

  function field(form, name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function value(form, name) {
    var el = field(form, name);
    return el ? el.value.trim() : '';
  }

  function statusBox(form) {
    var box = form.querySelector('.form-status');
    if (!box) {
      box = document.createElement('p');
      box.className = 'form-status';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      form.appendChild(box);
    }
    return box;
  }

  function setStatus(form, kind, message) {
    var box = statusBox(form);
    box.className = 'form-status form-status-' + kind;
    box.textContent = message;
  }

  function clearStatus(form) {
    var box = form.querySelector('.form-status');
    if (box) {
      box.className = 'form-status';
      box.textContent = '';
    }
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    if (busy) {
      btn.dataset.originalLabel = btn.dataset.originalLabel || btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      var label = btn.querySelector('.btn-text');
      if (label) {
        label.dataset.originalText = label.dataset.originalText || label.textContent;
        label.textContent = 'Sending…';
      } else {
        btn.textContent = 'Sending…';
      }
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      var lbl = btn.querySelector('.btn-text');
      if (lbl && lbl.dataset.originalText) {
        lbl.textContent = lbl.dataset.originalText;
      } else if (btn.dataset.originalLabel) {
        btn.innerHTML = btn.dataset.originalLabel;
      }
    }
  }

  function looksLikeEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function validate(form, type) {
    var email = value(form, 'email');
    if (!email) return 'Please enter your email address.';
    if (!looksLikeEmail(email)) return 'That email address does not look right.';

    if (type === 'contact') {
      if (!value(form, 'name')) return 'Please tell us your name.';
      if (!value(form, 'message')) return 'Please add a short message.';
    }
    return null;
  }

  /** No endpoint configured yet - hand off to email rather than lose the message. */
  function mailtoFallback(form, type) {
    var to = cfg.fallbackEmail || 'fodavintechnologies@gmail.com';
    var subject = type === 'contact'
      ? 'Website enquiry from ' + (value(form, 'name') || value(form, 'email'))
      : 'Newsletter signup';
    var body = type === 'contact'
      ? 'Name: ' + value(form, 'name') + '\nEmail: ' + value(form, 'email') +
        '\n\n' + value(form, 'message')
      : 'Please add ' + value(form, 'email') + ' to the mailing list.';

    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    setStatus(form, 'info', 'Opening your email app so you can send this to us directly.');
  }

  function submit(form, type) {
    var problem = validate(form, type);
    if (problem) {
      setStatus(form, 'error', problem);
      var firstEmpty = form.querySelector('input:invalid, [name="name"], [name="email"]');
      if (firstEmpty) firstEmpty.focus();
      return;
    }

    if (!cfg.formsEndpoint) {
      mailtoFallback(form, type);
      return;
    }

    clearStatus(form);
    setBusy(form, true);

    var payload = {
      action: 'submit',
      type: type,
      name: value(form, 'name'),
      email: value(form, 'email'),
      phone: value(form, 'phone'),
      message: value(form, 'message'),
      page: window.location.pathname.split('/').pop() || 'index.html',
      company_website: value(form, 'company_website') // honeypot
    };

    // No custom Content-Type header: that keeps this a "simple" CORS request,
    // which Apps Script can answer without a preflight it cannot serve.
    fetch(cfg.formsEndpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setBusy(form, false);
        if (data && data.ok) {
          form.reset();
          setStatus(form, 'success', type === 'contact'
            ? 'Thanks — your message is with us. We reply within one working day.'
            : 'You are on the list. Thanks for subscribing.');
        } else {
          setStatus(form, 'error', (data && data.error) ||
            'Something went wrong. Please email us instead.');
        }
      })
      .catch(function () {
        setBusy(form, false);
        setStatus(form, 'error',
          'We could not reach the server. Please email ' +
          (cfg.fallbackEmail || 'us') + ' instead.');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('[data-fodavin-form]');
    Array.prototype.forEach.call(forms, function (form) {
      var type = form.getAttribute('data-fodavin-form');
      form.setAttribute('novalidate', 'novalidate');
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        submit(form, type);
      });
    });
  });
})();
