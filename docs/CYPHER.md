# Cypher catalogue

Generated from graph.py by scripts/export_queries.py. Dynamic templates use code-owned labels and relationship types. Parameters are passed separately by the official client.

## workspace_check
Source: graph.py:65

```cypher
MATCH (m:Meta {id:$id}) RETURN m.id
```

## approve
Source: graph.py:77

```cypher
MATCH (d:Decision) SET d.approved=true
```

## seed_complete
Source: graph.py:85

```cypher
CREATE (:Meta {id:$id})
```

## identity_version
Source: graph.py:89

```cypher
MATCH (:Meta {id:"identity-v1"}) RETURN true
```

## seed_workspace_identity
Source: graph.py:90

```cypher
MATCH (e:Employee {id:"maya"}),(t:Team {id:"payments"}) MERGE (o:Organization {id:"northstar"}) SET o.title="Northstar Labs",o.timezone="Asia/Kolkata" SET t.department="Engineering" MERGE (e)-[:WORKS_AT]->(o) MERGE (:Meta {id:"identity-v1"})
```

## catalog_version
Source: graph.py:92

```cypher
MATCH (m:Meta {id:"catalog-v2"}) RETURN m.id
```

## approve_refund_policy
Source: graph.py:97

```cypher
MATCH (d:Decision {id:"refund-policy"}) SET d.approved=true
```

## catalog_ready
Source: graph.py:98

```cypher
CREATE (:Meta {id:"catalog-v2"})
```

## week_version
Source: graph.py:100

```cypher
MATCH (:Meta {id:"week-v1"}) RETURN true
```

## week_ready
Source: graph.py:104

```cypher
CREATE (:Meta {id:"week-v1"})
```

## search_version
Source: graph.py:106

```cypher
MATCH (:Meta {id:"search-v1"}) RETURN true
```

## create_document_search
Source: graph.py:107

```cypher
CALL db.idx.fulltext.createNodeIndex("Document","title","body")
```

## search_ready
Source: graph.py:108

```cypher
CREATE (:Meta {id:"search-v1"})
```

## search_company_documents
Source: graph.py:112

```cypher
CALL db.idx.fulltext.queryNodes("Document",$query) YIELD node,score RETURN node.id,node.title,node.body,score ORDER BY score DESC LIMIT 10
```

## company_version
Source: graph.py:114

```cypher
MATCH (:Meta {id:"company-v1"}) RETURN true
```

## company_ready
Source: graph.py:120

```cypher
CREATE (:Meta {id:"company-v1"})
```

## get_assignment_context
Source: graph.py:122

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:TOUCHES]->(s:Service) RETURN a.title,a.body,s.title,s.id
```

## list_my_assignments
Source: graph.py:125

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment) RETURN a.id,a.title,a.body ORDER BY a.title
```

## find_relevant_people
Source: graph.py:126

```cypher
MATCH (e:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(s:Service {id:$service}) RETURN e.id,e.title,e.body,type(r)
```

## get_current_guidance
Source: graph.py:127

```cypher
MATCH (d:Decision)-[:APPLIES_TO]->(:Service {id:$service}) WHERE d.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,src.id,src.title,src.body
```

## find_outdated_guidance
Source: graph.py:128

```cypher
MATCH p=(doc:Document)-[:RECOMMENDS]->(old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision)-[:APPLIES_TO]->(:Service)<-[:TOUCHES]-(a:Assignment {id:$assignment}) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN doc.id,doc.title,doc.body,old.title,current.title,[n IN nodes(p) | n.title]
```

## get_prerequisites
Source: graph.py:129

```cypher
MATCH (:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) OPTIONAL MATCH (:Employee {id:$employee})-[done:COMPLETED]->(t) RETURN t.id,t.title,done IS NOT NULL
```

## get_learning_progress
Source: graph.py:130

```cypher
MATCH (:Employee {id:$employee})-[:HAS_PLAN]->(p:LearningPlan)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) OPTIONAL MATCH (p)-[:SUPPORTED_BY]->(decision:Decision) RETURN p.title,p.guidance,p.note,decision.id
```

## explain_connection
Source: graph.py:131

```cypher
MATCH (a:Employee {id:$employee}),(b:Service {id:$service}) CALL algo.SPpaths({sourceNode:a,targetNode:b,relTypes:["ASSIGNED_TO","TOUCHES"],relDirection:"outgoing",weightProp:"weight",pathCount:1}) YIELD path RETURN [n IN nodes(path) | n.title]
```

## get_sources
Source: graph.py:132

```cypher
MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.title
```

## direct_context
Source: graph.py:133

```cypher
MATCH (:Assignment {id:$id})-[:SUPPORTED_BY]->(d:Document) RETURN d.title
```

## connected_context
Source: graph.py:134

```cypher
MATCH p=(:Assignment {id:$id})-[:TOUCHES|APPLIES_TO|SUPERSEDES|RECOMMENDS|SUPPORTED_BY*1..5]-(d:Document) RETURN DISTINCT d.title ORDER BY d.title LIMIT 30
```

## get_read_guidance
Source: graph.py:140

```cypher
MATCH (:Employee {id:$employee})-[:READ_GUIDANCE]->(:Decision {id:$decision}) RETURN true
```

## get_first_week
Source: graph.py:141

```cypher
MATCH (:Employee {id:$employee})-[:HAS_WEEK_STEP]->(w:WeekStep)-[:OPENS]->(target) RETURN w.day,w.title,w.body,target.id,labels(target)[0] ORDER BY w.day
```

## get_team_reviewers
Source: graph.py:142

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(:Assignment)-[:TOUCHES]->(s:Service)<-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]-(p:Employee) RETURN DISTINCT p.id,p.title,p.body,type(r) ORDER BY p.title
```

## find_changes_affecting_my_work
Source: graph.py:143

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current:Decision)-[:SUPERSEDES*1..4]->(old:Decision)<-[:RECOMMENDS]-(doc:Document) MATCH (current)-[:SUPPORTED_BY]->(src:Document) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN DISTINCT a.id,a.title,doc.id,doc.title,old.title,current.title,src.id,src.title,src.body ORDER BY a.title
```

## get_review_request
Source: graph.py:144

```cypher
MATCH (:Employee {id:$employee})-[:CREATED]->(r:ReviewRequest)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) MATCH (r)-[:ASSIGNED_REVIEWER]->(reviewer:Employee),(r)-[:BASED_ON]->(d:Decision) RETURN r.id,r.status,reviewer.title,d.id,r.note
```

## company_calendar
Source: graph.py:145

```cypher
MATCH (:Employee {id:$employee})-[:ATTENDS]->(m:Meeting) OPTIONAL MATCH (m)-[:DISCUSSES]->(a:Assignment) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,m.body,m.starts,a.id,n.id ORDER BY m.starts
```

## company_notes
Source: graph.py:146

```cypher
MATCH (n:Document) WHERE (n)-[:NOTES_FOR]->(:Meeting) OR (:Employee {id:$employee})-[:CREATED]->(n) RETURN n.id,n.title,n.body ORDER BY n.title
```

## company_change_impact
Source: graph.py:147

```cypher
MATCH (old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) MATCH (m:Meeting)-[:CONSIDERS]->(old) MATCH (n:Document)-[:NOTES_FOR]->(m) MATCH (m)-[:DISCUSSES]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current) RETURN DISTINCT current.title,m.title,n.title,a.title ORDER BY m.title
```

## workspace_identity
Source: graph.py:148

```cypher
MATCH (e:Employee {id:$employee})-[:WORKS_AT]->(o:Organization),(e)-[:MEMBER_OF]->(t:Team) RETURN o.id,o.title,o.timezone,e.id,e.title,t.id,t.title,t.department
```

## seed_node
Source: graph.py:74

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_edge
Source: graph.py:76

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## create_index
Source: graph.py:79

```cypher
f'CREATE INDEX FOR (n:{label}) ON (n.id)'
```

## seed_assignment
Source: graph.py:94

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_assignment_link
Source: graph.py:96

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## seed_week_step
Source: graph.py:103

```cypher
MATCH (e:Employee {id:"maya"}),(target {id:$target}) MERGE (w:WeekStep {id:$id}) SET w.day=$day,w.title=$title,w.body=$body MERGE (e)-[:HAS_WEEK_STEP]->(w) MERGE (w)-[:OPENS]->(target)
```

## seed_company_record
Source: graph.py:117

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body,n.starts=$start'
```

## seed_company_link
Source: graph.py:119

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r}]->(b)'
```

## replace_decision
Source: graph.py:157

```cypher
MERGE (d:Decision {id:"provider-c"}) SET d.title="Use Provider C",d.approved=true MERGE (src:Document {id:"adr-c"}) SET src.title="ADR-043: Provider C",src.body="Approved demo change: Provider C replaces Provider B." WITH d,src MATCH (old:Decision {id:"provider-b"}),(s:Service {id:"checkout-service"}) MERGE (d)-[:SUPERSEDES {weight:1}]->(old) MERGE (d)-[:SUPPORTED_BY {weight:1}]->(src) MERGE (d)-[:APPLIES_TO {weight:1}]->(s)
```

## remove_owner
Source: graph.py:159

```cypher
MATCH (:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(:Service {id:$id}) DELETE r
```

## complete_learning_step
Source: graph.py:162

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) MERGE (e)-[:COMPLETED]->(t)
```

## mark_guidance_read
Source: graph.py:166

```cypher
MATCH (e:Employee {id:$employee}),(d:Decision {id:$decision}) MERGE (e)-[:READ_GUIDANCE]->(d)
```

## save_learning_plan
Source: graph.py:170

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}) MERGE (p:LearningPlan {id:$plan}) SET p.title=a.title,p.guidance=$guidance,p.note=$note MERGE (e)-[:HAS_PLAN]->(p) MERGE (p)-[:FOR_ASSIGNMENT]->(a)
```

## save_plan_evidence
Source: graph.py:171

```cypher
MATCH (p:LearningPlan {id:$plan}),(d:Decision {id:$decision}) WITH p,d OPTIONAL MATCH (p)-[old:SUPPORTED_BY]->() DELETE old MERGE (p)-[:SUPPORTED_BY]->(d)
```

## save_workspace_note
Source: graph.py:173

```cypher
MATCH (e:Employee {id:"maya"}) MERGE (n:Document {id:"personal-note"}) SET n.title="My workspace note",n.body=$note MERGE (e)-[:CREATED]->(n)
```

## create_review_request
Source: graph.py:178

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(reviewer:Employee {id:$reviewer}),(d:Decision {id:$decision}) MERGE (r:ReviewRequest {id:$id}) SET r.status="Awaiting review",r.note=$note MERGE (e)-[:CREATED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) WITH r,reviewer,d OPTIONAL MATCH (r)-[old:BASED_ON|ASSIGNED_REVIEWER]->() DELETE old MERGE (r)-[:BASED_ON]->(d) MERGE (r)-[:ASSIGNED_REVIEWER]->(reviewer)
```
