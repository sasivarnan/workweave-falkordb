import json
import os
import unittest
from unittest.mock import MagicMock, patch
from workweave.agent import investigate, run


def tool(name):
    return {"id": name, "type": "function", "function": {"name": name, "arguments": "{}"}}


def reply(calls=None, facts=None, actions=None):
    return {
        "choices": [
            {
                "message": {
                    "tool_calls": calls or [],
                    "content": json.dumps({"factIds": facts or [], "nextSteps": actions or []}),
                }
            }
        ]
    }


class AgentContractTests(unittest.TestCase):
    def setUp(self):
        self.store = MagicMock()
        self.context = {
            "current": "Use Razorpay",
            "ambiguous": False,
            "needsReview": True,
            "decisions": [["d", "Use Razorpay", "adr", "Decision", "Approved guidance"]],
            "plan": [["plan", "Use Adyen"]],
            "people": [["leo", "Leo", "Reviewer", "REVIEWER_FOR"]],
        }
        self.store.context.return_value = self.context

    def invoke(self, replies):
        call = MagicMock(side_effect=replies)
        result = investigate(self.store, "What changed and whom should I ask?", call)
        return result, call

    def test_model_selects_multiple_read_tools_and_returns_observed_facts(self):
        (context, layout), call = self.invoke(
            [
                reply(
                    [
                        tool("get_current_decision"),
                        tool("inspect_saved_plan"),
                        tool("find_reviewers"),
                    ]
                ),
                reply(
                    facts=["authority", "plan", "person:leo"],
                    actions=["read-source", "review-plan"],
                ),
            ]
        )
        self.assertIsNone(layout)
        self.assertEqual(context["agentResult"]["facts"][0]["sourceIds"], ["adr"])
        self.assertIn("Adyen", context["agentResult"]["facts"][1]["text"])
        self.assertEqual(len(context["agentResult"]["tools"]), 3)
        self.assertEqual(call.call_args_list[0].args[0]["tool_choice"], "auto")
        self.store.action.assert_not_called()

    def test_unknown_tool_cannot_write(self):
        with self.assertRaises(ValueError):
            self.invoke([reply([tool("delete_graph")])])
        self.store.action.assert_not_called()

    def test_arguments_cannot_inject_cypher(self):
        bad = tool("get_current_decision")
        bad["function"]["arguments"] = '{"query":"MATCH (n) DELETE n"}'
        with self.assertRaises(ValueError):
            self.invoke([reply([bad])])

    def test_unobserved_facts_rejected(self):
        with self.assertRaises(ValueError):
            self.invoke(
                [
                    reply([tool("get_current_decision")]),
                    reply(facts=["authority", "person:invented"]),
                ]
            )

    def test_no_authority_check_rejected(self):
        with self.assertRaises(ValueError):
            self.invoke([reply([tool("find_reviewers")]), reply(facts=["person:leo"])])

    def test_ambiguous_authority_cannot_issue_plan(self):
        self.context["ambiguous"] = True
        with self.assertRaises(ValueError):
            self.invoke(
                [
                    reply([tool("get_current_decision")]),
                    reply(facts=["authority"], actions=["review-plan"]),
                ]
            )

    def test_changed_workspace_rejects_stale_answer(self):
        self.store.context.side_effect = [
            self.context,
            {**self.context, "current": "Use another provider"},
        ]
        with self.assertRaises(ValueError):
            self.invoke([reply([tool("get_current_decision")]), reply(facts=["authority"])])

    def test_repeated_tools_fail_closed(self):
        with self.assertRaises(ValueError):
            self.invoke(
                [reply([tool("get_current_decision")]), reply([tool("get_current_decision")])]
            )

    def test_missing_key(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(ValueError):
            run(self.store, "test")
