# Zulia Shavaeva

Personal site and free AI security learning guide.

Published from `main`, root folder, using GitHub Pages.
URL: https://zulia.uk/

## Updating the site

- Edit `content/site.json`, then run `python3 build.py`. This also runs `integrate_guide.py` to apply the shared navigation and theme to the guide.
- `cv/index.html` is hand-maintained. Regenerate the PDF after changes.
- `ai-security-career-platform/` contains the generated learning guide. Sync it from the platform build output, then run `python3 integrate_guide.py`; do not edit generated HTML. The platform sync script does this automatically.
- `guide.css` keeps the guide in the same visual style as the homepage, with a persistent return link and no background animation.
- `fonts.css` and `fonts/` self-host the three fonts; their SIL Open Font licences are included. No third-party requests are needed to render the site.
- WebP images are used in the page. The original portrait JPEG remains for social preview metadata. Headings and text are never hidden by entrance effects.
- The embedded quiz reads `quiz/quiz.js`; plan persistence uses `ai-security-career-platform/embed/plan.js`.
- Links within the site are relative so the quiz, resources and plans work under a project-site URL.
- `head-inline.js` sets dark mode unless a visitor has saved a light-mode choice.

No customer names, personal contact details or internal identifiers belong in this repository. Contact is through LinkedIn.

## Checks

Run `python3 -m unittest discover -s tests -v` after building. These checks cover the shared guide shell, home links at every directory depth, idempotent rebuilds, dark-mode fallback, local fonts and the portrait size budget.

Role paths use a learning-first template from the source platform. Pay appears only in expandable source rows with location and recorded experience, never as a blended salary range. Shared guide CSS and helper scripts live in `ai-security-career-platform/assets/`; asset hashes refresh browser caches when a file changes.
