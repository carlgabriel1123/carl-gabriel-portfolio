# Chill pass: fewer numbers, calmer surfaces (final spec)

Repo: D:\carl-gabriel-portfolio (static site, no build). Date: 3 November 2026.
Brief from Carl, verbatim: "too many numbers! its so overwhelming! i want it to be chill and like chill aesthetics". Yesterday: "make it chill in mind i dont like gradient".

This document is the single source of truth for this pass. It starts from the winning direction (One Number: each page earns exactly one big figure, everything else is calm sentences in mixed case), grafts what both judges asked for from Editorial Quiet (the `--prose` token and a 60ch measure, sections separated by space instead of bands, underline tabs, a text pull quote on About, inline "Built with" lines rendered by CSS, the one-paragraph loop legend, no stagger on pills) and from Soft Studio (the Home tile and case-study h1 kept byte-identical, `.gal-count` hidden not deleted, the hero min-height fix, the one-column phone rule for the grids, edits written with `newline=''`), and honours every veto (no coral slab deleted half way, no 44.2M headline over a 30.6M chart without the caveat in view, no "billions", no unscoped second blended ROAS, no coy "ask me" lines, Anton stays on the display roles Carl approved yesterday, no palette shift, `--section` capped at `clamp(72px,10vw,128px)`).

**It supersedes three rules of docs/design/2026-11-02-flat-calm-redesign.md and nothing else in it:** rule 1's "one coral number per screen" (now zero coral numbers), rule 2's "one solid coral surface per page" (the `.coral` scope becomes a `--panel` card holding the coral button) and the hairline cell grid of its section 08 and 11 (cells become plain cards with 24px gaps, and most grids are gone). Where the two documents disagree, this one wins.

Repo facts checked while writing: styles.css has 1889 lines and 0 gradient, blur, mask, backdrop-filter or text-shadow declarations; `.coral` is set on five `.cta-band` sections and on index.html's `.tile--contact`; `.ph-index` is used only in page markup (styles.css 1420, nothing in main.js); main.js guards `.gal-count` (`if (c) c.textContent = ...`) and `.gal-status` (`if (status)`), selects counters with `.val[data-count]`, and `segUpdate` sets `--ind-x` / `--ind-w` on `.seg-ind`; `.hero-visual` also carries `.hero-proof`; `.tl-more` opens on desktop from main.js; ama-holdings.html is LF, every other page CRLF; the audit baseline (`_tools/baseline-index.html`) is the old one-page site, so most AMA copy is not in it, but 60 or so short strings this pass removes are (listed in section 6); the FAQ JSON-LD on ama-holdings.html is fed by the two `#winners` answers, which this pass rewrites.

---

## 1. Governing rules

1. **One big figure per page, Anton, alone.** Home: US$44M+. Case study: US$44.2M over the chart (with the h1's US$44M as the echo that arrives early). Results: two 44 to 56px figures per channel panel, one panel visible at a time. Work, Services, About, Contact, 404: no display-size figure.
2. **First screen (375x812 and 1440x900, nav included): zero figures,** except the case-study h1 and the 404 code. No `.ph-index`, no proof row, no stats grid, no year in a lede above the fold.
3. **A figure lives on one page.** US$44M on Home and the case study only. 833 only on the Results creator panel. 239 of 2,013 and the winner rule ($100, 1.4×, $26) only in the case study's `#winners` answer. US$13.9M, 2,394, 1B+, 11 systems, 429, 11,895, ₱580K+, 216, 6.99×, ₱227 leave the site. 8.71× and 4.9× only on the Results Meta panel, 4.9× scoped to "the Meta accounts I buy for in the Philippines". US$60M+ only in the Results Meta paragraph (never in FAQ text). US$13M+ a month only in the About timeline.
4. **Labels never carry a digit.** `.stat-label i`, `.res-d`, `.tile-meta`, `.gal-cap span`, `.reg-when`, `.brand-market`, `.tl-place`, chips, cadence tags: words only. Most `<i>` sublabels are deleted outright.
5. **Prose: one figure per sentence at most** (the winner rule is the one exception, stated once). Counts under one hundred are words (fifty, twenty, four times an hour, three times a day). Digits only for money, ROAS multiples, percentages and the one big number. Body copy uses month names without the year; years appear only in About's dates, the degree card, the chart and the footer.
6. **"Every 15 minutes" at most once per page**, in body copy (Work's ad-feeds card keeps it; the case study says "four times an hour" and "within the quarter hour").
7. **Counters:** `data-count` stays only on Home's US$44M+ and the case study's US$44.2M. Every other `.val` keeps its class and loses the attribute (main.js selects `.val[data-count]`, so the rest render as static text).
8. **Coral touch points per screen: the brand mark, the surname or h1 `em`, one primary button, the chart's peak bar.** Nothing else. No coral numbers, no coral tint, no coral slab: `.coral` is restyled as a `--panel` card (the class stays in the markup, no page edit). The nav pill is a ghost button at every width and scroll position.
9. **Flat only.** No gradient, blur, backdrop-filter, mask, glow, text-shadow or mix-blend-mode. `grep -c gradient styles.css` prints 0 after the pass, as before.
10. **Type: Anton for `.hero-name`, `.page-title`, `h2.hook`, `.cta-band .hook`, `.hero-hook` and the figures; Schibsted Grotesk 600 mixed case for every card-level title; Schibsted 14px mixed case, letter-spacing 0, `--mute` for every label; Martian Mono only for the brand mark, the chart axis, tips and table, the lightbox counter and the `.flow-steps` strips.** `text-transform:uppercase` survives on the five Anton roles and the brand mark only. Letter-spacing is 0 everywhere.
11. **Copy rules unchanged:** no em or en dashes in visible copy; none of the validator's banned words; never the Philippine employer's name; never the teammates' names or the internal tool names; the client is "AMA Holdings", owner of "The Loaded Teashop" and "Goli Nutrition"; the title line `Digital Marketing Manager · E-commerce Growth Specialist · AI Specialist` stays byte-identical in `.hero-role` and every `.footer-tag`; the footer's "Last updated 2 November 2026" and the Contact and Results FAQ text are untouched.
12. **Hooks stay.** Every class, id and data attribute main.js reads keeps its name (`.reveal`, `.snap-in` + `d1`..`d5`, `data-split`, `.val` + `data-count`, `data-stagger`, `.seg` / `.seg-ind` / `.seg-btn`, `.proof-tab*`, `.work-tab*`, `.gal-*`, `data-lb-group`, `.lightbox` + `.lb-*`, `.tl-*`, `.nav-*`, `#navMenu`, `.to-top`, `.vframe*`, `.spend` + `.bar.bN` + `.tip.tN`, `.tape`, `.steps` / `.step`, `.faq-*`, `.contact-form` + `data-endpoint` + honeypot, `.jumpnav*`, tile-link ids, `data-vt`). Removing elements is fine; renaming is not.
13. **Byte-identical pair:** index.html's case tile title span and ama-holdings.html's h1 both read `The growth desk behind <em>US$44M of creator ads.</em>` and both carry `data-vt="vt-ama-holdings"`. Any copy pass that touches one touches the other.
14. **Shell discipline:** edit `_tools/shell/{head,nav,footer}.html`, run `python _tools/sync-shell.py`, and `--check` must exit 0. Never edit a `<!-- shell:x -->` block inside a page. Bump `styles.css?v=18` to `?v=19`.
15. **Line endings:** write every page with `open(path, 'w', encoding='utf-8', newline='')` after reading with `newline=''`, so ama-holdings.html stays LF and the rest CRLF. Diff byte counts before running the checks. No git, no deploy, no node_modules.

---

## 2. Numbers budget

A figure is any visible token containing a digit. Exempt: product names (GPT-4o, n8n, Next.js), the brand mark, the "404" code on the error page. Alt text, aria-labels, `data-title` / `data-desc`, closed `<details>`, `opacity:0` chart tips and `[hidden]` tab panels are invisible and are listed separately. The shell footer carries 4 on every page (phone, © 2026, "2 November 2026") and is outside the body count.

| Page | Phone first screen, max | Body figures, max (desktop / phone) | With footer | Figures that stay (exact list) |
|---|---|---|---|---|
| index.html | 0 | 2 / 2 | 6 | `US$44M+` (#results one-number block); `US$44M` (case tile title, the data-vt twin). Was 37. |
| work.html | 0 | 2 / 2 | 6 | `50% off` (stills intro); `Every 15 minutes` (ad-feeds card). GPT-4o x2 exempt. Lightbox `1 / 10` inside the dialog only. Was 15. |
| ama-holdings.html | 1 (the h1) | 16 / 15 | 20 / 19 | `US$44M` (h1); `US$44.2M` (chart head); chart axis `$1M $2M $3M $4M` and ticks `Jul 22 Aug 19 Sep 16 Oct 14` and the peak label `US$3.77M` (desktop, 9) or the four phone rows `Jul 22 US$1.79M`, `Aug 19 US$1.03M`, `Sep 23 US$3.77M`, `Oct 14 US$3.10M` (phone, 8); Winners answer `$100`, `1.4×`, `$26`, `2,013`, `239`. Hidden: 13 tips (26 figures, hover only), the closed table (13 rows + the `US$30.60M` caption). Was 140 desktop / 116 phone. |
| results.html | 0 | 7 / 7 (+10 in hidden panels) | 11 | Creator panel `US$44.2M`, `833`; ROAS answer `1`, `50%`, `2×`, `25%`, `4×`. Hidden panels: e-commerce `$3.8M`, `₱4.99M`, `$1.24M`, `₱1.66M`; Meta `8.71×`, `3.2×`, `4.9×`, `US$60M+`; social `52M+`, `32.9M`. Gallery captions: none. Was 82. |
| services.html | 0 | 4 / 4 | 8 | The process counters `1` to `4` (body face). Was 12. |
| about.html | 0 | 9 / 8 | 13 / 12 | `US$13M+ a month` (AMA bullet); `Oct 2026 to present`, `Jun 2026 to present`, `2023 to present` (folded on phones); `Earlier · Aug 2024`; `Earlier · 2021 to 2024`; `2021 to 2025` (degree). Was 32. |
| contact.html | 1 desktop / 0 phone | 1 / 1 | 5 | `+63 926 173 0117` in the `.ci-row`. Was 7. |
| 404.html | 1 | 1 / 1 | 5 | `404` in the eyebrow (it is the message). Was 5. |

One line: Home 2 · Work 2 · AMA 16 desktop 15 phone · Results 7 (+10 hidden) · Services 4 · About 9 · Contact 1 · 404 1; first screens 0 everywhere except the AMA h1 and the 404 code; footer +4 per page.

---

## 3. Token changes: styles.css section 00 as a diff

Only the lines below change; everything else in `:root` (`--hook`, `--body`, `--mono`, `--pad`, `--ease*`, `--nav-h`, `--jump-h`, `--wrap`, `--fg-rgb`, `--bg-rgb`, `--accent*`, `--ink`, `--data-1/2/3`, `--blue*`, `--win*`, `--shadow`, `--scrim`, `--t-xs`, `--t-sm`) stays as it is.

```diff
 :root{
   --bg-0:#0C0B1E;
   --bg:#12112A;
-  --bg-2:#1A1838;        /* .section--alt, image wells, .auto-flow */
+  --bg-2:#1A1838;        /* image wells, .auto-flow, .tool pills (no section bands any more) */
   --panel:#1E1C3A;
   --panel-2:#252247;

-  --edge:#332F58;
-  --edge-soft:rgba(var(--fg-rgb),.10);
-  --edge-strong:rgba(var(--fg-rgb),.38);
+  --edge:#2C2950;                        /* inputs, chips, media frames: one step quieter */
+  --edge-soft:rgba(var(--fg-rgb),.08);   /* card borders, the few hairlines left */
+  --edge-strong:rgba(var(--fg-rgb),.30); /* ghost button, portrait ring, form field boundary */

   --text:#F4F2FC;
-  --mute:#9E99C6;
+  --prose:#D9D6EA;       /* NEW: running copy (12.3:1 on --bg, 11.1:1 on --panel) */
+  --mute:#A39EC9;        /* labels, ledes' affixes, separators: 6.4:1 on --panel, 7.2:1 on --bg */
   --dim:#6F6A94;

-  --accent-text:#FF6674;   /* small coral text on --panel, 5:1: .stat--hl sublabel only, .is-error */
-  --accent-tint:rgba(var(--accent-rgb),.10); /* .stat--hl cells, .vs--me */
+  --accent-text:#FF6674;   /* .cf-note.is-error only; no label is coral any more */
+  --accent-tint:rgba(var(--accent-rgb),.10); /* kept for compatibility; no rule reads it after this pass */

-  --data-mute:rgba(var(--fg-rgb),.38);
+  --data-mute:rgba(var(--fg-rgb),.22); /* chart bars, tape bars, diagram strokes */

-  --r:12px;--r-lg:20px;
+  --r:12px;--r-lg:16px;
+  --measure:60ch;        /* NEW: every paragraph, list item, lede and answer */
+  /* spacing scale, 8-based: 8 16 24 32 48 64 96 128 (used literally below; no --s tokens) */

-  --section:clamp(72px,11vw,140px);
+  --section:clamp(72px,10vw,128px);     /* every page; the inner-page override in 01 is deleted */
 }
```

**The `.coral` scope** (same place, end of 00) is replaced wholesale. Delete every line from `.coral,.coral.card{` to `.coral :focus-visible{outline-color:var(--ink)}` and write:

```css
/* the end-of-page card: .coral stays in the markup (five .cta-band sections and Home's .tile--contact)
   but is now a --panel card with a 1px hairline. The coral button inside it is the page's one coral button. */
.coral,.coral.card{background:var(--panel);color:var(--text);border:1px solid var(--edge-soft);border-radius:var(--r-lg)}
```

(The inversion rules for `.coral .btn--primary`, `.coral .eyebrow`, `.coral .hook em` underline, `.coral .mono-line`, `.coral ::selection` and `.coral :focus-visible` all go; the token overrides `--text:#12112A` etc. go with them.)

**Type scale per role** (Anton 400, uppercase, letter-spacing 0, line-height as given; Schibsted Grotesk otherwise; phone 375 / desktop 1440):

| Role | Selector | Face, weight | Size | Line-height | Case |
|---|---|---|---|---|---|
| Home name | `.hero-name` | Anton | `clamp(40px,8vw,72px)` | .96 | upper |
| Page title | `.page-title` | Anton | `clamp(32px,6.5vw,56px)`, max-width 20ch | 1.0 | upper |
| Hero value line | `.hero-hook` | Anton | `clamp(20px,4.6vw,28px)`, max-width 22ch | 1.1 | upper |
| Section h2 | `h2.hook` | Anton | `clamp(28px,4vw,44px)` | 1.04 | upper |
| CTA card hook | `.cta-band .hook` | Anton | `clamp(26px,3.4vw,38px)` | 1.04 | upper |
| The one number | `.stat--one .stat-num`, `.stat-num--one` | Anton | `clamp(60px,10vw,104px)`, `.pre`/`.suf` Schibsted 700 at .34em `--mute` | .9 | tabular-nums |
| Results panel figures | `.proof-grid .stat-num` | Anton | `clamp(40px,4vw,56px)` | .95 | tabular-nums |
| Question heads | `.qa-q` | Schibsted 600 | `clamp(22px,2.4vw,28px)` | 1.2 | mixed |
| Card titles | `.card-title`, `.tile-title`, `.reg-name`, `.brand-card h3`, `.skill-group h3`, `.step h3`, `.vs h3`, `.gal-cap b`, `.lb-title`, `.cf-title`, `.earlier-text h4`, `.work-group h2`, `.spend-head h3`, `.pager b` | Schibsted 600 | 20px (`.tile-title` `clamp(20px,2vw,26px)`; `.work-group h2`, `.spend-head h3` 22px; `.gal-cap b` 16px; `.pager b` 18px) | 1.25 | mixed |
| Pull quote | `.pull-text` (About) | Schibsted 600 | `clamp(22px,2.6vw,28px)`, max-width 28ch | 1.25 | mixed |
| Body | `body` | Schibsted 400 | 17px, 16px at or under 520px | 1.65 | mixed, `--prose` on running copy |
| Lede | `.lede` | Schibsted 400 | `clamp(16px,1.4vw,18px)`, max-width `--measure` | 1.6 | `--prose`, `strong` in `--text` |
| Card copy | `.svc p`, `.run > p`, `.run-list li`, `.reg p`, `.tl-bullets li`, `.auto-body p`, `.res-d`, `.step p`, `.stat-note`, `.panel-note`, `.ops-note` | Schibsted 400 | 15px | 1.6 | `--prose` |
| Big-number label | `.stat--one .stat-label`, `.spend-head h3` | Schibsted 500 / 600 | 18px / 22px, max-width 34ch | 1.45 | mixed |
| Labels | `.eyebrow`, `.mono-line`, `.sub-head`, `.stat-label`, `.stat-label i`, `.tile-meta`, `.tile-label`, `.tile-go`, `.reg-when`, `.reg-stack`, `.auto-stack`, `.footer-h`, `.brand-market`, `.tl-date`, `.tl-org`, `.tl-place`, `.contact-form label`, `.ci-text b`, `.hero-meta li`, `.welcome`, `.provenance`, `.spend-sub`, `.spend-foot`, `.stack-note`, `.about-facts`, `.edu-meta`, `.brands-note`, `.cta-band .mono-line`, `.gal-cap span`, `.vframe-cap`, `.ops-steps small`, `.res-num .from`, `.spend-table summary`, `.tl-more summary`, `.proof-to-gal` | Schibsted 400 or 500 | 14px (`.footer-copy`, `.footer-note`, `.footer-updated`, `.pager small` 13px) | 1.5 | mixed, `--mute`, letter-spacing 0 |
| Nav links, tabs, jumpnav links | `.nav-links a`, `.seg-btn`, `.jumpnav a` | Schibsted 500 | 14px | 1.2 | mixed |
| Chips | `.chip`, `.card-kicker` | Schibsted 500 | 12px, padding 4px 10px, 1px `--edge`, radius 999px | 1.4 | sentence case, `--mute` |
| Mono (data only) | `.brand`, `.spend .axis text`, `.spend .lab`, `.spend .tip text`, `.spend-table th/td`, `.spend-rows .sr-wk`, `.lb-count`, `.flow-steps li` | Martian Mono | 11.5 to 12px | 1.4 | as today, `.tip-k` and `th` no longer uppercase |

Letter-spacing: 0 on every role (Anton loses its .005em to .04em; labels lose .06em to .12em; chips 0; nav 0). Line-height: display .9 to 1.04; titles 1.25; body 1.65; labels 1.5.

Spacing (literal values): `--section clamp(72px,10vw,128px)` on every page; `.page-hero` padding `clamp(48px,8vw,112px) 0 clamp(40px,6vw,72px)`, no border; `.page-hero + .section` and `.jumpnav + .section` padding-top `var(--section)`; `.stats` padding-block `var(--section)`; `.section-head` margin-bottom `clamp(40px,6vw,72px)`; grid gaps 24px (`.bento` 24px, 16px under 560px); card padding `28px 28px 30px`, `22px 20px` under 520px; the one-number block padding `clamp(40px,7vw,80px) 0`, max-width 720px, no border, no fill; `.hero` phone padding `40px 0 56px`; `.hero-ctas` margin-top 24px.

Contrast confirmations: `--prose` on `--bg` 12.3:1, on `--panel` 11.1:1; `--mute` on `--panel` 6.4:1; white on `--accent-btn` 4.7:1 (unchanged); `--edge-strong` at .30 as a 1px field boundary 2.9:1 on `--panel` (inputs keep `--edge-strong`; the form sits on `--panel`); Anton 60px+ `--text` on `--bg` 15.9:1.

---

## 4. Per-page HTML edits, in file order

Replacement markup is exact. Where a block is "deleted", delete the whole element including its children. Keep every attribute not mentioned.

### 4.1 `_tools/shell/head.html`, `nav.html`, `footer.html` (then `python _tools/sync-shell.py`; `--check` exits 0)

- head.html line 5: `styles.css?v=18` becomes `styles.css?v=19`. Nothing else.
- nav.html: no markup change. CSS only (section 05): `.nav-cta` renders as the ghost pill on every width and scroll state; `.nav-links a` Schibsted 500 14px mixed case.
- footer.html: no markup change (the phone, `© 2026` and `Last updated 2 November 2026` stay word for word; the date test depends on it). CSS only (section 19): `.footer-h` 14px mixed case, `.footer-copy` / `.footer-note` / `.footer-updated` 13px body, letter-spacing 0, no uppercase.

### 4.2 index.html (CRLF)

**Hero** (lines 131 to 182). Replace the whole `<header class="hero" id="top">` with:

```html
<header class="hero" id="top">
  <div class="wrap hero-grid">

    <div class="hero-copy">
      <p class="welcome snap-in d1"><i class="pulse-dot" aria-hidden="true"></i>Available for new brands</p>
      <h1 class="hero-name snap-in d1" data-split>Carl Gabriel <span class="ac">Piramo</span></h1>
      <p class="hero-role snap-in d2">Digital Marketing Manager · <span>E-commerce Growth Specialist</span> · AI Specialist</p>
      <p class="hero-hook snap-in d2">Ads, store and creators for DTC brands. <em>One person, one feedback loop.</em></p>
      <p class="lede snap-in d3">Right now: growth and automation for <a href="ama-holdings.html" title="AMA Holdings: The Loaded Teashop and Goli Nutrition">AMA Holdings</a> (US) and three brands in the Philippines.</p>
      <div class="hero-ctas snap-in d4">
        <a class="btn btn--primary" href="contact.html">Book a call</a>
        <a class="btn--link" href="work.html">See the work →</a>
      </div>
    </div>

    <div class="hero-visual hero-proof snap-in d3">
      <div class="hv-photo"><img src="assets/media/portrait-carl.png" alt="Carl Gabriel Piramo" width="400" height="400" fetchpriority="high"></div>
      <ul class="hero-meta">
        (the three existing <li> items, unchanged: Manila, Philippines · Remote worldwide · Works in your timezone)
      </ul>
    </div>

  </div>
</header>
```

That is: `.hero-hook` loses its figure; the `<ul class="hero-proof-list">` (lines 139 to 143) and the `<div class="hero-social">` rail (lines 164 to 176) are deleted; the lede says "the Philippines" instead of "PH". On a 375px phone the order reads: nav (ghost "Book a call", burger), 40px, "Available for new brands" as plain 14px text with the dot, name at 40px Anton, title line, hook at 20px Anton, lede, coral button, "See the work →", then the 64px portrait beside the three meta lines. On desktop the copy takes the left column and the portrait sits at 240px on the right with the meta lines under it; no third column.

**#results** (lines 189 to 224). Replace the section's inner content with:

```html
<section class="stats" id="results" aria-labelledby="resultsTitle">
  <div class="wrap">
    <h2 class="sub-head mono-line reveal" id="resultsTitle">One number, honestly labelled</h2>
    <div class="stats-grid stats-grid--one">
      <article class="stat stat--one card reveal">
        <span class="stat-num"><span class="pre">US$</span><span class="val" data-count="44">44</span><span class="suf">M+</span></span>
        <span class="stat-label">Creator ad spend I track and report on for AMA Holdings, owner of The Loaded Teashop and Goli Nutrition.</span>
      </article>
    </div>
    <p class="stat-note reveal">Media buyers spend it and creators film for it. I built the loop between them: the weekly read of what wins, the creator database the whole team edits, and the automations that move an approved video to the buyers within the quarter hour. The <a href="ama-holdings.html">case study</a> has every figure, labelled.</p>
  </div>
</section>
```

The other five `.stat` cells, every `.ic-tile`, every `<i>` sublabel and `data-stagger="90"` go.

**Brand row** (lines 230 to 245): keep the eight `<li>` names; delete every `<span class="ticker-tag">…</span>` (USA, USA · AMA Holdings, Singapore, Singapore, USA · PH, Philippines, Philippines, Automotive).

**#explore bento** (lines 254 to 335):

- `.tile--work`: delete `<span class="chip chip--accent">Meta · TikTok · n8n</span>` (line 268). Line 270 becomes `<p class="tile-meta">Reels, statics and the automations behind them.</p>`.
- `.tile--case`: keep the `.tape` sparkline (CSS turns every bar `--data-mute`) and keep `<span class="chip chip--accent tile-chip">AMA Holdings · The Loaded Teashop</span>` (CSS renders it in sentence case). The title span stays byte-identical: `<span data-vt="vt-ama-holdings">The growth desk behind <em>US$44M of creator ads.</em></span>`. Line 280 becomes `<p class="tile-meta">Case study · The Loaded Teashop's creator ad program.</p>`.
- `.tile--results`: delete the `.ic-tile` span, the `<p class="stat-num">…$3.8M…</p>`, the `<p class="tile-label">Shopify sales in one day</p>` and the whole `<ul class="tile-list">`. After the `<h3>` insert `<p class="tile-label">A record sales day on Shopify, a TikTok Shop LIVE run and the Meta accounts behind them, each with its dashboard screenshot.</p>`.
- `.tile--dash`: line 303 becomes `<p class="tile-meta">Dashboard screenshots, names blurred.</p>`.
- `.tile--services`: delete the `.ic-tile` span and the whole `<ul class="tile-chips">` (four chips). After the `<h3>` insert `<p class="tile-label">Paid media, e-commerce, social and creators, AI and search.</p>`.
- `.tile--exp`: delete `<span class="chip chip--win">Current</span>` (line 321) and the `<p class="tile-meta">Plus three brands in PH · 3+ years · PH · SG · USA</p>` (line 324). Keep `<p class="tile-label">Now: Growth &amp; Automation Specialist · AMA Holdings (US)</p>`.
- `.tile--contact`: markup unchanged (class `coral` stays; CSS makes it the panel card with the coral button).

**Pager** (line 340): `<a class="pager-next" href="work.html"><small>Next →</small><b>Work</b></a>`.

### 4.3 work.html (CRLF)

- Line 113: `<p class="eyebrow snap-in d1">Work</p>` (the `.ph-index` and `.ph-sep` spans go).
- Tabs (lines 122 to 128): markup unchanged; CSS renders `.work-tabs` as underline tabs.
- Reel chips (lines 135, 142, 149, 156, 163, 170, 177, 184): keep the eight `<span class="chip chip--accent">` labels; CSS sets them in sentence case on the scrim (they are baseline strings, and the figcaptions below each video already say it in words).
- Stills intro (line 195): unchanged ("Ten" is a word; `50% off` is the page's one prose figure).
- Automations intro (line 220): unchanged.
- Video pipeline card (line 253): the sentence `Every 15 minutes the approved ones are filed in Drive by day, flavor, creator and funnel stage, and written to the media buyers' sheet with the right ad copy.` becomes `Four times an hour the approved ones are filed in Drive by day, flavor, creator and funnel stage, and written to the media buyers' sheet with the right ad copy.`
- Ad feeds card (line 261): unchanged. It keeps the page's one `Every 15 minutes:`.
- Creators sync card (line 269): `The creator platform's Meta assets fill in missing Instagram and Facebook handles for 833 creators and mark who is set up.` becomes `The creator platform's Meta assets fill in missing Instagram and Facebook handles for every creator in the program and mark who is set up.`
- Knowledge bot flow strip (line 274): `<li><span>Claude searches 900+ notes</span></li>` becomes `<li><span>Claude searches the notes</span></li>`.
- Editing app flow strip (line 290): `<li><span>9:16 ad</span></li>` becomes `<li><span>Vertical ad</span></li>`.
- Every `<ul class="auto-stack" aria-label="Built with">` keeps its `<li class="chip">` items unchanged. CSS (section 10) renders the list as one line: "Built with n8n, Meta webhooks, Claude Haiku and Telegram." (the `::before` content supplies "Built with ", the commas and the "and"; the aria-label stays).
- `.gal-zoom` spans stay (CSS shows them on hover or focus only).
- CTA band: markup unchanged (class `coral` stays; CSS makes it the card).
- Pager (lines 312 to 313): `<small>← Previous</small><b>Home</b>` and `<small>Next →</small><b>AMA Holdings</b>`.

### 4.4 ama-holdings.html (LF)

- Line 113: `<p class="eyebrow snap-in d1">Case study · AMA Holdings · The Loaded Teashop</p>`.
- Line 114: unchanged (the h1 is the page's one early figure and the data-vt twin).
- Line 115: `<p class="lede snap-in d3">AMA Holdings is the US owner of The Loaded Teashop and Goli Nutrition. The Loaded Teashop sells through a creator ad program: hundreds of creators uploading to briefs, media buyers scaling the winners on Meta and TikTok. Since October I run its growth and automation.</p>`
- Lines 116 to 119: unchanged (Book a call, See the systems ↓).
- Jumpnav (lines 122 to 131): markup unchanged; CSS renders it as a static text row and hides it under 760px.

**#scale** (lines 134 to 285). The section becomes: sub-head, the chart figure (which now carries the page's one big number), then the provenance paragraph. Replace lines 136 to 172 with:

```html
    <h2 class="sub-head mono-line reveal">The scale</h2>

    <figure class="spend card reveal">
    <div class="spend-head">
      <p class="stat-num stat-num--one"><span class="pre">US$</span><span class="val" data-count="44.2">44.2</span><span class="suf">M</span></p>
      <h3>Creator ad spend tracked for The Loaded Teashop since April, Meta and TikTok together.</h3>
      <p class="spend-sub">The chart is the most recent thirteen weeks of it, late July to late October. The coral column is the biggest week.</p>
    </div>
```

(The six-cell `.stats-grid--6` with its eleven sublabel figures and `data-stagger="90"` is deleted; the old `.spend-head` with "13 weeks: US$30.60M" and "Jul 22 to Oct 20, 2026 · US$ · Meta + TikTok" is deleted.)

- Chart SVG (lines 173 to 265): keep the grid, the four `$` axis labels, the four date ticks and all 13 `.bar` groups with their aria-labels (invisible, screen-reader detail). In `<g class="labs">` delete `<text class="lab" x="871.4" y="59.5">US$3.10M</text>` so only the coral peak is labelled. In each of the 13 `.tip` groups the second `<text>` keeps the spend only: `US$1.79M`, `US$1.73M`, `US$1.42M`, `US$1.92M`, `US$1.03M`, `US$2.00M`, `US$1.72M`, `US$2.50M`, `US$3.29M`, `US$3.77M`, `US$3.30M`, `US$3.04M`, `US$3.10M` (drop ` · 1.69× ROAS` and the like). Give each `<text class="tip-k">` its range in mixed case (`Jul 22 to Jul 28` …); CSS no longer uppercases it.
- Phone rows (lines 266 to 281). Replace the 13-row list with:

```html
    <p class="spend-rows-lead">Four of the thirteen weeks; the table below has all of them.</p>
    <ol class="spend-rows" aria-label="Weekly ad spend, four of thirteen weeks">
      <li><span class="sr-wk">Jul 22</span><i style="--w:47%"></i><b>US$1.79M</b></li>
      <li><span class="sr-wk">Aug 19</span><i style="--w:27%"></i><b>US$1.03M</b></li>
      <li class="is-peak"><span class="sr-wk">Sep 23</span><i style="--w:100%"></i><b>US$3.77M</b></li>
      <li><span class="sr-wk">Oct 14</span><i style="--w:82%"></i><b>US$3.10M</b></li>
    </ol>
```

- Spend foot (line 282): `<div class="spend-foot"><span>Source: the creator platform's export from late October. Blended ROAS, in the table, is Meta's revenue over spend.</span><span class="spend-foot-hint">Tap or hover a column for the week</span></div>` (the `mono-line` classes come off).
- Spend table (line 283): the summary becomes `<summary>See every week as a table</summary>`; insert `<caption>Thirteen weeks, July 22 to October 20, 2026: US$30.60M in total</caption>` as the first child of the `<table>` so the chart's own total stays on record (inside the closed details). Rows and the ROAS column unchanged.
- After `</figure>` insert the provenance as a paragraph: `<p class="provenance reveal">Every figure here is from the program's own systems, the creator platform, Meta, Triple Whale and Northbeam, as of early November. Team and client scale: media buyers spend, creators film, I build the loop between them.</p>` (line 169's `mono-line provenance` paragraph is deleted from its old place above the chart).

**#loop** (lines 288 to 393):

- The SVG keeps its markup; CSS hides `.ops-caps` and recolours every node stroke to `--mute` with the TEAM node in `--text` (presentation attributes lose to any stylesheet rule, so no colour edits in the HTML).
- `.ops-steps` (lines 367 to 375): `<li>QA queue<small>Within a minute</small></li>` stays; `<li>Drive and creative sheet<small>Four times an hour</small></li>`; `<li>Ad feeds read the numbers<small>Meta, Triple Whale and Northbeam, four times an hour</small></li>`; the other four unchanged. CSS removes the 01 to 07 counters.
- Figcaption (line 376): `<figcaption>Creators on the left, the media buyers' ad accounts on the right, and everything between them is what I built. <strong>One loop, no copying and pasting.</strong></figcaption>`
- Delete the whole `<ul class="ops-legend" data-stagger="90">` (lines 379 to 392) and insert in its place: `<p class="ops-note reveal">New uploads land in the QA queue within a minute. Four times an hour the approved videos go to Drive and the creative sheet, and the ad feed refreshes spend, ROAS and pass or fail for every video. Creators sync, upload history and the submissions log run on the hour, reports post to Telegram three times a day, and the top fifty gets read every week.</p>`

**#run** (lines 396 to 442): delete the three `.ic-tile` spans. Replace each `<span class="chip …">Growth / Creators / Automation</span>` with `<p class="card-kicker">Growth</p>`, `<p class="card-kicker">Creators</p>`, `<p class="card-kicker">Automation</p>`.

- Card 1 paragraph (line 409): `The fifty videos with the most spend among the week's uploads, each downloaded, transcribed and sampled frame by frame, then sorted by angle, hook, buildup, body, CTA and format.` Bullet 3 (line 413): `<li>One rule for a winner, applied to every video by the dashboard. It is spelled out under Winners below.</li>`
- Card 2 title (line 420): `<h3 class="card-title">One creator database</h3>`; its paragraph and bullets unchanged.
- Card 3 title (line 432): `<h3 class="card-title">Workflows that report themselves</h3>`; bullets (435 to 438): `<li>The video pipeline: an approved upload reaches the media buyers within the quarter hour, with QA, whitelist checks and daily reports.</li><li>Ad feeds: spend and ROAS from Meta, Triple Whale and Northbeam, refreshed four times an hour.</li><li>A knowledge bot on web and Telegram that answers from hundreds of team notes and cites them.</li><li>An AI editing app that turns creators' phone clips into finished vertical ads.</li>`

**#automations register** (lines 445 to 543): remove `data-stagger="60"` from `<ul class="register">`. Every `<span class="reg-when">` is rewritten in sentence case without digits: Video pipeline `Every minute, then four times an hour`; QA tab `On demand`; Ad feeds `Four times an hour`; Creator database and sync `Hourly`; Submissions log and daily reports `Four times an hour, with reports three times a day`; Weekly Top 50 (its `.reg-name` becomes `Weekly top fifty`) `Weekly`; Team knowledge bot `On demand, web and Telegram`; Creator Scout `On demand`; AI editing app `On demand`; Video texts `Continuous`; Creator call reminders `Monday to Friday`.

Row paragraphs that change (the others, QA tab, Ad feeds, Creator Scout, Video texts, Call reminders, are unchanged):

- Video pipeline: `New creator uploads land in a QA queue within a minute, with flavor, funnel stage and whitelist handles filled in. Four times an hour the approved videos are downloaded, filed in Drive by day, flavor, creator and funnel stage, and written to the media buyers' creative sheet with the right ad copy. "Send now" skips the wait. A failure writes its own row with the reason.`
- Creator database and sync: `Every creator in the program with handles, whitelist status, tier and drop lists. Every hour the creator platform's Meta assets fill in missing handles and mark who is set up; the pipeline reads the same table, so a creator marked "not set up" holds their videos until it is fixed.`
- Submissions log and daily reports: `Every video that reached a creative sheet in the last month, who sent it, its row and whether it is still in its folder, kept in a spreadsheet with QC boxes per day. Three times a day, and once at midnight Eastern, the team's Telegram gets the count by stage.`
- Weekly top fifty: `The week's fifty biggest videos by spend, transcribed and sampled frame by frame, broken down by angle, hook, buildup, body, CTA and format with median thumbstop, ROAS and CPA for each. The write-up ends with what to brief next, and the angle tags go back onto the dashboard.`
- Team knowledge bot: `A chat that answers from the team's second brain: hundreds of notes of call transcripts, concepts, audits, playbooks and the program's own ad numbers. Claude searches and reads the notes, cites them, flags advice older than six weeks, saves new team inputs back into the vault and can hand over the data as a new Google Sheet.`
- AI editing app for creators: `Raw phone clips in, a finished vertical ad out: a transcript from Deepgram, an edit plan and text cards from Claude, shot labels from Claude vision, a render from ffmpeg. Roles, invites and monthly limits per member. It runs on a Mac mini behind a tunnel, with a Vercel front door and an installable web app on creators' phones.`

Every `<ul class="reg-stack" aria-label="Built with">` keeps its `<li>` items; CSS renders the list as one line ("Built with n8n, Google Drive, Google Sheets and Supabase.").

**#winners** (lines 546 to 558; both answers feed the FAQ JSON-LD, so `node _tools/seo/build-seo.js --apply` follows):

- Answer 1: `<p class="qa-a" data-faq-a>The team's rule, and the one the dashboard applies to every video: at least $100 of spend, a blended ROAS of 1.4× or better and a cost per purchase of $26 or less. In the last month, 2,013 videos were judged and 239 passed. That ratio is normal. A few videos carry most of the results, which is why the weekly analysis exists: find what the winners have in common and brief more of it.</p>`
- Answer 2: `<p class="qa-a" data-faq-a>Keep everyone looking at the same numbers and shorten the loop between them. In practice: a weekly read of the top fifty videos by spend (angle, hook, CTA and format, with ROAS and thumbstop per family), audits of creator videos against those findings, a creator database the whole team edits, and the automation that moves an approved video to the media buyers within the quarter hour instead of the next day. Media buyers spend the money and creators make the videos. I make sure the data from one reaches the other.</p>`

Neither answer contains a dash, a banned word or a figure from the validator's UNVERIFIED list.

**#stack** (lines 561 to 583): remove `data-stagger="30" data-stagger-class="reveal--pop"` from the `.tools` list; the pills are unchanged. Line 582 loses `mono-line` (`<p class="stack-note reveal">…`), text unchanged.

**CTA band** (lines 586 to 593): markup unchanged. **Pager** (lines 596 to 597): `<small>← Previous</small><b>Work</b>` and `<small>Next →</small><b>Results</b>`.

### 4.5 results.html (CRLF)

- Line 112: `<p class="eyebrow snap-in d1">Proof</p>`. Lines 113 to 119 unchanged.
- Jumpnav (lines 123 to 130): delete `<li><a href="#proof">Highlights</a></li>`; keep By channel, Dashboards, ROAS (the section keeps `id="proof"`, so no anchor breaks).
- Delete the whole `<div class="result-grid" data-stagger="100">…</div>` (lines 133 to 158). `#proof` now opens with `.proof-tabs`.

**Channel panels** (each `.proof-panel` keeps its id, role, aria attributes and `.proof-to-gal` link; the `.proof-grid` inside is replaced; no `data-count`, no `.ic-tile`, no chips, no `stat--hl`):

- Creator panel:
```html
        <div class="proof-grid proof-grid--2">
          <article class="stat card"><span class="stat-num"><span class="pre">US$</span><span class="val">44.2</span><span class="suf">M</span></span><span class="stat-label">Creator ad spend tracked for The Loaded Teashop, Meta and TikTok, since April.</span></article>
          <article class="stat card"><span class="stat-num"><span class="val">833</span></span><span class="stat-label">Creators in one database the whole team edits.</span></article>
        </div>
        <p class="panel-note reveal">Team and client scale, not mine alone: media buyers spend it and creators film for it. I run the weekly read of what wins, the database and the automations between them. The rule the team uses for a winning video, and the chart of weekly spend, are on the case study.</p>
```
- E-commerce panel: cells `$3.8M` with label `Shopify sales in one day, one store.` and `₱4.99M` with label `TikTok Shop LIVE GMV from one selling run.` (same `.pre`/`.val`/`.suf` pattern); then `<p class="panel-note reveal">That day the store took close to a hundred thousand orders at a ten percent conversion rate. A later week passed $1.24M on the same store, and Shopee promo sales in a month reached ₱1.66M. The dashboards below show each one.</p>`
- Meta panel: cells `8.71×` with label `Peak Meta ROAS on one sales campaign.` and `3.2×` with label `ROAS after a Shopify rebuild and a Meta restructure, more than doubled.`; then `<p class="panel-note reveal">That peak ROAS came from one sales campaign. Blended across the Meta accounts I buy for in the Philippines, winners and losers together, the figure is 4.9×. The accounts and teams I have worked in, some I can't name, add up to US$60M+ in Facebook Ads revenue. Before any of that, Pixel and Conversions API tracking helped restore delivery on stalled ad accounts.</p>`
- Social panel: cells `52M+` with label `Total views across the brand accounts, five platforms together.` and `32.9M` with label `Of them on TikTok, short-form video.`; then `<p class="panel-note reveal">Instagram carried most of the rest, with Facebook, YouTube and Pinterest behind it; the per-platform screenshots are in the gallery. Separately, a UGC creator campaign reached a hundred million views a month by its second month live.</p>`

**Gallery** (lines 326 to 400):

- Lede (line 331): the last sentence `Tap any screenshot to zoom in.` becomes `The numbers are in the screenshots; tap any of them to zoom in.`
- Filters (lines 337 to 340): markup unchanged; the four `<span class="gal-count">` spans stay (CSS hides them; main.js still fills them). `.gal-status` (line 342) keeps its text and `aria-live`; CSS makes it screen-reader only.
- Delete every `<span class="chip … gal-chip" aria-hidden="true">…</span>` (nine).
- `.gal-zoom` spans stay (hover and focus only).
- `data-title`, `data-desc`, `alt` and `href` are unchanged (they feed the lightbox and the audit). Only the aria-hidden `.gal-cap` changes, `<b>` then `<span>`:
  1. `Shopify, one sales day` / `Total sales, orders and conversion rate`
  2. `Shopify, one week in September` / `Total sales against the week before`
  3. `TikTok Shop, LIVE and video analytics` / `LIVE-attributed GMV, items sold and click-through`
  4. `Shopee, one promo month` / `Promo sales, orders and month-over-month change`
  5. `Meta Ads Manager, sales campaigns` / `Conversion value, average and peak ROAS`
  6. `Meta Ads Manager, messaging to purchase` / `Purchases, average ROAS and cost per purchase`
  7. `TikTok &amp; YouTube` / `Views per creator account, names blurred`
  8. `Instagram &amp; Pinterest` / `Views per creator account, names blurred`
  9. `Facebook pages` / `Total views per page, names blurred`

- `#roas` (line 409): unchanged (FAQ text; the numbers are the lesson).
- CTA band unchanged. Pager (lines 424 to 425): `<small>← Previous</small><b>AMA Holdings</b>` and `<small>Next →</small><b>Services</b>`.

### 4.6 services.html (CRLF)

- Line 113: `<p class="eyebrow snap-in d1">What I do</p>`. Hero and jumpnav markup unchanged.
- Service cards (lines 136 to 180): delete the four `.ic-tile` spans; replace each `<span class="chip …">Paid media / E-commerce / Social &amp; creators / AI &amp; search</span>` with `<p class="card-kicker">…</p>` (same words); delete the four `<ul class="svc-tags">` lists (17 tags).
- Line 174: `n8n workflows (20+ live for one client)` becomes `n8n workflows (more than twenty live for one client)`; the rest of the sentence unchanged.
- Loop SVG and `.ops-steps` (lines 196 to 218): markup unchanged; CSS sets one stroke colour.
- `#edge` (lines 236 to 270): replace `<span class="chip chip--accent">Hiring me</span>` and `<span class="chip">The usual setup</span>` with `<p class="card-kicker">Hiring me</p>` and `<p class="card-kicker">The usual setup</p>`; the `ops-stack` figures and the lists are unchanged.
- `#process` (lines 279 to 309): markup unchanged; CSS renders the counters as 1 to 4 in the body face.
- CTA band unchanged. Pager (lines 322 to 323): `<small>← Previous</small><b>Results</b>` and `<small>Next →</small><b>About</b>`.

### 4.7 about.html (CRLF)

- Line 113: `<p class="eyebrow snap-in d1">About</p>`. Jumpnav markup unchanged.
- Line 133: delete `<span class="chip chip--blue">The human</span>`.
- Bio p1 (line 138): `<p>I came up inside big creator and performance-marketing teams, Goli Nutrition among them, running UGC creator campaigns that passed a billion views. Today I do two jobs at once. I lead digital marketing for <strong>Goli PH, Biolane PH and MaryRuth's PH</strong> at their Philippine distributor, reporting to the CEO and running the e-commerce and affiliate teams behind three Shopify stores. And since October I'm the growth and automation specialist at <strong><a href="ama-holdings.html">AMA Holdings</a></strong>, the US company that owns The Loaded Teashop and Goli Nutrition, where The Loaded Teashop's creator ad program runs at a scale I report on every week: I run the weekly read of what's winning, and I built the pipeline, the dashboard and the bots the team works in.</p>` ("a billion views" keeps the verified order of magnitude; the US$60M+ sentence moves to the Results Meta paragraph; US$13M+ a month lives in the timeline below the fold.)
- Bio p2 (line 139): `(20+ live for one client)` becomes `(more than twenty live for one client)`; the rest unchanged.
- Insert after the `.about-text` div, before `.about-facts`: `<p class="pull-text reveal">The marketing brain leads. The code just means I never wait on anyone to execute.</p>` (the page's text pull quote; the same sentence stays in p2 as its closing `<strong>`).
- Timeline, AMA item (lines 161 to 180): keep `<span class="chip chip--win">Current</span>` (the site's only status chip); delete `<span class="chip chip--accent">Creator ad program</span>` (line 171). Bullets 175 to 178 become:
  - `<li>Run the weekly read of the top fifty videos by spend for The Loaded Teashop's creator ad program at <strong>US$13M+ a month</strong>: angles, hooks, CTAs and formats with ROAS and thumbstop per family, and what to brief next.</li>`
  - `<li>Built the <strong>video pipeline</strong> that takes approved creator uploads to the media buyers' Drive folders and creative sheet four times an hour, with QA, whitelist checks and daily Telegram reports.</li>`
  - `<li>Built the team's dashboard and knowledge bot: live ad feeds from Meta, Triple Whale and Northbeam, a <strong>creator database</strong> of more than eight hundred creators, a QA tab, and Claude answering from hundreds of team notes on web and Telegram.</li>`
  - `<li>More than twenty n8n workflows in production on Supabase, Vercel and the Claude API, plus an AI editing app that turns creators' phone clips into finished vertical ads. <a href="ama-holdings.html">The case study</a> has the numbers.</li>`
- Timeline, item 2 (lines 183 to 203): delete the second `<span class="chip chip--win">Current</span>` (line 187) and `<span class="chip chip--blue">Team lead</span>` (line 193). Items 3 to 6 have no chips. Every `.tl-date`, `.tl-place` and `.tl-org` text stays (CSS sets them in 14px body).
- Earlier roles (lines 285, 293): text unchanged (`Earlier · Aug 2024`, `Earlier · 2021 to 2024`), CSS only.
- Brands (lines 305 to 341): line 309 becomes `<span class="brand-market">USA · since October</span>`; delete `<span class="brand-fact">US$44M+ ad spend tracked · 833 creators · 11 systems</span>` (line 311). Other cards unchanged.
- Skills (lines 348 to 401): remove `data-stagger="35" data-stagger-class="reveal--pop"` from the three `.tools` lists; pills unchanged.
- Education (lines 406 to 424): unchanged.
- CTA band unchanged. Pager (lines 440 to 441): `<small>← Previous</small><b>Services</b>` and `<small>Next →</small><b>Contact</b>`.

### 4.8 contact.html (CRLF)

- Line 113: `<p class="eyebrow snap-in d1">Let's talk</p>`.
- Body: no copy change. The four `.ic-tile` spans in `.ci-row` stay in the markup and are hidden by CSS (`.ci-row .ic-tile{display:none}`); `.ci-text b` and the form labels render in 14px Schibsted mixed case; the FAQ ladder becomes 24px of space. `[data-faq-q]` and `[data-faq-a]` text untouched.
- Pager (line 279): `<small>← Previous</small><b>About</b>`.

### 4.9 404.html (CRLF)

- Line 96: unchanged (`<span class="ph-index">404</span>` and its separator stay; CSS shows `.ph-sep` only here).
- Line 98: `<p class="lede snap-in d3">I split the site into separate pages, so whatever link got you here is dead now.</p>`
- Lines 99 to 105: replace the six-button row with
```html
    <div class="hero-ctas snap-in d4">
      <a class="btn btn--primary" href="/">Home</a>
    </div>
    <p class="lede snap-in d4">Or go to <a href="/work.html">Work</a>, <a href="/results.html">Results</a>, <a href="/services.html">Services</a>, <a href="/about.html">About</a> or <a href="/contact.html">Contact</a>.</p>
```
(check-links requires root-absolute hrefs on this page; these are.)

---

## 5. CSS edits by section number

Write them in place; keep the section banners. "Delete" means remove the rule.

**00** as in section 3 (tokens, `.coral` card).

**01**
- Delete `body:not([data-page="home"]){--section:clamp(56px,7vw,96px)}`.
- `.section--alt{background:transparent;border-block:0}` (rhythm is space, not bands).
- `.section-head{max-width:820px;margin-bottom:clamp(40px,6vw,72px)}`.
- Add after `.section-head .lede`: `.lede,.qa-a,.about-text p,.section-head p,.svc p,.run > p,.run-list li,.reg p,.tl-bullets li,.auto-body p,.work-group > p,.stat-note,.panel-note,.ops-note,.provenance,.res-d,.step p,.edu-list li,.faq-body p,.vs-list li,.brand-card p,.skill-head p,.earlier-text p,.edge-copy p,.opsmap figcaption,.loop figcaption{max-width:var(--measure)}` and `.lede,.about-text p,.svc p,.run > p,.run-list li,.reg p,.tl-bullets li,.auto-body p,.work-group > p,.stat-note,.panel-note,.ops-note,.provenance,.res-d,.step p,.edu-list li,.faq-body p,.vs-list li,.brand-card p,.skill-head p,.earlier-text p,.edge-copy p,.qa-a{color:var(--prose)}` (later per-component `color:var(--mute)` on these selectors is deleted or changed to `--prose`).
- `strong,b{font-weight:700}` stays; add `p strong,li strong{color:var(--text);font-weight:500}`.

**02**
- `.eyebrow{display:block;font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute);margin-bottom:16px}`; delete `.eyebrow::before`.
- `.hook{letter-spacing:0}` (keep Anton, uppercase, line-height 1.04). `h2.hook{font-size:clamp(28px,4vw,44px)}`.
- `.lede{color:var(--prose);max-width:var(--measure);font-size:clamp(16px,1.4vw,18px);line-height:1.6}`.
- `.mono-line{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.
- `.card-title{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`.
- `.sub-head{display:block;margin-bottom:24px}`; delete `.sub-head::after`.
- New: `.card-kicker{font:500 12px/1.4 var(--body);letter-spacing:0;color:var(--mute)}` and `.pull-text{margin:32px 0 0;font:600 clamp(22px,2.6vw,28px)/1.25 var(--body);letter-spacing:-.01em;max-width:28ch;color:var(--text)}`.

**03**
- `.chip{font:500 12px/1.4 var(--body);letter-spacing:0;text-transform:none;padding:4px 10px;border:1px solid var(--edge);border-radius:999px;color:var(--mute)}`; `.chip--win{color:var(--mute);border-color:var(--edge)}`; the `.tile-chip,.gal-chip,.vframe .chip,.about-photo .chip` scrim rule stays (gal-chip and about-photo chip no longer exist in markup, harmless).
- `.ic-tile{display:none}` (one rule; the title is the icon). The `.ic-tile svg` and modifier rules can stay or go.
- `.card{border-radius:var(--r-lg)}` (16px via the token); hover unchanged.
- `.btn--sm` unchanged; `.nav-cta` styling in 05.
- Segmented controls become underline tabs, keeping the JS contract:
  ```css
  .seg{padding:0;gap:4px;border-radius:0;background:transparent;border:0;border-bottom:1px solid var(--edge-soft)}
  .seg-ind{top:auto;bottom:-1px;height:2px;border-radius:0;background:var(--text)} /* width and transform still come from --seg-w/--ind-w and --seg-x/--ind-x */
  .seg-btn{min-height:44px;padding:12px 14px;border-radius:0;font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}
  .seg-btn.is-active,.seg-btn[aria-pressed="true"],.seg-btn[aria-selected="true"]{color:var(--text)}
  ```
  The 560px overflow-x rules stay; in that block change the `.seg-btn` font-size line to `font-size:14px;letter-spacing:0` and delete the `.gal-filters .gal-count` line.

**05**
- `.nav-links a{font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none;padding:8px 10px}`.
- Delete the two `body:not([data-page="contact"]) .nav:not(.nav--scrolled) .nav-cta` rules; add `.nav-cta{background:transparent;border-color:var(--edge-strong);color:var(--text)} .nav-cta:hover{border-color:var(--text);background:rgba(var(--fg-rgb),.05)}` (the `[aria-current="page"]` ring stays).
- Mobile menu unchanged.

**06**
- `.hero{min-height:min(680px,calc(100svh - var(--nav-h)));padding:clamp(28px,4vw,56px) 0 clamp(48px,6vw,72px)}`.
- `.hero-grid{grid-template-columns:minmax(0,1fr) 240px}` (the 44px rail column goes).
- `.welcome{display:inline-flex;gap:9px;padding:0;border:0;font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute);margin-bottom:12px}`; `.pulse-dot{background:var(--mute)}`.
- `.hero-name{font-size:clamp(40px,8vw,72px);line-height:.96;letter-spacing:0}`.
- `.hero-hook{font-size:clamp(20px,4.6vw,28px);line-height:1.1;letter-spacing:0;max-width:22ch}`; `.hero-hook em{color:var(--mute)}`.
- `.hero .lede{max-width:var(--measure)}`; `.hero-ctas{margin-top:24px}`.
- `.hero-meta li{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.
- Delete every `.hero-proof-list*` rule and every `.hero-social*`, `.hs-label`, `.hs-line` rule (also from the 860px block, 27 and 21).
- `@media (min-width:861px){.hero-proof .hv-photo{width:240px;height:240px}}`.
- 860px block: `.hero{min-height:0;padding:40px 0 56px}`; `.hero-name{font-size:clamp(40px,11vw,64px)}`; drop the `.hero-proof-list` and `.hero-social` lines.

**07**
- `.ticker{padding:32px 0;border-block:0}`; `.ticker-list li{font:500 clamp(16px,1.5vw,18px)/1.4 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`; `.ticker-list li:nth-child(-n+2){color:var(--text)}` stays; delete `.ticker-tag`.

**08** (the hairline cell grid is retired)
- `.stats{padding-block:var(--section)}`.
- `.stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;background:none;border:0;overflow:visible}`; `.stats-grid--6` can be deleted (no markup uses it).
- New `.stats-grid--one{display:block}`.
- `.stat{display:flex;flex-direction:column;gap:12px;padding:28px 28px 30px;background:var(--panel);border:1px solid var(--edge-soft);border-radius:var(--r-lg);outline:0}`.
- New `.stat--one{padding:clamp(40px,7vw,80px) 0;max-width:720px;background:transparent;border:0}` and `.stat--one .stat-num,.stat-num--one{font-size:clamp(60px,10vw,104px);line-height:.9}` and `.stat--one .stat-label{font:500 18px/1.45 var(--body);max-width:34ch;color:var(--prose)}` and `.stat-note{margin-top:24px;max-width:var(--measure);color:var(--prose)}`.
- `.stat-num{font-size:clamp(40px,4vw,56px);letter-spacing:0}`; `.stat-num .pre,.stat-num .suf{font-size:.34em;letter-spacing:0}`.
- `.stat-label{font:500 15px/1.45 var(--body);color:var(--text)}`; `.stat-label i{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.
- Delete `.stat--hl{background:var(--accent-tint)}`, `.stat--hl .val{color:var(--accent)}`, `.stat--hl .stat-num{...}`, `.stat--hl .stat-label i{...}` and `.tile .stat-num`.
- 1000px block: `.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}`. 520px block: `.stats-grid{grid-template-columns:minmax(0,1fr)}`; `.stat{padding:22px 20px;gap:8px}`; `.stat-num{font-size:40px}`; delete the `.stat--hl` lines.

**09**
- `.svc-grid{gap:24px}`; `.svc p{color:var(--prose)}`; delete `.svc-tags` and `.svc-tags li`.
- `.loop-nodes rect{stroke:var(--mute)}`, `.loop-nodes text{fill:var(--text)}`, `.loop-label{fill:var(--mute)}`, `#loopArrow path,#opsArrow path{fill:var(--mute)}`.
- `.ops-steps li{grid-template-columns:1fr;gap:4px}`; `.ops-steps li::before{content:none}`; `.ops-steps small{font:400 13px/1.5 var(--body);letter-spacing:0;color:var(--mute)}`.

**10**
- `.work-tabs{margin-bottom:28px}` stays. `.vframe{border-radius:var(--r)}`; `.vframe .chip` keeps its position (sentence case comes from 03).
- `.vframe-cap{font:400 13px/1.45 var(--body);letter-spacing:0}`.
- `.work-group h2{font:600 22px/1.25 var(--body);letter-spacing:0;text-transform:none;margin-bottom:8px}`; `.work-group > p{color:var(--prose);max-width:var(--measure)}`.
- `.autos-grid{gap:24px}`; `.auto-body p{color:var(--prose)}`.
- Inline "Built with" lists (also used by the register in 29):
  ```css
  .auto-stack,.reg-stack{display:block;margin-top:auto;padding-top:4px;font:400 14px/1.5 var(--body);color:var(--mute)}
  .auto-stack::before,.reg-stack::before{content:'Built with '}
  .auto-stack li,.reg-stack li{display:inline;font:inherit;color:inherit;letter-spacing:0;text-transform:none;padding:0;border:0;border-radius:0;background:transparent;white-space:normal}
  .auto-stack li + li::before,.reg-stack li + li::before{content:', '}
  .auto-stack li:last-child:not(:first-child)::before,.reg-stack li:last-child:not(:first-child)::before{content:' and '}
  .auto-stack li:last-child::after,.reg-stack li:last-child::after{content:'.'}
  ```
- `.still-zoom{opacity:0}` and `a.still:hover .still-zoom,a.still:focus-visible .still-zoom{opacity:1;border-color:var(--edge-strong)}` (the whole card stays the tap target; the transition list gets `opacity .2s var(--ease)`).

**11**
- Delete `.result-grid`, `.result`, `.result--hl`, `.result--hl .val`, `.res-num*`, `.res-k`, `.res-d*` rules and the `.proof-grid--3`, `.proof-grid--4`, `.proof-grid > .card`, `.proof-grid > .stat--hl` rules (no markup uses them; leave a one-line comment).
- `.proof-grid{display:grid;gap:24px;background:none;border:0;overflow:visible}`; new `.proof-grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}` and `@media (max-width:640px){.proof-grid--2{grid-template-columns:minmax(0,1fr)}}`.
- New `.panel-note{margin-top:24px;max-width:var(--measure);color:var(--prose);font-size:15px;line-height:1.6}`.
- `.proof-to-gal{font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none}`.
- 1000px and 520px blocks: delete the `.result*` lines.

**12**
- `.gal-count{display:none}`; delete the `.seg-btn[aria-pressed="true"] .gal-count` rule.
- `.gal-status{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}` (the `.sr-only` pattern; aria-live keeps working).
- `.gal-grid{gap:24px}`; `.gal-item{border-radius:var(--r-lg)}`.
- Delete `.gal-chip`.
- `.gal-zoom{opacity:0;transition:opacity .2s var(--ease),border-color .2s var(--ease)}` and `.gal-item:hover .gal-zoom,.gal-item:focus-visible .gal-zoom,.auto:hover .gal-zoom,.auto-shot:focus-visible .gal-zoom{opacity:1;border-color:var(--edge-strong)}`.
- `.gal-cap b{font:600 16px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.gal-cap span{font:400 13px/1.5 var(--body);letter-spacing:0}`.
- Lightbox: `.lb-title{font:600 clamp(20px,2.2vw,24px)/1.2 var(--body);letter-spacing:0;text-transform:none}`; `.lb-desc{font:400 14px/1.6 var(--body);letter-spacing:0}`; `.lb-chip` renders as the base chip; `.lb-count` stays mono.

**13**
- `.tl-date{font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`; `.tl-place,.tl-org{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.
- `.tl-bullets li{color:var(--prose)}`.
- `.tl-more summary{font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none}`.
- `.earlier{gap:24px}`; `.earlier-text h4{font:600 18px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.earlier-text p{color:var(--prose)}`.
- `.brands-grid{gap:24px}`; `.brand-card h3{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.brand-market{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`; `.brand-card p{color:var(--prose)}`.

**14**
- `.edge-copy p{color:var(--prose)}`; `.ops-stack figcaption{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`.
- `.vs h3{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.vs--me{background:var(--panel);border-color:var(--edge-strong)}` (no tint).
- `.vs-list li{color:var(--prose)}`; `.vs-list--yes li::before{color:var(--text);background:transparent;border:1px solid var(--edge-strong)}`.
- `.versus{gap:24px}`.

**15**
- `.step::before{content:counter(step);font:500 14px/1.5 var(--body);letter-spacing:0;color:var(--mute)}` (no leading zero).
- `.step h3{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.step p{color:var(--prose)}`.

**16**
- `.about-text p{color:var(--prose)}`; `.about-facts{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`.
- `.skill-head::before{background:var(--edge-strong)}` (the first group loses its coral bar); `.skill-group h3{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.skill-head p{color:var(--prose)}`.
- `.tool{font:500 13px/1.3 var(--body);border-color:var(--edge);background:var(--bg-2)}`.
- `.edu-grid{gap:24px}`; `.edu-meta{font-size:14px;color:var(--mute)}`; `.edu-list li{color:var(--prose)}`.

**17**
- `.faq{border-top:0}`; `.faq-item{border-bottom:0}` and `.faq-item + .faq-item{margin-top:24px}`; `.faq-q{font:600 clamp(17px,1.7vw,20px)/1.4 var(--body);padding:12px 2px}`; `.faq-body p{color:var(--prose)}`.

**18**
- `.ci-row .ic-tile{display:none}` (covered by 03's `.ic-tile{display:none}`; state it here too for the next reader).
- `.ci-text b{font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`.
- `.cf-title{font:600 22px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.contact-form label{font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`.

**19**
- `.footer-h{font:500 14px/1.5 var(--body);letter-spacing:0;text-transform:none}`; `.footer-copy,.footer-note{font:400 13px/1.5 var(--body);letter-spacing:0;text-transform:none}`.

**22**
- `.page-hero{padding:clamp(48px,8vw,112px) 0 clamp(40px,6vw,72px);border-bottom:0}`.
- `.ph-index{font-weight:500}`; `.ph-sep{display:none}` and `body[data-page="404"] .ph-sep{display:inline;color:var(--dim)}` (404.html's body carries `data-page="404"`; if it carries another value, key the rule to that).
- `.page-title{font-size:clamp(32px,6.5vw,56px);line-height:1;max-width:20ch;letter-spacing:0}`.
- `.page-hero + .section,.jumpnav + .section{padding-top:var(--section)}`.

**23**
- `.jumpnav{position:static;top:auto;z-index:auto;background:transparent;border-bottom:1px solid var(--edge-soft)}`; delete `.nav--hidden ~ main .jumpnav`.
- `.jumpnav-list{gap:24px;padding:12px var(--pad)}`.
- `.jumpnav a{min-height:44px;padding:12px 0;border:0;border-radius:0;background:transparent;font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`; hover `color:var(--text)`; `.jumpnav a[aria-current="location"]{color:var(--text);background:transparent;border:0;text-decoration:underline;text-underline-offset:8px;text-decoration-color:var(--text)}`.
- `@media (max-width:760px){.jumpnav{display:none} body.has-jump [id]{scroll-margin-top:calc(var(--nav-h) + 16px)}}`; the `max-height:500px` block becomes the same two lines.

**24**
- `.bento{gap:24px}`; `.tile{padding:28px}`.
- `.tile-title{font:600 clamp(20px,2vw,26px)/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.tile--work .tile-title,.tile-title--xl{font-size:clamp(24px,2.6vw,34px)}`.
- `.tile-meta{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`; `.tile-label{font:400 15px/1.5 var(--body);color:var(--prose)}`; `.tile-go{font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none}`.
- Delete `.tile-list`, `.tile-list b`, `.tile-chips` and the 560px `.tile-chips li:nth-child(n+3)` and `.tile--results .tile-list,.tile--exp .tile-meta` lines.
- `.tile--contact{border:1px solid var(--edge-soft)}` (it inherits the `.coral` card); `.tile--contact .btn` stays decorative.
- 560px block: `.bento{gap:16px}`; `.tile--results,.tile--dash,.tile--services,.tile--exp{padding:22px 20px}`; `.tile-title{font-size:20px}`.

**25**
- `.cta-band{padding-block:var(--section);text-align:center}`; `.cta-band.coral{background:transparent;border:0;border-radius:0}` (the section itself is not the card); `.cta-band-inner{background:var(--panel);border:1px solid var(--edge-soft);border-radius:var(--r-lg);padding:clamp(32px,5vw,56px) var(--pad);gap:16px}` (it already carries `.wrap`, so max-width and side padding come from there); `.cta-band .hook{font-size:clamp(26px,3.4vw,38px);max-width:18ch}`; `.cta-band .mono-line{font:400 14px/1.5 var(--body)}`.
- `.pager{border-top:1px solid var(--edge-soft);padding-block:24px 48px;gap:24px}`; `.pager a{padding:12px 0;border:0;border-radius:0;background:transparent}`; `.pager a:hover{background:transparent;border:0}` and `.pager a:hover b{text-decoration:underline;text-underline-offset:4px}`; `.pager small{font:400 13px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`; `.pager b{font:600 18px/1.25 var(--body);letter-spacing:0;text-transform:none}`.

**27**: remove `.hero-social a:active` from the press list (the element is gone).

**28**
- `.section.qa{padding-block:var(--section)}`; `.qa-q{font:600 clamp(22px,2.4vw,28px)/1.2 var(--body);letter-spacing:0;text-transform:none;text-wrap:balance;margin-bottom:12px}`; `.qa-a{max-width:var(--measure);color:var(--prose)}`.
- `.footer-updated{font:400 13px/1.5 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.

**29**
- `.tape rect:last-child{fill:var(--data-mute)}` (no coral bar in the tile; the chart's peak is the site's one coral data mark).
- `.provenance{display:block;margin-top:24px;max-width:var(--measure);font:400 15px/1.6 var(--body);letter-spacing:0;text-transform:none;color:var(--prose)}`.
- `.spend{margin-top:0;padding:clamp(24px,3vw,36px) clamp(18px,3vw,30px) 16px}`; `.spend-head{display:grid;gap:12px;margin-bottom:24px}`; `.spend-head h3{font:600 clamp(18px,1.8vw,22px)/1.3 var(--body);letter-spacing:0;text-transform:none;max-width:34ch}`; new `.spend-sub{font:400 14px/1.5 var(--body);color:var(--mute);max-width:var(--measure)}`.
- `.spend .axis text{letter-spacing:0}`; `.spend .lab{letter-spacing:0}`; `.spend .tip .tip-k{letter-spacing:0;text-transform:none}`; `.spend .tip text{letter-spacing:0}`.
- `.spend-foot{font:400 14px/1.5 var(--body);color:var(--mute)}`; `.spend-table summary{font:500 14px/1.2 var(--body);letter-spacing:0;text-transform:none}`; `.spend-table th{letter-spacing:0;text-transform:none}`; add `.spend-table caption{caption-side:top;text-align:left;padding:8px 10px;font-size:14px;color:var(--mute)}`.
- `.spend-rows-lead{display:none}`; in the 560px block: `.spend-rows-lead{display:block;margin-bottom:12px;font:400 14px/1.5 var(--body);color:var(--mute)}`; `.spend-rows li{grid-template-columns:52px minmax(0,1fr) auto}` (the `<small>` column is gone); `.spend-rows b{font:400 16px/1 var(--hook);letter-spacing:0;color:var(--text)}`; `.spend-rows .is-peak b{color:var(--text)}` (the bar stays coral, the number does not); delete `.spend-rows small`.
- `.ops-caps{display:none}`; `.ops-nodes rect{stroke:var(--mute)}`; `.ops-nodes .t{fill:var(--text)}`; `.ops-nodes .s{fill:var(--mute)}`; `.ops-nodes > g:nth-child(6) rect{stroke:var(--text)}` (the TEAM node: dashboard, bot, report). Delete every `.ops-legend*` rule; new `.ops-note{margin-top:clamp(28px,4vw,40px);max-width:var(--measure);color:var(--prose);font-size:15px;line-height:1.6}`.
- `.run-grid{gap:24px}`; `.run > p,.run-list li{color:var(--prose)}`.
- `.register{border-top:1px solid var(--edge-soft)}` stays; `.reg{grid-template-columns:minmax(190px,260px) minmax(0,1fr);gap:12px 40px;padding:clamp(24px,3vw,32px) 0}`; `.reg-stack{grid-column:2;justify-content:flex-start}`; `.reg-name{font:600 20px/1.25 var(--body);letter-spacing:0;text-transform:none}`; `.reg-when{font:400 14px/1.5 var(--body);letter-spacing:0;text-transform:none;margin-top:6px}`; `.reg p{color:var(--prose)}`; delete `.reg-stack li{...}` (10 covers it); 860px block `.reg{grid-template-columns:minmax(0,1fr)}` and `.reg-stack{grid-column:auto}`.
- `.stack-note{font:400 14px/1.6 var(--body);letter-spacing:0;text-transform:none;color:var(--mute)}`.
- `.flow-steps li` stays 12px mono mixed case (data strip). `a.auto-shot` phone rule: `font:500 13px/1.2 var(--body);letter-spacing:0;text-transform:none`.
- Delete `.brand-fact`.

**20**
- `.reveal{opacity:0;transform:translateY(8px);transition:opacity .5s var(--ease-out),transform .5s var(--ease-out),border-color .2s var(--ease)}`; the variants keep their names and the same 8px.
- Nothing else; counters live in main.js and only two `.val[data-count]` remain.

**21**: delete `.hero-social a` from the `:is(...)` list. Nothing else (the reduced-motion branch was already the target feel).

After the edits: `grep -c "gradient" styles.css` prints 0; `grep -c "blur(\|backdrop-filter\|mask-image\|text-shadow\|mix-blend" styles.css` prints 0; `grep -c "accent-tint\|accent-text" styles.css` prints 2 (the token lines) plus the `.cf-note.is-error` use.

---

## 6. `_tools/audit-content.py` ALLOW additions

Add one block to `ALLOW`, lower-cased exactly as the audit prints them, under this comment:

```python
    # 2026-11-03 chill pass (docs/design/2026-11-03-chill-pass.md): one big figure per page; the Home proof row,
    # stats grid, tile lists and tile chips, the hero social rail, the brand-row country tags, the Results
    # highlight grid, channel cells, gallery chips and caption figures, the About brand fact and header chips
    # were folded into sentences or removed; the figures that leave the site are listed in the spec's section 1
```

Predicted entries (every one is a baseline item that only the removed markup satisfied today; run the audit first and copy its exact strings rather than trusting this list):

```
'headline results'
'social media views'
'1b+'
'300'
'follow me'
'the human'
'team lead'
'100m+ views a month by its second month live.'
'views per month · by month two'
'across 5 platforms · dashboards in the gallery'
'across meta campaigns'
'best-performing campaign'
'lowest cost / purchase'
'purchase conversion value'
'purchases driven'
'sales tracked'
'peak performance'
'roas lift'
'tracking fix'
'peak meta roas · 4.9× blended'
'shopify rebuild + meta restructure'
'roas more than doubled.'
'1.4× →'
'stalled →'
'216'
'580'
'shopify sales in 7 days'
'on the $3.8m day'
'same shopify store, same day'
'store conversion rate'
'orders in one day'
'facebook views'
'instagram views'
'tiktok views'
'youtube views'
'pinterest views'
'pins & idea pins'
'reels & posts'
'long & short form'
'total video views'
'$3.8m in one day'
'$1.24m in 7 days'
'₱4.99m live gmv'
'₱1.66m promo sales in a month'
'₱323,075 conversion value'
'₱256,547 · 169 purchases'
'32.9m tiktok + 1.8m youtube views'
'15.8m instagram + 178k pinterest views'
'2m facebook views'
'creator accounts · views per account'
'pages · total views per page'
'sales campaigns · 6.99× average roas · 8.71× peak'
'messaging-to-purchase campaigns · 3.58× average roas'
'+268% vs. the comparison day'
'+67% vs. the previous week'
'5.34k items sold · 5.78% ctr'
'aug 2026 · +57.7% month over month'
'shopify · 99,843 orders · 10.1% conversion · +268%'
'tiktok shop · 5.34k items sold · 5.78% ctr'
'shopee · aug 2026 · 1,853 orders · +57.7% month over month'
'pixel & capi'
'affiliates'
'community'
```

Baseline items this pass deliberately keeps alive (do not add them): `peak roas` and `peak meta roas` (the Results Meta panel label and paragraph), `tiktok shop live gmv` and `shopify sales in one day` (the e-commerce cell labels), `shopee promo sales in a month` (the e-commerce paragraph), `total views` and `short-form video` (the social labels), `restore delivery on stalled ad accounts` and `facebook ads revenue` (the Meta paragraph), `creator campaign` (the social paragraph), `tiktok & youtube` and `instagram & pinterest` (caption titles with `&amp;`), `showing 9 of 9 screenshots` (the screen-reader-only status), `available for new brands` (the plain welcome line), `current` (one About chip), `paid media`, `e-commerce`, `social & creators`, `ai & search`, `hiring me`, `the usual setup` (Services kickers), the eight reel chips (`ugc`, `offer promo`, `grwm`, `product demo`, `mini vlog`, `brand film`, `fashion edit`, `style edit`), `usa · ph` (via About's `USA · Philippines` place), `singapore`, `philippines`, `automotive`, and `one person, one feedback loop.` (already in ALLOW from the 2026-11-02 pass; update that comment to say the hero hook carries it again). The confidential `ALLOW_SHA256` entries are untouched.

---

## 7. Verification

Run in this order from `D:\carl-gabriel-portfolio`, after every batch of edits, and all must pass before the pass is called done:

1. `python _tools/sync-shell.py` then `python _tools/sync-shell.py --check` exits 0 (head.html carries `styles.css?v=19`; nav and footer unchanged).
2. `node _tools/seo/build-seo.js --apply` once (the two AMA `#winners` answers changed the FAQ JSON-LD), then `node _tools/seo/build-seo.js` prints `unchanged` for every page and the root files. seo-data.json is not edited.
3. `python _tools/check-links.py` clean: ids `#proof`, `#channels`, `#gallery`, `#roas`, `#scale`, `#loop`, `#run`, `#automations`, `#winners`, `#stack`, `#services`, `#edge`, `#process`, `#about`, `#experience`, `#brands`, `#skills`, `#education`, `#faq`, `#results`, `#explore` and every tile-link id still exist; 404.html hrefs are root-absolute.
4. `node --test "_tools/tests/*.test.js"`: 25 pass (the footer date test, the FAQ-equals-JSON-LD test and the idempotence test are the ones this pass can break).
5. `python _tools/audit-content.py` prints PASS; add only what it names, under the dated comment in section 6; `python _tools/audit-content.py --selftest` still passes.
6. Line endings: `file *.html` reports CRLF for every page except ama-holdings.html (no "CRLF" for it); `git`-free byte diff: the number of `\r` bytes in each CRLF file equals its line count.
7. Stylesheet: `grep -c gradient styles.css` prints 0; no `blur(`, `backdrop-filter`, `mask-image`, `text-shadow`, `mix-blend-mode`; no rule reads `--accent-tint`; `.coral .btn--primary` no longer exists; `.nav-cta` has no scroll-state rule.
8. Copy: a Python scan for U+2013 and U+2014 over the eight pages and this spec finds nothing in visible copy; a grep for every word in `BANNED_WORDS` (`_tools/seo/validate.js` line 14) finds nothing new; the employer's name appears nowhere (the audit's sha256 list is the only reference); `.hero-role` and every `.footer-tag` read `Digital Marketing Manager · E-commerce Growth Specialist · AI Specialist` byte for byte; index.html's case tile span and ama-holdings.html's h1 are identical.
9. Figure count, by script: strip `<script>`, `<style>`, `[hidden]` panels, `<details>` bodies, `.tip` groups and the footer, then count visible text tokens with a digit per page (exempting GPT-4o, n8n, Next.js, 404). Expected: index 2, work 2, ama-holdings 16 (desktop markup; 15 once `.spend-scroll` is swapped for `.spend-rows`), results 7, services 4 (the counters are CSS; count 0 in the HTML plus 4 by inspection), about 9, contact 1, 404 1.
10. Browser, `python _tools/serve.py 8125` (8126 if taken), at 375x812 and 1440x900:
    - First screens: no digit visible on Home, Work, Results, Services, About, Contact; the AMA h1's `US$44M` and the 404 code are the only exceptions; Contact desktop may show the phone row (1).
    - Home: one coral button (hero), ghost nav pill at every scroll position, the one-number block counts up once, the brand row wraps in mixed case, the bento tiles read title, one line, link; the contact tile is a panel card with the coral button.
    - Work: underline tabs slide (`.seg-ind` follows the active tab at 375px and 1440px); the "Built with …" line reads with commas and "and"; `.gal-zoom` appears on hover or focus only; the lightbox counter still shows.
    - AMA: the jumpnav is a static text row on desktop and absent on phones; the chart head shows `US$44.2M`, the caveat sentence and the chart; hover a column: the tip shows the week and the spend only; phones show the lead line and four rows, the details summary says "See every week as a table" and opens to thirteen rows with the caption; the ops map has one stroke colour with the TEAM node white and no arrow captions; the register rows read with a plain cadence line and a "Built with" line; the Winners answer has five figures.
    - Results: no grid before the tabs; each panel shows two cards and one paragraph; switching tabs still fades the panel; filtering the gallery works with no count badges and the status is read by a screen reader only; captions carry no digits; open a lightbox item: title and detail still show the figures.
    - Services: counters 1 to 4 in the body face; kickers in sentence case; the loop in one stroke.
    - About: the pull quote above the facts; one Current chip; timeline dates in 14px body; no brand fact line; pills without a stagger.
    - Contact and 404: labels in mixed case; 404 shows one button and one sentence of links.
    - Reduced motion (DevTools emulation): nothing moves, the two counters show their final values.
    - Keyboard: Tab reaches every tab button, gallery item, chart column, details summary and the form; focus rings are visible on the underline tabs.
11. Stop the preview server you started.
