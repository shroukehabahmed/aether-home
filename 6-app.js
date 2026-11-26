// Aether Home — demo interactivity (client-side state, persisted per browser)
(function () {
  function sget(k, d) { try { var v = localStorage.getItem('aether:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sset(k, v) { try { localStorage.setItem('aether:' + k, JSON.stringify(v)); } catch (e) {} cloudPut(k, v); }
  function cloudPut(k, v) { if (window.__sb && window.__sbuid) { try { sb().from('user_state').upsert({ user_id: window.__sbuid, key: k, value: v, updated_at: new Date().toISOString() }).then(function () {}); } catch (e) {} } }
  function page() { var p = location.pathname.split('/').pop(); return p || 'index.html'; }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function closestCard(el) { return el.closest('.group') || el.closest('[class*="rounded-xl"]') || el.parentElement; }

  // bilingual helper: Arabic when the interface is in Arabic
  function T(en, ar) { return window.__lang === 'ar' ? ar : en; }

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
        toast(label + ' ' + (now ? T('on','مشغل') : T('off','مطفأ')));
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
    document.querySelectorAll('[data-device-name]').forEach(function (c) { out.push(c); });
    if (out.length) return out;
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
          if (standby) badge.textContent = on ? T('ON','مشغل') : T('STANDBY','استعداد');
          else badge.textContent = on ? T('ON','مشغل') : T('OFF','مطفأ');
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
        toast(name + (now ? T(' on',' مشغل') : T(' off',' مطفأ')));
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
    wrap.children[0].addEventListener('click', function () { t = Math.max(60, t - 1); sset(key, t); paint(t); toast(T('Climate set to ','تم ضبط المناخ على ') + t + '°'); });
    wrap.children[1].addEventListener('click', function () { t = Math.min(85, t + 1); sset(key, t); paint(t); toast(T('Climate set to ','تم ضبط المناخ على ') + t + '°'); });
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
        label.textContent = locked ? T('Securely Locked','مقفل بأمان') : T('Unlocked','مفتوح');
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
      toast(T('Main Gate ','البوابة الرئيسية ') + (state ? T('locked','مقفلة') : T('unlocked','مفتوحة')));
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
      if (label) label.textContent = v == 0 ? T('Closed','مغلقة') : v + T('% Open','% مفتوحة');
    }
    paint(sget(key, 45));
    range.addEventListener('input', function () { var v = +range.value; sset(key, v); paint(v); });
    range.addEventListener('change', function () { toast(T('Study Blinds ','ستائر المكتب ') + (+range.value === 0 ? T('closed','مغلقة') : range.value + T('% open','% مفتوحة'))); });
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
      badge.textContent = live ? T('Live Feed','بث مباشر') : T('Paused','متوقف');
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
      toast(T('Front Entrance camera ','كاميرا المدخل الأمامي ') + (state ? T('live','مباشرة') : T('paused','متوقفة')));
    });
  }
  function initChips() {
    var chips = [];
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (/^(All Devices|Lighting|Climate|Security|Entertainment)$/.test(t)) { b.dataset.en = t; chips.push(b); }
    });
    if (!chips.length) return;
    var key = 'devices:chip';
    function paint(active) {
      chips.forEach(function (b) {
        var on = (b.dataset.en || txt(b)) === active;
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
      b.addEventListener('click', function () { var t = b.dataset.en || txt(b); sset(key, t); paint(t); });
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
      b.dataset.en = t;
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
        toast(t + (now ? T(' active',' مفعل') : T(' off',' مطفأ')));
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
        toast((name === 'lightbulb' ? T('Living room lights','أنوار غرفة المعيشة') : T('Climate','المناخ')) + (now ? T(' on',' مشغلة') : T(' off',' مطفأة')));
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
        status.textContent = locked ? T('Locked','مقفل') : T('Unlocked','مفتوح');
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
        live.childNodes[live.childNodes.length - 1].textContent = on ? T('LIVE','مباشر') : T('IDLE','خامل');
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
      btn.textContent = T('All caught up','لا جديد');
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
            b.textContent = T('Paired','تم الاقتران');
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

  // ================= v3: settings, profile, language, dead-button sweep =================

  // ---------- profile: name + avatar, applied on every page ----------
  function profileName() { return sget('profile:name', 'Julian Vane'); }
  function firstName() { return profileName().split(' ')[0]; }
  function applyProfile() {
    var av = sget('profile:avatar', null);
    if (av) {
      document.querySelectorAll('img').forEach(function (img) {
        var a = (img.getAttribute('alt') || '').toLowerCase();
        if (a.indexOf('profile') !== -1) img.src = av;
      });
    }
    // index greeting
    if (page() === 'index.html') {
      document.querySelectorAll('h2').forEach(function (h) {
        if (/^Good (morning|afternoon|evening),/.test(txt(h))) {
          var base = txt(h).split(',')[0];
          h.dataset.greetingBase = h.dataset.greetingBase || base;
          var greetMap = { 'Good morning': 'صباح الخير', 'Good afternoon': 'مساء الخير', 'Good evening': 'مساء الخير' };
          var base2 = h.dataset.greetingBase;
          var label = window.__lang === 'ar' ? (greetMap[base2] || base2) : base2;
          h.textContent = label + (window.__lang === 'ar' ? '، ' : ', ') + firstName();
        }
      });
    }
  }
  function initAvatarUpload() {
    if (page() !== 'settings.html') return;
    var btn = null;
    document.querySelectorAll('button').forEach(function (b) {
      var s = b.querySelector('.material-symbols-outlined');
      if (s && s.textContent === 'edit' && b.className.indexOf('absolute') !== -1) btn = b;
    });
    if (!btn) return;
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    btn.addEventListener('click', function () { inp.click(); });
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        sset('profile:avatar', r.result);
        applyProfile();
        toast('Profile photo updated');
      };
      r.readAsDataURL(f);
    });
  }

  // ---------- settings page ----------
  function initSettings() {
    if (page() !== 'settings.html') return;
    var bigName = null;
    document.querySelectorAll('h3').forEach(function (h) { if (!bigName && /Julian Vane/.test(h.textContent)) bigName = h; });
    if (bigName) bigName.textContent = profileName();
    // Personal Information fields -> editable
    var fields = {};
    document.querySelectorAll('label').forEach(function (lab) {
      var box = lab.nextElementSibling;
      if (!box || box.tagName !== 'DIV') return;
      var key = txt(lab);
      fields[key] = box;
      box.contentEditable = 'true';
      box.spellcheck = false;
      box.style.outline = 'none';
      box.title = 'Click to edit';
      box.addEventListener('focus', function () { box.style.boxShadow = '0 0 0 1px rgba(133,173,255,.5)'; });
      box.addEventListener('blur', function () { box.style.boxShadow = ''; });
    });
    var saved = sget('profile:fields', null);
    if (saved) Object.keys(saved).forEach(function (k) { if (fields[k]) fields[k].textContent = saved[k]; });
    if (fields['Full Name']) fields['Full Name'].textContent = profileName();
    function saveFields() {
      var data = {};
      Object.keys(fields).forEach(function (k) { data[k] = fields[k].textContent.trim(); });
      sset('profile:fields', data);
      if (data['Full Name']) {
        sset('profile:name', data['Full Name']);
        if (bigName) bigName.textContent = data['Full Name'];
      }
      toast(window.__lang === 'ar' ? 'تم حفظ التغييرات' : 'Changes saved');
    }
    // inline confirm bar under the Personal Information fields
    var piCard = null;
    document.querySelectorAll('h4').forEach(function (h) { if (txt(h) === 'Personal Information') piCard = h.closest('[class*="rounded-xl"]'); });
    var originals = {};
    Object.keys(fields).forEach(function (k) { originals[k] = fields[k].textContent; });
    if (piCard) {
      var bar = document.createElement('div');
      bar.className = 'flex gap-3 mt-6';
      bar.style.display = 'none';
      bar.innerHTML = '<button type="button" class="px-6 py-3 bg-gradient-to-br from-primary to-primary-container rounded-full font-headline font-bold text-sm text-on-primary-fixed shadow-lg">Confirm</button>'
        + '<button type="button" class="px-6 py-3 bg-surface-container-high rounded-full font-headline font-bold text-sm text-on-surface hover:bg-surface-bright transition-all">Cancel</button>';
      piCard.appendChild(bar);
      function dirty() {
        var d = false;
        Object.keys(fields).forEach(function (k) { if (fields[k].textContent !== originals[k]) d = true; });
        bar.style.display = d ? 'flex' : 'none';
      }
      Object.keys(fields).forEach(function (k) { fields[k].addEventListener('input', dirty); });
      bar.children[0].addEventListener('click', function () {
        saveFields();
        Object.keys(fields).forEach(function (k) { originals[k] = fields[k].textContent; });
        bar.style.display = 'none';
      });
      bar.children[1].addEventListener('click', function () {
        Object.keys(fields).forEach(function (k) { fields[k].textContent = originals[k]; });
        bar.style.display = 'none';
        toast(window.__lang === 'ar' ? 'تم الإلغاء' : 'Edit cancelled');
      });
    }
    // Save Changes
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'Save Changes') b.addEventListener('click', function () {
        saveFields();
        Object.keys(originals).forEach(function (k) { originals[k] = fields[k].textContent; });
      });
      if (t === 'Manage All' || /Manage All/.test(t)) b.addEventListener('click', function () { location.href = 'devices.html'; });
      if (t === 'MANAGE') b.addEventListener('click', function () {
        var days = [7, 30, 90];
        var cur = sget('settings:retention', 30);
        var next = days[(days.indexOf(cur) + 1) % days.length];
        sset('settings:retention', next);
        var sub = b.closest('.flex.items-center.gap-4');
        if (sub) { var p = sub.querySelector('.text-\\[10px\\]'); }
        var rows = document.querySelectorAll('.text-on-surface-variant');
        rows.forEach(function (el) { if (/Rolling \d+-day/.test(el.textContent)) el.textContent = T('Rolling ','نسخ احتياطي مشفر متجدد كل ') + next + T('-day encrypted backup',' يوماً'); });
        toast('Data retention: ' + next + ' days');
      });
      if (t === 'Download Security Report') b.addEventListener('click', function () {
        var rep = 'AETHER HOME - SECURITY REPORT\\nGenerated: ' + new Date().toLocaleString() + '\\n\\nSystem: Armed\\nSensors: 14 reporting\\nEncryption: AES-256 at rest, TLS 1.3 in transit\\nBackups: rolling ' + sget('settings:retention', 30) + '-day encrypted\\nFailed login attempts (7d): 0\\nFirmware: all nodes up to date\\n\\n(Demo report generated locally)';
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([rep], { type: 'text/plain' }));
        a.download = 'aether-security-report.txt';
        a.click();
        toast('Report downloaded');
      });
    });
    // node tiles
    document.querySelectorAll('.grid .bg-surface-container-high, .grid .border-dashed').forEach(function (tile) {
      var t = txt(tile);
      if (/Register New Node/.test(t)) tile.addEventListener('click', function () { location.href = 'add-device.html'; });
      else if (/Core Gateway|Porch Cam 4K|HVAC Controller/.test(t)) tile.addEventListener('click', function () { location.href = 'devices.html'; });
    });
  }

  // ---------- language: English / Arabic with RTL ----------
  var DICT = {
    'Dashboard': 'لوحة التحكم', 'Devices': 'الأجهزة', 'Automations': 'الأتمتة', 'Scenes': 'المشاهد',
    'Activity': 'النشاط', 'Settings': 'الإعدادات', 'Add Device': 'إضافة جهاز',
    'Device Management': 'إدارة الأجهزة', 'All Devices': 'كل الأجهزة', 'Lighting': 'الإضاءة',
    'Climate': 'المناخ', 'Security': 'الأمان', 'Entertainment': 'الترفيه', 'Filter': 'تصفية',
    'Energy': 'الطاقة', 'Notifications': 'الإشعارات', 'Overview': 'نظرة عامة',
    'All Lights Off': 'إطفاء كل الأنوار', 'Night Mode': 'الوضع الليلي', 'Away Mode': 'وضع الغياب',
    'Save Changes': 'حفظ التغييرات', 'Log Out': 'تسجيل الخروج',
    'Language': 'اللغة', 'Interface localization settings.': 'إعدادات لغة الواجهة.',
    'Environmental Alerts': 'التنبيهات البيئية', 'Control how your home communicates with you.': 'تحكم في طريقة تنبيه منزلك لك.',
    'Critical Security': 'الأمان الحرج', 'Leak detection, intrusion, fire alerts.': 'كشف التسرب والاقتحام والحريق.',
    'Efficiency Tips': 'نصائح الكفاءة', 'Energy saving and maintenance reminders.': 'تذكيرات توفير الطاقة والصيانة.',
    'Managed Nodes': 'الأجهزة المتصلة', 'Manage All': 'إدارة الكل', 'Register New Node': 'تسجيل جهاز جديد',
    'Personal Information': 'البيانات الشخصية', 'Full Name': 'الاسم الكامل', 'Email Address': 'البريد الإلكتروني',
    'Primary Contact': 'رقم التواصل', 'Address ID': 'معرف العنوان',
    'Privacy Vault': 'الخصوصية', 'Biometric Unlock': 'الفتح بالبصمة', 'Data Retention': 'الاحتفاظ بالبيانات',
    'Download Security Report': 'تحميل تقرير الأمان',
    'Confirm': 'تأكيد', 'Cancel': 'إلغاء',
    'Premium Resident • System Administrator': 'مقيم مميز • مدير النظام',
    'System Health': 'صحة النظام', 'Last Sync': 'آخر مزامنة', 'Energy usage': 'استهلاك الطاقة',
    'Active Nodes': 'الأجهزة النشطة', 'Alerts': 'التنبيهات', 'Network': 'الشبكة',
    'Mark all as read': 'تحديد الكل كمقروء', 'All caught up': 'لا جديد',
    'Scan for devices': 'بحث عن أجهزة', 'Pair': 'اقتران', 'Paired': 'تم الاقتران', 'Finish setup': 'إنهاء الإعداد',
    'Activate Scene': 'تفعيل المشهد', 'Scene Active': 'المشهد مفعل',
    'Export CSV': 'تصدير CSV', 'Clear History': 'مسح السجل', 'All Events': 'كل الأحداث', 'Critical': 'حرجة',
    'Kitchen Pendant': 'إضاءة المطبخ', 'Master Climate': 'مناخ الغرفة الرئيسية', 'Cinema 8K': 'سينما 8K',
    'Front Entrance': 'المدخل الأمامي', 'Lounge Audio': 'صوتيات الصالة', 'Main Gate': 'البوابة الرئيسية',
    'Study Blinds': 'ستائر المكتب', 'New Node': 'جهاز جديد', 'Register new hardware': 'تسجيل جهاز جديد',
    'ON': 'مشغل', 'OFF': 'مطفأ', 'STANDBY': 'استعداد', 'Securely Locked': 'مقفل بأمان', 'Unlocked': 'مفتوح',
    'Cooling': 'تبريد', 'Auto Mode': 'وضع تلقائي', 'Auto': 'تلقائي', 'State': 'الحالة', 'Target': 'الهدف',
    'Search devices...': 'ابحث في الأجهزة...', 'Search logs...': 'ابحث في السجل...',
    'Tap − / + to set temperature': 'اضغط − / + لضبط الحرارة'
    ,'Password': 'كلمة المرور', 'Confirm Password': 'تأكيد كلمة المرور', 'Email': 'البريد الإلكتروني',
    'Status': 'الحالة', 'Locked': 'مقفل', 'Closed': 'مغلقة', 'Live Feed': 'بث مباشر', 'Paused': 'متوقف',
    'LIVE': 'مباشر', 'IDLE': 'خامل', 'Create Account': 'إنشاء حساب',
    'Digital Curator': 'المنسق الرقمي', 'Active: Morning Scene': 'مفعل: مشهد الصباح',
    "It's 72° and Sunny in San Francisco. Your home is optimized.": 'الجو 72° ومشمس في سان فرانسيسكو. منزلك مضبوط على أفضل حال.',
    'Ambient Space': 'الأجواء العامة', '4 devices active • 68°F': '4 أجهزة نشطة • 68°F',
    'Master Bedroom': 'غرفة النوم الرئيسية', 'No motion detected': 'لا حركة مرصودة',
    "Chef's Kitchen": 'مطبخ الشيف', 'Coffee is ready': 'القهوة جاهزة',
    'Climate Control': 'التحكم في المناخ', 'Intelligent HVAC System': 'نظام تكييف ذكي', 'Active Devices': 'الأجهزة النشطة',
    'Personalize and control your living environment. Currently': 'خصص وتحكم في بيئة معيشتك. حالياً',
    '14 devices active': '14 جهازاً نشطاً', 'and functioning optimally.': 'وتعمل بكفاءة مثالية.',
    'No active stream': 'لا بث نشط', 'All network nodes reporting healthy status': 'كل الأجهزة المتصلة بحالة سليمة',
    'Main Island • Philips Hue': 'الجزيرة الرئيسية • Philips Hue', 'Zone 1 • Nest Pro': 'المنطقة 1 • Nest Pro',
    'Media Room • Samsung': 'غرفة الميديا • Samsung', 'Security • Arlo Ultra 2': 'الأمان • Arlo Ultra 2',
    'Living Room • Sonos Arc': 'غرفة المعيشة • Sonos Arc', 'Security • August Smart': 'الأمان • August Smart',
    'West Wing • Somfy': 'الجناح الغربي • Somfy',
    'Recommended for Now': 'مقترح الآن', 'Create Scene': 'إنشاء مشهد', 'Design your atmosphere': 'صمم أجواءك',
    'Dim lights to 20%, activate acoustic lounge mode, and set climate to 68°F.': 'خفت الإضاءة إلى 20%، تفعيل وضع الصالة الصوتي، وضبط المناخ على 68°F.',
    'Locks all doors, sets alarm for 7:00 AM, and engages night climate.': 'يقفل كل الأبواب، يضبط المنبه على 7:00 صباحاً، ويفعل مناخ الليل.',
    'Activates security cameras, turns off HVAC, and randomizes smart lighting.': 'يفعل كاميرات الأمان، يطفئ التكييف، ويوزع الإضاءة الذكية عشوائياً.',
    'Morning Pulse': 'نبض الصباح',
    'Opens blinds 40%, starts espresso machine, and plays morning briefing.': 'يفتح الستائر 40%، يشغل آلة الإسبريسو، ويشغل موجز الصباح.',
    'Switches lights to cool white (5000K), mutes phone notifications.': 'يحول الإضاءة إلى أبيض بارد (5000K)، ويكتم إشعارات الهاتف.',
    'Home Theater': 'السينما المنزلية',
    'Powers on projector, lowers screen, and triggers rear ambient LEDs.': 'يشغل البروجكتر، ينزل الشاشة، ويفعل الإضاءة الخلفية.',
    'Energy Saving': 'توفير الطاقة', 'High Efficiency': 'كفاءة عالية',
    '3 Household Members': '3 أفراد في المنزل', 'Home shared with family': 'المنزل مشترك مع العائلة',
    'Automated Living': 'الحياة المؤتمتة',
    'Intelligent routines designed to adapt to your lifestyle. 4 routines active today.': 'إجراءات ذكية تتكيف مع نمط حياتك. 4 إجراءات نشطة اليوم.',
    'Create New Rule': 'إنشاء قاعدة جديدة', 'Most Active Routine': 'أنشط إجراء',
    'Golden Hour Ambiance': 'أجواء الساعة الذهبية', 'Sunset in Austin': 'الغروب في أوستن',
    'Dynamic schedule': 'جدول ديناميكي', 'Living Room Scenes': 'مشاهد غرفة المعيشة',
    'Transition to Warm Glow': 'التحول إلى توهج دافئ', 'Edit Routine': 'تعديل الإجراء',
    'Routine Enabled': 'الإجراء مفعل', 'Weekly Efficiency': 'الكفاءة الأسبوعية', 'Energy Saved': 'الطاقة الموفر',
    'Your "Night Mode" and "Away" automations reduced HVAC usage by': 'أتمتة "الوضع الليلي" و"الغياب" خفضت استهلاك التكييف بنسبة',
    'Rise & Shine': 'استيقظ وتألق', 'Time is 07:00 AM': 'الساعة 07:00 صباحاً',
    'Blinds Open (50%) & Coffee Start': 'فتح الستائر (50%) وتشغيل القهوة',
    'Empty House Mode': 'وضع المنزل الفارغ', 'Last person leaves Geo-fence': 'آخر شخص يغادر النطاق الجغرافي',
    'Lock Doors & Enable Security': 'قفل الأبواب وتفعيل الأمان', 'Temp Control': 'التحكم في الحرارة',
    'Room Temp > 76°F': 'حرارة الغرفة > 76°F', 'AC On (72°F) & Close East Blinds': 'تشغيل التكييف (72°F) وغلق الستائر الشرقية',
    'Recommended for you': 'مقترح لك', 'Vacation Pattern': 'نمط الإجازة',
    'Mimic occupied presence by randomly cycling lights when away.': 'محاكاة وجود أشخاص بتبديل الإضاءة عشوائياً أثناء الغياب.',
    'Add to Library': 'إضافة إلى المكتبة', 'Deep Sleep Transition': 'انتقال النوم العميق',
    'Slowly dim bedroom lights to 0% over 30 minutes at bedtime.': 'خفت إضاءة غرفة النوم تدريجياً إلى 0% خلال 30 دقيقة عند النوم.',
    'Solar Smart Wash': 'الغسيل الشمسي الذكي',
    'Start dishwasher only when solar production is at peak.': 'تشغيل غسالة الأطباق فقط عند ذروة الإنتاج الشمسي.',
    'Activity Logs': 'سجل النشاط', 'Night Mode triggered': 'تم تفعيل الوضع الليلي',
    'All thermostats set to': 'تم ضبط كل منظمات الحرارة على', '. Curtains closed in 3 zones.': '. أُغلقت الستائر في 3 مناطق.',
    'Living Room Light turned on': 'أُضيء نور غرفة المعيشة', 'Triggered by': 'تم بواسطة',
    'Motion Sensor (East)': 'حساس الحركة (الشرق)', 'Brightness: 80% • Warm White': 'السطوع: 80% • أبيض دافئ',
    'Garage Door closed': 'أُغلق باب الجراج', 'Routine "Arrived Home" completed successfully.': 'اكتمل إجراء "الوصول للمنزل" بنجاح.',
    'Front Door Cam offline': 'كاميرا الباب الأمامي غير متصلة',
    'Signal loss detected for more than 5 minutes. Check router proximity or battery status.': 'فقدان الإشارة لأكثر من 5 دقائق. تحقق من قرب الراوتر أو حالة البطارية.',
    'Run Diagnostics': 'تشغيل التشخيص', 'Total Actions': 'إجمالي الإجراءات',
    'Network Connectivity': 'الاتصال بالشبكة', 'Excellent • 942 Mbps': 'ممتاز • 942 ميجابت/ث',
    'Kitchen Sensor': 'حساس المطبخ', 'Battery Low • 12%': 'البطارية منخفضة • 12%',
    'Sunrise Scene': 'مشهد الشروق', 'Coffee Maker Start': 'تشغيل صانعة القهوة',
    'Live and historical usage across every zone of your home.': 'استهلاك مباشر وسابق لكل مناطق منزلك.',
    '12% below average': 'أقل من المتوسط بنسبة 12%', 'vs 27.1 yesterday': 'مقارنة بـ 27.1 أمس',
    'On track for 618 kWh': 'في المسار نحو 618 كيلوواط/ساعة', '$9.20 saved by automations': 'وفرت الأتمتة $9.20',
    'Trim heating and idle loads automatically when usage spikes.': 'تقليل التدفئة والأحمال الخاملة تلقائياً عند ارتفاع الاستهلاك.',
    'Cameras, locks and sensors, armed and watched around the clock.': 'كاميرات وأقفال وحساسات، مفعّلة ومراقبة على مدار الساعة.',
    'System Armed': 'النظام مفعل', 'All 14 sensors reporting. Last check 42 seconds ago.': 'كل الـ 14 حساساً تعمل. آخر فحص منذ 42 ثانية.',
    'Porch Cam 4K': 'كاميرا المدخل 4K', 'Front entrance': 'المدخل الأمامي', 'Garage interior': 'داخل الجراج',
    'Locks & sensors': 'الأقفال والحساسات', 'Garage side door': 'الباب الجانبي للجراج',
    'Motion, living room': 'حركة، غرفة المعيشة', 'Leak sensor, kitchen': 'حساس تسرب، المطبخ',
    'Recent events': 'الأحداث الأخيرة', 'Front door locked': 'قُفل الباب الأمامي',
    '10:42 PM, by Away Mode': '10:42 م، بواسطة وضع الغياب', 'Motion at porch': 'حركة عند المدخل',
    '9:18 PM, recording saved': '9:18 م، تم حفظ التسجيل', 'System armed': 'تم تفعيل النظام',
    '9:00 PM, schedule': '9:00 م، جدولة', 'Garage side door unlocked': 'فُتح الباب الجانبي للجراج',
    '6:35 PM, by Julian': '6:35 م، بواسطة جوليان',
    'Alerts, automation runs and device updates from your home.': 'تنبيهات وتشغيلات الأتمتة وتحديثات الأجهزة من منزلك.',
    'Unusual activity window': 'نافذة نشاط غير معتاد',
    'Living room motion detected while Away Mode was on. Porch Cam recording saved.': 'رُصدت حركة في غرفة المعيشة أثناء تفعيل وضع الغياب. تم حفظ تسجيل كاميرا المدخل.',
    'Automation ran: Good Night': 'تشغيل أتمتة: تصبح على خير',
    'Lights off, thermostat 68°, doors locked, system armed.': 'الأنوار مطفأة، الحرارة 68°، الأبواب مقفلة، النظام مفعل.',
    'Energy goal reached': 'تم تحقيق هدف الطاقة', 'Yesterday came in 12% under your weekly target.': 'أمس كان أقل بنسبة 12% من هدفك الأسبوعي.',
    'New device paired': 'جهاز جديد متصل', 'Porch Cam 4K joined Aether Hub and was assigned to Outdoor.': 'انضمت كاميرا المدخل 4K إلى Aether Hub وأُسندت إلى الخارج.',
    'Leak sensor self-test passed': 'اجتاز حساس التسرب فحصه الذاتي', 'Kitchen sensor battery 86%, signal strong.': 'بطارية حساس المطبخ 86%، الإشارة قوية.',
    'Hub firmware updated': 'تم تحديث نظام المحور', 'Aether Hub restarted cleanly after v2.4.0-aura.': 'أعاد Aether Hub التشغيل بنجاح بعد v2.4.0-aura.',
    'Grow your home': 'وسع منزلك', 'Pair a new device with Aether Hub in under a minute.': 'اقرن جهازاً جديداً مع Aether Hub في أقل من دقيقة.',
    'Plug in the device and wait for its pairing light to blink.': 'وصل الجهاز بالكهرباء وانتظر وميض ضوء الاقتران.',
    'Aether Hub listens for nearby devices ready to pair.': 'يستمع Aether Hub للأجهزة القريبة الجاهزة للاقتران.',
    'Assign a room': 'حدد الغرفة', 'Name it, place it in a zone, and it joins your scenes.': 'سمه وضعه في منطقة، وسينضم إلى مشاهدك.',
    'Listening for devices...': 'جارٍ البحث عن أجهزة...', 'Found nearby': 'وُجد بالقرب',
    'Nest Thermostat': 'منظم حرارة Nest', 'Climate, 4.2 m away, signal strong': 'مناخ، على بعد 4.2 م، إشارة قوية',
    'Philips Hue Bridge': 'جسر Philips Hue', 'Lighting, 6.8 m away, signal good': 'إضاءة، على بعد 6.8 م، إشارة جيدة',
    'Camera, 9.1 m away, signal fair': 'كاميرا، على بعد 9.1 م، إشارة متوسطة',
    '6 Active devices connected to Aether Hub.': '6 أجهزة نشطة متصلة بـ Aether Hub.',
    'Core Gateway': 'البوابة الرئيسية', 'LIVING ROOM • 1.2 GBPS': 'غرفة المعيشة • 1.2 جيجابت/ث',
    'OUTDOOR • SECURE': 'الخارج • آمن', 'HVAC Controller': 'وحدة التكييف', 'CENTRAL • 72°F': 'مركزي • 72°F',
    'Enabled for all mobile nodes': 'مفعل لكل الأجهزة المحمولة', 'Rolling 30-day encrypted backup': 'نسخ احتياطي مشفر متجدد كل 30 يوماً',
    'Welcome back': 'مرحباً بعودتك', 'Securely access your curated environment.': 'ادخل بأمان إلى بيئتك المنسقة.',
    'Forgot Password?': 'نسيت كلمة المرور؟', 'Enter Workspace': 'دخول إلى مساحة العمل',
    'New to Aether?': 'جديد على Aether؟', 'Create new account': 'إنشاء حساب جديد',
    'Systems Nominal': 'الأنظمة تعمل بشكل طبيعي', '© 2024 Aether Home Digital Curator': '© 2024 Aether Home المنسق الرقمي',
    'The Digital Curator': 'المنسق الرقمي', 'Create your space.': 'أنشئ مساحتك.',
    'Begin your curation journey': 'ابدأ رحلة التنسيق', 'Already have an account?': 'لديك حساب بالفعل؟',
    'End-to-End Encrypted Ecosystem': 'نظام مشفر من الطرف إلى الطرف',
    'Reset Password': 'إعادة تعيين كلمة المرور',
    "Enter your registered email address below. We'll send a secure link to curate a new digital key for your sanctuary.": 'أدخل بريدك الإلكتروني المسجل أدناه. سنرسل لك رابطاً آمناً لإنشاء مفتاح رقمي جديد لملاذك.',
    'Send Reset Link': 'إرسال رابط إعادة التعيين', 'Return to Login': 'العودة لتسجيل الدخول'
  };
  function setLang(lang) {
    sset('lang', lang);
    location.reload();
  }
  function applyLang() {
    var lang = sget('lang', 'en');
    window.__lang = lang;
    if (lang !== 'ar') return;
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    var css = document.createElement('style');
    css.textContent = [
      'aside.fixed { left: auto !important; right: 0 !important; }',
      'main { margin-left: 0 !important; margin-right: 280px !important; }',
      'header.fixed { right: auto !important; left: 0 !important; margin-left: 0 !important; margin-right: auto !important; }',
      '@media (min-width: 901px) { header.fixed { width: calc(100% - 280px) !important; } }',
      '@media (max-width: 900px) { main { margin-right: 0 !important; } .aether-burger { left: auto !important; right: 14px; } header.fixed { padding-left: 1.25rem !important; padding-right: 4.5rem !important; }',
      '  aside.fixed { transform: translateX(105%) !important; } body.aether-drawer aside.fixed { transform: none !important; } }',
      '.material-symbols-outlined { direction: ltr; unicode-bidi: isolate; }',
      'input { text-align: right; }'
    ].join('\n');
    document.head.appendChild(css);
    // translate text nodes
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (!t) return;
      var trimmed = t.trim();
      if (DICT[trimmed]) {
        n.nodeValue = t.replace(trimmed, DICT[trimmed]);
      }
    });
    // placeholders
    document.querySelectorAll('input[placeholder]').forEach(function (i) {
      if (DICT[i.placeholder]) i.placeholder = DICT[i.placeholder];
    });
    // flip arrow icons
    document.querySelectorAll('.material-symbols-outlined').forEach(function (s) {
      if (s.textContent === 'arrow_forward') s.textContent = 'arrow_back';
    });
  }
  function initLangSwitch() {
    if (page() !== 'settings.html') return;
    var enBtn = null, arBtn = null;
    document.querySelectorAll('button').forEach(function (b) {
      var t = txt(b);
      if (t === 'English') enBtn = b;
      if (t === 'العربية') arBtn = b;
    });
    if (!enBtn || !arBtn) return;
    var lang = sget('lang', 'en');
    function paint() {
      var en = sget('lang', 'en') === 'en';
      enBtn.className = 'flex-1 py-2 font-headline text-xs rounded-full transition-all ' + (en ? 'bg-surface-container-highest text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface font-medium');
      arBtn.className = 'flex-1 py-2 font-headline text-xs rounded-full transition-all ' + (!en ? 'bg-surface-container-highest text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface font-medium');
    }
    paint();
    enBtn.addEventListener('click', function () { if (sget('lang', 'en') !== 'en') setLang('en'); });
    arBtn.addEventListener('click', function () { if (sget('lang', 'en') !== 'ar') setLang('ar'); });
  }

  // ---------- dead-button sweep ----------
  function initSweep() {
    // header avatars -> settings
    document.querySelectorAll('header img').forEach(function (img) {
      var a = (img.getAttribute('alt') || '').toLowerCase();
      if (a.indexOf('profile') === -1) return;
        var wrap = img.closest('div');
      if (wrap) { wrap.style.cursor = 'pointer'; wrap.addEventListener('click', function () { location.href = 'settings.html'; }); }
    });
    // sidebar brand -> index
    document.querySelectorAll('aside p, aside h1, aside h2, aside h3').forEach(function (el) {
      if (/DIGITAL CURATOR|Aether/i.test(el.textContent)) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () { location.href = 'index.html'; });
      }
    });
    if (page() === 'devices.html') {
      // Filter button -> sort menu
      var filterBtn = null;
      document.querySelectorAll('button').forEach(function (b) { if (/^tune Filter$|^Filter$/.test(txt(b))) filterBtn = b; });
      if (filterBtn) {
        var orders = ['Default', 'A to Z', 'Z to A'];
        filterBtn.addEventListener('click', function () {
          var cur = sget('devices:sort', 'Default');
          var next = orders[(orders.indexOf(cur) + 1) % orders.length];
          sset('devices:sort', next);
          var grid = document.querySelector('main .grid');
          var cards = deviceCards();
          if (next !== 'Default' && grid) {
            cards.sort(function (a, b2) {
              var r = a.dataset.deviceName.localeCompare(b2.dataset.deviceName);
              return next === 'A to Z' ? r : -r;
            });
            cards.forEach(function (c) { grid.appendChild(c); });
          } else if (grid) {
            var order = ['Kitchen Pendant', 'Master Climate', 'Cinema 8K', 'Front Entrance', 'Lounge Audio', 'Main Gate', 'Study Blinds'];
            order.forEach(function (n) { cards.forEach(function (c) { if (c.dataset.deviceName === n) grid.appendChild(c); }); });
          }
          toast('Sort: ' + next);
        });
      }
      // location tabs -> real filters
      var map = { 'Main Deck': null, 'Floor 1': ['Kitchen Pendant', 'Master Climate', 'Cinema 8K', 'Lounge Audio', 'Study Blinds'], 'Exterior': ['Front Entrance', 'Main Gate'] };
      document.querySelectorAll('header a, header div[onclick]').forEach(function (tab) {
        var t = txt(tab);
        if (!(t in map)) return;
        tab.addEventListener('click', function (e) {
          e.preventDefault();
          var sel = map[t];
          deviceCards().forEach(function (c) {
            c.style.display = !sel || sel.indexOf(c.dataset.deviceName) !== -1 ? '' : 'none';
          });
          document.querySelectorAll('header a').forEach(function (a2) {
            var on = txt(a2) === t;
            a2.classList.toggle('text-primary', on);
            a2.classList.toggle('border-b-2', on);
            a2.classList.toggle('border-primary', on);
          });
          toast(t + ' view');
        });
      });
    }
    // notifications: click a row to mark it read
    if (page() === 'notifications.html') {
      document.querySelectorAll('[data-unread]').forEach(function (dot) {
        var row = dot.closest('div[class*="rounded"]');
        if (!row) return;
        row.style.cursor = 'pointer';
        row.addEventListener('click', function () { dot.remove(); toast('Marked as read'); });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyProfile();
    initAvatarUpload();
    initSettings();
    initLangSwitch();
    initSweep();
    applyLang();
    if (window.__lang === 'ar') applyProfile();
  });

  // ================= v4: Supabase real accounts + database =================
  // Fill these two after creating the free Supabase project (see README, Phase 2).
  // Left empty, the app runs exactly as before: a local, per-browser demo.
  var SUPABASE_URL = 'https://ijwechvsgwaocorcpvmf.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_VQrgL7m4Y9AaCyzaEuY9Gg_ZP6LH6f7';

  function sb() { return window.__sb; }
  function lsSetOrig(k, v) { window.__lsSet.call(localStorage, k, v); }

  function bootCloud() {
    window.__sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var p = page();
    var isAuthPage = (p === 'login.html' || p === 'signup.html' || p === 'reset-password.html');
    sb().auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session && !isAuthPage) { location.href = 'login.html'; return; }
      if (session && isAuthPage) { location.href = 'index.html'; return; }
      if (session && !isAuthPage) cloudSync(session.user.id);
    }).catch(function () {});
    if (p === 'login.html') wireLogin();
    if (p === 'signup.html') wireSignup();
    if (p === 'reset-password.html') wireReset();
    wireLogout();
  }

  function cloudSync(uid) {
    window.__sbuid = uid;
    sb().from('user_state').select('key,value').then(function (r) {
      var remote = {};
      (r.data || []).forEach(function (row) { remote[row.key] = row.value; });
      // merge: remote wins where it exists (newest device wins on next write)
      Object.keys(remote).forEach(function (k) {
        try { lsSetOrig('aether:' + k, JSON.stringify(remote[k])); } catch (e) {}
      });
      // first login on this account: push local demo state up so nothing is lost
      var ups = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('aether:') !== 0) continue;
        var short = k.slice(7);
        if (!(short in remote)) {
          try { ups.push({ user_id: uid, key: short, value: JSON.parse(localStorage.getItem(k)), updated_at: new Date().toISOString() }); } catch (e) {}
        }
      }
      if (ups.length) sb().from('user_state').upsert(ups).then(function () {});
      // one reload per tab session so every page paints with the merged state
      if (!sessionStorage.getItem('aether:cloudSynced')) {
        sessionStorage.setItem('aether:cloudSynced', '1');
        location.reload();
      }
    });
  }

  function authInputs() { return Array.prototype.slice.call(document.querySelectorAll('input')); }
  function findSubmit() {
    var btn = null;
    document.querySelectorAll('button').forEach(function (b) {
      var oc = b.getAttribute('onclick') || '';
      if (/index\.html|login\.html/.test(oc)) btn = b;
    });
    if (btn) return btn;
    // auth pages: the primary gradient submit button (Sign In / Sign Up / Send link)
    document.querySelectorAll('button').forEach(function (b) {
      var t = (b.textContent || '').trim();
      if (/sign in|sign up|send|reset|تسجيل|إنشاء|إرسال|دخول/i.test(t) && !btn) btn = b;
    });
    return btn;
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  function wireLogin() {
    var inputs = authInputs(), email = null, pass = null;
    inputs.forEach(function (i) { if (i.type === 'email') email = i; if (i.type === 'password') pass = i; });
    var btn = findSubmit();
    if (!email || !pass || !btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!email.value || !pass.value) { toast(T('Enter your email and password', 'أدخل البريد وكلمة المرور')); return; }
      busy(btn, true, '...');
      sb().auth.signInWithPassword({ email: email.value.trim(), password: pass.value }).then(function (r) {
        if (r.error) { busy(btn, false); toast(T('Wrong email or password', 'البريد أو كلمة المرور غير صحيحة')); return; }
        location.href = 'index.html';
      }).catch(function () { busy(btn, false); toast(T('Connection error, try again', 'خطأ في الاتصال، حاول مرة أخرى')); });
    }, true);
  }

  function wireSignup() {
    var inputs = authInputs(), name = null, email = null, pwds = [];
    inputs.forEach(function (i) {
      if (i.type === 'text' && !name) name = i;
      if (i.type === 'email') email = i;
      if (i.type === 'password') pwds.push(i);
    });
    var btn = findSubmit();
    if (!name || !email || pwds.length < 2 || !btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!name.value.trim()) { toast(T('Enter your name', 'أدخل اسمك')); return; }
      if (!email.value) { toast(T('Enter your email', 'أدخل بريدك الإلكتروني')); return; }
      if (pwds[0].value.length < 6) { toast(T('Password must be at least 6 characters', 'كلمة المرور 6 أحرف على الأقل')); return; }
      if (pwds[0].value !== pwds[1].value) { toast(T('Passwords do not match', 'كلمتا المرور غير متطابقتين')); return; }
      busy(btn, true, '...');
      sb().auth.signUp({ email: email.value.trim(), password: pwds[0].value, options: { data: { full_name: name.value.trim() } } }).then(function (r) {
        if (r.error) { busy(btn, false); toast(r.error.message); return; }
        try { lsSetOrig('aether:profile:name', JSON.stringify(name.value.trim())); } catch (e2) {}
        location.href = 'index.html';
      }).catch(function () { busy(btn, false); toast(T('Connection error, try again', 'خطأ في الاتصال، حاول مرة أخرى')); });
    }, true);
  }

  function wireReset() {
    var email = document.querySelector('input[type="email"]');
    var btn = findSubmit();
    if (!email || !btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!email.value) { toast(T('Enter your email', 'أدخل بريدك الإلكتروني')); return; }
      busy(btn, true, '...');
      sb().auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + location.pathname.replace(/[^\/]*$/, 'login.html') }).then(function (r) {
        busy(btn, false);
        if (r.error) { toast(r.error.message); return; }
        toast(T('Reset link sent, check your email', 'تم إرسال الرابط، راجع بريدك'));
      }).catch(function () { busy(btn, false); toast(T('Connection error, try again', 'خطأ في الاتصال، حاول مرة أخرى')); });
    }, true);
  }

  function wireLogout() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button, a') : null;
      if (!b) return;
      var t = (b.textContent || '').trim();
      if (t !== 'Log Out' && t !== 'تسجيل الخروج') return;
      e.preventDefault(); e.stopImmediatePropagation();
      var done = function () {
        var kill = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('aether:') === 0) kill.push(k); }
        kill.forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.removeItem('aether:cloudSynced');
        location.href = 'login.html';
      };
      if (window.__sb) sb().auth.signOut().then(done, done); else done();
    }, true);
  }

  (function initCloud() {
    window.__lsSet = localStorage.setItem;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    var sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    sc.onload = bootCloud;
    document.head.appendChild(sc);
  })();

})();
