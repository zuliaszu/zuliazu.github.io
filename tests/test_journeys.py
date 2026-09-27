import json, unittest
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self,text):
        super().__init__();self.nav=0;self.links=[];self.count=0;self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='nav' and a.get('class')=='journey-nav':self.nav=1;self.count+=1
        elif self.nav and tag=='a':self.links.append(a['href'])
    def handle_endtag(self,tag):
        if tag=='nav':self.nav=0
class Journeys(unittest.TestCase):
    def test_shortcuts_on_every_page(self):
        starts=json.loads((ROOT/'ai-security-career-platform/career-starts.json').read_text())
        targets={str((ROOT/'ai-security-career-platform'/x['href'].split('#')[0]).resolve()) for x in starts}
        for page in ROOT.rglob('*.html'):
            if page.name=='theme-btn.html':continue
            nav=Links(page.read_text())
            self.assertEqual(nav.count,1,str(page))
            self.assertTrue(targets.issubset({str((page.parent/x.split('#')[0]).resolve()) for x in nav.links}),str(page))
    def test_pay_and_routes_link_both_ways(self):
        data=json.loads((ROOT/'content/pay.json').read_text())
        roles={r['id']:r for r in data['roles']}
        for ident in ['network','leadership']:
            route=(ROOT/'pay'/roles[ident]['path_url']).resolve()
            self.assertIn('../../pay/#'+ident,route.read_text())
        network=roles['network']['advertised']
        self.assertEqual([network[x] for x in ['low','median','high','salary_count','vacancy_count']],[47500,65000,79688,42,63])
        self.assertEqual(roles['leadership']['leadership_bands'],data['leadership'])
        self.assertNotIn('step-0',roles)
    def test_shared_starting_points_and_step_zero(self):
        for page in ['index.html','learn/index.html']:
            text=(ROOT/'ai-security-career-platform'/page).read_text()
            for ident in ['step-0','network-to-ai-security','leadership']:
                self.assertIn('data-background-route="'+ident+'"',text)
        hub=(ROOT/'ai-security-career-platform/routes/index.html').read_text()
        section=hub.split('id="step-0"',1)[1].split('</section>',1)[0]
        order=['ai-fundamentals.html','security-fundamentals.html','ai-security-fundamentals.html']
        positions=[section.index('href="'+x+'"') for x in order]
        self.assertEqual(positions,sorted(positions))
    def test_no_diagnostic_gate_or_old_promo_copy(self):
        for name in ['quiz/quiz.js','ai-security-career-platform/assets/extra-plan.js']:
            text=(ROOT/name).read_text()
            self.assertNotIn('Then prove it:',text)
            self.assertNotIn('Take the diagnostic first',text)
        self.assertIn('No weekly plan saved',(ROOT/'ai-security-career-platform/assets/extra-plan.js').read_text())
if __name__=='__main__':unittest.main()
