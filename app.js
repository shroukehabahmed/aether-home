// Aether Home — demo interactivity (client-side state, persisted per browser)
(function () {
  function sget(k, d) { try { var v = localStorage.getItem('aether:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sset(k, v) { try { localStorage.setItem('aether:' + k, JSON.stringify(v)); } catch (e) {} }
  function page() { var p = location.pathname.split('/').pop(); return p || 'index.html'; }

  // ---- toggle switches ----
  function isSwitch(el) {
    return el && el.tagName === 'DIV' && /\bw-(10|12)\b/.test(el.className) && /\bh-(5|6)\b/.test(el.className)
      && el.className.indexOf('rounded-full') !== -1 && el.querySelector('div');
  }
  function swLabel(el) {
    var row = el.closest('div[class*="flex"]');
    var t = row ? (row.textContent || '') : '';
    return page() + ':' + t.replace(/\s+/g, ' ').trim().slice(0, 48);
  }
  function setSwitch(el, on) {
    var knob = el.querySelector('div');
    el.dataset.on = on ? '1' : '0';
    el.classList.add('relative', 'cursor-pointer');
    el.classList.toggle('bg-primary', on);
    el.classList.toggle('bg-surface-container-highest', !on);
    knob.classList.add('absolute', 'top-1');
    knob.classList.toggle('bg-white', on);
    knob.classList.toggle('bg-on-surface-variant', !on);
    knob.classList.remove('ml-auto');
    knob.classList.toggle('right-1', on);
    knob.classList.toggle('left-1', !on);
  }
  function initSwitches() {
    document.querySelectorAll('div.rounded-full').forEach(function (el) {
      if (!isSwitch(el) || el.dataset.swInit) return;
      el.dataset.swInit = '1';
      var key = 'sw:' + swLabel(el);
      setSwitch(el, sget(key, el.classList.contains('bg-primary')));
      el.addEventListener('click', function () {
        var now = el.dataset.on !== '1';
        setSwitch(el, now);
        sset(key, now);
      });
    });
  }

  // ---- mode buttons (All Lights Off / Night Mode / Away Mode etc.) ----
  function initModes() {
    document.querySelectorAll('button').forEach(function (b) {
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/^(All Lights Off|Night Mode|Away Mode)$/.test(t)) return;
      var key = 'mode:' + page() + ':' + t;
      function paint(on) {
        b.dataset.on = on ? '1' : '0';
        b.classList.toggle('ring-1', on);
        b.classList.toggle('ring-primary', on);
        b.classList.toggle('bg-surface-bright', on);
      }
      paint(sget(key, false));
      b.addEventListener('click', function () {
        var now = b.dataset.on !== '1';
        paint(now);
        sset(key, now);
      });
    });
  }

  // ---- header bell / gear, sidebar Add Device ----
  function initNav() {
    document.querySelectorAll('header button, aside button').forEach(function (b) {
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (t === 'notifications') b.addEventListener('click', function () { location.href = 'notifications.html'; });
      else if (t === 'settings') b.addEventListener('click', function () { location.href = 'settings.html'; });
      else if (t.indexOf('Add Device') !== -1) b.addEventListener('click', function () { location.href = 'add-device.html'; });
    });
  }

  // ---- notifications page: mark all read ----
  function initNotifications() {
    var btn = document.getElementById('mark-all-read');
    if (!btn) return;
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-unread]').forEach(function (d) { d.remove(); });
      btn.textContent = 'All caught up';
      btn.disabled = true;
      btn.classList.add('opacity-50');
    });
  }

  // ---- add-device page: scan + pair ----
  function initPairing() {
    var scan = document.getElementById('scan-btn');
    if (!scan) return;
    var results = document.getElementById('scan-results');
    var spinner = document.getElementById('scan-spinner');
    var finish = document.getElementById('finish-setup');
    scan.addEventListener('click', function () {
      scan.disabled = true;
      scan.classList.add('opacity-50');
      spinner.classList.remove('hidden');
      results.classList.add('hidden');
      setTimeout(function () {
        spinner.classList.add('hidden');
        results.classList.remove('hidden');
        results.querySelectorAll('[data-pair]').forEach(function (b) {
          b.addEventListener('click', function () {
            b.textContent = 'Paired';
            b.disabled = true;
            b.className = 'px-5 py-2 rounded-full bg-secondary/15 text-secondary text-sm font-bold';
            finish.classList.remove('hidden');
          });
        });
      }, 1600);
    });
    finish.addEventListener('click', function () { location.href = 'devices.html'; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSwitches(); initModes(); initNav(); initNotifications(); initPairing();
  });
})();
