/* Matteo Del Gallo — interazioni del portfolio. Unica dipendenza: Lenis (scroll fluido). */
import Lenis from './vendor/lenis.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Intro (solo prima visita della sessione) ---------- */
function intro() {
  const loader = $('[data-loader]');
  if (!loader || document.documentElement.classList.contains('no-intro')) return;
  const counter = $('[data-count-up]', loader);
  const start = performance.now();
  const dur = 1300;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    counter.textContent = Math.round((1 - (1 - t) ** 3) * 100);
    if (t < 1) requestAnimationFrame(tick);
    else {
      loader.classList.add('is-done');
      try { sessionStorage.setItem('mdg-intro', '1'); } catch (_) {}
      setTimeout(() => loader.remove(), 1100);
    }
  };
  requestAnimationFrame(tick);
}

/* ---------- Split del testo in lettere / parole ---------- */
function splitChars(el) {
  // Ogni parola resta unita (nowrap) così le lettere non vanno a capo a metà parola.
  const words = el.textContent.split(' ');
  el.textContent = '';
  let i = 0;
  words.forEach((word, wi) => {
    const w = document.createElement('span');
    w.className = 'wd';
    for (const c of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--ci', i++);
      s.textContent = c;
      w.append(s);
    }
    el.append(w);
    if (wi < words.length - 1) el.append(' ');
  });
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`).join(' ');
}

/* ---------- Lettere del titolo che cambiano peso vicino al cursore ---------- */
function weightHover() {
  const chars = $$('[data-weight] .ch');
  const hero = $('.hero');
  if (!chars.length || !hero || !finePointer || reduceMotion) return;
  // Le posizioni delle lettere si leggono una volta (e a ogni resize), mai durante il movimento:
  // niente letture di layout per frame = niente scatti.
  let centers = [], mx = -9999, my = -9999, raf = 0, visible = true;
  const measure = () => {
    chars.forEach((c) => c.style.setProperty('--w', 800));
    const y = scrollY;
    centers = chars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + y + r.height / 2]; });
  };
  const update = () => {
    raf = 0;
    const y = scrollY;
    chars.forEach((c, i) => {
      const d = Math.hypot(mx - centers[i][0], my + y - centers[i][1]);
      const k = Math.max(0, 1 - d / 260);
      c.style.setProperty('--w', Math.round(800 - k * 380));
      c.style.transform = k ? `translate3d(0, ${(-k * 10).toFixed(1)}px, 0)` : '';
      c.style.color = k > 0.55 ? 'var(--red)' : '';
    });
  };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
  addEventListener('resize', () => requestAnimationFrame(measure));
  document.fonts?.ready.then(() => setTimeout(measure, 2500));
  setTimeout(measure, 2600); // dopo l'animazione d'ingresso delle lettere
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (visible && centers.length && !raf) raf = requestAnimationFrame(update);
  }, { passive: true });
}

/* ---------- Parole che ruotano nel sottotitolo ---------- */
function rotator() {
  const el = $('[data-rotator]');
  if (!el || reduceMotion) return;
  const words = JSON.parse(el.dataset.rotator);
  let i = 0;
  setInterval(() => {
    const old = el.firstElementChild;
    i = (i + 1) % words.length;
    const next = document.createElement('span');
    next.textContent = words[i];
    next.className = 'is-in';
    next.style.gridArea = '1 / 1';
    old.style.gridArea = '1 / 1';
    old.classList.add('is-out');
    el.append(next);
    setTimeout(() => old.remove(), 600);
  }, 2400);
}

/* ---------- Logo dell'hero: parallasse + easter egg "Chicchirichì" ---------- */
function heroLogo() {
  const wrap = $('[data-hero-logo]');
  if (!wrap) return;
  const mark = $('.hero__mark', wrap);
  if (finePointer && !reduceMotion) {
    // Parallasse morbida: il logo insegue il mouse con un'interpolazione, non a scatti.
    let tx = 0, ty = 0, x = 0, y = 0, running = false;
    const loop = () => {
      x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
      mark.style.setProperty('--mx', x.toFixed(4));
      mark.style.setProperty('--my', y.toFixed(4));
      running = Math.abs(x - tx) > 0.0005 || Math.abs(y - ty) > 0.0005;
      if (running) requestAnimationFrame(loop);
    };
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth) - 0.5; ty = (e.clientY / innerHeight) - 0.5;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
  }
  const bubble = $('[data-bubble]', wrap);
  const lines = ['Chicchirichì!', 'Ciao! 👋', 'Mi hai trovato!', 'Parliamone?', 'Del Gallo, appunto 🐓'];
  let n = 0;
  wrap.addEventListener('click', () => {
    bubble.textContent = lines[n++ % lines.length];
    wrap.classList.remove('is-boing');
    void wrap.offsetWidth;
    wrap.classList.add('is-boing');
    clearTimeout(wrap._t);
    wrap._t = setTimeout(() => wrap.classList.remove('is-boing'), 1800);
    if (n === 5) confetti(innerWidth / 2, innerHeight / 3);
  });
}

/* ---------- Comparsa allo scroll ---------- */
function reveals() {
  $$('[data-split-words]').forEach(splitWords);
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal], [data-split-words]').forEach((el) => io.observe(el));

  // Contatori numerici
  const cio = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target, to = +el.dataset.count, t0 = performance.now();
      const step = (now) => { const t = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(to * (1 - (1 - t) ** 3)); if (t < 1) requestAnimationFrame(step); };
      if (!reduceMotion) { el.textContent = '0'; requestAnimationFrame(step); }
      cio.unobserve(el);
    }
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));
}

/* ---------- Scroll: barra di avanzamento, nav, badge, marquee ---------- */
function onScroll() {
  const nav = $('[data-nav]');
  const progress = $('.progress');
  const badge = $('[data-badge] .badge__ring');
  const track = $('[data-marquee] .marquee__track');
  let lastY = scrollY, skew = 0, raf = 0;
  const update = () => {
    raf = 0;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress?.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 20);
    const menuOpen = $('[data-menu]')?.classList.contains('is-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    if (badge) badge.style.setProperty('--spin', `${y * 0.25}deg`);
    if (track && !reduceMotion) {
      skew = lerp(skew, Math.max(-12, Math.min(12, (y - lastY) * 0.6)), 0.4);
      track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
    }
    lastY = y;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ---------- Menu mobile ---------- */
function mobileMenu() {
  const btn = $('.nav__burger'), menu = $('[data-menu]');
  if (!btn || !menu) return;
  const set = (open) => {
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700); }
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) set(false); });
}

/* ---------- Cursore personalizzato + bottoni magnetici ---------- */
function cursor() {
  if (!finePointer || reduceMotion) return;
  const c = document.createElement('div');
  c.className = 'cursor';
  c.innerHTML = '<span class="cursor__label"></span>';
  document.body.append(c);
  document.documentElement.classList.add('has-cursor');
  const label = $('.cursor__label', c);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => c.classList.remove('is-hidden'));
  (function loop() {
    cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, label, input, textarea, [data-zoom]');
    c.classList.toggle('has-label', Boolean(labelled));
    label.textContent = labelled?.dataset.cursor || '';
    c.classList.toggle('is-hover', Boolean(interactive) && !labelled);
  });

  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Filtri e vista griglia/lista ---------- */
function work() {
  const grid = $('[data-grid]'), rows = $('[data-rows]');
  if (!grid) return;
  const chips = $$('[data-filter]');
  const apply = (cat) => {
    const run = () => {
      chips.forEach((c) => { const on = c.dataset.filter === cat; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
      [...grid.children, ...rows.children].forEach((el) => { el.hidden = cat !== 'all' && el.dataset.cat !== cat; });
    };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(run); else run();
  };
  chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter)));

  const views = $$('[data-view]');
  views.forEach((b) => b.addEventListener('click', () => {
    const list = b.dataset.view === 'list';
    const run = () => {
      views.forEach((v) => v.setAttribute('aria-pressed', v === b));
      grid.hidden = list; rows.hidden = !list;
      lenis?.resize();
    };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(run); else run();
    // Riporto in cima alla sezione, così il cambio di vista si vede subito.
    const top = $('#lavori');
    if (top && top.getBoundingClientRect().top < -40) window.__scrollToTarget?.(top);
  }));

  // Anteprima immagine che segue il cursore nella vista lista
  const prev = $('[data-row-preview]');
  if (!prev || !finePointer) return;
  const img = $('img', prev);
  let x = 0, y = 0, px = 0, py = 0, active = false;
  rows.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; });
  $$('a', rows).forEach((a) => {
    a.addEventListener('pointerenter', () => { img.src = a.dataset.preview; prev.classList.add('is-visible'); active = true; });
    a.addEventListener('pointerleave', () => { prev.classList.remove('is-visible'); active = false; });
  });
  (function loop() {
    px = lerp(px, x, 0.15); py = lerp(py, y, 0.15);
    if (active || prev.classList.contains('is-visible')) prev.style.left = `${px}px`, prev.style.top = `${py}px`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Striscia trascinabile ---------- */
function dragScroll() {
  $$('[data-drag]').forEach((el) => {
    let down = false, startX = 0, startScroll = 0, moved = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startScroll = el.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) el.classList.add('is-dragging');
      el.scrollLeft = startScroll - dx;
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => el.classList.remove('is-dragging'), 0); });
    el.addEventListener('click', (e) => { if (moved > 5) e.preventDefault(); }, true);
  });
}

/* ---------- Ritratto con leggero tilt 3D ---------- */
function tilt() {
  if (!finePointer || reduceMotion) return;
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', (((e.clientX - r.left) / r.width) - 0.5) * 14);
      el.style.setProperty('--ty', (((e.clientY - r.top) / r.height) - 0.5) * 10);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', 0); el.style.setProperty('--ty', 0); });
  });
}

/* ---------- Coriandoli nei colori del brand ---------- */
function confetti(x, y) {
  if (reduceMotion) return;
  const colors = ['#ec6648', '#c83f43', '#dddddd', '#272727'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('span');
    p.className = 'confetti';
    p.style.background = colors[i % colors.length];
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    document.body.append(p);
    const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 320;
    p.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 380}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 1400 + Math.random() * 800, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
  }
}

/* ---------- Copia email ---------- */
function copyButtons() {
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      const old = b.innerHTML;
      b.innerHTML = '✓'; b.setAttribute('aria-label', 'Copiata!');
      setTimeout(() => { b.innerHTML = old; b.setAttribute('aria-label', 'Copia indirizzo email'); }, 1600);
    } catch (_) { location.href = `mailto:${b.dataset.copy}`; }
  }));
}

/* ---------- Modulo contatti ---------- */
function contactForm() {
  const form = $('[data-form]');
  if (!form) return;
  const status = $('[data-status]', form);
  const btn = $('button[type=submit]', form);
  const label = $('.btn__label', btn);
  const say = (msg, type) => { status.textContent = msg; status.className = `form__status ${type ? 'is-' + type : ''}`; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Validazione
    let ok = true;
    $$('.field', form).forEach((f) => f.classList.remove('is-invalid'));
    $$('input[required], textarea[required]', form).forEach((input) => {
      const valid = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim();
      if (!valid) { ok = false; input.closest('.field')?.classList.add('is-invalid'); }
    });
    if (!ok) return say('Controlla i campi evidenziati (e la casella privacy) 🙂', 'error');
    if (form.botcheck.checked) return;

    const data = new FormData(form);
    const payload = {
      nome: data.get('nome'), email: data.get('email'), azienda: data.get('azienda') || '-',
      servizi: data.getAll('servizi').join(', ') || '-', budget: data.get('budget'), messaggio: data.get('messaggio'),
    };
    const { provider, key, endpoint, email } = form.dataset;

    // Nessun servizio configurato: apro il client email già compilato.
    if (!(provider === 'web3forms' && key) && !endpoint) {
      const body = Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join('\n');
      location.href = `mailto:${email}?subject=${encodeURIComponent('Nuovo progetto da ' + payload.nome)}&body=${encodeURIComponent(body)}`;
      return say('Si sta aprendo il tuo programma di posta: invia da lì. Grazie!', 'ok');
    }

    btn.disabled = true; btn.classList.add('is-sending'); label.textContent = 'Invio in corso…'; say('');
    try {
      const url = provider === 'web3forms' && key ? 'https://api.web3forms.com/submit' : endpoint;
      const body = provider === 'web3forms' && key
        ? { access_key: key, subject: `Nuovo contatto dal portfolio: ${payload.nome}`, from_name: 'Portfolio Matteo Del Gallo', replyto: payload.email, ...payload }
        : payload;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      label.textContent = 'Inviato! ✓';
      say('Messaggio ricevuto: ti rispondo il prima possibile. Grazie!', 'ok');
      const r = btn.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top);
    } catch (_) {
      label.textContent = 'Invia messaggio';
      say(`Ops, qualcosa non ha funzionato. Scrivimi direttamente a ${email}.`, 'error');
    } finally {
      btn.disabled = false; btn.classList.remove('is-sending');
      setTimeout(() => { label.textContent = 'Invia messaggio'; }, 4000);
    }
  });
}

/* ---------- Lightbox nelle pagine progetto ---------- */
function lightbox() {
  const dlg = $('[data-lightbox]');
  if (!dlg) return;
  const imgs = $$('[data-zoom] img');
  const view = $('img', dlg);
  let idx = 0;
  const show = (i) => {
    idx = (i + imgs.length) % imgs.length;
    // Versione più grande disponibile nello srcset
    const big = imgs[idx].getAttribute('srcset')?.split(',').pop().trim().split(' ')[0];
    view.src = big || imgs[idx].currentSrc || imgs[idx].src;
    view.alt = imgs[idx].alt;
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
  };
  imgs.forEach((img, i) => img.addEventListener('click', () => { show(i); dlg.showModal(); }));
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  $('[data-prev]', dlg).addEventListener('click', () => show(idx - 1));
  $('[data-next]', dlg).addEventListener('click', () => show(idx + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  if (imgs.length < 2) $$('.lightbox__nav', dlg).forEach((b) => (b.hidden = true));
}

/* ---------- Scroll fluido (Lenis) + ancore morbide ---------- */
let lenis = null;
function smoothScroll() {
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const go = (target) => {
    const navH = $('[data-nav]')?.offsetHeight || 0;
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -navH + 4, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else (target === 0 ? scrollTo(0, 0) : target.scrollIntoView());
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    history.replaceState(null, '', url.hash);
    go(el);
  });
  // Arrivando da un'altra pagina con #ancora, scendo con calma invece di saltare.
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) setTimeout(() => go(el), 350);
  }
  window.__scrollToTarget = go;
}

/* ---------- Anni aggiornati da soli ---------- */
function years() {
  const now = new Date().getFullYear();
  $$('[data-year-now]').forEach((el) => (el.textContent = now));
  $$('[data-years-since]').forEach((el) => {
    const n = now - Number(el.dataset.yearsSince);
    el.dataset.count = n; el.textContent = n;
  });
}

/* ---------- Varie ---------- */
function misc() {
  $('[data-totop]')?.addEventListener('click', () => window.__scrollToTarget?.(0));
  // Piccolo saluto per chi apre la console (sei un designer curioso?)
  console.log('%c MDG %c Dove le idee prendono forma. → ' + location.origin, 'background:#ec6648;color:#fff;font-weight:800;padding:4px 8px;border-radius:4px', 'color:#c83f43;font-weight:700');
}

$$('[data-split]').forEach(splitChars);
years();
smoothScroll();
intro();
reveals();
weightHover();
rotator();
heroLogo();
onScroll();
mobileMenu();
cursor();
work();
dragScroll();
tilt();
copyButtons();
contactForm();
lightbox();
misc();
