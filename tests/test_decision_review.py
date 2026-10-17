import secrets,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from graph import Store

class DecisionReviewTests(unittest.TestCase):
 def setUp(self):
  self.store=Store(secrets.token_hex(16));self.store.seed()
 def tearDown(self):self.store.g.delete()
 def test_approval_impacts_only_linked_work(self):
  self.store.action('accept','Keep my original checks')
  self.store.action('replace')
  review=self.store.context()['changeReview']
  self.assertTrue(review['canAcknowledge'])
  self.assertEqual(review['affected'][0]['owner'],'Maya Chen')
  self.assertTrue(review['affected'][0]['stale'])
  self.assertEqual(review['affected'][0]['savedNote'],'Keep my original checks')
  self.assertEqual(review['meetings'][0][2],'meeting-checkout')
  self.assertEqual(review['unaffected'][0][0],'refunds')
 def test_newer_proposal_does_not_replace_approved_decision(self):
  self.store.action('replace');self.store.action('propose')
  context=self.store.context()
  self.assertEqual(context['current'],'Use Provider C')
  proposal=next(row for row in context['changeReview']['history'] if row[0]=='provider-proposal')
  self.assertFalse(proposal[2])
  self.assertEqual(context['changeReview']['currentId'],'provider-c')
 def test_acknowledgement_is_versioned_idempotent_and_keeps_plan(self):
  self.store.action('accept','Original review questions')
  self.store.action('acknowledge-change');self.store.action('acknowledge-change')
  self.assertTrue(self.store.context()['changeReview']['affected'][0]['acknowledged'])
  self.store.action('replace')
  self.assertFalse(self.store.context()['changeReview']['affected'][0]['acknowledged'])
  self.store.action('acknowledge-change')
  context=self.store.context();review=context['changeReview']
  self.assertEqual(len(review['affected']),1)
  self.assertTrue(review['affected'][0]['acknowledged'])
  self.assertTrue(review['affected'][0]['stale'])
  self.assertEqual(context['plan'][0][2],'Original review questions')
  self.assertEqual(self.store.q('receipts','MATCH (r:DecisionReview) RETURN count(r)')[0][0],2)
 def test_missing_source_or_approver_blocks_acknowledgement(self):
  self.store.q('remove_approval','MATCH (:Decision {id:"provider-b"})-[r:APPROVED_BY]->() DELETE r',write=True)
  self.assertFalse(self.store.context()['changeReview']['canAcknowledge'])
  with self.assertRaises(ValueError):self.store.action('acknowledge-change')
 def test_conflicting_approved_decisions_block_acknowledgement(self):
  self.store.q('conflict','MATCH (s:Service {id:"checkout-service"}) CREATE (d:Decision {id:"conflict",title:"Another approved route",approved:true})-[:APPLIES_TO]->(s)',write=True)
  with self.assertRaises(ValueError):self.store.action('acknowledge-change')
 def test_future_effective_date_blocks_acknowledgement(self):
  self.store.q('future','MATCH (d:Decision {id:"provider-b"}) SET d.effectiveAt=9999999999999',write=True)
  self.assertIn('The decision is not effective yet.',self.store.context()['changeReview']['issues'])
  with self.assertRaises(ValueError):self.store.action('acknowledge-change')
 def test_relationship_change_alone_invalidates_plan(self):
  self.store.action('accept','Current plan')
  before=self.store.context()
  self.store.q('edge_only','MATCH (:Decision {id:"provider-b"})-[r:SUPERSEDES]->(:Decision) DELETE r',write=True)
  after=self.store.context()
  self.assertEqual(before['sources'],after['sources'])
  self.assertFalse(after['changeReview']['canAcknowledge'])
  self.assertTrue(after['needsReview'])

 def test_missing_source_blocks_every_write_gate(self):
  self.store.q('remove_source','MATCH (:Decision {id:"provider-b"})-[r:SUPPORTED_BY]->() DELETE r',write=True)
  for action in ['acknowledge-change','review','accept','request-review']:
   with self.subTest(action=action),self.assertRaises(ValueError):self.store.action(action,'Do not accept missing evidence')
 def test_future_decision_blocks_task_writes(self):
  self.store.q('future','MATCH (d:Decision {id:"provider-b"}) SET d.effectiveAt=9999999999999',write=True)
  self.assertTrue(self.store.context()['ambiguous'])
  with self.assertRaises(ValueError):self.store.action('accept','Do not use future guidance')
 def test_multiple_meetings_link_to_the_same_replaced_decision(self):
  self.store.q('another_meeting','MATCH (e:Employee {id:"maya"}),(d:Decision {id:"provider-b"}) CREATE (m:Meeting {id:"second-review",title:"Release readiness"})-[:CONSIDERS]->(d) CREATE (e)-[:ATTENDS]->(m) CREATE (:Document {id:"second-notes",title:"Readiness notes",body:"Discuss the approved provider"})-[:NOTES_FOR]->(m)',write=True)
  self.store.action('replace')
  meetings=self.store.context()['changeReview']['meetings']
  self.assertEqual({row[0] for row in meetings},{'checkout-review','second-review'})
  self.assertEqual({row[2] for row in meetings},{'meeting-checkout','second-notes'})

 def test_missing_saved_plan_evidence_is_stale(self):
  self.store.action('accept','Keep these checks')
  self.store.q('detach_plan_evidence','MATCH (:LearningPlan)-[r:SUPPORTED_BY]->() DELETE r',write=True)
  context=self.store.context()
  self.assertTrue(context['needsReview'])
  self.assertTrue(context['changeReview']['affected'][0]['stale'])
  self.assertEqual(context['changeReview']['affected'][0]['savedNote'],'Keep these checks')
