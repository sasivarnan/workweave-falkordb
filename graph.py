"""Fixed graph operations. No model-generated Cypher is executed."""
import os, re, time
from functools import lru_cache
from falkordb import FalkorDB

@lru_cache(maxsize=1)
def database():
 return FalkorDB(host=os.getenv('FALKORDB_HOST','localhost'),port=int(os.getenv('FALKORDB_PORT','6381')),username=os.getenv('FALKORDB_USERNAME') or None,password=os.getenv('FALKORDB_PASSWORD') or None,ssl=os.getenv('FALKORDB_SSL','false').lower()=='true',socket_timeout=8,socket_connect_timeout=5)

NODES = [
 ('Employee','maya','Maya Chen','New software engineer · Payments'),
 ('Employee','leo','Leo Martin','Service owner · Payments'),
 ('Employee','imani','Imani Shah','Documented alternate reviewer'),
 ('Team','payments','Payments','Checkout and transaction platform'),
 ('Assignment','checkout','Ship your first checkout change','Add a payment status indicator'),
 ('Service','checkout-service','Checkout service','Customer-facing checkout'),
 ('Decision','provider-a','Use Provider A','Approved historical decision'),
 ('Decision','provider-b','Use Provider B','Approved replacement decision'),
 ('Document','guide','Checkout starter guide','Use Provider A for checkout integration. Updated 2026-08-01.'),
 ('Document','adr','ADR-042: Provider migration','Provider B replaces Provider A. Approved 2026-10-14. Provider A is no longer used for new checkout changes.'),
 ('Document','review','Review policy','Leo owns checkout reviews. Imani is the approved alternate reviewer.'),
 ('Document','security-doc','Secure payments checklist','Complete secure payments training before changing checkout.'),
 ('Training','security','Secure payments training','Required before the first checkout change'),
 ('Document','task-doc','ENG-108: Status indicator','Add the status indicator. Follow current provider guidance and obtain a code review.'),
 ('Document','team-doc','Payments team charter','Payments owns the checkout service.'),
 ('Document','access','Sandbox access guide','Ask the service owner to approve sandbox access.'),
 ('Document','release','Release checklist','Complete required training and obtain reviewer approval.'),
 ('Document','architecture','Checkout architecture','Checkout uses the selected payment provider.'),
 ('Document','glossary','Payments glossary','Authorization, settlement, and refund terminology.'),
 ('Document','testing','Sandbox test guide','Use synthetic transactions only.'),
 ('Document','support','Customer support note','The status indicator helps explain pending transactions.'),
 ('Document','quality','Code review checklist','Cover pending and failed payment states.'),
 ('Document','handoff','Team handoff note','Use the approved migration decision for new work.'),
 ('Document','welcome','Welcome to Payments','Start with ENG-108 and meet your reviewer.'),
 ('Document','runbook','Checkout runbook','Use the service owner for operational questions.'),
]
EDGES=[('maya','MEMBER_OF','payments'),('maya','ASSIGNED_TO','checkout'),('checkout','TOUCHES','checkout-service'),('payments','OWNS','checkout-service'),('leo','REVIEWER_FOR','checkout-service'),('imani','BACKUP_REVIEWER_FOR','checkout-service'),('checkout','REQUIRES','security'),('provider-a','APPLIES_TO','checkout-service'),('provider-b','APPLIES_TO','checkout-service'),('provider-b','SUPERSEDES','provider-a'),('provider-b','SUPPORTED_BY','adr'),('guide','RECOMMENDS','provider-a'),('security','SUPPORTED_BY','security-doc'),('checkout','SUPPORTED_BY','task-doc'),('checkout-service','SUPPORTED_BY','architecture'),('leo','SUPPORTED_BY','review')]

class Store:
 def __init__(self, token):
  if not re.fullmatch(r'[a-f0-9]{32}',token): raise ValueError('Invalid workspace')
  self.name='firsttask_'+token
  self.db=database()
  self.g=self.db.select_graph(self.name); self.trace=[]
 def q(self,name,query,params=None,write=False):
  start=time.monotonic()
  result=(self.g.query if write else self.g.ro_query)(query,params or {}).result_set
  self.trace.append({'tool':name,'query':query,'arguments':params or {},'rows':len(result),'ms':round((time.monotonic()-start)*1000,2)})
  return result
 def seed(self):
  if self.q('workspace_check','MATCH (m:Meta {id:$id}) RETURN m.id',{'id':'seed'},True):
   self.g.execute_command('EXPIRE',self.name,86400)
   return
  for label,id,title,body in NODES:
   self.q('seed_node',f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body',{'id':id,'title':title,'body':body},True)
  for a,r,b in EDGES:
   self.q('seed_edge',f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)',{'a':a,'b':b},True)
  self.q('approve','MATCH (d:Decision) SET d.approved=true',write=True)
  for label in ('Employee','Assignment','Service','Decision','Document','Training','LearningPlan'):
   self.q('create_index',f'CREATE INDEX FOR (n:{label}) ON (n.id)',write=True)
  self.q('seed_complete','CREATE (:Meta {id:$id})',{'id':'seed'},True)
  self.g.execute_command('EXPIRE',self.name,86400)
  self.trace=[]
 def context(self):
  task=self.q('get_assignment_context','MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service) RETURN a.title,a.body,s.title',{'employee':'maya'})
  people=self.q('find_relevant_people','MATCH (e:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(s:Service {id:$service}) RETURN e.id,e.title,e.body,type(r)',{'service':'checkout-service'})
  decisions=self.q('get_current_guidance','MATCH (d:Decision)-[:APPLIES_TO]->(:Service {id:$service}) WHERE d.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,src.id,src.title,src.body',{'service':'checkout-service'})
  conflicts=self.q('find_outdated_guidance','MATCH p=(doc:Document)-[:RECOMMENDS]->(old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision)-[:APPLIES_TO]->(:Service)<-[:TOUCHES]-(a:Assignment {id:$assignment}) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN doc.id,doc.title,doc.body,old.title,current.title,[n IN nodes(p) | n.title]',{'assignment':'checkout'})
  training=self.q('get_prerequisites','MATCH (:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) OPTIONAL MATCH (:Employee {id:$employee})-[done:COMPLETED]->(t) RETURN t.id,t.title,done IS NOT NULL',{'assignment':'checkout','employee':'maya'})
  plan=self.q('get_learning_progress','MATCH (:Employee {id:$employee})-[:HAS_PLAN]->(p:LearningPlan) RETURN p.title,p.guidance,p.note',{'employee':'maya'})
  path=self.q('explain_connection','MATCH (a:Employee {id:$employee}),(b:Service {id:$service}) CALL algo.SPpaths({sourceNode:a,targetNode:b,relTypes:["ASSIGNED_TO","TOUCHES"],relDirection:"outgoing",weightProp:"weight",pathCount:1}) YIELD path RETURN [n IN nodes(path) | n.title]',{'employee':'maya','service':'checkout-service'})
  sources=self.q('get_sources','MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.title')
  direct=self.q('direct_context','MATCH (:Assignment {id:$id})-[:SUPPORTED_BY]->(d:Document) RETURN d.title',{'id':'checkout'})
  connected=self.q('connected_context','MATCH p=(:Assignment {id:$id})-[:TOUCHES|APPLIES_TO|SUPERSEDES|RECOMMENDS|SUPPORTED_BY*1..5]-(d:Document) RETURN DISTINCT d.title ORDER BY d.title LIMIT 30',{'id':'checkout'})
  lookup='MATCH (a:Assignment {id:$id}) RETURN a.title'
  plan_start=time.monotonic()
  execution_plan=str(self.g.explain(lookup,{'id':'checkout'}))
  self.trace.append({'tool':'explain_assignment_lookup','query':lookup,'arguments':{'id':'checkout'},'rows':0,'ms':round((time.monotonic()-plan_start)*1000,2),'executionPlan':execution_plan})
  current=decisions[0][1] if len(decisions)==1 else None
  return {'task':task,'people':people,'decisions':decisions,'conflicts':conflicts,'training':training,'plan':plan,'paths':path,'sources':sources,'current':current,'needsReview':bool(plan and plan[0][1]!=current),'ambiguous':len(decisions)!=1 or not decisions[0][2],'direct':direct,'connected':connected}
 def action(self,name,note=''):
  if name=='replace':
   self.q('replace_decision','MERGE (d:Decision {id:"provider-c"}) SET d.title="Use Provider C",d.approved=true MERGE (src:Document {id:"adr-c"}) SET src.title="ADR-043: Provider C",src.body="Approved demo change: Provider C replaces Provider B." WITH d,src MATCH (old:Decision {id:"provider-b"}),(s:Service {id:"checkout-service"}) MERGE (d)-[:SUPERSEDES {weight:1}]->(old) MERGE (d)-[:SUPPORTED_BY {weight:1}]->(src) MERGE (d)-[:APPLIES_TO {weight:1}]->(s)',write=True)
  elif name=='remove-owner':
   self.q('remove_owner','MATCH (:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(:Service {id:$id}) DELETE r',{'id':'checkout-service'},True)
  elif name=='complete':
   self.q('complete_learning_step','MATCH (e:Employee {id:$employee}),(t:Training {id:$training}) MERGE (e)-[:COMPLETED]->(t)',{'employee':'maya','training':'security'},True)
  elif name=='accept':
   c=self.context()
   if c['ambiguous']:raise ValueError('Resolve current guidance before accepting a plan')
   self.q('save_learning_plan','MATCH (e:Employee {id:$employee}) MERGE (p:LearningPlan {id:"first-plan"}) SET p.title="My first checkout change",p.guidance=$guidance,p.note=$note MERGE (e)-[:HAS_PLAN]->(p)',{'employee':'maya','guidance':c['current'],'note':note[:500]},True)
   self.q('save_plan_evidence','MATCH (p:LearningPlan {id:"first-plan"}),(d:Decision {id:$decision}),(a:Assignment {id:"checkout"}) MERGE (p)-[:FOR_ASSIGNMENT]->(a) MERGE (p)-[:SUPPORTED_BY]->(d)',{'decision':c['decisions'][0][0]},True)
  else:raise ValueError('Unknown action')
 def reset(self):
  self.g.delete();self.g=self.db.select_graph(self.name);self.seed()
