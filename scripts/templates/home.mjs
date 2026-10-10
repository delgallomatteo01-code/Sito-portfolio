import { escapeHtml as e } from '../lib/util.mjs';
import { logoSvg, icons, picture, cropMarks, socialLinks, sourceLabel } from './partials.mjs';

const ROTATOR = ['brand che vogliono farsi notare.', 'loghi che restano in testa.', 'campagne social e display.', 'poster e copertine.', 'siti web su misura.'];
const TOOLS = [
  ['Ps', 'Photoshop', '#31a8ff', '#001e36'],
  ['Ai', 'Illustrator', '#ff9a00', '#330000'],
  ['Pr', 'Premiere Pro', '#9999ff', '#00005b'],
  ['Id', 'InDesign', '#ff3366', '#49021f'],
  ['Fi', 'Figma', '#ffffff', '#1e1e1e'],
  ['Ca', 'Canva', '#ffffff', '#00c4cc'],
  ['Cc', 'CapCut', '#ffffff', '#000000'],
];
const CERTS = ['Web Design', 'Photoshop', 'Dreamweaver'];
const STEPS = [
  ['Ascolto', 'Partiamo da una chiacchierata: obiettivi, pubblico, tempi. Faccio domande finché il problema non è chiaro.'],
  ['Concept', 'Schizzi, ricerche e moodboard. Esploro più direzioni e ti mostro quelle che funzionano davvero.'],
  ['Design', 'Sviluppo la direzione scelta con cura per gerarchia, tipografia e colore, su ogni formato che serve.'],
  ['Consegna', 'File pronti per stampa, web e social: contenuti digitali ottimizzati per ogni piattaforma, linee guida essenziali e supporto anche dopo la consegna.'],
];

export function homePage(ctx) {
  const { config, base, projects, feed, categories, year } = ctx;
  const yearsActive = year - config.site.since;
  const usedCats = categories.filter((c) => projects.some((p) => p.category === c.id));

  const hero = `<section class="hero" id="top" aria-labelledby="hero-title">
  ${cropMarks}
  <div class="hero__grid">
    <p class="hero__kicker" data-reveal><span class="pulse" aria-hidden="true"></span>Disponibile per nuovi progetti · ${e(config.site.location)}</p>
    <h1 class="hero__title" id="hero-title">
      <span class="sr-only">${e(config.site.name)} – ${e(config.site.role)} in ${e(config.site.region)}</span>
      <span class="hero__line" aria-hidden="true" data-split data-weight>Matteo</span>
      <span class="hero__line hero__line--2" aria-hidden="true"><span data-split data-weight>Del Gallo</span><span class="hero__dot">.</span></span>
    </h1>
    <div class="hero__logo" data-hero-logo aria-hidden="true">${logoSvg({ cls: 'hero__mark' })}<span class="hero__bubble" data-bubble>Chicchirichì!</span></div>
    <p class="hero__lead" data-reveal>Graphic &amp; web designer in ${e(config.site.region)}. Progetto sistemi visivi chiari, funzionali e coerenti per <span class="rotator" data-rotator='${e(JSON.stringify(ROTATOR))}'><span>${ROTATOR[0]}</span></span></p>
    <div class="hero__ctas" data-reveal>
      <a class="btn btn--primary" href="#lavori" data-magnetic>Guarda i lavori <span aria-hidden="true">↓</span></a>
      <a class="btn btn--ghost" href="#contatti" data-magnetic>Scrivimi</a>
    </div>
    <a class="badge" href="#lavori" aria-label="Scorri fino ai lavori" data-badge>
      <svg viewBox="0 0 200 200" class="badge__ring" aria-hidden="true"><defs><path id="ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#ring" startOffset="0">graphic design · ${config.site.since} — <tspan data-year-now>${year}</tspan> · web design · </textPath></text></svg>
      ${logoSvg({ cls: 'badge__logo', mono: true })}
    </a>
  </div>
</section>`;

  const marqueeItems = config.marquee || config.categories.map((c) => c.label);
  const marquee = `<div class="marquee-wrap"><div class="marquee" aria-hidden="true" data-marquee><div class="marquee__track">${[0, 1].map(() => `<span>${marqueeItems.map((t) => `${e(t)}<i>✦</i>`).join('')}</span>`).join('')}</div></div></div>`;

  const cards = projects.map((p, i) => {
    const cat = categories.find((c) => c.id === p.category);
    const cover = p.images[0];
    return `<li class="card${p.featured ? ' card--big' : ''}" data-cat="${p.category}" data-reveal style="--i:${i % 6}">
  <a href="${base}progetti/${p.slug}/" data-cursor="Apri" aria-label="${e(p.seo.title)} – ${e(cat?.label)}">
    <figure class="card__media">${picture(ctx, cover, { sizes: p.featured ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 34vw, (min-width: 600px) 50vw, 100vw', vt: `p-${p.id}` })}</figure>
    <div class="card__meta">
      <span class="card__num">${String(i + 1).padStart(2, '0')}.</span>
      <h3 class="card__title">${e(p.seo.title)}</h3>
      <p class="card__info">${e(cat?.short || '')} · ${new Date(p.publishedAt).getFullYear()}</p>
    </div>
    <span class="card__src card__src--${p.source}" title="${sourceLabel[p.source]}">${icons[p.source] || ''}</span>
  </a>
</li>`;
  }).join('\n');

  const rows = projects.map((p, i) => {
    const cat = categories.find((c) => c.id === p.category);
    const cover = p.images[0];
    const thumb = ctx.variants.get(cover.src)?.[0]?.path ?? 'media/' + cover.src;
    return `<li data-cat="${p.category}"><a href="${base}progetti/${p.slug}/" data-preview="${base}${thumb}">
  <span class="row__num">${String(i + 1).padStart(2, '0')}</span><span class="row__title">${e(p.seo.title)}</span><span class="row__cat">${e(cat?.short || '')}</span><span class="row__year">${new Date(p.publishedAt).getFullYear()}</span><span class="row__arrow">${icons.arrow}</span>
</a></li>`;
  }).join('\n');

  const work = `<section class="work" id="lavori" aria-labelledby="work-title">
  <header class="sec-head">
    <span class="sec-num" aria-hidden="true">01.</span>
    <h2 id="work-title" data-split-words>Lavori selezionati.</h2>
    <p class="sec-sub" data-reveal>${projects.length} progetti tra branding, logo, campagne e poster. Questa sezione si aggiorna da sola quando pubblico qualcosa di nuovo su Behance o Instagram.</p>
  </header>
  <div class="work__bar" data-reveal>
    <div class="filters" role="group" aria-label="Filtra per categoria">
      <button class="chip is-active" type="button" data-filter="all" aria-pressed="true">Tutti <sup>${projects.length}</sup></button>
      ${usedCats.map((c) => `<button class="chip" type="button" data-filter="${c.id}" aria-pressed="false">${e(c.short)} <sup>${projects.filter((p) => p.category === c.id).length}</sup></button>`).join('')}
    </div>
    <div class="views" role="group" aria-label="Vista">
      <button type="button" data-view="grid" aria-pressed="true">Griglia</button>
      <button type="button" data-view="list" aria-pressed="false">Lista</button>
    </div>
  </div>
  <ul class="grid" data-grid>${cards}</ul>
  <ol class="rows" data-rows hidden>${rows}</ol>
  <div class="row-preview" aria-hidden="true" data-row-preview><img alt=""></div>
</section>`;

  const about = `<section class="about" id="chi-sono" aria-labelledby="about-title">
  <div class="about__panel">
    ${cropMarks}
    <span class="sec-num sec-num--light" aria-hidden="true">02.</span>
    <h2 id="about-title" data-split-words>Ciao! Sono Matteo.</h2>
    <p data-reveal>Sono un graphic designer con sede in ${e(config.site.region)}, specializzato nella progettazione di sistemi visivi chiari, funzionali e coerenti.</p>
    <p data-reveal>Appassionato di graphic design fin da bambino, oggi mi occupo di identità visive, contenuti digitali e campagne di comunicazione, con una particolare attenzione alla struttura, alla coerenza e alla chiarezza del messaggio.</p>
    <ul class="stats" data-reveal>
      <li><b data-count="${yearsActive}" data-years-since="${config.site.since}">${yearsActive}</b><span>anni di design</span></li>
      <li><b data-count="${projects.length}">${projects.length}</b><span>progetti online</span></li>
      <li><b data-count="${CERTS.length}">${CERTS.length}</b><span>certificazioni Adobe</span></li>
    </ul>
  </div>
  <div class="about__photo" data-tilt>
    <div class="about__shape" aria-hidden="true"></div>
    <img src="${base}assets/portrait.webp" width="686" height="634" alt="Ritratto di ${e(config.site.name)} con una reflex al collo" loading="lazy" decoding="async">
    <span class="sticker" aria-hidden="true"><span>Adobe</span><span>Certified</span><span>Professional</span></span>
  </div>
  <div class="about__side">
    <h3>Certificati</h3>
    <ul class="certs">${CERTS.map((c) => `<li data-reveal><span class="certs__a" aria-hidden="true">A</span>Adobe ${e(c)} <small>2024 – 2027</small></li>`).join('')}</ul>
    <h3>Strumenti</h3>
    <ul class="tools">${TOOLS.map(([abbr, name, fg, bg]) => `<li style="--fg:${fg};--bg:${bg}" title="${name}"><span aria-hidden="true">${abbr}</span><em>${name}</em></li>`).join('')}</ul>
    <h3>Servizi</h3>
    <ul class="services">${config.categories.map((c) => `<li>${e(c.label)}</li>`).join('')}</ul>
  </div>
</section>`;

  const process = `<section class="process" aria-labelledby="process-title">
  <header class="sec-head">
    <span class="sec-num" aria-hidden="true">03.</span>
    <h2 id="process-title" data-split-words>Come lavoro.</h2>
  </header>
  <ol class="steps">${STEPS.map(([t, d], i) => `<li class="step" data-reveal style="--i:${i}"><span class="step__n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
</section>`;

  // Striscia "Dal feed": post Instagram se disponibili, altrimenti gli ultimi lavori.
  const igUser = config.instagram.username;
  const feedItems = feed.length ? feed : projects.slice(0, 8);
  const feedHtml = `<section class="feed" id="feed" aria-labelledby="feed-title">
  <header class="sec-head sec-head--row">
    <div><span class="sec-num" aria-hidden="true">04.</span><h2 id="feed-title" data-split-words>Dal feed.</h2></div>
    <a class="btn btn--ghost" href="${e(config.social.instagram)}" target="_blank" rel="noopener" data-magnetic>${icons.instagram} @${e(igUser)}</a>
  </header>
  <div class="feed__track" data-drag tabindex="0" aria-label="Ultimi post, trascina per scorrere">
    ${feedItems.map((p, i) => {
      const href = p.feedOnly || !p.slug ? p.sourceUrl : `${base}progetti/${p.slug}/`;
      const ext = p.feedOnly || !p.slug;
      return `<a class="polaroid" href="${e(href)}" ${ext ? 'target="_blank" rel="noopener"' : ''} style="--r:${[-3, 2, -1.5, 3, -2.5, 1.5][i % 6]}deg" data-cursor="${ext ? 'Instagram' : 'Apri'}">
      ${picture(ctx, p.images[0], { sizes: '280px' })}
      <span>${e(p.seo?.title || p.original.title)}</span>
    </a>`;
    }).join('')}
  </div>
</section>`;

  const services = ['Logo', 'Brand identity', 'Social & ads', 'Poster', 'Sito web', 'Altro'];
  const budgets = ['< 100 €', '< 500 €', '< 1.000 €', '> 1.000 €', 'Non ne ho idea'];
  const form = config.contact.form;
  const contact = `<section class="contact" id="contatti" aria-labelledby="contact-title">
  ${cropMarks}
  <header class="contact__head">
    <span class="sec-num sec-num--dark" aria-hidden="true">05.</span>
    <h2 class="contact__title" id="contact-title"><span data-split>Parliamone</span><span class="accent">.</span></h2>
  </header>
  <div class="contact__intro">
    <p>Sono sempre aperto a discutere nuove opportunità professionali. Raccontami il tuo progetto: un logo, un'identità completa, una campagna o un sito.</p>
    <ul class="direct">
      <li><a href="mailto:${e(config.contact.email)}">${icons.mail}<span>${e(config.contact.email)}</span></a><button type="button" class="copy" data-copy="${e(config.contact.email)}" aria-label="Copia indirizzo email">${icons.copy}</button></li>
      ${config.contact.showPhone && config.contact.phone ? `<li><a href="tel:${e(config.contact.phone.replace(/\s/g, ''))}">${icons.phone}<span>${e(config.contact.phone)}</span></a></li>` : ''}
    </ul>
    <p class="contact__social">${socialLinks(config)}</p>
  </div>
  <form class="form" data-form data-provider="${e(form.provider || '')}" data-key="${e(form.accessKey || '')}" data-endpoint="${e(form.endpoint || '')}" data-email="${e(config.contact.email)}" novalidate>
    <fieldset class="chips">
      <legend>Di cosa hai bisogno?</legend>
      ${services.map((s) => `<label class="chip-check"><input type="checkbox" name="servizi" value="${e(s)}"><span>${e(s)}</span></label>`).join('')}
    </fieldset>
    <div class="form__row">
      <div class="field"><input id="f-name" name="nome" autocomplete="name" required placeholder=" "><label for="f-name">Come ti chiami? *</label></div>
      <div class="field"><input id="f-email" name="email" type="email" autocomplete="email" required placeholder=" "><label for="f-email">La tua email *</label></div>
    </div>
    <div class="field"><input id="f-company" name="azienda" autocomplete="organization" placeholder=" "><label for="f-company">Azienda o progetto</label></div>
    <fieldset class="chips chips--small">
      <legend>Budget indicativo</legend>
      ${budgets.map((b, i) => `<label class="chip-check"><input type="radio" name="budget" value="${e(b)}"${i === budgets.length - 1 ? ' checked' : ''}><span>${e(b)}</span></label>`).join('')}
    </fieldset>
    <div class="field field--area"><textarea id="f-msg" name="messaggio" rows="5" required placeholder=" "></textarea><label for="f-msg">Raccontami il progetto *</label></div>
    <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="consent"><input type="checkbox" name="privacy" required> <span>Ho letto l'<a href="${base}privacy/">informativa privacy</a> e acconsento a essere ricontattato. *</span></label>
    <button class="btn btn--send" type="submit" data-magnetic><span class="btn__label">Invia messaggio</span>${icons.plane}</button>
    <p class="form__status" role="status" aria-live="polite" data-status></p>
  </form>
</section>`;

  const loader = `<div class="loader" aria-hidden="true" data-loader>${logoSvg({ cls: 'loader__logo' })}<span class="loader__count" data-count-up>0</span></div>`;

  return loader + hero + marquee + work + about + process + feedHtml + contact;
}
