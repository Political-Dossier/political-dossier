# Political Dossier

Four instruments for reading the American political sky.

## Site map

| Path | Page |
| --- | --- |
| `/` | Homepage: hero and the Index of Plates |
| `/dark-horse/` | Plate I: The Dark Horse Tracker |
| `/think-tanks/` | Plate II: The Policy Ecosystem Atlas |
| `/third-party/` | Plate III: Third-Party Performance |
| `/drafts/` | Plate IV: coming soon (placeholder, not linked) |
| `/assets/ledger.css` | Shared styles for every page |

Plain HTML and CSS. No build step, no framework, no JavaScript on the shell pages.

## Where each tool's data lives

Edit the data file to update a tool; the layout files rarely need to change.

| Tool | Data | Layout and logic |
| --- | --- | --- |
| Dark Horse Tracker | `dark-horse/data.js` (people, statuses, weekly updates log) | `dark-horse/app.js`, `tracker.css` |
| Policy Ecosystem Atlas | `think-tanks/data.js` (organizations, provinces, chronology, dispatches) | `think-tanks/app.js`, `atlas.css` |
| Third-Party Performance | `third-party/data/races.json`, `third-party/data/status.json` | `third-party/app.js`, `races.css` |

Shared pieces: `assets/chrome.css` (top bar and footer on tool pages), `assets/ledger.css` (homepage and shell pages), `assets/vendor/d3.min.js` (d3 7.9.0, used by the Atlas).

## Adding a tool

`drafts/index.html` is an empty plate with a marked slot:

```html
<!-- TOOL: ... goes here. -->
<div class="tool-slot" id="tool"> ... </div>
<!-- /TOOL -->
```

Replace the slot with the tool, or rebuild the page like the other three: Dossier top bar, the tool, Dossier footer, with its data in its own file.

## Deploying on Cloudflare Pages (free)

1. Push this folder to a GitHub repo (e.g. `political-ledger`).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: Framework preset **None**, build command **blank**, build output directory **`/`**.
4. Deploy. You get a `political-ledger.pages.dev` URL; every push to `main` redeploys automatically.
5. Custom domain: in the Pages project, Custom domains → Set up a domain.

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| `--night` | `#101827` | Sky / dark ground |
| `--parchment` | `#ECE3CD` | Ledger / light ground |
| `--star` | `#F1E9D6` | Text on dark |
| `--ink` | `#1C1A16` | Text on light |
| `--gold` | `#D2AB5F` | Accent on dark |
| `--rubric` | `#9A3722` | Accent on light |

Type: EB Garamond (headlines), Cinzel (labels, nav, buttons), Spectral (body).
