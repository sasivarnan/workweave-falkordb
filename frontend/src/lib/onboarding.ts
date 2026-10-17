import { driver, type PopoverDOM } from "driver.js"
import "driver.js/dist/driver.css"
import { workspaceTour } from "./tour"

function applyTheme(popover: PopoverDOM) {
  // Tailwind utilities override the library theme, without custom CSS selectors.
  popover.wrapper.className +=
    " !rounded-xl !bg-popover !p-5 !text-popover-foreground !shadow-xl !border !border-border !max-w-sm !font-sans"
  popover.title.className +=
    " !font-heading !text-base !font-semibold !text-foreground"
  popover.description.className += " !text-sm !leading-6 !text-muted-foreground"
  popover.progress.className += " !text-xs !text-muted-foreground"
  popover.nextButton.className +=
    " !rounded-lg !bg-primary !text-primary-foreground !border-0 !px-3 !py-2 !text-sm !font-medium !shadow-none ![text-shadow:none]"
  popover.previousButton.className +=
    " !rounded-lg !bg-secondary !text-secondary-foreground !border-0 !px-3 !py-2 !text-sm !shadow-none ![text-shadow:none]"
  popover.arrow.className +=
    " [&.driver-popover-arrow-side-left]:!border-l-popover [&.driver-popover-arrow-side-right]:!border-r-popover [&.driver-popover-arrow-side-top]:!border-t-popover [&.driver-popover-arrow-side-bottom]:!border-b-popover"
  popover.closeButton.className += " !text-muted-foreground"
  popover.closeButton.setAttribute("aria-label", "Skip tour")
}

export function startWorkspaceTour(
  onStep: (step: number) => void,
  onEnd: () => void
) {
  const visible = (element: Element | null): element is HTMLElement =>
    element instanceof HTMLElement && element.getClientRects().length > 0
  const menu = document.querySelector('[data-tour="navigation-menu"]')
  const steps = workspaceTour.flatMap((step) => {
    let element = document.querySelector(`[data-tour="${step.target}"]`)
    let description: string = step.description
    if (
      !visible(element) &&
      (step.target === "left-nav" || step.target.startsWith("nav-"))
    ) {
      element = menu
      description = "Use this menu to open workspace navigation. " + description
    }
    if (!visible(element)) return []
    return [
      {
        element,
        popover: {
          title: step.title,
          description,
          side:
            step.target.startsWith("nav-") || step.target === "left-nav"
              ? ("right" as const)
              : ("bottom" as const),
        },
      },
    ]
  })
  if (!steps.length) {
    onEnd()
    return null
  }
  const tour = driver({
    steps,
    animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Finish tour",
    allowClose: true,
    disableActiveInteraction: true,
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 12,
    onPopoverRender: applyTheme,
    onHighlighted: (_element, _step, { index }) => onStep((index ?? 0) + 1),
    onDestroyed: onEnd,
  })
  tour.drive()
  return tour
}
