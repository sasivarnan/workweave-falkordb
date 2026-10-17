import json,os,sys,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from access import authorized,reserve,BudgetExceeded
from server import Handler,ThreadingHTTPServer
class AccessTests(unittest.TestCase):
 def test_closed_without_code(self):
  with patch.dict(os.environ,{'AI_ACCESS_CODE':''}):self.assertFalse(authorized('anything'))
  with patch.dict(os.environ,{'AI_ACCESS_CODE':'test-invite-code-only'}):
   self.assertTrue(authorized('test-invite-code-only'));self.assertFalse(authorized('wrong'));self.assertFalse(authorized('é'*20))
 def test_budget_survives_reopen_and_windows(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'usage.sqlite3';reserve(p,10000,(1,2,3))
   with self.assertRaises(BudgetExceeded):reserve(p,10001,(1,2,3))
   reserve(p,14000,(1,2,3))
   with self.assertRaises(BudgetExceeded):reserve(p,18000,(1,2,3))
   reserve(p,100000,(1,2,3))
   with self.assertRaises(BudgetExceeded):reserve(p,200000,(1,2,3))
 def test_concurrent_reservations_respect_cap(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'usage.sqlite3'
   def attempt(_):
    try:reserve(p,10000,(3,3,3));return True
    except BudgetExceeded:return False
   with ThreadPoolExecutor(max_workers=6) as pool:self.assertEqual(sum(pool.map(attempt,range(6))),3)
 def test_http_auth_blocks_provider_and_budget_is_shared(self):
  with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'AI_ACCESS_CODE':'test-invite-code-only','AI_USAGE_DB':str(Path(tmp)/'usage.sqlite3'),'AI_HOURLY_LIMIT':'1','AI_DAILY_LIMIT':'1','AI_TOTAL_LIMIT':'1'}),patch('server.Store') as store,patch('server.run',return_value=({'people':[],'ambiguous':True},None)) as agent:
   store.return_value.trace=[]
   server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   def send(code=None):
    headers={'Content-Type':'application/json','X-Workweave':'portal'}
    if code:headers['X-AI-Access']=code
    req=urllib.request.Request('http://127.0.0.1:'+str(server.server_port)+'/api/agent',data=b'{"prompt":"test"}',headers=headers)
    try:
     with urllib.request.urlopen(req) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
   try:
    self.assertEqual(send()[0],401);agent.assert_not_called();store.assert_not_called()
    self.assertEqual(send('test-invite-code-only')[0],200);self.assertEqual(agent.call_count,1)
    self.assertEqual(send('test-invite-code-only')[0],429);self.assertEqual(agent.call_count,1)
    with patch('server.reserve',side_effect=OSError('storage unavailable')):
     self.assertEqual(send('test-invite-code-only')[0],503);self.assertEqual(agent.call_count,1)
   finally:server.shutdown();server.server_close();thread.join()
if __name__=='__main__':unittest.main()
