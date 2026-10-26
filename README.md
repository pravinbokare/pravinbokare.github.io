# Pravin Bokare · Portfolio

**Live site → https://pravinbokare.github.io**

Personal site of **Pravin Bokare**, Data Engineer (Databricks · Spark · Kafka · Azure · AWS · GenAI), open to Data Engineer and Forward Deployed Engineer roles.

Hand-built with plain HTML, CSS and JavaScript plus [three.js](https://threejs.org) for the particle field. There's no framework and no build step; GitHub Pages serves the files as they are.

## What's on the page

- **3D particle field** that reacts to the cursor and morphs into a new shape per section: data core, DNA helix, lakehouse layers, wave, torus knot, wormhole, cube, galaxy
- **Live dashboards:** a stream monitor in the hero and a lakehouse-ops panel with live counters, sparkline, job log and gauges (simulated telemetry, labelled as such)
- **Lakehouse architecture flow:** an auto-playing, clickable bronze → silver → gold pipeline
- **Systems I've shipped:** a scroll-driven horizontal gallery
- **Résumé agent:** a floating chat widget that answers from the résumé with bullet points, follow-up actions and a trace. It runs fully in the browser with no LLM calls.
- **Terminal:** `help`, `neofetch`, `SELECT * FROM skills;`, `ask <question>`, `sudo hire pravin`
- **Stack sphere** (drag to spin) and **certification flip cards** with official badges
- Command palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>), keys <kbd>1</kbd>–<kbd>8</kbd> to jump between sections, and support for `prefers-reduced-motion`

## Structure

```
index.html, style.css, main.js   the site
badges/                          certification badge images
assets/                          résumé PDF + GitHub profile banner
.nojekyll                        serve files as-is on GitHub Pages
```

## Editing

- **Agent answers:** edit `KB` (answers) and `KB_ACTIONS` (follow-up buttons) in `main.js`
- **Contact links and résumé path:** edit `CONFIG` at the top of `main.js`
- **Everything else:** edit the text in `index.html`

## Run locally

```bash
python -m http.server 8000   # then open http://localhost:8000
```
