"""Build invariants. Run: python3 -m unittest discover -s tests -v"""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path
import unittest

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
        self.assertEqual(len(pages), 24)
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
    def test_font_licenses_shipped(self):
        for name in ('figtree', 'jetbrains-mono', 'space-grotesk'):
            self.assertTrue((ROOT/'fonts'/f'{name}-latin.woff2').is_file())
            self.assertIn('SIL OPEN FONT LICENSE', (ROOT/'fonts'/f'{name}-OFL.txt').read_text())

if __name__ == '__main__':
    unittest.main()
