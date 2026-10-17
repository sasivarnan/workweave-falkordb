# Cypher catalogue

Generated from graph.py and impact.py by scripts/export_queries.py. Dynamic templates use code-owned labels and relationship types. Parameters are passed separately by the official client.

## workspace_check
Source: graph.py:65

```cypher
MATCH (m:Meta {id:$id}) RETURN m.id
```

## approve
Source: graph.py:78

```cypher
MATCH (d:Decision) SET d.approved=true
```

## seed_complete
Source: graph.py:87

```cypher
CREATE (:Meta {id:$id})
```

## identity_version
Source: graph.py:91

```cypher
MATCH (:Meta {id:"identity-v1"}) RETURN true
```

## seed_workspace_identity
Source: graph.py:92

```cypher
MATCH (e:Employee {id:"maya"}),(t:Team {id:"payments"}) MERGE (o:Organization {id:"northstar"}) SET o.title="Northstar Labs",o.timezone="Asia/Kolkata" SET t.department="Engineering" MERGE (e)-[:WORKS_AT]->(o) MERGE (:Meta {id:"identity-v1"})
```

## catalog_version
Source: graph.py:94

```cypher
MATCH (m:Meta {id:"catalog-v2"}) RETURN m.id
```

## approve_refund_policy
Source: graph.py:99

```cypher
MATCH (d:Decision {id:"refund-policy"}) SET d.approved=true
```

## catalog_ready
Source: graph.py:100

```cypher
CREATE (:Meta {id:"catalog-v2"})
```

## week_version
Source: graph.py:102

```cypher
MATCH (:Meta {id:"week-v1"}) RETURN true
```

## week_ready
Source: graph.py:106

```cypher
CREATE (:Meta {id:"week-v1"})
```

## search_version
Source: graph.py:108

```cypher
MATCH (:Meta {id:"search-v1"}) RETURN true
```

## create_document_search
Source: graph.py:109

```cypher
CALL db.idx.fulltext.createNodeIndex("Document","title","body")
```

## search_ready
Source: graph.py:110

```cypher
CREATE (:Meta {id:"search-v1"})
```

## search_company_documents
Source: graph.py:114

```cypher
CALL db.idx.fulltext.queryNodes("Document",$query) YIELD node,score RETURN node.id,node.title,node.body,score ORDER BY score DESC LIMIT 10
```

## company_version
Source: graph.py:116

```cypher
MATCH (:Meta {id:"company-v1"}) RETURN true
```

## company_ready
Source: graph.py:122

```cypher
CREATE (:Meta {id:"company-v1"})
```

## decision_review_version
Source: graph.py:124

```cypher
MATCH (:Meta {id:"decision-review-v1"}) RETURN true
```

## seed_decision_authority
Source: graph.py:125

```cypher
MATCH (d:Decision {id:"provider-b"}),(owner:Employee {id:"leo"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"migration-approval"}) SET m.title="Provider migration approval",m.starts="2026-10-14T10:00:00+05:30",m.body="Approve the provider migration for checkout." MERGE (m)-[:APPROVED]->(d)
```

## seed_refund_authority
Source: graph.py:126

```cypher
MATCH (d:Decision {id:"refund-policy"}),(owner:Employee {id:"noah"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner)
```

## decision_review_ready
Source: graph.py:127

```cypher
MERGE (:Meta {id:"decision-review-v1"})
```

## decision_history
Source: graph.py:129

```cypher
MATCH (d:Decision)-[:APPLIES_TO]->(s:Service {id:$service}) OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision) OPTIONAL MATCH (d)-[:APPROVED_BY]->(owner:Employee) OPTIONAL MATCH (m:Meeting)-[:APPROVED|PROPOSED]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,d.approved,old.title,owner.title,d.approvedAt,d.effectiveAt,m.id,m.title,src.id,src.title,d.proposedAt ORDER BY coalesce(d.proposedAt,d.approvedAt,0) DESC,d.id
```

## decision_affected_assignments
Source: graph.py:130

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service {id:$service}) OPTIONAL MATCH (e)-[:HAS_PLAN]->(plan:LearningPlan)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (plan)-[:SUPPORTED_BY]->(used:Decision) OPTIONAL MATCH (e)-[:ACKNOWLEDGED]->(receipt:DecisionReview)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (receipt)-[:BASED_ON]->(ack:Decision) RETURN a.id,a.title,e.title,s.title,used.id,used.title,plan.note,ack.id,receipt.at,plan.id ORDER BY a.title
```

## decision_affected_meetings
Source: graph.py:131

```cypher
MATCH p=(m:Meeting)-[:CONSIDERS]->(old:Decision)<-[:SUPERSEDES*1..4]-(d:Decision {id:$decision}) MATCH (:Employee {id:$employee})-[:ATTENDS]->(m) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,n.id,n.title,[node IN nodes(p) | node.title]
```

## decision_unaffected_assignments
Source: graph.py:132

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service) WHERE s.id<>$service RETURN a.id,a.title,s.title ORDER BY a.title
```

## get_assignment_context
Source: graph.py:150

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:TOUCHES]->(s:Service) RETURN a.title,a.body,s.title,s.id
```

## list_my_assignments
Source: graph.py:153

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment) RETURN a.id,a.title,a.body ORDER BY a.title
```

## find_relevant_people
Source: graph.py:154

```cypher
MATCH (e:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(s:Service {id:$service}) RETURN e.id,e.title,e.body,type(r)
```

## get_current_guidance
Source: graph.py:155

```cypher
MATCH (d:Decision)-[:APPLIES_TO]->(:Service {id:$service}) WHERE d.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,src.id,src.title,src.body
```

## find_outdated_guidance
Source: graph.py:156

```cypher
MATCH p=(doc:Document)-[:RECOMMENDS]->(old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision)-[:APPLIES_TO]->(:Service)<-[:TOUCHES]-(a:Assignment {id:$assignment}) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN doc.id,doc.title,doc.body,old.title,current.title,[n IN nodes(p) | n.title]
```

## get_prerequisites
Source: graph.py:157

```cypher
MATCH (:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) OPTIONAL MATCH (:Employee {id:$employee})-[done:COMPLETED]->(t) RETURN t.id,t.title,done IS NOT NULL
```

## get_learning_progress
Source: graph.py:158

```cypher
MATCH (:Employee {id:$employee})-[:HAS_PLAN]->(p:LearningPlan)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) OPTIONAL MATCH (p)-[:SUPPORTED_BY]->(decision:Decision) RETURN p.title,p.guidance,p.note,decision.id
```

## explain_connection
Source: graph.py:159

```cypher
MATCH (a:Employee {id:$employee}),(b:Service {id:$service}) CALL algo.SPpaths({sourceNode:a,targetNode:b,relTypes:["ASSIGNED_TO","TOUCHES"],relDirection:"outgoing",weightProp:"weight",pathCount:1}) YIELD path RETURN [n IN nodes(path) | n.title]
```

## get_sources
Source: graph.py:160

```cypher
MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.title
```

## direct_context
Source: graph.py:161

```cypher
MATCH (:Assignment {id:$id})-[:SUPPORTED_BY]->(d:Document) RETURN d.title
```

## connected_context
Source: graph.py:162

```cypher
MATCH p=(:Assignment {id:$id})-[:TOUCHES|APPLIES_TO|SUPERSEDES|RECOMMENDS|SUPPORTED_BY*1..5]-(d:Document) RETURN DISTINCT d.title ORDER BY d.title LIMIT 30
```

## get_read_guidance
Source: graph.py:168

```cypher
MATCH (:Employee {id:$employee})-[:READ_GUIDANCE]->(:Decision {id:$decision}) RETURN true
```

## get_first_week
Source: graph.py:169

```cypher
MATCH (:Employee {id:$employee})-[:HAS_WEEK_STEP]->(w:WeekStep)-[:OPENS]->(target) RETURN w.day,w.title,w.body,target.id,labels(target)[0] ORDER BY w.day
```

## get_team_reviewers
Source: graph.py:170

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(:Assignment)-[:TOUCHES]->(s:Service)<-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]-(p:Employee) RETURN DISTINCT p.id,p.title,p.body,type(r) ORDER BY p.title
```

## find_changes_affecting_my_work
Source: graph.py:171

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current:Decision)-[:SUPERSEDES*1..4]->(old:Decision)<-[:RECOMMENDS]-(doc:Document) MATCH (current)-[:SUPPORTED_BY]->(src:Document) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN DISTINCT a.id,a.title,doc.id,doc.title,old.title,current.title,src.id,src.title,src.body ORDER BY a.title
```

## get_review_request
Source: graph.py:172

```cypher
MATCH (:Employee {id:$employee})-[:CREATED]->(r:ReviewRequest)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) MATCH (r)-[:ASSIGNED_REVIEWER]->(reviewer:Employee),(r)-[:BASED_ON]->(d:Decision) RETURN r.id,r.status,reviewer.title,d.id,r.note
```

## company_calendar
Source: graph.py:173

```cypher
MATCH (:Employee {id:$employee})-[:ATTENDS]->(m:Meeting) OPTIONAL MATCH (m)-[:DISCUSSES]->(a:Assignment) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,m.body,m.starts,a.id,n.id ORDER BY m.starts
```

## company_notes
Source: graph.py:174

```cypher
MATCH (n:Document) WHERE (n)-[:NOTES_FOR]->(:Meeting) OR (:Employee {id:$employee})-[:CREATED]->(n) RETURN n.id,n.title,n.body ORDER BY n.title
```

## company_change_impact
Source: graph.py:175

```cypher
MATCH (old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) MATCH (m:Meeting)-[:CONSIDERS]->(old) MATCH (n:Document)-[:NOTES_FOR]->(m) MATCH (m)-[:DISCUSSES]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current) RETURN DISTINCT current.title,m.title,n.title,a.title ORDER BY m.title
```

## workspace_identity
Source: graph.py:176

```cypher
MATCH (e:Employee {id:$employee})-[:WORKS_AT]->(o:Organization),(e)-[:MEMBER_OF]->(t:Team) RETURN o.id,o.title,o.timezone,e.id,e.title,t.id,t.title,t.department
```

## seed_node
Source: graph.py:75

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_edge
Source: graph.py:77

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## create_index
Source: graph.py:80

```cypher
f'CREATE INDEX FOR (n:{label}) ON (n.id)'
```

## seed_assignment
Source: graph.py:96

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_assignment_link
Source: graph.py:98

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## seed_week_step
Source: graph.py:105

```cypher
MATCH (e:Employee {id:"maya"}),(target {id:$target}) MERGE (w:WeekStep {id:$id}) SET w.day=$day,w.title=$title,w.body=$body MERGE (e)-[:HAS_WEEK_STEP]->(w) MERGE (w)-[:OPENS]->(target)
```

## seed_company_record
Source: graph.py:119

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body,n.starts=$start'
```

## seed_company_link
Source: graph.py:121

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r}]->(b)'
```

## replace_decision
Source: graph.py:185

```cypher
MERGE (d:Decision {id:"provider-c"}) SET d.title="Use Provider C",d.approved=true MERGE (src:Document {id:"adr-c"}) SET src.title="ADR-043: Provider C",src.body="Approved demo change: Provider C replaces Provider B." WITH d,src MATCH (old:Decision {id:"provider-b"}),(s:Service {id:"checkout-service"}) MERGE (d)-[:SUPERSEDES {weight:1}]->(old) MERGE (d)-[:SUPPORTED_BY {weight:1}]->(src) MERGE (d)-[:APPLIES_TO {weight:1}]->(s)
```

## record_replacement_approval
Source: graph.py:186

```cypher
MATCH (d:Decision {id:"provider-c"}),(owner:Employee {id:"leo"}) SET d.approvedAt=coalesce(d.approvedAt,$now),d.effectiveAt=coalesce(d.effectiveAt,$now) MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"replacement-approval"}) SET m.title="Checkout decision review",m.starts=coalesce(m.starts,$starts),m.body="Approve the replacement provider decision." MERGE (m)-[:APPROVED]->(d)
```

## record_newer_proposal
Source: graph.py:188

```cypher
MATCH (e:Employee {id:"maya"}),(s:Service {id:"checkout-service"}) MERGE (d:Decision {id:"provider-proposal"}) SET d.title="Consider Provider D",d.approved=false,d.proposedAt=$now MERGE (m:Meeting {id:"proposal-review"}) SET m.title="Explore another provider",m.starts=$starts,m.body="Discuss an alternative. No replacement has been approved." MERGE (src:Document {id:"proposal-notes"}) SET src.title="Provider exploration notes",src.body="Provider D was proposed for investigation. No approval was given." MERGE (d)-[:APPLIES_TO]->(s) MERGE (d)-[:SUPPORTED_BY]->(src) MERGE (m)-[:PROPOSED]->(d) MERGE (src)-[:NOTES_FOR]->(m) MERGE (e)-[:ATTENDS]->(m)
```

## acknowledge_decision_version
Source: graph.py:192

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(d:Decision {id:$decision}) MERGE (r:DecisionReview {id:$id}) ON CREATE SET r.at=$now MERGE (e)-[:ACKNOWLEDGED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) MERGE (r)-[:BASED_ON]->(d) MERGE (e)-[:READ_GUIDANCE]->(d)
```

## remove_owner
Source: graph.py:194

```cypher
MATCH (:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(:Service {id:$id}) DELETE r
```

## complete_learning_step
Source: graph.py:197

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) MERGE (e)-[:COMPLETED]->(t)
```

## mark_guidance_read
Source: graph.py:201

```cypher
MATCH (e:Employee {id:$employee}),(d:Decision {id:$decision}) MERGE (e)-[:READ_GUIDANCE]->(d)
```

## save_learning_plan
Source: graph.py:205

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}) MERGE (p:LearningPlan {id:$plan}) SET p.title=a.title,p.guidance=$guidance,p.note=$note MERGE (e)-[:HAS_PLAN]->(p) MERGE (p)-[:FOR_ASSIGNMENT]->(a)
```

## save_plan_evidence
Source: graph.py:206

```cypher
MATCH (p:LearningPlan {id:$plan}),(d:Decision {id:$decision}) WITH p,d OPTIONAL MATCH (p)-[old:SUPPORTED_BY]->() DELETE old MERGE (p)-[:SUPPORTED_BY]->(d)
```

## save_workspace_note
Source: graph.py:208

```cypher
MATCH (e:Employee {id:"maya"}) MERGE (n:Document {id:"personal-note"}) SET n.title="My workspace note",n.body=$note MERGE (e)-[:CREATED]->(n)
```

## create_review_request
Source: graph.py:213

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(reviewer:Employee {id:$reviewer}),(d:Decision {id:$decision}) MERGE (r:ReviewRequest {id:$id}) SET r.status="Awaiting review",r.note=$note MERGE (e)-[:CREATED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) WITH r,reviewer,d OPTIONAL MATCH (r)-[old:BASED_ON|ASSIGNED_REVIEWER]->() DELETE old MERGE (r)-[:BASED_ON]->(d) MERGE (r)-[:ASSIGNED_REVIEWER]->(reviewer)
```

## match_exact_meeting_instance
Source: impact.py:7

```cypher
MATCH (m:ExternalEvent {zoomMeetingId:$meeting}) RETURN m.id
```

## link_exact_meeting_id
Source: impact.py:9

```cypher
MATCH (n:ImportedNote {id:$id}),(m:ExternalEvent {id:$event}) MERGE (n)-[r:NOTES_FOR]->(m) SET r.evidence=$meeting,r.method="exact meeting ID"
```

## imported_content_hash
Source: impact.py:36

```cypher
MATCH (n) WHERE n:WorkItem OR n:ImportedNote OR n:ExternalEvent OR n:Document RETURN labels(n),n.id,n.title,n.body ORDER BY n.id
```

## bounded_dependency_impact
Source: impact.py:46

```cypher
MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) MATCH p=(s)-[:DEPENDS_ON*0..5]->(root:Service {id:$root}) WHERE all(node IN nodes(p) WHERE single(other IN nodes(p) WHERE other=node)) MATCH (t:Team)-[:RESPONSIBLE_FOR]->(w) OPTIONAL MATCH (owner:Employee)-[:ASSIGNED_TO]->(w) RETURN w.id,w.title,s.id,s.title,t.title,owner.title,[node IN nodes(p)|node.title],[edge IN relationships(p)|type(edge)],[node IN nodes(p)|node.id],w.source ORDER BY w.id
```

## all_imported_work
Source: impact.py:64

```cypher
MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) RETURN w.id,w.title,s.title ORDER BY w.id
```

## unresolved_calendar_links
Source: impact.py:66

```cypher
MATCH (m:ExternalEvent) WHERE NOT (m)-[:DISCUSSES]->(:WorkItem) RETURN m.id,m.title ORDER BY m.id
```

## unresolved_source_links
Source: impact.py:67

```cypher
MATCH (n:ImportedNote) WHERE NOT (n)-[:NOTES_FOR]->(:ExternalEvent) RETURN n.id,n.title,n.meetingId ORDER BY n.id
```

## dependency_links
Source: impact.py:68

```cypher
MATCH (a:Service)-[:DEPENDS_ON]->(b:Service) RETURN a.id,a.title,b.id,b.title ORDER BY a.id,b.id
```

## experiment_dependency_identity
Source: impact.py:70

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) RETURN a.title,b.title
```

## import_version
Source: impact.py:14

```cypher
MATCH (:Meta {id:"source-import-v1"}) RETURN true
```

## finish_source_import
Source: impact.py:32

```cypher
MERGE (:Meta {id:"source-import-v1"})
```

## impact_import_ready
Source: impact.py:40

```cypher
MATCH (:Meta {id:"source-import-v1"}) RETURN true
```

## affected_source_links
Source: impact.py:63

```cypher
MATCH (m:ExternalEvent)-[link:DISCUSSES]->(:WorkItem {id:$id}) OPTIONAL MATCH (n:ImportedNote)-[notes:NOTES_FOR]->(m) RETURN m.id,m.title,m.source,link.method,link.evidence,n.id,n.title,n.body,notes.method,notes.evidence,n.source ORDER BY m.id,n.id
```

## import_service
Source: impact.py:16

```cypher
MERGE (n:Service {id:$id}) SET n.title=$title
```

## import_team
Source: impact.py:18

```cypher
MERGE (n:Team {id:$id}) SET n.title=$title
```

## import_person
Source: impact.py:20

```cypher
MERGE (e:Employee {id:$id}) SET e.title=$title WITH e MATCH (t:Team {id:$team}) MERGE (e)-[:MEMBER_OF]->(t)
```

## import_dependency
Source: impact.py:22

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"
```

## import_jira_issue
Source: impact.py:24

```cypher
MATCH (s:Service {id:$service}),(t:Team {id:$team}) MERGE (w:WorkItem {id:$key}) SET w.title=$title,w.body=$body,w.source="Jira export",w.sourceId=$key MERGE (w)-[:TOUCHES]->(s) MERGE (t)-[:RESPONSIBLE_FOR]->(w)
```

## import_calendar_event
Source: impact.py:27

```cypher
MERGE (m:ExternalEvent {id:$id}) SET m.title=$title,m.zoomMeetingId=$zoom,m.source="Google Calendar export",m.sourceId=$id
```

## import_zoom_note
Source: impact.py:30

```cypher
MERGE (n:ImportedNote {id:$id}) SET n.title=$title,n.body=$body,n.meetingId=$meeting,n.source="Zoom export",n.sourceId=$id
```

## remove_sample_dependency
Source: impact.py:83

```cypher
MATCH (a:Service {id:$a})-[r:DEPENDS_ON]->(b:Service {id:$b}) DELETE r
```

## restore_sample_dependency
Source: impact.py:84

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"
```

## import_issue_owner
Source: impact.py:25

```cypher
MATCH (e:Employee {id:$owner}),(w:WorkItem {id:$key}) MERGE (e)-[:ASSIGNED_TO]->(w)
```

## link_exact_issue_key
Source: impact.py:28

```cypher
MATCH (m:ExternalEvent {id:$event}),(w:WorkItem {id:$key}) MERGE (m)-[r:DISCUSSES]->(w) SET r.evidence=$key,r.method="exact issue key"
```

## native_dependency_explanation
Source: impact.py:57

```cypher
MATCH (s:Service {id:$service}),(root:Service {id:$root}) CALL algo.SPpaths({sourceNode:s,targetNode:root,relTypes:["DEPENDS_ON"],relDirection:"outgoing",weightProp:"weight",maxLen:5,pathCount:1}) YIELD path RETURN [node IN nodes(path)|node.title]
```
