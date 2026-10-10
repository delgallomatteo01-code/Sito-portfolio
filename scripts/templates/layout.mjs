import { escapeHtml as e } from '../lib/util.mjs';
import { header, footer } from './partials.mjs';

/**
 * Documento HTML completo con tutti i meta SEO / social.
 * page: { title, description, path, image, imageAlt, type, jsonLd[], body, bodyClass, noindex }
 */
export function layout(ctx, page) {
  const { config, base, siteUrl, assets } = ctx;
  const url = siteUrl + page.path;
  const image = page.image ? (page.image.startsWith('http') ? page.image : siteUrl + '/' + page.image.replace(/^\//, '')) : `${siteUrl}/assets/og-image.jpg`;
  const jsonLd = (page.jsonLd || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n');

  return `<!doctype html>
<html lang="${config.site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(page.title)}</title>
<meta name="description" content="${e(page.description)}">
<link rel="canonical" href="${e(url)}">
${page.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="author" content="${e(config.site.name)}">
<meta name="theme-color" content="#ec6648">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:site_name" content="${e(config.site.name)} – ${e(config.site.role)}">
<meta property="og:locale" content="${config.site.locale}">
<meta property="og:title" content="${e(page.ogTitle || page.title)}">
<meta property="og:description" content="${e(page.description)}">
<meta property="og:url" content="${e(url)}">
<meta property="og:image" content="${e(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(page.imageAlt || page.title)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/apple-touch-icon.png">
<link rel="sitemap" type="application/xml" href="${base}sitemap.xml">
<link rel="preload" href="${base}assets/fonts/syne-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/${assets.css}">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('mdg-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-intro')}catch(_){document.documentElement.classList.add('no-intro')}</script>
<script type="module" src="${base}assets/${assets.js}"></script>
${jsonLd}
</head>
<body class="${page.bodyClass || ''}" data-base="${base}">
${header(ctx)}
<main id="main">
${page.body}
</main>
${footer(ctx)}
</body>
</html>
`;
}
