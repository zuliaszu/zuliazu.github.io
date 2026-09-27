"""Static guide shortcuts, built from the platform's shared starting-point list."""
import html, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def navigation(base, guide=False):
    starts=json.loads((ROOT/'ai-security-career-platform/career-starts.json').read_text())
    links=[(base+x['href'],x['nav_label']) for x in starts]
    if not guide:
        links += [(base+'index.html#paths','Career paths'),(base+'plan.html','My plan')]
    return '<nav class="journey-nav" aria-label="Learning guide"><div>' + ''.join('<a href="'+html.escape(url)+'">'+html.escape(label)+'</a>' for url,label in links) + '</div></nav>'
