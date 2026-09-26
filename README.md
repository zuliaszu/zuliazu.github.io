# zuliaszu.github.io

Personal site of Zulia Shavaeva, served by GitHub Pages from `main` (root).

- `content/site.json` is the copy. Edit it, then run `/usr/bin/python3 build.py` to regenerate `index.html` and `quiz/index.html`.
- `cv/index.html` is hand-maintained. Regenerate the PDF after editing it (print the page to A4; the print stylesheet is in the file).
- `quiz/quiz.js` and `quiz/quiz.css` are copied from the career platform build (`docs/embed/` in github.com/zuliaszu/ai-security-career-platform). Copy them again after a platform rebuild. `quiz/quiz-skin.css` restyles the quiz to this site.
- `site.css`, `site.js`: design system and the small amount of behaviour (menu, reveal on scroll).
- `theme.css`, `fx.js`, `head-inline.js`, `theme-btn.html`: dark theme (default, warm charcoal and clay), the toggle in the nav (localStorage `zs_theme`), and the hero canvas (agent graph, pauses off-screen, static under reduced motion).
- `unlock.js`, `unlock.css`: the four-step route under the hero. Steps 2 to 4 open once the quiz has written `aiscp_runs` (shared localStorage with the platform, same origin). `window.ZS.unlockState()` exposes the result.
- `content/about.json`: positions, topics and pull quote for the "How I think about security" section, drawn from Zulia's own scripts.

Rules: no customer or client names, no phone or email, no employer-internal terms. Views are Zulia's own.
