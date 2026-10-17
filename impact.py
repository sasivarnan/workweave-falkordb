"""Normalized synthetic source import and bounded cross-team impact analysis."""
import hashlib,json
from pathlib import Path
MAX_DEPTH=5

def link_note(store,note_id,meeting_id):
 matches=store.q('match_exact_meeting_instance','MATCH (m:ExternalEvent {zoomMeetingId:$meeting}) RETURN m.id',{'meeting':meeting_id})
 if len(matches)!=1:return False
 store.q('link_exact_meeting_id','MATCH (n:ImportedNote {id:$id}),(m:ExternalEvent {id:$event}) MERGE (n)-[r:NOTES_FOR]->(m) SET r.evidence=$meeting,r.method="exact meeting ID"',{'id':note_id,'event':matches[0][0],'meeting':meeting_id},True)
 return True

def import_sources(store):
 data=json.loads((Path(__file__).parent/'fixtures/company-sources.json').read_text())
 if not store.q('import_version','MATCH (:Meta {id:"source-import-v1"}) RETURN true'):
  for record in data['services']:
   store.q('import_service','MERGE (n:Service {id:$id}) SET n.title=$title',{'id':record['id'],'title':record['name']},True)
  for record in data['teams']:
   store.q('import_team','MERGE (n:Team {id:$id}) SET n.title=$title',{'id':record['id'],'title':record['name']},True)
  for record in data['people']:
   store.q('import_person','MERGE (e:Employee {id:$id}) SET e.title=$title WITH e MATCH (t:Team {id:$team}) MERGE (e)-[:MEMBER_OF]->(t)',{'id':record['id'],'title':record['name'],'team':record['team']},True)
  for record in data['dependencies']:
   store.q('import_dependency','MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"',{'a':record['from'],'b':record['to']},True)
  for record in data['jira']:
   store.q('import_jira_issue','MATCH (s:Service {id:$service}),(t:Team {id:$team}) MERGE (w:WorkItem {id:$key}) SET w.title=$title,w.body=$body,w.source="Jira export",w.sourceId=$key MERGE (w)-[:TOUCHES]->(s) MERGE (t)-[:RESPONSIBLE_FOR]->(w)',{'key':record['key'],'title':record['title'],'body':record['body'],'service':record['service'],'team':record['team']},True)
   if record['owner']:store.q('import_issue_owner','MATCH (e:Employee {id:$owner}),(w:WorkItem {id:$key}) MERGE (e)-[:ASSIGNED_TO]->(w)',{'owner':record['owner'],'key':record['key']},True)
  for record in data['calendar']:
   store.q('import_calendar_event','MERGE (m:ExternalEvent {id:$id}) SET m.title=$title,m.zoomMeetingId=$zoom,m.source="Google Calendar export",m.sourceId=$id',{'id':record['uid'],'title':record['title'],'zoom':record['zoomMeetingId']},True)
   for key in record['issueKeys']:store.q('link_exact_issue_key','MATCH (m:ExternalEvent {id:$event}),(w:WorkItem {id:$key}) MERGE (m)-[r:DISCUSSES]->(w) SET r.evidence=$key,r.method="exact issue key"',{'event':record['uid'],'key':key},True)
  for record in data['zoom']:
   store.q('import_zoom_note','MERGE (n:ImportedNote {id:$id}) SET n.title=$title,n.body=$body,n.meetingId=$meeting,n.source="Zoom export",n.sourceId=$id',{'id':record['id'],'title':record['title'],'body':record['body'],'meeting':record['meetingId']},True)
   link_note(store,record['id'],record['meetingId'])
  store.q('finish_source_import','MERGE (:Meta {id:"source-import-v1"})',write=True)
 return data

def corpus_hash(store):
 rows=store.q('imported_content_hash','MATCH (n) WHERE n:WorkItem OR n:ImportedNote OR n:ExternalEvent OR n:Document RETURN labels(n),n.id,n.title,n.body ORDER BY n.id')
 return hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()

def analyze(store):
 if not store.q('impact_import_ready','MATCH (:Meta {id:"source-import-v1"}) RETURN true'):return {'ready':False}
 # Reuse the same approval checks as the employee task. No free-form graph query input.
 context=store.context()
 decision=context['decisions'][0] if not context['ambiguous'] else None
 if not decision:return {'ready':True,'blocked':True,'issues':context['changeReview']['issues']}
 root=context['task'][0][3]
 rows=store.q('bounded_dependency_impact','MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) MATCH p=(s)-[:DEPENDS_ON*0..5]->(root:Service {id:$root}) WHERE all(node IN nodes(p) WHERE single(other IN nodes(p) WHERE other=node)) MATCH (t:Team)-[:RESPONSIBLE_FOR]->(w) OPTIONAL MATCH (owner:Employee)-[:ASSIGNED_TO]->(w) RETURN w.id,w.title,s.id,s.title,t.title,owner.title,[node IN nodes(p)|node.title],[edge IN relationships(p)|type(edge)],[node IN nodes(p)|node.id],w.source ORDER BY w.id',{'root':root})
 grouped={}
 for row in rows:
  item=grouped.setdefault(row[0],{'id':row[0],'title':row[1],'serviceId':row[2],'service':row[3],'team':row[4],'owners':[],'paths':[],'pathIds':[],'source':row[9]})
  if row[5] and row[5] not in item['owners']:item['owners'].append(row[5])
  if row[8] not in item['pathIds']:
   item['pathIds'].append(row[8]);item['paths'].append(row[6])
 cache={}
 for item in grouped.values():
  service=item['serviceId']
  if service not in cache:
   cache[service]=[[context['task'][0][2]]] if service==root else store.q('native_dependency_explanation','MATCH (s:Service {id:$service}),(root:Service {id:$root}) CALL algo.SPpaths({sourceNode:s,targetNode:root,relTypes:["DEPENDS_ON"],relDirection:"outgoing",weightProp:"weight",maxLen:5,pathCount:1}) YIELD path RETURN [node IN nodes(path)|node.title]',{'service':service,'root':root})
  native=cache[service]
  if service!=root and not native:raise ValueError('A native dependency explanation is unavailable')
  item['explanation']=[item['title']]+(native[0][0] if service!=root and native else [context['task'][0][2]])+[decision[1]]
  item['algorithm']='Direct service link' if service==root else 'algo.SPpaths'
  item['routeCount']=len(item['paths'])
  item['links']=store.q('affected_source_links','MATCH (m:ExternalEvent)-[link:DISCUSSES]->(:WorkItem {id:$id}) OPTIONAL MATCH (n:ImportedNote)-[notes:NOTES_FOR]->(m) RETURN m.id,m.title,m.source,link.method,link.evidence,n.id,n.title,n.body,notes.method,notes.evidence,n.source ORDER BY m.id,n.id',{'id':item['id']})
 all_work=store.q('all_imported_work','MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) RETURN w.id,w.title,s.title ORDER BY w.id')
 excluded=[{'id':r[0],'title':r[1],'service':r[2]} for r in all_work if r[0] not in grouped]
 unresolved_events=store.q('unresolved_calendar_links','MATCH (m:ExternalEvent) WHERE NOT (m)-[:DISCUSSES]->(:WorkItem) RETURN m.id,m.title ORDER BY m.id')
 unresolved=store.q('unresolved_source_links','MATCH (n:ImportedNote) WHERE NOT (n)-[:NOTES_FOR]->(:ExternalEvent) RETURN n.id,n.title,n.meetingId ORDER BY n.id')
 dependencies=store.q('dependency_links','MATCH (a:Service)-[:DEPENDS_ON]->(b:Service) RETURN a.id,a.title,b.id,b.title ORDER BY a.id,b.id')
 experiment_data=json.loads((Path(__file__).parent/'fixtures/company-sources.json').read_text())['experiment']
 experiment_names=store.q('experiment_dependency_identity','MATCH (a:Service {id:$a}),(b:Service {id:$b}) RETURN a.title,b.title',{'a':experiment_data['from'],'b':experiment_data['to']})
 experiment_link={'from':experiment_names[0][0],'to':experiment_names[0][1],'connected':any(row[0]==experiment_data['from'] and row[2]==experiment_data['to'] for row in dependencies)} if experiment_names else None
 return {'experimentLink':experiment_link,'ready':True,'blocked':False,'decision':{'id':decision[0],'title':decision[1],'sourceId':decision[2],'sourceTitle':decision[3]},'root':context['task'][0][2],'items':list(grouped.values()),'excluded':excluded,'unresolved':unresolved,'unresolvedEvents':unresolved_events,'dependencies':dependencies,'depthLimit':MAX_DEPTH,'corpusHash':corpus_hash(store),'synthetic':True}

def run(store,operation='analyze'):
 if operation not in ['analyze','import','remove','restore']:raise ValueError('Unknown impact operation')
 if operation=='import':import_sources(store)
 if operation in ['remove','restore']:
  before=analyze(store)
  if not before['ready'] or before.get('blocked'):raise ValueError('Import sources and resolve decision authority first')
  # This is a single server-owned synthetic experiment, never arbitrary client-selected edges.
  data=json.loads((Path(__file__).parent/'fixtures/company-sources.json').read_text())['experiment']
  if not before['experimentLink'] or (operation=='remove' and not before['experimentLink']['connected']) or (operation=='restore' and before['experimentLink']['connected']):raise ValueError('This dependency is already in the requested state')
  if operation=='remove':store.q('remove_sample_dependency','MATCH (a:Service {id:$a})-[r:DEPENDS_ON]->(b:Service {id:$b}) DELETE r',{'a':data['from'],'b':data['to']},True)
  else:store.q('restore_sample_dependency','MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"',{'a':data['from'],'b':data['to']},True)
  after=analyze(store)
  old={item['id'] for item in before['items']};new={item['id'] for item in after['items']}
  after['experiment']={'operation':operation,'removed':sorted(old-new),'added':sorted(new-old),'retained':sorted(old&new),'documentsUnchanged':before['corpusHash']==after['corpusHash'],'beforeHash':before['corpusHash'],'afterHash':after['corpusHash'],'beforeRoutes':{item['id']:item['routeCount'] for item in before['items']},'afterRoutes':{item['id']:item['routeCount'] for item in after['items']}}
  return after
 return analyze(store)
