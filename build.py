#!/usr/bin/env python3
"""Builds index.html and quiz/index.html from content/site.json + site.css. cv/index.html is hand-maintained.
Run: /usr/bin/python3 build.py"""
import json, pathlib, html, datetime
ROOT = pathlib.Path(__file__).resolve().parent
D = json.loads((ROOT / "content" / "site.json").read_text())
esc = lambda s: html.escape(str(s), quote=True)
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,0..100&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">'
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
YEAR = datetime.date.today().year

def head(title, desc, rel, extra=""):
    return (f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title>'
            f'<meta name="description" content="{esc(desc)}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:image" content="https://zuliaszu.github.io/img/zulia.jpg"><meta name="theme-color" content="#f7f5f1">'
            f'<link rel="icon" href="{rel}img/favicon.svg" type="image/svg+xml">{FONTS}<link rel="stylesheet" href="{rel}site.css">{extra}</head><body>')

def top(rel, on):
    links = [(f"{rel}#help", "How I help", "help"), (f"{rel}#about", "About", "about"), (f"{rel}#talks", "Talks", "talks"), (f"{rel}cv/", "CV", "cv"), (D["linkedin"], "LinkedIn", "li")]
    nav = "".join(f'<a href="{esc(h)}"{" class=on" if k == on else ""}{" rel=noopener" if h.startswith("http") else ""}>{t}</a>' for h, t, k in links)
    return (f'<a class="skip" href="#main">Skip to content</a><header class="top"><div class="in"><a class="brand" href="{rel or "./"}">{esc(D["name"])}</a>'
            f'<button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button><nav id="nav">{nav}<a class="btn" href="{rel}quiz/">Take the quiz</a></nav></div></header>')

def foot(rel):
    return (f'<footer><div class="wrap in"><span>{esc(D["footer_line"])} {YEAR}.</span><span><a href="{esc(D["linkedin"])}" rel="noopener">LinkedIn</a> &middot; <a href="{rel}cv/">CV</a> &middot; <a href="{esc(D["platform"])}">AI Security Career Platform</a></span></div></footer>'
            f'<script src="{rel}site.js" defer></script></body></html>')

H = D["hero"]
home = head(f'{D["name"]}, {D["title"]}', D["meta_description"], "") + top("", "home") + f'''
<main id="main" class="wrap">
<div class="hero"><div class="rv in"><p class="eyebrow">{esc(H["eyebrow"])}</p><h1>{esc(H["h1"])}</h1><p class="sub">{esc(H["sub"])}</p>
<div class="ctas"><a class="btn amber" href="quiz/">{esc(H["cta_primary"])} {ARROW}</a><a class="btn ghost" href="#about">{esc(H["cta_secondary"])}</a></div><p class="small" style="color:var(--mute);font-size:14.5px;margin:12px 0 0">{esc(H["cta_primary_note"])}</p></div>
<figure class="pic rv in"><img src="img/zulia.jpg" width="880" height="1100" alt="Zulia Shavaeva, portrait by a lake" fetchpriority="high"><figcaption class="cap"><b>{esc(H["photo_caption"])}</b>{esc(H["photo_caption_sub"])}</figcaption></figure></div>
<div class="facts rv">{"".join(f'<div><b>{esc(x["figure"])}</b><span>{esc(x["label"])}</span></div>' for x in D["proof"])}</div>

<section id="help"><div class="sec-head rv"><div><p class="eyebrow">Start here</p><h2>{esc(D["help_head"])}</h2></div><p>{esc(D["help_intro"])}</p></div>
<div class="help rv">{"".join(f'<a href="{esc(h["href"])}"><span class="n">{i+1}</span><div><h3>{esc(h["title"])}</h3><p>{esc(h["body"])}</p><span class="go">{esc(h["link_label"])} &rarr;</span></div>{"<span class=btn>Start &rarr;</span>" if h.get("cta") else ""}</a>' for i, h in enumerate(D["help"]))}</div></section>

<section id="about"><div class="about"><figure class="pic rv"><img src="img/outdoors.jpg" width="900" height="1200" alt="Zulia standing in front of a mossy cliff with a waterfall" loading="lazy"><figcaption class="small" style="color:var(--mute);font-size:14px;margin-top:10px">{esc(D["about_photo_caption"])}</figcaption></figure>
<div class="text rv"><p class="eyebrow">{esc(D["about_head"])}</p>{"".join(f"<p>{esc(x)}</p>" for x in D["about"])}
<div class="links"><a class="btn" href="cv/">Read the CV</a><a class="btn ghost" href="{esc(D["linkedin"])}" rel="noopener">LinkedIn</a></div></div></div></section>

<section id="talks"><div class="talks"><div class="rv"><p class="eyebrow">{esc(D["talks_head"])}</p><h2>Talks, workshops, and a community I lead</h2><p style="margin-top:16px;color:var(--ink-2);font-size:18px">{esc(D["talks_intro"])}</p>
<ul class="talk-list">{"".join(f'<li><b>{esc(t["title"])}</b><span>{esc(t["where"])}</span><span style="color:var(--ink-2)">{esc(t["note"])}</span></li>' for t in D["talks"])}</ul></div>
<figure class="pic rv"><img src="img/talk-1.jpg" width="1200" height="900" alt="Zulia speaking to an audience beside a screen titled Critical AWS Security Vulnerabilities" loading="lazy"><figcaption>{esc(D["talk_photo_caption"])}</figcaption></figure></div>
<p class="rv" style="max-width:62ch;margin:40px 0 0;color:var(--ink-2)">{esc(D["community"])} <a href="https://www.meetup.com/aws-cloud-women-manchester/" rel="noopener">AWS Cloud Women Manchester on Meetup</a>.</p></section>

<section id="pages"><div class="sec-head rv"><div><p class="eyebrow">Links</p><h2>{esc(D["pages_head"])}</h2></div><p>The things I would send you if you asked what I have been working on.</p></div>
<ul class="pages rv">{"".join(f'<li><a href="{esc(p["href"])}"{" rel=noopener" if p["href"].startswith("http") else ""}><b>{esc(p["title"])}</b><span class="d">{esc(p["desc"])}</span><span class="arr">{ARROW}</span></a></li>' for p in D["pages"])}</ul></section>

<section id="cv"><div class="band rv"><div><h2>{esc(D["cv_band"]["h2"])}</h2><p>{esc(D["cv_band"]["p"])}</p></div><div class="btns"><a class="btn" href="cv/">{esc(D["cv_band"]["btn"])}</a><a class="btn ghost" href="{esc(D["linkedin"])}" rel="noopener">{esc(D["cv_band"]["btn2"])}</a></div></div></section>
</main>''' + foot("")
(ROOT / "index.html").write_text(home)

Q = D["quiz_page"]
quiz_css = '<link rel="stylesheet" href="../quiz/quiz.css"><link rel="stylesheet" href="../site.css"><link rel="stylesheet" href="../quiz/quiz-skin.css">'
quiz = (head(Q["title"], Q["sub"][:155], "../", quiz_css).replace(f'<link rel="stylesheet" href="../site.css">{quiz_css}', quiz_css) + top("../", "quiz") +
        f'''<main id="main" class="wrap"><div id="hero" class="qhero rv in"><p class="eyebrow">Free, 4 minutes, no signup</p><h1>{esc(Q["h1"])}</h1><p class="sub">{esc(Q["sub"])}</p>
<div class="ctas"><a class="btn amber" href="#quiz" data-start>Start the quiz {ARROW}</a><a class="btn ghost" href="{esc(D["platform"])}#paths">See the six roles first</a></div>
<p class="small" style="color:var(--mute);font-size:14.5px;margin:14px 0 0">{esc(Q["note"])}</p></div>
<div id="quiz" class="card"></div></main>''' + foot("../").replace("</body>", f'<script>window.AISCP_BASE={json.dumps(D["platform"])};</script><script src="quiz.js" defer></script></body>'))
(ROOT / "quiz").mkdir(exist_ok=True)
(ROOT / "quiz" / "index.html").write_text(quiz)
print("built index.html, quiz/index.html")
