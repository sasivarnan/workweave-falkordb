import json
import os
import unittest
from unittest.mock import MagicMock, patch
from workweave.agent import run
from test_agent import reply, tool


class OpenAITests(unittest.TestCase):
    def test_live_adapter_uses_tool_loop_and_does_not_store_requests(self):
        context = {
            "people": [],
            "plan": [],
            "current": "Use Adyen",
            "ambiguous": False,
            "needsReview": False,
            "decisions": [["d", "Use Adyen", "adr", "Decision", "Approved"]],
        }
        store = MagicMock()
        store.context.return_value = context
        replies = [reply([tool("get_current_decision")]), reply(facts=["authority"])]
        requests = []

        def respond(request, **kwargs):
            requests.append(json.loads(request.data))
            response = MagicMock()
            response.__enter__.return_value.read.return_value = json.dumps(replies.pop(0)).encode()
            return response

        with (
            patch.dict(os.environ, {"AI_PROVIDER": "openai", "OPENAI_API_KEY": "test-only"}),
            patch("urllib.request.urlopen", side_effect=respond),
        ):
            result, layout = run(store, "What is current?")
        self.assertIsNone(layout)
        self.assertIn("Adyen", result["agentResult"]["facts"][0]["text"])
        self.assertFalse(requests[0]["store"])
        self.assertEqual(requests[1]["messages"][-1]["role"], "tool")
