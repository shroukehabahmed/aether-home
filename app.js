// Aether Home — demo interactivity (client-side state, persisted per browser)
(function () {
  function sget(k, d) { try { var v = localStorage.getItem('aether:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sset(k, v) { try { localStorage.setItem('aether:' + k, JSON.stringify(v)); } catch (e) {} }
  function page() { var p = location.pathname.split('/').pop(); return p || 'index.html'; }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function closestCard(el) { return el.closest('.group') || el.closest('[class*="rounded-xl"]') || el.parentElement; }

  // ---------- toast ----------
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1f1f22;color:#fefbfe;border:1px solid rgba(133,173,255,.25);padding:10px 20px;border-radius:999px;font:600 13px Inter,sans-serif;z-index:100;opacity:0;transition:all .25s ease;pointer-events:none;max-width:90vw;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    clearTimeout(toastTimer);
    requestAnimationFrame(function () { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateX(-50%) translateY(0)'; });
    toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateX(-50%) translateY(20px)'; }, 1800);
  }

  // ---------- responsive shell (phone / small screens) ----------
  function initShell() {
    var aside = document.querySelector('aside.fixed');
    if (!aside) return;
    var css = document.createElement('style');
    css.textContent = [
      '@media (max-width: 900px) {',
      '  html, body { overflow-x: hidden !important; }',
      '  aside.fixed { transform: translateX(-105%); transition: transform .25s ease; overflow-y: auto; }',
      '  body.aether-drawer aside.fixed { transform: none; box-shadow: 40px 0 80px rgba(0,0,0,.6); }',
      '  main { margin-left: 0 !important; padding-left: 1.25rem !important; padding-right: 1.25rem !important; }',
      '  header.fixed { width: 100% !important; margin-left: 0 !important; left: 0 !important; padding-left: 4.5rem !important; padding-right: 1.25rem !important; }',
      '  main .grid { grid-template-columns: 1fr !important; }',
      '  main section > .flex.justify-between.items-end { flex-wrap: wrap; row-gap: 1rem; }',
      '  main section .flex { flex-wrap: wrap; }',
      '  main h1, main h2, main h3 { overflow-wrap: break-word; }',
      '  main h1.text-6xl, main h2.text-6xl { font-size: 2.6rem !important; line-height: 1.05 !important; }',
      '  main h1.text-5xl, main h2.text-5xl { font-size: 2.2rem !important; line-height: 1.1 !important; }',
      '  main .grid > [class*="col-span"] { grid-column: span 1 / span 1 !important; }',
      '  .aether-burger { display: flex !important; }',
      '  body.aether-drawer .aether-scrim { display: block !important; }',
      '}',
      '.aether-burger { display: none; position: fixed; top: 14px; left: 14px; z-index: 70; width: 44px; height: 44px; border-radius: 999px; background: rgba(31,31,34,.9); backdrop-filter: blur(8px); border: 1px solid rgba(133,173,255,.25); color: #fefbfe; align-items: center; justify-content: center; cursor: pointer; }',
      '.aether-scrim { display: none; position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,.55); }'
    ].join('\n');
    document.head.appendChild(css);
    var burger = document.createElement('button');
    burger.className = 'aether-burger';
    burger.setAttribute('aria-label', 'Menu');
    burger.innerHTML = '<span class="material-symbols-outlined">menu</span>';
    burger.addEventListener('click', function () { document.body.classList.toggle('aether-drawer'); });
    document.body.appendChild(burger);
    var scrim = document.createElement('div');
    scrim.className = 'aether-scrim';
    scrim.addEventListener('click', function () { document.body.classList.remove('aether-drawer'); });
    document.body.appendChild(scrim);
    aside.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('aether-drawer'); });
    });
  }

  // ---------- generic small toggle switches (w-10/12 h-5/6) ----------
  function isSwitch(el) {
    return el && el.tagName === 'DIV' && /\bw-(10|12)\b/.test(el.className) && /\bh-(5|6)\b/.test(el.className)
      && el.className.indexOf('rounded-full') !== -1 && el.querySelector('div');
  }
  function swLabel(el) {
    var row = el.closest('div[class*="flex"]');
    return page() + ':' + txt(row).slice(0, 48);
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
      var label = txt(el.closest('div[class*="flex"]')).split(' ')[0] || 'Switch';
      setSwitch(el, sget(key, el.classList.contains('bg-primary')));
      el.addEventListener('click', function () {
        var now = el.dataset.on !== '1';
        setSwitch(el, now);
        sset(key, now);
        toast(label + ' ' + (now ? 'on' : 'off'));
      });
    });
  }

  // ---------- devices page ----------
  var CATS = { 'Kitchen Pendant': 'Lighting', 'Master Climate': 'Climate', 'Cinema 8K': 'Entertainment', 'Front Entrance': 'Security', 'Lounge Audio': 'Entertainment', 'Main Gate': 'Security', 'Study Blinds': 'Climate' };

  function paintPower(track, on) {
    var knob = track.querySelector('div');
    track.dataset.on = on ? '1' : '0';
    track.classList.toggle('bg-primary/20', on);
    track.classList.toggle('bg-surface-container-highest', !on);
    knob.classList.toggle('bg-primary', on);
    knob.classList.toggle('shadow-primary/40', on);
    knob.classList.toggle('bg-on-surface-variant', !on);
    knob.classList.toggle('ml-auto', on);
    knob.classList.remove('shadow-lg');
    knob.classList.add(on ? 'shadow-lg' : 'shadow');
  }
  function deviceCards() {
    var out = [];
    document.querySelectorAll('h3').forEach(function (h) {
      var name = txt(h);
      if (CATS[name]) { var c = closestCard(h); if (c && out.indexOf(c) === -1) { c.dataset.deviceName = name; out.push(c); } }
    });
    return out;
  }
  function initDevicePower() {
    deviceCards().forEach(function (card) {
      var name = card.dataset.deviceName;
      var track = card.querySelector('div.h-10.w-20.rounded-full');
      if (!track) return;
      track.style.cursor = 'pointer';
      var key = 'dev:' + name;
      var badge = card.querySelector('span.text-secondary, span.text-on-surface-variant.font-semibold, span.text-xs.font-semibold');
      var dot = card.querySelector('.w-3.h-3.rounded-full');
      var standby = /standby/i.test(badge ? badge.textContent : '');
      function paint(on) {
        paintPower(track, on);
        if (badge) {
          if (standby) badge.textContent = on ? 'ON' : 'STANDBY';
          else badge.textContent = on ? 'ON' : 'OFF';
          badge.classList.toggle('text-secondary', on);
          badge.classList.toggle('text-on-surface-variant', !on);
        }
        if (dot) {
          dot.classList.toggle('bg-secondary', on);
          dot.classList.toggle('bg-on-surface-variant', !on);
        }
      }
      paint(sget(key, true));
      track.addEventListener('click', function () {
        var now = track.dataset.on !== '1';
        sset(key, now);
        paint(now);
        toast(name + (now ? ' on' : ' off'));
      });
    });
  }
  function initThermostat() {
    var card;
    deviceCards().forEach(function (c) { if (c.dataset.deviceName === 'Master Climate') card = c; });
    if (!card) return;
    var disp = null;
    card.querySelectorAll('div').forEach(function (d) { if (/^\d+°$/.test(txt(d)) && !disp) disp = d; });
    var bar = card.querySelector('.bg-gradient-to-r');
    if (!disp) return;
    var key = 'dev:Master Climate:temp';
    var wrap = document.createElement('div');
    wrap.className = 'flex items-center gap-3 mt-4';
    wrap.innerHTML = '<button type="button" class="w-10 h-10 rounded-full bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xl font-bold transition-colors" aria-label="Cooler">−</button>'
      + '<button type="button" class="w-10 h-10 rounded-full bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xl font-bold transition-colors" aria-label="Warmer">+</button>'
      + '<span class="text-xs text-on-surface-variant ml-1">Tap − / + to set temperature</span>';
    disp.parentElement.classList.add('text-right');
    card.querySelector('.mt-8') && card.querySelector('.mt-8').appendChild(wrap);
    function paint(t) {
      disp.textContent = t + '°';
      if (bar) bar.style.width = Math.round((t - 60) / 25 * 100) + '%';
    }
    var t = sget(key, 72);
    paint(t);
    wrap.children[0].addEventListener('click', function () { t = Math.max(60, t - 1); sset(key, t); paint(t); toast('Climate set to ' + t + '°'); });
    wrap.children[1].addEventListener('click', function () { t = Math.min(85, t + 1); sset(key, t); paint(t); toast('Climate set to ' + t + '°'); });
  }
  function initLock() {
    var card;
    deviceCards().forEach(function (c) { if (c.dataset.deviceName === 'Main Gate') card = c; });
    if (!card) return;
    var btn = card.querySelector('button');
    var label = null;
    card.querySelectorAll('span').forEach(function (s) { if (/Securely Locked|Unlocked/i.test(s.textContent)) label = s; });
    var icon = card.querySelector('.material-symbols-outlined[data-icon="lock"], .material-symbols-outlined');
    var key = 'dev:Main Gate:locked';
    function paint(locked) {
      if (label) {
        label.textContent = locked ? 'Securely Locked' : 'Unlocked';
        label.classList.toggle('text-secondary', locked);
        label.classList.toggle('text-tertiary', !locked);
      }
      if (icon) icon.textContent = locked ? 'lock' : 'lock_open';
    }
    var state = sget(key, true);
    paint(state);
    if (btn) btn.addEventListener('click', function () {
      state = !state;
      sset(key, state);
      paint(state);
      toast('Main Gate ' + (state ? 'locked' : 'unlocked'));
    });
  }
  function initBlinds() {
    var card;
    deviceCards().forEach(function (c) { if (c.dataset.deviceName === 'Study Blinds') card = c; });
    if (!card) return;
    var range = card.querySelector('input[type="range"]');
    if (!range) return;
    var label = null;
    card.querySelectorAll('span').forEach(function (s) { if (/% Open/.test(s.textContent)) label = s; });
    var key = 'dev:Study Blinds:pos';
    function paint(v) {
      range.value = v;
      if (label) label.textContent = v == 0 ? 'Closed' : v + '% Open';
    }
    paint(sget(key, 45));
    range.addEventListener('input', function () { var v = +range.value; sset(key, v); paint(v); });
    range.addEventListener('change', function () { toast('Study Blinds ' + (+range.value === 0 ? 'closed' : range.value + '% open')); });
  }
  function initCamera() {
    var card;
    deviceCards().forEach(function (c) { if (c.dataset.deviceName === 'Front Entrance') card = c; });
    if (!card) return;
    var badge = null;
    card.querySelectorAll('span').forEach(function (s) { if (/Live Feed/i.test(s.textContent)) badge = s; });
    if (!badge) return;
    var pill = badge.parentElement;
    var img = card.querySelector('img');
    var rec = card.querySelector('.animate-pulse') && card.querySelector('.animate-pulse').parentElement;
    pill.style.cursor = 'pointer';
    var key = 'dev:Front Entrance:live';
    function paint(live) {
      badge.textContent = live ? 'Live Feed' : 'Paused';
      pill.classList.toggle('bg-error/20', live);
      pill.classList.toggle('bg-surface-container-highest', !live);
      if (img) img.classList.toggle('opacity-30', !live);
      if (rec) rec.style.display = live ? '' : 'none';
    }
    var state = sget(key, true);
    paint(state);
    pill.addEventListener('click', function () {
      state = !state;
      sset(key, state);
      paint(state);
      toast('Front Entrance camera ' + (state ? 'live' : 'paused'));
    });
  }
  function initChips() {
    var chips = [];
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (/^(All Devices|Lighting|Climate|Security|Entertainment)$/.test(t)) chips.push(b);
    });
    if (!chips.length) return;
    var key = 'devices:chip';
    function paint(active) {
      chips.forEach(function (b) {
        var on = txt(b) === active;
        b.classList.toggle('bg-primary', on);
        b.classList.toggle('text-on-primary-fixed', on);
        b.classList.toggle('bg-surface-container-high', !on);
        b.classList.toggle('text-on-surface-variant', !on);
      });
      deviceCards().forEach(function (c) {
        var show = active === 'All Devices' || CATS[c.dataset.deviceName] === active;
        c.style.display = show ? '' : 'none';
      });
    }
    paint(sget(key, 'All Devices'));
    chips.forEach(function (b) {
      b.addEventListener('click', function () { var t = txt(b); sset(key, t); paint(t); });
    });
  }
  function initGridList() {
    var gridBtn = null, listBtn = null;
    document.querySelectorAll('button .material-symbols-outlined').forEach(function (s) {
      if (s.textContent === 'grid_view' && !gridBtn) gridBtn = s.closest('button');
      if ((s.textContent === 'list' || s.textContent === 'format_list_bulleted') && !listBtn) listBtn = s.closest('button');
    });
    if (!gridBtn || !listBtn) return;
    var grid = document.querySelector('main .grid');
    if (!grid) return;
    var key = page() + ':view';
    function paint(mode) {
      gridBtn.classList.toggle('bg-primary/10', mode === 'grid');
      gridBtn.classList.toggle('text-primary', mode === 'grid');
      gridBtn.classList.toggle('text-on-surface-variant', mode !== 'grid');
      listBtn.classList.toggle('bg-primary/10', mode === 'list');
      listBtn.classList.toggle('text-primary', mode === 'list');
      listBtn.classList.toggle('text-on-surface-variant', mode !== 'list');
      if (mode === 'list') {
        grid.dataset.origClass = grid.dataset.origClass || grid.className;
        grid.className = 'flex flex-col gap-4';
      } else if (grid.dataset.origClass) {
        grid.className = grid.dataset.origClass;
      }
    }
    paint(sget(key, 'grid'));
    gridBtn.addEventListener('click', function () { sset(key, 'grid'); paint('grid'); });
    listBtn.addEventListener('click', function () { sset(key, 'list'); paint('list'); });
  }
  function initSearch() {
    var input = document.querySelector('input[placeholder*="Search devices"]');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase();
      deviceCards().forEach(function (c) {
        c.style.display = !q || c.dataset.deviceName.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }
  function initNewNode() {
    document.querySelectorAll('h3').forEach(function (h) {
      if (txt(h) !== 'New Node') return;
      var card = closestCard(h);
      if (card) card.addEventListener('click', function () { location.href = 'add-device.html'; });
    });
  }

  // ---------- mode buttons (All Lights Off / Night Mode / Away Mode) ----------
  function initModes() {
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
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
        toast(t + (now ? ' active' : ' off'));
      });
    });
  }

  // ---------- index page extras ----------
  function initIndex() {
    if (page() !== 'index.html') return;
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'Manage') b.addEventListener('click', function () { location.href = 'devices.html'; });
      if (t === 'View All') b.addEventListener('click', function () { location.href = 'activity.html'; });
      var icon = b.querySelector('.material-symbols-outlined');
      if (icon && (icon.textContent === 'auto_awesome') && b.className.indexOf('w-16') !== -1) {
        b.addEventListener('click', function () { location.href = 'scenes.html'; });
      }
    });
    // round hero toggles (lightbulb / thermostat)
    document.querySelectorAll('button.w-12.h-12.rounded-full').forEach(function (b) {
      var icon = b.querySelector('.material-symbols-outlined');
      if (!icon) return;
      var name = icon.textContent;
      var key = 'hero:' + name;
      function paint(on) {
        b.dataset.on = on ? '1' : '0';
        b.classList.toggle('bg-primary', on);
        icon.classList.toggle('text-on-primary-container', on);
      }
      paint(sget(key, false));
      b.addEventListener('click', function () {
        var now = b.dataset.on !== '1';
        paint(now);
        sset(key, now);
        toast((name === 'lightbulb' ? 'Living room lights' : 'Climate') + (now ? ' on' : ' off'));
      });
    });
    // Auto / Cooling pair
    var pair = [];
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'Auto' || t === 'Cooling') pair.push(b);
    });
    if (pair.length === 2) {
      var key = 'index:climate-mode';
      function paint(mode) {
        pair.forEach(function (b) {
          var on = txt(b) === mode;
          b.classList.toggle('bg-primary/10', on);
          b.classList.toggle('text-primary', on);
          b.classList.toggle('bg-surface-container-highest', !on);
          b.classList.toggle('text-on-surface', !on);
        });
      }
      paint(sget(key, 'Cooling'));
      pair.forEach(function (b) { b.addEventListener('click', function () { var t = txt(b); sset(key, t); paint(t); toast('Climate mode: ' + t); }); });
    }
    // room quick toggles (valve / check_circle style square buttons)
    document.querySelectorAll('button.p-4.rounded-xl').forEach(function (b, i) {
      var key = 'roombtn:' + i + ':' + txt(b);
      function paint(on) {
        b.dataset.on = on ? '1' : '0';
        b.classList.toggle('border', on);
        b.classList.toggle('border-primary/40', on);
      }
      paint(sget(key, b.className.indexOf('border-secondary') !== -1));
      b.addEventListener('click', function () {
        var now = b.dataset.on !== '1';
        paint(now);
        sset(key, now);
        toast(txt(b) + (now ? ' on' : ' off'));
      });
    });
  }

  // ---------- scenes page ----------
  function initScenes() {
    if (page() !== 'scenes.html') return;
    var heroBtn = null;
    document.querySelectorAll('button').forEach(function (b) { if (/Activate Scene/.test(txt(b))) heroBtn = b; });
    function setHeroState(on) {
      if (!heroBtn) return;
      heroBtn.innerHTML = on
        ? '<span class="material-symbols-outlined" data-weight="fill">check</span> Scene Active'
        : '<span class="material-symbols-outlined" data-weight="fill">play_arrow</span> Activate Scene';
    }
    if (heroBtn) {
      var key = 'scene:Evening Sanctuary';
      setHeroState(sget(key, false));
      heroBtn.addEventListener('click', function () {
        var now = !sget(key, false);
        sset(key, now);
        setHeroState(now);
        toast(now ? 'Evening Sanctuary active — lights 20%, climate 68°F' : 'Evening Sanctuary off');
      });
    }
    document.querySelectorAll('.glass-card').forEach(function (card) {
      var h = card.querySelector('h3');
      if (!h) return;
      var name = txt(h);
      var dot = card.querySelector('.w-3.h-3.rounded-full');
      if (!dot) return;
      var key = 'scene:' + name;
      function paint(on) {
        dot.classList.toggle('bg-secondary', on);
        dot.classList.toggle('shadow-[0_0_12px_rgba(111,251,133,0.5)]', on);
        dot.classList.toggle('bg-outline-variant/30', !on);
        card.classList.toggle('ring-1', on);
        card.classList.toggle('ring-secondary/40', on);
      }
      paint(sget(key, false));
      card.addEventListener('click', function () {
        var now = !sget(key, false);
        sset(key, now);
        paint(now);
        toast(name + (now ? ' active' : ' off'));
      });
    });
    var custom = null;
    document.querySelectorAll('button').forEach(function (b) { if (/Custom Scene|Create/i.test(txt(b)) && b.className.indexOf('border-dashed') !== -1) custom = b; });
    if (custom) custom.addEventListener('click', function () {
      var name = prompt('Name your scene:', 'My Scene');
      if (!name) return;
      var grid = custom.parentElement;
      var card = document.createElement('div');
      card.className = 'glass-card rounded-lg p-6 flex flex-col justify-between group cursor-pointer hover:bg-surface-container transition-all duration-300 ring-1 ring-secondary/40';
      card.innerHTML = '<div class="flex justify-between items-start mb-12"><div class="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary"><span class="material-symbols-outlined" data-weight="fill">auto_awesome</span></div><div class="w-3 h-3 rounded-full bg-secondary shadow-[0_0_12px_rgba(111,251,133,0.5)]"></div></div><div><h3 class="text-xl font-headline font-bold text-on-surface mb-2"></h3><p class="text-sm text-on-surface-variant mb-6">Custom scene created in this demo.</p></div>';
      card.querySelector('h3').textContent = name;
      grid.insertBefore(card, custom.nextSibling);
      var customs = sget('scene:custom', []);
      customs.push(name);
      sset('scene:custom', customs);
      toast(name + ' created and active');
    });
  }

  // ---------- automations page ----------
  function initAutomations() {
    if (page() !== 'automations.html') return;
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'Delete' || (b.querySelector('.material-symbols-outlined') && b.querySelector('.material-symbols-outlined').textContent === 'delete')) {
        b.addEventListener('click', function () {
          var row = b.closest('div[class*="rounded"]');
          var name = txt(row).slice(0, 40);
          row.style.transition = 'opacity .3s';
          row.style.opacity = '0';
          setTimeout(function () { row.style.display = 'none'; }, 300);
          var del = sget('auto:deleted', []);
          del.push(name);
          sset('auto:deleted', del);
          toast('Automation deleted');
        });
      }
    });
    var create = null;
    document.querySelectorAll('button').forEach(function (b) { if (/Create|New Automation|Create Automation/i.test(txt(b)) && !create) create = b; });
    if (create) create.addEventListener('click', function () {
      var name = prompt('Name your automation:', 'Weekend Morning');
      if (name) toast('Automation "' + name + '" created (demo)');
    });
  }

  // ---------- security page ----------
  function initSecurity() {
    if (page() !== 'security.html') return;
    // lock rows
    document.querySelectorAll('.space-y-5 > div').forEach(function (row) {
      var status = row.querySelector(':scope > span');
      var icon = row.querySelector('.material-symbols-outlined');
      if (!status || !icon) return;
      if (!/^(Locked|Unlocked)$/.test(txt(status))) return;
      var nameEl = row.querySelector('.font-medium');
      var name = txt(nameEl);
      var key = 'sec:' + name;
      row.style.cursor = 'pointer';
      var state = sget(key, txt(status) === 'Locked');
      function paint(locked) {
        state = locked;
        status.textContent = locked ? 'Locked' : 'Unlocked';
        status.classList.toggle('text-secondary', locked);
        status.classList.toggle('text-tertiary', !locked);
        icon.textContent = locked ? 'lock' : 'lock_open';
        icon.classList.toggle('text-primary', locked);
        icon.classList.toggle('text-tertiary', !locked);
      }
      paint(state);
      row.addEventListener('click', function () {
        paint(!state);
        sset(key, state);
        toast(name + ' ' + (state ? 'locked' : 'unlocked'));
      });
    });
    // camera cards
    document.querySelectorAll('.grid .bg-surface-container-low').forEach(function (card) {
      var live = card.querySelector('span.text-xs.font-bold');
      var nameEl = card.querySelector('p.font-headline');
      if (!live || !nameEl) return;
      var statusTxt = txt(live);
      if (!/^(LIVE|IDLE)$/.test(statusTxt)) return;
      var icon = card.querySelector('.material-symbols-outlined');
      var dotEl = live.querySelector('span');
      var key = 'cam:' + txt(nameEl);
      card.style.cursor = 'pointer';
      var state = sget(key, statusTxt === 'LIVE');
      function paint(on) {
        state = on;
        live.childNodes[live.childNodes.length - 1].textContent = on ? 'LIVE' : 'IDLE';
        live.classList.toggle('text-secondary', on);
        live.classList.toggle('text-on-surface-variant', !on);
        if (dotEl) { dotEl.classList.toggle('bg-secondary', on); dotEl.classList.toggle('bg-on-surface-variant', !on); }
        if (icon) icon.textContent = on ? 'videocam' : 'videocam_off';
      }
      paint(state);
      card.addEventListener('click', function () {
        paint(!state);
        sset(key, state);
        toast(txt(nameEl) + (state ? ' live' : ' idle'));
      });
    });
  }

  // ---------- activity page ----------
  function initActivity() {
    if (page() !== 'activity.html') return;
    var tabs = [];
    document.querySelectorAll('header span.cursor-pointer, header span.text-\\[\\#85adff\\]').forEach(function () {});
    document.querySelectorAll('header span').forEach(function (s) {
      var t = txt(s);
      if (/^(All Events|Critical|Energy)$/.test(t)) tabs.push(s);
    });
    if (tabs.length) {
      var items = [];
      document.querySelectorAll('.relative.pl-16').forEach(function (it) { items.push(it); });
      function paint(active) {
        tabs.forEach(function (s) {
          var on = txt(s) === active;
          s.classList.toggle('text-[#85adff]', on);
          s.classList.toggle('font-bold', on);
        });
        items.forEach(function (it) {
          var body = txt(it).toLowerCase();
          var show = active === 'All Events'
            || (active === 'Critical' && /lock|security|alert|camera|alarm|smoke|leak/.test(body))
            || (active === 'Energy' && /energy|climate|thermostat|hvac|power|solar/.test(body));
          it.style.display = show ? '' : 'none';
        });
      }
      tabs.forEach(function (s) {
        s.style.cursor = 'pointer';
        s.addEventListener('click', function () { paint(txt(s)); });
      });
      paint('All Events');
    }
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'Clear History') b.addEventListener('click', function () {
        document.querySelectorAll('.relative.pl-16').forEach(function (it) { it.style.display = 'none'; });
        toast('History cleared for this demo session');
      });
      if (t === 'Export CSV') b.addEventListener('click', function () {
        var rows = [['Time', 'Category', 'Event']];
        document.querySelectorAll('.relative.pl-16').forEach(function (it) {
          var time = txt(it.querySelector('span.font-medium'));
          var cat = txt(it.querySelector('span.uppercase'));
          var ev = txt(it.querySelector('h4'));
          if (ev) rows.push([time, cat, ev]);
        });
        var csv = rows.map(function (r) { return r.map(function (c) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'aether-activity.csv';
        a.click();
        toast('Activity exported');
      });
    });
    var search = document.querySelector('input[placeholder*="Search logs"]');
    if (search) search.addEventListener('input', function () {
      var q = search.value.toLowerCase();
      document.querySelectorAll('.relative.pl-16').forEach(function (it) {
        it.style.display = !q || txt(it).toLowerCase().indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }

  // ---------- header bell / gear, sidebar Add Device ----------
  function initNav() {
    document.querySelectorAll('header button, aside button').forEach(function (b) {
      var t = txt(b);
      if (t === 'notifications') b.addEventListener('click', function () { location.href = 'notifications.html'; });
      else if (t === 'settings') b.addEventListener('click', function () { location.href = 'settings.html'; });
      else if (t.indexOf('Add Device') !== -1) b.addEventListener('click', function () { location.href = 'add-device.html'; });
    });
  }

  // ---------- notifications page ----------
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

  // ---------- add-device page ----------
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
    initShell();
    initSwitches();
    if (page() === 'devices.html') {
      initDevicePower(); initThermostat(); initLock(); initBlinds(); initCamera();
      initChips(); initGridList(); initSearch(); initNewNode();
    }
    initModes();
    initIndex();
    initScenes();
    initAutomations();
    initSecurity();
    initActivity();
    initNav();
    initNotifications();
    initPairing();
  });
})();
