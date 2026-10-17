import json,os,secrets,time,threading,mimetypes
from urllib.parse import urlsplit
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
from graph import Store,database
from ui import compose
from agent import run,provider
from access import authorized,reserve,BudgetExceeded
from config import load
from impact import run as run_impact
from workspace import APP_NAME,DEMO_ASSIGNMENT,DEMO_STEPS
ROOT=Path(__file__).parent/'frontend'/'dist'
LOCKS={};LIMITS={};GUARD=threading.Lock()
GLOBAL=[];AGENT_SLOTS=threading.BoundedSemaphore(2)
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def respond(self,status,data,cookie=None):
  body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store')
  if cookie:self.send_header('Set-Cookie',cookie)
  self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
 def token(self):
  c=SimpleCookie();c.load(self.headers.get('Cookie','')); token=c.get('workweave')
  if token and len(token.value)==32 and all(x in '0123456789abcdef' for x in token.value):return token.value,None
  token=secrets.token_hex(16)
  return token,'workweave='+token+'; Path=/; HttpOnly; SameSite=Strict'+('; Secure' if os.getenv('COOKIE_SECURE')=='true' else '')
 def do_GET(self):
  if self.path=='/api/workspace':return self.respond(200,{'appName':APP_NAME,'defaultAssignment':DEMO_ASSIGNMENT,'demo':{'assignment':DEMO_ASSIGNMENT,'steps':DEMO_STEPS}})
  if self.path=='/api/access':return self.respond(200,{'aiEnabled':len(os.getenv('AI_ACCESS_CODE',''))>=16})
  if self.path=='/api/health':
   try:
    database().connection.ping()
    return self.respond(200,{'status':'ok','database':'reachable','agentConfigured':bool(os.getenv('OPENAI_API_KEY') if provider()=='openai' else os.getenv('GEMINI_API_KEY'))})
   except Exception:return self.respond(503,{'status':'unavailable','database':'unreachable'})
  urlpath=urlsplit(self.path).path
  if urlpath not in ['/','/judge'] and not urlpath.startswith('/assets/') and urlpath not in ['/catalog.json','/evaluation.json']:return self.respond(404,{'error':'Not found'})
  path=(ROOT/('index.html' if urlpath in ['/','/judge'] else urlpath.lstrip('/'))).resolve()
  if ROOT.resolve() not in path.parents or not path.is_file():return self.respond(404,{'error':'Build the frontend with npm run build --prefix frontend'})
  self.send_response(200);self.send_header('Content-Type',mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
  self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'")
  self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(path.read_bytes())
 def do_POST(self):
  # All writes require the same-origin UI header. No cross-origin CORS is enabled.
  if self.headers.get('X-Workweave')!='portal':return self.respond(403,{'error':'Use the Workweave portal'})
  if self.path not in ['/api/reset','/api/action','/api/context','/api/agent','/api/search','/api/impact']:return self.respond(404,{'error':'Not found'})
  try:
   length=int(self.headers.get('Content-Length','0'))
   if length<0 or length>4096:raise ValueError('Request too large')
   body=json.loads(self.rfile.read(length) or '{}')
   if not isinstance(body,dict):raise ValueError('Invalid request')
   if self.path=='/api/agent' and not authorized(self.headers.get('X-AI-Access','')):return self.respond(401,{'error':'Enter a valid AI invite code. Graph exploration remains public.'})
   token,cookie=self.token()
   with GUARD:
    now=time.time();GLOBAL[:]=[t for t in GLOBAL if now-t<60]
    if len(GLOBAL)>=120:return self.respond(429,{'error':'The demo is busy. Try again in one minute.'},cookie)
    if len(LOCKS)>=200 and token not in LOCKS:return self.respond(429,{'error':'The demo workspace limit is reached.'},cookie)
    recent=[t for t in LIMITS.get(token,[]) if now-t<60]
    if len(recent)>=30:return self.respond(429,{'error':'Request limit reached. Wait one minute.'},cookie)
    GLOBAL.append(now)
    LIMITS[token]=recent+[now];lock=LOCKS.setdefault(token,threading.Lock())
   with lock:
    s=Store(token,DEMO_ASSIGNMENT if self.path=='/api/impact' else body.get('assignment') or 'checkout');s.seed();mode='Graph tools · no model call'
    if self.path=='/api/impact':
     return self.respond(200,{'analysis':run_impact(s,body.get('operation','analyze')),'trace':s.trace},cookie)
    if self.path=='/api/reset':s.reset()
    elif self.path=='/api/action':s.action(body.get('name'),str(body.get('note','')))
    elif self.path not in ['/api/context','/api/agent','/api/search','/api/impact']:return self.respond(404,{'error':'Not found'},cookie)
    if self.path=='/api/agent':
     if not AGENT_SLOTS.acquire(blocking=False):return self.respond(429,{'error':'The agent is busy. Try again shortly.'},cookie)
     try:
      reserve()
      context,selection=run(s,str(body.get('prompt','')));mode='Live '+provider().title()+' tool call + model-selected layout'
     finally:AGENT_SLOTS.release()
    else:
     context=s.context();selection=None
     if self.path=='/api/search':context['searchResults']=s.search(body.get('query',''))
    self.respond(200,{'messages':compose(context,selection),'trace':s.trace,'mode':mode},cookie)
  except BudgetExceeded as e:self.respond(429,{'error':str(e)})
  except ValueError as e:self.respond(400,{'error':str(e)})
  except Exception:self.respond(503,{'error':'The database or AI provider is unavailable. No answer was substituted. Check the server configuration and connection.'})
if __name__=='__main__':
 load()
 print('Workweave listening',flush=True)
 ThreadingHTTPServer(('0.0.0.0',int(os.getenv('PORT','8080'))),Handler).serve_forever()
