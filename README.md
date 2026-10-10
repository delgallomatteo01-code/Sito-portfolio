# Matteo Del Gallo — Portfolio

Sito portfolio statico che **si aggiorna da solo**: ogni giorno legge i nuovi progetti da **Behance** e i post da **Instagram**, fa **riscrivere a Claude** i testi di ogni progetto in chiave SEO e ripubblica il sito su **GitHub Pages**. Costo di hosting: zero.

```
Behance (RSS) ─┐
               ├─► content/projects/*.json ─► Claude (testi SEO + alt) ─► build ─► GitHub Pages
Instagram API ─┘          (+ immagini in content/media/)
```

## Cosa c'è dentro

| Cartella / file | A cosa serve |
|---|---|
| `site.config.json` | **Tutte le impostazioni**: dati personali, social, categorie, modulo contatti, modello AI |
| `content/projects/` | Un file JSON per progetto (anche modificabile a mano) |
| `content/media/` | Immagini dei progetti in WebP |
| `scripts/sync-behance.mjs` | Legge il feed RSS di Behance e scarica i progetti nuovi |
| `scripts/sync-instagram.mjs` | Legge i post Instagram (serve un token, vedi sotto) |
| `scripts/seo-enhance.mjs` | Riscrive titolo, meta description, testi e alt text con Claude |
| `scripts/build.mjs` | Genera il sito in `dist/` (pagine, immagini responsive, sitemap, dati strutturati) |
| `src/css`, `src/js`, `src/assets` | Stile, animazioni, logo, font, ritratto |
| `.github/workflows/sync-and-deploy.yml` | Automazione giornaliera + pubblicazione |

I 17 progetti del portfolio PDF 2026 sono già caricati, con testi SEO scritti a mano: il sito è completo anche prima di collegare Behance e Instagram.

## Messa online (una volta sola, ~20 minuti)

### 1. GitHub Pages
1. Unisci questo branch in `main`.
2. Repository → **Settings → Pages → Source: GitHub Actions**.
3. Scheda **Actions** → "Aggiorna e pubblica il sito" → **Run workflow**.
4. Il sito sarà su `https://delgallomatteo01-code.github.io/Sito-portfolio/`.

### 2. Testi SEO automatici (Claude)
1. Crea una chiave su [console.anthropic.com](https://console.anthropic.com) (serve un metodo di pagamento).
2. Repository → **Settings → Secrets and variables → Actions → New repository secret**: `ANTHROPIC_API_KEY`.

Ogni progetto viene riscritto **una sola volta** (e di nuovo solo se cambi il testo originale). Con il modello predefinito (`claude-opus-5-5`) il costo è nell'ordine di pochi centesimi a progetto. Puoi cambiare modello ed "effort" in `site.config.json → seo`.

Senza chiave il sito funziona comunque: usa testi di ripiego e li migliora appena aggiungi la chiave.

### 3. Modulo contatti (Web3Forms, gratuito)
1. Vai su [web3forms.com](https://web3forms.com), inserisci `mdelgallo.design@gmail.com` e ricevi l'**access key** via email.
2. Incollala in `site.config.json → contact.form.accessKey` (è una chiave pubblica, si può tenere nel codice).

Finché la chiave è vuota, il pulsante "Invia" apre il programma di posta con il messaggio già compilato. Vuoi Formspree o altro? Metti l'URL in `contact.form.endpoint` e lascia vuota `accessKey`.

### 4. Instagram (opzionale ma consigliato)
Instagram non ha un feed pubblico: serve l'**Instagram API with Instagram Login**.
1. L'account `@visual_matt` deve essere **Professional** (Creator o Business): Impostazioni → Tipo di account.
2. Su [developers.facebook.com](https://developers.facebook.com) crea un'app → aggiungi il prodotto **Instagram** → "API setup with Instagram login".
3. Aggiungi `@visual_matt` come tester / account collegato e **genera un token** (permesso `instagram_business_basic`).
4. Salvalo come secret `INSTAGRAM_ACCESS_TOKEN`.
5. Il token scade dopo 60 giorni: il workflow lo rinnova a ogni giro. Perché il token rinnovato venga **salvato**, crea un [fine-grained token GitHub](https://github.com/settings/personal-access-tokens) solo su questo repo con permesso *Secrets: read and write* e salvalo come secret `GH_ADMIN_TOKEN`. Senza, dovrai rigenerare il token a mano ogni ~2 mesi.

Regole sui post (in `site.config.json → instagram`):
- `#noportfolio` nella caption → il post viene ignorato.
- Post che linkano Behance → compaiono solo nella striscia "Dal feed" (il progetto arriva già da Behance, niente doppioni).
- `requireHashtag: "#portfolio"` → solo i post con quell'hashtag diventano pagine progetto; gli altri restano nel feed.
- `publishAsProjects: false` → Instagram compare solo nella striscia "Dal feed".

### 5. Dominio personalizzato (quando vuoi)
Compra ad esempio `matteodelgallo.it`, configuralo in Settings → Pages → Custom domain, poi aggiorna `site.url` in `site.config.json` (es. `https://matteodelgallo.it`). Tutti i link, la sitemap e i meta si adattano da soli.

## Ritocchi a mano

Apri il JSON del progetto in `content/projects/` e modifica:

| Campo | Effetto |
|---|---|
| `"hidden": true` | Nasconde il progetto |
| `"featured": true` | Card grande e in cima alla griglia |
| `"order": 1` | Forza la posizione (numeri più bassi = prima) |
| `"category": "logo"` + `"categoryLocked": true` | Categoria scelta da te, l'AI non la cambia |
| `"seoLocked": true` | L'AI non riscrive più i testi (per correzioni manuali in `seo`) |

Lo **slug** (l'indirizzo della pagina) viene deciso una volta e non cambia più, per non perdere il posizionamento.

Per **rigenerare tutti i testi**: `npm run seo -- --force` (con `ANTHROPIC_API_KEY` impostata).

## Lavorare in locale

```bash
npm install
npm run dev          # build + server su http://localhost:4321/Sito-portfolio/
npm run update       # sync Behance/Instagram + SEO + build
```

## Note SEO già incluse
- Pagina dedicata per ogni progetto con `<title>`, meta description, canonical, Open Graph e immagine social 1200×630.
- Dati strutturati JSON-LD: `Person` (con certificazioni Adobe), `WebSite`, `CreativeWork`, `BreadcrumbList`.
- `sitemap.xml` con immagini, `robots.txt`, HTML semantico in italiano, alt text descrittivi.
- Immagini WebP responsive con lazy loading, font ospitati in locale (nessuna richiesta a Google Fonts: meglio per GDPR e velocità).

## Da controllare prima di andare online
- **Privacy**: la pagina `/privacy/` è una base onesta ma generica; se apri la partita IVA, aggiungi P.IVA nel footer (obbligatoria per i siti dei professionisti in Italia).
- **Telefono**: è visibile perché era nel PDF; per nasconderlo `contact.showPhone: false`.
- **LinkedIn**: aggiungi l'URL in `social.linkedin` e comparirà ovunque.
