import { decodePerson } from "@/lib/people"
import { Spinner } from "@/components/ui/spinner"
import { useOnboardingTour } from "@/hooks/use-onboarding-tour"
import { useEffect, useLayoutEffect, useRef, type MouseEvent } from "react"
import { useSelector } from "@xstate/store-react"
import { appStore, updateField } from "@/lib/app-store"
import { flushSync } from "react-dom"
import {
  RiChat3Line,
  RiCloseLine,
  RiHome5Line,
  RiCheckboxCircleLine,
  RiCalendarLine,
  RiFileTextLine,
  RiBookOpenLine,
  RiTeamLine,
  RiSearchLine,
  RiCompass3Line,
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

import { removalEvidence, restorationVerified } from "@/lib/proof"
import type { ImpactResult } from "@/lib/impact"
import { readRoute, viewPaths } from "@/lib/routes"
import { decode } from "@/lib/workspace"

export default function App() {
  const searchRevision = useRef(0)
  const judgeMode = window.location.pathname.startsWith("/demo-controls")
  const state = useSelector(appStore, (snapshot) => snapshot.context)
  const {
    impact,
    proofStage,
    storyPrepared,
    proofBaseline,
    impactExpanded,
    theme,
    meeting,
    peopleTask,
    personProfile,
    workspaceNote,
    assignment,
    sidebarOpen,
    mobileSidebarOpen,
    result,
    error,
    busy,
    readingOpen,
    editingNotes,
    aiEnabled,
    assistantWorking,
    assistantOpen,
    assistantAnswer,
    assistantOutdated,
    assistantError,
    searchQuery,
    searchNavigation,
    evaluation,
    evaluationError,
    tab,
    prompt,
    note,
    openSources,
  } = state
  const setTheme = (value: Parameters<typeof updateField<"theme">>[1]) =>
    updateField("theme", value)
  const setMeeting = (value: string[] | null) => {
    if (value) goToURL("/calendar/" + encodeURIComponent(value[0]), true)
    else if (window.history.state?.recordPanel) window.history.back()
    else navigate("calendar")
  }
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
  const decoded = result ? decode(result) : null,
    context = decoded?.context
  const assistantAvailable =
    !judgeMode &&
    aiEnabled &&
    !!context &&
    ["assignment", "changes", "impact"].includes(tab)
  const assistantVisible = assistantAvailable && assistantOpen
  function closeAssistant() {
    updateField("assistantOpen", false)
    requestAnimationFrame(() =>
      document.getElementById("work-assistant-trigger")?.focus()
    )
  }
  useEffect(() => {
    if (assistantVisible) document.getElementById("prompt")?.focus()
  }, [assistantVisible])
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
  function goToURL(path: string, recordPanel = false) {
    if (path !== window.location.pathname + window.location.search)
      window.history.pushState(
        {
          recordPanel,
          from: window.location.pathname + window.location.search,
        },
        "",
        path
      )
    restoreRoute()
  }
  function restoreRoute() {
    stop()
    const route = readRoute(window.location.pathname, window.location.search)
    const revision = ++searchRevision.current
    appStore.trigger.updated({
      patch: {
        assistantOpen: false,
        searchQuery: route.query,
        searchNavigation: { ...route, revision },
        meeting: null,
        personProfile: null,
        peopleTask: route.peopleTask || null,
        openSources: [],
        readingOpen: false,
        editingNotes: false,
      },
    })
    transition(() => {
      setTab(route.view)
      window.scrollTo({ top: 0, behavior: "instant" })
    })
  }
  function navigate(destination: string) {
    goToURL(viewPaths[destination] || "/")
  }
  function navigateMobile(event: MouseEvent<HTMLButtonElement>) {
    navigate(event.currentTarget.dataset.destination || "workspace")
    setMobileSidebarOpen(false)
  }
  async function openAssignment(id: string) {
    goToURL("/tasks/" + encodeURIComponent(id))
  }
  async function requestAgent() {
    const before = appStore.getSnapshot().context
    if (before.busy || before.assistantWorking) return
    const requestedAssignment = before.assignment
    appStore.trigger.updated({
      patch: { assistantWorking: true, assistantError: "" },
    })
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workweave": "portal",
        },
        body: JSON.stringify({
          assignment: requestedAssignment,
          prompt: before.prompt,
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw Error(data.error || "Could not complete the check")
      const decoded = decode(data)
      if (!decoded.context.agentResult)
        throw Error("The assistant returned no checked answer.")
      const current = appStore.getSnapshot().context
      const routeAssignment = readRoute(
        window.location.pathname,
        window.location.search
      ).assignment
      if (
        current.assignment !== requestedAssignment ||
        (routeAssignment && routeAssignment !== requestedAssignment)
      )
        return
      const changed = current.result !== before.result || current.busy
      appStore.trigger.assistantAnswered({
        assignment: requestedAssignment,
        answer: decoded.context.agentResult,
      })
      if (changed) updateField("assistantOutdated", true)
      else setResult(data)
    } catch (error) {
      if (appStore.getSnapshot().context.assignment === requestedAssignment)
        appStore.trigger.updated({
          patch: {
            assistantError:
              error instanceof Error
                ? error.message
                : "Could not complete the check",
            assistantOutdated: true,
          },
        })
    } finally {
      updateField("assistantWorking", false)
    }
  }
  async function request(
    path: string,
    body: Record<string, unknown> = {},
    destination?: string,
    isCurrent: () => boolean = () => true
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
        },
        body: JSON.stringify({ assignment, ...body }),
      })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || "Request failed")
      if (!isCurrent()) return false
      const decoded = decode(data)
      if (navigationRef.current !== navigationVersion) destination = undefined
      const commit = () => {
        setResult(data)
        appStore.trigger.assistantContextChanged({
          assignment: decoded.context.assignment,
        })
        if (
          path === "/api/action" ||
          path === "/api/reset" ||
          path === "/api/demo/setup"
        )
          appStore.trigger.updated({
            patch: {
              impact: null,
              storyPrepared: path === "/api/demo/setup",
              proofStage: "off",
              proofBaseline: null,
              impactExpanded: [],
            },
          })
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
      if (!isCurrent()) return false
      const message = e instanceof Error ? e.message : "Request failed"
      setError(message)
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
    void fetch("/api/access")
      .then((response) =>
        response.ok ? response.json() : { aiEnabled: false }
      )
      .then((data) => updateField("aiEnabled", data.aiEnabled === true))
      .catch(() => updateField("aiEnabled", false))
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
      activeTransition.current?.skipTransition()
    }
  }, [])
  function submitSearch(value = searchQuery) {
    const query = value.trim().slice(0, 200)
    goToURL("/knowledge" + (query ? "?q=" + encodeURIComponent(query) : ""))
  }
  useEffect(() => {
    window.addEventListener("popstate", restoreRoute)
    return () => window.removeEventListener("popstate", restoreRoute)
  }, [])
  useEffect(() => {
    if (!searchNavigation || busy || !context) return
    const queued = searchNavigation
    updateField("searchNavigation", null)
    if (queued.personId) {
      appStore.trigger.requestStarted()
      void fetch("/api/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workweave": "portal",
        },
        body: JSON.stringify({ personId: queued.personId }),
      })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok)
            throw Error(data.error || "Person details are unavailable")
          return decodePerson(data)
        })
        .then((person) => {
          if (queued.revision === searchRevision.current)
            updateField("personProfile", person)
        })
        .catch((error) => {
          if (queued.revision === searchRevision.current)
            setError(
              error instanceof Error
                ? error.message
                : "Person details are unavailable"
            )
        })
        .finally(() => appStore.trigger.requestFinished())
      return
    }
    void request(
      queued.query ? "/api/search" : "/api/context",
      {
        ...(queued.query ? { query: queued.query } : {}),
        ...(queued.assignment ? { assignment: queued.assignment } : {}),
      },
      queued.view,
      () => queued.revision === searchRevision.current
    ).then((ok) => {
      if (!ok || queued.revision !== searchRevision.current) return
      const current = appStore.getSnapshot().context.result
      if (!current) return
      const data = decode(current).context
      if (queued.meetingId) {
        const item = data.meetings.find((row) => row[0] === queued.meetingId)
        if (item) updateField("meeting", item)
        else setError("This calendar item was not found in your workspace.")
      }
      if (queued.sourceId) {
        if (data.sources.some((row) => row[0] === queued.sourceId))
          setOpenSources([queued.sourceId])
        else setError("This document was not found in your workspace.")
      }
    })
  }, [searchNavigation, busy, context])
  function stop() {
    activeTransition.current?.skipTransition()
  }
  function showSource(id: string) {
    goToURL("/knowledge/" + encodeURIComponent(id))
  }
  async function analyzeImpact(
    operation = "analyze"
  ): Promise<ImpactResult | null> {
    if (appStore.getSnapshot().context.busy) return null
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
      appStore.trigger.assistantContextChanged({ assignment })
      updateField("impact", data)
      const baseline = appStore.getSnapshot().context.proofBaseline
      if (baseline && appStore.getSnapshot().context.proofStage !== "off") {
        if (operation === "remove") {
          if (removalEvidence(baseline, data.analysis).verified)
            updateField("proofStage", "removed")
          else
            setError(
              "The expected relationship change was not verified. Inspect the results before continuing."
            )
        }
        if (operation === "restore") {
          if (restorationVerified(baseline, data.analysis))
            updateField("proofStage", "restored")
          else
            setError(
              "The original affected set was not fully restored. Inspect the results before continuing."
            )
        }
      }
      return data
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Impact analysis failed"
      )
      return null
    } finally {
      appStore.trigger.requestFinished()
    }
  }
  const startEmployeeTour = useOnboardingTour({
    onBeforeStart: stop,
    navigateHome: () => navigate("workspace"),
  })
  async function startImpactProof() {
    const navigationVersion = navigationRef.current
    appStore.trigger.updated({
      patch: {
        employeeGuide: 0,
        proofStage: "off",
        proofBaseline: null,
        impactExpanded: [],
      },
    })
    let data = await analyzeImpact("import")
    if (!data?.analysis.ready || data.analysis.blocked) {
      if (data) navigate("proof")
      return
    }
    if (!data.analysis.experimentLink?.connected)
      data = await analyzeImpact("restore")
    if (
      !data?.analysis.ready ||
      data.analysis.blocked ||
      navigationRef.current !== navigationVersion
    )
      return
    const alternate = data.analysis.items?.find((item) => item.routeCount > 1)
    if (!alternate) {
      setError(
        "This sample no longer has an alternate route. Review its dependency links."
      )
      return
    }
    appStore.trigger.updated({
      patch: {
        proofStage: "inspect",
        proofBaseline: data.analysis,
        impactExpanded: [alternate.id],
      },
    })
    navigate("proof")
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  const proofEvidence =
    proofBaseline && impact
      ? removalEvidence(proofBaseline, impact.analysis)
      : null
  const proofTarget = proofBaseline?.items?.find((item) => item.routeCount > 1)
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
  async function reset() {
    stop()
    await request("/api/reset", { assignment: workspace?.demo.assignment })
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
    ["workspace", "Home", RiHome5Line],
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
        document: "Knowledge document",
        person: personProfile?.name || "Person",
        proof: "Demo controls",
        evidence: "Evidence & tools",
      } as Record<string, string>
    )[tab]
  return (
    <div className="flex min-h-svh w-full">
      {busy && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading workspace"
          className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-background/45 backdrop-blur-[2px]"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl border bg-background shadow-lg">
            <Spinner
              role="presentation"
              aria-hidden="true"
              className="size-7 text-primary"
            />
          </div>
          <span className="sr-only">Loading workspace</span>
        </div>
      )}
      <aside
        data-tour="sidebar"
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
          <Button
            variant="ghost"
            aria-label="Go to Home"
            title="Home"
            onClick={() => navigate("workspace")}
            className="h-auto justify-start gap-2.5 p-0 hover:bg-transparent"
          >
            <RiBuildingLine className="size-6 shrink-0 text-primary" />
            {sidebarOpen && (
              <span className="font-heading text-xl font-semibold tracking-tight">
                {workspace?.appName}
              </span>
            )}
          </Button>
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
        <nav
          data-tour="left-nav"
          className="flex-1 space-y-1 overflow-y-auto px-2"
        >
          {navItems
            .filter(([id]) => !judgeMode || id === "workspace")
            .map(([id, label, Icon]) => (
              <Button
                key={id}
                variant="ghost"
                data-tour={"nav-" + id}
                aria-label={label}
                title={sidebarOpen ? undefined : label}
                aria-current={
                  tab === id ||
                  (id === "sources" && tab === "document") ||
                  (id === "people" && tab === "person") ||
                  (id === "home" && tab === "assignment")
                    ? "page"
                    : undefined
                }
                onClick={() => navigate(id)}
                className={
                  "h-11 w-full justify-start gap-3 rounded-lg px-3 " +
                  (tab === id ||
                  (id === "sources" && tab === "document") ||
                  (id === "people" && tab === "person") ||
                  (id === "home" && tab === "assignment")
                    ? "bg-primary/10 text-primary"
                    : "")
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
                ["proof", "Demo controls"],
                ["evidence", "Evidence & tools"],
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
              <div
                className={
                  assistantVisible
                    ? "grid min-w-0 flex-1 content-start items-start lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]"
                    : "min-w-0 flex-1"
                }
              >
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
              data-tour="theme"
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
            {navItems
              .filter(([id]) => !judgeMode || id === "workspace")
              .map(([id, label, Icon]) => (
                <Button
                  key={id}
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  data-destination={id}
                  onClick={navigateMobile}
                >
                  <Icon />
                  {label}
                </Button>
              ))}
            {judgeMode &&
              [
                ["proof", "Demo controls"],
                ["evidence", "Evidence & tools"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant="ghost"
                  className="w-full justify-start"
                  data-destination={id}
                  onClick={navigateMobile}
                >
                  {label}
                </Button>
              ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <header className="col-span-full row-start-1 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-5 py-3 lg:px-10">
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
              data-tour="navigation-menu"
              aria-label="Open navigation"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <RiMenuLine />
            </Button>
            <Button
              variant="link"
              className="h-auto gap-1.5 p-0 text-sm text-muted-foreground"
              onClick={() => navigate("workspace")}
              aria-label="Go to Home"
            >
              <RiHome5Line className="size-4" />
              Home
            </Button>
            {tab !== "workspace" && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium">{pageTitle}</span>
              </>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <form
              data-tour="search"
              className="flex w-full items-center gap-2 sm:w-72"
              onSubmit={(e) => {
                e.preventDefault()
                stop()
                submitSearch()
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
            {!judgeMode && (
              <Button
                data-tour="start-tour"
                variant="outline"
                size="sm"
                disabled={busy || !context}
                onClick={startEmployeeTour}
              >
                Start tour
                <RiCompass3Line />
              </Button>
            )}
          </div>
        </header>
        <main
          aria-busy={busy}
          className={
            "row-start-3 mx-auto flex w-full min-w-0 flex-col gap-7 px-5 py-8 [view-transition-name:work-area] md:px-9 lg:col-start-1 lg:row-start-2 lg:px-12 lg:py-10 " +
            (tab === "assignment" ? "max-w-3xl" : "max-w-7xl")
          }
        >
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Operation could not finish</AlertTitle>
              <AlertDescription>
                {error} Previous results can be out of date.
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={restoreRoute}
                >
                  Reload page data
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Tabs value={tab} onValueChange={(v) => navigate(String(v))}>
            <TabsList className="hidden">
              <TabsTrigger value="workspace">Home</TabsTrigger>
              <TabsTrigger value="impact">Cross-team impact</TabsTrigger>
              <TabsTrigger value="changes">Decision review</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="proof">Demo controls</TabsTrigger>
              <TabsTrigger value="home">Tasks</TabsTrigger>
              <TabsTrigger value="assignment">My task</TabsTrigger>
              <TabsTrigger value="sources">Documents</TabsTrigger>
              <TabsTrigger value="document">Knowledge document</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="person">Person</TabsTrigger>
              <TabsTrigger value="evidence">Evidence & tools</TabsTrigger>
            </TabsList>
            <TabsContent value="workspace" className="space-y-9">
              <section className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {workspace?.company.name}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium">My day</h2>
                <p className="text-xs text-muted-foreground">
                  Team: {workspace?.team.name} · {workspace?.team.department}
                </p>
              </div>
              {!context ? (
                <Skeleton className="h-72" />
              ) : (
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                  <div className="space-y-9">
                    <section data-tour="home-up-next" className="space-y-4">
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
                    <section data-tour="home-tasks" className="space-y-3">
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
                    <section data-tour="home-schedule" className="space-y-4">
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
                    <section data-tour="home-notes" className="space-y-3">
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
                            <Button
                              variant="link"
                              className="h-auto p-0 text-sm font-medium"
                              onClick={() =>
                                goToURL("/people/" + encodeURIComponent(row[0]))
                              }
                            >
                              {row[1]}
                            </Button>
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
                {(!judgeMode || proofStage === "off") && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void analyzeImpact(
                          impact?.analysis.ready ? "analyze" : "import"
                        )
                      }
                    >
                      {busy ? "Analyzing…" : "Find affected work"}
                    </Button>
                  </div>
                )}
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
                  {judgeMode && impact.analysis.experiment && (
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
                              <Accordion
                                value={
                                  impactExpanded.includes(item.id)
                                    ? ["why"]
                                    : []
                                }
                                onValueChange={(value) =>
                                  updateField("impactExpanded", (previous) =>
                                    value.length
                                      ? [...new Set([...previous, item.id])]
                                      : previous.filter((id) => id !== item.id)
                                  )
                                }
                              >
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
                    {judgeMode && (
                      <AccordionItem value="experiment">
                        <AccordionTrigger>
                          Test one dependency link
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-xs leading-6 text-muted-foreground">
                            Remove the sample dependency below. Tasks with
                            another route should stay affected. Source documents
                            stay intact. Restore the link to recover the
                            original result.
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
                                busy ||
                                !impact.analysis.experimentLink?.connected
                              }
                              onClick={() => void analyzeImpact("remove")}
                            >
                              Remove sample dependency
                            </Button>
                            <Button
                              variant="outline"
                              disabled={
                                busy ||
                                impact.analysis.experimentLink?.connected
                              }
                              onClick={() => void analyzeImpact("restore")}
                            >
                              Restore dependency
                            </Button>
                          </div>
                          {judgeMode && impact.analysis.experiment && (
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
                    )}
                    {judgeMode && (
                      <AccordionItem value="queries">
                        <AccordionTrigger>
                          How the analysis was computed
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-xs leading-6 text-muted-foreground">
                            Bounded Cypher finds the affected set and
                            alternative simple paths. FalkorDB’s native
                            shortest-path procedure explains indirect
                            dependencies. Direct links need no pathfinding. This
                            analysis uses no model calls.
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
                    )}
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
                    Your notes are saved to this workspace.
                  </p>
                </section>
              </div>
            </TabsContent>
            {judgeMode && (
              <TabsContent value="proof" className="space-y-8">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>{workspace?.demo.scenario.title}</CardTitle>
                    <CardDescription>
                      {workspace?.demo.scenario.employee} has a saved plan.{" "}
                      {workspace?.demo.scenario.approver} approves the change.{" "}
                      {workspace?.demo.scenario.reviewer} reviews her work.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Setup resets only this visitor workspace, records the
                      sample reading and training, saves Maya’s original plan
                      and imports the source records. Use before recording, not
                      during the employee workflow.
                    </p>
                    <Button
                      disabled={busy}
                      onClick={() => void request("/api/demo/setup", {})}
                    >
                      Reset and prepare story
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void openAssignment(workspace?.demo.assignment || "")
                      }
                    >
                      Open Maya’s task
                    </Button>
                    {storyPrepared && (
                      <p role="status" className="text-sm text-primary">
                        Story ready. Refresh the employee tab before recording.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <section className="max-w-3xl space-y-5">
                  <Badge variant="secondary">
                    {workspace?.appName} · Company Brain
                  </Badge>
                  <h1 className="font-heading text-3xl font-semibold tracking-tight lg:text-4xl">
                    Demo controls
                  </h1>
                  <p className="text-base leading-7 text-muted-foreground">
                    Trigger a synthetic change, then inspect its effect in the
                    employee workspace.
                  </p>
                  <Button
                    size="lg"
                    disabled={busy || !context}
                    onClick={() => void startImpactProof()}
                  >
                    {busy ? "Preparing the sample…" : "Start dependency demo"}
                    <RiArrowRightLine />
                  </Button>
                  <p className="text-xs leading-6 text-muted-foreground">
                    An isolated synthetic workspace. Real FalkorDB queries. No
                    login or AI credits needed for this flow. The sample
                    dependency is restored before starting; saved notes are
                    retained.
                  </p>
                </section>
                {proofStage !== "off" &&
                  proofBaseline &&
                  impact?.analysis.ready && (
                    <Card className="border-primary/20 bg-primary/5 shadow-none">
                      <CardHeader>
                        <p className="text-xs font-medium text-primary">
                          {proofStage === "inspect"
                            ? "STEP 1 OF 3"
                            : proofStage === "removed"
                              ? "STEP 2 OF 3"
                              : "STEP 3 OF 3"}
                        </p>
                        <CardTitle>
                          {proofStage === "inspect"
                            ? "Follow two routes to the same decision"
                            : proofStage === "removed"
                              ? "One task left. Another route remained."
                              : "The original result is restored"}
                        </CardTitle>
                        <CardDescription className="leading-6">
                          {proofStage === "inspect"
                            ? `${proofTarget?.title} reaches ${proofBaseline.root} through more than one recorded route.`
                            : proofStage === "removed"
                              ? `No longer reached: ${proofEvidence?.removed.join(", ")}. Still reached through another route: ${proofEvidence?.alternate.join(", ")}.`
                              : "The affected task IDs and route counts match the starting state. Source content hashes stayed equal."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {proofStage === "inspect" ? (
                          <>
                            {proofTarget?.paths.map((path, index) => (
                              <p key={index} className="text-sm leading-6">
                                {path.join(" → ")}
                              </p>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Next, remove {proofBaseline.experimentLink?.from}{" "}
                              → {proofBaseline.experimentLink?.to}.
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">
                            {impact.analysis.experiment?.documentsUnchanged
                              ? "Verified: source text is unchanged."
                              : "Source content changed; inspect the result."}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                        {proofStage === "inspect" ? (
                          <Button
                            disabled={busy}
                            onClick={() => void analyzeImpact("remove")}
                          >
                            Remove the test link
                            <RiArrowRightLine />
                          </Button>
                        ) : proofStage === "removed" ? (
                          <Button
                            disabled={busy}
                            onClick={() => void analyzeImpact("restore")}
                          >
                            Restore the link
                            <RiArrowRightLine />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void startImpactProof()}
                          >
                            Try again
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            updateField("proofStage", "off")
                            updateField("proofBaseline", null)
                            if (proofStage === "restored") navigate("workspace")
                          }}
                        >
                          {proofStage === "restored"
                            ? "Explore the workspace"
                            : "Leave the guide"}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                {impact?.analysis.ready && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {impact.analysis.items?.length} affected tasks. Open
                    Cross-team impact in the employee tab to inspect owners and
                    source paths.
                  </p>
                )}
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Decision change</CardTitle>
                    <CardDescription>
                      Save task review notes first. These controls change only
                      this synthetic workspace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={
                        busy || assignment !== workspace?.demo.assignment
                      }
                      onClick={() =>
                        void request("/api/action", {
                          name: "replace",
                          assignment: workspace?.demo.assignment,
                        })
                      }
                    >
                      Approve sample replacement
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        busy || assignment !== workspace?.demo.assignment
                      }
                      onClick={() =>
                        void request("/api/action", {
                          name: "propose",
                          assignment: workspace?.demo.assignment,
                        })
                      }
                    >
                      Add newer proposal
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("changes")}>
                      Open decision review
                    </Button>
                  </CardContent>
                </Card>
                <Accordion>
                  <AccordionItem value="reset">
                    <AccordionTrigger>Reset demo data</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Reset only this browser workspace. This removes its
                        saved notes, plans, reading and training progress,
                        review requests, imported sample records and sample
                        decision changes. Other visitors and the AI usage budget
                        are unchanged.
                      </p>
                      <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void reset()}
                      >
                        Reset this demo workspace
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        After reset, select Start dependency demo to reload the
                        source records and restore the test link.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion>
                  <AccordionItem value="reference">
                    <AccordionTrigger>
                      Technical reference and validation
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-5 md:grid-cols-3">
                        {[
                          [
                            "Follow the routes",
                            "See why work across teams depends on the same decision.",
                          ],
                          [
                            "Change one link",
                            "Watch one task leave the affected set while another stays connected.",
                          ],
                          [
                            "Check the evidence",
                            "Confirm source text is unchanged, then restore the original result.",
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
                            document kept the same ID, title, and body. The
                            correct guidance or reviewer still changed.
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
                                <p>
                                  {evaluation.relationshipDiagnostic.method}
                                </p>
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
                              {
                                evaluation.results.filter((r) => r.passed)
                                  .length
                              }{" "}
                              / {evaluation.results.length} graph checks passed
                            </Badge>
                          )}
                        </div>
                        {evaluationError && (
                          <Alert variant="destructive">
                            <AlertTitle>
                              Evaluation report unavailable
                            </AlertTitle>
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
                              {evaluation.dataset} Results below are a saved
                              local run, not a live benchmark.
                            </p>
                            {evaluation.modelDiagnostic && (
                              <Alert>
                                <AlertTitle>
                                  Graph context alone did not make the model
                                  safe
                                </AlertTitle>
                                <AlertDescription className="space-y-2">
                                  <p>
                                    Paired {evaluation.modelDiagnostic.model}{" "}
                                    check: document-only guidance{" "}
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
                                    evidence. Some correct answers also used
                                    invalid citation IDs.
                                  </p>
                                  <p>
                                    The workspace does not let generated factual
                                    answers control review requests. The tested
                                    graph gates decide whether an action is
                                    allowed.
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
                                    <TableCell>
                                      {r.expected || "Abstain"}
                                    </TableCell>
                                    <TableCell>
                                      {r.graph || "Abstained"}
                                    </TableCell>
                                    <TableCell className="max-w-52 whitespace-normal">
                                      <p>
                                        {r.lexical || "No extracted answer"}
                                      </p>
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
                          FalkorDB resolves approval and replacement
                          relationships, stores assignment-specific progress,
                          and runs a native shortest-path query. The optional
                          OpenAI tool call reads that context and selects an
                          allowlisted A2UI layout. Graph data supplies the
                          facts.
                        </p>
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                          The data is synthetic. There is no production login,
                          HR integration, calendar booking, or automatic
                          document ingestion. The public app uses Render and
                          FalkorDB Cloud.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => navigate("evidence")}
                        >
                          Inspect the actual queries
                        </Button>
                      </section>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        goToURL(
                          "/tasks/" +
                            encodeURIComponent(assignment) +
                            "/people",
                          true
                        )
                      }
                    >
                      People on this task
                    </Button>
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
                  submitSearch()
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
                    type="button"
                    onClick={() => submitSearch("")}
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
              {context?.searchResults?.length === 0 && (
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>No matching documents</CardTitle>
                    <CardDescription>
                      Try a different term or clear the search to browse company
                      knowledge.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => submitSearch("")}>
                      Browse all documents
                    </Button>
                  </CardContent>
                </Card>
              )}
              <div className="divide-y rounded-xl border">
                {(context?.searchResults || context?.sources)?.map((r) => (
                  <Button
                    key={r[0]}
                    variant="ghost"
                    className="h-auto w-full justify-between gap-4 rounded-none px-5 py-4 text-left whitespace-normal"
                    onClick={() => showSource(r[0])}
                  >
                    <span className="flex items-center gap-3">
                      <RiFileTextLine className="size-4 shrink-0 text-muted-foreground" />
                      <span>{r[1]}</span>
                    </span>
                    <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                ))}
              </div>
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
            <TabsContent
              value="document"
              className="mx-auto max-w-3xl space-y-8"
            >
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.history.state?.from?.startsWith("/knowledge"))
                    window.history.back()
                  else navigate("sources")
                }}
              >
                ← Back to knowledge
              </Button>
              {(() => {
                const document = context?.sources.find(
                  (row) => row[0] === openSources[0]
                )
                if (!document)
                  return busy ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <Alert>
                      <AlertTitle>Document unavailable</AlertTitle>
                      <AlertDescription>
                        Open Knowledge to select a document from this workspace.
                      </AlertDescription>
                    </Alert>
                  )
                return (
                  <>
                    <section className="space-y-3">
                      <p className="text-sm text-muted-foreground">Knowledge</p>
                      <h1 className="font-heading text-3xl font-semibold tracking-tight">
                        {document[1]}
                      </h1>
                    </section>
                    <Separator />
                    <article className="text-base leading-8 whitespace-pre-wrap">
                      {document[2]}
                    </article>
                    {context?.decisions.some((d) => d[2] === document[0]) && (
                      <Card className="shadow-none">
                        <CardHeader>
                          <CardTitle>Current assignment guidance</CardTitle>
                          <CardDescription>
                            This source supports the guidance for your selected
                            assignment.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                      </Card>
                    )}
                  </>
                )
              })()}
            </TabsContent>
            <TabsContent value="people" className="space-y-6">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                People
              </h1>
              <p className="text-sm text-muted-foreground">People directory.</p>
              <Card className="shadow-none">
                <CardContent className="divide-y px-5">
                  {(context?.directory || []).map((row) => (
                    <div key={row[0]} className="flex items-start gap-3 py-5">
                      <Avatar>
                        <AvatarFallback>{initials(row[1])}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm font-medium"
                          onClick={() =>
                            goToURL("/people/" + encodeURIComponent(row[0]))
                          }
                        >
                          {row[1]}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          {row[2]}
                        </p>
                      </div>
                    </div>
                  ))}
                  {context && !context.directory?.length && (
                    <p className="py-5 text-sm text-muted-foreground">
                      No people are available in this workspace.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="person" className="mx-auto max-w-4xl space-y-8">
              <Button variant="ghost" onClick={() => navigate("people")}>
                ← People directory
              </Button>
              {!personProfile ? (
                busy ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Person details are unavailable.
                  </p>
                )
              ) : (
                <>
                  <section className="flex items-center gap-4">
                    <Avatar className="size-14">
                      <AvatarFallback>
                        {initials(personProfile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="font-heading text-3xl font-semibold tracking-tight">
                        {personProfile.name}
                      </h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {personProfile.description}
                      </p>
                    </div>
                  </section>
                  <div className="space-y-7">
                    {Array.from(
                      new Set(personProfile.items.map((item) => item.kind))
                    ).map((kind) => (
                      <section key={kind} className="space-y-3">
                        <h2 className="text-sm font-medium">{kind}</h2>
                        <Card className="shadow-none">
                          <CardContent className="divide-y px-5">
                            {personProfile.items
                              .filter((item) => item.kind === kind)
                              .map((item) => (
                                <div
                                  key={item.id + item.relation}
                                  className="space-y-1 py-4"
                                >
                                  {item.url ? (
                                    <Button
                                      variant="link"
                                      className="h-auto max-w-full justify-start p-0 text-left whitespace-normal"
                                      onClick={() => goToURL(item.url!)}
                                    >
                                      {item.title}
                                      <RiArrowRightSLine className="size-4 shrink-0" />
                                    </Button>
                                  ) : (
                                    <p className="text-sm font-medium">
                                      {item.title}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {item.relation}
                                  </p>
                                  {item.description && (
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </CardContent>
                        </Card>
                      </section>
                    ))}
                    {!personProfile.items.length && (
                      <p className="text-sm text-muted-foreground">
                        No linked records are available.
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
            {judgeMode && (
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
                  {[...(result?.trace || []), ...(impact?.trace || [])].map(
                    (r, i) => (
                      <TraceCollapsible key={i}>
                        <TraceCollapsibleTrigger>
                          <TraceLine>
                            <TraceTitle>{r.tool}</TraceTitle>
                            <TraceDescription>
                              {r.executionPlan
                                ? "Query plan"
                                : `${r.rows} rows`}{" "}
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
                    )
                  )}
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
            )}
          </Tabs>
        </main>

        {assistantVisible && context && (
          <aside
            id="work-assistant"
            aria-labelledby="assistant-title"
            className="row-start-2 min-w-0 lg:sticky lg:top-16 lg:col-start-2"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation()
                closeAssistant()
              }
            }}
          >
            <Card className="max-h-[55dvh] gap-0 rounded-none border-0 border-b py-0 shadow-none lg:h-[calc(100dvh-4rem)] lg:max-h-none lg:border-b-0 lg:border-l">
              <CardHeader className="flex flex-row items-start justify-between gap-3 border-b p-5">
                <div className="space-y-1.5">
                  <CardTitle id="assistant-title">Ask Workweave</CardTitle>
                  <CardDescription>
                    Help with {context.task[0]?.[1] || "your selected task"}.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close assistant"
                  onClick={closeAssistant}
                >
                  <RiCloseLine aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent className="min-h-0 space-y-5 overflow-y-auto p-5 lg:flex-1">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    stop()
                    void requestAgent()
                  }}
                >
                  <Label htmlFor="prompt">What do you need to know?</Label>
                  <Textarea
                    id="prompt"
                    rows={3}
                    className="min-h-24 resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={1000}
                    placeholder="What changed for my work, who else is affected, and whom should I ask?"
                  />
                  <Button type="submit" disabled={busy || assistantWorking}>
                    {assistantWorking ? "Checking work…" : "Check my work"}
                  </Button>
                </form>
                {assistantWorking && (
                  <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Spinner />
                    Checking linked records…
                  </p>
                )}
                {assistantAnswer && (
                  <div role="status" aria-live="polite" className="space-y-4">
                    <Separator />
                    {assistantOutdated && (
                      <Alert>
                        <AlertTitle>Previous check</AlertTitle>
                        <AlertDescription>
                          The workspace was refreshed or changed. Run a new
                          check for current evidence.
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm font-medium">Your work update</p>
                    <div className="space-y-3">
                      {assistantAnswer.facts.map((fact) => (
                        <div key={fact.id} className="space-y-1 text-sm">
                          <p>{fact.text}</p>
                          {fact.sourceIds.map((id) => (
                            <Button
                              key={id}
                              variant="link"
                              size="sm"
                              className="h-auto px-0"
                              onClick={() => showSource(id)}
                            >
                              Read source ·{" "}
                              {context?.sources.find(
                                (source) => source[0] === id
                              )?.[1] || id}
                            </Button>
                          ))}
                        </div>
                      ))}
                    </div>
                    {assistantAnswer.nextSteps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Suggested next steps
                        </p>
                        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                          {assistantAnswer.nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Suggestions only. You choose when to update your saved
                      work.
                    </p>
                  </div>
                )}
                {assistantError && (
                  <Alert variant="destructive" role="alert">
                    <AlertTitle>Could not complete the check</AlertTitle>
                    <AlertDescription>
                      {assistantError ||
                        "Try again later. Your saved work has not changed."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </aside>
        )}
        {assistantAvailable && !assistantOpen && (
          <Button
            id="work-assistant-trigger"
            size="lg"
            aria-controls="work-assistant"
            aria-expanded={false}
            onClick={() =>
              appStore.trigger.updated({
                patch: { assistantOpen: true, assistantAssignment: assignment },
              })
            }
            className="fixed right-5 bottom-5 z-40 h-12 rounded-full px-5 shadow-lg"
          >
            <RiChat3Line aria-hidden="true" />
            Ask Workweave
          </Button>
        )}

        <Sheet
          open={!!peopleTask}
          onOpenChange={(open) => {
            if (open || !peopleTask) return
            if (window.history.state?.recordPanel) window.history.back()
            else void openAssignment(peopleTask)
          }}
        >
          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
            <SheetHeader className="pr-12">
              <SheetTitle>People on this task</SheetTitle>
              <SheetDescription>
                {context?.assignments.find(
                  (row) => row[0] === peopleTask
                )?.[1] || "Loading task contacts…"}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-6 pb-6">
              {busy ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  {(context?.projectContacts || [])
                    .filter((row) => row[4] === peopleTask)
                    .map((row) => (
                      <div
                        key={row[0] + row[3]}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <Avatar>
                          <AvatarFallback>{initials(row[1])}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm font-medium"
                            onClick={() =>
                              goToURL("/people/" + encodeURIComponent(row[0]))
                            }
                          >
                            {row[1]}
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            {row[2]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row[3] === "REVIEWER_FOR"
                              ? "Reviews this task’s service"
                              : row[3] === "BACKUP_REVIEWER_FOR"
                                ? "Alternate reviewer for this task’s service"
                                : "Assigned to this task"}
                          </p>
                        </div>
                      </div>
                    ))}
                  {!context?.projectContacts?.some(
                    (row) => row[4] === peopleTask
                  ) && (
                    <p className="text-sm text-muted-foreground">
                      No contacts are recorded for this task.
                    </p>
                  )}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
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
