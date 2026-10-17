import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import {
  RiHome5Line,
  RiCheckboxCircleLine,
  RiCalendarLine,
  RiFileTextLine,
  RiBookOpenLine,
  RiTeamLine,
  RiSearchLine,
  RiArrowRightLine,
  RiSunLine,
  RiMoonLine,
  RiArrowRightSLine,
  RiBuildingLine,
  RiInformationLine,
} from "@remixicon/react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Trace,
  TraceLine,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace"

import { decode, type Evaluation, type Result } from "@/lib/workspace"

export default function App() {
  const judgeMode = window.location.pathname === "/judge"
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("firsttask-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  )
  const [meeting, setMeeting] = useState<string[] | null>(null)
  const [workspaceNote, setWorkspaceNote] = useState("")
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("scheme-dark", theme === "dark")
    document.documentElement.classList.toggle("scheme-light", theme !== "dark")
    localStorage.setItem("firsttask-theme", theme)
  }, [theme])
  const [assignment, setAssignment] = useState(() =>
    judgeMode
      ? "checkout"
      : localStorage.getItem("firsttask-assignment") || "checkout"
  )
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  const [readingOpen, setReadingOpen] = useState(false),
    [editingNotes, setEditingNotes] = useState(false)
  const [aiCode, setAiCode] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [evaluationError, setEvaluationError] = useState(false)
  const [tab, setTab] = useState(judgeMode ? "proof" : "workspace"),
    [prompt, setPrompt] = useState(""),
    [note, setNote] = useState("")
  const [demoStep, setDemoStep] = useState(0),
    [demoLabel, setDemoLabel] = useState(
      "Follow one assignment from old guidance to a saved plan."
    ),
    [playing, setPlaying] = useState(false)
  const [openSources, setOpenSources] = useState<string[]>([])
  const busyRef = useRef(false),
    playRef = useRef(0),
    stepRef = useRef(0)
  const decoded = result ? decode(result) : null,
    context = decoded?.context
  const navigationRef = useRef(0),
    activeTransition = useRef<ViewTransition | null>(null)
  function transition(update: () => void) {
    const version = ++navigationRef.current
    activeTransition.current?.skipTransition()
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      update()
      return
    }
    const animation = document.startViewTransition(() => {
      if (version === navigationRef.current) flushSync(update)
    })
    activeTransition.current = animation
    void animation.finished
      .catch(() => {})
      .finally(() => {
        if (activeTransition.current === animation)
          activeTransition.current = null
      })
  }
  function navigate(destination: string) {
    if (destination === tab) return
    transition(() => {
      setTab(destination)
      window.scrollTo({ top: 0, behavior: "instant" })
    })
  }
  async function openAssignment(id: string) {
    stop()
    setReadingOpen(false)
    setEditingNotes(false)
    await request("/api/context", { assignment: id }, "assignment")
  }
  async function request(
    path: string,
    body: Record<string, unknown> = {},
    destination?: string
  ) {
    if (busyRef.current) return false
    const navigationVersion = navigationRef.current
    busyRef.current = true
    setBusy(true)
    setError("")
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FirstTask": "portal",
          ...(path === "/api/agent" ? { "X-AI-Access": aiCode } : {}),
        },
        body: JSON.stringify({ assignment, ...body }),
      })
      const data = await response.json()
      if (response.status === 401) setAiCode("")
      if (!response.ok) throw Error(data.error || "Request failed")
      const decoded = decode(data)
      if (navigationRef.current !== navigationVersion) destination = undefined
      const commit = () => {
        setResult(data)
        setAssignment(decoded.context.assignment)
        setNote(decoded.context.plan[0]?.[2] || "")
        if (destination) {
          setTab(destination)
          window.scrollTo({ top: 0, behavior: "instant" })
        }
      }
      if (destination) transition(commit)
      else commit()
      if (!judgeMode)
        localStorage.setItem("firsttask-assignment", decoded.context.assignment)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
      return false
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  useEffect(() => {
    if (judgeMode)
      void fetch("/evaluation.json")
        .then((r) => {
          if (!r.ok) throw Error("Report unavailable")
          return r.json()
        })
        .then(setEvaluation)
        .catch(() => setEvaluationError(true))
  }, [])
  useEffect(() => {
    void request("/api/context")
    return () => {
      playRef.current++
      activeTransition.current?.skipTransition()
    }
  }, [])
  useEffect(() => {
    if (tab === "sources" && openSources[0])
      document
        .getElementById("source-" + openSources[0])
        ?.scrollIntoView({ behavior: "instant", block: "center" })
  }, [tab, openSources])
  function stop() {
    playRef.current++
    setPlaying(false)
  }
  function showSource(id: string) {
    stop()
    transition(() => {
      setOpenSources([id])
      setTab("sources")
      setResult((previous) => {
        if (!previous) return previous
        const next = structuredClone(previous)
        const data = next.messages[2].updateDataModel?.value.context
        if (data) delete data.searchResults
        return next
      })
    })
  }
  async function act(name: string) {
    stop()
    return await request("/api/action", { name, note })
  }
  const steps = [
    {
      label: "Read your assignment and connected evidence",
      path: "/api/context",
      body: {},
    },
    {
      label: "Save a plan based on the current decision",
      path: "/api/action",
      body: {
        name: "accept",
        note: "Check pending and failed status states with the approved provider.",
      },
    },
    {
      label: "Replace the decision: the saved plan now needs review",
      path: "/api/action",
      body: { name: "replace" },
    },
    {
      label: "Acknowledge the new approved guidance",
      path: "/api/action",
      body: { name: "review" },
    },
    {
      label: "Accept and save the updated plan",
      path: "/api/action",
      body: {
        name: "accept",
        note: "Read the approved provider decision before starting.",
      },
    },
    {
      label: "Complete the required training",
      path: "/api/action",
      body: { name: "complete" },
    },
    {
      label: "Create a review request with current evidence",
      path: "/api/action",
      body: { name: "request-review" },
    },
    {
      label: "Start a new session and retrieve progress",
      path: "/api/context",
      body: {},
    },
    {
      label: "Remove the owner and inspect the missing evidence",
      path: "/api/action",
      body: { name: "remove-owner" },
    },
  ]
  async function next() {
    if (stepRef.current >= steps.length) {
      stop()
      setDemoLabel("Walkthrough complete. Change a fact to explore.")
      return false
    }
    const s = steps[stepRef.current]
    setDemoLabel(s.label)
    if (
      !(await request(
        s.path,
        { ...s.body, assignment: "checkout" },
        "assignment"
      ))
    ) {
      stop()
      return false
    }
    stepRef.current++
    setDemoStep(stepRef.current)
    return true
  }
  async function play() {
    setAssignment("checkout")
    stop()
    if (!(await request("/api/reset", { assignment: "checkout" }))) return
    stepRef.current = 0
    setDemoStep(0)
    setPlaying(true)
    const token = ++playRef.current
    while (playRef.current === token) {
      if (!(await next())) break
      await new Promise((resolve) => setTimeout(resolve, 4500))
    }
  }
  async function reset() {
    stop()
    stepRef.current = 0
    setDemoStep(0)
    setDemoLabel("Sample reset. Start the walkthrough or explore.")
    await request("/api/reset")
  }
  const required = context ? 1 + context.training.length : 1
  const finished = context
    ? Number(context.guidanceRead) + context.training.filter((r) => r[2]).length
    : 0
  const reviewer =
    context?.people.find((p) => p[3] === "REVIEWER_FOR") || context?.people[0]
  const requestCurrent =
    !!context?.reviewRequest.length &&
    context.reviewRequest[0][3] === context.decisions[0]?.[0] &&
    context.people.some((p) => p[1] === context.reviewRequest[0][2]) &&
    context.reviewRequest[0][4] === context.plan[0]?.[2]
  const stage = !context
    ? "reading"
    : context.ambiguous
      ? "blocked"
      : !context.guidanceRead
        ? "reading"
        : finished < required
          ? "training"
          : context.needsReview
            ? "refresh"
            : editingNotes || !context.plan[0]?.[2]?.trim()
              ? "notes"
              : !context.people.length
                ? "blocked"
                : requestCurrent
                  ? "done"
                  : "review"
  const stageTitle =
    stage === "blocked"
      ? "Ask Payments for clarification"
      : stage === "reading"
        ? "Before you start"
        : stage === "training"
          ? "Complete the required training"
          : stage === "refresh"
            ? "Your guidance changed"
            : stage === "notes"
              ? "Prepare your review"
              : stage === "done"
                ? "Your review request is saved"
                : "Ready to ask for review"
  const stageDescription =
    stage === "blocked"
      ? context?.ambiguous
        ? "A single approved, source-backed decision is missing. Ask the team to resolve it."
        : "Your task has no recorded reviewer. Ask the team to assign one."
      : stage === "reading"
        ? context?.conflicts.length
          ? "Your starter guide is outdated. Read the approved replacement before you begin."
          : "Read the approved guidance for this task."
        : stage === "training"
          ? "After you finish the training, record it here."
          : stage === "refresh"
            ? "Your saved notes refer to an old decision. Accept the current guidance before you proceed."
            : stage === "notes"
              ? "Write down the checks and questions you want to discuss."
              : stage === "done"
                ? "Your notes and current evidence are saved together. Reviewer approval is still required."
                : "FirstTask has checked your reading, training, notes, and recorded reviewer."
  async function primaryAction() {
    if (stage === "reading") {
      if (!readingOpen) {
        setReadingOpen(true)
        return
      }
      if (await act("review")) setReadingOpen(false)
    } else if (stage === "training") await act("complete")
    else if (stage === "notes" || stage === "refresh") {
      if (await act("accept")) setEditingNotes(false)
    } else if (stage === "review") await act("request-review")
    else if (stage === "done") setEditingNotes(true)
  }
  const meetingDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Kolkata",
    })
  const meetingTime = (value: string) =>
    new Date(value).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    })
  const firstMeeting = context?.meetings[0]
  const navItems = [
    ["workspace", "Today", RiHome5Line],
    ["home", "Tasks", RiCheckboxCircleLine],
    ["calendar", "Calendar", RiCalendarLine],
    ["notes", "Notes", RiFileTextLine],
    ["sources", "Knowledge", RiBookOpenLine],
    ["people", "People", RiTeamLine],
  ] as const
  const pageTitle =
    navItems.find(([id]) => id === tab)?.[1] ||
    (
      {
        assignment: "Task",
        proof: "Proof & evaluation",
        evidence: "Evidence & tools",
        demo: "Walkthrough",
      } as Record<string, string>
    )[tab]
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen className="[--sidebar-width:15rem]">
        <Sidebar className="border-r" collapsible="offcanvas">
          <SidebarHeader className="gap-6 px-5 py-7">
            <div className="flex items-center gap-2.5">
              <RiBuildingLine className="size-6 text-primary" />
              <span className="font-heading text-xl font-semibold tracking-tight">
                FirstTask
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm">
              <Avatar className="size-6 rounded-md">
                <AvatarFallback className="rounded-md text-xs">
                  N
                </AvatarFallback>
              </Avatar>
              Northstar Labs
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-4">
              <SidebarMenu className="gap-1">
                {navItems.map(([id, label, Icon]) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      isActive={tab === id}
                      onClick={() => navigate(id)}
                      className="h-11 gap-3 rounded-lg px-3 text-sm data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {judgeMode && (
              <SidebarGroup className="px-4">
                <SidebarGroupLabel>REVIEW</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    ["proof", "Proof & evaluation"],
                    ["evidence", "Evidence & tools"],
                    ["demo", "Walkthrough"],
                  ].map(([id, label]) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={tab === id}
                        onClick={() => navigate(id)}
                      >
                        {label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="gap-4 p-5">
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  MC
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Maya Chen</p>
                <p className="text-xs text-muted-foreground">Payments</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <RiSunLine /> : <RiMoonLine />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0">
          <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-5 py-3 lg:px-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <span className="text-sm text-muted-foreground">Workspace</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{pageTitle}</span>
            </div>
            <form
              className="flex w-full items-center gap-2 sm:w-72"
              onSubmit={(e) => {
                e.preventDefault()
                stop()
                void request("/api/search", { query: searchQuery }, "sources")
              }}
            >
              <Label htmlFor="workspace-search" className="sr-only">
                Search your company
              </Label>
              <div className="relative flex-1">
                <RiSearchLine className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  id="workspace-search"
                  className="h-9 bg-muted/30 pl-9"
                  placeholder="Search your company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label="Search"
                disabled={busy}
              >
                <RiArrowRightLine />
              </Button>
            </form>
          </header>
          <main
            className={
              "mx-auto flex w-full flex-col gap-7 px-5 py-8 [view-transition-name:work-area] md:px-9 lg:px-12 lg:py-10 " +
              (tab === "assignment" ? "max-w-3xl" : "max-w-7xl")
            }
          >
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Operation could not finish</AlertTitle>
                <AlertDescription>
                  {error} Previous results can be out of date.
                </AlertDescription>
              </Alert>
            )}
            {playing && (
              <Alert>
                <AlertTitle>
                  Walkthrough · {demoStep} of {steps.length}
                </AlertTitle>
                <AlertDescription>
                  {demoLabel}
                  <Button variant="link" onClick={stop}>
                    Pause walkthrough
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <Tabs value={tab} onValueChange={(v) => navigate(String(v))}>
              <TabsList className="hidden">
                <TabsTrigger value="workspace">Today</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="proof">Proof & evaluation</TabsTrigger>
                <TabsTrigger value="home">Tasks</TabsTrigger>
                <TabsTrigger value="assignment">My task</TabsTrigger>
                <TabsTrigger value="sources">Documents</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="evidence">Evidence & tools</TabsTrigger>
                <TabsTrigger value="demo">Walkthrough</TabsTrigger>
              </TabsList>
              <TabsContent value="workspace" className="space-y-9">
                <section className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Northstar Labs · Sample workspace
                  </p>
                  <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Good morning, Maya
                  </h1>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Your work and the context behind it.
                  </p>
                </section>
                <div className="flex items-center gap-6 border-b">
                  <span className="border-b-2 border-primary pb-3 text-sm font-medium text-primary">
                    My day
                  </span>
                  <span className="pb-3 text-xs text-muted-foreground">
                    Payments · Engineering
                  </span>
                </div>
                {!context ? (
                  <Skeleton className="h-72" />
                ) : (
                  <div className="grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                    <div className="space-y-9">
                      <section className="space-y-4">
                        <h2 className="font-heading text-lg font-semibold">
                          Up next
                        </h2>
                        {firstMeeting ? (
                          <Card className="gap-0 rounded-xl py-0 shadow-none">
                            <CardContent className="space-y-4 p-5 sm:p-6">
                              <div className="flex flex-wrap items-start gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                                  <RiCalendarLine className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <h3 className="font-medium">
                                    {firstMeeting[1]}
                                  </h3>
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/5 text-primary"
                                  >
                                    Payments
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {meetingDate(firstMeeting[3])} ·{" "}
                                    {meetingTime(firstMeeting[3])} IST
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => setMeeting(firstMeeting)}
                                >
                                  Open meeting brief
                                </Button>
                              </div>
                              {context.impact.length > 0 && (
                                <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2">
                                  <RiInformationLine className="size-4 shrink-0 text-primary" />
                                  <p className="flex-1 text-xs">
                                    Payment guidance changed
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto px-0 text-xs"
                                    disabled={busy}
                                    onClick={() =>
                                      void openAssignment("checkout")
                                    }
                                  >
                                    Review update <RiArrowRightLine />
                                  </Button>
                                </div>
                              )}
                              <Collapsible>
                                <CollapsibleTrigger className="flex w-full items-center justify-between border-t pt-4 text-left text-xs font-medium">
                                  Connected context
                                  <RiArrowRightSLine className="size-4" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 pt-3">
                                  <p className="pb-2 text-xs text-muted-foreground">
                                    Related records for this meeting
                                  </p>
                                  {firstMeeting[5] && (
                                    <Button
                                      variant="ghost"
                                      className="h-auto w-full justify-start py-3 text-left text-xs whitespace-normal"
                                      onClick={() =>
                                        showSource(firstMeeting[5])
                                      }
                                    >
                                      <RiFileTextLine />
                                      Meeting notes
                                      <RiArrowRightSLine className="ml-auto" />
                                    </Button>
                                  )}
                                  {firstMeeting[4] && (
                                    <Button
                                      variant="ghost"
                                      className="h-auto w-full justify-start py-3 text-left text-xs whitespace-normal"
                                      disabled={busy}
                                      onClick={() =>
                                        void openAssignment(firstMeeting[4])
                                      }
                                    >
                                      <RiCheckboxCircleLine />
                                      Related task and approved guidance
                                      <RiArrowRightSLine className="ml-auto" />
                                    </Button>
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            </CardContent>
                          </Card>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No meetings scheduled.
                          </p>
                        )}
                      </section>
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="font-heading text-lg font-semibold">
                            Your tasks
                          </h2>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs"
                            onClick={() => navigate("home")}
                          >
                            View all tasks <RiArrowRightLine />
                          </Button>
                        </div>
                        <div className="divide-y border-t">
                          {context.assignments.map((r) => (
                            <Button
                              key={r[0]}
                              variant="ghost"
                              className="h-auto w-full justify-start gap-3 rounded-none px-0 py-5 text-left"
                              disabled={busy}
                              onClick={() => void openAssignment(r[0])}
                            >
                              <RiCheckboxCircleLine className="size-5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 space-y-1 whitespace-normal">
                                <span className="block text-sm font-medium">
                                  {r[1]}
                                </span>
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {r[2]}
                                </span>
                              </span>
                              <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
                            </Button>
                          ))}
                        </div>
                      </section>
                    </div>
                    <aside className="space-y-10">
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-heading text-lg font-semibold">
                            Schedule
                          </h2>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs"
                            onClick={() => navigate("calendar")}
                          >
                            View calendar <RiArrowRightLine />
                          </Button>
                        </div>
                        <div className="space-y-1 border-t pt-3">
                          {context.meetings.map((r) => (
                            <Button
                              key={r[0]}
                              variant="ghost"
                              className="h-auto w-full items-start justify-start gap-4 px-0 py-4 text-left whitespace-normal"
                              onClick={() => setMeeting(r)}
                            >
                              <span className="pt-0.5 text-xs font-normal text-muted-foreground">
                                {meetingTime(r[3])}
                              </span>
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                              <span className="space-y-1">
                                <span className="block text-sm font-medium">
                                  {r[1]}
                                </span>
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {meetingDate(r[3])} · IST
                                </span>
                              </span>
                            </Button>
                          ))}
                        </div>
                      </section>
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="font-heading text-lg font-semibold">
                            Meeting notes
                          </h2>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs"
                            onClick={() => navigate("notes")}
                          >
                            View all <RiArrowRightLine />
                          </Button>
                        </div>
                        <div className="divide-y border-t">
                          {context.notes
                            .filter((r) => r[0] !== "personal-note")
                            .slice(0, 3)
                            .map((r) => (
                              <Button
                                key={r[0]}
                                variant="ghost"
                                className="h-auto w-full justify-start gap-3 px-0 py-4 text-left whitespace-normal"
                                onClick={() => showSource(r[0])}
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                  <RiFileTextLine className="size-4 text-muted-foreground" />
                                </span>
                                <span className="flex-1 text-sm font-normal">
                                  {r[1]}
                                </span>
                                <RiArrowRightSLine className="size-4 text-muted-foreground" />
                              </Button>
                            ))}
                        </div>
                      </section>
                    </aside>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="calendar" className="space-y-8">
                <section className="space-y-2">
                  <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    Calendar
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Meetings, with the work and notes you need. All times are
                    IST.
                  </p>
                </section>
                <div className="divide-y border-y">
                  {context?.meetings.map((r) => (
                    <Button
                      key={r[0]}
                      variant="ghost"
                      className="h-auto w-full items-start justify-start gap-5 rounded-none px-0 py-6 text-left"
                      onClick={() => setMeeting(r)}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <RiCalendarLine className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1 space-y-2 whitespace-normal">
                        <span className="block text-xs font-normal text-muted-foreground">
                          {meetingDate(r[3])} · {meetingTime(r[3])} IST
                        </span>
                        <span className="block text-base font-medium">
                          {r[1]}
                        </span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          {r[2]}
                        </span>
                      </span>
                      <RiArrowRightSLine className="mt-3 size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="notes" className="space-y-8">
                <section className="space-y-2">
                  <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    Notes
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Meeting records and your workspace note.
                  </p>
                </section>
                <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
                  <section className="space-y-4">
                    <h2 className="text-sm font-medium">Saved notes</h2>
                    <Accordion>
                      {context?.notes.map((r) => (
                        <AccordionItem key={r[0]} value={r[0]}>
                          <AccordionTrigger>{r[1]}</AccordionTrigger>
                          <AccordionContent className="leading-7 whitespace-pre-wrap">
                            {r[2]}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                  <section className="space-y-4 rounded-xl border bg-muted/20 p-5">
                    <Label htmlFor="workspace-note">Your workspace note</Label>
                    <Textarea
                      id="workspace-note"
                      className="min-h-40 bg-background"
                      value={workspaceNote}
                      onChange={(e) => setWorkspaceNote(e.target.value)}
                      maxLength={500}
                      placeholder="Keep a question or follow-up here…"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {workspaceNote.length} / 500
                      </p>
                      <Button
                        disabled={busy || !workspaceNote.trim()}
                        onClick={() =>
                          void request("/api/action", {
                            name: "save-note",
                            note: workspaceNote,
                          })
                        }
                      >
                        {busy ? "Saving…" : "Save note"}
                      </Button>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Saved in your sample workspace. Do not enter private
                      company information.
                    </p>
                  </section>
                </div>
              </TabsContent>
              {judgeMode && (
                <TabsContent value="proof" className="space-y-8">
                  <section className="max-w-3xl space-y-4">
                    <Badge>FirstTask / Review in two minutes</Badge>
                    <h1 className="font-heading text-3xl font-semibold tracking-tight lg:text-4xl">
                      Catch outdated advice before a new employee acts on it.
                    </h1>
                    <p className="text-base leading-7 text-muted-foreground">
                      The starter guide says Provider A. An approved decision
                      replaced it with Provider B. FirstTask connects the
                      assignment to both sources, explains the conflict, and
                      flags the saved plan when the decision changes again.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        disabled={busy || playing}
                        onClick={() => void play()}
                      >
                        Run the evidence walkthrough
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("assignment")}
                      >
                        Try the employee task
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Real FalkorDB operations in your isolated sample
                      workspace. No model credits required for this walkthrough.
                    </p>
                  </section>
                  <div className="grid gap-5 md:grid-cols-3">
                    {[
                      [
                        "Find the conflict",
                        "Follow assignment → service → approved decision → superseded advice → original guide.",
                      ],
                      [
                        "See what changes",
                        "Replace the approved decision. The saved plan is flagged for review; new guidance becomes unread.",
                      ],
                      [
                        "Refuse to guess",
                        "Conflicting approvals or missing sources block plan acceptance. A missing reviewer stays missing.",
                      ],
                    ].map(([title, body]) => (
                      <Card key={title} className="shadow-none">
                        <CardHeader>
                          <CardTitle>{title}</CardTitle>
                          <CardDescription className="leading-6">
                            {body}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  {evaluation?.relationshipDiagnostic && (
                    <section className="space-y-4">
                      <h2 className="font-heading text-xl font-semibold">
                        Same documents. Different company state.
                      </h2>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        We changed only graph relationships. Every source
                        document kept the same ID, title, and body. The correct
                        guidance or reviewer still changed.
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Relationship change</TableHead>
                            <TableHead>Before</TableHead>
                            <TableHead>After</TableHead>
                            <TableHead>Documents</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evaluation.relationshipDiagnostic.results.map(
                            (r) => (
                              <TableRow key={r.case}>
                                <TableCell>{r.case}</TableCell>
                                <TableCell>{r.before}</TableCell>
                                <TableCell>{r.after}</TableCell>
                                <TableCell>
                                  {r.documentsUnchanged
                                    ? "Identical"
                                    : "Changed"}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                      <Accordion>
                        <AccordionItem value="relationship-method">
                          <AccordionTrigger>
                            What this proves—and what it does not
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3">
                            <p>{evaluation.relationshipDiagnostic.method}</p>
                            <p>{evaluation.relationshipDiagnostic.claim}</p>
                            {evaluation.relationshipDiagnostic.results.map(
                              (r) => (
                                <section key={r.case}>
                                  <p className="font-medium">{r.case}</p>
                                  <pre className="overflow-auto text-xs whitespace-pre-wrap">
                                    {r.query}
                                  </pre>
                                </section>
                              )
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </section>
                  )}
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-heading text-xl font-semibold">
                        Reproducible evidence checks
                      </h2>
                      {evaluation && (
                        <Badge variant="secondary">
                          {evaluation.results.filter((r) => r.passed).length} /{" "}
                          {evaluation.results.length} graph checks passed
                        </Badge>
                      )}
                    </div>
                    {evaluationError && (
                      <Alert variant="destructive">
                        <AlertTitle>Evaluation report unavailable</AlertTitle>
                        <AlertDescription>
                          Run scripts/evaluate.py and rebuild the frontend.
                        </AlertDescription>
                      </Alert>
                    )}
                    {!evaluation && !evaluationError && (
                      <Skeleton className="h-48" />
                    )}
                    {evaluation && (
                      <>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {evaluation.dataset} Results below are a saved local
                          run, not a live benchmark.
                        </p>
                        {evaluation.modelDiagnostic && (
                          <Alert>
                            <AlertTitle>
                              Graph context alone did not make the model safe
                            </AlertTitle>
                            <AlertDescription className="space-y-2">
                              <p>
                                Paired {evaluation.modelDiagnostic.model} check:
                                document-only guidance{" "}
                                {
                                  evaluation.modelDiagnostic.results.filter(
                                    (r) => r.documents.correct
                                  ).length
                                }
                                /8; graph-context guidance{" "}
                                {
                                  evaluation.modelDiagnostic.results.filter(
                                    (r) => r.graph.correct
                                  ).length
                                }
                                /8. The model still failed to abstain on
                                conflicting approval and missing source
                                evidence. Some correct answers also used invalid
                                citation IDs.
                              </p>
                              <p>
                                FirstTask does not let generated factual answers
                                control review requests. The tested graph gates
                                decide whether an action is allowed.
                              </p>
                              <Accordion>
                                <AccordionItem value="model-method">
                                  <AccordionTrigger>
                                    Paired model method
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    {evaluation.modelDiagnostic.method}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </AlertDescription>
                          </Alert>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Case</TableHead>
                              <TableHead>Expected</TableHead>
                              <TableHead>FirstTask</TableHead>
                              <TableHead>Keyword top result</TableHead>
                              <TableHead>Check</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {evaluation.results.map((r) => (
                              <TableRow key={r.case}>
                                <TableCell className="max-w-64 whitespace-normal">
                                  <p className="font-medium">{r.case}</p>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {r.detail}
                                  </p>
                                </TableCell>
                                <TableCell>{r.expected || "Abstain"}</TableCell>
                                <TableCell>{r.graph || "Abstained"}</TableCell>
                                <TableCell className="max-w-52 whitespace-normal">
                                  <p>{r.lexical || "No extracted answer"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {r.lexicalSource}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      r.passed ? "secondary" : "destructive"
                                    }
                                  >
                                    {r.passed ? "Pass" : "Fail"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Accordion>
                          <AccordionItem value="method">
                            <AccordionTrigger>
                              Method, limits, and how to reproduce
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <p>{evaluation.method}</p>
                              <ul className="list-disc space-y-2 pl-5">
                                {evaluation.limitations.map((r) => (
                                  <li key={r}>{r}</li>
                                ))}
                              </ul>
                              <p>
                                Reproduce: start FalkorDB, then run python
                                scripts/evaluate.py. Each case uses a fresh
                                graph that is deleted after the run.
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </>
                    )}
                  </section>
                  <section className="space-y-3 border-t pt-6">
                    <h2 className="font-heading text-lg font-semibold">
                      What the prototype proves
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      FalkorDB resolves approval and replacement relationships,
                      stores assignment-specific progress, and runs a native
                      shortest-path query. The optional OpenAI tool call reads
                      that context and selects an allowlisted A2UI layout. Graph
                      data supplies the facts.
                    </p>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      The data is synthetic. There is no production login, HR
                      integration, calendar booking, or automatic document
                      ingestion. Public hosting and a recorded demo remain
                      release tasks.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("evidence")}
                    >
                      Inspect the actual queries
                    </Button>
                  </section>
                </TabsContent>
              )}
              <TabsContent value="home" className="space-y-6">
                <h1 className="font-heading text-2xl font-semibold">
                  Your tasks
                </h1>
                <div className="divide-y border-y">
                  {context?.assignments.map((r) => (
                    <div key={r[0]} className="flex items-center gap-4 py-5">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium">{r[1]}</p>
                        <p className="text-sm text-muted-foreground">{r[2]}</p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void openAssignment(r[0])}
                      >
                        Open task
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent
                value="assignment"
                className="mx-auto w-full max-w-2xl space-y-7"
              >
                <section className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Maya / Payments
                  </p>
                  <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
                    {context?.task[0]?.[1] || "Loading your task…"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Current task. One step at a time.
                  </p>
                </section>
                {!context ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <>
                    <Card className="shadow-none">
                      <CardHeader>
                        <p className="text-xs font-medium text-primary">
                          {stage === "done"
                            ? "AWAITING REVIEW"
                            : "YOUR NEXT STEP"}
                        </p>
                        <CardTitle className="pt-2 text-xl">
                          {stageTitle}
                        </CardTitle>
                        <CardDescription className="leading-6">
                          {stageDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {stage === "reading" && readingOpen && (
                          <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium">
                              {context.decisions[0]?.[3]}
                            </p>
                            <p className="text-sm leading-6">
                              {context.decisions[0]?.[4]}
                            </p>
                          </section>
                        )}
                        {stage === "training" && (
                          <p className="text-sm font-medium">
                            {context.training.find((r) => !r[2])?.[1]}
                          </p>
                        )}
                        {stage === "notes" && (
                          <>
                            <Label htmlFor="plan-note">
                              What will you check with your reviewer?
                            </Label>
                            <Textarea
                              id="plan-note"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              maxLength={500}
                              placeholder="For example: pending and failed payment states"
                            />
                            <p className="text-xs text-muted-foreground">
                              Save these notes with the current approved
                              guidance.
                            </p>
                          </>
                        )}
                        {stage === "done" && (
                          <p className="text-sm">
                            {context.reviewRequest[0][2]} ·{" "}
                            {context.reviewRequest[0][1]}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button
                          disabled={
                            busy ||
                            stage === "blocked" ||
                            (stage === "notes" && !note.trim())
                          }
                          onClick={() => void primaryAction()}
                        >
                          {busy
                            ? "Saving…"
                            : stage === "reading"
                              ? readingOpen
                                ? "I have read this guidance"
                                : "Read current guidance"
                              : stage === "training"
                                ? "Record training complete"
                                : stage === "notes"
                                  ? "Save review notes"
                                  : stage === "refresh"
                                    ? "Accept updated guidance"
                                    : stage === "review"
                                      ? "Create review request"
                                      : stage === "done"
                                        ? "Edit review notes"
                                        : "Clarification required"}
                        </Button>
                      </CardFooter>
                    </Card>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {reviewer?.[1]
                            .split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Reviewer:{" "}
                        </span>
                        {reviewer?.[1] || "Not assigned"}
                      </p>
                    </div>
                    <Accordion multiple>
                      {decoded!.order
                        .filter((k) =>
                          ["EvidenceComparison", "ProgressCard"].includes(k)
                        )
                        .map((kind) => (
                          <AccordionItem key={kind} value={kind}>
                            <AccordionTrigger>
                              {kind === "EvidenceComparison"
                                ? "Why this step?"
                                : "My saved review notes"}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3">
                              {kind === "EvidenceComparison" ? (
                                <>
                                  <p className="text-sm">
                                    {context.conflicts.length
                                      ? "Your starter guide points to a superseded decision. FirstTask checked the replacement and its original source for this task."
                                      : "This step follows the current guidance and prerequisites recorded for your task."}
                                  </p>
                                  <p className="text-sm font-medium">
                                    {context.current ||
                                      "No single source-backed approved decision is available."}
                                  </p>
                                  {context.decisions[0]?.[2] && (
                                    <Button
                                      variant="link"
                                      className="h-auto p-0"
                                      onClick={() =>
                                        showSource(context.decisions[0][2]!)
                                      }
                                    >
                                      Open source document
                                    </Button>
                                  )}
                                  {context.conflicts.map((r) => (
                                    <p
                                      key={r[0]}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {r[5].join(" → ")}
                                    </p>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <p className="text-sm">
                                    {context.plan[0]?.[2] ||
                                      "No review notes saved yet."}
                                  </p>
                                  {context.needsReview && (
                                    <p className="text-sm text-destructive">
                                      These notes use an older decision. Accept
                                      the current guidance before requesting
                                      review.
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Review requests stay in this sample
                                    workspace. No message is sent.
                                  </p>
                                </>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </>
                )}
              </TabsContent>
              <TabsContent value="sources" className="space-y-6">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Knowledge
                </h1>
                <p className="text-sm text-muted-foreground">
                  Company documents and the decisions behind your work.
                </p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void request("/api/search", { query: searchQuery })
                  }}
                >
                  <Label htmlFor="document-search" className="sr-only">
                    Search company documents
                  </Label>
                  <Input
                    id="document-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company documents…"
                    maxLength={200}
                    required
                  />
                  <Button type="submit" disabled={busy}>
                    Search
                  </Button>
                  {context?.searchResults && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setSearchQuery("")
                        void request("/api/context")
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </form>
                {context?.searchResults && (
                  <p role="status" className="text-xs text-muted-foreground">
                    {context.searchResults.length} matching documents. Search
                    relevance does not establish approval.
                  </p>
                )}
                <Accordion
                  value={openSources}
                  onValueChange={(v) => setOpenSources(v.map(String))}
                  multiple
                >
                  {(context?.searchResults || context?.sources)?.map((r) => (
                    <AccordionItem
                      id={"source-" + r[0]}
                      key={r[0]}
                      value={r[0]}
                    >
                      <AccordionTrigger>{r[1]}</AccordionTrigger>
                      <AccordionContent>
                        <p>{r[2]}</p>
                        {context.decisions.some((d) => d[2] === r[0]) && (
                          <Button
                            variant="outline"
                            disabled={
                              busy || context.ambiguous || context.guidanceRead
                            }
                            onClick={() => void act("review")}
                          >
                            {context.guidanceRead
                              ? "Marked as read"
                              : "Mark current guidance as read"}
                          </Button>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {judgeMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("evidence")}
                  >
                    Technical inspector
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="people" className="space-y-6">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  People
                </h1>
                <p className="text-sm text-muted-foreground">
                  People who can help with your current assignment.
                </p>
                <Card>
                  <CardContent className="space-y-5 pt-6">
                    {context?.people.map((r) => (
                      <div key={r[0]} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {r[1]
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{r[1]}</p>
                          <p className="text-sm text-muted-foreground">
                            {r[3] === "REVIEWER_FOR"
                              ? "Current reviewer"
                              : "Approved alternate"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r[2]}
                          </p>
                        </div>
                      </div>
                    ))}
                    {context && !context.people.length && (
                      <p>Ask Payments to assign a reviewer.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="evidence" className="space-y-5 pt-5">
                <Button variant="ghost" onClick={() => navigate("sources")}>
                  Back to company knowledge
                </Button>
                <p className="text-sm text-muted-foreground">
                  Completed graph operations for the latest successful request.
                  These results are not streamed live.
                </p>
                {busy && (
                  <Trace>
                    <TraceLine status="running">
                      <TraceTitle>Processing request</TraceTitle>
                      <TraceDescription>
                        Waiting for completed results
                      </TraceDescription>
                    </TraceLine>
                  </Trace>
                )}
                {error && (
                  <Trace>
                    <TraceLine status="error">
                      <TraceTitle>Request failed</TraceTitle>
                    </TraceLine>
                  </Trace>
                )}
                <Trace>
                  {result?.trace.map((r, i) => (
                    <TraceCollapsible key={i}>
                      <TraceCollapsibleTrigger>
                        <TraceLine>
                          <TraceTitle>{r.tool}</TraceTitle>
                          <TraceDescription>
                            {r.executionPlan ? "Query plan" : `${r.rows} rows`}{" "}
                            · {r.ms} ms
                          </TraceDescription>
                        </TraceLine>
                      </TraceCollapsibleTrigger>
                      <TraceCollapsibleContent>
                        <pre className="overflow-auto text-xs break-words whitespace-pre-wrap">
                          {r.query +
                            "\n\n" +
                            JSON.stringify(r.arguments, null, 2) +
                            (r.executionPlan
                              ? "\n\nExecution plan (not runtime profiling):\n" +
                                r.executionPlan
                              : "")}
                        </pre>
                      </TraceCollapsibleContent>
                    </TraceCollapsible>
                  ))}
                </Trace>
                <Accordion>
                  <AccordionItem value="json">
                    <AccordionTrigger>A2UI messages</AccordionTrigger>
                    <AccordionContent>
                      <pre className="max-h-96 overflow-auto text-xs break-words whitespace-pre-wrap">
                        {JSON.stringify(result?.messages, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              {judgeMode && (
                <TabsContent value="demo" className="space-y-5 pt-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>See the connected story</CardTitle>
                      <CardDescription>{demoLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={(demoStep / steps.length) * 100}>
                        <ProgressLabel>Guided walkthrough</ProgressLabel>
                        <ProgressValue>
                          {() => `${demoStep} of ${steps.length}`}
                        </ProgressValue>
                      </Progress>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void play()}
                        disabled={busy || playing}
                      >
                        Play walkthrough
                      </Button>
                      {playing && (
                        <Button variant="secondary" onClick={stop}>
                          Pause
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          stop()
                          void next()
                        }}
                        disabled={busy}
                      >
                        Next step
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => void reset()}
                        disabled={busy}
                      >
                        Reset sample
                      </Button>
                    </CardFooter>
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    The walkthrough runs real graph actions without AI calls.
                  </p>
                  <Card>
                    <CardHeader>
                      <CardTitle>Change the sample</CardTitle>
                      <CardDescription>
                        Changes affect only your workspace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={busy || assignment !== "checkout"}
                        onClick={() => void act("replace")}
                      >
                        Replace decision
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || assignment !== "checkout"}
                        onClick={() => void act("remove-owner")}
                      >
                        Remove owner
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void act("complete")}
                      >
                        Complete training
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
            {tab === "assignment" && (
              <Accordion className="mx-auto w-full max-w-2xl">
                <AccordionItem value="help">
                  <AccordionTrigger>
                    Need help with this assignment?
                  </AccordionTrigger>
                  <AccordionContent>
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        stop()
                        void request("/api/agent", { prompt })
                      }}
                    >
                      <Label htmlFor="ai-invite">AI invite code</Label>
                      <Input
                        id="ai-invite"
                        type="password"
                        autoComplete="off"
                        value={aiCode}
                        onChange={(e) => setAiCode(e.target.value)}
                        placeholder="Required for live AI access"
                        minLength={16}
                        maxLength={256}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        The code stays in this tab only. Public graph
                        exploration does not need a code.
                      </p>
                      {aiCode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAiCode("")}
                        >
                          Clear invite code
                        </Button>
                      )}
                      <Label htmlFor="prompt">
                        What would you like to know?
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          maxLength={1000}
                          placeholder="Ask about this assignment…"
                          required
                        />
                        <Button type="submit" disabled={busy}>
                          {busy ? "Working…" : "Ask FirstTask"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        FirstTask uses your assignment and company sources to
                        organize the guidance above.
                      </p>
                    </form>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            <Separator />
            <footer className="text-xs text-muted-foreground">
              Northstar Labs · Synthetic company records · No calendar
              invitations are sent
            </footer>
          </main>
          <Sheet
            open={!!meeting}
            onOpenChange={(open) => {
              if (!open) setMeeting(null)
            }}
          >
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader className="pr-12">
                <SheetTitle>{meeting?.[1]}</SheetTitle>
                <SheetDescription>
                  {meeting
                    ? meetingDate(meeting[3]) +
                      " · " +
                      meetingTime(meeting[3]) +
                      " IST"
                    : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-6 pb-6">
                <p className="text-sm leading-7 text-muted-foreground">
                  {meeting?.[2]}
                </p>
                <Separator />
                <h3 className="text-sm font-medium">Connected context</h3>
                {meeting?.[5] && (
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => {
                      showSource(meeting[5])
                      setMeeting(null)
                    }}
                  >
                    Open meeting notes
                    <RiFileTextLine />
                  </Button>
                )}
                {meeting?.[4] && (
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={busy}
                    onClick={() => {
                      void openAssignment(meeting[4])
                      setMeeting(null)
                    }}
                  >
                    Open related task
                    <RiCheckboxCircleLine />
                  </Button>
                )}
                <p className="text-xs leading-5 text-muted-foreground">
                  These links follow the meeting’s stored relationships. The
                  related task checks its current approved decision, source, and
                  reviewer.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
