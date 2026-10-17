import json
import os
import unittest
from unittest.mock import patch, MagicMock
from workweave.agent import run


class OpenAITests(unittest.TestCase):
    def test_function_and_layout(self):
        context = {"people": [["owner"]], "ambiguous": False}
        s = MagicMock()
        s.context.return_value = context
        order = ["Checklist", "SummaryCard", "EvidenceComparison", "PersonCard", "ProgressCard"]
        replies = [
            {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "call_test",
                                    "type": "function",
                                    "function": {
                                        "name": "get_workspace_context",
                                        "arguments": "{}",
                                    },
                                }
                            ],
                        }
                    }
                ]
            },
            {"choices": [{"message": {"content": json.dumps({"components": order})}}]},
        ]
        requests = []

        def response(req, **kw):
            requests.append(json.loads(req.data))
            m = MagicMock()
            m.__enter__.return_value.read.return_value = json.dumps(replies.pop(0)).encode()
            return m

        with (
            patch.dict(os.environ, {"AI_PROVIDER": "openai", "OPENAI_API_KEY": "test-only"}),
            patch("urllib.request.urlopen", side_effect=response),
        ):
            c, layout = run(s, "What is next?")
            self.assertEqual(layout, order)
        self.assertFalse(requests[0]["store"])
        self.assertEqual(requests[1]["response_format"]["type"], "json_schema")
        s.context.assert_called_once()

    def test_missing_key(self):
        with (
            patch.dict(os.environ, {"AI_PROVIDER": "openai"}, clear=True),
            self.assertRaises(ValueError),
        ):
            run(MagicMock(), "test")
