# Adnan OS · Portfolio

An original terminal-driven portfolio for **Adnan Mazharuddin Shaikh**. A procedural Three.js workstation shares its camera with a real HTML terminal: scroll to move into the screen, type a command, or use the regular navigation.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test
npm run build
npm run preview
```

Run the isolated Chromium usability suite with `npm run test:browser` (first run: `npx playwright install chromium`). It covers native Enter submission, focus after window animations, history/autocomplete, power states, all mobile routes, responsive remounts, and WebGL failure. Screenshots and failure traces stay in the ignored `test-results/` directory.

The production build is in `dist/`. It contains independent directory entrypoints for `/about/`, `/projects/`, `/research/`, `/skills/`, `/contact/`, and `/resume/`, plus a custom 404 page. These paths can be opened directly and refreshed on a static host.

**No publishing workflow has been added or triggered. Do not push until the local design has been reviewed.** This revision introduces a build step: when you eventually deploy, publish the contents of `dist/`, not the unbuilt source. The existing GitHub Pages configuration may need adjustment then.

## GitHub Pages deployment

The included workflow builds `dist/` and deploys it through GitHub Pages whenever `main` is pushed. Before the first push, open the repository’s **Settings → Pages** and select **GitHub Actions** as the publishing source. Then push the workflow and source changes. The resulting URL is `https://10adnan75.github.io/`.

## Experience

- Real 3D monitor, stand, keyboard, and mouse; no remote model downloads.
- Always-on desktop motion, with no preference switch.
- Flush, same-finish bezel power control whose symbol is the only power indicator, with a black screen-off state and preserved session.
- Blinking block caret tracks insertion position; social links include brand icons from Simple Icons.
- Shiny platinum palette, a single machined monitor enclosure, a continuous dark display, and a custom typographic `ams` mark.
- Scroll-driven camera movement; cool reflections, soft shadows, backlit keys, gentle hardware motion, and pointer parallax. Rendering is capped at 60 fps on the landing scene, becomes demand-driven inside the terminal, and pauses in hidden tabs. Physical keys react to typing; studio highlights move subtly while exploring. The screen stays steady so its controls remain easy to target.
- Coordinated content entrances, metallic button shimmer, hover glows, and responsive card motion; click targets remain stationary.
- macOS-style Terminal window with working close, minimize, maximize/restore, and a Dock launcher. Minimize preserves the session; reopening a closed window starts a fresh session on the current page.
- Double-click the title bar to maximize/restore; Escape restores a maximized window. Maximize opens a flat browser workspace; restore returns to the 3D monitor. The power switch stays reachable in both views.
- Focus retries after the restore animation so reopening a window reliably accepts typing. The prompt follows the last output in the same scrollable surface; page commands preserve scrollback, and clicking blank terminal space or command shortcuts focuses it. The site navigation remains visible while exploring.
- Power-off disables screen illumination, keyboard/stand emission, rear light, and the reflected floor glow; ambient room lighting keeps the hardware visible.
- Keyboard terminal with autocomplete, command history, aliases, safe unknown-command output, and Ctrl+L.
- Switch between Terminal and Desktop from the title bar. Desktop has page launchers, navigation, and a theme selector; switching back preserves terminal scrollback and drafts.
- Live Sorting Visualizer and Speed Typing Test previews load on demand in a closable dialog, with an external-tab option.
- Clickable navigation and command shortcuts; no terminal knowledge required.
- Filterable projects drawn from public repository descriptions, with data-driven totals and responsive card grids.
- Shared spacing and control sizes across both views; phone navigation uses page and theme selectors. Narrow, tablet, landscape, and short browser layouts are covered by the responsive audit.
- Original résumé, certificates, email, WhatsApp, and social links.
- Seven site-wide palettes: platinum, graphite, pearl, matrix, midnight, orchid, and ember. Type `theme` for the picker. Your choice stays saved locally.
- Mobile and WebGL-unavailable fallbacks use the same accessible HTML terminal.
- Semantic controls, visible keyboard focus, skip link, and concise screen-reader announcements.

## Commands

`help`, `about`, `whoami`, `projects`, `projects web`, `projects systems`, `projects research`, `research`, `skills`, `contact`, `resume`, `socials`, `ls`, `home`, `history`, `clear`, `theme platinum`, `theme graphite`, `theme pearl`, `football`.

`cd /about`, `open projects`, and `cat about.md` also work. Tab autocompletes a nonempty command; up/down arrows recall this session's history. Empty Tab retains normal keyboard navigation.

## Editing

- `js/content.js`: profile links, project descriptions, and command parsing.
- `js/script.js`: pages and terminal interactions.
- `js/scene.js`: procedural workstation and camera.
- `css/styles.css`: visual design and responsive layouts.
- `scripts/static-routes.mjs`: static route generation and asset preservation.

The legacy `myWebsite.py` and `config.json` are preserved as historical code. They are not needed by the new site and are not included in the production build. The old Flask prototype references templates that were not present in this repository.

The old project/research URLs share this domain's `/projects/` and `/research/` paths. Those routes now provide the new portfolio pages; the historical source repositories remain linked from them. The original archive URLs are also retained in `profile` for reference.

## Inspiration and content provenance

- [Bruno Simon](https://bruno-simon.com/): spatial exploration as navigation.
- [Firas’s terminal portfolio](https://github.com/firasel/Terminal-Portfolio): discoverable terminal conventions.
- [Three.js documentation](https://threejs.org/docs/): rendering and camera APIs.
- [Public repositories](https://github.com/10adnan75?tab=repositories): project names and descriptions verified September 12, 2026. No forked projects are presented as original work.

No reference implementation or visual assets were copied. Personal content comes from the original portfolio; the original documents and images remain intact. Contact details reflect that source and can be updated in `js/content.js` and the contact page.

© Adnan M Shaikh. [MIT License](LICENSE).
