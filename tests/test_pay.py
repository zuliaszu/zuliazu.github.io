import unittest,json,importlib.util,copy
from pathlib import Path
from html.parser import HTMLParser
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pay_page',R/'pay_page.py');pay=importlib.util.module_from_spec(spec);spec.loader.exec_module(pay)
class Tags(HTMLParser):
 def __init__(self,text):super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
class PayTests(unittest.TestCase):
 def setUp(self):self.d=json.loads((R/'content/pay.json').read_text())
 def test_verified_source_values(self):
  expected={'engineer':[(45000,59750),(62500,75750),(81000,98500),(100000,115750)],'architect':[(48000,60500),(65750,80250),(84500,100500),(106500,121000)],'red-team':[(45000,59000),(64500,80000),(83500,100500),(109500,128000)],'grc':[(38750,53250),(60500,73500),(72500,86500),(90000,105000)],'compliance':[(35000,47000),(50750,65000),(62000,77500),(78500,93750)]}
  for r in self.d['roles']:
   if r['id'] in expected:self.assertEqual([(x['low'],x['high']) for x in r['bands']],expected[r['id']])
  self.assertEqual([(x['low'],x['high']) for x in self.d['leadership']],[(118500,142500),(155000,181500),(195000,219500)])
 def test_missing_evidence_is_not_zero(self):
  for id in ['research']:
   r=next(r for r in self.d['roles'] if r['id']==id)
   self.assertEqual(r['bands'],[]);self.assertIn('No verified comparable range',pay.role_panel(r));self.assertNotIn('£0',pay.role_panel(r))
 def test_consulting_uses_percentiles_not_years(self):
  r=next(r for r in self.d['roles'] if r['id']=='consulting')
  self.assertEqual(r['bands'],[])
  self.assertEqual(r['advertised']['median'],70000)
  text=pay.role_panel(r)
  for x in ['£55,000','£86,250','368','594','25th to 75th percentile','Levels are mixed']:self.assertIn(x,text)
  self.assertNotIn('1-3 years',text)
 def test_safe_inputs(self):
  for mutate in [lambda d:d.update(currency='USD'),lambda d:d['roles'][0]['bands'][0].update(low=-1),lambda d:d['roles'][0].update(source_url=None),lambda d:d['roles'][0].update(source_url='javascript:alert(1)'),lambda d:d['roles'][0].update(id='x" onload="')]:
   d=copy.deepcopy(self.d);mutate(d)
   with self.assertRaises(ValueError):pay.render(d)
  d=copy.deepcopy(self.d);d['roles'][0]['label']='<script>alert(1)</script>';self.assertNotIn('<script>',pay.render(d))
 def test_source_periods_and_salary_scope(self):
  text=pay.render(self.d)
  for x in ['not AI-specific salaries','not explicitly defined as base-only','January-December 2024','down 33% from 2023','69,600','3% employment growth','not a count of open AI-security jobs','No zero-experience salary','does not measure job readiness']:self.assertIn(x,text)
  self.assertNotIn('$',text)
 def test_static_seven_roles_and_no_hidden_data(self):
  text=pay.render(self.d);tags=Tags(text).tags
  roles=[a for t,a in tags if 'data-pay-role' in a];self.assertEqual(len(roles),7);self.assertTrue(all('hidden' not in a for a in roles))
  for r in self.d['roles']:self.assertTrue((R/'pay'/r['path_url']).resolve().is_file())
 def test_nav_every_page_and_single_header(self):
  pages=[p for p in R.rglob('*.html') if p.name!='theme-btn.html']
  self.assertEqual(len(pages),37)
  for p in pages:
   tags=Tags(p.read_text()).tags
   self.assertEqual(sum(t=='header' for t,a in tags),1,str(p))
   links=[a for t,a in tags if t=='a' and a.get('href','').endswith('pay/')]
   self.assertTrue(links,str(p))
   for a in links:self.assertEqual((p.parent/a['href']).resolve(),R/'pay')
if __name__=='__main__':unittest.main()
