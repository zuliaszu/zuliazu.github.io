"""Static, source-labelled UK pay explorer. Interactive filtering is optional."""
import html,re
from urllib.parse import urlsplit
E=lambda s:html.escape(str(s),quote=True)

def safe_url(value):
    p=urlsplit(value or '')
    if p.scheme:
        if p.scheme!='https' or not p.netloc:raise ValueError('Unsafe URL')
    elif not value or value.startswith('//'):raise ValueError('Unsafe URL')
    return E(value)

def validate(d):
    if d['currency']!='GBP':raise ValueError('UK view must use GBP')
    ids=set()
    for r in d['roles']:
        if not re.fullmatch('[a-z][a-z-]*',r['id']) or r['id'] in ids:raise ValueError('Invalid role')
        ids.add(r['id']);safe_url(r['path_url'])
        if r['bands'] and not r['source_url']:raise ValueError('Missing source')
        if r.get('advertised'):
            a=r['advertised']
            if not r['source_url'] or not 0<a['low']<=a['median']<=a['high'] or a['salary_count']<1:raise ValueError('Invalid advertised pay')
        for b in r['bands']:
            if not isinstance(b['low'],int) or not isinstance(b['high'],int) or not 0<b['low']<=b['high']<=150000:raise ValueError('Invalid pay band')
        if r['source_url']:safe_url(r['source_url'])
    safe_url(d['source_url'])
    for s in d['market_sources']:safe_url(s['url'])
    for r in d['leadership']:
        if not 0<r['low']<=r['high']:raise ValueError('Invalid leadership band')

def money(n):return f'£{n:,}'

def role_panel(r):
    if r['bands']:
        rows=''
        if r.get('advertised'):
            a=r['advertised']
            if not r['source_url'] or not 0<a['low']<=a['median']<=a['high'] or a['salary_count']<1:raise ValueError('Invalid advertised pay')
        for b in r['bands']:
            left=100*b['low']/150000;width=100*(b['high']-b['low'])/150000
            rows+=f'<li><span class="pay-years">{E(b["label"])}</span><span class="pay-track" aria-hidden="true"><i style="left:{left:.4f}%;width:{width:.4f}%"></i></span><strong>{money(b["low"])} to {money(b["high"])}</strong></li>'
        chart=f'<p class="pay-benchmark">Benchmark: <strong>{E(r["benchmark"])}</strong></p><p class="pay-note">{E(r["note"])}</p><div class="pay-legend"><span>Experience in the source</span><span>Reported annual salary, GBP</span></div><ol class="pay-bands">{rows}</ol><div class="pay-scale" aria-hidden="true"><span>£0</span><span>£75k</span><span>£150k</span></div><p class="pay-source"><a href="{safe_url(r["source_url"])}" target="_blank" rel="noopener noreferrer">{E(r["benchmark"])} source: Cybershark 2026, page {r["source_page"]} (PDF)</a></p>'
    elif r.get('advertised'):
        a=r['advertised']
        chart=f'<div class="pay-advertised"><p class="pay-benchmark">Benchmark: <strong>{E(r["benchmark"])}</strong></p><p class="pay-note">{E(r["note"])}</p><h3>{money(a["low"])} to {money(a["high"])}</h3><p>Middle 50% of advertised annual salaries (25th to 75th percentile).</p><p><strong>Median: {money(a["median"])}</strong></p><p>{a["salary_count"]} salary-bearing adverts from {a["vacancy_count"]} permanent UK vacancies. {E(a["period"])}.</p><p>Levels are mixed. These percentiles do not map to years of experience or a promotion ladder. No bonus or equity has been added.</p><a href="{safe_url(r["source_url"])}" target="_blank" rel="noopener noreferrer">Source: IT Jobs Watch, Security Consultant</a></div>'
    else:
        chart=f'<div class="pay-gap"><h3>No verified comparable range yet</h3><p>{E(r["note"])}</p><p>Check current vacancies for the same work and level. Compare base salary separately from bonuses and equity.</p></div>'
    return f'<section class="pay-role" id="{r["id"]}" data-pay-role aria-labelledby="title-{r["id"]}"><div class="pay-role-intro"><p class="eyebrow">Career direction</p><h2 id="title-{r["id"]}">{E(r["label"])}</h2><p>{E(r["work"])}</p></div>{chart}<a class="btn ghost" href="{safe_url(r["path_url"])}">Explore this path and its first exercise</a></section>'

def render(d):
    validate(d)
    links=''.join(f'<a href="#{r["id"]}" data-pay-choice="{r["id"]}" aria-controls="{r["id"]}">{E(r["label"])}</a>' for r in d['roles'])
    sources={s['id']:s for s in d['market_sources']}
    lead=''.join(f'<div><span>{E(r["title"])}</span><strong>{money(r["low"])} to {money(r["high"])}</strong></div>' for r in d['leadership'])
    market1=safe_url(sources['sector-2026']['url']);market2=safe_url(sources['skills-2025']['url'])
    return f'''<main id="main" class="wrap pay-page">
<div class="pay-intro"><p class="eyebrow">Pay &amp; careers / United Kingdom</p><h1>AI security careers.<br>What about the pay?</h1><p class="pay-lead">You want to know what the work involves, whether your experience fits and what you could earn. Start with a UK benchmark, then compare the role behind the title.</p><p class="pay-personal">I think AI security is worth learning because people are already building these systems and need help securing them. You may be closer to the work than you think.</p><a href="#market">Read the UK market evidence</a></div>
<div class="pay-explorer" id="compare"><div class="pay-explorer-head"><h2>Choose a profession</h2><p>UK / GBP / checked 26 September 2026</p></div><p class="pay-caveat">These are <strong>related security benchmarks, not AI-specific salaries</strong>. Five paths use survey experience bands. Consulting uses advertised salary percentiles; research has no verified range. None guarantees a job level or a pay rise.</p><nav class="pay-choices" aria-label="Choose a profession">{links}</nav><p id="pay-selection-status" class="sr-only" aria-live="polite"></p>{''.join(role_panel(r) for r in d['roles'])}<p class="pay-experience-note">No zero-experience salary is established here. Years in another field do not automatically translate into the same level in AI security. Employer, location and responsibility can change the offer.</p><details class="pay-method"><summary>Sources, salary basis and limitations</summary><p>{E(d['methodology'])}</p><p>Compliance and assurance use technology risk and IT audit as a related benchmark. Consultancy uses a different basis: IT Jobs Watch permanent UK vacancy data, with its observation period and salary-bearing sample count shown. Research remains unpriced.</p><p><a href="{safe_url(d['source_url'])}" target="_blank" rel="noopener noreferrer">Read the full UK report (PDF)</a></p></details></div>
<section class="pay-leadership"><h2>Looking at leadership roles?</h2><p>Leadership has a different scope. The same survey reports these UK cyber-leadership bands, separately from its years-of-experience table.</p><div class="pay-leadership-bands">{lead}</div><p class="pay-note">Broad cyber leadership, not AI-specific pay. The report does not provide a sample count for each title. These are not the next automatic step after 10-12 years.</p><a href="{safe_url(d['source_url'])}#page=6" target="_blank" rel="noopener noreferrer">Leadership source: page 6 (PDF)</a></section>
<section id="market" class="pay-market"><p class="eyebrow">Opportunity, with context</p><h2>There is real work here. Hiring is still selective.</h2><p>The UK government's 2026 cyber-sector report describes firms moving from isolated AI-security engagements to a steady pipeline of testing, advice and training. That is evidence of work securing AI, not a count of open AI-security jobs. <a href="{market1}">[1]</a></p><div class="pay-market-evidence"><div><b>3% employment growth</b><p>The 2026 report estimates 69,600 cyber-related full-time-equivalent roles at UK cyber suppliers. Growth was the slowest recorded since the series began in 2018. <a href="{market1}">[1]</a></p></div><div><b>33% fewer core cyber postings</b><p>The 2025 skills report counted 32,370 core cyber job postings in January-December 2024, down 33% from 2023. These are historical vacancies, not today's live openings. <a href="{market2}">[2]</a></p></div></div><p>My advice: build on the work you already know and show what you can do with an AI system. A small, explained project gives you something concrete to discuss with an employer.</p><details><summary>Market sources and observation dates</summary><p><a href="{market1}">{E(sources['sector-2026']['label'])}</a>: {E(sources['sector-2026']['period'])}. Its sector-employment estimate covers cyber suppliers, not all security jobs across the economy.</p><p><a href="{market2}">{E(sources['skills-2025']['label'])}</a>: {E(sources['skills-2025']['period'])}. The datasets have different scopes and periods; do not combine them into one growth rate.</p></details></section>
<section class="pay-next"><h2>Turn a career idea into a first task.</h2><p>The quiz, learning guide and practice exercises are completely free. No account or email needed.</p><div class="ctas"><a class="btn" href="../quiz/">Find my starting path</a><a class="btn ghost" href="../ai-security-career-platform/routes/index.html">Start learning without the quiz</a></div><p class="pay-note">The quiz suggests what to explore. It does not measure job readiness.</p><p><a href="https://www.levels.fyi/index.html" target="_blank" rel="noopener noreferrer">Compare company compensation on Levels.fyi</a>. Check location, level and whether a figure includes stock or bonuses. This is an external site, not a data feed.</p></section></main>'''
