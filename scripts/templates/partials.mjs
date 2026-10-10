import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, escapeHtml as e } from '../lib/util.mjs';

const logoPaths = JSON.parse(readFileSync(path.join(ROOT, 'src/assets/logo-paths.json'), 'utf8'));
export const LOGO_VIEWBOX = '360 505 1285 990';

/** Logo inline: i tre pezzi (M rossa, G grigia, arco arancione) sono animabili separatamente. */
export function logoSvg({ cls = '', title = '', mono = false } = {}) {
  const fill = (c) => (mono ? 'currentColor' : c);
  return `<svg class="logo ${cls}" viewBox="${LOGO_VIEWBOX}" ${title ? `role="img" aria-label="${e(title)}"` : 'aria-hidden="true"'} focusable="false">
<path class="logo__m" fill="${fill('#c83f43')}" d="${logoPaths.red}"/>
<path class="logo__g" fill="${fill('#dddddd')}" d="${logoPaths.grey}"/>
<path class="logo__o" fill="${fill('#ec6648')}" d="${logoPaths.orange}"/>
</svg>`;
}

export const icons = {
  behance: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.2 11.3c.9-.4 1.5-1.2 1.5-2.4C9.7 6.6 8 6 6.1 6H1v12h5.3c2 0 3.9-1 3.9-3.3 0-1.4-.7-2.5-2-2.9v-.5zM3.3 8h2.2c.9 0 1.7.2 1.7 1.2s-.6 1.3-1.5 1.3H3.3V8zm2.5 8H3.3v-3.3h2.6c1 0 1.7.4 1.7 1.6 0 1.2-.8 1.7-1.8 1.7zM15.8 9c-2.8 0-4.6 2-4.6 4.6 0 2.7 1.7 4.6 4.6 4.6 2.2 0 3.6-1 4.3-3.1h-2.2c-.3.8-1.2 1.2-2 1.2-1.6 0-2.4-.9-2.4-2.4h6.7c.1-2.9-1.4-4.9-4.4-4.9zm-2.3 3.6c.1-1.2.9-2 2.2-2 1.2 0 1.9.7 2 2h-4.2zM13 6.8h5.4v1.3H13z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M7 2.5h10A4.5 4.5 0 0 1 21.5 7v10a4.5 4.5 0 0 1-4.5 4.5H7A4.5 4.5 0 0 1 2.5 17V7A4.5 4.5 0 0 1 7 2.5z"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 5.5h18v13H3z"/><path fill="none" stroke="currentColor" stroke-width="2" d="m3.5 6 8.5 7 8.5-7"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M8 7h9v9"/></svg>`,
  plane: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>`,
};

export const sourceLabel = { behance: 'Behance', instagram: 'Instagram', manual: 'Portfolio' };

/** Le crocette di registro agli angoli, come nel portfolio PDF. */
export const cropMarks = `<span class="crop crop--tl" aria-hidden="true"></span><span class="crop crop--tr" aria-hidden="true"></span><span class="crop crop--bl" aria-hidden="true"></span><span class="crop crop--br" aria-hidden="true"></span>`;

export function header(ctx) {
  const { base, config } = ctx;
  const links = [
    ['lavori', 'Lavori'],
    ['chi-sono', 'Chi sono'],
    ['feed', 'Feed'],
    ['contatti', 'Contatti'],
  ];
  return `<a class="skip" href="#main">Vai al contenuto</a>
<div class="progress" aria-hidden="true"></div>
<header class="nav" data-nav>
  <a class="nav__brand" href="${base}" aria-label="${e(config.site.name)} – home" data-logo>
    ${logoSvg({ cls: 'nav__logo' })}
    <span class="nav__name"><b>${e(config.site.name)}</b><small>${e(config.site.role)}</small></span>
  </a>
  <nav class="nav__links" aria-label="Navigazione principale">
    ${links.map(([id, label]) => `<a href="${base}#${id}" data-magnetic>${label}</a>`).join('')}
  </nav>
  <a class="btn btn--pill nav__cta" href="${base}#contatti" data-magnetic><span class="pulse" aria-hidden="true"></span>Parliamone</a>
  <button class="nav__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Apri il menu"><span></span><span></span></button>
</header>
<div class="menu" id="menu" data-menu hidden>
  <nav aria-label="Menu mobile">
    ${links.map(([id, label], i) => `<a href="${base}#${id}"><span>0${i + 1}.</span>${label}</a>`).join('')}
  </nav>
  <p class="menu__foot">${socialLinks(config)}</p>
</div>`;
}

export function socialLinks(config, cls = 'social') {
  const s = config.social;
  return [
    s.behance && `<a class="${cls}" href="${e(s.behance)}" target="_blank" rel="noopener me" aria-label="Behance">${icons.behance}<span>Behance</span></a>`,
    s.instagram && `<a class="${cls}" href="${e(s.instagram)}" target="_blank" rel="noopener me" aria-label="Instagram">${icons.instagram}<span>Instagram</span></a>`,
    s.linkedin && `<a class="${cls}" href="${e(s.linkedin)}" target="_blank" rel="noopener me" aria-label="LinkedIn">${icons.linkedin}<span>LinkedIn</span></a>`,
  ].filter(Boolean).join('');
}

export function footer(ctx) {
  const { base, config, year } = ctx;
  return `<footer class="footer">
  ${cropMarks}
  <p class="footer__big" aria-hidden="true"><span data-split>${e(config.site.tagline.replace(/\.$/, ''))}</span><span class="accent">.</span></p>
  <div class="footer__cols">
    <div>
      <a class="footer__brand" href="${base}" aria-label="Torna alla home">${logoSvg({ cls: 'footer__logo' })}</a>
      <p>${e(config.site.role)}<br>${e(config.site.location)}</p>
    </div>
    <nav aria-label="Link nel footer">
      <h2 class="footer__h">Esplora</h2>
      <a href="${base}#lavori">Lavori</a><a href="${base}#chi-sono">Chi sono</a><a href="${base}#feed">Feed</a><a href="${base}#contatti">Contatti</a>
    </nav>
    <div>
      <h2 class="footer__h">Social</h2>
      ${socialLinks(config, 'footer__social')}
    </div>
    <div>
      <h2 class="footer__h">Scrivimi</h2>
      <a href="mailto:${e(config.contact.email)}">${e(config.contact.email)}</a>
      ${config.contact.showPhone && config.contact.phone ? `<a href="tel:${e(config.contact.phone.replace(/\s/g, ''))}">${e(config.contact.phone)}</a>` : ''}
    </div>
  </div>
  <div class="footer__bottom">
    <p>© ${year} ${e(config.site.name)} · <a href="${base}privacy/">Privacy</a></p>
    <button class="totop" type="button" data-totop>Torna su <span aria-hidden="true">↑</span></button>
  </div>
</footer>`;
}

/** <img> responsive con varianti WebP generate in build. */
export function picture(ctx, img, { sizes = '100vw', eager = false, cls = '', vt = '' } = {}) {
  const variants = ctx.variants.get(img.src) || [];
  const largest = variants[variants.length - 1];
  const srcset = variants.map((v) => `${ctx.base}${v.path} ${v.width}w`).join(', ');
  return `<img class="${cls}" src="${ctx.base}${largest?.path ?? 'media/' + img.src}" ${srcset ? `srcset="${srcset}" sizes="${sizes}"` : ''} width="${img.width}" height="${img.height}" alt="${e(img.alt || '')}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${vt ? ` style="view-transition-name:${vt}"` : ''}>`;
}
