"""Fixed graph operations. No model-generated Cypher is executed."""

import os
import re
import time
from functools import lru_cache
from falkordb import FalkorDB
from workweave.workspace import APP_NAME, DEMO_ASSIGNMENT, DEMO_SCENARIO


@lru_cache(maxsize=1)
def database():
    return FalkorDB(
        host=os.getenv("FALKORDB_HOST", "localhost"),
        port=int(os.getenv("FALKORDB_PORT", "6381")),
        username=os.getenv("FALKORDB_USERNAME") or None,
        password=os.getenv("FALKORDB_PASSWORD") or None,
        ssl=os.getenv("FALKORDB_SSL", "false").lower() == "true",
        socket_timeout=8,
        socket_connect_timeout=5,
    )


NODES = [
    ("Employee", "maya", "Maya Chen", "Software engineer · Payments"),
    ("Employee", "leo", "Leo Martin", "Service owner · Payments"),
    ("Employee", "imani", "Imani Shah", "Documented alternate reviewer"),
    ("Team", "payments", "Payments", "Checkout and transaction platform"),
    ("Assignment", "checkout", "Ship checkout status change", "Add a payment status indicator"),
    ("Service", "checkout-service", "Checkout service", "Customer-facing checkout"),
    ("Decision", "provider-a", "Use Stripe", "Approved historical decision"),
    ("Decision", "provider-b", "Use Adyen", "Approved replacement decision"),
    (
        "Document",
        "guide",
        "Checkout starter guide",
        "Use Stripe for checkout integration. Updated 2026-08-01.",
    ),
    (
        "Document",
        "adr",
        "ADR-042: Provider migration",
        "Adyen replaces Stripe. Approved 2026-10-14. Stripe is no longer used for new checkout changes.",
    ),
    (
        "Document",
        "review",
        "Review policy",
        "Leo owns checkout reviews. Imani is the approved alternate reviewer.",
    ),
    (
        "Document",
        "security-doc",
        "Secure payments checklist",
        "Complete secure payments training before changing checkout.",
    ),
    ("Training", "security", "Secure payments training", "Required before changing checkout"),
    (
        "Document",
        "task-doc",
        "ENG-108: Status indicator",
        "Add the status indicator. Follow current provider guidance and obtain a code review.",
    ),
    ("Document", "team-doc", "Payments team charter", "Payments owns the checkout service."),
    (
        "Document",
        "access",
        "Sandbox access guide",
        "Ask the service owner to approve sandbox access.",
    ),
    (
        "Document",
        "release",
        "Release checklist",
        "Complete required training and obtain reviewer approval.",
    ),
    (
        "Document",
        "architecture",
        "Checkout architecture",
        "Checkout uses the selected payment provider.",
    ),
    (
        "Document",
        "glossary",
        "Payments glossary",
        "Authorization, settlement, and refund terminology.",
    ),
    ("Document", "testing", "Sandbox test guide", "Use synthetic transactions only."),
    (
        "Document",
        "support",
        "Customer support note",
        "The status indicator helps explain pending transactions.",
    ),
    ("Document", "quality", "Code review checklist", "Cover pending and failed payment states."),
    (
        "Document",
        "handoff",
        "Team handoff note",
        "Use the approved migration decision for new work.",
    ),
    ("Document", "welcome", "Welcome to Payments", "Start with ENG-108 and meet your reviewer."),
    ("Document", "runbook", "Checkout runbook", "Use the service owner for operational questions."),
]
EDGES = [
    ("maya", "MEMBER_OF", "payments"),
    ("maya", "ASSIGNED_TO", "checkout"),
    ("checkout", "TOUCHES", "checkout-service"),
    ("payments", "OWNS", "checkout-service"),
    ("leo", "REVIEWER_FOR", "checkout-service"),
    ("imani", "BACKUP_REVIEWER_FOR", "checkout-service"),
    ("checkout", "REQUIRES", "security"),
    ("provider-a", "APPLIES_TO", "checkout-service"),
    ("provider-b", "APPLIES_TO", "checkout-service"),
    ("provider-b", "SUPERSEDES", "provider-a"),
    ("provider-b", "SUPPORTED_BY", "adr"),
    ("guide", "RECOMMENDS", "provider-a"),
    ("security", "SUPPORTED_BY", "security-doc"),
    ("checkout", "SUPPORTED_BY", "task-doc"),
    ("checkout-service", "SUPPORTED_BY", "architecture"),
    ("leo", "SUPPORTED_BY", "review"),
]

EXTRA_NODES = [
    ("Assignment", "refunds", "Prepare refund tests", "Verify refund outcomes in the sandbox"),
    ("Service", "refund-service", "Refund service", "Refund processing and customer notifications"),
    (
        "Decision",
        "refund-policy",
        "Use sandbox transactions only",
        "Approved refund testing policy",
    ),
    (
        "Document",
        "refund-source",
        "Refund test policy",
        "Run refund tests only with synthetic sandbox transactions. Never use live customer payments.",
    ),
    (
        "Document",
        "refund-task",
        "ENG-112: Refund test",
        "Check successful, pending, and failed refund outcomes with the refund reviewer.",
    ),
    ("Training", "sandbox", "Sandbox testing training", "Required before running refund scenarios"),
    ("Employee", "noah", "Noah Williams", "Refund service reviewer"),
]
EXTRA_EDGES = [
    ("maya", "ASSIGNED_TO", "refunds"),
    ("refunds", "TOUCHES", "refund-service"),
    ("payments", "OWNS", "refund-service"),
    ("refund-policy", "APPLIES_TO", "refund-service"),
    ("refund-policy", "SUPPORTED_BY", "refund-source"),
    ("refunds", "SUPPORTED_BY", "refund-task"),
    ("refunds", "REQUIRES", "sandbox"),
    ("noah", "REVIEWER_FOR", "refund-service"),
]


class Store:
    def __init__(self, token, assignment="checkout"):
        if not re.fullmatch(r"[a-f0-9]{32}", token):
            raise ValueError("Invalid workspace")
        if not isinstance(assignment, str) or not re.fullmatch(r"[a-z0-9-]{1,40}", assignment):
            raise ValueError("Invalid assignment")
        self.assignment = assignment
        self.name = "workweave_" + token
        self.db = database()
        self.g = self.db.select_graph(self.name)
        self.trace = []

    def q(self, name, query, params=None, write=False):
        start = time.monotonic()
        result = (self.g.query if write else self.g.ro_query)(query, params or {}).result_set
        self.trace.append(
            {
                "tool": name,
                "query": query,
                "arguments": params or {},
                "rows": len(result),
                "ms": round((time.monotonic() - start) * 1000, 2),
            }
        )
        return result

    def seed(self):
        if self.q("workspace_check", "MATCH (m:Meta {id:$id}) RETURN m.id", {"id": "seed"}, True):
            self.seed_assignments()
            self.seed_week()
            self.seed_search()
            self.seed_identity()
            self.seed_company()
            self.seed_decision_review()
            self.seed_provider_names()
            self.seed_demo_cast()
            self.g.execute_command("EXPIRE", self.name, 86400)
            return
        for label, id, title, body in NODES:
            self.q(
                "seed_node",
                f"MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body",
                {"id": id, "title": title, "body": body},
                True,
            )
        for a, r, b in EDGES:
            self.q(
                "seed_edge",
                f"MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)",
                {"a": a, "b": b},
                True,
            )
        self.q("approve", "MATCH (d:Decision) SET d.approved=true", write=True)
        for label in (
            "Employee",
            "Assignment",
            "Service",
            "Decision",
            "Document",
            "Training",
            "LearningPlan",
        ):
            self.q("create_index", f"CREATE INDEX FOR (n:{label}) ON (n.id)", write=True)
        self.seed_assignments()
        self.seed_week()
        self.seed_search()
        self.seed_identity()
        self.seed_company()
        self.seed_decision_review()
        self.seed_provider_names()
        self.seed_demo_cast()
        self.q("seed_complete", "CREATE (:Meta {id:$id})", {"id": "seed"}, True)
        self.g.execute_command("EXPIRE", self.name, 86400)
        self.trace = []

    def seed_demo_cast(self):
        if self.q("demo_cast_version", 'MATCH (:Meta {id:"demo-cast-v1"}) RETURN true'):
            return
        self.q(
            "seed_decision_approver",
            'MERGE (p:Employee {id:"priya"}) SET p.title="Priya Shah",p.body="Engineering lead · Decision approver" WITH p MATCH (o:Organization {id:"northstar"}),(t:Team {id:"payments"}) MERGE (p)-[:WORKS_AT]->(o) MERGE (p)-[:MEMBER_OF]->(t) MERGE (:Meta {id:"demo-cast-v1"})',
            write=True,
        )

    def seed_provider_names(self):
        """Rename legacy sample labels without resetting progress or user notes."""
        if self.q("provider_names_version", 'MATCH (:Meta {id:"provider-names-v1"}) RETURN true'):
            return
        for old, new in [
            ("Provider A", "Stripe"),
            ("Provider B", "Adyen"),
            ("Provider C", "Razorpay"),
            ("Provider D", "PayPal"),
        ]:
            self.q(
                "rename_sample_provider",
                "MATCH (n) WHERE n:Decision OR n:Document OR n:LearningPlan SET n.title=replace(n.title,$old,$new),n.body=replace(n.body,$old,$new),n.guidance=replace(n.guidance,$old,$new)",
                {"old": old, "new": new},
                True,
            )
        self.q("provider_names_complete", 'MERGE (:Meta {id:"provider-names-v1"})', write=True)

    def seed_identity(self):
        if self.q("identity_version", 'MATCH (:Meta {id:"identity-v1"}) RETURN true'):
            return
        self.q(
            "seed_workspace_identity",
            'MATCH (e:Employee {id:"maya"}),(t:Team {id:"payments"}) MERGE (o:Organization {id:"northstar"}) SET o.title="Northstar Labs",o.timezone="Asia/Kolkata" SET t.department="Engineering" MERGE (e)-[:WORKS_AT]->(o) MERGE (:Meta {id:"identity-v1"})',
            write=True,
        )

    def seed_assignments(self):
        if self.q("catalog_version", 'MATCH (m:Meta {id:"catalog-v2"}) RETURN m.id'):
            return
        for label, id, title, body in EXTRA_NODES:
            self.q(
                "seed_assignment",
                f"MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body",
                {"id": id, "title": title, "body": body},
                True,
            )
        for a, r, b in EXTRA_EDGES:
            self.q(
                "seed_assignment_link",
                f"MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r} {{weight:1}}]->(b)",
                {"a": a, "b": b},
                True,
            )
        self.q(
            "approve_refund_policy",
            'MATCH (d:Decision {id:"refund-policy"}) SET d.approved=true',
            write=True,
        )
        self.q("catalog_ready", 'CREATE (:Meta {id:"catalog-v2"})', write=True)

    def seed_week(self):
        if self.q("week_version", 'MATCH (:Meta {id:"week-v1"}) RETURN true'):
            return
        steps = [
            ("welcome", 1, "Get to know Payments", "Read the team welcome and charter.", "welcome"),
            (
                "guidance",
                2,
                "Prepare your first change",
                "Review the approved decision and required training.",
                "checkout",
            ),
            (
                "sandbox",
                3,
                "Explore refund testing",
                "Read the sandbox policy before running refund tests.",
                "refunds",
            ),
            (
                "review",
                4,
                "Prepare for a review",
                "Write down questions for your assignment reviewer.",
                "checkout",
            ),
            (
                "reflect",
                5,
                "Plan your next contribution",
                "Review your notes and discuss the next step with Payments.",
                "team-doc",
            ),
        ]
        for id, day, title, body, target in steps:
            self.q(
                "seed_week_step",
                'MATCH (e:Employee {id:"maya"}),(target {id:$target}) MERGE (w:WeekStep {id:$id}) SET w.day=$day,w.title=$title,w.body=$body MERGE (e)-[:HAS_WEEK_STEP]->(w) MERGE (w)-[:OPENS]->(target)',
                {"id": id, "day": day, "title": title, "body": body, "target": target},
                True,
            )
        self.q("week_ready", 'CREATE (:Meta {id:"week-v1"})', write=True)

    def seed_search(self):
        if self.q("search_version", 'MATCH (:Meta {id:"search-v1"}) RETURN true'):
            return
        self.q(
            "create_document_search",
            'CALL db.idx.fulltext.createNodeIndex("Document","title","body")',
            write=True,
        )
        self.q("search_ready", 'CREATE (:Meta {id:"search-v1"})', write=True)

    def search(self, text):
        terms = re.findall(r"[a-zA-Z0-9]+", str(text)[:200])[:12]
        if not terms:
            raise ValueError("Enter a document search term")
        return self.q(
            "search_company_documents",
            'CALL db.idx.fulltext.queryNodes("Document",$query) YIELD node,score RETURN node.id,node.title,node.body,score ORDER BY score DESC LIMIT 10',
            {"query": "|".join(terms)},
        )

    def seed_company(self):
        if self.q("company_version", 'MATCH (:Meta {id:"company-v1"}) RETURN true'):
            return
        nodes = [
            (
                "Meeting",
                "checkout-review",
                "Checkout release review",
                "Review the provider migration and status indicator.",
                "2026-10-19T10:00:00+05:30",
            ),
            (
                "Meeting",
                "refund-sync",
                "Refund test planning",
                "Agree on synthetic refund test coverage.",
                "2026-10-20T14:00:00+05:30",
            ),
            (
                "Document",
                "meeting-checkout",
                "Checkout planning notes",
                "The team will review the current approved provider decision before the status indicator change.",
                "",
            ),
            (
                "Document",
                "meeting-refund",
                "Refund planning notes",
                "Cover successful, pending and failed refund outcomes using synthetic data.",
                "",
            ),
            (
                "Document",
                "hr-leave",
                "Leave and time-off policy",
                "Sample policy: discuss planned leave with your manager before submitting a request.",
                "",
            ),
            (
                "Project",
                "payments-project",
                "Payments reliability",
                "Improve payment status visibility and refund test coverage.",
                "",
            ),
        ]
        for label, id, title, body, start in nodes:
            self.q(
                "seed_company_record",
                f"MERGE (n:{label} {{id:$id}}) SET n.title=$title,n.body=$body,n.starts=$start",
                {"id": id, "title": title, "body": body, "start": start},
                True,
            )
        edges = [
            ("checkout-review", "DISCUSSES", "checkout"),
            ("checkout-review", "DISCUSSES", "checkout-service"),
            ("checkout-review", "CONSIDERS", "provider-b"),
            ("refund-sync", "DISCUSSES", "refunds"),
            ("meeting-checkout", "NOTES_FOR", "checkout-review"),
            ("meeting-refund", "NOTES_FOR", "refund-sync"),
            ("maya", "ATTENDS", "checkout-review"),
            ("leo", "ATTENDS", "checkout-review"),
            ("maya", "ATTENDS", "refund-sync"),
            ("noah", "ATTENDS", "refund-sync"),
            ("payments-project", "INCLUDES", "checkout"),
            ("payments-project", "INCLUDES", "refunds"),
            ("payments", "OWNS", "payments-project"),
        ]
        for a, r, b in edges:
            self.q(
                "seed_company_link",
                f"MATCH (a {{id:$a}}),(b {{id:$b}}) MERGE (a)-[:{r}]->(b)",
                {"a": a, "b": b},
                True,
            )
        self.q("company_ready", 'CREATE (:Meta {id:"company-v1"})', write=True)

    def seed_decision_review(self):
        if self.q("decision_review_version", 'MATCH (:Meta {id:"decision-review-v1"}) RETURN true'):
            return
        self.q(
            "seed_decision_authority",
            'MATCH (d:Decision {id:"provider-b"}),(owner:Employee {id:"leo"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"migration-approval"}) SET m.title="Provider migration approval",m.starts="2026-10-14T10:00:00+05:30",m.body="Approve the provider migration for checkout." MERGE (m)-[:APPROVED]->(d)',
            write=True,
        )
        self.q(
            "seed_refund_authority",
            'MATCH (d:Decision {id:"refund-policy"}),(owner:Employee {id:"noah"}) SET d.approvedAt=1791936000000,d.effectiveAt=1791936000000 MERGE (d)-[:APPROVED_BY]->(owner)',
            write=True,
        )
        self.q("decision_review_ready", 'MERGE (:Meta {id:"decision-review-v1"})', write=True)

    def decision_review(self, service_id, decisions):
        history = self.q(
            "decision_history",
            "MATCH (d:Decision)-[:APPLIES_TO]->(s:Service {id:$service}) OPTIONAL MATCH (d)-[:SUPERSEDES]->(old:Decision) OPTIONAL MATCH (d)-[:APPROVED_BY]->(owner:Employee) OPTIONAL MATCH (m:Meeting)-[:APPROVED|PROPOSED]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,d.approved,old.title,owner.title,d.approvedAt,d.effectiveAt,m.id,m.title,src.id,src.title,d.proposedAt ORDER BY coalesce(d.proposedAt,d.approvedAt,0) DESC,d.id",
            {"service": service_id},
        )
        affected = self.q(
            "decision_affected_assignments",
            "MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service {id:$service}) OPTIONAL MATCH (e)-[:HAS_PLAN]->(plan:LearningPlan)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (plan)-[:SUPPORTED_BY]->(used:Decision) OPTIONAL MATCH (e)-[:ACKNOWLEDGED]->(receipt:DecisionReview)-[:FOR_ASSIGNMENT]->(a) OPTIONAL MATCH (receipt)-[:BASED_ON]->(ack:Decision) RETURN a.id,a.title,e.title,s.title,used.id,used.title,plan.note,ack.id,receipt.at,plan.id ORDER BY a.title",
            {"employee": "maya", "service": service_id},
        )
        meetings = self.q(
            "decision_affected_meetings",
            "MATCH p=(m:Meeting)-[:CONSIDERS]->(old:Decision)<-[:SUPERSEDES*1..4]-(d:Decision {id:$decision}) MATCH (:Employee {id:$employee})-[:ATTENDS]->(m) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,n.id,n.title,[node IN nodes(p) | node.title]",
            {"decision": decisions[0][0] if len(decisions) == 1 else "", "employee": "maya"},
        )
        unaffected = self.q(
            "decision_unaffected_assignments",
            "MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service) WHERE s.id<>$service RETURN a.id,a.title,s.title ORDER BY a.title",
            {"employee": "maya", "service": service_id},
        )
        current_id = decisions[0][0] if len(decisions) == 1 else None
        authority = [r for r in history if r[0] == current_id]
        issues = []
        if len(decisions) != 1:
            issues.append("There is no single current approved decision.")
        if not decisions or not decisions[0][2]:
            issues.append("The current decision has no original source.")
        approvers = {r[4] for r in authority if r[4]}
        if len(approvers) != 1:
            issues.append("A single recorded approver is missing or unclear.")
        if not authority or not authority[0][6]:
            issues.append("The effective date is missing.")
        elif authority[0][6] > int(time.time() * 1000):
            issues.append("The decision is not effective yet.")
        records = []
        deduplicated = {}
        for r in affected:
            if r[0] not in deduplicated or r[7] == current_id:
                deduplicated[r[0]] = r
        for r in deduplicated.values():
            records.append(
                {
                    "id": r[0],
                    "title": r[1],
                    "owner": r[2],
                    "path": [
                        r[1],
                        r[3],
                        decisions[0][1] if len(decisions) == 1 else "Unresolved guidance",
                    ],
                    "savedDecision": r[5],
                    "savedNote": r[6],
                    "stale": bool(r[9] and r[4] != current_id),
                    "acknowledged": bool(current_id and r[7] == current_id),
                    "acknowledgedAt": r[8] if r[7] == current_id else None,
                }
            )
        return {
            "currentId": current_id,
            "history": history,
            "affected": records,
            "meetings": meetings,
            "unaffected": unaffected,
            "issues": issues,
            "canAcknowledge": not issues,
        }

    def context(self):
        task = self.q(
            "get_assignment_context",
            "MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:TOUCHES]->(s:Service) RETURN a.title,a.body,s.title,s.id",
            {"employee": "maya", "assignment": self.assignment},
        )
        if not task:
            raise ValueError("This assignment is not assigned to the current employee")
        service_id = task[0][3]
        assignments = self.q(
            "list_my_assignments",
            "MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment) RETURN a.id,a.title,a.body ORDER BY a.title",
            {"employee": "maya"},
        )
        people = self.q(
            "find_relevant_people",
            "MATCH (e:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(s:Service {id:$service}) RETURN e.id,e.title,e.body,type(r)",
            {"service": service_id},
        )
        decisions = self.q(
            "get_current_guidance",
            "MATCH (d:Decision)-[:APPLIES_TO]->(:Service {id:$service}) WHERE d.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(d) OPTIONAL MATCH (d)-[:SUPPORTED_BY]->(src:Document) RETURN d.id,d.title,src.id,src.title,src.body",
            {"service": service_id},
        )
        conflicts = self.q(
            "find_outdated_guidance",
            "MATCH p=(doc:Document)-[:RECOMMENDS]->(old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision)-[:APPLIES_TO]->(:Service)<-[:TOUCHES]-(a:Assignment {id:$assignment}) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN doc.id,doc.title,doc.body,old.title,current.title,[n IN nodes(p) | n.title]",
            {"assignment": self.assignment},
        )
        training = self.q(
            "get_prerequisites",
            "MATCH (:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) OPTIONAL MATCH (:Employee {id:$employee})-[done:COMPLETED]->(t) RETURN t.id,t.title,done IS NOT NULL",
            {"assignment": self.assignment, "employee": "maya"},
        )
        plan = self.q(
            "get_learning_progress",
            "MATCH (:Employee {id:$employee})-[:HAS_PLAN]->(p:LearningPlan)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) OPTIONAL MATCH (p)-[:SUPPORTED_BY]->(decision:Decision) RETURN p.title,p.guidance,p.note,decision.id",
            {"employee": "maya", "assignment": self.assignment},
        )
        path = self.q(
            "explain_connection",
            'MATCH (a:Employee {id:$employee}),(b:Service {id:$service}) CALL algo.SPpaths({sourceNode:a,targetNode:b,relTypes:["ASSIGNED_TO","TOUCHES"],relDirection:"outgoing",weightProp:"weight",pathCount:1}) YIELD path RETURN [n IN nodes(path) | n.title]',
            {"employee": "maya", "service": service_id},
        )
        sources = self.q(
            "get_sources", "MATCH (d:Document) RETURN d.id,d.title,d.body ORDER BY d.title"
        )
        direct = self.q(
            "direct_context",
            "MATCH (:Assignment {id:$id})-[:SUPPORTED_BY]->(d:Document) RETURN d.title",
            {"id": self.assignment},
        )
        connected = self.q(
            "connected_context",
            "MATCH p=(:Assignment {id:$id})-[:TOUCHES|APPLIES_TO|SUPERSEDES|RECOMMENDS|SUPPORTED_BY*1..5]-(d:Document) RETURN DISTINCT d.title ORDER BY d.title LIMIT 30",
            {"id": self.assignment},
        )
        lookup = "MATCH (a:Assignment {id:$id}) RETURN a.title"
        plan_start = time.monotonic()
        execution_plan = str(self.g.explain(lookup, {"id": self.assignment}))
        self.trace.append(
            {
                "tool": "explain_assignment_lookup",
                "query": lookup,
                "arguments": {"id": self.assignment},
                "rows": 0,
                "ms": round((time.monotonic() - plan_start) * 1000, 2),
                "executionPlan": execution_plan,
            }
        )
        current = decisions[0][1] if len(decisions) == 1 else None
        read = self.q(
            "get_read_guidance",
            "MATCH (:Employee {id:$employee})-[:READ_GUIDANCE]->(:Decision {id:$decision}) RETURN true",
            {"employee": "maya", "decision": decisions[0][0] if len(decisions) == 1 else ""},
        )
        week = self.q(
            "get_first_week",
            "MATCH (:Employee {id:$employee})-[:HAS_WEEK_STEP]->(w:WeekStep)-[:OPENS]->(target) RETURN w.day,w.title,w.body,target.id,labels(target)[0] ORDER BY w.day",
            {"employee": "maya"},
        )
        colleagues = self.q(
            "get_team_reviewers",
            "MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(:Assignment)-[:TOUCHES]->(s:Service)<-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]-(p:Employee) RETURN DISTINCT p.id,p.title,p.body,type(r) ORDER BY p.title",
            {"employee": "maya"},
        )
        project_contacts = self.q(
            "get_assignment_contacts",
            "MATCH (a:Assignment)-[:TOUCHES]->(s:Service) MATCH (p:Employee)-[r:ASSIGNED_TO|REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(target) WHERE target=a OR target=s RETURN DISTINCT p.id,p.title,p.body,type(r),a.id,a.title ORDER BY a.title,p.title",
        )
        findings = self.q(
            "find_changes_affecting_my_work",
            "MATCH (:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current:Decision)-[:SUPERSEDES*1..4]->(old:Decision)<-[:RECOMMENDS]-(doc:Document) MATCH (current)-[:SUPPORTED_BY]->(src:Document) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) RETURN DISTINCT a.id,a.title,doc.id,doc.title,old.title,current.title,src.id,src.title,src.body ORDER BY a.title",
            {"employee": "maya"},
        )
        review_request = self.q(
            "get_review_request",
            "MATCH (:Employee {id:$employee})-[:CREATED]->(r:ReviewRequest)-[:FOR_ASSIGNMENT]->(:Assignment {id:$assignment}) MATCH (r)-[:ASSIGNED_REVIEWER]->(reviewer:Employee),(r)-[:BASED_ON]->(d:Decision) RETURN r.id,r.status,reviewer.title,d.id,r.note",
            {"employee": "maya", "assignment": self.assignment},
        )
        meetings = self.q(
            "company_calendar",
            "MATCH (:Employee {id:$employee})-[:ATTENDS]->(m:Meeting) OPTIONAL MATCH (m)-[:DISCUSSES]->(a:Assignment) OPTIONAL MATCH (n:Document)-[:NOTES_FOR]->(m) RETURN m.id,m.title,m.body,m.starts,a.id,n.id ORDER BY m.starts",
            {"employee": "maya"},
        )
        notes = self.q(
            "company_notes",
            "MATCH (n:Document) WHERE (n)-[:NOTES_FOR]->(:Meeting) OR (:Employee {id:$employee})-[:CREATED]->(n) RETURN n.id,n.title,n.body ORDER BY n.title",
            {"employee": "maya"},
        )
        impact = self.q(
            "company_change_impact",
            "MATCH (old:Decision)<-[:SUPERSEDES*1..4]-(current:Decision) WHERE current.approved=true AND NOT (:Decision {approved:true})-[:SUPERSEDES]->(current) MATCH (m:Meeting)-[:CONSIDERS]->(old) MATCH (n:Document)-[:NOTES_FOR]->(m) MATCH (m)-[:DISCUSSES]->(a:Assignment)-[:TOUCHES]->(s:Service)<-[:APPLIES_TO]-(current) RETURN DISTINCT current.title,m.title,n.title,a.title ORDER BY m.title",
        )
        identity = self.q(
            "workspace_identity",
            "MATCH (e:Employee {id:$employee})-[:WORKS_AT]->(o:Organization),(e)-[:MEMBER_OF]->(t:Team) RETURN o.id,o.title,o.timezone,e.id,e.title,t.id,t.title,t.department",
            {"employee": "maya"},
        )
        if len(identity) != 1:
            raise ValueError("Workspace identity is unavailable")
        row = identity[0]
        workspace = {
            "appName": APP_NAME,
            "company": {"id": row[0], "name": row[1]},
            "timezone": row[2],
            "employee": {"id": row[3], "name": row[4]},
            "team": {"id": row[5], "name": row[6], "department": row[7]},
            "synthetic": True,
            "demo": {"assignment": DEMO_ASSIGNMENT, "scenario": DEMO_SCENARIO},
        }
        return_extra = {
            "workspace": workspace,
            "meetings": meetings,
            "notes": notes,
            "impact": impact,
            "changeReview": self.decision_review(service_id, decisions),
        }
        return {
            **return_extra,
            "reviewRequest": review_request,
            "findings": findings,
            "week": week,
            "colleagues": colleagues,
            "projectContacts": project_contacts,
            "guidanceRead": bool(read),
            "assignment": self.assignment,
            "assignments": assignments,
            "task": task,
            "people": people,
            "decisions": decisions,
            "conflicts": conflicts,
            "training": training,
            "plan": plan,
            "paths": path,
            "sources": sources,
            "current": current,
            "needsReview": bool(plan and (len(decisions) != 1 or plan[0][3] != decisions[0][0])),
            "ambiguous": len(decisions) != 1
            or not decisions[0][2]
            or bool(return_extra["changeReview"]["issues"]),
            "direct": direct,
            "connected": connected,
        }

    def action(self, name, note=""):
        if name in ("replace", "remove-owner", "propose") and self.assignment != "checkout":
            raise ValueError("This sample change is available only for the checkout assignment")
        if name == "replace":
            self.q(
                "replace_decision",
                'MERGE (d:Decision {id:"provider-c"}) SET d.title="Use Razorpay",d.approved=true MERGE (src:Document {id:"adr-c"}) SET src.title="ADR-043: Razorpay",src.body="Priya approved Razorpay to replace Adyen for the checkout change. Review the saved plan with Leo before starting." WITH d,src MATCH (old:Decision {id:"provider-b"}),(s:Service {id:"checkout-service"}) MERGE (d)-[:SUPERSEDES {weight:1}]->(old) MERGE (d)-[:SUPPORTED_BY {weight:1}]->(src) MERGE (d)-[:APPLIES_TO {weight:1}]->(s)',
                write=True,
            )
            self.q(
                "record_replacement_approval",
                'MATCH (d:Decision {id:"provider-c"}),(owner:Employee {id:"priya"}) SET d.approvedAt=coalesce(d.approvedAt,$now),d.effectiveAt=coalesce(d.effectiveAt,$now) MERGE (d)-[:APPROVED_BY]->(owner) MERGE (m:Meeting {id:"replacement-approval"}) SET m.title="Checkout decision review",m.starts=coalesce(m.starts,$starts),m.body="Approve the replacement provider decision." MERGE (m)-[:APPROVED]->(d)',
                {
                    "now": int(time.time() * 1000),
                    "starts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
                True,
            )
        elif name == "propose":
            self.q(
                "record_newer_proposal",
                'MATCH (e:Employee {id:"maya"}),(s:Service {id:"checkout-service"}) MERGE (d:Decision {id:"provider-proposal"}) SET d.title="Consider PayPal",d.approved=false,d.proposedAt=$now MERGE (m:Meeting {id:"proposal-review"}) SET m.title="Explore another provider",m.starts=$starts,m.body="Discuss an alternative. No replacement has been approved." MERGE (src:Document {id:"proposal-notes"}) SET src.title="Provider exploration notes",src.body="PayPal was proposed for investigation. No approval was given." MERGE (d)-[:APPLIES_TO]->(s) MERGE (d)-[:SUPPORTED_BY]->(src) MERGE (m)-[:PROPOSED]->(d) MERGE (src)-[:NOTES_FOR]->(m) MERGE (e)-[:ATTENDS]->(m)',
                {
                    "now": int(time.time() * 1000) + 60000,
                    "starts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 60000)),
                },
                True,
            )
        elif name == "acknowledge-change":
            c = self.context()
            if not c["changeReview"]["canAcknowledge"]:
                raise ValueError(
                    "Resolve decision approval, source, and effective date before acknowledging"
                )
            self.q(
                "acknowledge_decision_version",
                "MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(d:Decision {id:$decision}) MERGE (r:DecisionReview {id:$id}) ON CREATE SET r.at=$now MERGE (e)-[:ACKNOWLEDGED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) MERGE (r)-[:BASED_ON]->(d) MERGE (e)-[:READ_GUIDANCE]->(d)",
                {
                    "employee": "maya",
                    "assignment": self.assignment,
                    "decision": c["current"] and c["decisions"][0][0],
                    "id": "ack_" + self.assignment + "_" + c["decisions"][0][0],
                    "now": int(time.time() * 1000),
                },
                True,
            )
        elif name == "remove-owner":
            self.q(
                "remove_owner",
                "MATCH (:Employee)-[r:REVIEWER_FOR|BACKUP_REVIEWER_FOR]->(:Service {id:$id}) DELETE r",
                {"id": "checkout-service"},
                True,
            )
        elif name == "complete":
            self.context()
            self.q(
                "complete_learning_step",
                "MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment})-[:REQUIRES]->(t:Training) MERGE (e)-[:COMPLETED]->(t)",
                {"employee": "maya", "assignment": self.assignment},
                True,
            )
        elif name == "review":
            c = self.context()
            if c["ambiguous"]:
                raise ValueError("Resolve current guidance before marking it as read")
            self.q(
                "mark_guidance_read",
                "MATCH (e:Employee {id:$employee}),(d:Decision {id:$decision}) MERGE (e)-[:READ_GUIDANCE]->(d)",
                {"employee": "maya", "decision": c["decisions"][0][0]},
                True,
            )
        elif name == "accept":
            c = self.context()
            if c["ambiguous"]:
                raise ValueError("Resolve current guidance before accepting a plan")
            self.q(
                "save_learning_plan",
                "MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}) MERGE (p:LearningPlan {id:$plan}) SET p.title=a.title,p.guidance=$guidance,p.note=$note MERGE (e)-[:HAS_PLAN]->(p) MERGE (p)-[:FOR_ASSIGNMENT]->(a)",
                {
                    "employee": "maya",
                    "assignment": self.assignment,
                    "plan": "plan_" + self.assignment,
                    "guidance": c["current"],
                    "note": note[:500],
                },
                True,
            )
            self.q(
                "save_plan_evidence",
                "MATCH (p:LearningPlan {id:$plan}),(d:Decision {id:$decision}) WITH p,d OPTIONAL MATCH (p)-[old:SUPPORTED_BY]->() DELETE old MERGE (p)-[:SUPPORTED_BY]->(d)",
                {"plan": "plan_" + self.assignment, "decision": c["decisions"][0][0]},
                True,
            )
        elif name == "save-note":
            self.q(
                "save_workspace_note",
                'MATCH (e:Employee {id:"maya"}) MERGE (n:Document {id:"personal-note"}) SET n.title="My workspace note",n.body=$note MERGE (e)-[:CREATED]->(n)',
                {"note": note[:500]},
                True,
            )
        elif name == "request-review":
            c = self.context()
            if (
                c["ambiguous"]
                or c["needsReview"]
                or not c["guidanceRead"]
                or not c["training"]
                or not all(r[2] for r in c["training"])
                or not c["plan"]
                or not c["plan"][0][2].strip()
                or not c["people"]
            ):
                raise ValueError(
                    "Complete current reading, training, saved notes, and reviewer assignment before requesting review"
                )
            reviewer = next((r for r in c["people"] if r[3] == "REVIEWER_FOR"), c["people"][0])
            self.q(
                "create_review_request",
                'MATCH (e:Employee {id:$employee})-[:ASSIGNED_TO]->(a:Assignment {id:$assignment}),(reviewer:Employee {id:$reviewer}),(d:Decision {id:$decision}) MERGE (r:ReviewRequest {id:$id}) SET r.status="Awaiting review",r.note=$note MERGE (e)-[:CREATED]->(r) MERGE (r)-[:FOR_ASSIGNMENT]->(a) WITH r,reviewer,d OPTIONAL MATCH (r)-[old:BASED_ON|ASSIGNED_REVIEWER]->() DELETE old MERGE (r)-[:BASED_ON]->(d) MERGE (r)-[:ASSIGNED_REVIEWER]->(reviewer)',
                {
                    "employee": "maya",
                    "assignment": self.assignment,
                    "reviewer": reviewer[0],
                    "decision": c["decisions"][0][0],
                    "id": "review_" + self.assignment,
                    "note": c["plan"][0][2],
                },
                True,
            )
        else:
            raise ValueError("Unknown action")

    def reset(self):
        self.g.delete()
        self.g = self.db.select_graph(self.name)
        self.seed()
