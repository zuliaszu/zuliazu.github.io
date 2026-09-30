#!/usr/bin/env python3
"""Folds the mirrored AI Security Career Platform into zuliaszu.github.io.

Run after build.py and after the mirror/sync step:
    /usr/bin/python3 integrate_guide.py            # transform in place
    /usr/bin/python3 integrate_guide.py --check     # report only, no writes

Idempotent: every injected region is wrapped in zs: markers and rewritten on each
run. Page content, quiz scoring and plan semantics are never touched; only the
head, the top navigation, a context strip, a footer line and the script tags.
"""
import argparse, pathlib, re, sys, hashlib, json, html
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from journey_navigation import navigation

ROOT = pathlib.Path(__file__).resolve().parent
GUIDE = ROOT / "ai-security-career-platform"
SITE = json.loads((ROOT / "content/site.json").read_text())
NAME = SITE["name"]
ASSETS = ("fonts.css", "site.css", "theme.css", "guide.css", "head-inline.js", "theme-btn.html", "site.js", "fx.js")

ANALYTICS = SITE.get("analytics", {})
GA_ID = str(ANALYTICS.get("ga4_measurement_id", "")).strip() if ANALYTICS.get("enabled") else ""


def analytics_tag(rel):
    """Same opt-in loader build.py emits; empty when analytics is off."""
    if not GA_ID:
        return ""
    return '<script>window.ZS_ANALYTICS=%s;</script><script src="%sanalytics.js" defer></script>' % (json.dumps({"id": GA_ID}), rel)


M = lambda k: ("<!-- zs:%s -->" % k, "<!-- /zs:%s -->" % k)
block = lambda k, body: M(k)[0] + body + M(k)[1]


def marked(key):
    s, e = M(key)
    return re.compile(re.escape(s) + ".*?" + re.escape(e), re.S)


def put(text, key, body, anchor_re, where):
    """Replace an existing marked region, else insert at the anchor."""
    new = block(key, body)
    pat = marked(key)
    if pat.search(text):
        return pat.sub(lambda m: new, text, count=1)
    m = anchor_re.search(text)
    if not m:
        raise SystemExit("anchor for %s not found" % key)
    if where == "before":
        return text[:m.start()] + new + text[m.start():]
    if where == "after":
        return text[:m.end()] + new + text[m.end():]
    return text[:m.start()] + new + text[m.end():]   # replace


# --- page inventory -----------------------------------------------------------
def pages():
    out = [(p, 0) for p in sorted(GUIDE.glob("*.html"))]
    for sub in ("paths", "learn", "routes"):
        out += [(p, 1) for p in sorted((GUIDE / sub).glob("*.html"))]
    return out


def label_of(path, title):
    rel = path.relative_to(GUIDE).as_posix()
    if rel == "index.html":
        return "Guide home and diagnostic", "guide"
    if rel == "plan.html":
        return "My plan", "plan"
    if rel.startswith("routes/"):
        return "Learning routes", "routes"
    if rel == "learn/index.html":
        return "Learn hub", "learn"
    head = title.split(" | ")[0].strip() or rel
    if rel.startswith("paths/"):
        return head, "paths"
    return head, "learn"


def crumb(path, root, g, label, key):
    return navigation(g, guide=True)


def header(root, g, key, theme_btn):
    links = [("%sroutes/index.html" % g, "Start learning", "routes"), ("%sindex.html#paths" % g, "Career paths", "guide"),
             ("%spay/" % root, "Pay &amp; careers", "pay"),
             ("%slearn/index.html" % g, "Skill library", "learn"),
             ("%splan.html" % g, "My plan", "plan")]
    nav = "".join('<a href="%s"%s>%s</a>' % (h, ' class="on"' if k == key else "", t) for h, t, k in links)
    return ('<header class="top zs-top"><div class="in">'
            '<a class="brand" href="%s">%s</a>'
            '<a class="zs-back" href="%s" aria-label="Back to %s\'s home page">&larr; Back to Zulia</a>'
            '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>'
            '<nav id="nav" aria-label="Site">%s<a class="btn" href="%squiz/">Career quiz</a>%s</nav>'
            '</div></header>' % (root, NAME, root, NAME.split()[0], nav, root, theme_btn))


def head_pre(rel, head_inline):
    return ('<meta name="theme-color" content="#0a0f1c">'
            '<link rel="icon" href="%simg/favicon.svg" type="image/svg+xml">'
            '<link rel="stylesheet" href="%sfonts.css">'
            '<link rel="stylesheet" href="%ssite.css">'
            '<link rel="stylesheet" href="%stheme.css">'
            '<script>%s</script>' % (rel, rel, rel, rel, head_inline))


def transform(path, depth, head_inline, theme_btn):
    text = original = path.read_text()
    text = re.sub(r'<html([^>]*)>', lambda m: '<html' + re.sub(r' data-theme="[^"]*"', '', m.group(1)) + ' data-theme="dark">', text, count=1)
    rel = "../" * (depth + 1)          # repo root from this page
    g = "../" * depth                  # guide root from this page
    root = rel                         # personal home page
    title = (re.search(r"<title>(.*?)</title>", text, re.S) or [None, ""])[1]
    label, key = label_of(path, title)

    # body gets the scope class the whole skin hangs off
    def body_tag(m):
        attrs = m.group(1)
        cls = re.search(r'class="([^"]*)"', attrs)
        if not cls:
            return '<body class="guide"%s>' % attrs
        if "guide" in cls.group(1).split():
            return m.group(0)
        return "<body%s>" % (attrs[:cls.start(1)] + cls.group(1) + " guide" + attrs[cls.end(1):])
    text = re.sub(r"<body([^>]*)>", body_tag, text, count=1)
    text = text.replace('<nav class="ltabs">', '<nav class="ltabs" aria-label="On this page">')

    canonical = SITE["site_url"] + "/" + path.relative_to(ROOT).as_posix()
    metadata = '<link rel="canonical" href="%s"><meta property="og:url" content="%s">' % (canonical, canonical)
    text = put(text, "head", head_pre(rel, head_inline) + metadata, re.compile(r'<style>|<link rel="stylesheet" href="[^"]*assets/product.css">', re.S), "before")
    text = put(text, "guide-css", '<link rel="stylesheet" href="%sguide.css"><noscript><style>body.guide .zs-top nav{display:flex;position:static;flex-wrap:wrap;flex-direction:row}body.guide .zs-top .in{flex-wrap:wrap}body.guide .menu-btn{display:none}</style></noscript>' % rel,
               re.compile(r"</head>", re.S), "before")

    hdr = header(root, g, key, theme_btn)
    text = put(text, "header", hdr, re.compile(r'<header class="top">.*?</header>', re.S), "replace")

    text = put(text, "crumb", crumb(path, root, g, label, key),
               marked("header"), "after")

    page_rel = path.relative_to(GUIDE).as_posix()
    extra = ''
    if page_rel.startswith('paths/'):
        role = path.stem
        pay_link = '<h2>UK pay for this career</h2><p><a href="../../pay/#'+role+'">Open the profession-specific salary guide</a>. Check the source dates and salary basis before comparing offers.</p>'
        text = put(text, 'role-pay', pay_link, re.compile(r'<section id="roles">'), 'after')
        extra = '<p class="journey-related"><a href="../routes/index.html#step-0">New to AI security? Start at Step 0</a> · <a href="../../pay/#'+role+'">UK pay for this career</a> · <a href="../index.html#paths">All career paths and routes</a></p>'
    elif page_rel == 'routes/network-to-ai-security.html':
        extra = '<p class="journey-related"><a href="../../pay/#network">UK network-security pay</a> · <a href="../index.html#paths">Compare AI security careers</a> · <a href="index.html#step-0">Step 0: foundations</a></p>'
    elif page_rel == 'routes/leadership.html':
        extra = '<p class="journey-related"><a href="../../pay/#leadership">UK security leadership pay</a> · <a href="../paths/grc.html">Governance and risk career</a> · <a href="../index.html#paths">All career paths and routes</a></p>'
    if extra:
        text = put(text, "journey-related", extra, re.compile(r'</main>', re.S), 'before')

    # footer: one extra line inside the guide's existing footer, no second landmark
    foot = ('<p class="zs-foot"><a href="%s">%s: home</a><span class="sep">&middot;</span>'
            '<a href="%scv/">CV</a><span class="sep">&middot;</span>'
            '<a href="%squiz/">Career quiz</a><span class="sep">&middot;</span>'
            '<a href="%sroutes/index.html">Learning routes</a><span class="sep">&middot;</span>'
            '<a href="%s" rel="noopener">LinkedIn</a></p>' % (root, NAME, root, root, g, html.escape(SITE["linkedin"], quote=True)))
    text = put(text, "foot", foot, re.compile(r"</footer>", re.S), "before")

    scripts = ('<script src="%ssite.js" defer></script><script src="%sfx.js" defer></script>' % (rel, rel))
    text = put(text, "scripts", scripts, re.compile(r"</body>", re.S), "before")
    text = put(text, "analytics", analytics_tag(rel), re.compile(r"</body>", re.S), "before")

    # fx.js assembles ".hero h1" word by word unless the heading already has an
    # element child; wrapping the text keeps the guide hero static.
    def wrap_h1(m):
        inner = m.group(2)
        if "zs-h1" in inner or "<" in inner:
            return m.group(0)
        return "%s<span class=\"zs-h1\">%s</span></h1>" % (m.group(1), inner)
    text = re.sub(r'(<div class="hero">.{0,400}?<h1>)(.*?)</h1>', wrap_h1, text, count=1, flags=re.S)

    def version_asset(m):
        kind, url = m.group(1), m.group(2).split("?")[0]
        asset = (path.parent / url).resolve()
        if asset.is_file() and asset.suffix in (".css", ".js"):
            digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:10]
            return f'{kind}="{url}?v={digest}"'
        return m.group(0)
    text = re.sub(r'(href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"', version_asset, text)
    return text, text != original


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report without writing")
    args = ap.parse_args()

    missing = [a for a in ASSETS if not (ROOT / a).exists()]
    if missing:
        print("warning: missing shared assets in repo root: %s" % ", ".join(missing), file=sys.stderr)
    head_inline = (ROOT / "head-inline.js").read_text().strip()
    theme_btn = (ROOT / "theme-btn.html").read_text().strip()

    items = pages()
    if not items:
        raise SystemExit("no guide pages found under %s" % GUIDE)
    changed = 0
    for path, depth in items:
        out, diff = transform(path, depth, head_inline, theme_btn)
        if diff and not args.check:
            path.write_text(out)
        changed += bool(diff)
    verb = "would change" if args.check else "rewrote"
    print("integrate_guide: %d guide pages, %s %d" % (len(items), verb, changed))


if __name__ == "__main__":
    main()
