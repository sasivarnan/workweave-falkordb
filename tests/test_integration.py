import sys,secrets,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from graph import Store
from ui import compose
class GraphTests(unittest.TestCase):
 def setUp(self):
  self.s=Store(secrets.token_hex(16));self.s.seed()
 def tearDown(self):self.s.g.delete()
 def test_01_guidance(self):
  c=self.s.context();self.assertEqual(c['current'],'Use Provider B');self.assertEqual(c['conflicts'][0][0],'guide');self.assertEqual(len(c['conflicts'][0][5]),5)
 def test_02_native_path(self):self.assertEqual(self.s.context()['paths'][0][0],['Maya Chen','Ship your first checkout change','Checkout service'])
 def test_03_replace_review(self):
  self.s.action('accept','Mentor review');self.s.action('replace');c=self.s.context();self.assertEqual(c['current'],'Use Provider C');self.assertTrue(c['needsReview']);self.assertEqual(c['plan'][0][1],'Use Provider B')
 def test_04_missing_owner(self):
  self.s.action('remove-owner');c=self.s.context();self.assertEqual(c['people'],[]);self.assertIn('QuestionForm',[x['component'] for x in compose(c)[1]['updateComponents']['components']])
 def test_05_completed_training(self):
  self.s.action('complete');self.assertTrue(self.s.context()['training'][0][2])
 def test_06_new_session(self):
  self.s.action('accept','Saved note');self.s.action('complete');other=Store(self.s.name.removeprefix('firsttask_'));c=other.context();self.assertEqual(c['plan'][0][2],'Saved note');self.assertTrue(c['training'][0][2])
 def test_07_isolation(self):
  other=Store(secrets.token_hex(16));other.seed()
  try:self.s.action('complete');self.assertFalse(other.context()['training'][0][2])
  finally:other.g.delete()
 def test_08_conflicting_current_decisions(self):
  self.s.q('test_conflict','CREATE (d:Decision {id:"unresolved",title:"Other provider",approved:true}) WITH d MATCH (s:Service {id:"checkout-service"}) CREATE (d)-[:APPLIES_TO]->(s)',write=True)
  self.assertTrue(self.s.context()['ambiguous'])
  with self.assertRaises(ValueError):self.s.action('accept')
 def test_09_idempotent_seed(self):
  self.s.seed();self.assertEqual(len(self.s.context()['decisions']),1)
 def test_10_invalid_layout(self):
  with self.assertRaises(ValueError):compose(self.s.context(),['Script'])
 def test_11_invalid_actions(self):
  with self.assertRaises(ValueError):self.s.action('delete-all')
  with self.assertRaises(ValueError):Store('../../invalid')
 def test_12_reset(self):
  self.s.action('replace');self.s.action('complete');self.s.reset();c=self.s.context();self.assertEqual(c['current'],'Use Provider B');self.assertFalse(c['training'][0][2])
 def test_13_assignment_scope(self):
  other=Store(self.s.name.removeprefix('firsttask_'),'refunds')
  c=other.context();self.assertEqual(c['current'],'Use sandbox transactions only');self.assertEqual(c['people'][0][1],'Noah Williams');self.assertEqual(c['conflicts'],[])
  other.action('complete');self.assertTrue(other.context()['training'][0][2]);self.assertFalse(self.s.context()['training'][0][2])
 def test_14_separate_assignment_plans(self):
  other=Store(self.s.name.removeprefix('firsttask_'),'refunds')
  self.s.action('accept','Checkout note');other.action('accept','Refund note')
  self.assertEqual(self.s.context()['plan'][0][2],'Checkout note');self.assertEqual(other.context()['plan'][0][2],'Refund note')
 def test_15_unknown_assignment(self):
  with self.assertRaises(ValueError):Store(self.s.name.removeprefix('firsttask_'),'unknown').context()
 def test_16_read_guidance_changes(self):
  self.s.action('review');self.assertTrue(self.s.context()['guidanceRead'])
  other=Store(self.s.name.removeprefix('firsttask_'),'refunds');self.assertFalse(other.context()['guidanceRead'])
  self.s.action('replace');self.assertFalse(self.s.context()['guidanceRead'])
 def test_17_employee_home(self):
  c=self.s.context();self.assertEqual([r[0] for r in c['week']],[1,2,3,4,5]);self.assertEqual({r[0] for r in c['colleagues']},{'leo','imani','noah'})
  self.s.action('accept','Retain my notes');self.s.seed();c=self.s.context();self.assertEqual(len(c['week']),5);self.assertEqual(c['plan'][0][2],'Retain my notes')
  self.s.action('remove-owner');self.assertEqual([r[0] for r in self.s.context()['colleagues']],['noah'])
 def test_18_home_findings_across_assignments(self):
  other=Store(self.s.name.removeprefix('firsttask_'),'refunds');rows=other.context()['findings'];self.assertEqual(rows[0][0],'checkout');self.assertEqual(rows[0][4:8],['Use Provider A','Use Provider B','adr','ADR-042: Provider migration'])
  self.s.action('replace');self.assertEqual(other.context()['findings'][0][5],'Use Provider C')
  self.s.q('unapprove','MATCH (d:Decision) SET d.approved=false',write=True);self.assertEqual(other.context()['findings'],[])
 def test_19_review_gate_and_persistence(self):
  with self.assertRaises(ValueError):self.s.action('request-review')
  self.s.action('review');self.s.action('complete');self.s.action('accept','Check failed and pending states');self.s.action('request-review');self.s.action('request-review')
  c=self.s.context();self.assertEqual(len(c['reviewRequest']),1);self.assertEqual(c['reviewRequest'][0][2],'Leo Martin');self.assertEqual(c['reviewRequest'][0][3],'provider-b')
  self.s.action('replace')
  with self.assertRaises(ValueError):self.s.action('request-review')
  self.s.action('review');self.s.action('accept','Updated plan');self.s.action('request-review');self.assertEqual(self.s.context()['reviewRequest'][0][3],'provider-c')
 def test_20_missing_reviewer_blocks_request(self):
  self.s.action('review');self.s.action('complete');self.s.action('accept','Ready');self.s.action('remove-owner')
  with self.assertRaises(ValueError):self.s.action('request-review')
 def test_21_same_title_new_identity_requires_review(self):
  self.s.action('accept','Initial plan');self.s.action('replace');self.s.q('fixture','MATCH (d:Decision {id:"provider-c"}) SET d.title="Use Provider B"',write=True);self.assertTrue(self.s.context()['needsReview'])
 def test_22_fulltext_search(self):
  rows=self.s.search('refund sandbox');self.assertTrue(any(r[0]=='refund-source' for r in rows));self.assertTrue(all(len(r)==4 for r in rows))
  self.s.seed();self.assertTrue(self.s.search('checkout'))
  with self.assertRaises(ValueError):self.s.search('***')
 def test_23_company_links_and_impact(self):
  c=self.s.context();self.assertEqual(len(c['meetings']),2);self.assertEqual(len(c['notes']),2);self.assertEqual(c['impact'],[])
  self.assertEqual(c['meetings'][0][4:6],['checkout','meeting-checkout'])
  self.s.action('replace');c=self.s.context();self.assertEqual(c['impact'][0],['Use Provider C','Checkout release review','Checkout planning notes','Ship your first checkout change'])
 def test_24_workspace_note_persistence(self):
  self.s.action('save-note','Check with Payments about release readiness');self.s.seed();c=self.s.context();self.assertTrue(any(r[2]=='Check with Payments about release readiness' for r in c['notes']))
if __name__=='__main__':unittest.main(verbosity=2)
