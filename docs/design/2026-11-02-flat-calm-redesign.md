# Flat, calm redesign: the final spec

Repo: D:\carl-gabriel-portfolio (static site). Date: 2 November 2026.
Brief from Carl: "make it phone friendly, and also make it big impact to clients. design the front end, make it chill in mind, I don't like gradient."

This document is the single source of truth for the re-skin. It starts from the winning proposal (Quiet Ink), grafts in the ideas the judges asked for from the other two (Blockprint's hairline cell grid for numbers and one solid coral surface per page; Broadsheet's rgba tokenisation, the `.spend-rows` phone bar list, and the "nav never hides on phones, so the dock goes" pair), and resolves every contradiction between them. Where this spec and a proposal differ, this spec wins.

Repo facts this spec was checked against: styles.css has 41 gradient declarations, 9 `backdrop-filter`, 10 `mask-image`; hard-coded alphas are `rgba(244,242,252,` x27, `rgba(18,17,42,` x17, `rgba(30,28,58,` x13, `rgba(12,11,30,` x11; the `<div class="ambient">` block lives in `_tools/shell/nav.html` inside the `shell:nav` markers; `.nav-cta` is inside `#navMenu` in the shell; `.cta-band` exists on work, ama-holdings, results, services and about, not on index, contact or 404; `.cta-dock` is page markup after `<!-- /shell:footer -->` on index, work, ama-holdings, results, services and about; `.to-top` is in the footer shell; about.html has six `.tl-item`s; the lightbox `.lb-cap` figcaption is a sibling of `.lb-img` inside `.lb-figure`; `.stat` (section 08) comes after `.card` (section 03) in source order; desktop `.nav-menu{display:contents}` is already overridden by the fixed panel rule under 860px; the spend table's peak week is Sep 23 to Sep 29 at US$3.77M.

---

## 0. Direction and governing rules

**Direction in one line:** deep flat navy surfaces, hairlines and whitespace instead of glows and blur; big Anton numbers in a hairline cell grid; coral reserved for the primary button, the brand mark, the surname and one highlighted number per screen; one solid coral surface at the end of each page; almost no motion.

**Governing rules (apply to every component):**

1. **One coral button and one coral number per screen.** Coral identity points that stay: `.brand b`, the hero surname `.ac`, the `em` in every page h1, the `.val` of a `.stat--hl` cell, the peak bar in a chart, the primary button. Everything else that was coral (eyebrows, chips, tabs, timeline, pagebar, suffixes, `.tile-go`, `.reg-when`, `.spend-table summary`, section h2 `em`) becomes ink or mute.
2. **One solid coral surface per page, at the end.** `.cta-band` on work, ama-holdings, results, services, about; `.tile--contact` on index. Inside it the primary button inverts (ink fill, cream text) so the "one coral button" rule still holds. contact.html and 404.html have no coral surface.
3. **Surface ladder instead of shadows:** `--bg-0` < `--bg` < `--bg-2` < `--panel` < `--panel-2`, separated by 1px hairlines. The only `box-shadow` left in the file is `--shadow` on floating UI (lightbox controls, the desktop `.to-top`) and the two hard 0-blur rings on `.tl-node.lit` and `.step-node`. `box-shadow:none` is allowed anywhere.
4. **Zero gradients, zero blur, zero masks.** No CSS function whose name ends in `-gradient(` (linear, radial, conic or repeating), no `backdrop-filter`, `-webkit-backdrop-filter`, `mask-image`, `-webkit-mask-image`, `filter:blur(`, `filter:drop-shadow(`, `mix-blend-mode` or `text-shadow` anywhere in the finished stylesheet. `grep -c "gradient" styles.css` must print 0.
5. **Hover changes colour, border colour or underline. Never position, size or shadow.**
6. **Mono floor 12px** for anything that carries meaning; 11px only on one-to-three-word chips; nothing under 11px.
7. **Copy:** no em or en dashes (use a hyphen, a colon or the middot); none of: elevate, unlock, discover, delve, seamless, transformative, game-changer, robust, leverage, empower, unleash, journey, tapestry; never name Carl's Philippine employer; the hero title line `Digital Marketing Manager · E-commerce Growth Specialist · AI Specialist` stays byte-identical in `.hero-role` and `.footer-tag`.
8. **Hooks stay.** Every class and data attribute main.js reads keeps its name: `reveal`, `snap-in` + `d1`..`d5`, `data-split`, `data-count` on `.val`, `data-stagger`, `.seg` / `.seg-ind` / `.seg-btn` (+ `--seg-x --seg-w --ind-x --ind-w`), `.proof-tab` / `.proof-tablist` / `.proof-panel`, `.work-tab` / `.work-tabs` / `.work-group`, `.gal-item` / `.gal-filters` / `.gal-count` / `data-lb-group`, `.lightbox` / `.lb-img` / `.lb-desc` / `.lb-close` / `.lb-prev` / `.lb-next`, `.tl-node` / `.tl-progress` / `--tl-p`, `.nav-toggle` / `#navMenu` / `.nav-menu` / `.nav-cta` / `.pagebar`, `.to-top`, `.vframe` / `.vframe-toggle` / `.vframe-bar`, `.spend` / `.bar.bN` / `.tip.tN`, `.tape`, `.steps` / `.step` / `.steps-line`, `.faq-q` / `.faq-body`, `.contact-form` + `data-endpoint` + honeypot, `.jumpnav` / `.jumpnav-list`, `.tile-link` ids and `data-vt`. Markup for `.rotator`, `.ticker-pause`, `[data-depth]`, `.magnet`, `.tilt`, `.cta-dock` is removed; `initRotator`, `initTicker`, `initParallax`, `initCards` and `initFloatingUi` already return early or no-op when those are absent.
9. **Shell discipline.** `_tools/shell/{head,nav,footer}.html` are edited, then `python _tools/sync-shell.py` applies them to all eight pages and `python _tools/sync-shell.py --check` must exit 0. Never edit the `<!-- shell:x -->` blocks inside a page.
10. **No git, no deploy, no node_modules.**

---

## 1. Colour tokens (styles.css 00)

Replace the colour part of `:root`; keep `--hook`, `--body`, `--mono`, `--pad`, `--section`, `--ease`, `--ease-out`, `--nav-h`, `--jump-h`, `--wrap`.

```css
:root{
  /* surfaces, darkest to lightest */
  --bg-0:#0C0B1E;        /* nav when scrolled, caption bars, lightbox chrome, chart tip, inputs */
  --bg:#12112A;          /* page, grid cells */
  --bg-2:#1A1838;        /* .section--alt, image wells, .auto-flow */
  --panel:#1E1C3A;       /* cards, tiles, forms, chart card */
  --panel-2:#252247;     /* raised: hover fill on pager and ci-row, active menu row */

  /* lines */
  --edge:#332F58;                        /* control borders, chips, inputs */
  --edge-soft:rgba(var(--fg-rgb),.10);   /* card borders, section rules, cell grid lines */
  --edge-strong:rgba(var(--fg-rgb),.28); /* hover border, ghost button, portrait outline */

  /* text */
  --text:#F4F2FC;
  --mute:#9E99C6;        /* 6.5:1 on --panel, 7.2:1 on --bg */
  --dim:#6F6A94;         /* decorative only: separators, swipe cues */
  --fg-rgb:244,242,252;
  --bg-rgb:18,17,42;

  /* coral */
  --accent:#FF4D5E;        /* brand mark, surname, h1 em, highlighted numbers, peak bar, coral surfaces */
  --accent-rgb:255,77,94;
  --accent-btn:#D43748;    /* primary button fill, white text 4.6:1 */
  --accent-btn-deep:#C92E3C;
  --accent-text:#FF6674;   /* small coral text on --panel, 5:1: .stat--hl sublabel only, .is-error */
  --accent-tint:rgba(var(--accent-rgb),.10); /* .stat--hl cells, .vs--me */
  --ink:#12112A;           /* text and button fill on a coral surface: 5.7:1 on #FF4D5E */

  /* data colours: diagrams, chart bars, legends. Never UI chrome. */
  --data-1:#FF4D5E;
  --data-2:#6C8BFF;
  --data-3:#36D399;
  --data-mute:rgba(var(--fg-rgb),.28);
  --blue:#6C8BFF;--blue-rgb:108,139,255;  /* kept: existing diagram rules read them */
  --win:#36D399;--win-rgb:54,211,153;

  --shadow:0 8px 24px rgba(0,0,0,.35);   /* floating UI only */
  --scrim:rgba(12,11,30,.9);             /* solid caption bar over media */

  --t-xs:12px;--t-sm:13px;
  --r:12px;--r-lg:20px;                  /* was 14/24 */
}
```

**Tokenise the alphas (do this first, by search and replace):** `rgba(244,242,252,` becomes `rgba(var(--fg-rgb),` (27); `rgba(18,17,42,` and `rgba(30,28,58,` become `rgba(var(--bg-rgb),` (17 + 13). Leave the 11 `rgba(12,11,30,` scrims; most are deleted in step 2 and the survivors become `var(--scrim)`. Every surface then flips from one place if Carl ever wants a light mode (Broadsheet's `.plate` scoping is the path then; not now).

**Coral surface scope (new rule at the end of 00):**

```css
.coral{
  background:var(--accent);color:var(--ink);
  --text:#12112A;--mute:#12112A;--dim:rgba(18,17,42,.7);
  --edge-soft:rgba(18,17,42,.2);--edge-strong:rgba(18,17,42,.45);
}
.coral .btn--primary{background:var(--ink);color:#F4F2FC}
.coral .btn--primary:hover{background:#F4F2FC;color:var(--ink)}
.coral .btn--link{color:var(--ink);text-decoration-color:rgba(18,17,42,.45)}
.coral .eyebrow{color:var(--ink)}
.coral .eyebrow::before{background:var(--ink)}
.coral .hook,.coral .hook em,.coral .lede,.coral .tile-title,.coral .tile-title em{color:var(--ink)}
.coral .hook em,.coral .tile-title em{text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:6px}
```

`.coral` goes on each `.cta-band` section and on index.html's `.tile--contact`. Hierarchy inside a coral surface comes from size and weight; the `em` is underlined, not recoloured.

**What replaces each effect:**

| Was | Now |
|---|---|
| `.ambient` glows + `.grain` (fixed blurred layers) | Deleted (shell + 04 + 29). Body is flat `--bg`; rhythm comes from `.section--alt{background:var(--bg-2);border-block:1px solid var(--edge-soft)}` and the surface ladder |
| `.hero-dots`, `.auto-flow` dot fields | Deleted; `.auto-flow{background:var(--bg-2);border-bottom:1px solid var(--edge)}` |
| `.card` purple fill, inset highlight, 60px shadow, 12px blur, `::before` spotlight | `background:var(--panel);border:1px solid var(--edge-soft);box-shadow:none`; `::before` pair deleted |
| Coral glows on `.btn--primary`, `.seg-ind`, `.ic-tile--solid`, `.cta-dock`, `.tl-node.lit`, `.step-node`, `.nav-cta[aria-current]` | Removed; depth is the 1px border and the surface step |
| Blue as UI chrome (`.eyebrow`, `.footer-h`, `.tl-org`, `.ops-legend b`, `.spend-table th`, underline second stop) | `--mute` or `--text`; blue survives only inside diagrams and legends as `--data-2` |
| Caption scrims over images and video | Solid `var(--scrim)` bar sized to the text block, or the caption moved below the image on `--panel` |
| Edge-fade masks on ticker, reels, stills, jumpnav | Hard clip plus the next card peeking (`padding-right:32px`) |
| Tinted highlights (`.stat--hl`, `.vs--me`) | `background:var(--accent-tint);border-color:rgba(var(--accent-rgb),.42)` |
| `.cta-band` radial wash, `.tile--contact` tint | `.coral` solid surface |

Contrast confirmations: `--text` on `--bg` 15.9:1; `--mute` on `--panel` 6.5:1; white on `--accent-btn` 4.6:1; `--ink` on `--accent` 5.7:1; `--bg` text on a `--text` pill 15.9:1; `--accent-text` on `--panel` 5.0:1; `--accent` as 40px+ Anton on `--bg` 4.6:1 (large-text threshold 3:1).

---

## 2. Type scale

Three faces stay: Anton (`--hook`) for display and numbers, Schibsted Grotesk (`--body`) for everything a person reads, Martian Mono (`--mono`) for short labels. Changes are a floor and tracking that shrinks with size, not a face swap.

**Display (Anton 400, uppercase, letter-spacing .005em):**

| Role | Selector | Phone 375 | Desktop | Rule |
|---|---|---|---|---|
| Home name | `.hero-name` | 46px | 96px | `clamp(44px,12vw,96px)`, line-height .95 |
| Page title | `.page-title` | 36px | 72px | `clamp(34px,9vw,72px)`, line-height .98, max-width 22ch |
| Hero value line (new) | `.hero-hook` | 24px | 34px | `clamp(22px,5.6vw,34px)`, line-height 1.05 |
| Section h2 | `h2.hook` | 30px | 56px | `clamp(30px,5vw,56px)` |
| Question heads | `.qa-q` | 24px | 36px | unchanged |
| Stat number | `.stat-num` | 36px two-up; 52px spanning `.stat--hl` | 56px | `clamp(36px,4vw,56px)`; `.stat--hl .stat-num{font-size:clamp(52px,6vw,72px)}` |
| Result number | `.res-num` | 40px | 56px | `clamp(40px,4vw,56px)` |
| Tile title | `.tile-title` | 20px | 28px | `--xl` 28 to 44 unchanged |
| Card title | `.card-title` | 20px | 23px | unchanged |
| Brand row names | `.ticker-list li` | 18px | 22px | `clamp(18px,2vw,22px)` |
| CTA band hook | `.cta-band .hook` | 30px | 54px | unchanged |

**Body (Schibsted Grotesk):** `body` 17px desktop, 16px at or under 520px, line-height 1.6. `.lede` `clamp(16px,1.4vw,18px)`, max-width 600px, `--mute` with `strong` in `--text`. Card copy (`.svc p`, `.run > p`, `.res-d`, `.tl-bullets li`, `.vs-list li`, `.reg p`, `.ops-legend p`, `.tile-list`) 15px / 1.55, never below 14.5px. `.hero-role` `clamp(15px,1.6vw,21px)`, weight 500, `--text`, line-height 1.45, the middle `<span>` also `--text`. `.pains li` 15px mixed case body face. Mobile menu links 18px body weight 500. `.cf-note` 14px body. `.footer-contact a` 15px. Form inputs 16px.

**Mono (Martian Mono 400, uppercase unless noted), two sizes:**

- **13px, .08em:** `.mono-line` (every `h2.sub-head`), `.eyebrow`, `.jumpnav a` (.06em), `.seg-btn` (.06em; 12px .04em under 560px), desktop `.nav-links a`, `.spend-table summary`, `.proof-to-gal`, `.step::before`, `.tl-more summary`.
- **12px, .06em:** `.stat-label i` (.04em), `.tile-meta`, `.tile-go`, `.reg-when`, `.brand-market`, `.brand-fact`, `.contact-form label` (.08em), `.ci-text b`, `.footer-h` (.12em), `.footer-copy`, `.footer-note`, `.footer-updated`, `.pager small`, `.tl-place`, `.tl-org`, `.welcome`, `.hero-meta li`, `.hs-label`, `.ticker-tag`, `.ops-legend b`, `.ops-stack figcaption`, `.spend-table th`, `.res-num .from`, `.stack-note`, `.hero-proof-list`, `.ops-steps li::before`, `.spend-rows .sr-wk`.
- **12px mixed case, .02em, `text-transform:none`:** `.gal-cap span`, `.vframe-cap`, `.lb-desc`, `.flow-steps li`, `.stat-label i` on phones.
- **11px, .06em, chips only:** `.chip`, `.svc-tags li`, `.reg-stack li`, `.tile-chips .chip`, `.gal-count` (no tracking).
- SVG text is not bumped (it scales with the viewBox); phones get HTML replacements for all three diagrams (section 3).

Numbers keep `font-variant-numeric:tabular-nums`. `.pre` and `.suf` stay body 700 at .42em and both become `--mute`.

---

## 3. Component treatments

Section numbers are styles.css sections.

### 3.1 Nav and mobile menu (05, shell nav.html, main.js initNav)

- `.nav{background:var(--bg);border-bottom:1px solid transparent}` no blur. `.nav--scrolled{background:var(--bg-0);border-bottom-color:var(--edge-soft)}`. Keep the `transform` transition and `view-transition-name`.
- `--nav-h` 66px desktop; `@media (max-width:860px){:root{--nav-h:58px}}`.
- `.brand` unchanged; `.brand b` stays `var(--accent)` (identity point, keep).
- `.nav-links a` 13px .08em `--mute`; hover and current `--text`. `::after{height:1px;background:var(--text)}`, keep scaleX and the `[aria-current="page"]` rule.
- **Shell edit:** move `<a class="btn btn--primary btn--sm nav-cta" href="contact.html" data-nav="contact">Book a call</a>` out of `#navMenu` to directly after `.brand`, before `.nav-toggle`. New `.nav-inner` DOM order: brand, nav-cta, nav-toggle, nav-menu. The sync script still sets `aria-current` by `data-nav`.
- Desktop order (861px+): `.brand{order:0}.nav-links{order:1;margin-left:auto}.nav-cta{order:2;margin-left:8px}.nav-toggle{order:3}`. `.nav-menu{display:contents}` stays in the base rule (it is already overridden by the fixed panel under 860px, so the phone panel keeps its box).
- Phone (<=860px): `.nav-cta{display:inline-flex;order:1;margin:0 0 0 auto;min-height:40px;padding:6px 14px;font-size:13px;align-self:center}` `.nav-toggle{order:2;margin-left:8px}`. Delete the old `.nav-cta{margin:16px 0 0;min-height:46px;align-self:stretch}` phone rule. `.nav-cta[aria-current="page"]{box-shadow:0 0 0 2px rgba(var(--fg-rgb),.55)}` (ring only).
- **Phones never hide the nav.** main.js `initNav`: wrap the hide/show branch in `if (!matchMedia('(max-width:860px)').matches)`; raise desktop thresholds to `dy > 8 && y > 200` hide, `dy < -8 || y <= 200` show. The pill is therefore on screen at every scroll position on a phone, which is why the dock can go (3.17).
- `.pagebar i{background:var(--mute);height:2px}`.
- Mobile panel: `background:var(--bg);box-shadow:none;border-bottom:1px solid var(--edge-soft)`. Rows: `.nav-links a{display:block;padding:16px 0;font-family:var(--body);font-size:18px;font-weight:500;letter-spacing:0;text-transform:none;border-bottom:1px solid var(--edge-soft)}`; current row `padding-left:14px;border-left:2px solid var(--text)` with `::after` hidden. Remove the per-item stagger: `.nav-links li{opacity:1;transform:none;transition:none}` (the inline `--i` attributes can stay). The panel keeps its 300ms fade.

### 3.2 Buttons (03)

```css
.btn{min-height:48px;padding:12px 24px;border-radius:999px;font-weight:700;font-size:15px;
     transition:background-color .2s var(--ease),border-color .2s var(--ease),color .2s var(--ease)}
.btn--primary{color:#fff;background:var(--accent-btn);box-shadow:none}
.btn--primary:hover{background:var(--accent-btn-deep)}
.btn--ghost{color:var(--text);background:transparent;border-color:var(--edge-strong)}
.btn--ghost:hover{border-color:var(--text);background:rgba(var(--fg-rgb),.05)}
.btn--sm{min-height:40px;padding:8px 16px;font-size:13px}
.btn--link{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 4px;font-weight:600;font-size:15px;
     color:var(--text);text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--edge-strong)}
.btn--link:hover{text-decoration-color:var(--text)}
```

Press feedback stays via 27 `scale:.97`. Delete `.magnet{will-change:transform}` and remove `magnet` from every button in the pages.

### 3.3 Chips (03)

`.chip{font-size:11px;letter-spacing:.06em;padding:5px 10px 4px;border:1px solid var(--edge);background:transparent;color:var(--mute);border-radius:999px}`. `.chip--accent` and `.chip--blue` render as the base chip (keep the class names). `.chip--win` keeps `--data-3` text and `rgba(var(--win-rgb),.4)` border (it marks status). Chips over media (`.tile-chip`, `.gal-chip`, `.vframe .chip`, `.about-photo .chip`): `background:var(--scrim);color:var(--text);box-shadow:none`.

### 3.4 Cards (03)

`.card{position:relative;background:var(--panel);border:1px solid var(--edge-soft);border-radius:var(--r-lg);box-shadow:none}`. Delete `--mx`/`--my` defaults, `isolation`, `backdrop-filter`, `.card::before`, `.card:hover::before`. `.card--lift` keeps its transition list (shared with `.reveal`) but `.card--lift:hover{transform:none;border-color:var(--edge-strong);box-shadow:none}`. Delete the `@media (hover:hover){.card--lift.in:hover,.vframe.in:hover{transform:translateY(-6px)}}` rule in 20. `.card.tilt:hover` keeps only `border-color:var(--edge-strong)`; remove `tilt` from the four `.result` cards in results.html. Delete the 19 phone override `.card,.float-pill{backdrop-filter:none}`.

### 3.5 Icon tiles (03)

`.ic-tile{width:40px;height:40px;border-radius:10px;color:var(--text);background:transparent;border:1px solid var(--edge)}`. `--blue`, `--win`, `--solid` variants render as the base tile. Hidden inside `.stat` everywhere (the number is the icon).

### 3.6 Stats: the hairline cell grid (08, 29) [Blockprint graft]

Stats stop being floating cards and become cells in one hairline grid. This is the flat data idiom for the whole site.

```css
.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;
            background:var(--edge-soft);border:1px solid var(--edge-soft);border-radius:var(--r-lg);overflow:hidden}
.stats-grid--6{grid-template-columns:repeat(3,minmax(0,1fr))}
.stat{display:flex;flex-direction:column;gap:14px;padding:28px 26px 26px;
      background:var(--bg);border:0;border-radius:0;box-shadow:none}   /* .stat follows .card in source order, so this wins */
.stat .ic-tile{display:none}
.stat-num{font-family:var(--hook);font-size:clamp(36px,4vw,56px);line-height:.95;letter-spacing:0;font-variant-numeric:tabular-nums;color:var(--text)}
.stat-num .pre,.stat-num .suf{font-family:var(--body);font-weight:700;font-size:.42em;color:var(--mute)}
.stat-label{font-size:15px;font-weight:500;line-height:1.4}
.stat-label i{display:block;margin-top:6px;font-family:var(--mono);font-size:12px;letter-spacing:.04em;color:var(--mute)}
.stat--hl{background:var(--accent-tint)}
.stat--hl .val{color:var(--accent)}
.stat--hl .stat-num{font-size:clamp(52px,6vw,72px)}
.stat--hl .stat-label i{color:var(--accent-text)}
@media (max-width:1000px){.stats-grid,.stats-grid--6{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){
  .stats-grid,.stats-grid--6{grid-template-columns:repeat(2,minmax(0,1fr))}
  .stat{padding:16px 14px 14px;gap:8px}
  .stat-num{font-size:36px}
  .stat--hl{grid-column:1 / -1}
  .stat--hl .stat-num{font-size:52px}
  .stat-label{font-size:14px}
  .stat-label i{font-size:12px;letter-spacing:.02em;text-transform:none}
}
```

Delete the `.stats-grid--6` breakpoints in 29 and the 520px one-column `.stats-grid` rule in 08. At most two `.stat--hl` cells on home (US$44M, US$13.9M), one on AMA (US$44.2M), one per results panel. The same grid rules apply to `.result-grid` (11) and `.proof-grid--3/--4`: `gap:1px;background:var(--edge-soft);border:1px solid var(--edge-soft);border-radius:var(--r-lg);overflow:hidden` with `.result,.proof-grid > .card{background:var(--bg);border:0;border-radius:0}`; phones two columns, `.result{padding:18px 16px}`, `.res-num{font-size:40px}`.

### 3.7 Bento tiles (24, 29)

- `.bento{gap:16px}`; tiles inherit the flat `.card`.
- `.tile--work`: `.bento-video::after{display:none}`; `.tile--work .tile-body{background:var(--scrim);border-top:1px solid var(--edge-soft);padding:20px 22px}`. Keep `.tile-body{position:relative;z-index:1}` and `.tile-link::after{inset:0;z-index:2}` exactly as they are (do not re-stack). `.vframe-toggle` keeps `z-index:3`. Under `(hover:none)` the reel shows its poster and starts on tap (main.js, section 8).
- `.tile--case`: `.tape::after{display:none}`; `.tile--case .tile-body{background:var(--scrim);border-top:1px solid var(--edge-soft)}`; `.tape rect{fill:var(--data-mute);opacity:1}` `.tape rect:last-child{fill:var(--accent)}` (the latest week is the tile's one coral number). `.tape text` stays (aria-hidden axis).
- `.tile--dash`: `.tile-shot::after{display:none}`; `.tile-shot img{opacity:.6;transform:none;transition:none}`; `.tile--dash .tile-body{background:var(--scrim);border-top:1px solid var(--edge-soft)}`. Delete `.tile--dash:hover .tile-shot img{transform:scale(1.06)}`.
- `.tile--contact` gets class `coral` in index.html: `.tile--contact{border:0}` and the `.coral` scope does the rest (ink text, inverted button). Delete the `.tile--contact .eyebrow` override and its comment; delete `.tile--contact:hover .btn` shadow.
- `.tile-go` 12px .06em `--text`; hover underlines (`text-decoration:underline;text-underline-offset:4px`), no nudge: `.tile:hover .tile-go,.tile:has(.tile-link:focus-visible) .tile-go{transform:none}`.
- Phone (<=560px): `.bento{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}` `.tile--work,.tile--case,.tile--contact{grid-column:1 / -1}` `.tile--results,.tile--dash,.tile--services,.tile--exp{grid-column:span 1;padding:18px 16px}` `.tile--work{min-height:280px}` `.tile--case{min-height:260px}` `.tile--dash{min-height:200px}` `.tile-chips li:nth-child(n+3){display:none}` `.tile--results .tile-list li:nth-child(n+2){display:none}` `.tile-title{font-size:20px}`.

### 3.8 Static brand row (07, index.html)

The marquee becomes a static wrapped row placed **after** `#results`. index.html: delete the second `<ul class="ticker-list" aria-hidden="true">` and the `<button class="ticker-pause">`; keep `<section class="ticker">`, `.ticker-viewport`, `.ticker-track`, one `.ticker-list`. CSS: `.ticker{padding:22px 0;border-block:1px solid var(--edge-soft)}` `.ticker-viewport{overflow:visible}` (mask deleted) `.ticker-track{display:block;width:auto;animation:none}` `.ticker-list{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:12px 28px;padding:0 var(--pad);max-width:var(--wrap);margin-inline:auto}` `.ticker-list li{font-size:clamp(18px,2vw,22px);color:var(--mute)}` `.ticker-list li:nth-child(-n+2){color:var(--text)}` `.ticker-tag{font-size:12px;letter-spacing:.06em}`. Delete `@keyframes ticker`, `.ticker-pause*`, `.ticker--paused` and the 21 line `.ticker-pause{display:none}`. `initTicker` returns early without the button.

### 3.9 Segmented controls and tabs (03, 10, 11, 12, main.js segUpdate)

```css
.seg{padding:3px;border:1px solid var(--edge);background:var(--bg-0);box-shadow:none;border-radius:999px}
.seg-ind{background:var(--text);box-shadow:none;border-radius:999px;top:3px;bottom:3px;
         transition:transform .3s var(--ease-out),width .3s var(--ease-out)}
.seg-btn{min-height:42px;padding:10px 16px;font-size:13px;letter-spacing:.06em;color:var(--mute)}
.seg-btn.is-active,.seg-btn[aria-pressed="true"],.seg-btn[aria-selected="true"]{color:var(--bg)}
.seg-btn[aria-pressed="true"] .gal-count{background:rgba(var(--bg-rgb),.12);border-color:rgba(var(--bg-rgb),.2);color:var(--bg)}
@media (max-width:560px){
  .proof-tablist,.gal-filters,.work-tabs{display:flex;width:100%;overflow-x:auto;overscroll-behavior-x:contain;
    scrollbar-width:none;scroll-snap-type:x proximity;scroll-padding-inline:3px}
  .proof-tablist::-webkit-scrollbar,.gal-filters::-webkit-scrollbar,.work-tabs::-webkit-scrollbar{display:none}
  .proof-tablist .seg-btn,.gal-filters .seg-btn,.work-tabs .seg-btn{flex:none;scroll-snap-align:start;padding-inline:14px;font-size:12px;letter-spacing:.04em}
  .gal-filters .gal-count{font-size:11px;min-width:20px;height:20px}
}
```

Delete the old phone `.work-tabs` and `.gal-filters .seg-btn{flex:1 1 auto...}` rules. `offsetLeft` ignores `scrollLeft`, so `segUpdate` needs no change for measurement; add one line in `segUpdate` after the transform is written: `if (!instant && btn.scrollIntoView) btn.scrollIntoView({block:'nearest',inline:'nearest'})` so the chosen tab is in view (Blockprint graft). Tab panel fade (WAAPI) unchanged.

### 3.10 Gallery captions and lightbox (12, main.js initLightbox)

- Caption under the image: `.gal-item{display:grid;background:var(--panel);border:1px solid var(--edge-soft);border-radius:var(--r-lg);overflow:hidden}` `.gal-cap{position:static;display:grid;gap:4px;padding:14px 16px 16px;background:var(--panel);transition:none}` `.gal-cap b{font-size:18px;color:var(--text)}` `.gal-cap span{font-size:12px;letter-spacing:.02em;text-transform:none;color:var(--mute)}`. Delete the hover translateY and the thumb scale (`.gal-thumb img{transform:none;transition:none}`); hover is `border-color:var(--edge-strong)`. `.gal-zoom{background:var(--scrim);box-shadow:none;opacity:1;transform:none}` always visible.
- Lightbox: `::backdrop{background:rgba(8,7,22,.96)}` no blur; `.lb-img{box-shadow:none;border:1px solid var(--edge-soft)}`; `.lb-close,.lb-prev,.lb-next{background:var(--bg-0);border:1px solid var(--edge);box-shadow:var(--shadow)}`; `.lb-close:hover` no rotate; `.lb-desc` 12px mixed case.
- Wide screenshots pan on phones: main.js in `go()` after the image is known to be loaded (the `img.complete && img.naturalWidth` branches around lines 1184 and 1243), `img.classList.toggle('lb-img--wide', img.naturalWidth / img.naturalHeight > 1.6)`; when the class is on and `matchMedia('(hover:none)').matches`, prefix the `.lb-desc` text with `Drag sideways to see the whole screenshot. ` (set from JS; no sibling selector in CSS). CSS: `@media (max-width:760px){.lightbox{touch-action:pan-x pan-y pinch-zoom}.lb-figure{width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}.lb-img--wide{max-width:none;width:220vw;max-height:none}}`.

### 3.11 Reels, stills and automation cards (10, 29, work.html)

- `.reel-track{padding:6px 6px 20px;margin-bottom:0}` (comment: no shadow to clear). `.stills-track{padding:10px 4px 14px;margin-bottom:0}`. `.vframe{box-shadow:none;border:1px solid var(--edge)}` `.vframe:hover{transform:none;border-color:var(--edge-strong)}` `.vframe:focus-within{border-color:var(--text)}`.
- `.vframe-cap{padding:10px 12px 11px;background:var(--scrim);text-shadow:none;font-size:12px;letter-spacing:.02em;text-transform:none}` keep `bottom:3px;z-index:2;pointer-events:none`. `.vframe-bar i{background:var(--text)}`.
- Phone: delete the `mask-image` block and the two focus overrides; keep `padding-right:32px`. Swipe cue: append ` Swipe for more.` to the two `.work-group > p` paragraphs in work.html inside `<span class="swipe-cue">`, with `.swipe-cue{display:none}` and `@media (hover:none){.swipe-cue{display:inline;color:var(--dim)}}`.
- `.auto-shot img{transition:none}`; `.auto-flow{background:var(--bg-2);border-bottom:1px solid var(--edge)}` (dots deleted); `.flow-steps li{font-size:12px;letter-spacing:.02em;text-transform:none}` `.flow-steps li span{background:var(--bg-0);border:1px solid var(--edge)}` `.flow-steps li:first-child span,.flow-steps li:last-child span{border-color:var(--edge-strong);color:var(--text)}`. Phone (<=560px): `.flow-steps{display:grid;grid-template-columns:1fr;gap:6px}` `.flow-steps li + li::before{content:'\2193'}`; `.auto-shot img{display:none}` and give the first three automation cards (work.html lines 221, 232, 243: DM bot, packing list, cold email agent) a `.auto-flow` strip built from their `data-desc` text, shown under 560px only.

### 3.12 Timeline (13, about.html)

`.tl-rail{background:var(--edge-soft)}` `.tl-progress{background:var(--mute)}` (JS `--tl-p` unchanged). `.tl-node{width:12px;height:12px;background:var(--bg);border:2px solid var(--edge);box-shadow:none;transition:background-color .3s,border-color .3s}` `.tl-node.lit{background:var(--text);border-color:var(--text);box-shadow:0 0 0 3px var(--bg),0 0 0 4px var(--mute);transform:none}` (two hard 0-blur rings, no glow). `.tl-org` 12px `--mute`; `.tl-date` 18px Anton `--text`; `.tl-place` 12px; `.tl-bullets li::marker{color:var(--mute)}`. about.html: wrap `.tl-item` 3 to 6 (the four earlier roles) in `<details class="tl-more"><summary>Show earlier roles</summary>...</details>`; `.tl-more summary` 13px mono, 44px row, `--text`; `@media (min-width:761px){.tl-more{display:contents}.tl-more summary{display:none}}`; `.tl-more[open] summary{display:none}`. Every item keeps `tl-node` so `initTimeline` still lights them.

### 3.13 Register rows and skills (29, 16)

`.register{border-top:1px solid var(--edge-soft)}` `.reg{border-bottom:1px solid var(--edge-soft)}` `.reg-when{font-size:12px;letter-spacing:.06em;color:var(--mute)}` `.reg-stack li{font-size:11px;letter-spacing:.06em;background:transparent;border:1px solid var(--edge);border-radius:8px}`. `.tool{background:var(--panel);border-color:var(--edge-soft)}`; the `.skill-head::before` colour bars stay (fills, not text).

### 3.14 Spend chart (29, ama-holdings.html) [Broadsheet graft for phones]

- Desktop: `.spend .bar path{fill:var(--data-mute);opacity:1}`; the peak week (Sep 23 to Sep 29, US$3.77M, `class="bar b9"` at ama-holdings.html line 236) gets `.spend .bar.b9 path{fill:var(--accent)}`. Hover and focus `.spend .bar:hover path,.spend .bar:focus path{fill:var(--text)}`; the peak stays coral. Change every `:focus-visible` in the 13 `.spend svg:has(...)` tip rules and `.spend .bar:focus-visible` to `:focus` so a tap opens the tip. `.spend .tip rect{fill:var(--bg-0);stroke:var(--edge)}` `.spend .tip text{font-size:12px}` `.spend .tip .tip-k{font-size:10.5px;fill:var(--mute)}` `.spend .axis text,.spend .lab{font-size:11.5px}`. `.spend-foot` second line: "Tap or hover a column for the week".
- Phone (<=560px): `.spend-scroll{display:none}` and show an HTML bar list placed right after `.spend-scroll`:

```html
<ol class="spend-rows" aria-label="Weekly ad spend, 13 weeks">
  <li><span class="sr-wk">Jul 22</span><i style="--w:47%"></i><b>US$1.79M</b><small>1.69×</small></li>
  <li><span class="sr-wk">Jul 29</span><i style="--w:46%"></i><b>US$1.73M</b><small>1.79×</small></li>
  <li><span class="sr-wk">Aug 5</span><i style="--w:38%"></i><b>US$1.42M</b><small>1.83×</small></li>
  <li><span class="sr-wk">Aug 12</span><i style="--w:51%"></i><b>US$1.92M</b><small>1.75×</small></li>
  <li><span class="sr-wk">Aug 19</span><i style="--w:27%"></i><b>US$1.03M</b><small>1.73×</small></li>
  <li><span class="sr-wk">Aug 26</span><i style="--w:53%"></i><b>US$2.00M</b><small>1.38×</small></li>
  <li><span class="sr-wk">Sep 2</span><i style="--w:46%"></i><b>US$1.72M</b><small>1.40×</small></li>
  <li><span class="sr-wk">Sep 9</span><i style="--w:66%"></i><b>US$2.50M</b><small>1.44×</small></li>
  <li><span class="sr-wk">Sep 16</span><i style="--w:87%"></i><b>US$3.29M</b><small>1.39×</small></li>
  <li class="is-peak"><span class="sr-wk">Sep 23</span><i style="--w:100%"></i><b>US$3.77M</b><small>1.42×</small></li>
  <li><span class="sr-wk">Sep 30</span><i style="--w:88%"></i><b>US$3.30M</b><small>1.48×</small></li>
  <li><span class="sr-wk">Oct 7</span><i style="--w:81%"></i><b>US$3.04M</b><small>1.68×</small></li>
  <li><span class="sr-wk">Oct 14</span><i style="--w:82%"></i><b>US$3.10M</b><small>1.18×</small></li>
</ol>
```

(`--w` = spend / 3.77M; values are the existing `.spend-table` rows.) CSS: `.spend-rows{display:none}`; `@media (max-width:560px){.spend-rows{display:grid;gap:8px;list-style:none;padding:0;margin:0}.spend-rows li{display:grid;grid-template-columns:48px minmax(0,1fr) auto auto;align-items:center;gap:10px;font-size:13px}.spend-rows .sr-wk{font:12px var(--mono);letter-spacing:.04em;color:var(--mute)}.spend-rows i{height:10px;border-radius:3px;background:var(--data-mute);width:var(--w)}.spend-rows .is-peak i{background:var(--accent)}.spend-rows b{font-family:var(--hook);font-weight:400;font-size:15px;letter-spacing:.02em}.spend-rows .is-peak b{color:var(--accent)}.spend-rows small{font:11px var(--mono);color:var(--mute)}}`. The `<details class="spend-table">` stays closed as the full table (do not auto-open it). `.spend-table th` 12px `--mute`; `.spend-table summary` 13px `--text`.

### 3.15 Ops map and the services loop (09, 29, ama-holdings.html, services.html)

- Desktop SVGs stay. `.ops-node rect{fill:var(--panel);stroke-width:1.5}` with the existing per-side stroke colours (data colours, the figcaption explains them). Remove the packet circles (`.packet`) from both pages, the `.packet*` rules and the drop-shadow filter. `.flow{animation:none;stroke-dasharray:6 8}` static dashes, keep `marker-end`. Delete `@keyframes flow`, `@keyframes node-pulse`, every `animation:node-pulse` rule and the inline `style="animation-delay"` attributes on `.ops-node` groups (ama-holdings.html around 326 to 351). `.ops-legend li{background:var(--bg-0);border:1px solid var(--edge-soft)}` `.ops-legend b{font-size:12px;letter-spacing:.06em;color:var(--text)}`.
- Phone: `@media (max-width:760px){.ops-scroll{display:none}}` and `@media (max-width:560px){.loop-scroll{display:none}}`; show an `<ol class="ops-steps">` placed right after each scroller inside the figure, hidden above those widths. AMA rows: "Creators upload" / "QA queue, within a minute" / "Drive and creative sheet, every 15 minutes" / "Media buyers launch on Meta and TikTok" / "Ad feeds read the numbers, every 15 minutes" / "Dashboard, bot, weekly report" / "Next briefs back to the creators". Services rows: "Creative" / "Ads" / "Store" / "Data back to creative". CSS: `.ops-steps{display:none;counter-reset:ops;list-style:none;padding:0;margin:0;border-top:1px solid var(--edge-soft)}` and at the breakpoints `display:grid;gap:0`; `.ops-steps li{display:grid;grid-template-columns:28px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid var(--edge-soft);font-size:15px;color:var(--text)}` `.ops-steps li::before{counter-increment:ops;content:counter(ops,decimal-leading-zero);font-family:var(--mono);font-size:12px;color:var(--mute)}` `.ops-steps small{display:block;font-family:var(--mono);font-size:12px;color:var(--mute)}`. Delete the `figcaption::before` "Swipe the map" cue rules.

### 3.16 CTA band and pager (25)

Add `coral` to every `.cta-band` section (work, ama-holdings, results, services, about). `.cta-band{border-top:0;padding-block:clamp(56px,7vw,88px)}`; the `.coral` scope sets the fill, ink text, underlined `em` and inverted button. Label "Book a call"; a second action is a `.btn--link`. `.pager a{background:transparent;border:1px solid var(--edge-soft)}` hover `border-color:var(--edge-strong);background:var(--panel)`; `transform:none` on `.pager-prev/next:hover`; `.pager small` 12px. The band sits directly above the footer, so each page closes coral then ink.

### 3.17 Dock and to-top (19, pages, shell footer.html) [Broadsheet pair]

- **The `.cta-dock` is deleted.** Remove `<a class="cta-dock" ...>` from index, work, ama-holdings, results, services and about (it sits after `<!-- /shell:footer -->`, so it is a page edit). Delete the `.cta-dock` rules, the `html{scroll-padding-bottom}` phone rule and the `.footer-base{padding-bottom:64px}` phone rule. `initFloatingUi` already guards with `if (dock)`. The phone CTA is the `.nav-cta` pill in a nav that never hides on phones (3.1), so exactly one coral button is on screen while reading.
- `.to-top`: `@media (max-width:760px){.to-top{display:none}}`; desktop `background:var(--bg-0);border:1px solid var(--edge);box-shadow:var(--shadow)`, hidden state `opacity:0;transform:translateY(8px)`, shown `transform:none` (fade, no scale pop).

### 3.18 Jump chips (23)

`.jumpnav{background:var(--bg);border-bottom:1px solid var(--edge-soft);transition:top .4s var(--ease-out)}` no blur. Desktop: `.nav--hidden ~ main .jumpnav{top:calc(var(--jump-h) * -1)}` (chips leave with the nav; replaces `top:0`). `.jumpnav a{font-size:13px;letter-spacing:.06em;background:transparent;border:1px solid var(--edge)}` active `color:var(--bg);background:var(--text);border-color:var(--text);box-shadow:none`. Phone (<=760px): the chips do not stick (the nav already holds the top): `.jumpnav{position:relative;top:auto}` and `body.has-jump [id]{scroll-margin-top:calc(var(--nav-h) + 16px)}`; delete the phone `mask-image` rule; keep `scroll-padding-inline` with the next chip peeking.

### 3.19 Page banner (22)

Delete `<span class="hero-dots">` from all eight pages and the `.hero-dots` rule. `.page-hero{border-bottom:1px solid var(--edge-soft);padding:clamp(36px,6vw,84px) 0 clamp(32px,5vw,56px)}`. `.ph-index{color:var(--mute)}`; `.page-title em{color:var(--accent)}` (the h1 is the page's coral phrase). `.page-hero .hero-ctas{margin-top:24px}`. results.html and services.html get a `.hero-ctas` block copied from ama-holdings.html: primary "Book a call" plus `.btn--link` ("See the dashboards" to `#gallery` on results, "How it works" to `#process` on services).

### 3.20 Eyebrows and section labels (02)

`.eyebrow{font-size:13px;letter-spacing:.08em;color:var(--mute);gap:10px}` `.eyebrow::before{width:18px;height:1px;border-radius:0;background:var(--mute)}`. `.sub-head::after{background:var(--edge-soft)}`. `.mono-line` 13px .08em. Heading emphasis: `h1 .hook em,.page-title em,.hero-name .ac{color:var(--accent)}` and `h2.hook em,.tile-title em{color:var(--mute)}` (section headings are two-tone white and mute). The new `.hero-hook em` is `--text` on every width.

### 3.21 Contact form (18, contact.html)

`.contact-form input,.contact-form textarea{font-size:16px;background:var(--bg-0);border:1px solid var(--edge-strong);border-radius:10px}` focus `border-color:var(--text)`. Labels 12px .08em `--mute`. `.cf-note` 14px body; `.is-error{color:var(--accent-text)}` `.is-ok{color:var(--data-3)}`. `@media (max-width:860px){.contact-form{order:-1}}` so the form opens the page. `.ci-row{background:transparent;border:1px solid var(--edge-soft)}` hover `background:var(--panel)` without translate. contact.html: `enterkeyhint="send"` on the textarea. Honeypot, `data-endpoint`, ids untouched.

### 3.22 Services extras (14, 15)

`.pains li{font-family:var(--body);font-size:15px;letter-spacing:0;text-transform:none;background:transparent;border:0;border-bottom:1px solid var(--edge-soft);border-radius:0;padding:12px 0}` cross in `--mute` (the rule stays for safety even though the list is removed from services.html). `.vs--me{background:var(--accent-tint);border-color:rgba(var(--accent-rgb),.38)}`; `.vs-list--yes li::before` keeps `--data-3`. `.steps-line i{background:var(--mute)}` `.step-node{width:12px;height:12px;background:var(--text);box-shadow:0 0 0 3px var(--bg),0 0 0 4px var(--mute)}`; delete the `:nth-child(odd)` blue variants; counters `--mute`. `.ops-stack img{box-shadow:none;border:1px solid var(--edge-soft)}`; phone `aspect-ratio:4/3;object-fit:cover;object-position:left top`.

### 3.23 Footer (19, shell footer.html)

`.footer{border-top:1px solid var(--edge-soft);padding:48px 0 calc(32px + env(safe-area-inset-bottom))}`. `.footer-h{font-size:12px;letter-spacing:.12em;color:var(--mute)}` `.footer-links a{font-family:var(--body);font-size:15px;letter-spacing:0;text-transform:none;min-height:44px}` `.footer-contact a{font-size:15px}` `.footer-copy,.footer-note,.footer-updated{font-size:12px;letter-spacing:.04em}`. Shell: add `footer-col--jump` to the Jump-to `<nav class="footer-col">`. Phone (<=760px): `.footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.footer-brand{grid-column:1 / -1}.footer-col--jump{display:none}.footer-base{flex-direction:column;align-items:flex-start;gap:8px;padding-bottom:0}`. `.footer-social a:hover,.ci-social a:hover{transform:none;border-color:var(--edge-strong)}`.

---

## 4. The phone-first hero (06, index.html)

### 4.1 Order on a 375px screen

| # | Element | Height | Running total |
|---|---|---|---|
| 1 | Nav bar: brand, coral "Book a call" pill (40px), burger | 58 | 58 |
| 2 | hero padding | 20 | 78 |
| 3 | `.welcome` chip, 12px mono, static green dot | 28 + 10 | 116 |
| 4 | `h1.hero-name` 46px Anton, two lines, surname `.ac` coral | 88 + 10 | 214 |
| 5 | `.hero-role` title line, 15px weight 500, two lines, one colour | 46 + 12 | 272 |
| 6 | `.hero-hook` Anton 24px, two lines: "Ads, store and creators for DTC brands. One person, one feedback loop." | 52 + 12 | 336 |
| 7 | `.lede` one clause, 16px, two lines: "Right now: growth and automation for AMA Holdings (The Loaded Teashop, Goli Nutrition) and three brands in the Philippines." | 48 + 16 | 400 |
| 8 | `.btn--primary` "Book a call", full width | 52 | **452** |
| 9 | `.btn--link` "See the work" | 44 + 20 | 516 |
| 10 | `.hero-proof`: 64px round portrait beside three mono items; "US$44M+" is the screen's coral number | 64 | 580 |
| 11 | `.hero-social` row, then `.hero-meta` 12px | below the fold | |

The primary button's bottom edge lands at about 452px, so on 375x667 (about 600px of viewport under browser chrome) the name, the title line, the hook, the context line and the coral button are all on screen one and the proof row is the first thing a scroll reveals. On 375x812 everything through the proof row is visible. Coral on this screen: the brand mark, the surname, the two "Book a call" buttons (bar pill and hero), and "US$44M+" once scrolled. The hero `em` and the hook are white.

### 4.2 Markup (index.html hero, inside `.hero-copy`)

```html
<p class="welcome snap-in d1"><i class="pulse-dot" aria-hidden="true"></i>Available for new brands</p>
<h1 class="hero-name snap-in d1" data-split>Carl Gabriel <span class="ac">Piramo</span></h1>
<p class="hero-role snap-in d2">Digital Marketing Manager · <span>E-commerce Growth Specialist</span> · AI Specialist</p>
<p class="hero-hook snap-in d2">Ads, store and creators for DTC brands. <em>One person, one feedback loop.</em></p>
<p class="lede snap-in d3">Right now: growth and automation for <a href="ama-holdings.html">AMA Holdings</a> (The Loaded Teashop, Goli Nutrition) and three brands in the Philippines.</p>
<div class="hero-ctas snap-in d4">
  <a class="btn btn--primary" href="contact.html">Book a call</a>
  <a class="btn--link" href="work.html">See the work →</a>
</div>
<ul class="hero-meta snap-in d5"> ...the three existing items, unchanged... </ul>
```

Replace `.hero-visual` with:

```html
<div class="hero-visual hero-proof snap-in d3">
  <div class="hv-photo"><img src="assets/media/portrait-carl.png" alt="Carl Gabriel Piramo" width="400" height="400" fetchpriority="high"></div>
  <ul class="hero-proof-list">
    <li><b>US$44M+</b> ad spend tracked</li>
    <li><b>8.71×</b> peak ROAS</li>
    <li><b>833</b> creators, one database</li>
  </ul>
</div>
```

Deleted from the hero: `.hero-dots`, the `.hero-run` paragraph with the `.rotator` and its `.sr-only` twin, the "Download CV" button (it stays in the footer), `.hv-stage`, `.hv-ring`, `.hv-spin`, `.hv-circle`, `.orbit`, both `.float` divs, every `data-depth`, every `magnet`, the `.scroll-cue` anchor. `.hero-social` stays as is.

### 4.3 Hero CSS

```css
.hero-hook{font-family:var(--hook);font-weight:400;text-transform:uppercase;font-size:clamp(22px,5.6vw,34px);line-height:1.05;letter-spacing:.005em;color:var(--text);max-width:22ch;margin-bottom:12px}
.hero-hook em{font-style:normal;color:var(--text)}
.hero .lede{margin-bottom:16px;max-width:52ch}
.hero-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin-bottom:22px}
.hero-proof{display:flex;align-items:center;gap:16px}
.hero-proof .hv-photo{position:relative;inset:auto;flex:none;width:64px;height:64px;border-radius:50%;overflow:hidden;border:1px solid var(--edge-strong);box-shadow:none;background:var(--panel)}
.hero-proof-list{display:flex;flex-wrap:wrap;gap:6px 14px;list-style:none;padding:0;margin:0;font-family:var(--mono);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--mute)}
.hero-proof-list b{font-family:var(--body);font-weight:700;font-size:15px;letter-spacing:0;color:var(--text)}
.hero-proof-list li:first-child b{color:var(--accent)}
.welcome{font-size:12px;letter-spacing:.06em}
.pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--data-3)}
.pulse-dot::after{content:none}
.hs-line{background:var(--edge)}
@media (min-width:861px){
  .hero{min-height:min(780px,calc(100svh - var(--nav-h)))}
  .hero-grid{grid-template-columns:minmax(0,1fr) 320px 44px;gap:clamp(24px,3vw,44px)}
  .hero-proof{flex-direction:column;align-items:flex-start;gap:18px}
  .hero-proof .hv-photo{width:320px;height:320px;outline:1px solid var(--edge-strong);outline-offset:10px}
  .hero-proof-list{display:grid;gap:8px}
}
@media (max-width:860px){
  .hero{min-height:0;padding:20px 0 40px}
  .hero-grid{grid-template-columns:minmax(0,1fr);gap:22px}
  .hero-visual{order:0;max-width:none}      /* copy first: the old order:-1 is deleted */
  .hero-ctas{flex-direction:column;align-items:stretch;gap:6px}
  .hero-ctas .btn--link{justify-content:center}
  .hero-name{font-size:clamp(44px,12vw,72px)}
}
```

Delete `.hv-stage`, `.hv-ring`, `.hv-spin`, `.hv-circle`, `.orbit*`, `.float*`, `.scroll-cue`, `.mouse*`, `.rotator`, `.rot-item*`, `.hero-run` rules. Desktop: left column copy, middle a plain 320px circle portrait with one flat outline ring and the proof list under it, right the social rail with a solid hairline. Nothing rotates, nothing follows the pointer.

---

## 5. Motion rules

One kind of motion: things arrive. Nothing loops, nothing follows the pointer, nothing lifts on hover.

**Stays (hooks unchanged):** `body.loaded .snap-in` d1..d5 with `transform:translateY(12px)` (was 18px + scale), .6s/.7s; `.reveal` with `translateY(16px)` (was 26px), the `--left/--right/--scale/--pop` variants become the same translateY (class names kept); `data-split` word rise on h1; `data-count` counters; `.seg-ind` slide .3s and the JS tab fade; one-time draw-ons (`.spend .bar path`, `.tape rect` scaleY, `.steps-line i`, `.tl-progress`, `.tl-node.lit` colour change); desktop nav hide and show with the raised thresholds; mobile menu panel fade and burger morph; `.to-top` fade; press `scale:.97` (27); cross-document view transitions (26); `.vframe-bar i` progress; lightbox fade.

**Goes (delete rule and keyframe):** `drift-a`, `drift-b`, `.glow`, `.grain`; `spin`, `orbit`, `orbit-counter`, `bob`, `pulse`, `cue`, `ticker`, `flow`, `node-pulse`; the rotator; pointer parallax; card spotlight (`--mx/--my`), `tilt`, `magnet`; every hover lift or scale (`.card--lift`, `.vframe`, `.gal-thumb img`, `.tile-shot img`, `.auto-shot img`, `.still img`, `.tile-go` nudge, `.proof-to-gal span` nudge, `.pager-prev/next` translateX, `a.ci-row` translateX, social icons translateY, `.hero-social a`, `.to-top` scale pop, `.gal-zoom` scale-in, `.lb-close` rotate); `.packet` dots; nav menu item stagger; the `.cta-dock` slide (element removed).

Hover rule: colour, border colour or underline only; durations .2s for colour and border, .3s for the seg indicator, .4s for the nav slide; easing `--ease` / `--ease-out`.

Section 21 keeps the blanket `animation:none;transition:none` and the `.snap-in,.reveal,.is-split .wi{opacity:1;transform:none}` safety; delete the lines that reference removed effects (`.glow{opacity:.1}`, `.ticker-pause{display:none}`, `.rot-item`, `.card.tilt,.magnet,.float,.hv-stage`, `.packet`, `.flow`, `.gal-zoom`, `.tile--dash:hover .tile-shot img`, `.gal-item:hover .gal-thumb img`, `.still:hover img`).

Phones get the same stillness by default: no fixed blurred layers, no infinite animations, the bento reel starts on tap under `(hover:none)`.

---

## 6. The twelve highest-impact client-facing changes, in order

1. **Copy-first phone hero with the button at 452px.** Name, the title line, one Anton value line, one context clause, one full-width coral "Book a call"; portrait shrinks to a 64px proof strip below the button.
2. **One label, always reachable.** "Book a call" in the top bar on every page; the nav never hides on phones; the same label on the hero, the contact tile, the CTA band. The glowing dock goes away.
3. **The program numbers lead, in a hairline cell grid.** Home order: US$44M tracked and US$13.9M in 30 days (both `stat--hl`), then 239 of 2,013, 833 creators, 8.71x, 1B+ views. US$60M+ moves to the Meta Ads panel on results.html.
4. **Numbers before brands.** `#results` follows the hero; the brand row is static Anton on one or two lines, no marquee.
5. **A coral close on every page.** Solid coral CTA band with an ink button (home: the coral contact tile), then the ink footer.
6. **Results page leads with the big four** (US$44M, US$13.9M, 239 of 2,013, 833) in the cell grid; the old four move into their channel panels; Creator ads is the first and default tab; the hero gets buttons.
7. **Data a phone can read.** Two-column stats with 36 and 52px numbers, the spend chart as 13 bar rows, the ops map and the loop as numbered lists, a tablist that scrolls.
8. **A 12px floor for every label that carries meaning,** mixed case for sublabels, less tracking.
9. **Dashboards you can inspect:** captions under the thumbnails, wide screenshots pan inside the lightbox, pinch still works.
10. **Contact form first on phones, 16px inputs, no iOS zoom.**
11. **Flat ink instead of glass:** solid panels, hairlines, one coral button per screen, one coral number per screen, two-tone headings. The thing a founder notices first, and the thing that paints fastest on a mid-range Android.
12. **AMA case study opens faster:** one 45-word lede, buttons one screen up, the provenance line under the stats where a sceptic looks for it.

Suggested AMA lede (45 words): "AMA Holdings is the US owner of The Loaded Teashop and Goli Nutrition. The Loaded Teashop sells through a creator ad program: hundreds of creators uploading to briefs, media buyers scaling the winners on Meta and TikTok. Since October 2026 I run its growth and automation."

Provenance line under the AMA stats (`.mono-line`): "Every figure is from the program's own systems (creator platform, Meta, Triple Whale, Northbeam) as of 2 November 2026. Team and client scale: media buyers spend, creators film, I build the loop between them."

Results `.lede-more` cut to: "Team and client scale, not mine alone. Sources: Ads Manager, Shopify, the creator platform, Triple Whale and Northbeam."

Home sublabels, one clause each: "The Loaded Teashop · Apr to Nov 2026", "1.47× blended ROAS", "Of 2,013 judged", "Handles, whitelist, tiers", "4.9× blended", "Creator campaigns".

---

## 7. HTML edits, by file

**`_tools/shell/head.html`**: bump `styles.css?v=16` to `?v=17`.

**`_tools/shell/nav.html`**: delete the `<!-- Ambient background glows -->` comment and the whole `<div class="ambient" aria-hidden="true">...</div>`; move the `.nav-cta` anchor out of `#navMenu` to directly after `.brand` (before `.nav-toggle`); label stays "Book a call".

**`_tools/shell/footer.html`**: add class `footer-col--jump` to `<nav class="footer-col" aria-label="Jump to">`. The `.to-top` button stays (CSS hides it on phones).

Then `python _tools/sync-shell.py` and `python _tools/sync-shell.py --check`.

**All eight pages**: delete `<span class="hero-dots" aria-hidden="true"></span>`; remove `magnet` from buttons, `tilt` from cards, `data-depth` attributes; every "Book a strategy call" becomes "Book a call".

**index.html**: hero per 4.2; stats reorder with the US$13.9M cell copied from ama-holdings.html (lines 151 to 155, `data-count="13.9"`, `stat--hl`), `stat--hl` on US$44M, US$60M+ card removed, sublabels shortened; `<section class="stats" id="results">` moved above `<section class="ticker">`; ticker second list and pause button deleted; `tile--contact` gains `coral` and its button reads "Book a call"; `<a class="cta-dock">` deleted.

**ama-holdings.html**: lede trimmed to the 45 words; provenance sentence moved to a `.mono-line` under the stats grid beside `.spend-foot`; `.spend-rows` list after `.spend-scroll`; `.spend-foot` second line "Tap or hover a column for the week"; `.ops-steps` after `.ops-scroll`; packet circles and `animation-delay` attributes removed; `cta-band` gains `coral`; `cta-dock` deleted.

**results.html**: `.hero-ctas` added to the banner; `.result-grid` rebuilt with US$44M, US$13.9M, 239 of 2,013 and 833 (`.result` / `.res-num` markup, `tilt` removed); the 3.2x lift, 8.71x, tracking fix and 100M views move into their channel panels; US$60M+ added to `#ppanel-meta` with its honest sublabel; Creator ads tab and panel moved first with `is-active`, `aria-selected="true"`, `tabindex="0"` and the other panels `hidden` (`initProofTabs` reads the markup); `.lede-more` cut; `cta-band` gains `coral`; `cta-dock` deleted.

**services.html**: `.hero-ctas` added; the two `.edge-copy` paragraphs and the `.pains` list deleted from `#edge` (keep the section head and `.versus`); AI card cut to two sentences and four tags; loop packets removed; `.ops-steps` after `.loop-scroll`; `cta-band` gains `coral`; `cta-dock` deleted.

**about.html**: `<details class="tl-more">` around `.tl-item` 3 to 6; `.about-photo` phone rule (`max-width:96px;aspect-ratio:1;float:left;margin:0 14px 8px 0` under 860px, chip hidden); `cta-band` gains `coral`; `cta-dock` deleted.

**work.html**: `.swipe-cue` spans appended to the two `.work-group > p` paragraphs; `.auto-flow` strips added to the first three automation cards from their `data-desc`; lede capped at two sentences; `cta-band` gains `coral`; `cta-dock` deleted.

**contact.html**: `enterkeyhint="send"` on the textarea. Nothing else.

**404.html**: receives the shell changes via sync; `hero-dots` deleted; nothing else.

---

## 8. main.js edits (five, all additive, no hook renamed)

1. `initNav` (line 396): guard the hide/show branch with `if (!matchMedia('(max-width:860px)').matches)`; thresholds `dy > 8 && y > 200` to hide, `dy < -8 || y <= 200` to show.
2. `segUpdate` (around line 655): after the transform is written, `if (!instant && btn.scrollIntoView) btn.scrollIntoView({block:'nearest',inline:'nearest'})`.
3. `initVideos` (line 596): do not observe `.bento-video video` with the autoplay IntersectionObserver when `matchMedia('(hover:none)').matches`; the `.vframe-toggle` still plays on tap.
4. `initLightbox` (line 1012), inside `go()` once `img.naturalWidth` is known: `img.classList.toggle('lb-img--wide', img.naturalWidth / img.naturalHeight > 1.6)`; when true and `matchMedia('(hover:none)').matches`, set `desc.textContent = 'Drag sideways to see the whole screenshot. ' + desc.textContent` (guard against double prefixing).
5. `initFloatingUi` (line 1519): nothing required; the `if (dock)` guard already handles the removed dock. Optional cleanup: drop the `hiders` lookup.

`initRotator`, `initParallax`, `initTicker`, `initCards` (magnet, tilt, spotlight) return early or no-op on the new markup; leave them.

---

## 9. Ordered implementation checklist, by styles.css section

Work top to bottom; each step leaves the site working.

**Step 0: tokens and hygiene (00, 01, head shell)**
- [ ] 00: replace the colour tokens per section 1; add `--fg-rgb`, `--bg-rgb`, `--bg-0`, `--panel-2`, `--edge-strong`, `--accent-tint`, `--ink`, `--data-*`, `--shadow`, `--scrim`, `--t-xs`, `--t-sm`; `--r:12px`, `--r-lg:20px`.
- [ ] 00: append the `.coral` scope rules.
- [ ] Whole file: search and replace `rgba(244,242,252,` to `rgba(var(--fg-rgb),` (27) and `rgba(18,17,42,` / `rgba(30,28,58,` to `rgba(var(--bg-rgb),` (30).
- [ ] 01: `.section--alt{background:var(--bg-2);border-block:1px solid var(--edge-soft)}`; `@media (max-width:520px){body{font-size:16px}}`.
- [ ] head.html: `styles.css?v=17`; sync.

**Step 1: remove the ambient layer and the dot fields (04, 06, 29, 20, 21, shell nav)**
- [ ] nav.html: delete the `.ambient` block; sync; confirm `grep -c 'class="ambient"' *.html` is 0 everywhere.
- [ ] 04: delete `.ambient`, `.glow`, `.glow--a`, `.glow--b` (the section becomes a one-line comment or is removed).
- [ ] 29: delete `.grain`; reword the section comment.
- [ ] 20: delete `drift-a`, `drift-b`.
- [ ] 21: delete `.glow{opacity:.1}`.
- [ ] 06: delete `.hero-dots`; pages: delete the span.
- [ ] 29: `.auto-flow` loses its dot pattern, gains `border-bottom:1px solid var(--edge)`.

**Step 2: flatten every gradient, glow, blur and mask (grep-driven)**
- [ ] 02 `.eyebrow`, `.eyebrow::before`, `.hook em` split into h1 (coral) and h2 (mute).
- [ ] 03 `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--sm`, new `.btn--link`; `.chip*`; `.ic-tile*`; `.card` (fill, shadow, blur, delete `::before` pair, `isolation`, `--mx/--my`); `.card--lift:hover`; `.card.tilt:hover`; `.seg`, `.seg-ind`, `.seg-btn`; delete `.magnet`.
- [ ] 05 `.nav` (solid, no blur), `.nav--scrolled`, `.brand b` (keep coral), `.nav-links a::after`, `.nav-cta[aria-current]`, `.pagebar i`, phone `.nav-menu` shadow, `.nav-links li` stagger, phone `.nav-cta`, `--nav-h:58px`, nav-inner order rules.
- [ ] 06 delete `.hv-stage`, `.hv-ring`, `.hv-spin`, `.hv-circle`, `.orbit*`, `.float*`, `.scroll-cue`, `.mouse*`, `.pulse-dot::after`, `.rotator`, `.rot-item*`, `.hero-run`, the phone `order:-1`; add the 4.3 rules; `.hs-line` solid at both breakpoints.
- [ ] 07 static brand row; delete the mask.
- [ ] 08 cell grid per 3.6; delete the old 520px one-column rule.
- [ ] 09 delete `.packet` rules and the drop-shadow filter; `.flow` static; `.ops-node rect`; `.ops-legend`.
- [ ] 10 `.vframe` shadow and hover, `.vframe-cap` scrim, `.vframe-bar i`, phone masks and focus overrides, `.reel-track` and `.stills-track` padding, `.swipe-cue`, `.auto-shot img`, `.flow-steps` colours and phone stack.
- [ ] 11 `.result-grid` and `.proof-grid` cell grid; `.proof-tablist` phone scroller; `.proof-to-gal` no nudge.
- [ ] 12 `.gal-item`, `.gal-cap` static, `.gal-thumb img`, `.gal-chip`, `.gal-zoom`, `.gal-filters` phone scroller, `.lightbox::backdrop`, `.lb-img`, controls, `.lb-desc`, phone pan rules.
- [ ] 13 `.tl-rail`, `.tl-progress`, `.tl-node`, `.tl-node.lit`, `.tl-org`, `.tl-date`, `.tl-place`, `.tl-more`.
- [ ] 14 `.pains li`, `.vs--me`, `.ops-stack img`.
- [ ] 15 `.steps-line i`, `.step-node` and the odd variant.
- [ ] 16 `.tool`, `.about-photo` phone rule.
- [ ] 18 inputs, labels, `.cf-note`, `.ci-row`, phone `order:-1`.
- [ ] 19 delete `.cta-dock*`, the `scroll-padding-bottom` and `.footer-base{padding-bottom:64px}` phone rules, the `.card,.float-pill{backdrop-filter:none}` override; `.to-top` flat and hidden on phones; footer sizes and phone columns; `.footer-col--jump`.
- [ ] 22 `.page-hero`, `.ph-index`, `.page-title em`, `.page-hero .hero-ctas`.
- [ ] 23 `.jumpnav` solid, `top` transition and negative offset, active chip inverted, phone not sticky, mask deleted.
- [ ] 24 `.bento` gap, `.bento-video::after`, `.tile-shot::after`, `.tile-shot img`, `.tile--work/case/dash .tile-body` scrim bars, `.tile--contact` via `.coral`, `.tile-go`, delete `.tile--dash:hover .tile-shot img` and `.tile--contact:hover .btn`; phone two-up grid; comments rewritten.
- [ ] 25 `.cta-band` via `.coral`; `.pager`.
- [ ] 27 keep press feedback; make sure the touch reset list has no removed selectors.
- [ ] 28 `.qa-*` sizes per the type table.
- [ ] 29 `.tape::after`, `.tape rect` fills, `.spend .bar path` fills and the peak, `.spend .tip`, `:focus-visible` to `:focus` in the 13 tip rules, `.spend-rows`, `.spend-table` sizes, `.ops-steps`, `.register`, `.reg-when`, `.reg-stack li`, delete the `.stats-grid--6` breakpoints and the "Swipe the map" cue.
- [ ] 20 delete keyframes `spin`, `orbit`, `orbit-counter`, `bob`, `pulse`, `cue`, `ticker`, `flow`, `node-pulse`; keep `lb-fade-in`, `vt-in`, `vt-out`; delete the `(hover:hover)` lift rule; soften `.snap-in` and `.reveal` transforms.
- [ ] 21 prune references to removed effects.
- [ ] Verify: `grep -c "gradient" styles.css` prints 0; `grep -n "backdrop-filter\|mask-image\|blur(\|drop-shadow(\|mix-blend\|text-shadow" styles.css` prints nothing.

**Step 3: shell edits, then sync** (nav-cta move, footer class, head version). `python _tools/sync-shell.py --check` exits 0.

**Step 4: hero rewrite** (index.html per 4.2, 06 per 4.3).

**Step 5: type floor pass** (02, 03, 05, 10, 11, 12, 13, 14, 18, 19, 22, 23, 24, 25, 28, 29) per section 2.

**Step 6: page content edits** per section 7 (index stats and ticker, results big four and tab order, services trims and hero buttons, AMA lede, provenance, `.spend-rows`, `.ops-steps`, about `.tl-more`, work cues and strips, contact `enterkeyhint`, dock removal, `coral` classes, "Book a call" everywhere).

**Step 7: main.js** per section 8.

**Step 8: checks before handing over**
- [ ] `grep -c "gradient" styles.css` is 0; no `backdrop-filter`, `mask-image`, `blur(`, `drop-shadow(`, `mix-blend-mode`, `text-shadow` in styles.css.
- [ ] `grep -n "glow\|grain\|hero-dots\|hv-spin\|orbit\|rotator\|scroll-cue\|ticker-pause\|data-depth\|magnet\|class=\"tilt\|packet\|cta-dock" *.html` prints nothing.
- [ ] `python _tools/sync-shell.py --check` exits 0.
- [ ] 375x667 and 390x844 in device emulation (hover:none): home shows name, title line, hook and the primary button without scrolling; the nav pill stays visible while scrolling; no horizontal page scroll (`document.documentElement.scrollWidth === innerWidth` on every page, including results.html's tablist and gallery filters); all four Results tabs reachable and the seg indicator follows; Creator ads opens by default; a wide screenshot pans in the lightbox; the spend rows render under 560px and the SVG above; the form opens contact.html; inputs do not zoom on iOS (16px).
- [ ] Desktop 1280px: nav hides on scroll down and the jumpnav leaves with it; counters, split headings, seg indicator, timeline progress and tab fades still run.
- [ ] Smallest meaningful text on every page is 12px (`.stat-label i`, `.tile-meta`, `.footer-copy`); chips 11px.
- [ ] Contrast spot checks: white on `#D43748` 4.6:1, `#12112A` on `#FF4D5E` 5.7:1, `#9E99C6` on `#1E1C3A` 6.5:1, `#FF6674` on `#1E1C3A` 5.0:1.
- [ ] Reduced motion: hero and sections render in place, counters snap to the final value, nothing hidden.
- [ ] Copy scan on every edited string: no em or en dash, none of the banned words, the Philippine employer unnamed, the title line byte-identical in `.hero-role` and `.footer-tag`.
