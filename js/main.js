/* =========================================================================
   DB Mimarlık — etkileşim katmanı
   ========================================================================= */
document.documentElement.classList.add('js');

const RM    = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAVE  = navigator.connection && (navigator.connection.saveData ||
              /2g/.test(navigator.connection.effectiveType || ''));
const TOUCH = matchMedia('(hover:none)').matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════ 1 · PROJE VERİSİ ══ */
const PROJECTS = [
  { k:'p1',  cls:'',            cover:'plaza-1',      done:true,  imgs:['plaza-1','plaza-3','plaza-2'] },
  { k:'p2',  cls:'',            cover:'pairA-built',  done:true,  imgs:['pairA-built','pairA-render','villa-flat'] },
  { k:'p6',  cls:'',            cover:'pairB-built',  done:true,  imgs:['pairB-built','pairB-render'] },
  { k:'p3',  cls:'card--wide',  cover:'hero-twin',    done:false, imgs:['hero-twin'] },
  { k:'p5',  cls:'',            cover:'site-1',       done:false, imgs:['site-1','site-3','site-4','site-5','site-6','site-2'] },
  { k:'p4',  cls:'card--pano',  cover:'villa-duplex', done:false, imgs:['villa-duplex'] }
];

/* ══════════════════════════════════════════════════════════ 2 · I18N ══ */
const LANGS = ['tr', 'en', 'ru'];
let LANG = (() => {
  const saved = localStorage.getItem('db-lang');
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.language || 'tr').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'tr';
})();

const t = k => (window.I18N[LANG] && window.I18N[LANG][k]) ?? window.I18N.tr[k] ?? '';

function applyI18N() {
  document.documentElement.lang = t('html.lang');

  $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()).replace(/<[^>]+>/g, ''));
    });
  });
  document.title = t('meta.title');

  $('#langCur').textContent = LANG.toUpperCase();
  $$('#langMenu button').forEach(b => b.classList.toggle('is-on', b.dataset.lang === LANG));

  buildStrip();
  buildProjects();
  buildReviews();
  renderCal();
  splitAll();
  if (window.__booted) { revealAll(); counters(); }
  if (window.__accRefresh) window.__accRefresh();
  ScrollTrigger.refresh();
}

function setLang(l) {
  if (!LANGS.includes(l) || l === LANG) return;
  LANG = l;
  localStorage.setItem('db-lang', l);
  gsap.to('main, .ftr', {
    opacity: 0, duration: .22, onComplete() {
      applyI18N();
      gsap.to('main, .ftr', { opacity: 1, duration: .38 });
    }
  });
}

/* ═══════════════════════════════════════════════════ 3 · DİNAMİK DOM ══ */
function buildStrip() {
  const words = [1, 2, 3, 4, 5, 6].map(i => t('strip.' + i));
  const one = `<span>${words.join('</span><span>')}</span>`;
  $('#stripTrack').innerHTML = one + one + one;
}

function buildProjects() {
  const g = $('#projGrid');
  g.innerHTML = PROJECTS.map((p, i) => {
    const k = p.alias || p.k;
    return `<article class="card ${p.cls} reveal-card" data-p="${i}" data-cursor="${t('projects.view')}">
      <img class="card__img" src="assets/img/${p.cover}.webp" alt="${t(k + '.t')}" loading="lazy">
      <div class="card__veil"></div>
      <div class="card__body">
        <span class="card__tag ${p.done ? 'card__tag--done' : ''}">${t(k + '.status')}</span>
        <h3>${t(k + '.t')}</h3>
        <p class="card__loc">${t(k + '.loc')} · ${t(k + '.type')}</p>
      </div>
      <span class="card__go"><svg viewBox="0 0 20 12"><path d="M0 6h18M13 1l5 5-5 5"/></svg></span>
    </article>`;
  }).join('');
  $$('.card', g).forEach(c => c.addEventListener('click', () => openModal(+c.dataset.p)));
}

function buildReviews() {
  const rows = $('#revRows');
  const half = Math.ceil(window.REVIEWS.length / 2);
  const sets = [window.REVIEWS.slice(0, half), window.REVIEWS.slice(half)];

  rows.innerHTML = sets.map((set, ri) => {
    const cards = set.map(r => {
      const translated = r.lang !== LANG ? (r[LANG] || '') : '';
      const trLabel = t('rev.translated');
      return `<article class="rev">
        <div class="rev__top">
          <span class="rev__av">${r.name.trim()[0].toUpperCase()}</span>
          <div><p class="rev__nm">${r.name}</p><p class="rev__mt">${r.when[LANG] || r.when.tr}</p></div>
        </div>
        <span class="rev__st" aria-label="5/5">★★★★★</span>
        <p class="rev__tx">${r.orig}</p>
        ${translated && trLabel ? `<p class="rev__tr"><b>${trLabel}</b>${translated}</p>` : ''}
        <span class="rev__src">${t('rev.source')}</span>
      </article>`;
    }).join('');
    return `<div class="revRow" data-dir="${ri % 2 ? -1 : 1}">${cards + cards}</div>`;
  }).join('');

  startMarquees();
}

/* ══════════════════════════════════════════════════════ 4 · MARQUEE ══ */
let marquees = [];
function startMarquees() {
  marquees.forEach(m => m.kill());
  marquees = [];
  if (RM) return;

  const strip = $('#stripTrack');
  marquees.push(gsap.to(strip, {
    xPercent: -33.333, duration: 34, ease: 'none', repeat: -1
  }));

  $$('.revRow').forEach((row, i) => {
    const dir = +row.dataset.dir;
    gsap.set(row, { xPercent: dir > 0 ? 0 : -50 });
    marquees.push(gsap.to(row, {
      xPercent: dir > 0 ? -50 : 0, duration: 58 + i * 9, ease: 'none', repeat: -1
    }));
    row.addEventListener('mouseenter', () => marquees.forEach(m =>
      m.vars.duration > 40 && gsap.to(m, { timeScale: .22, duration: .5 })));
    row.addEventListener('mouseleave', () => marquees.forEach(m =>
      m.vars.duration > 40 && gsap.to(m, { timeScale: 1, duration: .5 })));
  });
}

/* ════════════════════════════════════════════════════ 5 · SPLIT TEXT ══ */
function splitAll() {
  $$('.split').forEach(el => {
    if (el.dataset.done === el.innerHTML) return;
    const html = el.innerHTML;
    el.innerHTML = html.split(/(<br\s*\/?>)/i).map(chunk => {
      if (/^<br/i.test(chunk)) return chunk;
      return chunk.split(/\s+/).filter(Boolean)
        .map(w => `<span class="w"><i>${w}</i></span>`).join(' ');
    }).join('');
    el.dataset.done = el.innerHTML;

    if (RM) { gsap.set(el.querySelectorAll('.w > i'), { y: 0 }); return; }
    gsap.to(el.querySelectorAll('.w > i'), {
      y: 0, duration: 1.05, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
}

/* Yalnızca henüz bağlanmamış öğeleri işler. Dil değişiminde proje kartları
   ve yorumlar yeniden üretildiği için bu fonksiyon tekrar çağrılır; işaretli
   olanlar atlanır, yenileri animasyona bağlanır. CSS bunları opacity:0 ile
   başlattığından bağlanmayan bir öğe kalıcı olarak görünmez olurdu. */
function revealAll() {
  $$('.reveal:not([data-rv])').forEach(el => {
    el.dataset.rv = '1';
    gsap.fromTo(el, { opacity: 0, y: RM ? 0 : 26 }, {
      opacity: 1, y: 0, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  const groups = new Map();
  $$('.reveal-card:not([data-rv])').forEach(el => {
    el.dataset.rv = '1';
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach(items => {
    gsap.fromTo(items, { opacity: 0, y: RM ? 0 : 40 }, {
      opacity: 1, y: 0, duration: 1.05, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: items[0], start: 'top 88%' }
    });
  });
}

/* ═════════════════════════════════════════════════════ 6 · SAYAÇLAR ══ */
let countTweens = [];
function counters() {
  // Dil değişiminde sayılar ham metne dönüyor; eski tween'ler öldürülmezse
  // yeni ayraçlı değerin üstüne eski biçimi yazarlar.
  countTweens.forEach(tw => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); });
  countTweens = [];
  $$('[data-count]').forEach(el => {
    const raw = el.textContent.trim();
    const dec = raw.includes(',') || raw.includes('.');
    const sep = raw.includes(',') ? ',' : '.';
    const end = parseFloat(raw.replace(',', '.'));
    if (isNaN(end)) return;
    const o = { v: 0 };
    countTweens.push(gsap.to(o, {
      v: end, duration: 1.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%' },
      onUpdate() { el.textContent = dec ? o.v.toFixed(1).replace('.', sep) : Math.round(o.v); }
    }));
  });
}

/* ══════════════════════════════════════════ 7 · KAYDIRMALI SAHNELER ══ */
/* Kare dizisini canvas'a çizen ve indeksi scroll'a bağlayan motor.
   Hem hero (dış cephe) hem de iç mekân sahnesi bunu kullanır. */
function makeScrub(o) {
  const cv = $(o.canvas);
  const fb = $(o.fallback);
  if (!cv || RM || SAVE) return null;

  const COUNT = o.count;
  const dir   = (innerWidth < 900 || TOUCH) ? o.sm : o.lg;
  const src   = i => `${dir}/f_${String(i).padStart(3, '0')}.webp`;

  const ctx    = cv.getContext('2d', { alpha: false });
  const frames = new Array(COUNT);
  let cur = -1, ready = false;

  // Henüz inmemiş kare için en yakın yüklü kareye geri düş — böylece
  // tam yükleme bitmeden kaydırıldığında da hareket görünür.
  const nearest = i => {
    for (let k = i; k >= 0; k--) if (frames[k] && frames[k].naturalWidth) return frames[k];
    for (let k = i + 1; k < COUNT; k++) if (frames[k] && frames[k].naturalWidth) return frames[k];
    return null;
  };

  const draw = i => {
    const img = nearest(i);
    if (!img || !img.complete || !img.naturalWidth) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };

  const load = i => new Promise(res => {
    const im = new Image();
    im.decoding = 'async';
    im.onload  = () => { frames[i - 1] = im; res(true); };
    im.onerror = () => res(false);          // kare yoksa fallback görsel kalır
    im.src = src(i);
  });

  // İlk paket inince canvas açılır, kalanı boşta yüklenir.
  const FIRST = Math.min(10, COUNT);
  Promise.all(Array.from({ length: FIRST }, (_, n) => load(n + 1))).then(oks => {
    if (!oks.some(Boolean)) return;         // hiç kare yok → sahne statik kalır
    ready = true;
    draw(0);
    cv.classList.add('is-on');
    if (fb) gsap.to(fb, { opacity: 0, duration: .8, delay: .2 });

    /* Safari'de requestIdleCallback yok; çıplak tanımsız değişkene erişmek
       ReferenceError fırlattığı için window üzerinden yoklanıyor. */
    const idle = window.requestIdleCallback
      ? cb => window.requestIdleCallback(cb, { timeout: 500 })
      : cb => setTimeout(cb, 16);

    let n = FIRST + 1;
    const next = () => {
      if (n > COUNT) return;
      const batch = [];
      for (let k = 0; k < 6 && n <= COUNT; k++, n++) batch.push(load(n));
      Promise.all(batch).then(() => idle(next)).catch(() => idle(next));
    };
    next();
  });

  /* Kare kaydırma ve içerik hareketi TEK zaman çizelgesinde olmalı.
     Ayrı ScrollTrigger'lar kurulduğunda pin, sonraki trigger'ların start
     değerlerini pin mesafesi kadar ileri itiyor ve içerik ancak pin
     bittikten SONRA hareket etmeye başlıyordu. */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: o.section,
      start: o.start || 'top top',
      end: o.end,
      pin: o.pin !== false,
      pinSpacing: o.pin !== false,
      scrub: .6,
      onUpdate(self) {
        if (!ready) return;
        const i = Math.min(COUNT - 1, Math.round(self.progress * (COUNT - 1)));
        if (i !== cur) { cur = i; draw(i); }
      }
    }
  });
  if (o.build) o.build(tl);

  addEventListener('resize', () => { cv.width = 0; draw(Math.max(cur, 0)); }, { passive: true });
  return tl;
}

function scrubScenes() {
  // 1 · Hero — havuzun üzerinden villaya doğru
  makeScrub({
    section: '#hero', canvas: '#heroCanvas', fallback: '#heroFallback',
    count: 65, lg: 'assets/frames/lg', sm: 'assets/frames/sm', end: '+=210%',
    build(tl) {
      tl.to('.hero__scroll',  { opacity: 0, duration: .10, ease: 'none' }, 0)
        .to('.hero__content', { yPercent: -16, opacity: 0, duration: .55, ease: 'none' }, 0)
        .to({}, { duration: .45 });
    }
  });

  // 2 · İç mekân — hero'nun hareketi içeride, havuza doğru devam eder
  makeScrub({
    section: '#interior', canvas: '#intCanvas', fallback: '#intFallback',
    count: 49, lg: 'assets/frames/int-lg', sm: 'assets/frames/int-sm', end: '+=180%',
    build(tl) {
      tl.fromTo('#interior .scrub__content', { yPercent: 8 },
                { yPercent: -8, duration: 1, ease: 'none' }, 0)
        .fromTo('#interior .scrub__content', { opacity: 0 },
                { opacity: 1, duration: .16, ease: 'none' }, 0)
        .to('#interior .scrub__content', { opacity: 0, duration: .14, ease: 'none' }, .86);
    }
  });

  // 3 · Tasarım masası — "dördü de aynı masada". Başlık animasyonun
  //     üzerinde durur; kamera masaya doğru yavaşça yaklaşır.
  makeScrub({
    section: '#services', canvas: '#deskCanvas', fallback: '#deskFallback',
    count: 49, lg: 'assets/frames/desk-lg', sm: 'assets/frames/desk-sm',
    end: '+=170%',
    build(tl) {
      tl.fromTo('#services .scrub__content', { yPercent: 7 },
                { yPercent: -7, duration: 1, ease: 'none' }, 0)
        .fromTo('#services .scrub__content', { opacity: 0 },
                { opacity: 1, duration: .16, ease: 'none' }, 0)
        .to('#services .scrub__content', { opacity: 0, duration: .14, ease: 'none' }, .86);
    }
  });
}

/* ══════════════════════════════════════════════ 8 · ÖNCE / SONRA ══ */
function beforeAfter() {
  $$('[data-ba]').forEach(ba => {
    const wrap  = $('.ba__beforeWrap', ba);
    const hand  = $('.ba__handle', ba);
    const range = $('.ba__range', ba);
    const img   = $('.ba__before', ba);

    const set = v => {
      wrap.style.width = v + '%';
      hand.style.left  = v + '%';
      // Görsel kapsayıcı genişliğine sabitlenir, kırpılan panele değil.
      img.style.setProperty('--baw', ba.clientWidth + 'px');
    };
    const use = () => ba.classList.add('is-used');

    range.addEventListener('input', () => { set(range.value); use(); });
    range.addEventListener('pointerdown', use);
    new ResizeObserver(() => set(range.value)).observe(ba);
    set(50);

    if (!RM) {
      gsap.fromTo(range, { value: 88 }, {
        value: 42, duration: 2.4, ease: 'power2.inOut',
        scrollTrigger: { trigger: ba, start: 'top 72%', once: true },
        onUpdate() { set(range.value); }
      });
    }
  });
}

/* ═══════════════════════════════════════════════════ 9 · SÜREÇ RAYI ══ */
function processRail() {
  const rail = $('#rail'), bar = $('#railBar');
  const upd = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const p = max > 0 ? rail.scrollLeft / max : 0;
    bar.style.transform = `translateX(${p * (100 / .18 - 100)}%)`;
  };
  rail.addEventListener('scroll', upd, { passive: true });
  upd();

  if (RM || TOUCH) return;
  // Bölüm görünürken yatay rayı dikey scroll'a bağla.
  ScrollTrigger.create({
    trigger: '#process',
    start: 'top 20%',
    end: 'bottom bottom',
    onUpdate(self) {
      const max = rail.scrollWidth - rail.clientWidth;
      if (max > 0) rail.scrollLeft = self.progress * max;
    }
  });

  // Fare ile sürükleme
  let down = false, sx = 0, sl = 0;
  rail.addEventListener('pointerdown', e => {
    down = true; sx = e.clientX; sl = rail.scrollLeft; rail.setPointerCapture(e.pointerId);
    rail.style.cursor = 'grabbing';
  });
  rail.addEventListener('pointermove', e => {
    if (down) rail.scrollLeft = sl - (e.clientX - sx);
  });
  ['pointerup', 'pointercancel'].forEach(ev =>
    rail.addEventListener(ev, () => { down = false; rail.style.cursor = ''; }));
}

/* ═════════════════════════════════════════════════════ 10 · MODAL ══ */
let lastFocus = null;
function openModal(i) {
  const p = PROJECTS[i], k = p.alias || p.k, m = $('#modal');
  lastFocus = document.activeElement;

  $('#mdMedia').innerHTML = p.imgs
    .map(s => `<img src="assets/img/${s}.webp" alt="${t(k + '.t')}" loading="lazy">`).join('');
  $('#mdTitle').textContent = t(k + '.t');
  $('#mdMeta').innerHTML = [
    ['projects.loc', k + '.loc'], ['projects.type', k + '.type'],
    ['projects.scope', k + '.scope'], ['projects.status', k + '.status']
  ].map(([a, b]) => `<div><span class="md-k">${t(a)}</span><span class="md-v">${t(b)}</span></div>`).join('');
  $('#mdDesc').textContent = t(k + '.d');

  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  if (window.lenis) window.lenis.stop();
  $('.modal__x').focus();

  gsap.fromTo('#mdMedia img', { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out', delay: .25 });
}
function closeModal() {
  const m = $('#modal');
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  if (window.lenis) window.lenis.start();
  lastFocus && lastFocus.focus();
}

/* ═══════════════════════════════════════════════════ 11 · AKORDİYON ══ */
function accordion() {
  const items = $$('.acc__i');
  const close = it => {
    it.classList.remove('is-on');
    $('.acc__a', it).style.height = '0px';
    $('.acc__q', it).setAttribute('aria-expanded', 'false');
  };
  const open = it => {
    it.classList.add('is-on');
    const a = $('.acc__a', it);
    a.style.height = a.firstElementChild.offsetHeight + 'px';
    $('.acc__q', it).setAttribute('aria-expanded', 'true');
  };
  items.forEach(it => {
    const q = $('.acc__q', it);
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const on = it.classList.contains('is-on');
      items.forEach(close);
      if (!on) open(it);
      setTimeout(() => ScrollTrigger.refresh(), 520);
    });
  });
  window.__accRefresh = () => items.forEach(it =>
    it.classList.contains('is-on') ? open(it) : close(it));
  window.__accRefresh();
}

/* ══════════════════════════════════════════════ 12 · RANDEVU AKIŞI ══ */
const BOOK = { date: null, time: null };
const SLOT_TIMES = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
let calCursor = new Date();
calCursor.setDate(1);

const dayKey = d => d.toISOString().slice(0, 10);
// Aynı gün için her zaman aynı doluluk — sahte ama tutarlı.
const seed = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const isBusy = (d, i) => (seed(dayKey(d)) >> i) % 5 === 0;

function fmtDate(d) {
  return d.toLocaleDateString(LANG === 'tr' ? 'tr-TR' : LANG === 'ru' ? 'ru-RU' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderCal() {
  const grid = $('#calGrid'), dows = $('#calDows'), label = $('#calMonth');
  if (!grid) return;
  const loc = LANG === 'tr' ? 'tr-TR' : LANG === 'ru' ? 'ru-RU' : 'en-GB';

  label.textContent = calCursor.toLocaleDateString(loc, { month: 'long', year: 'numeric' });

  // Pazartesi başlangıçlı gün kısaltmaları
  dows.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // 2024-01-01 Pazartesi
    return `<span>${d.toLocaleDateString(loc, { weekday: 'short' }).slice(0, 2)}</span>`;
  }).join('');

  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const first = new Date(y, m, 1);
  const pad = (first.getDay() + 6) % 7;           // Pazartesi = 0
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let html = '<span class="day day--pad"></span>'.repeat(pad);
  for (let n = 1; n <= days; n++) {
    const d = new Date(y, m, n);
    const past = d <= today;
    const sun = d.getDay() === 0;
    const free = !past && !sun;
    const sel = BOOK.date && dayKey(BOOK.date) === dayKey(d);
    html += `<button type="button" class="day ${free ? 'day--free' : 'day--off'} ${sel ? 'is-sel' : ''}"
      ${free ? '' : 'disabled'} data-d="${n}">${n}</button>`;
  }
  grid.innerHTML = html;

  const now = new Date(); now.setDate(1); now.setHours(0, 0, 0, 0);
  $('#calPrev').disabled = calCursor <= now;
  const lim = new Date(now); lim.setMonth(lim.getMonth() + 6);
  $('#calNext').disabled = calCursor >= lim;

  $$('.day--free', grid).forEach(b => b.addEventListener('click', () => {
    BOOK.date = new Date(y, m, +b.dataset.d);
    renderCal();
    goStep(2);
  }));

  if (!RM) gsap.fromTo($$('.day', grid), { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: .4, stagger: .008, ease: 'power2.out' });
}

function renderSlots() {
  $('#slotsDate').textContent = fmtDate(BOOK.date);
  const g = $('#slotsGrid');
  g.innerHTML = SLOT_TIMES.map((tm, i) =>
    `<button type="button" class="slot" ${isBusy(BOOK.date, i) ? 'disabled' : ''}>${tm}</button>`).join('');
  $$('.slot:not([disabled])', g).forEach(b => b.addEventListener('click', () => {
    BOOK.time = b.textContent;
    goStep(3);
  }));
  if (!RM) gsap.fromTo($$('.slot', g), { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power2.out' });
}

function goStep(n) {
  const panes = { 1: $('#cal'), 2: $('#slots'), 3: $('#bform'), 4: $('#done') };
  Object.values(panes).forEach(p => { p.hidden = true; });
  const pane = panes[n];
  pane.hidden = false;

  $$('#bookSteps li').forEach((li, i) => {
    li.classList.toggle('is-on', i === Math.min(n, 3) - 1);
    li.classList.toggle('is-done', i < Math.min(n, 3) - 1);
  });

  if (n === 2) renderSlots();
  if (n === 3) $('#bformWhen').textContent = `${fmtDate(BOOK.date)} · ${BOOK.time}`;
  if (!RM) gsap.fromTo(pane, { opacity: 0, x: 18 },
    { opacity: 1, x: 0, duration: .5, ease: 'power3.out' });
}

function booking() {
  if (!$('#cal')) return;
  renderCal();

  $('#calPrev').addEventListener('click', () => {
    calCursor.setMonth(calCursor.getMonth() - 1); renderCal();
  });
  $('#calNext').addEventListener('click', () => {
    calCursor.setMonth(calCursor.getMonth() + 1); renderCal();
  });
  $('#toCal').addEventListener('click', () => goStep(1));
  $('#toSlots').addEventListener('click', () => goStep(2));
  $('#again').addEventListener('click', () => { BOOK.time = null; goStep(1); });

  const form = $('#bform');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('.fld', form).forEach(f => {
      const inp = $('input[required], select[required]', f);
      f.classList.remove('is-bad');
      $('.fld__err', f)?.remove();
      if (!inp) return;
      let bad = !inp.value.trim();
      if (!bad && inp.name === 'phone') bad = inp.value.replace(/\D/g, '').length < 10;
      if (bad) {
        ok = false;
        f.classList.add('is-bad');
        const s = document.createElement('span');
        s.className = 'fld__err';
        s.textContent = inp.name === 'phone' && inp.value.trim() ? t('book.reqPhone') : t('book.req');
        f.appendChild(s);
      }
    });
    if (!ok) {
      gsap.fromTo(form, { x: -7 }, { x: 0, duration: .45, ease: 'elastic.out(1,.35)' });
      return;
    }

    const d = new FormData(form);
    const landTxt = { '1': t('book.land1'), '2': t('book.land2'), '3': t('book.land3') }[d.get('land')];
    $('#doneCard').innerHTML = [
      [t('book.lblDate'), fmtDate(BOOK.date)],
      [t('book.lblTime'), BOOK.time],
      [t('book.name'), d.get('name')],
      [t('book.phone'), d.get('phone')],
      [t('book.service'), d.get('service')],
      [t('book.land'), landTxt]
    ].map(([a, b]) => `<div><span>${a}</span><span>${b || '—'}</span></div>`).join('');

    const msg = `${t('book.eyebrow')} — ${fmtDate(BOOK.date)} ${BOOK.time}\n` +
                `${d.get('name')} · ${d.get('phone')}\n${d.get('service')} · ${landTxt}` +
                (d.get('note') ? `\n${d.get('note')}` : '');
    $('#waLink').href = 'https://wa.me/905308998060?text=' + encodeURIComponent(msg);

    goStep(4);

    /* NOT: burada sunucuya gönderim yok — randevu sistemi (Calendly vb.)
       bağlanana kadar kullanıcı telefon/WhatsApp ile yönlendiriliyor. */
    console.info('[DB] Randevu talebi (demo, gönderim yok):',
      Object.fromEntries(d), { date: dayKey(BOOK.date), time: BOOK.time });
  });
}

/* ═════════════════════════════════════════════════ 13 · ARAYÜZ İŞLER ══ */
function header() {
  const hdr = $('#hdr');
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      hdr.classList.toggle('is-solid', y > innerHeight * .9);
      hdr.classList.toggle('is-hidden', y > last && y > innerHeight * 1.4 && !document.body.classList.contains('is-drawer'));
      last = y;
      $('#scrollProg').style.width = (self.progress * 100) + '%';
    }
  });

  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const on = document.body.classList.toggle('is-drawer');
    document.body.classList.toggle('is-locked', on);
    $('#drawer').setAttribute('aria-hidden', String(!on));
    if (window.lenis) on ? window.lenis.stop() : window.lenis.start();
  });
  $$('#drawer a').forEach((a, i) => {
    a.style.setProperty('--i', i);
    a.addEventListener('click', () => burger.click());
  });

  const lang = $('#lang');
  $('#langBtn').addEventListener('click', e => {
    e.stopPropagation();
    const on = lang.classList.toggle('is-open');
    $('#langBtn').setAttribute('aria-expanded', String(on));
  });
  $$('#langMenu button').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    lang.classList.remove('is-open');
  }));
  addEventListener('click', () => lang.classList.remove('is-open'));

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    if (window.lenis) window.lenis.scrollTo(el, { offset: -10, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  }));
}

function cursor() {
  if (TOUCH) return;
  const c = $('#cursor'), label = $('.cursor__label', c);
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const tgt = { ...pos };
  addEventListener('pointermove', e => { tgt.x = e.clientX; tgt.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    pos.x += (tgt.x - pos.x) * .16;
    pos.y += (tgt.y - pos.y) * .16;
    c.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
  });
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('pointerenter', () => {
      label.textContent = el.dataset.cursor;
      c.classList.add('is-lg');
    });
    el.addEventListener('pointerleave', () => c.classList.remove('is-lg'));
  });
  // dinamik kartlar için delege
  document.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-cursor]');
    if (el) { label.textContent = el.dataset.cursor; c.classList.add('is-lg'); }
  });
  document.addEventListener('pointerout', e => {
    if (e.target.closest('[data-cursor]') && !e.relatedTarget?.closest('[data-cursor]'))
      c.classList.remove('is-lg');
  });
}

function magnetic() {
  if (TOUCH || RM) return;
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * .28,
        y: (e.clientY - r.top - r.height / 2) * .38,
        duration: .55, ease: 'power3.out'
      });
    });
    el.addEventListener('pointerleave', () =>
      gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
  });
}

function parallax() {
  if (RM) return;

  // Soluk bölüm zeminleri, metne göre yavaşça kayar.
  $$('.sec__bg').forEach(bg => {
    gsap.fromTo(bg, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  $$('.card__img, .ct__map iframe').forEach(el => {
    gsap.fromTo(el, { yPercent: -4 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: el.closest('.card, .ct__map'), start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

/* ═══════════════════════════════════════════════════════ 14 · BOOT ══ */
function smoothScroll() {
  if (RM || typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: .95 });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function loaderOut() {
  const ld = $('#loader'), bar = $('#loaderBar');
  gsap.to(bar, { width: '100%', duration: 1.15, ease: 'power2.inOut' });
  const finish = () => {
    ld.classList.add('is-out');
    setTimeout(() => ld.remove(), 1100);
    gsap.to('.hero__title .line i', {
      y: 0, duration: 1.25, ease: 'expo.out', stagger: .085, delay: .1
    });
    gsap.fromTo('.hero__content .reveal', { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: .9, stagger: .11, delay: .45, ease: 'power3.out' });
    gsap.fromTo('.hdr', { opacity: 0, y: -18 },
      { opacity: 1, y: 0, duration: .9, delay: .3, ease: 'power3.out' });
  };
  if (RM) { ld.remove(); gsap.set('.hero__title .line i, .hero__content .reveal', { y: 0, opacity: 1 }); return; }
  setTimeout(finish, 1250);
}

function init() {
  $('#yr').textContent = new Date().getFullYear();

  applyI18N();
  smoothScroll();
  header();
  cursor();
  magnetic();
  scrubScenes();
  revealAll();
  counters();
  beforeAfter();
  processRail();
  accordion();
  booking();
  parallax();

  $$('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#modal').classList.contains('is-open')) closeModal();
    if (document.body.classList.contains('is-drawer')) $('#burger').click();
  });

  loaderOut();
  window.__booted = true;   // applyI18N artık yeniden üretilen DOM'u da bağlayabilir
  ScrollTrigger.refresh();
}

if (document.readyState !== 'loading') init();
else addEventListener('DOMContentLoaded', init);
