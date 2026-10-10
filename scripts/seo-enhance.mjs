/**
 * Riscrive in chiave SEO i testi di ogni progetto pubblicato sul sito usando Claude.
 *
 * - Lavora solo sui progetti nuovi o il cui testo originale è cambiato (impronta sourceHash),
 *   quindi ogni progetto costa una sola chiamata API.
 * - Claude guarda anche le immagini, così gli alt text descrivono davvero ciò che si vede.
 * - Lo slug (URL) viene deciso una volta sola e poi non cambia più, per non perdere posizionamento.
 * - "seoLocked": true nel JSON di un progetto blocca la riscrittura (per testi corretti a mano).
 * - Senza ANTHROPIC_API_KEY genera testi di ripiego e li migliorerà appena la chiave è disponibile.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import sharp from 'sharp';
import path from 'node:path';
import { loadConfig, log, slugify, hash, truncate, MEDIA_DIR } from './lib/util.mjs';
import { loadProjects, saveProject, projectFingerprint } from './lib/store.mjs';

const config = await loadConfig();
const categoryIds = config.categories.map((c) => c.id);
const FORCE = process.argv.includes('--force');

const SeoSchema = z.object({
  title: z.string().describe('Titolo visibile del progetto (H1), max 60 caratteri, nome del progetto/cliente + cosa è stato fatto'),
  seoTitle: z.string().describe('Tag <title>, max 60 caratteri, parola chiave principale in apertura'),
  metaDescription: z.string().describe('Meta description 140-158 caratteri, invoglia al clic, include la parola chiave principale'),
  slug: z.string().describe('Slug URL in minuscolo con trattini, 3-6 parole, senza articoli e senza anno'),
  intro: z.string().describe('Paragrafo di apertura di 1-2 frasi (max 280 caratteri)'),
  sections: z.array(z.object({
    heading: z.string().describe('Sottotitolo H2 breve e descrittivo'),
    text: z.string().describe('Paragrafo di 45-90 parole'),
  })).describe('Da 2 a 4 sezioni'),
  keywords: z.array(z.string()).describe('5-8 parole chiave in italiano, dalla più alla meno importante'),
  services: z.array(z.string()).describe('2-4 servizi svolti, es. "Logo design", "Packaging"'),
  category: z.enum(categoryIds),
  imageAlts: z.array(z.string()).describe('Un alt text per ciascuna immagine fornita, nello stesso ordine, max 120 caratteri'),
  client: z.string().nullable().describe('Nome del cliente o del brand se esplicito, altrimenti null'),
});

const SYSTEM = `Sei un copywriter SEO senior specializzato in portfolio di designer, in lingua italiana.
Scrivi i testi delle pagine progetto del portfolio di ${config.site.name}, ${config.site.role} con base in ${config.site.location}.

Obiettivo: pagine che si posizionano su ricerche come quelle legate a ${config.seo.focusKeywords.join(', ')} e che convincono un potenziale cliente a scrivere.

Regole:
- Usa solo fatti presenti nei testi originali o chiaramente visibili nelle immagini. Non inventare clienti, risultati, numeri, premi, luoghi o date.
- Tono: professionale, caldo, concreto. Frasi brevi. Niente superlativi vuoti ("straordinario", "unico nel suo genere") e niente elenchi di parole chiave.
- Racconta: obiettivo del progetto, idea creativa, scelte visive (forme, tipografia, colori), applicazioni.
- Inserisci la parola chiave principale nel titolo SEO, nella meta description, nell'intro e in almeno un sottotitolo, in modo naturale.
- Se i testi originali sono in inglese o in forma di caption Instagram (emoji, hashtag), riscrivili in un italiano curato senza emoji né hashtag.
- Gli alt text descrivono cosa si vede (soggetto, supporto, colori) e citano il progetto; non iniziano con "Immagine di".
- Scegli la categoria più adatta tra: ${config.categories.map((c) => `${c.id} (${c.label})`).join(', ')}.`;

async function imageBlock(src) {
  const buf = await sharp(path.join(MEDIA_DIR, src)).resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 78 }).toBuffer();
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: buf.toString('base64') } };
}

function fallbackSeo(p) {
  const title = truncate(p.original.title || 'Progetto', 60);
  const desc = p.original.description || '';
  const cat = config.categories.find((c) => c.id === p.category)?.label ?? '';
  return {
    title,
    seoTitle: truncate(`${title} | ${config.site.name}`, 60),
    metaDescription: truncate(desc || `${title}: progetto di ${cat.toLowerCase()} di ${config.site.name}, ${config.site.role.toLowerCase()} in ${config.site.region}.`, 158),
    slug: slugify(title),
    intro: truncate(desc.split('\n')[0] || title, 280),
    sections: desc.split('\n').slice(1).filter((t) => t.trim().length > 40).slice(0, 3).map((text) => ({ heading: '', text })),
    keywords: (p.original.tags || []).slice(0, 6),
    services: [],
    category: p.category,
    imageAlts: p.images.map((_, i) => `${title} – immagine ${i + 1}`),
    client: null,
  };
}

async function generate(client, p) {
  const imgs = p.images.slice(0, config.seo.maxImagesToAnalyze);
  const content = [
    ...(await Promise.all(imgs.map((i) => imageBlock(i.src)))),
    {
      type: 'text',
      text: `Progetto da riscrivere (fonte: ${p.source}).
Titolo originale: ${p.original.title}
Testo originale:
"""
${p.original.description || '(nessuna descrizione: basati sulle immagini)'}
"""
Tag originali: ${(p.original.tags || []).join(', ') || '—'}
Anno: ${new Date(p.publishedAt).getFullYear()}
Categoria attuale (ipotesi): ${p.category}
Immagini allegate: ${imgs.length} (scrivi esattamente ${imgs.length} alt text).`,
    },
  ];

  const response = await client.messages.parse({
    model: config.seo.model,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: { effort: config.seo.effort, format: zodOutputFormat(SeoSchema) },
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`risposta non utilizzabile (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}

function clean(seo, p) {
  seo.seoTitle = truncate(seo.seoTitle, 65);
  seo.metaDescription = truncate(seo.metaDescription, 160);
  seo.intro = truncate(seo.intro, 320);
  seo.sections = (seo.sections || []).filter((s) => s.text?.trim()).slice(0, 4);
  seo.keywords = [...new Set(seo.keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 8);
  // Alt text per tutte le immagini (anche quelle oltre il limite analizzato).
  seo.imageAlts = p.images.map((_, i) => seo.imageAlts[i] || `${seo.title} – dettaglio ${i + 1}`);
  return seo;
}

async function main() {
  const projects = await loadProjects();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const client = apiKey ? new Anthropic({ apiKey }) : null;
  if (!client) log.warn('ANTHROPIC_API_KEY non impostata: uso testi di ripiego (verranno migliorati appena la chiave sarà disponibile).');

  const usedSlugs = new Set(projects.map((p) => p.slug).filter(Boolean));
  let done = 0;

  for (const p of projects) {
    if (p.hidden || p.feedOnly || p.seoLocked) continue;
    const sourceHash = hash(projectFingerprint(p));
    const upToDate = p.seo && p.seo.sourceHash === sourceHash;
    const needsUpgrade = p.seo?.model === 'fallback' && client;
    if (upToDate && !needsUpgrade && !FORCE) continue;

    let seo, model = config.seo.model;
    if (client) {
      try {
        seo = await generate(client, p);
      } catch (err) {
        log.warn(`SEO non generata per "${p.original.title}": ${err.message}`);
        if (p.seo) continue; // tengo i testi precedenti
      }
    }
    if (!seo) { seo = fallbackSeo(p); model = 'fallback'; }
    seo = clean(seo, p);

    // Slug stabile: deciso una volta, poi mai più cambiato.
    if (!p.slug) {
      let base = slugify(seo.slug || seo.title), slug = base, n = 2;
      while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
      p.slug = slug;
      usedSlugs.add(slug);
    }
    if (!p.categoryLocked && seo.category) p.category = seo.category;
    p.images = p.images.map((img, i) => ({ ...img, alt: seo.imageAlts[i] }));

    const { slug: _s, category: _c, imageAlts: _a, ...rest } = seo;
    p.seo = { ...rest, sourceHash, model, generatedAt: new Date().toISOString() };
    await saveProject(p);
    done++;
    log.ok(`SEO ${model === 'fallback' ? '(ripiego) ' : ''}→ ${p.seo.title}  /progetti/${p.slug}/`);
  }
  log.ok(`SEO aggiornata per ${done} progetti`);
}

await main();
