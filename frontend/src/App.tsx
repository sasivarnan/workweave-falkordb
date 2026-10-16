import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Trace, TraceLine, TraceTitle, TraceDescription, TraceCollapsible, TraceCollapsibleTrigger, TraceCollapsibleContent } from '@/components/ui/trace'

type Context = {
 task: string[][]; people: string[][]; decisions: (string|null)[][];
 conflicts: [string,string,string,string,string,string[]][];
 training: [string,string,boolean][]; plan: string[][]; paths: string[][][];
 sources: string[][]; current: string|null; needsReview: boolean; ambiguous: boolean;
 direct: string[][]; connected: string[][];
}
type Component = { id: string; component: string; children?: string[]; data?: {path:string} }
type Message = { version:string; createSurface?: {surfaceId:string;catalogId:string}; updateComponents?: {surfaceId:string;components:Component[]}; updateDataModel?: {surfaceId:string;path:string;value:{context:Context}} }
type TraceRecord = {tool:string;query:string;arguments:Record<string,unknown>;rows:number;ms:number;executionPlan?:string}
type Result = {messages:Message[];trace:TraceRecord[];mode:string}
const kinds=['SummaryCard','EvidenceComparison','PersonCard','Checklist','ProgressCard','QuestionForm']
function decode(result:Result) {
 const m=result.messages
 if(!Array.isArray(m)||m.length!==3||m.some(x=>x.version!=='v0.9')||m[0].createSurface?.catalogId!=='urn:firsttask:catalog:v1') throw Error('Unsupported A2UI messages')
 const components=m[1].updateComponents?.components,context=m[2].updateDataModel?.value.context
 if(!components||!context||components[0]?.id!=='root'||components[0]?.component!=='Column') throw Error('Invalid A2UI surface')
 const order=components[0].children
 if(!order||order.length>6||new Set(order).size!==order.length||components.length!==order.length+1) throw Error('Invalid A2UI component tree')
 const byId=new Map(components.slice(1).map(x=>[x.id,x]))
 for(const id of order){const c=byId.get(id);if(!c||!kinds.includes(c.component)||c.data?.path!=='/context') throw Error('Unsupported A2UI component')}
 return {context,order:order.map(id=>byId.get(id)!.component)}
}

export default function App(){
 const [result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const [tab,setTab]=useState('assignment'),[prompt,setPrompt]=useState('What must I do before my first checkout change?'),[note,setNote]=useState('')
 const [demoStep,setDemoStep]=useState(0),[demoLabel,setDemoLabel]=useState('Follow one assignment from old guidance to a saved plan.'),[playing,setPlaying]=useState(false)
 const [openSources,setOpenSources]=useState<string[]>([])
 const busyRef=useRef(false),playRef=useRef(0),stepRef=useRef(0)
 const decoded=result?decode(result):null,context=decoded?.context
 async function request(path:string,body:Record<string,unknown>={}){
  if(busyRef.current)return false
  busyRef.current=true;setBusy(true);setError('')
  try{
   const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-FirstTask':'portal'},body:JSON.stringify(body)})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Request failed')
   const decoded=decode(data);setResult(data);setNote(decoded.context.plan[0]?.[2]||'');return true
  }catch(e){setError(e instanceof Error?e.message:'Request failed');return false}
  finally{busyRef.current=false;setBusy(false)}
 }
 useEffect(()=>{void request('/api/context');return ()=>{playRef.current++}},[])
 function stop(){playRef.current++;setPlaying(false)}
 function showSource(id:string){stop();setOpenSources([id]);setTab('sources')}
 async function act(name:string){stop();await request('/api/action',{name,note})}
 const steps=[
  {label:'Read your assignment and connected evidence',path:'/api/context',body:{}},
  {label:'Replace the decision and see what changes',path:'/api/action',body:{name:'replace'}},
  {label:'Accept and save the updated plan',path:'/api/action',body:{name:'accept',note:'Read the approved provider decision before starting.'}},
  {label:'Complete the required training',path:'/api/action',body:{name:'complete'}},
  {label:'Start a new session and retrieve progress',path:'/api/context',body:{}},
  {label:'Remove the owner and inspect the missing evidence',path:'/api/action',body:{name:'remove-owner'}},
 ]
 async function next(){
  if(stepRef.current>=steps.length){stop();setDemoLabel('Walkthrough complete. Change a fact to explore.');return false}
  const s=steps[stepRef.current];setDemoLabel(s.label);setTab('assignment')
  if(!await request(s.path,s.body)){stop();return false}
  stepRef.current++;setDemoStep(stepRef.current);return true
 }
 async function play(){
  stop();if(!await request('/api/reset'))return
  stepRef.current=0;setDemoStep(0);setPlaying(true);const token=++playRef.current
  while(playRef.current===token){if(!await next())break;await new Promise(resolve=>setTimeout(resolve,4500))}
 }
 async function reset(){stop();stepRef.current=0;setDemoStep(0);setDemoLabel('Sample reset. Start the walkthrough or explore.');await request('/api/reset')}
 return <TooltipProvider><div className="min-h-screen bg-background">
  <header className="border-b"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 md:px-8"><Button variant="ghost" className="font-heading text-lg font-semibold" onClick={()=>setTab('assignment')}>FirstTask</Button><span className="text-xs text-muted-foreground">Northstar Labs · Sample workspace</span><Avatar><AvatarFallback>MC</AvatarFallback></Avatar></div></header>
  <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
   <section className="space-y-2"><p className="text-sm text-muted-foreground">Welcome, Maya</p><h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{context?.task[0]?.[0]||'Your first assignment'}</h1><p className="text-sm text-muted-foreground">{context?.task[0]?.[1]||'Current guidance and a clear next step.'}</p></section>
   {error&&<Alert variant="destructive" role="alert"><AlertTitle>Operation could not finish</AlertTitle><AlertDescription>{error} Previous results can be out of date.</AlertDescription></Alert>}
   {playing&&<Alert><AlertTitle>Walkthrough · {demoStep} of {steps.length}</AlertTitle><AlertDescription>{demoLabel}<Button variant="link" onClick={stop}>Pause walkthrough</Button></AlertDescription></Alert>}
   <Tabs value={tab} onValueChange={v=>setTab(String(v))}>
    <TabsList variant="line"><TabsTrigger value="assignment">My task</TabsTrigger><TabsTrigger value="sources">Sources</TabsTrigger><TabsTrigger value="evidence">Evidence & tools</TabsTrigger><TabsTrigger value="demo">Demo</TabsTrigger></TabsList>
    <TabsContent value="assignment" className="space-y-5 pt-5">
     <form className="flex flex-col gap-2" onSubmit={e=>{e.preventDefault();stop();void request('/api/agent',{prompt})}}><Label htmlFor="prompt" className="sr-only">Ask about your assignment</Label><div className="flex flex-col gap-2 sm:flex-row"><Input id="prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={1000} placeholder="Ask about your assignment"/><Button type="submit" disabled={busy}>{busy?'Working…':'Ask FirstTask'}</Button></div><p role="status" className="text-xs text-muted-foreground">{busy?'Reading company context…':result?.mode||'Connecting to FalkorDB…'}</p></form>
     {!context&&<Skeleton className="h-64 w-full"/>}
     {context?.ambiguous&&<Alert variant="destructive"><AlertTitle>Guidance needs clarification</AlertTitle><AlertDescription>Resolve approval and source evidence before accepting a plan.</AlertDescription></Alert>}
     {context&&!context.people.length&&<Alert><AlertTitle>Reviewer missing</AlertTitle><AlertDescription>Ask Payments to assign a reviewer. No owner was inferred.</AlertDescription></Alert>}
     {context?.needsReview&&<Alert variant="destructive"><AlertTitle>Your saved plan needs review</AlertTitle><AlertDescription>A decision changed. Review and accept the updated plan.</AlertDescription></Alert>}
     {context&&<><div className="grid items-start gap-5 md:grid-cols-2">{decoded!.order.filter(k=>['EvidenceComparison','Checklist'].includes(k)).map(kind=><Card key={kind}>
      {kind==='EvidenceComparison'&&<><CardHeader><CardTitle>Current guidance</CardTitle><CardDescription>{context.conflicts.length?'Your starter guide is out of date.':'Use the approved decision for this task.'}</CardDescription></CardHeader><CardContent className="space-y-4">{context.decisions.map((r,i)=><div key={i} className="space-y-2"><p className="font-medium">{r[1]}</p><p className="text-sm text-muted-foreground">{r[4]||'Source missing. Ask for clarification.'}</p>{r[2]&&<Button variant="link" className="h-auto p-0" onClick={()=>showSource(r[2]!)}>Read {r[3]}</Button>}</div>)}<Accordion>{context.conflicts.map((r,i)=><AccordionItem key={i} value={String(i)}><AccordionTrigger>Why the old guide is outdated</AccordionTrigger><AccordionContent><p>{r[2]}</p><p className="text-xs text-muted-foreground">{r[5].join(' → ')}</p><Button variant="link" className="h-auto p-0" onClick={()=>showSource(r[0])}>Open original guide</Button></AccordionContent></AccordionItem>)}</Accordion></CardContent></>}
      {kind==='Checklist'&&<><CardHeader><CardTitle>Your next steps</CardTitle><CardDescription>{context.plan.length?'Plan saved in your workspace.':'Review and save your plan.'}</CardDescription></CardHeader><CardContent className="space-y-4"><ol className="space-y-4 pl-5 text-sm list-decimal"><li><p>Read the current decision</p><p className="text-muted-foreground">{context.current||'Clarification required'}</p></li>{context.training.map(r=><li key={r[0]}><p className={r[2]?'text-muted-foreground line-through':''}>{r[1]}</p>{r[2]?<Badge variant="secondary">Complete</Badge>:<Button variant="link" className="h-auto p-0" disabled={busy} onClick={()=>void act('complete')}>Mark complete</Button>}</li>)}<li><p>Arrange a review</p><p className="text-muted-foreground">{context.people.length?context.people[0][1]:'Ask Payments to assign a reviewer'}</p></li></ol><Accordion><AccordionItem value="note"><AccordionTrigger>Add a plan note</AccordionTrigger><AccordionContent><Label htmlFor="plan-note" className="sr-only">Plan note</Label><Textarea id="plan-note" value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="A note for your next session"/></AccordionContent></AccordionItem></Accordion></CardContent><CardFooter><Button disabled={busy||context.ambiguous} onClick={()=>void act('accept')}>{context.plan.length?'Update saved plan':'Save plan'}</Button></CardFooter></>}
     </Card>)}</div>
     <Accordion multiple>{decoded!.order.filter(k=>['PersonCard','ProgressCard','SummaryCard'].includes(k)).map(kind=><AccordionItem key={kind} value={kind}><AccordionTrigger>{kind==='PersonCard'?'People who can help':kind==='ProgressCard'?'Saved progress':'How this task connects'}</AccordionTrigger><AccordionContent>
      {kind==='PersonCard'&&<div className="space-y-4">{context.people.map(r=><div key={r[0]} className="flex items-center gap-3"><Avatar><AvatarFallback>{r[1].split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar><div><p className="font-medium">{r[1]}</p><p className="text-sm text-muted-foreground">{r[3]==='REVIEWER_FOR'?'Current reviewer':'Approved alternate'}</p></div></div>)}{!context.people.length&&<p>No reviewer is recorded.</p>}</div>}
      {kind==='ProgressCard'&&<div className="space-y-3"><p>{context.plan.length?'Accepted guidance: '+context.plan[0][1]:'No plan has been accepted.'}</p><p className="text-muted-foreground">A new session retrieves the saved plan without the old conversation.</p><Button variant="outline" disabled={busy} onClick={()=>{stop();setPrompt('What is my next incomplete step?');void request('/api/context')}}>Start new session</Button></div>}
      {kind==='SummaryCard'&&<div className="space-y-3">{context.paths.map((p,i)=><p key={i}>{p[0].join(' → ')}</p>)}<p className="text-muted-foreground">Direct sources: {context.direct.length}. Connected sources: {context.connected.length}.</p><p>{context.connected.map(r=>r[0]).join(' · ')}</p><p className="text-xs text-muted-foreground">Graph-depth comparison, not a document-search benchmark.</p></div>}
     </AccordionContent></AccordionItem>)}</Accordion></>}
    </TabsContent>
    <TabsContent value="sources" className="space-y-4 pt-5"><p className="text-sm text-muted-foreground">{context?.sources.length||0} fictional company documents.</p><Accordion value={openSources} onValueChange={v=>setOpenSources(v.map(String))} multiple>{context?.sources.map(r=><AccordionItem key={r[0]} value={r[0]}><AccordionTrigger>{r[1]}</AccordionTrigger><AccordionContent>{r[2]}</AccordionContent></AccordionItem>)}</Accordion></TabsContent>
    <TabsContent value="evidence" className="space-y-5 pt-5"><p className="text-sm text-muted-foreground">Completed graph operations for the latest successful request. These results are not streamed live.</p>
     {busy&&<Trace><TraceLine status="running"><TraceTitle>Processing request</TraceTitle><TraceDescription>Waiting for completed results</TraceDescription></TraceLine></Trace>}
     {error&&<Trace><TraceLine status="error"><TraceTitle>Request failed</TraceTitle></TraceLine></Trace>}
     <Trace>{result?.trace.map((r,i)=><TraceCollapsible key={i}><TraceCollapsibleTrigger><TraceLine><TraceTitle>{r.tool}</TraceTitle><TraceDescription>{r.executionPlan?'Query plan':`${r.rows} rows`} · {r.ms} ms</TraceDescription></TraceLine></TraceCollapsibleTrigger><TraceCollapsibleContent><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{r.query+'\n\n'+JSON.stringify(r.arguments,null,2)+(r.executionPlan?'\n\nExecution plan (not runtime profiling):\n'+r.executionPlan:'')}</pre></TraceCollapsibleContent></TraceCollapsible>)}</Trace>
     <Accordion><AccordionItem value="json"><AccordionTrigger>A2UI messages</AccordionTrigger><AccordionContent><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(result?.messages,null,2)}</pre></AccordionContent></AccordionItem></Accordion>
    </TabsContent>
    <TabsContent value="demo" className="space-y-5 pt-5"><Card><CardHeader><CardTitle>See the connected story</CardTitle><CardDescription>{demoLabel}</CardDescription></CardHeader><CardContent><Progress value={demoStep/steps.length*100}><ProgressLabel>Guided walkthrough</ProgressLabel><ProgressValue>{()=>`${demoStep} of ${steps.length}`}</ProgressValue></Progress></CardContent><CardFooter className="flex flex-wrap gap-2"><Button onClick={()=>void play()} disabled={busy||playing}>Play walkthrough</Button>{playing&&<Button variant="secondary" onClick={stop}>Pause</Button>}<Button variant="outline" onClick={()=>{stop();void next()}} disabled={busy}>Next step</Button><Button variant="ghost" onClick={()=>void reset()} disabled={busy}>Reset sample</Button></CardFooter></Card><p className="text-xs text-muted-foreground">The walkthrough runs real graph actions without AI calls.</p><Card><CardHeader><CardTitle>Change the sample</CardTitle><CardDescription>Changes affect only your workspace.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>void act('replace')}>Replace decision</Button><Button variant="outline" disabled={busy} onClick={()=>void act('remove-owner')}>Remove owner</Button><Button variant="outline" disabled={busy} onClick={()=>void act('complete')}>Complete training</Button></CardContent></Card></TabsContent>
   </Tabs><Separator/><footer className="text-xs text-muted-foreground">Fictional company data · Real FalkorDB operations</footer>
  </main></div></TooltipProvider>
}
