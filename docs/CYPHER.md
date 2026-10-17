# Cypher catalogue

Generated from src/workweave/graph.py and src/workweave/impact.py by scripts/export_queries.py. Dynamic templates use code-owned labels and relationship types. Parameters are passed separately by the official client.

## workspace_check
Source: src/workweave/graph.py:188

```cypher
MATCH (m:Meta {id:$id}) RETURN m.id
```

## approve
Source: src/workweave/graph.py:212

```cypher
MATCH (d:Decision) SET d.approved=true
```

## seed_complete
Source: src/workweave/graph.py:230

```cypher
CREATE (:Meta {id:$id})
```

## provider_names_version
Source: src/workweave/graph.py:236

```cypher
MATCH (:Meta {id:"provider-names-v1"}) RETURN true
```

## provider_names_complete
Source: src/workweave/graph.py:250

```cypher
MERGE (:Meta {id:"provider-names-v1"})
```

## identity_version
Source: src/workweave/graph.py:253

```cypher
MATCH (:Meta {id:"identity-v1"}) RETURN true
```

## seed_workspace_identity
Source: src/workweave/graph.py:255

```cypher
MATCH (e:Employee {id:"maya"}),(t:Team {id:"payments"}) MERGE (o:Organization {id:"northstar"}) SET o.title="Northstar Labs",o.timezone="Asia/Kolkata" SET t.department="Engineering" MERGE (e)-[:WORKS_AT]->(o) MERGE (:Meta {id:"identity-v1"})
```

## catalog_version
Source: src/workweave/graph.py:262

```cypher
MATCH (m:Meta {id:"catalog-v2"}) RETURN m.id
```

## approve_refund_policy
Source: src/workweave/graph.py:278

```cypher
MATCH (d:Decision {id:"refund-policy"}) SET d.approved=true
```

## catalog_ready
Source: src/workweave/graph.py:283

```cypher
CREATE (:Meta {id:"catalog-v2"})
```

## week_version
Source: src/workweave/graph.py:286

```cypher
MATCH (:Meta {id:"week-v1"}) RETURN true
```

## week_ready
Source: src/workweave/graph.py:326

```cypher
CREATE (:Meta {id:"week-v1"})
```

## search_version
Source: src/workweave/graph.py:329

```cypher
MATCH (:Meta {id:"search-v1"}) RETURN true
```

## create_document_search
Source: src/workweave/graph.py:331

```cypher
CALL db.idx.fulltext.createNodeIndex("Document","title","body")
```

## search_ready
Source: src/workweave/graph.py:336

```cypher
CREATE (:Meta {id:"search-v1"})
```

## search_company_documents
Source: src/workweave/graph.py:342

```cypher
CALL db.idx.fulltext.queryNodes("Document",$query) YIELD node,score RETURN node.id,node.title,node.body,score ORDER BY score DESC LIMIT 10
```

## company_version
Source: src/workweave/graph.py:349

```cypher
MATCH (:Meta {id:"company-v1"}) RETURN true
```

## company_ready
Source: src/workweave/graph.py:424

```cypher
CREATE (:Meta {id:"company-v1"})
```

## decision_review_version
Source: src/workweave/graph.py:427

```cypher
MATCH (:Meta {id:"decision-review-v1"}) RETURN true
```

## seed_decision_authority
Source: src/workweave/graph.py:429

```cypher
MATCH (d:Decision {id:"provider-b"}),(owner:Employee {id:"leo"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"migration-approval"}) SET m.title="Provider migration approval",m.starts="2026-10-14T10:00:00+05:30",m.body="Approve the provider migration for checkout." MERGE (m)-[:APPROVED]->(d)
```

## seed_refund_authority
Source: src/workweave/graph.py:434

```cypher
MATCH (d:Decision {id:"refund-policy"}),(owner:Employee {id:"noah"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner)
```

## decision_review_ready
Source: src/workweave/graph.py:439

```cypher
MERGE (:Meta {id:"decision-review-v1"})
```

## decision_history
Source: src/workweave/graph.py:442

```cypher
MATCH (d:Decision)-[:APPLIES_TO]->(s:Service {id:$service}) OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision) OPTIONAL MATCH (d)-[:APPROVED_BY]->(owner:Employee) OPTIONAL MATCH (m:Meeting)-[:APPROVED|PROPOSED]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,d.approved,old.title,owner.title,d.approvedAt,d.effectiveAt,m.id,m.title,src.id,src.title,d.proposedAt ORDER BY coalesce(d.proposedAt,d.approvedAt,0) DESC,d.id
```

## decision_affected_assignments
Source: src/workweave/graph.py:447

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service {id:$service}) OPTIONAL MATCH (e)-[:HAS_PLAN]->(plan:LearningPlan)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (plan)-[:SUPPORTED_BY]->(used:Decision) OPTIONAL MATCH (e)-[:ACKNOWLEDGED]->(receipt:DecisionReview)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (receipt)-[:BASED_ON]->(ack:Decision) RETURN a.id,a.title,e.title,s.title,used.id,used.title,plan.note,ack.id,receipt.at,plan.id ORDER BY a.title
```

## decision_affected_meetings
Source: src/workweave/graph.py:452

```cypher
MATCH p=(m:Meeting)-[:CONSIDERS]->(old:Decision)<-[:SUPERSEDES*1..4]-(d:Decision {id:$decision}) MATCH (:Employee {id:$employee})-[:ATTENDS]->(m) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,n.id,n.title,[node IN nodes(p) | node.title]
```

## decision_unaffected_assignments
Source: src/workweave/graph.py:457

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service) WHERE s.id<>$service RETURN a.id,a.title,s.title ORDER BY a.title
```

## get_assignment_context
Source: src/workweave/graph.py:510

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:TOUCHES]->(s:Service) RETURN a.title,a.body,s.title,s.id
```

## list_my_assignments
Source: src/workweave/graph.py:518

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment) RETURN a.id,a.title,a.body ORDER BY a.title
```

## find_relevant_people
Source: src/workweave/graph.py:523

```cypher
MATCH (e:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(s:Service {id:$service}) RETURN e.id,e.title,e.body,type(r)
```

## get_current_guidance
Source: src/workweave/graph.py:528

```cypher
MATCH (d:Decision)-[:APPLIES_TO]->(:Service {id:$service}) WHERE d.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,src.id,src.title,src.body
```

## find_outdated_guidance
Source: src/workweave/graph.py:533

```cypher
MATCH p=(doc:Document)-[:RECOMMENDS]->(old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision)-[:APPLIES_TO]->(:Service)<-[:TOUCHES]-(a:Assignment {id:$assignment}) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN doc.id,doc.title,doc.body,old.title,current.title,[n IN nodes(p) | n.title]
```

## get_prerequisites
Source: src/workweave/graph.py:538

```cypher
MATCH (:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) OPTIONAL MATCH (:Employee {id:$employee})-[done:COMPLETED]->(t) RETURN t.id,t.title,done IS NOT NULL
```

## get_learning_progress
Source: src/workweave/graph.py:543

```cypher
MATCH (:Employee {id:$employee})-[:HAS_PLAN]->(p:LearningPlan)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) OPTIONAL MATCH (p)-[:SUPPORTED_BY]->(decision:Decision) RETURN p.title,p.guidance,p.note,decision.id
```

## explain_connection
Source: src/workweave/graph.py:548

```cypher
MATCH (a:Employee {id:$employee}),(b:Service {id:$service}) CALL algo.SPpaths({sourceNode:a,targetNode:b,relTypes:["ASSIGNED_TO","TOUCHES"],relDirection:"outgoing",weightProp:"weight",pathCount:1}) YIELD path RETURN [n IN nodes(path) | n.title]
```

## get_sources
Source: src/workweave/graph.py:553

```cypher
MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.title
```

## direct_context
Source: src/workweave/graph.py:556

```cypher
MATCH (:Assignment {id:$id})-[:SUPPORTED_BY]->(d:Document) RETURN d.title
```

## connected_context
Source: src/workweave/graph.py:561

```cypher
MATCH p=(:Assignment {id:$id})-[:TOUCHES|APPLIES_TO|SUPERSEDES|RECOMMENDS|SUPPORTED_BY*1..5]-(d:Document) RETURN DISTINCT d.title ORDER BY d.title LIMIT 30
```

## get_read_guidance
Source: src/workweave/graph.py:580

```cypher
MATCH (:Employee {id:$employee})-[:READ_GUIDANCE]->(:Decision {id:$decision}) RETURN true
```

## get_first_week
Source: src/workweave/graph.py:585

```cypher
MATCH (:Employee {id:$employee})-[:HAS_WEEK_STEP]->(w:WeekStep)-[:OPENS]->(target) RETURN w.day,w.title,w.body,target.id,labels(target)[0] ORDER BY w.day
```

## get_team_reviewers
Source: src/workweave/graph.py:590

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(:Assignment)-[:TOUCHES]->(s:Service)<-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]-(p:Employee) RETURN DISTINCT p.id,p.title,p.body,type(r) ORDER BY p.title
```

## get_assignment_contacts
Source: src/workweave/graph.py:595

```cypher
MATCH (a:Assignment)-[:TOUCHES]->(s:Service) MATCH (p:Employee)-[r:ASSIGNED_TO|REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(target) WHERE target=a OR target=s RETURN DISTINCT p.id,p.title,p.body,type(r),a.id,a.title ORDER BY a.title,p.title
```

## find_changes_affecting_my_work
Source: src/workweave/graph.py:599

```cypher
MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current:Decision)-[:SUPERSEDES*1..4]->(old:Decision)<-[:RECOMMENDS]-(doc:Document) MATCH (current)-[:SUPPORTED_BY]->(src:Document) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN DISTINCT a.id,a.title,doc.id,doc.title,old.title,current.title,src.id,src.title,src.body ORDER BY a.title
```

## get_review_request
Source: src/workweave/graph.py:604

```cypher
MATCH (:Employee {id:$employee})-[:CREATED]->(r:ReviewRequest)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) MATCH (r)-[:ASSIGNED_REVIEWER]->(reviewer:Employee),(r)-[:BASED_ON]->(d:Decision) RETURN r.id,r.status,reviewer.title,d.id,r.note
```

## company_calendar
Source: src/workweave/graph.py:609

```cypher
MATCH (:Employee {id:$employee})-[:ATTENDS]->(m:Meeting) OPTIONAL MATCH (m)-[:DISCUSSES]->(a:Assignment) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,m.body,m.starts,a.id,n.id ORDER BY m.starts
```

## company_notes
Source: src/workweave/graph.py:614

```cypher
MATCH (n:Document) WHERE (n)-[:NOTES_FOR]->(:Meeting) OR (:Employee {id:$employee})-[:CREATED]->(n) RETURN n.id,n.title,n.body ORDER BY n.title
```

## company_change_impact
Source: src/workweave/graph.py:619

```cypher
MATCH (old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) MATCH (m:Meeting)-[:CONSIDERS]->(old) MATCH (n:Document)-[:NOTES_FOR]->(m) MATCH (m)-[:DISCUSSES]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current) RETURN DISTINCT current.title,m.title,n.title,a.title ORDER BY m.title
```

## workspace_identity
Source: src/workweave/graph.py:623

```cypher
MATCH (e:Employee {id:$employee})-[:WORKS_AT]->(o:Organization),(e)-[:MEMBER_OF]->(t:Team) RETURN o.id,o.title,o.timezone,e.id,e.title,t.id,t.title,t.department
```

## seed_node
Source: src/workweave/graph.py:199

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_edge
Source: src/workweave/graph.py:206

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## create_index
Source: src/workweave/graph.py:222

```cypher
f'CREATE INDEX FOR (n:{label}) ON (n.id)'
```

## rename_sample_provider
Source: src/workweave/graph.py:244

```cypher
MATCH (n) WHERE n:Decision OR n:Document OR n:LearningPlan SET n.title=replace(n.title,$old,$new),n.body=replace(n.body,$old,$new),n.guidance=replace(n.guidance,$old,$new)
```

## seed_assignment
Source: src/workweave/graph.py:265

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body'
```

## seed_assignment_link
Source: src/workweave/graph.py:272

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)'
```

## seed_week_step
Source: src/workweave/graph.py:320

```cypher
MATCH (e:Employee {id:"maya"}),(target {id:$target}) MERGE (w:WeekStep {id:$id}) SET w.day=$day,w.title=$title,w.body=$body MERGE (e)-[:HAS_WEEK_STEP]->(w) MERGE (w)-[:OPENS]->(target)
```

## seed_company_record
Source: src/workweave/graph.py:396

```cypher
f'MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body,n.starts=$start'
```

## seed_company_link
Source: src/workweave/graph.py:418

```cypher
f'MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r}]->(b)'
```

## replace_decision
Source: src/workweave/graph.py:678

```cypher
MERGE (d:Decision {id:"provider-c"}) SET d.title="Use Razorpay",d.approved=true MERGE (src:Document {id:"adr-c"}) SET src.title="ADR-043: Razorpay",src.body="Approved demo change: Razorpay replaces Adyen." WITH d,src MATCH (old:Decision {id:"provider-b"}),(s:Service {id:"checkout-service"}) MERGE (d)-[:SUPERSEDES {weight:1}]->(old) MERGE (d)-[:SUPPORTED_BY {weight:1}]->(src) MERGE (d)-[:APPLIES_TO {weight:1}]->(s)
```

## record_replacement_approval
Source: src/workweave/graph.py:683

```cypher
MATCH (d:Decision {id:"provider-c"}),(owner:Employee {id:"leo"}) SET d.approvedAt=coalesce(d.approvedAt,$now),d.effectiveAt=coalesce(d.effectiveAt,$now) MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"replacement-approval"}) SET m.title="Checkout decision review",m.starts=coalesce(m.starts,$starts),m.body="Approve the replacement provider decision." MERGE (m)-[:APPROVED]->(d)
```

## record_newer_proposal
Source: src/workweave/graph.py:693

```cypher
MATCH (e:Employee {id:"maya"}),(s:Service {id:"checkout-service"}) MERGE (d:Decision {id:"provider-proposal"}) SET d.title="Consider PayPal",d.approved=false,d.proposedAt=$now MERGE (m:Meeting {id:"proposal-review"}) SET m.title="Explore another provider",m.starts=$starts,m.body="Discuss an alternative. No replacement has been approved." MERGE (src:Document {id:"proposal-notes"}) SET src.title="Provider exploration notes",src.body="PayPal was proposed for investigation. No approval was given." MERGE (d)-[:APPLIES_TO]->(s) MERGE (d)-[:SUPPORTED_BY]->(src) MERGE (m)-[:PROPOSED]->(d) MERGE (src)-[:NOTES_FOR]->(m) MERGE (e)-[:ATTENDS]->(m)
```

## acknowledge_decision_version
Source: src/workweave/graph.py:708

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(d:Decision {id:$decision}) MERGE (r:DecisionReview {id:$id}) ON CREATE SET r.at=$now MERGE (e)-[:ACKNOWLEDGED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) MERGE (r)-[:BASED_ON]->(d) MERGE (e)-[:READ_GUIDANCE]->(d)
```

## remove_owner
Source: src/workweave/graph.py:721

```cypher
MATCH (:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(:Service {id:$id}) DELETE r
```

## complete_learning_step
Source: src/workweave/graph.py:729

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) MERGE (e)-[:COMPLETED]->(t)
```

## mark_guidance_read
Source: src/workweave/graph.py:739

```cypher
MATCH (e:Employee {id:$employee}),(d:Decision {id:$decision}) MERGE (e)-[:READ_GUIDANCE]->(d)
```

## save_learning_plan
Source: src/workweave/graph.py:749

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}) MERGE (p:LearningPlan {id:$plan}) SET p.title=a.title,p.guidance=$guidance,p.note=$note MERGE (e)-[:HAS_PLAN]->(p) MERGE (p)-[:FOR_ASSIGNMENT]->(a)
```

## save_plan_evidence
Source: src/workweave/graph.py:761

```cypher
MATCH (p:LearningPlan {id:$plan}),(d:Decision {id:$decision}) WITH p,d OPTIONAL MATCH (p)-[old:SUPPORTED_BY]->() DELETE old MERGE (p)-[:SUPPORTED_BY]->(d)
```

## save_workspace_note
Source: src/workweave/graph.py:768

```cypher
MATCH (e:Employee {id:"maya"}) MERGE (n:Document {id:"personal-note"}) SET n.title="My workspace note",n.body=$note MERGE (e)-[:CREATED]->(n)
```

## create_review_request
Source: src/workweave/graph.py:790

```cypher
MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(reviewer:Employee {id:$reviewer}),(d:Decision {id:$decision}) MERGE (r:ReviewRequest {id:$id}) SET r.status="Awaiting review",r.note=$note MERGE (e)-[:CREATED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) WITH r,reviewer,d OPTIONAL MATCH (r)-[old:BASED_ON|ASSIGNED_REVIEWER]->() DELETE old MERGE (r)-[:BASED_ON]->(d) MERGE (r)-[:ASSIGNED_REVIEWER]->(reviewer)
```

## match_exact_meeting_instance
Source: src/workweave/impact.py:11

```cypher
MATCH (m:ExternalEvent {zoomMeetingId:$meeting}) RETURN m.id
```

## link_exact_meeting_id
Source: src/workweave/impact.py:18

```cypher
MATCH (n:ImportedNote {id:$id}),(m:ExternalEvent {id:$event}) MERGE (n)-[r:NOTES_FOR]->(m) SET r.evidence=$meeting,r.method="exact meeting ID"
```

## imported_content_hash
Source: src/workweave/impact.py:110

```cypher
MATCH (n) WHERE n:WorkItem OR n:ImportedNote OR n:ExternalEvent OR n:Document RETURN labels(n),n.id,n.title,n.body ORDER BY n.id
```

## bounded_dependency_impact
Source: src/workweave/impact.py:126

```cypher
MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) MATCH p=(s)-[:DEPENDS_ON*0..5]->(root:Service {id:$root}) WHERE all(node IN nodes(p) WHERE single(other IN nodes(p) WHERE other=node)) MATCH (t:Team)-[:RESPONSIBLE_FOR]->(w) OPTIONAL MATCH (owner:Employee)-[:ASSIGNED_TO]->(w) RETURN w.id,w.title,s.id,s.title,t.title,owner.title,[node IN nodes(p)|node.title],[edge IN relationships(p)|type(edge)],[node IN nodes(p)|node.id],w.source ORDER BY w.id
```

## all_imported_work
Source: src/workweave/impact.py:180

```cypher
MATCH (w:WorkItem)-[:TOUCHES]->(s:Service) RETURN w.id,w.title,s.title ORDER BY w.id
```

## unresolved_calendar_links
Source: src/workweave/impact.py:187

```cypher
MATCH (m:ExternalEvent) WHERE NOT (m)-[:DISCUSSES]->(:WorkItem) RETURN m.id,m.title ORDER BY m.id
```

## unresolved_source_links
Source: src/workweave/impact.py:191

```cypher
MATCH (n:ImportedNote) WHERE NOT (n)-[:NOTES_FOR]->(:ExternalEvent) RETURN n.id,n.title,n.meetingId ORDER BY n.id
```

## dependency_links
Source: src/workweave/impact.py:195

```cypher
MATCH (a:Service)-[:DEPENDS_ON]->(b:Service) RETURN a.id,a.title,b.id,b.title ORDER BY a.id,b.id
```

## experiment_dependency_identity
Source: src/workweave/impact.py:202

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) RETURN a.title,b.title
```

## import_version
Source: src/workweave/impact.py:29

```cypher
MATCH (:Meta {id:"source-import-v1"}) RETURN true
```

## finish_source_import
Source: src/workweave/impact.py:105

```cypher
MERGE (:Meta {id:"source-import-v1"})
```

## impact_import_ready
Source: src/workweave/impact.py:118

```cypher
MATCH (:Meta {id:"source-import-v1"}) RETURN true
```

## affected_source_links
Source: src/workweave/impact.py:175

```cypher
MATCH (m:ExternalEvent)-[link:DISCUSSES]->(:WorkItem {id:$id}) OPTIONAL MATCH (n:ImportedNote)-[notes:NOTES_FOR]->(m) RETURN m.id,m.title,m.source,link.method,link.evidence,n.id,n.title,n.body,notes.method,notes.evidence,n.source ORDER BY m.id,n.id
```

## import_service
Source: src/workweave/impact.py:31

```cypher
MERGE (n:Service {id:$id}) SET n.title=$title
```

## import_team
Source: src/workweave/impact.py:38

```cypher
MERGE (n:Team {id:$id}) SET n.title=$title
```

## import_person
Source: src/workweave/impact.py:45

```cypher
MERGE (e:Employee {id:$id}) SET e.title=$title WITH e MATCH (t:Team {id:$team}) MERGE (e)-[:MEMBER_OF]->(t)
```

## import_dependency
Source: src/workweave/impact.py:52

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"
```

## import_jira_issue
Source: src/workweave/impact.py:59

```cypher
MATCH (s:Service {id:$service}),(t:Team {id:$team}) MERGE (w:WorkItem {id:$key}) SET w.title=$title,w.body=$body,w.source="Jira export",w.sourceId=$key MERGE (w)-[:TOUCHES]->(s) MERGE (t)-[:RESPONSIBLE_FOR]->(w)
```

## import_calendar_event
Source: src/workweave/impact.py:79

```cypher
MERGE (m:ExternalEvent {id:$id}) SET m.title=$title,m.zoomMeetingId=$zoom,m.source="Google Calendar export",m.sourceId=$id
```

## import_zoom_note
Source: src/workweave/impact.py:93

```cypher
MERGE (n:ImportedNote {id:$id}) SET n.title=$title,n.body=$body,n.meetingId=$meeting,n.source="Zoom export",n.sourceId=$id
```

## remove_sample_dependency
Source: src/workweave/impact.py:261

```cypher
MATCH (a:Service {id:$a})-[r:DEPENDS_ON]->(b:Service {id:$b}) DELETE r
```

## restore_sample_dependency
Source: src/workweave/impact.py:268

```cypher
MATCH (a:Service {id:$a}),(b:Service {id:$b}) MERGE (a)-[r:DEPENDS_ON]->(b) SET r.weight=1,r.source="Service registry export"
```

## import_issue_owner
Source: src/workweave/impact.py:72

```cypher
MATCH (e:Employee {id:$owner}),(w:WorkItem {id:$key}) MERGE (e)-[:ASSIGNED_TO]->(w)
```

## link_exact_issue_key
Source: src/workweave/impact.py:86

```cypher
MATCH (m:ExternalEvent {id:$event}),(w:WorkItem {id:$key}) MERGE (m)-[r:DISCUSSES]->(w) SET r.evidence=$key,r.method="exact issue key"
```

## native_dependency_explanation
Source: src/workweave/impact.py:159

```cypher
MATCH (s:Service {id:$service}),(root:Service {id:$root}) CALL algo.SPpaths({sourceNode:s,targetNode:root,relTypes:["DEPENDS_ON"],relDirection:"outgoing",weightProp:"weight",maxLen:5,pathCount:1}) YIELD path RETURN [node IN nodes(path)|node.title]
```
