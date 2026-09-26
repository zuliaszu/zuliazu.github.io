#!/usr/bin/env python3
"""Builds index.html and quiz/index.html from content/site.json + site.css. cv/index.html is hand-maintained.
Run: /usr/bin/python3 build.py"""
import json, pathlib, html, datetime, runpy, hashlib, re
ROOT = pathlib.Path(__file__).resolve().parent
D = json.loads((ROOT / "content" / "site.json").read_text())
esc = lambda s: html.escape(str(s), quote=True)
def fonts(rel):
    return (f'<link rel="preload" href="{rel}fonts/figtree-latin.woff2" as="font" type="font/woff2" crossorigin>'
            f'<link rel="preload" href="{rel}fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>'
            f'<link rel="stylesheet" href="{rel}fonts.css">')
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
YEAR = datetime.date.today().year
THEME_BTN = (ROOT / 'theme-btn.html').read_text().strip()
OPT = {n: (ROOT / n).exists() for n in ("theme.css", "fx.js", "unlock.css", "unlock.js")}
ABOUT = json.loads((ROOT / "content" / "about.json").read_text()) if (ROOT / "content" / "about.json").exists() else {}
HEAD_INLINE = (ROOT / "head-inline.js").read_text().strip() if (ROOT / "head-inline.js").exists() else ""

def asset_versions(text, directory):
    def replace(m):
        attr, url = m.group(1), m.group(2).split("?")[0]
        asset = (directory / url).resolve()
        if asset.is_file():
            digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:10]
            return f'{attr}="{url}?v={digest}"'
        return m.group(0)
    return re.sub(r'(href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"', replace, text)

def platform_url(rel=""):
    return rel + D["platform"]

def head(title, desc, rel, extra="", route=""):
    canonical = D["site_url"] + "/" + route
    return (f'<!doctype html><html lang="en-GB" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title>'
            f'<meta name="description" content="{esc(desc)}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:image" content="{esc(D["site_url"])}/img/zulia.jpg"><meta property="og:url" content="{esc(canonical)}"><link rel="canonical" href="{esc(canonical)}"><meta name="theme-color" content="#0a0f1c">'
            f'<link rel="icon" href="{rel}img/favicon.svg" type="image/svg+xml">{fonts(rel)}<link rel="stylesheet" href="{rel}site.css">'
            + (f'<link rel="stylesheet" href="{rel}theme.css">' if OPT["theme.css"] else "") + (f'<link rel="stylesheet" href="{rel}unlock.css">' if OPT["unlock.css"] else "")
            + (f"<script>{HEAD_INLINE}</script>" if HEAD_INLINE else "") + '<noscript><style>.top nav{display:flex!important;position:static;flex-wrap:wrap;flex-direction:row}.top .in{flex-wrap:wrap}.menu-btn{display:none!important}</style></noscript>' + f'{extra}</head><body><canvas id="fx" aria-hidden="true"></canvas>')

def top(rel, on):
    links = [(f"{rel}ai-security-career-platform/routes/index.html", "Start learning", "help"), (f"{rel}pay/", "Pay & careers", "pay"), (f"{rel}#about", "About", "about"), (f"{rel}#talks", "Talks", "talks"), (f"{rel}cv/", "CV", "cv"), (D["linkedin"], "LinkedIn", "li")]
    nav = "".join(f'<a href="{esc(h)}"{" class=on" if k == on else ""}{" rel=noopener" if h.startswith("http") else ""}>{esc(t)}</a>' for h, t, k in links)
    return (f'<a class="skip" href="#main">Skip to content</a><header class="top"><div class="in"><a class="brand" href="{rel or "./"}">{esc(D["name"])}</a>'
            f'<button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button><nav id="nav" aria-label="Site">{nav}<a class="btn" href="{rel}quiz/">Career quiz</a>' + THEME_BTN + '</nav></div></header>')

def foot(rel):
    return (f'<footer><div class="wrap in"><span>{esc(D["footer_line"])} {YEAR}.</span><span><a href="{esc(D["linkedin"])}" rel="noopener">LinkedIn</a> &middot; <a href="{rel}cv/">CV</a> &middot; <a href="{esc(platform_url(rel))}routes/index.html">Free AI and security guide</a></span></div></footer>'
            f'<script src="{rel}site.js" defer></script>' + (f'<script src="{rel}fx.js" defer></script>' if OPT["fx.js"] else "") + (f'<script src="{rel}unlock.js" defer></script>' if OPT["unlock.js"] else "") + f'<script src="{rel}ai-security-career-platform/assets/extra-routes.js" defer></script></body></html>')

H = D["hero"]
INTRO = "".join(f"<p>{esc(p)}</p>" for p in H["sub"].split("\n\n"))
PAGES = (f'''<section id="pages"><div class="sec-head rv"><div><p class="eyebrow">Links</p><h2>{esc(D["pages_head"])}</h2></div><p>{esc(D.get("pages_intro",""))}</p></div>
<ul class="pages rv">{"".join(f'<li><a href="{esc(p["href"])}"{" rel=noopener" if p["href"].startswith("http") else ""}><b>{esc(p["title"])}</b><span class="d">{esc(p["desc"])}</span><span class="arr">{ARROW}</span></a></li>' for p in D["pages"])}</ul></section>''') if D.get("pages") else ''
THINK = (f'''<section id="think"><div class="sec-head rv"><div><p class="eyebrow">In practice</p><h2>{esc(ABOUT.get("think_head",""))}</h2></div><p>{esc(ABOUT.get("think_intro",""))}</p></div>
<ol class="beliefs rv">{"".join(f'<li><span class="k">0{i+1}</span><div><h3>{esc(x["title"])}</h3><p>{esc(x["body"])}</p></div></li>' for i, x in enumerate(ABOUT.get("beliefs", [])))}</ol>
</section>''') if ABOUT.get('beliefs') else ''
TOPICS = (f'<div class="speaking-topics rv"><h3>{esc(ABOUT.get("topics_head", "What I talk about"))}</h3><ul>' + ''.join(f'<li><b>{esc(t["name"])}</b><p>{esc(t["line"])}</p></li>' for t in ABOUT.get('topics', [])) + '</ul></div>') if ABOUT.get('topics') else ''
home = head(f'{D["name"]}, {D["title"]}', D["meta_description"], "") + top("", "home") + f'''
<main id="main" class="wrap">
<div class="hero"><div class="rv in"><p class="eyebrow">{esc(H["eyebrow"])}</p><h1>{esc(H["h1"])}</h1><span id="typed" class="typed" data-phrases='{esc(json.dumps(H["typed_phrases"]))}' aria-hidden="true"></span><div class="sub">{INTRO}</div>
<div class="hero-actions"><h2>{esc(H["quiz_prompt"])}</h2><p class="quiz-explanation">{esc(H["quiz_explanation"])}</p>
<div class="ctas"><a class="btn amber" href="{esc(H["cta_primary_href"])}">{esc(H["cta_primary"])} {ARROW}</a><a class="btn ghost hero-linkedin" href="{esc(D["linkedin"])}" rel="noopener">{esc(H["cta_secondary"])}</a></div>
<p class="hero-beginner"><a href="{esc(H["beginner_href"])}">{esc(H["beginner_label"])} &rarr;</a></p>
<p class="hero-free">{esc(H["cta_primary_note"])}</p><details class="hero-privacy"><summary>Privacy and paid resources</summary><p>{esc(H["privacy_note"])}</p></details></div></div>
<figure class="pic rv in"><img src="img/zulia.webp" width="800" height="837" alt="Zulia Shavaeva, portrait by a lake" fetchpriority="high"></figure></div>
<div data-route-summary data-route-base="ai-security-career-platform/routes/" hidden></div><div id="journey"></div>

<section id="help"><div class="sec-head rv"><div><p class="eyebrow">Start here</p><h2>{esc(D["help_head"])}</h2></div><p>{esc(D["help_intro"])}</p></div>
<div class="help rv">{"".join(f'<a href="{esc(h["href"])}"><span class="n">{i+1}</span><div><h3>{esc(h["title"])}</h3><p>{esc(h["body"])}</p><span class="go">{esc(h["link_label"])} &rarr;</span></div>{"<span class=btn>Start &rarr;</span>" if h.get("cta") else ""}</a>' for i, h in enumerate(D["help"]))}</div></section>

<section id="about"><div class="about"><figure class="pic rv"><img src="img/outdoors.webp" width="900" height="1200" alt="Zulia standing in front of a mossy cliff with a waterfall" loading="lazy"></figure>
<div class="text rv"><p class="eyebrow">About me</p><h2>{esc(D["about_head"])}</h2>{"".join(f"<p>{esc(x)}</p>" for x in D["about"])}
<div class="links"><a class="btn" href="cv/">Read the CV</a><a class="btn ghost" href="{esc(D["linkedin"])}" rel="noopener">LinkedIn</a></div></div></div></section>

<div class="facts rv">{"".join(f'<div><b>{esc(x["figure"])}</b><span>{esc(x["label"])}</span></div>' for x in D["proof"])}</div>
{THINK}
<section id="talks"><div class="talks"><div class="rv"><p class="eyebrow">{esc(D["talks_head"])}</p><h2>{esc(D.get("talks_h2","Talks, workshops, and a community I lead"))}</h2><p style="margin-top:16px;color:var(--ink-2);font-size:18px">{esc(D["talks_intro"])}</p>
<ul class="talk-list">{"".join(f'<li><b>{esc(t["title"])}</b><span>{esc(t["where"])}</span><span style="color:var(--ink-2)">{esc(t["note"])}</span></li>' for t in D["talks"])}</ul></div>
<figure class="pic rv"><img src="img/talk-1.webp" width="562" height="750" alt="Zulia speaking to an audience beside a screen titled Critical AWS Security Vulnerabilities" loading="lazy"><figcaption>{esc(D["talk_photo_caption"])}</figcaption></figure></div>
{TOPICS}
<p class="rv" style="max-width:62ch;margin:40px 0 0;color:var(--ink-2)">{esc(D["community"])} <a href="https://www.meetup.com/aws-cloud-women-manchester/" rel="noopener">AWS Cloud Women Manchester on Meetup</a>.</p></section>

{PAGES}

<section id="cv"><div class="band rv"><div><h2>{esc(D["cv_band"]["h2"])}</h2><p>{esc(D["cv_band"]["p"])}</p></div><div class="btns"><a class="btn" href="cv/">{esc(D["cv_band"]["btn"])}</a><a class="btn ghost" href="{esc(D["linkedin"])}" rel="noopener">{esc(D["cv_band"]["btn2"])}</a></div></div></section>
</main>''' + foot("")
(ROOT / "index.html").write_text(asset_versions(home, ROOT))

Q = D["quiz_page"]
quiz_css = '<link rel="stylesheet" href="../quiz/quiz-skin.css">'  # order: quiz.css (platform), site.css, theme.css, unlock.css, then the skin
quiz = (head(Q["title"], Q["meta_description"], "../", quiz_css, route="quiz/").replace('<link rel="stylesheet" href="../site.css">', '<link rel="stylesheet" href="../quiz/quiz.css"><link rel="stylesheet" href="../site.css">', 1) + top("../", "quiz") +
        f'''<main id="main" class="wrap"><div id="hero" class="qhero rv in"><p class="eyebrow">Eight questions, free, no signup</p><h1>{esc(Q["h1"])}</h1><p class="sub">{esc(Q["sub"])}</p>
<div class="ctas"><a class="btn amber" href="#quiz" data-start>Start the quiz {ARROW}</a><a class="btn ghost" href="{esc(platform_url("../"))}#paths">See the seven roles first</a></div>
<p class="small" style="color:var(--mute);font-size:14.5px;margin:14px 0 0">{esc(Q["note"])}</p></div>
<p class="quiz-alternative"><a href="../ai-security-career-platform/routes/index.html">New to AI or not looking for a security role? Choose a learning route without a quiz.</a></p><div id="quiz" class="card"></div></main>''' + foot("../").replace("</body>", f'<script>window.AISCP_BASE={json.dumps(platform_url("../"))};</script><script src="quiz.js" defer></script><script>window.AISCP_REL={json.dumps(platform_url("../"))};</script><script src="../ai-security-career-platform/embed/plan.js" defer></script></body>'))
(ROOT / "quiz").mkdir(exist_ok=True)
(ROOT / "quiz" / "index.html").write_text(asset_versions(quiz, ROOT / "quiz"))
from pay_page import render as render_pay
pay = head("UK pay and AI security careers | Zulia Shavaeva", "Explore UK security salary benchmarks by profession and experience, understand the hiring evidence, and choose a free AI security learning path.", "../", '<link rel="stylesheet" href="../pay.css">', route="pay/") + top("../", "pay") + render_pay(json.loads((ROOT/"content/pay.json").read_text())) + foot("../").replace("</body>", '<script src="../pay.js" defer></script></body>')
(ROOT/"pay").mkdir(exist_ok=True)
(ROOT/"pay/index.html").write_text(asset_versions(pay, ROOT/"pay"))
cv_path=ROOT/"cv/index.html"
cv=cv_path.read_text()
cv=re.sub(r'<header class="top">.*?</header>', top("../", "cv").split('</a>',1)[1],cv,count=1,flags=re.S)
cv_path.write_text(asset_versions(cv,ROOT/"cv"))
print("built index.html, quiz/index.html, pay/index.html and CV navigation")

if (ROOT / "integrate_guide.py").exists():
    runpy.run_path(str(ROOT / "integrate_guide.py"), run_name="__main__")
