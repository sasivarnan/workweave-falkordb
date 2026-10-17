import json,os,sys,unittest
from pathlib import Path
from unittest.mock import patch,MagicMock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from agent import run
from ui import compose
class AgentContractTests(unittest.TestCase):
 def test_tool_to_layout(self):
  ctx={'people':[['owner']],'ambiguous':False};store=MagicMock();store.context.return_value=ctx
  responses=[{'candidates':[{'content':{'role':'model','parts':[{'functionCall':{'name':'get_workspace_context','args':{}}}]}}]}, {'candidates':[{'content':{'parts':[{'text':json.dumps({'components':['Checklist','SummaryCard','EvidenceComparison','PersonCard','ProgressCard']})}]}}]}]
  def response(*args,**kwargs):
   m=MagicMock();m.__enter__.return_value.read.return_value=json.dumps(responses.pop(0)).encode();return m
  with patch.dict(os.environ,{'GEMINI_API_KEY':'test-only'}),patch('urllib.request.urlopen',side_effect=response):
   c,order=run(store,'What should I do next?');self.assertEqual(order[0],'Checklist');self.assertEqual(compose(c,order)[1]['updateComponents']['components'][0]['children'][0],'Checklist')
  store.context.assert_called_once()
 def test_no_key(self):
  with patch.dict(os.environ,{},clear=True),self.assertRaises(ValueError):run(MagicMock(),'test')
 def test_unknown_tool_rejected(self):
  m=MagicMock();m.__enter__.return_value.read.return_value=json.dumps({'candidates':[{'content':{'parts':[{'functionCall':{'name':'delete_graph','args':{}}}]}}]}).encode()
  with patch.dict(os.environ,{'GEMINI_API_KEY':'test-only'}),patch('urllib.request.urlopen',return_value=m),self.assertRaises(ValueError):run(MagicMock(),'test')
