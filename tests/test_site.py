"""Build invariants. Run: python3 -m unittest discover -s tests -v"""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path
import unittest
import json
import re

ROOT = Path(__file__).resolve().parents[1]

class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class SiteTests(unittest.TestCase):
    def test_guide_is_unified_and_idempotent(self):
        spec = importlib.util.spec_from_file_location('integrate', ROOT / 'integrate_guide.py')
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        pages = mod.pages()
        self.assertEqual(len(pages), 33)
        for path, depth in pages:
            with self.subTest(page=str(path.relative_to(ROOT))):
                text = path.read_text()
                rendered, changed = mod.transform(path, depth,
                    (ROOT/'head-inline.js').read_text().strip(),
                    (ROOT/'theme-btn.html').read_text().strip())
                self.assertFalse(changed, 'Run build.py after editing integration code')
                self.assertEqual(rendered, text)
                tags = Tags(text).tags
                html = next(a for t,a in tags if t == 'html')
                self.assertEqual(html.get('data-theme'), 'dark')
                headers = [a for t,a in tags if t == 'header']
                self.assertEqual(len(headers), 1)
                self.assertFalse(any(t == 'canvas' for t,a in tags))
                back = [a for t,a in tags if t == 'a' and 'zs-back' in a.get('class','').split()]
                self.assertEqual(len(back), 1)
                self.assertEqual((path.parent / back[0]['href']).resolve(), ROOT)
                for tag, attrs in tags:
                    if tag == 'script' or (tag == 'link' and attrs.get('rel') in ('stylesheet','preload')):
                        link = attrs.get('src') or attrs.get('href')
                        if link:
                            self.assertFalse(link.startswith(('http:', 'https:')), link)
                            self.assertTrue((path.parent / link.split('?')[0]).is_file(), link)
    def test_homepage_stays_visible_and_lightweight(self):
        html = (ROOT/'index.html').read_text()
        self.assertNotIn('fonts.googleapis.com', html)
        self.assertIn('data-theme="dark"', html)
        self.assertIn('img/zulia.webp', html)
        self.assertLess((ROOT/'img/zulia.webp').stat().st_size, 65000)
        self.assertNotIn('s.style.opacity = "0"', (ROOT/'fx.js').read_text())
        self.assertNotIn('.rv{opacity:0', (ROOT/'site.css').read_text())
    def test_personal_intro_and_photo(self):
        html = (ROOT/'index.html').read_text()
        data = json.loads((ROOT/'content/site.json').read_text())
        self.assertEqual(data['title'], 'AI Security Leader at AWS')
        self.assertIn('AI security leader at AWS', html)
        self.assertIn('Generative AI Innovation Center in EMEA', html)
        self.assertNotIn('Based in Manchester', html)
        self.assertNotIn('Working across the UK', html)
        self.assertNotIn('photo_caption', data['hero'])
        hero = html.split('<div class="hero">',1)[1].split('<div id="journey">',1)[0]
        self.assertNotIn('<figcaption', hero)
        self.assertIn('Connect on LinkedIn', hero)
        self.assertIn(data['linkedin'], hero)
    def test_personal_journey_quiz_first_and_honest_privacy(self):
        data=json.loads((ROOT/'content/site.json').read_text())
        self.assertEqual(data['hero']['cta_primary_href'],'quiz/')
        html=(ROOT/'index.html').read_text()
        hero=html.split('<div class="hero">',1)[1].split('<div id="journey">',1)[0]
        for text in ['giving back', 'developer', 'Eight questions', 'Completely free', 'No account or email needed', 'saved only in this browser', 'Start with the basics']:
            self.assertIn(text,hero)
        self.assertNotIn('no data saved',hero.lower())
        self.assertNotIn('16 questions',hero)
        self.assertLess(hero.index('Take the career quiz'),hero.index('Connect on LinkedIn'))
        self.assertLess(hero.index('Connect on LinkedIn'),hero.index('Start with the basics'))
        self.assertEqual(data['help'][0]['href'],'ai-security-career-platform/routes/index.html#step-0')
    def test_all_pages_have_correct_profile_and_canonical(self):
        profile = json.loads((ROOT/'content/site.json').read_text())['linkedin']
        pages = [p for p in ROOT.rglob('*.html') if p.name != 'theme-btn.html']
        self.assertEqual(len(pages), 37)
        for p in pages:
            with self.subTest(page=p):
                tags = Tags(p.read_text()).tags
                canonical = [a.get('href') for t,a in tags if t=='link' and a.get('rel')=='canonical']
                self.assertEqual(len(canonical),1)
                self.assertTrue(canonical[0].startswith('https://zulia.uk/'))
                linked = [a['href'] for t,a in tags if t=='a' and 'linkedin.com/' in a.get('href','')]
                self.assertTrue(linked)
                self.assertTrue(all(u==profile for u in linked))
    def test_resource_copy_has_no_unsubstantiated_ranking(self):
        for p in (ROOT/'ai-security-career-platform/paths').glob('*.html'):
            with self.subTest(page=p):
                text = p.read_text()
                for phrase in ('the best single exercise','The shortest free route','The clearest research writeup','the fastest way to internalise','most job postings and interviews'):
                    self.assertNotIn(phrase,text)

    def test_network_route_and_quiz_release_together(self):
        guide=ROOT/'ai-security-career-platform'
        route=guide/'routes/network-to-ai-security.html'
        self.assertTrue(route.is_file())
        self.assertIn('network-to-ai-security.html',(guide/'routes/index.html').read_text())
        self.assertIn('network-to-ai-security',(guide/'assets/extra-routes.js').read_text())
        quiz=(ROOT/'quiz/quiz.js').read_bytes()
        self.assertEqual(quiz,(guide/'embed/quiz.js').read_bytes())
        text=quiz.decode()
        self.assertIn('Network engineering or network security',text)
        self.assertIn('routes/network-to-ai-security.html',text)
        self.assertIn('"id": "R-role-netsec"',text)

    def test_browse_entry_includes_network_route_without_quiz(self):
        quiz=(ROOT/'quiz/index.html').read_text()
        self.assertIn('Explore career paths',quiz)
        self.assertNotIn('See the seven roles',quiz)
        browse=(ROOT/'ai-security-career-platform/index.html').read_text().split('<section id="paths">',1)[1].split('</section>',1)[0]
        self.assertIn('data-background-route="network-to-ai-security"',browse)
        self.assertIn('routes/network-to-ai-security.html',browse)
        self.assertEqual(browse.count('class="path-card"'),7)

    def test_font_licenses_shipped(self):
        for name in ('figtree', 'jetbrains-mono', 'space-grotesk'):
            self.assertTrue((ROOT/'fonts'/f'{name}-latin.woff2').is_file())
            self.assertIn('SIL OPEN FONT LICENSE', (ROOT/'fonts'/f'{name}-OFL.txt').read_text())

if __name__ == '__main__':
    unittest.main()
