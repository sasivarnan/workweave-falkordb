import { useEffect, useLayoutEffect, useRef } from "react"
import { useSelector } from "@xstate/store-react"
import { appStore, updateField } from "@/lib/app-store"
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
  RiSideBarLine,
  RiMenuLine,
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
import {
  Trace,
  TraceLine,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace"

import { decode } from "@/lib/workspace"

export default function App() {
  const judgeMode = window.location.pathname === "/judge"
  const state = useSelector(appStore, (snapshot) => snapshot.context)
  const {
    impact,
    theme,
    meeting,
    workspaceNote,
    assignment,
    sidebarOpen,
    mobileSidebarOpen,
    result,
    error,
    busy,
    readingOpen,
    editingNotes,
    aiCode,
    searchQuery,
    evaluation,
    evaluationError,
    tab,
    prompt,
    note,
    demoStep,
    demoLabel,
    playing,
    openSources,
  } = state
  const setTheme = (value: Parameters<typeof updateField<"theme">>[1]) =>
    updateField("theme", value)
  const setMeeting = (value: Parameters<typeof updateField<"meeting">>[1]) =>
    updateField("meeting", value)
  const setWorkspaceNote = (
    value: Parameters<typeof updateField<"workspaceNote">>[1]
  ) => updateField("workspaceNote", value)
  const setAssignment = (
    value: Parameters<typeof updateField<"assignment">>[1]
  ) => updateField("assignment", value)
  const setSidebarOpen = (
    value: Parameters<typeof updateField<"sidebarOpen">>[1]
  ) => updateField("sidebarOpen", value)
  const setMobileSidebarOpen = (
    value: Parameters<typeof updateField<"mobileSidebarOpen">>[1]
  ) => updateField("mobileSidebarOpen", value)
  const setResult = (value: Parameters<typeof updateField<"result">>[1]) =>
    updateField("result", value)
  const setError = (value: Parameters<typeof updateField<"error">>[1]) =>
    updateField("error", value)
  const setReadingOpen = (
    value: Parameters<typeof updateField<"readingOpen">>[1]
  ) => updateField("readingOpen", value)
  const setEditingNotes = (
    value: Parameters<typeof updateField<"editingNotes">>[1]
  ) => updateField("editingNotes", value)
  const setAiCode = (value: Parameters<typeof updateField<"aiCode">>[1]) =>
    updateField("aiCode", value)
  const setSearchQuery = (
    value: Parameters<typeof updateField<"searchQuery">>[1]
  ) => updateField("searchQuery", value)
  const setEvaluation = (
    value: Parameters<typeof updateField<"evaluation">>[1]
  ) => updateField("evaluation", value)
  const setEvaluationError = (
    value: Parameters<typeof updateField<"evaluationError">>[1]
  ) => updateField("evaluationError", value)
  const setTab = (value: Parameters<typeof updateField<"tab">>[1]) =>
    updateField("tab", value)
  const setPrompt = (value: Parameters<typeof updateField<"prompt">>[1]) =>
    updateField("prompt", value)
  const setNote = (value: Parameters<typeof updateField<"note">>[1]) =>
    updateField("note", value)
  const setDemoStep = (value: Parameters<typeof updateField<"demoStep">>[1]) =>
    updateField("demoStep", value)
  const setDemoLabel = (
    value: Parameters<typeof updateField<"demoLabel">>[1]
  ) => updateField("demoLabel", value)
  const setPlaying = (value: Parameters<typeof updateField<"playing">>[1]) =>
    updateField("playing", value)
  const setOpenSources = (
    value: Parameters<typeof updateField<"openSources">>[1]
  ) => updateField("openSources", value)
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("scheme-dark", theme === "dark")
    document.documentElement.classList.toggle("scheme-light", theme !== "dark")
    localStorage.setItem("workweave-theme", theme)
  }, [theme])
  useEffect(() => {
    localStorage.setItem(
      "workweave-sidebar",
      sidebarOpen ? "expanded" : "collapsed"
    )
  }, [sidebarOpen])
  const playRef = useRef(0),
    stepRef = useRef(0)
  const decoded = result ? decode(result) : null,
    context = decoded?.context
  const workspace = context?.workspace
  const initials = (name?: string) =>
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || ""
  const timezone =
    workspace?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneLabel =
    new Intl.DateTimeFormat("en", { timeZone: timezone, timeZoneName: "short" })
      .formatToParts()
      .find((part) => part.type === "timeZoneName")?.value || timezone
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
    if (appStore.getSnapshot().context.busy) return false
    const navigationVersion = navigationRef.current
    appStore.trigger.requestStarted()
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workweave": "portal",
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
        if (path === "/api/action" || path === "/api/reset")
          updateField("impact", null)
        document.title =
          decoded.context.workspace.appName + " · Company workspace"
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
        localStorage.setItem("workweave-assignment", decoded.context.assignment)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
      return false
    } finally {
      appStore.trigger.requestFinished()
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
    void fetch("/api/workspace")
      .then(async (response) => {
        if (!response.ok) throw Error("Workspace settings are unavailable")
        const settings = await response.json()
        if (typeof settings.defaultAssignment !== "string")
          throw Error("Invalid workspace settings")
        await request("/api/context", {
          assignment: assignment || settings.defaultAssignment,
        })
      })
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Workspace could not load"
        )
      )
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
  async function analyzeImpact(operation = "analyze") {
    if (appStore.getSnapshot().context.busy) return
    stop()
    appStore.trigger.requestStarted()
    try {
      const response = await fetch("/api/impact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workweave": "portal",
        },
        body: JSON.stringify({ operation }),
      })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || "Impact analysis failed")
      if (
        !data.analysis ||
        typeof data.analysis.ready !== "boolean" ||
        !Array.isArray(data.trace)
      )
        throw Error("Invalid impact response")
      updateField("impact", data)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Impact analysis failed"
      )
    } finally {
      appStore.trigger.requestFinished()
    }
  }
  async function act(name: string) {
    stop()
    return await request("/api/action", { name, note })
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setSidebarOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const steps = workspace?.demo.steps || []
  async function next() {
    if (!workspace || !steps.length) return false
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
        { ...s.body, assignment: workspace?.demo.assignment },
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
    if (!workspace) return
    setAssignment(workspace.demo.assignment)
    stop()
    if (
      !(await request("/api/reset", { assignment: workspace?.demo.assignment }))
    )
      return
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
      ? `Ask ${workspace?.team.name || "your team"} for clarification`
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
                : "The workspace has checked your reading, training, notes, and recorded reviewer."
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
      timeZone: timezone,
    })
  const meetingTime = (value: string) =>
    new Date(value).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    })
  const firstMeeting = context?.meetings[0]
  const navItems = [
    ["workspace", "Today", RiHome5Line],
    ["home", "Tasks", RiCheckboxCircleLine],
    ["changes", "Decision review", RiInformationLine],
    ["impact", "Cross-team impact", RiTeamLine],
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
    <div className="flex min-h-svh w-full">
      <aside
        aria-label="Workspace navigation"
        className={
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 motion-reduce:transition-none md:flex " +
          (sidebarOpen ? "w-60" : "w-16")
        }
      >
        <div
          className={
            sidebarOpen ? "space-y-6 px-5 py-7" : "space-y-6 px-3 py-7"
          }
        >
          <div className="flex items-center gap-2.5">
            <RiBuildingLine className="size-6 shrink-0 text-primary" />
            {sidebarOpen && (
              <span className="font-heading text-xl font-semibold tracking-tight">
                {workspace?.appName}
              </span>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm">
              <Avatar className="size-6 rounded-md">
                <AvatarFallback className="rounded-md text-xs">
                  {initials(workspace?.company.name)}
                </AvatarFallback>
              </Avatar>
              {workspace?.company.name}
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {navItems.map(([id, label, Icon]) => (
            <Button
              key={id}
              variant="ghost"
              aria-label={label}
              title={sidebarOpen ? undefined : label}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
              className={
                "h-11 w-full justify-start gap-3 rounded-lg px-3 " +
                (tab === id ? "bg-primary/10 text-primary" : "")
              }
            >
              <Icon className="size-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Button>
          ))}
          {judgeMode && (
            <>
              <Separator className="my-5" />
              {[
                ["proof", "Proof & evaluation"],
                ["evidence", "Evidence & tools"],
                ["demo", "Walkthrough"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant="ghost"
                  aria-label={label}
                  title={label}
                  onClick={() => navigate(id)}
                  className="w-full justify-start overflow-hidden"
                >
                  {sidebarOpen ? label : label[0]}
                </Button>
              ))}
            </>
          )}
        </nav>
        <div className={"space-y-4 " + (sidebarOpen ? "p-5" : "p-3")}>
          <Separator />
          <div
            className={
              "flex items-center gap-3 " + (!sidebarOpen ? "flex-col" : "")
            }
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {initials(workspace?.employee.name)}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {workspace?.employee.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workspace?.team.name}
                </p>
              </div>
            )}
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
        </div>
      </aside>
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>{workspace?.appName || "Workspace"}</SheetTitle>
            <SheetDescription>{workspace?.company.name}</SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile workspace navigation"
            className="space-y-1 px-4"
          >
            {navItems.map(([id, label, Icon]) => (
              <Button
                key={id}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  navigate(id)
                  setMobileSidebarOpen(false)
                }}
              >
                <Icon />
                {label}
              </Button>
            ))}
            {judgeMode &&
              [
                ["proof", "Proof & evaluation"],
                ["evidence", "Evidence & tools"],
                ["demo", "Walkthrough"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(id)
                    setMobileSidebarOpen(false)
                  }}
                >
                  {label}
                </Button>
              ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-5 py-3 lg:px-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden md:inline-flex"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <RiSideBarLine />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <RiMenuLine />
            </Button>
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
              <TabsTrigger value="impact">Cross-team impact</TabsTrigger>
              <TabsTrigger value="changes">Decision review</TabsTrigger>
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
                  {workspace?.company.name}
                  {workspace?.synthetic && " · Sample workspace"}
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {workspace
                    ? `Hello, ${workspace.employee.name.split(" ")[0]}`
                    : "Loading workspace…"}
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
                  {workspace?.team.name} · {workspace?.team.department}
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
                                  {workspace?.team.name}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {meetingDate(firstMeeting[3])} ·{" "}
                                  {meetingTime(firstMeeting[3])} {timezoneLabel}
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
                                  Company guidance changed
                                </p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto px-0 text-xs"
                                  disabled={busy}
                                  onClick={() => navigate("changes")}
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
                                    onClick={() => showSource(firstMeeting[5])}
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
                                {meetingDate(r[3])} · {timezoneLabel}
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
                          .filter((r) =>
                            context.meetings.some(
                              (meeting) => meeting[5] === r[0]
                            )
                          )
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
            <TabsContent value="changes" className="space-y-8">
              <section className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Current assignment · {context?.task[0]?.[0]}
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Decision review
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  See what changed, which work it affects, and what needs your
                  review.
                </p>
              </section>
              {!context ? (
                <Skeleton className="h-64" />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {context.assignments.map((row) => (
                      <Button
                        key={row[0]}
                        variant={assignment === row[0] ? "secondary" : "ghost"}
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void request("/api/context", { assignment: row[0] })
                        }
                      >
                        {row[1]}
                      </Button>
                    ))}
                  </div>
                  <Card className="shadow-none">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle>
                          {context.current || "Guidance needs clarification"}
                        </CardTitle>
                        <Badge
                          variant={
                            context.changeReview.canAcknowledge
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {context.changeReview.canAcknowledge
                            ? "Approved guidance"
                            : "Needs clarification"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Scope: {context.task[0]?.[2]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {context.changeReview.history
                        .filter(
                          (row) => row[0] === context.changeReview.currentId
                        )
                        .slice(0, 1)
                        .map((row) => (
                          <div
                            key={String(row[0])}
                            className="space-y-2 text-sm"
                          >
                            <p>
                              {row[3] ? (
                                <>
                                  Replaces{" "}
                                  <span className="font-medium">
                                    {String(row[3])}
                                  </span>
                                </>
                              ) : (
                                "No earlier decision recorded."
                              )}
                            </p>
                            <p className="text-muted-foreground">
                              Recorded approver:{" "}
                              {row[4] ? String(row[4]) : "Missing"} · Effective:{" "}
                              {row[6]
                                ? new Date(Number(row[6])).toLocaleString([], {
                                    timeZone: timezone,
                                  })
                                : "Missing"}
                            </p>
                            {row[8] && (
                              <p className="text-muted-foreground">
                                Approval meeting: {String(row[8])}
                              </p>
                            )}
                            {row[9] && (
                              <Button
                                variant="link"
                                className="h-auto px-0"
                                onClick={() => showSource(String(row[9]))}
                              >
                                Read original source · {String(row[10])}
                                <RiArrowRightLine />
                              </Button>
                            )}
                          </div>
                        ))}
                      {context.changeReview.issues.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTitle>Clarification required</AlertTitle>
                          <AlertDescription>
                            {context.changeReview.issues.map((issue) => (
                              <p key={issue}>{issue}</p>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Affected work</h2>
                      <Badge variant="outline">
                        {context.changeReview.affected.length} task
                        {context.changeReview.affected.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {context.changeReview.affected.map((record) => (
                      <Card key={record.id} className="gap-3 shadow-none">
                        <CardHeader>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base">
                              {record.title}
                            </CardTitle>
                            <Badge
                              variant={
                                record.stale ? "destructive" : "secondary"
                              }
                            >
                              {record.stale
                                ? "Saved plan needs review"
                                : record.acknowledged
                                  ? "Acknowledged"
                                  : "Review guidance"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Assigned owner: {record.owner}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-xs leading-6 text-muted-foreground">
                            {record.path.join(" → ")}
                          </p>
                          {record.savedNote && (
                            <div className="space-y-1 border-l-2 pl-4">
                              <p className="text-xs text-muted-foreground">
                                Saved using{" "}
                                {record.savedDecision ||
                                  "Missing decision evidence"}
                              </p>
                              <p className="text-sm leading-6 whitespace-pre-wrap">
                                {record.savedNote}
                              </p>
                            </div>
                          )}
                          {record.acknowledged && (
                            <p
                              role="status"
                              className="text-xs text-muted-foreground"
                            >
                              Acknowledged{" "}
                              {record.acknowledgedAt
                                ? new Date(
                                    record.acknowledgedAt
                                  ).toLocaleString([], { timeZone: timezone })
                                : ""}
                              .{" "}
                              {record.stale
                                ? "Your saved plan still needs an update."
                                : "This acknowledgement applies to the current decision version."}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button
                            disabled={
                              busy ||
                              !context.changeReview.canAcknowledge ||
                              record.acknowledged
                            }
                            onClick={() =>
                              void request("/api/action", {
                                name: "acknowledge-change",
                                assignment: record.id,
                              })
                            }
                          >
                            {record.acknowledged
                              ? "Acknowledged"
                              : "Acknowledge current guidance"}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void openAssignment(record.id)}
                          >
                            {record.stale ? "Update saved plan" : "Open task"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </section>
                  {context.changeReview.meetings.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-lg font-semibold">
                        Meetings and notes to review
                      </h2>
                      <div className="divide-y border-y">
                        {context.changeReview.meetings.map((row) => (
                          <div key={row[0]} className="space-y-2 py-4">
                            <p className="text-sm font-medium">{row[1]}</p>
                            <p className="text-xs leading-6 text-muted-foreground">
                              {row[4].join(" → ")}
                            </p>
                            {row[2] ? (
                              <Button
                                variant="link"
                                className="h-auto px-0 text-xs"
                                onClick={() => showSource(row[2]!)}
                              >
                                Review notes · {row[3]}
                                <RiArrowRightLine />
                              </Button>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Meeting notes are missing.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {context.changeReview.unaffected.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-lg font-semibold">
                        Outside this decision’s scope
                      </h2>
                      <div className="divide-y border-y">
                        {context.changeReview.unaffected.map((row) => (
                          <div
                            key={row[0]}
                            className="flex items-center justify-between gap-4 py-4"
                          >
                            <div>
                              <p className="text-sm">{row[1]}</p>
                              <p className="text-xs text-muted-foreground">
                                Uses {row[2]}; no link to this decision’s
                                service.
                              </p>
                            </div>
                            <Badge variant="outline">Unchanged</Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Based on recorded relationships. Missing links can hide
                        impact.
                      </p>
                    </section>
                  )}
                  <Accordion>
                    <AccordionItem value="history">
                      <AccordionTrigger>
                        Decision history and proposals
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {context.changeReview.history.map((row, index) => (
                          <div
                            key={String(row[0]) + index}
                            className="space-y-2 border-l pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {String(row[1])}
                              </p>
                              <Badge variant="outline">
                                {row[0] === context.changeReview.currentId
                                  ? "Current"
                                  : row[2]
                                    ? "Earlier record"
                                    : "Proposal only"}
                              </Badge>
                            </div>
                            {(row[11] || row[5]) && (
                              <p className="text-xs text-muted-foreground">
                                {row[2] ? "Approved" : "Proposed"}{" "}
                                {new Date(
                                  Number(row[11] || row[5])
                                ).toLocaleString([], { timeZone: timezone })}
                              </p>
                            )}
                            {!row[2] && (
                              <p className="text-xs text-muted-foreground">
                                A newer discussion does not replace approved
                                guidance.
                              </p>
                            )}
                            {row[8] && (
                              <p className="text-xs text-muted-foreground">
                                {String(row[8])}
                              </p>
                            )}
                            {row[9] && (
                              <Button
                                variant="link"
                                className="h-auto px-0 text-xs"
                                onClick={() => showSource(String(row[9]))}
                              >
                                Open source
                              </Button>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  {workspace?.synthetic && (
                    <Accordion>
                      <AccordionItem value="scenario">
                        <AccordionTrigger>
                          Try a change in this sample workspace
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          <p className="text-xs leading-6 text-muted-foreground">
                            Save review notes in the task first. Approve a
                            replacement to see the saved plan become stale. Then
                            add a newer proposal: approved guidance should stay
                            the same. These controls do not approve decisions in
                            a real company.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              disabled={
                                busy || assignment !== workspace.demo.assignment
                              }
                              onClick={() => void act("replace")}
                            >
                              Approve sample replacement
                            </Button>
                            <Button
                              variant="outline"
                              disabled={
                                busy || assignment !== workspace.demo.assignment
                              }
                              onClick={() => void act("propose")}
                            >
                              Add newer proposal
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </>
              )}
            </TabsContent>
            <TabsContent value="impact" className="space-y-8">
              <section className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Company work · Connected across tools
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  What needs review?
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Follow a shared service decision through team dependencies to
                  the tasks, meetings, and notes that rely on it.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void analyzeImpact(
                        impact?.analysis.ready ? "analyze" : "import"
                      )
                    }
                  >
                    {busy
                      ? "Analyzing…"
                      : impact?.analysis.ready
                        ? "Find affected work"
                        : "Load synthetic source exports"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Normalized synthetic Jira, Google Calendar, and Zoom exports.
                  No live accounts are connected.
                </p>
              </section>
              {impact?.analysis.blocked && (
                <Alert variant="destructive">
                  <AlertTitle>
                    Decision authority needs clarification
                  </AlertTitle>
                  <AlertDescription>
                    {impact.analysis.issues?.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              {impact?.analysis.ready && !impact.analysis.blocked && (
                <>
                  <Card className="shadow-none">
                    <CardHeader>
                      <CardTitle>{impact.analysis.decision?.title}</CardTitle>
                      <CardDescription>
                        Applies to {impact.analysis.root}. Analysis follows up
                        to {impact.analysis.depthLimit} service dependency
                        links.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                      <p>
                        <span className="font-semibold">
                          {impact.analysis.items?.length}
                        </span>{" "}
                        affected tasks
                      </p>
                      <p>
                        <span className="font-semibold">
                          {
                            new Set(
                              impact.analysis.items?.map((item) => item.team)
                            ).size
                          }
                        </span>{" "}
                        teams
                      </p>
                      <p>
                        <span className="font-semibold">
                          {
                            impact.analysis.items?.filter(
                              (item) => item.owners.length !== 1
                            ).length
                          }
                        </span>{" "}
                        {impact.analysis.items?.filter(
                          (item) => item.owners.length !== 1
                        ).length === 1
                          ? "owner to clarify"
                          : "owners to clarify"}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="link"
                        className="h-auto px-0"
                        onClick={() =>
                          void request("/api/context").then((ok) => {
                            if (ok)
                              showSource(impact.analysis.decision!.sourceId)
                          })
                        }
                      >
                        Read approved source
                        <RiArrowRightLine />
                      </Button>
                    </CardFooter>
                  </Card>
                  {impact.analysis.experiment && (
                    <Alert>
                      <AlertTitle>
                        {impact.analysis.experiment.documentsUnchanged
                          ? "Source text unchanged. Dependency results changed."
                          : "Source content changed during this experiment."}
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>
                          {impact.analysis.experiment.removed.length
                            ? `No longer reached: ${impact.analysis.experiment.removed.join(", ")}.`
                            : impact.analysis.experiment.added.length
                              ? `Reached again: ${impact.analysis.experiment.added.join(", ")}.`
                              : "The affected set stayed the same."}
                        </p>
                        <p>
                          Still reached:{" "}
                          {impact.analysis.experiment.retained.join(", ") ||
                            "None"}
                          .
                        </p>
                        <p>
                          Alternate routes are checked before a task leaves the
                          affected set.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  {[
                    ...new Set(impact.analysis.items?.map((item) => item.team)),
                  ].map((team) => (
                    <section key={team} className="space-y-3">
                      <h2 className="text-lg font-semibold">{team}</h2>
                      <div className="divide-y border-y">
                        {impact.analysis.items
                          ?.filter((item) => item.team === team)
                          .map((item) => (
                            <div key={item.id} className="space-y-3 py-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.source} · {item.id} · {item.service}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {item.routeCount} route
                                  {item.routeCount === 1 ? "" : "s"}
                                </Badge>
                              </div>
                              <p
                                className={
                                  item.owners.length !== 1
                                    ? "text-xs text-destructive"
                                    : "text-xs text-muted-foreground"
                                }
                              >
                                {item.owners.length === 1
                                  ? `Assigned owner: ${item.owners[0]}`
                                  : item.owners.length
                                    ? "Multiple owners recorded. Clarification required."
                                    : "Owner missing. Assign an owner before acting."}
                              </p>
                              <Accordion>
                                <AccordionItem value="why">
                                  <AccordionTrigger className="py-2 text-xs">
                                    Why affected?
                                  </AccordionTrigger>
                                  <AccordionContent className="space-y-4">
                                    <p className="text-sm leading-7">
                                      {item.explanation.join(" → ")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.algorithm === "Direct service link"
                                        ? "The task directly touches the decision’s service."
                                        : "Shortest verified dependency path. Other recorded routes are listed below."}
                                    </p>
                                    <div className="space-y-2">
                                      {item.paths.map((path, index) => (
                                        <p
                                          key={index}
                                          className="text-xs leading-6 text-muted-foreground"
                                        >
                                          {path.join(" → ")}
                                        </p>
                                      ))}
                                    </div>
                                    {item.links.length > 0 && (
                                      <div className="space-y-4 border-t pt-4">
                                        {item.links.map((link, index) => (
                                          <div
                                            key={index}
                                            className="space-y-2"
                                          >
                                            <p className="text-sm font-medium">
                                              {link[1]}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {link[2]} · {link[3]}: {link[4]}
                                            </p>
                                            {link[5] ? (
                                              <>
                                                <p className="text-sm">
                                                  {link[6]}
                                                </p>
                                                <p className="text-xs leading-6 text-muted-foreground">
                                                  {link[7]}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {link[10]} · {link[8]}:{" "}
                                                  {link[9]}
                                                </p>
                                              </>
                                            ) : (
                                              <p className="text-xs text-muted-foreground">
                                                No notes linked to this meeting.
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          ))}
                      </div>
                    </section>
                  ))}
                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                      Not reached within scope
                    </h2>
                    <div className="divide-y border-y">
                      {impact.analysis.excluded?.map((item) => (
                        <div key={item.id} className="space-y-1 py-4">
                          <p className="text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.id} · {item.service}. No dependency path found
                            within the analysis limit.
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Missing or unimported relationships can hide impact. This
                      is not a guarantee that other work is safe.
                    </p>
                  </section>
                  <Accordion>
                    <AccordionItem value="link-quality">
                      <AccordionTrigger>
                        Source links that need review
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {impact.analysis.unresolved?.map((row) => (
                          <p key={row[0]} className="text-sm">
                            {row[1]} — no unique calendar meeting match for{" "}
                            {row[2]}.
                          </p>
                        ))}
                        {impact.analysis.unresolvedEvents?.map((row) => (
                          <p key={row[0]} className="text-sm">
                            {row[1]} — no explicit task reference. No link was
                            inferred from the title.
                          </p>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="experiment">
                      <AccordionTrigger>
                        Test one dependency link
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-xs leading-6 text-muted-foreground">
                          Remove the sample dependency below. Tasks with another
                          route should stay affected. Source documents stay
                          intact. Restore the link to recover the original
                          result.
                        </p>
                        <p className="text-sm font-medium">
                          Test link: {impact.analysis.experimentLink?.from} →{" "}
                          {impact.analysis.experimentLink?.to}
                        </p>
                        {impact.analysis.dependencies?.map((row) => (
                          <p
                            key={row[0] + row[2]}
                            className="text-xs text-muted-foreground"
                          >
                            {row[1]} → {row[3]}
                          </p>
                        ))}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            disabled={
                              busy || !impact.analysis.experimentLink?.connected
                            }
                            onClick={() => void analyzeImpact("remove")}
                          >
                            Remove sample dependency
                          </Button>
                          <Button
                            variant="outline"
                            disabled={
                              busy || impact.analysis.experimentLink?.connected
                            }
                            onClick={() => void analyzeImpact("restore")}
                          >
                            Restore dependency
                          </Button>
                        </div>
                        {impact.analysis.experiment && (
                          <div className="space-y-2">
                            <p className="text-xs break-all text-muted-foreground">
                              Before: {impact.analysis.experiment.beforeHash}
                            </p>
                            <p className="text-xs break-all text-muted-foreground">
                              After: {impact.analysis.experiment.afterHash}
                            </p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="queries">
                      <AccordionTrigger>
                        How the analysis was computed
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-xs leading-6 text-muted-foreground">
                          Bounded Cypher finds the affected set and alternative
                          simple paths. FalkorDB’s native shortest-path
                          procedure explains indirect dependencies. Direct links
                          need no pathfinding. This analysis uses no model
                          calls.
                        </p>
                        <Trace>
                          {impact.trace
                            .filter((row) =>
                              [
                                "bounded_dependency_impact",
                                "native_dependency_explanation",
                                "affected_source_links",
                              ].includes(row.tool)
                            )
                            .map((row, index) => (
                              <TraceCollapsible key={index}>
                                <TraceCollapsibleTrigger>
                                  <TraceLine>
                                    <TraceTitle>{row.tool}</TraceTitle>
                                    <TraceDescription>
                                      {row.rows} rows · {row.ms} ms
                                    </TraceDescription>
                                  </TraceLine>
                                </TraceCollapsibleTrigger>
                                <TraceCollapsibleContent>
                                  <pre className="overflow-auto text-xs break-words whitespace-pre-wrap">
                                    {row.query +
                                      "\n" +
                                      JSON.stringify(row.arguments, null, 2)}
                                  </pre>
                                </TraceCollapsibleContent>
                              </TraceCollapsible>
                            ))}
                        </Trace>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </TabsContent>
            <TabsContent value="calendar" className="space-y-8">
              <section className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Calendar
                </h1>
                <p className="text-sm text-muted-foreground">
                  Meetings, with the work and notes you need. All times are
                  {timezoneLabel}.
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
                        {meetingDate(r[3])} · {meetingTime(r[3])}{" "}
                        {timezoneLabel}
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
                    Saved in your sample workspace. Do not enter private company
                    information.
                  </p>
                </section>
              </div>
            </TabsContent>
            {judgeMode && (
              <TabsContent value="proof" className="space-y-8">
                <section className="max-w-3xl space-y-4">
                  <Badge>{workspace?.appName} / Review in two minutes</Badge>
                  <h1 className="font-heading text-3xl font-semibold tracking-tight lg:text-4xl">
                    Keep company work connected to current decisions.
                  </h1>
                  <p className="text-base leading-7 text-muted-foreground">
                    An approved decision can replace advice in an older guide.
                    This workspace connects the assignment to both sources,
                    explains the conflict, and flags the saved plan when the
                    decision changes again.
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
                    Real FalkorDB operations in your isolated sample workspace.
                    No model credits required for this walkthrough.
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
                      We changed only graph relationships. Every source document
                      kept the same ID, title, and body. The correct guidance or
                      reviewer still changed.
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
                        {evaluation.relationshipDiagnostic.results.map((r) => (
                          <TableRow key={r.case}>
                            <TableCell>{r.case}</TableCell>
                            <TableCell>{r.before}</TableCell>
                            <TableCell>{r.after}</TableCell>
                            <TableCell>
                              {r.documentsUnchanged ? "Identical" : "Changed"}
                            </TableCell>
                          </TableRow>
                        ))}
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
                              conflicting approval and missing source evidence.
                              Some correct answers also used invalid citation
                              IDs.
                            </p>
                            <p>
                              The workspace does not let generated factual
                              answers control review requests. The tested graph
                              gates decide whether an action is allowed.
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
                            <TableHead>{workspace?.appName}</TableHead>
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
                              scripts/evaluate.py. Each case uses a fresh graph
                              that is deleted after the run.
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
                    ingestion. Public hosting and a recorded demo remain release
                    tasks.
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
                  {workspace?.employee.name} / {workspace?.team.name}
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
                            Save these notes with the current approved guidance.
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
                      <span className="text-muted-foreground">Reviewer: </span>
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
                                    ? "Your starter guide points to a superseded decision. The workspace checked the replacement and its original source for this task."
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
                                  Review requests stay in this sample workspace.
                                  No message is sent.
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
                  <AccordionItem id={"source-" + r[0]} key={r[0]} value={r[0]}>
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
                        <p className="text-xs text-muted-foreground">{r[2]}</p>
                      </div>
                    </div>
                  ))}
                  {context && !context.people.length && (
                    <p>
                      Ask {workspace?.team.name || "your team"} to assign a
                      reviewer.
                    </p>
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
                          {r.executionPlan ? "Query plan" : `${r.rows} rows`} ·{" "}
                          {r.ms} ms
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
                      disabled={
                        busy || assignment !== workspace?.demo.assignment
                      }
                      onClick={() => void act("replace")}
                    >
                      Replace decision
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        busy || assignment !== workspace?.demo.assignment
                      }
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
                      The code stays in this tab only. Public graph exploration
                      does not need a code.
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
                    <Label htmlFor="prompt">What would you like to know?</Label>
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
                        {busy ? "Working…" : "Ask about this task"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The workspace uses your assignment and company sources to
                      organize the guidance above.
                    </p>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          <Separator />
          <footer className="text-xs text-muted-foreground">
            {workspace?.company.name} ·{" "}
            {workspace?.synthetic
              ? "Synthetic company records"
              : "Company records"}{" "}
            · No calendar invitations are sent
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
                    " " +
                    timezoneLabel
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
      </div>
    </div>
  )
}
