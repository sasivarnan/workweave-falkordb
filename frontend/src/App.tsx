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
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

type Context = {
 task: string[][]; people: string[][]; decisions: (string|null)[][];
 conflicts: [string,string,string,string,string,string[]][];
 training: [string,string,boolean][]; plan: string[][]; paths: string[][][];
 sources: string[][]; current: string|null; needsReview: boolean; ambiguous: boolean;
 direct: string[][]; connected: string[][];
}
type Component = { id: string; component: string; children?: string[]; data?: {path:string} }
type Message = { version:string; createSurface?: {surfaceId:string;catalogId:string}; updateComponents?: {surfaceId:string;components:Component[]}; updateDataModel?: {surfaceId:string;path:string;value:{context:Context}} }
type Trace = {tool:string;query:string;arguments:Record<string,unknown>;rows:number;ms:number}
type Result = {messages:Message[];trace:Trace[];mode:string}
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
 return <TooltipProvider><SidebarProvider><Sidebar>
  <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" onClick={()=>setTab('assignment')}><Avatar><AvatarFallback>FT</AvatarFallback></Avatar><span className="font-heading text-lg font-semibold">FirstTask</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><Separator/><SidebarGroupLabel>Northstar Labs · Sample company</SidebarGroupLabel></SidebarHeader>
  <SidebarContent><SidebarGroup><SidebarGroupLabel>YOUR WORKSPACE</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{[['assignment','First assignment'],['sources','Company sources'],['evidence','Evidence & tools']].map(([value,label])=><SidebarMenuItem key={value}><SidebarMenuButton isActive={tab===value} onClick={()=>setTab(value)}>{label}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
  <SidebarFooter><Separator/><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg"><Avatar><AvatarFallback>MC</AvatarFallback></Avatar><span>Maya Chen<span className="block text-xs text-muted-foreground">Software engineer · Day 01</span></span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><Badge variant="outline">Fictional employee data</Badge></SidebarFooter>
 </Sidebar><SidebarInset>
  <header className="flex h-16 items-center justify-between gap-3 border-b px-5 md:px-8"><span className="flex items-center gap-3"><SidebarTrigger/><Separator orientation="vertical" className="h-4"/><span className="text-sm text-muted-foreground">Onboarding / <span className="text-foreground">First assignment</span></span></span><Badge variant="secondary">Company Brain</Badge></header>
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 md:p-8">
   <section className="flex flex-wrap items-end justify-between gap-4"><div className="space-y-3"><Badge variant="outline">YOUR FIRST CONTRIBUTION</Badge><h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">Start with the right context.</h1><p className="text-muted-foreground">Find current guidance before your first checkout change.</p></div><Badge>Payments team</Badge></section>
   <Card><CardHeader><CardTitle>See the connected story</CardTitle><CardDescription>{demoLabel}</CardDescription></CardHeader><CardContent><Progress value={demoStep/steps.length*100}><ProgressLabel>Guided walkthrough</ProgressLabel><ProgressValue>{()=>`${demoStep} of ${steps.length}`}</ProgressValue></Progress></CardContent><CardFooter className="flex flex-wrap gap-2"><Button onClick={()=>void play()} disabled={busy||playing}>Play walkthrough</Button>{playing&&<Button variant="secondary" onClick={stop}>Pause</Button>}<Button variant="outline" onClick={()=>{stop();void next()}} disabled={busy}>Next step</Button><Button variant="ghost" onClick={()=>void reset()} disabled={busy}>Reset sample</Button><Badge variant="outline">Real graph actions · No AI calls</Badge></CardFooter></Card>
   {error&&<Alert variant="destructive" role="alert"><AlertTitle>Operation could not finish</AlertTitle><AlertDescription>{error} Previous results can be out of date.</AlertDescription></Alert>}
   <form className="flex flex-col gap-2" onSubmit={e=>{e.preventDefault();stop();void request('/api/agent',{prompt})}}><Label htmlFor="prompt">Ask about your assignment</Label><div className="flex flex-col gap-2 sm:flex-row"><Input id="prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={1000}/><Button type="submit" disabled={busy}>{busy?'Working…':'Ask agent'}</Button></div><p role="status" className="text-xs text-muted-foreground">{busy?'Reading connected company context…':result?.mode||'Connecting to FalkorDB…'}</p></form>
   <Tabs value={tab} onValueChange={v=>setTab(String(v))}>
    <TabsList><TabsTrigger value="assignment">Assignment</TabsTrigger><TabsTrigger value="sources">Sources</TabsTrigger><TabsTrigger value="evidence">Evidence</TabsTrigger></TabsList>
    <TabsContent value="assignment" className="space-y-5 pt-3">
     <Card><CardHeader><CardTitle>Change a fact. Test the result.</CardTitle><CardDescription>These controls change only your sample workspace.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>void act('replace')}>Replace decision</Button><Button variant="outline" disabled={busy} onClick={()=>void act('remove-owner')}>Remove owner</Button><Button variant="outline" disabled={busy} onClick={()=>void act('complete')}>Complete training</Button></CardContent></Card>
     {!context&&<Skeleton className="h-48 w-full"/>}
     {context&&<div className="grid gap-5 lg:grid-cols-2">{decoded!.order.map(kind=><Card key={kind} className={kind==='SummaryCard'?'lg:col-span-2':''}>
      {kind==='SummaryCard'&&<><CardHeader><Badge variant="secondary">ENG–108 · First assignment</Badge><CardTitle className="font-heading text-2xl">{context.task[0]?.[0]||'Assignment unavailable'}</CardTitle><CardDescription>{context.task[0]?.[1]}</CardDescription></CardHeader><CardContent className="space-y-4">{context.paths.map((p,i)=><p key={i} className="flex flex-wrap items-center gap-2">{p[0].map((n,j)=><Badge key={j} variant="outline">{j>0?'→ ':''}{n}</Badge>)}</p>)}<Accordion><AccordionItem value="depth"><AccordionTrigger>Why connected context matters</AccordionTrigger><AccordionContent><p>Direct assignment sources: {context.direct.length}. Connected sources: {context.connected.length}.</p><p>{context.connected.map(r=>r[0]).join(' · ')}</p><p className="text-muted-foreground">This compares graph depth. It is not a document-search benchmark.</p></AccordionContent></AccordionItem></Accordion></CardContent></>}
      {kind==='EvidenceComparison'&&<><CardHeader><Badge variant="outline">{context.conflicts.length?'Outdated guidance found':'Review guidance'}</Badge><CardTitle>Read the current decision.</CardTitle><CardDescription>The old guide conflicts with an approved replacement.</CardDescription></CardHeader><CardContent className="space-y-4">{context.conflicts.map((r,i)=><Alert key={i}><AlertTitle>Outdated · {r[1]}</AlertTitle><AlertDescription>{r[2]}<Button variant="link" onClick={()=>showSource(r[0])}>Open original source</Button></AlertDescription></Alert>)}{context.decisions.map((r,i)=><Alert key={i}><AlertTitle>Current · {r[1]}</AlertTitle><AlertDescription>{r[4]||'Source missing. Ask for clarification.'}{r[2]&&<Button variant="link" onClick={()=>showSource(r[2]!)}>{r[3]}</Button>}</AlertDescription></Alert>)}{context.ambiguous&&<Alert variant="destructive"><AlertTitle>Guidance is unresolved</AlertTitle><AlertDescription>Resolve approval and source evidence before accepting a plan.</AlertDescription></Alert>}<Accordion><AccordionItem value="paths"><AccordionTrigger>Inspect the supersession path</AccordionTrigger><AccordionContent>{context.conflicts.map((r,i)=><p key={i}>{r[5].join(' → ')}</p>)}</AccordionContent></AccordionItem></Accordion></CardContent></>}
      {kind==='PersonCard'&&<><CardHeader><CardTitle>People who can help</CardTitle><CardDescription>Reviewers recorded for the checkout service.</CardDescription></CardHeader><CardContent className="space-y-4">{context.people.map(r=><div key={r[0]} className="flex items-center gap-3"><Avatar><AvatarFallback>{r[1].split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar><div><p className="font-medium">{r[1]}</p><p className="text-sm text-muted-foreground">{r[3]==='REVIEWER_FOR'?'Current reviewer':'Approved alternate'}</p></div></div>)}{!context.people.length&&<Alert><AlertTitle>Reviewer missing</AlertTitle><AlertDescription>Ask Payments to assign a reviewer. No owner was inferred.</AlertDescription></Alert>}</CardContent></>}
      {kind==='Checklist'&&<><CardHeader><CardTitle>Your learning plan</CardTitle><CardDescription>Complete the prerequisites before you start.</CardDescription></CardHeader><CardContent className="space-y-4"><Alert><AlertTitle>1. Read the current decision</AlertTitle><AlertDescription>{context.current||'Clarification required'}</AlertDescription></Alert>{context.training.map(r=><Alert key={r[0]}><AlertTitle>2. {r[1]}</AlertTitle><AlertDescription><Badge variant={r[2]?'secondary':'outline'}>{r[2]?'Complete · Saved':'Required'}</Badge></AlertDescription></Alert>)}<Alert><AlertTitle>3. Arrange a review</AlertTitle><AlertDescription>{context.people.length?context.people[0][1]:'Ask the team to assign a reviewer'}</AlertDescription></Alert><Label htmlFor="plan-note">Add a note</Label><Textarea id="plan-note" value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="For example: review the guide with my mentor."/></CardContent><CardFooter><Button disabled={busy||context.ambiguous} onClick={()=>void act('accept')}>Accept & save plan</Button></CardFooter></>}
      {kind==='ProgressCard'&&<><CardHeader><CardTitle>{context.plan.length?'Your plan is saved.':'Make the plan yours.'}</CardTitle><CardDescription>Progress is stored in your FalkorDB workspace.</CardDescription></CardHeader><CardContent className="space-y-4">{context.plan.length>0&&<Alert><AlertTitle>{context.plan[0][0]}</AlertTitle><AlertDescription>Accepted guidance: {context.plan[0][1]}</AlertDescription></Alert>}{context.needsReview&&<Alert variant="destructive"><AlertTitle>Your accepted plan needs review</AlertTitle><AlertDescription>A decision changed. Review and accept the updated plan.</AlertDescription></Alert>}<p className="text-sm text-muted-foreground">A new session retrieves your plan without the old conversation.</p></CardContent><CardFooter><Button variant="outline" disabled={busy} onClick={()=>{stop();setPrompt('What is my next incomplete step?');void request('/api/context')}}>Start new session</Button></CardFooter></>}
      {kind==='QuestionForm'&&<><CardHeader><CardTitle>One connection is missing.</CardTitle><CardDescription>Clarification is required.</CardDescription></CardHeader><CardContent><Alert><AlertTitle>{!context.people.length?'Who is the current reviewer?':'Which decision is approved?'}</AlertTitle><AlertDescription>Ask Payments to confirm. No message has been sent.</AlertDescription></Alert></CardContent></>}
     </Card>)}</div>}
    </TabsContent>
    <TabsContent value="sources" className="space-y-4 pt-3"><Card><CardHeader><CardTitle>Company sources</CardTitle><CardDescription>{context?.sources.length||0} fictional source documents. Inspect the evidence behind the plan.</CardDescription></CardHeader><CardContent><Accordion value={openSources} onValueChange={v=>setOpenSources(v.map(String))} multiple>{context?.sources.map(r=><AccordionItem key={r[0]} value={r[0]}><AccordionTrigger>{r[1]}</AccordionTrigger><AccordionContent>{r[2]}</AccordionContent></AccordionItem>)}</Accordion></CardContent></Card></TabsContent>
    <TabsContent value="evidence" className="space-y-4 pt-3"><Card><CardHeader><CardTitle>Graph tools, visible evidence</CardTitle><CardDescription>Fixed Cypher queries. Checked arguments. Real results.</CardDescription></CardHeader><CardContent><Accordion multiple>{result?.trace.map((r,i)=><AccordionItem key={i} value={String(i)}><AccordionTrigger><span>{r.tool}</span><Badge variant="outline">{r.rows} rows · {r.ms} ms</Badge></AccordionTrigger><AccordionContent><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{r.query+'\n\n'+JSON.stringify(r.arguments,null,2)}</pre></AccordionContent></AccordionItem>)}</Accordion></CardContent></Card><Card><CardHeader><CardTitle>A2UI messages</CardTitle><CardDescription>Domain descriptors render with official shadcn components.</CardDescription></CardHeader><CardContent><Accordion><AccordionItem value="json"><AccordionTrigger>Inspect validated messages</AccordionTrigger><AccordionContent><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(result?.messages,null,2)}</pre></AccordionContent></AccordionItem></Accordion></CardContent></Card></TabsContent>
   </Tabs><Separator/><footer className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>FirstTask · Company Brain</span><span>Fictional data. Real graph operations.</span></footer>
  </main></SidebarInset></SidebarProvider></TooltipProvider>
}
