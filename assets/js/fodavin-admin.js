/**
 * Admin dashboard for form submissions.
 *
 * The password is never stored in this file. It is typed at login, held in
 * sessionStorage for the tab's lifetime, and checked by the Apps Script on
 * every request - so the browser only ever sees data it was authorised for.
 *
 * Apps Script routinely takes 1.5-3s to answer, so every request that can be
 * triggered by a click shows a busy state; otherwise the page looks frozen.
 */
(function () {
  'use strict';

  var cfg = window.FODAVIN_CONFIG || {};
  var KEY = 'fodavin_admin_pw';

  var state = { all: [], search: '', type: 'all', status: 'all' };
  var rowsEl;

  function $(id) { return document.getElementById(id); }

  function password() {
    try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  function setPassword(v) {
    try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch (e) {}
  }

  function api(action, extra) {
    var payload = { action: action, password: password() };
    if (extra) {
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    }
    return fetch(cfg.formsEndpoint, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ------------------------------------------------------------ ui helpers

  /** Swaps a button's label for a spinner while a request is in flight. */
  function busy(btn, on, label) {
    if (!btn) return;
    var text = btn.querySelector('.btn-text') || btn;
    if (on) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (!text.dataset.idle) text.dataset.idle = text.textContent;
      text.innerHTML = '<span class="admin-spinner"></span> ' + (label || 'Working…');
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (text.dataset.idle) text.textContent = text.dataset.idle;
    }
  }

  var toastTimer;
  function toast(message, kind) {
    var el = $('toast');
    el.textContent = message;
    el.className = 'admin-toast is-visible' + (kind === 'error' ? ' admin-toast-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'admin-toast' + (kind === 'error' ? ' admin-toast-error' : '');
    }, 3800);
  }

  function show(section) {
    ['setup', 'login', 'app'].forEach(function (name) {
      var node = $('view-' + name);
      if (node) node.hidden = name !== section;
    });
    $('logout').hidden = section !== 'app';
  }

  function skeleton(count) {
    var cells = '';
    for (var c = 0; c < 6; c++) {
      cells += '<td><span class="admin-skeleton-row d-block" style="width:' + (55 + (c * 7) % 40) + '%"></span></td>';
    }
    var html = '';
    for (var i = 0; i < count; i++) html += '<tr>' + cells + '</tr>';
    rowsEl.innerHTML = html;
  }

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return String(iso || '-');
    var mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
    var days = Math.round(hrs / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    return new Date(then).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function absoluteTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return String(iso || '');
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // ------------------------------------------------------------ rendering

  function visible() {
    var q = state.search.toLowerCase();
    return state.all.filter(function (s) {
      if (state.type !== 'all' && s.type !== state.type) return false;
      if (state.status !== 'all' && (s.status || 'new') !== state.status) return false;
      if (!q) return true;
      return [s.name, s.email, s.phone, s.message, s.page, s.id]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderStats() {
    var all = state.all;
    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    $('stat-total').textContent = all.length;
    $('stat-new').textContent = all.filter(function (s) { return (s.status || 'new') === 'new'; }).length;
    $('stat-week').textContent = all.filter(function (s) {
      var t = new Date(s.received).getTime();
      return !isNaN(t) && t >= weekAgo;
    }).length;
    $('stat-subs').textContent = all.filter(function (s) { return s.type === 'newsletter'; }).length;
  }

  function renderTable() {
    var rows = visible();
    $('result-count').textContent = rows.length === state.all.length
      ? state.all.length + (state.all.length === 1 ? ' submission' : ' submissions')
      : rows.length + ' of ' + state.all.length + ' shown';

    if (!rows.length) {
      rowsEl.innerHTML = '';
      var empty = $('empty-state');
      empty.textContent = state.all.length
        ? 'Nothing matches those filters.'
        : 'No submissions yet. They will appear here as soon as someone uses a form.';
      empty.hidden = false;
      return;
    }
    $('empty-state').hidden = true;

    rowsEl.innerHTML = rows.map(function (s) {
      var status = s.status || 'new';
      var long = (s.message || '').length > 180;

      var contact = '<span class="admin-from-name">' + escapeHtml(s.name || '—') + '</span>' +
        '<br><a href="mailto:' + escapeHtml(s.email) + '">' + escapeHtml(s.email) + '</a>' +
        (s.phone ? '<br><a href="tel:' + escapeHtml(s.phone) + '">' + escapeHtml(s.phone) + '</a>' : '');

      var message = s.message
        ? '<p class="admin-message' + (long ? ' is-clamped' : '') + '">' + escapeHtml(s.message) + '</p>' +
          (long ? '<button type="button" class="admin-more" data-act="expand">Show more</button>' : '')
        : '<span class="admin-meta">—</span>';

      return '' +
        '<tr data-id="' + escapeHtml(s.id) + '">' +
          '<td data-label="Received"><span title="' + escapeHtml(absoluteTime(s.received)) + '">' +
            escapeHtml(relativeTime(s.received)) + '</span></td>' +
          '<td data-label="Type"><span class="admin-type admin-type-' + escapeHtml(s.type) + '">' +
            escapeHtml(s.type) + '</span></td>' +
          '<td data-label="From">' + contact + '</td>' +
          '<td data-label="Message" class="admin-message-cell">' + message +
            (s.page ? '<p class="admin-meta mb-0 mt-1">via ' + escapeHtml(s.page) + '</p>' : '') +
          '</td>' +
          '<td data-label="Status"><span class="admin-badge badge-' + escapeHtml(status) + '">' +
            escapeHtml(status) + '</span></td>' +
          '<td data-label="Actions">' +
            '<div class="admin-actions">' +
              (s.email ? '<button type="button" class="admin-act" data-act="reply">Reply</button>' : '') +
              '<button type="button" class="admin-act" data-act="read">Read</button>' +
              '<button type="button" class="admin-act" data-act="replied">Replied</button>' +
              '<button type="button" class="admin-act" data-act="archived">Archive</button>' +
              '<button type="button" class="admin-act admin-act-danger" data-act="delete">Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');
  }

  function render() {
    renderStats();
    renderTable();
  }

  // ------------------------------------------------------------ requests

  /**
   * @param {HTMLElement|null} btn button to show a spinner on
   * @param {boolean} fromLogin errors must surface in the login view, which is
   *        the only view on screen at that point
   */
  function load(btn, fromLogin) {
    $('load-error').hidden = true;
    if (!fromLogin) skeleton(4);
    busy(btn, true, fromLogin ? 'Checking…' : 'Refreshing…');

    return api('list')
      .then(function (data) {
        busy(btn, false);
        if (!data.ok) {
          setPassword('');
          show('login');
          var err = $('login-error');
          err.textContent = data.error || 'Could not load submissions.';
          err.hidden = false;
          $('password').focus();
          return;
        }
        state.all = data.submissions || [];
        show('app');
        render();
        if (!fromLogin) toast('Refreshed — ' + state.all.length + ' submissions');
      })
      .catch(function () {
        busy(btn, false);
        var message = 'Could not reach the server. Check your connection and the endpoint URL, then try again.';
        if (fromLogin) {
          var err = $('login-error');
          err.textContent = message;
          err.hidden = false;
        } else {
          rowsEl.innerHTML = '';
          $('load-error').textContent = message;
          $('load-error').hidden = false;
        }
      });
  }

  function act(id, action, btn) {
    var row = rowsEl.querySelector('[data-id="' + id + '"]');
    if (row) row.classList.add('is-busy');
    busy(btn, true, '…');

    var req = action === 'delete'
      ? api('delete', { id: id })
      : api('setStatus', { id: id, status: action });

    req.then(function (data) {
      busy(btn, false);
      if (row) row.classList.remove('is-busy');
      if (!data.ok) {
        toast(data.error || 'That did not work.', 'error');
        return;
      }
      if (action === 'delete') {
        state.all = state.all.filter(function (s) { return s.id !== id; });
        toast('Submission deleted');
      } else {
        state.all.forEach(function (s) { if (s.id === id) s.status = action; });
        toast('Marked ' + action);
      }
      render();
    }).catch(function () {
      busy(btn, false);
      if (row) row.classList.remove('is-busy');
      toast('Could not reach the server.', 'error');
    });
  }

  function exportCsv() {
    var rows = visible();
    if (!rows.length) { toast('Nothing to export.', 'error'); return; }

    var head = ['ID', 'Received', 'Type', 'Name', 'Email', 'Phone', 'Message', 'Page', 'Status'];
    var esc = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var csv = [head.join(',')].concat(rows.map(function (s) {
      return [s.id, s.received, s.type, s.name, s.email, s.phone, s.message, s.page, s.status]
        .map(esc).join(',');
    })).join('\r\n');

    // Leading BOM so Excel reads UTF-8 names correctly.
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'fodavin-submissions-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Exported ' + rows.length + ' rows');
  }

  function reply(id) {
    var s = state.all.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    var subject = s.type === 'contact'
      ? 'Re: your enquiry to Fodavin Technologies'
      : 'Fodavin Technologies';
    window.location.href = 'mailto:' + s.email + '?subject=' + encodeURIComponent(subject);
    if ((s.status || 'new') === 'new') act(id, 'read', null);
  }

  // ------------------------------------------------------------ boot

  document.addEventListener('DOMContentLoaded', function () {
    rowsEl = $('rows');

    if (!cfg.formsEndpoint) {
      show('setup');
      return;
    }

    $('login-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pw = $('password').value;
      if (!pw) return;
      setPassword(pw);
      $('login-error').hidden = true;
      load($('login-submit'), true);
    });

    $('toggle-pw').addEventListener('click', function () {
      var input = $('password');
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      this.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      this.innerHTML = '<iconify-icon icon="lucide:' + (showing ? 'eye' : 'eye-off') +
        '" class="fs-5"></iconify-icon>';
      input.focus();
    });

    $('logout').addEventListener('click', function () {
      setPassword('');
      state.all = [];
      rowsEl.innerHTML = '';
      show('login');
      $('password').value = '';
      $('login-error').hidden = true;
      $('password').focus();
    });

    $('refresh').addEventListener('click', function () { load(this, false); });
    $('export').addEventListener('click', exportCsv);

    $('search').addEventListener('input', function (e) {
      state.search = e.target.value;
      renderTable();
    });
    $('filter-type').addEventListener('change', function (e) {
      state.type = e.target.value;
      renderTable();
    });
    $('filter-status').addEventListener('change', function (e) {
      state.status = e.target.value;
      renderTable();
    });

    rowsEl.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-act]');
      if (!btn) return;
      var action = btn.getAttribute('data-act');

      if (action === 'expand') {
        var p = btn.parentNode.querySelector('.admin-message');
        var clamped = p.classList.toggle('is-clamped');
        btn.textContent = clamped ? 'Show more' : 'Show less';
        return;
      }

      var tr = btn.closest('tr');
      var id = tr && tr.getAttribute('data-id');
      if (!id) return;

      if (action === 'reply') { reply(id); return; }
      if (action === 'delete' &&
          !confirm('Delete this submission permanently? It is removed from the Sheet too.')) {
        return;
      }
      act(id, action, btn);
    });

    if (password()) {
      show('app');
      load(null, false);
    } else {
      show('login');
      // autofocus does not fire on a section that was hidden at parse time
      $('password').focus();
    }
  });
})();
