# Zulia Shavaeva

Personal site and free AI security learning guide.

Published from `main`, root folder, using GitHub Pages.
URL: https://zuliaszu.github.io/zuliazu.github.io/

## Updating the site

- Edit `content/site.json`, then run `python3 build.py`.
- `cv/index.html` is hand-maintained. Regenerate the PDF after changes.
- `ai-security-career-platform/` contains the generated learning guide. Sync it from the platform build output; do not edit generated HTML.
- The embedded quiz reads `quiz/quiz.js`; plan persistence uses `ai-security-career-platform/embed/plan.js`.
- Links within the site are relative so the quiz, resources and plans work under a project-site URL.
- `head-inline.js` sets dark mode unless a visitor has saved a light-mode choice.

No customer names, personal contact details or internal identifiers belong in this repository. Contact is through LinkedIn.
