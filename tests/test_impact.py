import secrets,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from graph import Store
from impact import run,analyze,link_note

class ImpactTests(unittest.TestCase):
 def setUp(self):
  self.store=Store(secrets.token_hex(16));self.store.seed()
 def tearDown(self):self.store.g.delete()
 def test_import_is_explicit_and_idempotent(self):
  self.assertFalse(analyze(self.store)['ready'])
  before=run(self.store,'import');after=run(self.store,'import')
  self.assertEqual(before['corpusHash'],after['corpusHash'])
  self.assertEqual(len(after['items']),4)
  self.assertEqual(len(after['unresolved']),1)
  self.assertEqual(len(after['unresolvedEvents']),1)
 def test_expected_cross_team_scope_and_alternate_routes(self):
  result=run(self.store,'import')
  items={item['id']:item for item in result['items']}
  self.assertEqual(set(items),{'PAY-108','BILL-204','SUP-310','SUP-311'})
  self.assertEqual({item['team'] for item in items.values()},{'Payments','Billing','Support'})
  self.assertEqual(items['SUP-310']['routeCount'],2)
  self.assertEqual(items['SUP-311']['owners'],[])
  self.assertEqual([item['id'] for item in result['excluded']],['HR-12'])
  self.assertEqual(items['BILL-204']['explanation'],['Verify invoice reconciliation','Billing API','Checkout service','Use Provider B'])
  self.assertTrue(any(row['tool']=='native_dependency_explanation' for row in self.store.trace))
 def test_edge_only_experiment_preserves_text_and_alternative_route(self):
  run(self.store,'import');after=run(self.store,'remove')
  self.assertEqual(after['experiment']['removed'],['BILL-204'])
  self.assertEqual(after['experiment']['retained'],['PAY-108','SUP-310','SUP-311'])
  self.assertTrue(after['experiment']['documentsUnchanged'])
  self.assertEqual(after['experiment']['beforeRoutes']['SUP-310'],2)
  self.assertEqual(after['experiment']['afterRoutes']['SUP-310'],1)
  again=run(self.store,'import')
  self.assertNotIn('BILL-204',{item['id'] for item in again['items']})
  restored=run(self.store,'restore')
  self.assertEqual(restored['experiment']['added'],['BILL-204'])
  self.assertTrue(restored['experiment']['documentsUnchanged'])
 def test_cycles_do_not_duplicate_tasks_or_unbound_traversal(self):
  run(self.store,'import')
  self.store.q('cycle','MATCH (a:Service {id:"billing-api"}),(b:Service {id:"support-console"}) MERGE (a)-[:DEPENDS_ON {weight:1}]->(b)',write=True)
  result=analyze(self.store)
  self.assertEqual(len(result['items']),4)
  for item in result['items']:
   for path in item['paths']:
    self.assertEqual(len(path),len(set(path)))
    self.assertLessEqual(len(path)-1,result['depthLimit'])
 def test_exact_links_include_original_identifiers_and_notes(self):
  result=run(self.store,'import')
  item=next(item for item in result['items'] if item['id']=='BILL-204')
  self.assertEqual(item['links'][0][3:5],['exact issue key','BILL-204'])
  self.assertEqual(item['links'][0][8:10],['exact meeting ID','zoom-billing'])
  self.assertIn('downstream invoice checks',item['links'][0][7])
 def test_ambiguous_meeting_id_does_not_create_a_link(self):
  run(self.store,'import')
  self.store.q('duplicate_meeting','CREATE (:ExternalEvent {id:"duplicate",title:"Duplicate invite",zoomMeetingId:"zoom-billing"}) CREATE (:ImportedNote {id:"ambiguous-note",title:"Unclear occurrence",meetingId:"zoom-billing"})',write=True)
  self.assertFalse(link_note(self.store,'ambiguous-note','zoom-billing'))
  self.assertEqual(self.store.q('check_no_guess','MATCH (:ImportedNote {id:"ambiguous-note"})-[:NOTES_FOR]->() RETURN true'),[])
 def test_missing_authority_blocks_analysis(self):
  run(self.store,'import')
  self.store.q('remove_source','MATCH (:Decision {id:"provider-b"})-[r:SUPPORTED_BY]->() DELETE r',write=True)
  self.assertTrue(analyze(self.store)['blocked'])
  with self.assertRaises(ValueError):run(self.store,'remove')
 def test_missing_native_path_fails_without_fabricated_explanation(self):
  run(self.store,'import')
  original=self.store.q
  def query(name,*args,**kwargs):
   return [] if name=='native_dependency_explanation' else original(name,*args,**kwargs)
  self.store.q=query
  with self.assertRaises(ValueError):analyze(self.store)
 def test_reverse_direction_does_not_imply_impact(self):
  run(self.store,'import')
  self.store.q('reverse_edge','MATCH (a:Service {id:"checkout-service"}),(b:Service {id:"people-api"}) MERGE (a)-[:DEPENDS_ON {weight:1}]->(b)',write=True)
  self.assertNotIn('HR-12',{item['id'] for item in analyze(self.store)['items']})
 def test_workspaces_remain_isolated(self):
  other=Store(secrets.token_hex(16));other.seed()
  try:
   run(self.store,'import');self.assertFalse(analyze(other)['ready'])
  finally:other.g.delete()
 def test_depth_limit_is_reported_without_claiming_global_safety(self):
  run(self.store,'import')
  previous='checkout-service'
  for index in range(6):
   current='deep-'+str(index)
   self.store.q('deep_dependency','MATCH (target:Service {id:$target}) CREATE (s:Service {id:$id,title:$title})-[:DEPENDS_ON {weight:1}]->(target)',{'target':previous,'id':current,'title':'Deep service '+str(index)},True)
   previous=current
  self.store.q('deep_work','MATCH (s:Service {id:$service}),(t:Team {id:"billing"}) CREATE (w:WorkItem {id:"DEEP-1",title:"Beyond traversal bound",source:"Jira export"})-[:TOUCHES]->(s) CREATE (t)-[:RESPONSIBLE_FOR]->(w)',{'service':previous},True)
  result=analyze(self.store)
  self.assertEqual(result['depthLimit'],5)
  self.assertIn('DEEP-1',{item['id'] for item in result['excluded']})
 def test_duplicate_service_names_do_not_merge_distinct_routes(self):
  run(self.store,'import')
  self.store.q('same_names','MATCH (s:Service {id:"support-console"}),(root:Service {id:"checkout-service"}) CREATE (other:Service {id:"another-billing",title:"Billing API"}) CREATE (s)-[:DEPENDS_ON {weight:1}]->(other) CREATE (other)-[:DEPENDS_ON {weight:1}]->(root)',write=True)
  item=next(item for item in analyze(self.store)['items'] if item['id']=='SUP-310')
  self.assertEqual(item['routeCount'],3)
  self.assertEqual(len(item['pathIds']),3)
 def test_http_impact_api_uses_the_cookie_workspace(self):
  import json,threading,urllib.request,urllib.error
  from server import Handler,ThreadingHTTPServer
  server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
  thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   token=self.store.name.removeprefix('workweave_')
   request=urllib.request.Request('http://127.0.0.1:'+str(server.server_port)+'/api/impact',data=b'{"operation":"import"}',headers={'Content-Type':'application/json','X-Workweave':'portal','Cookie':'workweave='+token})
   with urllib.request.urlopen(request) as response:payload=json.load(response)
   self.assertEqual(len(payload['analysis']['items']),4)
   self.assertTrue(payload['trace'])
   request=urllib.request.Request('http://127.0.0.1:'+str(server.server_port)+'/api/impact',data=b'{"operation":"arbitrary-query"}',headers={'Content-Type':'application/json','X-Workweave':'portal','Cookie':'workweave='+token})
   with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(request)
   self.assertEqual(error.exception.code,400)
  finally:server.shutdown();server.server_close();thread.join()
